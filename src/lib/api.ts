export type EvidenceItem = {
  source: string;
  finding: string;
  url?: string | null;
};

export type PortfolioMatch = {
  company_id: number;
  company_name: string;
  website?: string | null;
  domain: string;
  sector: string;
  product_summary: string;
  overlap_score: number;
  domain_match: boolean;
  product_similarity_score: number;
  match_type: "exact" | "strong" | "related";
  shared_keywords: string[];
  rationale: string;
};

export type PortfolioCheckResult = {
  checked: boolean;
  portfolio_company_count: number;
  overlap_score: number;
  overlap_level: "none" | "related" | "strong" | "exact";
  has_similar_investment: boolean;
  top_matches: PortfolioMatch[];
};

export type CRMRecordResult = {
  recorded: boolean;
  company_id?: number | null;
  pitch_id?: number | null;
};

export type StartupAnalysisResponse = {
  startup_name: string;
  predicted_domain: string;
  novelty_score: number;
  novelty_score_10: number;
  market_score: number;
  market_score_10: number;
  competition_score: number;
  competition_score_10: number;
  research_momentum_score: number;
  research_momentum_score_10: number;
  patent_originality_score: number;
  patent_originality_score_10: number;
  fit_score: number;
  fit_score_10: number;
  foresight_score: number;
  foresight_score_10: number;
  risk_level: "low" | "medium" | "high";
  summary: string;
  portfolio_check: PortfolioCheckResult;
  crm_record: CRMRecordResult;
  evidence: EvidenceItem[];
  limitations: string[];
  foresight_payload?: {
    parsed?: Record<string, unknown>;
    literature?: Record<string, unknown>;
    bundle?: Record<string, unknown>;
  };
};

export type CRMCountBucket = {
  label: string;
  count: number;
};

export type CRMCompany = {
  id: number;
  company_name: string;
  website?: string | null;
  sector: string;
  country: string;
  predicted_domain: string;
  description: string;
  founder_names: string[];
  contact_email?: string | null;
  notes: string;
  keywords: string[];
  created_at: string;
  updated_at: string;
};

export type CRMPitch = {
  id: number;
  company_id: number;
  company_name: string;
  company_website?: string | null;
  pitch_date: string;
  deal_status: "new" | "screening" | "partner_review" | "due_diligence" | "passed" | "invested";
  funding_status: "unknown" | "seeking" | "not_raising" | "in_discussion" | "due_diligence" | "term_sheet" | "invested" | "passed";
  predicted_domain: string;
  round_name: string;
  amount_requested_usd?: number | null;
  source: string;
  notes: string;
  created_at: string;
};

export type CRMSummaryResponse = {
  total_companies: number;
  total_pitches: number;
  domain_counts: CRMCountBucket[];
  deal_status_counts: CRMCountBucket[];
  funding_status_counts: CRMCountBucket[];
  monthly_pitch_counts: CRMCountBucket[];
};

export type PortfolioCompany = {
  id: number;
  company_name: string;
  website?: string | null;
  domain: string;
  sector: string;
  country: string;
  product_summary: string;
  thesis: string;
  notes: string;
  keywords: string[];
  created_at: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (error) {
    // Surface an actionable message instead of the browser's generic "Failed to fetch".
    throw new Error(
      `Unable to reach backend at ${API_BASE_URL}. Start the backend server and verify VITE_API_BASE_URL is correct.`,
      { cause: error },
    );
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errorPayload.detail || "Request failed");
  }

  return response.json() as Promise<T>;
}

export function scoreStartup(formData: FormData): Promise<StartupAnalysisResponse> {
  return request<StartupAnalysisResponse>("/score-startup", {
    method: "POST",
    body: formData,
  });
}

export function getHealth(): Promise<Record<string, string>> {
  return request<Record<string, string>>("/health");
}

export function getCrmCompanies(): Promise<CRMCompany[]> {
  return request<CRMCompany[]>("/crm/companies");
}

export function getCrmPitches(): Promise<CRMPitch[]> {
  return request<CRMPitch[]>("/crm/pitches");
}

export function getCrmSummary(): Promise<CRMSummaryResponse> {
  return request<CRMSummaryResponse>("/crm/summary");
}

export function getPortfolioCompanies(): Promise<PortfolioCompany[]> {
  return request<PortfolioCompany[]>("/portfolio-companies");
}
