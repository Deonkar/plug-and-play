import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, MessageSquare, X, Search, Bell, Filter, MoreHorizontal } from "lucide-react";

/**
 * Generic "SalesHub" CRM mock (light-blue theme) — deliberately unlike Company/OS
 * so the orange chat widget clearly reads as a PLUG-IN overlay on someone else's site.
 * Includes narration captions that walk the viewer through what's happening.
 */

const LEADS = [
  { id: "L-01", name: "Northwind Traders",  owner: "Alice", stage: "Discovery", priority: "urgent",  amount: "$48K" },
  { id: "L-02", name: "Contoso Ltd",        owner: "Alice", stage: "Proposal",  priority: "high",    amount: "$120K" },
  { id: "L-03", name: "Fabrikam Inc",       owner: "Alice", stage: "Qualify",   priority: "medium",  amount: "$18K" },
  { id: "L-04", name: "Adventure Works",    owner: "Bob",   stage: "Closing",   priority: "urgent",  amount: "$92K" },
  { id: "L-05", name: "Wingtip Toys",       owner: "Bob",   stage: "Cold",      priority: "low",     amount: "$6K" },
];

const SCRIPT_USER = "what urgent tasks do I have today?";
const SCRIPT_ASSISTANT = [
  "You have **1 URGENT task**:",
  "",
  "▸ **task-01** — Call Northwind CTO for demo",
  "  Lead: **Northwind Traders** (lead-01) · previously escalated.",
  "",
  "Recommended: tackle this first.",
];

const STEPS = [
  { title: "01 — Their CRM, unchanged", body: "This is a normal sales CRM your team already uses. Company/OS lives as a small overlay — nothing else about their workflow moves." },
  { title: "02 — Widget available", body: "The orange bubble sits bottom-right. One click opens the assistant. Every company gets its own tenant + isolated data." },
  { title: "03 — Agent asks a question", body: "Alice types a natural-language query. She only ever gets answers scoped to her 3 leads — never Bob's." },
  { title: "04 — Contextual answer streams back", body: "The assistant references task IDs and lead names it read from THIS CRM, plus the .md context docs your team uploaded." },
];

const priorityChip = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-slate-100 text-slate-600 border-slate-200",
  low: "bg-slate-50 text-slate-400 border-slate-200",
};

const stagePill = {
  Discovery: "bg-sky-100 text-sky-700",
  Proposal: "bg-indigo-100 text-indigo-700",
  Qualify: "bg-purple-100 text-purple-700",
  Closing: "bg-emerald-100 text-emerald-700",
  Cold: "bg-slate-100 text-slate-500",
};

export default function CRMDemo() {
  const [phase, setPhase] = useState(0); // 0 crm alone, 1 widget open, 2 typing, 3 answering, then loop
  const [typedUser, setTypedUser] = useState("");
  const [assistantIdx, setAssistantIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const running = useRef(true);

  useEffect(() => {
    running.current = true;
    const timeouts = [];
    const t = (ms, fn) => timeouts.push(setTimeout(fn, ms));

    const run = () => {
      setPhase(0); setTypedUser(""); setAssistantIdx(0); setStepIdx(0);
      // step 1 already visible
      t(2000, () => { setPhase(1); setStepIdx(1); }); // bubble → widget open
      t(3400, () => setStepIdx(2));                  // agent about to ask
      t(3600, () => setPhase(2));
      for (let i = 1; i <= SCRIPT_USER.length; i++) {
        t(3600 + i * 35, () => setTypedUser(SCRIPT_USER.slice(0, i)));
      }
      const afterUser = 3600 + SCRIPT_USER.length * 35 + 500;
      t(afterUser, () => { setPhase(3); setStepIdx(3); });
      for (let i = 1; i <= SCRIPT_ASSISTANT.length; i++) {
        t(afterUser + i * 380, () => setAssistantIdx(i));
      }
      t(afterUser + SCRIPT_ASSISTANT.length * 380 + 5000, () => {
        if (running.current) run();
      });
    };
    run();
    return () => { running.current = false; timeouts.forEach(clearTimeout); };
  }, []);

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Fake CRM Browser */}
      <div className="lg:col-span-3 border border-border shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] overflow-hidden bg-slate-50">
        {/* Browser chrome (dark for realism) */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
          <span className="w-2.5 h-2.5 border border-red-500/60 bg-red-500/60 rounded-full" />
          <span className="w-2.5 h-2.5 border border-amber-500/60 bg-amber-500/60 rounded-full" />
          <span className="w-2.5 h-2.5 border border-emerald-500/60 bg-emerald-500/60 rounded-full" />
          <div className="ml-4 flex-1 max-w-md">
            <div className="font-mono text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 truncate rounded">
              https://saleshub.acme.com/leads
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 font-mono text-[10px] text-neutral-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> live
          </div>
        </div>

        {/* CRM app header — light theme, generic */}
        <div className="bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-indigo-500 rounded flex items-center justify-center">
                  <span className="text-white text-[11px] font-black">S</span>
                </div>
                SalesHub
              </div>
              <nav className="hidden md:flex gap-5 text-xs text-slate-500">
                <span className="text-slate-900 font-semibold border-b-2 border-sky-500 pb-1">Leads</span>
                <span>Contacts</span>
                <span>Deals</span>
                <span>Reports</span>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100 rounded px-2 py-1 text-[10px] text-slate-500">
                <Search className="w-3 h-3"/> Search leads...
              </div>
              <Bell className="w-4 h-4 text-slate-400" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
            </div>
          </div>
        </div>

        <div className="p-5 relative min-h-[380px]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Pipeline</div>
              <div className="font-bold text-lg text-slate-900">All leads</div>
            </div>
            <div className="flex gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 border border-slate-200 bg-white px-2 py-1"><Filter className="w-3 h-3"/> Owner</span>
              <span className="text-slate-400">5 records</span>
            </div>
          </div>

          <div className="border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 font-semibold uppercase tracking-widest text-[10px] bg-slate-50">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Stage</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {LEADS.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="border-t border-slate-100"
                  >
                    <td className="px-3 py-2 font-mono text-slate-400">{l.id}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{l.name}</td>
                    <td className="px-3 py-2 text-slate-500">{l.owner}</td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${stagePill[l.stage]}`}>{l.stage}</span></td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-semibold uppercase tracking-widest border px-1.5 py-0.5 rounded ${priorityChip[l.priority]}`}>{l.priority}</span></td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">{l.amount}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bubble */}
          <AnimatePresence>
            {phase === 0 && (
              <motion.div key="bubble"
                initial={{ scale: 0.4, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.6, opacity: 0 }}
                className="absolute bottom-5 right-5">
                <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full" />
                <div className="relative flex items-center gap-2 bg-primary text-white px-3 py-2 border border-primary/60 shadow-lg">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="font-display font-bold text-xs">Ask/OS</span>
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat panel */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div key="panel"
                initial={{ opacity: 0, y: 30, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.94 }}
                transition={{ type: "spring", damping: 22, stiffness: 240 }}
                className="absolute bottom-4 right-4 w-[300px] bg-black/85 backdrop-blur-2xl border border-primary/40 shadow-[0_20px_60px_-20px_rgba(255,80,20,0.5)]"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gradient-to-b from-primary/10 to-transparent">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="font-display font-bold text-[11px] text-white">Company/OS</span>
                    <span className="ml-1 text-[9px] font-mono text-primary uppercase tracking-widest">plug-in</span>
                  </div>
                  <X className="w-3 h-3 text-neutral-400" />
                </div>
                <div className="p-3 space-y-2.5 min-h-[160px]">
                  <AnimatePresence>
                    {phase >= 2 && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key="user" className="flex justify-end">
                        <div className="max-w-[85%] px-2.5 py-1.5 text-[11px] border border-primary/60 bg-primary/10 text-white">
                          {typedUser}<span className="ml-0.5 border-r-2 border-primary animate-pulse" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {phase >= 3 && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key="asst"
                        className="border border-white/10 bg-white/[0.03] p-2.5">
                        {SCRIPT_ASSISTANT.slice(0, assistantIdx).map((ln, i) => (
                          <div key={i} className="text-[11px] leading-snug text-white"
                            dangerouslySetInnerHTML={{ __html: ln
                              .replace(/\*\*(.+?)\*\*/g, "<b class='text-primary'>$1</b>")
                              .replace(/▸/g, "<span class='text-primary'>▸</span>")
                            }} />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-1.5 border-t border-white/10 p-2">
                  <div className="flex-1 text-[10px] text-neutral-500 font-mono px-1.5">Ask about your leads...</div>
                  <div className="p-1 bg-primary/40"><Send className="w-3 h-3 text-white" /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Narration column */}
      <div className="lg:col-span-2 flex flex-col gap-2">
        {STEPS.map((s, i) => {
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <motion.div
              key={i}
              animate={{
                opacity: active ? 1 : (done ? 0.5 : 0.25),
                x: active ? 0 : 0,
              }}
              transition={{ duration: 0.3 }}
              className={`border p-4 relative transition-colors ${active ? "border-primary bg-primary/[0.04]" : "border-border bg-card"}`}
            >
              {active && <motion.div layoutId="crm-step-marker" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
              <div className={`font-mono text-[10px] uppercase tracking-widest mb-1.5 ${active ? "text-primary" : "text-muted-foreground"}`}>{s.title}</div>
              <div className={`text-sm leading-relaxed ${active ? "text-white" : "text-muted-foreground"}`}>{s.body}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
