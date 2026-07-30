import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles, Send, MessageSquare, X, Play } from "lucide-react";

/**
 * Hero-sized looping demo: a fake CRM in a browser frame with the Company/OS chatbot
 * plug-in that opens, receives a question, and streams a scoped answer — loops forever.
 * Replaces the static terminal on the landing hero.
 */
const LEADS = [
  { id: "L-01", name: "Northwind Traders", owner: "Alice", stage: "Discovery", priority: "urgent", amount: "$48K" },
  { id: "L-02", name: "Contoso Ltd",       owner: "Alice", stage: "Proposal",  priority: "high",   amount: "$120K" },
  { id: "L-03", name: "Fabrikam Inc",      owner: "Alice", stage: "Qualify",   priority: "medium", amount: "$18K" },
  { id: "L-04", name: "Adventure Works",   owner: "Bob",   stage: "Closing",   priority: "urgent", amount: "$92K" },
];
const USER_MSG = "what urgent tasks do I have today?";
const ASSISTANT_LINES = [
  "You have **1 URGENT task**:",
  "",
  "▸ **task-01** — Call Northwind CTO for demo",
  "  Lead: **Northwind Traders** (lead-01) · previously escalated.",
];
const priorityChip = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-slate-100 text-slate-600 border-slate-200",
};
const stageChip = {
  Discovery: "bg-sky-100 text-sky-700",
  Proposal: "bg-indigo-100 text-indigo-700",
  Qualify: "bg-purple-100 text-purple-700",
  Closing: "bg-emerald-100 text-emerald-700",
};

export default function HeroDemo() {
  const [phase, setPhase] = useState(0); // 0 crm alone, 1 widget open, 2 typing, 3 assistant, loop
  const [typed, setTyped] = useState("");
  const [asstIdx, setAsstIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const running = useRef(true);
  const containerRef = useRef(null);

  // Cursor-parallax tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), { stiffness: 150, damping: 20 });

  const onMouseMove = (e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); };

  const openLiveWidget = () => {
    // If the widget is on the page (authenticated dashboard), open it
    const btn = document.querySelector('[data-testid="chat-widget-toggle"]');
    if (btn) {
      btn.click();
      btn.classList.add("ring-4", "ring-primary/50");
      setTimeout(() => btn.classList.remove("ring-4", "ring-primary/50"), 1600);
      return;
    }
    // Otherwise nudge them to sign in first
    window.location.href = "/login?next=/app";
  };

  useEffect(() => {
    running.current = true;
    const timers = [];
    const t = (ms, fn) => timers.push(setTimeout(fn, ms));
    const run = () => {
      if (paused) return;
      setPhase(0); setTyped(""); setAsstIdx(0);
      t(1600, () => setPhase(1));
      t(3000, () => setPhase(2));
      for (let i = 1; i <= USER_MSG.length; i++) t(3000 + i * 32, () => setTyped(USER_MSG.slice(0, i)));
      const after = 3000 + USER_MSG.length * 32 + 500;
      t(after, () => setPhase(3));
      for (let i = 1; i <= ASSISTANT_LINES.length; i++) t(after + i * 380, () => setAsstIdx(i));
      t(after + ASSISTANT_LINES.length * 380 + 4500, () => { if (running.current && !paused) run(); });
    };
    run();
    return () => { running.current = false; timers.forEach(clearTimeout); };
  }, [paused]);

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200, transformStyle: "preserve-3d" }}
      className="border border-border shadow-[0_60px_120px_-40px_rgba(0,0,0,0.6)] overflow-hidden bg-slate-50 relative group"
      data-testid="hero-demo"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-neutral-800 bg-neutral-950">
        <span className="w-2.5 h-2.5 border border-red-500/60 bg-red-500/60 rounded-full" />
        <span className="w-2.5 h-2.5 border border-amber-500/60 bg-amber-500/60 rounded-full" />
        <span className="w-2.5 h-2.5 border border-emerald-500/60 bg-emerald-500/60 rounded-full" />
        <div className="ml-4 flex-1 max-w-md">
          <div className="font-mono text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 truncate rounded">
            https://saleshub.acme.com/leads
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-neutral-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> live
        </div>
      </div>

      {/* CRM header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
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
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400" />
      </div>

      {/* Leads table */}
      <div className="p-6 relative min-h-[300px] md:min-h-[380px]">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Pipeline</div>
            <div className="font-bold text-lg text-slate-900">All leads</div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">4 records</div>
        </div>
        <div className="border border-slate-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-400 font-semibold uppercase tracking-widest text-[10px] bg-slate-50">
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2 hidden sm:table-cell">Stage</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">Amount</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {LEADS.map((l, i) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-mono text-slate-400">{l.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">{l.name}</td>
                  <td className="px-3 py-2 text-slate-500">{l.owner}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${stageChip[l.stage]}`}>{l.stage}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest border px-1.5 py-0.5 rounded ${priorityChip[l.priority]}`}>{l.priority}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900 hidden sm:table-cell">{l.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Floating bubble */}
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

        {/* Widget panel */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div key="panel"
              initial={{ opacity: 0, y: 30, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.94 }}
              transition={{ type: "spring", damping: 22, stiffness: 240 }}
              className="absolute bottom-4 right-4 w-[280px] md:w-[320px] bg-neutral-950/95 backdrop-blur-2xl border border-primary/40 shadow-[0_20px_60px_-20px_rgba(255,80,20,0.5)] rounded"
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
                        {typed}<span className="ml-0.5 border-r-2 border-primary animate-pulse" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {phase >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key="asst"
                      className="border border-white/10 bg-white/[0.03] p-2.5">
                      {ASSISTANT_LINES.slice(0, asstIdx).map((ln, i) => (
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

      {/* Floating plug-in tag */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
        animate={{ opacity: 1, scale: 1, rotate: 2 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
        className="absolute -top-3 -right-3 bg-primary text-white text-[10px] font-mono uppercase tracking-widest px-2.5 py-1.5 border border-primary/60 shadow-[0_8px_20px_-4px_rgba(255,80,20,0.4)] z-20"
        data-testid="plugin-ready-tag"
      >
        <span className="inline-block w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse" />
        plug-in ready
      </motion.div>

      {/* Try-it-live pill */}
      <motion.button
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
        onClick={openLiveWidget}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-950/90 backdrop-blur border border-primary/40 text-white text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 shadow-lg hover:border-primary transition-colors opacity-0 group-hover:opacity-100 z-20"
        data-testid="hero-demo-try-live"
      >
        <Play className="w-3 h-3 text-primary fill-primary" /> Try it live
      </motion.button>
    </motion.div>
  );
}
