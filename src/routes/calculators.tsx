import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, PageHeader } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { GraduationCap, CalendarCheck, Percent, IndianRupee, Cake } from "lucide-react";

export const Route = createFileRoute("/calculators")({
  head: () => ({ meta: [{ title: "Smart Calculator Hub — Nexoras" }, { name: "description", content: "CGPA, attendance, percentage, EMI & age calculators in one place." }] }),
  component: Calculators,
});

const tabs = [
  { id: "cgpa", label: "CGPA", icon: GraduationCap },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "percentage", label: "Percentage", icon: Percent },
  { id: "emi", label: "EMI", icon: IndianRupee },
  { id: "age", label: "Age", icon: Cake },
] as const;

type TabId = typeof tabs[number]["id"];

function Calculators() {
  const [active, setActive] = useState<TabId>("cgpa");
  return (
    <PageShell>
      <PageHeader
        eyebrow="Smart Calculator Hub"
        title="All your calculators, in one beautiful place"
        description="Premium tools every student needs — built fast, accurate, and beautiful."
      />
      <section className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <div className="glass flex flex-wrap gap-2 rounded-2xl p-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors ${
                active === t.id ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {active === "cgpa" && <CGPA />}
          {active === "attendance" && <Attendance />}
          {active === "percentage" && <Percentage />}
          {active === "emi" && <EMI />}
          {active === "age" && <Age />}
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
const inputCls = "w-full rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-6 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold text-gradient">{value}</p>
    </div>
  );
}

function CGPA() {
  const [rows, setRows] = useState([
    { credits: 4, grade: 9 },
    { credits: 3, grade: 8 },
    { credits: 3, grade: 10 },
  ]);
  const cgpa = useMemo(() => {
    const tc = rows.reduce((a, r) => a + r.credits, 0);
    if (!tc) return "0.00";
    const tp = rows.reduce((a, r) => a + r.credits * r.grade, 0);
    return (tp / tc).toFixed(2);
  }, [rows]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass space-y-3 rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Your subjects</h2>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <Field label={`Credits #${i + 1}`}>
              <input type="number" className={inputCls} value={r.credits} onChange={(e) => {
                const v = Number(e.target.value); setRows(rows.map((x, idx) => idx === i ? { ...x, credits: v } : x));
              }} />
            </Field>
            <Field label="Grade point">
              <input type="number" min={0} max={10} className={inputCls} value={r.grade} onChange={(e) => {
                const v = Number(e.target.value); setRows(rows.map((x, idx) => idx === i ? { ...x, grade: v } : x));
              }} />
            </Field>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRows([...rows, { credits: 3, grade: 8 }])}>Add subject</Button>
          <Button variant="ghost" onClick={() => setRows(rows.slice(0, -1))} disabled={rows.length <= 1}>Remove</Button>
        </div>
      </div>
      <ResultBox label="Your CGPA" value={cgpa} />
    </div>
  );
}

function Attendance() {
  const [attended, setAttended] = useState(42);
  const [total, setTotal] = useState(50);
  const [target, setTarget] = useState(75);
  const pct = total ? (attended / total) * 100 : 0;
  const need = useMemo(() => {
    if (pct >= target) return 0;
    // x classes to attend in a row to reach target: (attended + x) / (total + x) >= target/100
    const t = target / 100;
    return Math.ceil((t * total - attended) / (1 - t));
  }, [attended, total, target, pct]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass space-y-3 rounded-2xl p-6">
        <Field label="Classes attended"><input type="number" className={inputCls} value={attended} onChange={(e) => setAttended(Number(e.target.value))} /></Field>
        <Field label="Total classes held"><input type="number" className={inputCls} value={total} onChange={(e) => setTotal(Number(e.target.value))} /></Field>
        <Field label="Target attendance %"><input type="number" className={inputCls} value={target} onChange={(e) => setTarget(Number(e.target.value))} /></Field>
      </div>
      <div className="space-y-4">
        <ResultBox label="Current attendance" value={`${pct.toFixed(1)}%`} />
        <div className="glass rounded-2xl p-6 text-center text-sm">
          {pct >= target ? (
            <p className="text-accent">You're already above target. You can skip a few — wisely 😉</p>
          ) : (
            <p>Attend <span className="font-bold text-gradient">{need}</span> more classes in a row to hit {target}%.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Percentage() {
  const [value, setValue] = useState(456);
  const [outOf, setOutOf] = useState(500);
  const pct = outOf ? (value / outOf) * 100 : 0;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass space-y-3 rounded-2xl p-6">
        <Field label="Marks scored"><input type="number" className={inputCls} value={value} onChange={(e) => setValue(Number(e.target.value))} /></Field>
        <Field label="Out of"><input type="number" className={inputCls} value={outOf} onChange={(e) => setOutOf(Number(e.target.value))} /></Field>
      </div>
      <ResultBox label="Percentage" value={`${pct.toFixed(2)}%`} />
    </div>
  );
}

function EMI() {
  const [P, setP] = useState(500000);
  const [R, setR] = useState(9.5);
  const [N, setN] = useState(36);
  const { emi, total, interest } = useMemo(() => {
    const r = R / 12 / 100;
    if (!r) return { emi: P / N, total: P, interest: 0 };
    const e = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
    return { emi: e, total: e * N, interest: e * N - P };
  }, [P, R, N]);
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass space-y-3 rounded-2xl p-6">
        <Field label="Loan amount"><input type="number" className={inputCls} value={P} onChange={(e) => setP(Number(e.target.value))} /></Field>
        <Field label="Annual interest rate (%)"><input type="number" step="0.1" className={inputCls} value={R} onChange={(e) => setR(Number(e.target.value))} /></Field>
        <Field label="Tenure (months)"><input type="number" className={inputCls} value={N} onChange={(e) => setN(Number(e.target.value))} /></Field>
      </div>
      <div className="space-y-3">
        <ResultBox label="Monthly EMI" value={fmt(emi)} />
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Total interest</p>
            <p className="font-display text-lg font-bold">{fmt(interest)}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Total payable</p>
            <p className="font-display text-lg font-bold">{fmt(total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Age() {
  const [dob, setDob] = useState("2003-06-15");
  const result = useMemo(() => {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let years = now.getFullYear() - d.getFullYear();
    let months = now.getMonth() - d.getMonth();
    let days = now.getDate() - d.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days };
  }, [dob]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass space-y-3 rounded-2xl p-6">
        <Field label="Your date of birth"><input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} /></Field>
      </div>
      {result && (
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">You are</p>
          <p className="mt-2 font-display text-3xl font-bold text-gradient">
            {result.years}y · {result.months}m · {result.days}d
          </p>
        </div>
      )}
    </div>
  );
}
