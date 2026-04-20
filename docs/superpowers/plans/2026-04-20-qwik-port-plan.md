# Qwik Full Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full 1:1 feature parity port of the Next.js portfolio site to pure Qwik — all routes, UI components, APIs, chat, and contact functionality.

**Architecture:** Native Qwik City routing with `useStore`/`useSignal` for state, `routeAction$`/`routeLoader$` for REST APIs, `qwikify$` for the React AI chat widget. No tRPC, no Zustand, no external state library.

**Tech Stack:** Qwik City, Tailwind CSS 4, Zod, `@upstash/ratelimit`, `firebase-admin`, `googleapis`, `nodemailer`, `@builder.io/qwik-react`

---

## File Map

```
qwik/                                    # New Qwik app (sibling to web/)
├── src/
│   ├── routes/
│   │   ├── index.tsx                   # Homepage
│   │   ├── layout.tsx                  # Root layout with fonts, providers
│   │   ├── about/index.tsx
│   │   ├── work/index.tsx
│   │   ├── work/[slug]/index.tsx
│   │   ├── blog/index.tsx
│   │   ├── blog/[slug]/index.tsx
│   │   ├── loom/index.tsx
│   │   └── api/
│   │       ├── contact/index.tsx        # routeAction$ - contact form
│   │       ├── chat/stream/index.tsx    # server$ - RAG chat streaming
│   │       └── content/posts/index.tsx  # routeLoader$ - blog content
│   ├── components/
│   │   ├── ui/                          # ~60 shadcn-style components (Qwik port)
│   │   ├── navigation.tsx
│   │   ├── footer.tsx
│   │   ├── project-card.tsx
│   │   ├── contact-dialog.tsx
│   │   ├── chat-widget.tsx              # React island via qwikify$
│   │   └── providers.tsx               # Theme + tenant context providers
│   ├── lib/
│   │   ├── projects.ts                 # Static project data (same as existing)
│   │   ├── payload-api.ts              # Canvas SDK wrapper
│   │   ├── rate-limit.ts               # Upstash rate limiting
│   │   ├── rag/
│   │   │   ├── embeddings.ts            # HuggingFace embeddings
│   │   │   └── vector-search.ts        # Firebase vector search
│   │   ├── knowledge-base.ts          # RAG document chunks
│   │   ├── metadata.ts                 # SEO metadata helpers
│   │   ├── constants.ts               # Z_INDEX, etc.
│   │   ├── utils.ts                    # cn(), clsx, etc.
│   │   └── tenant-context.tsx         # Multi-tenant domain context
│   ├── context/
│   │   ├── theme.ts                   # Theme context (useStore)
│   │   └── chat.ts                    # Chat messages context
│   └── root.tsx
├── public/
│   ├── fonts/
│   └── og-image.jpg
├── vite.config.ts
├── adaptors/
│   └── vercel-edge/
│       └── vite.config.ts
├── package.json
└── tsconfig.json
```

---

## PHASE 1: PROJECT SHELL

### Task 1: Scaffold Qwik City Project

**Files:**
- Create: `qwik/package.json`
- Create: `qwik/tsconfig.json`
- Create: `qwik/vite.config.ts`
- Create: `qwik/src/root.tsx`
- Create: `qwik/src/entry.ssr.tsx`
- Create: `qwik/src/entry.dev.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "otherdev-qwik",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "qwik build",
    "build.client": "vite build",
    "build.server": "vite build -c adaptors/vercel-edge/vite.config.ts",
    "preview": "qwik build preview && vite preview --open",
    "type-check": "tsc --noEmit",
    "lint": "biome check",
    "lint:fix": "biome check --write"
  },
  "dependencies": {
    "@builder.io/qwik": "^1.9.0",
    "@builder.io/qwik-city": "^1.9.0",
    "@builder.io/qwik-react": "^1.9.0",
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.37.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "firebase-admin": "^13.0.0",
    "googleapis": "^166.0.0",
    "lucide-qwik": "^0.469.0",
    "nodemailer": "^7.0.12",
    "tailwind-merge": "^3.4.0",
    "zod": "^4.3.5"
  },
  "devDependencies": {
    "@types/node": "^20.19.28",
    "@types/nodemailer": "^7.0.5",
    "autoprefixer": "^10.4.20",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3",
    "vite": "^6.2.6",
    "undici": "^6.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "lib": ["ES2017", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@builder.io/qwik",
    "strict": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "incremental": true,
    "isolatedModules": true,
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity(),
      qwikVite(),
      tsconfigPaths(),
    ],
    server: {
      port: 5173,
    },
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    },
  };
});
```

- [ ] **Step 4: Create src/root.tsx**

```typescript
import { component$, useStyles$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import { RouterHead } from './components/router-head';
import globalStyles from './global.css?inline';

export default component$(() => {
  useStyles$(globalStyles);

  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <RouterHead />
      </head>
      <body>
        <RouterOutlet />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
```

- [ ] **Step 5: Create src/entry.ssr.tsx**

```typescript
import { renderToStream, type RenderToStreamOptions } from '@builder.io/qwik/server';
import { manifest } from '@qwik-client-manifest';
import Root from './root';

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    prefetchStrategy: {
      implementation: {
        linkInsert: 'html-append',
        workerFetchInsert: 'always',
      },
    },
  });
}
```

- [ ] **Step 6: Create src/entry.dev.tsx**

```typescript
import { type JSXOutput } from '@builder.io/qwik';
import { render } from '@builder.io/qwik/server';
import Root from './root';

export default function (opts: { port: number }) {
  return render(document, <Root />);
}
```

- [ ] **Step 7: Commit**

```bash
cd qwik && git init && git add -A && git commit -m "feat(qwik): scaffold Qwik City project shell"
```

---

### Task 2: Global CSS + Tailwind + Fonts

**Files:**
- Create: `qwik/src/global.css`
- Create: `qwik/src/globals.css`
- Modify: `qwik/vite.config.ts` (add Tailwind plugin)

- [ ] **Step 1: Create global.css** (copy TWKLausanne + QueensCompressed font-face declarations and CSS variables from Next.js globals.css — strip React-specific directives)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --twk-lausanne: 'TWK Lausanne', sans-serif;
    --queens-compressed: 'Queens Compressed', sans-serif;
    /* same CSS variable system as existing globals.css */
  }
}
```

- [ ] **Step 2: Copy fonts** from `web/public/fonts/` to `qwik/public/fonts/`

- [ ] **Step 3: Update vite.config.ts** to include Tailwind 4 via `@tailwindcss/postcss`:

```typescript
import postcss from '@tailwindcss/postcss';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity(),
      qwikVite(),
      tsconfigPaths(),
      postcss(),
    ],
    // ...
  };
});
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(qwik): add Tailwind 4, global CSS, font assets"
```

---

### Task 3: Route Files — Empty Skeleton

**Files:**
- Create: `qwik/src/routes/index.tsx`
- Create: `qwik/src/routes/about/index.tsx`
- Create: `qwik/src/routes/work/index.tsx`
- Create: `qwik/src/routes/work/[slug]/index.tsx`
- Create: `qwik/src/routes/blog/index.tsx`
- Create: `qwik/src/routes/blog/[slug]/index.tsx`
- Create: `qwik/src/routes/loom/index.tsx`
- Create: `qwik/src/routes/layout.tsx`

- [ ] **Step 1: Create layout.tsx** (root layout with font variables, theme provider, tenant context — mirrors Next.js RootLayout)

```typescript
import { component$, Slot } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set('X-Content-Type-Options', 'nosniff');
};

export default component$(() => {
  return <Slot />;
});
```

- [ ] **Step 2: Create each route as minimal placeholder** (e.g. `export default component$(() => <div>Home</div>)`)

- [ ] **Step 3: Verify routes** — run `bun dev`, navigate to each route, confirm 200

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(qwik): add route skeleton"
```

---

## PHASE 2: UI COMPONENTS

### Task 4: Core UI Primitives

**Files:**
- Create: `qwik/src/components/ui/button.tsx`
- Create: `qwik/src/components/ui/input.tsx`
- Create: `qwik/src/components/ui/textarea.tsx`
- Create: `qwik/src/components/ui/dialog.tsx`
- Create: `qwik/src/components/ui/sheet.tsx`
- Create: `qwik/src/components/ui/skeleton.tsx`
- Create: `qwik/src/components/ui/badge.tsx`
- Create: `qwik/src/components/ui/card.tsx`
- Create: `qwik/src/components/ui/spinner.tsx`
- Create: `qwik/src/components/ui/label.tsx`
- Create: `qwik/src/components/ui/separator.tsx`
- Create: `qwik/src/components/ui/tooltip.tsx`

Each component follows the **same API surface** as the existing Next.js shadcn-style component it ports. Port the Tailwind class implementations directly. Most are pure JSX — no hooks needed.

**Pattern for each:**
```typescript
// Example: button.tsx
import { component$, type HTMLAttributes } from '@builder.io/qwik';
import { cva, type VariantProps } from 'class-variance-authority';
import { clx } from '~/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors',
  { variants: { variant: { default: 'bg-primary text-primary-foreground hover:bg-primary/90', ... } }, defaultVariants: { variant: 'default' } }
);

interface ButtonProps extends VariantProps<typeof buttonVariants>, HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const Button = component$<ButtonProps>(({ class: className, variant, size, ...props }) => {
  return (
    <button class={clx(buttonVariants({ variant, size }), className)} {...props} />
  );
});
```

- [ ] **Step 1: Port button.tsx** — CVA variants from Next.js button, use `clx` (Qwik-compatible `clsx` wrapper)
- [ ] **Step 2: Port input.tsx, textarea.tsx** — straightforward
- [ ] **Step 3: Port dialog.tsx** — uses Qwik's `<dialog>` element + show/hide signals
- [ ] **Step 4: Port sheet.tsx** (side drawer) — same pattern
- [ ] **Step 5: Port remaining primitives** — skeleton, badge, card, spinner, label, separator, tooltip
- [ ] **Step 6: Commit per component batch**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/textarea.tsx && git commit -m "feat(qwik): port button, input, textarea components"
```

---

### Task 5: Remaining UI Components

**Files:**
- Create: `qwik/src/components/ui/alert.tsx`
- Create: `qwik/src/components/ui/accordion.tsx`
- Create: `qwik/src/components/ui/alert-dialog.tsx`
- Create: `qwik/src/components/ui/aspect-ratio.tsx`
- Create: `qwik/src/components/ui/avatar.tsx`
- Create: `qwik/src/components/ui/breadcrumb.tsx`
- Create: `qwik/src/components/ui/calendar.tsx`
- Create: `qwik/src/components/ui/carousel.tsx`
- Create: `qwik/src/components/ui/checkbox.tsx`
- Create: `qwik/src/components/ui/citations.tsx`
- Create: `qwik/src/components/ui/code-block.tsx`
- Create: `qwik/src/components/ui/collapsible.tsx`
- Create: `qwik/src/components/ui/command.tsx`
- Create: `qwik/src/components/ui/context-menu.tsx`
- Create: `qwik/src/components/ui/copy-button.tsx`
- Create: `qwik/src/components/ui/drawer.tsx`
- Create: `qwik/src/components/ui/dropdown-menu.tsx`
- Create: `qwik/src/components/ui/empty.tsx`
- Create: `qwik/src/components/ui/field.tsx`
- Create: `qwik/src/components/ui/form.tsx`
- Create: `qwik/src/components/ui/hover-card.tsx`
- Create: `qwik/src/components/ui/kbd.tsx`
- Create: `qwik/src/components/ui/markdown.tsx`
- Create: `qwik/src/components/ui/markdown-renderer.tsx`
- Create: `qwik/src/components/ui/navigation-menu.tsx`
- Create: `qwik/src/components/ui/pagination.tsx`
- Create: `qwik/src/components/ui/popover.tsx`
- Create: `qwik/src/components/ui/progress.tsx`
- Create: `qwik/src/components/ui/prompt-input.tsx`
- Create: `qwik/src/components/ui/prompt-suggestions.tsx`
- Create: `qwik/src/components/ui/radio-group.tsx`
- Create: `qwik/src/components/ui/resizable.tsx`
- Create: `qwik/src/components/ui/scroll-area.tsx`
- Create: `qwik/src/components/ui/select.tsx`
- Create: `qwik/src/components/ui/slider.tsx`
- Create: `qwik/src/components/ui/switch.tsx`
- Create: `qwik/src/components/ui/table.tsx`
- Create: `qwik/src/components/ui/tabs.tsx`
- Create: `qwik/src/components/ui/toggle.tsx`
- Create: `qwik/src/components/ui/toggle-group.tsx`
- Create: `qwik/src/components/ui/chain-of-thought.tsx`
- Create: `qwik/src/components/ui/chart.tsx`
- Create: `qwik/src/components/ui/chat-container.tsx`
- Create: `qwik/src/components/ui/message.tsx`
- Create: `qwik/src/components/ui/message-input.tsx`
- Create: `qwik/src/components/ui/source.tsx`
- Create: `qwik/src/components/ui/button-group.tsx`
- Create: `qwik/src/components/ui/input-group.tsx`
- Create: `qwik/src/components/ui/item.tsx`
- Create: `qwik/src/components/ui/input-otp.tsx`
- Create: `qwik/src/components/ui/sonner.tsx`

- [ ] **Step 1: Batch port by complexity** — port in groups of ~10, test each batch

- [ ] **Step 2: Commit in batches**

```bash
git add src/components/ui/alert.tsx src/components/ui/accordion.tsx ... && git commit -m "feat(qwik): port alert, accordion, and ~8 more ui components"
```

---

## PHASE 3: LAYOUT COMPONENTS

### Task 6: Navigation + Footer

**Files:**
- Create: `qwik/src/components/navigation.tsx`
- Create: `qwik/src/components/footer.tsx`

- [ ] **Step 1: Port navigation.tsx** — `useSignal` replaces `useState` for mobile menu, `useStore` for contact dialog open state, `useTask$` for sessionStorage persistence. Framer Motion `AnimatePresence` → Qwik's built-in CSS animations or `component$` + CSS transitions.

```typescript
// key pattern differences:
// React: useState(false) → Qwik: useSignal(false)
// React: useEffect(() => ..., [dep]) → Qwik: useTask$(({ track }) => { track(dep); ... })
// React: onClick={setOpen} → Qwik: onClick$={() => open.value = true}
```

- [ ] **Step 2: Port footer.tsx** — static component, minimal state

- [ ] **Step 3: Test** — verify mobile hamburger, desktop links, contact dialog trigger all work

- [ ] **Step 4: Commit**

```bash
git add src/components/navigation.tsx src/components/footer.tsx && git commit -m "feat(qwik): port navigation and footer components"
```

---

### Task 7: Contact Dialog + Form

**Files:**
- Create: `qwik/src/components/contact-dialog.tsx`

- [ ] **Step 1: Port contact-dialog.tsx** — `useStore` for form state, `routeAction$` for submission. Uses `useComputed$` for derived state (submit button disabled state).

```typescript
// Form submission in Qwik:
export const useContactAction = routeAction$(async (data, { fail }) => {
  // Zod validation already done by routeAction$
  // ... Google Sheets + Gmail logic
  return { success: true };
}, zodValidator(contactFormSchema));
```

- [ ] **Step 2: Test** — fill form, submit, verify Google Sheets + Gmail called

- [ ] **Step 3: Commit**

---

## PHASE 4: DATA LAYER

### Task 8: Shared Libraries

**Files:**
- Create: `qwik/src/lib/utils.ts` (cn function)
- Create: `qwik/src/lib/projects.ts` (copy from web/)
- Create: `qwik/src/lib/payload-api.ts` (copy from web/)
- Create: `qwik/src/lib/knowledge-base.ts` (copy from web/)
- Create: `qwik/src/lib/constants.ts` (copy from web/)
- Create: `qwik/src/lib/metadata.ts` (copy from web/)
- Create: `qwik/src/lib/rate-limit.ts` (copy + adapt Upstash usage)
- Create: `qwik/src/lib/tenant-context.tsx`

- [ ] **Step 1: Copy utils.ts, constants.ts, metadata.ts** — no changes needed, same implementation
- [ ] **Step 2: Copy projects.ts** — same data, verify types
- [ ] **Step 3: Copy payload-api.ts** — Canvas SDK import path changes from `@/lib/payload-api` to `~/lib/payload-api`
- [ ] **Step 4: Copy knowledge-base.ts** — same RAG documents
- [ ] **Step 5: Adapt rate-limit.ts** — same Upstash API, but wrap in `server$()` or use in `routeAction$` context
- [ ] **Step 6: Commit**

```bash
git add src/lib/ && git commit -m "feat(qwik): port shared lib modules"
```

---

### Task 9: RAG Pipeline

**Files:**
- Create: `qwik/src/lib/rag/embeddings.ts`
- Create: `qwik/src/lib/rag/vector-search.ts`

- [ ] **Step 1: Copy embeddings.ts from web/src/server/lib/rag/embeddings.ts** — HuggingFace API call, same logic
- [ ] **Step 2: Copy vector-search.ts from web/src/server/lib/rag/vector-search.ts** — Firebase Admin vector search, same logic
- [ ] **Step 3: Test** — run `bun ingest` equivalent (if ingestion script is needed), verify embeddings work

- [ ] **Step 4: Commit**

---

## PHASE 5: API ROUTES

### Task 10: Contact API

**Files:**
- Create: `qwik/src/routes/api/contact/index.tsx`

- [ ] **Step 1: Create routeAction$** using same Zod schema as contactRouter in Next.js

```typescript
import { routeAction$, zod$ } from '@builder.io/qwik-city';
import { z } from 'zod';
import { checkRateLimit, getClientIdentifier } from '~/lib/rate-limit';

export const useContactSubmit = routeAction$(async (data, { request, fail }) => {
  const identifier = getClientIdentifier(request);
  const { allowed, resetTime } = await checkRateLimit(`contact:${identifier}`);
  
  if (!allowed) {
    return fail(429, { message: `Too many submissions. Try again after ${new Date(resetTime).toLocaleTimeString()}.` });
  }
  
  // Google Sheets + Gmail — same as existing
  await Promise.allSettled([appendToSheet(data), sendEmail(data)]);
  
  return { success: true };
}, zod$({
  name: z.string().min(2),
  companyName: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
}));
```

- [ ] **Step 2: Wire to contact-dialog.tsx** via action reference

- [ ] **Step 3: Commit**

---

### Task 11: Chat Streaming API

**Files:**
- Create: `qwik/src/routes/api/chat/stream/index.tsx`

- [ ] **Step 1: Create server$ function** — streaming response using Groq API, same RAG pipeline as Next.js `/api/chat/stream`

```typescript
import { server$ } from '@builder.io/qwik-city';
import { streamReader } from '~/lib/rag/stream';

export const chatStream = server$(async function* (messages: Message[], domain: string) {
  // 1. Get embedding for last message
  // 2. Vector search in Firebase
  // 3. Build prompt with retrieved context
  // 4. Stream Groq response
  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${this.env.get('GROQ_API_KEY')}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, stream: true }),
  });
  
  if (!groqResponse.ok) throw new Error('Groq API error');
  
  const reader = groqResponse.body!.getReader();
  // ... stream chunks to client
});
```

- [ ] **Step 2: Test** — verify streaming works in dev

- [ ] **Step 3: Commit**

---

### Task 12: Content Loader

**Files:**
- Create: `qwik/src/routes/api/content/posts/index.tsx`

- [ ] **Step 1: Create routeLoader$** for blog posts — wraps Payload API calls

```typescript
import { routeLoader$ } from '@builder.io/qwik-city';
import { payloadAPI } from '~/lib/payload-api';

export const useBlogPostsLoader = routeLoader$(async ({ query, params }) => {
  const domain = /* extract from headers */;
  return await payloadAPI.getBlogPosts(domain, {
    limit: Number(query.get('limit') || 10),
    page: Number(query.get('page') || 1),
  });
});

export const useBlogPostLoader = routeLoader$(async ({ params }) => {
  return await payloadAPI.getBlogPost(params.slug, domain);
});
```

- [ ] **Step 2: Wire loaders to blog routes**

- [ ] **Step 3: Commit**

---

## PHASE 6: PAGES

### Task 13: Homepage

**Files:**
- Modify: `qwik/src/routes/index.tsx`

- [ ] **Step 1: Copy content from web/src/app/page.tsx** — strip `'use client'`, replace `useState`/`useEffect` with `useSignal`/`useTask$`

- [ ] **Step 2: Replace framer-motion animations** with Qwik CSS transitions or `motion` package equivalents

- [ ] **Step 3: Verify** — compare renders between Next.js and Qwik versions

- [ ] **Step 4: Commit**

---

### Task 14: Work + Blog Pages

**Files:**
- Modify: `qwik/src/routes/work/index.tsx`
- Modify: `qwik/src/routes/work/[slug]/index.tsx`
- Modify: `qwik/src/routes/blog/index.tsx`
- Modify: `qwik/src/routes/blog/[slug]/index.tsx`

- [ ] **Step 1: Port each page** — copy content, adapt to Qwik signals/loaders

- [ ] **Step 2: Add `export const prerender = true`** to [slug] routes (same as existing Next.js `export const prerender = true` flag)

- [ ] **Step 3: Commit**

---

### Task 15: About + Loom Pages

**Files:**
- Modify: `qwik/src/routes/about/index.tsx`
- Modify: `qwik/src/routes/loom/index.tsx`

- [ ] **Step 1: Port about page** — mostly static content, minimal state

- [ ] **Step 2: Port loom page** — AI page, likely uses ChatWidget island

- [ ] **Step 3: Commit**

---

## PHASE 7: CHAT WIDGET (React Island)

### Task 16: React Chat Widget Bridge

**Files:**
- Create: `qwik/src/components/chat-widget.tsx`

- [ ] **Step 1: Configure vite.config.ts** with `qwikReact()` plugin

```typescript
import { qwikReact } from '@builder.io/qwik-react/vite';

export default defineConfig(() => {
  return {
    plugins: [
      qwikCity(),
      qwikVite(),
      qwikReact(),
      tsconfigPaths(),
    ],
  };
});
```

- [ ] **Step 2: Install React dependencies**

```bash
cd qwik && bun add react react-dom @types/react @types/react-dom
```

- [ ] **Step 3: Create qwik/src/components/chat-widget.tsx**

```typescript
import { qwikify$ } from '@builder.io/qwik-react';
import { ChatWidget as ReactChatWidget } from '~/components/ui/chat-widget.react';

export const ChatWidget = qwikify$(ReactChatWidget, { eagerness: 'hover' });
```

- [ ] **Step 4: Copy ChatWidget component** from `web/src/components/chat-widget.tsx` (React version) — make minimal changes to wire to new Qwik API endpoints

- [ ] **Step 5: Add ChatWidget to layout.tsx**

- [ ] **Step 6: Commit**

---

## PHASE 8: POLISH

### Task 17: Multi-Tenant Middleware + Error Pages

**Files:**
- Create: `qwik/src/middleware/tenant.ts`
- Modify: `qwik/src/routes/error.tsx`
- Modify: `qwik/src/routes/not-found.tsx`

- [ ] **Step 1: Create tenant middleware** — extracts domain from `x-tenant-domain` header, sets context (same pattern as Next.js proxy.ts)

- [ ] **Step 2: Port error.tsx and not-found.tsx**

- [ ] **Step 3: Commit**

---

### Task 18: SEO + Metadata

- [ ] **Step 1: Verify metadata** exports on all pages match Next.js versions
- [ ] **Step 2: Verify sitemap.ts and robots.ts** ported correctly
- [ ] **Step 3: Commit**

---

## Self-Review Checklist

1. **Spec coverage:** All 6 spec requirements covered? (Shell, UI, Data, APIs, Chat, Polish)
2. **Placeholder scan:** No "TBD", "TODO", or vague steps
3. **Type consistency:** Consistent naming (`useContactAction`, `useBlogPostsLoader`, etc.)
4. **Missing UI components:** ~60 components listed — any gaps from original list?
5. **API coverage:** Contact, Chat stream, Content posts — all three accounted for
6. **React island setup:** `qwikify$` + `qwikReact()` plugin — both tasks present

---

## Plan Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1-3 | Project shell + routes |
| 2 | 4-5 | ~60 UI components |
| 3 | 6-7 | Navigation, Footer, Contact Dialog |
| 4 | 8-9 | Shared libs + RAG pipeline |
| 5 | 10-12 | REST API routes |
| 6 | 13-15 | Page content |
| 7 | 16 | Chat widget React island |
| 8 | 17-18 | Middleware, error pages, SEO |

**Total: 18 tasks across 8 phases**

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-20-qwik-port-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
