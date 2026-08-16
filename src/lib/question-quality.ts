/**
 * Question quality, fingerprinting, concept diversity and constrained
 * test selection. Pure functions so they can be unit-tested and reused by
 * both the mock-test generator and custom practice.
 */

export type QualityCandidate = {
  id: string;
  subject: string;
  chapter: string;
  chapter_id?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  concepts?: string[];
  category?: string | null;
  class_level?: number;
  difficulty: string;
  question_type: string;
  question_text: string;
  options?: string[] | null;
  source_type?: string | null;
  year?: number | null;
  is_pyq?: boolean;
};

/* ------------------------------ normalisation ----------------------------- */

const STOP = new Set([
  "a","an","the","of","is","are","was","were","be","to","in","on","at","for","and","or","if","then","that","this",
  "it","its","as","with","by","from","which","what","find","calculate","determine","given","value","following",
  "will","can","does","do","has","have","when","where","how","let","consider","shown","figure","below",
]);

/** Collapses formatting, numbers and LaTeX noise so two rewordings converge. */
export function normalizeQuestionText(text: string): string {
  return String(text ?? "")
    .toLowerCase()
    .replace(/\$[^$]*\$/g, " ")
    .replace(/\\[a-z]+/g, " ")
    .replace(/[0-9]+(\.[0-9]+)?/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable, deterministic 32-bit fingerprint over the normalised stem + options. */
export function questionFingerprint(c: Pick<QualityCandidate, "question_text" | "options">): string {
  const opts = (c.options ?? []).map((o) => normalizeQuestionText(String(o))).sort().join("|");
  const basis = `${normalizeQuestionText(c.question_text)}#${opts}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < basis.length; i++) {
    const ch = basis.charCodeAt(i);
    h1 = (h1 ^ ch) * 0x01000193 >>> 0;
    h2 = (h2 + ch * 31 + (h2 << 5)) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

function contentTokens(text: string): Set<string> {
  return new Set(normalizeQuestionText(text).split(" ").filter((t) => t.length > 2 && !STOP.has(t)));
}

/** Jaccard similarity over content words — 1 = identical problem wording. */
export function similarity(a: string, b: string): number {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

export const NEAR_DUPLICATE_THRESHOLD = 0.62;

export function isNearDuplicate(a: string, b: string, threshold = NEAR_DUPLICATE_THRESHOLD): boolean {
  return similarity(a, b) >= threshold;
}

/** Concept key: explicit concept tag, else subtopic/topic/chapter + category. */
export function conceptKey(c: QualityCandidate): string {
  const tag = (c.concepts ?? []).find((v) => v && v.trim().length > 0);
  const scope = tag ?? c.subtopic ?? c.topic ?? c.chapter ?? "general";
  const slug = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
  return `${slug(c.subject.slice(0, 3))}_${slug(scope)}_${slug(c.category ?? c.question_type)}`;
}

/* -------------------------------- quality gate ---------------------------- */

const REJECT_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /what is (jee|neet|nta|cbt|the exam|this exam)/i, reason: "exam_trivia" },
  { re: /full form of|who conducts|exam pattern|how many attempts|eligibility criteria/i, reason: "exam_trivia" },
  { re: /·\s*q[0-9]+\s*:/i, reason: "template_stem" },
  { re: /(learning objective|purpose of this chapter|about this topic\?|exam.?ready approach|revising this chapter)/i, reason: "generic_filler" },
  { re: /^\s*(what is|define|state)\s+(the\s+)?(definition|meaning|si unit)\b/i, reason: "pure_definition" },
  { re: /coming soon|placeholder|lorem ipsum|todo/i, reason: "placeholder" },
];

const DEFINITION_ONLY = /^\s*(what is|define|state|name)\b/i;

export type RejectReason =
  | "too_short" | "exam_trivia" | "template_stem" | "generic_filler" | "pure_definition"
  | "placeholder" | "missing_options" | "duplicate_options" | "empty_option"
  | "missing_chapter" | "too_easy_for_difficulty";

/** Returns null when the question is publishable, else a machine reason. */
export function rejectReason(
  c: QualityCandidate,
  opts: { requireCompetitiveLevel?: boolean } = {},
): RejectReason | null {
  const text = String(c.question_text ?? "").trim();
  if (text.length < 25) return "too_short";
  for (const p of REJECT_PATTERNS) if (p.re.test(text)) return p.reason as RejectReason;
  if (!c.subject || !c.chapter) return "missing_chapter";

  const objective = ["single_correct", "multiple_correct", "assertion_reason", "statement_based"].includes(
    String(c.question_type),
  );
  if (objective) {
    const options = (c.options ?? []).map((o) => String(o ?? "").trim());
    if (options.length < 4) return "missing_options";
    if (options.some((o) => o.length === 0)) return "empty_option";
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) return "duplicate_options";
  }

  if (opts.requireCompetitiveLevel) {
    // JEE-Main mode: reject one-line recall questions.
    const words = text.split(/\s+/).length;
    if (DEFINITION_ONLY.test(text) && words < 18) return "too_easy_for_difficulty";
    if (words < 10) return "too_easy_for_difficulty";
  }
  return null;
}

/* --------------------------- difficulty distribution ---------------------- */

export type DifficultyTier = "Easy" | "Moderate" | "JEE Main" | "Hard";

/** Maps the stored difficulty values onto the four practice tiers. */
export function difficultyTier(c: QualityCandidate): DifficultyTier {
  const d = String(c.difficulty ?? "").toLowerCase();
  const cat = String(c.category ?? "").toLowerCase();
  if (d.includes("easy")) return "Easy";
  if (d.includes("advanced")) return "Hard";
  if (d.includes("hard")) return "Hard";
  if (["numerical", "application", "critical_thinking", "graph"].includes(cat)) return "JEE Main";
  return "Moderate";
}

export type DifficultyChoiceV2 = "mixed" | "easy" | "moderate" | "jee_main" | "hard";

const MIXED_MIX: Record<DifficultyTier, number> = {
  Easy: 0.18,
  Moderate: 0.37,
  "JEE Main": 0.32,
  Hard: 0.13,
};

export function targetDifficultyMix(choice: DifficultyChoiceV2, total: number): Record<DifficultyTier, number> {
  const out: Record<DifficultyTier, number> = { Easy: 0, Moderate: 0, "JEE Main": 0, Hard: 0 };
  if (choice === "mixed") {
    let assigned = 0;
    const tiers: DifficultyTier[] = ["Easy", "Moderate", "JEE Main", "Hard"];
    tiers.forEach((t, i) => {
      const n = i === tiers.length - 1 ? total - assigned : Math.round(total * MIXED_MIX[t]);
      out[t] = Math.max(0, n);
      assigned += out[t];
    });
    return out;
  }
  const map: Record<Exclude<DifficultyChoiceV2, "mixed">, DifficultyTier> = {
    easy: "Easy",
    moderate: "Moderate",
    jee_main: "JEE Main",
    hard: "Hard",
  };
  out[map[choice]] = total;
  return out;
}

/* ---------------------------- constrained selection ----------------------- */

export type SelectionOptions = {
  total: number;
  difficulty: DifficultyChoiceV2;
  /** question ids the user has recently seen — deprioritised, not banned. */
  recentIds?: Set<string>;
  /** concept keys the user practised recently — deprioritised. */
  recentConcepts?: Set<string>;
  /** hard cap of questions sharing one concept in a single test. */
  maxPerConcept?: number;
  requireCompetitiveLevel?: boolean;
};

export type SelectionResult = {
  picked: QualityCandidate[];
  rejected: Record<string, number>;
  /** true when constraints had to be relaxed to reach the target size. */
  relaxed: string[];
};

function conceptCapFor(total: number, explicit?: number): number {
  if (explicit && explicit > 0) return explicit;
  return Math.max(2, Math.ceil(total / 8));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Constrained selection: quality gate -> exact fingerprint dedupe ->
 * near-duplicate rejection -> concept cap -> difficulty quota -> freshness.
 * Constraints are relaxed in the least-important order only when required,
 * and never by repeating a question.
 */
export function selectQuestions(candidates: QualityCandidate[], opts: SelectionOptions): SelectionResult {
  const rejected: Record<string, number> = {};
  const bump = (k: string) => { rejected[k] = (rejected[k] ?? 0) + 1; };

  // 1. Quality gate + exact fingerprint dedupe.
  const seenFp = new Set<string>();
  const clean: QualityCandidate[] = [];
  for (const c of candidates) {
    const reason = rejectReason(c, { requireCompetitiveLevel: opts.requireCompetitiveLevel });
    if (reason) { bump(reason); continue; }
    const fp = questionFingerprint(c);
    if (seenFp.has(fp)) { bump("duplicate_fingerprint"); continue; }
    seenFp.add(fp);
    clean.push(c);
  }

  const recentIds = opts.recentIds ?? new Set<string>();
  const recentConcepts = opts.recentConcepts ?? new Set<string>();
  const cap = conceptCapFor(opts.total, opts.maxPerConcept);
  const quota = targetDifficultyMix(opts.difficulty, opts.total);

  // Freshest first, then concepts the student has not just drilled.
  const ordered = shuffle(clean).sort((a, b) => {
    const pen = (c: QualityCandidate) =>
      (recentIds.has(c.id) ? 2 : 0) + (recentConcepts.has(conceptKey(c)) ? 1 : 0);
    return pen(a) - pen(b);
  });

  const picked: QualityCandidate[] = [];
  const usedIds = new Set<string>();
  const conceptCount = new Map<string, number>();
  const relaxed: string[] = [];

  const tryAdd = (
    c: QualityCandidate,
    { respectQuota, respectConcept, respectNearDup }: { respectQuota: boolean; respectConcept: boolean; respectNearDup: boolean },
  ): boolean => {
    if (usedIds.has(c.id)) return false;
    if (picked.length >= opts.total) return false;
    const tier = difficultyTier(c);
    if (respectQuota && quota[tier] <= 0) return false;
    const key = conceptKey(c);
    if (respectConcept && (conceptCount.get(key) ?? 0) >= cap) return false;
    if (respectNearDup && picked.some((p) => isNearDuplicate(p.question_text, c.question_text))) {
      bump("near_duplicate");
      return false;
    }
    usedIds.add(c.id);
    conceptCount.set(key, (conceptCount.get(key) ?? 0) + 1);
    quota[tier] = quota[tier] - 1;
    picked.push(c);
    return true;
  };

  // Pass 1: all constraints enforced.
  for (const c of ordered) tryAdd(c, { respectQuota: true, respectConcept: true, respectNearDup: true });

  // Pass 2: relax difficulty quota (least important — keeps concept diversity).
  if (picked.length < opts.total) {
    const before = picked.length;
    for (const c of ordered) tryAdd(c, { respectQuota: false, respectConcept: true, respectNearDup: true });
    if (picked.length > before) relaxed.push("difficulty_distribution");
  }

  // Pass 3: relax the concept cap, still no duplicates or near-duplicates.
  if (picked.length < opts.total) {
    const before = picked.length;
    for (const c of ordered) tryAdd(c, { respectQuota: false, respectConcept: false, respectNearDup: true });
    if (picked.length > before) relaxed.push("concept_diversity");
  }

  // Never relaxed: duplicate ids, duplicate fingerprints, near-duplicates,
  // and the quality gate. A short test is better than a padded one.
  return { picked, rejected, relaxed };
}

/* ------------------------------- validation ------------------------------- */

export type ValidationIssue = { code: string; detail: string; questionId?: string };

export type ValidationReport = {
  ok: boolean;
  issues: ValidationIssue[];
  conceptSpread: number;
  difficultySpread: Record<string, number>;
};

/** Final pass before a paper is handed to the student. */
export function validateTest(
  questions: QualityCandidate[],
  opts: { expected?: number; requireCompetitiveLevel?: boolean; maxPerConcept?: number } = {},
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const fps = new Set<string>();
  const conceptCount = new Map<string, number>();
  const difficultySpread: Record<string, number> = {};

  questions.forEach((q) => {
    if (ids.has(q.id)) issues.push({ code: "duplicate_question_id", detail: q.id, questionId: q.id });
    ids.add(q.id);

    const fp = questionFingerprint(q);
    if (fps.has(fp)) issues.push({ code: "duplicate_fingerprint", detail: fp, questionId: q.id });
    fps.add(fp);

    const reason = rejectReason(q, { requireCompetitiveLevel: opts.requireCompetitiveLevel });
    if (reason) issues.push({ code: `quality:${reason}`, detail: q.question_text.slice(0, 80), questionId: q.id });

    const key = conceptKey(q);
    conceptCount.set(key, (conceptCount.get(key) ?? 0) + 1);
    const tier = difficultyTier(q);
    difficultySpread[tier] = (difficultySpread[tier] ?? 0) + 1;
  });

  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      if (isNearDuplicate(questions[i].question_text, questions[j].question_text)) {
        issues.push({ code: "near_duplicate", detail: `${questions[i].id} ~ ${questions[j].id}`, questionId: questions[j].id });
      }
    }
  }

  const cap = conceptCapFor(opts.expected ?? questions.length, opts.maxPerConcept);
  for (const [key, n] of conceptCount) {
    if (n > cap) issues.push({ code: "concept_overrepresented", detail: `${key} appears ${n}× (cap ${cap})` });
  }

  if (opts.expected !== undefined && questions.length !== opts.expected) {
    issues.push({ code: "size_mismatch", detail: `${questions.length} of ${opts.expected}` });
  }

  return {
    ok: issues.filter((i) => i.code !== "size_mismatch").length === 0,
    issues,
    conceptSpread: conceptCount.size,
    difficultySpread,
  };
}
