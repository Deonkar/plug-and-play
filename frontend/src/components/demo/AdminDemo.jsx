import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Users, FileText, BarChart3, Settings } from "lucide-react";
import BrowserFrame from "./BrowserFrame";

/**
 * Admin console demo that shows what admins ACTUALLY use the console for:
 *   1. Analytics — token spend, cache-hit rate, top prompts
 *   2. Quotas — set a monthly token budget per agent
 *   3. Context — feed .md docs into the bot's brain
 *
 * Auto-cycles through the three views with matching narration captions.
 */

const TABS = [
  { key: "analytics", label: "Analytics", icon: BarChart3,
    caption: "See exactly how many tokens each agent is spending, cache hit rate, and the questions asked most often." },
  { key: "quotas", label: "Users &amp; Quotas", icon: Users,
    caption: "Set a monthly token budget per agent (5k, 10k, 25k…). When the cap is hit, the chatbot politely tells them to talk to admin." },
  { key: "context", label: "Context", icon: FileText,
    caption: "Drag-drop .md files. Ingest a whole repo folder. The bot's system prompt is rebuilt live." },
];

const TOP_PROMPTS = [
  { q: "what urgent tasks do I have today?", n: 214 },
  { q: "why did I get an escalation last week?", n: 168 },
  { q: "which of my leads is closest to closing?", n: 129 },
  { q: "how does our escalation SLA work?", n: 82 },
  { q: "who owns lead-01?", n: 55 },
];

const QUOTA_USERS = [
  { name: "Alice Agent", used: 4820, limit: 10000, role: "agent" },
  { name: "Bob Agent", used: 9210, limit: 10000, role: "agent" },
  { name: "Chris Agent", used: 10240, limit: 10000, role: "agent", over: true },
  { name: "Ava Admin", used: 1420, limit: 0, role: "super_admin" },
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
    const iv = setInterval(() => setTabIdx((i) => (i + 1) % TABS.length), 5000);
    return () => clearInterval(iv);
  }, []);
  const active = TABS[tabIdx];

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Narration column */}
      <div className="lg:col-span-2 flex flex-col gap-2 order-2 lg:order-1">
        {TABS.map((s, i) => {
          const isActive = i === tabIdx;
          return (
            <motion.div
              key={i}
              animate={{ opacity: isActive ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
              className={`border p-4 relative transition-colors ${isActive ? "border-primary bg-primary/[0.04]" : "border-border bg-card"}`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
              <div className="flex items-center gap-2 mb-1.5">
                <s.icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <div className={`font-mono text-[10px] uppercase tracking-widest ${isActive ? "text-primary" : "text-muted-foreground"}`}
                  dangerouslySetInnerHTML={{__html: `0${i+1} — ${s.label}`}} />
              </div>
              <div className={`text-sm leading-relaxed ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{s.caption}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="lg:col-span-3 order-1 lg:order-2">
        <BrowserFrame url="companyos.acme.com/app" testid="admin-demo">
          <div className="grid grid-cols-12 min-h-[420px]">
            {/* Sidebar — admin-only, NO "My Tasks" */}
            <div className="col-span-3 md:col-span-3 border-r border-border py-4">
              <div className="px-3 mb-4">
                <div className="font-display font-bold text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary" /> COMPANY/OS
                </div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground mt-0.5 truncate">acme demo · admin</div>
              </div>
              <div className="space-y-0.5 text-xs">
                <SideItem icon={Terminal} label="Overview" />
                {TABS.map((t, i) => (
                  <SideItem key={t.key} icon={t.icon} label={t.label.replace(/&amp;/g, "&")} active={i === tabIdx} />
                ))}
                <SideItem icon={Settings} label="Settings" />
              </div>
            </div>

            <div className="col-span-9 p-5 relative overflow-hidden">
              <div className="mb-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary" dangerouslySetInnerHTML={{__html: `/// ${active.label}`}} />
                <div className="font-display font-black text-2xl">
                  {active.key === "analytics" && "Insights"}
                  {active.key === "quotas" && "Team & quotas"}
                  {active.key === "context" && "Company brain"}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {active.key === "analytics" && <AnalyticsPanel key="an" />}
                {active.key === "quotas" && <QuotaPanel key="qt" />}
                {active.key === "context" && <ContextPanel key="ct" />}
              </AnimatePresence>
            </div>
          </div>
        </BrowserFrame>
      </div>
    </div>
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
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { l: "Messages", v: "1,284" },
          { l: "Cache-hit", v: "48%", accent: true },
          { l: "Avg latency", v: "820ms" },
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
        <div className="flex items-baseline justify-between mb-3">
          <div className="font-display font-bold text-xs">Top prompts</div>
          <div className="font-mono text-[10px] text-muted-foreground">last 30d</div>
        </div>
        <div className="space-y-2">
          {TOP_PROMPTS.map((p, i) => {
            const pct = (p.n / TOP_PROMPTS[0].n) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 font-mono text-[10px] text-muted-foreground">{i+1}</div>
                <div className="flex-1 text-[11px] truncate">{p.q}</div>
                <div className="flex-1 max-w-[100px] h-2 bg-black/40 relative">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-primary/70"
                  />
                </div>
                <div className="w-10 text-right text-[10px] font-mono">{p.n}</div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function QuotaPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-3 text-[11px] font-mono text-muted-foreground">
        Set a monthly token cap per agent. <span className="text-primary">0 = unlimited.</span>
      </div>
      <div className="border border-border bg-card">
        {QUOTA_USERS.map((u, i) => {
          const pct = u.limit > 0 ? Math.min(100, (u.used / u.limit) * 100) : 0;
          return (
            <motion.div key={u.name}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 px-3 py-2.5 border-b border-border/60 last:border-b-0">
              <div className="w-24 truncate">
                <div className="text-xs font-medium">{u.name}</div>
                <div className="text-[9px] font-mono uppercase text-muted-foreground">{u.role}</div>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between font-mono text-[10px] mb-1">
                  <span className={u.over ? "text-primary" : "text-muted-foreground"}>{u.used.toLocaleString()}</span>
                  <span className="text-muted-foreground">{u.limit === 0 ? "∞" : u.limit.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-black/40 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: u.limit === 0 ? "3%" : `${pct}%` }}
                    transition={{ delay: 0.15 + i * 0.08, duration: 0.6 }}
                    className={`h-full ${u.over ? "bg-primary" : pct > 80 ? "bg-orange-500" : "bg-emerald-500"}`}
                  />
                </div>
              </div>
              <div className="text-[10px] font-mono border border-border px-2 py-0.5 text-muted-foreground">
                {u.over ? "over cap" : "Set limit"}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ContextPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="grid grid-cols-2 gap-2">
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
