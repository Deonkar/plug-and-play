import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, Clock, Flame, ListChecks, MessageSquare,
  ArrowRight, Circle, CheckCircle2, Activity, Zap,
} from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import EscalationBanner from "../components/EscalationBanner";

const REL_LABEL = (isoDate) => {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (Math.abs(diffMin) < 1) return "just now";
    if (Math.abs(diffMin) < 60) return `${diffMin > 0 ? diffMin + "m ago" : "in " + -diffMin + "m"}`;
    const diffH = Math.round(diffMin / 60);
    if (Math.abs(diffH) < 48) return `${diffH > 0 ? diffH + "h ago" : "in " + -diffH + "h"}`;
    const diffD = Math.round(diffH / 24);
    return `${diffD > 0 ? diffD + "d ago" : "in " + -diffD + "d"}`;
  } catch { return isoDate.slice(0, 10); }
};

const ATTENTION_META = {
  task_escalated: { label: "Escalated task",  icon: AlertTriangle, tone: "danger" },
  task_overdue:   { label: "Overdue task",    icon: Clock,         tone: "warn"   },
  lead_stale:     { label: "Hot lead cold",   icon: Flame,         tone: "warn"   },
};

const STAGE_LABELS = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  hot: "Hot",
  closed: "Closed",
  lost: "Lost",
};

export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/overview")
      .then(({ data }) => setData(data))
      .catch((e) => setErr(e.response?.data?.detail || e.message));
  }, []);

  if (err) return (
    <div className="p-8"><div className="border border-primary/60 bg-primary/[0.05] px-4 py-3 text-sm text-primary" data-testid="overview-error">Failed to load overview: {err}</div></div>
  );
  if (!data) return <div className="p-8 text-muted-foreground" data-testid="overview-loading">Loading your dashboard…</div>;

  const { kpis, quota, attention, funnel, priority_mix, activity } = data;
  const quotaPct = quota.limit > 0 ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;
  const funnelMax = funnel.reduce((m, f) => Math.max(m, f.count), 0);
  const isAdmin = user?.role === "super_admin" || user?.role === "admin";

  return (
    <div className="p-6 md:p-8 space-y-6" data-testid="overview-page">
      {/* Greeting */}
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">/// overview</div>
          <h1 className="font-display font-black text-3xl md:text-4xl">Hi {user?.name?.split(" ")[0]}.</h1>
          <p className="text-muted-foreground text-sm mt-1">Here's what needs your attention right now.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/tasks" className="btn-ghost text-xs" data-testid="quick-tasks">My tasks →</Link>
          {isAdmin && <Link to="/app/crm" className="btn-ghost text-xs" data-testid="quick-crm">CRM →</Link>}
          {isAdmin && <Link to="/app/analytics" className="btn-ghost text-xs" data-testid="quick-analytics">Analytics →</Link>}
        </div>
      </div>

      <EscalationBanner />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <KPI label="Open tasks"   value={kpis.open_tasks}   icon={ListChecks} testid="kpi-open"/>
        <KPI label="Overdue"      value={kpis.overdue}      icon={Clock}     tone={kpis.overdue > 0 ? "warn" : "ok"} testid="kpi-overdue"/>
        <KPI label="Urgent"       value={kpis.urgent_tasks} icon={AlertTriangle} tone={kpis.urgent_tasks > 0 ? "danger" : "ok"} testid="kpi-urgent"/>
        <KPI label="Hot leads"    value={kpis.hot_leads}    icon={Flame}     testid="kpi-hot"/>
        {quota.limit > 0 ? (
          <QuotaKPI used={quota.used} limit={quota.limit} pct={quotaPct} />
        ) : (
          <KPI label="Assistant" value="∞" icon={Zap} testid="kpi-quota"/>
        )}
      </div>

      {/* Attention feed + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attention feed */}
        <div className="lg:col-span-2 border border-border bg-card" data-testid="attention-feed">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="font-display font-bold text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Needs your attention
            </div>
            <div className="font-mono text-[10px] text-muted-foreground tabular-nums">{attention.length} items</div>
          </div>
          {attention.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="font-display font-bold text-sm">All clear.</div>
              <div className="text-xs text-muted-foreground mt-1">Nothing overdue, escalated, or going cold.</div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {attention.map((a) => {
                const meta = ATTENTION_META[a.type] || { label: a.type, icon: Circle, tone: "warn" };
                const Icon = meta.icon;
                const toneClass = meta.tone === "danger" ? "text-primary" : "text-orange-400";
                return (
                  <li key={a.type + a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-primary/[0.03] transition-colors" data-testid={`attn-${a.id}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${toneClass}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">{a.title}</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-0.5">
                        {meta.label} · {REL_LABEL(a.when) || "—"}
                        {a.priority && <span className="ml-2 text-muted-foreground">· {a.priority}</span>}
                      </div>
                    </div>
                    <Link
                      to={a.type === "lead_stale" ? "/app/crm" : "/app/tasks"}
                      className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0"
                    >
                      view <ArrowRight className="w-3 h-3" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pipeline funnel */}
        <div className="border border-border bg-card" data-testid="pipeline-funnel">
          <div className="px-4 py-3 border-b border-border">
            <div className="font-display font-bold text-sm">My pipeline</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{kpis.leads_total} leads · by stage</div>
          </div>
          <div className="p-4 space-y-2">
            {funnel.length === 0 ? (
              <div className="text-xs text-muted-foreground py-6 text-center">No leads assigned yet.</div>
            ) : funnel.map((f) => {
              const pct = funnelMax ? (f.count / funnelMax) * 100 : 0;
              return (
                <div key={f.stage} className="flex items-center gap-2 text-xs">
                  <div className="w-20 text-muted-foreground shrink-0 truncate">{STAGE_LABELS[f.stage] || f.stage}</div>
                  <div className="flex-1 h-4 bg-black/40 border border-border/40 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-primary/60" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-6 text-right font-mono tabular-nums text-foreground">{f.count}</div>
                </div>
              );
            })}
          </div>
          {priority_mix.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Task priority mix</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {priority_mix.map((p) => (
                  <span key={p.priority} className={`badge ${p.priority === "urgent" ? "badge-urgent" : p.priority === "high" ? "badge-high" : p.priority === "low" ? "badge-low" : "badge-medium"}`}>
                    {p.priority} · {p.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity + Quick prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-border bg-card" data-testid="recent-activity">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="font-display font-bold text-sm flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-primary"/> Recent activity</div>
            <div className="font-mono text-[10px] text-muted-foreground">assistant chats · last 6</div>
          </div>
          {activity.length === 0 ? (
            <div className="p-6 text-xs text-muted-foreground text-center">No activity yet — try the orange bubble bottom-right.</div>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((a, i) => (
                <li key={i} className="px-4 py-2.5 flex items-center gap-3 text-xs" data-testid={`activity-${i}`}>
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1 truncate">{a.title}</div>
                  {a.meta?.cache_hit && (
                    <span className="font-mono text-[9px] border border-emerald-800 text-emerald-400 px-1 py-0.5">cached</span>
                  )}
                  <div className="font-mono text-[10px] text-muted-foreground shrink-0 tabular-nums">{REL_LABEL(a.when)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-border bg-card p-4" data-testid="quick-actions">
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">/// quick asks</div>
          <div className="text-xs text-muted-foreground mb-3">Click a question to open the assistant with it pre-filled.</div>
          <div className="space-y-2">
            {[
              "What urgent tasks do I have today?",
              "Which of my leads has been cold the longest?",
              "Summarise this week's escalations.",
            ].map((q) => (
              <button
                key={q}
                onClick={() => window.dispatchEvent(new CustomEvent("cos:ask-assistant", { detail: { message: q } }))}
                data-testid={`quick-ask-${q.slice(0,8)}`}
                className="w-full text-left px-3 py-2 border border-border hover:border-primary/60 hover:bg-primary/[0.04] text-xs transition-all"
              >
                {q}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[10px] font-mono text-muted-foreground border-t border-border pt-3">
            Tip · assistant caches identical questions for an hour — cached answers are marked <span className="text-emerald-400">"cached"</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, tone, testid }) {
  const border = tone === "danger" ? "border-primary" : tone === "warn" ? "border-orange-500/60" : "border-border";
  const color  = tone === "danger" ? "text-primary" : tone === "warn" ? "text-orange-400" : "";
  return (
    <div className={`border p-4 bg-card ${border}`} data-testid={testid}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className={`w-3.5 h-3.5 ${color || "text-muted-foreground"}`} />}
      </div>
      <div className={`font-display font-black text-3xl tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function QuotaKPI({ used, limit, pct }) {
  const tone = pct > 90 ? "danger" : pct > 70 ? "warn" : "ok";
  const barColor = tone === "danger" ? "bg-primary" : tone === "warn" ? "bg-orange-500" : "bg-emerald-500";
  return (
    <div className={`border p-4 bg-card ${tone === "danger" ? "border-primary" : "border-border"}`} data-testid="kpi-quota">
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">My quota</div>
        <Zap className={`w-3.5 h-3.5 ${tone === "danger" ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className={`font-display font-black text-2xl tabular-nums ${tone === "danger" ? "text-primary" : ""}`}>{pct}%</div>
      <div className="mt-2 h-1 bg-black/40 relative overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="font-mono text-[9px] text-muted-foreground mt-1 tabular-nums">
        {used.toLocaleString()} / {limit.toLocaleString()}
      </div>
    </div>
  );
}
