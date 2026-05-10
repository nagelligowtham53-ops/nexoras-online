import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, Clock, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses & Skills — Nexoras" },
      { name: "description", content: "Curated courses for the AI era: AI/ML, web dev, design, cybersecurity, cloud and more — free + premium." },
    ],
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

function CoursesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Courses & Skills"
        title="Learn what actually matters in 2026"
        description="Hand-picked free + premium courses across AI, web, DSA, design, security and cloud — curated by Nexoras."
      />
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {CATS.map((c) => (
            <span key={c} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs">{c}</span>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => (
            <a key={c.title} href={c.url} target="_blank" rel="noreferrer noopener"
              className="glass group rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-glow">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-accent">{c.cat}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold leading-snug">{c.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{c.by}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration}</span>
                <span className="inline-flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {c.level}</span>
              </div>
            </a>
          ))}
        </div>

        <div className="glass-strong mt-10 rounded-2xl p-6 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-accent" />
          <h3 className="mt-2 font-display text-xl font-bold">Want a custom learning path?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tell Nexoras AI your goal and get a personalised week-by-week curriculum.</p>
          <Link to="/chat"><Button className="mt-4 bg-gradient-primary text-primary-foreground shadow-glow">Ask AI Coach</Button></Link>
        </div>
      </section>
    </PageShell>
  );
}
