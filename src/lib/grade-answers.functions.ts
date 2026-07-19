import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GradeResultRow = {
  question_id: string;
  is_correct: boolean;
  correct_answer: Record<string, unknown> | null;
  solution: string | null;
  explanation: string | null;
};

type GradeInput = {
  q_ids: string[];
  user_answers: (unknown | null)[];
};

/**
 * Server-side grader. The `grade_answers` DB function is SECURITY DEFINER
 * and only callable by service_role. This wrapper enforces auth via
 * `requireSupabaseAuth` then calls the RPC with the admin client.
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
    return input;
  })
  .handler(async ({ data }): Promise<GradeResultRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("grade_answers" as never, {
      q_ids: data.q_ids,
      user_answers: data.user_answers,
    } as never);
    if (error) throw new Error(error.message);
    return (rows ?? []) as GradeResultRow[];
  });
