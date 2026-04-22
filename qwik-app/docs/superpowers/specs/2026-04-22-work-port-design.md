# Work Page Port — Qwik Implementation Design

## Context

Port the Next.js `/work` page to Qwik with full visual fidelity — matching typography, spacing, grid layout, and animations — without using any Next.js or React libraries.

**Source of truth:** `D:\work\otherdev-web-v2\web\src\app\work\page.tsx` and related components
**Target:** `D:\work\otherdev-web-v2\qwik-app\src\routes\work\`

---

## Pages

### 1. Work Index (`/work`)

**Purpose:** Grid of all projects with hover toolip that follows mouse.

**Visual elements:**
- Intro paragraph: `text-[11px] text-stone-500 leading-[14px] tracking-[-0.24px]`
- Container padding: `pr-[15%]` on desktop, `pr-[8%]` on tablet
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px]`
- Each card: square aspect ratio, `rounded-[5px]`, hover scale on image

**Animation:**
- Card image: `transition-transform duration-300 group-hover:scale-[0.99]` (CSS)
- Hover tooltip: appears on card hover, follows mouse position with spring physics
- Tooltip offset: `left: x + 15px, top: y + 15px`

### 2. Work Detail (`/work/[slug]`)

**Purpose:** Individual project page with title, description, media gallery, related projects.

**Layout:**
- Title: `text-[28px] sm:text-[30px] leading-[1.1] tracking-[-0.48px] font-bold`
- URL badge: `bg-neutral-200 rounded-[5px] h-[24px] px-[12px]`
- Description: `text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] max-w-[315px] sm:max-w-[532px]`
- Media gallery: `bg-neutral-200 rounded-[5px] px-6 py-[78px] md:px-[145px]`
- Related projects: horizontal scroll with `w-[320px] sm:w-[600px]` cards
- Back link: `inline-flex bg-neutral-200 rounded-[5px] h-[21px] px-[6px]`

---

## Animation Strategy

| Animation | Approach |
|---|---|
| Card image hover scale | CSS `transition-transform duration-300` + `group-hover:scale-[0.99]` |
| Tooltip fade in/out | CSS `transition: opacity 150ms ease-out` on class toggle |
| Tooltip follows mouse with spring | Motion One `spring({ stiffness: 400, damping: 25 })` via `useVisibleTask$` |

**Rationale:**
- CSS for state-change animations (scale, fade) — 0kb bundle, no JS hydration cost
- Motion One for physics-based spring only — ~4kb, justified for the tooltip follow effect

**Decision rule:** Default to CSS. Use Motion One only when physics (lag, bounce, spring) is required.

---

## Components

### `project-card.tsx`

Reusable card component with two variants:

- **`work` variant:** No hover tooltip — clean link to project page
- **`home` variant:** Hover tooltip with spring follow (for homepage)

Props:
```typescript
interface ProjectCardProps {
  title: string
  slug: string
  image: string
  description?: string
  showText?: boolean   // defaults true
  variant: 'home' | 'work'
  priority?: boolean
}
```

### `project-card-hover.tsx`

Card with hover tooltip that follows mouse position.

**Qwik implementation pattern:**
```typescript
const isHovered = useSignal(false)
const mousePos = useSignal({ x: 0, y: 0 })

<div
  onMouseEnter$={() => isHovered.value = true}
  onMouseLeave$={() => isHovered.value = false}
  onMouseMove$={(e) => mousePos.value = { x: e.clientX, y: e.clientY }}
>
  {/* card content */}
</div>

{isHovered.value && (
  <div
    class="fixed pointer-events-none z-50 rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5"
    style={{ left: `${mousePos.value.x + 15}px`, top: `${mousePos.value.y + 15}px` }}
  >
    <p class="text-[#686868] text-[11px] font-normal leading-[14px] whitespace-nowrap">{title}</p>
  </div>
)}
```

Spring animation applied via `useVisibleTask$` + Motion One on the tooltip element.

---

## Data

Use existing `src/data/projects.ts` — already has 17 projects with id, title, slug, image, description, url, media, year, downloadUrl.

---

## Accessibility

- Links use semantic `<a>` tags with `href`
- Images have `alt` text from project title
- Tooltip uses `aria-hidden` when hidden
- Focus states on interactive elements

---

## Success Criteria

1. Work index page renders with same visual layout as Next.js source
2. Work detail page renders with same layout and media gallery
3. Hover tooltip appears and follows mouse with spring feel
4. Card hover scales image via CSS transition
5. Responsive breakpoints match exactly (mobile, tablet, desktop)
6. No Next.js or React dependencies in output