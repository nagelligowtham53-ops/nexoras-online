import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({ meta: [{ title: "Blog & Resources — Nexoras" }, { name: "description", content: "Curated learning resources, study tips and student stories." }] }),
  component: Blog,
});

const posts = [
  { tag: "Productivity", title: "The 5-block study system used by IIT toppers", time: "6 min", excerpt: "A repeatable routine that works whether you have 2 or 12 hours a day." },
  { tag: "Career", title: "How to land your first frontend internship in 2026", time: "8 min", excerpt: "From portfolio basics to nailing the take-home assignment." },
  { tag: "AI", title: "Using AI ethically while studying", time: "5 min", excerpt: "A simple framework to learn faster without outsourcing your brain." },
  { tag: "Mindset", title: "Beating exam anxiety with deep work", time: "7 min", excerpt: "Tiny habits that compound to calm focus during exam season." },
  { tag: "Resume", title: "10 mistakes that are killing your resume", time: "4 min", excerpt: "Recruiter-tested fixes you can ship in 15 minutes." },
  { tag: "Interview", title: "System design 101 for students", time: "12 min", excerpt: "Whiteboard your first design without breaking a sweat." },
];

function Blog() {
  return (
    <PageShell>
      <PageHeader eyebrow="Blog & Learning Resources" title="Stories that make you sharper" description="Curated reads from Nexoras and the student community." />
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <article key={p.title} className="glass group flex flex-col rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow">
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs uppercase tracking-wider text-accent">{p.tag}</span>
              <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {p.time} read</p>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
