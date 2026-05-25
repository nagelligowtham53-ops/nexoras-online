import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TimetableBlock = {
  time: string;
  topic: string;
  mode: string;
  notes?: string;
};
export type TimetableDay = { day: string; blocks: TimetableBlock[] };
export type WeeklyTimetable = { summary: string; week: TimetableDay[] };

type Input = {
  goals: string;
  subjects: string;
  deadlines: string;
  hoursPerDay: number;
};

export const generateTimetable = createServerFn({ method: "POST" })
  .inputValidator((data: Input) => {
    if (!data || typeof data !== "object") throw new Error("Invalid input");
    return {
      goals: String(data.goals ?? "").slice(0, 2000),
      subjects: String(data.subjects ?? "").slice(0, 1000),
      deadlines: String(data.deadlines ?? "").slice(0, 2000),
      hoursPerDay: Math.min(14, Math.max(1, Number(data.hoursPerDay) || 4)),
    };
  })
  .handler(async ({ data }): Promise<WeeklyTimetable> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const system =
      "You are Nexoras, an expert AI study planner for students. Build a realistic, balanced 7-day study timetable. Distribute heavier focus to subjects with nearer deadlines. Include short breaks, revision, and at least one mock test slot. Keep blocks 45–90 minutes.";

    const user = `Goals:\n${data.goals || "(none specified)"}\n\nSubjects:\n${data.subjects || "(none specified)"}\n\nDeadlines:\n${data.deadlines || "(none specified)"}\n\nAvailable hours per day: ${data.hoursPerDay}`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_timetable",
            description: "Return the generated weekly timetable.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Short 1-2 sentence strategy summary." },
                week: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "Day name (Monday..Sunday)" },
                      blocks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            time: { type: "string", description: "e.g. 09:00 – 10:30" },
                            topic: { type: "string" },
                            mode: { type: "string", description: "Focus | Practice | Revision | Mock test | Break" },
                            notes: { type: "string" },
                          },
                          required: ["time", "topic", "mode"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["day", "blocks"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "week"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_timetable" } },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
      throw new Error(`AI gateway error [${res.status}]: ${text || res.statusText}`);
    }

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) throw new Error("AI did not return a timetable.");
    const parsed = JSON.parse(argsStr) as WeeklyTimetable;
    return parsed;
  });
