import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Brain, Sparkles, TrendingUp, Database, Loader2, ArrowRight, RotateCcw, Zap, Sun, Moon } from "lucide-react";
import { mockAnalysis } from "@/lib/mockData";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { MemoryTab } from "@/components/dashboard/MemoryTab";
import { NoveltyTab } from "@/components/dashboard/NoveltyTab";
import { ForesightTab } from "@/components/dashboard/ForesightTab";
import { AnalysisSidebar } from "@/components/dashboard/Sidebar";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "AI Investment Intelligence Engine — VC Memory, Novelty & Foresight" },
      {
        name: "description",
        content: "Turn startup calls into VC memory, market novelty signals, and future investment foresight. Built for venture capital teams.",
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

  const data = mockAnalysis;

  const analyze = () => {
    setView("loading");
    setTimeout(() => setView("dashboard"), 2000);
  };

  const reset = () => {
    setView("input");
    setNotes("");
    setForm({ name: "", industry: "", stage: "", geography: "" });
    setTab("memory");
  };

  const loadDemo = () => {
    setNotes(
      "Met with Lena Hartmann, founder of NovaClaim AI. Berlin-based seed-stage InsurTech building AI-native claims automation for mid-market European insurers. LLM-based agentic workflows. Targeting DACH region first. Raising $3M seed. Strong technical team, ex-Allianz. Looking for product-market fit signals and customer references."
    );
    setForm({ name: "NovaClaim AI", industry: "InsurTech / AI Operations", stage: "Seed", geography: "EU (Berlin)" });
    setTimeout(analyze, 100);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl bg-background/60">
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
                Turn startup calls into VC memory, market novelty signals, and future investment foresight.
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-foreground font-medium text-sm hover:bg-white/10 transition-colors"
                >
                  <Zap className="w-4 h-4" /> View Demo Analysis
                </button>
                <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Reset Demo
                </button>
              </div>
            </section>

            {/* Input card */}
            <section className="max-w-3xl mx-auto">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="font-semibold text-lg mb-1">Startup Call Notes</h2>
                <p className="text-xs text-muted-foreground mb-4">Paste raw notes — we'll structure them.</p>
                <textarea
                  id="notes-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={7}
                  placeholder="Paste startup call notes here. Include founder background, startup idea, target customers, product, technology, business model, competitors, traction, and fundraising stage…"
                  className="w-full rounded-xl bg-background/50 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
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
                      className="rounded-xl bg-background/50 border border-white/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <ScoreCard label="Startup Fit" value={`${data.scores.fit}`} suffix="/ 10" accent="emerald" progress={data.scores.fit * 10} icon={<Sparkles className="w-4 h-4" />} />
              <ScoreCard label="Novelty" value={`${data.scores.novelty}`} suffix="/ 10" accent="cyan" progress={data.scores.novelty * 10} icon={<Zap className="w-4 h-4" />} />
              <ScoreCard label="Foresight" value={`${data.scores.foresight}`} suffix="/ 10" accent="violet" progress={data.scores.foresight * 10} icon={<TrendingUp className="w-4 h-4" />} />
              <ScoreCard label="CRM Memory" value={`${data.scores.crmMatches}`} suffix="similar startups found" accent="amber" icon={<Database className="w-4 h-4" />} />
            </div>

            {/* Main grid: 75% / 25% on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              <div className="lg:col-span-3 space-y-4">
                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-1 p-1 rounded-xl glass-card">
                  {[
                    { k: "memory", label: "VC Memory AI", icon: Brain },
                    { k: "novelty", label: "Novelty Market Analysis", icon: Sparkles },
                    { k: "foresight", label: "Foresight Market Analysis", icon: TrendingUp },
                  ].map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.k;
                    return (
                      <button
                        key={t.k}
                        onClick={() => setTab(t.k as Tab)}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.label}</span>
                        <span className="sm:hidden">{t.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {tab === "memory" && <MemoryTab data={data.memory} />}
                {tab === "novelty" && <NoveltyTab data={data.novelty} />}
                {tab === "foresight" && <ForesightTab data={data.foresight} />}
              </div>

              <div className="lg:col-span-1">
                <AnalysisSidebar data={data.inputs} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-5 text-center text-xs text-muted-foreground">
          AI Investment Intelligence Engine · MVP demo · All integrations simulated
        </div>
      </footer>
    </div>
  );
}
