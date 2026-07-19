import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ensureQuestionBankSeeded } from "@/lib/question-bank.functions";
import { isAdmin, fetchSubjectStats } from "@/lib/questions";
import {
  AlertCircle, CheckCircle2, Upload, Database, Loader2, FileJson,
  FileSpreadsheet, Trash2, Search, Pencil, X, History, BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({ meta: [{ title: "Admin · Question Bank — Nexoras" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAuth>
      <AdminQuestionsPage />
    </RequireAuth>
  ),
});

type Draft = {
  external_id?: string;
  exams: string[];
  class_level: 11 | 12;
  subject: string;
  chapter: string;
  topic?: string | null;
  subtopic?: string | null;
  ncert_unit?: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
  question_type: string;
  year?: number | null;
  source?: string | null;
  is_pyq?: boolean;
  is_ncert?: boolean;
  marks?: number;
  negative_marks?: number;
  time_estimate_seconds?: number;
  question_text: string;
  options?: string[] | null;
  correct_answer: unknown;
  solution?: string | null;
  explanation?: string | null;
  image_url?: string | null;
  concepts?: string[];
  tags?: string[];
};

/* ------------- Header alias map for auto-detection ------------- */
const ALIAS: Record<string, string> = {
  // question
  question: "question_text", question_text: "question_text", q: "question_text",
  problem: "question_text", statement: "question_text", body: "question_text",
  // options
  options: "options", choices: "options", option: "options",
  option_a: "opt_a", "option a": "opt_a", a: "opt_a", opta: "opt_a",
  option_b: "opt_b", "option b": "opt_b", b: "opt_b", optb: "opt_b",
  option_c: "opt_c", "option c": "opt_c", c: "opt_c", optc: "opt_c",
  option_d: "opt_d", "option d": "opt_d", d: "opt_d", optd: "opt_d",
  option_e: "opt_e", "option e": "opt_e", e: "opt_e",
  // answer
  answer: "correct_answer", correct: "correct_answer", correct_answer: "correct_answer",
  correct_option: "correct_answer", ans: "correct_answer", key: "correct_answer",
  // meta
  exam: "exams", exams: "exams",
  class: "class_level", class_level: "class_level", std: "class_level", standard: "class_level", grade: "class_level",
  subject: "subject", sub: "subject",
  chapter: "chapter", ch: "chapter", unit: "chapter",
  topic: "topic", subtopic: "subtopic",
  difficulty: "difficulty", level: "difficulty",
  question_type: "question_type", type: "question_type", qtype: "question_type",
  year: "year",
  source: "source", paper: "source",
  explanation: "explanation", solution: "solution", hint: "explanation",
  image: "image_url", image_url: "image_url", img: "image_url", diagram: "image_url",
  external_id: "external_id", id: "external_id", qid: "external_id",
  is_pyq: "is_pyq", pyq: "is_pyq", previous_year: "is_pyq",
  is_ncert: "is_ncert", ncert: "is_ncert",
  marks: "marks", "marks+": "marks",
  negative_marks: "negative_marks", "marks-": "negative_marks", negative: "negative_marks",
  tags: "tags", concepts: "concepts",
  time: "time_estimate_seconds", time_estimate: "time_estimate_seconds", time_estimate_seconds: "time_estimate_seconds",
};
function normKey(k: string): string {
  const n = k.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return ALIAS[n] ?? ALIAS[n.replace(/_/g, " ")] ?? n;
}

/* ------------- Component ------------- */
function AdminQuestionsPage() {
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [stats, setStats] = useState<{ subject: string; count: number }[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await isAdmin();
      setAdmin(ok);
      setChecking(false);
      if (ok) refreshStats();
    })();
  }, []);

  async function refreshStats() {
    await ensureQuestionBankSeeded().catch((error) => console.error("[admin/questions] Question bank seed check failed", error));
    const s = await fetchSubjectStats();
    setStats(s);
    const { count } = await supabase.from("questions").select("*", { count: "exact", head: true });
    setTotalCount(count ?? 0);
  }

  if (checking) return <PageShell><PageHeader title="Loading…" /></PageShell>;

  if (!admin) {
    return (
      <PageShell>
        <PageHeader eyebrow="Admin" title="Access restricted" description="This account is not authorized to manage the question bank." />
        <section className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
          <div className="glass rounded-2xl p-6 text-sm">
            <p className="text-muted-foreground">If this is the owner account, refresh this page after signing in. Admin access is assigned securely on the backend.</p>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Admin"
        title="Question Bank"
        description="Import licensed JEE / NEET questions via CSV, Excel or JSON. Practice pages read from this database."
      />
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard icon={Database} label="Total questions" value={totalCount ?? "—"} />
          {stats.slice(0, 3).map((s) => (
            <StatCard key={s.subject} icon={Database} label={s.subject} value={s.count} />
          ))}
        </div>

        {totalCount === 0 && (
          <div className="glass rounded-2xl border border-accent/30 p-5 text-sm">
            <p className="font-semibold text-accent">No question bank has been imported yet.</p>
            <p className="mt-1 text-muted-foreground">Import a licensed CSV, Excel, or JSON question bank to enable practice tests.</p>
          </div>
        )}

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="glass">
            <TabsTrigger value="import"><Upload className="mr-1 h-4 w-4" />Import</TabsTrigger>
            <TabsTrigger value="dashboard"><BarChart3 className="mr-1 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="browse"><Search className="mr-1 h-4 w-4" />Browse</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-1 h-4 w-4" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4"><ImportPanel onDone={refreshStats} /></TabsContent>
          <TabsContent value="dashboard" className="mt-4"><DashboardPanel /></TabsContent>
          <TabsContent value="browse" className="mt-4"><BrowsePanel onChanged={refreshStats} /></TabsContent>
          <TabsContent value="history" className="mt-4"><HistoryPanel /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

/* ------------- Import Panel ------------- */
function ImportPanel({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [rawText, setRawText] = useState("");
  const [filename, setFilename] = useState<string>("");
  const [sourceType, setSourceType] = useState<"csv" | "json" | "xlsx" | "paste">("paste");
  const [result, setResult] = useState<{ inserted: number; updated: number; failed: number; errors: string[] } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFilename(f.name);
    const lower = f.name.toLowerCase();
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      setSourceType("xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      setRawText(JSON.stringify(rows, null, 2));
    } else {
      const text = await f.text();
      if (lower.endsWith(".json")) setSourceType("json");
      else setSourceType("csv");
      setRawText(text);
    }
  }

  async function doImport() {
    setResult(null);
    if (!rawText.trim()) return toast.error("Paste or upload data first");
    setBusy(true);
    try {
      const parsed = parseInput(rawText);
      let inserted = 0, updated = 0, failed = parsed.errors.length;
      const errors = [...parsed.errors];

      const CHUNK = 200;
      for (let i = 0; i < parsed.rows.length; i += CHUNK) {
        const batch = parsed.rows.slice(i, i + CHUNK);
        const { error, data } = await (supabase.from("questions") as any).upsert(batch, {
          onConflict: "external_id",
          ignoreDuplicates: false,
        }).select("id");
        if (error) {
          failed += batch.length;
          errors.push(`Batch ${Math.floor(i / CHUNK) + 1}: ${error.message}`);
        } else {
          inserted += data?.length ?? batch.length;
        }
      }

      // log history
      const { data: userData } = await supabase.auth.getUser();
      await (supabase.from("import_history") as any).insert({
        user_id: userData.user?.id,
        filename: filename || null,
        source_type: sourceType,
        total_rows: parsed.rows.length + parsed.errors.length,
        inserted, updated, failed,
        errors: errors.slice(0, 50),
      });

      setResult({ inserted, updated, failed, errors: errors.slice(0, 20) });
      toast.success(`Imported ${inserted} question${inserted === 1 ? "" : "s"}`);
      onDone();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function wipeAll() {
    if (!confirm("Delete ALL questions? This cannot be undone.")) return;
    setBusy(true);
    const { error } = await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Cleared"); onDone(); }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Upload className="h-5 w-5 text-accent" /> Import questions
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Supports <FileSpreadsheet className="inline h-3 w-3" /> Excel (.xlsx), CSV, and <FileJson className="inline h-3 w-3" /> JSON.
        Columns are auto-detected (question, options, answer, subject, chapter, class, year, difficulty, image, …).
        Existing rows with the same <code>external_id</code> are updated.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm hover:border-accent/40">
          <Upload className="h-4 w-4" /> Choose file (.xlsx / .csv / .json)
          <input type="file" accept=".csv,.json,.xlsx,.xls,application/json,text/csv" className="hidden" onChange={onFile} />
        </label>
        {filename && <span className="text-xs text-muted-foreground">{filename}</span>}
        <a href="/sample-questions.json" download className="text-xs text-accent underline">Sample JSON</a>
        <a href="/sample-questions.csv" download className="text-xs text-accent underline">Sample CSV</a>
      </div>

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Or paste CSV / JSON here…"
        className="mt-4 h-64 w-full rounded-xl border border-border bg-background/60 p-3 font-mono text-xs"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={doImport} disabled={busy} className="bg-gradient-primary text-primary-foreground">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
        </Button>
        <Button variant="outline" onClick={() => { setRawText(""); setFilename(""); }}>Clear</Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={wipeAll} disabled={busy}>
          <Trash2 className="h-4 w-4" /> Wipe all
        </Button>
      </div>

      {result && (
        <div className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-sm">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Imported: {result.inserted}</span>
            {result.failed > 0 && <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-destructive" /> Failed: {result.failed}</span>}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-destructive">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------- Dashboard Panel ------------- */
function DashboardPanel() {
  const [subjects, setSubjects] = useState<{ subject: string; count: number }[]>([]);
  const [chapters, setChapters] = useState<{ label: string; count: number }[]>([]);
  const [years, setYears] = useState<{ label: string; count: number }[]>([]);
  const [dupes, setDupes] = useState<{ text: string; count: number }[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => { (async () => {
    const { count } = await supabase.from("questions").select("*", { count: "exact", head: true });
    setTotal(count ?? 0);
    const { data } = await supabase.from("questions").select("subject,chapter,year,question_text").limit(20000);
    const rows = (data ?? []) as { subject: string; chapter: string; year: number | null; question_text: string }[];
    const bumper = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);
    const sMap = new Map<string, number>(), cMap = new Map<string, number>(), yMap = new Map<string, number>(), tMap = new Map<string, number>();
    rows.forEach((r) => {
      bumper(sMap, r.subject);
      bumper(cMap, `${r.subject} · ${r.chapter}`);
      bumper(yMap, r.year ? String(r.year) : "Unknown");
      bumper(tMap, r.question_text.slice(0, 120).toLowerCase().trim());
    });
    setSubjects([...sMap].map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count));
    setChapters([...cMap].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 40));
    setYears([...yMap].map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label)));
    setDupes([...tMap].filter(([, c]) => c > 1).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count).slice(0, 25));
  })(); }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={Database} label="Total" value={total} />
        <StatCard icon={Database} label="Subjects" value={subjects.length} />
        <StatCard icon={Database} label="Chapters" value={chapters.length} />
        <StatCard icon={AlertCircle} label="Duplicates" value={dupes.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartList title="Questions by Subject" rows={subjects.map((s) => ({ label: s.subject, count: s.count }))} />
        <ChartList title="Questions by Year" rows={years} />
      </div>
      <ChartList title="Top Chapters" rows={chapters} />
      {dupes.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive"><AlertCircle className="h-4 w-4" /> Possible duplicates</h3>
          <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
            {dupes.map((d, i) => <li key={i}><span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">{d.count}×</span> {d.text}…</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChartList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="truncate">{r.label}</span>
              <div className="h-1.5 min-w-6 flex-1 rounded bg-background/60">
                <div className="h-full rounded bg-gradient-primary" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
            <span className="tabular-nums text-muted-foreground">{r.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------- Browse Panel ------------- */
function BrowsePanel({ onChanged }: { onChanged: () => void }) {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  async function run() {
    setLoading(true);
    let qb = supabase.from("questions").select("id,subject,chapter,topic,difficulty,question_type,year,question_text,options,correct_answer,explanation,image_url").order("created_at", { ascending: false }).limit(100);
    if (subject) qb = qb.eq("subject", subject);
    if (q) qb = qb.ilike("question_text", `%${q}%`);
    const { data, error } = await qb;
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows(data ?? []);
  }

  useEffect(() => { run(); /* initial */ // eslint-disable-next-line
  }, []);

  async function del(id: string) {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); setRows((r) => r.filter((x) => x.id !== id)); onChanged();
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-muted-foreground">Search question text</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Newton's law" />
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Subject</label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Physics" />
        </div>
        <Button onClick={run} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search</Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="p-2">Subject</th><th className="p-2">Chapter</th><th className="p-2">Type</th>
              <th className="p-2">Diff</th><th className="p-2">Year</th><th className="p-2">Question</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/50">
                <td className="p-2">{r.subject}</td>
                <td className="p-2">{r.chapter}</td>
                <td className="p-2">{r.question_type}</td>
                <td className="p-2">{r.difficulty}</td>
                <td className="p-2">{r.year ?? "—"}</td>
                <td className="p-2 max-w-md truncate">{r.question_text}</td>
                <td className="p-2 flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No results.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <EditModal row={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); run(); onChanged(); }} />}
    </div>
  );
}

function EditModal({ row, onClose, onSaved }: { row: any; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState<string>(row.question_text);
  const [chapter, setChapter] = useState<string>(row.chapter);
  const [topic, setTopic] = useState<string>(row.topic ?? "");
  const [difficulty, setDifficulty] = useState<string>(row.difficulty);
  const [explanation, setExplanation] = useState<string>(row.explanation ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("questions").update({
      question_text: text, chapter, topic: topic || null, difficulty: difficulty as any, explanation: explanation || null,
    }).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved"); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass w-full max-w-2xl rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit question</h3>
          <Button size="sm" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div><label className="text-xs text-muted-foreground">Question</label><textarea value={text} onChange={(e) => setText(e.target.value)} className="h-28 w-full rounded border border-border bg-background/60 p-2" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="text-xs text-muted-foreground">Chapter</label><Input value={chapter} onChange={(e) => setChapter(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Topic</label><Input value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
            <div><label className="text-xs text-muted-foreground">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="h-9 w-full rounded border border-border bg-background/60 px-2">
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
          </div>
          <div><label className="text-xs text-muted-foreground">Explanation</label><textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} className="h-24 w-full rounded border border-border bg-background/60 p-2" /></div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------- History Panel ------------- */
function HistoryPanel() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { (async () => {
    const { data } = await (supabase.from("import_history") as any).select("*").order("created_at", { ascending: false }).limit(50);
    setRows(data ?? []);
  })(); }, []);
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="mb-3 text-sm font-semibold">Recent imports</h3>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">No imports yet.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr><th className="p-2">Date</th><th className="p-2">File</th><th className="p-2">Type</th><th className="p-2">Inserted</th><th className="p-2">Failed</th><th className="p-2">Total</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border/50">
                <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-2">{r.filename ?? "—"}</td>
                <td className="p-2 uppercase">{r.source_type}</td>
                <td className="p-2 text-emerald-500">{r.inserted}</td>
                <td className="p-2 text-destructive">{r.failed}</td>
                <td className="p-2">{r.total_rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------- Small components ------------- */
function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-accent" /> {label}</div>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

/* ------------- parsing (auto-detect) ------------- */
function parseInput(text: string): { rows: Draft[]; errors: string[] } {
  const t = text.trim();
  if (!t) return { rows: [], errors: ["Empty input"] };
  if (t.startsWith("[") || t.startsWith("{")) return parseJson(t);
  return parseCsv(t);
}

function parseJson(text: string): { rows: Draft[]; errors: string[] } {
  const errors: string[] = [];
  let arr: unknown;
  try { arr = JSON.parse(text); } catch (e) { return { rows: [], errors: [`Invalid JSON: ${(e as Error).message}`] }; }
  const list = Array.isArray(arr) ? arr : (arr && typeof arr === "object" && "questions" in arr ? (arr as any).questions : null);
  if (!Array.isArray(list)) return { rows: [], errors: ["Expected an array or { questions: [...] }"] };
  const rows: Draft[] = [];
  list.forEach((raw: any, i: number) => {
    const norm = normalizeKeys(raw);
    const v = validate(norm, i);
    if (v.error) errors.push(v.error); else if (v.row) rows.push(v.row);
  });
  return { rows, errors };
}

function parseCsv(text: string): { rows: Draft[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], errors: ["CSV must have header + at least one row"] };
  const header = splitCsvLine(lines[0]);
  const errors: string[] = []; const rows: Draft[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const raw: Record<string, unknown> = {};
    header.forEach((h, idx) => { raw[h] = cells[idx]; });
    const norm = normalizeKeys(raw);
    const v = validate(norm, i);
    if (v.error) errors.push(v.error); else if (v.row) rows.push(v.row);
  }
  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') inQ = false; else cur += c; }
    else { if (c === ",") { out.push(cur); cur = ""; } else if (c === '"' && cur === "") inQ = true; else cur += c; }
  }
  out.push(cur); return out;
}

function normalizeKeys(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const optionParts: Record<string, string> = {};
  for (const k of Object.keys(raw)) {
    const nk = normKey(k);
    const v = raw[k];
    if (nk.startsWith("opt_")) {
      if (typeof v === "string" && v.trim()) optionParts[nk] = String(v).trim();
      continue;
    }
    out[nk] = v;
  }
  // assemble split options
  if (!out.options) {
    const parts = ["opt_a","opt_b","opt_c","opt_d","opt_e"].map((k) => optionParts[k]).filter(Boolean);
    if (parts.length >= 2) out.options = parts;
  }
  // string → array for array columns
  ["exams", "concepts", "tags", "options"].forEach((k) => {
    const v = out[k];
    if (typeof v === "string" && v.length > 0) out[k] = v.split(/[|,;]/).map((s) => s.trim()).filter(Boolean);
  });
  // coerce numerics
  ["class_level","year","marks","negative_marks","time_estimate_seconds"].forEach((k) => {
    if (out[k] != null && out[k] !== "") { const n = Number(out[k]); if (!Number.isNaN(n)) out[k] = n; }
  });
  // booleans
  ["is_pyq","is_ncert"].forEach((k) => {
    const v = out[k]; if (typeof v === "string") out[k] = /^(true|1|yes|y)$/i.test(v);
  });
  // difficulty normalize
  if (typeof out.difficulty === "string") {
    const d = (out.difficulty as string).trim().toLowerCase();
    out.difficulty = d.startsWith("e") ? "Easy" : d.startsWith("h") ? "Hard" : "Medium";
  } else if (out.difficulty == null) out.difficulty = "Medium";
  // question_type default
  if (!out.question_type) out.question_type = Array.isArray(out.options) && (out.options as any[]).length > 0 ? "single_correct" : "numerical";
  // exam defaults
  if (!out.exams || (Array.isArray(out.exams) && (out.exams as any[]).length === 0)) out.exams = ["JEE Main"];
  // class default
  if (!out.class_level) out.class_level = 12;
  // subject default
  if (!out.subject) out.subject = "General";
  if (!out.chapter) out.chapter = "Miscellaneous";
  // year → is_pyq
  if (out.year && !("is_pyq" in raw)) out.is_pyq = true;
  // correct_answer coercion
  out.correct_answer = coerceAnswer(out.correct_answer, out.options as string[] | undefined, String(out.question_type));
  return out;
}

function coerceAnswer(v: unknown, options: string[] | undefined, qtype: string): unknown {
  if (v == null || v === "") return { type: "text", value: "" };
  if (typeof v === "object") return v;
  const s = String(v).trim();
  // JSON?
  if (s.startsWith("{") || s.startsWith("[")) { try { return JSON.parse(s); } catch { /* fallthrough */ } }
  // A / B / C / D  (single or multiple)
  const letters = s.toUpperCase().replace(/[^A-E,\s|]/g, "").split(/[,\s|]+/).filter(Boolean);
  if (letters.length && letters.every((l) => /^[A-E]$/.test(l))) {
    const idxs = letters.map((l) => l.charCodeAt(0) - 65);
    if (idxs.length === 1) return { type: "single", value: idxs[0] };
    return { type: "multiple", values: idxs };
  }
  // numeric index (1..n)
  const n = Number(s);
  if (!Number.isNaN(n) && options && options.length > 0 && n >= 1 && n <= options.length) {
    return { type: "single", value: n - 1 };
  }
  // numeric value for integer / numerical
  if (!Number.isNaN(n) && (qtype === "integer" || qtype === "numerical")) {
    return { type: "numeric", value: n, tolerance: 0.01 };
  }
  // match option text
  if (options) {
    const idx = options.findIndex((o) => o.trim().toLowerCase() === s.toLowerCase());
    if (idx >= 0) return { type: "single", value: idx };
  }
  return { type: "text", value: s };
}

function validate(raw: Record<string, unknown>, i: number): { row?: Draft; error?: string } {
  if (!raw.question_text || String(raw.question_text).trim() === "") return { error: `Row ${i + 1}: missing question_text` };
  const cl = Number(raw.class_level);
  if (cl !== 11 && cl !== 12) return { error: `Row ${i + 1}: class_level must be 11 or 12` };
  const validTypes = ["single_correct","multiple_correct","integer","numerical","assertion_reason","match_following","statement_based","matrix_match","paragraph"];
  if (!validTypes.includes(String(raw.question_type))) return { error: `Row ${i + 1}: invalid question_type "${raw.question_type}"` };
  const exams = Array.isArray(raw.exams) ? raw.exams.map(String) : [];
  if (exams.length === 0) return { error: `Row ${i + 1}: exams empty` };
  const row: Draft = {
    external_id: raw.external_id ? String(raw.external_id) : undefined,
    exams,
    class_level: cl as 11 | 12,
    subject: String(raw.subject),
    chapter: String(raw.chapter),
    topic: raw.topic ? String(raw.topic) : null,
    subtopic: raw.subtopic ? String(raw.subtopic) : null,
    ncert_unit: raw.ncert_unit ? String(raw.ncert_unit) : null,
    difficulty: raw.difficulty as "Easy" | "Medium" | "Hard",
    question_type: String(raw.question_type),
    year: raw.year != null && raw.year !== "" ? Number(raw.year) : null,
    source: raw.source ? String(raw.source) : null,
    is_pyq: raw.is_pyq === true,
    is_ncert: raw.is_ncert === true,
    marks: raw.marks != null && raw.marks !== "" ? Number(raw.marks) : 4,
    negative_marks: raw.negative_marks != null && raw.negative_marks !== "" ? Number(raw.negative_marks) : 1,
    time_estimate_seconds: raw.time_estimate_seconds != null && raw.time_estimate_seconds !== "" ? Number(raw.time_estimate_seconds) : 120,
    question_text: String(raw.question_text),
    options: Array.isArray(raw.options) ? (raw.options as unknown[]).map(String) : null,
    correct_answer: raw.correct_answer,
    solution: raw.solution ? String(raw.solution) : null,
    explanation: raw.explanation ? String(raw.explanation) : null,
    image_url: raw.image_url ? String(raw.image_url) : null,
    concepts: Array.isArray(raw.concepts) ? (raw.concepts as unknown[]).map(String) : [],
    tags: Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [],
  };
  return { row };
}
