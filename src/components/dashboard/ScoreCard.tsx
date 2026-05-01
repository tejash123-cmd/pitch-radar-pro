import { ReactNode } from "react";

interface ScoreCardProps {
  label: string;
  value: string;
  suffix?: string;
  icon?: ReactNode;
  accent?: "emerald" | "violet" | "cyan" | "amber";
  progress?: number; // 0-100
}

// Function-based palette:
//  emerald -> positive (Startup Fit)
//  cyan    -> memory   (VC Memory AI — electric blue)
//  amber   -> novelty  (gold)
//  violet  -> foresight(indigo/purple)
const accentMap = {
  emerald: { color: "var(--positive)",  glow: "0 0 40px -10px var(--positive)" },
  cyan:    { color: "var(--memory)",    glow: "0 0 40px -10px var(--memory)" },
  amber:   { color: "var(--novelty)",   glow: "0 0 40px -10px var(--novelty)" },
  violet:  { color: "var(--foresight)", glow: "0 0 40px -10px var(--foresight)" },
};

export function ScoreCard({ label, value, suffix, icon, accent = "emerald", progress }: ScoreCardProps) {
  const a = accentMap[accent];
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = progress !== undefined ? circumference - (progress / 100) * circumference : 0;

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group transition-all hover:scale-[1.02]">
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: a.color }}
      />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        {icon && <span style={{ color: a.color }}>{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-3xl font-bold text-foreground leading-none">{value}</div>
          {suffix && <div className="text-xs text-muted-foreground mt-1">{suffix}</div>}
        </div>
        {progress !== undefined && (
          <svg width="68" height="68" className="-rotate-90">
            <circle cx="34" cy="34" r={radius} stroke="var(--border)" strokeWidth="5" fill="none" />
            <circle
              cx="34"
              cy="34"
              r={radius}
              stroke={a.color}
              strokeWidth="5"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
