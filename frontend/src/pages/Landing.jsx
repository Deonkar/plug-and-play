import { Link } from "react-router-dom";
import { Terminal, ShieldCheck, Zap, BarChart3, Bot, Layers } from "lucide-react";

export default function Landing() {
  return (
    <div className="grain relative min-h-screen">
      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-6 border-b border-border">
        <div className="flex items-center gap-2 font-display font-bold text-lg" data-testid="brand-logo">
          <span className="inline-block w-2 h-2 bg-primary" />
          <span>COMPANY/OS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" data-testid="nav-login" className="btn-ghost text-sm">Sign in</Link>
          <Link to="/register" data-testid="nav-signup" className="btn-primary text-sm">Get access</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 px-8 md:px-16 pt-20 pb-24 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <p className="font-mono text-xs text-primary tracking-widest uppercase mb-6" data-testid="hero-tag">
            /// A plug-and-play operating system for your company
          </p>
          <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.95] mb-8" data-testid="hero-headline">
            The chatbot that<br/>
            <span className="text-primary">actually knows</span><br/>
            your business.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-8">
            Feed it markdown from your devs and PMs. It answers your team's questions —
            with strict per-user access to their CRM leads &amp; tasks. Embed anywhere. Ship in minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" data-testid="hero-cta-primary" className="btn-primary">Start free →</Link>
            <Link to="/login" data-testid="hero-cta-demo" className="btn-ghost">Try demo account</Link>
          </div>
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            demo // admin@acme.demo · admin123 &nbsp;|&nbsp; agent // alice@acme.demo · agent123
          </p>
        </div>
        <div className="md:col-span-4 border border-border p-6 bg-card">
          <div className="font-mono text-xs text-muted-foreground mb-3">// ask.company.os</div>
          <div className="space-y-3 text-sm">
            <div className="font-mono text-muted-foreground">$ what urgent tasks do I have today?</div>
            <div className="border-l-2 border-primary pl-3">
              <div className="font-mono text-xs text-primary mb-1">assistant</div>
              You have 1 URGENT task: <b>Call Northwind CTO for demo</b> (lead-01).
              Escalated last week — recommend calling first.
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — tetris grid */}
      <section className="relative z-10 px-8 md:px-16 py-16 grid md:grid-cols-6 gap-4 border-t border-border">
        <FeatureBox className="md:col-span-3 md:row-span-2 min-h-[220px]" icon={Bot} title="Plug-and-play widget" desc="Drop the chatbot into any dashboard. Multi-tenant from day one — one deployment, many companies." />
        <FeatureBox className="md:col-span-3" icon={Layers} title=".md-powered context" desc="Devs upload architecture. PMs upload ideology. The bot inherits your company brain." />
        <FeatureBox className="md:col-span-3" icon={ShieldCheck} title="Row-level access" desc="Agent A only ever sees Agent A's 5 leads. Enforced server-side. No leakage." />
        <FeatureBox className="md:col-span-2" icon={Zap} title="Prompt cache" desc="Frequent queries served from cache. Lower tokens. Faster answers." />
        <FeatureBox className="md:col-span-2" icon={BarChart3} title="Analytics" desc="Top prompts, tokens/user, cache-hit rate — decide what to refine." />
        <FeatureBox className="md:col-span-2" icon={Terminal} title="Own your keys" desc="Bring your own API key or use Emergent's universal key out of the box." />
      </section>

      <footer className="relative z-10 px-8 md:px-16 py-10 border-t border-border font-mono text-xs text-muted-foreground flex justify-between">
        <span>COMPANY/OS © 2026</span>
        <span>build_00.1.0 · plug-and-play</span>
      </footer>
    </div>
  );
}

function FeatureBox({ className = "", icon: Icon, title, desc }) {
  return (
    <div className={`border border-border p-6 bg-card hover:-translate-y-1 transition-transform ${className}`}>
      <Icon className="w-5 h-5 text-primary mb-4" />
      <h3 className="font-display font-bold text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
