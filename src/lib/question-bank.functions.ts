import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OWNER_ADMIN_EMAILS = new Set(["nagelligowtham53@gmail.com"]);

export const ensureOwnerAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as { email?: string | null }).email ?? "").toLowerCase();
    if (!OWNER_ADMIN_EMAILS.has(email)) return { granted: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { granted: true };
  });

export const ensureQuestionBankSeeded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("questions")
      .select("id", { count: "exact", head: true });
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) return { seeded: false, count: count ?? 0 };

    const syllabus: Record<string, Record<11 | 12, string[]>> = {
      Physics: {
        11: ["Units & Measurements", "Motion in a Straight Line", "Motion in a Plane", "Laws of Motion", "Work, Energy & Power", "System of Particles & Rotational Motion", "Gravitation", "Mechanical Properties of Solids", "Mechanical Properties of Fluids", "Thermal Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves"],
        12: ["Electric Charges & Fields", "Electrostatic Potential & Capacitance", "Current Electricity", "Moving Charges & Magnetism", "Magnetism & Matter", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature of Radiation & Matter", "Atoms", "Nuclei", "Semiconductor Electronics"],
      },
      Chemistry: {
        11: ["Some Basic Concepts of Chemistry", "Structure of Atom", "Classification of Elements & Periodicity", "Chemical Bonding & Molecular Structure", "Thermodynamics", "Equilibrium", "Redox Reactions", "Hydrocarbons", "Organic Chemistry — Basic Principles", "s-Block Elements", "p-Block Elements (Group 13–14)"],
        12: ["Solutions", "Electrochemistry", "Chemical Kinetics", "d- and f-Block Elements", "Coordination Compounds", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes, Ketones & Carboxylic Acids", "Amines", "Biomolecules", "p-Block Elements (Group 15–18)"],
      },
      Mathematics: {
        11: ["Sets", "Relations & Functions", "Trigonometric Functions", "Complex Numbers & Quadratic Equations", "Linear Inequalities", "Permutations & Combinations", "Binomial Theorem", "Sequences & Series", "Straight Lines", "Conic Sections", "Introduction to 3D Geometry", "Limits & Derivatives", "Statistics", "Probability"],
        12: ["Relations & Functions (Advanced)", "Inverse Trigonometric Functions", "Matrices", "Determinants", "Continuity & Differentiability", "Application of Derivatives", "Integrals", "Application of Integrals", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry", "Linear Programming", "Probability (Advanced)"],
      },
      Biology: {
        11: ["The Living World", "Biological Classification", "Plant Kingdom", "Animal Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Animals", "Cell: The Unit of Life", "Biomolecules", "Cell Cycle & Cell Division", "Photosynthesis in Higher Plants", "Respiration in Plants", "Plant Growth & Development", "Breathing & Exchange of Gases", "Body Fluids & Circulation", "Excretory Products", "Locomotion & Movement", "Neural Control & Coordination", "Chemical Coordination & Integration"],
        12: ["Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health", "Principles of Inheritance & Variation", "Molecular Basis of Inheritance", "Evolution", "Human Health & Disease", "Microbes in Human Welfare", "Biotechnology — Principles & Processes", "Biotechnology & Its Applications", "Organisms & Populations", "Ecosystem", "Biodiversity & Conservation"],
      },
    };
    const variants = [
      { difficulty: "Easy", stem: "Which learning objective best matches this chapter?", correct: "Identify the central NCERT concept and basic definitions.", a: "Memorise unrelated facts from a different unit.", b: "Skip formula meaning and only guess options.", c: "Use advanced results before understanding basics.", seconds: 75 },
      { difficulty: "Medium", stem: "A student is revising this chapter for a timed CBT. What is the best first step?", correct: "List the governing laws, standard cases, and common traps for this chapter.", a: "Attempt only questions from unrelated subjects.", b: "Avoid examples and read only the index page.", c: "Use random shortcuts without checking assumptions.", seconds: 110 },
      { difficulty: "Hard", stem: "In an exam-level mixed-concept problem from this chapter, what should be checked first?", correct: "The applicable concept, boundary conditions, units, and hidden assumptions.", a: "Only the final numerical option.", b: "The longest answer choice regardless of reasoning.", c: "Whether the chapter name appears in the question.", seconds: 150 },
    ] as const;
    const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const rows = Object.entries(syllabus).flatMap(([subject, byClass]) =>
      ([11, 12] as const).flatMap((classLevel) =>
        byClass[classLevel].flatMap((chapter) => {
          const exams = subject === "Biology" ? ["NEET"] : subject === "Mathematics" ? ["JEE Main", "JEE Advanced"] : ["JEE Main", "JEE Advanced", "NEET"];
          return variants.map((variant) => ({
            external_id: `nexoras-seed-${slug(`${subject}-${classLevel}-${chapter}-${variant.difficulty}`)}`,
            exams,
            class_level: classLevel,
            subject,
            chapter,
            topic: "Foundational Practice",
            difficulty: variant.difficulty,
            question_type: "single_correct",
            source: "Original · Nexoras seeded question bank",
            is_pyq: false,
            is_ncert: true,
            marks: 4,
            negative_marks: 1,
            time_estimate_seconds: variant.seconds,
            question_text: `${subject} · Class ${classLevel} · ${chapter}: ${variant.stem}`,
            options: [variant.correct, variant.a, variant.b, variant.c],
            correct_answer: { type: "single", value: 0 },
            solution: `Connect the question to the core NCERT ideas in ${chapter}, then apply them systematically before choosing an option.`,
            explanation: `This original sample keeps the ${chapter} chapter testable in Nexoras. Expand it with licensed PYQs or curated original problems for production-depth practice.`,
            concepts: [chapter, subject, "NCERT"],
            tags: ["seeded-bank", slug(subject), variant.difficulty],
          }));
        }),
      ),
    );
    const { error } = await supabaseAdmin.from("questions").upsert(rows as never, { onConflict: "external_id" });
    if (error) throw new Error(error.message);
    return { seeded: true, count: rows.length };
  });