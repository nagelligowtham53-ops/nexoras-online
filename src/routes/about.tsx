import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Heart, Rocket, Users, Target, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Nexoras — Our Mission, Team & Story" },
      { name: "description", content: "Nexoras is an AI-powered productivity ecosystem for students. Learn about our mission, who we are, how we build, and why we exist." },
      { property: "og:title", content: "About Nexoras — Built for Students, by Students" },
      { property: "og:description", content: "Our mission, team, values and the story behind Nexoras — the AI productivity platform for the next generation of students." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About Nexoras"
        title="An AI productivity platform built for students"
        description="We're on a mission to give every student access to the same world-class study, career, and productivity tools that the most ambitious professionals use every day."
      />
      <section className="mx-auto max-w-4xl space-y-12 px-4 py-12 lg:px-8">
        <div>
          <h2 className="font-display text-2xl font-bold">Our mission</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Nexoras exists to remove the friction between a student and their goals. Whether you're preparing for JEE,
            building your first resume, navigating a career switch, or trying to study with focus in a noisy world, our
            AI-powered tools are designed to help you make consistent, measurable progress without burning out. We
            believe great learning tools shouldn't be locked behind expensive coaching institutes — they should be
            accessible to anyone with curiosity and a laptop.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">What we build</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Nexoras is a single platform that combines an AI study planner, a full mock test simulator for competitive
            exams (JEE Main, JEE Advanced, BITSAT, EAMCET, MHT CET and more), an AI-powered resume builder with ATS
            scoring, mock interview practice, career roadmaps, and a growing library of long-form learning content. Every
            feature is built on real student feedback — not theoretical guesses about what learners need.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">Our story</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Nexoras started as a side project among engineering students who were tired of stitching together five
            different tools — one for notes, one for flashcards, one for resume, one for mock tests, one for tracking
            progress. The friction of switching tabs was killing momentum. We built the first version of Nexoras in a
            college dorm room over a winter break. Today the platform is used by thousands of students across more than
            60 universities, and we ship updates every single week.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">Our values</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Heart, t: "Student-first", d: "Every product decision starts and ends with a real student in mind." },
              { icon: Rocket, t: "Ship weekly", d: "Small, frequent improvements compound into a better product faster than big rewrites." },
              { icon: Users, t: "Built in public", d: "We share roadmaps, listen openly, and treat our users as collaborators." },
              { icon: Target, t: "Outcomes over outputs", d: "We measure success by results — better grades, better offers, less stress." },
              { icon: Shield, t: "Privacy by default", d: "Your data is yours. We never sell it, and we encrypt what we store." },
              { icon: Sparkles, t: "Learning, not shortcuts", d: "AI should make you smarter, not replace your thinking. Our tools are built around that line." },
            ].map((v) => (
              <div key={v.t} className="glass rounded-2xl p-6">
                <v.icon className="h-5 w-5 text-accent" />
                <h3 className="mt-3 font-display font-semibold">{v.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">The team</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Nexoras is built by a small, distributed team of engineers, designers, and educators who have all been
            students recently enough to remember exactly how it feels. We work alongside a community of student
            ambassadors and educators who shape our roadmap.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">Get in touch</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Press, partnerships, feedback, or just saying hello — we'd love to hear from you. The fastest way to reach
            us is via our <a href="/contact" className="text-accent hover:underline">contact page</a>, or email
            hello@nexoras.app directly.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
