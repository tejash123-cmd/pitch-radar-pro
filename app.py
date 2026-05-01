import os
import uuid
from functools import wraps
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, send_file, make_response
from flask_cors import CORS

# Make .env authoritative for this app process, even if older shell env vars exist.
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

app = Flask(__name__)
CORS(app, supports_credentials=True)

from modules.briefing_parser     import parse_briefing
from modules.signal_search       import search_signals
from modules.scenario_generator  import generate_foresight_bundle
from modules.trajectory_analysis import (
    analyze_trajectory_bundle,
    apply_statistical_confidence_to_bundle,
)
from modules.foresight_store      import save_run, get_all_runs
from modules.foresight_chat       import chat_with_foresight
from modules.auth_manager import create_user, verify_user, get_by_id as get_user
from modules.deck_ingestion       import (
    build_diligence_dossier,
    dossier_stub_for_store,
    extract_deck_text,
    fetch_website_text,
    truncate_for_prompt,
)
from modules.startup_fit          import generate_startup_future_fit
from modules.industry_linkage      import generate_industry_linkage
from modules.foresight_pdf       import generate_foresight_pdf
from modules.json_store          import config_get as _store_get, config_set as _store_set
from modules.llm_client          import llm_ready
from modules import sessions


def _config_get(key: str) -> str:
    return _store_get(key) or ""


def _config_set(key: str, value: str):
    _store_set(key, value or "")


DEFAULT_OPENROUTER_MODEL = "poolside/laguna-xs.2:free"
DEFAULT_GEMINI_MODEL = "gemini-2.0-flash"


def _openrouter_key() -> str:
    return (os.environ.get("OPENROUTER_API_KEY", "").strip()
            or _config_get("openrouter_api_key"))


def _openrouter_model_slug() -> str:
    return (os.environ.get("OPENROUTER_MODEL", "").strip()
            or _config_get("openrouter_model").strip()
            or DEFAULT_OPENROUTER_MODEL)


def _gemini_key_for_status() -> str:
    """Non-empty iff Gemini API key is available (env or store)."""
    return (os.environ.get("GEMINI_API_KEY", "").strip()
            or _config_get("gemini_api_key"))


def _gemini_model_for_status() -> str:
    return (os.environ.get("GEMINI_MODEL", "").strip()
            or _config_get("gemini_model").strip()
            or DEFAULT_GEMINI_MODEL)


def _ensure_llm_env():
    """Hydrate env from disk config so libs that read os.environ see keys."""
    if not os.environ.get("GEMINI_API_KEY", "").strip():
        k = _config_get("gemini_api_key")
        if k:
            os.environ["GEMINI_API_KEY"] = k
    if not os.environ.get("GEMINI_MODEL", "").strip():
        m = _config_get("gemini_model").strip()
        if m:
            os.environ["GEMINI_MODEL"] = m
    if not os.environ.get("OPENROUTER_API_KEY", "").strip():
        k = _config_get("openrouter_api_key")
        if k:
            os.environ["OPENROUTER_API_KEY"] = k
    if not os.environ.get("OPENROUTER_MODEL", "").strip():
        m = _config_get("openrouter_model").strip()
        if m:
            os.environ["OPENROUTER_MODEL"] = m


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not sessions.current_user_id():
            return jsonify({"error": "Authentication required",
                            "code": "AUTH_REQUIRED"}), 401
        return f(*args, **kwargs)
    return decorated


def current_user() -> dict | None:
    uid = sessions.current_user_id()
    return get_user(uid) if uid else None


def _risk_level_from_score(value: float) -> str:
    if value >= 7.5:
        return "low"
    if value >= 5.0:
        return "medium"
    return "high"


def _friendly_llm_error(err: Exception | str) -> str:
    text = str(err or "").strip()
    if "OpenRouter rate limit exceeded" in text or "HTTP 429" in text:
        return (
            "LLM rate limit exceeded on OpenRouter. Wait for quota reset, add credits, "
            "switch to a paid model, or configure GEMINI_API_KEY as fallback."
        )
    return text[:300] if text else "Unknown LLM processing error."


def _run_foresight_pipeline(
    deck_name_raw: str,
    deck_bytes: bytes,
    meeting_notes: str = "",
    website_url: str = "",
    extra_context: str = "",
):
    if not llm_ready():
        raise ValueError(
            "No LLM key set. Add GEMINI_API_KEY (Gemini 2.0 Flash) or OPENROUTER_API_KEY in `.env`, or paste in Settings."
        )

    if not deck_bytes:
        raise ValueError("Uploaded deck is empty.")

    try:
        deck_label, deck_text = extract_deck_text(deck_name_raw, deck_bytes)
    except ValueError as e:
        raise ValueError(str(e)) from e
    except Exception as e:
        raise ValueError(f"Deck read error: {e}") from e

    if len(deck_text.strip()) < 80:
        raise ValueError(
            "Too little extractable text in the deck. Try OCR PDF exports or slides with real text."
        )

    web_text = ""
    web_warn = ""
    if website_url:
        web_text, web_warn = fetch_website_text(website_url)

    dossier_full = build_diligence_dossier(
        deck_filename=deck_name_raw,
        deck_inner_label=deck_label,
        deck_raw_text=deck_text,
        meeting_notes=meeting_notes,
        website_url=website_url,
        website_text=web_text,
        extra_context=extra_context,
        website_note=web_warn or "",
    )
    dossier_for_parse = truncate_for_prompt(dossier_full, 45_000)
    parsed = parse_briefing(dossier_for_parse)
    literature = search_signals(dossier_full, parsed.get("keywords", []))
    literature["diligence_context"] = dossier_stub_for_store(dossier_full, deck_name_raw)
    if website_url:
        literature["diligence_context"]["website_url"] = website_url
        if web_warn:
            literature["diligence_context"]["website_fetch_note"] = web_warn

    traj_pkg = analyze_trajectory_bundle(
        dossier_full,
        parsed.get("keywords") or [],
        literature["papers"],
        literature.get("coverage"),
    )
    literature["trajectory"] = traj_pkg
    bundle = generate_foresight_bundle(
        parsed,
        literature["papers"],
        [],
        trajectory=traj_pkg,
    )
    apply_statistical_confidence_to_bundle(bundle, literature["papers"], traj_pkg)

    try:
        bundle["industry_linkage"] = generate_industry_linkage(parsed, bundle)
    except Exception as link_err:
        bundle["industry_linkage"] = {
            "narrative_summary": f"Industry linkage inference skipped: {link_err}",
            "nodes": [{"id": "focal", "label": parsed.get("domain") or "Focal sector", "role": "focal"}],
            "edges": [],
            "fallback": True,
        }

    try:
        bundle["startup_future_fit"] = generate_startup_future_fit(
            parsed,
            bundle,
            truncate_for_prompt(dossier_full, 28_000),
        )
    except Exception as sf_err:
        clean_err = _friendly_llm_error(sf_err)
        bundle["startup_future_fit"] = {
            "executive_summary_for_partner": f"Startup fit synthesis paused: {clean_err}",
            "likely_outcome_per_scenario": [],
            "cross_cutting_risk_themes": [],
            "due_diligence_questions_next_meeting": [],
            "kill_or_pause_signals_watchlist": [],
            "confidence_and_evidence_limits": clean_err,
        }

    return parsed, literature, bundle, dossier_full


def _to_score_startup_response(
    startup_name: str,
    parsed: dict,
    literature: dict,
    bundle: dict,
) -> dict:
    papers = literature.get("papers") or []
    coverage = literature.get("coverage") or {}
    trajectory = literature.get("trajectory") or {}
    stats = trajectory.get("statistics") or {}
    scenarios = bundle.get("scenarios") or []
    synthesis = bundle.get("synthesis") or {}
    startup_future_fit = bundle.get("startup_future_fit") or {}

    def _f(value, default=0.0):
        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    novelty_score = _f(coverage.get("coverage_score"), 62.0)
    market_score = _f(stats.get("recent_8yr_share_of_dated"), 0.55) * 100.0
    competition_score = max(0.0, 100.0 - _f(stats.get("mean_keyword_overlap_similarity"), 40.0))
    research_score = min(100.0, _f(stats.get("n_papers"), 0.0) * 16.67)
    patent_score = min(100.0, _f(stats.get("source_mix_richness_0_100"), 45.0))

    fit_conf = _f(startup_future_fit.get("fit_confidence_score"), 0.0)
    fit_score = fit_conf if fit_conf > 0 else ((novelty_score * 0.45) + (market_score * 0.35) + (research_score * 0.20))
    foresight_score = _f(startup_future_fit.get("foresight_score"), 0.0)
    if foresight_score <= 0:
        foresight_score = (novelty_score * 0.35) + (market_score * 0.35) + (research_score * 0.30)

    domain = parsed.get("domain") or parsed.get("technology_scope") or "Unknown Domain"
    summary = (
        startup_future_fit.get("executive_summary_for_partner")
        or synthesis.get("scenario_comparison")
        or (scenarios[0].get("summary") if scenarios and isinstance(scenarios[0], dict) else "")
        or "Foresight analysis completed."
    )
    evidence = []
    for idx, p in enumerate(papers[:6], start=1):
        title = (p.get("title") or f"Research signal {idx}").strip()
        evidence.append(
            {
                "source": (p.get("source") or "research").strip() or "research",
                "finding": title,
                "url": (p.get("url") or "").strip() or None,
            }
        )
    if not evidence:
        evidence.append(
            {
                "source": "foresight",
                "finding": summary[:280],
                "url": None,
            }
        )

    limitations = list(literature.get("limitations") or [])
    if not limitations:
        limitations = list(synthesis.get("shared_blind_spots") or [])
    if not limitations:
        limitations = ["Limited retrieval evidence; validate with additional diligence."]

    return {
        "startup_name": startup_name,
        "predicted_domain": domain,
        "novelty_score": round(novelty_score, 1),
        "novelty_score_10": round(novelty_score / 10.0, 1),
        "market_score": round(market_score, 1),
        "market_score_10": round(market_score / 10.0, 1),
        "competition_score": round(competition_score, 1),
        "competition_score_10": round(competition_score / 10.0, 1),
        "research_momentum_score": round(research_score, 1),
        "research_momentum_score_10": round(research_score / 10.0, 1),
        "patent_originality_score": round(patent_score, 1),
        "patent_originality_score_10": round(patent_score / 10.0, 1),
        "fit_score": round(fit_score, 1),
        "fit_score_10": round(fit_score / 10.0, 1),
        "foresight_score": round(foresight_score, 1),
        "foresight_score_10": round(foresight_score / 10.0, 1),
        "risk_level": _risk_level_from_score(foresight_score / 10.0),
        "summary": summary,
        "portfolio_check": {
            "checked": False,
            "portfolio_company_count": 0,
            "overlap_score": 0,
            "overlap_level": "none",
            "has_similar_investment": False,
            "top_matches": [],
        },
        "crm_record": {
            "recorded": False,
            "company_id": None,
            "pitch_id": None,
        },
        "evidence": evidence,
        "limitations": limitations[:8],
        "foresight_payload": {
            "parsed": parsed,
            "literature": literature,
            "bundle": bundle,
        },
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/auth/signup", methods=["POST"])
def signup():
    body = request.get_json(force=True)
    try:
        user = create_user(
            name         = body.get("name", "").strip(),
            email        = body.get("email", "").strip(),
            password     = body.get("password", ""),
            roles        = body.get("roles", []),
            organization = body.get("organization", ""),
        )
        resp = make_response(jsonify({"user": user}))
        return sessions.attach(resp, user["id"])
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@app.route("/auth/login", methods=["POST"])
def login():
    body = request.get_json(force=True)
    user = verify_user(body.get("email", ""), body.get("password", ""))
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
    resp = make_response(jsonify({"user": user}))
    return sessions.attach(resp, user["id"])


@app.route("/auth/logout", methods=["POST"])
def logout():
    resp = make_response(jsonify({"status": "logged out"}))
    return sessions.clear(resp)


@app.route("/auth/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "Not authenticated",
                        "code": "AUTH_REQUIRED"}), 401
    return jsonify({"user": user})


@app.route("/api/config", methods=["GET"])
def get_config():
    _ensure_llm_env()
    return jsonify({
        "gemini_set":       bool(_gemini_key_for_status()),
        "gemini_model":     _gemini_model_for_status(),
        "openrouter_set":   bool(_openrouter_key()),
        "openrouter_model": _openrouter_model_slug(),
        "llm_set":          llm_ready(),
    })


@app.route("/api/config", methods=["POST"])
def save_config():
    body = request.get_json(force=True)
    if body.get("gemini_api_key", "").strip():
        gk = body["gemini_api_key"].strip()
        os.environ["GEMINI_API_KEY"] = gk
        _config_set("gemini_api_key", gk)
    if body.get("gemini_model", "").strip():
        gm = body["gemini_model"].strip()
        os.environ["GEMINI_MODEL"] = gm
        _config_set("gemini_model", gm)
    if body.get("openrouter_api_key", "").strip():
        key = body["openrouter_api_key"].strip()
        os.environ["OPENROUTER_API_KEY"] = key
        _config_set("openrouter_api_key", key)
    if body.get("openrouter_model", "").strip():
        mid = body["openrouter_model"].strip()
        os.environ["OPENROUTER_MODEL"] = mid
        _config_set("openrouter_model", mid)
    return jsonify({"status": "saved"})


@app.route("/api/analyze", methods=["POST"])
@login_required
def analyze():
    _ensure_llm_env()
    if not llm_ready():
        return jsonify({
            "error": "No LLM key set. Add GEMINI_API_KEY (Gemini 2.0 Flash) "
                     "or OPENROUTER_API_KEY in `.env`, or paste in Settings.",
        }), 400

    ctype = (request.content_type or "").lower()
    if "multipart/form-data" not in ctype:
        return jsonify({
            "error": "Send multipart/form-data with required field \"deck\" (.pdf or .pptx)."
        }), 400

    deck_upload = request.files.get("deck")
    if not deck_upload or not deck_upload.filename:
        return jsonify({"error": "Upload the startup pitch deck (.pdf or .pptx)."}), 400

    deck_name_raw = deck_upload.filename.strip()
    meeting_notes = (request.form.get("meeting_notes") or "").strip()
    website_url   = (request.form.get("website_url") or "").strip()
    extra_context = (request.form.get("extra_context") or "").strip()

    deck_bytes = deck_upload.read()
    try:
        parsed, literature, bundle, dossier_full = _run_foresight_pipeline(
            deck_name_raw=deck_name_raw,
            deck_bytes=deck_bytes,
            meeting_notes=meeting_notes,
            website_url=website_url,
            extra_context=extra_context,
        )
        run_id = str(uuid.uuid4())[:8]
        save_run(run_id, dossier_full, parsed, bundle, literature,
                 owner_id=sessions.current_user_id())

        return jsonify({
            "run_id":     run_id,
            "parsed":     parsed,
            "literature": literature,
            "bundle":     bundle,
        })
    except Exception as e:
        app.logger.exception("analyze failed")
        return jsonify({"error": str(e)}), 500


@app.route("/score-startup", methods=["POST"])
def score_startup():
    _ensure_llm_env()
    ctype = (request.content_type or "").lower()
    if "multipart/form-data" not in ctype:
        return jsonify({
            "detail": "Send multipart/form-data with required field 'supporting_document' (.pdf or .pptx)."
        }), 400

    deck_upload = request.files.get("supporting_document") or request.files.get("deck")
    if not deck_upload or not deck_upload.filename:
        return jsonify({"detail": "Upload a startup deck document as supporting_document."}), 400

    startup_name = (request.form.get("startup_name") or "").strip() or Path(deck_upload.filename).stem
    meeting_notes = (request.form.get("meeting_notes") or "").strip()
    website_url = (request.form.get("website_url") or "").strip()
    extra_context = (request.form.get("description") or request.form.get("extra_context") or "").strip()

    try:
        parsed, literature, bundle, _ = _run_foresight_pipeline(
            deck_name_raw=deck_upload.filename.strip(),
            deck_bytes=deck_upload.read(),
            meeting_notes=meeting_notes,
            website_url=website_url,
            extra_context=extra_context,
        )
        payload = _to_score_startup_response(startup_name, parsed, literature, bundle)
        return jsonify(payload)
    except ValueError as e:
        return jsonify({"detail": str(e)}), 400
    except Exception as e:
        app.logger.exception("score_startup failed")
        return jsonify({"detail": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
@login_required
def chat():
    _ensure_llm_env()
    if not llm_ready():
        return jsonify({"error": "No LLM configured (Gemini or OpenRouter)."}), 400
    body     = request.get_json(force=True)
    messages = body.get("messages", [])
    context  = body.get("context", "")
    if not messages:
        return jsonify({"error": "messages required"}), 400
    try:
        return jsonify({"response": chat_with_foresight(messages, context)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/runs", methods=["GET"])
@login_required
def runs_list():
    all_r = get_all_runs()
    uid = sessions.current_user_id()
    own = [r for r in all_r if r.get("owner_id") == uid or not r.get("owner_id")]
    cov = lambda lit: (lit.get("coverage") or {}).get("coverage_score", "N/A")
    return jsonify([{
        "id":             r["id"],
        "timestamp":      r["timestamp"],
        "briefing_preview": (r["briefing"] or "")[:120],
        "domain":         r.get("parsed", {}).get("domain", "") or r.get("domain", ""),
        "coverage_score": cov(r.get("literature") or {}),
    } for r in own])


@app.route("/api/runs/<run_id>", methods=["GET"])
@login_required
def get_run(run_id):
    all_r = get_all_runs()
    run = next((r for r in all_r if r["id"] == run_id), None)
    if not run:
        return jsonify({"error": "not found"}), 404
    if run.get("modified_bundle"):
        b = dict(run.get("bundle") or {})
        for sec, data in run["modified_bundle"].items():
            b[sec] = data
        run = {**run, "bundle": b}
    return jsonify(run)


@app.route("/api/runs/<run_id>/pdf")
@login_required
def export_pdf(run_id):
    all_r = get_all_runs()
    run = next((r for r in all_r if r["id"] == run_id), None)
    if not run:
        return jsonify({"error": "not found"}), 404
    if run.get("modified_bundle"):
        b = dict(run.get("bundle") or {})
        for sec, data in run["modified_bundle"].items():
            b[sec] = data
        run = {**run, "bundle": b}
    try:
        buf = generate_foresight_pdf(run)
        return send_file(
            buf,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"vc_diligence_{run_id}.pdf",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5051))
    app.run(debug=True, threaded=True, host="0.0.0.0", port=port)
