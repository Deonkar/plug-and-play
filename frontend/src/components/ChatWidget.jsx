import { useEffect, useState, useRef } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import api from "../lib/api";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/chat", { message: q, session_id: sessionId });
      if (data.session_id) setSessionId(data.session_id);
      setMessages((m) => [...m, { role: "assistant", text: data.answer, cached: data.cache_hit, tokens: data.tokens_in + data.tokens_out }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Error: " + (e.response?.data?.detail || e.message), error: true }]);
    } finally { setBusy(false); }
  };

  const suggestions = [
    "What urgent tasks do I have today?",
    "Why did I get an escalation last week?",
    "Which of my leads is closest to closing?",
  ];

  return (
    <>
      {!open && (
        <button data-testid="chat-widget-toggle" onClick={()=>setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-white p-4 shadow-2xl border border-primary/60 hover:-translate-y-1 transition-transform">
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
      {open && (
        <div data-testid="chat-widget-panel"
          className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] chat-glass flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-display font-bold text-sm">Company/OS Assistant</span>
            </div>
            <button data-testid="chat-widget-close" onClick={()=>setOpen(false)} className="text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
            {messages.length === 0 && (
              <div>
                <p className="text-muted-foreground text-xs mb-3 font-mono">// try asking:</p>
                {suggestions.map((s, i) => (
                  <button key={i} onClick={()=>setInput(s)} data-testid={`chat-suggestion-${i}`}
                    className="block w-full text-left px-3 py-2 mb-2 border border-white/10 hover:border-primary/60 text-xs transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div className={`inline-block px-3 py-2 border ${m.role === "user" ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/5"} max-w-[85%] text-left whitespace-pre-wrap`}
                  data-testid={`chat-msg-${m.role}-${i}`}>
                  {m.text}
                </div>
                {m.role === "assistant" && !m.error && (
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">
                    {m.cached ? "◉ cached · " : ""}~{m.tokens} tok
                  </div>
                )}
              </div>
            ))}
            {busy && <div className="text-xs font-mono text-muted-foreground">thinking...</div>}
          </div>
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input value={input} onChange={(e)=>setInput(e.target.value)}
              onKeyDown={(e)=>{ if (e.key === "Enter") send(); }}
              placeholder="Ask about your leads, tasks, escalations..."
              className="input-tech flex-1 text-sm" data-testid="chat-input" />
            <button onClick={send} disabled={busy} className="btn-primary" data-testid="chat-send"><Send className="w-4 h-4"/></button>
          </div>
        </div>
      )}
    </>
  );
}
