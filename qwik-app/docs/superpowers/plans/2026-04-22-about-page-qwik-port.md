# About Page Qwik Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port Next.js about page to Qwik with exact layout/content parity and Qwik-native animations (CSS + useVisibleTask$)

**Architecture:** CSS-only animations with Qwik signals for state, useVisibleTask$ for scroll-triggered reveals via Intersection Observer. No Framer Motion.

**Tech Stack:** Qwik, Tailwind CSS v4, useSignal, useVisibleTask$

---

## File Structure

```
src/
├── routes/about/index.tsx     # Main about page - add animations
├── components/navigation.tsx # Add mobile menu animations
├── components/footer.tsx     # Add hover micro-interactions
└── global.css                 # Add animation keyframes
```

---

## Task 1: Update navigation.tsx

**Files:**
- Modify: `src/components/navigation.tsx`
- Reference: `src/routes/about/index.tsx` (Qwik patterns)

- [ ] **Step 1: Read current navigation component**

Run: `Read src/components/navigation.tsx`
Verify: Understand current structure (useSignal, component$, Link usage)

- [ ] **Step 2: Add CSS animation keyframes to global.css**

Run: `Read src/global.css`
Add after existing content:
```css
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rotateIn {
  from { opacity: 0; transform: rotate(-90deg); }
  to { opacity: 1; transform: rotate(0deg); }
}

@keyframes rotateOut {
  from { opacity: 0; transform: rotate(90deg); }
  to { opacity: 1; transform: rotate(0deg); }
}
```

- [ ] **Step 3: Add mobile menu animation classes to global.css**

Add:
```css
.nav-item-animated {
  opacity: 0;
  animation: slideInRight 0.3s ease-out forwards;
}

.nav-item-1 { animation-delay: 0.1s; }
.nav-item-2 { animation-delay: 0.2s; }
.nav-item-3 { animation-delay: 0.25s; }
.nav-item-4 { animation-delay: 0.26s; }
.nav-item-5 { animation-delay: 0.32s; }

.icon-animated {
  display: inline-block;
}

.icon-x {
  animation: rotateIn 0.2s ease-out forwards;
}

.icon-menu {
  animation: rotateOut 0.2s ease-out forwards;
}
```

- [ ] **Step 4: Update navigation.tsx mobile menu**

Modify the mobile menu section to use animated classes:

Current pattern (Framer Motion):
```tsx
<motion.div
  key="menu-open"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1, duration: 0.3 }}
  >
```

Replace with Qwik signal-based CSS:
```tsx
// In component:
const isMenuOpen = useSignal(false);
const menuItems = ['work', 'about', 'ai', 'ads', 'whatsapp'];

// In JSX - menu container:
<div
  class={`flex items-center gap-1.5 flex-1 ${isMenuOpen.value ? 'menu-open' : ''}`}
>
  {menuItems.map((item, index) => (
    <div
      key={item}
      class={`nav-item-animated nav-item-${index + 1}`}
    >
      {/* Nav button */}
    </div>
  ))}
</div>
```

- [ ] **Step 5: Update hamburger/X icon toggle**

Replace Framer Motion AnimatePresence with CSS classes:

```tsx
// Icon toggle
<button
  onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}
  class="relative w-4 h-4"
>
  {isMenuOpen.value ? (
    <span class="icon-animated icon-x">
      <X size={16} strokeWidth={1.5} />
    </span>
  ) : (
    <span class="icon-animated icon-menu">
      <Menu size={16} strokeWidth={1.5} />
    </span>
  )}
</button>
```

- [ ] **Step 6: Test mobile menu**

Run: `bun run dev`
Navigate: http://localhost:5173/about
Check: Mobile menu opens with slide-in animation, icon rotates between menu/X

- [ ] **Step 7: Commit**

```bash
git add src/components/navigation.tsx src/global.css
git commit -m "feat: add Qwik-native mobile menu animations to navigation"
```

---

## Task 2: Update about page with hero fade-in

**Files:**
- Modify: `src/routes/about/index.tsx`
- Add: Animation styles to `src/global.css`

- [ ] **Step 1: Read current about page**

Run: `Read src/routes/about/index.tsx`
Verify: Understand current structure (component$, useSignal, JSX layout)

- [ ] **Step 2: Add hero animation styles**

Add to `src/global.css`:
```css
.hero-container {
  opacity: 0;
  animation: fadeIn 0.5s ease-out forwards;
  animation-delay: 0.1s;
}
```

- [ ] **Step 3: Add useVisibleTask$ for hero animation trigger**

Update about page:
```tsx
import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

export default component$(() => {
  const heroRef = useSignal<HTMLDivElement>();

  useVisibleTask$(() => {
    // Trigger hero fade-in on mount
    const hero = heroRef.value;
    if (hero) {
      hero.classList.add('hero-container');
    }
  });

  return (
    <main class="min-h-screen bg-neutral-50">
      {/* Hero Image */}
      <div ref={heroRef} class="container mx-auto px-3 pt-[72px] pb-12 max-w-[1440px]">
        <div class="grid grid-cols-12 gap-[12px]">
          {/* ... existing image code ... */}
        </div>
      </div>
    </main>
  );
});
```

- [ ] **Step 4: Verify hero loads with fade-in**

Run: `bun run dev`
Navigate: http://localhost:5173/about
Check: Hero image fades in on page load

- [ ] **Step 5: Commit**

```bash
git add src/routes/about/index.tsx src/global.css
git commit -m "feat: add hero fade-in animation to about page"
```

---

## Task 3: Add scroll-triggered reveals for about/clients sections

**Files:**
- Modify: `src/routes/about/index.tsx`
- Add: Scroll animation styles to `src/global.css`

- [ ] **Step 1: Add scroll reveal styles to global.css**

```css
/* Scroll-triggered reveal base */
.reveal-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.reveal-on-scroll.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Staggered client grid items */
.client-item {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
}

.client-item.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for client items */
.client-item:nth-child(1) { transition-delay: 0.05s; }
.client-item:nth-child(2) { transition-delay: 0.1s; }
.client-item:nth-child(3) { transition-delay: 0.15s; }
.client-item:nth-child(4) { transition-delay: 0.2s; }
.client-item:nth-child(5) { transition-delay: 0.25s; }
.client-item:nth-child(6) { transition-delay: 0.3s; }
.client-item:nth-child(7) { transition-delay: 0.35s; }
.client-item:nth-child(8) { transition-delay: 0.4s; }
.client-item:nth-child(9) { transition-delay: 0.45s; }
.client-item:nth-child(10) { transition-delay: 0.5s; }
.client-item:nth-child(11) { transition-delay: 0.55s; }
.client-item:nth-child(12) { transition-delay: 0.6s; }
.client-item:nth-child(13) { transition-delay: 0.65s; }
```

- [ ] **Step 2: Add Intersection Observer setup to about page**

Update the component:
```tsx
// Add useVisibleTask$ for scroll reveal
useVisibleTask$(({ cleanup }) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.reveal-on-scroll, .client-item').forEach((el) => {
    observer.observe(el);
  });

  cleanup(() => observer.disconnect());
});
```

- [ ] **Step 3: Apply reveal classes to about section**

Update the JSX:
```tsx
{/* About Section */}
<div class="mt-[30px] grid grid-cols-8 sm:grid-cols-12 gap-[6px] sm:gap-[12px] reveal-on-scroll">
  <div class="col-span-7 sm:col-span-8 md:col-span-7 lg:col-span-6 xl:col-span-5">
    {/* ... existing content ... */}
  </div>
</div>

{/* Clients Section */}
<div class="mt-[30px] grid grid-cols-12 gap-[12px] reveal-on-scroll">
  <div class="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
    {/* Client items with .client-item class */}
    <div class="mt-[9px] grid grid-cols-2 sm:grid-cols-3 gap-[12px] gap-y-[6px]">
      {clientsDesktop.map((row, rowIndex) =>
        row.map((client, colIndex) => (
          <p
            key={`desktop-${rowIndex}-${colIndex}`}
            class="hidden sm:block client-item"
          >
            {client}
          </p>
        ))
      )}
      {/* Mobile clients */}
      {clientsMobile.map((row, rowIndex) =>
        row.map((client, colIndex) => (
          <p
            key={`mobile-${rowIndex}-${colIndex}`}
            class="sm:hidden client-item"
          >
            {client}
          </p>
        ))
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 4: Verify scroll reveals work**

Run: `bun run dev`
Navigate: http://localhost:5173/about
Check: Scroll down — about and clients sections fade in as they enter viewport

- [ ] **Step 5: Commit**

```bash
git add src/routes/about/index.tsx src/global.css
git commit -m "feat: add scroll-triggered reveals to about page sections"
```

---

## Task 4: Add footer hover micro-interactions

**Files:**
- Modify: `src/components/footer.tsx`
- Add: Hover styles to `src/global.css`

- [ ] **Step 1: Read current footer component**

Run: `Read src/components/footer.tsx`

- [ ] **Step 2: Add social link hover styles to global.css**

```css
.social-link {
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.social-link:hover {
  background-color: var(--color-stone-300, oklch(0.9 0 0));
  transform: scale(1.05);
}
```

- [ ] **Step 3: Apply social-link class to footer links**

Update footer.tsx:
```tsx
<Link
  href="https://instagram.com/other.dev"
  class="h-[21px] px-1.5 bg-neutral-200 rounded-md flex items-center justify-center text-[#686868] text-[10px] font-twk font-normal leading-[14px] tracking-[-0.24px] hover:bg-neutral-300 transition-colors social-link"
>
  Instagram
</Link>
```

Apply same to LinkedIn and WhatsApp links.

- [ ] **Step 4: Verify hover interactions**

Run: `bun run dev`
Navigate: http://localhost:5173/about
Check: Hover over social links — background changes, slight scale up

- [ ] **Step 5: Commit**

```bash
git add src/components/footer.tsx src/global.css
git commit -m "feat: add hover micro-interactions to footer social links"
```

---

## Task 5: Final verification and responsive testing

**Files:**
- Verify: All modified files

- [ ] **Step 1: Run full build check**

Run: `bun run build.types`
Expected: No TypeScript errors

- [ ] **Step 2: Test responsive breakpoints**

Run: `bun run dev`
Open browser dev tools, test at:
- Mobile: 375px width — combined image, 2-col clients, hamburger menu
- Tablet: 768px width — desktop image, 3-col clients
- Desktop: 1440px width — full layout as designed

- [ ] **Step 3: Visual comparison with Next.js**

Compare: `/about` page in Qwik app vs Next.js app
Check:
- [ ] Hero image displays correctly
- [ ] About text renders properly
- [ ] Clients grid matches layout
- [ ] Social links functional
- [ ] Animations smooth and trigger correctly

- [ ] **Step 4: Run lint check**

Run: `bun run lint`
Expected: No lint errors

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete about page Qwik port with animations"
```

---

## Summary

| Task | Files Modified | Key Changes |
|------|----------------|--------------|
| 1 | navigation.tsx, global.css | Mobile menu slide-in, icon rotation |
| 2 | about/index.tsx, global.css | Hero fade-in on load |
| 3 | about/index.tsx, global.css | Scroll-triggered section reveals |
| 4 | footer.tsx, global.css | Social link hover micro-interactions |
| 5 | All | Responsive testing, final verification |

---

## Verification Checklist

- [ ] Mobile (`< 640px`): Combined image, 2-col clients, hamburger menu animates
- [ ] Tablet (`640px - 1024px`): Desktop image, 3-col clients
- [ ] Desktop (`> 1024px`): Full grid layout
- [ ] Navigation: Menu opens with slide-in + staggered items, icons rotate
- [ ] Hero: Fades in on page load
- [ ] About/Clients: Reveal on scroll into view
- [ ] Social links: Hover micro-interaction (scale + bg change)
- [ ] No Framer Motion or React-specific code
- [ ] `bun run build.types` passes
- [ ] `bun run lint` passes

---

**Plan complete and saved to** `docs/superpowers/plans/2026-04-22-about-page-qwik-port.md`

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**