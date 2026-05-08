export function HeroOrbs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="glow-orb animate-float-slow"
        style={{ width: 480, height: 480, top: -120, left: -80, background: "oklch(0.55 0.25 280)" }}
      />
      <div
        className="glow-orb animate-float-slow"
        style={{ width: 420, height: 420, top: 120, right: -100, background: "oklch(0.55 0.22 240)", animationDelay: "-4s" }}
      />
      <div
        className="glow-orb animate-float-slow"
        style={{ width: 320, height: 320, bottom: -80, left: "30%", background: "oklch(0.6 0.2 210)", animationDelay: "-8s" }}
      />
    </div>
  );
}
