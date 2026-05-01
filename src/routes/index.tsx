import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Brain, Sparkles, TrendingUp, Database, Loader2, ArrowRight, RotateCcw, Zap, Sun, Moon, Upload, Download, FileText } from "lucide-react";
import { mockAnalysis } from "@/lib/mockData";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { MemoryTab } from "@/components/dashboard/MemoryTab";
import { NoveltyTab } from "@/components/dashboard/NoveltyTab";
import { ForesightTab } from "@/components/dashboard/ForesightTab";
import { useTheme } from "@/hooks/use-theme";
import { extractPdfText } from "@/lib/pdfExtract";
import { fitExplanation, noveltyExplanation, foresightExplanation, downloadText } from "@/lib/scoreExplanations";
import { scoreStartup, type StartupAnalysisResponse } from "@/lib/api";
import { adaptAnalysisResponse } from "@/lib/analysisAdapter";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AI Investment Intelligence Engine — VC Memory, Novelty & Foresight" },
      {
        name: "description",
        content: "Turn startup notes into VC Memory, Market Novelty Analysis, and Investment Foresight. Built for venture capital teams.",
      },
    ],
  }),
});

type View = "input" | "loading" | "dashboard";
type Tab = "memory" | "novelty" | "foresight";

function Index() {
  const [view, setView] = useState<View>("input");
  const [tab, setTab] = useState<Tab>("memory");
  const { theme, toggle } = useTheme();
  const [notes, setNotes] = useState("");
  const [form, setForm] = useState({ name: "", industry: "", stage: "", geography: "" });
  const [analysisData, setAnalysisData] = useState(mockAnalysis);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [pdfStatus, setPdfStatus] = useState<{ name: string; state: "idle" | "parsing" | "done" | "error"; message?: string }>({ name: "", state: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const data = analysisData;

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfStatus({ name: file.name, state: "error", message: "Please upload a PDF file." });
      return;
    }
    setSelectedDocument(file);
    setAnalysisError("");
    setPdfStatus({ name: file.name, state: "parsing" });
    try {
      const text = await extractPdfText(file);
      if (!text) {
        setPdfStatus({ name: file.name, state: "done", message: "PDF attached. No selectable text found locally, but it will still be sent to the backend." });
        return;
      }
      setNotes((prev) => (prev ? `${prev}\n\n--- From ${file.name} ---\n${text}` : text));
      setPdfStatus({ name: file.name, state: "done", message: `Extracted ${text.length.toLocaleString()} characters` });
      setTimeout(() => document.getElementById("notes-input")?.focus(), 50);
    } catch (e) {
      setPdfStatus({
        name: file.name,
        state: "done",
        message: e instanceof Error
          ? `Local PDF extraction failed (${e.message}), but the file is still attached for backend analysis.`
          : "Local PDF extraction failed, but the file is still attached for backend analysis.",
      });
    }
  };

  const analyze = async () => {
    if (!selectedDocument) {
      setAnalysisError("Upload a PDF before running backend analysis.");
      setPdfStatus({ name: "", state: "error", message: "A PDF is required for backend scoring." });
      return;
    }

    setAnalysisError("");
    setView("loading");
    try {
      const formData = new FormData();
      formData.append("supporting_document", selectedDocument);
      if (form.name.trim()) formData.append("startup_name", form.name.trim());
      if (form.industry.trim()) formData.append("sector", form.industry.trim());
      if (form.geography.trim()) formData.append("country", form.geography.trim());
      if (notes.trim()) formData.append("meeting_notes", notes.trim());
      if (form.stage.trim() || form.geography.trim()) {
        formData.append(
          "description",
          [form.stage.trim() ? `Funding stage: ${form.stage.trim()}` : "", form.geography.trim() ? `Geography: ${form.geography.trim()}` : ""]
            .filter(Boolean)
            .join(". "),
        );
      }

      const result: StartupAnalysisResponse = await scoreStartup(formData);
      setAnalysisData(
        adaptAnalysisResponse(result, {
          name: form.name,
          industry: form.industry,
          stage: form.stage,
          geography: form.geography,
          notes,
        }),
      );
      setView("dashboard");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Startup analysis failed.");
      setView("input");
    }
  };

  const reset = () => {
    setView("input");
    setNotes("");
    setForm({ name: "", industry: "", stage: "", geography: "" });
    setTab("memory");
    setSelectedDocument(null);
    setAnalysisError("");
    setPdfStatus({ name: "", state: "idle" });
    setAnalysisData(mockAnalysis);
  };

  const loadDemo = () => {
    setNotes(
      "Met with Lena Hartmann, founder of NovaClaim AI. Berlin-based seed-stage InsurTech building AI-native claims automation for mid-market European insurers. LLM-based agentic workflows. Targeting DACH region first. Raising $3M seed. Strong technical team, ex-Allianz. Looking for product-market fit signals and customer references."
    );
    setForm({ name: "NovaClaim AI", industry: "InsurTech / AI Operations", stage: "Seed", geography: "EU (Berlin)" });
    setTimeout(() => document.getElementById("notes-input")?.focus(), 100);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-20 backdrop-blur-xl bg-background/60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-emerald)" }}>
              <Brain className="w-5 h-5 text-background" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">AI Investment Intelligence</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">VC Engine · v1</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === "dashboard" && (
              <button
                onClick={reset}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-foreground/5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
              </button>
            )}
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {view === "input" && (
          <>
            {/* Hero */}
            <section className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground/80">Built for venture capital teams</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
                <span className="gradient-text">AI Investment</span>
                <br />
                <span className="text-foreground">Intelligence Engine</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                Turn startup notes into VC Memory, Market Novelty Analysis, and Investment Foresight.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-7">
                {["Granola Notes", "Affinity CRM", "Web Research"].map((c) => (
                  <span key={c} className="text-xs px-3 py-1.5 rounded-full glass text-foreground/80">{c}</span>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => document.getElementById("notes-input")?.focus()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all hover:scale-[1.02]"
                  style={{ boxShadow: "var(--shadow-glow-emerald)" }}
                >
                  Analyze a Startup <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={loadDemo}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-foreground font-medium text-sm hover:bg-foreground/10 transition-colors"
                >
                  <Zap className="w-4 h-4" /> Load Demo Input
                </button>
              </div>
            </section>

            {/* Input card */}
            <section className="max-w-3xl mx-auto">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-lg">Startup Notes</h2>
                    <p className="text-xs text-muted-foreground">Paste raw notes — or upload a PDF and we'll extract them.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePdfUpload(f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pdfStatus.state === "parsing"}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-foreground text-xs font-medium hover:bg-foreground/10 transition-colors disabled:opacity-60"
                    >
                      {pdfStatus.state === "parsing" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {pdfStatus.state === "parsing" ? "Extracting…" : "Upload PDF"}
                    </button>
                  </div>
                </div>
                {pdfStatus.state !== "idle" && (
                  <div
                    className={`mb-3 mt-2 flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
                      pdfStatus.state === "error"
                        ? "border-[color-mix(in_oklab,var(--risk)_35%,transparent)] text-[var(--risk)] bg-[color-mix(in_oklab,var(--risk)_10%,transparent)]"
                        : pdfStatus.state === "done"
                          ? "border-[color-mix(in_oklab,var(--positive)_35%,transparent)] text-[var(--positive)] bg-[color-mix(in_oklab,var(--positive)_10%,transparent)]"
                          : "border-border text-muted-foreground bg-foreground/[0.03]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{pdfStatus.name}</span>
                    {pdfStatus.message && <span className="opacity-80">— {pdfStatus.message}</span>}
                  </div>
                )}
                {analysisError && (
                  <div className="mb-3 mt-2 rounded-lg border border-[color-mix(in_oklab,var(--risk)_35%,transparent)] bg-[color-mix(in_oklab,var(--risk)_10%,transparent)] px-3 py-2 text-xs text-[var(--risk)]">
                    {analysisError}
                  </div>
                )}
                <textarea
                  id="notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={7}
                  placeholder="Granola Notes "
                  className="mt-3 w-full rounded-xl bg-background/50 border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[
                    { k: "name", label: "Startup name" },
                    { k: "industry", label: "Industry / Sector" },
                    { k: "stage", label: "Funding stage" },
                    { k: "geography", label: "Geography" },
                  ].map((f) => (
                    <input
                      key={f.k}
                      value={form[f.k as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                      placeholder={f.label}
                      className="rounded-xl bg-background/50 border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  ))}
                </div>
                <button
                  onClick={analyze}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
                  style={{ boxShadow: "var(--shadow-glow-emerald)" }}
                >
                  Analyze Startup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          </>
        )}

        {view === "loading" && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: "var(--gradient-emerald)", opacity: 0.4 }} />
              <Loader2 className="relative w-12 h-12 text-primary animate-spin" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              Analyzing startup memory, market novelty, and future signals…
            </p>
            <p className="text-sm text-muted-foreground">Cross-referencing CRM, research, and trend data</p>
          </div>
        )}

        {view === "dashboard" && (
          <div className="space-y-6">
            {/* Title */}
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Analysis Report</div>
                <h2 className="text-2xl sm:text-3xl font-bold">{data.startup.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.startup.industry} · {data.startup.stage} · {data.startup.geography}
                </p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
              <ScoreCard
                label="Startup Fit"
                value={`${data.scores.fit}`}
                suffix="/ 10"
                accent="emerald"
                progress={data.scores.fit * 10}
                icon={<Sparkles className="w-4 h-4" />}
                reasoning="Hover to see full reasoning"
                reasoningFull={fitExplanation(data)}
                onDownloadReasoning={() => downloadText(`${data.startup.name}-fit-score.txt`, fitExplanation(data))}
              />
              <ScoreCard
                label="Novelty"
                value={`${data.scores.novelty}`}
                suffix="/ 10"
                accent="cyan"
                progress={data.scores.novelty * 10}
                icon={<Zap className="w-4 h-4" />}
                reasoning="Hover to see full reasoning"
                reasoningFull={noveltyExplanation(data)}
                onDownloadReasoning={() => downloadText(`${data.startup.name}-novelty-score.txt`, noveltyExplanation(data))}
              />
              <ScoreCard
                label="Foresight"
                value={`${data.scores.foresight}`}
                suffix="/ 10"
                accent="violet"
                progress={data.scores.foresight * 10}
                icon={<TrendingUp className="w-4 h-4" />}
                reasoning="Hover to see full reasoning"
                reasoningFull={foresightExplanation(data)}
                onDownloadReasoning={() => downloadText(`${data.startup.name}-foresight-score.txt`, foresightExplanation(data))}
              />
              <ScoreCard label="CRM Memory" value={`${data.scores.crmMatches}`} suffix="similar startups found" accent="amber" icon={<Database className="w-4 h-4" />} />
            </div>

            {/* Main content */}
            <div className="space-y-4">
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl glass-card">
                  {[
                    { k: "memory", label: "VC Memory AI", icon: Brain, color: "var(--memory)" },
                    { k: "novelty", label: "Novelty Market Analysis", icon: Sparkles, color: "var(--novelty)" },
                    { k: "foresight", label: "Foresight Market Analysis", icon: TrendingUp, color: "var(--foresight)" },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.k;
                    return (
                      <button
                        key={t.k}
                        onClick={() => setTab(t.k as Tab)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          active
                            ? "text-background"
                            : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                        }`}
                        style={active ? { background: t.color } : { color: !active ? t.color : undefined }}
                      >
                        <Icon className="w-4 h-4" style={!active ? { color: t.color } : undefined} />
                        <span className="hidden sm:inline">{t.label}</span>
                        <span className="sm:hidden">{t.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {tab === "memory" && <MemoryTab data={data.memory} dataQuality={data.inputs.confidence.dataQuality} />}
                {tab === "novelty" && <NoveltyTab data={data.novelty} score={data.scores.novelty} />}
                {tab === "foresight" && <ForesightTab data={data} />}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-5 text-center text-xs text-muted-foreground">
          AI Investment Intelligence Engine · Frontend connected to FastAPI backend
        </div>
      </footer>
    </div>
  );
}
