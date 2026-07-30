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

## Update — Session 12 (Jan 2026) — Add-on Services flow (public + admin)
### Backend
- `POST /api/public/services-estimate` — public estimate request (email + note + services[]) → stored in `services_estimates`
- `GET /api/services/mine` — returns current company's services
- `PUT /api/services/mine` — admin updates services (list of add-on keys) on company doc
- `POST /api/services/checkout` — super_admin records a pending payment order in `service_orders`

### Frontend
- Extracted shared `AddOnPicker` component (8 services: seats, byok, slack, sso, priority, whitelabel, retention, audit) with live monthly + one-time totals
- New public `/services` page — hero, full-page picker, "Estimate will be sent soon" form with email + note (POST to /public/services-estimate), "Already a customer?" CTA linking to `/login?next=/app/services`
- Marketing nav adds **Services** link
- Admin sidebar adds **Services** link (Package icon) between Analytics and Settings
- New `/app/services` page — picker + sticky total bar (Monthly $ · One-time $ · N selected) + Save picks / Proceed to payment
- New `/app/services/checkout` page — line-item review, monthly total, Stripe-placeholder Confirm-order flow; success shows "Order recorded" and redirects back
- Verified end-to-end via curl: estimate saved, PUT/GET services persist, POST checkout returns `order_id + status='pending_payment'`

## Update — Session 13 (Jan 2026) — Interactive hero + Premium fill
- ✅ **MdToChat** component fills the previously empty space between "In markdown" and the three pillars — side-by-side visual with an animated `.md` source editor (left) and the resulting scoped chat answer (right), connected by a pulsing Company/OS bridge with a plug-and-play label. Scroll-reveals with staggered x-axis motion.
- ✅ **HeroDemo made interactive** — 3D cursor-parallax tilt (rotateX/Y springs) as user hovers; a "TRY IT LIVE" pill appears on hover with a play icon; clicking finds the real chat widget on the page and highlights + opens it (for authed users on the dashboard) or bounces to `/login?next=/app` for anon visitors. Hovering pauses the auto-loop so the user can inspect the frame.

## Update — Session 14 (Jan 2026) — Rich Analytics + Tighter Copy
### Analytics revamp
- 6 KPI cards: Messages · Cache hits · Hit rate · Users · Avg tokens/msg · Escalations (auto-highlight in orange when >0)
- New charts: **Cache hit-vs-miss donut**, **14-day query-volume area chart** (gradient fill), **Quota utilization horizontal bar** (used vs remaining per agent, with empty-state deep-link to Users)
- New **Live escalations** card — big count + sub-metrics (Urgent tasks overdue · Hot leads untouched 48h+) + "most recent" list
- Top prompts table gets right-aligned numeric columns + tokens formatted with `.toLocaleString()`

### Copy
- Landing demo section retitled from "Not a screenshot / A live walkthrough" → **"Live product tour / Watch it work in real environments."**
- Subheads: "Inside a customer's CRM." → **"Dropped into any CRM. One floating widget — the rest of your team's workflow doesn't move an inch."**
- "The admin console." → **"One console for the whole team. Monitor spend, set per-agent quotas, and feed the bot new context — without leaving this screen."**

## Update — Session 15 (Jan 2026) — Public Playground
- ✅ **Backend `POST /api/public/playground`** — unauthenticated endpoint that impersonates the seeded demo agent Alice (3 leads / 3 tasks), builds a normal system prompt, and streams back a Claude Sonnet 4.6 answer. IP-based rate limit of 15 msgs/hr enforced via `db.playground_logs`. Returns `{answer, session_id, remaining}`.
- ✅ **`PlaygroundWidget` on marketing pages** — mounted inside `MarketingLayout` so it appears on every public page. Bottom-right orange FAB "Try it live" → glass panel with 3 suggestion prompts, real markdown-rendered replies, live "N left this hour" counter, seeded-data disclaimer. Verified: sending "What urgent tasks?" returned a scoped answer citing `task-01 · Northwind Traders (lead-01)`.


## Update — Session 16 (Feb 2026) — Personal Info + Playground CTA
- ✅ **Footer socials swapped** in `MarketingLayout` from placeholders to real handles: Mail (tylordyron@gmail.com), GitHub (github.com/Deonkar), LinkedIn (in.linkedin.com/in/onkardeokate), Blog (dev.to/onkardeokate) — icon-only row using lucide `Mail/Github/Linkedin/BookOpen`. Copyright line now reads `COMPANY/OS © 2026 · built by Onkar Deokate`.
- ✅ **About page** — one-liner personalized to "I'm Onkar Deokate, the founder…", CTA email now `mailto:tylordyron@gmail.com`, 4-icon social grid at bottom (Email/LinkedIn/GitHub/Blog), Snapshot founder = Onkar Deokate.
- ✅ **Contact page** — email item now shows `tylordyron@gmail.com`; added a `/// or find me on` row with GitHub/LinkedIn/Blog icons. Contact submissions continue to be stored in `db.contact_submissions` (kept as MOCK — no real email is sent yet; Resend API key still not provided by user).
- ✅ **Playground CTA overlay** — `PlaygroundWidget` now shows a subtle orange-tinted banner "Impressed? Get your own scoped agent in 2 min." with a `REGISTER →` link to `/register` and an X dismiss button. It appears only after the FIRST successful assistant reply (`messages.some(m => m.role==='assistant' && !m.error)`) and stays hidden thereafter if dismissed. Verified via Playwright: banner rendered after suggestion-triggered reply.

### Backlog / Next
- Real Resend integration for contact form (blocked on API key)
- Real Stripe checkout (currently UI-only order flow)
- `server.py` split into routers (approaching 1000 lines)


## Update — Session 17 (Feb 2026) — Internal Panel Overhaul (Overview + Context Tree + Filters)
### Overview page redesigned (was vague 3-card layout)
- New `GET /api/overview` — aggregates KPIs, "attention" feed, pipeline funnel, priority mix, personal quota, recent chat activity in one call, scoped per-user
- Personalized greeting + 5 KPI cards: Open tasks · Overdue · Urgent · Hot leads · My quota % (with live progress bar and orange when >90%)
- **Needs your attention** feed merges: escalated tasks + overdue tasks + hot leads gone cold (>48h no touch); links straight to CRM/Tasks
- **My pipeline** funnel — leads per stage (new/qualified/proposal/negotiation/hot/closed) with animated bars + task priority mix badges
- **Recent activity** timeline — last 6 assistant chats with `cached` badges; **Quick asks** panel dispatches `cos:ask-assistant` custom event

### Context tree with include/exclude toggle (post-ingest visibility + token savings)
- New Mongo collection `context_trees` — persisted alongside auto-ingested docs; stores `tree` (nested `{name, path, size, kind, children}`), `file_count`, `total_chars`
- `POST /api/context/ingest` now builds & upserts the tree using new `_build_tree()` helper, stamps `repo_name` + `included=True` on each generated doc
- `GET /api/context/trees` returns each repo + its 3 auto-docs with `chars` + `included` so the UI can render live counters
- `PATCH /api/context/{doc_id}/toggle` flips a doc's `included` flag; `build_system_prompt` skips `included=False` docs → real token savings on every chat
- Frontend `<ContextTree>` component (in `/app/frontend/src/components/ContextTree.jsx`) — repo header + system-prompt weight (`≈ N tokens`) + "−X tokens saved" indicator; per-doc toggle chip (INCLUDED/EXCLUDED with strike-through); expandable file tree with folder chevrons, sizes, and file counts
- **Recursive-JSX babel bug worked around** by flattening the tree into an iterative flat list (`flattenTree` + `<TreeRow>`) — recursive components were triggering babel-loader infinite traversal
- Seeded demo tree `acme-crm-app` (18 files across backend/frontend/docs) + 3 auto-docs (Architecture / Schema / Module Map) available on every fresh seed via idempotent `_seed_demo_tree()`

### Backend-driven filters (Analytics + CRM)
- `GET /api/leads?status=&priority=&assigned_to=&escalated=&q=` — DB-side filtering + escalation computed in Python
- `GET /api/tasks?status=&priority=&assigned_to=&lead_id=&due_before=&overdue=&q=` — same pattern with overdue/text-search
- `GET /api/analytics/overview?range=7d|14d|30d|all&user_id=` — scopes all aggregates + time-series to the range/user; response echoes `filters`
- New reusable `<FilterBar>` component (chip-style, kebab-case testids `filter-<key>-<value>`, `filter-clear-all`)
- **CRM.jsx** — refactored to `useSearchParams` so filter state is URL-persistable (`/app/crm?status=hot`); 4 chip filters for leads, 4 for tasks
- **Analytics.jsx** — filter bar with Range (7d/14d/30d/all) + User (per non-admin user); re-queries backend on every change

### Endpoints touched
| Endpoint | Change |
|---|---|
| `GET /api/overview` | NEW — aggregated personal dashboard |
| `GET /api/context/trees` | NEW — list ingested repo trees + docs |
| `PATCH /api/context/{id}/toggle` | NEW — include/exclude a context doc from the LLM prompt |
| `GET /api/leads` | now accepts status/priority/assigned_to/escalated/q |
| `GET /api/tasks` | now accepts status/priority/assigned_to/lead_id/due_before/overdue/q |
| `GET /api/analytics/overview` | now accepts range/user_id |
| `POST /api/context/ingest` | also persists file tree + repo_name + included flag on docs |

### Verified via Playwright
- Overview renders with 5 KPIs + attention feed (4 items) + pipeline (1 New / 2 Hot) + activity (6 cached chats) — no console errors
- Context tree shows `acme-crm-app` (18 files, ≈ 68 tokens after excluding Schema + Module Map, saved 312 tokens) — toggling Architecture live-updated the counter
- CRM `?status=hot` returned 2 leads, HOT chip highlighted, "clear (1)" visible
- Analytics `range=7d` chip filters to 19 msgs / 53% hit-rate / 3 escalations, backend query params confirmed

### Backlog / Next
- Real Resend integration for contact form (blocked on API key)
- Real Stripe checkout (currently UI-only order flow)
- `server.py` split into routers (approaching 1500 lines now)
- Cmd+K command palette (next high-ROI power-user feature)
