import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Users, FileText, BarChart3, Settings, ListTodo } from "lucide-react";
import BrowserFrame from "./BrowserFrame";

const TABS = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "users", label: "Users", icon: Users },
  { key: "context", label: "Context", icon: FileText },
];

const TOKENS = [
  { name: "Alice", value: 68 },
  { name: "Bob", value: 46 },
  { name: "Ava", value: 32 },
  { name: "Sam", value: 22 },
];

const USERS = [
  { name: "Ava Admin", role: "super_admin", state: "active" },
  { name: "Alice Agent", role: "agent", state: "active" },
  { name: "Bob Agent", role: "agent", state: "active" },
  { name: "Chris Agent", role: "agent", state: "blocked" },
];

const DOCS = [
  { title: "Acme CRM — Product Ideology", kind: "product" },
  { title: "Escalation Rules (Dev Reference)", kind: "dev" },
  { title: "Customer-First Playbook", kind: "ideology" },
  { title: "acme-app — Architecture", kind: "dev", auto: true },
  { title: "acme-app — Database Schema", kind: "dev", auto: true },
];

export default function AdminDemo() {
  const [tabIdx, setTabIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTabIdx((i) => (i + 1) % TABS.length), 4200);
    return () => clearInterval(iv);
  }, []);
  const active = TABS[tabIdx];

  return (
    <BrowserFrame url="companyos.acme.com/app" testid="admin-demo">
      <div className="grid grid-cols-12 min-h-[480px]">
        {/* Sidebar */}
        <div className="col-span-3 md:col-span-2 border-r border-border py-4">
          <div className="px-3 mb-4">
            <div className="font-display font-bold text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary" /> COMPANY/OS
            </div>
            <div className="text-[9px] font-mono uppercase text-muted-foreground mt-0.5 truncate">acme crm demo</div>
          </div>
          <div className="space-y-0.5 text-xs">
            <SideItem icon={Terminal} label="Overview" />
            <SideItem icon={ListTodo} label="My Tasks" />
            {TABS.map((t, i) => (
              <SideItem key={t.key} icon={t.icon} label={t.label} active={i === tabIdx} />
            ))}
            <SideItem icon={Settings} label="Settings" />
          </div>
        </div>

        {/* Main */}
        <div className="col-span-9 md:col-span-10 p-5 relative overflow-hidden">
          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-primary">/// {active.label}</div>
            <div className="font-display font-black text-2xl">
              {active.key === "analytics" && "Insights"}
              {active.key === "users" && "Team"}
              {active.key === "context" && "Company brain"}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {active.key === "analytics" && <AnalyticsPanel key="an" />}
            {active.key === "users" && <UsersPanel key="us" />}
            {active.key === "context" && <ContextPanel key="ct" />}
          </AnimatePresence>
        </div>
      </div>
    </BrowserFrame>
  );
}

function SideItem({ icon: Icon, label, active }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 border-l-2 ${active ? "border-primary bg-primary/5 text-white" : "border-transparent text-muted-foreground"}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { l: "Messages", v: "1,284" },
          { l: "Cache hits", v: "612" },
          { l: "Hit rate", v: "48%", accent: true },
          { l: "Users", v: "17" },
        ].map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`border p-3 bg-card ${s.accent ? "border-primary" : "border-border"}`}>
            <div className="font-mono text-[9px] uppercase text-muted-foreground">{s.l}</div>
            <div className={`font-display font-black text-xl mt-1 ${s.accent ? "text-primary" : ""}`}>{s.v}</div>
          </motion.div>
        ))}
      </div>
      <div className="border border-border p-4">
        <div className="font-display font-bold text-xs mb-3">Tokens by user</div>
        <div className="space-y-2.5">
          {TOKENS.map((t, i) => (
            <div key={t.name} className="flex items-center gap-3">
              <div className="w-14 text-[11px] font-mono text-muted-foreground">{t.name}</div>
              <div className="flex-1 h-3 bg-black/40 relative overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${t.value}%` }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
              <div className="w-10 text-right text-[11px] font-mono">{t.value}k</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function UsersPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {USERS.map((u, i) => (
            <motion.tr key={u.name} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="border-t border-border/60">
              <td className="px-3 py-2">{u.name}</td>
              <td className="px-3 py-2 text-muted-foreground">{u.role}</td>
              <td className="px-3 py-2">
                <span className={`text-[10px] font-mono uppercase tracking-widest border px-1.5 py-0.5 ${u.state === "active" ? "border-emerald-600 text-emerald-400" : "border-primary text-primary"}`}>
                  {u.state}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5">
                  {u.state === "active" ? "Block" : "Unblock"}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

function ContextPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="grid grid-cols-2 gap-2">
      {/* Drop zone */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="col-span-2 border-2 border-dashed border-primary/50 bg-primary/[0.03] p-4 flex items-center gap-3">
        <FileText className="w-4 h-4 text-primary" />
        <div>
          <div className="font-display font-bold text-xs">Drop .md files here</div>
          <div className="text-[10px] font-mono text-muted-foreground">or ingest a repo folder</div>
        </div>
      </motion.div>
      {DOCS.map((d, i) => (
        <motion.div key={d.title} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
          className="border border-border p-3 bg-card">
          <div className="font-display font-bold text-xs truncate">{d.title}</div>
          <div className="font-mono text-[9px] uppercase text-muted-foreground mt-1">
            {d.kind}{d.auto && <span className="text-primary"> · auto-ingested</span>}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
