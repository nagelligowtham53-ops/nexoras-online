import { describe, expect, it } from "vitest";
import { evaluateTest, markBreakdown, resolveSelection, toCorrectKey, type EvaluableQuestion } from "../evaluation";

const OPTS = [
  { id: "opt_1", text: "10 m/s" },
  { id: "opt_2", text: "20 m/s" },
  { id: "opt_3", text: "30 m/s" },
  { id: "opt_4", text: "40 m/s" },
];

function mcq(id: string, over: Partial<EvaluableQuestion> = {}): EvaluableQuestion {
  return { id, question_type: "single_correct", subject: "Physics", chapter: "Kinematics", difficulty: "Medium", options: OPTS, ...over };
}

const JEE_MAIN = { positive: 4, negative: 1, unattempted: 0 };

describe("marking — single correct MCQ", () => {
  it("awards the configured positive marks for a correct answer", () => {
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [mcq("q1")], answers: ["opt_3"],
      grades: { q1: { question_id: "q1", correct_answer: { type: "single", value: "opt_3" } } },
    });
    expect(r.submissions[0].is_correct).toBe(true);
    expect(r.submissions[0].final_marks).toBe(4);
    expect(r.submissions[0].negative_marks).toBe(0);
  });

  it("applies the configured negative marks for a wrong answer", () => {
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [mcq("q1")], answers: ["opt_1"],
      grades: { q1: { question_id: "q1", correct_answer: { type: "single", value: "opt_3" } } },
    });
    expect(r.submissions[0].is_correct).toBe(false);
    expect(r.submissions[0].final_marks).toBe(-1);
  });

  it("scores an unanswered question exactly zero", () => {
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [mcq("q1")], answers: [null],
      grades: { q1: { question_id: "q1", correct_answer: { type: "single", value: "opt_3" } } },
    });
    expect(r.submissions[0].is_attempted).toBe(false);
    expect(r.submissions[0].final_marks).toBe(0);
  });

  it("respects a non-standard exam scheme instead of assuming +4/-1", () => {
    const r = evaluateTest({
      test_id: "t1", marking: { positive: 1, negative: 0 }, questions: [mcq("q1")], answers: ["opt_1"],
      grades: { q1: { question_id: "q1", correct_answer: { type: "single", value: "opt_3" } } },
    });
    expect(r.submissions[0].final_marks).toBe(0); // MHT CET / COMEDK: no negative marking
  });
});

describe("regression — a correct answer must never receive negative marks", () => {
  it("keeps an ungraded attempt at zero rather than assuming it is wrong", () => {
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [mcq("q1")], answers: ["opt_3"], grades: {},
    });
    expect(r.submissions[0].is_correct).toBeNull();
    expect(r.submissions[0].graded).toBe(false);
    expect(r.submissions[0].final_marks).toBe(0);
    expect(r.ungraded_ids).toEqual(["q1"]);
  });

  it("never reports a negative total when every answer is correct", () => {
    const qs = [mcq("q1"), mcq("q2"), mcq("q3")];
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: qs, answers: ["opt_2", "opt_2", "opt_2"],
      grades: Object.fromEntries(qs.map((q) => [q.id, { question_id: q.id, correct_answer: { type: "single", value: "opt_2" } }])),
    });
    const b = markBreakdown(r.submissions);
    expect(b.negative_marks).toBe(0);
    expect(b.final_score).toBe(12);
    expect(b.max_score).toBe(12);
  });
});

describe("option shuffling", () => {
  it("still evaluates correctly when options are displayed in a different order", () => {
    const shuffled = [OPTS[2], OPTS[0], OPTS[3], OPTS[1]]; // correct answer now shown as "A"
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [mcq("q1", { options: shuffled })], answers: ["0"],
      grades: { q1: { question_id: "q1", correct_answer: { type: "single", value: "opt_3" } } },
    });
    expect(r.submissions[0].is_correct).toBe(true);
    expect(r.submissions[0].final_marks).toBe(4);
  });

  it("maps display index and letter labels onto the same stable option id", () => {
    const q = mcq("q1");
    expect(resolveSelection(q, "2")).toBe("opt_3");
    expect(resolveSelection(q, "C")).toBe("opt_3");
    expect(resolveSelection(q, "opt_3")).toBe("opt_3");
  });
});

describe("numerical answers", () => {
  const numQ: EvaluableQuestion = { id: "n1", question_type: "numerical", subject: "Physics" };

  it("accepts a value inside the configured tolerance", () => {
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [numQ], answers: ["9.81"],
      grades: { n1: { question_id: "n1", correct_answer: { type: "numeric", value: 9.8, tolerance: 0.05 } } },
    });
    expect(r.submissions[0].is_correct).toBe(true);
  });

  it("rejects a value outside the tolerance", () => {
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: [numQ], answers: ["9.5"],
      grades: { n1: { question_id: "n1", correct_answer: { type: "numeric", value: 9.8, tolerance: 0.05 } } },
    });
    expect(r.submissions[0].is_correct).toBe(false);
    expect(r.submissions[0].final_marks).toBe(-1);
  });
});

describe("multiple correct — set comparison", () => {
  const mQ: EvaluableQuestion = { id: "m1", question_type: "multiple_correct", options: OPTS };
  const key = { question_id: "m1", correct_answer: { type: "multiple", values: ["opt_1", "opt_3", "opt_4"] } };

  it("treats a differently ordered full set as correct", () => {
    const r = evaluateTest({ test_id: "t1", marking: { positive: 4, negative: 2 }, questions: [mQ], answers: [["opt_4", "opt_1", "opt_3"]], grades: { m1: key } });
    expect(r.submissions[0].is_correct).toBe(true);
    expect(r.submissions[0].final_marks).toBe(4);
  });

  it("treats an incomplete set as incorrect under a no-partial-credit scheme", () => {
    const r = evaluateTest({ test_id: "t1", marking: { positive: 4, negative: 2 }, questions: [mQ], answers: [["opt_1", "opt_3"]], grades: { m1: key } });
    expect(r.submissions[0].is_correct).toBe(false);
    expect(r.submissions[0].final_marks).toBe(-2);
  });
});

describe("answer key coercion", () => {
  it("returns null for unusable keys instead of guessing", () => {
    expect(toCorrectKey(null)).toBeNull();
    expect(toCorrectKey({ type: "numeric", value: "not-a-number" })).toBeNull();
    expect(toCorrectKey({ type: "mystery" })).toBeNull();
  });
});

describe("result summary arithmetic", () => {
  it("reports correct / wrong / unanswered counts and the exact score calculation", () => {
    const qs = [mcq("q1"), mcq("q2"), mcq("q3"), mcq("q4")];
    const r = evaluateTest({
      test_id: "t1", marking: JEE_MAIN, questions: qs,
      answers: ["opt_1", "opt_2", null, "opt_1"],
      grades: {
        q1: { question_id: "q1", correct_answer: { type: "single", value: "opt_1" } },
        q2: { question_id: "q2", correct_answer: { type: "single", value: "opt_3" } },
        q3: { question_id: "q3", correct_answer: { type: "single", value: "opt_1" } },
        q4: { question_id: "q4", correct_answer: { type: "single", value: "opt_1" } },
      },
    });
    const b = markBreakdown(r.submissions);
    expect(b).toMatchObject({ correct: 2, wrong: 1, unanswered: 1, positive_marks: 8, negative_marks: -1, final_score: 7, max_score: 16 });
    expect(r.summary.accuracy).toBe(67);
  });
});
