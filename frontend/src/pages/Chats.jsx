import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import FilterBar from "../components/FilterBar";
import { MessageSquare, User as UserIcon, Zap, Search } from "lucide-react";

const REL = (iso) => {
  if (!iso) return "";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return diffMin + "m ago";
  const h = Math.round(diffMin / 60);
  if (h < 48) return h + "h ago";
  return Math.round(h / 24) + "d ago";
};

export default function Chats() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ range: "14d" });
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.get("/users").then(({ data }) => setUsers(data)).catch(() => {}); }, []);

  const load = useCallback(async () => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))).toString();
    const { data } = await api.get(`/admin/chats${qs ? "?" + qs : ""}`);
    setData(data);
    if (data.items[0] && !selected) setSelected(data.items[0]);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const userOptions = users.map((u) => ({ value: u.id, label: u.name.split(" ")[0] }));
  const FIELDS = [
    { key: "q", label: "Search", type: "text" },
    { key: "range", label: "Range", options: [
      { value: "7d", label: "7d" }, { value: "14d", label: "14d" }, { value: "30d", label: "30d" }, { value: "all", label: "all" },
    ]},
    { key: "user_id", label: "User", options: userOptions },
    { key: "cached_only", label: "Cache", options: [{ value: "true", label: "cached only" }] },
  ];

  return (
    <div className="p-6 md:p-8" data-testid="chats-page">
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">/// chat history</div>
        <h1 className="font-display font-black text-3xl md:text-4xl">What is the team asking?</h1>
        <p className="text-muted-foreground text-sm mt-2">Every question your agents fire at the assistant — searchable, filterable, and grouped by user.</p>
      </div>

      <div className="mb-4">
        <FilterBar fields={FIELDS} filters={filters} onChange={setFilters} testid="filters-chats" />
      </div>

      {!data ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data.items.length === 0 ? (
        <div className="border border-border p-8 text-center text-sm text-muted-foreground">No matches. Try widening the range or clearing filters.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* List */}
          <div className="lg:col-span-2 border border-border bg-card" data-testid="chats-list">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <div className="font-display font-bold text-sm">{data.total} messages</div>
              <div className="font-mono text-[10px] text-muted-foreground">newest first</div>
            </div>
            <ul className="max-h-[68vh] overflow-y-auto divide-y divide-border">
              {data.items.map((c) => (
                <li key={c.id || c.created_at + c.user_id}>
                  <button
                    onClick={() => setSelected(c)}
                    data-testid={"chat-row-" + (c.id || "")}
                    className={"w-full text-left px-4 py-3 hover:bg-primary/[0.04] transition-colors " + (selected && selected.id === c.id ? "bg-primary/[0.06] border-l-2 border-primary" : "border-l-2 border-transparent")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium">{c.user_name}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">· {c.user_role}</span>
                      {c.cache_hit && <span className="ml-1 font-mono text-[9px] border border-emerald-800 text-emerald-400 px-1">cached</span>}
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">{REL(c.created_at)}</span>
                    </div>
                    <div className="text-sm truncate">{c.message}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Detail */}
          <div className="lg:col-span-3 border border-border bg-card" data-testid="chat-detail">
            {selected ? (
              <div>
                <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
                  <UserIcon className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-display font-bold text-sm">{selected.user_name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{selected.user_role} · {selected.created_at.slice(0, 16).replace("T", " ")}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-[10px] font-mono">
                    <span className="border border-border px-2 py-0.5 text-muted-foreground">in {selected.tokens_in || 0} tk</span>
                    <span className="border border-border px-2 py-0.5 text-muted-foreground">out {selected.tokens_out || 0} tk</span>
                    {selected.cache_hit && <span className="border border-emerald-800 text-emerald-400 px-2 py-0.5">cached</span>}
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1.5">/// question</div>
                    <div className="border border-primary/40 bg-primary/[0.05] px-3 py-2 text-sm whitespace-pre-wrap">{selected.message}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">/// answer</div>
                    <div className="border border-border bg-background px-3 py-2 text-sm whitespace-pre-wrap max-h-[52vh] overflow-y-auto">{selected.answer}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-sm text-muted-foreground text-center">
                <MessageSquare className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                Pick a message from the list.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
