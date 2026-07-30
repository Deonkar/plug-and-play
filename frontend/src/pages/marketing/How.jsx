import { Link } from "react-router-dom";
import { GitBranch, FileCode, Bot, ArrowRight, Zap, ShieldCheck, Slack, Mic } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";
import { safeHtml } from "../../lib/sanitize";

export default function How() {
  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-12">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// how it works</div>
        <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] max-w-3xl">
          Three moves.<br />Then it's <span className="text-primary">yours</span>.
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-6 text-lg leading-relaxed">
          Company/OS is a single service you drop next to your existing stack. It reads what your team
          already writes — code, markdown, CRM data — and serves it back through a chat interface with
          per-user access enforced everywhere.
        </p>
      </section>

      <section className="px-6 md:px-16 pb-24 border-b border-border">
        <div className="grid md:grid-cols-3 gap-4">
          <BigStep n="01" icon={GitBranch} title="Install &amp; ingest"
            body="Drop the service in your stack. Point it at your repo folder. The bot walks the tree and uses Claude Sonnet to synthesize three markdown docs — Architecture, Database Schema, Module Map — that live inside your tenant."
            bullets={[
              "One command to boot the backend (FastAPI + Mongo).",
              "Folder-picker in the Context page uploads &amp; auto-summarizes.",
              "Marked 'auto-ingested' so admins can edit or delete freely.",
            ]}
          />
          <BigStep n="02" icon={FileCode} title="Feed context"
            body="Devs and PMs drop .md files or paste straight into the editor. Ideology, playbooks, escalation rules, product briefs — every file is concatenated into the LLM's system prompt at runtime."
            bullets={[
              "Drag-and-drop .md upload (auto-tagged dev / product / ideology).",
              "Inline editor with markdown preview.",
              "Versioned by updated_at — always fresh.",
            ]}
          />
          <BigStep n="03" icon={Bot} title="Ship the widget"
            body="Your team sees a floating chat in their CRM. Each agent gets answers scoped to their leads &amp; tasks. Admins get analytics, escalation banners, and Slack alerts."
            bullets={[
              "Glassmorphic bottom-right widget, mobile full-screen.",
              "Voice input via Whisper — hands-free between calls.",
              "Row-level RBAC + system-prompt scoping (no data leakage).",
            ]}
          />
        </div>
      </section>

      <section className="px-6 md:px-16 py-24 border-b border-border">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// under the hood</div>
        <h2 className="font-display font-black text-4xl md:text-5xl mb-10">The four systems.</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <System icon={ShieldCheck} title="Access control"
            body="JWT auth (bcrypt + HS256, 7-day tokens). Roles: super_admin / admin / agent. Every query includes company_id + user_id filters. The system prompt only ever contains the requesting user's leads/tasks."
          />
          <System icon={Zap} title="Prompt cache"
            body="SHA-256 key = (company_id, scope, message.lower). Scope is user_id for agents, role for admins — so agents can't leak between each other, admins share cache. 1-hour TTL, transparent cache-hit indicator in the widget."
          />
          <System icon={Slack} title="Escalation engine"
            body="Two rules run on every /escalations poll: (1) task.priority=urgent AND now > due_date; (2) lead.status=hot AND no touch in 48h. Slack webhook fires once per event per day (deduped in Mongo)."
          />
          <System icon={Mic} title="Voice pipeline"
            body="Browser MediaRecorder → webm/opus → multipart POST /api/voice/transcribe → OpenAI Whisper-1 via Emergent Universal Key → transcript auto-fills chat input and sends. 25MB cap enforced server-side."
          />
        </div>
      </section>

      <section className="px-6 md:px-16 py-24">
        <div className="border border-primary p-10 md:p-14 bg-gradient-to-br from-primary/10 to-transparent">
          <h3 className="font-display font-black text-3xl md:text-4xl mb-4">Ready to install?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg">Register a workspace and you'll land on the demo tenant with seeded users, leads and context docs.</p>
          <Link to="/register" className="btn-primary flex items-center gap-2 w-fit" data-testid="how-cta-register">
            Register now <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
}

function BigStep({ n, icon: Icon, title, body, bullets }) {
  return (
    <div className="border border-border p-6 md:p-8 bg-card">
      <div className="flex items-start justify-between mb-6">
        <span className="font-mono text-xs text-muted-foreground">{n}</span>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-display font-bold text-2xl mb-3" dangerouslySetInnerHTML={safeHtml(title)} />
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{body}</p>
      <ul className="space-y-1.5 text-sm">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-muted-foreground">
            <span className="text-primary shrink-0">›</span>
            <span dangerouslySetInnerHTML={safeHtml(b)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function System({ icon: Icon, title, body }) {
  return (
    <div className="border border-border p-6 bg-card group hover:border-primary/60 transition-colors">
      <Icon className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
      <h4 className="font-display font-bold text-lg mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
