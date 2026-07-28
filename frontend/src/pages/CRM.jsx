import { useEffect, useState } from "react";
import api from "../lib/api";

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("leads");

  const load = async () => {
    const [l, t, u] = await Promise.all([api.get("/leads"), api.get("/tasks"), api.get("/users")]);
    setLeads(l.data); setTasks(t.data); setUsers(u.data);
  };
  useEffect(() => { load(); }, []);

  const userName = (id) => users.find(u => u.id === id)?.name || id?.slice(0,8);
  const badgeClass = (p) => p === "urgent" ? "badge-urgent" : p === "high" ? "badge-high" : p === "low" ? "badge-low" : "badge-medium";

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// crm</div>
        <h1 className="font-display font-black text-4xl">CRM</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={()=>setTab("leads")} className={tab==="leads"?"btn-primary":"btn-ghost"} data-testid="tab-leads">Leads ({leads.length})</button>
        <button onClick={()=>setTab("tasks")} className={tab==="tasks"?"btn-primary":"btn-ghost"} data-testid="tab-tasks">Tasks ({tasks.length})</button>
      </div>
      <div className="border border-border">
        {tab === "leads" ? (
          <table className="table-tech">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Priority</th><th>Assigned</th></tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td className="font-mono text-xs">{l.id.slice(0,8)}</td>
                  <td>{l.name}</td>
                  <td className="font-mono text-xs">{l.email}</td>
                  <td><span className="badge">{l.status}</span></td>
                  <td><span className={`badge ${badgeClass(l.priority)}`}>{l.priority}</span></td>
                  <td>{userName(l.assigned_to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="table-tech">
            <thead><tr><th>ID</th><th>Title</th><th>Lead</th><th>Priority</th><th>Due</th><th>Status</th><th>Assigned</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{t.id.slice(0,8)}</td>
                  <td>{t.title}</td>
                  <td className="font-mono text-xs">{(t.lead_id||"").slice(0,8)}</td>
                  <td><span className={`badge ${badgeClass(t.priority)}`}>{t.priority}</span></td>
                  <td className="font-mono text-xs">{(t.due_date||"").slice(0,10)}</td>
                  <td><span className={`badge ${t.status==="done"?"badge-done":""}`}>{t.status}</span></td>
                  <td>{userName(t.assigned_to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
