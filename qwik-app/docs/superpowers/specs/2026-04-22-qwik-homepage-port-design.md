# Homepage Port: Next.js → Qwik
**Date:** 2026-04-22
**Status:** Draft

## Overview

Port the Next.js homepage to Qwik with identical behavior: no entrance animations, hover interactions only, nav transitions via Motion One library.

---

## 1. Navigation Component

### Mobile Menu

| Behavior | Implementation |
|----------|---------------|
| Menu backdrop blur | Already implemented — keep `backdrop-blur-lg` |
| Menu open/close fade | `AnimatePresence` → conditional rendering with CSS `opacity` transition (200ms) |
| Nav items stagger in | Motion One `stagger()` with 100ms delay between items |
| Hamburger ↔ X icon rotate | CSS `rotate` transition, 200ms |
| State persistence | `useSignal` + `sessionStorage` (already implemented) |

### Desktop (Loom Page Only)

| Behavior | Implementation |
|----------|---------------|
| Logo hover expand | Motion One width 0→auto + opacity 0→1, 200ms ease-out |
| Logo icon swap | Motion One opacity crossfade |

### Nav Items Animation Config

```typescript
const staggerDelay = 0.1 // 100ms between items
const itemTransition = { duration: 0.3, ease: 'easeOut' }
```

---

## 2. ProjectCard Hover Tooltip

Already implemented in current Qwik version — matches Next.js exactly.

**Tooltip animation:** Motion One spring (stiffness: 400, damping: 25), scale 0.8→1 + opacity 0→1.

---

## 3. What Stays Static

- Hero paragraph: no animation
- Project grid: no stagger entrance
- Footer links: no animation

---

## 4. Technical Approach

### Animation Library
- **Motion One** (`motion` package) for:
  - Mobile nav item stagger
  - Tooltip spring animation
  - Logo hover expand

### CSS Transitions
- Hamburger/X icon rotate (simple, no library needed)
- Menu backdrop fade (simple, no library needed)

### Key Qwik Patterns

```typescript
// Mobile nav items stagger — in useVisibleTask$
useVisibleTask$(() => {
  const items = containerRef.querySelectorAll('.nav-item')
  animate(items, { opacity: [0, 1], x: [-10, 0] }, {
    duration: 0.3,
    delay: stagger(0.1),
    easing: 'easeOut'
  })
})

// Tooltip — already in Qwik, no change needed
// Logo expand — Motion One width animation
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/navigation.tsx` | Mobile menu: add Motion stagger for nav items. Desktop (Loom): add logo hover expand animation |
| `src/components/project-card.tsx` | Replace existing tooltip animation with Motion One spring |
| `src/global.css` | No changes expected |
| `src/routes/index.tsx` | No changes (static) |

---

## 5. Constraints

- **No Next.js dependencies** — all code must be Qwik-native
- **Resumability** — animations run in `useVisibleTask$` (browser-only), never block SSR
- **Minimal JS** — use CSS for simple transitions, Motion for complex sequences
- **Same visual output** — pixel-match to Next.js behavior

---

## 6. Testing Checklist

- [ ] Mobile menu opens/closes with fade
- [ ] Nav items stagger in on mobile menu open
- [ ] Hamburger ↔ X rotates on toggle
- [ ] Project card hover shows tooltip with spring animation
- [ ] Desktop Loom page logo expands on hover
- [ ] No console errors
- [ ] Works on mobile (320px+), tablet (768px+), desktop (1024px+)