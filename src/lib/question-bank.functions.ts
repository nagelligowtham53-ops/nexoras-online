import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    const mockSubjects = [
      ["BITSAT", "Physics", 20, 3, 1], ["BITSAT", "Chemistry", 20, 3, 1], ["BITSAT", "Mathematics", 20, 3, 1],
      ["MHT CET", "Physics", 50, 1, 0], ["MHT CET", "Chemistry", 50, 1, 0], ["MHT CET", "Mathematics", 50, 1, 0],
      ["COMEDK UGET", "Physics", 60, 1, 0], ["COMEDK UGET", "Chemistry", 60, 1, 0], ["COMEDK UGET", "Mathematics", 60, 1, 0],
      ["EAMCET (AP/TS)", "Mathematics", 80, 1, 0], ["EAMCET (AP/TS)", "Physics", 40, 1, 0], ["EAMCET (AP/TS)", "Chemistry", 40, 1, 0],
      ["UPSC CSE Prelims", "History & Polity", 15, 2, 1], ["UPSC CSE Prelims", "Geography & Environment", 15, 2, 1], ["UPSC CSE Prelims", "Economy & Current Affairs", 15, 2, 1], ["UPSC CSE Prelims", "Science & Tech", 15, 2, 1],
      ["CAT (IIM)", "Verbal Ability & Reading Comprehension", 22, 3, 1], ["CAT (IIM)", "Data Interpretation & Logical Reasoning", 22, 3, 1], ["CAT (IIM)", "Quantitative Aptitude", 22, 3, 1],
      ["GATE (CSE)", "General Aptitude", 10, 2, 1], ["GATE (CSE)", "Engineering Mathematics", 13, 2, 1], ["GATE (CSE)", "Computer Science Core", 42, 2, 1],
      ["CA Foundation", "Accounting", 30, 1, 0], ["CA Foundation", "Business Laws", 25, 1, 0], ["CA Foundation", "Quantitative Aptitude", 25, 1, 0], ["CA Foundation", "Business Economics", 20, 1, 0],
      ["CFA Level I", "Ethics & Quant Methods", 25, 1, 0], ["CFA Level I", "Economics & Financial Reporting", 25, 1, 0], ["CFA Level I", "Equity & Fixed Income", 25, 1, 0], ["CFA Level I", "Derivatives & Portfolio Mgmt", 15, 1, 0],
      ["USMLE Step 1", "Anatomy & Physiology", 20, 1, 0], ["USMLE Step 1", "Pathology & Pharmacology", 25, 1, 0], ["USMLE Step 1", "Microbiology & Immunology", 20, 1, 0], ["USMLE Step 1", "Behavioral & Biochemistry", 15, 1, 0],
      ["SAT", "Reading & Writing", 40, 1, 0], ["SAT", "Math", 40, 1, 0], ["GRE General", "Verbal Reasoning", 27, 1, 0], ["GRE General", "Quantitative Reasoning", 27, 1, 0],
      ["IELTS Academic", "Listening", 20, 1, 0], ["IELTS Academic", "Reading", 20, 1, 0], ["IELTS Academic", "Writing & Grammar", 20, 1, 0],
      ["TOEFL iBT", "Reading", 20, 1, 0], ["TOEFL iBT", "Listening", 20, 1, 0], ["TOEFL iBT", "Structure & Vocabulary", 20, 1, 0],
      ["IMO / Math Olympiad", "Algebra", 8, 3, 0], ["IMO / Math Olympiad", "Number Theory", 8, 3, 0], ["IMO / Math Olympiad", "Combinatorics", 7, 3, 0], ["IMO / Math Olympiad", "Geometry", 7, 3, 0],
      ["Coding Contest", "Data Structures", 10, 3, 1], ["Coding Contest", "Algorithms", 10, 3, 1], ["Coding Contest", "Problem Solving & Complexity", 10, 3, 1],
      ["ICPC Prep", "Graphs & Trees", 8, 4, 0], ["ICPC Prep", "Dynamic Programming", 8, 4, 0], ["ICPC Prep", "Math & Number Theory", 5, 4, 0], ["ICPC Prep", "Greedy & Ad-hoc", 4, 4, 0],
    ] as const;
    const mockRows = mockSubjects.flatMap(([examName, subject, questionCount, marks, negativeMarks]) =>
      Array.from({ length: Math.min(questionCount, 12) }, (_, index) => {
        const n = index + 1;
        return {
          external_id: `nexoras-mock-seed-${slug(`${examName}-${subject}-${n}`)}`,
          exams: [examName],
          class_level: n % 2 === 0 ? 12 : 11,
          subject,
          chapter: subject,
          topic: "Mock Test Practice",
          difficulty: n % 3 === 1 ? "Easy" : n % 3 === 2 ? "Medium" : "Hard",
          question_type: "single_correct",
          source: "Original · Nexoras seeded mock question bank",
          is_pyq: false,
          is_ncert: false,
          marks,
          negative_marks: negativeMarks,
          time_estimate_seconds: 90 + n * 5,
          question_text: `${examName} · ${subject} · Q${n}: Which option shows the best exam-ready approach for this topic?`,
          options: ["Read the prompt, identify the tested concept, eliminate traps, then solve methodically.", "Choose the longest option without checking the concept.", "Ignore the data and answer from memory only.", "Skip all working because speed is the only factor."],
          correct_answer: { type: "single", value: 0 },
          solution: "A reliable CBT approach is to identify the concept, process the given information, eliminate traps, and then solve. This keeps speed and accuracy balanced.",
          explanation: `This is an original Nexoras sample question used to populate the real database-backed CBT flow for ${examName}. Replace or expand it with licensed or curated exam-depth content as needed.`,
          concepts: [subject, examName, "CBT"],
          tags: ["seeded-mock-bank", slug(examName)],
        };
      }),
    );
    const allRows = [...rows, ...mockRows];
    const { error } = await supabaseAdmin.from("questions").upsert(allRows as never, { onConflict: "external_id" });
    if (error) throw new Error(error.message);
    return { seeded: true, count: allRows.length };
  });