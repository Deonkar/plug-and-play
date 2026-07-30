import { Bot, Database, Lock, GitBranch, Server, Braces, Palette, Cpu, Mic, LineChart } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";
import { safeHtml } from "../../lib/sanitize";

const GROUPS = [
  {
    label: "Backend",
    items: [
      { icon: Server, name: "FastAPI", detail: "Python 3.11 async framework. Every route lives under /api." },
      { icon: Database, name: "MongoDB (Motor)", detail: "Multi-tenant docs with company_id sharding + indexes on email/company/session." },
      { icon: Lock, name: "PyJWT + bcrypt", detail: "HS256 access tokens (7d), bcrypt-hashed passwords, RBAC middleware." },
      { icon: Cpu, name: "emergentintegrations", detail: "Unified SDK for Claude / OpenAI / Whisper via the Emergent Universal Key." },
    ],
  },
  {
    label: "AI &amp; Voice",
    items: [
      { icon: Bot, name: "Claude Sonnet 4.6", detail: "Primary chat model — reasoning + long context." },
      { icon: Mic, name: "OpenAI Whisper-1", detail: "Voice transcription for the mic button (webm/opus in, JSON out)." },
      { icon: GitBranch, name: "Auto-ingest LLM prompt", detail: "Ingests a repo dump and outputs 3 structured markdown docs (arch/schema/modules)." },
    ],
  },
  {
    label: "Frontend",
    items: [
      { icon: Braces, name: "React 19 + React Router 7", detail: "Nested routes, protected wrappers, JWT stored in localStorage." },
      { icon: Palette, name: "Tailwind + Framer Motion", detail: "Custom Swiss/Brutalist dark theme, cursor-follower glow, spring animations." },
      { icon: LineChart, name: "Recharts", detail: "Analytics bar + line charts with brand palette (Signal Orange)." },
      { icon: Braces, name: "react-markdown + remark-gfm", detail: "Assistant messages render markdown, tables, code blocks." },
    ],
  },
  {
    label: "Infra",
    items: [
      { icon: Server, name: "Kubernetes + Supervisor", detail: "Preview pod hosts frontend (3000) and backend (8001); nginx maps /api → 8001." },
      { icon: Lock, name: "Slack webhooks (BYO)", detail: "Escalation alerts POST to a per-tenant Slack incoming-webhook URL." },
    ],
  },
];

export default function Stack() {
  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-16">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// tech stack</div>
        <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] max-w-3xl">
          Boring stack.<br /><span className="text-primary">Sharp results.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-6 text-lg leading-relaxed">
          Nothing exotic. Just the pieces every team already knows, wired together with taste.
          If you want to bring your own key or swap a provider, it's a one-line change in Settings.
        </p>
      </section>

      <section className="px-6 md:px-16 pb-24 space-y-16">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <div className="flex items-baseline gap-4 mb-6">
              <div className="w-1.5 h-1.5 bg-primary" />
              <h2 className="font-display font-black text-3xl" dangerouslySetInnerHTML={safeHtml(g.label)} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {g.items.map((it) => {
                const Icon = it.icon;
                return (
                  <div key={it.name} className="border border-border p-5 bg-card hover:border-primary/60 transition-colors flex items-start gap-4">
                    <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-display font-bold text-base">{it.name}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed mt-1">{it.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </MarketingLayout>
  );
}
