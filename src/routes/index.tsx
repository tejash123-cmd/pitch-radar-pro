import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Database,
  ArrowRight,
  Network,
  LineChart,
  Telescope,
  Upload,
  Cpu,
  CheckCircle2,
  Globe2,
  FileSearch,
  BookOpen,
  Search,
  Beaker,
  Building2,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "VCForesight — AI Investment Intelligence for Venture Capital" },
      {
        name: "description",
        content:
          "VCForesight turns startup data into actionable VC intelligence — similarity search, market fit, and technology foresight powered by real-world data.",
      },
      { property: "og:title", content: "VCForesight — AI Investment Intelligence for VC" },
      {
        property: "og:description",
        content:
          "Know which startup to invest in — and why — backed by real data and foresight.",
      },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* NAV */}
      <header className="relative z-20 max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[var(--foresight,theme(colors.violet.500))] grid place-items-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold tracking-tight">VCForesight</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#problem" className="hover:text-foreground transition">Why</a>
          <a href="#engine" className="hover:text-foreground transition">Data Engine</a>
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#how" className="hover:text-foreground transition">How it works</a>
        </nav>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Open App <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* HERO */}
      <section className="relative">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 0%, color-mix(in oklab, var(--foresight, #7c3aed) 35%, transparent), transparent 70%), radial-gradient(50% 40% at 10% 20%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 70%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" /> AI Investment Intelligence
            </span>
            <h1 className="mt-5 text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              VC<span className="bg-gradient-to-r from-primary to-[color-mix(in_oklab,var(--foresight,#7c3aed)_80%,white)] bg-clip-text text-transparent">Foresight</span>
            </h1>
            <p className="mt-4 text-xl text-foreground/80">
              AI-powered investment intelligence for venture capital decisions.
            </p>
            <p className="mt-3 text-base text-muted-foreground max-w-xl">
              Know which startup to invest in — and why — backed by real data &amp; foresight.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium hover:bg-foreground/5 transition"
              >
                See Demo
              </a>
            </div>
          </div>

          {/* Hero Graphic */}
          <HeroGraphic />
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Which startup should I invest in — and why?
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          VCs evaluate hundreds of startups, but lack structured memory, real-time data, and predictive insights.
          VCForesight transforms fragmented information into actionable intelligence.
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { icon: Building2, title: "Too many startups, too little clarity", desc: "Pipeline overload buries the signal." },
            { icon: Brain, title: "Decisions rely on memory & intuition", desc: "Tribal knowledge doesn't scale." },
            { icon: Telescope, title: "Limited visibility into future potential", desc: "Markets move faster than spreadsheets." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-foreground/[0.025] p-6 text-left hover:border-primary/40 transition">
              <c.icon className="w-6 h-6 text-primary mb-3" />
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DATA ENGINE */}
      <section id="engine" className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Real Data Engine</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
              Powered by global research, economic & innovation data
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              VCForesight integrates global economic, research, web, and innovation data to generate deep investment insights.
            </p>
          </div>
          <DataEngineGraphic />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Three engines. One verdict.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon={Network}
            tone="cyan"
            title="Similarity Startup Engine"
            desc="Compare any startup with similar companies across your VC database and the global ecosystem."
            bullets={["Competitor mapping", "Differentiation insights", "Pattern recognition"]}
          />
          <FeatureCard
            icon={LineChart}
            tone="amber"
            title="Market Analytics"
            desc="Understand if the startup actually fits the market."
            bullets={["Market demand signals", "Customer segments", "Industry growth & risk"]}
          />
          <FeatureCard
            icon={Telescope}
            tone="violet"
            title="Technology Foresight"
            desc="Predict whether the startup aligns with future tech trends."
            bullets={["Emerging technologies", "Research & patent momentum", "Long-term viability score"]}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How it works</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Upload, title: "Upload startup", desc: "Drop notes, decks, or connect your CRM." },
            { icon: Cpu, title: "AI analyzes", desc: "Multi-source data fused into one model." },
            { icon: Sparkles, title: "Generate insights", desc: "Market fit, foresight, and similar startups." },
            { icon: CheckCircle2, title: "Decide with confidence", desc: "A defensible thesis in minutes." },
          ].map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-foreground/[0.025] p-5">
              <div className="text-xs text-muted-foreground">Step {i + 1}</div>
              <s.icon className="w-6 h-6 text-primary my-3" />
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div
          className="rounded-3xl border border-border p-12"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--primary) 18%, transparent), color-mix(in oklab, var(--foresight, #7c3aed) 18%, transparent))",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Stop guessing. Start investing with foresight.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition"
            >
              Request Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-6 py-3 text-sm font-semibold hover:bg-foreground/5 transition"
            >
              Join Beta
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} VCForesight</div>
          <div>AI investment intelligence for venture capital</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  bullets,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  bullets: string[];
  tone: "cyan" | "amber" | "violet";
}) {
  const toneVar =
    tone === "cyan" ? "var(--memory, #06b6d4)" : tone === "amber" ? "var(--novelty, #f59e0b)" : "var(--foresight, #7c3aed)";
  return (
    <div className="group relative rounded-2xl border border-border bg-foreground/[0.025] p-6 overflow-hidden hover:border-foreground/20 transition">
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition"
        style={{ background: toneVar }}
      />
      <div
        className="w-10 h-10 rounded-xl grid place-items-center mb-4"
        style={{ background: `color-mix(in oklab, ${toneVar} 18%, transparent)`, color: toneVar }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-semibold text-lg">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      <ul className="mt-4 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4" style={{ color: toneVar }} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroGraphic() {
  // Animated network: central core + orbiting nodes with floating insight chips
  return (
    <div className="relative aspect-square max-w-[520px] mx-auto w-full">
      <div
        className="absolute inset-8 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 60%)" }}
      />
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--foresight, #7c3aed)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {[
          [80, 80], [320, 90], [340, 240], [70, 300], [200, 60], [60, 200], [330, 350], [200, 350],
        ].map(([x, y], i) => (
          <g key={i}>
            <line x1="200" y1="200" x2={x} y2={y} stroke="url(#line)" strokeWidth="1" />
            <circle cx={x} cy={y} r="4" fill="var(--foresight, #7c3aed)">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        <circle cx="200" cy="200" r="80" fill="url(#core)" />
        <circle cx="200" cy="200" r="22" fill="var(--primary)" />
      </svg>

      {/* Floating chips */}
      <div className="absolute top-6 right-2 rounded-xl border border-border bg-background/80 backdrop-blur px-3 py-2 text-xs shadow-lg">
        <div className="text-muted-foreground">Market Fit</div>
        <div className="font-semibold text-emerald-500">82%</div>
      </div>
      <div className="absolute bottom-10 left-0 rounded-xl border border-border bg-background/80 backdrop-blur px-3 py-2 text-xs shadow-lg">
        <div className="text-muted-foreground">Tech Longevity</div>
        <div className="font-semibold" style={{ color: "var(--foresight, #7c3aed)" }}>High</div>
      </div>
      <div className="absolute top-1/2 -right-2 rounded-xl border border-border bg-background/80 backdrop-blur px-3 py-2 text-xs shadow-lg">
        <div className="text-muted-foreground">Novelty</div>
        <div className="font-semibold" style={{ color: "var(--novelty, #f59e0b)" }}>+34%</div>
      </div>
    </div>
  );
}

function DataEngineGraphic() {
  const sources = [
    { icon: Globe2, label: "World Bank Data" },
    { icon: BookOpen, label: "OpenAlex" },
    { icon: Search, label: "DuckDuckGo" },
    { icon: FileSearch, label: "Website Fetcher" },
    { icon: Beaker, label: "Google Patents" },
    { icon: Database, label: "Semantic Scholar" },
    { icon: TrendingUp, label: "arXiv" },
  ];
  return (
    <div className="relative">
      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
        <div className="grid grid-cols-2 gap-3">
          {sources.slice(0, 4).map((s) => (
            <SourceChip key={s.label} icon={s.icon} label={s.label} />
          ))}
        </div>
        <div className="relative grid place-items-center">
          <div
            className="w-44 h-44 rounded-full grid place-items-center border border-border relative"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 30%, transparent), transparent 70%)",
            }}
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--foresight,#7c3aed)_70%,black)] grid place-items-center text-primary-foreground shadow-2xl">
              <div className="text-center">
                <Brain className="w-7 h-7 mx-auto" />
                <div className="text-[10px] uppercase tracking-widest mt-1 opacity-90">Real Data Core</div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sources.slice(4).map((s) => (
            <SourceChip key={s.label} icon={s.icon} label={s.label} />
          ))}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        {["Economic Indicators", "Research Trends", "Startup Signals", "Technology Evolution"].map((t) => (
          <div key={t} className="rounded-xl border border-border bg-foreground/[0.025] py-2 text-xs text-muted-foreground">
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceChip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-foreground/[0.025] px-3 py-2 hover:border-primary/40 transition">
      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary grid place-items-center">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
