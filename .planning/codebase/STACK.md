# Technology Stack

**Generated:** 2026-05-25 | **Languages:** TypeScript 6.0.3 (primary), CSS via Tailwind v4 (secondary) | **Runtime:** Node.js (Next.js 16.2.6), Bun package manager

---

## Core Frameworks

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.6 | React 19.2.6, App Router, RSC, streaming |
| `@payloadcms/db-mongodb` | — | MongoDB adapter for Payload |
| `payload` | 3.84.1 | CMS: MongoDB, plugins (search, redirects, seo, mcp, storage-s3, email-nodemailer) |
| `react` | 19.2.6 | UI library |
| `react-dom` | 19.2.6 | React DOM rendering |

---

## AI / LLM Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` (Vercel AI SDK) | 6.0.138 | Streaming, tool calls, model routing |
| `@ai-sdk/groq` | — | Primary LLM provider |
| `@ai-sdk/cohere` | — | Reranking via AI Gateway |
| `@ai-sdk/mistral` | — | Vision model |
| `@ai-sdk/gateway` | — | Unified API gateway |
| `@elevenlabs/elevenlabs-js` | 2.47.0 | Voice agent SDK |
| `@elevenlabs/react` | 1.6.0 | React voice components |

**Models:**
- `groq/gpt-oss-120b` — primary
- `cerebras/qwen-3-235b` — fallback
- `mistral/pixtral-large` — vision

---

## Data Layer

| Package | Version | Purpose |
|---------|---------|---------|
| `mongoose` | 9.6.2 | MongoDB ODM |
| `qdrant` | 1.17.0 | Vector search (1536-dim, cosine) |
| `@upstash/redis` | 1.37.0 | Cache + rate limiting |
| `@upstash/ratelimit` | 2.0.8 | Rate limit middleware |

---

## Storage

| Package | Purpose |
|---------|---------|
| `@aws-sdk/client-s3` 3.1045.0 | S3-compatible storage |
| `@payloadcms/storage-s3` | Cloudflare R2 integration |
| `@payloadcms/storage-vercel-blob` | Vercel Blob storage |

---

## UI / Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | 4.1.18 | CSS framework |
| `@radix-ui/react-*` | various | Headless UI primitives |
| `class-variance-authority` | 0.7.1 | Variant utilities |
| `lucide-react` | 0.562.0 | Icons |
| `sonner` | 2.0.7 | Toast notifications |
| `@base-ui-components/react` | 1.3.0 | Base UI component library |
| `vaul` | — | Drawer component |
| `embla-carousel-react` | — | Carousel |
| `use-stick-to-bottom` | — | Chat scroll behavior |
| `sonner` | 2.0.7 | Toasts |

---

## Markdown / Code

| Package | Purpose |
|---------|---------|
| `react-markdown` | Markdown rendering |
| `remark-gfm`, `remark-math` | GFM + math support |
| `rehype-katex`, `rehype-raw` | KaTeX + raw HTML |
| `shiki` | Syntax highlighting (github-light / github-dark) |
| `streamdown` | Progressive blurIn markdown with code/math/mermaid plugins |
| `mermaid` | Diagram rendering |

---

## Build / Config

| File | Purpose |
|------|---------|
| `web/next.config.ts` | Next.js configuration |
| `web/payload.config.ts` | Payload CMS configuration |
| `web/tsconfig.json` | TypeScript aliases (`@/*` → `src/*`) |
| `web/biome.json` | Biome linter/formatter |
| `bun.lockb` | Bun lockfile |

---

## Environment

- **Package manager:** Bun (not npm/yarn)
- **Deployment:** Vercel (Fluid Compute)
- **Node.js:** via Next.js runtime