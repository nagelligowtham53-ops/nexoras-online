/**
 * Canonical scoring pipeline.
 *
 * Rules that must never be violated:
 *  1. Correctness is decided FIRST, marks are derived SECOND.
 *  2. A correct answer can never receive negative marks.
 *  3. An unattempted question always scores exactly 0.
 *  4. If the answer key is unavailable (grading failed / question missing),
 *     the question is recorded as `graded: false` and scores 0 — it is NEVER
 *     treated as wrong, because that is what produced negative marks on
 *     correct answers.
 *  5. Comparison happens on canonical answer IDs/indices, never on displayed
 *     option text.
 */

export type CorrectKey =
  | { type: "single"; value: number | string }
  | { type: "multiple"; values: (number | string)[] }
  | { type: "numeric"; value: number; tolerance?: number }
  | { type: "text"; value: string };

export type MarkingScheme = {
  /** Marks for a correct answer. Always applied as a positive number. */
  positive: number;
  /** Penalty magnitude for a wrong answer. Stored/applied as a negative. */
  negative: number;
};

export type SubmissionInput = {
  question_id: string;
  test_id: string;
  question_order: number;
  question_type: string;
  /** Raw value captured from the UI. */
  selected: unknown;
  /** Canonical key from the server. `null`/`undefined` = not graded. */
  correct_key?: CorrectKey | null;
  marking: MarkingScheme;
  marked_for_review?: boolean;
  time_spent_seconds?: number;
  subject?: string;
  chapter?: string;
  chapter_id?: string | null;
  concept_id?: string | null;
  difficulty?: string;
  skill_type?: string | null;
};

export type Submission = {
  question_id: string;
  test_id: string;
  question_order: number;
  question_type: string;
  selected_option: string | null;
  correct_option: string | null;
  is_attempted: boolean;
  /** null = key unavailable, deliberately not counted as wrong. */
  is_correct: boolean | null;
  graded: boolean;
  marked_for_review: boolean;
  positive_marks: number;
  negative_marks: number;
  marks_awarded: number;
  final_marks: number;
  time_spent_seconds: number;
  subject: string;
  chapter: string;
  chapter_id: string | null;
  concept_id: string | null;
  difficulty: string;
  skill_type: string | null;
};

const NUMERIC_TOLERANCE = 0.01;

/** "A" | "a" | 0 | "0" all collapse to the same canonical token. */
export function normalizeChoice(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return null;
  const raw = String(value).trim();
  if (raw === "") return null;
  if (/^[0-9]+$/.test(raw)) return String(Number(raw));
  if (/^[a-zA-Z]$/.test(raw)) {
    // Letter labels map onto zero-based indices: A/a -> 0, B/b -> 1 …
    return String(raw.toLowerCase().charCodeAt(0) - 97);
  }
  return raw.toLowerCase().replace(/\s+/g, " ");
}

function normalizeNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toLowerCase().replace(/\s+/g, " ");
  return s === "" ? null : s;
}

/** Human-readable representation of the stored key, for the review screen. */
export function describeKey(key: CorrectKey | null | undefined): string | null {
  if (!key) return null;
  if (key.type === "single") return normalizeChoice(key.value);
  if (key.type === "multiple") return key.values.map((v) => normalizeChoice(v)).filter(Boolean).sort().join(",");
  if (key.type === "numeric") return String(key.value);
  return normalizeText(key.value);
}

/**
 * Decides correctness. Returns `null` when there is no usable key, so callers
 * can distinguish "wrong" from "not gradable".
 */
export function isAnswerCorrect(selected: unknown, key: CorrectKey | null | undefined): boolean | null {
  if (!key) return null;
  switch (key.type) {
    case "single": {
      const a = normalizeChoice(selected);
      const b = normalizeChoice(key.value);
      if (a === null || b === null) return a === null ? false : null;
      return a === b;
    }
    case "multiple": {
      const a = Array.isArray(selected)
        ? selected.map(normalizeChoice).filter((v): v is string => v !== null)
        : String(selected ?? "")
            .split(/[,\s]+/)
            .map(normalizeChoice)
            .filter((v): v is string => v !== null);
      const b = key.values.map(normalizeChoice).filter((v): v is string => v !== null);
      if (a.length === 0) return false;
      if (b.length === 0) return null;
      const sa = [...new Set(a)].sort();
      const sb = [...new Set(b)].sort();
      return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
    }
    case "numeric": {
      const a = normalizeNumeric(selected);
      const b = normalizeNumeric(key.value);
      if (a === null) return false;
      if (b === null) return null;
      const tol = key.tolerance ?? NUMERIC_TOLERANCE;
      return Math.abs(a - b) <= Math.abs(tol);
    }
    case "text": {
      const a = normalizeText(selected);
      const b = normalizeText(key.value);
      if (a === null) return false;
      if (b === null) return null;
      return a === b;
    }
    default:
      return null;
  }
}

export function isAttempted(selected: unknown): boolean {
  if (Array.isArray(selected)) return selected.length > 0;
  return normalizeChoice(selected) !== null || normalizeNumeric(selected) !== null;
}

/** Builds the immutable record stored for a question. Correctness first, marks second. */
export function scoreSubmission(input: SubmissionInput): Submission {
  const positive = Math.abs(Number(input.marking.positive) || 0);
  const penalty = Math.abs(Number(input.marking.negative) || 0);
  const attempted = isAttempted(input.selected);
  const correctness = attempted ? isAnswerCorrect(input.selected, input.correct_key) : null;

  let marks_awarded = 0;
  let negative_marks = 0;

  if (attempted && correctness === true) {
    marks_awarded = positive;
    negative_marks = 0;
  } else if (attempted && correctness === false) {
    marks_awarded = 0;
    negative_marks = -penalty;
  }
  // attempted but ungradable, or unattempted -> both stay 0.

  const selectedToken = Array.isArray(input.selected)
    ? input.selected.map(normalizeChoice).filter(Boolean).sort().join(",") || null
    : normalizeChoice(input.selected) ?? (normalizeNumeric(input.selected) !== null ? String(normalizeNumeric(input.selected)) : null);

  return {
    question_id: input.question_id,
    test_id: input.test_id,
    question_order: input.question_order,
    question_type: input.question_type,
    selected_option: attempted ? selectedToken : null,
    correct_option: describeKey(input.correct_key),
    is_attempted: attempted,
    is_correct: correctness,
    graded: correctness !== null || !attempted,
    marked_for_review: Boolean(input.marked_for_review),
    positive_marks: positive,
    negative_marks,
    marks_awarded,
    final_marks: marks_awarded + negative_marks,
    time_spent_seconds: Math.max(0, Math.round(Number(input.time_spent_seconds ?? 0))),
    subject: input.subject ?? "General",
    chapter: input.chapter ?? "General",
    chapter_id: input.chapter_id ?? null,
    concept_id: input.concept_id ?? null,
    difficulty: input.difficulty ?? "Medium",
    skill_type: input.skill_type ?? null,
  };
}

export type Bucket = { label: string; total: number; attempted: number; correct: number; wrong: number; marks: number; accuracy: number; time: number };

function bucketize(subs: Submission[], keyOf: (s: Submission) => string): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const s of subs) {
    const label = keyOf(s) || "Unclassified";
    const b = map.get(label) ?? { label, total: 0, attempted: 0, correct: 0, wrong: 0, marks: 0, accuracy: 0, time: 0 };
    b.total += 1;
    b.time += s.time_spent_seconds;
    if (s.is_attempted) b.attempted += 1;
    if (s.is_correct === true) b.correct += 1;
    if (s.is_attempted && s.is_correct === false) b.wrong += 1;
    b.marks += s.final_marks;
    map.set(label, b);
  }
  for (const b of map.values()) b.accuracy = b.attempted ? Math.round((b.correct / b.attempted) * 100) : 0;
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export type ResultSummary = {
  total: number;
  attempted: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  ungraded: number;
  score: number;
  max_score: number;
  percent: number;
  accuracy: number;
  time_used: number;
  avg_time_per_question: number;
  bySubject: Bucket[];
  byChapter: Bucket[];
  byConcept: Bucket[];
  byDifficulty: Bucket[];
  byQuestionType: Bucket[];
};

/** Result page reads this — derived purely from the stored submissions. */
export function summarizeResult(subs: Submission[]): ResultSummary {
  const total = subs.length;
  const attempted = subs.filter((s) => s.is_attempted).length;
  const correct = subs.filter((s) => s.is_correct === true).length;
  const incorrect = subs.filter((s) => s.is_attempted && s.is_correct === false).length;
  const ungraded = subs.filter((s) => s.is_attempted && s.is_correct === null).length;
  const score = subs.reduce((a, s) => a + s.final_marks, 0);
  const max_score = subs.reduce((a, s) => a + s.positive_marks, 0);
  const time_used = subs.reduce((a, s) => a + s.time_spent_seconds, 0);
  return {
    total,
    attempted,
    unanswered: total - attempted,
    correct,
    incorrect,
    ungraded,
    score,
    max_score,
    percent: max_score > 0 ? Math.round((score / max_score) * 100) : 0,
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 0,
    time_used,
    avg_time_per_question: total ? Math.round(time_used / total) : 0,
    bySubject: bucketize(subs, (s) => s.subject),
    byChapter: bucketize(subs, (s) => s.chapter),
    byConcept: bucketize(subs, (s) => s.concept_id ?? ""),
    byDifficulty: bucketize(subs, (s) => s.difficulty),
    byQuestionType: bucketize(subs, (s) => s.question_type),
  };
}
