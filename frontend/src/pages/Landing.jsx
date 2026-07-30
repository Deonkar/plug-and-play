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
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/how" data-testid="hero-cta-how" className="btn-ghost">See how it works</Link>
          </motion.div>
          <p className="mt-6 font-mono text-[11px] text-muted-foreground">
            demo // admin@acme.demo · admin123 &nbsp;|&nbsp; agent // alice@acme.demo · agent123
          </p>
        </div>

        {/* Terminal preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="md:col-span-5 border border-border bg-card relative"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-black/40">
            <span className="w-2.5 h-2.5 border border-primary bg-primary/40" />
            <span className="w-2.5 h-2.5 border border-neutral-700 bg-neutral-800" />
            <span className="w-2.5 h-2.5 border border-neutral-700 bg-neutral-800" />
            <span className="ml-3 font-mono text-[10px] text-muted-foreground">ask.company.os</span>
          </div>
          <div className="p-5 space-y-4 text-sm">
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
              <span className="text-primary">$</span> _
            </div>
          </div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-border bg-black/40 py-4 overflow-hidden">
        <div className="marquee-inner font-mono text-xs uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
          {"Claude Sonnet 4.6 · FastAPI · React · MongoDB · Slack · Emergent Universal Key · JWT · Recharts · Framer Motion · Multi-tenant · RBAC · Prompt caching · Auto-ingest · Whisper voice · ".repeat(3)}
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
            What it looks like<br /><span className="text-primary">on the ground.</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Two live, self-playing reels. Left: how the widget behaves inside a real CRM. Right: what
            admins see when they open the console.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-6 bg-primary" />
              <div>
                <div className="font-display font-bold">Inside a CRM</div>
                <div className="font-mono text-[11px] text-muted-foreground">Agent view · widget floats bottom-right</div>
              </div>
            </div>
            <CRMDemo />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-6 bg-primary" />
              <div>
                <div className="font-display font-bold">Admin console</div>
                <div className="font-mono text-[11px] text-muted-foreground">Analytics · Users · Context — auto-cycling</div>
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
                Create your workspace <ArrowRight className="w-4 h-4" />
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
