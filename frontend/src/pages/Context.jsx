import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Context() {
  const [docs, setDocs] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => { const { data } = await api.get("/context"); setDocs(data); };
  useEffect(() => { load(); }, []);

  const empty = { id: null, title: "", content: "", kind: "product" };
  const startNew = () => setEditing(empty);
  const save = async () => {
    const payload = { title: editing.title, content: editing.content, kind: editing.kind };
    if (editing.id) await api.put(`/context/${editing.id}`, payload);
    else await api.post("/context", payload);
    setEditing(null); load();
  };
  const del = async (id) => { if (window.confirm("Delete?")) { await api.delete(`/context/${id}`); load(); } };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// context</div>
          <h1 className="font-display font-black text-4xl">Company brain</h1>
          <p className="text-muted-foreground text-sm mt-2">Markdown documents that feed the chatbot's system prompt.</p>
        </div>
        <button className="btn-primary" onClick={startNew} data-testid="new-doc-btn">+ New document</button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          {docs.map(d => (
            <div key={d.id} className="border border-border p-4 bg-card" data-testid={`doc-${d.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-bold">{d.title}</div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground mt-1">{d.kind} · updated {(d.updated_at||"").slice(0,10)}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs" onClick={()=>setEditing(d)} data-testid={`edit-doc-${d.id}`}>Edit</button>
                  <button className="btn-ghost text-xs" onClick={()=>del(d.id)} data-testid={`del-doc-${d.id}`}>Delete</button>
                </div>
              </div>
              <div className="mt-3 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{d.content.slice(0,240)}...</div>
            </div>
          ))}
          {docs.length === 0 && <div className="text-sm text-muted-foreground border border-border p-6">No context docs yet.</div>}
        </div>
        {editing && (
          <div className="border border-primary p-5 h-fit sticky top-6" data-testid="doc-editor">
            <div className="font-display font-bold mb-3">{editing.id ? "Edit document" : "New document"}</div>
            <label className="font-mono text-xs uppercase text-muted-foreground">Title</label>
            <input className="input-tech mt-1 mb-3" value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} data-testid="doc-title"/>
            <label className="font-mono text-xs uppercase text-muted-foreground">Kind</label>
            <select className="input-tech mt-1 mb-3" value={editing.kind} onChange={e=>setEditing({...editing,kind:e.target.value})} data-testid="doc-kind">
              <option value="product">product</option>
              <option value="dev">dev</option>
              <option value="ideology">ideology</option>
              <option value="general">general</option>
            </select>
            <label className="font-mono text-xs uppercase text-muted-foreground">Markdown</label>
            <textarea className="input-tech mt-1 mb-3 font-mono text-sm" rows={12}
              value={editing.content} onChange={e=>setEditing({...editing,content:e.target.value})} data-testid="doc-content"/>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={save} data-testid="doc-save">Save</button>
              <button className="btn-ghost" onClick={()=>setEditing(null)} data-testid="doc-cancel">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
