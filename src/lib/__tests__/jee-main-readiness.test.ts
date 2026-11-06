import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ExamConfig } from "../exam-config";

// Mock bank that honours subject AND question_type filters, like the real view.
const bank = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => {
  let subject = "";
  let types: string[] | null = null;
  const query = {
    select: () => query, overlaps: () => query, limit: () => query,
    in: (key: string, value: string[]) => { if (key === "question_type") types = value; return query; },
    eq: (key: string, value: unknown) => { if (key === "subject") subject = String(value); return query; },
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({
      data: bank.rows.filter((r) => r.subject === subject && (!types || types.includes(String(r.question_type)))),
      error: null,
    }).then(resolve),
  };
  return query;
} } }));
import { checkAvailability, generateTest, typeBlueprint } from "../test-generation";

const words = ["acceleration", "momentum", "energy", "force", "velocity", "frequency", "charge", "field", "torque", "pressure"];
const mcq = (subject: string, i: number) => ({
  id: `${subject}-m${i}`, subject, chapter: `Chapter ${i}`, chapter_id: `ch-${i}`, question_type: "single_correct",
  question_text: `A distinct ${subject} multiple choice problem ${i} about ${words[i % 10]} to evaluate carefully.`,
  options: ["1", "2", "3", "4"], active: true, verified: true,
});
const num = (subject: string, i: number) => ({
  id: `${subject}-n${i}`, subject, chapter: `Chapter N${i}`, chapter_id: `chn-${i}`, question_type: "numerical",
  question_text: `Compute the ${subject} numerical value ${i} for ${words[i % 10]} in this setup.`,
  options: null, active: true, verified: true,
});
const PCM = ["Physics", "Chemistry", "Mathematics"];

const jeeMain: ExamConfig = {
  id: "jm", examKey: "jee-main", examName: "JEE Main", examYear: 2026, paperName: "Paper 1", dbExam: "JEE Main",
  totalQuestions: 75, durationMinutes: 180, marksPerCorrect: 4, negativeMarks: 1,
  questionTypes: ["single_correct", "integer", "numerical"],
  subjectDistribution: PCM.map((name) => ({ name, count: 25 })),
  patternNote: "", difficultyProfile: "mixed", active: true,
};

describe("JEE Main full-length readiness (regression: 75/75 shown but blocked)", () => {
  beforeEach(() => { bank.rows = []; });

  it("requires 20 MCQ + 5 numerical per 25-question subject", () => {
    expect(typeBlueprint(jeeMain, 25).map((t) => [t.kind, t.required])).toEqual([["mcq", 20], ["numerical", 5]]);
  });

  it("does not count MCQs toward numerical slots and reports exact shortfalls", async () => {
    bank.rows = PCM.flatMap((s) => Array.from({ length: 40 }, (_, i) => mcq(s, i)));
    const report = await checkAvailability(jeeMain, { difficulty: "mixed" });
    expect(report.ready).toBe(false);
    expect(report.usable).toBe(60); // 20 MCQ per subject only — never 75
    for (const s of report.sections) {
      expect(s.byType.find((t) => t.kind === "numerical")).toMatchObject({ required: 5, available: 0 });
    }
    expect(report.reason).toContain("Physics needs 5 numerical (has 0)");
    await expect(generateTest(jeeMain, { difficulty: "mixed" })).rejects.toThrow();
  });

  it("generates the complete 75-question paper with the exact type split once numericals exist", async () => {
    bank.rows = PCM.flatMap((s) => [...Array.from({ length: 22 }, (_, i) => mcq(s, i)), ...Array.from({ length: 6 }, (_, i) => num(s, i))]);
    const report = await checkAvailability(jeeMain, { difficulty: "mixed" });
    expect(report.ready).toBe(true);
    const { questions } = await generateTest(jeeMain, { difficulty: "mixed" });
    expect(questions).toHaveLength(75);
    expect(new Set(questions.map((q) => q.dbId)).size).toBe(75);
    for (const s of PCM) {
      expect(questions.filter((q) => q.sectionName === s && q.type === "mcq")).toHaveLength(20);
      expect(questions.filter((q) => q.sectionName === s && q.type === "numerical")).toHaveLength(5);
    }
  });

  it("one subject short of numericals blocks the paper without borrowing from others", async () => {
    bank.rows = PCM.flatMap((s) => [...Array.from({ length: 22 }, (_, i) => mcq(s, i)), ...Array.from({ length: s === "Chemistry" ? 3 : 8 }, (_, i) => num(s, i))]);
    const report = await checkAvailability(jeeMain, { difficulty: "mixed" });
    expect(report.ready).toBe(false);
    expect(report.reason).toContain("Chemistry needs 5 numerical (has 3)");
    expect(report.reason).not.toContain("Physics needs");
  });
});

// Readiness and assembly must agree for every enabled exam pattern.
const patterns: ExamConfig[] = [
  jeeMain,
  { ...jeeMain, id: "b", examKey: "bitsat", examName: "BITSAT", dbExam: "BITSAT", totalQuestions: 100, questionTypes: ["single_correct"], subjectDistribution: [{ name: "Physics", count: 30 }, { name: "Chemistry", count: 30 }, { name: "Mathematics", count: 40 }] },
  { ...jeeMain, id: "c", examKey: "comedk", examName: "COMEDK", dbExam: "COMEDK UGET", totalQuestions: 60, questionTypes: ["single_correct"], subjectDistribution: PCM.map((name) => ({ name, count: 20 })) },
  { ...jeeMain, id: "e", examKey: "eamcet", examName: "EAMCET", dbExam: "EAMCET (AP/TS)", totalQuestions: 80, questionTypes: ["single_correct"], subjectDistribution: [{ name: "Mathematics", count: 40 }, { name: "Physics", count: 20 }, { name: "Chemistry", count: 20 }] },
  { ...jeeMain, id: "n", examKey: "neet", examName: "NEET", dbExam: "NEET", totalQuestions: 60, questionTypes: ["single_correct"], subjectDistribution: [{ name: "Physics", count: 30 }, { name: "Chemistry", count: 30 }] },
];

describe("readiness ⇔ assembly consistency for every enabled exam", () => {
  for (const config of patterns) {
    for (const [label, mcqCount, numCount] of [["sufficient", 45, 10], ["short MCQ", 10, 10], ["no numericals", 45, 0]] as const) {
      it(`${config.examName} — ${label}`, async () => {
        bank.rows = PCM.flatMap((s) => [...Array.from({ length: mcqCount }, (_, i) => mcq(s, i)), ...Array.from({ length: numCount }, (_, i) => num(s, i))]);
        const report = await checkAvailability(config, { difficulty: "mixed" });
        const result = await generateTest(config, { difficulty: "mixed" }).then((r) => r, () => null);
        expect(result !== null).toBe(report.ready);
        if (result) expect(result.questions).toHaveLength(config.totalQuestions);
      });
    }
  }
});
