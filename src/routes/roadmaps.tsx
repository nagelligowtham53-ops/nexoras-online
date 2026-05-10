import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, IndianRupee, BookOpen, Trophy, Briefcase, Globe, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/roadmaps")({
  head: () => ({
    meta: [
      { title: "Career Roadmaps — Nexoras" },
      { name: "description", content: "Stream-based career roadmaps: MPC, BiPC, MEC, CEC, Arts, Diploma & Polytechnic. Skills, salary, colleges, certifications & step-by-step paths." },
    ],
  }),
  component: RoadmapsPage,
});

type Career = {
  title: string;
  why: string;
  salary: string;
  demand: string;
  remote: string;
  skills: string[];
  steps: string[];
  certifications: string[];
  colleges: string[];
};
type Stream = {
  key: string;
  name: string;
  tag: string;
  blurb: string;
  careers: Career[];
};

const STREAMS: Stream[] = [
  {
    key: "mpc", name: "MPC", tag: "Maths · Physics · Chemistry",
    blurb: "Engineering, AI, research and tech entrepreneurship — the most flexible stream for the AI era.",
    careers: [
      {
        title: "AI Engineer",
        why: "Build models and AI products that power the next decade of software.",
        salary: "₹8–60 LPA (₹1Cr+ at FAANG)",
        demand: "🔥 Extreme — fastest growing field globally",
        remote: "Highly remote-friendly",
        skills: ["Python", "PyTorch / TensorFlow", "ML Math (Linear Algebra, Stats)", "LLMs & RAG", "MLOps", "SQL"],
        steps: [
          "Master Python + Numpy + Pandas",
          "Learn ML fundamentals (Andrew Ng course)",
          "Build 3 projects on Kaggle",
          "Learn deep learning (PyTorch)",
          "Specialise: NLP / CV / LLMs",
          "Build a portfolio + GitHub presence",
          "Apply for ML internships → full-time",
        ],
        certifications: ["DeepLearning.AI Specialization", "AWS ML Specialty", "Hugging Face Courses"],
        colleges: ["IITs", "IIITs", "BITS Pilani", "NITs", "IISc"],
      },
      {
        title: "Software Engineer",
        why: "Backbone of every modern company — highest hiring volume worldwide.",
        salary: "₹6–50 LPA",
        demand: "Very high",
        remote: "Excellent remote opportunities",
        skills: ["DSA", "JavaScript / Python / Java", "System Design", "Databases", "Cloud (AWS/GCP)", "Git"],
        steps: [
          "Learn one language deeply",
          "Solve 300+ DSA problems",
          "Build full-stack projects",
          "Learn system design basics",
          "Contribute to open source",
          "Crack internships",
        ],
        certifications: ["AWS Cloud Practitioner", "Google Associate Cloud Engineer"],
        colleges: ["IITs", "NITs", "IIITs", "BITS", "VIT", "PESU"],
      },
      {
        title: "Data Scientist",
        why: "Turn data into decisions — every company needs one.",
        salary: "₹7–40 LPA",
        demand: "High",
        remote: "Mostly remote",
        skills: ["Python", "Statistics", "SQL", "ML", "Visualization", "Storytelling"],
        steps: ["Stats + Probability", "SQL fluency", "ML basics", "End-to-end Kaggle project", "Domain specialisation"],
        certifications: ["Google Data Analytics", "IBM Data Science"],
        colleges: ["ISI", "IITs", "IIMs (PGDBA)", "IIITs"],
      },
      {
        title: "Robotics Engineer",
        why: "Hardware + AI — drones, autonomous vehicles, humanoids.",
        salary: "₹6–35 LPA",
        demand: "Growing fast",
        remote: "Hybrid (lab work needed)",
        skills: ["C++", "ROS", "Embedded Systems", "Computer Vision", "Control Theory"],
        steps: ["Arduino/Raspberry Pi projects", "Learn ROS", "Build a self-balancing bot", "Specialise"],
        certifications: ["Coursera Robotics Specialization (UPenn)"],
        colleges: ["IIT Bombay/Madras", "IIIT-H", "BITS"],
      },
      {
        title: "Startup Founder",
        why: "Build your own AI-era company — leverage compounds rapidly.",
        salary: "Unlimited (and unpredictable)",
        demand: "Always",
        remote: "Yes",
        skills: ["Product thinking", "Sales", "Engineering", "Storytelling", "Ruthless prioritisation"],
        steps: ["Solve a real problem you have", "Ship MVP in 30 days", "Talk to 100 users", "Iterate weekly"],
        certifications: ["YC Startup School (free)"],
        colleges: ["Any — but IITs, BITS, IIMs help with network"],
      },
    ],
  },
  {
    key: "bipc", name: "BiPC", tag: "Biology · Physics · Chemistry",
    blurb: "Medicine, biotech, healthcare AI and life sciences research.",
    careers: [
      {
        title: "Doctor (MBBS → MD)",
        why: "Most respected profession; AI augmentation makes doctors super-powered.",
        salary: "₹6–80 LPA after specialisation",
        demand: "Always high",
        remote: "Limited (telemedicine growing)",
        skills: ["Biology mastery", "Empathy", "Memory", "Critical thinking"],
        steps: ["Crack NEET", "MBBS (5.5 years)", "Internship", "Crack NEET PG", "Specialise"],
        certifications: ["USMLE (for US)", "PLAB (UK)"],
        colleges: ["AIIMS Delhi", "JIPMER", "CMC Vellore", "MAMC", "KGMU"],
      },
      {
        title: "Biotechnology / Genomics Engineer",
        why: "CRISPR, AI-drug-discovery, personalised medicine — the hottest frontier.",
        salary: "₹5–30 LPA",
        demand: "Booming",
        remote: "Hybrid",
        skills: ["Molecular Biology", "Bioinformatics", "Python", "Lab techniques"],
        steps: ["B.Tech Biotech / B.Sc.", "Bioinformatics specialisation", "M.Tech / M.S.", "Industry / PhD"],
        certifications: ["Coursera Genomic Data Science", "edX Bioinformatics"],
        colleges: ["IIT Madras (Biotech)", "IIIT-Hyderabad CCNSB", "IISc"],
      },
      {
        title: "Healthcare AI Specialist",
        why: "Medical imaging, diagnostics & drug discovery powered by AI.",
        salary: "₹10–50 LPA",
        demand: "Exploding",
        remote: "Very remote-friendly",
        skills: ["Python", "ML", "Medical domain knowledge", "Image processing"],
        steps: ["B.Sc / B.Tech", "Learn ML", "Healthcare domain courses", "Build a diagnostic project"],
        certifications: ["AI for Medicine Specialization (Coursera)"],
        colleges: ["IISc", "IIT Madras", "AIIMS + IIT joint programs"],
      },
      {
        title: "Clinical Psychologist",
        why: "Mental health is a global crisis — therapists are in massive demand.",
        salary: "₹5–25 LPA",
        demand: "High & rising",
        remote: "Excellent",
        skills: ["Empathy", "Listening", "Research", "Therapy techniques"],
        steps: ["B.A./B.Sc. Psychology", "M.A. Psychology", "M.Phil Clinical Psych (RCI)", "Practice"],
        certifications: ["RCI license", "CBT certification"],
        colleges: ["NIMHANS", "TISS", "Ambedkar University", "Christ University"],
      },
    ],
  },
  {
    key: "mec", name: "MEC", tag: "Maths · Economics · Commerce",
    blurb: "Finance, consulting, analytics, CA, IIM-bound — math + business power combo.",
    careers: [
      {
        title: "Chartered Accountant (CA)",
        why: "Evergreen, recession-proof, respected.",
        salary: "₹8–40 LPA (partners earn ₹1Cr+)",
        demand: "Always",
        remote: "Hybrid",
        skills: ["Accounting", "Tax", "Audit", "Financial reporting"],
        steps: ["CA Foundation", "Intermediate", "3-yr Articleship", "Final"],
        certifications: ["ACCA", "CFA add-on"],
        colleges: ["ICAI (institute-led)"],
      },
      {
        title: "Investment Banker",
        why: "Highest-paid role on the street; global mobility.",
        salary: "₹15–80 LPA",
        demand: "High at top firms",
        remote: "Mostly on-site",
        skills: ["Financial modelling", "Excel mastery", "Valuation", "Deal-making"],
        steps: ["B.Com / Eco / BBA", "Internships", "MBA / CFA", "Front-office IB"],
        certifications: ["CFA", "FRM"],
        colleges: ["SRCC", "St. Stephen's", "IIMs (MBA)", "ISB"],
      },
      {
        title: "Business / Data Analyst",
        why: "Bridge between business & data — entry-friendly.",
        salary: "₹5–25 LPA",
        demand: "Very high",
        remote: "Excellent",
        skills: ["SQL", "Excel", "Tableau/Power BI", "Storytelling"],
        steps: ["B.Com / BBA", "Learn SQL + Excel", "Build dashboards", "Apply"],
        certifications: ["Google Data Analytics", "Microsoft PL-300"],
        colleges: ["Any reputed B.Com college"],
      },
    ],
  },
  {
    key: "cec", name: "CEC", tag: "Civics · Economics · Commerce",
    blurb: "Civil services, law, public policy & business administration.",
    careers: [
      {
        title: "IAS Officer (UPSC)",
        why: "Direct impact on the nation; respect & power.",
        salary: "₹56k–2.5L/month + perks",
        demand: "Limited seats, massive applicants",
        remote: "No",
        skills: ["GS", "Optional subject mastery", "Essay writing", "Interview presence"],
        steps: ["Graduate any stream", "Prelims → Mains → Interview", "2-3 year prep"],
        certifications: ["—"],
        colleges: ["Delhi University", "JNU", "any tier-1 college"],
      },
      {
        title: "Lawyer / Corporate Law",
        why: "AI ethics, IP, M&A — law is becoming tech-heavy.",
        salary: "₹5–60 LPA",
        demand: "High",
        remote: "Hybrid",
        skills: ["Reading + writing", "Argumentation", "Domain depth"],
        steps: ["CLAT", "5-yr BA-LLB", "AIBE", "Litigation / Firm"],
        certifications: ["LLM specialisation"],
        colleges: ["NLSIU Bangalore", "NALSAR Hyderabad", "NLU Delhi"],
      },
    ],
  },
  {
    key: "arts", name: "Arts", tag: "Humanities & Social Sciences",
    blurb: "Design, content, journalism, psychology, public policy & creative AI.",
    careers: [
      {
        title: "UI/UX Designer",
        why: "Every product needs design — AI tools amplify designers 10x.",
        salary: "₹6–35 LPA",
        demand: "Very high",
        remote: "Excellent",
        skills: ["Figma", "User research", "Prototyping", "Design systems"],
        steps: ["Learn Figma", "3 redesign case studies", "UX foundations course", "Portfolio site", "Apply"],
        certifications: ["Google UX Certificate", "Interaction Design Foundation"],
        colleges: ["NID", "IIT IDC", "Srishti", "MIT Pune"],
      },
      {
        title: "Content Creator / Digital Journalist",
        why: "Creator economy + AI tooling = solo media empires.",
        salary: "₹3 LPA → unlimited",
        demand: "Niche-dependent",
        remote: "Yes",
        skills: ["Storytelling", "Editing", "SEO", "Distribution"],
        steps: ["Pick a niche", "Publish weekly for 12 months", "Build audience", "Monetise"],
        certifications: ["—"],
        colleges: ["IIMC", "ACJ", "Symbiosis"],
      },
    ],
  },
  {
    key: "diploma", name: "Diploma", tag: "Polytechnic & Industrial",
    blurb: "Hands-on technical careers with fast entry into industry & lateral entry to B.Tech.",
    careers: [
      {
        title: "Mechanical Diploma → B.Tech (Lateral)",
        why: "Industry-ready in 3 years; lateral entry to engineering.",
        salary: "₹3–12 LPA after diploma; more after B.Tech",
        demand: "Steady",
        remote: "No",
        skills: ["AutoCAD", "Manufacturing", "Workshop", "GD&T"],
        steps: ["3-yr Diploma", "Apprenticeship", "Lateral entry to B.Tech (ECET)", "Job"],
        certifications: ["NPTEL courses", "SolidWorks certification"],
        colleges: ["Government Polytechnics", "MSBTE", "SBTET"],
      },
      {
        title: "Electrical / Electronics Diploma",
        why: "Power, robotics, embedded — high industry demand.",
        salary: "₹3–10 LPA",
        demand: "High",
        remote: "Limited",
        skills: ["Circuit design", "PLC", "Embedded C", "Microcontrollers"],
        steps: ["3-yr Diploma", "Internships", "Lateral B.Tech / ITI specialist"],
        certifications: ["NPTEL Embedded Systems"],
        colleges: ["Govt Polytechnics"],
      },
    ],
  },
];

function RoadmapsPage() {
  const [active, setActive] = useState<Stream>(STREAMS[0]);
  const [openCareer, setOpenCareer] = useState<string | null>(null);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Career Roadmaps"
        title="Choose your stream. Build your future."
        description="Stream-by-stream guidance with skills, salary, colleges, certifications and step-by-step roadmaps for the AI era."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {STREAMS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setActive(s); setOpenCareer(null); }}
              className={`rounded-xl border px-4 py-2 text-sm transition-all ${
                active.key === s.key
                  ? "border-accent/60 bg-gradient-primary text-primary-foreground shadow-glow"
                  : "border-border bg-background/40 hover:border-accent/40"
              }`}
            >
              <div className="font-semibold">{s.name}</div>
              <div className="text-[10px] opacity-80">{s.tag}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 glass rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-6 w-6 text-accent" />
            <div>
              <h2 className="font-display text-2xl font-bold">{active.name} <span className="text-muted-foreground text-base">— {active.tag}</span></h2>
              <p className="mt-1 text-sm text-muted-foreground">{active.blurb}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {active.careers.map((c) => {
            const isOpen = openCareer === c.title;
            return (
              <div key={c.title} className="glass rounded-2xl p-6 transition-all hover:shadow-glow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.why}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <Stat icon={IndianRupee} label="Salary" value={c.salary} />
                  <Stat icon={Trophy} label="Demand" value={c.demand} />
                  <Stat icon={Globe} label="Remote" value={c.remote} />
                  <Stat icon={Briefcase} label="Skills" value={`${c.skills.length} core`} />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 px-0 text-accent hover:bg-transparent"
                  onClick={() => setOpenCareer(isOpen ? null : c.title)}
                >
                  {isOpen ? "Hide roadmap" : "View full roadmap"} <ArrowRight className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </Button>

                {isOpen && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Skills required</h4>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.skills.map((s) => (
                          <span key={s} className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Step-by-step roadmap</h4>
                      <ol className="mt-2 space-y-2">
                        {c.steps.map((s, i) => (
                          <li key={i} className="flex gap-3 text-sm">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Top certifications</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        {c.certifications.map((s) => (
                          <li key={s} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> {s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">Recommended colleges</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{c.colleges.join(" · ")}</p>
                    </div>

                    <Link to="/mock-interview">
                      <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow">
                        <BookOpen className="h-4 w-4" /> Practice this role's interview
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3 text-accent" /> {label}
      </div>
      <div className="mt-0.5 text-xs font-medium">{value}</div>
    </div>
  );
}
