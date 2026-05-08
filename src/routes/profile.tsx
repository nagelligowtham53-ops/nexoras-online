import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Nexoras" }] }),
  component: Profile,
});

function Profile() {
  return (
    <PageShell>
      <PageHeader eyebrow="Your profile" title="Alex Sharma" description="Computer Science · 3rd year · Bengaluru, India" />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 lg:grid-cols-3 lg:px-8">
        <div className="glass space-y-3 rounded-2xl p-6 lg:col-span-1">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-primary shadow-glow" />
          <p className="text-center font-display text-lg font-semibold">Alex Sharma</p>
          <p className="text-center text-xs text-muted-foreground">Pro · Member since 2025</p>
          <div className="space-y-2 pt-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> alex@nexoras.app</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Bengaluru, India</p>
            <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /> CGPA 8.7 · Sem 6</p>
          </div>
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold">Account settings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Display name" defaultValue="Alex Sharma" />
              <Input label="Email" defaultValue="alex@nexoras.app" />
              <Input label="University" defaultValue="VIT" />
              <Input label="Branch" defaultValue="Computer Science" />
            </div>
            <Button className="mt-5 bg-gradient-primary text-primary-foreground shadow-glow">Save changes</Button>
          </div>
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold">Danger zone</h2>
            <p className="mt-2 text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
            <Button variant="destructive" className="mt-3">Delete account</Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
function Input({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input defaultValue={defaultValue} className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
    </label>
  );
}
