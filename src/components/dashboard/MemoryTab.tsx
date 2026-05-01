import { Building2, Users, Network, FileSearch } from "lucide-react";
import { Panel, KeyValue } from "./Panel";
import { LevelBadge } from "./Badge";
import type { AnalysisData } from "@/lib/mockData";

export function MemoryTab({ data }: { data: AnalysisData["memory"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Structured Startup Profile" icon={<Building2 className="w-4 h-4" />} className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <KeyValue k="Startup" v={data.profile.startupName} />
          <KeyValue k="Founder" v={data.profile.founderName} />
          <KeyValue k="Industry" v={data.profile.industry} />
          <KeyValue k="Technology" v={data.profile.technology} />
          <KeyValue k="Problem" v={data.profile.problem} />
          <KeyValue k="Solution" v={data.profile.solution} />
          <KeyValue k="Business model" v={data.profile.businessModel} />
          <KeyValue k="Funding stage" v={data.profile.fundingStage} />
          <KeyValue k="Target customer" v={data.profile.targetCustomer} />
          <KeyValue k="Geography" v={data.profile.geography} />
        </div>
      </Panel>

      <Panel title="Similar Startups Seen Before" subtitle="From VC memory" icon={<Users className="w-4 h-4" />} className="lg:col-span-2">
        <div className="space-y-2">
          {data.similar.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-foreground/[0.025] p-3 hover:bg-foreground/[0.05] transition-colors">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate">{s.name}</span>
                  <LevelBadge level={s.similarity > 75 ? "high" : s.similarity > 60 ? "medium" : "low"}>
                    {s.similarity}% match
                  </LevelBadge>
                </div>
                <LevelBadge level="neutral">{s.decision}</LevelBadge>
              </div>
              <p className="text-xs text-muted-foreground">{s.reason}</p>
              <p className="text-xs text-foreground/70 mt-1 italic">"{s.note}"</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Relationship Intelligence" icon={<Network className="w-4 h-4" />}>
        <div className="flex flex-wrap items-center gap-2">
          {data.relationship.map((node, i) => (
            <div key={node} className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg glass text-xs font-medium text-foreground">{node}</div>
              {i < data.relationship.length - 1 && (
                <span className="text-primary text-lg leading-none">→</span>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="CRM Match" icon={<FileSearch className="w-4 h-4" />}>
        <div className="space-y-1">
          <KeyValue k="Status" v={data.crm.found ? "Record found" : "Not found"} />
          <KeyValue k="Last interaction" v={data.crm.lastInteraction} />
          <KeyValue k="Owner" v={data.crm.owner} />
          <KeyValue k="Deal stage" v={data.crm.stage} />
          <KeyValue k="Next action" v={data.crm.nextAction} />
        </div>
      </Panel>

    </div>
  );
}
