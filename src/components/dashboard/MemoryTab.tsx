import { Building2, Users, Network, FileSearch, Globe2, CheckCircle2 } from "lucide-react";
import { Panel, KeyValue } from "./Panel";
import { LevelBadge } from "./Badge";
import type { AnalysisData } from "@/lib/mockData";

type ProcessedStatus = "green" | "orange" | "red";

function computeStatus(data: AnalysisData["memory"], dataQuality = "medium"): { status: ProcessedStatus; label: string; description: string } {
  const found = data.crm.found;
  const dq = dataQuality.toLowerCase();
  if (found && dq === "high") return { status: "green", label: "Processed", description: "Startup is in CRM with high data quality." };
  if (found || dq === "medium") return { status: "orange", label: "Partially processed", description: "Record exists or data quality is medium — review recommended." };
  return { status: "red", label: "Not processed", description: "No CRM record and insufficient data." };
}

const statusStyles: Record<ProcessedStatus, { dot: string; text: string; ring: string }> = {
  green:  { dot: "bg-[var(--positive)]", text: "text-[var(--positive)]", ring: "ring-[color-mix(in_oklab,var(--positive)_35%,transparent)]" },
  orange: { dot: "bg-[var(--warning)]",  text: "text-[var(--warning)]",  ring: "ring-[color-mix(in_oklab,var(--warning)_35%,transparent)]" },
  red:    { dot: "bg-[var(--risk)]",     text: "text-[var(--risk)]",     ring: "ring-[color-mix(in_oklab,var(--risk)_35%,transparent)]" },
};

export function MemoryTab({ data, dataQuality }: { data: AnalysisData["memory"]; dataQuality?: string }) {
  const status = computeStatus(data, dataQuality);
  const s = statusStyles[status.status];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Processing status */}
      <Panel title="Processing Status" icon={<CheckCircle2 className="w-4 h-4" />} className="lg:col-span-2">
        <div className={`flex items-center gap-3 rounded-xl border p-3 ring-1 ${s.ring} bg-foreground/[0.025]`}>
          <div className="relative flex items-center justify-center">
            <span className={`absolute inline-flex h-3 w-3 rounded-full opacity-60 animate-ping ${s.dot}`} />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${s.dot}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold ${s.text}`}>{status.label}</div>
            <div className="text-xs text-muted-foreground">{status.description}</div>
          </div>
          <div className="flex items-center gap-1.5">
            {(["green", "orange", "red"] as ProcessedStatus[]).map((k) => (
              <span
                key={k}
                title={k}
                className={`w-2.5 h-2.5 rounded-full ${statusStyles[k].dot} ${status.status === k ? "opacity-100 ring-2 ring-offset-2 ring-offset-background " + statusStyles[k].ring : "opacity-25"}`}
              />
            ))}
          </div>
        </div>
      </Panel>

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

      {/* Side-by-side comparison columns */}
      <Panel title="Startups in the real world" subtitle="From VC memory" icon={<Users className="w-4 h-4" />}>
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

      <Panel title="Open-Source Reliable Data" subtitle="Top 5 from public sources" icon={<Globe2 className="w-4 h-4" />}>
        <div className="space-y-2">
          {data.openSource.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-foreground/[0.025] p-3 hover:bg-foreground/[0.05] transition-colors">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-sm text-foreground truncate">{s.name}</span>
                  <LevelBadge level={s.similarity > 70 ? "high" : s.similarity > 55 ? "medium" : "low"}>
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
          {dataQuality ? <KeyValue k="Data quality" v={dataQuality} /> : null}
        </div>
      </Panel>
    </div>
  );
}
