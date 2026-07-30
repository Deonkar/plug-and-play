import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Puzzle, Layers, ShieldCheck, Zap, BarChart3, Slack } from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import CRMDemo from "../components/demo/CRMDemo";
import AdminDemo from "../components/demo/AdminDemo";

export default function Landing() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="px-6 md:px-16 pt-16 md:pt-24 pb-20 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="font-mono text-xs text-primary tracking-widest uppercase mb-6"
            data-testid="hero-tag"
          >
            /// a plug-and-play operating system for your company
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display font-black text-5xl md:text-7xl leading-[0.95] mb-6"
            data-testid="hero-headline"
          >
            The chatbot that<br />
            <span className="text-primary">actually knows</span><br />
            your business.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
          >
            Install once. It reads your repo, digests your PMs' markdown, and answers your team's
            questions — with strict per-user access to their CRM leads &amp; tasks. Escalation alerts
            included. Embed anywhere.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/register" data-testid="hero-cta-primary" className="btn-primary flex items-center gap-2">
              Register now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/how" data-testid="hero-cta-how" className="btn-ghost">See how it works</Link>
          </motion.div>
          <p className="mt-6 font-mono text-[11px] text-muted-foreground">
            demo // admin@acme.demo · admin123 &nbsp;|&nbsp; agent // alice@acme.demo · agent123
          </p>
        </div>

        {/* Hero panel — layered, more alive */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="md:col-span-5 relative"
        >
          {/* Ambient glow */}
          <div className="absolute -inset-8 bg-primary/20 blur-[80px] opacity-60 pointer-events-none" />

          <div className="relative border border-border bg-card">
            {/* Header chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-black/50">
              <span className="w-2.5 h-2.5 border border-primary bg-primary/40" />
              <span className="w-2.5 h-2.5 border border-neutral-700 bg-neutral-800" />
              <span className="w-2.5 h-2.5 border border-neutral-700 bg-neutral-800" />
              <span className="ml-3 font-mono text-[10px] text-muted-foreground">ask.company.os</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live
              </span>
            </div>

            {/* Conversation */}
            <div className="p-5 space-y-4 text-sm min-h-[280px]">
              <div className="font-mono text-muted-foreground">
                <span className="text-primary">$</span> what urgent tasks do I have today?
              </div>
              <div className="border-l-2 border-primary pl-3">
                <div className="font-mono text-[10px] text-primary uppercase tracking-widest mb-2">assistant</div>
                <div className="leading-relaxed">
                  You have <b>1 URGENT task</b>:<br />
                  <span className="text-primary">▸ task-01</span> · Call Northwind CTO for demo <br />
                  <span className="text-muted-foreground text-xs">Lead: Northwind Traders (lead-01) · previously escalated — tackle first.</span>
                </div>
              </div>
              <div className="font-mono text-muted-foreground">
                <span className="text-primary">$</span> <span className="border-r-2 border-primary animate-pulse ml-1" />
              </div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-4 border-t border-border font-mono text-[10px] uppercase tracking-widest divide-x divide-border">
              {[
                { k: "resp", v: "720ms" },
                { k: "in", v: "479 tok" },
                { k: "out", v: "165 tok" },
                { k: "cache", v: "miss", accent: true },
              ].map((s, i) => (
                <div key={i} className="px-3 py-2 text-center">
                  <div className="text-muted-foreground text-[9px]">{s.k}</div>
                  <div className={s.accent ? "text-primary" : "text-white"}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating "plug-in" tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
            className="absolute -top-4 -right-4 md:-top-3 md:-right-3 bg-primary text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1.5 border border-primary/60 shadow-[0_8px_20px_-4px_rgba(255,80,20,0.4)] z-20"
            data-testid="plugin-ready-tag"
          >
            <span className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
            plug-in ready
          </motion.div>
        </motion.div>
      </section>

      {/* BY THE NUMBERS — static, calm, no more marquee */}
      <section className="border-y border-border bg-black/40">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {[
            { k: "install time", v: "< 5 min", sub: "one command" },
            { k: "data leakage", v: "0", sub: "row-level RBAC" },
            { k: "cache hit rate", v: "48%", sub: "typical tenant" },
            { k: "auto docs", v: "3 files", sub: "on repo ingest" },
          ].map((s) => (
            <div key={s.k} className="px-6 md:px-8 py-6 text-center">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{s.k}</div>
              <div className="font-display font-black text-3xl md:text-4xl text-white leading-none">{s.v}</div>
              <div className="text-[11px] font-mono text-muted-foreground mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bento features */}
      <section className="px-6 md:px-16 py-24 border-b border-border">
        <div className="mb-10">
          <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// what's inside</div>
          <h2 className="font-display font-black text-4xl md:text-5xl leading-tight max-w-3xl">
            Built to be the <span className="text-primary">nervous system</span> of a mid-sized team.
          </h2>
        </div>
        <div className="grid md:grid-cols-6 gap-4">
          <FeatureBox className="md:col-span-3 md:row-span-2 min-h-[240px]" icon={Puzzle} title="Plug-and-play widget">
            Drop the chatbot into any dashboard. Multi-tenant from day one — one deployment, many
            companies. Each tenant gets isolated data and its own LLM key if they want.
          </FeatureBox>
          <FeatureBox className="md:col-span-3" icon={Layers} title=".md-powered context">
            Devs upload architecture. PMs upload ideology. The bot inherits your company brain.
          </FeatureBox>
          <FeatureBox className="md:col-span-3" icon={ShieldCheck} title="Row-level access">
            Agent A only ever sees Agent A's leads. Enforced server-side <em>and</em> in the system prompt.
          </FeatureBox>
          <FeatureBox className="md:col-span-2" icon={Zap} title="Prompt cache">Faster answers. Lower tokens. Auto-invalidated hourly.</FeatureBox>
          <FeatureBox className="md:col-span-2" icon={BarChart3} title="Analytics">Top prompts, tokens/user, cache-hit rate.</FeatureBox>
          <FeatureBox className="md:col-span-2" icon={Slack} title="Slack alerts">Escalations ping your webhook the moment a task goes overdue.</FeatureBox>
        </div>
        <div className="mt-8 text-sm text-muted-foreground font-mono">
          <Link to="/how" className="hover:text-primary transition-colors" data-testid="link-how">/// full walkthrough on the How page →</Link>
        </div>
      </section>

      {/* LIVE DEMOS */}
      <section id="demo" className="px-6 md:px-16 py-24 border-b border-border">
        <div className="mb-10 max-w-3xl">
          <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// see it running</div>
          <h2 className="font-display font-black text-4xl md:text-5xl leading-tight">
            Not a screenshot.<br /><span className="text-primary">A live walkthrough.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Two auto-playing reels with narration. Left: how the widget behaves inside a totally
            unrelated CRM — proving it's a real plug-in, not our own site. Right: what admins do in
            the console (tokens, quotas, context).
          </p>
        </div>
        <div className="space-y-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-primary" />
              <div>
                <div className="font-display font-bold text-lg">Inside a customer's CRM</div>
                <div className="font-mono text-[11px] text-muted-foreground">Agent view · widget is the only Company/OS surface</div>
              </div>
            </div>
            <CRMDemo />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-primary" />
              <div>
                <div className="font-display font-bold text-lg">Admin console</div>
                <div className="font-mono text-[11px] text-muted-foreground">Analytics → quotas → context — auto-cycling</div>
              </div>
            </div>
            <AdminDemo />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-16 py-24">
        <div className="border border-primary p-10 md:p-16 relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
          <div className="max-w-2xl">
            <div className="font-mono text-xs uppercase text-primary tracking-widest mb-4">/// take it for a spin</div>
            <h2 className="font-display font-black text-4xl md:text-6xl mb-6 leading-tight">
              Your CRM is loud.<br />Make it <span className="text-primary">answer back.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg">
              Two minutes to sign up. Zero cards. Seeded demo data so you can test the multi-tenant
              scoping the moment you land.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary flex items-center gap-2" data-testid="footer-cta-register">
                Register now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/login" className="btn-ghost" data-testid="footer-cta-login">Sign in to demo</Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function FeatureBox({ className = "", icon: Icon, title, children }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`border border-border p-6 bg-card group hover:border-primary/60 transition-colors ${className}`}
    >
      <Icon className="w-5 h-5 text-primary mb-4 group-hover:scale-110 transition-transform" />
      <h3 className="font-display font-bold text-xl mb-2 leading-tight">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </motion.div>
  );
}
