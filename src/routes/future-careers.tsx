import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Brain, Code2, Bot, Shield, Database, Cloud, Palette, LineChart, Rocket, Globe, Briefcase, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/future-careers")({
  head: () => ({
    meta: [
      { title: "Future Careers in the AI World — Nexoras" },
      { name: "description", content: "Top careers for the AI era: salary, skills, learning roadmap and how AI will transform each field." },
    ],
  }),
  component: FutureCareersPage,
});

const CAREERS = [
  { icon: Brain, name: "AI Engineer", salary: "₹12-80 LPA", future: "🚀 Critical", impact: "AI builds itself with you", skills: ["Python", "PyTorch", "LLMs", "MLOps"], roadmap: ["ML basics → DL → LLMs → Build & deploy"] },
  { icon: Code2, name: "Software Engineer", salary: "₹6-50 LPA", future: "💪 Augmented", impact: "AI tools 3x your output", skills: ["DSA", "System Design", "Cloud", "AI tools"], roadmap: ["Language → Projects → DSA → Internship"] },
  { icon: Bot, name: "Robotics Engineer", salary: "₹8-40 LPA", future: "🚀 Booming", impact: "Embodied AI = real-world robots", skills: ["C++", "ROS", "CV", "Control"], roadmap: ["Arduino → ROS → Vision → Specialise"] },
  { icon: Shield, name: "Cybersecurity Analyst", salary: "₹8-45 LPA", future: "🔥 Critical", impact: "AI attacks need AI defences", skills: ["Networking", "Linux", "Pentesting", "Cloud security"], roadmap: ["Networking → CCNA → Sec+ → CEH/OSCP"] },
  { icon: Database, name: "Data Scientist", salary: "₹8-40 LPA", future: "📈 Stable", impact: "AI handles SQL, you handle insight", skills: ["Stats", "Python", "SQL", "Storytelling"], roadmap: ["Stats → Python → Kaggle → Domain"] },
  { icon: Cloud, name: "Cloud Engineer", salary: "₹9-45 LPA", future: "📈 High", impact: "Every AI runs on the cloud", skills: ["AWS/GCP/Azure", "K8s", "Terraform", "CI/CD"], roadmap: ["Linux → AWS Practitioner → Solutions Architect"] },
  { icon: Palette, name: "UI/UX Designer", salary: "₹6-35 LPA", future: "✨ Augmented", impact: "AI generates, you direct", skills: ["Figma", "User Research", "Design Systems"], roadmap: ["Figma → Case studies → Portfolio → Apply"] },
  { icon: LineChart, name: "Product Manager", salary: "₹15-60 LPA", future: "📈 Strong", impact: "AI literacy is now table stakes", skills: ["User research", "Data", "Strategy", "Communication"], roadmap: ["Side project → APM → PM"] },
  { icon: Rocket, name: "Entrepreneur", salary: "♾️", future: "🚀 Best time ever", impact: "Solo founders can build $1M+ co's", skills: ["Sales", "Building", "Storytelling"], roadmap: ["Solve own problem → Ship → Iterate"] },
  { icon: Globe, name: "Remote Generalist", salary: "$30-150/hr", future: "🌍 Massive", impact: "World is your hiring market", skills: ["Communication", "Self-management", "Niche skill"], roadmap: ["Pick niche → Portfolio → Upwork/Toptal"] },
  { icon: Briefcase, name: "Freelancer", salary: "₹3 LPA → unlimited", future: "📈 Growing", impact: "AI = solo agency leverage", skills: ["Niche craft", "Sales", "Client mgmt"], roadmap: ["Pick service → 3 free clients → Charge"] },
];

function FutureCareersPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Future Careers"
        title="What to learn for the AI world"
        description="11 careers that will dominate the next decade — with salaries, skills, and step-by-step learning paths."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAREERS.map((c) => (
            <div key={c.name} className="glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="flex items-start justify-between">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <c.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{c.future}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{c.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{c.impact}</p>

              <p className="mt-3 text-sm"><span className="text-muted-foreground">Salary: </span><span className="font-semibold">{c.salary}</span></p>

              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Core skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.skills.map((s) => <span key={s} className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px]">{s}</span>)}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Roadmap</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.roadmap[0]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-strong mt-10 rounded-2xl p-6 text-center">
          <h3 className="font-display text-xl font-bold">Not sure which path is right for you?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Explore stream-based roadmaps or ask Nexoras AI for personalised guidance.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/roadmaps"><Button className="bg-gradient-primary text-primary-foreground shadow-glow">View Stream Roadmaps <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link to="/chat"><Button variant="outline">Ask AI Coach</Button></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
