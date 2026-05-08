import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Heart, Rocket, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Nexoras" }, { name: "description", content: "Our mission is to help every student study smarter with AI." }] }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHeader eyebrow="About" title="Built by students, for students" description="We're on a mission to make world-class learning tools accessible to every student on the planet." />
      <section className="mx-auto max-w-5xl space-y-10 px-4 py-12 lg:px-8">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Nexoras started in a dorm room with a simple idea: what if every student had a personal AI mentor,
          a beautiful planner, and the right tools — all in one place? Today, we serve students across 60+
          universities and we're just getting started.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: Heart, t: "Student-first", d: "Every decision starts with a student in mind." },
            { icon: Rocket, t: "Move fast", d: "We ship weekly so you study smarter sooner." },
            { icon: Users, t: "Built in public", d: "Driven by community, transparent by default." },
          ].map((v) => (
            <div key={v.t} className="glass rounded-2xl p-6">
              <v.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-display font-semibold">{v.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
