import { supabase } from "@/integrations/supabase/client";
import type { ExamConfig } from "@/lib/exam-config";

/**
 * Mock-test generation pipeline.
 *
 * Single code path for both the pre-flight availability check and the actual
 * test build, so the numbers shown on the instructions screen are the numbers
 * the generator will really use. Every failure carries a specific, honest
 * reason — never a generic "try again later".
 */

const VIEW = "questions_public";

/** Config subject label -> value stored in questions.subject. Null = not in the bank yet. */
const SUBJECT_DB_MAP: Record<string, string | null> = {
  Physics: "Physics",
  Chemistry: "Chemistry",
  Mathematics: "Mathematics",
  Maths: "Mathematics",
  Biology: "Biology",
  Botany: "Biology",
  Zoology: "Biology",
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

export type SectionReport = {
  sectionName: string;
  dbSubject: string | null;
  requested: number;
  usable: number;
  rejectedInvalid: number;
  rejectedDuplicate: number;
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
  const text = String(row.question_text ?? "").trim();
  if (text.length < 15) return false;
  if (BANNED_PATTERNS.some((re) => re.test(text))) return false;
  const type = String(row.question_type ?? "");
  const options = Array.isArray(row.options) ? row.options.map((o) => String(o ?? "").trim()) : [];
  const objective = type === "single_correct" || type === "multiple_correct" || type === "assertion_reason";
  if (objective) {
    if (options.length < 4) return false;
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

type Pool = { section: SectionReport; rows: Row[] };

async function fetchPool(
  config: ExamConfig,
  sectionName: string,
  requested: number,
  opts: GenerationOptions,
): Promise<Pool> {
  const dbSubject = SUBJECT_DB_MAP[sectionName] ?? null;
  const report: SectionReport = {
    sectionName,
    dbSubject,
    requested,
    usable: 0,
    rejectedInvalid: 0,
    rejectedDuplicate: 0,
  };
  if (!dbSubject || !config.dbExam) return { section: report, rows: [] };

  let q = supabase
    .from(VIEW as never)
    .select(
      "id,exams,class_level,subject,chapter,chapter_id,difficulty,question_type,year,source_type,is_pyq,marks,negative_marks,question_text,options",
    )
    .overlaps("exams", [config.dbExam])
    .eq("subject", dbSubject)
    .limit(Math.min(1000, Math.max(requested * 8, 120)));

  const diff = difficultyFilter(opts.difficulty);
  if (diff) q = q.in("difficulty", diff);
  if (opts.pyqOnly) q = q.eq("is_pyq", true);

  const { data, error } = await q;
  if (error) {
    // A subject-level query failure must never abort the whole paper: record it
    // precisely and let the other subjects be validated independently.
    console.error("[test-generation] query failed", { section: sectionName, dbSubject, error });
    report.error = error.message;
    return { section: report, rows: [] };
  }


  const seenTexts = new Set<string>();
  const rows: Row[] = [];
  for (const raw of (data ?? []) as Row[]) {
    if (!isUsable(raw)) {
      report.rejectedInvalid++;
      continue;
    }
    const key = normalizeText(String(raw.question_text));
    if (seenTexts.has(key)) {
      report.rejectedDuplicate++;
      continue;
    }
    seenTexts.add(key);
    rows.push(raw);
  }
  report.usable = rows.length;
  return { section: report, rows };
}

function sectionQuotas(config: ExamConfig, opts: GenerationOptions) {
  const total = opts.totalOverride ?? config.totalQuestions;
  const slots = config.subjectDistribution.length
    ? config.subjectDistribution
    : [{ name: "Physics", count: total }];

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

function summarize(config: ExamConfig, opts: GenerationOptions, pools: Pool[]): AvailabilityReport {
  const requested = opts.totalOverride ?? config.totalQuestions;
  const sections = pools.map((p) => p.section);
  const unmapped = sections.filter((s) => !s.dbSubject).map((s) => s.sectionName);

  // Usable pool respecting per-section quotas, then any spare capacity from
  // other sections (a test is still valid if one subject carries more).
  const perSection = sections.map((s) => Math.min(s.requested, s.usable));
  let usable = perSection.reduce((a, n) => a + n, 0);
  const spare = sections.reduce((a, s) => a + Math.max(0, s.usable - s.requested), 0);
  usable = Math.min(requested, usable + spare);

  const sizeLadder = [10, 15, 20, 25, 30, 45, 50, 60, 75, 90, 120, 150, 180];
  const suggested = sizeLadder.filter((n) => n <= usable && n < requested).slice(-3);

  const failed = sections.filter((s) => s.error);
  let reason: string | null = null;
  if (!config.dbExam) {
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
  } else if (usable < requested) {
    const short = sections
      .filter((s) => s.dbSubject && s.usable < s.requested)
      .map(
        (s) =>
          `${s.sectionName} question bank currently has ${s.usable} valid question${s.usable === 1 ? "" : "s"} for this configuration (needs ${s.requested})`,
      )
      .join(" · ");
    reason = `Only ${usable} of ${requested} questions can be selected. ${short}.`;
  }


  return {
    requested,
    usable,
    sections,
    unmappedSections: unmapped,
    ready: usable >= requested,
    suggestedSizes: suggested,
    reason,
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

/** Builds the actual paper. Throws TestGenerationError with a specific reason. */
export async function generateTest(
  config: ExamConfig,
  opts: GenerationOptions,
): Promise<{ questions: GeneratedQuestion[]; report: AvailabilityReport }> {
  const { pools } = await buildPools(config, opts);
  const report = summarize(config, opts, pools);

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

  const seen = recentlyServed(config.examKey);
  const picked: GeneratedQuestion[] = [];
  const usedIds = new Set<string>();
  const usedTexts = new Set<string>();

  /** Concept signature: chapter + first meaningful words, used to avoid near-duplicates. */
  const conceptKey = (row: Row) =>
    `${String(row.chapter_id ?? row.chapter ?? "")}::${normalizeText(String(row.question_text))
      .replace(/[0-9.]+/g, "#")
      .split(" ")
      .slice(0, 8)
      .join(" ")}`;

  const take = (pool: Pool, quota: number, conceptCap: number) => {
    const conceptCounts = new Map<string, number>();
    for (const p of picked) {
      /* seed caps from already-picked questions of this section */
      if (p.sectionName === pool.section.sectionName) {
        const k = `${p.chapterId ?? p.chapter}`;
        conceptCounts.set(k, (conceptCounts.get(k) ?? 0) + 1);
      }
    }
    const fresh = shuffle(pool.rows.filter((r) => !usedIds.has(String(r.id)) && !seen.has(String(r.id))));
    const repeats = shuffle(pool.rows.filter((r) => !usedIds.has(String(r.id)) && seen.has(String(r.id))));
    for (const row of [...fresh, ...repeats]) {
      if (picked.filter((p) => p.sectionName === pool.section.sectionName).length >= quota) break;
      const textKey = normalizeText(String(row.question_text));
      if (usedTexts.has(textKey)) continue;
      const nearKey = conceptKey(row);
      if ((conceptCounts.get(nearKey) ?? 0) >= 1) continue; // no near-duplicate stems
      const chapterKey = String(row.chapter_id ?? row.chapter ?? "");
      if (conceptCap > 0 && (conceptCounts.get(chapterKey) ?? 0) >= conceptCap) continue;
      usedIds.add(String(row.id));
      usedTexts.add(textKey);
      conceptCounts.set(nearKey, 1);
      conceptCounts.set(chapterKey, (conceptCounts.get(chapterKey) ?? 0) + 1);
      picked.push(toQuestion(row, pool.section.sectionName));
    }
  };

  // Pass 1: spread across chapters (max ~1/4 of a section from one chapter).
  for (const pool of pools) take(pool, pool.section.requested, Math.max(2, Math.ceil(pool.section.requested / 4)));
  // Pass 2: relax the chapter cap if a section is still short.
  for (const pool of pools) take(pool, pool.section.requested, 0);

  // Backfill from spare capacity so the paper reaches the target length.
  if (picked.length < report.usable) {
    for (const pool of pools) {
      const remaining = report.usable - picked.length;
      if (remaining <= 0) break;
      take(pool, pool.section.requested + remaining, 0);
    }
  }


  const ordered = pools.flatMap((p) => picked.filter((q) => q.sectionName === p.section.sectionName));
  rememberServed(config.examKey, ordered.map((q) => q.dbId));

  return { questions: ordered, report: { ...report, usable: ordered.length } };
}
