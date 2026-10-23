import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Server-authoritative, idempotent test submission.
 *
 * The client sends only question IDs and the student's selected answers plus a
 * per-test submission token. The server:
 *   1. authenticates the caller,
 *   2. returns the stored result when the token was already submitted
 *      (idempotent retry — no duplicate attempts, no double XP),
 *   3. loads the exam's marking scheme from exam_configs (never from the
 *      client),
 *   4. grades every answer through the authenticated grade_answers RPC,
 *   5. computes the score itself, clamps it to the configured maximum, and
 *   6. persists the attempt with the verified answer snapshot.
 *
 * Client-supplied correct/wrong counts are not accepted anywhere in this path.
 */

const Answer = z.object({
  question_id: z.string().uuid(),
  /** MCQ: option index; numerical: the entered value; null/"" = unattempted. */
  answer: z.union([z.string().max(200), z.number(), z.null()]),
});

const Body = z.object({
  submission_token: z.string().uuid(),
  exam_key: z.string().min(1).max(60),
  total_questions: z.number().int().min(1).max(500),
  duration_seconds: z.number().int().min(0).max(60 * 60 * 12),
  answers: z.array(Answer).min(1).max(500),
});

type GradeRow = {
  question_id: string;
  is_correct: boolean;
  correct_answer: unknown;
  solution: string | null;
  explanation: string | null;
};

const BADGES: { key: string; name: string; description: string; check: (s: { tests: number; xp: number; streak: number; perfect: boolean }) => boolean }[] = [
  { key: "first_test", name: "First Step", description: "Completed your first mock test", check: (s) => s.tests >= 1 },
  { key: "five_tests", name: "Test Warrior", description: "Completed 5 mock tests", check: (s) => s.tests >= 5 },
  { key: "ten_tests", name: "Exam Veteran", description: "Completed 10 mock tests", check: (s) => s.tests >= 10 },
  { key: "xp_100", name: "Century XP", description: "Earned 100 XP", check: (s) => s.xp >= 100 },
  { key: "xp_500", name: "Rising Scholar", description: "Earned 500 XP", check: (s) => s.xp >= 500 },
  { key: "xp_1000", name: "Knowledge Master", description: "Earned 1000 XP", check: (s) => s.xp >= 1000 },
  { key: "streak_3", name: "On Fire", description: "3-day study streak", check: (s) => s.streak >= 3 },
  { key: "streak_7", name: "Week Warrior", description: "7-day study streak", check: (s) => s.streak >= 7 },
  { key: "streak_30", name: "Iron Will", description: "30-day study streak", check: (s) => s.streak >= 30 },
  { key: "perfect_score", name: "Flawless", description: "Perfect score on a mock test", check: (s) => s.perfect },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Route = createFileRoute("/api/submit-attempt")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return Response.json({ error: "Service not configured" }, { status: 500 });
        }
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
        if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

        // Caller-scoped client: grade_answers enforces auth.uid().
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
        if (authErr || !claims?.claims?.sub) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const userId = claims.claims.sub as string;

        let raw: unknown;
        try { raw = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Body.safeParse(raw);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
        }
        const body = parsed.data;
        if (new Set(body.answers.map((a) => a.question_id)).size !== body.answers.length) {
          return Response.json({ error: "Duplicate question IDs" }, { status: 400 });
        }

        // Privileged client for writes — test_attempts/user_stats/achievements
        // block client inserts by policy. Loaded only after the caller verified.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // ---- Idempotency: a retry with the same token returns the stored result.
        const { data: existing } = await supabaseAdmin
          .from("test_attempts")
          .select("score, max_score, correct, wrong, attempted, total_questions")
          .eq("user_id", userId)
          .eq("submission_token", body.submission_token)
          .maybeSingle();
        if (existing) {
          return Response.json({ ...existing, duplicate: true, earnedXp: 0, newBadges: [] });
        }

        // ---- Exam marking scheme from the database, never from the client.
        const { data: configs, error: cfgErr } = await supabase
          .from("exam_configs")
          .select("exam_name, total_questions, marks_per_correct, negative_marks")
          .eq("exam_key", body.exam_key)
          .eq("active", true)
          .order("exam_year", { ascending: false })
          .limit(1);
        if (cfgErr || !configs || configs.length === 0) {
          return Response.json({ error: "This exam is not configured; the attempt was not saved." }, { status: 400 });
        }
        const config = configs[0];
        if (body.total_questions > config.total_questions) {
          return Response.json({ error: "total_questions exceeds the configured paper size" }, { status: 400 });
        }
        if (body.answers.length !== body.total_questions) {
          return Response.json({ error: "Answer count does not match the paper" }, { status: 400 });
        }

        // ---- Server-side grading with the caller's identity.
        const q_ids = body.answers.map((a) => a.question_id);
        const user_answers = body.answers.map((a) => {
          if (a.answer === null || a.answer === "") return null;
          return { value: String(a.answer) };
        });
        const { data: gradeRows, error: gradeErr } = await supabase.rpc("grade_answers", {
          q_ids,
          user_answers,
        } as never);
        if (gradeErr) {
          console.error("[submit-attempt] grading failed", { code: gradeErr.code });
          return Response.json({ error: "Your answers could not be graded. Retry submission; nothing has been saved." }, { status: 502 });
        }
        const grades = (gradeRows ?? []) as GradeRow[];
        const gradeMap = new Map(grades.map((g) => [g.question_id, g]));

        // ---- Authoritative scoring from the exam configuration.
        const positive = Number(config.marks_per_correct);
        const negative = Number(config.negative_marks);
        let correct = 0;
        let wrong = 0;
        let attempted = 0;
        const bySubject = new Map<string, { correct: number; total: number }>();
        for (const a of body.answers) {
          const isAttempted = a.answer !== null && a.answer !== "";
          if (!isAttempted) continue;
          attempted++;
          const grade = gradeMap.get(a.question_id);
          // Ungradeable attempted answers score zero — never assumed wrong.
          if (grade?.is_correct === true) correct++;
          else if (grade?.is_correct === false) wrong++;
        }
        const score = Math.min(
          body.total_questions * positive,
          correct * positive - wrong * negative,
        );
        const maxScore = body.total_questions * positive;

        // Subject breakdown from the graded rows is not available without the
        // question subjects; store an empty breakdown rather than trusting the
        // client's version.
        const { error: insErr } = await supabaseAdmin.from("test_attempts").insert({
          user_id: userId,
          exam_key: body.exam_key,
          exam_name: config.exam_name,
          total_questions: body.total_questions,
          attempted,
          correct,
          wrong,
          score,
          max_score: maxScore,
          duration_seconds: body.duration_seconds,
          subject_breakdown: [...bySubject.entries()].map(([subject, s]) => ({ subject, ...s })),
          submission_token: body.submission_token,
          answers: body.answers,
        } as never);
        if (insErr) {
          // Unique-token race: another request inserted first — return that result.
          if (insErr.code === "23505") {
            const { data: raced } = await supabaseAdmin
              .from("test_attempts")
              .select("score, max_score, correct, wrong, attempted, total_questions")
              .eq("user_id", userId)
              .eq("submission_token", body.submission_token)
              .maybeSingle();
            if (raced) return Response.json({ ...raced, duplicate: true, earnedXp: 0, newBadges: [] });
          }
          console.error("[submit-attempt] insert error", { code: insErr.code });
          return Response.json({ error: "Failed to record attempt" }, { status: 500 });
        }

        // ---- XP / streaks / badges from the server-computed result.
        const earnedXp = Math.min(500, Math.max(5, 10 + correct * 5 - wrong * 2));
        const { data: existingStats } = await supabaseAdmin
          .from("user_stats").select("*").eq("user_id", userId).maybeSingle();
        const today = todayStr();
        let newStreak = 1;
        let longest = 1;
        if (existingStats) {
          if (existingStats.last_active_date === today) {
            newStreak = existingStats.current_streak;
          } else {
            const y = new Date(); y.setDate(y.getDate() - 1);
            const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
            newStreak = existingStats.last_active_date === yStr ? existingStats.current_streak + 1 : 1;
          }
          longest = Math.max(existingStats.longest_streak, newStreak);
        }
        const newXp = (existingStats?.xp ?? 0) + earnedXp;
        const newTests = (existingStats?.tests_taken ?? 0) + 1;
        if (existingStats) {
          await supabaseAdmin.from("user_stats").update({
            xp: newXp, current_streak: newStreak, longest_streak: longest,
            tests_taken: newTests, last_active_date: today,
          }).eq("user_id", userId);
        } else {
          await supabaseAdmin.from("user_stats").insert({
            user_id: userId, xp: newXp, current_streak: newStreak,
            longest_streak: longest, tests_taken: newTests, last_active_date: today,
          });
        }

        const perfect = attempted === body.total_questions && wrong === 0 && correct === body.total_questions;
        const ctx = { tests: newTests, xp: newXp, streak: newStreak, perfect };
        const earned = BADGES.filter((b) => b.check(ctx));
        const newBadges: { key: string; name: string; description: string }[] = [];
        if (earned.length) {
          const { data: have } = await supabaseAdmin.from("achievements").select("badge_key").eq("user_id", userId);
          const haveSet = new Set((have ?? []).map((r) => r.badge_key));
          for (const b of earned) {
            if (!haveSet.has(b.key)) {
              await supabaseAdmin.from("achievements").insert({
                user_id: userId, badge_key: b.key, badge_name: b.name, badge_description: b.description,
              });
              newBadges.push({ key: b.key, name: b.name, description: b.description });
            }
          }
        }

        return Response.json({
          score, max_score: maxScore, correct, wrong, attempted,
          total_questions: body.total_questions,
          duplicate: false, earnedXp, newXp, newStreak, newBadges,
        });
      },
    },
  },
});
