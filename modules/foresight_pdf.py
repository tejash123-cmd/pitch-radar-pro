import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

C_TEAL = colors.HexColor("#7c3aed")
C_MUTED = colors.HexColor("#6b7280")
C_TEXT = colors.HexColor("#374151")
C_GRAY1 = colors.HexColor("#f9fafb")
C_GRAY3 = colors.HexColor("#e5e7eb")
C_WHITE = colors.white


def _e(text):
    if text is None:
        text = ""
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _styles():
    return {
        "title": ParagraphStyle("title", fontSize=22, textColor=C_TEAL,
                                fontName="Helvetica-Bold", spaceAfter=4),
        "sub": ParagraphStyle("sub", fontSize=10, textColor=C_MUTED, spaceAfter=12),
        "h1": ParagraphStyle("h1", fontSize=13, textColor=C_TEAL,
                             fontName="Helvetica-Bold", spaceBefore=16, spaceAfter=6),
        "body": ParagraphStyle("body", fontSize=9, textColor=C_TEXT, leading=13, spaceAfter=4),
        "small": ParagraphStyle("small", fontSize=8, textColor=C_MUTED, leading=11),
    }


def generate_foresight_pdf(run: dict) -> io.BytesIO:
    bundle = {**(run.get("bundle") or {}), **(run.get("modified_bundle") or {})}
    parsed = run.get("parsed") or {}
    lit = run.get("literature") or {}
    tasks = run.get("tasks") or []

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=2 * cm, rightMargin=2 * cm,
                            topMargin=2 * cm, bottomMargin=2 * cm)
    s = _styles()
    story = [
        Paragraph("VC technology diligence memo", s["title"]),
        Paragraph("Industry scenarios vs startup resilience", s["sub"]),
        HRFlowable(width="100%", thickness=2, color=C_TEAL),
        Spacer(1, 0.3 * cm),
        Paragraph(_e(run.get("briefing", "")), s["body"]),
        Spacer(1, 0.15 * cm),
        Paragraph(
            f"<b>Domain:</b> {_e(parsed.get('domain', '-'))} &nbsp;|&nbsp; "
            f"<b>Run:</b> #{_e(run.get('id', '-'))} &nbsp;|&nbsp; "
            f"<b>Date:</b> {datetime.utcnow().strftime('%Y-%m-%d')}",
            s["body"],
        ),
        Spacer(1, 0.25 * cm),
    ]

    cov = lit.get("coverage") or {}
    if cov:
        story.append(Paragraph(
            f"<b>Literature coverage:</b> {_e(cov.get('coverage_score', '?'))}/100 — "
            f"{_e(cov.get('coverage_status',''))}",
            s["body"],
        ))
        story.append(Paragraph(_e(cov.get("assessment", "")), s["small"]))

    comp = [["Field", "Value"]]
    for label, key in [
        ("Focal question", "focal_question"),
        ("Technology scope", "technology_scope"),
        ("Horizon (years)", "time_horizon_years"),
        ("Stakeholders", "stakeholder_lens"),
    ]:
        v = parsed.get(key, "-")
        if key == "time_horizon_years" and v != "-":
            v = str(v)
        comp.append([label, str(v)])

    t = Table([[_e(a), _e(b)] for a, b in comp], colWidths=[4 * cm, 13 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), C_WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_GRAY1]),
        ("GRID", (0, 0), (-1, -1), 0.4, C_GRAY3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t)
    story.append(PageBreak())

    traj = lit.get("trajectory") or {}
    st_tr = traj.get("statistics") or {}
    syn_tr = traj.get("synthesis") or {}
    if st_tr.get("n_papers"):
        story.append(Paragraph("Technology trajectory cues", s["h1"]))
        if syn_tr.get("note"):
            story.append(Paragraph(_e(syn_tr["note"]), s["small"]))
        story.append(
            Paragraph(
                _e(
                    f"Corpus signals: {st_tr.get('n_papers')} papers, "
                    f"overlap mean {st_tr.get('mean_keyword_overlap_similarity')}/100, "
                    f"diversity {st_tr.get('source_mix_richness_0_100')}/100, "
                    f"full-text {(float(st_tr.get('full_text_fraction') or 0.0))*100:.0f}% of items."
                ),
                s["small"],
            )
        )
        dec = st_tr.get("papers_per_decade") or {}
        if dec:
            parts = sorted(dec.items())
            story.append(
                Paragraph(
                    _e("Publication mix by decade: " + "; ".join(f"{k}→{v}" for k, v in parts)),
                    s["small"],
                )
            )
        lift = st_tr.get("emerging_lexical_signals") or []
        if lift:
            story.append(
                Paragraph(
                    _e("Terms relatively enriched in newer vs older halves: " + ", ".join(lift[:26])),
                    s["small"],
                )
            )
        for wave in syn_tr.get("successive_waves") or []:
            title = wave.get("era_label") or "Wave"
            story.append(Paragraph(_e(f"<b>{title}</b>"), s["body"]))
            dns = wave.get("dominant_form_factors_or_tech") or []
            if dns:
                story.append(Paragraph(_e("Technologies/forms: " + ", ".join(dns)), s["small"]))
            story.append(Paragraph(_e(wave.get("why_shift_happened", "")), s["small"]))
        for drv in syn_tr.get("drivers_of_transition") or []:
            story.append(Paragraph(_e(f"Driver: {drv}"), s["small"]))
        if syn_tr.get("current_trajectory_hypothesis"):
            story.append(
                Paragraph(
                    "<b>Consolidating trajectory (hypothesis)</b>",
                    s["body"]))
            story.append(
                Paragraph(_e(syn_tr["current_trajectory_hypothesis"]), s["small"]))
        if syn_tr.get("scenario_divergence_hook"):
            story.append(
                Paragraph("<b>Divergence hook for futures</b>", s["body"]))
            story.append(Paragraph(_e(syn_tr["scenario_divergence_hook"]), s["small"]))
        story.append(Spacer(1, 0.22 * cm))

    basis = bundle.get("literature_basis") or []
    if basis:
        story.append(Paragraph("Papers informing scenarios (in-text [n] references)", s["h1"]))
        for b in basis:
            ref = _e(b.get("ref", ""))
            title = _e(b.get("title", ""))
            meta = f"{_e(b.get('authors', ''))} ({_e(str(b.get('year', '')))}) — {_e(b.get('source', ''))}"
            story.append(Paragraph(f"<b>{ref}</b> {title}", s["body"]))
            story.append(Paragraph(meta, s["small"]))
        story.append(Spacer(1, 0.2 * cm))

    scenarios = bundle.get("scenarios") or []
    for sc in scenarios:
        story.append(Paragraph(_e(sc.get("name", "Scenario")), s["h1"]))
        meta = (
            f"{_e(sc.get('archetype',''))} &middot; {_e(sc.get('probability_class',''))} "
            f"&middot; id {_e(sc.get('id',''))}"
        )
        story.append(Paragraph(meta, s["small"]))
        refs = sc.get("literature_refs") or []
        if refs:
            story.append(Paragraph(_e(f"Anchors: {', '.join(refs)}"), s["small"]))
        story.append(Paragraph(_e(sc.get("summary", "")), s["body"]))
        story.append(Paragraph("<b>Narrative</b>", s["body"]))
        story.append(Paragraph(_e(sc.get("narrative", "")), s["body"]))
        val = sc.get("validation") or {}
        story.append(Paragraph("<b>Validation</b>", s["body"]))
        story.append(Paragraph(
            f"Confidence {_e(val.get('confidence_score','?'))}/100 — "
            f"{_e(val.get('confidence_rationale',''))}",
            s["small"]))
        for a in val.get("assumptions") or []:
            story.append(Paragraph(f"&bull; {_e(a)}", s["body"]))
        for ft in val.get("falsification_tests") or []:
            story.append(Paragraph(
                f"<i>{_e(ft.get('test_name',''))}</i>: {_e(ft.get('what_would_disprove_scenario',''))}",
                s["small"]))
        story.append(Spacer(1, 0.2 * cm))

    synth = bundle.get("synthesis") or {}
    if synth:
        story.append(PageBreak())
        story.append(Paragraph("Cross-scenario synthesis", s["h1"]))
        sn = synth.get("sources_named") or []
        if sn:
            story.append(Paragraph("<b>Named literature in analysis</b>", s["body"]))
            for item in sn:
                lab = _e(item.get("reference_label", ""))
                frag = _e(item.get("verbatim_title_fragment", ""))
                note = _e(item.get("contribution_to_foresight", ""))
                story.append(Paragraph(f"{lab} <i>{frag}</i> — {note}", s["small"]))
            story.append(Spacer(1, 0.15 * cm))
        story.append(Paragraph(_e(synth.get("scenario_comparison", "")), s["body"]))
        gates = synth.get("decision_gates") or []
        for g in gates:
            story.append(Paragraph(
                f"<b>{_e(g.get('gate',''))}</b> — by {_e(g.get('by_when',''))}: {_e(g.get('evidence_needed',''))}",
                s["body"]))
        story.append(Paragraph(_e(synth.get("portfolio_recommendation", "")), s["body"]))

    sf = bundle.get("startup_future_fit") or {}
    if sf and isinstance(sf, dict):
        exe = sf.get("executive_summary_for_partner") or sf.get("error")
        if exe:
            story.append(PageBreak())
            story.append(Paragraph("Startup survivability vs each future", s["h1"]))
            story.append(Paragraph(_e(exe), s["body"]))
            lim = sf.get("confidence_and_evidence_limits")
            if lim:
                story.append(Paragraph(_e(f"<b>Evidence limits</b>: {lim}"), s["small"]))
            rows = sf.get("likely_outcome_per_scenario") or []
            for row in rows:
                nm = row.get("scenario_name_echo") or row.get("scenario_id") or ""
                story.append(
                    Paragraph(
                        _e(f"<b>{row.get('scenario_id','')}</b> {nm} — {row.get('resilience_rating','')}"),
                        s["body"]))
                for k in ("what_must_stay_true", "what_breaks_or_displaces_them", "concrete_changes_to_pitch_or_product"):
                    for item in row.get(k) or []:
                        story.append(Paragraph(_e(f"&bull; {item}"), s["small"]))
            for lst_name, attr in (
                ("Cross-cutting risks", "cross_cutting_risk_themes"),
                ("Questions for next founder meeting", "due_diligence_questions_next_meeting"),
                ("Kill/pause signals", "kill_or_pause_signals_watchlist"),
            ):
                items = sf.get(attr) or []
                if items:
                    story.append(Paragraph(f"<b>{lst_name}</b>", s["body"]))
                    for it in items:
                        story.append(Paragraph(_e(f"&bull; {it}"), s["small"]))

    papers = [
        p for p in (lit.get("papers") or [])
        if (p.get("source") or "") in ("Semantic Scholar", "arXiv")
    ]
    if papers:
        story.append(PageBreak())
        story.append(Paragraph("Sources consulted", s["h1"]))
        for i, p in enumerate(papers[:14]):
            story.append(Paragraph(f"{i+1}. {_e(p.get('title',''))}", s["body"]))
            story.append(Paragraph(
                f"   {_e(p.get('authors',''))} ({_e(str(p.get('year','')))}) — {_e(p.get('source',''))}",
                s["small"]))

    if tasks:
        story.append(PageBreak())
        story.append(Paragraph("Tasks", s["h1"]))
        td = [["Task", "Assignee", "Status"]]
        for tsk in tasks:
            td.append([
                _e(tsk.get("title", "")),
                _e(tsk.get("assigned_to_name", "")),
                _e(tsk.get("status", "")),
            ])
        tt = Table(td, colWidths=[8 * cm, 4 * cm, 4 * cm], repeatRows=1)
        tt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), C_TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), C_WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, C_GRAY1]),
            ("GRID", (0, 0), (-1, -1), 0.4, C_GRAY3),
        ]))
        story.append(tt)

    doc.build(story)
    buf.seek(0)
    return buf
