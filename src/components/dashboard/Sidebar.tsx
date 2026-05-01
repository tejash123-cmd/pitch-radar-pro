import { Database, ShieldCheck } from "lucide-react";
import { Panel } from "./Panel";
import { LevelBadge } from "./Badge";
import type { AnalysisData } from "@/lib/mockData";

export function AnalysisSidebar({ data }: { data: AnalysisData["inputs"] }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-4 self-start">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-1">
        Analysis Inputs
      </div>

      <Panel title="Data Sources" icon={<Database className="w-4 h-4" />}>
        <div className="space-y-2">
          {data.sources.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{s.name}</span>
              <LevelBadge level="neutral">{s.status}</LevelBadge>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Confidence Level" icon={<ShieldCheck className="w-4 h-4" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Data quality</span>
            <LevelBadge level="medium">{data.confidence.dataQuality}</LevelBadge>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Missing</div>
            <div className="flex flex-wrap gap-1.5">
              {data.confidence.missing.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 rounded-md bg-rose/10 text-rose border border-rose/20">{m}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Next step</div>
            <p className="text-xs text-foreground/90">{data.confidence.nextStep}</p>
          </div>
        </div>
      </Panel>
    </aside>
  );
}
