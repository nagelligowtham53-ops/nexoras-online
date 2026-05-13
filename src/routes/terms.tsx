import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Nexoras" },
      { name: "description", content: "The terms and conditions that govern your use of Nexoras." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" description="Last updated: May 2026" />
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>
          These Terms & Conditions ("Terms") govern your access to and use of Nexoras (the "Service"). By creating
          an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use
          the Service.
        </p>

        <H>1. Eligibility</H>
        <p>
          You must be at least 13 years old to use the Service. If you are under the age of majority in your
          jurisdiction, you must have the consent of a parent or legal guardian.
        </p>

        <H>2. Your account</H>
        <p>
          You are responsible for safeguarding your account credentials and for any activity that occurs under your
          account. Notify us immediately if you suspect unauthorized access.
        </p>

        <H>3. Subscriptions and billing</H>
        <p>
          Paid plans renew automatically at the end of each billing period unless cancelled. You may cancel at any
          time from your profile, and you will retain access to paid features until the end of the current period.
          We do not offer refunds for partial billing periods unless required by law.
        </p>

        <H>4. Acceptable use</H>
        <p>You agree not to:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Use the Service to violate any law, regulation, or third-party right.</li>
          <li>Attempt to gain unauthorized access to the Service, other accounts, or our infrastructure.</li>
          <li>Scrape, copy, or systematically extract content from the Service except as permitted by these Terms.</li>
          <li>Upload malicious code, send spam, or interfere with the operation of the Service.</li>
          <li>Use the Service to generate or distribute content that is illegal, harmful, harassing, or infringing.</li>
        </ul>

        <H>5. Content you create</H>
        <p>
          You retain ownership of content you create on the Service (study plans, resumes, notes, test attempts).
          You grant us a limited, worldwide, royalty-free license to host, display, and process that content solely
          for the purpose of operating and improving the Service for you.
        </p>

        <H>6. AI features</H>
        <p>
          Nexoras provides AI-assisted features (study planning, resume suggestions, mock interviews, question
          generation). AI output may contain inaccuracies and should not be relied upon as professional advice.
          You are responsible for reviewing and verifying AI-generated content before using it.
        </p>

        <H>7. Third-party services</H>
        <p>
          The Service may integrate with or display third-party services and advertisements (including Google
          AdSense). We are not responsible for the content, terms, or practices of those third parties.
        </p>

        <H>8. Intellectual property</H>
        <p>
          The Service, including its design, code, branding, and original content, is owned by Nexoras and
          protected by copyright, trademark, and other laws. You may not use our trademarks without prior written
          permission.
        </p>

        <H>9. Termination</H>
        <p>
          We may suspend or terminate your access to the Service at any time if you violate these Terms or if we
          reasonably believe your use poses a risk to the Service or other users. You may stop using the Service at
          any time.
        </p>

        <H>10. Disclaimers</H>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, whether express or
          implied. We do not warrant that the Service will be uninterrupted, error-free, or secure.
        </p>

        <H>11. Limitation of liability</H>
        <p>
          To the maximum extent permitted by law, Nexoras and its affiliates shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether
          incurred directly or indirectly.
        </p>

        <H>12. Governing law</H>
        <p>
          These Terms are governed by the laws of India, without regard to its conflict of law principles. Disputes
          arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in
          Bengaluru, India.
        </p>

        <H>13. Changes to these Terms</H>
        <p>
          We may update these Terms from time to time. When we make material changes, we will notify you by
          updating the "Last updated" date and, where appropriate, by additional notice. Continued use after
          changes become effective constitutes acceptance.
        </p>

        <H>14. Contact</H>
        <p>
          Questions about these Terms? Email <a href="mailto:hello@nexoras.app" className="text-accent hover:underline">hello@nexoras.app</a> or visit our <a href="/contact" className="text-accent hover:underline">contact page</a>.
        </p>
      </section>
    </PageShell>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 font-display text-lg font-semibold text-foreground">{children}</h2>;
}
