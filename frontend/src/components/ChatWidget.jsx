import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, X, Send, Sparkles, Copy, Check, Minimize2, Zap } from "lucide-react";
import api from "../lib/api";
import { cn } from "@/lib/utils";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (open) inputRef.current?.focus();
  }, [messages, open]);

  const send = async (override) => {
    const q = (override ?? input).trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q, ts: Date.now() }]);
    setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/chat", { message: q, session_id: sessionId });
      if (data.session_id) setSessionId(data.session_id);
      setMessages((m) => [...m, {
        role: "assistant", text: data.answer, cached: data.cache_hit,
        tokens: data.tokens_in + data.tokens_out, ts: Date.now(),
      }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "**Error:** " + (e.response?.data?.detail || e.message), error: true, ts: Date.now() }]);
    } finally { setBusy(false); }
  };

  const suggestions = [
    { icon: Zap, text: "What are my urgent tasks today?" },
    { icon: Sparkles, text: "Why did I get an escalation last week?" },
    { icon: Zap, text: "Which of my leads is closest to closing?" },
  ];

  const clear = () => { setMessages([]); setSessionId(null); };

  return (
    <>
      {/* FLOATING BUBBLE */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="bubble"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            data-testid="chat-widget-toggle"
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50 group"
          >
            <span className="absolute inset-0 bg-primary/30 blur-xl group-hover:bg-primary/50 transition-colors" />
            <span className="relative flex items-center gap-2 bg-primary text-white px-4 py-3 border border-primary/60 shadow-2xl">
              <MessageSquare className="w-4 h-4" />
              <span className="font-display font-bold text-sm hidden sm:inline">Ask/OS</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* PANEL */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className={cn(
              "fixed z-50 chat-glass flex flex-col shadow-[0_20px_60px_-20px_rgba(255,80,20,0.35)]",
              "inset-x-3 bottom-3 md:inset-auto md:bottom-6 md:right-6 md:w-[420px] md:h-[620px]",
              "max-h-[calc(100vh-1.5rem)]"
            )}
            data-testid="chat-widget-panel"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/40 blur-md animate-pulse" />
                  <Sparkles className="relative w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm leading-tight">Company/OS</div>
                  <div className="font-mono text-[10px] text-muted-foreground truncate">assistant · online</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={clear} className="text-muted-foreground hover:text-white p-1.5" data-testid="chat-clear" title="New chat">
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button data-testid="chat-widget-close" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-white p-1.5" title="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="pt-2">
                  <div className="font-display font-bold text-lg mb-1">How can I help?</div>
                  <p className="text-muted-foreground text-xs mb-4">Ask about your leads, tasks, escalations, or anything from the company brain.</p>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => send(s.text)}
                          data-testid={`chat-suggestion-${i}`}
                          className="w-full flex items-start gap-2.5 px-3 py-2.5 border border-white/10 hover:border-primary/60 hover:bg-primary/5 text-xs text-left transition-all group"
                        >
                          <Icon className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span>{s.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map((m, i) => <Message key={i} msg={m} index={i} />)}

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

            {/* INPUT */}
            <div className="p-3 border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent">
              <div className="flex items-end gap-2 border border-white/10 focus-within:border-primary/60 bg-black/40 px-3 py-2 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  rows={1}
                  placeholder="Ask about your leads, tasks..."
                  className="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 leading-snug placeholder:text-muted-foreground"
                  data-testid="chat-input"
                />
                <button
                  onClick={() => send()}
                  disabled={busy || !input.trim()}
                  className={cn(
                    "shrink-0 p-2 transition-all",
                    input.trim() && !busy
                      ? "bg-primary text-white hover:brightness-110"
                      : "bg-white/5 text-muted-foreground cursor-not-allowed"
                  )}
                  data-testid="chat-send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground/70">
                <span>Enter to send · Shift+Enter for newline</span>
                <span>Claude Sonnet 4.6</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Message({ msg, index }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";

  const copy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("group flex flex-col", isUser ? "items-end" : "items-start")}
      data-testid={`chat-msg-${msg.role}-${index}`}
    >
      <div
        className={cn(
          "max-w-[88%] px-3.5 py-2.5 text-sm border",
          isUser
            ? "border-primary/60 bg-primary/10 text-white"
            : msg.error
              ? "border-primary/40 bg-primary/5"
              : "border-white/10 bg-white/[0.03]"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
        ) : (
          <div className="chat-md text-[13px] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-muted-foreground/70 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isUser && (
          <>
            <button onClick={copy} className="hover:text-primary flex items-center gap-1" data-testid={`chat-copy-${index}`}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "copied" : "copy"}
            </button>
            <span>·</span>
            {msg.cached && <><span className="text-primary">◉ cached</span><span>·</span></>}
            <span>~{msg.tokens} tok</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
