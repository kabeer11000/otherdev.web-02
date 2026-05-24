# Coding Conventions

**Analysis Date:** 2026-05-25

## TypeScript Usage

**Mode:** Strict mode enabled (`"strict": true` in `tsconfig.json`)

**Type Coverage:**
- No `any` in application code except in test files and specific justified cases
- `biome.json` enforces `noExplicitAny: "error"` (linter rule `suspicious.noExplicitAny`)
- Payload types auto-generated in `src/payload-types.ts`

**Path Aliases:**
- `@/*` maps to `./src/*`
- `@payload-config` maps to `./payload.config.ts`

**Import Style:**
- Type-only imports use `import type { ... }` (enforced by `useImportType: "error"`)
- `esModuleInterop: true` allows default imports from CJS modules

## File Naming Conventions

| Pattern | Example |
|---------|---------|
| Components | `PascalCase.tsx` — `ChatCore.tsx`, `ArtifactRenderer.tsx` |
| Hooks | `camelCase.ts` — `useAutoScroll.ts`, `useCitations.ts` |
| Utilities | `camelCase.ts` — `utils.ts`, `schemas.ts`, `sse.ts` |
| Route handlers | `route.ts` |
| Test files | Co-located `__tests__/Name.test.ts` or `*.test.tsx` |
| Server modules | `server/lib/*.ts` for server-side code |

**File Organization:**
```
src/
├── app/                    # Next.js App Router pages/routes
│   ├── (app)/             # Frontend route group
│   └── (payload)/         # Payload admin route group
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui style)
│   └── __tests__/        # Component tests
├── hooks/                # Custom React hooks
│   └── __tests__/        # Hook tests
├── lib/                  # Shared utilities and logic
│   └── __tests__/        # Utility tests
├── plugins/              # Payload CMS plugins
└── server/               # Server-only code
    └── lib/              # Server utilities
```

## Code Style

**Formatter:** Biome (`biome.json` configuration)

**Key Settings:**
- 2-space indentation, no tabs
- Line width: 100 characters
- Single quotes for JS/TS, double quotes for JSX
- Semicolons: as needed (not required)
- Trailing commas: ES5 style (last item in multi-line)

**Key Linter Rules:**
- `noUnusedVariables: "error"` — Variables must be used
- `noUnusedImports: "error"` — Import cleanup required
- `useExhaustiveDependencies: "warn"` — React hooks need all deps
- `useConst: "error"` — Use `const` over `let` where applicable
- `useTemplate: "error"` — Template literals over string concatenation
- `noDoubleEquals: "error"` — Strict equality (`===` / `!==`)
- `useOptionalChain: "error"` — Optional chaining where possible

## Naming Conventions

**Components/Exports:**
- PascalCase for component functions and exported types
- camelCase for internal functions and variables
- Prefix custom hooks with `use` (e.g., `useAutoScroll`)

**Props Interfaces:**
- Inline types for simple props: `{ label: string; onClick: () => void }`
- Named types for complex props: `type ChatCoreProps = { ... }`

**Constants:**
- SCREAMING_SNAKE_CASE for true constants: `REQUESTS_PER_WINDOW`
- PascalCase for config objects: `GREETINGS` (array of greeting options)

## Component Patterns

**Client Components:**
- Marked with `'use client'` directive at top
- Use React hooks for state/effects
- Event handlers use `useCallback` when passed as props

**Props:**
- Explicit typing for all props
- JSDoc comments for complex props (`src/components/chat-core.tsx:644-657`)
- Destructure props in function signature

**State Management:**
- Local `useState` for component state
- `useRef` for DOM references and mutable values that don't trigger re-renders
- External state via hooks (`useLocalStorageMessages`)

## Import Organization

**Order (via Biome auto-fix):**
1. React and framework imports
2. Third-party library imports
3. Internal `@/` imports
4. Type imports (`import type { ... }`)

**Path Alias Usage:**
- Use `@/*` for internal imports (e.g., `@/components/ui/button`)
- Use `@payload-config` for Payload config

## Error Handling

**Patterns:**
- Custom error types for specific failure modes
- Graceful degradation (e.g., clipboard copy failures logged but don't crash)
- Type-safe error handling with discriminated unions where appropriate

**Example** (`src/hooks/use-auto-scroll.ts`):
```typescript
const handleScroll = () => {
  if (!containerRef.current) return
  // ... logic
}
```

## React Patterns

**Hooks:**
- `useEffect` for side effects with complete dependency arrays (or `biome-ignore` for intentional omissions)
- `useCallback` for stable function references passed to children
- `useMemo` for expensive computations

**Refs:**
- `useRef` for DOM elements and mutable values that shouldn't trigger re-renders
- Refs initialized to `null` for DOM refs: `useRef<HTMLDivElement>(null)`

**Biome Suppressions:**
```typescript
// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — ...
```
Used when hook dependencies are intentionally excluded (common pattern for reading current state without re-subscribing).

## API Routes

**Pattern:** Next.js App Router with co-located tests
- `route.ts` — Handler implementation
- `__tests__/route.test.ts` — Test file in same directory

**Request/Response:**
- Typed request bodies with Zod schemas
- JSON responses with explicit status codes
- Error responses include `{ error: string }` shape

---

*Convention analysis: 2026-05-25*