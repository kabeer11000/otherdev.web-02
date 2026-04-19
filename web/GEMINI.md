# GEMINI.md

This file provides guidance to Google's Gemini when working with code in this repository.

## Quick Start

### Common Commands

Run these from the `web/` directory:

```bash
bun install          # Install dependencies
bun dev              # Start dev server at http://localhost:3000
bun build            # Create production build
bun start            # Start production server
bun lint             # Run Biome linter
bun format           # Auto-format code with Biome
```

## Project Overview

**otherdev** is a modern portfolio and agency website built with Next.js 16, React 19, and TypeScript. It showcases web development and design work across various industries including fashion, design, real estate, e-commerce, and SaaS.

The project uses:
- **Next.js 16** with App Router for file-based routing
- **tRPC + React Query** for type-safe API calls
- **Radix UI** for accessible component primitives
- **Tailwind CSS 4** for styling
- **Zod** for schema validation
- **Framer Motion** for animations
- **Biome** for code formatting and linting
- **React Compiler** enabled for automatic optimization

## Architecture

### Directory Structure

```
src/
├── app/                           # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Homepage
│   ├── about/page.tsx            # About page
│   ├── work/page.tsx             # Work showcase listing
│   ├── work/[slug]/page.tsx      # Individual project page
│   ├── blog/page.tsx             # Blog listing
│   ├── blog/[slug]/page.tsx      # Individual blog post
│   └── api/trpc/[trpc]/route.ts  # tRPC API endpoint
├── components/
│   ├── ui/                        # Radix UI component wrappers (shadcn pattern)
│   ├── navigation.tsx            # Main navigation component
│   ├── footer.tsx                # Footer component
│   ├── project-card.tsx          # Project display card
│   ├── contact-dialog.tsx        # Contact form modal
│   └── providers.tsx             # tRPC + React Query setup
├── lib/
│   ├── projects.ts               # Project data and types
│   ├── playlists-and-images.ts  # Image gallery data
│   ├── payload-api.ts            # Payload CMS integration (Canvas)
│   ├── tenant-context.tsx        # Multi-tenant domain context
│   ├── trpc.ts                   # tRPC client setup
│   └── utils.ts                  # Utility functions
└── public/                        # Static assets

```

### Key Patterns

#### Multi-Tenant Architecture

The application uses a tenant context system to support multiple domains:

- **TenantProvider** (`src/lib/tenant-context.tsx`): Provides domain context to the app
- **proxy.ts**: Maps incoming domains to tenant identifiers
- Current mapping: `otherdev.com` (main), custom domains supported, `localhost` for dev

#### tRPC Integration

tRPC is configured for type-safe client-server communication:

1. **Client Setup** (`src/components/providers.tsx`):
   - QueryClient from React Query
   - tRPC client with httpBatchLink
   - Transformer: superjson (handles Date, Map, Set serialization)

2. **API Route** (`src/app/api/trpc/[trpc]/route.ts`):
   - Catches all tRPC procedure calls
   - Routers defined in `@/server/routers`

#### Component Styling

Uses Radix UI + Tailwind CSS pattern (shadcn convention):

- Radix UI primitives wrapped in `src/components/ui/` directory
- CVA (class-variance-authority) for component variants
- Tailwind for utility styling
- Dark mode support via next-themes (configured for light/dark)

#### Data Fetching

- **Static data**: Projects, playlists stored in `src/lib/`
- **CMS data**: Fetched from Payload CMS via Canvas SDK (`@od-canvas/sdk`)
- **Images**: Optimized via Next.js Image component
  - Remote patterns configured for unsplash, jsdelivr, and local Canvas API

### Server-Side Rendering

The app uses Next.js App Router with:
- React Server Components by default
- `'use client'` directive for interactive components (providers, contexts)
- Suspense boundaries for streaming
- View Transitions API (`view-transition-same-origin`) enabled

## Development Workflow

### Adding New Pages

1. Create file in `src/app/path/page.tsx`
2. Export metadata object for SEO (title, description, openGraph, twitter)
3. Use Navigation and Footer components for consistency
4. Export default component function

Example:
```typescript
import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Page Title | OtherDev",
  description: "Page description for SEO",
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main>{/* content */}</main>
      <Footer />
    </>
  );
}
```

### Adding New Components

1. Place in `src/components/`
2. Use `'use client'` only if component needs interactivity
3. Prefer Radix UI + Tailwind for styling
4. Extract props to interfaces for type safety
5. Keep components focused on single responsibility

### Adding UI Primitives

When adding Radix UI components:

1. Install: `bun add @radix-ui/react-component-name`
2. Create wrapper in `src/components/ui/component-name.tsx`
3. Apply Tailwind styling and CVA variants
4. Export from wrapper for use in app

## Configuration

### TypeScript

- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- Path alias: `@/*` → `./src/*`

### Biome (Linting & Formatting)

- Indent: 2 spaces
- Recommended rules for React and Next.js
- useIgnoreFile: respects .gitignore
- organizeImports: enabled

### Next.js Config (`next.config.ts`)

- React Compiler: enabled for automatic optimization
- Component caching: enabled
- Remote image patterns: unsplash, jsdelivr, localhost Canvas API
- Redirects: /expertise → /work, legacy /ur and /de paths removed

### Sitemap & SEO

- `next-sitemap` generates sitemap.xml post-build
- Metadata base: https://otherdev.com
- OpenGraph and Twitter cards configured

## Code Style

### Formatting

```bash
bun format  # Auto-format all files
bun lint    # Check for linting issues
```

Biome enforces:
- 2-space indentation
- Import organization
- Consistent code style

### Naming Conventions

- Components: PascalCase (`Navigation.tsx`, `ProjectCard.tsx`)
- Utilities/helpers: camelCase (`utils.ts`, `projects.ts`)
- Constants: UPPER_SNAKE_CASE
- Types: PascalCase with suffix (e.g., `ProjectCardProps`)

## Image Optimization

Next.js Image component is used for all images:

```typescript
import Image from "next/image";

<Image
  src="/image.png"
  alt="Description"
  width={800}
  height={600}
  priority // only for above-the-fold
/>
```

Remote image sources require entries in `next.config.ts`:
- unsplash.com: portfolio imagery
- jsdelivr.net: CDN resources
- localhost:3845: local Canvas CMS API

## Environment Variables

Optional (no required env vars currently):

```env
# For future API integrations:
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://otherdev.com
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Set root directory to `web/`
4. Deploy

### Other Platforms

Standard Next.js deployment to Node.js environments:
- Netlify, AWS Amplify, Railway, DigitalOcean, etc.

## Performance Considerations

- React Compiler enabled for automatic memoization
- Component caching enabled
- Images optimized with WebP
- View transitions for smooth page navigation
- Code splitting automatic via App Router

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)