# Homepage Port: Next.js → Qwik Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all homepage animations from Next.js to Qwik: mobile nav stagger, hamburger rotate, desktop logo expand, and project card tooltip spring animation.

**Architecture:** Use Motion One library via `useVisibleTask$` for complex animations (stagger, spring). CSS transitions for simple animations (rotate, fade). All animations run client-only, preserving Qwik's resumability.

**Tech Stack:** Qwik, Motion One (`motion` package already in dependencies), Tailwind CSS v4

---

## File Mapping

| File | Responsibility |
|------|-----------------|
| `src/components/navigation.tsx` | Mobile stagger, hamburger rotate, desktop logo expand |
| `src/components/project-card.tsx` | Tooltip spring animation |
| `src/global.css` | No changes |

---

## Task 1: Navigation — Mobile Menu Stagger Animation

**Files:**
- Modify: `src/components/navigation.tsx`

**Changes needed:**
- Add ref for mobile menu container
- Add `useVisibleTask$` with Motion One `stagger()` to animate nav items when menu opens

**Implementation:**

In `src/components/navigation.tsx`, the mobile menu open state is controlled by `isOpen` signal. When `isOpen.value` becomes `true`, we need to animate nav items in with stagger.

The nav items are rendered as `<Link>` elements inside the conditional `{isOpen.value && (...)}` block.

We'll use a ref to target the container and Motion One to stagger the children.

---

**Steps:**

- [ ] **Step 1: Add `useRef` and ref attribute for mobile menu container**

In `navigation.tsx`, add `useRef<HTMLDivElement>()` for mobile menu container.

In the JSX, add `ref={mobileMenuRef}` to the div containing nav links (around line 163).

```tsx
const mobileMenuRef = useRef<HTMLDivElement>();

// In JSX, find the div that contains:
{isOpen.value && (
  <div ref={mobileMenuRef} className="flex items-center gap-1.5 flex-1">
```

- [ ] **Step 2: Add Motion One stagger animation via useVisibleTask$**

Import `animate` and `stagger` from `motion`:

```tsx
import { animate, stagger } from 'motion';
```

Add a `useVisibleTask$` that watches `isOpen.value` and animates the nav items when menu opens:

```tsx
useVisibleTask$(({ track }) => {
  const open = track(() => isOpen.value);

  if (open && mobileMenuRef.value) {
    const items = mobileMenuRef.value.querySelectorAll('.nav-item-mobile');
    if (items.length > 0) {
      animate(
        items,
        { opacity: [0, 1], x: [-10, 0] },
        {
          duration: 0.3,
          delay: stagger(0.1),
          easing: 'easeOut'
        }
      );
    }
  }
});
```

- [ ] **Step 3: Add `nav-item-mobile` class to mobile nav links**

On each mobile nav `<Link>` element, add `className="nav-item-mobile"` to the existing classes.

Find the mobile nav items (around lines 169-188) and add the class:

```tsx
<Link
  key={link.href}
  href={link.href}
  onClick$={() => (isOpen.value = false)}
  className="nav-item-mobile px-2 py-1 rounded-lg ..." // existing classes + nav-item-mobile
>
```

Also add to the whatsapp Link (around line 184).

- [ ] **Step 4: Test in browser**

Run `bun run dev`, open mobile viewport, open menu. Nav items should stagger in with 100ms delay.

---

## Task 2: Navigation — Hamburger/X Icon Rotate Animation

**Files:**
- Modify: `src/components/navigation.tsx`

**Changes needed:**
- Replace static SVG icons with Motion One animated versions
- Or use CSS transition for simpler approach

**Implementation:**

Since Motion One is being used for stagger, we can use CSS transition for the icon rotation (simpler, no library overhead for this simple effect).

- [ ] **Step 1: Add CSS class for icon rotation**

In `src/global.css`, add:

```css
@utility nav-icon-rotate {
  transition: transform 0.2s ease-out;
}
```

Or add directly in the JSX using style or className.

- [ ] **Step 2: Apply rotation transform to icon container**

In the hamburger/X button (around line 121-160), the icon is inside a parent. Add `transition-transform duration-200` to both the `<path>` SVGs and wrap them in a container that handles the rotation.

Actually, looking at the current code, the SVGs are static and swap on `isOpen.value`. We need them to rotate during the transition.

Simplest approach: wrap each icon in a div with a rotation class:

```tsx
<div className={`transition-transform duration-200 ${isOpen.value ? 'rotate-0' : 'rotate-0'}`}>
```

Wait - the hamburger icon doesn't need to rotate into X. The X icon itself is a different shape. The Next.js version uses `rotate: 90` and `rotate: -90` on the inner elements during transition.

Better approach: Use CSS for the inner paths, not a container rotation.

Add this to the existing SVG paths:

For hamburger (line 155-157):
```tsx
<line 
  x1="4" y1="6" x2="20" y2="6" 
  className={`transition-all duration-200 ${isOpen.value ? 'opacity-0 translate-y-[-2px]' : ''}`}
/>
<line x1="4" y1="12" x2="20" y2="12" className="transition-all duration-200" />
<line x1="4" y1="18" x2="20" y2="18" 
  className={`transition-all duration-200 ${isOpen.value ? 'opacity-0 translate-y-[2px]' : ''}`}
/>
```

For X icon (line 139-141):
```tsx
<path d="M18 6L6 18" className="transition-all duration-200" />
<path d="M6 6l12 12" className="transition-all duration-200" />
```

Actually, the simpler approach matching Next.js is to have two separate animated elements that crossfade:

In Next.js, the X and Menu icons rotate -90° and 90° during exit/enter.

Let's use CSS keyframe animation for the icon swap:

- [ ] **Step 1: Add CSS animation for icon crossfade in global.css**

```css
@keyframes iconFadeIn {
  from { opacity: 0; transform: rotate(-90deg); }
  to { opacity: 1; transform: rotate(0deg); }
}

.nav-icon-animate {
  animation: iconFadeIn 0.2s ease-out forwards;
}
```

- [ ] **Step 2: Apply class to icon wrappers**

For hamburger (line 142-159), wrap in div with class `nav-icon-animate`.
For X icon (line 127-141), wrap in div with class `nav-icon-animate`.

Add a key or conditional to trigger animation on open/close.

Actually, since the animation should run each time the icon changes, we can add a signal that increments on toggle and use it as a key.

```tsx
const iconKey = useSignal(0);

const handleToggle = $(() => {
  isOpen.value = !isOpen.value;
  iconKey.value++; // triggers re-animation
});
```

Then:
```tsx
{isOpen.value ? (
  <div key={iconKey.value} className="nav-icon-animate">
    <svg>...</svg>
  </div>
) : (
  <div key={iconKey.value} className="nav-icon-animate">
    <svg>...</svg>
  </div>
)}
```

---

## Task 3: Navigation — Desktop Logo Hover Expand (Loom Page)

**Files:**
- Modify: `src/components/navigation.tsx`
- Applies to: Loom page variant (`isLoomPage={true}`)

**Changes needed:**
- The logo section on desktop has a "other dev" text that slides out on hover
- Use Motion One width animation

**Implementation:**

The Loom page desktop nav has this structure (lines 196-209):
```tsx
<motion.div
  className="group flex items-center bg-transparent"
  whileHover="hover"
  initial="idle"
>
  <motion.div
    className="overflow-hidden"
    variants={{
      idle: { width: 0, opacity: 0, marginRight: 0 },
      hover: { width: 'auto', opacity: 1, marginRight: 6 },
    }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    <Button variant="nav" size="nav-default" onClick={() => router.push('/')}>
      other dev
    </Button>
  </motion.div>
  {/* Logo icon */}
</motion.div>
```

In Qwik, we need to simulate this with a hover handler + Motion One:

- [ ] **Step 1: Add isHovered signal for desktop logo section**

```tsx
const isLogoHovered = useSignal(false);
```

- [ ] **Step 2: Add mouse enter/leave handlers to the container div**

Around line 196, add onMouseEnter$ and onMouseLeave$ to the flex container:

```tsx
<div 
  className="group flex items-center bg-transparent"
  onMouseEnter$={() => (isLogoHovered.value = true)}
  onMouseLeave$={() => (isLogoHovered.value = false)}
>
```

- [ ] **Step 3: Add Motion One animation in useVisibleTask$**

```tsx
useVisibleTask$(({ track }) => {
  track(() => isLogoHovered.value);
  
  const textEl = document.querySelector('.logo-expand-text') as HTMLElement;
  if (textEl) {
    if (isLogoHovered.value) {
      animate(textEl, { width: ['0px', 'auto'], opacity: [0, 1], marginRight: [0, 6] }, {
        duration: 0.2,
        easing: 'easeOut'
      });
    } else {
      animate(textEl, { width: ['auto', '0px'], opacity: [1, 0], marginRight: [6, 0] }, {
        duration: 0.2,
        easing: 'easeOut'
      });
    }
  }
});
```

- [ ] **Step 4: Apply class to the "other dev" text element**

Around line 198-200, add `className="logo-expand-text overflow-hidden"` to the Button wrapper div.

```tsx
<div className="logo-expand-text overflow-hidden">
  <Button
    variant="nav"
    size="nav-default"
    onClick$={() => router.push('/')}
    className={cn(
      'cursor-pointer whitespace-nowrap ' +
        (pathname === '/' ? 'text-foreground' : '')
    )}
  >
    other dev
  </Button>
</div>
```

- [ ] **Step 5: Hide icon when text is visible (match Next.js behavior)**

In Next.js, the icon fades out when the text appears. Add conditional rendering:

```tsx
{/* Icon - hidden when hovering and text is expanded */}
{!isLogoHovered.value && (
  <Link href="/" data-slot="nav-item">
    <img src="/otherdev-chat-logo-32.webp" ... />
  </Link>
)}
```

---

## Task 4: ProjectCard — Tooltip Spring Animation

**Files:**
- Modify: `src/components/project-card.tsx`

**Changes needed:**
- Replace current tooltip with Motion One spring animation
- Current implementation uses `isHovered.value` + fixed positioning

**Implementation:**

Current tooltip (lines 83-95):
```tsx
{isHovered.value && (
  <div
    className="fixed pointer-events-none z-50 rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5"
    style={{
      left: `${mousePosition.value.x + 15}px`,
      top: `${mousePosition.value.y + 15}px`,
    }}
  >
    <p className="text-[#686868] text-[11px] font-normal leading-[14px] whitespace-nowrap">
      {title}
    </p>
  </div>
)}
```

We need to animate this with Motion One spring on appear/disappear.

- [ ] **Step 1: Import animate from motion**

```tsx
import { animate } from 'motion';
```

- [ ] **Step 2: Add useVisibleTask$ for tooltip animation**

Current code has hover handlers (`onMouseEnter$`, `onMouseLeave$`) but no animation. We need to add a useVisibleTask$ that watches `isHovered` and triggers the animation.

```tsx
const tooltipRef = useSignal<HTMLDivElement>();

useVisibleTask$(({ track }) => {
  const hovered = track(() => isHovered.value);
  
  if (tooltipRef.value) {
    if (hovered) {
      animate(tooltipRef.value, 
        { opacity: [0, 1], scale: [0.8, 1] },
        { type: 'spring', stiffness: 400, damping: 25 }
      );
    }
  }
});
```

- [ ] **Step 3: Add ref to tooltip element**

```tsx
{isHovered.value && (
  <div
    ref={tooltipRef}
    className="fixed pointer-events-none z-50 rounded-md backdrop-blur-sm bg-stone-200/70 px-3 py-1.5"
    style={{
      left: `${mousePosition.value.x + 15}px`,
      top: `${mousePosition.value.y + 15}px`,
    }}
  >
```

---

## Self-Review Checklist

- [ ] Spec coverage: Mobile stagger → Task 1, Hamburger rotate → Task 2, Logo expand → Task 3, Tooltip spring → Task 4
- [ ] No placeholders: All steps have actual code, file paths, and expected behavior
- [ ] Type consistency: `useSignal`, `useVisibleTask$`, `animate`, `stagger` all used consistently
- [ ] File paths match existing structure
- [ ] Task dependencies: None (tasks can be done in any order)

**Plan complete and saved to `docs/superpowers/plans/2026-04-22-qwik-homepage-port-plan.md`**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?