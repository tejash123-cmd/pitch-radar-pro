import { ReactNode } from "react";

interface PanelProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, icon, action, children, className = "" }: PanelProps) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-foreground/5 border border-border text-primary">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function KeyValue({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{k}</span>
      <span className="text-xs text-foreground text-right font-medium max-w-[60%]">{v}</span>
    </div>
  );
}
