import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, Clock, BarChart3, Lightbulb, Layers, Timer } from "lucide-react";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Curated Online Courses & Skills for 2026 | Nexoras" },
      { name: "description", content: "Hand-picked free and premium online courses across AI/ML, web development, DSA, design, cybersecurity and cloud — with guidance on how to actually learn from them, not just enroll." },
      { property: "og:title", content: "Courses & Skills — Nexoras" },
      { property: "og:description", content: "Curated free + premium courses for the AI era, across AI, web, DSA, design, security and cloud." },
      { property: "og:url", content: "https://nexoras.online/courses" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/courses" }],
  }),
  component: CoursesPage,
});

const COURSES = [
  { cat: "AI / ML", title: "Machine Learning Specialization", by: "Andrew Ng · Coursera", duration: "3 months", level: "Beginner", url: "https://www.coursera.org/specializations/machine-learning-introduction" },
  { cat: "AI / ML", title: "Deep Learning Specialization", by: "DeepLearning.AI", duration: "4 months", level: "Intermediate", url: "https://www.coursera.org/specializations/deep-learning" },
  { cat: "AI / ML", title: "Hugging Face NLP Course", by: "Hugging Face · Free", duration: "6 weeks", level: "Intermediate", url: "https://huggingface.co/learn/nlp-course" },
  { cat: "Web Dev", title: "The Odin Project", by: "Odin · Free", duration: "6 months", level: "Beginner", url: "https://www.theodinproject.com/" },
  { cat: "Web Dev", title: "Full Stack Open", by: "Univ of Helsinki · Free", duration: "3 months", level: "Intermediate", url: "https://fullstackopen.com/" },
  { cat: "DSA", title: "Striver's A2Z DSA Sheet", by: "Take U Forward · Free", duration: "Self-paced", level: "All levels", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/" },
  { cat: "Design", title: "Google UX Certificate", by: "Google · Coursera", duration: "6 months", level: "Beginner", url: "https://www.coursera.org/professional-certificates/google-ux-design" },
  { cat: "Design", title: "Refactoring UI", by: "Adam Wathan", duration: "Book", level: "Intermediate", url: "https://www.refactoringui.com/" },
  { cat: "Cybersecurity", title: "TryHackMe Pre-Security", by: "TryHackMe · Free", duration: "1 month", level: "Beginner", url: "https://tryhackme.com/path/outline/presecurity" },
  { cat: "Cybersecurity", title: "PortSwigger Web Security", by: "PortSwigger · Free", duration: "Self-paced", level: "Intermediate", url: "https://portswigger.net/web-security" },
  { cat: "Cloud", title: "AWS Cloud Practitioner", by: "AWS Skill Builder · Free", duration: "1 month", level: "Beginner", url: "https://aws.amazon.com/training/" },
  { cat: "Cloud", title: "KodeKloud DevOps Path", by: "KodeKloud", duration: "3 months", level: "Intermediate", url: "https://kodekloud.com/" },
  { cat: "Product", title: "Reforge / Lenny's Newsletter", by: "Lenny Rachitsky", duration: "Ongoing", level: "Intermediate", url: "https://www.lennysnewsletter.com/" },
  { cat: "Soft Skills", title: "Learning How to Learn", by: "Coursera · Free", duration: "4 weeks", level: "All", url: "https://www.coursera.org/learn/learning-how-to-learn" },
];

const CATS = ["All", ...Array.from(new Set(COURSES.map((c) => c.cat)))] as const;

const PRINCIPLES = [
  {
    icon: Lightbulb,
    title: "Pick one course, finish one course",
    body: "The biggest mistake students make is enrolling in five courses and finishing zero. Choose one course, block 30–45 minutes a day for it, and don't touch a second one until the first is shipped.",
  },
  {
    icon: Layers,
    title: "Build, don't just watch",
    body: "Video lectures feel like learning, but only retain ~10% of the material a month later. Pair every course with a project — a clone, a portfolio piece, a script that solves your own problem. Building forces real understanding.",
  },
  {
    icon: Timer,
    title: "Compress the timeline",
    body: "A course that says 12 weeks can usually be done in 6 if you focus. Don't optimise for the pace the platform recommends — optimise for shipping faster so you can move to the next thing.",
  },
];

function CoursesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Courses & Skills"
        title="Learn what actually matters in 2026"
        description="Hand-picked free and premium courses across AI, web, DSA, design, security and cloud — plus the principles that separate students who finish from students who don't."
      />

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <span key={c} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">
              {c}
            </span>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => (
            <a
              key={c.title}
              href={c.url}
              target="_blank"
              rel="noreferrer noopener"
              className="glass group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">
                  {c.cat}
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
              </div>
              <h2 className="mt-3 font-display text-base font-semibold leading-snug">{c.title}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.by}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration}</span>
                <span className="inline-flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {c.level}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* How to actually learn */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <h2 className="font-display text-2xl font-bold">How to actually learn from an online course</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Three principles that separate students who finish courses from students who just enroll in them.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <article key={p.title} className="glass rounded-2xl p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="glass-strong rounded-2xl p-6 text-center lg:p-10">
          <Sparkles className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-2 font-display text-xl font-bold lg:text-2xl">
            Want a custom learning path?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell Nexoras AI your goal and current level — get a personalised week-by-week curriculum that combines courses, projects, and checkpoints.
          </p>
          <Link to="/chat">
            <Button className="mt-4 bg-gradient-primary text-primary-foreground shadow-glow">
              Ask AI Coach
            </Button>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
