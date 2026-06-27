# System Architecture

> Comprehensive architecture documentation for Other Dev Next.js application

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Application Layers](#application-layers)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [Multi-Tenant System](#multi-tenant-system)
- [AI Gateway & Chat Routing](#ai-gateway--chat-routing)
- [RAG Chat System](#rag-chat-system)
- [Performance Optimizations](#performance-optimizations)

---

## Overview

Other Dev is a modern, full-stack web application built with Next.js 16.2.1, leveraging the App Router for file-based routing and React Server Components for optimal performance. The architecture is designed for scalability, type safety, and excellent developer experience.

### Core Principles

- **Type Safety First:** End-to-end TypeScript with Zod validation
- **AI-Native:** Vercel AI Gateway for unified model routing with automatic fallbacks
- **Performance:** Server Components, React Compiler, code splitting
- **Developer Experience:** Hot reload, auto-imports, full IntelliSense
- **Scalability:** Multi-tenant architecture, Qdrant vector search, Redis caching
- **Accessibility:** Radix UI primitives, ARIA compliance

---

## High-Level Architecture

```mermaid
graph TB
    %% ── Client Layer ───────────────────────────────────────────────────────────
    subgraph "Client Layer"
        Browser[Browser/Client]
        RSC[React Server Components]
        RCC[React Client Components]
    end

    %% ── Application Layer ────────────────────────────────────────────────────
    subgraph "Application Layer"
        NextJS[Next.js 16 App Router]
        APIRoutes[API Routes]
        ChatRuntime[Chat Runtime<br/>streamText + tools]
    end

    %% ── Data Layer ───────────────────────────────────────────────────────────
    subgraph "Data Layer"
        Payload[Payload CMS Canvas]
        Qdrant[Qdrant Vector DB]
        Upstash[Upstash Redis]
        Sheets[Google Sheets]
        Gmail[Gmail SMTP]
    end

    %% ── External Services ─────────────────────────────────────────────────────
    subgraph "AI Services"
        Gateway[Vercel AI Gateway<br/>Groq + Mistral + Cerebras]
        CohereEmbed[Cohere embed-v4.0<br/>via AI Gateway]
        CohereRerank[Cohere rerank-v4-fast<br/>via AI Gateway]
        Tavily[Tavily Search]
    end

    Browser --> NextJS
    Browser --> RSC
    Browser --> RCC

    RCC --> APIRoutes
    APIRoutes --> ChatRuntime

    ChatRuntime --> Gateway
    ChatRuntime --> CohereEmbed
    CohereEmbed --> Qdrant
    Qdrant --> CohereRerank
    CohereRerank -.->|context to model| Gateway

    ChatRuntime --> Tavily
    Tavily -.->|web results to model| Gateway

    APIRoutes --> Payload
    APIRoutes --> Sheets
    APIRoutes --> Gmail

    Gateway --> GroqGroq[Groq LLM]
    Gateway --> Mistral[Mistral LLM]

    style Browser fill:#e1f5ff
    style NextJS fill:#fff4e1
    style APIRoutes fill:#ffe1f5
    style ChatRuntime fill:#e1ffe4
    style Qdrant fill:#f5e1ff
    style Gateway fill:#ffe8cc
    style CohereEmbed fill:#e1ffe4
    style CohereRerank fill:#e1ffe4
```

---

## Application Layers

### 1. Presentation Layer

**Location:** `src/app/`, `src/components/`

#### Pages (App Router)

```
src/app/
├── layout.tsx                  # Root layout with providers
├── page.tsx                    # Homepage
├── about/page.tsx              # About page
├── work/
│   ├── page.tsx                # Work listing
│   └── [slug]/page.tsx         # Individual project page
├── blog/
│   ├── page.tsx                # Blog listing
│   └── [slug]/page.tsx         # Individual blog post
├── loom/page.tsx               # AI chat page (Loom)
└── api/                        # API routes
    ├── chat/stream/route.ts    # Streaming chat endpoint
    ├── contact/route.ts         # Contact form
    ├── transcribe/route.ts      # Audio transcription
    └── process-document/route.ts # PDF/image OCR
```

#### Components

```
src/components/
├── ui/                         # Radix UI primitives (~50 components)
├── navigation.tsx              # Header navigation
├── footer.tsx                  # Footer component
├── project-card.tsx           # Project display card
├── contact-dialog.tsx          # Contact form modal
├── chat-widget.tsx             # Floating chat button + panel
├── chat-core.tsx               # Shared chat logic (widget + Loom page)
├── artifact-renderer.tsx        # Renders HTML/CSS/JS artifacts
├── otherdev-loom-thread.tsx     # Loom page wrapper with artifact panel
└── providers.tsx               # React Query provider (QueryProvider)
```

**Rendering Strategy:**

- **Server Components (default):** Layout, pages, static content
- **Client Components (`'use client'`):** Interactive components, forms, modals
- **Hybrid:** Server Components wrapping Client Components for optimal performance

---

### 2. API Layer

**Location:** `src/app/api/`, `src/server/lib/`

#### API Routes

```mermaid
graph LR
    Client[Client] -->|POST| Chat[/api/chat/stream]
    Client -->|POST| Native[/api/chat/native]
    Client -->|POST| Contact[/api/contact]
    Client -->|POST| Transcribe[/api/transcribe]
    Client -->|POST| Process[/api/process-document]

    Chat --> StreamHandler[Stream Handler]
    Native --> StreamHandler
    Contact --> Sheets[Google Sheets]
    Contact --> Gmail[Gmail SMTP]
    Transcribe --> GroqWhisper[Groq Whisper]
    Process --> MistralOCR[Mistral OCR]

    StreamHandler --> LLM[LLM<br/>toolChoice auto]
    LLM --> TK[retrieveKnowledge]
    LLM --> TV[tavilySearch]
    LLM --> TA[createArtifact]

    TK --> Embed[Cohere embed-v4.0]
    Embed --> Qdrant[Qdrant]
    Qdrant --> Rerank[Cohere rerank-v4-fast]
    Rerank -.->|to model| LLM
    TV -.->|to model| LLM

    style Client fill:#e1f5ff
    style StreamHandler fill:#ffe1f5
    style LLM fill:#ffe8cc
    style TK fill:#e1ffe4
    style TV fill:#ffe8cc
    style TA fill:#f5e1ff
    style Embed fill:#e1ffe4
    style Qdrant fill:#f5e1ff
    style Rerank fill:#e1ffe4
```

**Directory Structure:**

```
src/app/api/
├── chat/
│   └── stream/route.ts         # Streaming RAG chat endpoint
├── contact/
│   └── route.ts                 # Contact form (Google Sheets + Gmail)
├── transcribe/
│   └── route.ts                 # Audio transcription (Groq Whisper)
└── process-document/
    └── route.ts                 # PDF/image OCR (Mistral)

src/server/lib/
├── chat/
│   ├── models.ts               # AI Gateway model definitions + fallback chains
│   ├── stream-handler.ts       # Core streaming logic (tools, streaming)
│   ├── tools.ts                # retrieveKnowledgeTool, tavilySearchTool, createArtifactTool
│   └── index.ts                # Exports: handleStreamChat, createArtifactTool, tavilySearchTool
├── rag/
│   ├── embeddings.ts           # Cohere embeddings via AI Gateway + LRU cache + reranking
│   └── vector-search.ts        # Qdrant vector search with reranking
├── rate-limit.ts              # Upstash sliding window rate limiting
└── api-helpers.ts              # JSON response helpers + CORS
```

**Key Features:**

- **Vercel AI Gateway:** Unified model routing with automatic failover chains
- **Zod Validation:** Runtime schema validation for type safety
- **Upstash Redis:** Rate limiting
- **Adaptive RAG:** Query quality detection adjusts similarity thresholds

---

### 3. Data Layer

#### 3.1 Content Management (Payload CMS)

**Integration:** Canvas SDK (`@od-canvas/sdk`)

```typescript
// src/lib/payload-api.ts
import { PayloadAPI } from '@od-canvas/sdk';

export const payloadAPI = new PayloadAPI({
  apiUrl: process.env.PAYLOAD_API_URL,
});
```

#### 3.2 Vector Database (Qdrant)

**Collection:** `otherdev_documents` — 1536-dimensional vectors, cosine similarity

**Key Features:**
- **Payload indexes** on: `metadata.type`, `metadata.category`, `metadata.subtype`, `metadata.project`, `metadata.year`
- **Idempotent upserts:** SHA-256 deterministic point IDs (re-running ingest updates, not duplicates)
- **Batch upserts:** 64 points per batch, parallel batch execution
- **Always-on reranking:** Cohere `rerank-v4-fast` cross-encoder after initial vector search

**Document Schema:**

```typescript
interface Document {
  content: string;
  metadata: {
    source: string;
    title: string;
    type: 'project' | 'service' | 'about' | 'general' | 'testimonial';
    category?: string;
    subtype?: string;
    project?: string;
    year?: string;
  };
  vector: number[]; // 1536 dimensions
}
```

**Environment Variables:**
- `QDRANT_URL` — Qdrant server URL
- `QDRANT_API_KEY` — Qdrant API key

#### 3.3 Contact Form Data

**Dual Integration:**

1. **Google Sheets:** Long-term storage, backup, manual review
2. **Gmail:** Instant notifications to team

Both operations run in parallel via `Promise.all()`.

---

## Data Flow

### Page Load Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Next.js
    participant RSC as React Server Components
    participant API as API Routes
    participant CMS as Payload CMS

    Browser->>Next.js: GET /work
    Next.js->>RSC: Render page.tsx (Server)
    RSC->>Next.js: Static project data (lib/projects.ts)
    Next.js-->>Browser: HTML + Hydration instructions

    Browser->>Browser: Hydrate client components
    Browser->>API: Optional: Fetch blog posts
    API->>CMS: Query blog content
    CMS-->>API: Blog data
    API-->>Browser: Typed response (cached)
```

### RAG Chat Flow

```mermaid
sequenceDiagram
    participant User
    participant Widget as Chat Widget
    participant API as /api/chat/stream
    participant RL as Upstash Rate Limit
    participant Cache as Upstash Redis
    participant LLM as LLM<br/>(toolChoice auto)

    User->>Widget: Type message & send
    Widget->>API: POST { messages: [...] }
    API->>RL: Check rate limit
    RL-->>API: Allowed

    API->>Cache: Load chat history
    Cache-->>API: Previous messages

    API->>LLM: streamText(model, tools, messages)

    alt Model calls retrieveKnowledge
        LLM->>Embed: generateEmbedding(query)
        Embed-->>LLM: queryVector (1536-dim)

        LLM->>Qdrant: searchSimilarDocuments(queryVector, topK=3x)
        Qdrant-->>LLM: initialResults[]

        LLM->>Rerank: rerankDocuments(initialResults, topN=5)
        Rerank-->>LLM: rerankedResults[]

        Note over LLM: Tool result passed back to model<br/>with retrieved context
    else Model calls tavilySearch
        LLM->>Tavily: tavilySearch(query)
        Tavily-->>LLM: webResults[]

        Note over LLM: Web results passed back to model
    else No tool calls
        Note over LLM: Direct response (conversational, acknowledgments)
    end

    loop Stream chunks
        LLM-->>Widget: SSE chunk { content: "..." }
        Widget->>User: Display token
    end

    LLM-->>Widget: [DONE]
    API->>Cache: saveChatMessages(chatId, updatedMessages)
```

### Contact Form Submission Flow

```mermaid
sequenceDiagram
    participant User
    participant Form as Contact Dialog
    participant API as API Routes
    participant Handler as Contact Handler
    participant Sheets as Google Sheets
    participant Gmail

    User->>Form: Fill form & submit
    Form->>Form: Client-side validation (Zod)
    Form->>API: POST /api/contact(data)
    API->>Handler: Mutation handler
    Handler->>Handler: Server-side validation (Zod)

    par Parallel Execution
        Handler->>Sheets: Append row
        Handler->>Gmail: Send email
    end

    Sheets-->>Handler: Success
    Gmail-->>Handler: Success
    Handler-->>API: { message: "Success" }
    API-->>Form: Response
    Form->>User: Success toast notification
```

---

## Component Architecture

### Component Hierarchy

```mermaid
graph TD
    Root[Root Layout] --> Providers[Providers]
    Providers --> Tenant[TenantProvider]
    Providers --> Query[QueryProvider<br/>QueryClientProvider]
    Providers --> Suspense[Suspense]

    %% ── Presentational layer ──────────────────────────────────
    Query --> Nav[Navigation]
    Query --> Footer[Footer]
    Query --> Page[Page Component]
    Page --> ServerContent[Server Components]
    Page --> ClientContent[Client Components]

    %% ── Feature components ───────────────────────────────────
    ClientContent --> ContactDialog[Contact Dialog]
    ClientContent --> ChatWidget[Chat Widget]
    ClientContent --> ProjectCard[Project Card]

    %% ── Chat sub-tree ─────────────────────────────────────────
    ChatWidget --> ChatCore[ChatCore]
    ChatCore --> ArtifactRenderer[ArtifactRenderer]

    ContactDialog --> Form[React Hook Form]
    ProjectCard --> ProjectCardHover[ProjectCardHover]

    style Root fill:#e1f5ff
    style Providers fill:#ffe1f5
    style ClientContent fill:#fff4e1
    style ServerContent fill:#e1ffe4
```

### Design Patterns

#### 1. Container/Presenter Pattern

```typescript
// Container (Client Component with logic)
'use client';

export function ContactDialogContainer() {
  const mutation = useMutation({
    mutationFn: submitContact,
  });

  const handleSubmit = async (data: ContactFormData) => {
    await mutation.mutateAsync(data);
  };

  return <ContactDialogPresenter form={form} onSubmit={handleSubmit} />;
}

// Presenter (Pure UI component)
export function ContactDialogPresenter({ form, onSubmit }) {
  return <Form>...</Form>;
}
```

#### 2. Compound Component Pattern

```typescript
// Flexible, composable UI components
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 3. Server Component Composition

```typescript
// page.tsx (Server Component)
import { ProjectList } from '@/components/project-list';
import { ContactDialog } from '@/components/contact-dialog';

export default async function WorkPage() {
  // Fetch data on server
  const projects = await getProjects();

  return (
    <main>
      {/* Server Component */}
      <ProjectList projects={projects} />

      {/* Client Component (island) */}
      <ContactDialog />
    </main>
  );
}
```

---

## Multi-Tenant System

### Architecture

```mermaid
graph LR
    Request[Incoming Request] --> Proxy[proxy.ts Middleware]
    Proxy --> Header{Set x-tenant-domain}
    Header --> NextJS[Next.js Router]
    Context --> Handler[API Route Handlers]
    Handler --> CMS[Canvas CMS<br/>Filter by domain]

    style Request fill:#e1f5ff
    style Proxy fill:#ffe1f5
    style Context fill:#fff4e1
    style CMS fill:#e1ffe4
```

### Implementation

**1. Proxy Middleware (`proxy.ts`):**

```typescript
// web/proxy.ts
import { type NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const domain = hostname.split(':')[0]
  const response = NextResponse.next()
  response.headers.set('x-tenant-domain', domain)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)'],
}
```

**2. API Route Usage:**

API routes read the `x-tenant-domain` header to scope data:

```typescript
// In any API route
const domain = request.headers.get('x-tenant-domain') || 'otherdev.com'
// Use domain to filter CMS queries, etc.
```

Note: The multi-tenant system is partial — `proxy.ts` sets the header, but full domain-based content filtering through `src/server/lib/context.ts` is not yet wired up.

---

## AI Gateway & Chat Routing

### Vercel AI Gateway

All LLM calls route through `@ai-sdk/gateway` for unified observability and automatic failover:

```typescript
// src/server/lib/chat/models.ts
import { gateway } from 'ai'

// Fast model: Groq GPT-OSS → Cerebras Qwen (full) → Cerebras Qwen (32b)
export function getFastModel() {
  return gateway('groq/gpt-oss-120b')
}

// Capable model: Groq Scout (for reasoning, artifacts, tools)
export function getCapableModel() {
  return gateway('groq/llama-4-scout-17b-16e-instruct')
}

// Vision model: Mistral Pixtral → Groq Scout
export function getVisionModel() {
  return gateway('mistral/pixtral-large')
}
```

**Fallback Chains:**

| Model Role | Primary | Fallback 1 | Fallback 2 |
|------------|---------|------------|------------|
| Fast | `groq/gpt-oss-120b` | `cerebras/qwen-3-235b-a22b-instruct-2507` | `groq/qwen3-32b` |
| Vision | `mistral/pixtral-large` | `groq/llama-4-scout-17b-16e-instruct` | — |

### Tool-Driven Architecture (no pre-classification)

The LLM decides at runtime which tool to call via `toolChoice: 'auto'`. There is no pre-flight query classification.

```typescript
// src/server/lib/chat/stream-handler.ts
const result = streamText({
  model: gateway(selectedModelId),
  system: getSystemPrompt(),
  messages: modelMessages,
  toolChoice: 'auto',   // LLM decides — no pre-classification
  tools: {
    retrieveKnowledge: retrieveKnowledgeTool,
    tavilySearch: tavilySearchTool,
    ...(supportsArtifacts ? { createArtifact: createArtifactTool } : {}),
  },
})
```

**Three tool definitions:**
- `retrieveKnowledgeTool` → Cohere embed-v4.0 → Qdrant → Cohere rerank-v4-fast → context to model
- `tavilySearchTool` → Tavily web search → results to model
- `createArtifactTool` → returns HTML artifact data to model (optional, gated by `supportsArtifacts`)

**System prompt** tells the model when to use each tool:
- Use `retrieveKnowledge` for Other Dev domain questions (projects, services, team)
- Use `tavilySearch` for general knowledge and current events
- Use `createArtifact` for building interactive web content
- No tools for conversational acknowledgments ("ok", "thanks")

### Rate Limiting (Upstash Redis)

**Location:** `src/server/lib/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis from '@upstash/redis'

// Chat: 10 requests per minute per IP
const chatRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'rl:chat',
})

// Contact: 5 requests per minute per IP
const contactRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'rl:contact',
})
```

## RAG Chat System

### System Architecture

```mermaid
graph TB
    subgraph "Knowledge Base"
        KB[Knowledge Documents]
        Ingest[Ingest Script]
    end

    subgraph "Vector Store"
        Qdrant[Qdrant<br/>otherdev_documents<br/>1536-dim Cosine]
        Payloads[Payload Indexes<br/>type category subtype<br/>project year]
    end

    subgraph "Embeddings and Reranking"
        CohereEmbed[Cohere embed-v4.0<br/>via AI Gateway]
        LRUCache[LRU Cache<br/>100 entries]
        CohereRerank[Cohere rerank-v4-fast<br/>via AI Gateway]
    end

    subgraph "Chat Runtime"
        StreamHandler[Stream Handler]
        LLM[LLM<br/>toolChoice auto]
    end

    KB --> Ingest
    Ingest --> Qdrant

    LLM -->|calls| TK[retrieveKnowledge]
    LLM -->|calls| TV[tavilySearch]

    TK --> CohereEmbed
    CohereEmbed --> LRUCache
    LRUCache --> Qdrant

    Qdrant --> CohereRerank
    CohereRerank -.->|context to model| LLM
    TV -.->|web results to model| LLM

    LLM --> Gateway[Vercel AI Gateway]
    Gateway --> GroqGroq[Groq LLM]
    Gateway --> Mistral[Mistral LLM]

    style KB fill:#e1ffe4
    style StreamHandler fill:#ffe1f5
    style LLM fill:#ffe8cc
    style TK fill:#e1ffe4
    style TV fill:#ffe8cc
    style CohereEmbed fill:#e1ffe4
    style CohereRerank fill:#e1ffe4
    style Qdrant fill:#f5e1ff
```

### Knowledge Base

**Location:** `src/lib/knowledge-base.ts`

Structured documents about Other Dev's projects, services, team, and testimonials (~100 documents).

```typescript
export interface KnowledgeDocument {
  content: string;
  metadata: {
    source: 'projects' | 'about' | 'services' | 'testimonials' | 'general';
    title: string;
    type: 'project' | 'service' | 'about' | 'general' | 'testimonial';
    category?: string;
    subtype?: string;
    project?: string;
    year?: string;
  };
}
```

### Ingest Pipeline

**Location:** `scripts/ingest-documents.ts`

```mermaid
graph TB
    A[Check collection exists] --> B{Exists?}
    B -->|No| C[resetCollection()<br/>Create + payload indexes]
    B -->|Yes| D[deletePointsByFilter()<br/>Preserve collection + indexes]
    C --> E[Generate all embeddings<br/>generateEmbeddingBatch()]
    D --> E
    E --> F{All 1536-dim?}
    F -->|Fail| G[Exit with error]
    F -->|Pass| H[upsertDocumentBatch()<br/>64 pts/batch, parallel]
    H --> I[Done: N documents ingested]
```

**Idempotent upserts:** Point ID is `SHA-256(source::title::content)` — re-running ingest updates existing points.

---

## Inline Editing & Branch Navigation

### Inline Bubble Editing

User messages support inline editing (Claude/ChatGPT style):

1. Click **pencil icon** on any user message bubble
2. Bubble transforms into an editable `<textarea>` with the same styling
3. **Enter** → confirm edit, text updates, AI regenerates response (replace-and-replay)
4. **Escape** → cancel edit, reverts to original text
5. Prompt bar is **not involved** — editing is fully self-contained in the bubble

**Key behavior:**
- `handleEditConfirm` updates the message in `messages[]` then calls `handleSubmitWithMessages` with the edited message
- No duplicate bubble: `setMessages()` is NOT called before `handleSubmitWithMessages` (AI SDK handles the update on response)
- Suggestions extracted from `messageMetadata` (industry standard)

### Branch Navigation

Each edited user message maintains a **branch history**:

- **Before edit:** Current chat state is snapshotted into `messageBranches`
- **After edit:** New branch created with previous snapshot + edited message
- **`messageBranches[messageId].snapshots[]`:** Array of all chat states for that message
- **`messageBranches[messageId].activeIndex`:** Which snapshot is currently displayed

Navigation controls (`<`/`>`) appear when `branchCount > 1`:

```
<  2/3  >
```

Clicking `<` or `>` calls `setMessages(targetSnapshot)` to switch to that branch's full chat history.

### Streamdown (Progressive Markdown Rendering)

Replaced `react-markdown` with **Streamdown** for progressive, blurIn-animated streaming:

```tsx
// src/components/ui/markdown-renderer.tsx
<Streamdown
  plugins={{ code, math, mermaid }}
  animated={{ animation: 'blurIn', duration: 250, easing: 'ease-out', sep: 'word' }}
  caret="block"
  shikiTheme={['github-light', 'github-dark']}
  controls={{ code: { copy, download }, mermaid: { copy, download, fullscreen } }}
/>{children}</Streamdown>
```

**Plugins:**
- `code` — Shiki syntax highlighting (copy/download controls)
- `math` — KaTeX math rendering (block `$$` and inline `$`)
- `mermaid` — Mermaid diagram rendering (fullscreen, copy, download)

**Mermaid rules:** Node labels must be simple ASCII text only. No parentheses, colons, slashes, or special characters inside brackets.

---

## Performance Optimizations

### 1. React Compiler

**Automatic Optimization:**
- Automatic memoization of components and hooks (`'use memo'`)
- Reduced re-renders without manual `useMemo`/`useCallback`
- `compilationMode: 'annotation'` — opt-in per file

### 2. Code Splitting

**Automatic via App Router:**
- Each route is a separate bundle
- Dynamic imports for heavy components
- React.lazy for client components

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <Spinner />,
  ssr: false, // Client-side only
});
```

### 3. Image Optimization

**Next.js Image Component:**
- Automatic WebP conversion
- Responsive images with srcSet
- Lazy loading by default

```typescript
// next.config.ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'unsplash.com' },
    { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
    { protocol: 'https', hostname: 'picsum.photos' },
  ],
}
```

### 4. Caching Strategy

**React Query:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minute
      gcTime: 5 * 60 * 1000,    // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});
```

**Upstash Redis caching:**
- RAG retrieval context: 6-hour TTL
- Chat responses: 24-hour TTL
- Chat history: 14-day TTL

### 5. Server Components

**Benefits:**
- Zero JavaScript sent to client
- Direct database access
- SEO-friendly content
- Faster initial page load

**Usage:**
```typescript
// Server Component (default)
async function ProjectList() {
  const projects = await getProjects(); // Direct data access
  return <div>{projects.map(...)}</div>;
}

// Client Component (opt-in)
'use client';
function InteractiveButton() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

---


## Deployment Architecture

### Production Setup

```mermaid
graph TB
    subgraph "Edge Network"
        Vercel[Vercel Edge Network]
        CDN[CDN Static Assets]
    end

    subgraph "Serverless Functions"
        Pages[Next.js Pages<br/>Fluid Compute]
        API[API Routes<br/>Fluid Compute]
        Chat[Chat Stream<br/>Fluid Compute]
    end

    subgraph "External Services"
        CMS[Payload CMS<br/>VPS/Cloud]
        Qdrant[Qdrant Cloud<br/>Vector Search]
        Upstash[Upstash Redis<br/>Rate Limit + Cache]
        LLM[Vercel AI Gateway<br/>Groq + Mistral]
    end

    Vercel --> Pages
    Vercel --> API
    Vercel --> Chat
    Vercel --> CDN

    Pages --> CMS
    API --> CMS
    Chat --> Qdrant
    Chat --> Upstash
    Chat --> LLM

    style Vercel fill:#e1f5ff
    style Pages fill:#ffe1f5
    style CMS fill:#fff4e1
    style Qdrant fill:#f5e1ff
    style Upstash fill:#ffe8cc
```

### Environment Configuration

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://otherdev.com

# Canvas CMS
CANVAS_API_URL=https://client5.otherdev.com/canvas/v1/api/
CANVAS_API_KEY=your-api-key

# Google Services
GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-google-sheet-id
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# AI Services
GROQ_API_KEY=your-groq-api-key

# Vector Search (Qdrant)
QDRANT_URL=https://your-qdrant.cloud
QDRANT_API_KEY=your-qdrant-key

# Web Search (Tavily)
TAVILY_API_KEY=your-tavily-key

# Rate Limiting & Chat Cache (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# RAG Configuration
RAG_SIMILARITY_THRESHOLD=0.1
RAG_MATCH_COUNT=5
RAG_MAX_MESSAGE_LENGTH=500
CHAT_HISTORY_TTL_SECONDS=1209600
RAG_RETRIEVAL_CACHE_TTL_SECONDS=21600
CHAT_RESPONSE_CACHE_TTL_SECONDS=86400
```

---

For more information, see:
- [API Reference](./API_REFERENCE.md) - API documentation
- [Component Library](./COMPONENTS.md) - UI components
- [Developer Guide](./DEVELOPER_GUIDE.md) - Setup and workflow