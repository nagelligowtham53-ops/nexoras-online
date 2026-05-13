import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search, LogOut, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const primaryLinks = [
  { to: "/", label: "Home" },
  { to: "/tools", label: "Features" },
  { to: "/calculators", label: "Tools" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const secondaryLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/chat", label: "AI Chat" },
  { to: "/mock-interview", label: "Mock Interview" },
  { to: "/crack-jee", label: "Crack JEE" },
  { to: "/mock-tests", label: "Mock Tests" },
  { to: "/practice", label: "Practice" },
  { to: "/achievements", label: "Achievements" },
  { to: "/roadmaps", label: "Roadmaps" },
  { to: "/future-careers", label: "Future Careers" },
  { to: "/engineering-roadmaps", label: "Engineering" },
  { to: "/competitive-exams", label: "Exams" },
  { to: "/courses", label: "Courses" },
  { to: "/resume", label: "Resume" },
  { to: "/career", label: "Career Hub" },
  { to: "/pricing", label: "Pricing" },
] as const;

const allLinks = [...primaryLinks, ...secondaryLinks];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-0.5 lg:flex">
              {primaryLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground xl:text-sm xl:px-3"
                  activeProps={{ className: "rounded-md px-2.5 py-1.5 text-xs xl:text-sm xl:px-3 text-foreground bg-secondary/60" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground w-56">
              <Search className="h-4 w-4" />
              <input
                placeholder="Search Nexoras…"
                className="w-full bg-transparent placeholder:text-muted-foreground/70 focus:outline-none"
              />
            </div>
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
              {allLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
