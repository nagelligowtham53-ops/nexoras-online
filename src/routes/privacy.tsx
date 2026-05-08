import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Nexoras" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description="Last updated: May 2026" />
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-sm leading-relaxed text-muted-foreground lg:px-8">
        <p>Nexoras (“we”, “us”) respects your privacy. This policy explains what data we collect, how we use it, and your rights.</p>
        <H>Information we collect</H>
        <p>Account info (name, email), usage analytics, and content you create such as study plans and resumes.</p>
        <H>How we use it</H>
        <p>To provide and improve the platform, personalize AI suggestions, and keep you secure.</p>
        <H>Sharing</H>
        <p>We never sell your personal data. Limited processors help us run the service under strict agreements.</p>
        <H>Your rights</H>
        <p>You can access, export, or delete your data anytime from your profile.</p>
        <H>Contact</H>
        <p>Questions? Email privacy@nexoras.app.</p>
      </section>
    </PageShell>
  );
}
function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 font-display text-lg font-semibold text-foreground">{children}</h2>;
}
