import { supabase } from "@/integrations/supabase/client";

export type SubjectStat = { subject: string; correct: number; total: number };

export type AttemptInput = {
  exam_key: string;
  exam_name: string;
  total_questions: number;
  attempted: number;
  correct: number;
  wrong: number;
  score: number;
  max_score: number;
  duration_seconds: number;
  subject_breakdown: SubjectStat[];
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

export async function recordAttemptAndAwardXP(userId: string, attempt: AttemptInput) {
  // Insert attempt
  await supabase.from("test_attempts").insert({ user_id: userId, ...attempt });

  // XP: 10 base + 5 per correct - 2 per wrong (min 5)
  const earnedXp = Math.max(5, 10 + attempt.correct * 5 - attempt.wrong * 2);

  // Get current stats
  const { data: existing } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const today = todayStr();
  let newStreak = 1;
  let longest = 1;
  if (existing) {
    if (existing.last_active_date === today) {
      newStreak = existing.current_streak;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      newStreak = existing.last_active_date === yStr ? existing.current_streak + 1 : 1;
    }
    longest = Math.max(existing.longest_streak, newStreak);
  }

  const newXp = (existing?.xp ?? 0) + earnedXp;
  const newTests = (existing?.tests_taken ?? 0) + 1;

  if (existing) {
    await supabase
      .from("user_stats")
      .update({ xp: newXp, current_streak: newStreak, longest_streak: longest, tests_taken: newTests, last_active_date: today })
      .eq("user_id", userId);
  } else {
    await supabase.from("user_stats").insert({
      user_id: userId,
      xp: newXp,
      current_streak: newStreak,
      longest_streak: longest,
      tests_taken: newTests,
      last_active_date: today,
    });
  }

  // Badges
  const perfect = attempt.attempted === attempt.total_questions && attempt.wrong === 0 && attempt.correct === attempt.total_questions;
  const ctx = { tests: newTests, xp: newXp, streak: newStreak, perfect };
  const earned = BADGES.filter((b) => b.check(ctx));
  const newBadges: { key: string; name: string; description: string }[] = [];
  if (earned.length) {
    const { data: have } = await supabase.from("achievements").select("badge_key").eq("user_id", userId);
    const haveSet = new Set((have ?? []).map((r) => r.badge_key));
    for (const b of earned) {
      if (!haveSet.has(b.key)) {
        await supabase.from("achievements").insert({ user_id: userId, badge_key: b.key, badge_name: b.name, badge_description: b.description });
        newBadges.push({ key: b.key, name: b.name, description: b.description });
      }
    }
  }

  return { earnedXp, newXp, newStreak, newBadges };
}

export const ALL_BADGES = BADGES;
