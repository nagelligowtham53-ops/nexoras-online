import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { HeroOrbs } from "@/components/HeroOrbs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Nexoras" }] }),
  component: ForgotPassword,
});

const schema = z.string().trim().email("Enter a valid email").max(255);

function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await resetPassword(parsed.data);
      setSent(true);
      toast.success("Check your inbox for the reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <section className="relative">
        <HeroOrbs />
        <div className="relative mx-auto flex max-w-md flex-col px-4 py-20 lg:px-8">
          <div className="glass-strong rounded-2xl p-8 shadow-elegant">
            <h1 className="font-display text-3xl font-bold">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure link to set a new password.</p>
            {sent ? (
              <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
                A reset link has been sent to <span className="text-foreground">{email}</span>. Follow the link to choose a new password.
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                <label className="block text-sm">
                  <span className="font-medium">Email</span>
                  <input
                    type="email"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
                </label>
                <Button disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Remembered it? <Link to="/login" className="text-accent">Back to login</Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
