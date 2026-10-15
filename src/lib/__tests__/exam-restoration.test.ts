import { describe, expect, it, vi, beforeEach } from "vitest";
import { scoreSubmission, isAnswerCorrect } from "../scoring";
import { evaluateTest, toCorrectKey } from "../evaluation";
import type { ExamConfig } from "../exam-config";

const bank = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => {
  let subject = "";
  const query = {
    select: () => query, overlaps: () => query, limit: () => query, in: () => query,
    eq: (key: string, value: unknown) => { if (key === "subject") subject = String(value); return query; },
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: bank.rows.filter((r) => r.subject === subject), error: null }).then(resolve),
  };
  return query;
} } }));
import { checkAvailability, generateTest } from "../test-generation";

const makeScore = (selected: unknown, key: Parameters<typeof scoreSubmission>[0]["correct_key"], positive = 4, negative = 1, partialCredit?: "jee_advanced") => scoreSubmission({
  question_id: "q", test_id: "t", question_order: 0, question_type: key?.type ?? "single", selected, correct_key: key,
  marking: { positive, negative, partialCredit },
});

describe("supplied scoring acceptance examples", () => {
  it.each([
    ["JEE Main", 10, 2, 4, 1, 38], ["NEET", 120, 30, 4, 1, 450],
    ["BITSAT", 110, 15, 3, 1, 315], ["COMEDK", 140, 0, 1, 0, 140],
    ["CUET", 40, 6, 5, 1, 194], ["CLAT", 10, 4, 1, .25, 9],
  ])("%s reconciles per-question marks", (_name, correct, wrong, positive, negative, expected) => {
    const score = Array.from({ length: correct + wrong }, (_, i) => makeScore(i < correct ? 0 : 1, { type: "single", value: 0 }, positive, negative).final_marks).reduce((a, b) => a + b, 0);
    expect(score).toBeCloseTo(expected, 10);
  });
  it("MHT-CET applies subject weighting", () => {
    expect(35 * makeScore(0, { type: "single", value: 0 }, 1, 0).final_marks + 40 + 30 * makeScore(0, { type: "single", value: 0 }, 2, 0).final_marks).toBe(135);
  });
  it("GATE uses rational MCQ penalties and zero NAT penalties", () => {
    expect(makeScore(1, { type: "single", value: 0 }, 1, 1 / 3).final_marks).toBeCloseTo(-1 / 3);
    expect(makeScore("3", { type: "numeric", value: 2 }, 2, 0).final_marks).toBe(0);
  });
  it("CAT TITA and TG EAPCET wrong answers have no penalty", () => {
    expect(makeScore("wrong", { type: "text", value: "correct" }, 3, 0).final_marks).toBe(0);
    expect(makeScore(1, { type: "single", value: 0 }, 1, 0).final_marks).toBe(0);
  });
});

describe("JEE Advanced supplied partial-credit truth table", () => {
  for (let keyMask = 1; keyMask < 16; keyMask++) {
    for (let selectedMask = 0; selectedMask < 16; selectedMask++) {
      it(`key ${keyMask}, selection ${selectedMask}`, () => {
        const values = [0, 1, 2, 3].filter((n) => keyMask & (1 << n));
        const selected = [0, 1, 2, 3].filter((n) => selectedMask & (1 << n));
        const clean = selected.every((v) => values.includes(v));
        const expected = selected.length === 0 ? 0 : selectedMask === keyMask ? 4
          : clean && values.length === 4 && selected.length === 3 ? 3
          : clean && values.length >= 3 && selected.length === 2 ? 2
          : clean && values.length >= 2 && selected.length === 1 ? 1 : -1;
        expect(makeScore(selected, { type: "multiple", values }, 4, 1, "jee_advanced").final_marks).toBe(expected);
      });
    }
  }
  it("does not enable partial credit on ordinary MSQ questions", () => {
    expect(makeScore([0], { type: "multiple", values: [0, 1] }).final_marks).toBe(-1);
  });
});

describe("numeric and identity regressions", () => {
  it("rejects numeric prefixes, blank values, infinity and nonnumeric values", () => {
    for (const answer of ["9.81junk", "", " ", "0x10", "Infinity", true, null]) {
      expect(isAnswerCorrect(answer, { type: "numeric", value: 9.81 })).not.toBe(true);
    }
  });
  it("accepts formatting and floating-point tolerance boundaries", () => {
    expect(isAnswerCorrect("09.8100", { type: "numeric", value: 9.81, tolerance: 0 })).toBe(true);
    expect(isAnswerCorrect("0.3", { type: "numeric", value: .1 + .2, tolerance: 0 })).toBe(true);
    expect(isAnswerCorrect("9.85", { type: "numeric", value: 9.8, tolerance: .05 })).toBe(true);
  });
  it("uses explicit ranges, rounding and truncation policies", () => {
    expect(isAnswerCorrect("2.14", { type: "numeric", value: 2.145, decimalPlaces: 2, rounding: "truncate", tolerance: 0 })).toBe(true);
    expect(isAnswerCorrect("2.15", { type: "numeric", value: 2.146, decimalPlaces: 2, rounding: "round", tolerance: 0 })).toBe(true);
    expect(isAnswerCorrect("2.15", { type: "numeric", value: 2.14, acceptedRange: [2.13, 2.16] })).toBe(true);
  });
  it("rejects invalid keys instead of manufacturing zero", () => {
    for (const key of [{ type: "numeric", value: null }, { type: "numeric", value: "" }, { type: "numeric", value: 1, tolerance: -1 }, { type: "multiple", values: [] }]) expect(toCorrectKey(key)).toBeNull();
  });
  it("rejects duplicate question grading", () => {
    expect(() => evaluateTest({ test_id: "t", marking: { positive: 4, negative: 1 }, questions: [{ id: "q", question_type: "single" }, { id: "q", question_type: "single" }], answers: [0, 0] })).toThrow("Duplicate");
  });
  it("does not grade an answer with a mismatched question ID", () => {
    const result = evaluateTest({ test_id: "t", marking: { positive: 4, negative: 1 }, questions: [{ id: "q", question_type: "single" }], answers: [0], grades: { q: { question_id: "other", correct_answer: { type: "single", value: 0 } } } });
    expect(result.summary.ungraded).toBe(1);
    expect(result.summary.score).toBe(0);
  });
});

const config: ExamConfig = {
  id: "c", examKey: "comedk", examName: "COMEDK", examYear: 2026, paperName: "PCM", dbExam: "COMEDK UGET", totalQuestions: 6,
  durationMinutes: 180, marksPerCorrect: 1, negativeMarks: 0, questionTypes: ["single_correct"],
  subjectDistribution: [{ name: "Physics", count: 2 }, { name: "Chemistry", count: 2 }, { name: "Mathematics", count: 2 }],
  patternNote: "Reference", difficultyProfile: "mixed", active: true,
};
const row = (subject: string, index: number) => ({ id: `${subject}-${index}`, subject, chapter: `Chapter ${index}`, chapter_id: `ch-${index}`, question_text: `A distinct valid ${subject} calculation scenario number ${index} with ${["acceleration", "momentum", "energy", "force", "velocity", "frequency"][index % 6]} to determine.`, options: ["1", "2", "3", "4"], question_type: "single_correct", active: true, verified: true });

describe("paper readiness and no cross-subject substitution", () => {
  beforeEach(() => { bank.rows = []; });
  it("does not treat spare Physics questions as Chemistry capacity", async () => {
    bank.rows = [...Array.from({ length: 6 }, (_, i) => row("Physics", i)), row("Chemistry", 0), row("Mathematics", 0), row("Mathematics", 1)];
    const report = await checkAvailability(config, { difficulty: "mixed" });
    expect(report.ready).toBe(false);
    await expect(generateTest(config, { difficulty: "mixed" })).rejects.toThrow("Only");
  });
  it("never launches a fake JEE Main MCQ-only full paper", async () => {
    bank.rows = ["Physics", "Chemistry", "Mathematics"].flatMap((s) => Array.from({ length: 25 }, (_, i) => row(s, i)));
    const report = await checkAvailability({ ...config, examKey: "jee-main", totalQuestions: 75, subjectDistribution: config.subjectDistribution.map((s) => ({ ...s, count: 25 })) }, { difficulty: "mixed" });
    expect(report.ready).toBe(false);
    expect(report.reason).toContain("MCQ and numerical split");
  });
  it("blocks generic JEE Advanced until section marking is configured", async () => {
    bank.rows = config.subjectDistribution.flatMap((s) => [row(s.name, 0), row(s.name, 1)]);
    expect((await checkAvailability({ ...config, examKey: "jee-adv" }, { difficulty: "mixed" })).ready).toBe(false);
  });
  it("launches complete supported practice with exact subject quotas", async () => {
    bank.rows = config.subjectDistribution.flatMap((s) => [row(s.name, 0), row(s.name, 1)]);
    const result = await generateTest(config, { difficulty: "mixed" });
    expect(result.questions).toHaveLength(6);
    for (const section of config.subjectDistribution) expect(result.questions.filter((q) => q.subject === section.name)).toHaveLength(2);
  });
});