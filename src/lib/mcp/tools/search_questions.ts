import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "search_questions",
  title: "Search the Nexoras question bank",
  description:
    "Search JEE/NEET-style practice questions by exam, subject, chapter, or difficulty. Returns question text and options — never correct answers or solutions.",
  inputSchema: {
    exam: z.string().max(60).optional().describe("Exam code, e.g. 'JEE Main', 'NEET'."),
    subject: z.string().max(60).optional().describe("Subject, e.g. 'Physics'."),
    chapter: z.string().max(120).optional().describe("Chapter name."),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ exam, subject, chapter, difficulty, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase.from("questions_public").select("*").limit(limit ?? 5);
    if (exam) q = q.eq("exam", exam);
    if (subject) q = q.eq("subject", subject);
    if (chapter) q = q.eq("chapter", chapter);
    if (difficulty) q = q.eq("difficulty", difficulty);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { questions: data ?? [] },
    };
  },
});
