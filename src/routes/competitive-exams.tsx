import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { GraduationCap, Trophy, FileText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/competitive-exams")({
  head: () => ({
    meta: [
      { title: "Competitive Exams — JEE, NEET, UPSC, GATE, CAT | Nexoras" },
      { name: "description", content: "Comprehensive guides to India's top competitive exams: eligibility, syllabus, strategy, and timelines." },
    ],
  }),
  component: CompetitiveExamsPage,
});

const EXAMS = [
  { name: "JEE Main + Advanced", purpose: "B.Tech in NITs / IITs", level: "12th Science (PCM)", attempts: "Twice/year (Main)", link: "/crack-jee" },
  { name: "NEET UG", purpose: "MBBS / BDS admissions", level: "12th Science (PCB)", attempts: "Once/year" },
  { name: "BITSAT", purpose: "BITS Pilani / Goa / Hyderabad", level: "12th PCM", attempts: "Twice/year", link: "/mock-tests" },
  { name: "MHT CET", purpose: "Maharashtra Engg/Pharm", level: "12th PCM/PCB", attempts: "Once/year", link: "/mock-tests" },
  { name: "EAMCET (AP/TS)", purpose: "AP/Telangana Engg/Med", level: "12th PCM/PCB", attempts: "Once/year", link: "/mock-tests" },
  { name: "CUET UG", purpose: "Central University admissions", level: "12th any stream", attempts: "Once/year" },
  { name: "GATE", purpose: "M.Tech / PSU jobs", level: "B.Tech final year+", attempts: "Once/year" },
  { name: "CAT", purpose: "MBA at IIMs", level: "Graduate", attempts: "Once/year" },
  { name: "UPSC CSE", purpose: "IAS / IPS / IFS", level: "Graduate", attempts: "Once/year" },
  { name: "CLAT", purpose: "Law (NLUs)", level: "12th any stream", attempts: "Once/year" },
  { name: "NDA", purpose: "Defence forces", level: "12th PCM (Air/Navy)", attempts: "Twice/year" },
  { name: "SSC CGL", purpose: "Central govt jobs", level: "Graduate", attempts: "Once/year" },
];

function CompetitiveExamsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Competitive Exams"
        title="Every major Indian exam, explained"
        description="From JEE to UPSC — eligibility, purpose, and your starting point for each."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => (
            <div key={e.name} className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <Trophy className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px]">{e.attempts}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{e.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{e.purpose}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-accent"><GraduationCap className="h-3 w-3" /> {e.level}</p>
              {e.link && (
                <Link to={e.link}>
                  <Button size="sm" variant="ghost" className="mt-3 px-0 text-accent hover:bg-transparent">
                    Open guide <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="glass-strong mt-10 rounded-2xl p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-accent" />
          <h3 className="mt-2 font-display text-xl font-bold">Need a personalised study plan?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Use our AI planner to build a custom timetable for any exam.</p>
          <Link to="/tools"><Button className="mt-4 bg-gradient-primary text-primary-foreground shadow-glow">Open AI Planner</Button></Link>
        </div>
      </section>
    </PageShell>
  );
}
