import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/dmca")({
  head: () => ({
    meta: [
      { title: "DMCA Policy — Nexoras" },
      { name: "description", content: "How to submit a DMCA takedown notice or counter-notice for content on Nexoras, and our response procedure." },
      { property: "og:title", content: "DMCA Policy — Nexoras" },
      { property: "og:description", content: "Digital Millennium Copyright Act notice, takedown, and counter-notice procedure for Nexoras." },
      { property: "og:url", content: "https://nexoras.online/dmca" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/dmca" }],
  }),
  component: DMCA,
});

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-lg font-semibold text-foreground">{children}</h2>;
}

function DMCA() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="DMCA Policy" description="Last updated: July 2026" />
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>
          Nexoras respects the intellectual property rights of others and expects its users to do the same. In
          accordance with the Digital Millennium Copyright Act of 1998 ("DMCA") and analogous provisions of Indian
          copyright law, we will respond expeditiously to claims of copyright infringement committed using the Service
          that are reported to our Designated Copyright Agent.
        </p>

        <H>1. Filing a DMCA takedown notice</H>
        <p>If you are a copyright owner (or authorised to act on behalf of one), please submit a written notice that includes ALL of the following:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>A physical or electronic signature of the copyright owner or an authorised representative.</li>
          <li>Identification of the copyrighted work claimed to have been infringed.</li>
          <li>Identification of the allegedly infringing material and its location on Nexoras (URL).</li>
          <li>Your contact information: full name, mailing address, telephone number, and email address.</li>
          <li>A statement that you have a good-faith belief that the use is not authorised by the copyright owner, its agent, or the law.</li>
          <li>A statement, made under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorised to act on its behalf.</li>
        </ul>

        <H>2. Where to send the notice</H>
        <p>Send DMCA notices to our Designated Copyright Agent:</p>
        <p className="text-foreground">
          Email:{" "}
          <a href="mailto:dmca@nexoras.online" className="text-accent hover:underline">dmca@nexoras.online</a>
          <br />
          Subject line: <em>"DMCA Takedown Notice"</em>
        </p>

        <H>3. Counter-notice</H>
        <p>
          If you believe material you posted was removed by mistake or misidentification, you may submit a
          counter-notice to the same email with:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Your physical or electronic signature.</li>
          <li>Identification of the material removed and its previous location.</li>
          <li>A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.</li>
          <li>Your full name, address, and telephone number, and a statement that you consent to the jurisdiction of the courts in your district (or, if outside the U.S., the courts of Bengaluru, India).</li>
        </ul>

        <H>4. Repeat infringers</H>
        <p>
          Nexoras will, in appropriate circumstances, terminate accounts of users who are found to be repeat
          infringers.
        </p>

        <H>5. False claims</H>
        <p>
          Please note that under Section 512(f) of the DMCA, any person who knowingly makes material misrepresentations
          in a notice or counter-notice may be held liable for damages. Consult a lawyer before filing if you are
          unsure.
        </p>
      </section>
    </PageShell>
  );
}
