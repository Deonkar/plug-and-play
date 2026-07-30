import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, MessageSquare, X } from "lucide-react";
import BrowserFrame from "./BrowserFrame";

const LEADS = [
  { id: "L-01", name: "Northwind Traders", owner: "Alice", status: "hot", priority: "urgent", amount: "$48K" },
  { id: "L-02", name: "Contoso Ltd",       owner: "Alice", status: "warm", priority: "high",   amount: "$120K" },
  { id: "L-03", name: "Fabrikam Inc",      owner: "Alice", status: "new",  priority: "medium", amount: "$18K" },
  { id: "L-04", name: "Adventure Works",   owner: "Bob",   status: "hot", priority: "urgent", amount: "$92K" },
  { id: "L-05", name: "Wingtip Toys",      owner: "Bob",   status: "cold", priority: "low",    amount: "$6K" },
];

const SCRIPT = [
  { role: "user", text: "what urgent tasks do I have today?" },
  {
    role: "assistant",
    lines: [
      "You have **1 URGENT task**:",
      "",
      "▸ **task-01** — Call Northwind CTO for demo",
      "  Lead: **Northwind Traders** (lead-01) · previously escalated.",
      "",
      "Recommended: tackle this first.",
    ],
  },
];

const priorityColor = {
  urgent: "text-primary border-primary/60",
  high: "text-orange-400 border-orange-500/50",
  medium: "text-neutral-300 border-neutral-600",
  low: "text-neutral-500 border-neutral-800",
};

export default function CRMDemo() {
  const [phase, setPhase] = useState(0); // 0 crm alone, 1 widget open, 2 user typed, 3 assistant streaming, 4 hold, then loop
  const [typedUser, setTypedUser] = useState("");
  const [assistantIdx, setAssistantIdx] = useState(0);
  const running = useRef(true);

  useEffect(() => {
    running.current = true;
    let timeouts = [];
    const t = (ms, fn) => timeouts.push(setTimeout(fn, ms));

    const run = () => {
      setPhase(0); setTypedUser(""); setAssistantIdx(0);
      t(1200, () => setPhase(1)); // open widget
      t(2400, () => setPhase(2)); // start user typing
      // typewrite user question
      const userText = SCRIPT[0].text;
      for (let i = 1; i <= userText.length; i++) {
        t(2400 + i * 35, () => setTypedUser(userText.slice(0, i)));
      }
      t(2400 + userText.length * 35 + 500, () => setPhase(3)); // assistant reveal starts
      const lines = SCRIPT[1].lines;
      for (let i = 1; i <= lines.length; i++) {
        t(2400 + userText.length * 35 + 500 + i * 380, () => setAssistantIdx(i));
      }
      t(2400 + userText.length * 35 + 500 + lines.length * 380 + 4500, () => {
        if (running.current) run();
      });
    };
    run();
    return () => { running.current = false; timeouts.forEach(clearTimeout); };
  }, []);

  return (
    <BrowserFrame url="crm.acme.com/leads" testid="crm-demo">
      <div className="grid grid-cols-12 min-h-[440px]">
        {/* Fake CRM sidebar */}
        <div className="col-span-2 border-r border-border p-3 space-y-1 hidden md:block">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">CRM</div>
          {["Leads", "Contacts", "Deals", "Reports"].map((x, i) => (
            <div key={x} className={`text-xs px-2 py-1.5 ${i===0 ? "bg-primary/10 border-l-2 border-primary text-white" : "text-muted-foreground"}`}>{x}</div>
          ))}
        </div>

        {/* Leads table */}
        <div className="col-span-12 md:col-span-10 p-5 relative">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">/// leads</div>
              <div className="font-display font-black text-2xl">All leads</div>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">5 records</div>
          </div>
          <div className="border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground font-mono text-[10px] uppercase tracking-widest">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {LEADS.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="border-t border-border/60"
                  >
                    <td className="px-3 py-2 font-mono text-muted-foreground">{l.id}</td>
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.owner}</td>
                    <td className="px-3 py-2"><span className="text-[10px] font-mono uppercase tracking-widest border px-1.5 py-0.5 border-neutral-700 text-neutral-300">{l.status}</span></td>
                    <td className="px-3 py-2"><span className={`text-[10px] font-mono uppercase tracking-widest border px-1.5 py-0.5 ${priorityColor[l.priority]}`}>{l.priority}</span></td>
                    <td className="px-3 py-2 text-right font-mono">{l.amount}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Floating chat bubble (visible before widget opens) */}
          <AnimatePresence>
            {phase === 0 && (
              <motion.div
                key="bubble"
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                className="absolute bottom-5 right-5"
              >
                <span className="absolute inset-0 bg-primary/30 blur-xl" />
                <span className="relative flex items-center gap-2 bg-primary text-white px-3 py-2 border border-primary/60">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="font-display font-bold text-xs">Ask/OS</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat panel */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                key="panel"
                initial={{ opacity: 0, y: 30, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.94 }}
                transition={{ type: "spring", damping: 22, stiffness: 240 }}
                className="absolute bottom-4 right-4 w-[300px] chat-glass shadow-2xl"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="font-display font-bold text-[11px]">Company/OS</span>
                  </div>
                  <X className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="p-3 space-y-2.5 min-h-[160px]">
                  <AnimatePresence>
                    {phase >= 2 && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key="user"
                        className="flex justify-end">
                        <div className="max-w-[85%] px-2.5 py-1.5 text-[11px] border border-primary/60 bg-primary/10">
                          {typedUser}<span className="ml-0.5 border-r-2 border-primary animate-pulse" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {phase >= 3 && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} key="asst"
                        className="border border-white/10 bg-white/[0.03] p-2.5">
                        {SCRIPT[1].lines.slice(0, assistantIdx).map((ln, i) => (
                          <div key={i} className="text-[11px] leading-snug"
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
                  <div className="flex-1 text-[10px] text-muted-foreground/70 font-mono px-1.5">Ask about your leads...</div>
                  <div className="p-1 bg-primary/40"><Send className="w-3 h-3 text-white" /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BrowserFrame>
  );
}
