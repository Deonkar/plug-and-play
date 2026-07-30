import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, X, Send, Sparkles, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { cn } from "@/lib/utils";

/**
 * Marketing-side playground widget.
 * Uses POST /api/public/playground (no auth). Impersonates the seeded demo agent Alice
 * (with 3 leads & 3 tasks) so visitors can experience real scoped answers before signup.
 */
const SUGGESTIONS = [
  "What urgent tasks do I have today?",
  "Why did I get an escalation last week?",
  "Which of my leads is closest to closing?",
];

export default function PlaygroundWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const scrollRef = useRef(null);

  const firstReplyReceived = messages.some((m) => m.role === "assistant" && !m.error);
  const showCta = firstReplyReceived && !ctaDismissed;

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async (override) => {
    const q = (override ?? input).trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/public/playground", { message: q, session_id: sessionId });
      if (data.session_id) setSessionId(data.session_id);
      setRemaining(data.remaining);
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "**" + (e.response?.data?.detail || e.message) + "**", error: true }]);
    } finally { setBusy(false); }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            data-testid="playground-toggle"
            className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50 group"
          >
            <span className="absolute inset-0 bg-primary/30 blur-xl group-hover:bg-primary/50 transition-colors" />
            <span className="relative flex items-center gap-2 bg-primary text-white px-4 py-3 border border-primary/60 shadow-2xl">
              <MessageSquare className="w-4 h-4" />
              <span className="font-display font-bold text-sm hidden sm:inline">Try it live</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="pw-panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed z-50 chat-glass flex flex-col shadow-[0_20px_60px_-20px_rgba(255,80,20,0.35)] inset-x-3 bottom-3 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[560px] max-h-[calc(100vh-1.5rem)]"
            data-testid="playground-panel"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/[0.03]">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 blur-md animate-pulse" />
                  <Sparkles className="relative w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm">Playground</div>
                  <div className="font-mono text-[10px] text-muted-foreground">demo agent · Alice (3 leads)</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1.5" data-testid="playground-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
              {messages.length === 0 && (
                <div className="pt-2">
                  <div className="font-display font-bold mb-1">Ask like an agent would.</div>
                  <p className="text-muted-foreground text-xs mb-4">
                    You're chatting as <b>Alice</b> — an agent with 3 leads. Try:
                  </p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => send(s)} data-testid={`pw-suggestion-${i}`}
                        className="w-full text-left px-3 py-2.5 border border-border hover:border-primary/60 hover:bg-primary/5 text-xs transition-all text-foreground">
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 text-[10px] font-mono text-muted-foreground border-t border-border pt-3">
                    15 free messages per hour · no signup · seeded demo data
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div className={cn(
                    "max-w-[88%] px-3 py-2 text-[13px] border",
                    m.role === "user"
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : m.error ? "border-primary/40 bg-primary/5 text-foreground"
                                : "border-border bg-muted/40 text-foreground"
                  )}>
                    {m.role === "user"
                      ? <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                      : <div className="chat-md leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown></div>}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground pl-1">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                  </span>
                  thinking
                </div>
              )}
            </div>

            <AnimatePresence>
              {showCta && (
                <motion.div
                  key="pw-cta"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className="mx-3 mb-2 relative border border-primary/50 bg-primary/[0.08] px-3 py-2.5 flex items-center gap-3"
                  data-testid="playground-cta"
                >
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-display font-bold text-foreground leading-tight">Impressed?</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">Get your own scoped agent in 2 min.</div>
                  </div>
                  <Link
                    to="/register"
                    className="shrink-0 inline-flex items-center gap-1 bg-primary text-white text-[11px] font-mono uppercase tracking-wider px-2.5 py-1.5 hover:brightness-110 transition-all"
                    data-testid="playground-cta-register"
                  >
                    Register <ArrowRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => setCtaDismissed(true)}
                    className="shrink-0 text-muted-foreground hover:text-foreground p-0.5"
                    data-testid="playground-cta-dismiss"
                    aria-label="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3 border-t border-border bg-muted/30">
              <div className="flex items-end gap-2 border border-border focus-within:border-primary/60 bg-background px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ask about Alice's leads..."
                  maxLength={500}
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  data-testid="playground-input"
                />
                <button
                  onClick={() => send()} disabled={busy || !input.trim()}
                  className={cn(
                    "shrink-0 p-2 transition-all",
                    input.trim() && !busy ? "bg-primary text-white hover:brightness-110" : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  data-testid="playground-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>{remaining !== null ? `${remaining} left this hour` : "15 / hour · free"}</span>
                <span>Claude Sonnet 4.6</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
