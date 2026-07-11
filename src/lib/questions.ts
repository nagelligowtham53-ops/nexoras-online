import { supabase } from "@/integrations/supabase/client";

export type QuestionType =
  | "single_correct" | "multiple_correct" | "integer" | "numerical"
  | "assertion_reason" | "match_following" | "statement_based"
  | "matrix_match" | "paragraph";

export type Difficulty = "Easy" | "Medium" | "Hard";
export type ExamCode = "JEE Main" | "JEE Advanced" | "NEET";

export type CorrectAnswer =
  | { type: "single"; value: number }
  | { type: "multiple"; values: number[] }
  | { type: "numeric"; value: number; tolerance?: number }
  | { type: "text"; value: string };

export type DbQuestion = {
  id: string;
  exams: string[];
  class_level: 11 | 12;
  subject: string;
  chapter: string;
  topic: string | null;
  subtopic: string | null;
  ncert_unit: string | null;
  difficulty: Difficulty;
  question_type: QuestionType;
  year: number | null;
  source: string | null;
  is_pyq: boolean;
  is_ncert: boolean;
  marks: number;
  negative_marks: number;
  time_estimate_seconds: number;
  question_text: string;
  options: string[] | null;
  correct_answer: CorrectAnswer;
  solution: string | null;
  explanation: string | null;
  concepts: string[];
  tags: string[];
  external_id: string | null;
};

export type QuestionFilters = {
  exams?: string[];              // e.g. ["JEE Main"]
  classLevels?: (11 | 12)[];
  subjects?: string[];
  chapters?: string[];
  topics?: string[];
  difficulties?: Difficulty[];
  questionTypes?: QuestionType[];
  pyqOnly?: boolean;
  ncertOnly?: boolean;
  yearFrom?: number;
  yearTo?: number;
  count: number;
};

export type QuestionFetchAttempt = {
  stage: string;
  filters: QuestionFilters;
  found: number;
  error?: string;
};

export type RelaxedQuestionFetchResult = {
  questions: DbQuestion[];
  totalQuestions: number;
  attempts: QuestionFetchAttempt[];
  relaxedStage: string | null;
};

const QUESTION_BANK_LOG = "[question-bank]";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values.filter((v): v is T => v !== null && v !== undefined))];
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/([\s_-]+)/)
    .map((part) => (/^[a-z]/.test(part) ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join("");
}

function labelVariants(value: string): string[] {
  const trimmed = value.trim();
  const collapsed = trimmed.replace(/\s+/g, " ");
  return uniq([trimmed, collapsed, collapsed.toLowerCase(), collapsed.toUpperCase(), titleCase(collapsed)]);
}

function examVariants(exams?: string[]) {
  const expanded = (exams ?? []).flatMap((exam) => {
    const base = labelVariants(exam);
    if (/jee\s*main/i.test(exam)) return [...base, "JEE Mains", "JEE_MAIN", "JEE-Main", "JEEMain"];
    if (/jee\s*advanced/i.test(exam)) return [...base, "JEE_ADVANCED", "JEE-Advanced", "JEEAdvanced"];
    if (/neet/i.test(exam)) return [...base, "NEET UG", "NEET-UG", "NEET_UG"];
    return base;
  });
  return uniq(expanded);
}

function subjectVariants(subjects?: string[]) {
  const expanded = (subjects ?? []).flatMap((subject) => {
    const base = labelVariants(subject);
    if (/biology/i.test(subject)) return [...base, "Botany", "Zoology"];
    return base;
  });
  return uniq(expanded);
}

function difficultyVariants(difficulties?: Difficulty[]) {
  return uniq((difficulties ?? []).flatMap((d) => labelVariants(d)));
}

function questionTypeVariants(types?: QuestionType[]) {
  const aliases: Record<string, string[]> = {
    single_correct: ["single_correct", "single correct", "single-correct", "single", "mcq", "MCQ", "Single Correct"],
    multiple_correct: ["multiple_correct", "multiple correct", "multi_correct", "multiple", "Multiple Correct"],
    integer: ["integer", "Integer", "integer_type", "integer-type"],
    numerical: ["numerical", "numeric", "Numerical"],
  };
  return uniq((types ?? []).flatMap((t) => aliases[t] ?? labelVariants(t)));
}

function normalizeDifficulty(value: unknown): Difficulty {
  const v = String(value ?? "Medium").toLowerCase();
  if (v.includes("easy")) return "Easy";
  if (v.includes("hard")) return "Hard";
  return "Medium";
}

function normalizeQuestionType(value: unknown): QuestionType {
  const v = String(value ?? "single_correct").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  if (v.includes("multiple")) return "multiple_correct";
  if (v.includes("integer")) return "integer";
  if (v.includes("numeric") || v.includes("numerical")) return "numerical";
  if (v.includes("assertion")) return "assertion_reason";
  if (v.includes("match")) return "match_following";
  if (v.includes("statement")) return "statement_based";
  if (v.includes("matrix")) return "matrix_match";
  if (v.includes("paragraph")) return "paragraph";
  return "single_correct";
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") return value.split(/[|,]/).map((v) => v.trim()).filter(Boolean);
  return [];
}

function normalizeQuestionRow(row: Record<string, unknown>): DbQuestion {
  return {
    id: String(row.id),
    exams: asStringArray(row.exams),
    class_level: Number(row.class_level) === 12 ? 12 : 11,
    subject: String(row.subject ?? "General"),
    chapter: String(row.chapter ?? "General"),
    topic: row.topic ? String(row.topic) : null,
    subtopic: row.subtopic ? String(row.subtopic) : null,
    ncert_unit: row.ncert_unit ? String(row.ncert_unit) : null,
    difficulty: normalizeDifficulty(row.difficulty),
    question_type: normalizeQuestionType(row.question_type),
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    source: row.source ? String(row.source) : null,
    is_pyq: Boolean(row.is_pyq),
    is_ncert: Boolean(row.is_ncert),
    marks: Number(row.marks ?? 4),
    negative_marks: Number(row.negative_marks ?? 0),
    time_estimate_seconds: Number(row.time_estimate_seconds ?? 90),
    question_text: String(row.question_text ?? ""),
    options: Array.isArray(row.options) ? row.options.map(String) : null,
    correct_answer: row.correct_answer as CorrectAnswer,
    solution: row.solution ? String(row.solution) : null,
    explanation: row.explanation ? String(row.explanation) : null,
    concepts: asStringArray(row.concepts),
    tags: asStringArray(row.tags),
    external_id: row.external_id ? String(row.external_id) : null,
  };
}

function applyQuestionFilters(query: any, f: QuestionFilters) {
  let q = query;
  const exams = examVariants(f.exams);
  const subjects = subjectVariants(f.subjects);
  const chapters = uniq((f.chapters ?? []).flatMap(labelVariants));
  const difficulties = difficultyVariants(f.difficulties);
  const questionTypes = questionTypeVariants(f.questionTypes);
  if (exams.length) q = q.overlaps("exams", exams);
  if (f.classLevels?.length) q = q.in("class_level", f.classLevels);
  if (subjects.length) q = q.in("subject", subjects);
  if (chapters.length) q = q.in("chapter", chapters);
  if (f.topics?.length) q = q.in("topic", uniq(f.topics.flatMap(labelVariants)));
  if (difficulties.length) q = q.in("difficulty", difficulties);
  if (questionTypes.length) q = q.in("question_type", questionTypes);
  if (f.pyqOnly) q = q.eq("is_pyq", true);
  if (f.ncertOnly) q = q.eq("is_ncert", true);
  if (f.yearFrom) q = q.gte("year", f.yearFrom);
  if (f.yearTo) q = q.lte("year", f.yearTo);
  return q;
}

async function runWithRetry<T>(label: string, action: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      console.warn(`${QUESTION_BANK_LOG} ${label} failed`, { attempt: attempt + 1, error });
      if (attempt < retries) await wait(350 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function countQuestionBank(): Promise<number> {
  return runWithRetry("total-count", async () => {
    const { count, error } = await supabase.from("questions").select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  });
}

/** Fetch questions matching filters. Uses a random sample by shuffling client-side after a capped fetch. */
export async function fetchQuestions(f: QuestionFilters): Promise<DbQuestion[]> {
  // Fetch up to 5x requested for randomness, then shuffle & slice.
  const cap = Math.max(f.count * 5, 100);
  const rows = await runWithRetry("filtered-fetch", async () => {
    const query = applyQuestionFilters(supabase.from("questions").select("*"), f).limit(cap);
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(normalizeQuestionRow);
  });
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, f.count);
}

export async function fetchQuestionsWithRelaxation(f: QuestionFilters): Promise<RelaxedQuestionFetchResult> {
  const totalQuestions = await countQuestionBank();
  const stages: { stage: string; filters: QuestionFilters }[] = [
    { stage: "exact filters", filters: f },
    { stage: "relaxed difficulty", filters: { ...f, difficulties: undefined } },
    { stage: "relaxed question type", filters: { ...f, difficulties: undefined, questionTypes: undefined } },
    { stage: "relaxed chapter", filters: { ...f, difficulties: undefined, questionTypes: undefined, chapters: undefined } },
    { stage: "relaxed subject", filters: { ...f, difficulties: undefined, questionTypes: undefined, chapters: undefined, subjects: undefined } },
  ];
  const attempts: QuestionFetchAttempt[] = [];

  for (const stage of stages) {
    try {
      const questions = await fetchQuestions(stage.filters);
      const attempt = { stage: stage.stage, filters: stage.filters, found: questions.length };
      attempts.push(attempt);
      console.info(`${QUESTION_BANK_LOG} Supabase query result`, {
        totalQuestions,
        appliedFilters: stage.filters,
        foundAfterFiltering: questions.length,
        sampleQuestionIds: questions.slice(0, 5).map((q) => q.id),
      });
      if (questions.length > 0) {
        return { questions, totalQuestions, attempts, relaxedStage: stage.stage === "exact filters" ? null : stage.stage };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error";
      attempts.push({ stage: stage.stage, filters: stage.filters, found: 0, error: message });
      console.error(`${QUESTION_BANK_LOG} failed database query`, { stage: stage.stage, appliedFilters: stage.filters, error });
    }
  }

  return { questions: [], totalQuestions, attempts, relaxedStage: null };
}

export async function fetchChapterCounts(f: Pick<QuestionFilters, "exams" | "classLevels">): Promise<Record<string, Record<string, number>>> {
  return runWithRetry("chapter-counts", async () => {
    const query = applyQuestionFilters(supabase.from("questions").select("subject, chapter"), { ...f, count: 10000 }).limit(10000);
    const { data, error } = await query;
    if (error) throw error;
    const next: Record<string, Record<string, number>> = {};
    (data ?? []).forEach((row: { subject: string | null; chapter: string | null }) => {
      const subject = row.subject ?? "General";
      const chapter = row.chapter ?? "General";
      next[subject] ??= {};
      next[subject][chapter] = (next[subject][chapter] ?? 0) + 1;
    });
    console.info(`${QUESTION_BANK_LOG} chapter count query result`, {
      appliedFilters: f,
      subjectCount: Object.keys(next).length,
      totalQuestions: Object.values(next).reduce((sum, chapters) => sum + Object.values(chapters).reduce((a, b) => a + b, 0), 0),
    });
    return next;
  });
}

/** Distinct chapter list for a subject (from the DB, so admin-added chapters flow through). */
export async function fetchChapters(subject: string, classLevels?: (11 | 12)[]): Promise<string[]> {
  let q = supabase.from("questions").select("chapter").eq("subject", subject);
  if (classLevels?.length) q = q.in("class_level", classLevels);
  const { data, error } = await q.limit(2000);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.chapter as string))].sort();
}

export async function fetchSubjectStats(): Promise<{ subject: string; count: number }[]> {
  // Approximation: pull subjects then group
  const { data, error } = await supabase.from("questions").select("subject").limit(10000);
  if (error) throw error;
  const map = new Map<string, number>();
  (data ?? []).forEach((r) => map.set(r.subject as string, (map.get(r.subject as string) ?? 0) + 1));
  return [...map.entries()].map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count);
}

export function isCorrect(q: DbQuestion, userAnswer: unknown): boolean {
  const ca = q.correct_answer;
  if (!ca) return false;
  if (ca.type === "single") return Number(userAnswer) === ca.value;
  if (ca.type === "multiple") {
    const arr = Array.isArray(userAnswer) ? (userAnswer as number[]).slice().sort() : [];
    const target = ca.values.slice().sort();
    return arr.length === target.length && arr.every((v, i) => v === target[i]);
  }
  if (ca.type === "numeric") {
    const n = Number(userAnswer);
    if (Number.isNaN(n)) return false;
    return Math.abs(n - ca.value) <= (ca.tolerance ?? 0.01);
  }
  if (ca.type === "text") return String(userAnswer).trim().toLowerCase() === ca.value.trim().toLowerCase();
  return false;
}

export async function isAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return false;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
  return !!data;
}
