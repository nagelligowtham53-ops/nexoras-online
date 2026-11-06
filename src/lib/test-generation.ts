import { supabase } from "@/integrations/supabase/client";
import type { ExamConfig } from "@/lib/exam-config";

/**
 * Mock-test generation pipeline.
 *
 * Single code path for both the pre-flight availability check and the actual
 * test build, so the numbers shown on the instructions screen are the numbers
 * the generator will really use. Every failure carries a specific, honest
 * reason — never a generic "try again later".
 *
 * Eligibility is decided once, per subject AND per question type, in
 * fetchPool. Readiness counts those pools against the type blueprint, and the
 * assembler draws from the same pools with the same blueprint, so a "ready"
 * report always assembles and a question never fills a slot of another type.
 */

const VIEW = "questions_public";

/** Config subject label -> value stored in questions.subject. Null = not in the bank yet. */
const SUBJECT_DB_MAP: Record<string, string | null> = {
  Physics: "Physics",
  Chemistry: "Chemistry",
  Mathematics: "Mathematics",
  Maths: "Mathematics",
  Biology: "Biology",
  Botany: "Botany",
  Zoology: "Zoology",
};

const BANNED_PATTERNS = [
  /what is (jee|neet|nta|cbt)/i,
  /full form of/i,
  /who conducts/i,
  /exam pattern/i,
  /how many attempts/i,
  /eligibility criteria/i,
];

export type DifficultyChoice = "mixed" | "easy" | "medium" | "hard";

export type GeneratedQuestion = {
  dbId: string;
  subject: string;
  sectionName: string;
  chapter: string;
  chapterId: string | null;
  classLevel: number;
  difficulty: string;
  type: "mcq" | "numerical";
  text: string;
  options: string[];
  marks: number;
  negativeMarks: number;
  isPyq: boolean;
  sourceLabel: string;
  year: number | null;
};

/** Question-type family a paper section must supply. "any" = no split required. */
export type TypeKind = "mcq" | "numerical" | "any";

export type TypeRequirement = {
  kind: TypeKind;
  /** questions.question_type values that may fill this slot. */
  dbTypes: string[];
  required: number;
  /** Valid, eligible, de-duplicated questions of this type in the bank. */
  available: number;
};

export type SectionReport = {
  sectionName: string;
  dbSubject: string | null;
  requested: number;
  /** Sum over types of min(required, available) — never counts a wrong-type question. */
  usable: number;
  rejectedInvalid: number;
  rejectedDuplicate: number;
  byType: TypeRequirement[];
  /** Set only when this subject's query itself failed — never blocks other subjects. */
  error?: string | null;
};

export type AvailabilityReport = {
  requested: number;
  usable: number;
  sections: SectionReport[];
  unmappedSections: string[];
  ready: boolean;
  /** Sizes the bank can actually deliver right now. */
  suggestedSizes: number[];
  reason: string | null;
};

export class TestGenerationError extends Error {
  code: string;
  detail: string;
  constructor(code: string, message: string, detail = "") {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

function difficultyFilter(d: DifficultyChoice): string[] | null {
  if (d === "mixed") return null;
  return [d[0].toUpperCase() + d.slice(1)];
}

function normalizeText(t: string) {
  return t.toLowerCase().replace(/\s+/g, " ").trim();
}

type Row = Record<string, unknown>;

function isUsable(row: Row): boolean {
  if (row.active !== true || row.verified !== true || !row.chapter_id) return false;
  const text = String(row.question_text ?? "").trim();
  if (text.length < 15) return false;
  if (BANNED_PATTERNS.some((re) => re.test(text))) return false;
  const type = String(row.question_type ?? "");
  const options = Array.isArray(row.options) ? row.options.map((o) => String(o ?? "").trim()) : [];
  if (!["single_correct", "integer", "numerical"].includes(type)) return false;
  const objective = type === "single_correct";
  if (objective) {
    if (options.length !== 4) return false;
    if (options.some((o) => o.length === 0)) return false;
    if (new Set(options.map(normalizeText)).size !== options.length) return false;
  }
  if (!row.subject || !row.chapter) return false;
  return true;
}

function sourceLabel(row: Row): string {
  const st = String(row.source_type ?? "original_practice");
  if (st === "previous_year" || st === "official_exam") {
    const y = row.year ? ` ${row.year}` : "";
    return `Official PYQ${y}`;
  }
  if (st === "licensed_bank") return "Licensed bank";
  if (st === "ncert_based") return "NCERT-based";
  return "PYQ Style (original)";
}

function toQuestion(row: Row, sectionName: string): GeneratedQuestion {
  const type = String(row.question_type ?? "single_correct");
  const numeric = type === "integer" || type === "numerical";
  return {
    dbId: String(row.id),
    subject: String(row.subject),
    sectionName,
    chapter: String(row.chapter ?? ""),
    chapterId: row.chapter_id ? String(row.chapter_id) : null,
    classLevel: Number(row.class_level ?? 11),
    difficulty: String(row.difficulty ?? "Medium"),
    type: numeric ? "numerical" : "mcq",
    text: String(row.question_text),
    options: Array.isArray(row.options) ? row.options.map(String) : [],
    marks: Number(row.marks ?? 4),
    negativeMarks: Number(row.negative_marks ?? 1),
    isPyq: Boolean(row.is_pyq),
    sourceLabel: sourceLabel(row),
    year: row.year === null || row.year === undefined ? null : Number(row.year),
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- recently-served questions (freshness) ---------------- */

const SEEN_LIMIT = 600;

function seenKey(examKey: string) {
  return `nexoras.seen-questions.${examKey}`;
}

export function recentlyServed(examKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(seenKey(examKey));
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function rememberServed(examKey: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const merged = [...ids, ...recentlyServed(examKey)].slice(0, SEEN_LIMIT);
    window.localStorage.setItem(seenKey(examKey), JSON.stringify(merged));
  } catch {
    /* storage unavailable — freshness is best-effort */
  }
}

/* ---------------- candidate pool ---------------- */

export type GenerationOptions = {
  difficulty: DifficultyChoice;
  /** Restrict to a single section/subject (chapter-wise tests). */
  onlySection?: string;
  /** Override the total question count (smaller practice tests). */
  totalOverride?: number;
  pyqOnly?: boolean;
};

/* ---------------- section type blueprint ---------------- */

const MCQ_TYPES = ["single_correct"];
const NUMERIC_TYPES = ["integer", "numerical"];

function kindOf(questionType: unknown): Exclude<TypeKind, "any"> | null {
  const t = String(questionType ?? "");
  if (MCQ_TYPES.includes(t)) return "mcq";
  if (NUMERIC_TYPES.includes(t)) return "numerical";
  return null;
}

/**
 * The per-section question-type split a paper requires. Readiness and assembly
 * both read this — a question only counts toward the slot of its own type.
 *
 * JEE Main: each subject is Section A (MCQ) + Section B (numerical value),
 * 20 + 5 in the full paper; shorter tests keep the same 4:1 ratio (floor).
 */
export function typeBlueprint(config: ExamConfig, count: number): Omit<TypeRequirement, "available">[] {
  const allowed = (types: string[]) => types.filter((t) => config.questionTypes.includes(t));
  if (config.examKey === "jee-main") {
    const numerical = Math.floor(count / 5);
    const plan: Omit<TypeRequirement, "available">[] = [
      { kind: "mcq", dbTypes: allowed(MCQ_TYPES), required: count - numerical },
    ];
    if (numerical > 0) plan.push({ kind: "numerical", dbTypes: allowed(NUMERIC_TYPES), required: numerical });
    return plan;
  }
  return [{ kind: "any", dbTypes: allowed([...MCQ_TYPES, ...NUMERIC_TYPES]), required: count }];
}

type Pool = { section: SectionReport; rowsByKind: Map<TypeKind, Row[]> };

/** Concept signature: chapter + first meaningful words, used to avoid near-duplicates. */
const conceptKey = (row: Row) =>
  `${String(row.chapter_id ?? row.chapter ?? "")}::${normalizeText(String(row.question_text))
    .replace(/[0-9.]+/g, "#")
    .split(" ")
    .slice(0, 8)
    .join(" ")}`;

const SELECT_COLUMNS =
  "id,exams,class_level,subject,chapter,chapter_id,difficulty,question_type,year,source_type,is_pyq,marks,negative_marks,question_text,options,active,verified";

async function fetchPool(
  config: ExamConfig,
  sectionName: string,
  requested: number,
  opts: GenerationOptions,
): Promise<Pool> {
  const dbSubject = SUBJECT_DB_MAP[sectionName] ?? null;
  const plan = typeBlueprint(config, requested);
  const report: SectionReport = {
    sectionName,
    dbSubject,
    requested,
    usable: 0,
    rejectedInvalid: 0,
    rejectedDuplicate: 0,
    byType: plan.map((p) => ({ ...p, available: 0 })),
  };
  const rowsByKind = new Map<TypeKind, Row[]>(plan.map((p) => [p.kind, []]));
  if (!dbSubject || !config.dbExam) return { section: report, rowsByKind };

  // One query per type slot so a large MCQ pool can never crowd numerical
  // questions out of the row limit.
  const diff = difficultyFilter(opts.difficulty);
  const results = await Promise.all(
    plan.map(async (slot) => {
      if (slot.dbTypes.length === 0) return { slot, data: [] as Row[], error: null };
      let q = supabase
        .from(VIEW as never)
        .select(SELECT_COLUMNS)
        .overlaps("exams", [config.dbExam as string])
        .eq("subject", dbSubject)
        .eq("active", true)
        .eq("verified", true)
        .in("question_type", slot.dbTypes)
        .limit(Math.min(1000, Math.max(slot.required * 8, 120)));
      if (diff) q = q.in("difficulty", diff);
      if (opts.pyqOnly) q = q.eq("is_pyq", true);
      const { data, error } = await q;
      return { slot, data: (data ?? []) as Row[], error };
    }),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) {
    // A subject-level query failure must never abort the whole paper: record it
    // precisely and let the other subjects be validated independently.
    console.error("[test-generation] query failed", { section: sectionName, dbSubject, error: failed.error });
    report.error = failed.error.message;
    return { section: report, rowsByKind };
  }

  // Shared eligibility: valid, right subject, right type, distinct text and stem.
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  const seenConcepts = new Set<string>();
  for (const { slot, data } of results) {
    const bucket = rowsByKind.get(slot.kind)!;
    for (const raw of data) {
      const id = String(raw.id);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const kind = kindOf(raw.question_type);
      if (raw.subject !== dbSubject || !kind || !slot.dbTypes.includes(String(raw.question_type)) || !isUsable(raw)) {
        report.rejectedInvalid++;
        continue;
      }
      const textKey = normalizeText(String(raw.question_text));
      const ck = conceptKey(raw);
      if (seenTexts.has(textKey) || seenConcepts.has(ck)) {
        report.rejectedDuplicate++;
        continue;
      }
      seenTexts.add(textKey);
      seenConcepts.add(ck);
      bucket.push(raw);
    }
  }
  report.byType = report.byType.map((t) => ({ ...t, available: rowsByKind.get(t.kind)?.length ?? 0 }));
  report.usable = report.byType.reduce((a, t) => a + Math.min(t.required, t.available), 0);
  return { section: report, rowsByKind };
}

function sectionQuotas(config: ExamConfig, opts: GenerationOptions) {
  const total = opts.totalOverride ?? config.totalQuestions;
  const slots = config.subjectDistribution;
  if (slots.length === 0 || !Number.isInteger(total) || total < 1) {
    throw new TestGenerationError("invalid_config", "This paper needs a valid subject blueprint before a test can start.");
  }

  if (opts.onlySection) {
    return [{ name: opts.onlySection, count: total }];
  }
  const configTotal = slots.reduce((a, s) => a + s.count, 0) || total;
  const scaled = slots.map((s) => ({
    name: s.name,
    count: Math.max(1, Math.round((s.count / configTotal) * total)),
  }));
  // Trim/pad rounding drift so the quotas sum to the requested total.
  let drift = scaled.reduce((a, s) => a + s.count, 0) - total;
  for (let i = 0; drift !== 0 && i < scaled.length * 4; i++) {
    const s = scaled[i % scaled.length];
    if (drift > 0 && s.count > 1) {
      s.count--;
      drift--;
    } else if (drift < 0) {
      s.count++;
      drift++;
    }
  }
  return scaled;
}

async function buildPools(config: ExamConfig, opts: GenerationOptions) {
  const quotas = sectionQuotas(config, opts);
  const pools = await Promise.all(quotas.map((s) => fetchPool(config, s.name, s.count, opts)));
  return { quotas, pools };
}

const KIND_LABEL: Record<TypeKind, string> = { mcq: "MCQ", numerical: "numerical", any: "" };

/** Exact per-type shortfalls, e.g. "Physics needs 5 numerical (has 0)". */
function shortfalls(sections: SectionReport[]): string[] {
  return sections.flatMap((s) =>
    s.byType
      .filter((t) => t.available < t.required)
      .map((t) =>
        t.dbTypes.length === 0
          ? `${s.sectionName} needs ${t.required} ${KIND_LABEL[t.kind]} questions but this paper's configuration does not allow that type`
          : `${s.sectionName} needs ${t.required}${KIND_LABEL[t.kind] ? ` ${KIND_LABEL[t.kind]}` : ""} (has ${t.available})`,
      ),
  );
}

function summarize(config: ExamConfig, opts: GenerationOptions, pools: Pool[]): AvailabilityReport {
  const requested = opts.totalOverride ?? config.totalQuestions;
  const sections = pools.map((p) => p.section);
  const unmapped = sections.filter((s) => !s.dbSubject).map((s) => s.sectionName);

  // Never substitute another subject or another question type for a missing slot.
  const usable = sections.reduce((a, s) => a + s.usable, 0);
  const unsupported = config.examKey === "jee-adv"
    ? "JEE Advanced requires a verified section-level marking blueprint. This generic paper is not available for scored tests."
    : null;

  const availableFor = (sectionName: string, kind: TypeKind) =>
    pools.find((p) => p.section.sectionName === sectionName)?.rowsByKind.get(kind)?.length ?? 0;
  const sizeLadder = [10, 15, 20, 25, 30, 45, 50, 60, 75, 90, 120, 150, 180];
  const suggested = unsupported ? [] : sizeLadder.filter((n) => n < requested &&
    sectionQuotas(config, { ...opts, totalOverride: n }).every((quota) => {
      const pool = pools.find((p) => p.section.sectionName === quota.name);
      if (!pool || !pool.section.dbSubject || pool.section.error) return false;
      return typeBlueprint(config, quota.count).every((t) => t.dbTypes.length > 0 && availableFor(quota.name, t.kind) >= t.required);
    })).slice(-3);

  const failed = sections.filter((s) => s.error);
  const missing = shortfalls(sections.filter((s) => s.dbSubject && !s.error));
  const typeShort = sections.some((s) => s.dbSubject && !s.error && s.byType.some((t) => t.kind !== "any" && t.available < t.required));
  let reason: string | null = null;
  if (unsupported) {
    reason = unsupported;
  } else if (!config.dbExam) {
    reason = `${config.examName} is not linked to the question bank yet, so no questions can be selected for it.`;
  } else if (failed.length) {
    reason = `The question bank is temporarily unreachable for ${failed
      .map((s) => s.sectionName)
      .join(", ")}. ${sections
      .filter((s) => !s.error && s.dbSubject)
      .map((s) => `${s.sectionName} ${s.usable}/${s.requested} ready`)
      .join(" · ")}`.trim();
  } else if (usable === 0) {
    const detail = sections
      .filter((s) => s.dbSubject)
      .map((s) => `${s.sectionName} 0/${s.requested}`)
      .join(" · ");
    reason =
      opts.difficulty === "mixed"
        ? `No verified ${config.examName} questions are available for this configuration yet (${detail}).`
        : `No verified ${opts.difficulty} questions are available for ${config.examName} right now (${detail}). Try the Mixed difficulty.`;
  } else if (missing.length || unmapped.length) {
    const parts = [...missing, ...unmapped.map((n) => `${n} is not in the question bank`)];
    reason = typeShort
      ? `The ${config.examName} bank cannot supply the required question-type split, so the full paper stays disabled and no substitutes are used: ${parts.join(" · ")}.`
      : `Only ${usable} of ${requested} questions can be selected. ${parts.join(" · ")}.`;
  }

  const ready = !unsupported && !!config.dbExam && sections.length > 0 &&
    sections.every((s) => !s.error && s.dbSubject !== null && s.byType.every((t) => t.dbTypes.length > 0 && t.available >= t.required));

  return {
    requested,
    usable,
    sections,
    unmappedSections: unmapped,
    ready,
    suggestedSizes: suggested,
    reason: ready ? null : reason,
  };
}

/** Pre-flight check shown on the instructions screen. Never throws for empty banks. */
export async function checkAvailability(
  config: ExamConfig,
  opts: GenerationOptions,
): Promise<AvailabilityReport> {
  const { pools } = await buildPools(config, opts);
  return summarize(config, opts, pools);
}

/** Builds the actual paper from the same pools and type blueprint the readiness check used. */
export async function generateTest(
  config: ExamConfig,
  opts: GenerationOptions,
): Promise<{ questions: GeneratedQuestion[]; report: AvailabilityReport }> {
  const { pools } = await buildPools(config, opts);
  const report = summarize(config, opts, pools);

  if (!report.ready) {
    if (report.usable === 0) {
      const allFailed = report.sections.every((s) => !s.dbSubject || s.error);
      throw new TestGenerationError(
        allFailed && report.sections.some((s) => s.error)
          ? "bank_unavailable"
          : config.dbExam
            ? "no_questions"
            : "exam_unmapped",
        report.reason ?? "No questions are available for this configuration.",
        report.sections.map((s) => s.error).filter(Boolean).join(" | "),
      );
    }
    throw new TestGenerationError("incomplete_blueprint", report.reason ?? "The bank cannot deliver this complete paper. Select an available shorter practice test.");
  }

  const seen = recentlyServed(config.examKey);
  const picked: GeneratedQuestion[] = [];

  for (const pool of pools) {
    const chapterCounts = new Map<string, number>();
    for (const slot of pool.section.byType) {
      const rows = pool.rowsByKind.get(slot.kind) ?? [];
      const ordered = [
        ...shuffle(rows.filter((r) => !seen.has(String(r.id)))),
        ...shuffle(rows.filter((r) => seen.has(String(r.id)))),
      ];
      const chosen = new Set<string>();
      // Pass 1 spreads chapters; pass 2 (no cap) fills from the same eligible
      // rows, so a ready report always assembles.
      for (const cap of [Math.max(2, Math.ceil(pool.section.requested / 4)), 0]) {
        for (const row of ordered) {
          if (chosen.size >= slot.required) break;
          const id = String(row.id);
          if (chosen.has(id)) continue;
          const chapterKey = String(row.chapter_id ?? row.chapter ?? "");
          if (cap > 0 && (chapterCounts.get(chapterKey) ?? 0) >= cap) continue;
          chosen.add(id);
          chapterCounts.set(chapterKey, (chapterCounts.get(chapterKey) ?? 0) + 1);
          picked.push(toQuestion(row, pool.section.sectionName));
        }
      }
    }
  }

  const countOf = (sectionName: string, kind: TypeKind) =>
    picked.filter((q) => q.sectionName === sectionName && (kind === "any" || q.type === kind)).length;
  if (
    picked.length !== report.requested ||
    pools.some((p) => p.section.byType.some((t) => countOf(p.section.sectionName, t.kind) !== t.required))
  ) {
    throw new TestGenerationError("insufficient_distinct_questions", "There are not enough distinct, valid questions for every section. This test has not started.");
  }
  rememberServed(config.examKey, picked.map((q) => q.dbId));

  return { questions: picked, report: { ...report, usable: picked.length } };
}
