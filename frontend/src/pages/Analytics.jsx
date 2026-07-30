import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const PALETTE = ["hsl(15 100% 50%)", "hsl(0 0% 60%)", "hsl(30 90% 55%)", "hsl(0 0% 35%)"];

export default function Analytics() {
  const [d, setD] = useState(null);
  const [users, setUsers] = useState([]);
  const [esc, setEsc] = useState(null);

  useEffect(() => {
    (async () => {
      const [an, u, e] = await Promise.all([
        api.get("/analytics/overview").catch(()=>({ data: null })),
        api.get("/users").catch(()=>({ data: [] })),
        api.get("/escalations").catch(()=>({ data: { tasks: [], leads: [], total: 0 }})),
      ]);
      setD(an.data); setUsers(u.data); setEsc(e.data);
    })();
  }, []);

  if (!d) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const totalTokensIn = d.per_user.reduce((s, u) => s + (u.tokens_in || 0), 0);
  const totalTokensOut = d.per_user.reduce((s, u) => s + (u.tokens_out || 0), 0);
  const avgTokensPerMsg = d.total_messages ? Math.round((totalTokensIn + totalTokensOut) / d.total_messages) : 0;
  const cacheData = [
    { name: "Hit", value: d.cache_hits },
    { name: "Miss", value: Math.max(0, d.total_messages - d.cache_hits) },
  ];
  const quotaData = users.filter(u => u.role !== "super_admin").map(u => ({
    name: u.name.split(" ")[0],
    used: u.token_used || 0,
    remaining: Math.max(0, (u.token_limit || 0) - (u.token_used || 0)),
    limit: u.token_limit || 0,
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// analytics</div>
        <h1 className="font-display font-black text-4xl">Insights</h1>
        <p className="text-muted-foreground text-sm mt-2">Everything about spend, cache health, quotas, escalations and the questions your team asks most.</p>
      </div>

      {/* Row 1: KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <KPI label="Messages" value={d.total_messages} testid="an-total"/>
        <KPI label="Cache hits" value={d.cache_hits} testid="an-cache"/>
        <KPI label="Hit rate" value={`${Math.round(d.cache_hit_rate*100)}%`} accent testid="an-rate"/>
        <KPI label="Users" value={d.users_count} testid="an-users"/>
        <KPI label="Avg tokens/msg" value={avgTokensPerMsg} testid="an-avg"/>
        <KPI label="Escalations" value={esc?.total || 0} tone={esc?.total > 0 ? "warn" : "ok"} testid="an-esc"/>
      </div>

      {/* Row 2: Tokens by user + Cache donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 border border-border p-5">
          <div className="font-display font-bold mb-1">Tokens by user</div>
          <div className="text-xs text-muted-foreground mb-3 font-mono">in = context sent · out = model reply</div>
          <div className="h-64" data-testid="chart-tokens">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.per_user}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                <XAxis dataKey="user_name" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <Tooltip contentStyle={{background:"hsl(var(--card))", border:"1px solid hsl(var(--border))"}}/>
                <Legend/>
                <Bar dataKey="tokens_in" stackId="a" fill="hsl(0 0% 55%)" name="in"/>
                <Bar dataKey="tokens_out" stackId="a" fill="hsl(15 100% 50%)" name="out"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border p-5">
          <div className="font-display font-bold mb-1">Cache hit vs miss</div>
          <div className="text-xs text-muted-foreground mb-3 font-mono">every hit is money saved</div>
          <div className="h-64" data-testid="chart-cache">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cacheData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {cacheData.map((_, i) => <Cell key={i} fill={PALETTE[i]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:"hsl(var(--card))", border:"1px solid hsl(var(--border))"}}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Query volume area + Quota utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="border border-border p-5">
          <div className="font-display font-bold mb-1">Query volume — last 14 days</div>
          <div className="text-xs text-muted-foreground mb-3 font-mono">total messages per day</div>
          <div className="h-56" data-testid="chart-volume">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.time_series}>
                <defs>
                  <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(15 100% 50%)" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="hsl(15 100% 50%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                <Tooltip contentStyle={{background:"hsl(var(--card))", border:"1px solid hsl(var(--border))"}}/>
                <Area dataKey="queries" stroke="hsl(15 100% 50%)" strokeWidth={2} fill="url(#volFill)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-border p-5">
          <div className="font-display font-bold mb-1">Quota utilization by agent</div>
          <div className="text-xs text-muted-foreground mb-3 font-mono">grey = remaining · orange = used</div>
          <div className="h-56" data-testid="chart-quotas">
            {quotaData.filter(q => q.limit > 0).length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No quotas set. <span className="text-primary ml-1">Set one from Users.</span></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quotaData.filter(q => q.limit > 0)} layout="vertical">
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3"/>
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11}/>
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={60}/>
                  <Tooltip contentStyle={{background:"hsl(var(--card))", border:"1px solid hsl(var(--border))"}}/>
                  <Legend/>
                  <Bar dataKey="used" stackId="q" fill="hsl(15 100% 50%)" name="used"/>
                  <Bar dataKey="remaining" stackId="q" fill="hsl(0 0% 30%)" name="remaining"/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Escalation summary + Top prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border border-border p-5 lg:col-span-1">
          <div className="font-display font-bold mb-4">Live escalations</div>
          <div className="flex items-baseline gap-3 mb-6">
            <div className={`font-display font-black text-5xl ${(esc?.total || 0) > 0 ? "text-primary" : ""}`}>{esc?.total || 0}</div>
            <div className="font-mono text-xs text-muted-foreground">total right now</div>
          </div>
          <div className="space-y-3 text-sm">
            <EscRow label="Urgent tasks overdue" value={esc?.tasks?.length || 0}/>
            <EscRow label="Hot leads untouched 48h+" value={esc?.leads?.length || 0}/>
          </div>
          {(esc?.tasks?.length || 0) > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">most recent</div>
              <ul className="space-y-1.5 text-xs">
                {esc.tasks.slice(0,3).map(t => (
                  <li key={t.id} className="truncate"><span className="text-primary font-mono">▸</span> {t.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border border-border lg:col-span-2">
          <div className="px-5 py-3 border-b border-border font-display font-bold">Top prompts</div>
          <table className="table-tech">
            <thead><tr><th>#</th><th>Prompt</th><th className="text-right">Count</th><th className="text-right">Tokens</th></tr></thead>
            <tbody>
              {d.top_prompts.map((p, i) => (
                <tr key={i} data-testid={`top-prompt-${i}`}>
                  <td className="font-mono text-xs">{i+1}</td>
                  <td className="max-w-xs truncate">{p.message}</td>
                  <td className="font-mono text-xs text-right">{p.count}</td>
                  <td className="font-mono text-xs text-right">{p.tokens.toLocaleString()}</td>
                </tr>
              ))}
              {d.top_prompts.length === 0 && <tr><td colSpan="4" className="text-sm text-muted-foreground p-6 text-center">No queries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent, tone, testid }) {
  const border = tone === "warn" ? "border-primary" : accent ? "border-primary" : "border-border";
  const color = tone === "warn" ? "text-primary" : accent ? "text-primary" : "";
  return (
    <div className={`border p-4 bg-card ${border}`} data-testid={testid}>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display font-black text-2xl md:text-3xl mt-1.5 ${color}`}>{value}</div>
    </div>
  );
}

function EscRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground">{label}</div>
      <div className={`font-display font-black text-xl ${value > 0 ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
