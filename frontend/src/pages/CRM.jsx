import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import FilterBar from "../components/FilterBar";

const LEAD_FIELDS = [
  { key: "q",          label: "Search",   type: "text" },
  { key: "status",     label: "Status",   options: [
    { value: "new",         label: "new" },
    { value: "qualified",   label: "qualified" },
    { value: "proposal",    label: "proposal" },
    { value: "negotiation", label: "negotiation" },
    { value: "hot",         label: "hot" },
    { value: "closed",      label: "closed" },
  ]},
  { key: "priority",   label: "Priority", options: [
    { value: "urgent", label: "urgent" }, { value: "high", label: "high" }, { value: "medium", label: "medium" }, { value: "low", label: "low" },
  ]},
  { key: "escalated",  label: "Escalated",options: [{ value: "true", label: "yes" }] },
];

const TASK_FIELDS = [
  { key: "q",         label: "Search",   type: "text" },
  { key: "status",    label: "Status",   options: [{ value: "open", label: "open" }, { value: "done", label: "done" }] },
  { key: "priority",  label: "Priority", options: [
    { value: "urgent", label: "urgent" }, { value: "high", label: "high" }, { value: "medium", label: "medium" }, { value: "low", label: "low" },
  ]},
  { key: "overdue",   label: "Overdue",  options: [{ value: "true", label: "yes" }] },
];

export default function CRM() {
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("leads");
  const [searchParams, setSearchParams] = useSearchParams();

  const paramsToObj = () => Object.fromEntries(searchParams.entries());
  const [leadFilters, setLeadFilters] = useState(paramsToObj);
  const [taskFilters, setTaskFilters] = useState({});

  const filters = tab === "leads" ? leadFilters : taskFilters;
  const setFilters = tab === "leads" ? setLeadFilters : setTaskFilters;

  const loadUsers = useCallback(async () => {
    const u = await api.get("/users").catch(() => ({ data: [] }));
    setUsers(u.data);
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadData = useCallback(async () => {
    if (tab === "leads") {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(leadFilters).filter(([, v]) => v))).toString();
      const l = await api.get(`/leads${qs ? "?" + qs : ""}`);
      setLeads(l.data);
      // persist to URL only for leads tab
      setSearchParams(leadFilters, { replace: true });
    } else {
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(taskFilters).filter(([, v]) => v))).toString();
      const t = await api.get(`/tasks${qs ? "?" + qs : ""}`);
      setTasks(t.data);
    }
  }, [tab, leadFilters, taskFilters, setSearchParams]);
  useEffect(() => { loadData(); }, [loadData]);

  const userName = (id) => users.find((u) => u.id === id)?.name || (id ? id.slice(0, 8) : "—");
  const badgeClass = (p) => p === "urgent" ? "badge-urgent" : p === "high" ? "badge-high" : p === "low" ? "badge-low" : "badge-medium";

  return (
    <div className="p-6 md:p-8" data-testid="crm-page">
      <div className="mb-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">/// crm</div>
        <h1 className="font-display font-black text-3xl md:text-4xl">CRM</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("leads")} className={tab === "leads" ? "btn-primary" : "btn-ghost"} data-testid="tab-leads">
          Leads ({leads.length})
        </button>
        <button onClick={() => setTab("tasks")} className={tab === "tasks" ? "btn-primary" : "btn-ghost"} data-testid="tab-tasks">
          Tasks ({tasks.length})
        </button>
      </div>

      <div className="mb-4">
        <FilterBar
          fields={tab === "leads" ? LEAD_FIELDS : TASK_FIELDS}
          filters={filters}
          onChange={setFilters}
          testid={`filters-${tab}`}
        />
      </div>

      <div className="border border-border" data-testid={`table-${tab}`}>
        {tab === "leads" ? (
          <table className="table-tech">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Priority</th><th>Assigned</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} data-testid={`lead-row-${l.id}`}>
                  <td className="font-mono text-xs">{l.id.slice(0, 8)}</td>
                  <td>{l.name}</td>
                  <td className="font-mono text-xs">{l.email}</td>
                  <td><span className="badge">{l.status}</span></td>
                  <td><span className={`badge ${badgeClass(l.priority)}`}>{l.priority}</span></td>
                  <td>{userName(l.assigned_to)}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan="6" className="text-center text-sm text-muted-foreground p-8">No leads match these filters.</td></tr>}
            </tbody>
          </table>
        ) : (
          <table className="table-tech">
            <thead><tr><th>ID</th><th>Title</th><th>Lead</th><th>Priority</th><th>Due</th><th>Status</th><th>Assigned</th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} data-testid={`task-row-${t.id}`}>
                  <td className="font-mono text-xs">{t.id.slice(0, 8)}</td>
                  <td>{t.title}</td>
                  <td className="font-mono text-xs">{(t.lead_id || "").slice(0, 8)}</td>
                  <td><span className={`badge ${badgeClass(t.priority)}`}>{t.priority}</span></td>
                  <td className="font-mono text-xs">{(t.due_date || "").slice(0, 10)}</td>
                  <td><span className={`badge ${t.status === "done" ? "badge-done" : ""}`}>{t.status}</span></td>
                  <td>{userName(t.assigned_to)}</td>
                </tr>
              ))}
              {tasks.length === 0 && <tr><td colSpan="7" className="text-center text-sm text-muted-foreground p-8">No tasks match these filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
