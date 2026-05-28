# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on http://localhost:3001
npm run build      # Production build
npm run lint       # ESLint (errors are ignored during builds per next.config.js)
npm run typecheck  # TypeScript type checking (tsc --noEmit)
```

There is no test suite. `typecheck` is the primary static-analysis gate.

## Architecture

**DragonChat AI** is a Next.js 13 App Router SaaS product that lets small businesses configure and embed an AI chatbot widget on their websites.

### Data persistence: localStorage only

There is no database. All user data lives in `localStorage` via `lib/storage.ts`, which exposes a typed `storage` object with namespaced keys (`dc_auth`, `dc_branding`, `dc_config`, `dc_leads`, `dc_conversations`). Every page reads/writes through this module. On the server side (SSR), `storage` safely returns fallback values because it guards with `typeof window === 'undefined'`.

The `--brand` CSS variable is applied dynamically at runtime when branding is loaded. See `applyBrandColor()` in `lib/storage.ts` and the `useEffect` in `app/layout.tsx`.

### Authentication: simulated

Login (`app/login/page.tsx`) accepts any email + password (6+ chars) and writes an `AuthData` record to localStorage. There is no real credential check. The root page (`app/page.tsx`) redirects based on localStorage state:
- No auth → `/login`
- Auth but no branding → `/onboarding`
- Both set → `/dashboard`

### App flow

```
/  →  /login  →  /onboarding (3-step wizard)  →  /dashboard
                                                      ├── /dashboard/preview     (live chat test)
                                                      ├── /dashboard/configure   (bot settings, FAQs)
                                                      ├── /dashboard/leads       (captured leads CRM)
                                                      ├── /dashboard/embed       (embed snippet)
                                                      └── /settings              (branding)
```

`app/dashboard/layout.tsx` wraps all dashboard routes with a fixed sidebar and performs its own auth guard on every route change.

### API routes

`app/api/chat/route.ts` — handles messages from both the dashboard preview and the embeddable widget. If `ANTHROPIC_API_KEY` is missing or contains `REPLACE`, it falls back to a keyword-matching rule engine instead of calling Claude. The Anthropic model used is `claude-sonnet-4-20250514`.

`app/api/suggest/route.ts` — called from the Configure page's "AI suggest" button to auto-generate FAQ answers. Same fallback pattern.

Both routes set `Access-Control-Allow-Origin: *` because the embeddable widget makes cross-origin requests.

### Embeddable widget

`public/dragonchat.js` is a self-contained vanilla JS script that customers paste into their website's `<body>`. It accepts configuration via `data-*` attributes on the `<script>` tag and POSTs to `https://app.drekisolutions.com/api/chat`. The Embed page (`dashboard/embed`) generates the snippet with values from the user's `ConfigData`.

### Design system

All styling uses custom CSS variables defined in `app/globals.css` (not Tailwind design tokens). Key tokens:

| Variable | Purpose |
|---|---|
| `--brand` | Primary accent color (user-configurable) |
| `--bg` | Page background (`#0F0F0F`) |
| `--card` | Card surface (`#1E1E1E`) |
| `--surface` | Secondary surface (`#161616`) |
| `--border` | Border color (`#272727`) |
| `--text` | Primary text (`#F0EDE8`) |
| `--muted` | Secondary text (`#7A7A7A`) |

Typography: **Cinzel** (serif, display headings) and **Inter** (body). Apply Cinzel via the `.font-cinzel` utility class, not Tailwind's font utilities. All form elements are globally styled in `globals.css` — do not use shadcn form components for inputs; use plain `<input>` elements with the global styles applied automatically.

`components/ui/` contains shadcn/ui components but they are largely unused in the main app. The app prefers inline styles and global CSS classes over Tailwind utility classes.

### Environment variables

Create a `.env` file at the repo root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without this, both API routes return rule-based fallback responses (fully functional for demo purposes).

### Deployment

Configured for Netlify (`@netlify/plugin-nextjs`) and Vercel. Production domain is `app.drekisolutions.com`. ESLint errors are suppressed during builds (`eslint.ignoreDuringBuilds: true` in `next.config.js`); use `npm run lint` and `npm run typecheck` locally instead.
