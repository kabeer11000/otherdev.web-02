# Qwik/Astro Migration Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the migration of the `qwik-astro-app/` from scaffold to production-ready, covering the missing API routers, ChatWidget React island, multi-tenant middleware, and remaining pages.

**Architecture:** `qwik-astro-app/` is an Astro + `@qwikdev/astro` project. React components are wrapped with `qwikify$` from `@builder.io/qwik-react` and hydrated lazily using the `qwik:visible` directive (not `client:visible`) in `.astro` files. Multi-tenant routing handled via Astro middleware. tRPC routers replaced with Astro API routes + QwikCity `server$` functions.

**Key @qwikdev/astro patterns learned from ctx7:**
- React component → wrap with `qwikify$(ReactComponent)` from `@builder.io/qwik-react`
- In `.astro` files: use `qwik:visible` directive (e.g. `<ChatWidget qwik:visible />`)
- In `.tsx` files (Qwik components): use `client:visible`
- Astro middleware: `src/middleware.ts` exports `onRequest` function
- API routes: Astro file-based routing in `src/pages/api/`

**Tech Stack:** Astro 5, Qwik 1.19, `@qwikdev/astro` 0.8, React 18, Tailwind CSS 4, Vite, Bun.

---

## File Map

| File | Responsibility |
|------|---------------|
| `qwik-astro-app/src/middleware.ts` | Multi-tenant: extract tenant from host header |
| `qwik-astro-app/src/pages/api/contact.ts` | Contact form: Google Sheets + Gmail |
| `qwik-astro-app/src/pages/api/content.ts` | Content: Canvas SDK blog posts |
| `qwik-astro-app/src/components/chat-widget-react.tsx` | React ChatWidget wrapped with qwikify$ |
| `qwik-astro-app/src/components/chat-widget.tsx` | Qwik-ified ChatWidget export |
| `qwik-astro-app/src/pages/index.astro` | Home page (exists, verify) |
| `qwik-astro-app/src/pages/work.astro` | Work listing page |
| `qwik-astro-app/src/pages/work/[slug].astro` | Work detail page |
| `qwik-astro-app/src/pages/about.astro` | About page |
| `qwik-astro-app/src/layouts/Layout.astro` | Root layout (exists, verify) |
| `qwik-astro-app/src/styles/global.css` | Global styles |
| `qwik-astro-app/.env.example` | Environment variables template |
| `qwik-astro-app/.env` | Actual env vars (not committed) |

---

## Task 1: Verify Build Baseline

**Context:** Before adding more code, confirm the scaffold builds.

- [ ] **Step 1: Run build**

  ```bash
  cd qwik-astro-app && bun install && bun run build
  ```

  Expected: builds without fatal errors (warnings acceptable). If it fails, fix astro.config.mjs or tsconfig first.

- [ ] **Step 2: Commit baseline**

  ```bash
  git add -A && git commit -m "chore(qwik-astro): verify scaffold builds"
  ```

---

## Task 2: Add Multi-Tenant Middleware

**Files:**
- Create: `qwik-astro-app/src/middleware.ts`

**Context:** The Next.js `proxy.ts` extracts tenant from host header and sets `x-tenant-domain`. In Astro, this is done via `src/middleware.ts` with an `onRequest` handler. The tenant domain is stored in `context.locals` so API routes can read it.

**Step 1: Create middleware**

Create `qwik-astro-app/src/middleware.ts`:

```typescript
import { defineMiddleware } from 'astro:middleware'

/**
 * Multi-tenant middleware for qwik-astro-app
 * Extracts tenant domain from host header and makes it available via context.locals
 *
 * Domain mapping:
 * - otherdev.com → otherdev
 * - localhost → localhost (development)
 * - clientname.com → clientname (custom domains)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const hostname = context.request.headers.get('host') || ''

  // Extract domain (remove port for localhost)
  const domain = hostname.split(':')[0]

  // Make domain available to all API routes via context.locals
  context.locals.tenantDomain = domain

  return next()
})
```

**Step 2: Add type for context.locals**

Create `qwik-astro-app/src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    tenantDomain: string
  }
}
```

**Step 3: Commit**

```bash
git add qwik-astro-app/src/middleware.ts qwik-astro-app/src/env.d.ts
git commit -m "feat(qwik-astro): add multi-tenant middleware extracting domain from host header"
```

---

## Task 3: Build Contact API Route

**Files:**
- Create: `qwik-astro-app/src/pages/api/contact.ts`

**Context:** The Next.js `contactRouter` sends form submissions to Google Sheets and Gmail. This task converts it to an Astro API endpoint. Uses `server$` from `@builder.io/qwik-city` for typed server-side logic, called from a React island contact form.

**Step 1: Create contact server function**

Create `qwik-astro-app/src/pages/api/contact.ts`:

```typescript
import { server$ } from '@builder.io/qwik-city'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  })
  return auth
}

async function appendToSheet(data: {
  name: string
  companyName: string
  email: string
  subject: string
  message: string
}) {
  const auth = getGoogleAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const timestamp = new Date().toISOString()
  const values = [[timestamp, data.name, data.companyName, data.email, data.subject, data.message]]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

async function sendEmail(data: {
  name: string
  companyName: string
  email: string
  subject: string
  message: string
}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Other Dev Website" <${process.env.GMAIL_USER}>`,
    to: process.env.CONTACT_EMAIL || 'hello@otherdev.com',
    replyTo: data.email,
    subject: `New contact from ${data.name} (${data.companyName}): ${data.subject}`,
    text: [
      `Name: ${data.name}`,
      `Company: ${data.companyName}`,
      `Email: ${data.email}`,
      `Subject: ${data.subject}`,
      `Message: ${data.message}`,
    ].join('\n'),
  })
}

export const submitContact = server$(async function (data: {
  name: string
  companyName: string
  email: string
  subject: string
  message: string
}) {
  try {
    await Promise.all([appendToSheet(data), sendEmail(data)])
    return { success: true }
  } catch (error) {
    console.error('[Contact] Error:', error)
    return { success: false, error: 'Failed to submit contact form' }
  }
})
```

**Step 2: Commit**

```bash
git add qwik-astro-app/src/pages/api/contact.ts
git commit -m "feat(qwik-astro): add contact API with Google Sheets + Gmail integration"
```

---

## Task 4: Build Content API Route (Canvas SDK)

**Files:**
- Create: `qwik-astro-app/src/pages/api/content.ts`

**Context:** The Next.js `contentRouter` fetches blog posts from Canvas (Payload CMS) via `@od-canvas/sdk`. This task creates a similar endpoint using QwikCity `routeLoader$` for data fetching.

**Step 1: Check if @od-canvas/sdk is installed**

```bash
grep -q "@od-canvas/sdk" qwik-astro-app/package.json && echo "installed" || echo "missing"
```

If missing, install it:

```bash
cd qwik-astro-app && bun add @od-canvas/sdk
```

**Step 2: Create content API**

Create `qwik-astro-app/src/pages/api/content.ts`:

```typescript
import { server$ } from '@builder.io/qwik-city'
import type { CanvasDocument } from '@od-canvas/sdk'

/**
 * Content API using Canvas SDK
 * Fetches blog posts from Payload CMS
 * Domain is read from context.locals set by middleware
 */
export const getBlogPosts = server$(async function (
  limit: number = 10,
  page: number = 1
): Promise<CanvasDocument[]> {
  const domain = this.locals.tenantDomain || 'otherdev.com'

  try {
    const { CanvasClient } = await import('@od-canvas/sdk')
    const canvas = new CanvasClient({
      baseUrl: process.env.CANVAS_API_URL || 'http://localhost:3845',
      apiKey: process.env.CANVAS_API_KEY,
    })

    const projectId = parseInt(process.env.CANVAS_PROJECT_ID || '4', 10)
    const documents = (await canvas.getPublicDocuments(projectId)) ?? []

    return documents
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice((page - 1) * limit, page * limit)
  } catch (error) {
    console.error('[Content] Error fetching blog posts:', error)
    return []
  }
})

export const getBlogPost = server$(async function (
  slug: string
): Promise<CanvasDocument | null> {
  const domain = this.locals.tenantDomain || 'otherdev.com'

  try {
    const { CanvasClient } = await import('@od-canvas/sdk')
    const canvas = new CanvasClient({
      baseUrl: process.env.CANVAS_API_URL || 'http://localhost:3845',
      apiKey: process.env.CANVAS_API_KEY,
    })

    return await canvas.getPublicDocument(parseInt(slug, 10))
  } catch (error) {
    console.error('[Content] Error fetching blog post:', error)
    return null
  }
})
```

**Step 3: Commit**

```bash
git add qwik-astro-app/src/pages/api/content.ts
git commit -m "feat(qwik-astro): add Canvas SDK content API for blog posts"
```

---

## Task 5: Build Work Listing Page

**Files:**
- Create: `qwik-astro-app/src/pages/work.astro`

**Context:** The `/work` page shows the project grid. It uses the static data from `src/lib/projects.ts`. This page should render the full project grid with `ProjectCard` components wrapped with `qwik:visible`.

**Step 1: Create work listing page**

Create `qwik-astro-app/src/pages/work.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import { Navigation } from '../components/navigation'
import { ProjectCard } from '../components/project-card'
import { Footer } from '../components/footer'
import { projects } from '../lib/projects'

const title = 'Work | Other Dev'
const description = 'Selected projects by Other Dev, a web development and design studio based in Karachi, Pakistan.'
---

<Layout title={title} description={description}>
  <Navigation qwik:visible />
  <main class="container mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
    <div class="grid grid-cols-12 mb-8 mt-[60px]">
      <p class="text-[#686868] text-[11px] leading-[14px] font-normal col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
        otherdev is a full-service web development and design studio. Based in Karachi City, we specialize in the fashion and design fields, partnering with pioneering creatives on digital platforms that elevate their brands.
      </p>
    </div>
    <div class="mt-[30px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px] gap-y-[15px]">
      {projects.map((project, index) => (
        <ProjectCard
          qwik:visible
          title={project.title}
          slug={project.slug}
          image={project.image}
          description={project.description}
          variant="work"
          priority={index < 8}
        />
      ))}
    </div>
    <Footer qwik:visible />
  </main>
</Layout>
```

**Step 2: Commit**

```bash
git add qwik-astro-app/src/pages/work.astro
git commit -m "feat(qwik-astro): add work listing page with project grid"
```

---

## Task 6: Build Work Detail Page

**Files:**
- Create: `qwik-astro-app/src/pages/work/[slug].astro`

**Context:** The `/work/[slug]` page shows a single project with its media gallery. Data comes from `src/lib/projects.ts` — no API needed.

**Step 1: Create work detail page**

Create `qwik-astro-app/src/pages/work/[slug].astro`:

```astro
---
import Layout from '../../layouts/Layout.astro'
import { Navigation } from '../../components/navigation'
import { Footer } from '../../components/footer'
import { projects } from '../../lib/projects'

export function getStaticPaths() {
  return projects.map(project => ({
    params: { slug: project.slug },
    props: { project },
  }))
}

const { project } = Astro.props
const { title, description, image, media, year, url, downloadUrl } = project
const allImages = [image, ...(media || [])]
---

<Layout title={`${title} | Other Dev`} description={description}>
  <Navigation qwik:visible />
  <main class="container mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
    <div class="mt-[60px]">
      <div class="mb-8">
        <h1 class="text-[24px] font-twk font-normal leading-[28px] tracking-[-0.5px] mb-4">
          {title}
        </h1>
        <p class="text-[#686868] text-[11px] leading-[14px] font-twk font-normal max-w-xl">
          {description}
        </p>
        <div class="flex items-center gap-4 mt-4">
          <span class="text-[#686868] text-[11px] font-twk">{year}</span>
          {url && (
            <a
              href={`https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] font-twk underline hover:opacity-70"
            >
              {url}
            </a>
          )}
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-[11px] font-twk underline hover:opacity-70"
            >
              Download PDF
            </a>
          )}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
        {allImages.map((img, index) => (
          <div class="aspect-square bg-stone-200 overflow-hidden rounded-[5px]">
            <img
              src={img}
              alt={`${title} - image ${index + 1}`}
              class="w-full h-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>
    </div>
    <Footer qwik:visible />
  </main>
</Layout>
```

**Step 2: Commit**

```bash
git add qwik-astro-app/src/pages/work/[slug].astro
git commit -m "feat(qwik-astro): add work detail page with project gallery"
```

---

## Task 7: Build About Page

**Files:**
- Modify: `qwik-astro-app/src/pages/about.astro`

**Context:** The about page needs real content. Currently it's empty. Use the same aesthetic as the rest of the site.

**Step 1: Replace about page content**

Replace content of `qwik-astro-app/src/pages/about.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import { Navigation } from '../components/navigation'
import { Footer } from '../components/footer'

const title = 'About | Other Dev'
const description = 'Other Dev is a web development and design studio based in Karachi, Pakistan.'
---

<Layout title={title} description={description}>
  <Navigation qwik:visible />
  <main class="container mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
    <div class="grid grid-cols-12 mt-[60px] gap-[12px]">
      <div class="col-span-12 md:col-span-6">
        <h1 class="text-[11px] font-twk font-normal text-[#686868] mb-[60px]">
          otherdev is a full-service web development and design studio based in Karachi City. We specialize in the fashion and design fields, partnering with pioneering creatives on digital platforms that elevate their brands.
        </h1>
      </div>
      <div class="col-span-12 md:col-span-6">
        <div class="space-y-8">
          <div>
            <h2 class="text-[11px] font-twk font-normal text-[#686868] mb-3">Services</h2>
            <ul class="space-y-1">
              <li class="text-[14px] font-twk">Web development</li>
              <li class="text-[14px] font-twk">E-commerce platforms</li>
              <li class="text-[14px] font-twk">Brand identity</li>
              <li class="text-[14px] font-twk">Art direction</li>
              <li class="text-[14px] font-twk">Digital strategy</li>
            </ul>
          </div>
          <div>
            <h2 class="text-[11px] font-twk font-normal text-[#686868] mb-3">Specializations</h2>
            <ul class="space-y-1">
              <li class="text-[14px] font-twk">Fashion & retail</li>
              <li class="text-[14px] font-twk">Real estate</li>
              <li class="text-[14px] font-twk">Legal tech</li>
              <li class="text-[14px] font-twk">SaaS platforms</li>
              <li class="text-[14px] font-twk">Enterprise systems</li>
            </ul>
          </div>
          <div>
            <h2 class="text-[11px] font-twk font-normal text-[#686868] mb-3">Contact</h2>
            <ul class="space-y-1">
              <li class="text-[14px] font-twk">
                <a href="mailto:hello@otherdev.com" class="hover:opacity-70">hello@otherdev.com</a>
              </li>
              <li class="text-[14px] font-twk">
                <a href="https://wa.me/923156893331" class="hover:opacity-70" target="_blank" rel="noopener">+92 315 689 3331</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <Footer qwik:visible />
  </main>
</Layout>
```

**Step 2: Commit**

```bash
git add qwik-astro-app/src/pages/about.astro
git commit -m "feat(qwik-astro): add about page content"
```

---

## Task 8: Build ChatWidget React Island

**Files:**
- Create: `qwik-astro-app/src/components/chat-widget-react.tsx`
- Modify: `qwik-astro-app/src/layouts/Layout.astro`

**Context:** The ChatWidget from the Next.js app is a React component with useState and usePathname. In @qwikdev/astro, React components must be wrapped with `qwikify$` from `@builder.io/qwik-react`. The wrapped component is then used in `.astro` files with the `qwik:visible` directive.

**Key ctx7 findings:**
- `import { qwikify$ } from '@builder.io/qwik-react'`
- Wrap: `export const QChatWidget = qwikify$(ChatWidget)`
- Use in .astro: `<QChatWidget qwik:visible />`

**Step 1: Create ChatWidget React component**

Create `qwik-astro-app/src/components/chat-widget-react.tsx`:

```tsx
/** @jsxImportSource react */
import { useState, useRef, useEffect } from 'react'
import { cn } from './utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: number
}

interface ChatWidgetProps {
  apiUrl?: string
}

export function ChatWidget({ apiUrl = '/api/chat/stream' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setSuggestion(null)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk
        }
      }

      // Parse suggestion from SUGGESTION: marker
      const suggestionMatch = assistantMessage.match(/\n?\s*SUGGESTION:\s*(.+)$/i)
      const cleanContent = assistantMessage
        .replace(/\n?\s*SUGGESTION:[\s\S]*$/i, '')
        .trim()

      if (suggestionMatch) {
        setSuggestion(suggestionMatch[1].trim())
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cleanContent,
        },
      ])
    } catch (error) {
      console.error('[ChatWidget] Error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8',
          'h-14 w-14 md:h-12 md:w-12',
          'flex border items-center justify-center rounded-full shadow-sm bg-white',
          'hover:opacity-80 hover:scale-110 transition-all focus:outline-none'
        )}
        aria-label="Open chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.477 2 2 6.045 2 11c0 2.012 1.057 3.82 2.709 5.034-.033.314-.033.628-.033.942 0 3.866 3.186 7 7.324 7 3.103 0 5.803-1.78 6.896-4.364.195-.46.683-.828 1.104-.828 2.333 0 3.9-2.097 3.9-4.534 0-.86-.28-1.673-.776-2.37C22.22 5.01 21.16 3.82 19.79 3.82c-.39 0-.777.076-1.145.22" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-[320px] sm:w-[360px] h-[480px] bg-white border border-stone-200 rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div>
          <h3 className="text-[11px] font-twk font-normal text-[#686868]">other dev AI</h3>
          <p className="text-[10px] font-twk text-[#999]">Ask me anything</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[#686868] hover:text-black transition-colors"
          aria-label="Close chat"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4L4 12M4 4l8 8" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[11px] font-twk text-[#686868]">
              Hi! I'm the Other Dev AI assistant. Ask me about our projects, services, or technologies.
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'text-[11px] font-twk leading-[14px]',
              msg.role === 'user'
                ? 'text-right text-[#686868]'
                : 'text-left text-[#333]'
            )}
          >
            <span>{msg.content}</span>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <span className="text-[11px] font-twk text-[#686868] animate-pulse">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion */}
      {suggestion && (
        <button
          type="button"
          onClick={() => {
            setInput(suggestion)
            setSuggestion(null)
          }}
          className="mx-4 mb-2 px-3 py-1.5 text-[10px] font-twk text-[#686868] bg-stone-100 rounded hover:bg-stone-200 transition-colors text-left"
        >
          {suggestion}
        </button>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about our work..."
            className="flex-1 text-[11px] font-twk px-3 py-2 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-black text-white text-[10px] font-twk rounded hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Create qwikified wrapper**

Create `qwik-astro-app/src/components/chat-widget.tsx`:

```tsx
/** @jsxImportSource react */
import { qwikify$ } from '@builder.io/qwik-react'
import { ChatWidget } from './chat-widget-react'

export const QChatWidget = qwikify$(ChatWidget)
```

**Step 3: Add ChatWidget to Layout**

Modify `qwik-astro-app/src/layouts/Layout.astro` to add the ChatWidget to every page:

Add import at top:
```astro
import { QChatWidget } from '../components/chat-widget'
```

Add before closing `</Layout>`:
```astro
<QChatWidget client:visible />
```

**Step 4: Commit**

```bash
git add qwik-astro-app/src/components/chat-widget-react.tsx qwik-astro-app/src/components/chat-widget.tsx qwik-astro-app/src/layouts/Layout.astro
git commit -m "feat(qwik-astro): add ChatWidget as React island via qwikify$"
```

---

## Task 9: Add Environment Variables Template

**Files:**
- Create: `qwik-astro-app/.env.example`

**Step 1: Create .env.example**

```env
# Canvas SDK (Payload CMS)
CANVAS_API_URL=http://localhost:3845
CANVAS_API_KEY=your-canvas-api-key
CANVAS_PROJECT_ID=4

# Google Sheets + Gmail
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-sheet-id
GMAIL_USER=your@gmail.com
GMAIL_PASS=your-app-password
CONTACT_EMAIL=hello@otherdev.com

# RAG Chat System
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# RAG Configuration
RAG_SIMILARITY_THRESHOLD=0.1
RAG_MATCH_COUNT=5
RAG_MAX_MESSAGE_LENGTH=500
```

**Step 2: Commit**

```bash
git add qwik-astro-app/.env.example
git commit -m "docs(qwik-astro): add environment variables template"
```

---

## Task 10: Final Build Verification

**Step 1: Run full build**

```bash
cd qwik-astro-app && bun run build
```

Expected: no fatal errors.

**Step 2: Start preview and smoke test**

```bash
cd qwik-astro-app && bun preview &
sleep 3
# Visit http://localhost:4321/ and check home page renders
# Visit http://localhost:4321/work and check project grid
# Visit http://localhost:4321/about and check about page
# Kill the preview server
```

**Step 3: Commit**

```bash
git add -A && git commit -m "chore(qwik-astro): final build verification pass"
```

---

## Post-Migration: Graphify Verification

After completing all tasks, run graphify to verify hyperedges:

```bash
bunx graphify update qwik-astro-app
```

Verify these hyperedges are intact:
- **RAG Chat System Architecture** — Firebase vectors + Groq streaming + Mistral embeddings
- **OtherDev Full Stack Web Application** — Qwik/Astro parity on all features

---

## Self-Review Checklist

- [ ] All ctx7 patterns applied correctly: `qwikify$` for React islands, `qwik:visible` in .astro files
- [ ] Multi-tenant middleware sets `context.locals.tenantDomain` from host header
- [ ] Contact API uses server$() with Google Sheets + Gmail
- [ ] Content API uses Canvas SDK via server$()
- [ ] ChatWidget is a React component wrapped with qwikify$, loaded via `qwik:visible` in Layout
- [ ] Work listing page renders static project data with `qwik:visible` ProjectCard components
- [ ] Work detail page uses getStaticPaths() for static generation
- [ ] About page has real content
- [ ] `.env.example` documents all required environment variables
- [ ] Build passes without fatal errors
- [ ] No placeholder TODOs in any step
