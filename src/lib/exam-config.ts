import { supabase } from "@/integrations/supabase/client";

/**
 * Exam configuration layer.
 *
 * Exam patterns (question count, duration, marking scheme, question types and
 * subject distribution) live in public.exam_configs — never hard-coded in the
 * UI. Each exam/paper has its own row, so JEE Main and JEE Advanced never
 * share settings.
 */

export type SubjectSlot = { name: string; count: number };

export type ExamConfig = {
  id: string;
  examKey: string;
  examName: string;
  examYear: number;
  paperName: string;
  /** Value stored in questions.exams for this exam, or null when unmapped. */
  dbExam: string | null;
  totalQuestions: number;
  durationMinutes: number;
  marksPerCorrect: number;
  negativeMarks: number;
  questionTypes: string[];
  subjectDistribution: SubjectSlot[];
  patternNote: string;
  difficultyProfile: string;
  active: boolean;
};

type Row = {
  id: string;
  exam_key: string;
  exam_name: string;
  exam_year: number;
  paper_name: string;
  db_exam: string | null;
  total_questions: number;
  duration_minutes: number;
  marks_per_correct: number | string;
  negative_marks: number | string;
  question_types: string[] | null;
  subject_distribution: unknown;
  pattern_note: string | null;
  difficulty_profile: string | null;
  active: boolean;
};

function toSlots(value: unknown): SubjectSlot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      const o = v as Record<string, unknown>;
      return { name: String(o?.name ?? ""), count: Number(o?.count ?? 0) };
    })
    .filter((s) => s.name && s.count > 0);
}

function mapRow(r: Row): ExamConfig {
  return {
    id: r.id,
    examKey: r.exam_key,
    examName: r.exam_name,
    examYear: r.exam_year,
    paperName: r.paper_name,
    dbExam: r.db_exam,
    totalQuestions: r.total_questions,
    durationMinutes: r.duration_minutes,
    marksPerCorrect: Number(r.marks_per_correct),
    negativeMarks: Number(r.negative_marks),
    questionTypes: r.question_types ?? ["single_correct"],
    subjectDistribution: toSlots(r.subject_distribution),
    patternNote: r.pattern_note ?? "",
    difficultyProfile: r.difficulty_profile ?? "mixed",
    active: r.active,
  };
}

/** All active configurations, newest exam year first. */
export async function fetchExamConfigs(): Promise<ExamConfig[]> {
  const { data, error } = await supabase
    .from("exam_configs" as never)
    .select("*")
    .eq("active", true)
    .order("exam_year", { ascending: false })
    .order("paper_name", { ascending: true });
  if (error) {
    console.error("[exam-config] failed to load exam configurations", error);
    throw new Error("Exam configurations could not be loaded from the database.");
  }
  return ((data ?? []) as unknown as Row[]).map(mapRow);
}

/** Papers available for an exam key (JEE Advanced returns Paper 1 and Paper 2). */
export function papersFor(configs: ExamConfig[], examKey: string): ExamConfig[] {
  const forKey = configs.filter((c) => c.examKey === examKey);
  if (forKey.length === 0) return [];
  const latestYear = Math.max(...forKey.map((c) => c.examYear));
  return forKey.filter((c) => c.examYear === latestYear);
}
