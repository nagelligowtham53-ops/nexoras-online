import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin, fetchSubjectStats } from "@/lib/questions";
import { AlertCircle, CheckCircle2, Upload, Database, Loader2, FileJson, FileSpreadsheet, Trash2 } from "lucide-react";
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
  concepts?: string[];
  tags?: string[];
};

function AdminQuestionsPage() {
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [stats, setStats] = useState<{ subject: string; count: number }[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [rawText, setRawText] = useState("");
  const [importResult, setImportResult] = useState<{ inserted: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    (async () => {
      const ok = await isAdmin();
      setAdmin(ok);
      setChecking(false);
      if (ok) refreshStats();
    })();
  }, []);

  async function refreshStats() {
    const s = await fetchSubjectStats();
    setStats(s);
    const { count } = await supabase.from("questions").select("*", { count: "exact", head: true });
    setTotalCount(count ?? 0);
  }

  async function grantSelfAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return toast.error("Sign in first");
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    if (error) {
      // First admin bootstrap allowed only via SQL/service role — show helpful message
      toast.error("Only an existing admin can grant admin. Ask support or self-grant via database.");
      return;
    }
    setAdmin(true);
    toast.success("Admin granted");
    refreshStats();
  }

  async function importFromText() {
    setImportResult(null);
    if (!rawText.trim()) { toast.error("Paste CSV or JSON"); return; }
    setBusy(true);
    try {
      const parsed = parseInput(rawText);
      if (parsed.errors.length && parsed.rows.length === 0) {
        setImportResult({ inserted: 0, failed: parsed.errors.length, errors: parsed.errors.slice(0, 20) });
        return;
      }
      // Upsert in batches of 100
      let inserted = 0;
      let failed = parsed.errors.length;
      const errors = [...parsed.errors];
      for (let i = 0; i < parsed.rows.length; i += 100) {
        const batch = parsed.rows.slice(i, i + 100);
        const { error, data } = await supabase.from("questions").upsert(batch as never, {
          onConflict: "external_id",
          ignoreDuplicates: false,
        }).select("id");
        if (error) {
          failed += batch.length;
          errors.push(`Batch ${i / 100 + 1}: ${error.message}`);
        } else {
          inserted += data?.length ?? batch.length;
        }
      }
      setImportResult({ inserted, failed, errors: errors.slice(0, 20) });
      toast.success(`Imported ${inserted} question${inserted === 1 ? "" : "s"}`);
      refreshStats();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result ?? ""));
    reader.readAsText(f);
  }

  async function wipeAll() {
    if (!confirm("Delete ALL questions? This cannot be undone.")) return;
    setBusy(true);
    const { error } = await supabase.from("questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Cleared"); refreshStats(); }
  }

  if (checking) return <PageShell><PageHeader title="Loading…" /></PageShell>;

  if (!admin) {
    return (
      <PageShell>
        <PageHeader eyebrow="Admin" title="Access restricted" description="You need the admin role to manage the question bank." />
        <section className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
          <div className="glass rounded-2xl p-6 text-sm">
            <p className="mb-3">Bootstrap the first admin by running this in the database SQL editor while signed in:</p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-xs">
{`INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin');`}
            </pre>
            <Button className="mt-4" onClick={grantSelfAdmin}>Try grant self admin</Button>
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
        description="Import curated JEE / NEET questions via CSV or JSON. Practice pages read only from this database."
      />
      <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard icon={Database} label="Total questions" value={totalCount ?? "—"} />
          {stats.slice(0, 3).map((s) => (
            <StatCard key={s.subject} icon={Database} label={s.subject} value={s.count} />
          ))}
        </div>

        {/* Importer */}
        <div className="glass rounded-2xl p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Upload className="h-5 w-5 text-accent" /> Import questions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a <FileSpreadsheet className="inline h-3 w-3" /> CSV or <FileJson className="inline h-3 w-3" /> JSON file, or paste content below. Existing rows with the same <code>external_id</code> are updated.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm hover:border-accent/40">
              <Upload className="h-4 w-4" /> Choose file
              <input type="file" accept=".csv,.json,application/json,text/csv" className="hidden" onChange={onFile} />
            </label>
            <a href="/sample-questions.json" download className="text-xs text-accent underline">Download sample JSON</a>
            <a href="/sample-questions.csv" download className="text-xs text-accent underline">Download sample CSV</a>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste CSV or JSON here…"
            className="mt-4 h-64 w-full rounded-xl border border-border bg-background/60 p-3 font-mono text-xs"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={importFromText} disabled={busy} className="bg-gradient-primary text-primary-foreground">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Import
            </Button>
            <Button variant="outline" onClick={() => setRawText("")}>Clear</Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={wipeAll} disabled={busy}>
              <Trash2 className="h-4 w-4" /> Wipe all
            </Button>
          </div>

          {importResult && (
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Inserted: {importResult.inserted}
                {importResult.failed > 0 && <><AlertCircle className="ml-3 h-4 w-4 text-destructive" /> Failed: {importResult.failed}</>}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-destructive">
                  {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Schema help */}
        <div className="glass rounded-2xl p-6 text-sm">
          <h2 className="text-lg font-semibold">Schema</h2>
          <p className="mt-1 text-xs text-muted-foreground">Required fields marked *. Any missing optional field falls back to a sensible default.</p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[11px] leading-relaxed">
{`{
  "external_id": "jee-main-2024-p-01",         // unique dedupe key (optional but recommended)
  "exams": ["JEE Main"],                        // * ["JEE Main","JEE Advanced","NEET"] any subset
  "class_level": 12,                            // * 11 | 12
  "subject": "Physics",                         // *
  "chapter": "Rotational Motion",               // *
  "topic": "Moment of Inertia",
  "subtopic": "Parallel-axis theorem",
  "ncert_unit": "Systems of Particles",
  "difficulty": "Medium",                       // * "Easy" | "Medium" | "Hard"
  "question_type": "single_correct",            // * single_correct | multiple_correct | integer | numerical | assertion_reason | match_following | statement_based | matrix_match | paragraph
  "year": 2024,
  "source": "JEE Main 2024 · Session 1",
  "is_pyq": true,
  "is_ncert": false,
  "marks": 4,
  "negative_marks": 1,
  "time_estimate_seconds": 120,
  "question_text": "…",                         // *
  "options": ["A","B","C","D"],                 // required for MCQ types
  "correct_answer": { "type": "single", "value": 2 },
                                                // { "type":"single","value":<0-based idx> }
                                                // { "type":"multiple","values":[0,2] }
                                                // { "type":"numeric","value":3.14,"tolerance":0.01 }
                                                // { "type":"text","value":"answer" }
  "solution": "step-by-step text (author-provided)",
  "explanation": "concept note",
  "concepts": ["torque","angular momentum"],
  "tags": ["pyq-2024","mechanics"]
}`}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            CSV: first row must be a header. Column names match JSON keys. Array columns (exams, concepts, tags, options) use <code>|</code> as separator. <code>correct_answer</code> in CSV is the JSON string.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-accent" /> {label}</div>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

/* ------------- parsing ------------- */

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
  const list = Array.isArray(arr) ? arr : (arr && typeof arr === "object" && "questions" in arr ? (arr as { questions: unknown }).questions : null);
  if (!Array.isArray(list)) return { rows: [], errors: ["Expected an array of questions or { questions: [...] }"] };
  const rows: Draft[] = [];
  list.forEach((raw, i) => {
    const v = validate(raw as Record<string, unknown>, i);
    if (v.error) errors.push(v.error); else if (v.row) rows.push(v.row);
  });
  return { rows, errors };
}

function parseCsv(text: string): { rows: Draft[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], errors: ["CSV must have header + at least one row"] };
  const header = splitCsvLine(lines[0]);
  const errors: string[] = [];
  const rows: Draft[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const obj: Record<string, unknown> = {};
    header.forEach((h, idx) => { obj[h.trim()] = cells[idx]; });
    // Coerce array columns
    ["exams", "concepts", "tags", "options"].forEach((k) => {
      const val = obj[k];
      if (typeof val === "string" && val.length > 0) obj[k] = val.split("|").map((s) => s.trim()).filter(Boolean);
    });
    // Coerce numeric/boolean
    if (obj.class_level != null) obj.class_level = Number(obj.class_level);
    if (obj.year != null && obj.year !== "") obj.year = Number(obj.year);
    if (obj.marks != null && obj.marks !== "") obj.marks = Number(obj.marks);
    if (obj.negative_marks != null && obj.negative_marks !== "") obj.negative_marks = Number(obj.negative_marks);
    if (obj.time_estimate_seconds != null && obj.time_estimate_seconds !== "") obj.time_estimate_seconds = Number(obj.time_estimate_seconds);
    ["is_pyq", "is_ncert"].forEach((k) => {
      const v = obj[k];
      if (typeof v === "string") obj[k] = /^(true|1|yes)$/i.test(v);
    });
    if (typeof obj.correct_answer === "string" && obj.correct_answer) {
      try { obj.correct_answer = JSON.parse(obj.correct_answer as string); }
      catch { errors.push(`Row ${i + 1}: correct_answer is not valid JSON`); continue; }
    }
    const v = validate(obj, i);
    if (v.error) errors.push(v.error); else if (v.row) rows.push(v.row);
  }
  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === ",") { out.push(cur); cur = ""; }
      else if (c === '"' && cur === "") inQ = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

function validate(raw: Record<string, unknown>, i: number): { row?: Draft; error?: string } {
  const required = ["exams", "class_level", "subject", "chapter", "difficulty", "question_type", "question_text", "correct_answer"];
  for (const k of required) {
    if (raw[k] == null || raw[k] === "") return { error: `Row ${i + 1}: missing "${k}"` };
  }
  const cl = Number(raw.class_level);
  if (cl !== 11 && cl !== 12) return { error: `Row ${i + 1}: class_level must be 11 or 12` };
  if (!["Easy", "Medium", "Hard"].includes(String(raw.difficulty))) return { error: `Row ${i + 1}: difficulty must be Easy | Medium | Hard` };
  const validTypes = ["single_correct", "multiple_correct", "integer", "numerical", "assertion_reason", "match_following", "statement_based", "matrix_match", "paragraph"];
  if (!validTypes.includes(String(raw.question_type))) return { error: `Row ${i + 1}: invalid question_type` };
  const exams = Array.isArray(raw.exams) ? raw.exams.map(String) : [];
  if (exams.length === 0) return { error: `Row ${i + 1}: exams must have at least one value` };
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
    options: Array.isArray(raw.options) ? raw.options.map(String) : null,
    correct_answer: raw.correct_answer,
    solution: raw.solution ? String(raw.solution) : null,
    explanation: raw.explanation ? String(raw.explanation) : null,
    concepts: Array.isArray(raw.concepts) ? raw.concepts.map(String) : [],
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
  return { row };
}
