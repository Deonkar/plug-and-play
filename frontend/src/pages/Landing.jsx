import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Terminal, ShieldCheck, Zap, BarChart3, Bot, Layers, ArrowRight,
  GitBranch, Database, Lock, Slack, FileCode, Users2, Activity, Puzzle,
} from "lucide-react";
import CursorGlow from "../components/CursorGlow";

export default function Landing() {
  return (
    <div className="grain relative min-h-screen overflow-x-hidden">
      <CursorGlow />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-16 py-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg" data-testid="brand-logo">
          <motion.span
            className="inline-block w-2.5 h-2.5 bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span>COMPANY/OS</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <a href="#how" className="hover:text-white transition-colors">How</a>
          <a href="#use-cases" className="hover:text-white transition-colors">Use cases</a>
          <a href="#stack" className="hover:text-white transition-colors">Stack</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" data-testid="nav-login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" data-testid="nav-signup" className="btn-primary text-sm">Get access</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 px-6 md:px-16 pt-16 md:pt-24 pb-24 grid md:grid-cols-12 gap-8">
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
            <Link to="/login" data-testid="hero-cta-demo" className="btn-ghost">Try demo account</Link>
          </motion.div>
          <p className="mt-6 font-mono text-[11px] text-muted-foreground">
            demo // admin@acme.demo · admin123 &nbsp;|&nbsp; agent // alice@acme.demo · agent123
          </p>
        </div>

        {/* Terminal preview card */}
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

      {/* SOCIAL PROOF / TECH LOGOS strip */}
      <section className="relative z-10 border-y border-border bg-black/40 py-4 overflow-hidden">
        <div className="marquee-inner font-mono text-xs uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
          {[..."Claude Sonnet 4.6 · FastAPI · React · MongoDB · Slack · Emergent Universal Key · JWT · Recharts · Framer Motion · Multi-tenant · RBAC · Prompt caching · Auto-ingest ".repeat(3)].join("")}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 px-6 md:px-16 py-24 border-b border-border">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// how it works</div>
            <h2 className="font-display font-black text-4xl md:text-5xl leading-tight">
              Three moves.<br />Then it's yours.
            </h2>
          </div>
          <div className="md:col-span-8 grid md:grid-cols-3 gap-4">
            <StepBox n="01" icon={GitBranch} title="Install &amp; ingest">
              Drop the service in your stack. Point it at your repo folder — the bot walks the tree,
              builds an <b>Architecture</b>, <b>Schema</b>, and <b>Module Map</b> automatically.
            </StepBox>
            <StepBox n="02" icon={FileCode} title="Feed context">
              Devs and PMs drag-drop .md files, or write straight into the editor. Ideology, playbooks,
              escalation rules — it's all system-prompt fuel.
            </StepBox>
            <StepBox n="03" icon={Bot} title="Ship the widget">
              Your team sees a floating chat in their CRM. Each agent gets answers scoped to <em>their</em>
              leads &amp; tasks. Admins get the analytics.
            </StepBox>
          </div>
        </div>
      </section>

      {/* BENTO FEATURE GRID */}
      <section className="relative z-10 px-6 md:px-16 py-24 border-b border-border">
        <div className="mb-10">
          <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// features</div>
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
            Agent A only ever sees Agent A's 5 leads. Enforced server-side <em>and</em> in the system prompt.
          </FeatureBox>
          <FeatureBox className="md:col-span-2" icon={Zap} title="Prompt cache">
            Frequent queries served from cache. Lower tokens. Faster answers.
          </FeatureBox>
          <FeatureBox className="md:col-span-2" icon={BarChart3} title="Analytics">
            Top prompts, tokens/user, cache-hit rate. Decide what to refine.
          </FeatureBox>
          <FeatureBox className="md:col-span-2" icon={Slack} title="Slack alerts">
            Escalations ping your webhook the moment a task goes overdue.
          </FeatureBox>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="relative z-10 px-6 md:px-16 py-24 border-b border-border">
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// use cases</div>
            <h2 className="font-display font-black text-4xl md:text-5xl leading-tight">
              Wherever context<br />gets lost.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4">
            <UseCase icon={Users2} title="CRM &amp; Sales" desc="Agents ask 'what's urgent for me today?' or 'why did I get an escalation?' — get answers scoped to their book, with lead/task IDs." />
            <UseCase icon={Terminal} title="Engineering Onboarding" desc="New devs get a bot that already read the repo. Ask 'where does auth live?' or 'what tables back the invoice flow?' — real answers, not stale wikis." />
            <UseCase icon={Activity} title="Ops &amp; Support" desc="Escalation rules encoded in .md. The bot knows when to raise the alarm — and pings Slack automatically." />
          </div>
        </div>
      </section>

      {/* STACK */}
      <section id="stack" className="relative z-10 px-6 md:px-16 py-24 border-b border-border">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5">
            <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// under the hood</div>
            <h2 className="font-display font-black text-4xl md:text-5xl leading-tight mb-4">
              Boring stack.<br />Sharp results.
            </h2>
            <p className="text-muted-foreground">
              Nothing exotic. Just the pieces every team already knows, wired together with taste.
            </p>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 gap-3">
            <StackTile icon={Bot} label="Claude Sonnet 4.6" sub="reasoning + tool" />
            <StackTile icon={Database} label="MongoDB" sub="multi-tenant docs" />
            <StackTile icon={Lock} label="JWT + bcrypt" sub="role-based access" />
            <StackTile icon={GitBranch} label="Emergent Key" sub="or bring your own" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 px-6 md:px-16 py-24 border-b border-border">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// questions</div>
        <h2 className="font-display font-black text-4xl md:text-5xl mb-10">Fair asks.</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Faq q="How does the bot 'know' our codebase?" a="On install, run the ingest step — point it at your repo folder. It walks the tree and uses Claude Sonnet to generate structured markdown docs (architecture, schema, per-module notes) that live inside your tenant." />
          <Faq q="Is one agent's data ever seen by another?" a="No. Row-level scoping is enforced in the API layer AND baked into the LLM's system prompt at request time. The prompt cache is also user-scoped for agents." />
          <Faq q="Can we bring our own LLM key?" a="Yes. Set it under Settings → Provider/Model/Key. Otherwise the Emergent Universal Key handles OpenAI, Claude, and Gemini automatically." />
          <Faq q="What about escalation rules?" a="Write them in a .md doc. The bot uses them for its answers, and a lightweight rules engine flags overdue urgent tasks + untouched hot leads — pinging your Slack webhook once per event per day." />
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-16 py-24">
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

      <footer className="relative z-10 px-6 md:px-16 py-10 border-t border-border font-mono text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-4">
        <span>COMPANY/OS © 2026 — built with Emergent</span>
        <span>build_00.2.0 · plug-and-play · multi-tenant</span>
      </footer>
    </div>
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

function StepBox({ n, icon: Icon, title, children }) {
  return (
    <div className="border border-border p-6 bg-card hover:border-primary/60 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <span className="font-mono text-xs text-muted-foreground">{n}</span>
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function UseCase({ icon: Icon, title, desc }) {
  return (
    <div className="border-l-2 border-border hover:border-primary transition-colors pl-6 py-3 group">
      <div className="flex items-center gap-3 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-lg">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function StackTile({ icon: Icon, label, sub }) {
  return (
    <div className="border border-border p-4 bg-card flex items-center gap-3 hover:border-primary/60 transition-colors">
      <Icon className="w-5 h-5 text-primary shrink-0" />
      <div>
        <div className="font-display font-bold text-sm">{label}</div>
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{sub}</div>
      </div>
    </div>
  );
}

function Faq({ q, a }) {
  return (
    <div className="border border-border p-5 bg-card">
      <div className="font-display font-bold text-base mb-2">{q}</div>
      <div className="text-sm text-muted-foreground leading-relaxed">{a}</div>
    </div>
  );
}
