import { mockAnalysis, type AnalysisData } from "@/lib/mockData";
import type { StartupAnalysisResponse } from "@/lib/api";

type AnalysisInputs = {
  name: string;
  industry: string;
  stage: string;
  geography: string;
  notes: string;
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function levelFromScore(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function labelFromScore(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 45) return "Medium";
  return "Weak";
}

function cloneMockAnalysis(): AnalysisData {
  return JSON.parse(JSON.stringify(mockAnalysis)) as AnalysisData;
}

export function adaptAnalysisResponse(
  response: StartupAnalysisResponse,
  inputs: AnalysisInputs,
): AnalysisData {
  const data = cloneMockAnalysis();
  const market10 = round1(response.market_score_10);
  const novelty10 = round1(response.novelty_score_10);
  const research10 = round1(response.research_momentum_score_10);
  const patent10 = round1(response.patent_originality_score_10);
  const competition10 = round1(response.competition_score_10);
  const fit10 = round1(response.fit_score_10);
  const foresight10 = round1(response.foresight_score_10);
  const riskLabel = response.risk_level === "low" ? "Low" : response.risk_level === "medium" ? "Medium" : "High";
  const topMatches = response.portfolio_check.top_matches || [];
  const evidenceTexts = response.evidence.map((item) => item.finding);

  data.startup = {
    name: response.startup_name,
    industry: inputs.industry || response.predicted_domain || "Unknown Domain",
    stage: inputs.stage || "Not specified",
    geography: inputs.geography || "Not specified",
  };

  data.scores = {
    fit: fit10,
    novelty: novelty10,
    foresight: foresight10,
    crmMatches: topMatches.length,
  };

  data.memory.profile = {
    startupName: response.startup_name,
    founderName: "Not provided",
    industry: response.predicted_domain || inputs.industry || "Unknown",
    technology: evidenceTexts[0] || "Inferred from uploaded materials",
    problem: response.limitations[0] || "Problem statement needs manual diligence review",
    solution: response.summary,
    businessModel: "Not extracted in current backend response",
    fundingStage: inputs.stage || "Not provided",
    targetCustomer: "Derived from diligence summary",
    geography: inputs.geography || "Not provided",
  };

  data.memory.similar = topMatches.length
    ? topMatches.map((match) => ({
        name: match.company_name,
        similarity: match.overlap_score,
        reason: match.rationale,
        decision: match.match_type === "exact" ? "Exact overlap" : match.match_type === "strong" ? "Strong overlap" : "Related",
        note: match.shared_keywords.length
          ? `Shared keywords: ${match.shared_keywords.join(", ")}`
          : "Review internal overlap manually.",
      }))
    : [
        {
          name: "No internal overlap found",
          similarity: 0,
          reason: "The portfolio matcher did not identify a close internal analogue.",
          decision: "Clean slate",
          note: "Proceed with market diligence using external competitors and customer calls.",
        },
      ];

  data.memory.openSource = response.evidence.slice(0, 5).map((item, index) => ({
    name: `${item.source} signal ${index + 1}`,
    similarity: Math.max(35, response.competition_score - index * 5),
    reason: item.finding,
    decision: "Reference",
    note: item.url || "Public evidence from the backend pipeline.",
  }));

  data.memory.relationship =
    response.crm_record.recorded && response.crm_record.company_id
      ? [
          `CRM Company #${response.crm_record.company_id}`,
          response.crm_record.pitch_id ? `Pitch #${response.crm_record.pitch_id}` : "Pitch record pending",
          response.predicted_domain,
        ]
      : [response.predicted_domain, "Upload not written to CRM"];

  data.memory.crm = {
    found: response.crm_record.recorded,
    lastInteraction: new Date().toISOString().slice(0, 10),
    owner: "Backend pipeline",
    stage: response.crm_record.recorded ? "Recorded from analysis upload" : "Not recorded in CRM",
    nextAction:
      response.risk_level === "high"
        ? "Review risk items and validate customer urgency."
        : response.portfolio_check.has_similar_investment
          ? "Review internal overlap before deeper diligence."
          : "Proceed to founder and customer diligence.",
  };

  data.memory.questions = [
    "What proprietary advantage makes this startup hard to copy?",
    "How urgent is the customer pain in the next 12 months?",
    "What evidence supports adoption beyond the pilot stage?",
    "Which incumbents or adjacent tools are most likely to compress margins?",
    "What proof exists that timing is favorable in this geography?",
  ];

  data.novelty.breakdown = [
    { label: "Differentiation", value: `${novelty10} / 10`, level: levelFromScore(response.novelty_score) },
    { label: "Competition", value: `${competition10} / 10`, level: levelFromScore(response.competition_score) },
    { label: "Market gap", value: `${market10} / 10`, level: levelFromScore(response.market_score) },
    { label: "Research support", value: `${research10} / 10`, level: levelFromScore(response.research_momentum_score) },
    { label: "Originality", value: `${patent10} / 10`, level: levelFromScore(response.patent_originality_score) },
  ];

  data.novelty.competitors = topMatches.length
    ? topMatches.map((match) => ({
        name: match.company_name,
        category: "Internal comparable",
        similarity: match.overlap_score,
        strength: match.rationale,
        weakness: "Internal overlap is not a substitute for external competitor research.",
        difference: match.shared_keywords.length
          ? `Shared themes: ${match.shared_keywords.join(", ")}`
          : "No shared keyword set extracted.",
        website: match.website || "internal-record",
      }))
    : [
        {
          name: "External competitor mapping pending",
          category: "Placeholder",
          similarity: 0,
          strength: "Backend returned novelty and market scores.",
          weakness: "Search provider is still placeholder-backed.",
          difference: "Use evidence and research signals until real competitor search is added.",
          website: "n/a",
        },
      ];

  data.novelty.competitorMap = {
    "Direct competitors": topMatches.map((match) => match.company_name).slice(0, 3),
    "Indirect competitors": response.evidence.slice(0, 2).map((item) => item.source),
    "Enterprise incumbents": response.limitations.slice(0, 2).length ? response.limitations.slice(0, 2) : ["No explicit incumbents"],
    "Early-stage startups": [],
    "Open-source / alternatives": [],
  };
  data.novelty.gaps = response.limitations.length
    ? response.limitations.slice(0, 5)
    : ["No material data gaps were explicitly returned by the backend."];
  data.novelty.segments.primaryCustomer = "Derived from uploaded materials and summary";
  data.novelty.segments.secondaryCustomer = response.predicted_domain;
  data.novelty.segments.buyerPersona = "To be validated in diligence";
  data.novelty.segments.userPersona = "To be validated in diligence";
  data.novelty.segments.industryVertical = inputs.industry || response.predicted_domain;
  data.novelty.segments.budgetOwner = "Not explicitly extracted";
  data.novelty.financial.revenueModel = "Not extracted";
  data.novelty.financial.pricingBenchmark = "Not extracted";
  data.novelty.financial.willingnessToPay = labelFromScore(response.market_score);
  data.novelty.financial.salesCycle = "Not extracted";
  data.novelty.financial.cacRisk = riskLabel;
  data.novelty.financial.grossMargin = "Unknown";
  data.novelty.saturation =
    response.competition_score >= 70 ? "Low" : response.competition_score >= 50 ? "Medium" : "High";
  data.novelty.insight = response.summary;

  data.foresight.breakdown = [
    { label: "Foresight score", value: `${foresight10} / 10`, level: levelFromScore(response.foresight_score) },
    { label: "Market timing", value: `${market10} / 10`, level: levelFromScore(response.market_score) },
    { label: "Technology momentum", value: `${research10} / 10`, level: levelFromScore(response.research_momentum_score) },
    { label: "Patent originality", value: `${patent10} / 10`, level: levelFromScore(response.patent_originality_score) },
    { label: "Competition pressure", value: `${competition10} / 10`, level: levelFromScore(response.competition_score) },
    { label: "Risk level", value: riskLabel, level: response.risk_level === "low" ? "high" : response.risk_level === "medium" ? "medium" : "low" },
  ];
  data.foresight.trends = response.evidence.slice(0, 5).map((item) => ({
    name: item.source,
    momentum: labelFromScore(response.research_momentum_score),
    why: item.finding,
    relevance: response.predicted_domain,
  }));
  data.foresight.timing = labelFromScore(response.market_score);
  data.foresight.category.current = response.predicted_domain;
  data.foresight.category.future = `${response.predicted_domain} platform opportunity`;
  data.foresight.category.maturity = response.research_momentum_score >= 70 ? "Accelerating" : "Emerging";
  data.foresight.category.potential = labelFromScore(response.novelty_score);
  data.foresight.scenarios.best = `Novelty ${novelty10}/10 with supportive market timing and defensible execution proof.`;
  data.foresight.scenarios.base = response.summary;
  data.foresight.scenarios.worst =
    response.limitations[0] || "Weak external validation or heavy internal overlap could reduce conviction.";
  data.foresight.opportunity.acquisitionTarget =
    response.portfolio_check.has_similar_investment ? "Review strategic overlap before conviction" : "Potential strategic relevance";
  data.foresight.opportunity.adjacentExpansion = response.predicted_domain;
  data.foresight.opportunity.defensibility = evidenceTexts[0] || "Needs further validation";
  data.foresight.opportunity.systemOfRecord = response.crm_record.recorded ? "Tracked in CRM" : "Not yet recorded";
  data.foresight.risks = response.limitations.length
    ? response.limitations
    : ["No explicit limitations returned by the backend."];
  data.foresight.thesis = response.summary;

  data.inputs.sources = [
    { name: "Uploaded Document", status: "Live" },
    { name: "Website Fetch", status: response.evidence.some((item) => item.source === "website") ? "Used" : "Optional / unavailable" },
    { name: "OpenAlex Research", status: response.research_momentum_score > 0 ? "Used" : "Limited" },
    { name: "Internal VC Memory", status: response.portfolio_check.checked ? "Used" : "Unavailable" },
  ];
  data.inputs.confidence = {
    dataQuality: response.limitations.length >= 4 ? "Medium" : "High",
    missing: response.limitations.length ? response.limitations : ["No explicit missing-data flags returned."],
    nextStep: response.risk_level === "high"
      ? "Validate risk items with founder, customer, and market calls."
      : "Continue diligence using the returned evidence and internal overlap signals.",
  };

  if (inputs.notes) {
    data.memory.profile.problem = inputs.notes.slice(0, 160);
  }

  return data;
}
