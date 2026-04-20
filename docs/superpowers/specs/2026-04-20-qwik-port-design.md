# Qwik Full Port — Design Specification

**Date:** 2026-04-20
**Status:** Draft

---

## 1. Overview

A 1:1 feature-port of the existing Next.js portfolio site (`web/`) into pure Qwik, targeting full parity across all public routes, API endpoints, chat, and contact functionality. The Qwik port uses idiomatic Qwik patterns throughout and replaces React-specific infrastructure with Qwik-native equivalents.

**Not in scope for this spec:** Astro+Qwik hybrid (fully native Qwik only).

---

## 2. Architecture Decisions

### 2.1 Framework & Routing

- **Qwik City** (file-based routing, same structure as Next.js App Router)
- Routes: `/`, `/about`, `/work`, `/work/[slug]`, `/blog`, `/blog/[slug]`
- Qwik City middleware for multi-tenant domain handling (same `x-tenant-domain` header pattern)
- Static generation (`prerender`) for work detail and blog post pages

### 2.2 State Management

**Native Qwik `useStore` / `useSignal`** throughout — no external state library.

| Use Case | Qwik Pattern |
|----------|-------------|
| Local component state | `useSignal<T>` |
| Complex shared state (chat messages, UI state) | `useStore<T>()` |
| Cross-component state (theme, contact dialog open) | `useContextProvider` + `useContext` |
| Derived/computed state | `useComputed$` |

### 2.3 API Layer — REST over tRPC

**Drop tRPC entirely.** Replace with Qwik City `routeAction$` and `routeLoader$` for internal APIs, and `server$()` for typed server functions.

| Next.js tRPC Procedure | Qwik City Replacement |
|------------------------|---------------------|
| `contact.submit` (mutation) | `routeAction$` in `/api/contact` |
| `content.getBlogPosts` (query) | `routeLoader$` in blog layout/page |
| `content.getBlogPost` (query) | `routeLoader$` in `/blog/[slug]` |
| `content.getCategories` (query) | `routeLoader$` in blog layout |

No `fetchRequestHandler` adapter needed. No superjson transformer. Zod schemas validate both request and response independently.

### 2.4 AI Chat Widget — `qwikify$` Bridge

The React AI chat widget (`ChatWidget`) from the existing Astro+Qwik experiment is reused via `qwikify$`:

```tsx
import { qwikify$ } from '@builder.io/qwik-react'
import { ChatWidget as ReactChatWidget } from '~/components/chat-widget'

export const ChatWidget = qwikify$(ReactChatWidget, { eagerness: 'hover' })
```

The React widget receives Qwik signals/props. Chat streaming logic lives in a Qwik City endpoint (`/api/chat/stream`) that the React widget calls via fetch.

**Why this approach:** AI SDK is React-only. The `qwikify$` pattern is the documented Qwik-recommended approach for embedding React components. The chat widget is an island — its React runtime cost is isolated and acceptable.

### 2.5 RAG Chat Pipeline

- **Embeddings:** Hugging Face API via a `server$()` function (replaces `src/server/lib/rag/embeddings.ts`)
- **Vector Search:** Firebase Firestore (same as existing — `firebase-admin` works with Qwik server functions)
- **LLM:** Groq API called directly from `server$()` — replaces `/api/chat/stream` Next.js route

### 2.6 Contact Form

- `routeAction$` with Zod validation
- Google Sheets + Gmail integration (same as existing)
- Rate limiting via Upstash Redis (`@upstash/ratelimit`) — works identically in Qwik server functions

### 2.7 Rate Limiting

- Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) — same library, works in Qwik edge/node
- In-memory fallback for local dev without Redis

### 2.8 Payload CMS / Canvas SDK

- `@od-canvas/sdk` called from `routeLoader$` / `routeAction$` — same as existing pattern
- Server-side only — SDK not exposed to client

### 2.9 Styling & UI Components

- **Tailwind CSS 4** — same as existing (`tailwind-merge`, `clsx`, `CVA`)
- **shadcn-style UI components** — port all ~60 components from `src/components/ui/` to Qwik equivalents
  - Most are pure JSX (no hooks) — straightforward port
  - Components using React hooks (`useForm`, `useState`) become Qwik with `useSignal`/`useStore`
- **Framer Motion → Qwik animations** — Qwik's built-in animation utilities or `@builder.io/qwik` animations replace Framer Motion
- **next-themes → qwik-themes** or custom `useStore` theme toggle

### 2.10 Dependencies

| Purpose | Next.js Package | Qwik Replacement |
|---------|----------------|-----------------|
| AI SDK | `@ai-sdk/react`, `ai` | Direct Groq/Mistral API calls via `server$()` |
| tRPC | `@trpc/*` | N/A (REST) |
| State | `zustand` | Native Qwik `useStore` |
| Forms | `react-hook-form` | Qwik City `routeAction$` + Zod, or `@modular-forms/qwik` |
| Auth | Firebase Admin | Same (`firebase-admin`) |
| Email | `nodemailer` | Same |
| Sheets | `googleapis` | Same |
| RAG DB | Firebase Admin | Same |
| Rate Limit | `@upstash/ratelimit` | Same |
| Vector Embeddings | `@huggingface/api` | Direct HF API via fetch |

---

## 3. Directory Structure

```
qwik/                        # New Qwik app, sibling to web/
├── src/
│   ├── routes/
│   │   ├── index.tsx        # Homepage
│   │   ├── about/
│   │   │   └── index.tsx
│   │   ├── work/
│   │   │   ├── index.tsx
│   │   │   └── [slug]/
│   │   │       └── index.tsx
│   │   ├── blog/
│   │   │   ├── index.tsx
│   │   │   └── [slug]/
│   │   │       └── index.tsx
│   │   └── api/
│   │       ├── contact/
│   │       │   └── index.tsx   # routeAction$
│   │       ├── chat/
│   │       │   └── stream/
│   │       │       └── index.tsx  # server$ streaming
│   │       └── content/
│   │           └── posts/
│   │               └── index.tsx  # routeLoader$
│   ├── components/
│   │   ├── ui/               # ~60 ported UI components
│   │   ├── navigation.tsx
│   │   ├── footer.tsx
│   │   ├── project-card.tsx
│   │   ├── contact-dialog.tsx
│   │   └── chat-widget.tsx    # React island via qwikify$
│   ├── lib/
│   │   ├── projects.ts        # Same data
│   │   ├── payload-api.ts    # Same Canvas SDK wrapper
│   │   ├── rate-limit.ts     # Upstash wrapper
│   │   ├── embeddings.ts      # HF API
│   │   └── vector-search.ts  # Firebase
│   ├── context/
│   │   ├── theme.ts
│   │   └── chat.ts
│   └── root.tsx
├── public/
├── adapters/
├── vite.config.ts
└── package.json
```

---

## 4. Implementation Phases

### Phase 1: Project Shell + Route Skeleton
- Scaffold Qwik City project with `bun create qwik`
- Configure Vite, Tailwind, TypeScript
- Create all route files (empty components first)
- Verify routing works: `/`, `/about`, `/work`, `/work/[slug]`, `/blog`, `/blog/[slug]`

### Phase 2: UI Components (all ~60)
- Port shadcn-style components from `web/src/components/ui/` to Qwik
- Focus on pure components first (no hooks)
- Test each component in isolation

### Phase 3: Data Layer
- Port `lib/projects.ts` — static data, no changes needed
- Port `lib/payload-api.ts` — Canvas SDK calls
- Port `lib/knowledge-base.ts` — RAG documents
- Configure routeLoaders for blog/work data fetching

### Phase 4: API Endpoints
- Port contact form (`routeAction$` + Google Sheets + Gmail)
- Port chat stream (`server$` → Groq streaming)
- Port RAG pipeline (embeddings + vector search)
- Add rate limiting

### Phase 5: Chat Widget + React Islands
- Configure `qwikReact()` vite plugin
- Port `chat-widget.tsx` as React island via `qwikify$`
- Wire chat to Qwik API endpoints

### Phase 6: Polish + Integration
- Navigation + Footer
- Multi-tenant middleware
- SEO metadata (same as existing)
- Error pages, not-found pages
- Animations (Qwik-native or motion)

---

## 5. Open Questions

1. **Theme:** Next.js uses `next-themes`. Qwik equivalent — use native `useStore` or `@qwikdev/next-themes`? *(Unverified if @qwikdev/next-themes exists)*
2. **Framer Motion:** Replaced with Qwik animations. Which specific animations need porting — are there complex orchestration patterns?
3. **Deployment target:** Vercel (existing adapter)? Node.js? Edge? This affects adapter choice.
4. **Static generation:** `prerender` flag on work/[slug] and blog/[slug] — should Qwik port use full static or SSR?

---

## 6. Out of Scope

- Server-side Firebase authentication (not used in current app)
- WebSocket/SSE for real-time features (chat uses streaming POST/responses)
- Multi-language / i18n (not in current app)
