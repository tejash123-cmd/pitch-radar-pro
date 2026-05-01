"""
Full-text fetcher for research papers.
Supports: arXiv (HTML), Europe PMC (JATS XML), Semantic Scholar (open-access PDF via HTML)
Returns cleaned plain text capped at ~12,000 chars to fit in LLM context.
"""
import re
import requests
from bs4 import BeautifulSoup

MAX_CHARS = 12000   # per paper sent to Gemini
TIMEOUT   = 18


def fetch_full_text(paper: dict) -> str:
    """
    Try to fetch the full text of a paper.
    Returns cleaned text string, or "" if unavailable.
    Also sets paper["full_text_source"] describing what was fetched.
    """
    source = paper.get("source", "")
    url    = paper.get("url", "")

    text = ""
    label = ""

    if source == "arXiv" and url:
        text, label = _arxiv(url)

    elif source == "Europe PMC":
        text, label = _europepmc(paper)

    elif source == "Semantic Scholar" and url:
        text, label = _semantic_scholar(url)

    elif source == "PubMed" and url:
        # Try PMC full text via Europe PMC API using the PubMed ID
        pmid = url.rstrip("/").split("/")[-1]
        text, label = _pubmed_via_europepmc(pmid)

    if text:
        paper["full_text_available"] = True
        paper["full_text_source"]    = label
        paper["full_text"]           = text[:MAX_CHARS]
    else:
        paper["full_text_available"] = False
        paper["full_text_source"]    = "abstract_only"
        paper["full_text"]           = paper.get("abstract", "")

    return paper["full_text"]


# ── arXiv ─────────────────────────────────────────────────────
def _arxiv(url: str):
    """Fetch arXiv paper HTML (LaTeXML rendering).
    URL is like https://arxiv.org/abs/2301.12345 → fetch /html/2301.12345
    """
    arxiv_id = _extract_arxiv_id(url)
    if not arxiv_id:
        return "", ""
    html_url = f"https://arxiv.org/html/{arxiv_id}"
    try:
        r = requests.get(html_url, timeout=TIMEOUT,
                         headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200:
            return "", ""
        soup = BeautifulSoup(r.text, "lxml")
        # Remove nav, header, scripts
        for tag in soup(["script", "style", "nav", "header", "footer",
                         "figure", "table", ".ltx_bibliography"]):
            tag.decompose()
        # Get main article text
        article = soup.find("article") or soup.find("div", class_="ltx_document")
        if not article:
            article = soup
        text = _clean(article.get_text(separator="\n"))
        return text, f"arXiv HTML ({arxiv_id})"
    except Exception:
        return "", ""


def _extract_arxiv_id(url: str) -> str:
    m = re.search(r"arxiv\.org/(?:abs|html|pdf)/([0-9]{4}\.[0-9]+(?:v\d+)?)", url)
    return m.group(1) if m else ""


# ── Europe PMC ────────────────────────────────────────────────
def _europepmc(paper: dict):
    """Use JATS XML full-text API. Works for PMC open-access articles."""
    # Try to get PMC ID from the URL
    url  = paper.get("url", "")
    pmid = None

    # URL is like https://europepmc.org/article/MED/12345678
    m = re.search(r"/article/MED/(\d+)", url)
    if m:
        pmid = m.group(1)

    if not pmid:
        # Fall back to searching by title to get PMCID
        return "", ""

    # First get the PMCID from PubMed ID
    try:
        search = requests.get(
            "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
            params={"query": f"EXT_ID:{pmid} AND SRC:MED",
                    "format": "json", "resultType": "core"},
            timeout=TIMEOUT,
        )
        results = search.json().get("resultList", {}).get("result", [])
        if not results:
            return "", ""
        pmcid = results[0].get("pmcid", "")
        if not pmcid:
            return "", ""
    except Exception:
        return "", ""

    try:
        r = requests.get(
            f"https://www.ebi.ac.uk/europepmc/webservices/rest/{pmcid}/fullTextXML",
            timeout=TIMEOUT,
        )
        if r.status_code != 200:
            return "", ""
        soup = BeautifulSoup(r.text, "lxml-xml")
        # Extract body sections
        body = soup.find("body")
        if not body:
            return "", ""
        # Remove references and tables
        for tag in body(["ref-list", "table-wrap", "fig"]):
            tag.decompose()
        text = _clean(body.get_text(separator="\n"))
        return text, f"Europe PMC full text ({pmcid})"
    except Exception:
        return "", ""


# ── PubMed via Europe PMC ─────────────────────────────────────
def _pubmed_via_europepmc(pmid: str):
    """Attempt to get PMC full text for a PubMed ID."""
    return _europepmc({"url": f"https://europepmc.org/article/MED/{pmid}"})


# ── Semantic Scholar ──────────────────────────────────────────
def _semantic_scholar(url: str):
    """
    Semantic Scholar paper pages sometimes have an open-access PDF link.
    We fetch the abstract page and grab the extended abstract text.
    """
    try:
        r = requests.get(url, timeout=TIMEOUT,
                         headers={"User-Agent": "Mozilla/5.0"})
        if r.status_code != 200:
            return "", ""
        soup = BeautifulSoup(r.text, "lxml")
        # Grab abstract block
        abstract_div = soup.find("div", {"data-test-id": "paper-abstract"})
        if abstract_div:
            text = _clean(abstract_div.get_text(separator="\n"))
            return text, "Semantic Scholar abstract page"
        return "", ""
    except Exception:
        return "", ""


# ── Text cleanup ──────────────────────────────────────────────
def _clean(text: str) -> str:
    """Normalize whitespace, remove excessive blank lines."""
    lines = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            lines.append(line)
    text = "\n".join(lines)
    # Collapse 3+ blank lines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
