# Architecture

## Overview

Monorepo with two web-facing applications: a Next.js 16 portfolio (primary production) and a Flutter desktop/mobile companion.

---

## Web App — Next.js 16 App Router

### Route Groups

| Group | Path | Purpose |
|-------|------|---------|
| `(app)` | `/` | Public site routes + co-located API routes |
| `(payload)` | `/admin` | Payload CMS admin UI + REST + GraphQL API |

### RAG Pipeline

```
Knowledge Base (static array + Payload collections)
    ↓
Qdrant Vector DB (1536-dim, cosine similarity)
    ↓
Cohere rerank-v3.5
    ↓
LLM context window (Groq via AI Gateway)
```

### AI Chat Architecture

- `streamText` from Vercel AI SDK drives the chat flow
- Dynamic tool selection at runtime:
  - `retrieveKnowledgeTool` → Qdrant + Cohere embeddings
  - `tavilySearchTool` → Web search fallback
  - `createArtifactTool` → Streamdown progressive markdown
- Rate limiting via Upstash Redis with circuit breaker pattern

### Server / Client Boundaries

- `serverExternalPackages` in `next.config.ts` excludes heavy server-only packages from client bundles
- Server utilities live in `web/src/server/lib/chat/` and `web/src/server/lib/rag/`
- Client components in `web/src/components/`
- Shared utilities in `web/src/lib/` (includes Payload API client)

### Payload CMS 3

- Admin UI + REST + GraphQL API exposed at `/admin`
- Collection definitions in `web/collections/`
- Dual access pattern: direct `getPayload()` calls in both `payload-api.ts` and route handlers

---

## Flutter App

- Desktop (macOS/Win/Linux) + mobile companion
- Communicates via SSE to `/api/chat/native`
- State management: `flutter_riverpod`
- Desktop features via `window_manager`, `tray_manager`, `hotkey_manager`

---

## Anti-patterns / Debt

- **Dual Payload access**: `getPayload()` called directly in route handlers AND via `payload-api.ts` — inconsistent initialization
- **Knowledge base duplication**: 1600-line static array in `knowledge-base.ts` separate from Payload collections — two sources of truth for the same data