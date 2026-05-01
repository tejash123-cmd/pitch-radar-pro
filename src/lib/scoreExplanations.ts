import type { AnalysisData } from "./mockData";

function header(title: string, data: AnalysisData) {
  return [
    `${title}`,
    "=".repeat(title.length),
    "",
    `Startup: ${data.startup.name}`,
    `Industry: ${data.startup.industry}`,
    `Stage: ${data.startup.stage}`,
    `Geography: ${data.startup.geography}`,
    `Generated: ${new Date().toISOString()}`,
    "",
  ].join("\n");
}

export function fitExplanation(data: AnalysisData): string {
  const score = data.scores.fit;
  const lines = [
    header("Startup Fit Score — Reasoning & Explainability", data),
    `Score: ${score} / 10`,
    "",
    "Why this score:",
    `- Profile clarity: founder ${data.memory.profile.founderName}, problem and solution well-defined.`,
    `- Business model: ${data.memory.profile.businessModel}.`,
    `- Target customer: ${data.memory.profile.targetCustomer}.`,
    `- CRM signal: ${data.memory.crm.found ? `existing record (stage: ${data.memory.crm.stage}, owner: ${data.memory.crm.owner}).` : "no prior CRM record."}`,
    `- ${data.scores.crmMatches} similar startups found in VC memory, providing pattern-match confidence.`,
    "",
    "Supporting factors:",
    ...data.memory.similar.slice(0, 3).map((s) => `- ${s.name} (${s.similarity}% match) — ${s.reason}. Past decision: ${s.decision}.`),
    "",
    "Caveats / missing data:",
    ...data.inputs.confidence.missing.map((m) => `- ${m}`),
    "",
    `Data quality: ${data.inputs.confidence.dataQuality}.`,
    `Recommended next step: ${data.inputs.confidence.nextStep}`,
  ];
  return lines.join("\n");
}

export function noveltyExplanation(data: AnalysisData): string {
  const score = data.scores.novelty;
  const lines = [
    header("Novelty Score — Reasoning & Explainability", data),
    `Score: ${score} / 10`,
    "",
    "Breakdown:",
    ...data.novelty.breakdown.map((b) => `- ${b.label}: ${b.value} (${b.level})`),
    "",
    `Market saturation: ${data.novelty.saturation}`,
    "",
    "Key differentiators vs. competitors:",
    ...data.novelty.competitors.slice(0, 5).map((c) => `- vs ${c.name} (${c.category}, ${c.similarity}% similar): ${c.difference}. Their weakness: ${c.weakness}.`),
    "",
    "Identified market gaps:",
    ...data.novelty.gaps.map((g) => `- ${g}`),
    "",
    "Insight:",
    data.novelty.insight,
  ];
  return lines.join("\n");
}

export function foresightExplanation(data: AnalysisData): string {
  const score = data.scores.foresight;
  const lines = [
    header("Foresight Score — Reasoning & Explainability", data),
    `Score: ${score} / 10`,
    "",
    "Breakdown:",
    ...data.foresight.breakdown.map((b) => `- ${b.label}: ${b.value} (${b.level})`),
    "",
    `Timing assessment: ${data.foresight.timing}`,
    `Current category: ${data.foresight.category.current}`,
    `Future category: ${data.foresight.category.future}`,
    `Maturity: ${data.foresight.category.maturity}`,
    `Potential: ${data.foresight.category.potential}`,
    "",
    "Relevant trends:",
    ...data.foresight.trends.map((t) => `- ${t.name} (${t.momentum}): ${t.why} — ${t.relevance}.`),
    "",
    "Scenarios:",
    `- Best case: ${data.foresight.scenarios.best}`,
    `- Base case: ${data.foresight.scenarios.base}`,
    `- Worst case: ${data.foresight.scenarios.worst}`,
    "",
    "Risks:",
    ...data.foresight.risks.map((r) => `- ${r}`),
    "",
    "Thesis:",
    data.foresight.thesis,
  ];
  return lines.join("\n");
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
