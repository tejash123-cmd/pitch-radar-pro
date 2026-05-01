interface BadgeProps {
  children: React.ReactNode;
  level?: "high" | "medium" | "low" | "neutral";
  size?: "sm" | "md";
}

// Function-based color mapping:
// high   -> positive (emerald)
// medium -> warning  (orange)
// low    -> risk     (red)
// neutral-> muted slate
const levelMap = {
  high:    "bg-[color-mix(in_oklab,var(--positive)_15%,transparent)] text-[var(--positive)] border-[color-mix(in_oklab,var(--positive)_35%,transparent)]",
  medium:  "bg-[color-mix(in_oklab,var(--warning)_15%,transparent)]  text-[var(--warning)]  border-[color-mix(in_oklab,var(--warning)_35%,transparent)]",
  low:     "bg-[color-mix(in_oklab,var(--risk)_15%,transparent)]     text-[var(--risk)]     border-[color-mix(in_oklab,var(--risk)_35%,transparent)]",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function LevelBadge({ children, level = "neutral", size = "sm" }: BadgeProps) {
  const sizeCls = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${levelMap[level]} ${sizeCls}`}>
      {children}
    </span>
  );
}
