# Work Page Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port Next.js `/work` page to Qwik with full visual fidelity — matching typography, spacing, grid, animations — using CSS for simple transitions and Motion One for spring-based tooltip.

**Architecture:** Two routes (`/work` index and `/work/[slug]` detail), one reusable `ProjectCard` component. CSS handles scale/fade transitions. Motion One handles spring physics on the hover tooltip that follows the mouse.

**Tech Stack:** Qwik, Tailwind CSS v4, Motion One (via `useVisibleTask$`)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/routes/work/index.tsx` | Work index page with container padding, intro paragraph, project grid |
| Modify | `src/routes/work/[slug]/index.tsx` | Project detail page with title, URL badge, media gallery, related projects |
| Modify | `src/components/project-card.tsx` | Card component with `work` variant CSS matching Next.js |

---

## Phase 1: Work Index (`/work`)

### Task 1: Update Work Index Container and Grid

**Files:**
- Modify: `src/routes/work/index.tsx`

- [ ] **Step 1: Update container padding**

Change the main container from simple `px-3` to match Next.js `container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12`:

```tsx
<main class="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
```

- [ ] **Step 2: Update intro paragraph styling**

Current: `px-3 py-6` with basic text styling
Target: Match Next.js `text-[11px] text-stone-500 leading-[14px] tracking-[-0.24px]` inside a 12-col grid with col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6:

```tsx
<div class="grid grid-cols-12 mb-8">
  <p class="text-[#686868] text-[11px] leading-[14px] font-normal col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 tracking-[-0.24px]">
    We work closely with our collaborators to engineer premium web and design solutions.
    Below is a selection showcasing some of our most recent work.
  </p>
</div>
```

- [ ] **Step 3: Update grid to 3-column layout**

Current: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px]`
Keep same, but add `mt-[30px]` and `gap-y-10`:

```tsx
<div class="mt-[30px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[13px] gap-y-10">
```

- [ ] **Step 4: Add JSON-LD schema (optional, can skip for now)**

Skip this step — not critical for visual fidelity.

- [ ] **Step 5: Commit**

```bash
git add src/routes/work/index.tsx
git commit -m "feat(work): update work index layout to match Next.js"
```

---

### Task 2: Update ProjectCard for Work Variant

**Files:**
- Modify: `src/components/project-card.tsx`

- [ ] **Step 1: Review current work variant styles**

Current `work` variant in cardContent:
- `px-[50px] py-[60px]` for image container
- `object-contain group-hover:scale-[0.99] p-6` for image

These are already close. Check against Next.js source — the image container padding should be `px-[50px] py-[60px]` which matches.

- [ ] **Step 2: Verify card variants CSS**

The cardVariants cva for `work` is just `bg-stone-200` — no shadow on hover since it's not a hover card. Confirm this matches Next.js behavior where work variant cards do NOT have hover tooltips.

- [ ] **Step 3: Update image scale transition**

Verify CSS has `transition-transform duration-300 group-hover:scale-[0.99]` — already present in current code.

- [ ] **Step 4: Commit**

```bash
git add src/components/project-card.tsx
git commit -m "refactor(work): ensure project-card work variant matches Next.js"
```

---

## Phase 2: Work Detail (`/work/[slug]`)

### Task 3: Update Work Detail Page Layout

**Files:**
- Modify: `src/routes/work/[slug]/index.tsx`

- [ ] **Step 1: Update title styling**

Change from current `text-[30px]` to match Next.js `text-[28px] sm:text-[30px] leading-[1.1] tracking-[-0.48px] font-bold`:

```tsx
<h1 class="text-[28px] sm:text-[30px] leading-[1.1] tracking-[-0.48px] font-bold text-black mb-[12px]">
  {project.title}
</h1>
```

- [ ] **Step 2: Update URL badge styling**

Current uses `inline-block mt-[29px]` with link styling. Next.js uses:
- Badge: `inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[24px] px-[12px] items-center gap-2 w-fit`
- Text: `text-[11px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]`

```tsx
{project.url && (
  <a
    href={`https://${project.url}`}
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[24px] px-[12px] items-center gap-2 mb-[12px] w-fit"
  >
    <span class="text-[11px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
      {project.url}
    </span>
  </a>
)}
```

- [ ] **Step 3: Update description styling**

Current: `mt-[36px] font-[var(--twk-lausanne)] text-[14px]` 
Target: `text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-black mb-[32px] max-w-[315px] sm:max-w-[532px]`

```tsx
<p class="text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-black mb-[32px] max-w-[315px] sm:max-w-[532px]">
  {project.description}
</p>
```

- [ ] **Step 4: Add download button if applicable**

If `project.downloadUrl` exists, render download link with icon (no Lucide — use inline SVG):

```tsx
{project.downloadUrl && (
  <Link
    href={project.downloadUrl}
    download
    class="inline-flex bg-neutral-200 hover:bg-neutral-300 transition-colors rounded-[5px] h-[32px] px-[16px] items-center mb-[64px] gap-2"
  >
    <svg class="w-[14px] h-[14px] text-[#686868]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    <span class="text-[13px] leading-[16px] tracking-[-0.24px] font-normal text-[#686868]">
      Download Full Issue
    </span>
  </Link>
)}
```

- [ ] **Step 5: Update media gallery styling**

Current wraps each image in `flex flex-col gap-[90px]` inside a simple container. Next.js uses:
- Gallery wrapper: `bg-neutral-200 rounded-[5px] mb-[35.37px] md:mr-[15.3%]`
- Inner: `flex flex-col gap-[90px] md:px-[145px] md:max-w-none lg:max-w-[803px] lg:mx-auto lg:px-0 py-[78px]`

```tsx
{project.media && project.media.length > 0 && (
  <div class="bg-neutral-200 rounded-[5px] mb-[35.37px] md:mr-[15.3%]">
    <div class="flex flex-col gap-[90px] md:px-[145px] md:max-w-none lg:max-w-[803px] lg:mx-auto lg:px-0 py-[78px]">
      {project.media.map((mediaUrl, index) => (
        <a
          key={mediaUrl + index}
          href={project.url ? `https://${project.url}` : '#'}
          target="_blank"
          rel="noopener noreferrer"
          class="block"
        >
          <img
            src={mediaUrl}
            alt={`${project.title} - Image ${index + 1}`}
            class="w-full h-auto object-contain rounded-[5px] px-6"
            loading="lazy"
          />
        </a>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 6: Update related projects section**

Current uses simple flex scroll. Next.js wraps in:
- Header: `mb-[10.63px]` with `text-[13px] sm:text-[14px]`
- Container: `overflow-x-auto overflow-y-clip pb-[6px] mb-[57px] -mx-3 scrollbar-hide`
- Cards: `w-[320px] sm:w-[600px]`

```tsx
<div class="mb-[10.63px]">
  <h2 class="text-[13px] sm:text-[14px] leading-[18px] tracking-[-0.24px] font-normal text-[#686868]">
    Related Projects
  </h2>
</div>

<div class="overflow-x-auto overflow-y-clip pb-[6px] mb-[57px] -mx-3 scrollbar-hide">
  <div class="flex gap-[12px] px-3">
    {relatedProjects.map((related) => (
      <div key={related.id} class="flex-shrink-0 w-[320px] sm:w-[600px]">
        <ProjectCard
          title={related.title}
          slug={related.slug}
          image={related.image}
          description={related.description}
          variant="work"
          showText={true}
          sizes="(max-width: 640px) 320px, 600px"
        />
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 7: Update back link styling**

```tsx
<Link
  href="/work"
  class="inline-flex bg-neutral-200 rounded-[5px] h-[21px] px-[6px] items-center mb-[34.66px]"
>
  <span class="text-[10.3px] leading-[14px] tracking-[-0.24px] font-normal text-[#686868]">
    Back to Work
  </span>
</Link>
```

- [ ] **Step 8: Commit**

```bash
git add src/routes/work/[slug]/index.tsx
git commit -m "feat(work): update project detail page layout to match Next.js"
```

---

## Phase 3: Animation

### Task 4: Add CSS Transition Classes

**Files:**
- Modify: `src/global.css` (if needed for custom CSS)

- [ ] **Step 1: Add scrollbar hide utility**

Add to global.css if not present:

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 2: Verify transitions are in place**

The card already has `transition-transform duration-300 group-hover:scale-[0.99]`. Ensure this is working.

- [ ] **Step 3: Commit**

```bash
git add src/global.css
git commit -m "feat(work): add scrollbar-hide utility"
```

---

### Task 5: Add Motion One for Tooltip Spring

**Files:**
- Modify: `src/components/project-card.tsx`

- [ ] **Step 1: Verify motion package is installed**

`motion` is already in `dependencies` (v12.38.0 from package.json). Good.

- [ ] **Step 2: Add useVisibleTask$ import**

```tsx
import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
```

- [ ] **Step 3: Import animate from motion**

```tsx
import { animate } from "motion";
```

- [ ] **Step 4: Add spring animation via useVisibleTask$**

The tooltip should use spring animation to follow mouse with slight lag. Add after the tooltip element:

```tsx
useVisibleTask$(({ track }) => {
  track(() => mousePosition.value.x);
  track(() => mousePosition.value.y);

  const tooltip = document.querySelector('.hover-tooltip') as HTMLElement;
  if (tooltip && isHovered.value) {
    animate(
      tooltip,
      { x: mousePosition.value.x + 15, y: mousePosition.value.y + 15 },
      { type: 'spring', stiffness: 400, damping: 25 }
    );
  }
});
```

Note: This approach animates to the current mouse position with spring physics. May need refinement based on testing.

- [ ] **Step 5: Add aria-hidden to tooltip**

```tsx
<div
  class="fixed pointer-events-none z-50 rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5 hover-tooltip"
  aria-hidden="true"
  style={{
    transform: `translate(${mousePosition.value.x}px, ${mousePosition.value.y}px)`,
  }}
>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/project-card.tsx
git commit -m "feat(work): add Motion One spring animation to hover tooltip"
```

---

## Self-Review Checklist

1. **Spec coverage:** All spec requirements mapped to tasks? YES
   - Work index layout ✅ (Task 1)
   - Work detail layout ✅ (Task 3)
   - Card hover scale CSS ✅ (Task 2)
   - Tooltip spring animation ✅ (Task 5)
   - Responsive breakpoints ✅ (Tasks 1, 3)

2. **Placeholder scan:** No "TBD", "TODO", "fill in later" ✅

3. **Type consistency:** 
   - `ProjectCard` props match spec interface ✅
   - `slug` is optional on card (for broll variant external links) ✅
   - `showText` defaults to false ✅

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-work-port-plan.md`**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?