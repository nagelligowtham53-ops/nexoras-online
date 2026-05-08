import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Nexoras" }] }),
  component: Terms,
});

function Terms() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" description="Last updated: May 2026" />
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>By using Nexoras you agree to these terms. Please read them carefully.</p>
        <H>Use of service</H>
        <p>You must be at least 13 years old. You're responsible for your account and the content you create.</p>
        <H>Subscriptions</H>
        <p>Paid plans renew automatically. Cancel anytime from your profile — you keep access until the end of the period.</p>
        <H>Acceptable use</H>
        <p>No abuse, scraping, or attempts to harm the platform or other users.</p>
        <H>Liability</H>
        <p>The service is provided “as is”. To the maximum extent permitted by law, we limit our liability.</p>
        <H>Changes</H>
        <p>We may update these terms; we'll notify you of material changes.</p>
      </section>
    </PageShell>
  );
}
function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 font-display text-lg font-semibold text-foreground">{children}</h2>;
}
