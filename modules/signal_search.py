import json
import xml.etree.ElementTree as ET

import requests

from modules.full_text_fetcher import fetch_full_text
from modules.llm_client import complete_user_text, strip_json_fences

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
ARXIV_URL = "https://export.arxiv.org/api/query"


# ── Semantic Scholar ───────────────────────────────────────────
def _search_semantic_scholar(query: str, limit: int = 5) -> list:
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,abstract,year,authors,url,externalIds",
    }
    try:
        r = requests.get(SEMANTIC_SCHOLAR_URL, params=params, timeout=10)
        r.raise_for_status()
        papers = []
        for p in r.json().get("data", []):
            papers.append({
                "title": p.get("title", ""),
                "abstract": (p.get("abstract") or "")[:400],
                "year": p.get("year"),
                "authors": ", ".join(a["name"] for a in (p.get("authors") or [])[:3]),
                "url": p.get("url", ""),
                "source": "Semantic Scholar",
            })
        return papers
    except Exception:
        return []


# ── arXiv ─────────────────────────────────────────────────────
def _search_arxiv(query: str, limit: int = 3) -> list:
    params = {"search_query": f"all:{query}", "start": 0, "max_results": limit}
    try:
        r = requests.get(ARXIV_URL, params=params, timeout=10)
        r.raise_for_status()
        ns = "http://www.w3.org/2005/Atom"
        root = ET.fromstring(r.text)
        papers = []
        for entry in root.findall(f"{{{ns}}}entry"):
            title = entry.findtext(f"{{{ns}}}title", "").strip()
            summary = (entry.findtext(f"{{{ns}}}summary", "") or "").strip()[:400]
            link_el = entry.find(f"{{{ns}}}link[@rel='alternate']")
            url = link_el.get("href", "") if link_el is not None else ""
            published = entry.findtext(f"{{{ns}}}published", "")[:4]
            authors = ", ".join(
                a.findtext(f"{{{ns}}}name", "")
                for a in entry.findall(f"{{{ns}}}author")[:3]
            )
            papers.append({
                "title": title,
                "abstract": summary,
                "year": published,
                "authors": authors,
                "url": url,
                "source": "arXiv",
            })
        return papers
    except Exception:
        return []


# ── Novelty assessment ────────────────────────────────────────
def _assess_coverage(briefing: str, papers: list) -> dict:
    # Build paper context: full text for top 2, abstract snippet for the rest
    paper_blocks = []
    for i, p in enumerate(papers[:8]):
        full = p.get("full_text", "")
        if full and p.get("full_text_available"):
            # Use up to 3000 chars of full text for top papers
            snippet = full[:3000]
            paper_blocks.append(
                f"[PAPER {i+1} — FULL TEXT — {p['source']}]\n"
                f"Title: {p['title']} ({p.get('year','')})\n"
                f"Authors: {p.get('authors','')}\n"
                f"Content:\n{snippet}\n"
            )
        else:
            abstract = p.get("abstract", "")[:300]
            paper_blocks.append(
                f"[PAPER {i+1} — ABSTRACT ONLY — {p['source']}]\n"
                f"Title: {p['title']} ({p.get('year','')})\n"
                f"{abstract}\n"
            )

    paper_context = "\n---\n".join(paper_blocks) if paper_blocks else "No papers found."

    prompt = f"""You are a technology foresight analyst reviewing evidence from academic and preprint sources.

Focal briefing / question: "{briefing}"

Related papers (top entries may include full text, others abstracts):
{paper_context}

Judge how densely the literature already discusses futures, constraints, or trajectories adjacent to this briefing — not lab experiment novelty, but "signal density" for foresight scenarios.
Return ONLY valid JSON:
{{
  "coverage_status": "sparse" | "moderate" | "dense",
  "coverage_score": 0-100,
  "assessment": "3-5 sentences referencing concrete themes from these papers where possible",
  "recommendation": "expand_horizons" | "stress_test_assumptions" | "narrow_focus",
  "top_references": [
    {{"title": "...", "url": "...", "year": "...", "why_relevant": "1 sentence"}}
  ]
}}

Rules:
- coverage_score high (~70-100) = many papers already map similar technology paths or impacts
- coverage_score low (~0-35) = few direct signals; scenario work should flag uncertainty explicitly
For top_references, include 1-3 papers from the list above (actual titles and URLs)."""

    label_map = {
        "sparse":   "limited published signals",
        "moderate": "mixed evidence base",
        "dense":    "rich prior discussion",
    }

    try:
        system = "You reply with JSON only for an API parser. Valid JSON object, no markdown."
        raw = complete_user_text(prompt, system=system, temperature=0.25)
        result = json.loads(strip_json_fences(raw))
        cs = result.get("coverage_status", "")
        result["coverage_label"] = label_map.get(cs, "unknown")
        return result
    except Exception:
        return {
            "coverage_status": "unknown",
            "coverage_label": "unknown",
            "coverage_score": 50,
            "assessment": "Could not assess literature coverage automatically.",
            "recommendation": "expand_horizons",
            "top_references": [],
        }


# ── Main entry point ──────────────────────────────────────────
def search_signals(briefing: str, keywords: list) -> dict:
    """Retrieve papers from Semantic Scholar and arXiv only."""

    query = " ".join(keywords[:4]) if keywords else briefing[:140]

    ss_papers = _search_semantic_scholar(query, limit=7)
    arxiv_papers = _search_arxiv(query, limit=5)

    all_papers = ss_papers + arxiv_papers

    # deduplicate by title similarity (exact title match)
    seen_titles = set()
    unique_papers = []
    for p in all_papers:
        key = p["title"].strip().lower()[:80]
        if key and key not in seen_titles:
            seen_titles.add(key)
            unique_papers.append(p)

    # Compute keyword-based similarity score for each paper
    for p in unique_papers:
        p["similarity_score"] = _compute_similarity(p, keywords, briefing)

    # Sort by similarity descending
    unique_papers.sort(key=lambda x: x.get("similarity_score", 0), reverse=True)

    # Fetch full text for top 2 most-similar papers if not already provided.
    for p in unique_papers[:2]:
        if p.get("full_text_available") and p.get("full_text"):
            continue
        fetch_full_text(p)

    coverage = _assess_coverage(briefing, unique_papers)

    sources_used = ["Semantic Scholar", "arXiv"]

    return {
        "papers": unique_papers,
        "coverage": coverage,
        "total_found": len(unique_papers),
        "sources_used": sources_used,
    }


def _compute_similarity(paper: dict, keywords: list, briefing: str) -> int:
    """Keyword overlap similarity score 0-100 between paper and briefing."""
    text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
    # Combine provided keywords + top words from briefing
    hyp_words = [w.lower().strip(".,;:()") for w in briefing.split() if len(w) > 4]
    kws = list(set([k.lower() for k in keywords] + hyp_words[:15]))
    if not kws:
        return 0
    hits = sum(1 for k in kws if k and k in text)
    score = min(100, round((hits / len(kws)) * 130))
    return score
