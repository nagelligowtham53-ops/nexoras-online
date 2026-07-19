import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Nexoras" },
      { name: "description", content: "How Nexoras uses cookies and similar technologies, including third-party advertising cookies from Google AdSense." },
      { property: "og:title", content: "Cookie Policy — Nexoras" },
      { property: "og:description", content: "How Nexoras uses cookies, and how to control them." },
      { property: "og:url", content: "https://nexoras.online/cookie-policy" },
    ],
    links: [{ rel: "canonical", href: "https://nexoras.online/cookie-policy" }],
  }),
  component: CookiePolicy,
});

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 text-base font-semibold text-foreground">{children}</h2>;
}

function CookiePolicy() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Cookie Policy" description="Last updated: July 2026" />
      <section className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>
          This Cookie Policy explains how Nexoras ("we", "us") uses cookies and similar tracking
          technologies on our website and services. It should be read together with our{" "}
          <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
        </p>

        <H>1. What are cookies?</H>
        <p>
          Cookies are small text files stored on your device by your browser. They allow a website
          to remember your actions and preferences over time. We also use similar technologies
          like local storage and pixels.
        </p>

        <H>2. Types of cookies we use</H>
        <ul className="ml-6 list-disc space-y-1">
          <li><b>Essential cookies</b> — required for authentication, security, and core functionality (e.g. keeping you signed in).</li>
          <li><b>Preference cookies</b> — remember settings such as theme, cookie consent choice, and dashboard layout.</li>
          <li><b>Analytics cookies</b> — help us understand how the site is used so we can improve it.</li>
          <li><b>Advertising cookies</b> — set by third-party partners including Google AdSense to serve and measure ads. See section 4.</li>
        </ul>

        <H>3. How to control cookies</H>
        <p>
          You can accept or reject non-essential cookies using the banner shown on your first
          visit. You can also clear or block cookies at any time in your browser settings.
          Blocking essential cookies may prevent parts of the site (such as sign-in) from working.
        </p>

        <H>4. Google AdSense and advertising</H>
        <p>
          We use Google AdSense to display advertising on some pages. Google and its partners use
          cookies to serve ads based on your prior visits to our site and other sites on the
          internet. You can opt out of personalised advertising by visiting{" "}
          <a
            href="https://www.google.com/settings/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Google Ads Settings
          </a>{" "}
          or{" "}
          <a
            href="https://www.aboutads.info/choices/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            aboutads.info
          </a>
          .
        </p>

        <H>5. Changes to this policy</H>
        <p>
          We may update this Cookie Policy from time to time. Material changes will be posted on
          this page with a new "Last updated" date.
        </p>

        <H>6. Contact</H>
        <p>
          Questions about cookies? Reach us via our{" "}
          <a href="/contact" className="underline hover:text-foreground">contact page</a>.
        </p>
      </section>
    </PageShell>
  );
}
