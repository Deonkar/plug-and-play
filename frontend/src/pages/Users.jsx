import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "agent" });
  const [err, setErr] = useState("");

  const load = async () => { const { data } = await api.get("/users"); setUsers(data); };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault(); setErr("");
    try { await api.post("/users", form); setForm({ email:"",name:"",password:"",role:"agent"}); load(); }
    catch (er) { setErr(er.response?.data?.detail || "Error"); }
  };
  const toggle = async (u) => { await api.patch(`/users/${u.id}/block`, { blocked: !u.blocked }); load(); };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// users</div>
        <h1 className="font-display font-black text-4xl">Team</h1>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 border border-border">
          <table className="table-tech">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} data-testid={`user-row-${u.id}`}>
                  <td>{u.name}</td>
                  <td className="font-mono text-xs">{u.email}</td>
                  <td><span className="badge">{u.role}</span></td>
                  <td>{u.blocked ? <span className="badge badge-urgent">blocked</span> : <span className="badge badge-done">active</span>}</td>
                  <td>
                    <button className="btn-ghost text-xs" onClick={()=>toggle(u)} data-testid={`toggle-user-${u.id}`}>
                      {u.blocked ? "Unblock" : "Block"}
                    </button>
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
