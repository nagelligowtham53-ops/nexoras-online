import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell } from "@/components/PageShell";
import { HeroOrbs } from "@/components/HeroOrbs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Nexoras" }] }),
  component: ResetPassword,
});

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
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
      await updatePassword(parsed.data.password);
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
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
            <h1 className="font-display text-3xl font-bold">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <Field label="New password" type="password" value={password} onChange={setPassword} error={errors.password} />
              <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} error={errors.confirm} />
              <Button disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Updating…" : "Update password"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({
  label, type = "text", value, onChange, error,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
