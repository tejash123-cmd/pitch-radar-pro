"""
Statistical signals for technology-corpus trajectories + evidential confidence scores.

confidence_score is computed from retrieval depth, keyword overlap, full-text share,
source diversity, recency, scenario archetype, and overlap of cited papers — not from
the scenario LLM's judgment.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from typing import Any

from modules.llm_client import complete_user_text, strip_json_fences

ARCHETYPE_CONFIDENCE_FACTOR: dict[str, float] = {
    "baseline_trend": 1.0,
    "high_ambition": 0.88,
    "constraint_shock": 0.92,
    "wildcard_discontinuity": 0.78,
}

STOPWORDS = frozenset({
    "that", "this", "with", "from", "have", "been", "were", "their", "which",
    "using", "based", "study", "studies", "model", "models", "novel", "also",
    "approach", "method", "methods", "paper", "analysis", "results", "show",
    "system", "systems", "such", "these", "those", "within", "between",
    "would", "could", "there", "where", "through", "during", "while", "after",
    "before", "other", "more", "than", "into", "both", "many", "each", "some",
    "about", "under", "including", "however", "without", "being", "because",
})


def parse_year(p: dict) -> int | None:
    y = p.get("year")
    if y is None or y == "":
        return None
    if isinstance(y, int):
        return y if 1900 <= y <= 2035 else None
    m = re.match(r"^\s*(\d{4})", str(y).strip())
    if m:
        v = int(m.group(1))
        return v if 1900 <= v <= 2035 else None
    return None


def _tokenize(text: str) -> list[str]:
    return [
        w.lower()
        for w in re.findall(r"[A-Za-z][A-Za-z0-9-]{3,}", text or "")
        if w.lower() not in STOPWORDS
    ]


def _briefing_token_alignment(papers: list[dict], briefing: str) -> float | None:
    toks = set(_tokenize(briefing))
    if not toks:
        return None
    hits = 0
    for t in toks:
        for p in papers:
            blob = f"{p.get('title', '')} {(p.get('abstract') or '')}".lower()
            if t in blob:
                hits += 1
                break
    return round(100.0 * hits / len(toks), 1)


def compute_trajectory_statistics(papers: list[dict], briefing: str = "") -> dict[str, Any]:
    """Corpus-level stats: publication timing, lexical shift vs median year, retrieval quality."""
    enriched: list[dict] = []
    for p in papers or []:
        row = dict(p)
        row["_year"] = parse_year(p)
        enriched.append(row)

    with_year = [x for x in enriched if x["_year"] is not None]
    years = sorted(x["_year"] for x in with_year)
    n = len(enriched)

    by_decade: dict[str, int] = {}
    for p in enriched:
        y = p["_year"]
        if y is None:
            continue
        label = f"{(y // 10) * 10}s"
        by_decade[label] = by_decade.get(label, 0) + 1

    median_y: int | None = None
    if years:
        median_y = years[len(years) // 2]

    recent_text: list[str] = []
    older_text: list[str] = []
    for p in enriched:
        blob = f"{p.get('title', '')} {(p.get('abstract') or '')}"
        y = p["_year"]
        if y is not None and median_y is not None:
            (recent_text if y >= median_y else older_text).append(blob)
        else:
            older_text.append(blob)

    freq_old = Counter(_tokenize(" ".join(older_text)))
    freq_new = Counter(_tokenize(" ".join(recent_text)))
    denom_old = max(sum(freq_old.values()), 1)
    denom_new = max(sum(freq_new.values()), 1)

    emerging: list[tuple[str, float]] = []
    for w, c in freq_new.items():
        r_new = c / denom_new
        r_old = freq_old.get(w, 0) / denom_old
        if c < 2 or r_new < 0.006:
            continue
        lift = (r_new + 1e-6) / (r_old + 1e-6)
        if lift >= 1.22 or r_old == 0:
            emerging.append((w, lift))
    emerging.sort(key=lambda x: (-x[1], -freq_new[x[0]]))
    emerging_terms = [w for w, _ in emerging[:16]]

    yearly_counts: Counter[int] = Counter()
    for y in years:
        yearly_counts[y] += 1
    slope_year: float | None = None
    if len(yearly_counts) >= 3:
        pts = sorted(yearly_counts.items())
        xs = [float(x) for x, _ in pts]
        ys = [float(c) for _, c in pts]
        mean_x = sum(xs) / len(xs)
        mean_yv = sum(ys) / len(ys)
        var_x = sum((x - mean_x) ** 2 for x in xs) or 1e-9
        cov = sum((x - mean_x) * (y - mean_yv) for x, y in zip(xs, ys))
        slope_year = cov / var_x

    sims = [float(p.get("similarity_score") or 0) for p in enriched]
    mean_sim = sum(sims) / len(sims) if sims else 0.0
    max_sim = max(sims) if sims else 0.0

    full_text_frac = (
        sum(1 for p in enriched if p.get("full_text_available")) / n if n else 0.0
    )
    sources = {p.get("source") or "?" for p in enriched}
    source_richness = min(100.0, (len(sources) / 5.0) * 100.0)

    year_span = (max(years) - min(years)) if len(years) >= 2 else 0
    reference_year = 2026
    recency_frac = 0.0
    if with_year:
        cut = reference_year - 8
        recency_frac = sum(1 for p in with_year if p["_year"] and p["_year"] >= cut) / len(with_year)

    return {
        "n_papers": n,
        "n_with_publication_year": len(with_year),
        "median_publication_year": median_y,
        "min_publication_year": min(years) if years else None,
        "max_publication_year": max(years) if years else None,
        "publication_year_span": year_span,
        "papers_per_decade": dict(sorted(by_decade.items())),
        "emerging_lexical_signals": emerging_terms,
        "publication_intensity_slope_vs_year": round(slope_year, 8) if slope_year is not None else None,
        "mean_keyword_overlap_similarity": round(mean_sim, 2),
        "max_keyword_overlap_similarity": round(max_sim, 2),
        "full_text_fraction": round(full_text_frac, 3),
        "source_mix_richness_0_100": round(source_richness, 1),
        "recent_8yr_share_of_dated": round(recency_frac, 3),
        "briefing_token_coverage_pct": _briefing_token_alignment(enriched, briefing),
    }


def infer_base_evidence_score(
    stats: dict[str, Any],
    coverage_llm: dict | None,
) -> tuple[float, dict[str, Any]]:
    """
    Transparent weighted linear blend (capped). Optionally fuse LLM `_assess_coverage` score.

    base_stat ≈ sum_k w_k · component_k, then fused = 0.55·base_stat + 0.45·coverage_llm if present.
    """
    n = int(stats.get("n_papers") or 0)
    mean_sim = float(stats.get("mean_keyword_overlap_similarity") or 0.0)
    ft = float(stats.get("full_text_fraction") or 0.0)
    sr = float(stats.get("source_mix_richness_0_100") or 0.0)
    rec_raw = stats.get("recent_8yr_share_of_dated")

    retrieval_depth = min(100.0, n * 16.667)
    overlap_quality = min(100.0, mean_sim)
    text_depth = min(100.0, ft * 100.0)
    diversity = min(100.0, sr)
    recency_strength = (float(rec_raw) if rec_raw is not None else 0.5) * 100.0

    weighted = (
        0.24 * retrieval_depth
        + 0.34 * overlap_quality
        + 0.16 * text_depth
        + 0.13 * diversity
        + 0.13 * recency_strength
    )
    stat_conf = max(10.0, min(100.0, weighted))

    breakdown = {
        "formula_version": "evidence_blend_v1",
        "weights": {"retrieval_depth": 0.24, "keyword_overlap": 0.34, "full_text": 0.16,
                    "source_diversity": 0.13, "dated_recency": 0.13},
        "retrieval_depth_0_100": round(min(100.0, retrieval_depth), 1),
        "overlap_quality_0_100": round(overlap_quality, 1),
        "full_text_depth_0_100": round(text_depth, 1),
        "source_diversity_0_100": round(diversity, 1),
        "recency_strength_0_100": round(recency_strength, 1),
        "statistical_evidence_before_fusion": round(stat_conf, 2),
        "explain": (
            "Base score blends how many papers we found, wording overlap vs briefing, presence of "
            "full PDF/text, openness across publishers, and how recent dated items are vs 2006–today."
        ),
    }

    if coverage_llm and isinstance(coverage_llm.get("coverage_score"), (int, float)):
        llm_cov = float(coverage_llm["coverage_score"])
        llm_cov = max(0.0, min(100.0, llm_cov))
        fused = 0.55 * stat_conf + 0.45 * llm_cov
        breakdown["llm_coverage_score_fused_component"] = round(llm_cov, 2)
        breakdown["fusion"] = "0.55·statistical + 0.45·signal_search._assess_coverage"
        return round(fused, 2), {**breakdown, "base_evidence_fused_0_100": round(fused, 2)}

    return round(stat_conf, 2), {**breakdown, "base_evidence_fused_0_100": round(stat_conf, 2)}


def _paper_index_from_ref(ref: str) -> int | None:
    m = re.match(r"^\s*\[\s*(\d+)\s*\]\s*$", str(ref).strip())
    if not m:
        return None
    i = int(m.group(1)) - 1
    return i if i >= 0 else None


def apply_statistical_confidence_to_bundle(bundle: dict, papers: list, trajectory_pkg: dict) -> None:
    """Overwrite validation.confidence_score / rationale + attach confidence_model."""
    stats = trajectory_pkg.get("statistics")
    if not isinstance(stats, dict):
        stats = compute_trajectory_statistics(papers or [], "")
        trajectory_pkg["statistics"] = stats
    coverage = trajectory_pkg.get("coverage_calibration")
    base, bd_base = infer_base_evidence_score(stats, coverage)

    scenarios = bundle.get("scenarios")
    if not isinstance(scenarios, list):
        return

    for sc in scenarios:
        if not isinstance(sc, dict):
            continue
        v = sc.get("validation")
        if not isinstance(v, dict):
            continue

        arch = str(sc.get("archetype") or "baseline_trend")
        factor = ARCHETYPE_CONFIDENCE_FACTOR.get(arch, 0.9)

        refs = sc.get("literature_refs")
        anchor_sims: list[float] = []
        if isinstance(refs, list):
            for ref in refs:
                idx = _paper_index_from_ref(str(ref))
                if idx is not None and papers and idx < len(papers):
                    anchor_sims.append(float(papers[idx].get("similarity_score") or 0.0))

        if anchor_sims:
            anchor_mean = sum(anchor_sims) / len(anchor_sims)
            anchor_channel = anchor_mean
        else:
            anchor_mean = None
            anchor_channel = base * 0.82

        combined = (0.48 * base + 0.52 * anchor_channel) * factor
        score = int(max(5, min(100, round(combined))))

        rationale = (
            f"Statistical confidence {score}/100: fused evidence base ≈{base:.1f}/100 from retrieval "
            f"depth, overlap with briefing, full-text share, diversity of indexes, and recency; "
            f"anchored by cited papers ≈{anchor_mean:.0f}/100 overlap" if anchor_mean is not None
            else f"Statistical confidence {score}/100: fused evidence base ≈{base:.1f}/100; "
                 f"no literature_refs so anchor channel uses down-weighted base"
        )
        rationale += f"; archetype «{arch}» ×{factor:.2f}."

        v["confidence_score"] = score
        v["confidence_rationale"] = rationale
        v["confidence_model"] = {
            **bd_base,
            "archetype": arch,
            "archetype_uncertainty_factor": factor,
            "anchor_overlap_mean_0_100": round(anchor_mean, 2) if anchor_mean is not None else None,
            "final_score": score,
        }


def analyze_trajectory_bundle(
    briefing: str,
    keywords: list[str],
    papers: list[dict],
    coverage: dict | None,
) -> dict[str, Any]:
    """Returns statistics + optional LLM narrative tying shifts to scenario thinking."""
    stats = compute_trajectory_statistics(papers or [], briefing or "")
    pkg: dict[str, Any] = {
        "statistics": stats,
        "coverage_calibration": coverage,
        "synthesis": None,
    }
    pkg["synthesis"] = trajectory_synthesis_llm(briefing, keywords or [], papers or [], stats)
    return pkg


def trajectory_synthesis_llm(
    briefing: str,
    keywords: list[str],
    papers: list[dict],
    stats: dict[str, Any],
) -> dict[str, Any] | None:
    """One structured pass: sequential tech waves → drivers → how futures may diverge."""
    if not papers:
        return {
            "note": "No retrieved papers — trajectory narrative is hypothetical only.",
            "successive_waves": [],
            "drivers_of_transition": [],
            "current_trajectory_hypothesis": "",
            "scenario_divergence_hook": "",
        }

    refs = []
    for i, p in enumerate(papers[:12]):
        y = parse_year(p) if isinstance(p, dict) else None
        refs.append(
            {
                "id": i + 1,
                "year": y,
                "title": (p.get("title") or "")[:180],
                "source": (p.get("source") or "")[:40],
            }
        )

    stats_json = json.dumps(stats, ensure_ascii=False)

    prompt = f"""You are a technology historian + foresight analyst. The user observes shifts like
hardware generations (feature phone → smartphone → wearable) — your job is to infer *patterns*,
not certainty, from bibliography metadata and simple corpus statistics below.

Briefing excerpt: {briefing[:500]}

Keywords: {", ".join(keywords[:14])}

Numbered retrieval sample (title/year/source): {json.dumps(refs, ensure_ascii=False)}
Corpus statistics (algorithmic — trust as weak signals): {stats_json}

Return ONLY valid JSON:
{{
  "successive_waves": [
    {{
      "era_label": "short label e.g. pre-2010 mobile internet",
      "dominant_form_factors_or_tech": ["..."],
      "why_shift_happened": "2-3 sentences on enabling tech, economics, social demand, policy"
    }}
  ],
  "drivers_of_transition": [
    "each ≤ 25 words: what repeatedly pushes the next layer (miniaturization, battery, UX, cost, ...)"
  ],
  "current_trajectory_hypothesis": "2-4 sentences on what the corpus timing + terms suggest is consolidating now",
  "scenario_divergence_hook": "2-3 sentences on how those forces could branch into different futures for the briefing topic"
}}

Rules:
- 2-4 waves unless evidence is thin (then 1-2).
- Ground claims in years/titles when possible; mark speculation explicitly.
- emerging_lexical_signals in stats may indicate newer themes — reference if useful.
"""

    try:
        raw = complete_user_text(
            prompt,
            system="JSON only, no markdown fences. Valid UTF-8 object.",
            temperature=0.3,
        )
        return json.loads(strip_json_fences(raw))
    except Exception:
        return {
            "note": "Trajectory narrative unavailable (LLM parse error). Use statistics only.",
            "successive_waves": [],
            "drivers_of_transition": [],
            "current_trajectory_hypothesis": "",
            "scenario_divergence_hook": "",
        }


def format_trajectory_for_prompt(trajectory: dict | None) -> str:
    if not trajectory:
        return ""
    st = trajectory.get("statistics") or {}
    syn = trajectory.get("synthesis") or {}
    lines = [
        "── Data-driven trajectory snapshot (statistical) ──",
        json.dumps(st, ensure_ascii=False)[:3500],
        "── Interpretive synthesis (LLM, must stay consistent with stats) ──",
        json.dumps(syn, ensure_ascii=False)[:3500],
    ]
    return "\n".join(lines)
