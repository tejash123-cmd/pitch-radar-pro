"""OpenRouter (OpenAI-compatible) chat completions."""
from __future__ import annotations

import json
import os
from typing import Any

import requests

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

_DEFAULT_MODEL = "poolside/laguna-xs.2:free"


def _store_get(key: str) -> str:
    try:
        from modules.json_store import config_get as _cg

        return (_cg(key) or "").strip()
    except Exception:
        return ""


def model_id() -> str:
    mid = (
        os.environ.get("OPENROUTER_MODEL", "").strip()
        or _store_get("openrouter_model")
        or _DEFAULT_MODEL
    )
    return mid


def api_key() -> str:
    k = (os.environ.get("OPENROUTER_API_KEY", "") or "").strip()
    if k:
        return k
    return _store_get("openrouter_api_key")


def strip_json_fences(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```"):
        chunks = text.split("```")
        if len(chunks) >= 2:
            inner = chunks[1]
            if inner.lstrip().startswith("json"):
                inner = inner.lstrip()[4:].lstrip()
            return inner.strip()
    return text


def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.35,
    max_tokens: int = 8192,
) -> str:
    key = api_key()
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    # OpenRouter expects standard Referer header (some stacks use HTTP-Referer in docs).
    referer = os.environ.get("OPENROUTER_HTTP_REFERER", "http://127.0.0.1:8090")
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Referer": referer,
        "HTTP-Referer": referer,
        "X-Title": os.environ.get("OPENROUTER_APP_TITLE", "Technology Foresight AI"),
    }

    payload: dict[str, Any] = {
        "model": model_id(),
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=180)
    try:
        data = resp.json()
    except json.JSONDecodeError as e:
        raise RuntimeError(f"OpenRouter: invalid JSON ({resp.status_code}): {resp.text[:400]}") from e

    if not resp.ok:
        err = data.get("error") if isinstance(data, dict) else None
        detail = err if err else data
        if resp.status_code == 401:
            raise RuntimeError(
                "OpenRouter HTTP 401 — check OPENROUTER_API_KEY in `.env`, "
                "or paste the key under Settings OR in `data/store.json` → config.openrouter_api_key. "
                f"Raw: {detail}"
            )
        if resp.status_code == 429:
            msg = ""
            if isinstance(detail, dict):
                msg = str(detail.get("message") or "").strip()
            if not msg:
                msg = "OpenRouter rate limit reached for the current model/key."
            raise RuntimeError(
                f"OpenRouter rate limit exceeded (HTTP 429). {msg} "
                "Wait for reset, add credits, change model, or configure GEMINI_API_KEY."
            )
        raise RuntimeError(f"OpenRouter HTTP {resp.status_code}: {detail}")

    choices = data.get("choices") or []
    if not choices:
        raise RuntimeError(f"OpenRouter: no choices in response: {data!r}")

    msg = choices[0].get("message") or {}
    content = msg.get("content")
    if isinstance(content, list):
        # Some models return structured content blocks
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text") or "")
        content = "".join(parts)
    if not content:
        raise RuntimeError(f"OpenRouter: empty assistant content: {data!r}")

    return str(content).strip()


def complete_user_text(
    user_text: str,
    *,
    system: str | None = None,
    temperature: float = 0.3,
) -> str:
    msgs: list[dict[str, str]] = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": user_text})
    return chat_completion(msgs, temperature=temperature)
