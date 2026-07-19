import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/copyright")({
  head: () => ({
    meta: [
      { title: "Copyright Policy — Nexoras" },
      { name: "description", content: "Copyright ownership, permitted use, attribution, and takedown procedures for content published on Nexoras." },
      { property: "og:title", content: "Copyright Policy — Nexoras" },
      { property: "og:description", content: "How copyright applies to Nexoras content and how to report infringement." },
      { property: "og:url", content: "https://nexoras.online/copyright" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/copyright" }],
  }),
  component: Copyright,
});

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-lg font-semibold text-foreground">{children}</h2>;
}

function Copyright() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Copyright Policy" description="Last updated: July 2026" />
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>
          All original content published on Nexoras — including text, graphics, logos, icons, images, audio and video
          clips, digital downloads, data compilations, software, and the underlying design and layout — is the property
          of Nexoras or its content contributors and is protected by Indian and international copyright laws.
        </p>

        <H>1. Ownership</H>
        <p>
          Unless otherwise noted, Nexoras owns the copyright in all content published on the Service. Third-party
          material (question papers, syllabi, and public exam references) is used under fair-use or the applicable
          licence and remains the property of its respective owners.
        </p>

        <H>2. Permitted use</H>
        <ul className="ml-6 list-disc space-y-1">
          <li>You may view, download, and print Nexoras content solely for your personal, non-commercial study use.</li>
          <li>You may share links to Nexoras pages on social media and in personal communications.</li>
          <li>Educators may reference short excerpts in classroom settings with clear attribution to Nexoras.</li>
        </ul>

        <H>3. Prohibited use</H>
        <ul className="ml-6 list-disc space-y-1">
          <li>Republishing, redistributing, or reselling Nexoras content in whole or in substantial part.</li>
          <li>Scraping, mirroring, or using automated systems to bulk-download content.</li>
          <li>Removing copyright, trademark, or attribution notices from any content.</li>
          <li>Using Nexoras branding, name, or logo in a way that suggests endorsement without written permission.</li>
        </ul>

        <H>4. Attribution</H>
        <p>
          When quoting Nexoras content with permission, please credit the source as: <em>"Source: Nexoras
          (https://nexoras.online)"</em> with a working link to the original page.
        </p>

        <H>5. Reporting infringement</H>
        <p>
          If you believe your copyrighted work has been copied and is accessible on the Service in a way that
          constitutes infringement, please review our{" "}
          <Link to="/dmca" className="text-accent hover:underline">DMCA Policy</Link>{" "}
          and follow the takedown procedure. We respond to valid notices promptly.
        </p>

        <H>6. Contact</H>
        <p>
          Copyright questions or permission requests:{" "}
          <a href="mailto:legal@nexoras.online" className="text-accent hover:underline">legal@nexoras.online</a>.
        </p>
      </section>
    </PageShell>
  );
}
