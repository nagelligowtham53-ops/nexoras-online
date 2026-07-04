import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown, TrendingUp, Timer, Target, RotateCcw, Bookmark, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/practice-history")({
  head: () => ({ meta: [{ title: "Practice History & Analytics — Nexoras" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth>
      <PracticeHistoryPage />
    </RequireAuth>
  ),
});

type Session = {
  id: string;
  mode: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  score: number;
  max_score: number;
  time_taken_seconds: number;
  created_at: string;
  completed_at: string | null;
  config: Record<string, unknown>;
};

function PracticeHistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterStats, setChapterStats] = useState<{ subject: string; chapter: string; total: number; correct: number }[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: answers }, { count: wc }, { count: bc }] = await Promise.all([
        supabase.from("practice_sessions").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("practice_answers").select("question_id, is_correct, questions(subject,chapter)").limit(2000),
        supabase.from("wrong_questions").select("*", { count: "exact", head: true }).eq("resolved", false),
        supabase.from("question_bookmarks").select("*", { count: "exact", head: true }),
      ]);
      setSessions((s ?? []) as unknown as Session[]);
      setWrongCount(wc ?? 0);
      setBookmarkCount(bc ?? 0);

      // Aggregate per chapter accuracy
      const map = new Map<string, { subject: string; chapter: string; total: number; correct: number }>();
      (answers ?? []).forEach((a) => {
        const qq = (a as { questions?: { subject: string; chapter: string } | null }).questions;
        if (!qq) return;
        const key = `${qq.subject}::${qq.chapter}`;
        const row = map.get(key) ?? { subject: qq.subject, chapter: qq.chapter, total: 0, correct: 0 };
        row.total += 1;
        if ((a as { is_correct: boolean | null }).is_correct === true) row.correct += 1;
        map.set(key, row);
      });
      setChapterStats([...map.values()]);
      setLoading(false);
    })();
  }, []);

  const summary = useMemo(() => {
    const totalSessions = sessions.length;
    const totalQ = sessions.reduce((a, s) => a + s.total_questions, 0);
    const totalC = sessions.reduce((a, s) => a + s.correct_count, 0);
    const totalTime = sessions.reduce((a, s) => a + s.time_taken_seconds, 0);
    const avgAccuracy = totalQ ? Math.round((totalC / totalQ) * 100) : 0;
    const avgSpeed = totalC ? Math.round(totalTime / (totalC + sessions.reduce((a, s) => a + s.wrong_count, 0))) : 0;
    return { totalSessions, totalQ, totalC, avgAccuracy, avgSpeed };
  }, [sessions]);

  const weak = useMemo(() => chapterStats
    .filter((c) => c.total >= 3)
    .map((c) => ({ ...c, accuracy: c.correct / c.total }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 8), [chapterStats]);

  const strong = useMemo(() => chapterStats
    .filter((c) => c.total >= 3)
    .map((c) => ({ ...c, accuracy: c.correct / c.total }))
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 8), [chapterStats]);

  if (loading) return <PageShell><PageHeader title="Loading…" /></PageShell>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Analytics"
        title="Practice history & insights"
        description="Every attempt is stored. Track accuracy, speed, weak chapters, and revise your mistakes."
      />
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat icon={Target} label="Sessions" value={summary.totalSessions} />
          <Stat icon={Target} label="Attempts" value={summary.totalQ} />
          <Stat icon={Target} label="Accuracy" value={`${summary.avgAccuracy}%`} />
          <Stat icon={Timer} label="Avg / Q" value={`${summary.avgSpeed}s`} />
          <Stat icon={Bookmark} label="Bookmarks" value={bookmarkCount} />
        </div>

        {wrongCount > 0 && (
          <Link to="/practice-history" className="glass flex items-center justify-between gap-3 rounded-2xl p-4 hover:border-accent/60">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-semibold">Revise your {wrongCount} wrong question{wrongCount === 1 ? "" : "s"}</p>
                <p className="text-xs text-muted-foreground">Coming soon: dedicated revision mode.</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-accent" />
          </Link>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-destructive" /> Weak chapters (need review)
            </h3>
            {weak.length === 0
              ? <p className="text-xs text-muted-foreground">Not enough data yet — attempt more questions.</p>
              : weak.map((c) => <Bar key={`${c.subject}${c.chapter}`} label={`${c.subject} · ${c.chapter}`} pct={Math.round(c.accuracy * 100)} tone="weak" />)}
          </div>
          <div className="glass rounded-2xl p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Strong chapters
            </h3>
            {strong.length === 0
              ? <p className="text-xs text-muted-foreground">Not enough data yet.</p>
              : strong.map((c) => <Bar key={`${c.subject}${c.chapter}`} label={`${c.subject} · ${c.chapter}`} pct={Math.round(c.accuracy * 100)} tone="strong" />)}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold">Recent sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet — <Link to="/custom-practice" className="text-accent underline">start a custom test</Link>.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Mode</th>
                    <th className="py-2 pr-2">Score</th>
                    <th className="py-2 pr-2">Correct / Total</th>
                    <th className="py-2 pr-2">Accuracy</th>
                    <th className="py-2 pr-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const acc = s.total_questions ? Math.round((s.correct_count / s.total_questions) * 100) : 0;
                    return (
                      <tr key={s.id} className="border-b border-border/40">
                        <td className="py-2 pr-2 text-xs">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-2 text-xs">{s.mode}</td>
                        <td className="py-2 pr-2">{Number(s.score).toFixed(1)} / {Number(s.max_score).toFixed(0)}</td>
                        <td className="py-2 pr-2">{s.correct_count} / {s.total_questions}</td>
                        <td className="py-2 pr-2">{acc}%</td>
                        <td className="py-2 pr-2">{Math.floor(s.time_taken_seconds / 60)}m {s.time_taken_seconds % 60}s</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Link to="/custom-practice"><Button className="bg-gradient-primary text-primary-foreground">Start a new test</Button></Link>
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-accent" /> {label}</div>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function Bar({ label, pct, tone }: { label: string; pct: number; tone: "weak" | "strong" }) {
  const color = tone === "weak" ? "bg-destructive" : "bg-emerald-500";
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{pct}%</span></div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
