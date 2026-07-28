import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Settings() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { (async ()=>{ const {data} = await api.get("/settings"); setS(data); })(); }, []);
  if (!s) return <div className="p-8 text-muted-foreground">Loading...</div>;

  const disabled = user?.role !== "super_admin";

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api.put("/settings", {
        llm_provider: s.llm_provider, llm_model: s.llm_model,
        api_key_override: s.new_key ?? undefined,
      });
      setMsg("Saved.");
      const { data } = await api.get("/settings"); setS({...data});
    } catch (e) { setMsg("Error: " + (e.response?.data?.detail || e.message)); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <div className="font-mono text-xs uppercase text-muted-foreground mb-1">// settings</div>
        <h1 className="font-display font-black text-4xl">LLM &amp; API</h1>
        {disabled && <p className="text-xs font-mono text-muted-foreground mt-2">read-only (super_admin required)</p>}
      </div>
      <div className="border border-border p-6 space-y-4">
        <div>
          <label className="font-mono text-xs uppercase text-muted-foreground">Provider</label>
          <select className="input-tech mt-1" disabled={disabled} value={s.llm_provider} onChange={e=>setS({...s, llm_provider:e.target.value})} data-testid="settings-provider">
            <option value="anthropic">anthropic</option>
            <option value="openai">openai</option>
            <option value="gemini">gemini</option>
          </select>
        </div>
        <div>
          <label className="font-mono text-xs uppercase text-muted-foreground">Model</label>
          <input className="input-tech mt-1" disabled={disabled} value={s.llm_model} onChange={e=>setS({...s, llm_model:e.target.value})} data-testid="settings-model"/>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            e.g. claude-sonnet-4-6 · gpt-5.4 · gemini-3-flash-preview
          </p>
        </div>
        <div>
          <label className="font-mono text-xs uppercase text-muted-foreground">API key override</label>
          <input className="input-tech mt-1" type="password" disabled={disabled}
            placeholder={s.has_custom_key ? `current: ${s.key_preview}` : "using Emergent Universal Key"}
            onChange={e=>setS({...s, new_key: e.target.value})} data-testid="settings-key"/>
          <p className="text-xs font-mono text-muted-foreground mt-1">Leave blank to keep current. Type "-" and save to clear.</p>
        </div>
        {msg && <div className="text-sm font-mono text-primary" data-testid="settings-msg">{msg}</div>}
        <button className="btn-primary" onClick={save} disabled={saving || disabled} data-testid="settings-save">
          {saving ? "..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
