import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Cpu, Zap, Cog, Building2, Beaker, Rocket, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/engineering-roadmaps")({
  head: () => ({
    meta: [
      { title: "Engineering Branch Roadmaps — Nexoras" },
      { name: "description", content: "B.Tech branch-wise roadmaps: CSE, ECE, Mechanical, Civil, Chemical, Aerospace. Skills, projects, internships and placements." },
    ],
  }),
  component: EngineeringRoadmapsPage,
});

const BRANCHES = [
  {
    icon: Cpu, name: "Computer Science (CSE)",
    blurb: "Software, AI, web, mobile — highest placement rates and salaries.",
    sem: [
      "Sem 1-2: Programming (C/Python), Math, Discrete Math",
      "Sem 3-4: DSA, OS, DBMS, Computer Networks",
      "Sem 5-6: Web Dev / ML, Internship #1, Build 2 projects",
      "Sem 7-8: System Design, Open Source, Placement prep",
    ],
    careers: ["Software Engineer", "ML/AI Engineer", "Full-stack Dev", "DevOps", "Product"],
  },
  {
    icon: Zap, name: "Electronics & Comm (ECE)",
    blurb: "Hardware + software bridge — VLSI, embedded, signal processing, IoT.",
    sem: [
      "Sem 1-2: Math, Physics, Basic Electronics",
      "Sem 3-4: Digital, Analog, Signals, Microcontrollers",
      "Sem 5-6: VLSI / Embedded / Communication, Project 1",
      "Sem 7-8: Internship + placement prep (CSE roles open)",
    ],
    careers: ["VLSI Engineer", "Embedded Engineer", "Network Engineer", "SDE (cross-over)"],
  },
  {
    icon: Cog, name: "Mechanical",
    blurb: "Manufacturing, automotive, robotics, defence, EVs.",
    sem: [
      "Sem 1-2: Math, Engg Mechanics, Workshop",
      "Sem 3-4: Thermo, Fluid, Machine design",
      "Sem 5-6: CAD/CAM, Manufacturing, Internship",
      "Sem 7-8: Specialisation (Robotics / Auto / EV) + placements",
    ],
    careers: ["Design Engineer", "Production Engineer", "EV / Auto Engineer", "Robotics"],
  },
  {
    icon: Building2, name: "Civil",
    blurb: "Construction, infrastructure, smart cities, sustainability.",
    sem: [
      "Sem 1-2: Math, Mechanics, Surveying",
      "Sem 3-4: Structural Analysis, Concrete, Geotechnical",
      "Sem 5-6: Transportation, Environment, Site internship",
      "Sem 7-8: PMP basics, GATE prep, placements",
    ],
    careers: ["Site Engineer", "Structural Engineer", "Project Manager", "Govt (PSU/IES)"],
  },
  {
    icon: Beaker, name: "Chemical",
    blurb: "Process industry, pharma, energy, materials science.",
    sem: [
      "Sem 1-2: Chemistry, Math, Process basics",
      "Sem 3-4: Heat & Mass Transfer, Thermodynamics",
      "Sem 5-6: Reactor Design, Process Control, Internship",
      "Sem 7-8: GATE / GRE / placements",
    ],
    careers: ["Process Engineer", "Pharma R&D", "Energy", "Consulting"],
  },
  {
    icon: Rocket, name: "Aerospace",
    blurb: "Aircraft, drones, defence, space-tech (ISRO, SpaceX-style startups).",
    sem: [
      "Sem 1-2: Math, Physics, Aero basics",
      "Sem 3-4: Aerodynamics, Propulsion, Structures",
      "Sem 5-6: Avionics, Flight Mechanics, Internship",
      "Sem 7-8: GATE / ISRO / Placements",
    ],
    careers: ["Design Engineer", "ISRO Scientist", "Defence", "Space-tech Startup"],
  },
];

function EngineeringRoadmapsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Engineering Roadmaps"
        title="Branch-wise B.Tech roadmaps"
        description="What to learn semester by semester, project ideas, and the careers each branch unlocks."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          {BRANCHES.map((b) => (
            <div key={b.name} className="glass rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                  <b.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{b.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{b.blurb}</p>
                </div>
              </div>

              <ol className="mt-4 space-y-2">
                {b.sem.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Career options</p>
                <p className="mt-1 text-xs">{b.careers.join(" · ")}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-strong mt-10 rounded-2xl p-6 text-center">
          <h3 className="font-display text-xl font-bold">Not even in college yet?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Start with our Crack JEE playbook to land the right branch.</p>
          <Link to="/crack-jee"><Button className="mt-4 bg-gradient-primary text-primary-foreground shadow-glow">Crack JEE Guide <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>
    </PageShell>
  );
}
