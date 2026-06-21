import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Menu, X, Search, LogOut, User as UserIcon, ChevronDown,
  GraduationCap, FileText, Brain, Calculator, Briefcase, Target,
  Rocket, BookOpen, Trophy, Sparkles, Map, Cpu, MessageSquare,
  ListChecks, LayoutDashboard, Presentation,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DropdownItem = {
  to: string;
  label: string;
  desc?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

type NavEntry =
  | { kind: "link"; to: string; label: string }
  | { kind: "menu"; label: string; items: DropdownItem[] };

const NAV: NavEntry[] = [
  { kind: "link", to: "/", label: "Home" },
  {
    kind: "menu",
    label: "Features",
    items: [
      { to: "/tools", label: "All Features", desc: "Every tool Nexoras offers", icon: Sparkles },
      { to: "/dashboard", label: "Dashboard", desc: "Your personal study OS", icon: LayoutDashboard },
      { to: "/chat", label: "AI Chat", desc: "Ask anything, instantly", icon: MessageSquare },
      { to: "/courses", label: "Courses", desc: "Curated learning tracks", icon: BookOpen },
      { to: "/achievements", label: "Achievements", desc: "Streaks, XP and badges", icon: Trophy },
    ],
  },
  {
    kind: "menu",
    label: "Exams",
    items: [
      { to: "/crack-jee", label: "Crack JEE", desc: "Full JEE prep program", icon: Rocket },
      { to: "/mock-tests", label: "JEE Main", desc: "Full-length mock tests", icon: ListChecks },
      { to: "/mock-tests", label: "JEE Advanced", desc: "Adv. pattern simulation", icon: ListChecks },
      { to: "/competitive-exams", label: "EAMCET", desc: "AP/TS state engineering", icon: GraduationCap },
      { to: "/competitive-exams", label: "MHT CET", desc: "Maharashtra CET prep", icon: GraduationCap },
      { to: "/competitive-exams", label: "BITSAT", desc: "BITS entrance prep", icon: GraduationCap },
      { to: "/mock-tests", label: "Mock Tests", desc: "Timed full simulations", icon: ListChecks },
      { to: "/practice", label: "Practice Questions", desc: "Topic-wise practice", icon: Target },
      { to: "/practice", label: "PYQs", desc: "Previous year questions", icon: BookOpen },
    ],
  },
  {
    kind: "menu",
    label: "Tools",
    items: [
      { to: "/resume", label: "Resume Builder", desc: "AI + ATS-optimized resumes", icon: FileText },
      { to: "/tools", label: "AI Study Planner", desc: "Adaptive weekly schedules", icon: Brain },
      { to: "/dashboard", label: "Productivity Dashboard", desc: "All your stats in one view", icon: LayoutDashboard },
      { to: "/calculators", label: "Smart Calculators", desc: "CGPA, attendance & more", icon: Calculator },
      { to: "/mock-interview", label: "AI Mock Interviews", desc: "Practice technical rounds", icon: Cpu },
      { to: "/mock-interview", label: "HR Interview Practice", desc: "Behavioral question coach", icon: Briefcase },
    ],
  },
  {
    kind: "menu",
    label: "Careers",
    items: [
      { to: "/roadmaps", label: "Career Roadmaps", desc: "Step-by-step career paths", icon: Map },
      { to: "/future-careers", label: "Future AI Careers", desc: "Tomorrow's top roles", icon: Sparkles },
      { to: "/engineering-roadmaps", label: "Engineering Branches", desc: "Pick the right branch", icon: GraduationCap },
      { to: "/career", label: "Skill Development", desc: "Build job-ready skills", icon: Target },
      { to: "/career", label: "Career Guidance", desc: "1:1 style direction", icon: Briefcase },
    ],
  },
  { kind: "link", to: "/blog", label: "Blog" },
  { kind: "link", to: "/about", label: "About" },
  { kind: "link", to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [openMobile, setOpenMobile] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo />
            <nav ref={menuRef} className="hidden items-center gap-0.5 lg:flex">
              {NAV.map((entry) => {
                if (entry.kind === "link") {
                  return (
                    <Link
                      key={entry.to + entry.label}
                      to={entry.to}
                      onClick={() => setActiveMenu(null)}
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                      activeProps={{ className: "rounded-md px-3 py-1.5 text-sm text-foreground bg-secondary/60" }}
                    >
                      {entry.label}
                    </Link>
                  );
                }
                const isOpen = activeMenu === entry.label;
                return (
                  <div
                    key={entry.label}
                    className="relative"
                    onMouseEnter={() => setActiveMenu(entry.label)}
                    onMouseLeave={() => setActiveMenu(null)}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMenu(isOpen ? null : entry.label)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
                        isOpen && "bg-secondary/60 text-foreground",
                      )}
                      aria-expanded={isOpen}
                    >
                      {entry.label}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="absolute left-1/2 top-full z-50 w-[480px] -translate-x-1/2 pt-2">
                        <div className="glass-strong rounded-xl border border-border/60 p-2 shadow-elegant">
                          <div className="grid grid-cols-2 gap-1">
                            {entry.items.map((item) => (
                              <Link
                                key={item.label}
                                to={item.to}
                                onClick={() => setActiveMenu(null)}
                                className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-secondary/70"
                              >
                                {item.icon && (
                                  <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground shadow-glow">
                                    <item.icon className="h-4 w-4" />
                                  </span>
                                )}
                                <span className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground group-hover:text-accent">
                                    {item.label}
                                  </span>
                                  {item.desc && (
                                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                                  )}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground w-48">
              <Search className="h-4 w-4" />
              <input
                placeholder="Search Nexoras…"
                className="w-full bg-transparent placeholder:text-muted-foreground/70 focus:outline-none"
              />
            </div>
            <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3 w-3" /> 100% Free
            </span>
            {user ? (
              <>
                <Link to="/profile" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm"><UserIcon className="h-4 w-4" /> {user.email?.split("@")[0]}</Button>
                </Link>
                <Button onClick={handleSignOut} size="sm" variant="outline">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <button
              className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-secondary/60"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border px-4 py-3">
            <nav className="grid gap-1">
              {NAV.map((entry) => {
                if (entry.kind === "link") {
                  return (
                    <Link
                      key={entry.to + entry.label}
                      to={entry.to}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    >
                      {entry.label}
                    </Link>
                  );
                }
                const isOpen = openMobile === entry.label;
                return (
                  <div key={entry.label}>
                    <button
                      type="button"
                      onClick={() => setOpenMobile(isOpen ? null : entry.label)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    >
                      <span>{entry.label}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="ml-3 mt-1 grid gap-0.5 border-l border-border pl-3">
                        {entry.items.map((item) => (
                          <Link
                            key={item.label}
                            to={item.to}
                            onClick={() => { setOpen(false); setOpenMobile(null); }}
                            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
