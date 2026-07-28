import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Overview() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    (async () => {
      const t = await api.get("/tasks").catch(()=>({data:[]}));
      const l = await api.get("/leads").catch(()=>({data:[]}));
      setTasks(t.data); setLeads(l.data);
    })();
  }, []);

  const urgent = tasks.filter(t => t.status !== "done" && t.priority === "urgent");
  const open = tasks.filter(t => t.status !== "done");

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// overview</div>
        <h1 className="font-display font-black text-4xl">Hi {user?.name?.split(" ")[0]}.</h1>
        <p className="text-muted-foreground mt-1">Here's what needs your attention.</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Open Tasks" value={open.length} testid="stat-tasks"/>
        <Stat label="Urgent" value={urgent.length} accent testid="stat-urgent"/>
        <Stat label="My Leads" value={leads.length} testid="stat-leads"/>
      </div>
      <div className="border border-border">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="font-display font-bold">Urgent tasks</div>
          <div className="font-mono text-xs text-muted-foreground">{urgent.length} pending</div>
        </div>
        {urgent.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">Nothing urgent — good job.</div>
        ) : (
          <table className="table-tech">
            <thead><tr><th>Task</th><th>Priority</th><th>Due</th><th>Lead</th></tr></thead>
            <tbody>
              {urgent.map(t => (
                <tr key={t.id} data-testid={`urgent-row-${t.id}`}>
                  <td>{t.title}</td>
                  <td><span className="badge badge-urgent">{t.priority}</span></td>
                  <td className="font-mono text-xs">{(t.due_date || "").slice(0,10)}</td>
                  <td className="font-mono text-xs">{(t.lead_id || "").slice(0,8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-6 text-xs font-mono text-muted-foreground">// tip: click the orange bubble bottom-right to ask the assistant anything.</p>
    </div>
  );
}

function Stat({ label, value, accent, testid }) {
  return (
    <div className={`border p-5 ${accent ? "border-primary" : "border-border"} bg-card`} data-testid={testid}>
      <div className="font-mono text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`font-display font-black text-4xl mt-2 ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
