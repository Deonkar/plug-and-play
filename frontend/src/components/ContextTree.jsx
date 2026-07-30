import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, GitBranch, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import api from "../lib/api";

export default function ContextTree({ tree, onChanged }) {
  const [busy, setBusy] = useState(null);
  const totalActiveChars = useMemo(
    () => (tree.docs || []).filter((d) => d.included).reduce((s, d) => s + (d.chars || 0), 0),
    [tree.docs]
  );
  const totalPossibleChars = useMemo(
    () => (tree.docs || []).reduce((s, d) => s + (d.chars || 0), 0),
    [tree.docs]
  );
  const approxTokens = Math.round(totalActiveChars / 4);
  const savedTokens = Math.round((totalPossibleChars - totalActiveChars) / 4);

  const toggleDoc = async (doc) => {
    setBusy(doc.id);
    try {
      await api.patch("/context/" + doc.id + "/toggle", { included: !doc.included });
      if (onChanged) onChanged();
    } finally {
      setBusy(null);
    }
  };

  const rootKids = (tree.tree && tree.tree.children) || [];
  const ingestedDate = (tree.updated_at || tree.created_at || "").slice(0, 10);

  return (
    <div className="border border-border bg-card" data-testid={"tree-" + tree.repo_name}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/40">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-sm truncate">{tree.repo_name}</div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">
              {tree.file_count} files · ingested {ingestedDate}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[10px] uppercase text-muted-foreground">system-prompt weight</div>
          <div className="font-display font-black text-lg tabular-nums text-primary">
            {"~ "}{approxTokens.toLocaleString()} <span className="text-xs text-muted-foreground">tokens</span>
          </div>
          {savedTokens > 0 && (
            <div className="font-mono text-[10px] text-emerald-400 flex items-center gap-1 justify-end">
              <Zap className="w-3 h-3" /> {"-"}{savedTokens.toLocaleString()} tokens saved
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-border">
        <div className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"/// generated context docs"}
        </div>
        <ul className="divide-y divide-border">
          {(tree.docs || []).length === 0 ? (
            <li className="px-4 py-3 text-xs text-muted-foreground">No auto-ingested docs yet.</li>
          ) : (tree.docs || []).map((d) => (
            <DocRow key={d.id} doc={d} busy={busy === d.id} onToggle={() => toggleDoc(d)} />
          ))}
        </ul>
      </div>

      <div className="p-3">
        <div className="px-1 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {"/// file tree"}
        </div>
        <FileTree rootKids={rootKids} />
      </div>
    </div>
  );
}

function DocRow({ doc, busy, onToggle }) {
  const on = doc.included;
  const chars = doc.chars || 0;
  const tok = Math.round(chars / 4);
  const titleCls = on ? "text-sm truncate" : "text-sm truncate text-muted-foreground line-through";
  const iconCls = on ? "w-3.5 h-3.5 shrink-0 text-primary" : "w-3.5 h-3.5 shrink-0 text-muted-foreground/50";
  return (
    <li className="px-4 py-2.5 flex items-center gap-3" data-testid={"doc-toggle-" + doc.id}>
      <FileText className={iconCls} />
      <div className="min-w-0 flex-1">
        <div className={titleCls}>{doc.title}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {doc.kind} · {chars.toLocaleString()} chars · {"~ "}{tok.toLocaleString()} tokens
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        data-testid={"toggle-" + doc.id}
        className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest border border-border hover:border-primary/60 px-2 py-1 transition-colors"
      >
        {on ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
        {on ? "included" : "excluded"}
      </button>
    </li>
  );
}

function flattenTree(node, depth, openMap, out) {
  if (!node) return;
  out.push({ node, depth });
  if (node.kind !== "dir") return;
  const key = node.path || node.name;
  const isOpen = openMap[key] !== false && (openMap[key] === true || depth < 2); // default open through depth < 2
  if (!isOpen) return;
  const kids = node.children || [];
  for (const k of kids) flattenTree(k, depth + 1, openMap, out);
}

function FileTree({ rootKids }) {
  const [openMap, setOpenMap] = useState({});
  const flat = [];
  for (const k of rootKids) flattenTree(k, 1, openMap, flat);
  const toggle = (key) => {
    setOpenMap((m) => {
      const wasOpen = m[key] !== false && (m[key] === true || true);
      // if not in map, default open depth<2 already, so click closes; if in map, invert
      const current = m[key];
      const next = current === undefined ? false : !current;
      return { ...m, [key]: next };
    });
  };
  return (
    <ul className="space-y-0.5">
      {flat.map(({ node, depth }) => (
        <li key={(node.path || node.name) + ":" + depth}>
          <TreeRow node={node} depth={depth} openMap={openMap} onToggle={toggle} />
        </li>
      ))}
    </ul>
  );
}

function TreeRow({ node, depth, openMap, onToggle }) {
  const isDir = node.kind === "dir";
  const kids = node.children || [];
  const key = node.path || node.name;
  const isOpen = openMap[key] !== false && (openMap[key] === true || depth < 2);
  const kb = node.size > 0 ? (node.size / 1024).toFixed(node.size < 1024 ? 2 : 1) : "0";
  const padding = { paddingLeft: depth * 12 + "px" };

  const chevronNode = !isDir
    ? <span className="w-3" />
    : isOpen
      ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
      : <ChevronRight className="w-3 h-3 text-muted-foreground" />;

  const iconNode = isDir
    ? <Folder className={isOpen ? "w-3.5 h-3.5 text-primary" : "w-3.5 h-3.5 text-muted-foreground"} />
    : <FileText className="w-3.5 h-3.5 text-muted-foreground/70" />;

  const labelCls = isDir
    ? "text-xs truncate text-foreground font-medium"
    : "text-xs truncate text-muted-foreground group-hover:text-foreground transition-colors";

  const sizeStr = isDir ? kids.length + " · " + kb + " KB" : kb + " KB";

  return (
    <button
      onClick={() => { if (isDir) onToggle(key); }}
      className="flex items-center gap-1.5 w-full text-left py-0.5 group"
      style={padding}
      data-testid={"tree-node-" + key}
    >
      {chevronNode}
      {iconNode}
      <span className={labelCls}>{node.name}</span>
      <span className="ml-auto font-mono text-[9px] text-muted-foreground/60 tabular-nums shrink-0 pr-1">
        {sizeStr}
      </span>
    </button>
  );
}
