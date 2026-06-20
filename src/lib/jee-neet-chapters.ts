// Chapter lists for JEE (PCM) and NEET (PCB), split by NCERT class.
// Used by the Custom Practice mode.

export type ExamTrack = "jee-main" | "jee-adv" | "neet";
export type ClassLevel = "11" | "12" | "all";
export type Subject = "Physics" | "Chemistry" | "Mathematics" | "Biology";

export const CHAPTERS: Record<Subject, Record<"11" | "12", string[]>> = {
  Physics: {
    "11": [
      "Units & Measurements",
      "Motion in a Straight Line",
      "Motion in a Plane",
      "Laws of Motion",
      "Work, Energy & Power",
      "System of Particles & Rotational Motion",
      "Gravitation",
      "Mechanical Properties of Solids",
      "Mechanical Properties of Fluids",
      "Thermal Properties of Matter",
      "Thermodynamics",
      "Kinetic Theory",
      "Oscillations",
      "Waves",
    ],
    "12": [
      "Electric Charges & Fields",
      "Electrostatic Potential & Capacitance",
      "Current Electricity",
      "Moving Charges & Magnetism",
      "Magnetism & Matter",
      "Electromagnetic Induction",
      "Alternating Current",
      "Electromagnetic Waves",
      "Ray Optics",
      "Wave Optics",
      "Dual Nature of Radiation & Matter",
      "Atoms",
      "Nuclei",
      "Semiconductor Electronics",
    ],
  },
  Chemistry: {
    "11": [
      "Some Basic Concepts of Chemistry",
      "Structure of Atom",
      "Classification of Elements & Periodicity",
      "Chemical Bonding & Molecular Structure",
      "Thermodynamics",
      "Equilibrium",
      "Redox Reactions",
      "Hydrocarbons",
      "Organic Chemistry — Basic Principles",
      "s-Block Elements",
      "p-Block Elements (Group 13–14)",
    ],
    "12": [
      "Solutions",
      "Electrochemistry",
      "Chemical Kinetics",
      "d- and f-Block Elements",
      "Coordination Compounds",
      "Haloalkanes & Haloarenes",
      "Alcohols, Phenols & Ethers",
      "Aldehydes, Ketones & Carboxylic Acids",
      "Amines",
      "Biomolecules",
      "p-Block Elements (Group 15–18)",
    ],
  },
  Mathematics: {
    "11": [
      "Sets",
      "Relations & Functions",
      "Trigonometric Functions",
      "Complex Numbers & Quadratic Equations",
      "Linear Inequalities",
      "Permutations & Combinations",
      "Binomial Theorem",
      "Sequences & Series",
      "Straight Lines",
      "Conic Sections",
      "Introduction to 3D Geometry",
      "Limits & Derivatives",
      "Statistics",
      "Probability",
    ],
    "12": [
      "Relations & Functions (Advanced)",
      "Inverse Trigonometric Functions",
      "Matrices",
      "Determinants",
      "Continuity & Differentiability",
      "Application of Derivatives",
      "Integrals",
      "Application of Integrals",
      "Differential Equations",
      "Vector Algebra",
      "Three Dimensional Geometry",
      "Linear Programming",
      "Probability (Advanced)",
    ],
  },
  Biology: {
    "11": [
      "The Living World",
      "Biological Classification",
      "Plant Kingdom",
      "Animal Kingdom",
      "Morphology of Flowering Plants",
      "Anatomy of Flowering Plants",
      "Structural Organisation in Animals",
      "Cell: The Unit of Life",
      "Biomolecules",
      "Cell Cycle & Cell Division",
      "Photosynthesis in Higher Plants",
      "Respiration in Plants",
      "Plant Growth & Development",
      "Breathing & Exchange of Gases",
      "Body Fluids & Circulation",
      "Excretory Products",
      "Locomotion & Movement",
      "Neural Control & Coordination",
      "Chemical Coordination & Integration",
    ],
    "12": [
      "Sexual Reproduction in Flowering Plants",
      "Human Reproduction",
      "Reproductive Health",
      "Principles of Inheritance & Variation",
      "Molecular Basis of Inheritance",
      "Evolution",
      "Human Health & Disease",
      "Microbes in Human Welfare",
      "Biotechnology — Principles & Processes",
      "Biotechnology & Its Applications",
      "Organisms & Populations",
      "Ecosystem",
      "Biodiversity & Conservation",
    ],
  },
};

export function subjectsForExam(exam: ExamTrack): Subject[] {
  if (exam === "neet") return ["Physics", "Chemistry", "Biology"];
  return ["Physics", "Chemistry", "Mathematics"];
}

export function chaptersFor(subject: Subject, cls: ClassLevel): string[] {
  if (cls === "11") return CHAPTERS[subject]["11"];
  if (cls === "12") return CHAPTERS[subject]["12"];
  return [...CHAPTERS[subject]["11"], ...CHAPTERS[subject]["12"]];
}
