import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Is Nexoras free to use?",
    a: "Yes. All core features on Nexoras — study planner, AI PPT generator, resume builder, mock interview, JEE and NEET practice, mock tests, and career guidance — are completely free for students. You only need to create a free account.",
  },
  {
    q: "Which exams does Nexoras support?",
    a: "Nexoras supports JEE Main, JEE Advanced, NEET, BITSAT, COMEDK UGET, UPSC, CAT, GATE, CA, CFA, USMLE, SAT, GRE, IELTS, TOEFL, IMO, ICPC, and coding contests. Question banks and mock tests are organised by subject and chapter.",
  },
  {
    q: "Are the practice questions AI-generated?",
    a: "No. Practice questions and mock tests come from a curated database organised by exam, subject, and chapter. AI is only used for explanations, hints, and personalised study recommendations after you complete a session.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Nexoras runs entirely in your browser on desktop, tablet, and mobile. There is nothing to download or install.",
  },
  {
    q: "How does the AI presentation generator work?",
    a: "You describe the topic, audience, and depth, and Nexoras generates a complete slide deck with layouts, speaker notes, and optional charts. You can pick from 60+ themes or generate a custom theme, and export as PPTX or PDF.",
  },
  {
    q: "Does the resume builder produce ATS-friendly resumes?",
    a: "Yes. Our templates (Harvard, Stanford, IIT Placement, FAANG SWE, and more) are designed to be ATS-friendly, and the PDF export matches the on-screen preview so formatting is preserved.",
  },
  {
    q: "How do you use my data?",
    a: "We use your data only to provide and improve Nexoras. We do not sell personal data. See our Privacy Policy for full details.",
  },
  {
    q: "Do you show ads?",
    a: "Some pages may show advertising via Google AdSense to help keep Nexoras free. See our Cookie Policy for details on advertising cookies and how to opt out of personalised ads.",
  },
  {
    q: "How can I contact support?",
    a: "Use our Contact page to send us a message. We reply to student queries as quickly as possible.",
  },
  {
    q: "Is Nexoras affiliated with any exam authority?",
    a: "No. Nexoras is an independent educational platform and is not affiliated with, endorsed by, or sponsored by NTA, CBSE, UPSC, IIMs, ETS, the College Board, or any other examination body.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Nexoras" },
      { name: "description", content: "Answers to common questions about Nexoras: exams supported, pricing, AI features, data privacy, and support." },
      { property: "og:title", content: "FAQ — Nexoras" },
      { property: "og:description", content: "Common questions about Nexoras, our AI study tools, and supported exams." },
      { property: "og:url", content: "https://nexoras.online/faq" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FAQ,
});

function FAQ() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description="Everything you need to know about Nexoras — free access, supported exams, AI tools, and data privacy."
      />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-12 lg:px-8">
        {FAQS.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-border bg-card/40 p-5 open:bg-card/60"
          >
            <summary className="cursor-pointer list-none text-base font-semibold text-foreground marker:hidden">
              <span className="mr-2 text-primary">Q.</span>
              {f.q}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </section>
    </PageShell>
  );
}
