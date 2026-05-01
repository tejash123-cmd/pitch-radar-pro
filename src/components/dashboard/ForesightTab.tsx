import { useState } from 'react';
import { Download, ArrowLeft, CheckCircle } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisData } from "@/lib/mockData";

export function ForesightTab({ data }: { data: AnalysisData }) {
  const [tab, setTab] = useState('scenarios');

  const rawPayload = data.foresightPayload || {};
  const rawBundle = (rawPayload.bundle || {}) as Record<string, unknown>;
  const rawLiterature = (rawPayload.literature || {}) as Record<string, unknown>;
  const rawParsed = (rawPayload.parsed || {}) as Record<string, unknown>;
  const trajectory = (rawLiterature.trajectory || {}) as Record<string, unknown>;
  const trajectoryStats = (trajectory.statistics || {}) as Record<string, unknown>;
  const trajectorySynth = (trajectory.synthesis || {}) as Record<string, unknown>;
  const papers = Array.isArray(rawLiterature.papers) ? (rawLiterature.papers as Array<Record<string, unknown>>) : [];

  const scenarios = Array.isArray(rawBundle.scenarios)
    ? (rawBundle.scenarios as Array<Record<string, unknown>>)
    : [
        {
          name: "Baseline Trend",
          summary: data.foresight.scenarios?.base || "Steady adoption of current technology trends.",
          probability_class: "plausible",
          drivers: ["Incremental improvements", "Market stability"],
          impacts: data.foresight.risks?.slice(0, 2) || ["Competition", "Economic downturn"],
        },
        {
          name: "High Ambition",
          summary: data.foresight.scenarios?.best || "Accelerated adoption with breakthrough innovations.",
          probability_class: "challenging",
          drivers: ["AI advancements", "Funding surge"],
          impacts: ["Regulatory changes", "Talent shortage"],
        },
      ];

  const synthesis = (rawBundle.synthesis || {}) as Record<string, unknown>;
  const startupFutureFit = (rawBundle.startup_future_fit || {}) as Record<string, unknown>;
  const startupOutcomes = Array.isArray(startupFutureFit.likely_outcome_per_scenario)
    ? (startupFutureFit.likely_outcome_per_scenario as Array<Record<string, unknown>>)
    : [];
  const coverage = (rawLiterature.coverage || {}) as Record<string, unknown>;

  const parsed = {
    focal_question: String(rawParsed.focal_question || data.memory.profile.problem || "What is the core problem?"),
    technology_scope: String(rawParsed.technology_scope || data.startup.industry || "Industry focus"),
    time_horizon_years: Number(rawParsed.time_horizon_years || 10),
    stakeholder_lens: String(rawParsed.stakeholder_lens || data.startup.geography || "Geographic focus"),
  };

  return (
    <div className="space-y-5">
      {/* Topbar */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> New
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{data.startup.name}</div>
          <div className="text-xs text-muted-foreground">{data.startup.industry}</div>
        </div>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Download className="w-4 h-4" /> PDF
        </button>
      </div>

      {/* Parsed row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border bg-foreground/[0.025]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Focal question</div>
          <div className="text-sm font-medium">{parsed.focal_question}</div>
        </div>
        <div className="p-3 rounded-xl border bg-foreground/[0.025]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Technology scope</div>
          <div className="text-sm font-medium">{parsed.technology_scope}</div>
        </div>
        <div className="p-3 rounded-xl border bg-foreground/[0.025]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Horizon (y)</div>
          <div className="text-sm font-medium">{parsed.time_horizon_years}</div>
        </div>
        <div className="p-3 rounded-xl border bg-foreground/[0.025]">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Stakeholders</div>
          <div className="text-sm font-medium">{parsed.stakeholder_lens}</div>
        </div>
      </div>

      {/* Coverage banner */}
      <div className="p-4 rounded-xl border bg-foreground/[0.025]">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-sm font-semibold">Coverage</div>
            <div className="text-xs text-muted-foreground">
              {String(coverage.data_quality_label || coverage.dataQuality || data.inputs.confidence.dataQuality || "Unknown")}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenarios">Industry scenarios</TabsTrigger>
          <TabsTrigger value="synthesis">Synthesis & gates</TabsTrigger>
          <TabsTrigger value="startup">Startup vs futures</TabsTrigger>
        </TabsList>
        <TabsContent value="scenarios">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Industry Scenarios</h3>
            <div className="space-y-4">
              {scenarios.map((s, i) => (
                <div key={i} className="p-4 rounded-xl border bg-foreground/[0.025]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-sm font-semibold">{s.name}</div>
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{s.probability}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{s.summary}</div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Drivers</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(s.drivers) ? s.drivers : []).map((d, j) => (
                          <span key={j} className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground/80">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Risks</div>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        {(Array.isArray(s.impacts) ? s.impacts : Array.isArray(s.risks) ? s.risks : []).map((r, j) => (
                          <li key={j}>• {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Opportunity</div>
                      <div className="text-xs text-foreground/80 mt-1">
                        {String(
                          s.opportunity ||
                            data.foresight.opportunity?.adjacentExpansion ||
                            "Potential strategic relevance",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(Object.keys(trajectoryStats).length > 0 || Object.keys(trajectorySynth).length > 0 || papers.length > 0) && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold">Technology trajectory cues</h4>
                {trajectorySynth.current_trajectory_hypothesis && (
                  <div className="text-xs text-muted-foreground rounded-lg border p-3 bg-foreground/[0.02]">
                    {String(trajectorySynth.current_trajectory_hypothesis)}
                  </div>
                )}
                {Array.isArray(trajectorySynth.drivers_of_transition) && (
                  <div className="flex flex-wrap gap-1">
                    {(trajectorySynth.drivers_of_transition as unknown[]).slice(0, 8).map((d, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground/80">{String(d)}</span>
                    ))}
                  </div>
                )}

                <h4 className="text-sm font-semibold pt-2">Corpus visuals</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg border p-2">Papers: {String(trajectoryStats.n_papers ?? papers.length)}</div>
                  <div className="rounded-lg border p-2">Recent share: {String(trajectoryStats.recent_8yr_share_of_dated ?? "n/a")}</div>
                  <div className="rounded-lg border p-2">Full-text frac: {String(trajectoryStats.full_text_fraction ?? "n/a")}</div>
                  <div className="rounded-lg border p-2">Source richness: {String(trajectoryStats.source_mix_richness_0_100 ?? "n/a")}</div>
                </div>

                <h4 className="text-sm font-semibold pt-2">Evidence base</h4>
                <div className="space-y-2">
                  {papers.slice(0, 6).map((p, i) => (
                    <div key={i} className="rounded-lg border p-3 bg-foreground/[0.02]">
                      <div className="text-xs font-medium">{String(p.title || `Paper ${i + 1}`)}</div>
                      <div className="text-xs text-muted-foreground">
                        {String(p.source || "source")} {p.year ? `· ${String(p.year)}` : ""}
                      </div>
                    </div>
                  ))}
                  {papers.length === 0 && (
                    <div className="text-xs text-muted-foreground">No evidence papers were returned for this run.</div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="synthesis">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Synthesis & Gates</h3>
            <div className="text-sm text-foreground/80">
              {String(
                synthesis.scenario_comparison ||
                  data.foresight.category?.future ||
                  "Synthesis of future scenarios indicates moderate risk with high opportunity in adjacent markets.",
              )}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="startup">
          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-4">Startup vs Futures</h3>
            <div className="space-y-4">
              {startupOutcomes.map((f, i) => (
                <div key={i} className="p-4 rounded-xl border bg-foreground/[0.025]">
                  <div className="text-sm font-semibold">{String(f.scenario_name_echo || f.scenario_id || `Scenario ${i + 1}`)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Fit: {String(f.resilience_rating || "mixed")}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Array.isArray(f.concrete_changes_to_pitch_or_product)
                      ? String((f.concrete_changes_to_pitch_or_product as unknown[])[0] || "")
                      : ""}
                  </div>
                </div>
              ))}
              {startupOutcomes.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  {String(startupFutureFit.executive_summary_for_partner || "Startup-fit details were not generated for this run.")}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}