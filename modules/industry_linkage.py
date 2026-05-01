"""Directed industry–industry influence graph for cross-sector knock-on visuals."""
from __future__ import annotations

import json
import re

from modules.llm_client import complete_user_text, strip_json_fences

_SLUG = re.compile(r"[^a-z0-9]+")


def _slug(s: str) -> str:
    t = _SLUG.sub("-", (s or "").lower().strip())[:42].strip("-")
    return t or "node"


def _linkage_fallback(parsed: dict) -> dict:
    dom = (
        str(parsed.get("domain") or parsed.get("technology_scope") or "Focal sector")
    )[:64]
    n0 = {"id": "focal", "label": dom, "role": "focal"}
    adj = []
    lens = parsed.get("stakeholder_lens")
    if isinstance(lens, str) and lens.strip():
        slug = _slug(lens[:32])
        adj.append({"id": slug, "label": lens.strip()[:48], "role": "adjacent"})
    extras = parsed.get("keywords") if isinstance(parsed.get("keywords"), list) else []
    for kw in extras[:6]:
        if isinstance(kw, str) and kw.strip():
            slug = _slug(kw[:32])
            if slug == "focal":
                slug = slug + "-" + str(hash(kw) % 999)
            adj.append({"id": slug, "label": kw.strip()[:48], "role": "adjacent"})
    seen = {n0["id"]}
    nodes = [n0]
    for x in adj:
        if x["id"] in seen:
            continue
        seen.add(x["id"])
        nodes.append(x)
        if len(nodes) >= 7:
            break
    edges = []
    for n in nodes[1:]:
        edges.append({
            "from_id": "focal",
            "to_id": n["id"],
            "strength": 52,
            "mechanism": "Heuristic linkage from parsed scope / keywords (thin graph).",
        })
    return {
        "narrative_summary": (
            "Fallback graph: broaden with a fuller run or richer deck context "
            "to unlock model-inferred spillovers across sectors."
        ),
        "nodes": nodes[:8],
        "edges": edges,
        "fallback": True,
    }


def generate_industry_linkage(parsed: dict, bundle: dict) -> dict:
    """Return directed graph suitable for downstream cluster / network viz."""
    try:
        return _generate_industry_linkage_inner(parsed, bundle)
    except Exception:
        return _linkage_fallback(parsed)


def _generate_industry_linkage_inner(parsed: dict, bundle: dict) -> dict:
    sc_b = bundle.get("scenarios") or []
    compact_sc = []
    for s in sc_b:
        if not isinstance(s, dict):
            continue
        compact_sc.append({
            "id": str(s.get("id", "")),
            "name": s.get("name", ""),
            "archetype": s.get("archetype", ""),
            "summary": (s.get("summary") or "")[:700],
            "impacts": (s.get("impacts") or [])[:10],
        })
    syn = bundle.get("synthesis") or {}
    prompt = f"""You map how industries transmit shocks to each other (supply chains, regulation, capex cycles,
skills/labor mobility, commodity inputs, adoption S-curves). The question is directional: IF sector A undergoes stress
OR acceleration, WHICH other sectors materially feel it and through what coupling?

Industry briefing (parsed scope):
{json.dumps(parsed, ensure_ascii=False)[:4500]}

Scenario set for this industry trajectory (alternative futures — use for causal imagination, not citations):
{json.dumps(compact_sc, ensure_ascii=False)[:9500]}

Synthesis excerpts:
comparison: {(syn.get("scenario_comparison") or "")[:2200]}
blind_spots: {json.dumps(syn.get("shared_blind_spots") or [], ensure_ascii=False)}

Return ONLY valid JSON:
{{
  "narrative_summary": "2-4 sentences readable by a VC: what linkage pattern matters for THIS topic",
  "nodes": [
    {{"id": "slug-lowercase-dash", "label": "≤40 char human sector name", "role": "focal | upstream | downstream | adjacent | regulation | macro"}}
  ],
  "edges": [
    {{
      "from_id": "source-node-id",
      "to_id": "target-node-id",
      "strength": 35-95,
      "mechanism": "≤140 chars — concrete transmission channel when A moves, B reacts"
    }}
  ]
}}

Rules:
- Exactly ONE node MUST have role "focal" (the industry under diligence). Use lowercase slug ids matching [a-z0-9-]+.
- Aim for 6-12 nodes unless the briefing is niche (then fewer but never empty focal).
- 8-22 directed edges reflecting realistic knock-on propagation (avoid isolated pairs).
- Prefer edges that disagree across scenarios — you may annotate mechanism with uncertainty where useful.
"""

    raw = complete_user_text(
        prompt,
        system="Respond with one JSON object only. No markdown fences.",
        temperature=0.32,
    )
    try:
        data = json.loads(strip_json_fences(raw))
    except json.JSONDecodeError:
        return _linkage_fallback(parsed)

    nodes = data.get("nodes") if isinstance(data.get("nodes"), list) else []
    edges = data.get("edges") if isinstance(data.get("edges"), list) else []
    if not nodes or not any(
        isinstance(n, dict) and str(n.get("role", "")).lower() == "focal" for n in nodes
    ):
        return _linkage_fallback(parsed)

    def _nid(n: dict) -> str | None:
        if not isinstance(n, dict):
            return None
        i = n.get("id")
        return str(i).strip() if i else None

    clean_nodes = []
    seen_ids = set()
    for n in nodes[:14]:
        if not isinstance(n, dict):
            continue
        nid = _nid(n) or _slug(str(n.get("label", "x")))
        if nid in seen_ids:
            nid = nid + "-" + str(len(seen_ids))
        seen_ids.add(nid)
        clean_nodes.append({
            "id": nid,
            "label": str(n.get("label", nid))[:48],
            "role": str(n.get("role", "adjacent"))[:24],
        })
    nid_set = {n["id"] for n in clean_nodes}
    clean_edges = []
    for e in edges[:36]:
        if not isinstance(e, dict):
            continue
        frm = str(e.get("from_id", "")).strip()
        to = str(e.get("to_id", "")).strip()
        if frm not in nid_set or to not in nid_set or frm == to:
            continue
        try:
            st = float(e.get("strength", 55))
        except (TypeError, ValueError):
            st = 55.0
        st = max(12.0, min(98.0, st))
        clean_edges.append({
            "from_id": frm,
            "to_id": to,
            "strength": round(st, 1),
            "mechanism": str(e.get("mechanism", ""))[:200],
        })
    narrative = str(data.get("narrative_summary", ""))[:800]
    if not clean_edges:
        return _linkage_fallback(parsed)
    return {
        "narrative_summary": narrative,
        "nodes": clean_nodes,
        "edges": clean_edges,
        "fallback": False,
    }
