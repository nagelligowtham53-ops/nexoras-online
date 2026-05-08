import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Download, Sparkles, Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/resume")({
  head: () => ({ meta: [{ title: "Resume Builder — Nexoras" }, { name: "description", content: "AI-assisted ATS-friendly resume builder for students." }] }),
  component: Resume,
});

function Resume() {
  const [name, setName] = useState("Alex Sharma");
  const [role, setRole] = useState("Computer Science Student · Frontend Engineer");
  const [email, setEmail] = useState("alex@nexoras.app");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [location, setLocation] = useState("Bengaluru, India");
  const [summary, setSummary] = useState("Curious CS student passionate about beautiful interfaces and building products that delight users.");
  const [skills, setSkills] = useState("React, TypeScript, Tailwind, Node.js, Python");
  const [experience, setExperience] = useState("Frontend Intern @ Acme · Jun 2025\n- Shipped 3 marketing pages used by 40k+ users\n- Improved Lighthouse score from 71 → 96");

  return (
    <PageShell>
      <PageHeader eyebrow="Resume Builder" title="Craft a resume that stands out" description="Type once, edit anywhere. Live preview, ATS-friendly layout." />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 lg:grid-cols-2 lg:px-8">
        <div className="glass space-y-4 rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold">Your details</h2>
          <Input label="Full name" value={name} onChange={setName} />
          <Input label="Headline" value={role} onChange={setRole} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Email" value={email} onChange={setEmail} />
            <Input label="Phone" value={phone} onChange={setPhone} />
            <Input label="Location" value={location} onChange={setLocation} />
          </div>
          <Textarea label="Summary" value={summary} onChange={setSummary} />
          <Input label="Skills (comma separated)" value={skills} onChange={setSkills} />
          <Textarea label="Experience" value={experience} onChange={setExperience} rows={6} />
          <div className="flex gap-2">
            <Button className="bg-gradient-primary text-primary-foreground shadow-glow"><Sparkles className="h-4 w-4" /> AI rewrite</Button>
            <Button variant="outline" onClick={() => window.print()}><Download className="h-4 w-4" /> Export PDF</Button>
          </div>
        </div>

        {/* Preview */}
        <div className="glass-strong rounded-2xl p-2">
          <div className="rounded-xl bg-background p-8">
            <h1 className="font-display text-3xl font-bold">{name}</h1>
            <p className="text-sm text-accent">{role}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{email}</span>
              <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{phone}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>
            </div>
            <Section title="Summary"><p className="text-sm leading-relaxed">{summary}</p></Section>
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="rounded-full border border-border bg-secondary/60 px-2.5 py-0.5 text-xs">{s}</span>
                ))}
              </div>
            </Section>
            <Section title="Experience"><pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{experience}</pre></Section>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">{title}</h3>
      <div className="mt-2 border-t border-border pt-2">{children}</div>
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <textarea rows={rows} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
