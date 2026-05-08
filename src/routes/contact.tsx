import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Nexoras" }, { name: "description", content: "Get in touch with the Nexoras team." }] }),
  component: Contact,
});

function Contact() {
  return (
    <PageShell>
      <PageHeader eyebrow="Contact" title="We'd love to hear from you" description="Questions, partnerships, feedback — drop us a note." />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 lg:grid-cols-2 lg:px-8">
        <form
          className="glass space-y-4 rounded-2xl p-6"
          onSubmit={(e) => { e.preventDefault(); alert("Thanks! We'll get back within 24 hours."); }}
        >
          <Input label="Name" />
          <Input label="Email" type="email" />
          <label className="block text-sm">
            <span className="font-medium">Message</span>
            <textarea rows={5} className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </label>
          <Button className="w-full bg-gradient-primary text-primary-foreground shadow-glow">Send message</Button>
        </form>
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <Mail className="h-5 w-5 text-accent" />
            <p className="mt-2 text-sm text-muted-foreground">Email</p>
            <p className="font-display text-lg">hello@nexoras.app</p>
          </div>
          <div className="glass rounded-2xl p-6">
            <MessageSquare className="h-5 w-5 text-accent" />
            <p className="mt-2 text-sm text-muted-foreground">Live chat</p>
            <p className="font-display text-lg">Mon–Fri · 9am – 7pm IST</p>
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
