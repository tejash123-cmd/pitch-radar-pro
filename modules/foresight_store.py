"""Foresight runs + analyst feedback in data/store.json."""
from datetime import datetime

from modules.json_store import snapshot, transaction


def save_run(run_id: str, briefing: str, parsed: dict, bundle: dict,
             literature: dict, owner_id: str = ""):
    record = {
        "id":              run_id,
        "owner_id":        owner_id or None,
        "briefing":        briefing,
        "domain":          (parsed or {}).get("domain", "") or "",
        "parsed":          parsed or {},
        "bundle":          bundle or {},
        "literature":      literature or {},
        "modified_bundle": None,
        "bundle_modified_at": None,
        "timestamp":       datetime.utcnow().isoformat(),
    }

    def _upsert(d: dict):
        rows = d.setdefault("foresight_runs", [])
        for i, r in enumerate(rows):
            if r.get("id") == run_id:
                # preserve edits if any
                prev_m = rows[i].get("modified_bundle")
                prev_t = rows[i].get("bundle_modified_at")
                record["modified_bundle"] = prev_m
                record["bundle_modified_at"] = prev_t
                rows[i] = record
                return
        rows.append(record)

    transaction(_upsert)


def get_all_runs() -> list:
    data = snapshot()
    rows = sorted(
        list(data.get("foresight_runs", [])),
        key=lambda r: r.get("timestamp") or "",
        reverse=True,
    )
    tasks = data.get("foresight_tasks", [])
    by_run: dict[str, list] = {}
    for t in tasks:
        by_run.setdefault(t.get("run_id", ""), []).append(t)
    for r in rows:
        r["tasks"] = sorted(by_run.get(r["id"], []), key=lambda x: x.get("created_at") or "")
    return rows


def save_feedback(run_id: str, ratings: dict, corrections: dict, domain: str = ""):
    stamps = []

    def _append(d: dict):
        for section, correction_text in (corrections or {}).items():
            if correction_text and str(correction_text).strip():
                stamps.append({
                    "run_id":     run_id,
                    "domain":     domain or "",
                    "section":    section,
                    "rating":     int((ratings or {}).get(section, 3) or 3),
                    "correction": str(correction_text).strip(),
                    "timestamp":  datetime.utcnow().isoformat(),
                })
        if stamps:
            d.setdefault("foresight_feedback", []).extend(stamps)

    transaction(_append)


def get_relevant_feedback(domain: str, limit: int = 10) -> list:
    data = snapshot()
    rows = list(data.get("foresight_feedback", []))
    if domain:
        rows = [r for r in rows if (r.get("domain") or "") == domain]
    rows.sort(key=lambda r: r.get("timestamp") or "", reverse=True)
    rows = rows[:limit]
    rows.reverse()
    return rows
