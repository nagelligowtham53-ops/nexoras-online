import { supabase } from "@/integrations/supabase/client";
import type { DbQuestion, Difficulty, QuestionType } from "@/lib/questions";

/**
 * Syllabus + practice selection layer.
 *
 * Everything here filters on STABLE IDS (chapter_id) resolved from the
 * public.syllabus_chapters table — no fuzzy string matching. Counts come from
 * server-side aggregation RPCs so the number a student sees is exactly the
 * number of rows in the database.
 */

export type ExamCode = "JEE Main" | "JEE Advanced" | "NEET";

export type SourceType =
  | "previous_year"
  | "official_exam"
  | "licensed_bank"
  | "ncert_based"
  | "original_practice";

export const SOURCE_LABELS: Record<SourceType, string> = {
  previous_year: "Previous Year Question",
  official_exam: "Official Exam Question",
  licensed_bank: "Licensed Question Bank",
  ncert_based: "NCERT-based Practice",
  original_practice: "Original Practice Question",
};

export type SyllabusChapter = {
  chapterId: string;
  subject: string;
  classLevel: 11 | 12;
  name: string;
  total: number;
  pyq: number;
  ncert: number;
  original: number;
  easy: number;
  medium: number;
  hard: number;
};

export type PracticeSelection = {
  exam: ExamCode;
  classLevels?: (11 | 12)[];
  chapterIds?: string[];
  subjects?: string[];
  difficulties?: Difficulty[];
  sourceTypes?: SourceType[];
  questionTypes?: QuestionType[];
};

const LOG = "[syllabus]";

type RpcRow = Record<string, unknown>;

function rpc(name: string, args: Record<string, unknown>) {
  // Generated Supabase types don't yet include these RPCs.
  return (supabase.rpc as unknown as (n: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(name, args);
}

function selectionArgs(sel: PracticeSelection) {
  return {
    p_exam: sel.exam,
    p_classes: sel.classLevels?.length ? sel.classLevels : null,
    p_chapter_ids: sel.chapterIds?.length ? sel.chapterIds : null,
    p_subjects: sel.subjects?.length ? sel.subjects : null,
    p_difficulties: sel.difficulties?.length ? sel.difficulties : null,
    p_source_types: sel.sourceTypes?.length ? sel.sourceTypes : null,
    p_question_types: sel.questionTypes?.length ? sel.questionTypes : null,
  };
}

/** Official chapter list for an exam/class, each with its real question counts. */
export async function fetchSyllabusChapters(
  exam: ExamCode,
  classLevels?: (11 | 12)[],
): Promise<SyllabusChapter[]> {
  const { data, error } = await rpc("exam_chapter_counts", {
    p_exam: exam,
    p_classes: classLevels?.length ? classLevels : null,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as RpcRow[]).map((row) => ({
    chapterId: String(row.chapter_id),
    subject: String(row.subject),
    classLevel: Number(row.class_level) === 12 ? 12 : 11,
    name: String(row.chapter_name),
    total: Number(row.total ?? 0),
    pyq: Number(row.pyq ?? 0),
    ncert: Number(row.ncert ?? 0),
    original: Number(row.original ?? 0),
    easy: Number(row.easy ?? 0),
    medium: Number(row.medium ?? 0),
    hard: Number(row.hard ?? 0),
  }));
}

/** Group chapters by subject, preserving syllabus order. */
export function groupBySubject(chapters: SyllabusChapter[]): Record<string, SyllabusChapter[]> {
  const out: Record<string, SyllabusChapter[]> = {};
  for (const c of chapters) {
    out[c.subject] ??= [];
    out[c.subject].push(c);
  }
  return out;
}

/** Exact count of questions matching a selection. Never an approximation. */
export async function practiceAvailability(sel: PracticeSelection): Promise<number> {
  const { data, error } = await rpc("practice_availability", selectionArgs(sel));
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

/** Random sample of exactly `limit` questions (or all that exist, if fewer). */
export async function fetchPracticeQuestions(
  sel: PracticeSelection,
  limit: number,
): Promise<DbQuestion[]> {
  const { data, error } = await rpc("practice_questions", { ...selectionArgs(sel), p_limit: limit });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as RpcRow[];
  console.info(`${LOG} practice_questions`, { selection: sel, requested: limit, returned: rows.length });
  return rows.map((row) => ({
    id: String(row.id),
    exams: Array.isArray(row.exams) ? (row.exams as unknown[]).map(String) : [],
    class_level: Number(row.class_level) === 12 ? 12 : 11,
    subject: String(row.subject ?? ""),
    chapter: String(row.chapter ?? ""),
    topic: row.topic ? String(row.topic) : null,
    subtopic: row.subtopic ? String(row.subtopic) : null,
    ncert_unit: row.ncert_unit ? String(row.ncert_unit) : null,
    difficulty: (row.difficulty as Difficulty) ?? "Medium",
    question_type: (row.question_type as QuestionType) ?? "single_correct",
    year: row.year === null || row.year === undefined ? null : Number(row.year),
    source: row.source ? String(row.source) : null,
    is_pyq: Boolean(row.is_pyq),
    is_ncert: Boolean(row.is_ncert),
    marks: Number(row.marks ?? 4),
    negative_marks: Number(row.negative_marks ?? 0),
    time_estimate_seconds: Number(row.time_estimate_seconds ?? 90),
    question_text: String(row.question_text ?? ""),
    options: Array.isArray(row.options) ? (row.options as unknown[]).map(String) : null,
    concepts: Array.isArray(row.concepts) ? (row.concepts as unknown[]).map(String) : [],
    tags: Array.isArray(row.tags) ? (row.tags as unknown[]).map(String) : [],
    external_id: row.external_id ? String(row.external_id) : null,
    source_type: (row.source_type as SourceType) ?? "original_practice",
  }));
}

export type BankHealth = Record<string, number>;

export async function fetchBankHealth(): Promise<BankHealth> {
  const { data, error } = await rpc("admin_question_bank_health", {});
  if (error) throw new Error(error.message);
  return (data ?? {}) as BankHealth;
}

export type ChapterHealthRow = {
  chapterId: string;
  chapterName: string;
  subject: string;
  classLevel: 11 | 12;
  jeeMain: number;
  jeeAdvanced: number;
  neet: number;
  pyq: number;
  ncert: number;
  original: number;
  total: number;
};

export async function fetchChapterHealth(): Promise<ChapterHealthRow[]> {
  const { data, error } = await rpc("admin_chapter_health", {});
  if (error) throw new Error(error.message);
  return ((data ?? []) as RpcRow[]).map((row) => ({
    chapterId: String(row.chapter_id),
    chapterName: String(row.chapter_name),
    subject: String(row.subject),
    classLevel: Number(row.class_level) === 12 ? 12 : 11,
    jeeMain: Number(row.jee_main ?? 0),
    jeeAdvanced: Number(row.jee_advanced ?? 0),
    neet: Number(row.neet ?? 0),
    pyq: Number(row.pyq ?? 0),
    ncert: Number(row.ncert ?? 0),
    original: Number(row.original ?? 0),
    total: Number(row.total ?? 0),
  }));
}
