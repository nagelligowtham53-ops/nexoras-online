import { authedFetch } from "@/lib/authed-fetch";

export type SubjectStat = { subject: string; correct: number; total: number };

export type AttemptInput = {
  exam_key: string;
  exam_name: string;
  total_questions: number;
  attempted: number;
  correct: number;
  wrong: number;
  // score / max_score are accepted for backwards compat but ignored —
  // the server recomputes them from the exam's official marking scheme.
  score?: number;
  max_score?: number;
  duration_seconds: number;
  subject_breakdown: SubjectStat[];
};

const BADGES: { key: string; name: string; description: string }[] = [
  { key: "first_test",    name: "First Step",       description: "Completed your first mock test" },
  { key: "five_tests",    name: "Test Warrior",     description: "Completed 5 mock tests" },
  { key: "ten_tests",     name: "Exam Veteran",     description: "Completed 10 mock tests" },
  { key: "xp_100",        name: "Century XP",       description: "Earned 100 XP" },
  { key: "xp_500",        name: "Rising Scholar",   description: "Earned 500 XP" },
  { key: "xp_1000",       name: "Knowledge Master", description: "Earned 1000 XP" },
  { key: "streak_3",      name: "On Fire",          description: "3-day study streak" },
  { key: "streak_7",      name: "Week Warrior",     description: "7-day study streak" },
  { key: "streak_30",     name: "Iron Will",        description: "30-day study streak" },
  { key: "perfect_score", name: "Flawless",         description: "Perfect score on a mock test" },
];

export const ALL_BADGES = BADGES;

export async function recordAttemptAndAwardXP(_userId: string, attempt: AttemptInput) {
  // All scoring, XP, streak, and badge logic runs server-side in
  // /api/record-attempt using the service role. The client only ships
  // raw attempt counts; the server validates and recomputes everything.
  const res = await authedFetch("/api/record-attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      exam_key: attempt.exam_key,
      exam_name: attempt.exam_name,
      total_questions: attempt.total_questions,
      attempted: attempt.attempted,
      correct: attempt.correct,
      wrong: attempt.wrong,
      duration_seconds: attempt.duration_seconds,
      subject_breakdown: attempt.subject_breakdown,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to record attempt" }));
    throw new Error(err.error ?? "Failed to record attempt");
  }
  return (await res.json()) as {
    earnedXp: number;
    newXp: number;
    newStreak: number;
    newBadges: { key: string; name: string; description: string }[];
    score: number;
    max_score: number;
  };
}
