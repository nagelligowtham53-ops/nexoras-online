import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ALL_BADGES } from "@/lib/gamification";
import { Trophy, Flame, Sparkles, Target, Lock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements & XP — Nexoras" },
      { name: "description", content: "Track your XP, study streak, mock-test history and unlocked badges." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <AchievementsPage />
    </RequireAuth>
  ),
});

type Stats = { xp: number; current_streak: number; longest_streak: number; tests_taken: number };
type Attempt = { id: string; exam_name: string; score: number; max_score: number; created_at: string; correct: number; total_questions: number };

function AchievementsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [s, a, h] = await Promise.all([
        supabase.from("user_stats").select("xp,current_streak,longest_streak,tests_taken").eq("user_id", user.id).maybeSingle(),
        supabase.from("achievements").select("badge_key").eq("user_id", user.id),
        supabase.from("test_attempts").select("id,exam_name,score,max_score,created_at,correct,total_questions").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      ]);
      if (!active) return;
      setStats(s.data ?? { xp: 0, current_streak: 0, longest_streak: 0, tests_taken: 0 });
      setEarned(new Set((a.data ?? []).map((r) => r.badge_key)));
      setAttempts((h.data ?? []) as Attempt[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Gamification"
        title="Your XP, streaks & achievements"
        description="Earn XP from mock tests, build daily streaks, and unlock badges as you grow."
      />
      <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-4">
          <KPI icon={Sparkles} label="XP" value={stats?.xp ?? 0} />
          <KPI icon={Flame} label="Current streak" value={`${stats?.current_streak ?? 0} d`} />
          <KPI icon={Target} label="Longest streak" value={`${stats?.longest_streak ?? 0} d`} />
          <KPI icon={Trophy} label="Tests taken" value={stats?.tests_taken ?? 0} />
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold">Badges</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_BADGES.map((b) => {
              const has = earned.has(b.key);
              return (
                <div key={b.key} className={`glass rounded-xl p-4 ${has ? "border border-accent/40" : "opacity-60"}`}>
                  <div className="flex items-center gap-2">
                    {has ? <CheckCircle2 className="h-4 w-4 text-accent" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    <p className="font-display text-sm font-semibold">{b.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold">Recent mock tests</h2>
          <div className="glass mt-4 overflow-hidden rounded-xl">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading…</p>
            ) : attempts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No attempts yet — take your first mock test!</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-4 py-2 text-left">Exam</th><th className="px-4 py-2 text-left">Score</th><th className="px-4 py-2 text-left">Accuracy</th><th className="px-4 py-2 text-left">Date</th></tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-2">{a.exam_name}</td>
                      <td className="px-4 py-2">{a.score} / {a.max_score}</td>
                      <td className="px-4 py-2">{Math.round((a.correct / Math.max(1, a.total_questions)) * 100)}%</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function KPI({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
