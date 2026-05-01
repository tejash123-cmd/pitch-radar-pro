import json

from modules.llm_client import complete_user_text, strip_json_fences
from modules.trajectory_analysis import format_trajectory_for_prompt

PAPER_PROMPT_LIMIT = 5


def _literature_basis(papers: list, limit: int = PAPER_PROMPT_LIMIT) -> list[dict]:
    """Stable list of numbered papers fed to the LLM — used for citations in UI."""
    rows: list[dict] = []
    for i, p in enumerate(papers[:limit]):
        rows.append(
            {
                "ref": f"[{i + 1}]",
                "title": (p.get("title") or "").strip() or "(untitled)",
                "authors": (p.get("authors") or "").strip(),
                "year": p.get("year"),
                "source": (p.get("source") or "").strip(),
                "url": (p.get("url") or "").strip(),
            }
        )
    return rows


def _empty_scenario_validation() -> dict:
    return {
        "assumptions": ["Automated scenario block — verify manually if you see this."],
        "early_warning_indicators": [],
        "falsification_tests": [],
        "stress_tests": [],
    }


def _friendly_error(err: str) -> str:
    text = (err or "").strip()
    if "OpenRouter rate limit exceeded" in text or "HTTP 429" in text:
        return (
            "Scenario generation paused because LLM rate limits were reached. "
            "Wait for reset, add OpenRouter credits, switch model, or configure Gemini."
        )
    return text[:220] if text else "Scenario generation failed unexpectedly."


def _emergency_foresight_bundle(parse_err: str) -> dict:
    archs = [
        "baseline_trend",
        "high_ambition",
        "constraint_shock",
        "wildcard_discontinuity",
    ]
    scenarios = []
    for i, arch in enumerate(archs, start=1):
        scenarios.append({
            "id": f"S{i}",
            "name": f"Parse recovery — {arch}",
            "archetype": arch,
            "probability_class": "challenging",
            "summary": (
                "The foresight model returned text that could not be parsed as JSON. "
                "Retry analysis, verify your LLM API key/quota/rate limits, or try trimming "
                "optional notes. Technical detail: "
                + _friendly_error(str(parse_err))
            ),
            "narrative": "",
            "literature_refs": [],
            "drivers": [],
            "impacts": [],
            "dependencies": [],
            "validation": _empty_scenario_validation(),
        })
    return {
        "scenarios": scenarios,
        "synthesis": {
            "scenario_comparison": (
                "Placeholders were inserted so you can keep working — the scenario LLM "
                "response was not valid JSON on this attempt."
            ),
            "shared_blind_spots": [str(parse_err)[:280]],
            "cross_scenario_indicators": [],
            "decision_gates": [],
            "portfolio_recommendation": (
                "Re-run diligence once the upstream model completes successfully."
            ),
            "sources_named": [],
        },
    }


def _generate_json(prompt: str) -> dict:
    system = (
        "You produce valid JSON only for tooling. No markdown code fences unless asked; "
        "prefer raw JSON objects."
    )
    try:
        raw = complete_user_text(prompt, system=system, temperature=0.35)
    except Exception as e:
        return _emergency_foresight_bundle(f"LLM error: {e}")

    try:
        data = json.loads(strip_json_fences(raw))
        if not isinstance(data, dict):
            raise ValueError("root must be a JSON object")
        return data
    except (json.JSONDecodeError, ValueError, TypeError) as e:
        return _emergency_foresight_bundle(str(e))


def _paper_ctx(papers: list, limit: int = PAPER_PROMPT_LIMIT) -> str:
    blocks = []
    for i, p in enumerate(papers[:limit]):
        title = ((p.get("title") or "").strip()) or "(untitled)"
        if len(title) > 260:
            title = title[:257] + "…"
        year = str(p.get("year") or "?")
        authors = ((p.get("authors") or "").strip()) or "(unknown)"
        src = ((p.get("source") or "").strip()) or "unknown"
        url = ((p.get("url") or "").strip())
        cite = (
            f"Reference [{i + 1}]\n"
            f'Full title (cite verbatim): "{title}"\n'
            f"Year: {year} · Primary index: {src}\nAuthors: {authors}\n"
        )
        if url:
            cite += f"URL: {url}\n"
        full = p.get("full_text", "")
        if full and p.get("full_text_available"):
            snippet = full[:2200]
            blocks.append(f"{cite}Body excerpt:\n{snippet}")
        else:
            abstr = ((p.get("abstract") or "")[:480]).strip()
            suffix = abstr if abstr else "(no abstract retrieved)"
            blocks.append(f"{cite}Abstract (may be truncated):\n{suffix}")
    return (
        "\n\n---\n\n".join(blocks)
        if blocks
        else "No papers retrieved — lean on general knowledge and flag uncertainty."
    )


def generate_foresight_bundle(
    parsed: dict,
    papers: list,
    feedback_context: list,
    trajectory: dict | None = None,
) -> dict:
    """Produce alternative futures with per-scenario validation and cross-cutting synthesis."""
    feedback_hint = ""
    applied_corrections = []
    if feedback_context:
        recent = feedback_context[-5:]
        for f in recent:
            if f.get("correction"):
                applied_corrections.append({
                    "section": f.get("section", ""),
                    "correction": f["correction"],
                })
        if applied_corrections:
            feedback_hint = "\n".join(
                f"- [{c['section']}] {c['correction']}" for c in applied_corrections
            )

    fb_block = (
        f"\n\nExpert corrections from prior runs in this domain (apply faithfully):\n{feedback_hint}\n"
        if feedback_hint
        else ""
    )

    basis = _literature_basis(papers)
    lit = _paper_ctx(papers)
    n_lit = len(basis)
    index_lines = (
        "\n".join(f"  [{j + 1}] {b['title']} ({b['source']})" for j, b in enumerate(basis))
        if basis
        else "  (no retrieval — leave every literature_refs as [] and sources_named as [])"
    )
    ref_banner = (
        f"Use bracket labels [1]…[{n_lit}] only (they map to excerpts below)."
        if basis
        else "Literature-independent run — cite no [n]."
    )
    traj_block = format_trajectory_for_prompt(trajectory)
    traj_section = ""
    if traj_block:
        traj_section = (
            "\nTechnology trajectory cues (combine statistics + qualitative waves — "
            "do NOT contradict timing facts):\n"
            + traj_block
            + "\n"
        )

    prompt = f"""You are a principal technology foresight consultant (ISO-style exploratory scenarios, not predictions).

Structured briefing:
- Focal question: {parsed.get("focal_question")}
- Scope: {parsed.get("technology_scope")}
- Horizon (years): {parsed.get("time_horizon_years")}
- Stakeholders: {parsed.get("stakeholder_lens")}
- Constraints: {json.dumps(parsed.get("constraints") or [])}
- Outcome variables: {json.dumps(parsed.get("outcome_variables") or [])}
- Domain label: {parsed.get("domain")}{traj_section}
Numbered retrieval list ({n_lit} papers) — {ref_banner}
{index_lines}

Literature excerpts (supporting signals, not deterministic proof):
{lit}
{fb_block}

Return ONLY valid JSON with this exact structure:
{{
  "scenarios": [
    {{
      "id": "S1",
      "name": "short label",
      "archetype": "baseline_trend" | "high_ambition" | "constraint_shock" | "wildcard_discontinuity",
      "probability_class": "plausible" | "challenging" | "tail",
      "summary": "2-3 sentences; when a claim rests on retrieved work name the paper explicitly (verbatim title substring) OR cite bracket refs like [1]",
      "narrative": "180-260 word coherent story from today to horizon year; weave in [n] citations where grounded in excerpts",
      "literature_refs": ["[1]", "[2]"],
      "drivers": ["driver1", "driver2"],
      "impacts": ["impact1", "impact2"],
      "dependencies": ["what must remain true"],
      "validation": {{
        "assumptions": ["explicit premise", "..."],
        "early_warning_indicators": [
          {{"indicator": "measurable signal name", "metric_type": "price|adoption|policy|technical", "threshold_hint": "what change matters", "suggested_sources": "where to watch data"}}
        ],
        "falsification_tests": [
          {{"test_name": "short", "what_would_disprove_scenario": "...", "how_to_observe": "research, experiment, benchmark", "horizon_within_years": 3}}
        ],
        "stress_tests": [ "question to ask when this scenario feels 'too easy'" ]
      }}
    }}
  ],
  "synthesis": {{
    "scenario_comparison": "how the four futures differ on speed, winners, and risk; name which papers informed each cluster",
    "shared_blind_spots": ["..."],
    "cross_scenario_indicators": [
      {{"indicator": "...", "if_improves": "which scenarios gain plausibility", "if_deteriorates": "which scenarios weaken"}}
    ],
    "decision_gates": [
      {{"gate": "what decision", "by_when": "relative timing", "evidence_needed": "..."}}
    ],
    "portfolio_recommendation": "how a leadership team should allocate attention across scenarios",
    "sources_named": [
      {{"reference_label": "[1]", "verbatim_title_fragment": "match from numbered list titles", "contribution_to_foresight": "how this retrieval shaped scenarios"}}
    ]
  }}
}}

Rules:
- Produce exactly 4 scenarios covering the four archetypes (one each).
- literature_refs MUST list only bracket labels that exist ([1], [2], …) from the excerpts; use [] only if speculative or no excerpts.
- synthesis.sources_named: include one entry per distinct ref you cite across scenarios (omit if no excerpts); each reference_label MUST match excerpts.
- Omit validation.confidence_score and validation.confidence_rationale — numeric confidence will be inferred statistically after generation using retrieval signals.
- Keep language outcome-oriented; avoid numeric probability percentages.
- Ground drivers/impacts in the briefing, trajectory cues, and literature where possible; otherwise label speculation explicitly.
"""

    bundle = _generate_json(prompt)
    bundle["applied_corrections"] = applied_corrections
    bundle["literature_basis"] = basis
    # Tolerate partial JSON from the model — ensure keys exist when clients render
    scenarios = bundle.get("scenarios")
    if isinstance(scenarios, list):
        for s in scenarios:
            if isinstance(s, dict) and not isinstance(s.get("literature_refs"), list):
                s["literature_refs"] = []
            if isinstance(s, dict):
                val = s.get("validation")
                if isinstance(val, dict):
                    val.pop("confidence_score", None)
                    val.pop("confidence_rationale", None)
    syn = bundle.get("synthesis")
    if isinstance(syn, dict) and not isinstance(syn.get("sources_named"), list):
        syn["sources_named"] = []
    return bundle
