import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Copy, Check, Lock } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";
import { useAuth } from "../../lib/auth";

const SECTIONS = [
  {
    id: "auth",
    label: "Authentication",
    intro:
      "JWT bearer tokens issued by /api/auth/login and /api/auth/register. Include as Authorization: Bearer <token> on every subsequent call. Token lifetime is 7 days.",
    endpoints: [
      {
        method: "POST", path: "/api/auth/register",
        desc: "Create a new tenant company and its first super_admin user.",
        body: `{ "email": "you@acme.com", "password": "secret6", "name": "Ada", "company_name": "Acme Corp" }`,
        resp: `{ "token": "eyJ...", "user": { "id":"...","role":"super_admin", ... } }`,
      },
      {
        method: "POST", path: "/api/auth/login",
        desc: "Log in an existing user. Returns a JWT bearer token.",
        body: `{ "email": "admin@acme.demo", "password": "admin123" }`,
        resp: `{ "token": "eyJ...", "user": { ... } }`,
      },
      {
        method: "GET", path: "/api/auth/me", auth: true,
        desc: "Return the currently authenticated user.",
        resp: `{ "id": "...", "email": "...", "role": "super_admin", "company_id": "...", ... }`,
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    intro: "Admin-only endpoints (super_admin & admin) for managing tenant members.",
    endpoints: [
      { method: "GET", path: "/api/users", auth: true, desc: "List all users in the current company." },
      {
        method: "POST", path: "/api/users", auth: true,
        desc: "Invite a new user to the current company.",
        body: `{ "email":"agent@acme.com","name":"Alice","password":"pw6+","role":"agent" }`,
      },
      {
        method: "PATCH", path: "/api/users/{user_id}/block", auth: true,
        desc: "Toggle a user's blocked flag. Blocked users cannot authenticate.",
        body: `{ "blocked": true }`,
      },
    ],
  },
  {
    id: "context",
    label: "Context Docs",
    intro:
      "The .md system prompt corpus. Every context doc for a tenant is concatenated into the LLM system prompt at chat time.",
    endpoints: [
      { method: "GET", path: "/api/context", auth: true, desc: "List all context docs for the current tenant." },
      {
        method: "POST", path: "/api/context", auth: true,
        desc: "Create a new context doc from text (admin).",
        body: `{ "title": "Escalation Rules", "content": "...markdown...", "kind": "dev" }`,
      },
      { method: "PUT", path: "/api/context/{id}", auth: true, desc: "Update a doc's title/content/kind (admin)." },
      { method: "DELETE", path: "/api/context/{id}", auth: true, desc: "Delete a context doc (admin)." },
      {
        method: "POST", path: "/api/context/upload", auth: true,
        desc: "Multipart .md upload — attach one or more files under the 'files' field. Auto-tags kind by filename.",
      },
      {
        method: "POST", path: "/api/context/ingest", auth: true,
        desc: "Auto-ingest a codebase. Sends a file tree to Claude which returns 3 structured docs (Architecture / Schema / Module Map).",
        body: `{ "repo_name": "my-app", "files": [ { "path": "server.py", "content": "..." }, ... ] }`,
      },
    ],
  },
  {
    id: "crm",
    label: "CRM (Leads &amp; Tasks)",
    intro:
      "Row-level scoping is enforced: agents receive only records where assigned_to == their user_id. Admins receive the full tenant view.",
    endpoints: [
      { method: "GET", path: "/api/leads", auth: true, desc: "List leads scoped by role." },
      { method: "POST", path: "/api/leads", auth: true, desc: "Create a lead (admin).", body: `{ "name":"...", "email":"...", "assigned_to":"user-id", "priority":"high", "status":"warm" }` },
      { method: "GET", path: "/api/tasks", auth: true, desc: "List tasks scoped by role." },
      { method: "POST", path: "/api/tasks", auth: true, desc: "Create a task (admin).", body: `{ "lead_id":"...", "title":"...", "priority":"urgent", "due_date":"2026-08-01T00:00:00Z", "assigned_to":"user-id" }` },
      { method: "PATCH", path: "/api/tasks/{id}/done", auth: true, desc: "Mark a task done. Agents can only mark their own." },
    ],
  },
  {
    id: "chat",
    label: "Chat",
    intro: "The main conversational endpoint. Cached for 1h per (company, user_scope, message).",
    endpoints: [
      {
        method: "POST", path: "/api/chat", auth: true,
        desc: "Send a message. Returns the assistant answer + token usage + cache-hit flag.",
        body: `{ "message":"what urgent tasks do I have today?", "session_id":"optional" }`,
        resp: `{ "answer":"You have 1 URGENT task...", "session_id":"...", "tokens_in":479, "tokens_out":165, "cache_hit":false }`,
      },
      { method: "GET", path: "/api/chat/history?session_id={id}", auth: true, desc: "Return all messages for a session (or all sessions for the user)." },
    ],
  },
  {
    id: "voice",
    label: "Voice",
    intro: "Whisper-1 transcription for the mic button. Accepts webm/mp3/wav/m4a/mp4/mpeg/mpga up to 25MB.",
    endpoints: [
      {
        method: "POST", path: "/api/voice/transcribe", auth: true,
        desc: "Multipart audio → transcribed text. Field name: 'file'.",
        resp: `{ "text": "what urgent tasks do I have today" }`,
      },
    ],
  },
  {
    id: "escalations",
    label: "Escalations",
    intro:
      "Rule engine that returns overdue urgent tasks and untouched hot leads. Fires Slack webhook (if configured) once per event per day.",
    endpoints: [
      {
        method: "GET", path: "/api/escalations", auth: true,
        desc: "Escalated tasks + leads scoped by role.",
        resp: `{ "tasks":[ ... ], "leads":[ ... ], "total": 4 }`,
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    intro: "Admin-only aggregate metrics for the current tenant.",
    endpoints: [
      {
        method: "GET", path: "/api/analytics/overview", auth: true,
        desc: "Returns total_messages, cache_hits, cache_hit_rate, per_user tokens, top_prompts, 14-day time_series.",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    intro: "LLM provider/model, custom API key, and Slack webhook URL per tenant.",
    endpoints: [
      { method: "GET", path: "/api/settings", auth: true, desc: "Return current tenant settings (key masked)." },
      { method: "PUT", path: "/api/settings", auth: true, desc: "Update tenant settings (super_admin only).", body: `{ "llm_provider":"anthropic","llm_model":"claude-sonnet-4-6","slack_webhook_url":"https://hooks.slack.com/...","api_key_override":null }` },
    ],
  },
];

const methodColor = {
  GET: "border-emerald-600 text-emerald-400",
  POST: "border-primary text-primary",
  PUT: "border-orange-500 text-orange-400",
  PATCH: "border-orange-500 text-orange-400",
  DELETE: "border-red-600 text-red-400",
};

export default function ApiDocs() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <MarketingLayout>
        <div className="px-6 md:px-16 py-24 font-mono text-muted-foreground">// authenticating...</div>
      </MarketingLayout>
    );
  }
  if (!user) return <Navigate to="/login?next=/reference" replace />;

  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-8 border-b border-border">
        <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary tracking-widest mb-3">
          <Lock className="w-3 h-3" /> /// signed in as {user.email}
        </div>
        <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] max-w-3xl">
          API Reference.
        </h1>
        <p className="text-muted-foreground max-w-2xl mt-6 text-lg leading-relaxed">
          Every endpoint under <code className="font-mono text-primary">/api</code>. All authenticated
          calls need <code className="font-mono text-primary">Authorization: Bearer &lt;token&gt;</code>.
        </p>
        <div className="mt-6 flex gap-3 flex-wrap">
          <Link to="/app" className="btn-primary text-sm">Open dashboard →</Link>
          <a href="#auth" className="btn-ghost text-sm">Jump to endpoints</a>
        </div>
      </section>

      {/* TOC + content */}
      <section className="px-6 md:px-16 py-12 grid md:grid-cols-12 gap-10">
        <aside className="md:col-span-3 md:sticky md:top-24 h-fit">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">/// sections</div>
          <ul className="space-y-1.5 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-muted-foreground hover:text-primary transition-colors block py-1" data-testid={`toc-${s.id}`}
                  dangerouslySetInnerHTML={{__html: s.label}} />
              </li>
            ))}
          </ul>
        </aside>

        <div className="md:col-span-9 space-y-14">
          {SECTIONS.map((s) => (
            <div key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-baseline gap-3 mb-3">
                <div className="w-1.5 h-1.5 bg-primary" />
                <h2 className="font-display font-black text-3xl" dangerouslySetInnerHTML={{__html: s.label}} />
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl mb-6" dangerouslySetInnerHTML={{__html: s.intro}} />
              <div className="space-y-3">
                {s.endpoints.map((e, i) => <Endpoint key={i} e={e} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}

function Endpoint({ e }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(`${e.method} ${e.path}`);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
        <span className={`text-[10px] font-mono uppercase tracking-widest border px-2 py-1 ${methodColor[e.method]}`}>{e.method}</span>
        <code className="font-mono text-sm text-white break-all flex-1">{e.path}</code>
        {e.auth && <span className="text-[10px] font-mono uppercase text-primary flex items-center gap-1"><Lock className="w-3 h-3"/> auth</span>}
        <button onClick={copy} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1" data-testid={`copy-${e.path}`}>
          {copied ? <><Check className="w-3 h-3"/> copied</> : <><Copy className="w-3 h-3"/> copy</>}
        </button>
      </div>
      <div className="px-4 py-3 text-sm text-muted-foreground">{e.desc}</div>
      {e.body && (
        <div className="px-4 pb-3">
          <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1.5">request body</div>
          <pre className="bg-black/60 border border-border p-3 text-xs overflow-x-auto"><code>{e.body}</code></pre>
        </div>
      )}
      {e.resp && (
        <div className="px-4 pb-4">
          <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1.5">response</div>
          <pre className="bg-black/60 border border-border p-3 text-xs overflow-x-auto"><code>{e.resp}</code></pre>
        </div>
      )}
    </div>
  );
}
