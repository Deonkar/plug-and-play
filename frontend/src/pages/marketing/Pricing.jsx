import { useState } from "react";
import { Check, Clock, Sparkles, Plus, Minus } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";
import api from "../../lib/api";
import publicApi from "../../lib/publicApi";

export default function Pricing() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ loading: false, ok: false, err: "" });

  const join = async (e) => {
    e.preventDefault();
    setState({ loading: true, ok: false, err: "" });
    try {
      await publicApi.post("/public/waitlist", { email });
      setState({ loading: false, ok: true, err: "" });
      setEmail("");
    } catch (er) {
      setState({ loading: false, ok: false, err: er.response?.data?.detail || "Something went wrong" });
    }
  };

  const tiers = [
    { name: "Solo", price: "Free", desc: "For teams testing the waters. Multi-tenant demo tenant, seeded data.", features: ["1 workspace", "Up to 3 seats", "Emergent LLM key", "Community support"] },
    { name: "Team", price: "TBD", desc: "For growing sales/ops teams that need real quotas and Slack alerts.", features: ["Unlimited context docs", "Per-user token quotas", "Slack escalation alerts", "Priority support"], featured: true },
    { name: "Enterprise", price: "Talk", desc: "For companies embedding the widget across many internal tools.", features: ["BYO LLM key", "SSO / SCIM (roadmap)", "Custom retention policies", "White-glove onboarding"] },
  ];

  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-16">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3 flex items-center gap-2">
          <Clock className="w-3 h-3"/> /// pricing · coming soon
        </div>
        <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] max-w-3xl">
          Pricing is <span className="text-primary">being finalised.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-6 text-lg leading-relaxed">
          The MVP is free while I gather feedback. Once real usage patterns are clear I'll switch to
          fair, usage-scaled pricing. Join the waitlist to lock in the launch discount.
        </p>
      </section>

      {/* Waitlist */}
      <section className="px-6 md:px-16 pb-16">
        <div className="border border-primary p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent max-w-2xl">
          <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-widest text-primary">
            <Sparkles className="w-3 h-3"/> waitlist · early-access
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl mb-4">Get pinged when pricing goes live.</h2>
          <form onSubmit={join} className="flex flex-col md:flex-row gap-2" data-testid="waitlist-form">
            <input
              type="email" required value={email} onChange={(e)=>setEmail(e.target.value)}
              placeholder="you@company.com"
              className="input-tech flex-1"
              data-testid="waitlist-email"
            />
            <button disabled={state.loading} className="btn-primary" data-testid="waitlist-submit">
              {state.loading ? "..." : state.ok ? "Added ✓" : "Join waitlist"}
            </button>
          </form>
          {state.ok && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm mt-3" data-testid="waitlist-success">
              <Check className="w-4 h-4"/> You're on the list — I'll email you when we launch.
            </div>
          )}
          {state.err && <div className="text-primary text-xs font-mono mt-3" data-testid="waitlist-error">! {state.err}</div>}
          <p className="text-[11px] font-mono text-muted-foreground mt-3">No spam. Unsubscribe any time.</p>
        </div>
      </section>

      {/* Tiers preview */}
      <section className="px-6 md:px-16 py-16 border-t border-border">
        <div className="mb-8">
          <div className="font-mono text-xs uppercase text-muted-foreground tracking-widest mb-2">/// direction we're headed</div>
          <h2 className="font-display font-black text-3xl md:text-4xl">Preview of the tiers.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {tiers.map((t) => (
            <div key={t.name} className={`border p-6 bg-card relative ${t.featured ? "border-primary" : "border-border"}`}>
              {t.featured && <div className="absolute -top-3 left-6 bg-primary text-white text-[10px] font-mono uppercase tracking-widest px-2 py-0.5">most popular</div>}
              <div className="font-display font-bold text-lg mb-1">{t.name}</div>
              <div className="font-display font-black text-4xl mb-3">{t.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></div>
              <p className="text-sm text-muted-foreground mb-5 min-h-[48px]">{t.desc}</p>
              <ul className="space-y-2 text-sm mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-muted-foreground"><span className="text-primary shrink-0">›</span>{f}</li>
                ))}
              </ul>
              <div className="text-[11px] font-mono text-muted-foreground">final pricing TBA · early users get 50% off</div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-on services */}
      <AddOnServices />
    </MarketingLayout>
  );
}

const ADDONS = [
  { key: "seats", name: "Extra agent seats", desc: "Add more agents beyond your tier limit.", pricing: "$5 / seat / mo" },
  { key: "byok", name: "Bring-your-own LLM key", desc: "Use your own OpenAI/Anthropic/Gemini key — pay providers directly.", pricing: "Free" },
  { key: "slack", name: "Slack escalation alerts", desc: "Per-tenant webhook for escalations + quota alerts.", pricing: "$10 / mo" },
  { key: "sso", name: "SSO / SCIM", desc: "Google Workspace / Okta / Azure AD sign-in + auto-provisioning.", pricing: "$80 / mo" },
  { key: "priority", name: "Priority onboarding", desc: "White-glove context ingestion + custom .md templates for your team.", pricing: "$500 one-time" },
  { key: "whitelabel", name: "White-label branding", desc: "Your logo, your colors on the widget & console.", pricing: "$120 / mo" },
  { key: "retention", name: "Custom retention policy", desc: "Choose how long chat logs and prompt cache live for compliance.", pricing: "$40 / mo" },
  { key: "audit", name: "Advanced audit log", desc: "Immutable log of every admin action + agent query, exportable.", pricing: "$60 / mo" },
];

function AddOnServices() {
  const [picked, setPicked] = useState(new Set(["byok", "slack"]));
  const toggle = (k) => {
    setPicked((s) => {
      const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n;
    });
  };

  return (
    <section className="px-6 md:px-16 py-24 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// build your own bundle</div>
          <h2 className="font-display font-black text-3xl md:text-5xl leading-tight max-w-3xl">
            Add just what you need. <span className="text-primary">Skip the rest.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Tap any service to add it to your workspace. Toggle off to remove. Everything is monthly,
            no lock-in.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {ADDONS.map((a) => {
            const on = picked.has(a.key);
            return (
              <button
                key={a.key}
                onClick={() => toggle(a.key)}
                data-testid={`addon-${a.key}`}
                className={`text-left border p-5 transition-all group ${on ? "border-primary bg-primary/[0.04]" : "border-border bg-card hover:border-primary/60"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-8 h-8 border flex items-center justify-center transition-colors ${on ? "border-primary bg-primary text-white" : "border-border text-muted-foreground group-hover:border-primary/60"}`}>
                    {on ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-display font-bold text-base">{a.name}</div>
                      <div className="font-mono text-[11px] text-primary">{a.pricing}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="font-mono text-xs text-muted-foreground">
            {picked.size} add-on{picked.size === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => setPicked(new Set())} className="btn-ghost text-xs" data-testid="addons-clear">Clear all</button>
            <span className="text-muted-foreground text-xs font-mono">// selection stored locally · we'll confirm final quote after waitlist</span>
          </div>
        </div>
      </div>
    </section>
  );
}
