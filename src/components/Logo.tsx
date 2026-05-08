import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8 rounded-lg bg-gradient-primary shadow-glow">
        <div className="absolute inset-[3px] rounded-md bg-background flex items-center justify-center">
          <span className="font-display text-sm font-bold text-gradient">N</span>
        </div>
      </div>
      <span className="font-display text-lg font-semibold tracking-tight">
        Nex<span className="text-gradient">oras</span>
      </span>
    </Link>
  );
}
