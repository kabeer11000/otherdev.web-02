# otherdev-v2

> Digital platforms for pioneering creatives

Monorepo containing multiple web applications built by [otherdev](https://otherdev.com) — a full-service web development and design studio based in Karachi City.

## Projects

### [`web/`](web/README.md) — Main Portfolio Website

Next.js 16 application serving as otherdev's primary portfolio site.

**Stack:** Next.js 16 · React 19 · TypeScript 5.9 · Tailwind CSS 4 · Bun

**Highlights:**
- 13+ portfolio projects showcasing work for fashion, design, and enterprise clients
- AI-powered chat assistant (Loom) with RAG capabilities
- tRPC API layer with end-to-end type safety
- Radix UI + Tailwind component system
- SEO-optimized with OG images and structured data

**Start:** `cd web && bun install && bun dev`

---

### [`qwik-app/`](qwik-app/README.md) — Qwik City Exploration

Experimental Qwik implementation for performance-focused rendering.

**Stack:** Qwik · Qwik City · Tailwind CSS 4 · TypeScript

**Highlights:**
- Resumable hydration for near-instant interactivity
- 21 pre-built headless UI components via `@qwik-ui`
- File-based routing with layouts and loaders
- Server-side rendering with zero JS by default

**Start:** `cd qwik-app && bun install && bun dev`

## Quick Start

```bash
# Install all dependencies
bun install

# Run web (Next.js)
cd web && bun dev

# Or run qwik-app in another terminal
cd qwik-app && bun dev
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frameworks | Next.js 16, Qwik City |
| Languages | TypeScript 5.9, CSS |
| Runtime | Bun |
| UI | Radix UI, Tailwind CSS 4, Framer Motion |
| AI | Groq SDK, HuggingFace Inference, Vercel AI SDK |
| API | tRPC, TanStack Query, Zod |
| Database | Firebase Admin, Upstash Redis |
| Email | Nodemailer, Google APIs |
| Infrastructure | Vercel |

## Repository Structure

```
otherdev-v2/
├── web/                    # Next.js portfolio (main production app)
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── server/        # tRPC routers
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   ├── public/            # Static assets
│   └── package.json
├── qwik-app/              # Qwik City (experimental)
│   ├── src/
│   │   ├── routes/       # File-based routing
│   │   ├── components/    # Qwik components
│   │   └── entry.*.tsx    # Entry points
│   └── package.json
├── qwik-app-backup/       # Backup of previous qwik-app state
├── docs/                  # Project documentation
├── graphify-out/          # Knowledge graph analysis
├── AGENTS.md             # AI agent instructions
└── CLAUDE.md             # Claude Code guidance
```

## Documentation

- [`web/README.md`](web/README.md) — Full web app documentation
- [`qwik-app/CLAUDE.md`](qwik-app/CLAUDE.md) — Qwik project guidance
- [`AGENTS.md`](AGENTS.md) — AI agent configuration
- [`docs/`](docs/) — Additional project docs

## Contact

- **Website:** [otherdev.com](https://otherdev.com)
- **Location:** Karachi City, Pakistan
- **Instagram:** [@otherdev](https://instagram.com/other.dev)
- **LinkedIn:** [otherdev](https://linkedin.com/company/theotherdev)

---

© otherdev — All Rights Reserved