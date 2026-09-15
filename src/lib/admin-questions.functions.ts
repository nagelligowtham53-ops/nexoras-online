import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

const ListInput = z.object({
  subject: z.string().max(60).default(""),
  search: z.string().max(200).default(""),
  limit: z.number().int().min(1).max(100).default(100),
});

export type AdminQuestionRow = {
  id: string;
  subject: string;
  chapter: string;
  topic: string | null;
  difficulty: string;
  question_type: string;
  year: number | null;
  question_text: string;
  options: Json;
  correct_answer: Json;
  explanation: string | null;
  solution: string | null;
  image_url: string | null;
  verified: boolean;
  active: boolean;
  review_status: string;
  source_type: string;
};

export const listAdminQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ListInput.parse(input))
  .handler(async ({ data, context }): Promise<AdminQuestionRow[]> => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !allowed) throw new Error("Admin access required");

    const { data: rows, error } = await context.supabase.rpc("admin_questions_list", {
      p_subject: data.subject || undefined,
      p_search: data.search || undefined,
      p_limit: data.limit,
    });
    if (error) throw new Error("The question list could not be loaded.");
    return (rows ?? []) as AdminQuestionRow[];
  });