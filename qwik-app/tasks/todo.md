# About Page Qwik Port — Implementation Plan

## Context
Port the Next.js about page (`/web/src/app/about/page.tsx`) to Qwik (`/qwik-app/src/routes/about/index.tsx`) with:
- Match exact layout, content, responsive behavior
- Add Qwik-native animations (no Framer Motion)
- Use `useVisibleTask$` + CSS for scroll-triggered reveals

## Spec Source
- **Next.js version**: `D:\work\otherdev-web-v2\web\src\app\about\page.tsx`
- **Qwik current**: `D:\work\otherdev-web-v2\qwik-app\src\routes\about\index.tsx`
- **Design tokens**: `DESIGN_SYSTEM_FONTS.md`

---

## Tasks

- [ ] **1. Create detailed spec** — Write to `docs/superpowers/specs/YYYY-MM-DD-about-page-qwik-port.md`

- [ ] **2. Update Navigation component** — Add Qwik-native animations matching Next.js Framer Motion:
  - Mobile menu: slide-in + staggered nav items
  - Hamburger/X: rotate on toggle
  - Desktop: hover expand effects

- [ ] **3. Implement About page** — Exact content match with scroll-triggered animations:
  - Hero: fade-in on load
  - About section: fade-up on scroll into view
  - Clients: staggered grid reveal

- [ ] **4. Add Footer animations** — Social link hover micro-interactions

- [ ] **5. Test responsive** — Verify mobile/tablet/desktop layouts match Next.js

- [ ] **6. Review and verify** — Compare visual output with web dir

---

## Animation Mapping (Framer Motion → Qwik)

| Next.js (Framer Motion) | Qwik Alternative |
|--------------------------|------------------|
| `AnimatePresence` + `motion.div` | `useSignal` boolean + CSS class toggle |
| `initial={{ opacity: 0 }}` | CSS `@keyframes` + `.animate` class |
| `transition={{ delay: 0.1 }}` | CSS `animation-delay` |
| `whileHover="hover"` | CSS `:hover` pseudo-class |
| `usePathname()` active state | Qwik City `useLocation()` |

---

## Content to Port
```
- Hero image (mobile: combined.webp, desktop: combined-desktop.webp)
- About section: "Other Dev produces digital platforms..."
- Clients grid (desktop 3-col, mobile 2-col)
- Footer social links (Instagram, LinkedIn, WhatsApp)
```

---

## Verification
- Run `bun run dev` and compare `/about` with Next.js output
- Check responsive breakpoints at 640px, 768px, 1024px
- Verify images load correctly for each viewport