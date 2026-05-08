import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { HeroOrbs } from "@/components/HeroOrbs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Nexoras" }] }),
  component: Signup,
});

function Signup() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      const fe: typeof errors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof errors;
        if (!fe[k]) fe[k] = i.message;
      });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await signUp(parsed.data.email, parsed.data.password, parsed.data.fullName);
      toast.success("Account created! Welcome to Nexoras.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      toast.error(msg.includes("already registered") ? "This email is already registered. Try logging in." : msg);
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
            <h1 className="font-display text-3xl font-bold">Create your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Free forever. No credit card required.</p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <Field label="Full name" value={fullName} onChange={setFullName} error={errors.fullName} autoComplete="name" />
              <Field label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
              <Field label="Password" type="password" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />
              <Button disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Creating…" : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-accent">Log in</Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({
  label, type = "text", value, onChange, error, autoComplete,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; autoComplete?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
