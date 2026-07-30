# Company/OS — Multi-tenant Plug-and-Play Chatbot SaaS

## Original Problem Statement
Build a plug-and-play chatbot (like an in-website chat bubble) any company can embed. Devs/PMs feed it .md context files. It answers CRM agent questions ("Which of my leads is urgent today?", "Why did I get an escalation?") with STRICT per-user access control (Agent A only sees their own leads). Admin dashboard: most-used prompts, tokens/user, block/unblock, manage LLM keys. Prompt caching. Multi-tenant SaaS.

## Stack
- Backend: FastAPI (Python) + Motor (MongoDB async) + PyJWT + bcrypt + emergentintegrations
- Frontend: React 19 + Tailwind + Recharts + lucide-react + react-router-dom
- LLM: Claude Sonnet 4.6 via Emergent Universal LLM Key (configurable per tenant)

## User Personas
- **Super Admin** — tenant owner. Full access + LLM/API key mgmt.
- **Admin** — manages users, content, CRM, sees analytics.
- **Agent** — sees only their own leads/tasks; uses chatbot.

## Core Requirements (static)
1. Multi-tenant with company isolation (company_id on every doc)
2. JWT auth + RBAC (super_admin / admin / agent)
3. Embeddable floating chat widget (Glassmorphism)
4. .md context docs → build LLM system prompt
5. Per-user CRM scoping enforced BOTH in API and system prompt
6. Prompt cache (1h TTL) keyed by (company, user/role, message)
7. Analytics: tokens/user, top prompts, cache-hit rate, 14d time-series
8. Sharp-edged dark Swiss/Brutalist UI (Cabinet Grotesk + IBM Plex + JetBrains Mono, Signal Orange accent)

## Implemented (Jan 2026)
- ✅ Auth: register/login/me + JWT (7d) — verified
- ✅ Users mgmt: list/invite/block/unblock (admin) — verified
- ✅ Context docs CRUD (admin) — verified
- ✅ CRM leads + tasks with agent-scoped queries — verified
- ✅ /api/chat with Claude Sonnet 4.6, per-user RBAC via system prompt, prompt cache — verified (no cross-agent data leakage)
- ✅ Analytics aggregation (per_user tokens, top_prompts, time_series, cache-hit rate) — verified
- ✅ Company settings (provider/model/key override, super_admin only) — verified
- ✅ Landing / login / register / dashboard shell / all admin pages — verified
- ✅ Chatbot widget (floating, glass, suggestions, token counter) — verified
- ✅ Seeded demo tenant with 3 users, 3 context docs, 5 leads, 5 tasks

## Testing Status
Iteration 1: 100% pass on backend + frontend + integration (see /app/test_reports/iteration_1.json).

## Backlog (P1/P2)
- P1: Real streaming LLM responses (SSE) — currently non-streaming
- P1: Task-done toggle full-flow test (backend endpoint exists)
- P1: Register a brand-new tenant and verify empty context/data works
- P2: Password reset flow
- P2: Public embeddable widget snippet (`<script src=".../widget.js" data-token=...>`)
- P2: Uploaded .md file (drop-zone) — currently paste-in-textarea only
- P2: Real (not heuristic) token count from LLM response metadata
- P2: Server-side pagination on leads/tasks tables

## Next Tasks
1. Add SSE streaming for chat responses
2. Ship real embeddable widget script + iframe
3. Add password reset + email verification

## Update — Session 2 (Jan 2026)
- ✅ **Drag-drop .md upload** — `/api/context/upload` (multipart) + drop zone + click-to-select; auto-tags kind by filename
- ✅ **Escalation Alerts** — `/api/escalations` scoped by role; red banner on Overview polling every 60s; Slack webhook ping (deduped per task/day)
- ✅ **Codebase auto-ingest** — `/api/context/ingest` accepts folder tree + file contents; LLM synthesizes 3 docs (Architecture / Schema / Module Map), upserted by title, marked `auto-ingest`
- ✅ Settings extended with Slack webhook URL field
- Verified via curl: escalation returned 4 items, upload created 1 doc, ingest generated 3 docs for a tiny FastAPI sample

## Backlog (Updated)
- P1: SSE streaming for chat responses
- P1: Embeddable widget snippet (`<script src=".../widget.js" ...>`)
- P2: Node/CLI companion (`companyos-cli ingest ./`) so a real codebase is walked from a build step
- P2: Password reset + email verification
- P2: Real (not heuristic) token counts from LLM metadata

## Update — Session 3 (Jan 2026) — UI/UX Polish
- ✅ **Cursor-follower glow** — CursorGlow component with delayed inertia (radial gradient trail + mix-blend dot)
- ✅ **Chat widget V2** — Framer Motion in/out animations, markdown rendering (react-markdown + remark-gfm), textarea with Enter/Shift+Enter, copy button per message, cache/token badge, new-chat button, empty-state suggestions with icons, responsive full-screen on mobile
- ✅ **Landing V2** — Hero with staggered motion, marquee tech strip, "3 moves" how-it-works, bento feature grid, use cases, stack tiles, FAQ, big CTA card
- ✅ **Reusable components** — Badge, StatCard, PageHeader, CursorGlow (composed under /components/ui and /components)
- ✅ **Responsive dashboard** — mobile top bar + slide-in drawer (framer-motion), tables scroll horizontally, chat widget goes full-width on <md
- ✅ Added markdown styling (.chat-md) for bold/lists/code/headings/tables/blockquotes/hr with brand color
- Deps added: `react-markdown`, `remark-gfm`

## Update — Session 4 (Jan 2026) — Voice Input
- ✅ **Mic button in chat widget** — click to start/stop; MediaRecorder captures audio/webm; posted as multipart to `/api/voice/transcribe`; transcribed text auto-fills input AND auto-sends
- ✅ **Backend `/api/voice/transcribe`** — Whisper-1 via `OpenAISpeechToText` from emergentintegrations; 25MB cap; JWT-protected
- ✅ Live "Recording... tap mic to stop" status with pulsing red dot; "Transcribing..." indicator; graceful mic-permission errors
- ✅ Footer updated to "Claude Sonnet 4.6 · Whisper"

## Update — Session 5 (Jan 2026) — Live Landing Demos
- ✅ **CRMDemo** component — self-playing animated reel showing a fake CRM (leads table with 5 rows) + chat widget bubble → widget opens → user question typewriter → assistant markdown reveal line-by-line → loops every ~12s
- ✅ **AdminDemo** component — fake admin console with sidebar + auto-cycling tabs (Analytics with animated token bars → Users with block/unblock rows → Context with drop-zone + doc cards)
- ✅ **BrowserFrame** reusable component (traffic lights + URL bar + live indicator)
- ✅ Added "Demo" nav link and a "See it running" landing section between How-it-works and the bento grid
- Pure CSS/Framer Motion (no video files), zero bandwidth cost

## Update — Session 6 (Jan 2026) — Marketing Split + Protected API Docs + Logo
- ✅ **New pages** — `/how` (in-depth 3-step walkthrough + 4-system detail), `/stack` (grouped Backend / AI+Voice / Frontend / Infra tiles), `/faq` (accordion), `/reference` (API docs)
- ✅ **`/reference` is auth-protected** — anonymous → `/login?next=/reference`; supports `?next=` redirect after login
- ✅ **Reusable `MarketingLayout`** with unified nav (with active-route hint), CTA buttons, mobile drawer, footer
- ✅ **SVG Logo** component (mark + wordmark variants) used in nav, mobile drawers, dashboard sidebar, login/register pages, and as inline SVG favicon
- ✅ Landing trimmed to hero + marquee + bento + live demos + CTA (heavier content moved to dedicated pages)
- ✅ Renamed API docs route from `/api-docs` → `/reference` (avoids ingress `/api*` → backend collision)
- ✅ Page `<title>` updated to "Company/OS — the chatbot that knows your business"

## Update — Session 7 (Jan 2026) — Quotas + Redesigned Demos + Resizable Chat
### Product
- ✅ **Per-user token quotas** — `token_limit` + `token_used` on user docs; `/api/chat` enforces 429 when cap exceeded; `PATCH /api/users/{id}/limit`, `POST /api/users/{id}/reset-usage` (admin only)
- ✅ **Users page redesigned** — heading now "Team & token quotas", per-row progress bar (green/orange/red), Set limit / Reset / Block actions, modal with preset chips (∞, 5k, 10k, 25k, 50k)
- ✅ **Admin sidebar cleaned** — "My Tasks" hidden for admins/super_admins (only agents see their tasks)

### Landing UX
- ✅ **CRMDemo v2** — now a light-theme "SalesHub" generic CRM so Company/OS clearly reads as a plug-in overlay; side narration column with 4 synchronized steps
- ✅ **AdminDemo v2** — sidebar has no "My Tasks"; 3-tab cycle Analytics → Users & Quotas → Context; quotas panel shows real progress bars with "over cap" state; analytics shows top prompts frequency
- ✅ **Distracting marquee killed** — replaced with a static "by-the-numbers" strip (install time / data leakage / cache-hit rate / auto docs)
- ✅ **Hero right panel upgraded** — ambient orange glow, live indicator, "PLUG-IN READY" tag, 4-col stat strip (resp / in / out / cache)

### Chat widget
- ✅ **Resizable panel** — grip handle top-left corner, drag to resize (min 320×420, max 720×900), size persisted to localStorage

## Update — Session 8 (Jan 2026) — About / Contact / Pricing + Theme + Bug Fix
### Bug fix (verified by testing agent — iteration_2)
- ✅ **Cursor artifact removed** — `CursorGlow.jsx` no longer renders the mix-blend-difference 8×8 dot. Only the ambient radial-gradient trails the cursor.

### New pages (public marketing)
- ✅ `/about` — founder bio, snapshot, socials, "Why this exists" narrative (**PLACEHOLDER** personal info — user to edit)
- ✅ `/contact` — full form (name/email/company/message) → `POST /api/public/contact` → stored in `contact_submissions`
- ✅ `/pricing` — coming-soon page with waitlist email capture (`POST /api/public/waitlist`) and 3-tier preview cards

### Backend
- ✅ `POST /api/public/contact` and `POST /api/public/waitlist` (unauthenticated)
- ✅ `GET /api/admin/contact` and `GET /api/admin/waitlist` (admin only)
- ✅ `maybe_monthly_reset()` runs on every /api/chat — zeros `token_used` when calendar month rolls; stores `token_reset_month = YYYY-MM`
- ✅ `maybe_quota_alert()` fires a Slack ping (once per month) when a user crosses 80% of their `token_limit`; sets `quota_alert_sent`

### Theme
- ✅ `ThemeProvider` context + `ThemeToggle` (sun/moon) — light/dark modes with CSS variables via `[data-theme]`
- ✅ Toggle placed in marketing nav (desktop + mobile), dashboard sidebar, and chat widget header
- ✅ Preference persisted to `localStorage.cos_theme`

### Polish
- ✅ CTAs renamed: "Start free" / "Create your workspace" → "Register now" across landing, About, How
- ✅ PLUG-IN READY tag now animated (framer spring + pulsing dot) and z-20; visible on both themes
- ✅ Footer rebuilt — 4-column grid (Product / Developers / Company + brand block with socials)
- ✅ `.btn-primary`, `.btn-ghost`, `.input-tech`, `.side-item` refactored to use CSS variables (proper light-mode contrast)
- ✅ "By the numbers" strip uses `bg-muted/40` + `text-foreground` (theme-aware)

## Update — Session 9 (Jan 2026) — Apple-Style Landing + Light-Mode Contrast Fix
### Bug fix (testing agent iteration_3 — 100% pass)
- ✅ **Light-mode readability** — added `.demo-dark` class in `index.css` that pins CSS vars to dark values regardless of parent theme. Demo panels + ProductMoment + narration columns now render as a dark island in light mode (WCAG-AA contrast confirmed).

### Landing rewrite — Apple composition
- ✅ Huge centered hero (< text-9xl) with one eyebrow, one headline, one subhead, two CTAs
- ✅ **ProductMoment** — the chat panel alone, floating with ambient glow + PLUG-IN READY tag + stat strip. No side content — product speaks for itself
- ✅ Numbers strip: 4 giant standalone stats, no boxes, no borders — pure whitespace
- ✅ Three pillars section (Contextual / Scoped / Plug-and-play) with a tiny orange bar above each — restraint on eyebrows
- ✅ Demo section is a self-contained "dark island" — CRM + Admin reels with narration
- ✅ **Silent closer** — massive centered "Your CRM is loud. Make it answer back." with credentials line
- ✅ py-32/py-40 vertical padding between sections (double the earlier density)

## Update — Session 10 (Jan 2026) — Light-Mode Chat Fix + Hero Video Demo
### Bug fix (testing agent iteration_4 — 100% pass)
- ✅ **Chat widget broken in light mode** resolved — rewrote `.chat-glass` to use `hsl(var(--card))` + `hsl(var(--border))` theme vars; `[data-theme='dark']` override restores translucent glass in dark mode. Removed every `bg-black/*`, `text-white`, `border-white/10`, `bg-white/*` hardcoded class from `ChatWidget.jsx` and replaced with `bg-muted`, `text-foreground`, `border-border`, `bg-background`, `text-muted-foreground`. All chat text now WCAG-AA readable in both themes.

### New "hero video"
- ✅ **HeroDemo** component replaces the static terminal on the landing hero — a self-playing looping animation of a fake SalesHub CRM (blue/white light theme) with the Company/OS chat plug-in bubbling in, receiving a user question that types out character-by-character, then streaming an assistant answer that references `task-01` / `Northwind Traders`. Loops every ~11 seconds. PLUG-IN READY tag pinned top-right.

## Update — Session 11 (Jan 2026) — Demo section respects theme + Pricing add-ons + Scroll reveals
### Fixed
- ✅ **Demo section respects light mode** — removed `.demo-dark` from the outer `<section id="demo">`; wrapped only the `BrowserFrame` internals in `.demo-dark` so the browser mocks stay dark while the surrounding section (headings, narration columns) inherit the site theme. Narration text switched from `text-white` → `text-foreground` for readability in light mode.

### Added
- ✅ **Scroll-reveal animations** across Landing (numbers, pillars, demos, closer, "One line one idea") — `framer-motion.whileInView` fade-slide-up with `viewport={{ once: true, margin: '-100px' }}` and staggered delays
- ✅ **"Register now" → `/pricing`** (waitlist gate) — CTAs no longer expose the /register flow directly; nav "Get access" still points to /register for direct access
- ✅ **Pricing add-on services** — new "Add just what you need" section on `/pricing` with 8 selectable services (Extra seats · BYO LLM key · Slack alerts · SSO/SCIM · Priority onboarding · White-label · Custom retention · Advanced audit log); each with monthly price + description. Selection state highlights in orange, counter shows "N add-ons selected", Clear-all button. Localstate for now — will sync to backend once payments are wired.
