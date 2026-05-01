interface BadgeProps {
  children: React.ReactNode;
  level?: "high" | "medium" | "low" | "neutral";
  size?: "sm" | "md";
}

const levelMap = {
  high: "bg-[oklch(0.74_0.17_158/0.15)] text-[oklch(0.85_0.17_158)] border-[oklch(0.74_0.17_158/0.3)]",
  medium: "bg-[oklch(0.80_0.16_75/0.15)] text-[oklch(0.88_0.16_75)] border-[oklch(0.80_0.16_75/0.3)]",
  low: "bg-[oklch(0.70_0.20_15/0.15)] text-[oklch(0.82_0.20_15)] border-[oklch(0.70_0.20_15/0.3)]",
  neutral: "bg-white/5 text-muted-foreground border-white/10",
};

export function LevelBadge({ children, level = "neutral", size = "sm" }: BadgeProps) {
  const sizeCls = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${levelMap[level]} ${sizeCls}`}>
      {children}
    </span>
  );
}
