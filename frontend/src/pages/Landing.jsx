import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import CRMDemo from "../components/demo/CRMDemo";
import AdminDemo from "../components/demo/AdminDemo";
import HeroDemo from "../components/demo/HeroDemo";
import MdToChat from "../components/MdToChat";

export default function Landing() {
  return (
    <MarketingLayout>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="px-6 md:px-16 pt-24 md:pt-40 pb-32 md:pb-56 relative">
        <div className="max-w-6xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="font-mono text-[11px] text-primary tracking-[0.25em] uppercase mb-8"
            data-testid="hero-tag"
          >
            A plug-and-play operating system
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}
            className="font-display font-black text-6xl md:text-8xl lg:text-9xl leading-[0.92] tracking-tight max-w-5xl mx-auto"
            data-testid="hero-headline"
          >
            The chatbot that<br />
            <span className="text-primary">knows your business.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
            className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto mt-10 leading-relaxed"
          >
            Install once. It reads your repo, digests your team's markdown, and answers with
            strict per-user CRM scope.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-14 flex flex-wrap gap-3 justify-center items-center"
          >
            <Link to="/pricing" data-testid="hero-cta-primary" className="btn-primary flex items-center gap-2 text-base px-6 py-3">
              Register now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/how" data-testid="hero-cta-how" className="btn-ghost text-base px-6 py-3">Learn more</Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ PRODUCT MOMENT — the chat, alone ═══════════════ */}
      <ProductMoment />

      {/* ═══════════════ NUMBERS ═══════════════ */}
      <section className="py-32 md:py-40 px-6 md:px-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-14 md:gap-y-0">
          {[
            { k: "Install", v: "< 5 min" },
            { k: "Data leaks", v: "0" },
            { k: "Cache hit", v: "48%" },
            { k: "Auto docs", v: "3 files" },
          ].map((s) => (
            <div key={s.k} className="text-center">
              <div className="font-display font-black text-5xl md:text-6xl text-foreground leading-none">{s.v}</div>
              <div className="mt-3 text-sm md:text-base text-muted-foreground">{s.k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ONE LINE, ONE IDEA ═══════════════ */}
      <section className="px-6 md:px-16 pt-40 md:pt-56 pb-20 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="font-display font-black text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight">
            Your team already writes<br />the answers. <span className="text-primary">In markdown.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mt-10 max-w-2xl mx-auto leading-relaxed">
            Drop the .md files in. Or point at a repo — the bot walks it and writes its own architecture,
            schema, and module docs. Then it answers your team's questions with row-level access.
          </p>
        </motion.div>
      </section>

      {/* premium visual filling the space */}
      <MdToChat />

      {/* ═══════════════ THREE PILLARS ═══════════════ */}
      <section className="px-6 md:px-16 py-32 md:py-40">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 md:gap-16">
          {[
            { t: "Contextual", b: "It reads your dev docs, PM briefs, escalation rules, and CRM data. No fine-tuning. No wiring." },
            { t: "Scoped", b: "An agent only ever sees their own leads and tasks — enforced server-side and in the system prompt itself." },
            { t: "Plug-and-play", b: "Drops into any dashboard as a floating widget. Multi-tenant from day one. Bring your own LLM key if you want." },
          ].map((p, i) => (
            <motion.div key={p.t}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Pillar title={p.t} body={p.b} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ LIVE DEMOS ═══════════════ */}
      <section id="demo" className="py-32 md:py-40 px-6 md:px-16 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20 md:mb-24 max-w-3xl mx-auto"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-6">See it running</div>
            <h2 className="font-display font-black text-5xl md:text-7xl leading-[0.95] tracking-tight">
              Not a screenshot.<br />
              <span className="text-primary">A live walkthrough.</span>
            </h2>
          </motion.div>

          <div className="space-y-24 md:space-y-32">
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-8 text-center max-w-xl mx-auto">
                <div className="font-display font-bold text-2xl md:text-3xl">Inside a customer's CRM.</div>
                <p className="text-muted-foreground text-sm mt-2">The widget is the only Company/OS surface an agent ever sees.</p>
              </div>
              <CRMDemo />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
            >
              <div className="mb-8 text-center max-w-xl mx-auto">
                <div className="font-display font-bold text-2xl md:text-3xl">The admin console.</div>
                <p className="text-muted-foreground text-sm mt-2">Auto-cycling through analytics, token quotas, and the .md context brain.</p>
              </div>
              <AdminDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SILENT CLOSER ═══════════════ */}
      <section className="px-6 md:px-16 py-40 md:py-56 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
            Your CRM is loud.<br />
            <span className="text-primary">Make it answer back.</span>
          </h2>
          <div className="mt-14 flex flex-wrap gap-3 justify-center">
            <Link to="/pricing" className="btn-primary flex items-center gap-2 text-base px-7 py-3.5" data-testid="footer-cta-register">
              Register now <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-ghost text-base px-7 py-3.5" data-testid="footer-cta-login">Sign in to the demo</Link>
          </div>
          <p className="mt-8 font-mono text-[11px] text-muted-foreground tracking-wider">
            demo · admin@acme.demo &nbsp;·&nbsp; agent · alice@acme.demo &nbsp;·&nbsp; pw: admin123 / agent123
          </p>
        </motion.div>
      </section>
    </MarketingLayout>
  );
}

function Pillar({ title, body }) {
  return (
    <div className="text-center md:text-left">
      <div className="inline-block w-8 h-[2px] bg-primary mb-6 md:mb-8" />
      <h3 className="font-display font-black text-3xl md:text-4xl mb-4 tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed max-w-sm md:max-w-none">{body}</p>
    </div>
  );
}

/* A single, hero-sized "product moment" — a self-playing CRM+widget interaction */
function ProductMoment() {
  return (
    <section className="px-6 md:px-16 pb-32 md:pb-40 relative">
      <div className="max-w-5xl mx-auto relative">
        {/* ambient glow behind */}
        <div className="absolute -inset-16 bg-primary/15 blur-[120px] opacity-70 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <HeroDemo />
        </motion.div>
      </div>
    </section>
  );
}
