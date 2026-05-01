import {
  TrendingUp,
  Clock,
  Sparkles,
  GitBranch,
  AlertTriangle,
  FileText,
  Info,
  Activity,
  Target,
  ShieldAlert,
  Radar,
  FlaskConical,
  Gauge,
  Download,
  CheckCircle2,
  Eye,
  Search,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  Network,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AnalysisData } from "@/lib/mockData";
import { foresightExplanation, downloadText } from "@/lib/scoreExplanations";

/* ---------- helpers ---------- */

type FitLevel = "strong" | "medium" | "weak";
type Probability = "plausible" | "challenging" | "tail";
type Severity = "low" | "medium" | "high";
type Trend = "rising" | "flat" | "falling";

function ReasoningTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Reasoning"
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs bg-popover text-popover-foreground border border-border shadow-xl text-xs leading-relaxed p-3"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "positive" | "warning" | "risk" | "foresight" | "memory" | "novelty" | "muted";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    positive: "bg-[color-mix(in_oklab,var(--positive)_15%,transparent)] text-[var(--positive)] border-[color-mix(in_oklab,var(--positive)_35%,transparent)]",
    warning: "bg-[color-mix(in_oklab,var(--warning)_15%,transparent)] text-[var(--warning)] border-[color-mix(in_oklab,var(--warning)_35%,transparent)]",
    risk: "bg-[color-mix(in_oklab,var(--risk)_15%,transparent)] text-[var(--risk)] border-[color-mix(in_oklab,var(--risk)_35%,transparent)]",
    foresight: "bg-[color-mix(in_oklab,var(--foresight)_15%,transparent)] text-[var(--foresight)] border-[color-mix(in_oklab,var(--foresight)_35%,transparent)]",
    memory: "bg-[color-mix(in_oklab,var(--memory)_15%,transparent)] text-[var(--memory)] border-[color-mix(in_oklab,var(--memory)_35%,transparent)]",
    novelty: "bg-[color-mix(in_oklab,var(--novelty)_15%,transparent)] text-[var(--novelty)] border-[color-mix(in_oklab,var(--novelty)_35%,transparent)]",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[tone]}`}>
      {children}
    </span>
  );
}

function fitTone(level: FitLevel) {
  return level === "strong" ? "positive" : level === "medium" ? "warning" : "risk";
}
function probabilityTone(p: Probability) {
  return p === "plausible" ? "positive" : p === "challenging" ? "warning" : "foresight";
}
function severityTone(s: Severity) {
  return s === "low" ? "positive" : s === "medium" ? "warning" : "risk";
}
function trendIcon(t: Trend) {
  if (t === "rising") return <ArrowUpRight className="w-3.5 h-3.5" />;
  if (t === "falling") return <ArrowDownRight className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}
function trendTone(t: Trend) {
  return t === "rising" ? "positive" : t === "falling" ? "risk" : "muted";
}

function SectionHeader({
  icon,
  title,
  subtitle,
  accent = "foresight",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: "foresight" | "memory" | "novelty";
}) {
  const color = `var(--${accent})`;
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center border"
        style={{
          background: `color-mix(in oklab, ${color} 12%, transparent)`,
          borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-card rounded-2xl p-5 ${className}`}>{children}</div>;
}

function MiniBars({ values, tone = "foresight" }: { values: number[]; tone?: "foresight" | "positive" | "memory" }) {
  const max = Math.max(...values, 1);
  const color = `var(--${tone})`;
  return (
    <div className="flex items-end gap-1 h-10">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(v / max) * 100}%`,
            background: `linear-gradient(to top, ${color}, color-mix(in oklab, ${color} 50%, transparent))`,
            minHeight: "4px",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- derived data builders ---------- */

function buildSummary(data: AnalysisData["foresight"], score10: number) {
  const score100 = Math.round(score10 * 10);
  const confidence100 = Math.min(95, Math.max(40, score100 - 5));
  const timing = (() => {
    const t = data.timing.toLowerCase();
    if (t.includes("good") || t.includes("strong") || t.includes("right")) return "Right Time";
    if (t.includes("early")) return "Early";
    if (t.includes("late")) return "Late";
    return "Unclear";
  })();
  return {
    score: score100,
    confidence: confidence100,
    timing,
    opportunity: data.opportunity.adjacentExpansion || data.category.future,
    risk: data.risks[0] || "Execution risk to monitor",
  };
}

function buildSignals(data: AnalysisData["foresight"]) {
  const sources = data.trends.length;
  const trend: Trend = data.trends.some((t) => /accelerat|growing|emerging|strong/i.test(t.momentum))
    ? "rising"
    : data.trends.some((t) => /falling|declin/i.test(t.momentum))
      ? "falling"
      : "flat";
  const strength = Math.min(95, 55 + sources * 6);
  const keywords = data.trends.slice(0, 6).map((t) => t.name);
  const coverage = Math.min(95, 50 + sources * 8);
  const evidenceConf = Math.min(95, 45 + sources * 7);
  const series = Array.from({ length: 12 }, (_, i) =>
    Math.round(30 + Math.sin(i / 1.5) * 8 + (trend === "rising" ? i * 4 : trend === "falling" ? -i * 2 : 0)),
  ).map((v) => Math.max(8, v));
  return { sources, trend, strength, keywords, coverage, evidenceConf, series };
}

function buildScenarios(data: AnalysisData["foresight"]) {
  return [
    {
      key: "baseline",
      name: "Baseline Trend",
      probability: "plausible" as Probability,
      summary: data.scenarios.base,
      drivers: ["Steady demand", "Current incumbents", `Category: ${data.category.current}`],
      risks: ["Slower than expected adoption", "Margin pressure"],
      opportunity: data.opportunity.adjacentExpansion,
      confidence: 78,
      reasoning: "Built from current market trajectory and base-case operating assumptions in the diligence summary.",
      icon: Activity,
    },
    {
      key: "ambition",
      name: "High Ambition",
      probability: "plausible" as Probability,
      summary: data.scenarios.best,
      drivers: ["Accelerating adoption", "Strong distribution", "Defensible data moat"],
      risks: ["Execution speed", "Hiring constraints"],
      opportunity: data.opportunity.acquisitionTarget,
      confidence: 62,
      reasoning: "Assumes the upside narrative with favorable adoption curves and strategic interest from incumbents.",
      icon: TrendingUp,
    },
    {
      key: "constraint",
      name: "Constraint Shock",
      probability: "challenging" as Probability,
      summary: data.scenarios.worst,
      drivers: ["Regulatory tightening", "Capital cost spike", "Trust / privacy backlash"],
      risks: data.risks.slice(0, 3),
      opportunity: "Position as compliance-first vendor and gain share when peers stumble.",
      confidence: 55,
      reasoning: "Models a downside in which regulation, costs, infrastructure, or trust slow the category.",
      icon: ShieldAlert,
    },
    {
      key: "wildcard",
      name: "Wildcard Discontinuity",
      probability: "tail" as Probability,
      summary: "An unexpected shift — new platform shift, foundation-model leap, or M&A move — reshapes the value chain.",
      drivers: ["Foundation model leap", "New platform standard", "Unexpected incumbent M&A"],
      risks: ["Category redefinition leaves product behind", "Distribution suddenly captured by a hyperscaler"],
      opportunity: "Pivot value proposition toward the new system of record layer.",
      confidence: 38,
      reasoning: "Tail-risk scenario for low-probability but high-impact disruptions; useful for stress-testing thesis.",
      icon: Zap,
    },
  ];
}

function buildFitMatrix(data: AnalysisData["foresight"]) {
  return [
    {
      scenario: "Baseline Trend",
      fit: "strong" as FitLevel,
      stayTrue: "Steady customer urgency and predictable sales cycles.",
      breaks: "Demand softens or competitor parity erodes pricing.",
      adapt: "Sharpen ICP and double down on land-and-expand motion.",
      reasoning: "Product matches today's category dynamics; baseline favors current positioning.",
    },
    {
      scenario: "High Ambition",
      fit: "strong" as FitLevel,
      stayTrue: "Defensibility through proprietary data and workflow depth.",
      breaks: "A hyperscaler bundles a free equivalent.",
      adapt: "Invest in platform extensibility and partner ecosystem.",
      reasoning: "Upside requires the team to capture category leadership before incumbents react.",
    },
    {
      scenario: "Constraint Shock",
      fit: "medium" as FitLevel,
      stayTrue: "Compliance posture and regional data residency story.",
      breaks: "Long enterprise sales cycles starve runway.",
      adapt: "Lead with risk-and-compliance ROI; offer self-serve audit.",
      reasoning: "Resilient on regulation but exposed to elongated sales cycles.",
    },
    {
      scenario: "Wildcard Discontinuity",
      fit: "weak" as FitLevel,
      stayTrue: "Underlying domain expertise and customer relationships.",
      breaks: "Category redefined by a new platform standard.",
      adapt: "Re-architect as the workflow layer above the new platform.",
      reasoning: "Tail risk: a discontinuity could obsolete the current architecture.",
    },
  ];
}

function buildIndicators() {
  return [
    {
      name: "Pilot-to-paid conversion",
      metric: "Adoption",
      threshold: ">50% within 6 months",
      sources: "CRM, customer success notes",
      improves: "Validates urgency and willingness to pay.",
      worsens: "Signals weak ROI or buyer fatigue.",
    },
    {
      name: "Category funding velocity",
      metric: "Funding",
      threshold: ">$200M / quarter into peers",
      sources: "Crunchbase, PitchBook",
      improves: "Tailwind for valuation and talent.",
      worsens: "Capital flight raises down-round risk.",
    },
    {
      name: "Regulatory pipeline",
      metric: "Regulation",
      threshold: "New EU/US rule within 12 months",
      sources: "EU AI Act, sector regulators",
      improves: "Compliance-first vendors win share.",
      worsens: "Compliance cost surge could stall buyers.",
    },
    {
      name: "Reference architecture adoption",
      metric: "Technical",
      threshold: ">25% of buyers standardize on stack",
      sources: "Analyst reports, GitHub stars",
      improves: "Reduces integration friction at scale.",
      worsens: "Forces a costly re-platforming bet.",
    },
    {
      name: "Buyer urgency index",
      metric: "Customer demand",
      threshold: "NPS > 40 with budget owners",
      sources: "Win/loss interviews, surveys",
      improves: "Sales cycles compress, expansion accelerates.",
      worsens: "Deals stall in procurement; cycle elongates.",
    },
    {
      name: "Competitive density",
      metric: "Competition",
      threshold: ">3 net-new entrants per quarter",
      sources: "Crunchbase, ProductHunt, news",
      improves: "Validates market — but compresses margin.",
      worsens: "Risk of price war and CAC inflation.",
    },
  ];
}

function buildFalsification() {
  return [
    {
      test: "Customer urgency test",
      disprove: "<20% of pilots convert to paid within 9 months.",
      observe: "Quarterly CRM funnel review.",
      horizon: "9 months",
      severity: "high" as Severity,
    },
    {
      test: "Defensibility test",
      disprove: "An incumbent ships parity feature within 2 quarters.",
      observe: "Track competitor release notes and analyst briefings.",
      horizon: "6 months",
      severity: "high" as Severity,
    },
    {
      test: "Unit economics test",
      disprove: "Gross margin drops below 60% at scale.",
      observe: "Board financial pack and infra cost line.",
      horizon: "12 months",
      severity: "medium" as Severity,
    },
    {
      test: "Category timing test",
      disprove: "Analyst reports downgrade category to 'declining' before maturity.",
      observe: "Gartner / Forrester / IDC quadrants.",
      horizon: "12–18 months",
      severity: "medium" as Severity,
    },
    {
      test: "Regulatory test",
      disprove: "New regulation makes the core workflow uneconomical.",
      observe: "Regulator publications and trade-body briefings.",
      horizon: "18 months",
      severity: "low" as Severity,
    },
  ];
}

function buildGates(score10: number) {
  const decision: "invest" | "monitor" | "diligence" | "reject" =
    score10 >= 8 ? "invest" : score10 >= 6.5 ? "diligence" : score10 >= 5 ? "monitor" : "reject";
  return { decision };
}

/* ---------- main ---------- */

export function ForesightTab({ data, score }: { data: AnalysisData["foresight"]; score: number }) {
  const summary = buildSummary(data, score);
  const signals = buildSignals(data);
  const scenarios = buildScenarios(data);
  const fitMatrix = buildFitMatrix(data);
  const indicators = buildIndicators();
  const falsification = buildFalsification();
  const { decision } = buildGates(score);

  // Build a synthetic AnalysisData wrapper just for the explanation export
  const syntheticForExport = {
    startup: { name: "Startup", industry: "—", stage: "—", geography: "—" },
    scores: { fit: 0, novelty: 0, foresight: score, crmMatches: 0 },
    foresight: data,
  } as unknown as AnalysisData;

  const handleDownloadReasoning = () => {
    downloadText("foresight-reasoning.txt", foresightExplanation(syntheticForExport));
  };
  const handleDownloadReport = () => {
    const lines = [
      "FORESIGHT MARKET ANALYSIS — Full Report",
      "=".repeat(48),
      "",
      `Foresight Score: ${summary.score} / 100`,
      `Confidence: ${summary.confidence} / 100`,
      `Market Timing: ${summary.timing}`,
      `Main opportunity: ${summary.opportunity}`,
      `Main risk: ${summary.risk}`,
      "",
      "Technology Trajectory Signals",
      "-".repeat(32),
      `Sources: ${signals.sources}`,
      `Trend: ${signals.trend}`,
      `Signal strength: ${signals.strength}/100`,
      `Coverage: ${signals.coverage}/100`,
      `Evidence confidence: ${signals.evidenceConf}/100`,
      `Emerging keywords: ${signals.keywords.join(", ")}`,
      "",
      "Future Scenarios",
      "-".repeat(32),
      ...scenarios.flatMap((s) => [
        `• ${s.name} [${s.probability}] — confidence ${s.confidence}`,
        `  Summary: ${s.summary}`,
        `  Drivers: ${s.drivers.join("; ")}`,
        `  Risks: ${Array.isArray(s.risks) ? s.risks.join("; ") : s.risks}`,
        `  Opportunity: ${s.opportunity}`,
        "",
      ]),
      "Startup vs Scenarios",
      "-".repeat(32),
      ...fitMatrix.map((r) => `• ${r.scenario}: ${r.fit.toUpperCase()} — adapt: ${r.adapt}`),
      "",
      "Early Warning Indicators",
      "-".repeat(32),
      ...indicators.map((i) => `• ${i.name} (${i.metric}) — threshold ${i.threshold}`),
      "",
      "Falsification Tests",
      "-".repeat(32),
      ...falsification.map((f) => `• ${f.test} [${f.severity}] — ${f.disprove}`),
      "",
      "Decision Recommendation: " + decision.toUpperCase(),
    ];
    downloadText("foresight-full-report.txt", lines.join("\n"));
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-5">
        {/* ============ 1. Foresight Score Summary ============ */}
        <Card>
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Foresight Intelligence</div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Radar className="w-5 h-5 text-[var(--foresight)]" />
                Future-Readiness Summary
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                AI-generated outlook on market, technology, regulatory, and category dynamics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReasoning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-medium hover:bg-foreground/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Reasoning .txt
              </button>
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-background hover:opacity-90 transition-opacity"
                style={{ background: "var(--gradient-violet)" }}
              >
                <FileText className="w-3.5 h-3.5" /> Full Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Foresight score */}
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "color-mix(in oklab, var(--foresight) 10%, transparent)",
                borderColor: "color-mix(in oklab, var(--foresight) 35%, transparent)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Foresight Score</span>
                <ReasoningTip text="Composite of market timing, technology momentum, regulatory tailwind, funding signal, adoption potential, and exit potential — weighted by evidence confidence." />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[var(--foresight)]">{summary.score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full" style={{ width: `${summary.score}%`, background: "var(--gradient-violet)" }} />
              </div>
            </div>

            {/* Confidence */}
            <div className="rounded-xl p-4 border border-border bg-foreground/[0.025]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                <ReasoningTip text={`Based on ${signals.sources} reliable sources, evidence breadth, and cross-signal agreement. Lower if data is sparse or contradictory.`} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[var(--memory)]">{summary.confidence}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full bg-[var(--memory)]" style={{ width: `${summary.confidence}%` }} />
              </div>
            </div>

            {/* Market timing */}
            <div className="rounded-xl p-4 border border-border bg-foreground/[0.025]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Market Timing</span>
                <ReasoningTip text="Derived from research momentum, funding velocity, and category maturity signals. 'Right Time' = adoption curve inflecting." />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-[var(--positive)]" />
                <span className="text-base font-semibold text-foreground">{summary.timing}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{data.category.maturity}</p>
            </div>

            {/* Opportunity */}
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "color-mix(in oklab, var(--novelty) 10%, transparent)",
                borderColor: "color-mix(in oklab, var(--novelty) 35%, transparent)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Opportunity</span>
                <ReasoningTip text="Highest-conviction strategic upside based on adjacent expansion paths and category creation potential." />
              </div>
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-[var(--novelty)] mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-foreground leading-snug">{summary.opportunity}</span>
              </div>
            </div>

            {/* Risk */}
            <div
              className="rounded-xl p-4 border"
              style={{
                background: "color-mix(in oklab, var(--risk) 10%, transparent)",
                borderColor: "color-mix(in oklab, var(--risk) 35%, transparent)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Top Risk</span>
                <ReasoningTip text="Most material downside risk from the limitations and risk forecast — monitor via Early Warning Indicators below." />
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--risk)] mt-0.5 shrink-0" />
                <span className="text-xs font-medium text-foreground leading-snug">{summary.risk}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* ============ 2. Technology Trajectory Signals ============ */}
        <Card>
          <SectionHeader
            icon={<Activity className="w-4 h-4" />}
            title="Technology Trajectory Signals"
            subtitle="Evidence-backed momentum across publications, funding, and market activity."
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sources</div>
              <div className="text-2xl font-bold text-foreground">{signals.sources}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">reliable signals</div>
            </div>
            <div className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Activity Trend</div>
              <div className="flex items-center gap-1.5">
                <Pill tone={trendTone(signals.trend) as any}>
                  {trendIcon(signals.trend)}
                  <span className="capitalize">{signals.trend}</span>
                </Pill>
              </div>
              <div className="mt-2"><MiniBars values={signals.series} tone={signals.trend === "rising" ? "positive" : "foresight"} /></div>
            </div>
            <div className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Signal Strength</div>
              <div className="text-2xl font-bold text-[var(--foresight)]">{signals.strength}</div>
              <div className="mt-1.5 h-1 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full bg-[var(--foresight)]" style={{ width: `${signals.strength}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Coverage</div>
              <div className="text-2xl font-bold text-[var(--memory)]">{signals.coverage}</div>
              <div className="mt-1.5 h-1 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full bg-[var(--memory)]" style={{ width: `${signals.coverage}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-foreground/[0.025] p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Evidence Conf.</div>
              <div className="text-2xl font-bold text-[var(--positive)]">{signals.evidenceConf}</div>
              <div className="mt-1.5 h-1 rounded-full bg-foreground/10 overflow-hidden">
                <div className="h-full bg-[var(--positive)]" style={{ width: `${signals.evidenceConf}%` }} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-foreground/[0.025] p-3 col-span-2 md:col-span-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Emerging Keywords</div>
              <div className="flex flex-wrap gap-1">
                {signals.keywords.map((k) => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/80">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* ============ 3. Four Future Scenarios ============ */}
        <Card>
          <SectionHeader
            icon={<GitBranch className="w-4 h-4" />}
            title="Four Future Scenarios"
            subtitle="Stress-test the thesis across plausible, challenging, and tail futures."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenarios.map((s) => {
              const Icon = s.icon;
              const tone = probabilityTone(s.probability);
              return (
                <div
                  key={s.key}
                  className="rounded-xl p-4 border bg-foreground/[0.025] hover:bg-foreground/[0.05] transition-colors"
                  style={{ borderColor: `color-mix(in oklab, var(--${tone === "positive" ? "positive" : tone === "warning" ? "warning" : "foresight"}) 25%, var(--border))` }}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: `color-mix(in oklab, var(--${tone === "positive" ? "positive" : tone === "warning" ? "warning" : "foresight"}) 15%, transparent)`,
                          color: `var(--${tone === "positive" ? "positive" : tone === "warning" ? "warning" : "foresight"})`,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{s.name}</div>
                        <Pill tone={tone as any}>{s.probability}</Pill>
                      </div>
                    </div>
                    <ReasoningTip text={s.reasoning} />
                  </div>
                  <p className="text-xs text-foreground/85 leading-relaxed mb-3">{s.summary}</p>
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Key drivers</div>
                      <div className="flex flex-wrap gap-1">
                        {s.drivers.map((d) => (
                          <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/80">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Main risks</div>
                      <ul className="text-[11px] text-foreground/80 space-y-0.5">
                        {(Array.isArray(s.risks) ? s.risks : [s.risks]).slice(0, 3).map((r, i) => (
                          <li key={i} className="flex gap-1.5"><span className="text-[var(--risk)]">▸</span><span>{r}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Opportunity</div>
                      <p className="text-[11px] text-[var(--positive)]">{s.opportunity}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 rounded-full bg-foreground/10 overflow-hidden">
                        <div className="h-full" style={{ width: `${s.confidence}%`, background: `var(--${tone === "positive" ? "positive" : tone === "warning" ? "warning" : "foresight"})` }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{s.confidence}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ============ 4. Startup vs Scenarios Matrix ============ */}
        <Card>
          <SectionHeader
            icon={<Gauge className="w-4 h-4" />}
            title="Startup vs Future Scenarios"
            subtitle="How the company performs across each future."
          />
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs min-w-[760px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="font-medium px-2 py-2">Scenario</th>
                  <th className="font-medium px-2 py-2">Fit</th>
                  <th className="font-medium px-2 py-2">Must stay true</th>
                  <th className="font-medium px-2 py-2">Could break it</th>
                  <th className="font-medium px-2 py-2">Suggested adaptation</th>
                  <th className="font-medium px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {fitMatrix.map((r) => (
                  <tr key={r.scenario} className="border-t border-border align-top">
                    <td className="px-2 py-3 font-semibold text-foreground">{r.scenario}</td>
                    <td className="px-2 py-3"><Pill tone={fitTone(r.fit) as any}>{r.fit}</Pill></td>
                    <td className="px-2 py-3 text-foreground/80">{r.stayTrue}</td>
                    <td className="px-2 py-3 text-foreground/80">{r.breaks}</td>
                    <td className="px-2 py-3 text-foreground/80">{r.adapt}</td>
                    <td className="px-2 py-3"><ReasoningTip text={r.reasoning} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ============ 5. Early Warning Indicators ============ */}
        <Card>
          <SectionHeader
            icon={<Eye className="w-4 h-4" />}
            title="Early Warning Indicators"
            subtitle="Signals to monitor post-investment."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {indicators.map((ind) => (
              <div key={ind.name} className="rounded-xl border border-border bg-foreground/[0.025] p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="text-sm font-semibold text-foreground">{ind.name}</div>
                  <Pill tone="foresight">{ind.metric}</Pill>
                </div>
                <div className="text-[11px] text-muted-foreground mb-2">
                  <span className="font-medium text-foreground/80">Threshold: </span>{ind.threshold}
                </div>
                <div className="text-[11px] text-muted-foreground mb-2">
                  <span className="font-medium text-foreground/80">Watch: </span>{ind.sources}
                </div>
                <div className="space-y-1 pt-2 border-t border-border">
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <ArrowUpRight className="w-3 h-3 text-[var(--positive)] mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{ind.improves}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <ArrowDownRight className="w-3 h-3 text-[var(--risk)] mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{ind.worsens}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ============ 6. Industry Impact Map ============ */}
        <Card>
          <SectionHeader
            icon={<Network className="w-4 h-4" />}
            title="Industry Impact Map"
            subtitle="How adjacent sectors influence the startup's category."
          />
          <IndustryImpactMap center={data.category.current} />
        </Card>

        {/* ============ 7. Falsification Tests ============ */}
        <Card>
          <SectionHeader
            icon={<FlaskConical className="w-4 h-4" />}
            title="What Could Prove This Startup Wrong?"
            subtitle="Pre-mortem tests to falsify the thesis."
          />
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="font-medium px-2 py-2">Test</th>
                  <th className="font-medium px-2 py-2">What disproves it</th>
                  <th className="font-medium px-2 py-2">How to observe</th>
                  <th className="font-medium px-2 py-2">Horizon</th>
                  <th className="font-medium px-2 py-2">Severity</th>
                </tr>
              </thead>
              <tbody>
                {falsification.map((f) => (
                  <tr key={f.test} className="border-t border-border align-top">
                    <td className="px-2 py-3 font-semibold text-foreground">{f.test}</td>
                    <td className="px-2 py-3 text-foreground/80">{f.disprove}</td>
                    <td className="px-2 py-3 text-foreground/80">{f.observe}</td>
                    <td className="px-2 py-3 text-foreground/70">{f.horizon}</td>
                    <td className="px-2 py-3"><Pill tone={severityTone(f.severity) as any}>{f.severity}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ============ 8. Decision Gates ============ */}
        <Card>
          <SectionHeader
            icon={<CheckCircle2 className="w-4 h-4" />}
            title="Investment Decision Gates"
            subtitle="Recommendation based on score and evidence."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <DecisionGate
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Invest now"
              tone="positive"
              active={decision === "invest"}
              evidence="Strong customer urgency, defensible moat, and credible exit paths."
              why="High-conviction signals across the foresight model and confidence band."
              next="Fast-track term sheet; align on milestones for next round."
              reasoning="Triggered when foresight ≥ 80/100 with confidence support."
            />
            <DecisionGate
              icon={<Search className="w-4 h-4" />}
              label="Request diligence"
              tone="foresight"
              active={decision === "diligence"}
              evidence="Promising thesis but key signals need validation."
              why="Score is investable, but evidence is mixed in 1–2 critical areas."
              next="Customer references, technical deep-dive, and unit-economics review."
              reasoning="Triggered for mid-range scores where targeted diligence can resolve open questions."
            />
            <DecisionGate
              icon={<Eye className="w-4 h-4" />}
              label="Monitor"
              tone="warning"
              active={decision === "monitor"}
              evidence="Interesting but timing or proof points are not yet there."
              why="Worth tracking; thesis may strengthen with category development."
              next="Quarterly check-in and watchlist of Early Warning Indicators."
              reasoning="Triggered when category direction is right but the company is too early or unproven."
            />
            <DecisionGate
              icon={<XCircle className="w-4 h-4" />}
              label="Reject / pause"
              tone="risk"
              active={decision === "reject"}
              evidence="Material risks outweigh upside in current scenarios."
              why="Multiple foresight signals are weak or contradicted by evidence."
              next="Pass with feedback; revisit if a falsification test flips."
              reasoning="Triggered when foresight is low or risks dominate the scenario set."
            />
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}

/* ---------- subcomponents ---------- */

function DecisionGate({
  icon,
  label,
  tone,
  active,
  evidence,
  why,
  next,
  reasoning,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "positive" | "warning" | "risk" | "foresight";
  active: boolean;
  evidence: string;
  why: string;
  next: string;
  reasoning: string;
}) {
  const color = `var(--${tone === "positive" ? "positive" : tone === "warning" ? "warning" : tone === "risk" ? "risk" : "foresight"})`;
  return (
    <div
      className="rounded-xl p-4 border transition-all"
      style={{
        background: active ? `color-mix(in oklab, ${color} 12%, transparent)` : "var(--glass)",
        borderColor: active ? `color-mix(in oklab, ${color} 50%, transparent)` : "var(--border)",
        boxShadow: active ? `0 0 0 1px ${color}, 0 8px 30px -12px ${color}` : undefined,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{label}</div>
            {active && <Pill tone={tone as any}>Recommended</Pill>}
          </div>
        </div>
        <ReasoningTip text={reasoning} />
      </div>
      <div className="space-y-2 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence needed</div>
          <p className="text-foreground/85">{evidence}</p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Why it matters</div>
          <p className="text-foreground/85">{why}</p>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Next action</div>
          <p className="text-foreground/85">{next}</p>
        </div>
      </div>
    </div>
  );
}

function IndustryImpactMap({ center }: { center: string }) {
  const nodes = [
    { label: "Customers", relation: "Set demand and validate urgency.", angle: 0 },
    { label: "Suppliers", relation: "Influence cost structure and reliability.", angle: 45 },
    { label: "Regulation", relation: "Shapes compliance scope and timing.", angle: 90 },
    { label: "Adjacent markets", relation: "Source of expansion or new competition.", angle: 135 },
    { label: "Platform providers", relation: "Define distribution and lock-in risk.", angle: 180 },
    { label: "Competitors", relation: "Compress pricing and accelerate roadmaps.", angle: 225 },
    { label: "Macro trends", relation: "Drive long-cycle tailwinds and headwinds.", angle: 270 },
    { label: "Talent pool", relation: "Determines execution speed and depth.", angle: 315 },
  ];

  const radius = 38; // percentage of container
  return (
    <div className="relative w-full aspect-[16/9] rounded-xl border border-border bg-foreground/[0.02] overflow-hidden">
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {nodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * radius * 1.2;
          const y = 50 + Math.sin(rad) * radius * 0.7;
          return (
            <line
              key={n.label}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="var(--foresight)"
              strokeOpacity="0.35"
              strokeWidth="0.3"
              strokeDasharray="0.8 0.8"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Center node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div
          className="px-4 py-3 rounded-xl text-center font-bold text-sm text-background shadow-lg max-w-[180px]"
          style={{ background: "var(--gradient-violet)" }}
        >
          {center}
        </div>
      </div>

      {/* Surrounding nodes */}
      {nodes.map((n) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * radius * 1.2;
        const y = 50 + Math.sin(rad) * radius * 0.7;
        return (
          <Tooltip key={n.label}>
            <TooltipTrigger asChild>
              <button
                className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg glass border border-border text-[11px] font-medium text-foreground hover:bg-foreground/10 transition-colors whitespace-nowrap"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {n.label}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs bg-popover text-popover-foreground border border-border shadow-xl text-xs leading-relaxed p-3"
            >
              <div className="font-semibold mb-1">{n.label} → {center}</div>
              <div className="text-muted-foreground">{n.relation}</div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
