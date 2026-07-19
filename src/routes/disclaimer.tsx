import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — Nexoras" },
      { name: "description", content: "Educational disclaimer for Nexoras AI study tools, mock tests, resume builder, and career guidance content." },
      { property: "og:title", content: "Disclaimer — Nexoras" },
      { property: "og:description", content: "Educational disclaimer for Nexoras content and AI tools." },
      { property: "og:url", content: "https://nexoras.online/disclaimer" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/disclaimer" }],
  }),
  component: Disclaimer,
});

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-base font-semibold text-foreground">{children}</h2>;
}

function Disclaimer() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Disclaimer" description="Last updated: July 2026" />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <H>Educational purpose</H>
        <p>
          Nexoras is an educational platform. All content, mock tests, practice questions, study
          plans, resume templates, career guidance, and AI-generated responses are provided for
          general informational and self-study purposes only. They do not constitute professional,
          legal, medical, financial, admission, or career advice.
        </p>

        <H>No guarantee of results</H>
        <p>
          Preparing on Nexoras does not guarantee any particular exam result, admission, job
          offer, salary, or visa outcome. Actual outcomes depend on many factors outside our
          control, including individual effort and official examination bodies.
        </p>

        <H>Accuracy of AI content</H>
        <p>
          Some content on Nexoras is generated or assisted by AI models. AI-generated content may
          contain inaccuracies, outdated information, or errors. Always verify important facts
          (syllabus, exam dates, eligibility criteria, official cut-offs, etc.) against the
          official source before relying on them.
        </p>

        <H>Third-party links and ads</H>
        <p>
          Nexoras may display advertisements (including through Google AdSense) and link to
          third-party websites. We are not responsible for the content, accuracy, or practices of
          any third-party site or advertiser.
        </p>

        <H>Not affiliated with exam authorities</H>
        <p>
          Nexoras is an independent study platform. We are not affiliated with, endorsed by, or
          sponsored by NTA, CBSE, UPSC, IIMs, GATE authorities, ETS, IELTS, the College Board, or
          any other examination body mentioned on this site. All trademarks and exam names belong
          to their respective owners.
        </p>

        <H>Contact</H>
        <p>
          Questions about this disclaimer? Reach us via our{" "}
          <a href="/contact" className="underline hover:text-foreground">contact page</a>.
        </p>
      </section>
    </PageShell>
  );
}
