import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const load = async () => { const { data } = await api.get("/tasks"); setTasks(data); };
  useEffect(() => { load(); }, []);
  const complete = async (id) => { await api.patch(`/tasks/${id}/done`); load(); };

  const badgeClass = (p) => p === "urgent" ? "badge-urgent" : p === "high" ? "badge-high" : p === "low" ? "badge-low" : "badge-medium";

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// tasks</div>
        <h1 className="font-display font-black text-4xl">My tasks</h1>
      </div>
      <div className="border border-border">
        <table className="table-tech">
          <thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} data-testid={`task-row-${t.id}`}>
                <td className="font-mono text-xs">{t.id.slice(0,8)}</td>
                <td>{t.title}</td>
                <td><span className={`badge ${badgeClass(t.priority)}`}>{t.priority}</span></td>
                <td className="font-mono text-xs">{(t.due_date||"").slice(0,10)}</td>
                <td><span className={`badge ${t.status==="done"?"badge-done":""}`}>{t.status}</span></td>
                <td>
                  {t.status !== "done" && (
                    <button onClick={()=>complete(t.id)} className="btn-ghost text-xs" data-testid={`task-done-${t.id}`}>Mark done</button>
                  )}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && <tr><td colSpan="6" className="text-sm text-muted-foreground p-6">No tasks assigned.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
