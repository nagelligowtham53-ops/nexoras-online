import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Mail, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Nexoras" }] }),
  component: () => (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  ),
});

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setFullName(data?.full_name ?? (user.user_metadata?.full_name as string) ?? "");
      setLoading(false);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName.trim().slice(0, 80) });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Your profile" title={fullName || user?.email || "Your account"} description="Manage your Nexoras account." />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 lg:grid-cols-3 lg:px-8">
        <div className="glass space-y-3 rounded-2xl p-6 lg:col-span-1">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
            {(fullName || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <p className="text-center font-display text-lg font-semibold">{fullName || "Student"}</p>
          <div className="space-y-2 pt-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {user?.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="w-full">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold">Account settings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Display name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Email</span>
                <input value={user?.email ?? ""} disabled className="mt-1 w-full rounded-md border border-border bg-secondary/20 px-3 py-2 text-sm text-muted-foreground" />
              </label>
            </div>
            <Button onClick={save} disabled={saving || loading} className="mt-5 bg-gradient-primary text-primary-foreground shadow-glow">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
