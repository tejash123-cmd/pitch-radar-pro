import { TrendingUp, Zap, Clock, Sparkles, GitBranch, Trophy, AlertTriangle, FileText } from "lucide-react";
import { Panel, KeyValue } from "./Panel";
import { LevelBadge } from "./Badge";
import type { AnalysisData } from "@/lib/mockData";

export function ForesightTab({ data }: { data: AnalysisData["foresight"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Foresight Score" subtitle="8.2 / 10" icon={<TrendingUp className="w-4 h-4" />}>
        <div className="space-y-2">
          {data.breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{b.label}</span>
              <LevelBadge level={b.level as any}>{b.value}</LevelBadge>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Market Timing" icon={<Clock className="w-4 h-4" />}>
        <div className="flex items-center justify-center py-6">
          <LevelBadge level="high" size="md">{data.timing}</LevelBadge>
        </div>
      </Panel>

      <Panel title="Trend Signals" icon={<Zap className="w-4 h-4" />} className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {data.trends.map((t) => (
            <div key={t.name} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm">{t.name}</span>
                <LevelBadge level="high">{t.momentum}</LevelBadge>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{t.why}</p>
              <p className="text-xs text-foreground/80 italic">Relevance: {t.relevance}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Future Category Creation" icon={<Sparkles className="w-4 h-4" />} className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <KeyValue k="Current category" v={data.category.current} />
          <KeyValue k="Future category" v={data.category.future} />
          <KeyValue k="Maturity" v={data.category.maturity} />
          <KeyValue k="Creation potential" v={data.category.potential} />
        </div>
      </Panel>

      <Panel title="Scenario Analysis" icon={<GitBranch className="w-4 h-4" />} className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-3 border bg-[color-mix(in_oklab,var(--positive)_8%,transparent)] border-[color-mix(in_oklab,var(--positive)_30%,transparent)]">
            <div className="text-xs font-bold text-[var(--positive)] uppercase tracking-wider mb-1.5">Best case</div>
            <p className="text-xs text-foreground/90">{data.scenarios.best}</p>
          </div>
          <div className="rounded-xl p-3 border bg-[color-mix(in_oklab,var(--memory)_8%,transparent)] border-[color-mix(in_oklab,var(--memory)_30%,transparent)]">
            <div className="text-xs font-bold text-[var(--memory)] uppercase tracking-wider mb-1.5">Base case</div>
            <p className="text-xs text-foreground/90">{data.scenarios.base}</p>
          </div>
          <div className="rounded-xl p-3 border bg-[color-mix(in_oklab,var(--risk)_8%,transparent)] border-[color-mix(in_oklab,var(--risk)_30%,transparent)]">
            <div className="text-xs font-bold text-[var(--risk)] uppercase tracking-wider mb-1.5">Worst case</div>
            <p className="text-xs text-foreground/90">{data.scenarios.worst}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Strategic Opportunity" icon={<Trophy className="w-4 h-4" />}>
        <div className="space-y-1">
          <KeyValue k="Acquisition target" v={data.opportunity.acquisitionTarget} />
          <KeyValue k="Adjacent expansion" v={data.opportunity.adjacentExpansion} />
          <KeyValue k="Defensibility" v={data.opportunity.defensibility} />
          <KeyValue k="System of record" v={data.opportunity.systemOfRecord} />
        </div>
      </Panel>

      <Panel title="Risk Forecast" icon={<AlertTriangle className="w-4 h-4" />}>
        <ul className="space-y-2">
          {data.risks.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90">
              <span className="text-rose shrink-0">▸</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Investment Thesis" icon={<FileText className="w-4 h-4" />} className="lg:col-span-2">
        <p className="text-sm text-foreground/90 leading-relaxed italic">{data.thesis}</p>
      </Panel>
    </div>
  );
}
