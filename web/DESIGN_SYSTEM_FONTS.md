# Design System Font Reference

> This document maps Figma DS builds (which use Inter for preview) to the project's actual production fonts (TWK Lausanne & QueensCompressed). When implementing from DS frames to code, reference this guide.

---

## Font Mapping

| DS Preview Font | Project Font | CSS Variable | Usage |
|-----------------|--------------|--------------|-------|
| Inter Light | TWK Lausanne | `--twk-lausanne` | Body text, descriptions, labels |
| Inter Regular | TWK Lausanne | `--twk-lausanne` | Paragraphs, navigation, social links |
| Inter Medium | TWK Lausanne | `--twk-lausanne` | Button text, emphasized body |
| Inter Bold | QueensCompressed | `--queens-compressed` | Headings H1 |

---

## Typography Scale

### H1 - Project Title / Page Title
```css
font-family: var(--queens-compressed);
font-weight: 100;        /* QueensCompressed W-Thin */
font-size: 30px;
line-height: 33px;
letter-spacing: -0.48px;
```
**Used in:** Project detail header title

### Body / Paragraph Text
```css
font-family: var(--twk-lausanne);
font-weight: 400;       /* TWK Lausanne Regular */
font-size: 14px;
line-height: 18px;
letter-spacing: -0.24px;
```
**Used in:** Project descriptions, about text

### Small Text / Labels
```css
font-family: var(--twk-lausanne);
font-weight: 400;
font-size: 12px;
line-height: 18px;
letter-spacing: -0.24px;
```
**Used in:** Navigation links, social links, timestamps

### Caption / Meta Text
```css
font-family: var(--twk-lausanne);
font-weight: 400;
font-size: 11px;
line-height: 14px;
letter-spacing: -0.24px;
```
**Used in:** Project card titles, client names, copyright

### Tiny Text
```css
font-family: var(--twk-lausanne);
font-weight: 400;
font-size: 10px;
line-height: 14px;
letter-spacing: -0.24px;
```
**Used in:** Small buttons, metadata

---

## Color Palette

| CSS Class | Hex | Usage |
|-----------|-----|-------|
| text-stone-400 | #79716b | Secondary text, navigation (inactive) |
| text-stone-500 | #6b6560 | Icons, subtle text |
| text-gray | #686868 | Descriptions, captions |
| text-black | #0c0a09 | Primary headings, titles |
| bg-stone-200 | #e7e5e4 | Card backgrounds, image placeholders |
| bg-gray-100 | #e5e5e5 | Social link backgrounds |
| bg-gray-50 | #f5f5f4 | Input backgrounds |
| bg-white | #ffffff | Cards, input fields |
| border-stone-200 | #e7e5e4 | Card borders, dividers |

---

## Font File Locations

```
public/fonts/
├── TWKLausanne/
│   ├── TWKLausanne-200 (1).woff2    → weight 200 (Extra Light)
│   ├── TWKLausanne-300-1.woff2       → weight 300 (Light)
│   └── TWKLausanne-400.woff2        → weight 400 (Regular)
│
└── QueensCompressed/
    ├── QueensCompressed_W-Thin.woff2  → weight 100 (Thin)
    └── QueensCompressed_W-Light.woff2 → weight 300 (Light)
```

---

## Component Font Usage

### Navigation
- Links: `TWK Lausanne Regular`, 12px, stone-400
- Active link: `TWK Lausanne Regular`, 12px, **stone-900** (#0c0a09)

### Project Cards
- Title: `TWK Lausanne Regular`, 11.4px, **black**
- Description: `TWK Lausanne Regular`, 11.1px, **gray** (#686868)

### Footer
- Heading: `TWK Lausanne Regular`, 11px, **gray**
- Social links: `TWK Lausanne Regular`, 10px, **gray**, pill background
- Copyright: `TWK Lausanne Regular`, 11px, **gray**

### AI Chat (Loom Page)
- Heading: `TWK Lausanne Regular`, 16px, **stone-400**
- Suggestion text: `TWK Lausanne Medium`, 14px, **black**
- Input placeholder: `TWK Lausanne Regular`, 14px, **stone-400**

---

## Installation for Figma Preview

To see actual fonts in Figma DS builds (optional):

**Windows:**
1. Navigate to `public/fonts/TWKLausanne/`
2. Right-click `TWKLausanne-400.woff2` → "Install for all users"
3. Repeat for `QueensCompressed_W-Thin.woff2`
4. Restart Figma desktop app

**After installation, DS frames will render with correct fonts.**

---

## Quick Reference: DS Frame → Code

| DS Frame | Code Component | Font |
|----------|----------------|------|
| Navigation | `navigation.tsx` | `var(--twk-lausanne)` |
| Project Card | `project-card.tsx` | `var(--twk-lausanne)` |
| Footer | `footer.tsx` | `var(--twk-lausanne)` |
| Chat Widget | `chat-widget.tsx` | `var(--twk-lausanne)` |
| Page Title | `page.tsx` | `var(--queens-compressed)` |
