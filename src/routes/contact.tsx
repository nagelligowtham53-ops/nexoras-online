import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Mail, MessageSquare, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Nexoras — Get in Touch" },
      { name: "description", content: "Reach the Nexoras team with questions, partnership inquiries, press requests, or product feedback. We reply within 24 hours on business days." },
      { property: "og:title", content: "Contact Nexoras" },
      { property: "og:description", content: "Get in touch with the Nexoras team — questions, partnerships, press, or feedback." },
    ],
  }),
  component: Contact,
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(2, "Please enter a subject").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(2000),
});

function Contact() {
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = contactSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      subject: fd.get("subject"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setSubmitting(true);
    try {
      // Open user's email client with prefilled details (no backend required)
      const mailto = `mailto:hello@nexoras.app?subject=${encodeURIComponent(parsed.data.subject)}&body=${encodeURIComponent(`${parsed.data.message}\n\n— ${parsed.data.name} (${parsed.data.email})`)}`;
      window.location.href = mailto;
      toast.success("Opening your email client — we reply within 24 hours.");
      (e.target as HTMLFormElement).reset();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Questions about Nexoras, partnership inquiries, press, feedback — drop us a note and we'll reply within one business day."
      />
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 lg:grid-cols-2 lg:px-8">
        <form className="glass space-y-4 rounded-2xl p-6" onSubmit={onSubmit}>
          <Field name="name" label="Your name" placeholder="Aarav Kumar" />
          <Field name="email" label="Email" type="email" placeholder="you@example.com" />
          <Field name="subject" label="Subject" placeholder="What's this about?" />
          <label className="block text-sm">
            <span className="font-medium">Message</span>
            <textarea
              name="message"
              rows={6}
              maxLength={2000}
              required
              className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Tell us a bit more so we can help…"
            />
          </label>
          <Button disabled={submitting} className="w-full bg-gradient-primary text-primary-foreground shadow-glow">
            {submitting ? "Sending…" : "Send message"}
          </Button>
          <p className="text-xs text-muted-foreground">
            By submitting this form you agree to our <a href="/privacy" className="text-accent hover:underline">privacy policy</a>.
          </p>
        </form>

        <div className="space-y-4">
          <InfoCard icon={Mail} label="Email" value="hello@nexoras.app" href="mailto:hello@nexoras.app" />
          <InfoCard icon={MessageSquare} label="Support" value="support@nexoras.app" href="mailto:support@nexoras.app" />
          <InfoCard icon={Clock} label="Response time" value="Within 24 hours · Mon–Fri" />
          <InfoCard icon={MapPin} label="Based in" value="Bengaluru, India · Remote-first team" />
          <div className="glass rounded-2xl p-6 text-sm text-muted-foreground">
            <p className="font-display text-base font-semibold text-foreground">Press & partnerships</p>
            <p className="mt-2">For press inquiries, brand partnerships, or institutional collaborations, email <a href="mailto:partners@nexoras.app" className="text-accent hover:underline">partners@nexoras.app</a> and we'll route your request to the right person.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Field({ name, label, type = "text", placeholder }: { name: string; label: string; type?: string; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required
        maxLength={255}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

function InfoCard({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
  const inner = (
    <>
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-base">{value}</p>
    </>
  );
  return (
    <div className="glass rounded-2xl p-6">
      {href ? <a href={href} className="block hover:text-accent">{inner}</a> : inner}
    </div>
  );
}
