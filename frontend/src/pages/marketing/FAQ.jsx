import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import MarketingLayout from "../../components/marketing/MarketingLayout";

const FAQS = [
  {
    q: "How does the bot 'know' our codebase?",
    a: "On install, run the ingest step — point it at your repo folder. It walks the tree and uses Claude Sonnet to generate structured markdown docs (Architecture, Database Schema, Module Map) that live inside your tenant. You can edit or delete these later.",
  },
  {
    q: "Is one agent's data ever seen by another?",
    a: "No. Row-level scoping is enforced in the API layer AND baked into the LLM's system prompt at request time. The prompt cache is also user-scoped for agents, role-scoped for admins.",
  },
  {
    q: "Can we bring our own LLM key?",
    a: "Yes. Set it under Settings → Provider/Model/Key. Otherwise the Emergent Universal Key handles OpenAI, Claude, and Gemini automatically.",
  },
  {
    q: "What about escalation rules?",
    a: "Write them in a .md doc. The bot uses them for its answers, and a lightweight rules engine flags overdue urgent tasks + untouched hot leads — pinging your Slack webhook once per event per day (deduped in Mongo).",
  },
  {
    q: "Does the chatbot support voice?",
    a: "Yes. Tap the mic in the widget — MediaRecorder captures audio, ships it to /api/voice/transcribe (OpenAI Whisper-1 via Emergent Key), and auto-sends the transcription. Perfect for hands-free use between calls.",
  },
  {
    q: "How do I embed the widget in my existing app?",
    a: "The widget is a React component today (see /app/frontend/src/components/ChatWidget.jsx). A standalone <script src=…/widget.js> loader is on the roadmap and will drop the same panel into any static site.",
  },
  {
    q: "Where are the API docs?",
    a: "In the API Docs page — link in the nav. It's protected: sign in with any workspace account to read the endpoint reference.",
  },
  {
    q: "What's the pricing?",
    a: "MVP is free during the demo phase. Once we open self-serve, pricing will scale by (a) tenant seats and (b) LLM token spend if you're on the Universal Key. Bring your own key to pay only your provider directly.",
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <MarketingLayout>
      <section className="px-6 md:px-16 pt-16 pb-16">
        <div className="font-mono text-xs uppercase text-primary tracking-widest mb-3">/// questions</div>
        <h1 className="font-display font-black text-5xl md:text-6xl leading-[0.95] max-w-3xl">Fair asks.</h1>
        <p className="text-muted-foreground max-w-2xl mt-6 text-lg leading-relaxed">
          If your question isn't here, sign in and just ask the assistant — it knows the docs too.
        </p>
      </section>

      <section className="px-6 md:px-16 pb-24 max-w-3xl">
        <div className="border border-border divide-y divide-border">
          {FAQS.map((f, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary/5 transition-colors"
                  data-testid={`faq-q-${i}`}
                >
                  <span className="font-display font-bold text-lg pr-6">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed" data-testid={`faq-a-${i}`}>
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </MarketingLayout>
  );
}
