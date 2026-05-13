import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Nexoras" },
      { name: "description", content: "How Nexoras collects, uses, stores, and protects your personal data, including third-party advertising and analytics." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: May 2026" />
      <section className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>
          This Privacy Policy describes how Nexoras ("we", "us", or "our") collects, uses, stores, and protects
          information when you use our website, mobile applications, and related services (the "Service"). By using
          the Service you agree to the practices described below.
        </p>

        <H>1. Information we collect</H>
        <p>We collect three categories of information:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li><b>Account information</b> — name, email address, profile picture, and authentication identifiers when you sign up or log in.</li>
          <li><b>Content you create</b> — study plans, mock test attempts, resumes, notes, and any other content you produce on the platform.</li>
          <li><b>Usage and device data</b> — pages visited, features used, IP address, browser type, device identifiers, approximate location (derived from IP), and timestamps.</li>
        </ul>

        <H>2. How we use your information</H>
        <p>We use the information we collect to:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Operate, maintain, and improve the Service.</li>
          <li>Personalize AI suggestions, recommendations, and study plans for you.</li>
          <li>Communicate with you about updates, security alerts, and support requests.</li>
          <li>Detect, prevent, and address fraud, abuse, and security incidents.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <H>3. Cookies and similar technologies</H>
        <p>
          We use cookies, local storage, and similar technologies to remember your preferences, keep you signed in,
          measure how the Service is used, and (where applicable) deliver and measure advertising. You can control
          cookies through your browser settings. Disabling some cookies may affect the functionality of the Service.
        </p>

        <H>4. Third-party advertising (Google AdSense)</H>
        <p>
          We may use third-party advertising companies, including Google AdSense, to serve ads when you visit the
          Service. These companies may use information (not including your name, address, email address, or telephone
          number) about your visits to this and other websites in order to provide advertisements about goods and
          services of interest to you.
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
          <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our sites and/or other sites on the Internet.</li>
          <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-accent hover:underline" target="_blank" rel="noreferrer noopener">Google Ads Settings</a>.</li>
          <li>You can also opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" className="text-accent hover:underline" target="_blank" rel="noreferrer noopener">www.aboutads.info</a>.</li>
        </ul>

        <H>5. Analytics</H>
        <p>
          We use analytics tools to understand how the Service is used and to improve it. These tools may collect
          information sent by your browser as part of a web page request, including cookies and IP address.
        </p>

        <H>6. How we share information</H>
        <p>We do not sell your personal information. We share information only in these limited situations:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li><b>Service providers</b> — vendors who help us operate the Service (hosting, email, analytics, advertising) under written agreements that limit their use of the data.</li>
          <li><b>Legal compliance</b> — when required by law, regulation, legal process, or governmental request.</li>
          <li><b>Business transfers</b> — in connection with a merger, acquisition, or sale of assets, with notice to you.</li>
        </ul>

        <H>7. Data retention</H>
        <p>
          We retain your personal information for as long as your account is active or as needed to provide the
          Service. You may delete your account at any time, after which we will delete or anonymize your personal
          data within a reasonable period, unless retention is required by law.
        </p>

        <H>8. Security</H>
        <p>
          We use industry-standard administrative, technical, and physical safeguards to protect your information.
          No method of transmission or storage is 100% secure, but we work hard to protect your data and to notify
          you promptly of any incident that affects you.
        </p>

        <H>9. Children's privacy</H>
        <p>
          The Service is not directed to children under 13. We do not knowingly collect personal information from
          children under 13. If you believe a child has provided us with personal information, please contact us and
          we will delete it.
        </p>

        <H>10. Your rights</H>
        <p>
          Depending on where you live, you may have the right to access, correct, export, or delete your personal
          information, and to object to or restrict certain processing. You can exercise most of these rights from
          your profile page, or by emailing privacy@nexoras.app.
        </p>

        <H>11. International users</H>
        <p>
          The Service is operated from India and may be accessed worldwide. By using the Service, you consent to the
          transfer of your information to countries that may have different data protection laws than your own.
        </p>

        <H>12. Changes to this policy</H>
        <p>
          We may update this Privacy Policy from time to time. When we make material changes, we will notify you by
          updating the "Last updated" date at the top, and where appropriate by additional notice (such as an email
          or in-product banner).
        </p>

        <H>13. Contact us</H>
        <p>
          Questions about this policy or about how we handle your data? Email <a href="mailto:privacy@nexoras.app" className="text-accent hover:underline">privacy@nexoras.app</a> or use our <a href="/contact" className="text-accent hover:underline">contact page</a>.
        </p>
      </section>
    </PageShell>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 font-display text-lg font-semibold text-foreground">{children}</h2>;
}
