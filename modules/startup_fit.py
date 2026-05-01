"""Maps industry scenarios vs a specific startup (deck + notes) — post-scenario diligence slice."""
from __future__ import annotations

import json

from modules.llm_client import complete_user_text, strip_json_fences


def generate_startup_future_fit(parsed: dict, bundle: dict, dossier_digest: str) -> dict:
    """
    dossier_digest: condensed startup materials (~25k chars) for model context.
    """
    scenarios_blob = bundle.get("scenarios") or []
    compact_sc = []
    for s in scenarios_blob:
        if not isinstance(s, dict):
            continue
        compact_sc.append({
            "id": s.get("id"),
            "name": s.get("name"),
            "archetype": s.get("archetype"),
            "probability_class": s.get("probability_class"),
            "summary": (s.get("summary") or "")[:900],
            "narrative": (s.get("narrative") or "")[:1200],
            "drivers": (s.get("drivers") or [])[:14],
            "impacts": (s.get("impacts") or [])[:14],
        })

    syn = bundle.get("synthesis") or {}
    prompt = f"""You are advising venture capital partners evaluating whether a SPECIFIC STARTUP survives or thrives
under TECHNOLOGY / INDUSTRY futures modeled below (these scenarios describe the FIELD, not the company).

Industry / domain briefing (parsed from diligence materials):
{json.dumps(parsed, ensure_ascii=False)}

Alternative futures already drafted for THIS INDUSTRY (not bespoke to any one company yet):
{json.dumps(compact_sc, ensure_ascii=False)}

Cross-cutting synthesis excerpts:
- comparison: {(syn.get("scenario_comparison") or "")[:2800]}
- blind spots: {json.dumps(syn.get("shared_blind_spots") or [], ensure_ascii=False)}

Startup dossier (deck + optional notes/site — ground every claim below):
{dossier_digest[:24000]}

Return ONLY JSON:
{{
  "executive_summary_for_partner": "4-7 sentences explicitly stating viability vs each archetype trajectory",
  "likely_outcome_per_scenario": [
    {{
      "scenario_id": "S1",
      "scenario_name_echo": "",
      "resilience_rating": "strong | mixed | fragile",
      "what_must_stay_true": ["for this startup path to survive this future"],
      "what_breaks_or_displaces_them": ["…"],
      "concrete_changes_to_pitch_or_product": ["how they should adapt roadmap, GTM, stack, partnerships, regulation posture"]
    }}
  ],
  "cross_cutting_risk_themes": ["…"],
  "due_diligence_questions_next_meeting": ["…"],
  "kill_or_pause_signals_watchlist": ["observable thresholds that materially erode survivability"],
  "confidence_and_evidence_limits": "explicitly state where the deck/site/notes were thin"
}}

Rules:
- Every scenario archetype MUST appear exactly once unless fewer than four were provided (then mirror what exists).
- Do not invert scenario definitions — critique only the STARTUP positioning relative to them.
- Distinguish "company fails" vs "needs pivot" vs "captures upside".
"""

    raw = complete_user_text(
        prompt,
        system="Return valid UTF-8 JSON object only.",
        temperature=0.28,
    )
    try:
        return json.loads(strip_json_fences(raw))
    except json.JSONDecodeError:
        return {
            "executive_summary_for_partner": "Model returned non-JSON — retry or shorten deck context.",
            "likely_outcome_per_scenario": [],
            "cross_cutting_risk_themes": [],
            "due_diligence_questions_next_meeting": [],
            "kill_or_pause_signals_watchlist": [],
            "confidence_and_evidence_limits": (raw or "")[:1200],
        }
