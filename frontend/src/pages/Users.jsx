import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "agent" });
  const [err, setErr] = useState("");
  const [limitEditing, setLimitEditing] = useState(null); // {user, value}

  const load = async () => { const { data } = await api.get("/users"); setUsers(data); };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setErr("");
    try { await api.post("/users", form); setForm({ email:"",name:"",password:"",role:"agent"}); load(); }
    catch (er) { setErr(er.response?.data?.detail || "Error"); }
  };
  const toggle = async (u) => { await api.patch(`/users/${u.id}/block`, { blocked: !u.blocked }); load(); };
  const resetUsage = async (u) => { await api.post(`/users/${u.id}/reset-usage`); load(); };
  const saveLimit = async () => {
    if (!limitEditing) return;
    const v = parseInt(limitEditing.value || "0", 10);
    await api.patch(`/users/${limitEditing.user.id}/limit`, { token_limit: isNaN(v) ? 0 : v });
    setLimitEditing(null); load();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// users</div>
        <h1 className="font-display font-black text-4xl">Team &amp; token quotas</h1>
        <p className="text-muted-foreground text-sm mt-2">Set a monthly token budget per user. 0 = unlimited. Chat requests are rejected with 429 when the cap is reached.</p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 border border-border overflow-x-auto">
          <table className="table-tech min-w-[720px]">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Tokens</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {users.map(u => {
                const used = u.token_used || 0;
                const limit = u.token_limit || 0;
                const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const over = limit > 0 && used >= limit;
                return (
                  <tr key={u.id} data-testid={`user-row-${u.id}`}>
                    <td>{u.name}</td>
                    <td className="font-mono text-xs">{u.email}</td>
                    <td><span className="badge">{u.role}</span></td>
                    <td>{u.blocked ? <span className="badge badge-urgent">blocked</span> : <span className="badge badge-done">active</span>}</td>
                    <td>
                      <div className="min-w-[160px]">
                        <div className="flex items-baseline justify-between font-mono text-[11px] mb-1">
                          <span className={over ? "text-primary" : "text-muted-foreground"}>{used.toLocaleString()}</span>
                          <span className="text-muted-foreground">{limit === 0 ? "∞" : limit.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-black/40 relative overflow-hidden">
                          <div
                            className={`h-full transition-all ${over ? "bg-primary" : pct > 80 ? "bg-orange-500" : "bg-emerald-500"}`}
                            style={{ width: `${limit === 0 ? 3 : pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="btn-ghost text-xs" onClick={()=>setLimitEditing({ user: u, value: String(u.token_limit || "") })} data-testid={`limit-user-${u.id}`}>Set limit</button>
                        <button className="btn-ghost text-xs" onClick={()=>resetUsage(u)} data-testid={`reset-user-${u.id}`}>Reset</button>
                        <button className="btn-ghost text-xs" onClick={()=>toggle(u)} data-testid={`toggle-user-${u.id}`}>
                          {u.blocked ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <form onSubmit={add} className="border border-border p-5 space-y-3 h-fit" data-testid="add-user-form">
          <div className="font-display font-bold mb-2">Invite user</div>
          <input className="input-tech" required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} data-testid="new-user-name"/>
          <input className="input-tech" type="email" required placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} data-testid="new-user-email"/>
          <input className="input-tech" type="password" required minLength={6} placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} data-testid="new-user-password"/>
          <select className="input-tech" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} data-testid="new-user-role">
            <option value="agent">agent</option>
            <option value="admin">admin</option>
          </select>
          {err && <div className="text-primary text-xs font-mono">! {String(err)}</div>}
          <button className="btn-primary w-full" data-testid="add-user-submit">Add</button>
        </form>
      </div>

      {limitEditing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-4" onClick={()=>setLimitEditing(null)}>
          <div className="chat-glass p-6 max-w-md w-full" onClick={(e)=>e.stopPropagation()} data-testid="limit-modal">
            <div className="font-display font-bold text-xl mb-1">Set token limit</div>
            <div className="text-sm text-muted-foreground mb-4">For <b>{limitEditing.user.name}</b> · currently used {(limitEditing.user.token_used || 0).toLocaleString()}</div>
            <div className="flex gap-2 mb-3">
              {[0, 5000, 10000, 25000, 50000].map(v => (
                <button key={v} onClick={()=>setLimitEditing({...limitEditing, value: String(v)})}
                  className={`text-xs font-mono border px-3 py-1.5 transition-colors ${String(v) === String(limitEditing.value) ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/60"}`}
                  data-testid={`limit-preset-${v}`}>
                  {v === 0 ? "∞" : `${v/1000}k`}
                </button>
              ))}
            </div>
            <input className="input-tech font-mono" type="number" min="0" value={limitEditing.value}
              onChange={e=>setLimitEditing({...limitEditing, value: e.target.value})}
              placeholder="0 = unlimited" data-testid="limit-input" autoFocus/>
            <div className="text-[11px] font-mono text-muted-foreground mt-2">Tokens per month. Use "Reset" to clear the used counter.</div>
            <div className="flex gap-2 justify-end mt-5">
              <button className="btn-ghost" onClick={()=>setLimitEditing(null)} data-testid="limit-cancel">Cancel</button>
              <button className="btn-primary" onClick={saveLimit} data-testid="limit-save">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
