import { ReactNode } from "react";
import { Download, Info } from "lucide-react";

interface ScoreCardProps {
  label: string;
  value: string;
  suffix?: string;
  icon?: ReactNode;
  accent?: "emerald" | "violet" | "cyan" | "amber";
  progress?: number; // 0-100
  reasoning?: string;       // short inline summary
  reasoningFull?: string;   // long version shown in hover tooltip
  onDownloadReasoning?: () => void;
}

// Function-based palette
const accentMap = {
  emerald: { color: "var(--positive)",  glow: "0 0 40px -10px var(--positive)" },
  cyan:    { color: "var(--memory)",    glow: "0 0 40px -10px var(--memory)" },
  amber:   { color: "var(--novelty)",   glow: "0 0 40px -10px var(--novelty)" },
  violet:  { color: "var(--foresight)", glow: "0 0 40px -10px var(--foresight)" },
};

export function ScoreCard({
  label,
  value,
  suffix,
  icon,
  accent = "emerald",
  progress,
  reasoning,
  reasoningFull,
  onDownloadReasoning,
}: ScoreCardProps) {
  const a = accentMap[accent];
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = progress !== undefined ? circumference - (progress / 100) * circumference : 0;

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-visible group transition-all hover:scale-[1.02]">
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40 pointer-events-none"
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
          <svg width="68" height="68" className="-rotate-90 text-xs">
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

      {reasoning && (
        <div
          className="mt-4 pt-3 border-t relative"
          style={{ borderColor: "color-mix(in oklab, var(--border) 70%, transparent)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: a.color }}>
              <Info className="w-3 h-3" /> Reasoning
            </span>
            {onDownloadReasoning && (
              <button
                type="button"
                onClick={onDownloadReasoning}
                title="Download full reasoning (.txt)"
                aria-label="Download full reasoning"
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3 h-3" /> .txt
              </button>
            )}
          </div>
          <p className="text-xs leading-snug text-foreground/85 line-clamp-3">{reasoning}</p>

          {reasoningFull && (
            <div
              role="tooltip"
              className="pointer-events-none absolute left-0 right-0 top-full mt-2 z-30 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
            >
              <div
                className="rounded-xl border bg-popover text-popover-foreground shadow-xl p-3 text-xs leading-relaxed max-h-64 overflow-auto whitespace-pre-wrap"
                style={{ borderColor: "color-mix(in oklab, var(--border) 80%, transparent)" }}
              >
                <div className="text-[10px] uppercase tracking-wider mb-1 font-semibold" style={{ color: a.color }}>
                  Full reasoning
                </div>
                {reasoningFull}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
