import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAuthFromRequest } from "@/lib/require-auth-http";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Server-side allowlist of exam marking schemes. The client cannot influence
// score: we recompute score = correct*correctMark - wrong*wrongMark and
// derive XP, streaks, and badges from the recomputed values.
const MARKING: Record<string, { correct: number; wrong: number; maxQ: number }> = {
  "jee-main":   { correct: 4, wrong: 1, maxQ: 90 },
  "jee-adv":    { correct: 4, wrong: 1, maxQ: 90 },
  "neet":       { correct: 4, wrong: 1, maxQ: 200 },
  "bitsat":     { correct: 3, wrong: 1, maxQ: 150 },
  "mht-cet":    { correct: 1, wrong: 0, maxQ: 200 },
  "comedk":     { correct: 1, wrong: 0, maxQ: 180 },
  "eamcet":     { correct: 1, wrong: 0, maxQ: 160 },
  "upsc":       { correct: 2, wrong: 1, maxQ: 100 },
  "cat":        { correct: 3, wrong: 1, maxQ: 80 },
  "gate":       { correct: 2, wrong: 1, maxQ: 70 },
  "ca":         { correct: 1, wrong: 0, maxQ: 100 },
  "cfa":        { correct: 1, wrong: 0, maxQ: 100 },
  "usmle":      { correct: 1, wrong: 0, maxQ: 120 },
  "sat":        { correct: 1, wrong: 0, maxQ: 120 },
  "gre":        { correct: 1, wrong: 0, maxQ: 80 },
  "ielts":      { correct: 1, wrong: 0, maxQ: 80 },
  "toefl":      { correct: 1, wrong: 0, maxQ: 80 },
  "olympiad":   { correct: 3, wrong: 0, maxQ: 60 },
  "coding":     { correct: 3, wrong: 1, maxQ: 60 },
  "icpc":       { correct: 4, wrong: 0, maxQ: 40 },
};

const SubjectStat = z.object({
  subject: z.string().min(1).max(60),
  correct: z.number().int().min(0).max(500),
  total:   z.number().int().min(0).max(500),
});

const Body = z.object({
  exam_key: z.string().min(1).max(40),
  exam_name: z.string().min(1).max(80),
  total_questions: z.number().int().min(1).max(500),
  attempted: z.number().int().min(0).max(500),
  correct: z.number().int().min(0).max(500),
  wrong: z.number().int().min(0).max(500),
  duration_seconds: z.number().int().min(0).max(60 * 60 * 12),
  subject_breakdown: z.array(SubjectStat).max(10).default([]),
});

const BADGES: { key: string; name: string; description: string; check: (s: { tests: number; xp: number; streak: number; perfect: boolean }) => boolean }[] = [
  { key: "first_test",   name: "First Step",       description: "Completed your first mock test", check: (s) => s.tests >= 1 },
  { key: "five_tests",   name: "Test Warrior",     description: "Completed 5 mock tests",          check: (s) => s.tests >= 5 },
  { key: "ten_tests",    name: "Exam Veteran",     description: "Completed 10 mock tests",         check: (s) => s.tests >= 10 },
  { key: "xp_100",       name: "Century XP",       description: "Earned 100 XP",                   check: (s) => s.xp >= 100 },
  { key: "xp_500",       name: "Rising Scholar",   description: "Earned 500 XP",                   check: (s) => s.xp >= 500 },
  { key: "xp_1000",      name: "Knowledge Master", description: "Earned 1000 XP",                  check: (s) => s.xp >= 1000 },
  { key: "streak_3",     name: "On Fire",          description: "3-day study streak",              check: (s) => s.streak >= 3 },
  { key: "streak_7",     name: "Week Warrior",     description: "7-day study streak",              check: (s) => s.streak >= 7 },
  { key: "streak_30",    name: "Iron Will",        description: "30-day study streak",             check: (s) => s.streak >= 30 },
  { key: "perfect_score",name: "Flawless",         description: "Perfect score on a mock test",    check: (s) => s.perfect },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Route = createFileRoute("/api/record-attempt")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = await requireAuthFromRequest(request);
        if (auth instanceof Response) return auth;
        const userId = auth.userId;

        let raw: unknown;
        try { raw = await request.json(); } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Body.safeParse(raw);
        if (!parsed.success) {
          return Response.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
        }
        const a = parsed.data;

        // Server-side consistency checks
        if (a.correct + a.wrong > a.attempted) {
          return Response.json({ error: "correct+wrong exceeds attempted" }, { status: 400 });
        }
        if (a.attempted > a.total_questions) {
          return Response.json({ error: "attempted exceeds total_questions" }, { status: 400 });
        }

        const scheme = MARKING[a.exam_key] ?? { correct: 1, wrong: 0, maxQ: 200 };
        if (a.total_questions > scheme.maxQ) {
          return Response.json({ error: "total_questions exceeds exam limit" }, { status: 400 });
        }

        // Authoritative score
        const score = a.correct * scheme.correct - a.wrong * scheme.wrong;
        const max_score = a.total_questions * scheme.correct;

        const { error: insErr } = await supabaseAdmin.from("test_attempts").insert({
          user_id: userId,
          exam_key: a.exam_key,
          exam_name: a.exam_name,
          total_questions: a.total_questions,
          attempted: a.attempted,
          correct: a.correct,
          wrong: a.wrong,
          score,
          max_score,
          duration_seconds: a.duration_seconds,
          subject_breakdown: a.subject_breakdown,
        });
        if (insErr) {
          console.error("[record-attempt] insert error", insErr);
          return Response.json({ error: "Failed to record attempt" }, { status: 500 });
        }

        // XP: 10 base + 5 per correct - 2 per wrong (min 5), capped per-attempt
        const earnedXp = Math.min(500, Math.max(5, 10 + a.correct * 5 - a.wrong * 2));

        const { data: existing } = await supabaseAdmin
          .from("user_stats").select("*").eq("user_id", userId).maybeSingle();

        const today = todayStr();
        let newStreak = 1;
        let longest = 1;
        if (existing) {
          if (existing.last_active_date === today) {
            newStreak = existing.current_streak;
          } else {
            const y = new Date(); y.setDate(y.getDate() - 1);
            const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
            newStreak = existing.last_active_date === yStr ? existing.current_streak + 1 : 1;
          }
          longest = Math.max(existing.longest_streak, newStreak);
        }
        const newXp = (existing?.xp ?? 0) + earnedXp;
        const newTests = (existing?.tests_taken ?? 0) + 1;

        if (existing) {
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

        const perfect = a.attempted === a.total_questions && a.wrong === 0 && a.correct === a.total_questions;
        const ctx = { tests: newTests, xp: newXp, streak: newStreak, perfect };
        const earned = BADGES.filter((b) => b.check(ctx));
        const newBadges: { key: string; name: string; description: string }[] = [];
        if (earned.length) {
          const { data: have } = await supabaseAdmin
            .from("achievements").select("badge_key").eq("user_id", userId);
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

        return Response.json({ earnedXp, newXp, newStreak, newBadges, score, max_score });
      },
    },
  },
});
