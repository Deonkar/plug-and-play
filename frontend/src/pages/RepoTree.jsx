import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronDown, ChevronRight, FileText, Folder,
  GitBranch, Zap, RefreshCw, Trash2, Save, Check, Square, MinusSquare,
  Plus, Minus, ChevronsRight,
} from "lucide-react";
import api from "../lib/api";

/**
 * Dedicated page: /app/context/repos/:repo
 * Dev/PM interactively architects which files feed the LLM. Cascading folder toggles,
 * live "system-prompt weight" counter, and re-ingest diff (+added / -removed / ~changed).
 */
export default function RepoTree() {
  const { repo } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [openMap, setOpenMap] = useState({});
  const [busy, setBusy] = useState(false);
  const [reingesting, setReingesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/context/trees/${encodeURIComponent(repo)}`);
      setData(data);
      // Auto-open first two levels of directories
      const nextOpen = {};
      const walk = (node, depth) => {
        if (!node) return;
        if (node.kind === "dir" && depth <= 1) nextOpen[node.path || node.name] = true;
        (node.children || []).forEach((c) => walk(c, depth + 1));
      };
      (data.tree?.children || []).forEach((c) => walk(c, 1));
      setOpenMap((prev) => ({ ...nextOpen, ...prev }));
    } catch (e) {
      setErr(e.response?.data?.detail || e.message);
    }
  }, [repo]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (path, included, cascade = true) => {
    setBusy(true);
    try {
      await api.patch(`/context/trees/${encodeURIComponent(repo)}/toggle`, { path, included, cascade });
      await load();
    } finally { setBusy(false); }
  };

  const flat = useMemo(() => {
    if (!data?.tree) return [];
    const out = [];
    const walk = (node, depth, parentIncluded) => {
      const myIncluded = parentIncluded && node.included !== false;
      out.push({ node, depth, effectiveIncluded: myIncluded });
      if (node.kind !== "dir") return;
      const key = node.path || node.name;
      if (openMap[key]) (node.children || []).forEach((c) => walk(c, depth + 1, myIncluded));
    };
    (data.tree.children || []).forEach((c) => walk(c, 1, true));
    return out;
  }, [data, openMap]);

  const totalTokensApprox = Math.round((data?.included_chars || 0) / 4);
  const totalPossibleTokens = Math.round((data?.total_chars || 0) / 4);
  const savedTokens = totalPossibleTokens - totalTokensApprox;

  if (err) return (
    <div className="p-8">
      <Link to="/app/context" className="text-primary text-sm inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4"/> Back</Link>
      <div className="border border-primary/60 bg-primary/[0.05] p-4 text-sm text-primary">Repo not found: {err}</div>
    </div>
  );
  if (!data) return <div className="p-8 text-muted-foreground">Loading tree…</div>;

  const diff = data.last_diff || { added: [], removed: [], changed: [] };
  const hasDiff = diff.added.length + diff.removed.length + diff.changed.length > 0;

  return (
    <div className="p-6 md:p-8 space-y-4" data-testid="repo-tree-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/app/context" className="text-muted-foreground hover:text-primary text-xs inline-flex items-center gap-1 mb-2" data-testid="back-to-context">
            <ArrowLeft className="w-3.5 h-3.5"/> Back to Context
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary">/// repo tree</div>
          <h1 className="font-display font-black text-3xl md:text-4xl flex items-center gap-3">
            <GitBranch className="w-7 h-7 text-primary" /> {data.repo_name}
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Devs & PMs — architect the tree yourself. Check nodes to include, uncheck to exclude.
            Folder toggles cascade to their children. Excluded files never touch the LLM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => document.getElementById("reingest-input").click()}
            className="btn-ghost text-xs flex items-center gap-2"
            data-testid="reingest-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-ingest from disk
          </button>
          <input
            id="reingest-input"
            type="file"
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
            onChange={(e) => handleReingest(e.target.files, repo, setReingesting, load)}
          />
          <button
            onClick={() => deleteRepo(repo, nav)}
            className="btn-ghost text-xs flex items-center gap-2 hover:border-primary"
            data-testid="delete-repo-btn"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Live counter strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Files included" value={`${data.included_files} / ${data.file_count}`} />
        <StatCard label="System-prompt weight" value={`≈ ${totalTokensApprox.toLocaleString()} tk`} accent />
        <StatCard label="Tokens saved" value={savedTokens > 0 ? `−${savedTokens.toLocaleString()}` : "0"} tone={savedTokens > 0 ? "good" : "muted"} />
        <StatCard label="Last ingested" value={(data.updated_at || data.created_at || "").slice(0, 10)} />
      </div>

      {/* Diff banner */}
      {hasDiff && (
        <div className="border border-primary/50 bg-primary/[0.06] p-4" data-testid="reingest-diff">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-display font-bold text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Since last ingest
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Your inclusion selections were preserved for matching paths.
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">+{diff.added.length} added</span>
              <span className="text-primary">−{diff.removed.length} removed</span>
              <span className="text-orange-400">~{diff.changed.length} changed</span>
            </div>
          </div>
          {(diff.added.length + diff.removed.length + diff.changed.length) <= 12 && (
            <div className="mt-3 grid md:grid-cols-3 gap-2 text-[11px] font-mono">
              <DiffList label="Added"   items={diff.added}   color="text-emerald-400" prefix="+" />
              <DiffList label="Removed" items={diff.removed} color="text-primary"     prefix="−" />
              <DiffList label="Changed" items={diff.changed} color="text-orange-400"  prefix="~" />
            </div>
          )}
        </div>
      )}

      {reingesting && (
        <div className="border border-primary/50 bg-primary/[0.06] px-4 py-3 text-sm font-mono text-primary">
          Re-ingesting… the LLM is regenerating architecture / schema / module docs.
        </div>
      )}

      {/* Tree */}
      <div className="border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-display font-bold text-sm">File tree</div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => expandAll(data.tree, setOpenMap)} className="btn-ghost text-[10px] font-mono uppercase" data-testid="expand-all"><Plus className="w-3 h-3 inline"/> expand</button>
            <button onClick={() => setOpenMap({})} className="btn-ghost text-[10px] font-mono uppercase" data-testid="collapse-all"><Minus className="w-3 h-3 inline"/> collapse</button>
            <button onClick={() => toggle("", true, true)} disabled={busy} className="btn-ghost text-[10px] font-mono uppercase" data-testid="select-all">select all</button>
          </div>
        </div>
        <div className="p-2 max-h-[540px] overflow-y-auto" data-testid="tree-scroll">
          {flat.map(({ node, depth, effectiveIncluded }) => (
            <TreeRow
              key={(node.path || node.name) + ":" + depth}
              node={node}
              depth={depth}
              open={!!openMap[node.path || node.name]}
              effectiveIncluded={effectiveIncluded}
              onToggleOpen={() => setOpenMap((m) => ({ ...m, [node.path || node.name]: !m[node.path || node.name] }))}
              onToggleInclude={() => toggle(node.path, !(node.included !== false), true)}
              busy={busy}
            />
          ))}
        </div>
      </div>

      {/* Generated docs */}
      <div className="border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <div className="font-display font-bold text-sm">Generated context docs</div>
          <div className="text-xs text-muted-foreground mt-0.5">Toggle a whole doc off for even more savings.</div>
        </div>
        <ul className="divide-y divide-border">
          {(data.docs || []).map((d) => (
            <DocRow key={d.id} doc={d} onToggle={async () => { setBusy(true); try { await api.patch(`/context/${d.id}/toggle`, { included: !d.included }); await load(); } finally { setBusy(false); } }} busy={busy} />
          ))}
          {(data.docs || []).length === 0 && (
            <li className="px-4 py-4 text-xs text-muted-foreground">No auto-ingested docs — re-ingest to generate them.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

async function handleReingest(fileList, repo, setReingesting, reload) {
  if (!fileList || fileList.length === 0) return;
  setReingesting(true);
  try {
    const files = await Promise.all(
      Array.from(fileList).map(async (f) => ({ path: f.webkitRelativePath || f.name, content: await f.text() }))
    );
    await api.post("/context/ingest", { repo_name: repo, files });
    await reload();
  } catch (e) {
    alert("Re-ingest failed: " + (e.response?.data?.detail || e.message));
  } finally {
    setReingesting(false);
  }
}

async function deleteRepo(repo, nav) {
  if (!window.confirm(`Delete the entire "${repo}" tree and its auto-docs?`)) return;
  await api.delete(`/context/trees/${encodeURIComponent(repo)}`);
  nav("/app/context");
}

function expandAll(tree, setOpenMap) {
  const map = {};
  const walk = (n) => {
    if (n.kind === "dir") map[n.path || n.name] = true;
    (n.children || []).forEach(walk);
  };
  (tree?.children || []).forEach(walk);
  setOpenMap(map);
}

function TreeRow({ node, depth, open, effectiveIncluded, onToggleOpen, onToggleInclude, busy }) {
  const isDir = node.kind === "dir";
  const kids = node.children || [];
  const kb = node.size > 0 ? (node.size / 1024).toFixed(node.size < 1024 ? 2 : 1) : "0";
  const nodeOwnIncluded = node.included !== false;

  // Determine the visual state of the checkbox: checked / unchecked / indeterminate
  let checkState = "checked";
  if (!nodeOwnIncluded) checkState = "unchecked";
  if (isDir && nodeOwnIncluded) {
    const stateSet = new Set();
    const walk = (n) => { stateSet.add(n.included !== false); (n.children || []).forEach(walk); };
    (kids || []).forEach(walk);
    if (stateSet.size > 1) checkState = "indeterminate";
  }

  const CheckIcon = checkState === "checked" ? Check : checkState === "indeterminate" ? MinusSquare : Square;
  const boxCls = checkState === "checked"
    ? "border-primary bg-primary text-white"
    : checkState === "indeterminate"
      ? "border-primary bg-primary/30 text-primary"
      : "border-border bg-transparent text-muted-foreground";

  const nameCls = effectiveIncluded
    ? "text-xs truncate"
    : "text-xs truncate text-muted-foreground line-through";

  return (
    <div
      className="flex items-center gap-1.5 py-0.5 hover:bg-primary/[0.04] group"
      style={{ paddingLeft: (depth * 14 + 4) + "px", paddingRight: "8px" }}
      data-testid={"tree-row-" + (node.path || node.name)}
    >
      <button
        onClick={onToggleInclude}
        disabled={busy}
        className={`w-4 h-4 border shrink-0 flex items-center justify-center transition-colors ${boxCls}`}
        aria-label={effectiveIncluded ? "Exclude" : "Include"}
        data-testid={"cbx-" + (node.path || node.name)}
      >
        <CheckIcon className="w-3 h-3" />
      </button>
      <button
        onClick={isDir ? onToggleOpen : undefined}
        className="flex items-center gap-1.5 flex-1 min-w-0 text-left py-0.5"
      >
        {isDir ? (open
          ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        ) : <span className="w-3 shrink-0" />}
        {isDir
          ? <Folder className={`w-3.5 h-3.5 shrink-0 ${effectiveIncluded ? (open ? "text-primary" : "text-orange-400") : "text-muted-foreground/40"}`} />
          : <FileText className={`w-3.5 h-3.5 shrink-0 ${effectiveIncluded ? "text-muted-foreground" : "text-muted-foreground/40"}`} />}
        <span className={nameCls}>{node.name}</span>
        <span className="ml-auto font-mono text-[9px] text-muted-foreground/60 tabular-nums shrink-0 pl-2">
          {isDir ? kids.length + " · " + kb + " KB" : kb + " KB"}
        </span>
      </button>
    </div>
  );
}

function StatCard({ label, value, accent, tone }) {
  const border = accent ? "border-primary" : tone === "good" ? "border-emerald-800/60" : "border-border";
  const valColor = accent ? "text-primary" : tone === "good" ? "text-emerald-400" : "";
  return (
    <div className={`border p-3 bg-card ${border}`}>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display font-black text-xl md:text-2xl tabular-nums mt-1 ${valColor}`}>{value}</div>
    </div>
  );
}

function DocRow({ doc, onToggle, busy }) {
  const on = doc.included;
  const chars = doc.chars || 0;
  const tok = Math.round(chars / 4);
  const titleCls = on ? "text-sm truncate" : "text-sm truncate text-muted-foreground line-through";
  return (
    <li className="px-4 py-2.5 flex items-center gap-3" data-testid={"docrow-" + doc.id}>
      <FileText className={on ? "w-3.5 h-3.5 shrink-0 text-primary" : "w-3.5 h-3.5 shrink-0 text-muted-foreground/50"} />
      <div className="min-w-0 flex-1">
        <div className={titleCls}>{doc.title}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {doc.kind} · {chars.toLocaleString()} chars · ≈ {tok.toLocaleString()} tokens
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        className="shrink-0 text-[10px] font-mono uppercase tracking-widest border border-border hover:border-primary/60 px-2 py-1"
      >
        {on ? "included" : "excluded"}
      </button>
    </li>
  );
}

function DiffList({ label, items, color, prefix }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{label} ({items.length})</div>
      {items.length === 0 ? (
        <div className="text-muted-foreground/60">—</div>
      ) : (
        <ul className="space-y-0.5">
          {items.slice(0, 10).map((p) => <li key={p} className={color}><span className="opacity-70">{prefix}</span> {p}</li>)}
          {items.length > 10 && <li className="text-muted-foreground">…and {items.length - 10} more</li>}
        </ul>
      )}
    </div>
  );
}
