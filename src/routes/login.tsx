import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { HeroOrbs } from "@/components/HeroOrbs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/dashboard" }),
  head: () => ({ meta: [{ title: "Log in — Nexoras" }] }),
  component: Login,
});

function Login() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: redirect });
  }, [user, loading, navigate, redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof errors;
        if (!fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      toast.success("Welcome back!");
      navigate({ to: redirect });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg.includes("Invalid login") ? "Invalid email or password" : msg);
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
            <h1 className="font-display text-3xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Log in to continue your AI study journey.</p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <Field label="Email" type="email" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
              <Field label="Password" type="password" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
              </div>
              <Button disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Logging in…" : "Log in"}
              </Button>
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
