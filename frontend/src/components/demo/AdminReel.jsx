import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, Users, FileText, BarChart3, MessageSquare,
  Pause, Play, Sparkles, Send, TrendingUp, Zap, AlertTriangle,
} from "lucide-react";
import BrowserFrame from "./BrowserFrame";

/**
 * A 30-second self-playing "screen capture" of the admin console.
 * Five 6-second chapters loop forever, driven by a single ticking clock:
 *   1. Overview  — KPIs tick up
 *   2. Analytics — top-prompts bar chart populates
 *   3. Quotas    — per-agent token bars fill, one goes over cap
 *   4. Context   — .md file drops into the doc library
 *   5. Chat      — agent asks a question, scoped answer streams back
 *
 * The user can click any chapter to jump, or pause/resume the reel.
 * Designed to prove depth without a signup — put on the landing page.
 */

const CHAPTERS = [
  { key: "overview",  label: "Overview",  icon: Terminal,   duration: 6, caption: "Live KPIs across every agent — spend, cache hit-rate, escalations." },
  { key: "analytics", label: "Analytics", icon: BarChart3,  duration: 6, caption: "The prompts your team asks most — token-weighted." },
  { key: "quotas",    label: "Quotas",    icon: Users,      duration: 6, caption: "Set a monthly token cap per agent. Over-cap agents are flagged in real time." },
  { key: "context",   label: "Context",   icon: FileText,   duration: 6, caption: "Drop a .md file. The bot rebuilds its system prompt on the fly." },
  { key: "chat",      label: "Live chat", icon: MessageSquare, duration: 6, caption: "Answers are scoped per-agent — Alice never sees Bob's leads." },
];
const TOTAL = CHAPTERS.reduce((s, c) => s + c.duration, 0); // 30
const CHAPTER_STARTS = CHAPTERS.reduce((acc, c, i) => {
  acc.push((acc[i - 1] || 0) + (i === 0 ? 0 : CHAPTERS[i - 1].duration));
  return acc;
}, []);

const chapterAt = (t) => {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (t >= CHAPTER_STARTS[i]) return i;
  }
  return 0;
};

export default function AdminReel() {
  const [t, setT] = useState(0);           // seconds elapsed (0..TOTAL)
  const [playing, setPlaying] = useState(true);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    if (!playing) {
      offsetRef.current = t;
      cancelAnimationFrame(rafRef.current);
      return;
    }
    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = offsetRef.current + (now - startRef.current) / 1000;
      const wrapped = elapsed % TOTAL;
      setT(wrapped);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const activeIdx = chapterAt(t);
  const active = CHAPTERS[activeIdx];
  const chapterT = t - CHAPTER_STARTS[activeIdx];     // seconds since chapter start
  const chapterPct = Math.min(1, chapterT / active.duration);

  const jump = (i) => {
    offsetRef.current = CHAPTER_STARTS[i];
    startRef.current = performance.now();
    setT(CHAPTER_STARTS[i]);
  };

  const mmss = (s) => {
    const total = Math.floor(s);
    return `00:${String(total).padStart(2, "0")}`;
  };

  return (
    <div className="relative" data-testid="admin-reel">
      {/* Recording chrome */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_2px_rgba(255,80,20,0.6)]"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary">Rec</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {mmss(t)} / {mmss(TOTAL)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:inline">
            Company/OS · admin console
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="border border-border hover:border-primary/60 bg-card px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            data-testid="reel-playpause"
            aria-label={playing ? "Pause reel" : "Play reel"}
          >
            {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      {/* Chapter progress bar */}
      <div className="mb-4">
        <div className="grid gap-1" style={{ gridTemplateColumns: CHAPTERS.map((c) => `${c.duration}fr`).join(" ") }}>
          {CHAPTERS.map((c, i) => {
            const isActive = i === activeIdx;
            const isPast = i < activeIdx;
            const fill = isPast ? 100 : isActive ? chapterPct * 100 : 0;
            return (
              <button
                key={c.key}
                onClick={() => jump(i)}
                data-testid={`reel-chapter-${c.key}`}
                className="text-left group"
              >
                <div className="h-1 bg-border relative overflow-hidden">
                  <div
                    className={`h-full bg-primary ${isActive ? "" : "transition-all duration-500"}`}
                    style={{ width: `${fill}%` }}
                  />
                </div>
                <div className={`flex items-center gap-1.5 mt-2 font-mono text-[9px] uppercase tracking-widest transition-colors ${
                  isActive ? "text-primary" : isPast ? "text-foreground/60" : "text-muted-foreground/60 group-hover:text-muted-foreground"
                }`}>
                  <span className="tabular-nums">0{i + 1}</span>
                  <c.icon className="w-3 h-3 hidden md:inline" />
                  <span className="truncate">{c.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browser frame with panel */}
      <BrowserFrame url="companyos.acme.com/app" testid="admin-reel-frame">
        <div className="min-h-[420px] md:min-h-[460px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
              className="p-5 md:p-6"
            >
              <div className="mb-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  /// {active.label}
                </div>
                <div className="font-display font-black text-2xl md:text-3xl leading-tight text-white">
                  {active.key === "overview"  && "Everything at a glance."}
                  {active.key === "analytics" && "What your team asks the most."}
                  {active.key === "quotas"    && "One agent is about to burn through."}
                  {active.key === "context"   && "Feed the brain in one drop."}
                  {active.key === "chat"      && "Alice, scoped to her leads."}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5 max-w-xl">{active.caption}</div>
              </div>

              {active.key === "overview"  && <OverviewPanel  progress={chapterPct} />}
              {active.key === "analytics" && <AnalyticsPanel progress={chapterPct} />}
              {active.key === "quotas"    && <QuotasPanel    progress={chapterPct} />}
              {active.key === "context"   && <ContextPanel   progress={chapterPct} />}
              {active.key === "chat"      && <ChatPanel      progress={chapterPct} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </BrowserFrame>

      <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-muted-foreground px-1">
        <span>Loops forever · click a chapter to jump</span>
        <span>demo tenant · acme · no signup required</span>
      </div>
    </div>
  );
}

/* ─────────── Chapter panels ─────────── */

function countUp(target, progress) {
  // progress ∈ [0..1] within chapter
  return Math.round(target * Math.min(1, progress * 1.4));
}

function OverviewPanel({ progress }) {
  const KPIS = [
    { label: "Messages today",   target: 1284, unit: "",   icon: MessageSquare, accent: false },
    { label: "Cache hit rate",   target: 48,   unit: "%",  icon: Zap,            accent: true },
    { label: "Active agents",    target: 12,   unit: "",   icon: Users,          accent: false },
    { label: "Escalations",      target: 3,    unit: "",   icon: AlertTriangle,  accent: false, danger: true },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {KPIS.map((k, i) => {
          const v = countUp(k.target, progress);
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border p-3 ${k.accent ? "border-primary bg-primary/[0.05]" : k.danger ? "border-primary/40 bg-primary/[0.02]" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
                <k.icon className={`w-3 h-3 ${k.accent || k.danger ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className={`font-display font-black text-2xl tabular-nums ${k.accent ? "text-primary" : "text-white"}`}>
                {v.toLocaleString()}{k.unit}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-xs text-white">Token spend · last 14 days</div>
          <div className="font-mono text-[10px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-primary" /> +18%</div>
        </div>
        <Sparkline progress={progress} />
      </div>
    </div>
  );
}

function Sparkline({ progress }) {
  // fake 14-day series
  const pts = [12, 18, 22, 19, 26, 34, 30, 42, 38, 55, 60, 72, 68, 84];
  const max = Math.max(...pts);
  const w = 100, h = 32;
  const step = w / (pts.length - 1);
  const path = pts.map((p, i) => {
    const x = i * step;
    const y = h - (p / max) * h;
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  const revealX = w * Math.min(1, progress * 1.3);
  return (
    <div className="w-full h-14 relative">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="reelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ff5014" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ff5014" stopOpacity="0" />
          </linearGradient>
          <clipPath id="reelClip">
            <rect x="0" y="0" width={revealX} height={h} />
          </clipPath>
        </defs>
        <g clipPath="url(#reelClip)">
          <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#reelGrad)" />
          <path d={path} fill="none" stroke="#ff5014" strokeWidth="0.7" />
        </g>
      </svg>
    </div>
  );
}

function AnalyticsPanel({ progress }) {
  const PROMPTS = [
    { q: "what urgent tasks do I have today?", n: 214 },
    { q: "why did I get an escalation last week?", n: 168 },
    { q: "which of my leads is closest to closing?", n: 129 },
    { q: "how does our escalation SLA work?", n: 82 },
    { q: "who owns lead-01?", n: 55 },
  ];
  const max = PROMPTS[0].n;
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-4">
        <div className="font-display font-bold text-sm text-white">Top prompts</div>
        <div className="font-mono text-[10px] text-muted-foreground">last 30 days</div>
      </div>
      <div className="space-y-2.5">
        {PROMPTS.map((p, i) => {
          const target = (p.n / max) * 100;
          const staggered = Math.max(0, Math.min(1, (progress * PROMPTS.length - i)));
          const pct = target * staggered;
          return (
            <div key={p.q} className="flex items-center gap-3">
              <div className="w-4 font-mono text-[10px] text-muted-foreground tabular-nums">{i + 1}</div>
              <div className="flex-1 text-[11px] text-white/90 truncate">{p.q}</div>
              <div className="flex-1 max-w-[160px] h-2 bg-black/50 relative overflow-hidden">
                <div className="h-full bg-primary/80" style={{ width: `${pct}%`, transition: "width 120ms linear" }} />
              </div>
              <div className="w-10 text-right text-[10px] font-mono tabular-nums text-muted-foreground">
                {Math.round(p.n * staggered)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuotasPanel({ progress }) {
  const USERS = [
    { name: "Alice Agent", used: 4820,  limit: 10000, role: "agent" },
    { name: "Bob Agent",   used: 9210,  limit: 10000, role: "agent" },
    { name: "Chris Agent", used: 10240, limit: 10000, role: "agent", over: true },
    { name: "Ava Admin",   used: 1420,  limit: 0,     role: "super_admin" },
  ];
  return (
    <div className="border border-border bg-card">
      {USERS.map((u, i) => {
        const target = u.limit > 0 ? Math.min(100, (u.used / u.limit) * 100) : 3;
        const staggered = Math.max(0, Math.min(1, (progress * USERS.length - i)));
        const pct = target * staggered;
        const barColor = u.over ? "bg-primary" : pct > 80 ? "bg-orange-500" : "bg-emerald-500";
        return (
          <div key={u.name} className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-b-0">
            <div className="w-28 shrink-0">
              <div className="text-xs font-medium text-white">{u.name}</div>
              <div className="text-[9px] font-mono uppercase text-muted-foreground">{u.role}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between font-mono text-[10px] mb-1">
                <span className={u.over ? "text-primary" : "text-muted-foreground"}>
                  {Math.round(u.used * staggered).toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {u.limit === 0 ? "∞" : u.limit.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 bg-black/50 relative overflow-hidden">
                <div className={`h-full ${barColor}`} style={{ width: `${pct}%`, transition: "width 120ms linear" }} />
              </div>
            </div>
            <div className={`text-[10px] font-mono border px-2 py-0.5 shrink-0 ${
              u.over ? "border-primary text-primary" : "border-border text-muted-foreground"
            }`}>
              {u.over ? "over cap" : u.limit === 0 ? "no cap" : "healthy"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContextPanel({ progress }) {
  // 0..0.35 → file drifting toward dropzone
  // 0.35..0.55 → landed, "ingesting"
  // 0.55..1 → shows up as a new card in the grid
  const dropped = progress >= 0.35;
  const ingested = progress >= 0.55;
  const cursorX = 60 + progress * 100; // px, drifts right
  const cursorY = 20 - Math.min(1, progress / 0.35) * 20;

  const DOCS = [
    { title: "Escalation Rules (Dev Reference)", kind: "dev" },
    { title: "Customer-First Playbook", kind: "ideology" },
    { title: "acme-app — Architecture", kind: "dev", auto: true },
    { title: "acme-app — Database Schema", kind: "dev", auto: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 relative">
      <div className={`col-span-2 md:col-span-3 border-2 border-dashed p-4 flex items-center justify-between transition-colors ${
        dropped ? "border-primary bg-primary/[0.08]" : "border-primary/40 bg-primary/[0.02]"
      }`}>
        <div className="flex items-center gap-3">
          <FileText className={`w-4 h-4 ${dropped ? "text-primary" : "text-primary/70"}`} />
          <div>
            <div className="font-display font-bold text-xs text-white">
              {ingested ? "Ingested: onboarding-v2.md" : dropped ? "Ingesting…" : "Drop .md files here"}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {ingested ? "System prompt rebuilt · 4 sections detected" : "or ingest a repo folder"}
            </div>
          </div>
        </div>
        {ingested && (
          <span className="font-mono text-[10px] text-primary flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> live
          </span>
        )}
      </div>

      {/* Drifting .md tile that "drops" into the dropzone */}
      {!ingested && (
        <motion.div
          animate={{ opacity: dropped ? 0 : 1, scale: dropped ? 0.6 : 1 }}
          transition={{ duration: 0.3 }}
          style={{ transform: `translate(${cursorX}px, ${cursorY}px)` }}
          className="absolute top-0 left-4 md:left-8 z-10 border border-primary/60 bg-black/80 px-2.5 py-1.5 flex items-center gap-1.5 shadow-2xl pointer-events-none"
        >
          <FileText className="w-3 h-3 text-primary" />
          <span className="font-mono text-[10px] text-white">onboarding-v2.md</span>
        </motion.div>
      )}

      {DOCS.map((d, i) => (
        <div key={d.title} className="border border-border p-3 bg-card">
          <div className="font-display font-bold text-xs truncate text-white">{d.title}</div>
          <div className="font-mono text-[9px] uppercase text-muted-foreground mt-1">
            {d.kind}{d.auto && <span className="text-primary"> · auto-ingested</span>}
          </div>
        </div>
      ))}
      {ingested && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="border border-primary p-3 bg-primary/[0.05] col-span-2 md:col-span-1"
        >
          <div className="font-display font-bold text-xs truncate text-white">onboarding-v2.md</div>
          <div className="font-mono text-[9px] uppercase text-muted-foreground mt-1">
            product <span className="text-primary">· just added</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ChatPanel({ progress }) {
  const question = "What urgent tasks do I have today?";
  const answer = "You have **1 urgent task**: `task-01 — Follow up with Northwind Traders` — due today.\n\n**Heads-up:** `lead-01 (Northwind)` is hot and was escalated last week — refresh notes after the call.";
  const showQ = progress > 0.1;
  const answerReveal = Math.max(0, Math.min(1, (progress - 0.35) / 0.55));
  const revealChars = Math.floor(answer.length * answerReveal);
  const streamedAnswer = answer.slice(0, revealChars);
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* fake left "leads" panel to prove scope */}
      <div className="hidden md:block md:col-span-2 border border-border bg-card p-3">
        <div className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2">Alice's leads</div>
        <div className="space-y-1.5">
          {[
            { id: "L-01", name: "Northwind Traders", status: "hot",    urgent: true },
            { id: "L-02", name: "Contoso Ltd",        status: "warm" },
            { id: "L-03", name: "Fabrikam Inc",       status: "cold" },
          ].map((l) => (
            <div key={l.id} className={`flex items-center gap-2 px-2 py-1.5 border ${l.urgent ? "border-primary/60 bg-primary/[0.06]" : "border-border/60"}`}>
              <span className="font-mono text-[9px] text-muted-foreground w-8">{l.id}</span>
              <span className="text-xs text-white/90 flex-1 truncate">{l.name}</span>
              <span className={`text-[9px] font-mono uppercase ${l.urgent ? "text-primary" : "text-muted-foreground"}`}>{l.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/60 font-mono text-[9px] text-muted-foreground">
          scope: <span className="text-primary">user_id = alice</span> · Bob's leads hidden
        </div>
      </div>

      {/* chat column */}
      <div className="md:col-span-3 border border-border bg-black/60 flex flex-col">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <div className="text-xs font-display font-bold text-white">Company/OS</div>
          <div className="ml-auto font-mono text-[9px] text-muted-foreground">
            {answerReveal >= 1 ? "answered" : answerReveal > 0 ? "streaming…" : showQ ? "thinking…" : "ready"}
          </div>
        </div>
        <div className="p-3 space-y-2.5 min-h-[220px] text-[12px]">
          {showQ && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
              <div className="max-w-[85%] px-2.5 py-1.5 border border-primary/60 bg-primary/10 text-white">
                {question}
              </div>
            </motion.div>
          )}
          {answerReveal > 0 && (
            <div className="flex justify-start">
              <div className="max-w-[92%] px-2.5 py-1.5 border border-border/60 bg-muted/20 text-white/90 whitespace-pre-wrap leading-relaxed">
                <FormattedAnswer text={streamedAnswer} />
                {answerReveal < 1 && <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 align-middle animate-pulse" />}
              </div>
            </div>
          )}
        </div>
        <div className="mt-auto px-3 py-2 border-t border-border/60 flex items-center gap-2">
          <div className="flex-1 font-mono text-[10px] text-muted-foreground">Ask about your leads…</div>
          <div className="bg-primary/60 p-1"><Send className="w-3 h-3 text-white" /></div>
        </div>
      </div>
    </div>
  );
}

function FormattedAnswer({ text }) {
  // very small formatter: **bold** and `code` inline, otherwise plain
  const parts = [];
  let buf = "";
  let i = 0;
  while (i < text.length) {
    if (text.slice(i, i + 2) === "**") {
      const end = text.indexOf("**", i + 2);
      if (end > -1) {
        if (buf) { parts.push(buf); buf = ""; }
        parts.push(<b key={parts.length} className="text-primary">{text.slice(i + 2, end)}</b>);
        i = end + 2; continue;
      }
    }
    if (text[i] === "`") {
      const end = text.indexOf("`", i + 1);
      if (end > -1) {
        if (buf) { parts.push(buf); buf = ""; }
        parts.push(<code key={parts.length} className="bg-black/60 border border-border/60 px-1 text-[11px] font-mono text-primary">{text.slice(i + 1, end)}</code>);
        i = end + 1; continue;
      }
    }
    buf += text[i]; i++;
  }
  if (buf) parts.push(buf);
  return <>{parts}</>;
}
