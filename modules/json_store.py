"""Thread-safe JSON persistence under data/store.json (no external database)."""
from __future__ import annotations

import copy
import json
import threading
from pathlib import Path
from typing import Any, Callable

_lock = threading.RLock()
_ROOT = Path(__file__).resolve().parent.parent / "data"
_STORE_PATH = _ROOT / "store.json"

_DEFAULT: dict[str, Any] = {
    "users": [],
    "teams": [],
    "team_members": [],
    "foresight_runs": [],
    "foresight_tasks": [],
    "foresight_feedback": [],
    "config": {},
}


def _ensure_dir() -> None:
    _ROOT.mkdir(parents=True, exist_ok=True)


def _normalize(raw: dict) -> dict:
    out = copy.deepcopy(_DEFAULT)
    for k in out:
        if k in raw and isinstance(raw[k], type(out[k])):
            out[k] = raw[k]
    if isinstance(raw.get("config"), dict):
        out["config"] = dict(raw["config"])
    return out


def _load_unlocked() -> dict:
    _ensure_dir()
    if not _STORE_PATH.exists():
        return copy.deepcopy(_DEFAULT)
    with open(_STORE_PATH, encoding="utf-8") as f:
        return _normalize(json.load(f))


def _sanitize_for_json(obj):  # noqa: ANN001
    """Strip NaN/inf and other non-JSON-friendly values so store.json stays loadable everywhere."""
    import math

    if obj is None or isinstance(obj, (str, bool)):
        return obj
    if isinstance(obj, float):
        return obj if math.isfinite(obj) else None
    if isinstance(obj, int) and not isinstance(obj, bool):
        return obj
    if isinstance(obj, dict):
        return {str(k): _sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_for_json(x) for x in obj]
    return str(obj)


def _save_unlocked(data: dict) -> None:
    _ensure_dir()
    tmp = _STORE_PATH.with_suffix(".tmp")
    safe = _sanitize_for_json(data)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(safe, f, indent=2, ensure_ascii=False, allow_nan=False)
        f.write("\n")
    tmp.replace(_STORE_PATH)


def transaction(fn: Callable[[dict], Any]) -> Any:
    """Load store, run fn(mutating data in place), save. Returns fn's return value."""
    with _lock:
        data = _load_unlocked()
        result = fn(data)
        _save_unlocked(data)
        return result


def snapshot() -> dict:
    """Read-only copy of the whole store (consistent under lock)."""
    with _lock:
        return copy.deepcopy(_load_unlocked())


def config_get(key: str) -> str:
    with _lock:
        data = _load_unlocked()
        v = (data.get("config") or {}).get(key, "")
        return (v if isinstance(v, str) else "") or ""


def config_set(key: str, value: str) -> None:
    def _mut(d: dict):
        d.setdefault("config", {})
        d["config"][key] = value or ""

    transaction(_mut)
