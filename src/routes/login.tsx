import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { HeroOrbs } from "@/components/HeroOrbs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Nexoras" }] }),
  component: Login,
});

function Login() {
  return (
    <PageShell>
      <section className="relative">
        <HeroOrbs />
        <div className="relative mx-auto flex max-w-md flex-col px-4 py-20 lg:px-8">
          <div className="glass-strong rounded-2xl p-8 shadow-elegant">
            <h1 className="font-display text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Log in to continue your AI study journey.</p>
            <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input label="Email" type="email" />
              <Input label="Password" type="password" />
              <Button className="w-full bg-gradient-primary text-primary-foreground shadow-glow">Log in</Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              New here? <Link to="/signup" className="text-accent">Create an account</Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
function Input({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input type={type} className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
    </label>
  );
}
