# About Page Qwik Port — Design Spec

**Date:** 2026-04-22
**Status:** Draft
**Source:** Next.js `/web/src/app/about/page.tsx`

---

## 1. Overview

Port the Next.js about page to Qwik with exact content/structure parity and Qwik-native animations. No Framer Motion — CSS + Qwik signals only.

---

## 2. Content Specification

### 2.1 Hero Image
- **Mobile** (`< 640px`): `/images/about-page/about-team-combined.webp`
- **Desktop** (`>= 640px`): `/images/about-page/about-team-combined-desktop.webp`
- **Aspect ratio:** 9/4
- **Border radius:** 5px
- **Object fit:** cover, object-position: center
- **Background:** `bg-stone-200`

### 2.2 About Section
```
Label: "About" (stone-400, 11px)
Content: "Other Dev produces digital platforms for pioneering creatives. Based in Karachi City,
we are a full-service web development and design studio specializing in the fashion
and design fields, with a focus on bringing ideas to life through thoughtful design.
Our team consists of Kabeer Jaffri and Ossaid Qadri, who met while studying at Habib
Public School."
```

### 2.3 Clients Grid
| Viewport | Columns | Gap |
|----------|---------|-----|
| Mobile | 2 | 12px horizontal, 6px vertical |
| Tablet+ | 3 | 12px horizontal, 6px vertical |

**Client list (desktop — shown `sm:+`):**
```
Narkins Builders | Groovy Pakistan | Olly Shinder
Bin Yousuf Group | Parcheh81 | Tiny Footprint Coffee
Lexa | Finlit | Ek Qadam Aur
Wish Apparels | Kiswa Noir | BLVD
CLTRD Legacy
```

**Client list (mobile — hidden `sm:+`):**
```
Narkins Builders | Parcheh81
Bin Yousuf Group | Tiny Footprint Coffee
Lexa | Ek Qadam Aur
Olly Shinder | Groovy Pakistan
Wish Apparels | Finlit
Kiswa Noir | BLVD
CLTRD Legacy
```

### 2.4 Footer Social Links
- Instagram: `https://instagram.com/other.dev`
- LinkedIn: `https://linkedin.com/company/theotherdev/`
- WhatsApp: `https://wa.me/923156893331?text=Hi!%20I%20found%20you%20through%20otherdev.com%20and%20would%20love%20to%20discuss%20a%20project.`

---

## 3. Layout Specification

### 3.1 Grid System
```
Hero:  col-span-12 → sm:col-span-10
About: col-span-7 → sm:col-span-8 → md:col-span-7 → lg:col-span-6 → xl:col-span-5
Clients: col-span-12 → sm:col-span-8 → md:col-span-7 → lg:col-span-6
```

### 3.2 Spacing
- Container: `px-3`, `pt-[72px]`, `pb-12`
- Section gaps: `mt-[30px]`
- Grid gaps: `gap-[12px]` (desktop), `gap-[6px]` (about section)
- Container max-width: `1440px`

---

## 4. Animation Specification

### 4.1 Navigation Animations

#### Mobile Menu Open/Close
```css
/* Menu container */
.menu-open {
  animation: slideInRight 0.3s ease-out forwards;
}

/* Nav items stagger */
.nav-item-1 { animation-delay: 0.1s; }
.nav-item-2 { animation-delay: 0.2s; }
.nav-item-3 { animation-delay: 0.25s; }
.nav-item-4 { animation-delay: 0.26s; }
.nav-item-5 { animation-delay: 0.32s; }

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
```

#### Hamburger/X Toggle
```css
/* X icon rotation on open */
.icon-x {
  animation: rotateIn 0.2s ease-out forwards;
}

/* Menu icon rotation on close */
.icon-menu {
  animation: rotateOut 0.2s ease-out forwards;
}

@keyframes rotateIn {
  from { opacity: 0; transform: rotate(-90deg); }
  to { opacity: 1; transform: rotate(0deg); }
}
```

### 4.2 Page Content Animations

#### Hero Image (on load)
```css
.hero-image {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

#### About Section (scroll-triggered)
```css
.about-reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}

.about-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

#### Clients Grid (staggered)
```css
.client-item {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
}

.client-item:nth-child(1) { transition-delay: 0.05s; }
.client-item:nth-child(2) { transition-delay: 0.1s; }
.client-item:nth-child(3) { transition-delay: 0.15s; }
/* ... and so on */

.client-item.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 4.3 Footer Micro-interactions
```css
.social-link {
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.social-link:hover {
  background-color: oklch(0.9 0 0); /* neutral-300 */
  transform: scale(1.05);
}
```

---

## 5. Animation Trigger Mechanism

### 5.1 useVisibleTask$ Strategy
```typescript
// Scroll-triggered reveals using Intersection Observer
useVisibleTask$(({ cleanup }) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Only trigger once
        }
      });
    },
    { threshold: 0.1 }
  );

  // Observe all animated elements
  document.querySelectorAll('.about-reveal, .client-item').forEach((el) => {
    observer.observe(el);
  });

  cleanup(() => observer.disconnect());
});
```

### 5.2 Menu State (useSignal)
```typescript
const isMenuOpen = useSignal(false);

return (
  <nav onClick$={() => (isMenuOpen.value = !isMenuOpen.value)}>
    {isMenuOpen.value ? <XIcon /> : <MenuIcon />}
  </nav>
);
```

---

## 6. Component Structure

```
src/
├── routes/
│   └── about/
│       └── index.tsx          # Main about page
├── components/
│   ├── navigation.tsx         # Add Qwik-native animations
│   └── footer.tsx             # Add hover micro-interactions
└── global.css                 # Animation keyframes
```

---

## 7. Verification Checklist

- [ ] Mobile (`< 640px`): Combined image, 2-col clients, hamburger menu
- [ ] Tablet (`640px - 1024px`): Desktop image, 3-col clients
- [ ] Desktop (`> 1024px`): Full grid layout
- [ ] Navigation: Menu animates open/close, icons rotate
- [ ] Hero: Fades in on page load
- [ ] About/Clients: Reveal on scroll
- [ ] Social links: Hover micro-interaction
- [ ] No Framer Motion or React-specific code

---

## 8. Font Specification (from DESIGN_SYSTEM_FONTS.md)

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Section labels | TWK Lausanne | 11px | 400 | #686868 |
| Body text | TWK Lausanne | 12px | 400 | black |
| Social links | TWK Lausanne | 10px | 400 | #686868 |

---

## 9. Implementation Order

1. Update `navigation.tsx` — Add mobile menu animations
2. Update `about/index.tsx` — Add hero fade-in + scroll reveals
3. Update `footer.tsx` — Add hover micro-interactions
4. Update `global.css` — Add keyframes
5. Test responsive breakpoints
6. Verify visual parity with Next.js