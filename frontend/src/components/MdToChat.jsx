import { motion } from "framer-motion";
import { FileCode, ArrowRight, Sparkles, MessageSquare } from "lucide-react";

/**
 * Premium "code -> conversation" visual: shows a markdown source file on the left
 * and the chatbot answer on the right, connected by a Company/OS bridge in the middle.
 * Fills the empty space between "In markdown" and the three pillars.
 */
export default function MdToChat() {
  return (
    <section className="px-6 md:px-16 py-20 md:py-28">
      <div className="max-w-6xl mx-auto grid md:grid-cols-11 gap-6 md:gap-4 items-stretch">
        {/* LEFT: markdown source */}
        <motion.div
          initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="md:col-span-5 demo-dark border border-border shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-black/60">
            <FileCode className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[11px] text-muted-foreground">escalation-rules.md</span>
            <span className="ml-auto text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> saved
            </span>
          </div>
          <div className="p-6 font-mono text-[13px] leading-relaxed space-y-1.5">
            <div className="text-primary"># Escalation Rules</div>
            <div className="text-muted-foreground"></div>
            <div>An escalation is triggered when:</div>
            <div className="text-muted-foreground">- <span className="text-foreground">task.priority === "urgent"</span> AND</div>
            <div className="text-muted-foreground">  <span className="text-foreground">now &gt; task.due_date</span></div>
            <div className="text-muted-foreground">- <span className="text-foreground">lead.status === "hot"</span> AND</div>
            <div className="text-muted-foreground">  <span className="text-foreground">no touch in 48h</span></div>
            <div className="text-muted-foreground"></div>
            <div className="text-primary">## Resolution</div>
            <div>Always leave a <span className="text-primary">note on the lead</span></div>
            <div>with concrete next step + timeline.</div>
          </div>
        </motion.div>

        {/* MIDDLE: bridge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="md:col-span-1 flex md:flex-col items-center justify-center gap-2 py-4"
        >
          <div className="hidden md:block h-px w-full bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
          <div className="relative">
            <div className="absolute inset-0 bg-primary/50 blur-lg animate-pulse" />
            <div className="relative bg-primary text-white p-2.5 border border-primary/60">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground text-center whitespace-nowrap">plug<br className="hidden md:block"/>·<br className="hidden md:block"/>and<br className="hidden md:block"/>·<br className="hidden md:block"/>play</div>
          <ArrowRight className="w-4 h-4 text-primary md:rotate-90" />
        </motion.div>

        {/* RIGHT: chat answer */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="md:col-span-5 demo-dark border border-primary/40 shadow-[0_20px_60px_-20px_rgba(255,80,20,0.35)] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-primary/10">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-[11px] text-foreground">agent chat</span>
            <span className="ml-auto text-[10px] font-mono text-primary uppercase tracking-widest">answered in 720ms</span>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="flex justify-end">
              <div className="max-w-[85%] px-3 py-2 border border-primary/60 bg-primary/10 text-foreground text-[13px]">
                why did I get an escalation last week?
              </div>
            </div>
            <div className="border-l-2 border-primary pl-4">
              <div className="font-mono text-[10px] text-primary uppercase tracking-widest mb-2">assistant</div>
              <div className="text-[13px] leading-relaxed text-foreground">
                You were escalated on <b className="text-primary">lead-01 (Northwind)</b> because
                <span className="text-primary"> task-01</span> was <b>urgent</b> and passed its due date
                without a touch. Per your team's escalation rules, this triggers an alert.
                <div className="text-muted-foreground text-xs mt-3">Suggested next: leave a note on the lead with a concrete follow-up.</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
