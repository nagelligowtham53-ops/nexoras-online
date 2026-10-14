import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type GradeResultRow = {
  question_id: string;
  is_correct: boolean;
  correct_answer: Json;
  solution: string | null;
  explanation: string | null;
};

type GradeInput = {
  q_ids: string[];
  user_answers: (unknown | null)[];
};

/**
 * Server-side grader. The `grade_answers` DB function is SECURITY DEFINER
 * checks auth.uid(). Use the caller's authenticated client: the admin client
 * does not carry that identity and causes the RPC to reject valid students.
 */
export const gradeAnswersServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GradeInput) => {
    if (!input || !Array.isArray(input.q_ids) || !Array.isArray(input.user_answers)) {
      throw new Error("Invalid input");
    }
    if (input.q_ids.length !== input.user_answers.length) {
      throw new Error("q_ids and user_answers must be same length");
    }
    if (input.q_ids.length > 500) throw new Error("Too many questions");
    z.array(z.string().uuid()).parse(input.q_ids);
    if (new Set(input.q_ids).size !== input.q_ids.length) throw new Error("Duplicate question IDs");
    return input;
  })
  .handler(async ({ data, context }): Promise<GradeResultRow[]> => {
    if (data.q_ids.length === 0) return [];
    const { data: rows, error } = await context.supabase.rpc("grade_answers" as never, {
      q_ids: data.q_ids,
      user_answers: data.user_answers,
    } as never);
    if (error) {
      console.error("[grade-answers] authenticated grading failed", { code: error.code });
      throw new Error("Your answers could not be graded. Please retry submission; no marks have been deducted.");
    }
    const result = (rows ?? []) as GradeResultRow[];
    const returned = new Set(result.map((row) => row.question_id));
    if (returned.size !== data.q_ids.length || data.q_ids.some((id) => !returned.has(id))) {
      throw new Error("Some questions could not be graded. Your test has not been finalized; please retry submission.");
    }
    return result;
  });
