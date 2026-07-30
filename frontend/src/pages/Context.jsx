import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import { UploadCloud, Github } from "lucide-react";

export default function Context() {
  const [docs, setDocs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

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

  const uploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true); setMsg("");
    try {
      const form = new FormData();
      Array.from(fileList).forEach((f) => form.append("files", f));
      const { data } = await api.post("/context/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setMsg(`Uploaded ${data.created} file(s).`);
      load();
    } catch (e) {
      setMsg("Error: " + (e.response?.data?.detail || e.message));
    } finally { setUploading(false); }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// context</div>
          <h1 className="font-display font-black text-4xl">Company brain</h1>
          <p className="text-muted-foreground text-sm mt-2">Markdown documents that feed the chatbot's system prompt.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost flex items-center gap-2" onClick={()=>setIngestOpen(true)} data-testid="ingest-btn">
            <Github className="w-4 h-4"/> Ingest codebase
          </button>
          <button className="btn-primary" onClick={startNew} data-testid="new-doc-btn">+ New document</button>
        </div>
      </div>

      {/* DROP ZONE */}
      <div
        ref={dropRef}
        onDragOver={(e)=>{ e.preventDefault(); setDragOver(true); }}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        onClick={()=>fileInputRef.current?.click()}
        className={`border-2 border-dashed p-6 mb-6 cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"}`}
        data-testid="drop-zone"
      >
        <div className="flex items-center gap-4">
          <UploadCloud className="w-6 h-6 text-primary"/>
          <div>
            <div className="font-display font-bold">Drop .md files here</div>
            <div className="text-xs text-muted-foreground font-mono">or click to select · multiple files supported</div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" multiple accept=".md,.markdown,.txt" className="hidden"
          onChange={(e)=>uploadFiles(e.target.files)} data-testid="file-input"/>
      </div>
      {uploading && <div className="text-xs font-mono text-muted-foreground mb-4" data-testid="upload-status">Uploading...</div>}
      {msg && <div className="text-xs font-mono text-primary mb-4" data-testid="upload-msg">{msg}</div>}

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          {docs.map(d => (
            <div key={d.id} className="border border-border p-4 bg-card" data-testid={`doc-${d.id}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display font-bold">{d.title}</div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground mt-1">
                    {d.kind} · updated {(d.updated_at||"").slice(0,10)}
                    {d.source === "auto-ingest" && <span className="text-primary"> · auto-ingested</span>}
                  </div>
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

      {ingestOpen && <IngestModal onClose={()=>{ setIngestOpen(false); load(); }} />}
    </div>
  );
}

function IngestModal({ onClose }) {
  const [repoName, setRepoName] = useState("");
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onFiles = async (fileList) => {
    const arr = await Promise.all(
      Array.from(fileList).map(async (f) => ({ path: f.webkitRelativePath || f.name, content: await f.text() }))
    );
    setFiles(arr);
    if (!repoName) setRepoName(fileList[0]?.webkitRelativePath?.split("/")[0] || "my-repo");
  };

  const run = async () => {
    if (!repoName || files.length === 0) { setMsg("Pick a folder first."); return; }
    setBusy(true); setMsg("");
    try {
      const { data } = await api.post("/context/ingest", { repo_name: repoName, files });
      setMsg(`Generated ${data.created} context doc(s). Closing...`);
      setTimeout(onClose, 1200);
    } catch (e) {
      setMsg("Error: " + (e.response?.data?.detail || e.message));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="chat-glass max-w-2xl w-full p-6" onClick={(e)=>e.stopPropagation()} data-testid="ingest-modal">
        <div className="font-display font-bold text-2xl mb-2">Ingest a codebase</div>
        <p className="text-sm text-muted-foreground mb-4">
          Point at a repo folder. We'll walk the files and auto-generate <b>Architecture</b>, <b>Schema</b>, and <b>Module Map</b> docs
          so the chatbot understands your code — no manual writing.
        </p>
        <label className="font-mono text-xs uppercase text-muted-foreground">Repo name</label>
        <input className="input-tech mt-1 mb-4" value={repoName} onChange={(e)=>setRepoName(e.target.value)} placeholder="my-awesome-app" data-testid="ingest-repo-name"/>
        <label className="font-mono text-xs uppercase text-muted-foreground">Select folder</label>
        <input type="file" webkitdirectory="true" directory="true" multiple className="input-tech mt-1 mb-2"
          onChange={(e)=>onFiles(e.target.files)} data-testid="ingest-folder-input"/>
        {files.length > 0 && (
          <div className="font-mono text-xs text-muted-foreground mb-3" data-testid="ingest-file-count">
            {files.length} files loaded · {(files.reduce((a,f)=>a+f.content.length,0)/1024).toFixed(1)} KB
          </div>
        )}
        {msg && <div className="text-sm font-mono text-primary mb-3" data-testid="ingest-msg">{msg}</div>}
        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={onClose} data-testid="ingest-cancel">Cancel</button>
          <button className="btn-primary" onClick={run} disabled={busy || files.length===0} data-testid="ingest-run">
            {busy ? "Analyzing..." : "Generate context →"}
          </button>
        </div>
      </div>
    </div>
  );
}
