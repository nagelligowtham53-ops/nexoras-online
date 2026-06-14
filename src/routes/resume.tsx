import { createFileRoute } from "@tanstack/react-router";
import { authedFetch } from "@/lib/authed-fetch";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { PremiumGate } from "@/components/PremiumGate";
import { Button } from "@/components/ui/button";
import {
  Download, Sparkles, Mail, Phone, MapPin, Globe, Linkedin, Github,
  Plus, Trash2, Save, Wand2, FileCheck2, Loader2, Upload, Search,
  GripVertical, Star, Printer, Share2, FileText, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "AI Resume Builder — 6 Premium Templates | Nexoras" },
      { name: "description", content: "Build an ATS-friendly resume with 6 professional templates, AI suggestions, ATS score analysis, and one-click PDF export. Free for students." },
    ],
  }),
  component: () => (
    <PremiumGate feature="AI Resume Builder">
      <ResumePage />
    </PremiumGate>
  ),
});

// ============ Types ============
type Experience = { id: string; company: string; role: string; period: string; bullets: string[] };
type Education = { id: string; school: string; degree: string; period: string; details: string };
type Project = { id: string; name: string; tech: string; description: string; link: string };
type Certification = { id: string; name: string; issuer: string; year: string };

type ResumeData = {
  name: string; role: string; email: string; phone: string; location: string;
  website: string; linkedin: string; github: string; photo: string;
  summary: string;
  skills: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
};

type TemplateId =
  | "modern" | "minimal" | "corporate" | "creative" | "tech" | "academic" | "analyst"
  | "harvard" | "stanford" | "iit" | "faang";
type Customization = { template: TemplateId; accent: string; font: string };

// ============ Templates meta ============
const TEMPLATES: { id: TemplateId; name: string; tag: string; desc: string; accent: string }[] = [
  { id: "modern",    name: "Modern Professional",     tag: "Popular",       desc: "Clean two-tone layout with sidebar accents. Great for any role.",          accent: "#6366f1" },
  { id: "harvard",   name: "Harvard Resume",          tag: "Ivy League",    desc: "Classic Harvard OCS layout — serif, dense, single column. Recruiter-loved.", accent: "#a51c30" },
  { id: "stanford",  name: "Stanford Resume",         tag: "Ivy League",    desc: "Stanford-style clean header, balanced sections, sans-serif elegance.",     accent: "#8c1515" },
  { id: "iit",       name: "IIT Placement Resume",    tag: "Campus",        desc: "Single-page IIT placement format with POR, achievements, and CGPA focus.", accent: "#1e3a8a" },
  { id: "faang",     name: "FAANG Software Engineer", tag: "Big Tech",      desc: "Metrics-first SWE resume tuned for Google/Meta/Amazon hiring bars.",        accent: "#0f766e" },
  { id: "minimal",   name: "Minimal ATS Resume",      tag: "ATS-Safe",      desc: "Pure typography, single column. Highest ATS pass rate.",                   accent: "#0f172a" },
  { id: "academic",  name: "Student / Fresher",       tag: "Entry Level",   desc: "Education-first layout for students, interns and freshers.",               accent: "#7c3aed" },
  { id: "tech",      name: "Software Engineer",       tag: "Engineer",      desc: "Mono-accent, code-style sections. Built for SWE/AI/ML roles.",             accent: "#10b981" },
  { id: "analyst",   name: "Data Analyst",            tag: "Analytics",     desc: "Metric-led layout with KPI highlights for analyst & data roles.",          accent: "#0ea5e9" },
  { id: "corporate", name: "Business Resume",         tag: "Professional",  desc: "Formal serif headings. Perfect for finance, consulting, MBA.",             accent: "#0e7490" },
  { id: "creative",  name: "Creative Designer",       tag: "Designer",      desc: "Bold gradient header with stats. For design and product roles.",           accent: "#ec4899" },
];

const FONTS = [
  { id: "inter",   label: "Inter (Modern)",       css: "'Inter', system-ui, sans-serif" },
  { id: "serif",   label: "Source Serif (Classic)", css: "'Source Serif Pro', Georgia, serif" },
  { id: "mono",    label: "JetBrains Mono (Tech)", css: "'JetBrains Mono', ui-monospace, monospace" },
  { id: "display", label: "Sora (Display)",       css: "'Sora', system-ui, sans-serif" },
];

const ACCENTS = ["#6366f1","#0e7490","#10b981","#ec4899","#f59e0b","#ef4444","#7c3aed","#0f172a"];

// ============ Defaults ============
const DEFAULT_DATA: ResumeData = {
  name: "Alex Sharma",
  role: "Computer Science Student · Aspiring Frontend Engineer",
  email: "alex@nexoras.app",
  phone: "+91 98765 43210",
  location: "Bengaluru, India",
  website: "alex.dev",
  linkedin: "linkedin.com/in/alexsharma",
  github: "github.com/alexsharma",
  photo: "",
  summary: "Curious CS student passionate about building beautiful, accessible interfaces. Strong foundation in React, TypeScript, and system design. Looking for a frontend internship where I can ship real product impact.",
  skills: "React, TypeScript, Tailwind CSS, Node.js, Python, PostgreSQL, Git, Figma, REST APIs, System Design",
  experience: [
    { id: "e1", company: "Acme Corp", role: "Frontend Intern", period: "Jun 2025 – Aug 2025", bullets: [
      "Shipped 3 marketing pages used by 40,000+ monthly visitors",
      "Improved Lighthouse performance score from 71 → 96 by code-splitting and image optimization",
      "Built reusable component library reducing dev time on new pages by 35%",
    ]},
  ],
  education: [
    { id: "ed1", school: "IIT Indore", degree: "B.Tech, Computer Science", period: "2023 – 2027", details: "GPA: 8.6 / 10 · Relevant: DSA, OS, DBMS, Web Dev" },
  ],
  projects: [
    { id: "p1", name: "StudyFlow", tech: "React, Supabase, TypeScript", description: "Pomodoro + analytics app used by 500+ JEE aspirants. Built spaced-repetition queue.", link: "github.com/alex/studyflow" },
  ],
  certifications: [
    { id: "c1", name: "Meta Front-End Developer", issuer: "Coursera", year: "2025" },
  ],
};

const DEFAULT_CUST: Customization = { template: "modern", accent: "#6366f1", font: "inter" };

// ============ Page ============
function ResumePage() {
  const [data, setData] = useState<ResumeData>(DEFAULT_DATA);
  const [cust, setCust] = useState<Customization>(DEFAULT_CUST);
  const [tab, setTab] = useState<"templates" | "edit" | "ai">("edit");
  const [search, setSearch] = useState("");

  // Load draft + share-link payload
  useEffect(() => {
    try {
      // ?r=<base64 json> for shareable resume links
      const url = new URL(window.location.href);
      const r = url.searchParams.get("r");
      if (r) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(r))));
        if (decoded?.data) setData(decoded.data);
        if (decoded?.cust) setCust(decoded.cust);
        return;
      }
      const d = localStorage.getItem("nexoras-resume-data");
      const c = localStorage.getItem("nexoras-resume-cust");
      if (d) setData(JSON.parse(d));
      if (c) setCust(JSON.parse(c));
    } catch { /* ignore */ }
  }, []);

  function saveDraft() {
    localStorage.setItem("nexoras-resume-data", JSON.stringify(data));
    localStorage.setItem("nexoras-resume-cust", JSON.stringify(cust));
    toast.success("Draft saved locally");
  }

  const [exporting, setExporting] = useState<null | "pdf" | "docx">(null);

  async function exportPDF() {
    setExporting("pdf");
    try {
      const node = document.getElementById("resume-print-area");
      if (!node) throw new Error("Preview not ready");
      // html2canvas-pro supports oklch / lab / color() — the original html2canvas
      // fails on Tailwind v4 design tokens and was the cause of past PDF errors.
      const [{ default: html2canvas }, jsPdfMod] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const jsPDF = jsPdfMod.jsPDF;
      // Force pixel width to A4 ratio so output paginates predictably.
      const prevWidth = node.style.width;
      node.style.width = "794px"; // 210mm @ 96dpi
      await new Promise((r) => requestAnimationFrame(r));
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
      });
      node.style.width = prevWidth;
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
      const fname = (data.name || "resume").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      pdf.save(`${fname}_resume.pdf`);
      toast.success("PDF exported");
    } catch (e) {
      toast.error("PDF export failed: " + (e as Error).message);
    } finally { setExporting(null); }
  }

  async function exportDOCX() {
    setExporting("docx");
    try {
      const {
        Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType,
        BorderStyle, LevelFormat, ExternalHyperlink,
      } = await import("docx");

      // Pick a font family that maps the on-screen choice to a Word-safe equivalent.
      const fontMap: Record<string, string> = {
        inter: "Calibri",
        serif: "Georgia",
        mono: "Consolas",
        display: "Calibri",
      };
      const docFont = fontMap[cust.font] || "Calibri";
      const accentHex = cust.accent.replace("#", "").toUpperCase();

      const run = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) =>
        new TextRun({ text, bold: opts.bold, italics: opts.italics, size: opts.size ?? 22, color: opts.color, font: docFont });

      const para = (text: string, opts: { bold?: boolean; size?: number; italics?: boolean; align?: typeof AlignmentType[keyof typeof AlignmentType] } = {}) =>
        new Paragraph({
          alignment: opts.align,
          spacing: { after: 80 },
          children: [run(text, opts)],
        });

      const sectionHeading = (text: string) =>
        new Paragraph({
          spacing: { before: 240, after: 120 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: accentHex, space: 2 } },
          children: [run(text.toUpperCase(), { bold: true, size: 24, color: accentHex })],
        });

      const bullet = (text: string) =>
        new Paragraph({
          numbering: { reference: "resume-bullets", level: 0 },
          spacing: { after: 40 },
          children: [run(text)],
        });

      const children: InstanceType<typeof Paragraph>[] = [];

      // Header — Name, role, contact
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [run(data.name, { bold: true, size: 44, color: accentHex })],
      }));
      if (data.role) children.push(para(data.role, { italics: true, size: 22, align: AlignmentType.CENTER }));

      const contactBits = [data.email, data.phone, data.location].filter(Boolean).join("  •  ");
      if (contactBits) children.push(para(contactBits, { size: 20, align: AlignmentType.CENTER }));

      const links = [
        data.website  ? { label: data.website,  url: data.website.startsWith("http") ? data.website : `https://${data.website}` } : null,
        data.linkedin ? { label: data.linkedin, url: data.linkedin.startsWith("http") ? data.linkedin : `https://${data.linkedin}` } : null,
        data.github   ? { label: data.github,   url: data.github.startsWith("http") ? data.github : `https://${data.github}` } : null,
      ].filter(Boolean) as { label: string; url: string }[];
      if (links.length) {
        const linkChildren: (TextRun | ExternalHyperlink)[] = [];
        links.forEach((l, i) => {
          if (i > 0) linkChildren.push(run("  •  ", { size: 20 }));
          linkChildren.push(new ExternalHyperlink({
            link: l.url,
            children: [new TextRun({ text: l.label, size: 20, color: accentHex, font: docFont, underline: {} })],
          }));
        });
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: linkChildren }));
      }

      if (data.summary) {
        children.push(sectionHeading("Summary"));
        children.push(para(data.summary));
      }

      if (data.experience.length) {
        children.push(sectionHeading("Experience"));
        for (const x of data.experience) {
          children.push(new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              run(`${x.role}`, { bold: true, size: 22 }),
              run(` — ${x.company}`, { size: 22 }),
              run(`   ${x.period}`, { italics: true, size: 20, color: "666666" }),
            ],
          }));
          for (const b of x.bullets.filter(Boolean)) children.push(bullet(b));
        }
      }

      if (data.education.length) {
        children.push(sectionHeading("Education"));
        for (const e of data.education) {
          children.push(new Paragraph({
            spacing: { before: 80, after: 20 },
            children: [
              run(`${e.degree}`, { bold: true, size: 22 }),
              run(` — ${e.school}`, { size: 22 }),
              run(`   ${e.period}`, { italics: true, size: 20, color: "666666" }),
            ],
          }));
          if (e.details) children.push(para(e.details, { size: 20 }));
        }
      }

      if (data.skills) {
        children.push(sectionHeading("Skills"));
        const skillList = data.skills.split(",").map((s) => s.trim()).filter(Boolean);
        // Keep skills as a single paragraph with bullet separators so ATS parsers
        // pick them up as a comma list, but they still read as a structured group.
        children.push(new Paragraph({
          spacing: { after: 80 },
          children: [run(skillList.join("  •  "), { size: 22 })],
        }));
      }

      if (data.projects.length) {
        children.push(sectionHeading("Projects"));
        for (const p of data.projects) {
          children.push(new Paragraph({
            spacing: { before: 80, after: 20 },
            children: [
              run(`${p.name}`, { bold: true, size: 22, color: accentHex }),
              run(` — ${p.tech}`, { italics: true, size: 20 }),
            ],
          }));
          if (p.description) children.push(para(p.description, { size: 20 }));
          if (p.link) {
            const url = p.link.startsWith("http") ? p.link : `https://${p.link}`;
            children.push(new Paragraph({
              spacing: { after: 40 },
              children: [new ExternalHyperlink({
                link: url,
                children: [new TextRun({ text: p.link, size: 18, color: accentHex, font: docFont, underline: {} })],
              })],
            }));
          }
        }
      }

      if (data.certifications.length) {
        children.push(sectionHeading("Certifications"));
        for (const c of data.certifications) children.push(bullet(`${c.name} — ${c.issuer} (${c.year})`));
      }

      const doc = new Document({
        creator: "Nexoras Resume Builder",
        title: `${data.name} Resume`,
        styles: { default: { document: { run: { font: docFont, size: 22 } } } },
        numbering: {
          config: [{
            reference: "resume-bullets",
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 270 } } },
            }],
          }],
        },
        sections: [{
          properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
          children,
        }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fname = (data.name || "resume").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
      a.href = url; a.download = `${fname}_resume.docx`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("DOCX exported");
    } catch (e) {
      toast.error("DOCX export failed: " + (e as Error).message);
    } finally { setExporting(null); }
  }

  function printResume() {
    saveDraft();
    setTimeout(() => window.print(), 80);
  }

  async function shareLink() {
    try {
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ data, cust }))));
      const url = `${window.location.origin}${window.location.pathname}?r=${encodeURIComponent(payload)}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch (e) {
      toast.error("Could not copy link: " + (e as Error).message);
    }
  }

  const filteredTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.tag.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <PageShell>
      <div className="print:hidden">
        <PageHeader
          eyebrow="Resume Builder 2.0"
          title="Build a resume that lands interviews"
          description="6 ATS-friendly templates · AI bullet rewrites · ATS score · One-click PDF export"
        />
      </div>

      <section className="mx-auto max-w-[1400px] px-3 py-6 lg:px-8 lg:py-10 print:p-0 print:max-w-none">
        {/* Toolbar */}
        <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1">
            {[
              { id: "templates", label: "Templates" },
              { id: "edit",      label: "Editor" },
              { id: "ai",        label: "AI Tools" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveDraft}><Save className="h-4 w-4" /> Save</Button>
            <Button variant="outline" size="sm" onClick={printResume}><Printer className="h-4 w-4" /> Print</Button>
            <Button variant="outline" size="sm" onClick={shareLink}><Share2 className="h-4 w-4" /> Share link</Button>
            <Button variant="outline" size="sm" onClick={exportDOCX} disabled={exporting === "docx"}>
              {exporting === "docx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} DOCX
            </Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow" onClick={exportPDF} disabled={exporting === "pdf"}>
              {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export PDF
            </Button>
          </div>
        </div>


        <div className="grid gap-6 lg:grid-cols-[420px_1fr] print:block">
          {/* Left panel */}
          <div className="print:hidden space-y-4">
            {tab === "templates" && (
              <TemplatesPanel
                search={search} setSearch={setSearch}
                templates={filteredTemplates}
                cust={cust} setCust={setCust} data={data}
              />
            )}
            {tab === "edit" && (
              <EditorPanel data={data} setData={setData} cust={cust} setCust={setCust} />
            )}
            {tab === "ai" && (
              <AIPanel data={data} setData={setData} />
            )}
          </div>

          {/* Preview (always visible) */}
          <div className="print:m-0">
            <div className="print:hidden text-xs uppercase tracking-widest text-muted-foreground mb-2">Live preview</div>
            <div id="resume-print-area" className="rounded-2xl border border-border bg-white text-slate-900 shadow-elegant overflow-hidden print:rounded-none print:border-0 print:shadow-none">
              <ResumeView data={data} cust={cust} />
            </div>
          </div>
        </div>
      </section>

      {/* Print CSS */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          header, footer, nav, .print\\:hidden { display: none !important; }
          #resume-print-area { box-shadow: none !important; border: 0 !important; }
        }
      `}</style>
    </PageShell>
  );
}

// ============ Templates Panel ============
function TemplatesPanel({
  search, setSearch, templates, cust, setCust, data,
}: {
  search: string; setSearch: (v: string) => void;
  templates: typeof TEMPLATES;
  cust: Customization; setCust: (c: Customization) => void;
  data: ResumeData;
}) {
  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => {
          const active = cust.template === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setCust({ ...cust, template: t.id, accent: t.accent })}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-glow ${active ? "border-primary ring-2 ring-primary/40" : "border-border"}`}
            >
              <div className="aspect-[3/4] overflow-hidden rounded-md bg-white">
                <div className="origin-top-left scale-[0.28] w-[357%] h-[357%]">
                  <ResumeView data={data} cust={{ ...cust, template: t.id, accent: t.accent }} mini />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.tag}</div>
                </div>
                {active && <Star className="h-4 w-4 fill-primary text-primary" />}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ Editor Panel ============
function EditorPanel({
  data, setData, cust, setCust,
}: { data: ResumeData; setData: (d: ResumeData) => void; cust: Customization; setCust: (c: Customization) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setData({ ...data, photo: String(r.result) });
    r.readAsDataURL(f);
  }
  const upd = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) => setData({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      {/* Customization */}
      <Section title="Style">
        <div className="grid gap-3">
          <div>
            <Label>Font</Label>
            <select className={inputCls} value={cust.font} onChange={(e) => setCust({ ...cust, font: e.target.value })}>
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <Label>Accent color</Label>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((c) => (
                <button key={c} onClick={() => setCust({ ...cust, accent: c })}
                  className={`h-7 w-7 rounded-full border-2 transition ${cust.accent === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }} aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Personal */}
      <Section title="Personal">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-secondary/60">
            {data.photo
              ? <img src={data.photo} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No photo</div>}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-3 w-3" /> Upload</Button>
            {data.photo && <Button size="sm" variant="ghost" onClick={() => upd("photo", "")}>Remove</Button>}
          </div>
        </div>
        <Field label="Full name"  value={data.name}     onChange={(v) => upd("name", v)} />
        <Field label="Headline"   value={data.role}     onChange={(v) => upd("role", v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email"    value={data.email}    onChange={(v) => upd("email", v)} />
          <Field label="Phone"    value={data.phone}    onChange={(v) => upd("phone", v)} />
          <Field label="Location" value={data.location} onChange={(v) => upd("location", v)} />
          <Field label="Website"  value={data.website}  onChange={(v) => upd("website", v)} />
          <Field label="LinkedIn" value={data.linkedin} onChange={(v) => upd("linkedin", v)} />
          <Field label="GitHub"   value={data.github}   onChange={(v) => upd("github", v)} />
        </div>
      </Section>

      <Section title="Summary">
        <TextField label="Professional summary" rows={4} value={data.summary} onChange={(v) => upd("summary", v)} />
      </Section>

      <Section title="Skills">
        <TextField label="Skills (comma separated)" rows={2} value={data.skills} onChange={(v) => upd("skills", v)} />
      </Section>

      {/* Experience */}
      <Section title="Experience" onAdd={() => upd("experience", [...data.experience, { id: cryptoId(), company: "", role: "", period: "", bullets: [""] }])}>
        {data.experience.map((x, i) => (
          <Card key={x.id} onRemove={() => upd("experience", data.experience.filter((_, j) => j !== i))}>
            <Field label="Company" value={x.company} onChange={(v) => updArr("experience", data, setData, i, { ...x, company: v })} />
            <Field label="Role"    value={x.role}    onChange={(v) => updArr("experience", data, setData, i, { ...x, role: v })} />
            <Field label="Period"  value={x.period}  onChange={(v) => updArr("experience", data, setData, i, { ...x, period: v })} />
            <Label>Bullet points</Label>
            {x.bullets.map((b, bi) => (
              <div key={bi} className="flex items-start gap-2">
                <textarea rows={2} className={inputCls} value={b} onChange={(e) => {
                  const bullets = [...x.bullets]; bullets[bi] = e.target.value;
                  updArr("experience", data, setData, i, { ...x, bullets });
                }} />
                <Button size="icon" variant="ghost" onClick={() => {
                  const bullets = x.bullets.filter((_, j) => j !== bi);
                  updArr("experience", data, setData, i, { ...x, bullets });
                }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => updArr("experience", data, setData, i, { ...x, bullets: [...x.bullets, ""] })}>
              <Plus className="h-3 w-3" /> Add bullet
            </Button>
          </Card>
        ))}
      </Section>

      {/* Education */}
      <Section title="Education" onAdd={() => upd("education", [...data.education, { id: cryptoId(), school: "", degree: "", period: "", details: "" }])}>
        {data.education.map((x, i) => (
          <Card key={x.id} onRemove={() => upd("education", data.education.filter((_, j) => j !== i))}>
            <Field label="School"  value={x.school}  onChange={(v) => updArr("education", data, setData, i, { ...x, school: v })} />
            <Field label="Degree"  value={x.degree}  onChange={(v) => updArr("education", data, setData, i, { ...x, degree: v })} />
            <Field label="Period"  value={x.period}  onChange={(v) => updArr("education", data, setData, i, { ...x, period: v })} />
            <Field label="Details" value={x.details} onChange={(v) => updArr("education", data, setData, i, { ...x, details: v })} />
          </Card>
        ))}
      </Section>

      {/* Projects */}
      <Section title="Projects" onAdd={() => upd("projects", [...data.projects, { id: cryptoId(), name: "", tech: "", description: "", link: "" }])}>
        {data.projects.map((x, i) => (
          <Card key={x.id} onRemove={() => upd("projects", data.projects.filter((_, j) => j !== i))}>
            <Field label="Name" value={x.name} onChange={(v) => updArr("projects", data, setData, i, { ...x, name: v })} />
            <Field label="Tech" value={x.tech} onChange={(v) => updArr("projects", data, setData, i, { ...x, tech: v })} />
            <TextField label="Description" rows={2} value={x.description} onChange={(v) => updArr("projects", data, setData, i, { ...x, description: v })} />
            <Field label="Link" value={x.link} onChange={(v) => updArr("projects", data, setData, i, { ...x, link: v })} />
          </Card>
        ))}
      </Section>

      {/* Certifications */}
      <Section title="Certifications" onAdd={() => upd("certifications", [...data.certifications, { id: cryptoId(), name: "", issuer: "", year: "" }])}>
        {data.certifications.map((x, i) => (
          <Card key={x.id} onRemove={() => upd("certifications", data.certifications.filter((_, j) => j !== i))}>
            <Field label="Name"   value={x.name}   onChange={(v) => updArr("certifications", data, setData, i, { ...x, name: v })} />
            <Field label="Issuer" value={x.issuer} onChange={(v) => updArr("certifications", data, setData, i, { ...x, issuer: v })} />
            <Field label="Year"   value={x.year}   onChange={(v) => updArr("certifications", data, setData, i, { ...x, year: v })} />
          </Card>
        ))}
      </Section>
    </div>
  );
}

function updArr<K extends "experience" | "education" | "projects" | "certifications">(
  key: K, data: ResumeData, setData: (d: ResumeData) => void, i: number, item: ResumeData[K][number]
) {
  const next = [...data[key]] as ResumeData[K];
  (next as unknown as Array<typeof item>)[i] = item;
  setData({ ...data, [key]: next });
}

function cryptoId() { return Math.random().toString(36).slice(2, 10); }

// ============ AI Panel ============
function AIPanel({ data, setData }: { data: ResumeData; setData: (d: ResumeData) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [ats, setAts] = useState<{ score: number; strengths: string[]; gaps: string[]; keywords: string[] } | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [interviewQs, setInterviewQs] = useState<string[]>([]);

  async function callAI(system: string, user: string): Promise<string> {
    const res = await authedFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: user }] }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      throw new Error(t || `HTTP ${res.status}`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      out += dec.decode(value, { stream: true });
    }
    return out.trim();
  }

  async function improveSummary() {
    setBusy("summary");
    try {
      const out = await callAI(
        "You are an expert resume writer. Rewrite the user's summary into 2-3 punchy sentences (max 60 words). Lead with role/skills, add quantified impact, end with goal. Return ONLY the rewritten summary text — no preamble, no quotes.",
        `Current role: ${data.role}\nSkills: ${data.skills}\nCurrent summary: ${data.summary}`
      );
      setData({ ...data, summary: out });
      toast.success("Summary improved");
    } catch (e) { toast.error("AI failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  async function improveBullets() {
    setBusy("bullets");
    try {
      const updated = await Promise.all(data.experience.map(async (exp) => {
        if (!exp.role) return exp;
        const joined = exp.bullets.filter(Boolean).join("\n");
        if (!joined) return exp;
        const out = await callAI(
          "Rewrite each bullet using the formula: action verb + what + measurable impact. Keep under 22 words each. Return ONLY the bullets, one per line, no numbering, no markdown.",
          `Role: ${exp.role} at ${exp.company}\nBullets:\n${joined}`
        );
        const bullets = out.split("\n").map((s) => s.replace(/^[-•*\d.\s]+/, "").trim()).filter(Boolean);
        return { ...exp, bullets: bullets.length ? bullets : exp.bullets };
      }));
      setData({ ...data, experience: updated });
      toast.success("Bullets rewritten");
    } catch (e) { toast.error("AI failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  async function runATS() {
    setBusy("ats");
    try {
      const resumeText = JSON.stringify({
        role: data.role, summary: data.summary, skills: data.skills,
        experience: data.experience.map((e) => ({ role: e.role, company: e.company, bullets: e.bullets })),
        projects: data.projects.map((p) => ({ name: p.name, tech: p.tech, description: p.description })),
      });
      const out = await callAI(
        `You are an ATS (Applicant Tracking System) analyzer. Score the resume 0-100 against the target role/JD. Return STRICT JSON only, no markdown fences:
{"score": number, "strengths": [string,string,string], "gaps": [string,string,string], "keywords": [string,...] }
Keywords = up to 8 missing/recommended keywords for the target role.`,
        `Target role / JD: ${jobDesc || data.role}\n\nResume JSON: ${resumeText}`
      );
      const cleaned = out.replace(/^```json|^```|```$/gm, "").trim();
      const parsed = JSON.parse(cleaned);
      setAts(parsed);
      toast.success(`ATS score: ${parsed.score}/100`);
    } catch (e) { toast.error("ATS analysis failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  async function fixGrammar() {
    setBusy("grammar");
    try {
      const out = await callAI(
        "Fix grammar, spelling, and clarity in this text. Keep tone professional and concise. Return ONLY the corrected text.",
        data.summary
      );
      setData({ ...data, summary: out });
      toast.success("Grammar polished");
    } catch (e) { toast.error("AI failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  async function improveProjects() {
    setBusy("projects");
    try {
      const updated = await Promise.all(data.projects.map(async (p) => {
        if (!p.name) return p;
        const out = await callAI(
          "Rewrite this project description into 1-2 punchy sentences emphasising tech stack, what was built, and measurable outcome. Return ONLY the description.",
          `Project: ${p.name}\nTech: ${p.tech}\nCurrent: ${p.description}`
        );
        return { ...p, description: out };
      }));
      setData({ ...data, projects: updated });
      toast.success("Project descriptions improved");
    } catch (e) { toast.error("AI failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  async function suggestSkills() {
    setBusy("skills");
    try {
      const out = await callAI(
        "Suggest 8-12 highly relevant skills (comma separated, no numbering) for the target role given the existing skills. Avoid duplicates. Return ONLY the comma list.",
        `Role: ${data.role}\nExisting: ${data.skills}`
      );
      setData({ ...data, skills: (data.skills ? data.skills + ", " : "") + out });
      toast.success("Skills suggested");
    } catch (e) { toast.error("AI failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  async function generateInterviewQs() {
    setBusy("interview");
    try {
      const out = await callAI(
        "Generate 8 realistic interview questions tailored to this resume — mix behavioural, technical, and project-deep-dive. Return ONLY the questions, one per line, no numbering.",
        `Role: ${data.role}\nSkills: ${data.skills}\nExperience: ${data.experience.map((e) => `${e.role}@${e.company}`).join("; ")}\nProjects: ${data.projects.map((p) => p.name).join("; ")}`
      );
      const qs = out.split("\n").map((s) => s.replace(/^[-•*\d.\s]+/, "").trim()).filter(Boolean);
      setInterviewQs(qs);
      toast.success("Interview questions ready");
    } catch (e) { toast.error("AI failed: " + (e as Error).message); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      <Section title="AI Resume Tools">
        <div className="grid gap-2">
          <AIButton label="Rewrite summary" busy={busy === "summary"} onClick={improveSummary} icon={<Sparkles className="h-4 w-4" />} />
          <AIButton label="Improve all bullet points" busy={busy === "bullets"} onClick={improveBullets} icon={<Wand2 className="h-4 w-4" />} />
          <AIButton label="Improve project descriptions" busy={busy === "projects"} onClick={improveProjects} icon={<Wand2 className="h-4 w-4" />} />
          <AIButton label="Suggest more skills" busy={busy === "skills"} onClick={suggestSkills} icon={<Sparkles className="h-4 w-4" />} />
          <AIButton label="Fix grammar in summary" busy={busy === "grammar"} onClick={fixGrammar} icon={<Wand2 className="h-4 w-4" />} />
          <AIButton label="Generate interview questions" busy={busy === "interview"} onClick={generateInterviewQs} icon={<MessageSquare className="h-4 w-4" />} />
        </div>
        {interviewQs.length > 0 && (
          <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interview prep based on your resume</div>
            <ol className="list-decimal list-outside ml-4 space-y-1 text-sm">
              {interviewQs.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
        )}
      </Section>


      <Section title="ATS Score Analyzer">
        <TextField
          label="Paste target job description (optional — boosts accuracy)"
          rows={4} value={jobDesc} onChange={setJobDesc}
        />
        <AIButton label="Run ATS analysis" busy={busy === "ats"} onClick={runATS} icon={<FileCheck2 className="h-4 w-4" />} />

        {ats && (
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                    strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={`${ats.score}, 100`}
                    className={ats.score >= 75 ? "text-emerald-500" : ats.score >= 50 ? "text-amber-500" : "text-rose-500"} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold">{ats.score}</div>
              </div>
              <div>
                <div className="text-sm font-semibold">ATS Compatibility</div>
                <div className="text-xs text-muted-foreground">Score out of 100</div>
              </div>
            </div>
            <ATSList title="Strengths" items={ats.strengths} tone="ok" />
            <ATSList title="Gaps to fix" items={ats.gaps} tone="warn" />
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended keywords</div>
              <div className="flex flex-wrap gap-1.5">
                {ats.keywords.map((k) => (
                  <span key={k} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs">{k}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function ATSList({ title, items, tone }: { title: string; items: string[]; tone: "ok" | "warn" }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={tone === "ok" ? "text-emerald-500" : "text-amber-500"}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AIButton({ label, busy, onClick, icon }: { label: string; busy: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <Button onClick={onClick} disabled={busy} className="w-full justify-start bg-gradient-primary text-primary-foreground shadow-glow">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {busy ? "Working…" : label}
    </Button>
  );
}

// ============ Form atoms ============
const inputCls = "mt-1 w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-muted-foreground">{children}</span>;
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <Label>{label}</Label>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function TextField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block text-sm">
      <Label>{label}</Label>
      <textarea rows={rows} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Section({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        {onAdd && <Button size="sm" variant="outline" onClick={onAdd}><Plus className="h-3 w-3" /> Add</Button>}
      </div>
      {children}
    </div>
  );
}
function Card({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2 relative">
      <div className="flex items-center justify-between">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Button size="icon" variant="ghost" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
      </div>
      {children}
    </div>
  );
}

// ============ Resume View (renders selected template) ============
function ResumeView({ data, cust, mini }: { data: ResumeData; cust: Customization; mini?: boolean }) {
  const font = FONTS.find((f) => f.id === cust.font)?.css || FONTS[0].css;
  const props = { data, accent: cust.accent };
  const wrapperStyle: React.CSSProperties = { fontFamily: font, color: "#0f172a", background: "white" };
  return (
    <div style={wrapperStyle} className={mini ? "p-4 text-[10px]" : "p-8 text-sm"}>
      {cust.template === "modern"    && <ModernTpl {...props} />}
      {cust.template === "minimal"   && <MinimalTpl {...props} />}
      {cust.template === "corporate" && <CorporateTpl {...props} />}
      {cust.template === "creative"  && <CreativeTpl {...props} />}
      {cust.template === "tech"      && <TechTpl {...props} />}
      {cust.template === "academic"  && <AcademicTpl {...props} />}
      {cust.template === "analyst"   && <AnalystTpl {...props} />}
    </div>
  );
}

// Shared bits
function ContactRow({ data }: { data: ResumeData }) {
  const items: { icon: React.ReactNode; v: string }[] = [
    { icon: <Mail className="h-3 w-3" />, v: data.email },
    { icon: <Phone className="h-3 w-3" />, v: data.phone },
    { icon: <MapPin className="h-3 w-3" />, v: data.location },
    { icon: <Globe className="h-3 w-3" />, v: data.website },
    { icon: <Linkedin className="h-3 w-3" />, v: data.linkedin },
    { icon: <Github className="h-3 w-3" />, v: data.github },
  ].filter((i) => i.v);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
      {items.map((it, i) => <span key={i} className="inline-flex items-center gap-1">{it.icon}{it.v}</span>)}
    </div>
  );
}

function SkillsList({ data }: { data: ResumeData }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {data.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
        <span key={s} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px]">{s}</span>
      ))}
    </div>
  );
}

// ===== Modern =====
function ModernTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="grid grid-cols-[1fr_2fr] gap-6">
      <aside className="space-y-4 rounded-lg p-4" style={{ background: `${accent}10` }}>
        {data.photo && <img src={data.photo} alt="" className="h-24 w-24 rounded-full object-cover mx-auto" />}
        <div>
          <h1 className="text-xl font-bold leading-tight" style={{ color: accent }}>{data.name}</h1>
          <p className="mt-1 text-xs text-slate-600">{data.role}</p>
        </div>
        <ContactRow data={data} />
        <div>
          <H accent={accent}>Skills</H>
          <SkillsList data={data} />
        </div>
        {data.education.length > 0 && (
          <div>
            <H accent={accent}>Education</H>
            {data.education.map((e) => (
              <div key={e.id} className="mb-2 text-xs">
                <div className="font-semibold">{e.degree}</div>
                <div className="text-slate-600">{e.school}</div>
                <div className="text-slate-500">{e.period}</div>
                {e.details && <div className="text-slate-500">{e.details}</div>}
              </div>
            ))}
          </div>
        )}
      </aside>
      <main className="space-y-4">
        <Block title="Summary" accent={accent}><p className="text-xs leading-relaxed">{data.summary}</p></Block>
        <Block title="Experience" accent={accent}>{data.experience.map((x) => <ExpItem key={x.id} x={x} accent={accent} />)}</Block>
        {data.projects.length > 0 && <Block title="Projects" accent={accent}>{data.projects.map((p) => <ProjItem key={p.id} p={p} accent={accent} />)}</Block>}
        {data.certifications.length > 0 && <Block title="Certifications" accent={accent}>
          <ul className="text-xs space-y-1">
            {data.certifications.map((c) => <li key={c.id}>• <strong>{c.name}</strong> — {c.issuer} ({c.year})</li>)}
          </ul>
        </Block>}
      </main>
    </div>
  );
}

// ===== Minimal =====
function MinimalTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header className="text-center border-b border-slate-200 pb-3">
        <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
        <p className="text-sm text-slate-600">{data.role}</p>
        <div className="mt-2 flex justify-center"><ContactRow data={data} /></div>
      </header>
      <Block title="Summary" accent={accent} flat><p className="text-xs leading-relaxed">{data.summary}</p></Block>
      <Block title="Experience" accent={accent} flat>{data.experience.map((x) => <ExpItem key={x.id} x={x} accent={accent} />)}</Block>
      <Block title="Education" accent={accent} flat>
        {data.education.map((e) => (
          <div key={e.id} className="mb-2 text-xs flex justify-between">
            <div><strong>{e.degree}</strong>, {e.school} <span className="text-slate-500">{e.details}</span></div>
            <div className="text-slate-500">{e.period}</div>
          </div>
        ))}
      </Block>
      <Block title="Skills" accent={accent} flat><SkillsList data={data} /></Block>
      {data.projects.length > 0 && <Block title="Projects" accent={accent} flat>{data.projects.map((p) => <ProjItem key={p.id} p={p} accent={accent} />)}</Block>}
    </div>
  );
}

// ===== Corporate =====
function CorporateTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="space-y-4" style={{ fontFamily: "'Source Serif Pro', Georgia, serif" }}>
      <header className="border-b-2 pb-2" style={{ borderColor: accent }}>
        <h1 className="text-2xl font-bold uppercase tracking-wider" style={{ color: accent }}>{data.name}</h1>
        <p className="text-sm italic text-slate-700">{data.role}</p>
        <div className="mt-1"><ContactRow data={data} /></div>
      </header>
      <Block title="Professional Summary" accent={accent}><p className="text-xs leading-relaxed">{data.summary}</p></Block>
      <Block title="Professional Experience" accent={accent}>{data.experience.map((x) => <ExpItem key={x.id} x={x} accent={accent} />)}</Block>
      <Block title="Education" accent={accent}>
        {data.education.map((e) => (
          <div key={e.id} className="mb-2 text-xs">
            <div className="font-bold">{e.degree} — {e.school}</div>
            <div className="text-slate-600 italic">{e.period} · {e.details}</div>
          </div>
        ))}
      </Block>
      <Block title="Core Competencies" accent={accent}><SkillsList data={data} /></Block>
      {data.certifications.length > 0 && <Block title="Certifications" accent={accent}>
        <ul className="text-xs space-y-1">
          {data.certifications.map((c) => <li key={c.id}>{c.name} — <em>{c.issuer}</em>, {c.year}</li>)}
        </ul>
      </Block>}
    </div>
  );
}

// ===== Creative =====
function CreativeTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="space-y-5">
      <header className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}>
        <div className="flex items-center gap-4">
          {data.photo && <img src={data.photo} alt="" className="h-20 w-20 rounded-full object-cover ring-4 ring-white/30" />}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-sm opacity-90">{data.role}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <Stat n={data.experience.length} l="Roles" />
          <Stat n={data.projects.length} l="Projects" />
          <Stat n={data.certifications.length} l="Certs" />
        </div>
      </header>
      <ContactRow data={data} />
      <Block title="About" accent={accent}><p className="text-xs leading-relaxed">{data.summary}</p></Block>
      <Block title="Experience" accent={accent}>{data.experience.map((x) => <ExpItem key={x.id} x={x} accent={accent} />)}</Block>
      <Block title="Selected Projects" accent={accent}>{data.projects.map((p) => <ProjItem key={p.id} p={p} accent={accent} />)}</Block>
      <div className="grid grid-cols-2 gap-4">
        <Block title="Education" accent={accent}>
          {data.education.map((e) => <div key={e.id} className="text-xs mb-1"><strong>{e.degree}</strong><div>{e.school} · {e.period}</div></div>)}
        </Block>
        <Block title="Skills" accent={accent}><SkillsList data={data} /></Block>
      </div>
    </div>
  );
}
function Stat({ n, l }: { n: number; l: string }) {
  return <div className="rounded-md bg-white/15 py-1.5"><div className="text-base font-bold">{n}</div><div className="opacity-80">{l}</div></div>;
}

// ===== Tech =====
function TechTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="space-y-4 font-mono text-[12px]">
      <header>
        <h1 className="text-xl font-bold"><span style={{ color: accent }}>$</span> {data.name}</h1>
        <p className="text-slate-600">// {data.role}</p>
        <div className="mt-1"><ContactRow data={data} /></div>
      </header>
      <Block title="// summary" accent={accent}><p className="leading-relaxed">{data.summary}</p></Block>
      <Block title="// experience" accent={accent}>
        {data.experience.map((x) => (
          <div key={x.id} className="mb-2">
            <div><span style={{ color: accent }}>▸</span> <strong>{x.role}</strong> @ {x.company} <span className="text-slate-500">[{x.period}]</span></div>
            <ul className="ml-4 list-disc list-inside text-slate-700">{x.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
          </div>
        ))}
      </Block>
      <Block title="// projects" accent={accent}>{data.projects.map((p) => (
        <div key={p.id} className="mb-2"><strong style={{ color: accent }}>{p.name}</strong> — <em>{p.tech}</em><div>{p.description}</div></div>
      ))}</Block>
      <Block title="// skills" accent={accent}><SkillsList data={data} /></Block>
      <Block title="// education" accent={accent}>{data.education.map((e) => (
        <div key={e.id}>{e.degree}, {e.school} <span className="text-slate-500">[{e.period}]</span></div>
      ))}</Block>
    </div>
  );
}

// ===== Academic =====
function AcademicTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto" style={{ fontFamily: "'Source Serif Pro', Georgia, serif" }}>
      <header className="text-center">
        <h1 className="text-2xl font-bold">{data.name}</h1>
        <p className="text-sm">{data.role}</p>
        <div className="mt-1 flex justify-center"><ContactRow data={data} /></div>
      </header>
      <Block title="Research Interests" accent={accent}><p className="text-xs leading-relaxed italic">{data.summary}</p></Block>
      <Block title="Education" accent={accent}>
        {data.education.map((e) => (
          <div key={e.id} className="mb-2 text-xs">
            <div><strong>{e.degree}</strong>, {e.school}, <em>{e.period}</em></div>
            <div className="text-slate-600">{e.details}</div>
          </div>
        ))}
      </Block>
      <Block title="Experience" accent={accent}>{data.experience.map((x) => <ExpItem key={x.id} x={x} accent={accent} />)}</Block>
      {data.projects.length > 0 && <Block title="Selected Projects & Publications" accent={accent}>{data.projects.map((p) => <ProjItem key={p.id} p={p} accent={accent} />)}</Block>}
      <Block title="Technical Skills" accent={accent}><SkillsList data={data} /></Block>
      {data.certifications.length > 0 && <Block title="Awards & Certifications" accent={accent}>
        <ul className="text-xs space-y-1">{data.certifications.map((c) => <li key={c.id}>{c.name}, {c.issuer} ({c.year})</li>)}</ul>
      </Block>}
    </div>
  );
}

// ===== Analyst =====
function AnalystTpl({ data, accent }: { data: ResumeData; accent: string }) {
  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between border-b-2 pb-3" style={{ borderColor: accent }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: accent }}>{data.name}</h1>
          <p className="text-sm text-slate-700">{data.role}</p>
          <div className="mt-1"><ContactRow data={data} /></div>
        </div>
        {data.photo && <img src={data.photo} alt="" className="h-16 w-16 rounded-md object-cover" />}
      </header>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Kpi label="Years exp." value={String(data.experience.length)} accent={accent} />
        <Kpi label="Projects" value={String(data.projects.length)} accent={accent} />
        <Kpi label="Certifications" value={String(data.certifications.length)} accent={accent} />
      </div>
      <Block title="Profile" accent={accent}><p className="text-xs leading-relaxed">{data.summary}</p></Block>
      <Block title="Core Skills" accent={accent}><SkillsList data={data} /></Block>
      <Block title="Experience" accent={accent}>{data.experience.map((x) => <ExpItem key={x.id} x={x} accent={accent} />)}</Block>
      {data.projects.length > 0 && <Block title="Analytics Projects" accent={accent}>{data.projects.map((p) => <ProjItem key={p.id} p={p} accent={accent} />)}</Block>}
      <div className="grid grid-cols-2 gap-4">
        <Block title="Education" accent={accent}>
          {data.education.map((e) => (
            <div key={e.id} className="text-xs mb-1"><strong>{e.degree}</strong><div>{e.school} · {e.period}</div><div className="text-slate-500">{e.details}</div></div>
          ))}
        </Block>
        {data.certifications.length > 0 && <Block title="Certifications" accent={accent}>
          <ul className="text-xs space-y-1">{data.certifications.map((c) => <li key={c.id}>• {c.name} — {c.issuer} ({c.year})</li>)}</ul>
        </Block>}
      </div>
    </div>
  );
}
function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md border border-slate-200 py-2">
      <div className="text-lg font-bold" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}



// shared block + atoms
function H({ accent, children }: { accent: string; children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accent }}>{children}</div>;
}
function Block({ title, accent, children, flat }: { title: string; accent: string; children: React.ReactNode; flat?: boolean }) {
  return (
    <section>
      <div className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${flat ? "border-b border-slate-200 pb-1" : ""}`} style={{ color: accent }}>
        {title}
      </div>
      {children}
    </section>
  );
}
function ExpItem({ x, accent }: { x: Experience; accent: string }) {
  return (
    <div className="mb-3 text-xs">
      <div className="flex justify-between">
        <div><strong>{x.role}</strong> · <span style={{ color: accent }}>{x.company}</span></div>
        <div className="text-slate-500">{x.period}</div>
      </div>
      <ul className="mt-1 list-disc list-outside ml-4 space-y-0.5">
        {x.bullets.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  );
}
function ProjItem({ p, accent }: { p: Project; accent: string }) {
  return (
    <div className="mb-2 text-xs">
      <div><strong style={{ color: accent }}>{p.name}</strong> — <em>{p.tech}</em> {p.link && <span className="text-slate-500">· {p.link}</span>}</div>
      <div className="text-slate-700">{p.description}</div>
    </div>
  );
}
