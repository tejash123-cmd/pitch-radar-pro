import { useState } from "react";
import { Sparkles, Swords, Map, Target, Users, DollarSign, Activity, Lightbulb } from "lucide-react";
import { Panel, KeyValue } from "./Panel";
import { LevelBadge } from "./Badge";
import type { AnalysisData } from "@/lib/mockData";

export function NoveltyTab({ data, score }: { data: AnalysisData["novelty"]; score: number }) {
  const [topN, setTopN] = useState<5 | 10 | 15>(5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Novelty Score" subtitle={`${score.toFixed(1)} / 10`} icon={<Sparkles className="w-4 h-4" />}>
        <div className="space-y-2">
          {data.breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{b.label}</span>
              <LevelBadge level={b.level as any}>{b.value}</LevelBadge>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Market Saturation" icon={<Activity className="w-4 h-4" />}>
        <div className="flex items-center justify-center py-6">
          <LevelBadge level="medium" size="md">{data.saturation}</LevelBadge>
        </div>
      </Panel>

      <Panel
        title="Closest Competitors"
        icon={<Swords className="w-4 h-4" />}
        className="lg:col-span-2"
        action={
          <div className="flex items-center gap-1 p-1 rounded-lg bg-foreground/5 border border-border">
            {[5, 10, 15].map((n) => (
              <button
                key={n}
                onClick={() => setTopN(n as 5 | 10 | 15)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  topN === n ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Top {n}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.competitors.slice(0, topN).map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-sm">{c.name}</span>
                <LevelBadge level={c.similarity > 70 ? "high" : c.similarity > 50 ? "medium" : "low"}>
                  {c.similarity}%
                </LevelBadge>
              </div>
              <div className="text-[11px] text-muted-foreground mb-2">{c.category} · {c.website}</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div><span className="text-[var(--positive)]">+ </span>{c.strength}</div>
                <div><span className="text-[var(--risk)]">− </span>{c.weakness}</div>
                <div className="text-foreground/70 italic mt-1">vs us: {c.difference}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Competitor Map" icon={<Map className="w-4 h-4" />} className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.competitorMap).map(([cat, items]) => (
            <div key={cat} className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">{cat}</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                  <span key={it} className="text-xs px-2 py-1 rounded-md bg-foreground/5 border border-border">{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Market Gap Analysis" icon={<Target className="w-4 h-4" />}>
        <ul className="space-y-2">
          {data.gaps.map((g, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/90">
              <span className="text-primary shrink-0">▸</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Customer Segment Analysis" icon={<Users className="w-4 h-4" />}>
        <div className="space-y-1">
          <KeyValue k="Primary customer" v={data.segments.primaryCustomer} />
          <KeyValue k="Secondary customer" v={data.segments.secondaryCustomer} />
          <KeyValue k="Buyer persona" v={data.segments.buyerPersona} />
          <KeyValue k="User persona" v={data.segments.userPersona} />
          <KeyValue k="Industry vertical" v={data.segments.industryVertical} />
          <KeyValue k="Budget owner" v={data.segments.budgetOwner} />
        </div>
      </Panel>

      <Panel title="Financial Feasibility" icon={<DollarSign className="w-4 h-4" />} className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <KeyValue k="Revenue model" v={data.financial.revenueModel} />
          <KeyValue k="Pricing benchmark" v={data.financial.pricingBenchmark} />
          <KeyValue k="Willingness to pay" v={data.financial.willingnessToPay} />
          <KeyValue k="Sales cycle" v={data.financial.salesCycle} />
          <KeyValue k="CAC risk" v={data.financial.cacRisk} />
          <KeyValue k="Gross margin" v={data.financial.grossMargin} />
        </div>
      </Panel>
    </div>
  );
}
