import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Heart, Rocket, Users, Target, Shield, Sparkles, UserRound, Quote } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Nexoras | Founded by Nagelli Gowtham" },
      { name: "description", content: "Meet Nagelli Gowtham, founder and creator of Nexoras, an AI-powered student productivity platform for learning, exam preparation, and career development." },
      { property: "og:title", content: "About Nexoras | Founded by Nagelli Gowtham" },
      { property: "og:description", content: "Meet Nagelli Gowtham, founder and creator of Nexoras, an AI-powered student productivity platform for learning, exam preparation, and career development." },
      { property: "og:url", content: "https://nexoras.online/about" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/about" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "@id": "https://nexoras.online/about#founder",
            name: "Nagelli Gowtham",
            jobTitle: "Founder & Creator of Nexoras",
            url: "https://nexoras.online/about",
          },
          {
            "@type": "Organization",
            "@id": "https://nexoras.online/#organization",
            name: "Nexoras",
            url: "https://nexoras.online/",
            founder: { "@id": "https://nexoras.online/about#founder" },
            description: "An AI-powered student productivity platform for learning, exam preparation, and career development.",
          },
        ],
      }),
    }],
  }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About Nexoras"
        title="About Nexoras"
        description="The story, purpose, and vision behind a platform for smarter learning, practical skills, and career preparation."
      />
      <section className="about-founder mx-auto max-w-5xl space-y-14 px-4 py-12 lg:px-8">
        <article aria-labelledby="founder-name" className="about-founder-enter overflow-hidden rounded-lg border border-border bg-card shadow-elegant">
          <div className="grid md:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="border-b border-border bg-secondary/40 p-6 md:border-b-0 md:border-r md:p-8">
              <div className="flex aspect-[4/5] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-background/60" role="img" aria-label="Space reserved for a real photograph of Nagelli Gowtham">
                <UserRound aria-hidden="true" className="h-16 w-16 text-muted-foreground/60" strokeWidth={1} />
                <span className="text-sm text-muted-foreground">Founder photograph</span>
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">Nagelli Gowtham</p>
              <p className="mt-1 text-xs text-muted-foreground">Founder &amp; Creator of Nexoras</p>
            </div>
            <div className="min-w-0 p-6 sm:p-8">
              <p className="text-sm font-medium text-accent">Meet the founder</p>
              <h2 id="founder-name" className="mt-2 font-display text-3xl font-bold sm:text-4xl">Nagelli Gowtham — Founder &amp; Creator</h2>
              <p className="mt-2 font-medium text-muted-foreground">Founder &amp; Creator of Nexoras</p>
              <h3 className="mt-8 text-lg font-semibold">About the Founder</h3>
              <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">
                <p>Hi, I’m Nagelli Gowtham, the founder and creator of Nexoras.</p>
                <p>I founded Nexoras with a simple vision: to make AI-powered learning, exam preparation, productivity, and career development tools accessible to students.</p>
                <p>I believe that every student deserves access to useful tools that help them learn, explore their potential, build practical skills, and prepare for future opportunities. Nexoras is my step toward turning that vision into reality.</p>
                <p>My goal is to build a platform that brings together AI-powered study tools, exam preparation, resume building, interview practice, productivity features, and career guidance in one convenient place.</p>
                <p>For me, Nexoras is more than just a website. It is a journey of innovation, learning, and continuous improvement. I want to keep improving the platform based on students’ needs and feedback, making it more useful, accessible, and reliable over time.</p>
                <p className="font-semibold text-foreground">My mission is simple: help students study smarter, grow their skills, and move confidently toward their goals.</p>
                <p>Welcome to Nexoras — let’s learn, build, and grow together.</p>
              </div>
            </div>
          </div>
        </article>

        <div>
          <h2 className="font-display text-2xl font-bold">The Vision Behind Nexoras</h2>
          <div className="mt-3 space-y-4 text-muted-foreground leading-relaxed">
            <p>Nexoras was created around the idea that technology should empower students, not overwhelm them. By bringing useful learning and productivity tools together, our goal is to help students spend less time struggling to find the right resources and more time learning, practicing, and improving.</p>
            <p>We aim to continue developing practical, student-focused tools that support academic growth, skill development, and career readiness.</p>
          </div>
        </div>

        <figure className="border-y border-border bg-secondary/30 px-6 py-10 sm:px-10">
          <Quote aria-hidden="true" className="h-8 w-8 text-accent" strokeWidth={1.5} />
          <blockquote className="mt-5 max-w-3xl font-display text-2xl font-semibold leading-relaxed sm:text-3xl">
            “Dream big. Learn continuously. Build something that makes a difference.”
          </blockquote>
          <figcaption className="mt-5 text-sm text-muted-foreground">— <span className="font-semibold text-foreground">Nagelli Gowtham</span>, Founder of Nexoras</figcaption>
        </figure>

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
          <h2 className="font-display text-2xl font-bold">Our values</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Heart, t: "Student-first", d: "Every product decision starts and ends with a real student in mind." },
              { icon: Rocket, t: "Continuous improvement", d: "Keep learning, refining, and building a more useful and reliable platform." },
              { icon: Users, t: "Listen to students", d: "Students’ needs and feedback help shape the direction of Nexoras." },
              { icon: Target, t: "Outcomes over outputs", d: "We measure success by results — better grades, better offers, less stress." },
              { icon: Shield, t: "Privacy by default", d: "Your data is yours. We never sell it, and we encrypt what we store." },
              { icon: Sparkles, t: "Learning, not shortcuts", d: "AI should make you smarter, not replace your thinking. Our tools are built around that line." },
            ].map((v) => (
              <div key={v.t} className="glass rounded-lg p-6">
                <v.icon aria-hidden="true" className="h-5 w-5 text-accent" />
                <h3 className="mt-3 font-display font-semibold">{v.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold">Get in touch</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Press, partnerships, feedback, or just saying hello — we'd love to hear from you. The fastest way to reach
            us is via our <Link to="/contact" className="text-accent underline underline-offset-4 hover:text-foreground">contact page</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
