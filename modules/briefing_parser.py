import json
import re

from modules.llm_client import complete_user_text, strip_json_fences


def _fallback_parsed(briefing_text: str, snippet: str = "") -> dict:
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]{4,}", (briefing_text or "").lower())
    kws = []
    seen = set()
    for w in words:
        if w not in seen:
            seen.add(w)
            kws.append(w)
        if len(kws) >= 8:
            break
    return {
        "focal_question": (
            "Industry survivability under technology and market shifts affecting this sector "
            "(structure could not be auto-parsed; retry or shorten materials)."
        ),
        "technology_scope": (briefing_text or "")[:420] + ("…" if len(briefing_text or "") > 420 else ""),
        "time_horizon_years": 10,
        "stakeholder_lens": "investors, incumbents, buyers, regulators — refine manually",
        "constraints": [],
        "outcome_variables": [],
        "domain": "Deck / materials (unparsed)",
        "keywords": kws or ["technology", "startup", "market"],
        "_parse_note": (snippet or "")[:500],
    }


def parse_briefing(briefing_text: str) -> dict:
    """Parse diligence materials (typically deck-heavy) into industry foresight structure."""

    prompt = f"""Parse this VC diligence bundle (startup PDF/PPTX excerpt + optional meeting notes/site text)
into INDUSTRY / TECHNOLOGY foresight scaffolding the firm must stress-test—not a generic summary deck.
Treat the focal question as survivability under technology and market shifts affecting that sector.

Return ONLY valid JSON, no markdown fences, no other text.

Materials (truncated upstream if lengthy):
"{briefing_text}"

JSON shape:
{{
  "focal_question": "investment-relevant uncertainty: will this industry's economics / stack / adoption path support this kind of company?",
  "technology_scope": "specific technologies, systems, or platforms dominating the PLAYING FIELD (not buzzwords alone)",
  "time_horizon_years": 10,
  "stakeholder_lens": "who monetizes, regulates, substitutes, integrates (explicitly investors + incumbents + buyers)",
  "constraints": ["regulatory", "supply chain", "…"],
  "outcome_variables": ["what might change materially in the future state"],
  "domain": "short sector/domain label e.g. energy AI, semiconductor packaging, civic tech",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}}

Infer reasonable defaults if omitted; numeric time_horizon_years between 3 and 30.
Keywords must be searchable technical / market phrases for literature retrieval (no generic filler)."""

    system = (
        "You extract structured JSON for downstream software. Reply with JSON only."
    )

    try:
        raw = complete_user_text(prompt, system=system, temperature=0.2)
        cleaned = strip_json_fences(raw)
    except Exception as e:
        return _fallback_parsed(briefing_text, str(e))

    try:
        out = json.loads(cleaned)
        if not isinstance(out, dict):
            raise ValueError("parsed briefing is not an object")
        return out
    except (json.JSONDecodeError, ValueError, TypeError):
        return _fallback_parsed(briefing_text, cleaned[:800])
