"""Unified LLM entry: OpenRouter when OPENROUTER_API_KEY is set; else Gemini if GEMINI_API_KEY is set."""
from __future__ import annotations

import os

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from modules import openrouter
from modules.json_store import config_get


def strip_json_fences(text: str) -> str:
    return openrouter.strip_json_fences(text)


def _store(key: str) -> str:
    return (config_get(key) or "").strip()


def gemini_api_key() -> str:
    return (os.environ.get("GEMINI_API_KEY", "") or "").strip() or _store("gemini_api_key")


def gemini_model_name() -> str:
    return (
        (os.environ.get("GEMINI_MODEL", "") or "").strip()
        or _store("gemini_model").strip()
        or "gemini-2.0-flash"
    )


def prefers_openrouter() -> bool:
    return bool(openrouter.api_key())


def prefers_gemini() -> bool:
    return bool(gemini_api_key())


def _ensure_gemini():
    key = gemini_api_key()
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    genai.configure(api_key=key)


def complete_user_text(
    user_text: str,
    *,
    system: str | None = None,
    temperature: float = 0.3,
) -> str:
    if prefers_openrouter():
        return openrouter.complete_user_text(
            user_text, system=system, temperature=temperature
        )
    if prefers_gemini():
        _ensure_gemini()
        kwargs = {}
        if system:
            kwargs["system_instruction"] = system
        model = genai.GenerativeModel(gemini_model_name(), **kwargs)
        gc = GenerationConfig(temperature=temperature)
        resp = model.generate_content(user_text, generation_config=gc)
        text = (resp.text or "").strip()
        if not text:
            raise RuntimeError("Gemini returned an empty response (safety/block?)")
        return text
    raise RuntimeError(
        "No LLM configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY (env or Settings)."
    )


def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.35,
    max_tokens: int = 8192,
) -> str:
    if prefers_openrouter():
        return openrouter.chat_completion(
            messages, temperature=temperature, max_tokens=max_tokens
        )
    if prefers_gemini():
        _ensure_gemini()

        system_parts: list[str] = []
        rest: list[dict[str, str]] = []
        for m in messages:
            if (m.get("role") or "") == "system":
                system_parts.append(m.get("content") or "")
            else:
                rest.append(m)

        if not rest:
            raise RuntimeError("No non-system messages for Gemini chat")

        system_instruction = "\n\n".join(p for p in system_parts if p).strip() or None
        kw = {}
        if system_instruction:
            kw["system_instruction"] = system_instruction

        model = genai.GenerativeModel(gemini_model_name(), **kw)
        history = []
        for m in rest[:-1]:
            role = m.get("role", "user")
            gen_role = "user" if role == "user" else "model"
            history.append({"role": gen_role, "parts": [m.get("content", "")]})

        chat = model.start_chat(history=history)
        gc = GenerationConfig(temperature=temperature)
        resp = chat.send_message(rest[-1].get("content", ""), generation_config=gc)
        text = (resp.text or "").strip()
        if not text:
            raise RuntimeError("Gemini chat returned empty text")
        return text

    raise RuntimeError(
        "No LLM configured. Set OPENROUTER_API_KEY or GEMINI_API_KEY (env or Settings)."
    )


def llm_ready() -> bool:
    """True if either OpenRouter or Gemini API key is configured."""
    try:
        return prefers_openrouter() or prefers_gemini()
    except Exception:
        return False
