import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { ChevronDown, ChevronRight, User as UserIcon, MessageSquare, Building2 } from "lucide-react";

const REL = (iso) => {
  if (!iso) return "";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return diffMin + "m ago";
  const h = Math.round(diffMin / 60);
  if (h < 48) return h + "h ago";
  return Math.round(h / 24) + "d ago";
};

const RANGE_CHIPS = [
  { value: "7d", label: "7d" }, { value: "14d", label: "14d" },
  { value: "30d", label: "30d" }, { value: "all", label: "all" },
];

export default function Chats() {
  const [range, setRange] = useState("14d");
  const [summary, setSummary] = useState(null);
  const [expanded, setExpanded] = useState({});   // { deptName: true|false }
  const [sel, setSel] = useState({ department: null, user_id: null });
  const [data, setData] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [q, setQ] = useState("");
  const [cachedOnly, setCachedOnly] = useState(false);

  const loadSummary = useCallback(async () => {
    const { data } = await api.get(`/admin/chats/summary?range=${range}`);
    setSummary(data);
    if (Object.keys(expanded).length === 0 && data.departments.length) {
      // Default: expand the first department that actually has activity
      const active = data.departments.find((d) => d.total > 0) || data.departments[0];
      setExpanded({ [active.department]: true });
    }
  }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("range", range);
    if (sel.user_id) params.set("user_id", sel.user_id);
    else if (sel.department) params.set("department", sel.department);
    if (cachedOnly) params.set("cached_only", "true");
    if (q.trim()) params.set("q", q.trim());
    const { data } = await api.get(`/admin/chats?${params.toString()}`);
    setData(data);
    setSelectedMsg(data.items[0] || null);
  }, [range, sel, cachedOnly, q]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { loadData(); }, [loadData]);

  const scopeLabel = useMemo(() => {
    if (sel.user_id) {
      const found = summary?.departments.flatMap((d) => d.users).find((u) => u.id === sel.user_id);
      return found ? `${found.name}` : "user";
    }
    if (sel.department) return `${sel.department} · all agents`;
    return "Whole company";
  }, [sel, summary]);

  return (
    <div className="p-6 md:p-8" data-testid="chats-page">
      <div className="mb-4 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">/// chat history</div>
          <h1 className="font-display font-black text-3xl md:text-4xl">What is the team asking?</h1>
          <p className="text-muted-foreground text-sm mt-2">Grouped by department, then by agent. Click a chat to see the full answer.</p>
        </div>
        <div className="flex items-center gap-1.5" data-testid="range-chips">
          {RANGE_CHIPS.map((c) => (
            <button
              key={c.value}
              onClick={() => setRange(c.value)}
              className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 border transition-colors ${
                range === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/60"
              }`}
              data-testid={`range-${c.value}`}
            >{c.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Department sidebar */}
        <aside className="lg:col-span-1 border border-border bg-card" data-testid="dept-sidebar">
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <div className="font-display font-bold text-sm flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-primary"/> Departments</div>
            {(sel.department || sel.user_id) && (
              <button
                onClick={() => setSel({ department: null, user_id: null })}
                data-testid="clear-scope"
                className="text-[10px] font-mono uppercase tracking-widest text-primary hover:text-foreground"
              >clear</button>
            )}
          </div>
          {!summary ? (
            <div className="p-4 text-xs text-muted-foreground">Loading…</div>
          ) : (
            <ul className="max-h-[68vh] overflow-y-auto">
              <li className="border-b border-border">
                <button
                  onClick={() => setSel({ department: null, user_id: null })}
                  data-testid="scope-all"
                  className={`w-full text-left px-4 py-2.5 hover:bg-primary/[0.04] flex items-center justify-between text-sm ${sel.department === null && sel.user_id === null ? "bg-primary/[0.06]" : ""}`}
                >
                  <span>All</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{summary.departments.reduce((s, d) => s + d.total, 0)}</span>
                </button>
              </li>
              {summary.departments.map((d) => (
                <li key={d.department} className="border-b border-border">
                  <button
                    onClick={() => {
                      setExpanded((e) => ({ ...e, [d.department]: !e[d.department] }));
                      setSel({ department: d.department, user_id: null });
                    }}
                    data-testid={`dept-${d.department}`}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-1 hover:bg-primary/[0.04] ${sel.department === d.department && !sel.user_id ? "bg-primary/[0.06] border-l-2 border-primary pl-2.5" : ""}`}
                  >
                    {expanded[d.department] ? <ChevronDown className="w-3 h-3 text-muted-foreground"/> : <ChevronRight className="w-3 h-3 text-muted-foreground"/>}
                    <span className="text-sm flex-1 truncate">{d.department}</span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{d.users.length}u · {d.total}</span>
                  </button>
                  {expanded[d.department] && (
                    <ul className="bg-background/40">
                      {d.users.map((u) => (
                        <li key={u.id}>
                          <button
                            onClick={() => setSel({ department: d.department, user_id: u.id })}
                            data-testid={`user-${u.id}`}
                            className={`w-full text-left pl-9 pr-4 py-2 flex items-center gap-2 hover:bg-primary/[0.04] text-xs ${sel.user_id === u.id ? "bg-primary/[0.08] border-l-2 border-primary pl-8" : ""}`}
                          >
                            <UserIcon className="w-3 h-3 text-muted-foreground shrink-0"/>
                            <span className="truncate flex-1">{u.name}</span>
                            <span className={`font-mono text-[9px] shrink-0 ${u.count === 0 ? "text-muted-foreground/50" : "text-muted-foreground"}`}>{u.count}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Message list + detail */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* filters + list */}
          <div className="md:col-span-2 border border-border bg-card flex flex-col" data-testid="chats-list-panel">
            <div className="px-3 py-2 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-display font-bold text-xs truncate">{scopeLabel}</div>
                <div className="font-mono text-[10px] text-muted-foreground shrink-0">{data ? `${data.total}` : "…"}</div>
              </div>
              <input
                type="text"
                placeholder="Search messages…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                data-testid="search-input"
                className="input-tech h-7 text-xs w-full"
              />
              <button
                onClick={() => setCachedOnly((c) => !c)}
                data-testid="toggle-cached"
                className={`text-[10px] font-mono uppercase tracking-widest border px-2 py-1 w-full transition-colors ${cachedOnly ? "border-emerald-700 text-emerald-400 bg-emerald-900/10" : "border-border text-muted-foreground hover:border-primary/60"}`}
              >
                {cachedOnly ? "showing cached only" : "cached only: off"}
              </button>
            </div>
            <ul className="max-h-[62vh] overflow-y-auto divide-y divide-border flex-1">
              {!data ? (
                <li className="p-4 text-xs text-muted-foreground">Loading…</li>
              ) : data.items.length === 0 ? (
                <li className="p-4 text-xs text-muted-foreground">No matches.</li>
              ) : data.items.map((c) => (
                <li key={(c.id || "") + c.created_at}>
                  <button
                    onClick={() => setSelectedMsg(c)}
                    data-testid={`msg-row-${c.id || ""}`}
                    className={`w-full text-left px-3 py-2 hover:bg-primary/[0.04] ${selectedMsg && selectedMsg.id === c.id ? "bg-primary/[0.08] border-l-2 border-primary" : "border-l-2 border-transparent"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-medium truncate">{c.user_name}</span>
                      {c.department && <span className="font-mono text-[9px] text-muted-foreground">· {c.department}</span>}
                      {c.cache_hit && <span className="ml-auto font-mono text-[9px] border border-emerald-800 text-emerald-400 px-1">cached</span>}
                    </div>
                    <div className="text-xs truncate">{c.message}</div>
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">{REL(c.created_at)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* detail */}
          <div className="md:col-span-3 border border-border bg-card" data-testid="chat-detail">
            {!selectedMsg ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50"/>
                <div className="text-sm">Pick a message from the list.</div>
              </div>
            ) : (
              <div>
                <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
                  <UserIcon className="w-4 h-4 text-primary shrink-0"/>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm truncate">
                      {selectedMsg.user_name}
                      {selectedMsg.department && <span className="text-muted-foreground font-normal font-mono text-[10px] ml-2">/ {selectedMsg.department}</span>}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">{selectedMsg.user_role} · {selectedMsg.created_at?.slice(0, 16).replace("T", " ")}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="border border-border px-2 py-0.5 text-muted-foreground">in {selectedMsg.tokens_in || 0}</span>
                    <span className="border border-border px-2 py-0.5 text-muted-foreground">out {selectedMsg.tokens_out || 0}</span>
                    {selectedMsg.cache_hit && <span className="border border-emerald-800 text-emerald-400 px-2 py-0.5">cached</span>}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1.5">/// question</div>
                    <div className="border border-primary/40 bg-primary/[0.05] px-3 py-2 text-sm whitespace-pre-wrap">{selectedMsg.message}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">/// answer</div>
                    <div className="border border-border bg-background px-3 py-2 text-sm whitespace-pre-wrap max-h-[52vh] overflow-y-auto leading-relaxed">{selectedMsg.answer}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
