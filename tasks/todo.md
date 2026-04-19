# RSC & Caching Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Next.js 16 `'use cache'` directive to CMS-fetched pages and split `ProjectCard` into server/client components to reduce unnecessary client JS.

**Architecture:** Enable `cacheComponents` in next.config.ts, extract cached data-fetching functions for blog pages (eliminating a double-fetch on the post detail page), and split `ProjectCard` so the work-page variant renders as a pure server component while the hover tooltip stays client-only.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript, `cacheLife` / `cacheTag` / `revalidateTag` from `next/cache`, Biome for formatting, bun for running commands.

---

## Files Changed

| File | Action | Why |
|---|---|---|
| `web/next.config.ts` | Modify | Add `cacheComponents: true` to unlock `'use cache'` directive |
| `web/src/app/blog/page.tsx` | Modify | Wrap Canvas fetch in `'use cache'` cached function |
| `web/src/app/blog/[slug]/page.tsx` | Modify | Single cached function shared by `generateMetadata` + page, eliminating double fetch |
| `web/src/components/project-card.tsx` | Modify | Remove `'use client'`, make server component shell |
| `web/src/components/project-card-hover.tsx` | Create | Client component — mouse handlers + AnimatePresence tooltip |

---

## Task 1: Enable cacheComponents in next.config.ts

**Files:**
- Modify: `web/next.config.ts`

- [ ] **Step 1: Add `cacheComponents: true`**

  In `web/next.config.ts`, add `cacheComponents: true` alongside `reactCompiler: true`:

  ```ts
  const nextConfig: NextConfig = {
    typescript: {
      ignoreBuildErrors: true,
    },
    reactCompiler: true,
    cacheComponents: true,   // <-- add this
    images: { ... },
    ...
  }
  ```

- [ ] **Step 2: Verify build still passes**

  Run from `web/`:
  ```bash
  bun run build
  ```
  Expected: build completes with no errors. If `cacheComponents` is unrecognized, check Next.js version (`bun next --version`) — needs 16+.

- [ ] **Step 3: Commit**

  ```bash
  git add web/next.config.ts
  git commit -m "feat: enable cacheComponents for Next.js 16 PPR support"
  ```

---

## Task 2: Cache the blog list page

**Files:**
- Modify: `web/src/app/blog/page.tsx`

**Context:** The page calls `canvas.getPublicDocuments()` on every request. Blog posts change infrequently. Caching for 1 hour eliminates CMS round-trips on every pageview. The `cacheTag('blog-posts')` enables on-demand invalidation later if needed.

- [ ] **Step 1: Extract cached fetch function**

  Replace the inline try/catch fetch in `BlogPage` with a top-level cached function. The `CanvasClient` instantiation moves inside it (it's cheap). Full replacement for `web/src/app/blog/page.tsx` data section:

  ```ts
  import { cacheLife, cacheTag } from 'next/cache'
  import { CanvasClient } from '@od-canvas/sdk'

  async function getBlogPosts(): Promise<CanvasDocument[]> {
    'use cache'
    cacheLife('hours')
    cacheTag('blog-posts')

    const canvas = new CanvasClient({
      baseUrl: process.env.CANVAS_API_URL,
      apiKey: process.env.CANVAS_API_KEY,
    })

    try {
      const documents =
        (await canvas.getPublicDocuments(
          parseInt(process.env.CANVAS_PROJECT_ID || '4'),
        )) ?? []
      return documents.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    } catch {
      return []
    }
  }
  ```

  Then in `BlogPage`:
  ```ts
  export default async function BlogPage() {
    const posts = await getBlogPosts()
    // rest of the component unchanged
  }
  ```

- [ ] **Step 2: Remove the now-unused inline CanvasClient + fetch**

  Delete the module-level `const canvas = new CanvasClient(...)` and the inline try/catch inside `BlogPage`. The component body should just be `const posts = await getBlogPosts()` followed by the JSX.

- [ ] **Step 3: Run build to verify**

  ```bash
  cd web && bun run build
  ```
  Expected: no errors. The build output should show `/blog` as a cached route.

- [ ] **Step 4: Commit**

  ```bash
  git add web/src/app/blog/page.tsx
  git commit -m "perf: cache blog list CMS fetch with use cache (1h TTL)"
  ```

---

## Task 3: Fix double fetch + cache the blog post page

**Files:**
- Modify: `web/src/app/blog/[slug]/page.tsx`

**Context:** Both `generateMetadata` and `BlogPostPage` currently instantiate `CanvasClient` and call `getPublicDocument` independently — that's 2 network requests for the same data on every page load. A single cached function fixes both issues at once.

- [ ] **Step 1: Extract single cached fetch function**

  Add this above `generateMetadata` in `web/src/app/blog/[slug]/page.tsx`:

  ```ts
  import { cacheLife, cacheTag } from 'next/cache'
  import { CanvasClient } from '@od-canvas/sdk'

  async function getBlogPost(id: number) {
    'use cache'
    cacheLife('hours')
    cacheTag('blog-posts', `blog-post-${id}`)

    const canvas = new CanvasClient({
      baseUrl: process.env.CANVAS_API_URL,
      apiKey: process.env.CANVAS_API_KEY,
    })

    try {
      return await canvas.getPublicDocument(id)
    } catch {
      return null
    }
  }
  ```

- [ ] **Step 2: Update `generateMetadata` to use cached function**

  ```ts
  export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params
    const post = await getBlogPost(parseInt(slug))

    if (!post) {
      return { title: 'Blog Post Not Found | Other Dev' }
    }

    return {
      title: `${post.title} | Other Dev Blog`,
      description: post.content.replace(/<[^>]*>/g, '').substring(0, 160),
    }
  }
  ```

- [ ] **Step 3: Update `BlogPostPage` to use cached function**

  ```ts
  export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params
    const post = await getBlogPost(parseInt(slug))
    // rest of JSX unchanged — remove the console.log(post) while here
  }
  ```

  Remove the `console.log(post)` on line 40 while touching this file.

- [ ] **Step 4: Run build to verify**

  ```bash
  cd web && bun run build
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add web/src/app/blog/[slug]/page.tsx
  git commit -m "perf: fix double CMS fetch and cache blog post page with use cache"
  ```

---

## Task 4: Split ProjectCard into server + client components

**Files:**
- Create: `web/src/components/project-card-hover.tsx`
- Modify: `web/src/components/project-card.tsx`

**Context:** `ProjectCard` is `'use client'` only because `variant="home"` and `variant="broll"` need a mouse-tracking tooltip (useState + framer-motion). `variant="work"` (used on `/work` page with 15+ cards) never uses the tooltip — but currently ships all the hover JS. After this split, the work page grid is fully server-rendered.

**Design:**
- `project-card-hover.tsx` — client component. Owns `isHovered`, `mousePosition`, mouse event handlers, and the `AnimatePresence` tooltip. Renders the `<Link>` with handlers + the floating tooltip.
- `project-card.tsx` — server component (no directive). Renders card structure. For `variant="work"` or `showText`-only: renders a plain `<Link>`. For hover variants, renders `<ProjectCardHover>`.

- [ ] **Step 1: Create `project-card-hover.tsx`**

  Create `web/src/components/project-card-hover.tsx`:

  ```tsx
  'use client'

  import Image from 'next/image'
  import Link from 'next/link'
  import { useState } from 'react'
  import { motion, AnimatePresence } from 'motion/react'
  import { cva } from 'class-variance-authority'

  const cardVariants = cva(
    'relative aspect-square overflow-hidden rounded-[5px] transition-all flex items-center justify-center',
    {
      variants: {
        variant: {
          home: 'bg-stone-200 -hover:shadow-lg',
          broll: '',
        },
      },
      defaultVariants: { variant: 'home' },
    },
  )

  const imageContainerVariants = cva('relative w-full h-full bg-stone-200', {
    variants: {
      variant: {
        home: 'px-[24px] py-[36px]',
        broll: '',
      },
    },
    defaultVariants: { variant: 'home' },
  })

  const imageVariants = cva('transition-transform duration-300', {
    variants: {
      variant: {
        home: 'object-contain group-hover:scale-[1.02] p-6',
        broll: 'object-cover',
      },
    },
    defaultVariants: { variant: 'home' },
  })

  interface ProjectCardHoverProps {
    title: string
    slug: string
    image: string
    variant: 'home' | 'broll'
    priority?: boolean
    sizes?: string
  }

  export function ProjectCardHover({
    title,
    slug,
    image,
    variant,
    priority = false,
    sizes = '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw',
  }: ProjectCardHoverProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    return (
      <>
        <Link
          href={variant === 'broll' ? (slug ?? '#') : `/work/${slug}`}
          className="block group"
          onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={cardVariants({ variant })}>
            <div className={imageContainerVariants({ variant })}>
              <Image
                src={image}
                alt={title}
                fill
                sizes={sizes}
                className={imageVariants({ variant })}
                priority={priority}
              />
            </div>
          </div>
        </Link>

        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="fixed pointer-events-none z-50"
              style={{
                left: `${mousePosition.x + 15}px`,
                top: `${mousePosition.y + 15}px`,
              }}
            >
              <div className="rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5">
                <p className="text-[#686868] text-[11px] font-normal leading-[14px] whitespace-nowrap">
                  {title}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }
  ```

- [ ] **Step 2: Rewrite `project-card.tsx` as a server component**

  Replace the entire file with:

  ```tsx
  import Link from 'next/link'
  import Image from 'next/image'
  import { cva, type VariantProps } from 'class-variance-authority'
  import { ProjectCardHover } from './project-card-hover'

  const cardVariants = cva(
    'relative aspect-square overflow-hidden rounded-[5px] transition-all flex items-center justify-center',
    {
      variants: {
        variant: {
          home: 'bg-stone-200 -hover:shadow-lg',
          work: 'bg-stone-200',
          broll: '',
        },
      },
      defaultVariants: { variant: 'home' },
    },
  )

  const imageContainerVariants = cva('relative w-full h-full bg-stone-200', {
    variants: {
      variant: {
        home: 'px-[24px] py-[36px]',
        work: 'px-[50px] py-[60px]',
        broll: '',
      },
    },
    defaultVariants: { variant: 'home' },
  })

  const imageVariants = cva('transition-transform duration-300', {
    variants: {
      variant: {
        home: 'object-contain group-hover:scale-[1.02] p-6',
        work: 'object-contain group-hover:scale-[0.99] p-6',
        broll: 'object-cover',
      },
    },
    defaultVariants: { variant: 'home' },
  })

  interface ProjectCardProps extends VariantProps<typeof cardVariants> {
    title: string
    slug: string
    image: string
    description?: string
    showText?: boolean
    priority?: boolean
    sizes?: string
  }

  export function ProjectCard({
    title,
    slug,
    image,
    description,
    variant,
    showText = false,
    priority = false,
    sizes = '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw',
  }: ProjectCardProps) {
    const useHover = variant === 'home' || variant === 'broll'

    return (
      <div className="flex flex-col gap-[13px]">
        {useHover ? (
          <ProjectCardHover
            title={title}
            slug={slug}
            image={image}
            variant={variant}
            priority={priority}
            sizes={sizes}
          />
        ) : (
          <Link href={`/work/${slug}`} className="block group">
            <div className={cardVariants({ variant })}>
              <div className={imageContainerVariants({ variant })}>
                <Image
                  src={image}
                  alt={title}
                  fill
                  sizes={sizes}
                  className={imageVariants({ variant })}
                  priority={priority}
                />
              </div>
            </div>
          </Link>
        )}

        {showText && (
          <Link
            href={`/work/${slug}`}
            className="box-border flex flex-col items-start pb-[3px] pt-0 px-0 relative shrink-0"
          >
            <div className="box-border flex flex-col items-start mb-[-3px] relative shrink-0 w-full">
              <div className="flex flex-col font-normal justify-center leading-[0] not-italic relative shrink-0 text-[11.4px] text-black tracking-[-0.24px] w-full">
                <p className="leading-[14px] whitespace-pre-wrap">{title}</p>
              </div>
            </div>
            <div className="box-border flex flex-col items-start mb-[-3px] pb-0 pt-[9px] px-0 relative shrink-0 w-full">
              <div className="flex flex-col font-normal justify-center leading-[14px] not-italic relative shrink-0 text-[#686868] text-[11.1px] tracking-[-0.24px] w-full whitespace-pre-wrap">
                <p className="mb-0">{description}</p>
              </div>
            </div>
          </Link>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 3: Run build and lint**

  ```bash
  cd web && bun lint && bun run build
  ```
  Expected: no lint errors, no build errors.

- [ ] **Step 4: Smoke-test visually**

  Start dev server:
  ```bash
  cd web && bun dev
  ```
  - Visit `/work` — cards render with images and text, no hover tooltip (correct for `variant="work"`)
  - Visit `/` (home) — hover over cards, tooltip appears following mouse cursor (correct for `variant="home"`)
  - Visit a broll card — hover tooltip appears (correct for `variant="broll"`)

- [ ] **Step 5: Commit**

  ```bash
  git add web/src/components/project-card.tsx web/src/components/project-card-hover.tsx
  git commit -m "perf: split ProjectCard into server/client — work variant now server-rendered"
  ```

---

## Review

- [ ] Run full build one final time: `cd web && bun run build`
- [ ] Confirm `/work`, `/`, `/blog`, `/blog/[slug]` all render correctly in production build (`bun run start`)
