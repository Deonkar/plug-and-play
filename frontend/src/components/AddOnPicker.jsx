import { useState } from "react";
import { Check, Plus } from "lucide-react";

export const ADDONS = [
  { key: "seats",       name: "Extra agent seats",     desc: "Add more agents beyond your tier limit.",                            pricing: "$5 / seat / mo",   monthly: 5 },
  { key: "byok",        name: "Bring-your-own LLM key",desc: "Use your own OpenAI/Anthropic/Gemini key — pay providers directly.", pricing: "Free",             monthly: 0 },
  { key: "slack",       name: "Slack escalation alerts",desc:"Per-tenant webhook for escalations + quota alerts.",                 pricing: "$10 / mo",         monthly: 10 },
  { key: "sso",         name: "SSO / SCIM",            desc: "Google Workspace / Okta / Azure AD sign-in + auto-provisioning.",    pricing: "$80 / mo",         monthly: 80 },
  { key: "priority",    name: "Priority onboarding",   desc: "White-glove context ingestion + custom .md templates for your team.",pricing: "$500 one-time",    monthly: 0, oneTime: 500 },
  { key: "whitelabel",  name: "White-label branding",  desc: "Your logo, your colors on the widget & console.",                    pricing: "$120 / mo",        monthly: 120 },
  { key: "retention",   name: "Custom retention policy",desc:"Choose how long chat logs and prompt cache live for compliance.",    pricing: "$40 / mo",         monthly: 40 },
  { key: "audit",       name: "Advanced audit log",    desc: "Immutable log of every admin action + agent query, exportable.",     pricing: "$60 / mo",         monthly: 60 },
];

export default function AddOnPicker({ picked, setPicked, testidPrefix = "addon", showSummary = true }) {
  const toggle = (k) => setPicked((s) => {
    const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n;
  });
  const selected = ADDONS.filter((a) => picked.has(a.key));
  const monthly = selected.reduce((sum, a) => sum + (a.monthly || 0), 0);
  const oneTime = selected.reduce((sum, a) => sum + (a.oneTime || 0), 0);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-3">
        {ADDONS.map((a) => {
          const on = picked.has(a.key);
          return (
            <button
              key={a.key}
              onClick={() => toggle(a.key)}
              data-testid={`${testidPrefix}-${a.key}`}
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

      {showSummary && (
        <div className="mt-6 border-t border-border pt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs font-mono text-muted-foreground" data-testid={`${testidPrefix}-summary`}>
            {picked.size} add-on{picked.size === 1 ? "" : "s"} selected
          </div>
          <div className="flex items-center gap-4">
            {monthly > 0 && (
              <div className="text-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-2">monthly</span>
                <span className="font-display font-bold text-lg text-primary">${monthly}</span>
              </div>
            )}
            {oneTime > 0 && (
              <div className="text-sm">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mr-2">one-time</span>
                <span className="font-display font-bold text-lg">${oneTime}</span>
              </div>
            )}
            <button onClick={() => setPicked(new Set())} className="btn-ghost text-xs" data-testid={`${testidPrefix}-clear`}>Clear all</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Allow other files to init state cleanly
export function useAddonSet(initial = []) {
  return useState(() => new Set(initial));
}
