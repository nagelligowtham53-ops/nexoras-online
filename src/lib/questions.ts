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

/** Fetch questions matching filters. Uses a random sample by shuffling client-side after a capped fetch. */
export async function fetchQuestions(f: QuestionFilters): Promise<DbQuestion[]> {
  let q = supabase.from("questions").select("*");
  if (f.exams?.length) q = q.overlaps("exams", f.exams);
  if (f.classLevels?.length) q = q.in("class_level", f.classLevels);
  if (f.subjects?.length) q = q.in("subject", f.subjects);
  if (f.chapters?.length) q = q.in("chapter", f.chapters);
  if (f.topics?.length) q = q.in("topic", f.topics);
  if (f.difficulties?.length) q = q.in("difficulty", f.difficulties);
  if (f.questionTypes?.length) q = q.in("question_type", f.questionTypes);
  if (f.pyqOnly) q = q.eq("is_pyq", true);
  if (f.ncertOnly) q = q.eq("is_ncert", true);
  if (f.yearFrom) q = q.gte("year", f.yearFrom);
  if (f.yearTo) q = q.lte("year", f.yearTo);

  // Fetch up to 5x requested for randomness, then shuffle & slice.
  const cap = Math.max(f.count * 5, 100);
  const { data, error } = await q.limit(cap);
  if (error) throw error;
  const rows = (data ?? []) as DbQuestion[];
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, f.count);
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
