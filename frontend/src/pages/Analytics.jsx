import { useEffect, useState } from "react";
import api from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from "recharts";

export default function Analytics() {
  const [d, setD] = useState(null);
  useEffect(() => { (async ()=>{ const {data} = await api.get("/analytics/overview"); setD(data); })(); }, []);
  if (!d) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// analytics</div>
        <h1 className="font-display font-black text-4xl">Insights</h1>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card label="Total messages" value={d.total_messages} testid="an-total"/>
        <Card label="Cache hits" value={d.cache_hits} testid="an-cache"/>
        <Card label="Cache-hit rate" value={`${Math.round(d.cache_hit_rate*100)}%`} accent testid="an-rate"/>
        <Card label="Users" value={d.users_count} testid="an-users"/>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-border p-5">
          <div className="font-display font-bold mb-4">Tokens by user</div>
          <div className="h-64" data-testid="chart-tokens">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.per_user}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3"/>
                <XAxis dataKey="user_name" stroke="#666" fontSize={11}/>
                <YAxis stroke="#666" fontSize={11}/>
                <Tooltip contentStyle={{background:"#0a0a0a", border:"1px solid #222"}}/>
                <Legend/>
                <Bar dataKey="tokens_in" stackId="a" fill="hsl(0 0% 55%)" name="in"/>
                <Bar dataKey="tokens_out" stackId="a" fill="hsl(15 100% 50%)" name="out"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border border-border p-5">
          <div className="font-display font-bold mb-4">Query volume (14d)</div>
          <div className="h-64" data-testid="chart-volume">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.time_series}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3"/>
                <XAxis dataKey="date" stroke="#666" fontSize={11}/>
                <YAxis stroke="#666" fontSize={11}/>
                <Tooltip contentStyle={{background:"#0a0a0a", border:"1px solid #222"}}/>
                <Line dataKey="queries" stroke="hsl(15 100% 50%)" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="border border-border mt-6">
        <div className="px-5 py-3 border-b border-border font-display font-bold">Top prompts</div>
        <table className="table-tech">
          <thead><tr><th>#</th><th>Prompt</th><th>Count</th><th>Tokens</th></tr></thead>
          <tbody>
            {d.top_prompts.map((p, i) => (
              <tr key={i} data-testid={`top-prompt-${i}`}>
                <td className="font-mono text-xs">{i+1}</td>
                <td>{p.message}</td>
                <td className="font-mono text-xs">{p.count}</td>
                <td className="font-mono text-xs">{p.tokens}</td>
              </tr>
            ))}
            {d.top_prompts.length === 0 && <tr><td colSpan="4" className="text-sm text-muted-foreground p-6">No queries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, accent, testid }) {
  return (
    <div className={`border p-5 bg-card ${accent ? "border-primary" : "border-border"}`} data-testid={testid}>
      <div className="font-mono text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`font-display font-black text-3xl mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
