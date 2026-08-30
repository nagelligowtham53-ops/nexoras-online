/**
 * THE single authoritative answer-evaluation entry point for every exam surface.
 *
 * No component may compute correctness or marks on its own. Screens call
 * `evaluateTest` once at submission time, store the returned immutable
 * `Submission[]`, and render only those values.
 *
 * Invariants enforced here (each one is covered by a test):
 *  1. Correctness is decided before marks — a correct answer can never be
 *     penalised.
 *  2. An unattempted question scores exactly the configured unattempted marks
 *     (0 by default).
 *  3. When the server answer key is unavailable, the question is `graded: false`
 *     and scores 0. It is NEVER assumed wrong. This is the exact defect that
 *     produced negative marks on correct answers.
 *  4. Comparison uses canonical answer identity (stable option ids / indices),
 *     never displayed option text or display order, so shuffling options cannot
 *     change the verdict.
 */

import {
  scoreSubmission,
  summarizeResult,
  type CorrectKey,
  type MarkingScheme,
  type ResultSummary,
  type Submission,
} from "./scoring";

/** Marking rules for one exam/paper. Never assume +4/-1. */
export type ExamMarkingScheme = MarkingScheme & {
  /** Marks for leaving a question unattempted. Officially 0 for every Indian CBT. */
  unattempted?: number;
};

/** Option as stored: a stable id that survives display shuffling. */
export type StableOption = { id: string; text: string };

export type EvaluableQuestion = {
  /** Question-bank id. Absent for offline demo items. */
  id: string;
  question_type: string;
  subject?: string;
  chapter?: string;
  chapter_id?: string | null;
  concept_id?: string | null;
  difficulty?: string;
  /** Options in display order, carrying their original stable ids. */
  options?: StableOption[];
  /** Per-question override of the exam scheme (JEE Advanced numericals differ). */
  marking?: ExamMarkingScheme;
  /**
   * Answer key known client-side. Only ever set for offline demo content —
   * bank-backed questions receive their key from the server after submission.
   */
  local_key?: CorrectKey | null;
};

export type ServerGrade = {
  question_id: string;
  correct_answer: unknown;
  solution?: string | null;
  explanation?: string | null;
};

export type EvaluateInput = {
  test_id: string;
  marking: ExamMarkingScheme;
  questions: EvaluableQuestion[];
  /** Selected value per question, in the same order as `questions`. */
  answers: unknown[];
  /** Server answer keys, indexed by question id. Partial is fine. */
  grades?: Record<string, ServerGrade | undefined>;
  timePerQuestion?: number[];
  markedForReview?: boolean[];
};

export type EvaluationResult = {
  submissions: Submission[];
  summary: ResultSummary;
  /** Attempted questions the server could not grade. Shown honestly, never as wrong. */
  ungraded_ids: string[];
};

/** Coerces whatever the database returned into a canonical key, or null. */
export function toCorrectKey(raw: unknown): CorrectKey | null {
  if (raw === null || raw === undefined) return null;
  const o = raw as Record<string, unknown>;
  const type = String(o["type"] ?? "");
  if (type === "single" && (typeof o["value"] === "number" || typeof o["value"] === "string")) {
    return { type: "single", value: o["value"] as number | string };
  }
  if (type === "multiple" && Array.isArray(o["values"])) {
    return { type: "multiple", values: (o["values"] as unknown[]).map((v) => v as number | string) };
  }
  if (type === "numeric") {
    const n = Number(o["value"]);
    if (!Number.isFinite(n)) return null;
    const tol = Number(o["tolerance"]);
    return { type: "numeric", value: n, ...(Number.isFinite(tol) ? { tolerance: tol } : {}) };
  }
  if (type === "text" && o["value"] !== undefined) {
    return { type: "text", value: String(o["value"]) };
  }
  return null;
}

/**
 * Maps a selection made against the *displayed* options back onto the stable
 * option id the answer key uses. Display order is irrelevant to the verdict.
 */
export function resolveSelection(q: EvaluableQuestion, selected: unknown): unknown {
  if (selected === null || selected === undefined || selected === "") return null;
  const opts = q.options;
  if (!opts || opts.length === 0) return selected;

  const mapOne = (value: unknown): unknown => {
    const raw = String(value).trim();
    if (raw === "") return null;
    // Already a stable id.
    const byId = opts.find((o) => o.id === raw);
    if (byId) return byId.id;
    // Display index (0-based) or letter label (A/a).
    let idx = -1;
    if (/^[0-9]+$/.test(raw)) idx = Number(raw);
    else if (/^[a-zA-Z]$/.test(raw)) idx = raw.toLowerCase().charCodeAt(0) - 97;
    if (idx >= 0 && idx < opts.length) return opts[idx].id;
    return raw;
  };

  if (Array.isArray(selected)) return selected.map(mapOne).filter((v) => v !== null);
  return mapOne(selected);
}

function schemeFor(q: EvaluableQuestion, base: ExamMarkingScheme): ExamMarkingScheme {
  return q.marking ?? base;
}

export function evaluateTest(input: EvaluateInput): EvaluationResult {
  const grades = input.grades ?? {};
  const ungraded_ids: string[] = [];

  const submissions = input.questions.map((q, i) => {
    const scheme = schemeFor(q, input.marking);
    const grade = grades[q.id];
    const key = grade ? toCorrectKey(grade.correct_answer) : (q.local_key ?? null);
    const selected = resolveSelection(q, input.answers[i]);

    const sub = scoreSubmission({
      question_id: q.id,
      test_id: input.test_id,
      question_order: i,
      question_type: q.question_type,
      selected,
      correct_key: key,
      marking: { positive: scheme.positive, negative: scheme.negative },
      marked_for_review: input.markedForReview?.[i] ?? false,
      time_spent_seconds: input.timePerQuestion?.[i] ?? 0,
      subject: q.subject,
      chapter: q.chapter,
      chapter_id: q.chapter_id ?? null,
      concept_id: q.concept_id ?? null,
      difficulty: q.difficulty,
      skill_type: q.question_type,
    });

    // Officially-configured unattempted marks (0 everywhere today, but never assumed).
    if (!sub.is_attempted && scheme.unattempted) {
      const u = Number(scheme.unattempted);
      sub.marks_awarded = u > 0 ? u : 0;
      sub.negative_marks = u < 0 ? u : 0;
      sub.final_marks = u;
    }

    if (sub.is_attempted && sub.is_correct === null) ungraded_ids.push(q.id);
    return sub;
  });

  return { submissions, summary: summarizeResult(submissions), ungraded_ids };
}

/** Marks arithmetic shown to the student, straight from the frozen submissions. */
export function markBreakdown(subs: Submission[]) {
  const correct = subs.filter((s) => s.is_correct === true);
  const wrong = subs.filter((s) => s.is_attempted && s.is_correct === false);
  const positive = correct.reduce((a, s) => a + s.marks_awarded, 0);
  const negative = wrong.reduce((a, s) => a + s.negative_marks, 0);
  return {
    correct: correct.length,
    wrong: wrong.length,
    unanswered: subs.filter((s) => !s.is_attempted).length,
    ungraded: subs.filter((s) => s.is_attempted && s.is_correct === null).length,
    positive_marks: positive,
    negative_marks: negative,
    final_score: positive + negative,
    max_score: subs.reduce((a, s) => a + s.positive_marks, 0),
  };
}

export type { Submission, ResultSummary };
