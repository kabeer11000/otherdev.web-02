# Testing Patterns

**Analysis Date:** 2026-05-25

## Test Framework

**Runner:** Bun test (`bun test`)

**Assertion Library:** Built-in Bun assertions (`expect`)

**Testing Library:** @testing-library/react (for React component tests)

**Test Commands:**
```bash
bun test              # Run all tests
```

**Configuration:** No explicit config file — Bun test auto-discovers `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`

## Test File Organization

**Location:** Co-located with source files in `__tests__/` directories

**Patterns:**
- `src/lib/__tests__/utils.test.ts` — Utility function tests
- `src/hooks/__tests__/use-auto-scroll.test.ts` — Hook logic tests
- `src/components/__tests__/artifact-renderer.test.tsx` — Component tests
- `src/app/(app)/api/chat/stream/__tests__/route.test.ts` — API route tests

**Naming:** `*.test.ts` or `*.test.tsx` (Bun convention)

## Test Structure

**Describe Blocks:**
```typescript
import { describe, expect, test } from 'bun:test'

describe('functionName behavior', () => {
  test('should do X when Y', () => {
    expect(result).toBe(expected)
  })
})
```

**Setup/Teardown:** `beforeEach`, `afterEach` for test isolation

**Example** (`src/app/(app)/api/chat/stream/__tests__/route.test.ts:38-41`):
```typescript
describe('POST /api/chat/stream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
```

## Mocking

**Framework:** Bun's built-in `vi` (from `bun:test`)

**Patterns:**

**1. Module mocking with `vi.mock`:**
```typescript
vi.mock('@/server/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getClientIdentifier: vi.fn().mockReturnValue('test-client'),
}))
```

**2. Mock implementations:**
```typescript
vi.mocked(checkRateLimit).mockResolvedValue({
  allowed: true,
  remaining: 9,
  resetTime: Date.now() + 60000,
})
```

**3. Mock actual module and extend:**
```typescript
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai')
  return {
    ...actual,
    validateUIMessages: vi.fn().mockResolvedValue([]),
  }
})
```

**4. Timer mocking** (`src/components/__tests__/artifact-renderer.test.tsx:69-77`):
```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})
```

## Fixtures and Test Data

**Inline fixtures:** Define mock data directly in tests

**Example** (`src/components/__tests__/artifact-renderer.test.tsx:79-89`):
```typescript
const mockArtifact: ArtifactToolCall = {
  toolCallId: 'test-call-id',
  toolName: 'createArtifact',
  state: 'output-available',
  result: {
    title: 'Test Artifact',
    code: '<html><body><h1>Hello World</h1></body></html>',
    description: 'A test artifact for unit testing',
    success: true,
  },
}
```

**Zod schema validation tests** (`src/lib/__tests__/schemas.test.ts`):
- Test valid parsing and invalid input rejection
- Edge cases: empty strings, unicode, multiline

## Common Patterns

**Async Testing:**
```typescript
test('shows check icon after copying', async () => {
  // ... setup
  await waitFor(
    () => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith(expected)
    },
    { timeout: 100 }
  )
})
```

**Error State Testing:**
```typescript
test('handles clipboard copy failure gracefully', async () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  // ... test
  consoleSpy.mockRestore()
})
```

**DOM Querying** (via @testing-library/react):
```typescript
render(<Component />)
expect(screen.getByText('Expected')).toBeTruthy()
const button = document.querySelector('button[title="Copy code"]')
```

## What to Mock

- External modules (`@/server/lib/rate-limit`, `@/server/lib/chat`)
- Third-party libraries (`shiki`, `ai`, `lucide-react`)
- Browser APIs (`navigator.clipboard`)
- Timer functions (`vi.useFakeTimers()`)

## What NOT to Mock

- Simple utility functions (test actual behavior)
- Internal helpers with straightforward logic

## Coverage

**Enforcement:** None explicit — no coverage threshold configured

**View Coverage:** Not configured

## Test Types

**Unit Tests:**
- Utility functions (`utils.test.ts`, `schemas.test.ts`)
- Hook logic (`use-auto-scroll.test.ts` — tests math, not React rendering)
- Pure functions with no external dependencies

**Integration Tests:**
- API routes with mocked dependencies
- Chat stream endpoint tests covering request validation, rate limiting, error handling

**Component Tests:**
- React components with full mocking of child components and libraries
- DOM interaction testing (click handlers, form state)

## Test Isolation

- `beforeEach` clears all mocks
- `vi.clearAllMocks()` resets mock call counts
- `localStorage.clear()` in beforeEach for component tests
- Fake timers properly restored in afterEach

## Known Patterns in Codebase

**Chat Stream Tests** (`src/app/(app)/api/chat/stream/__tests__/route.test.ts`):
- Mock rate-limit, chat handler, AI SDK, and tool modules
- Test HTTP status codes and error response shapes
- Use `fetch` directly against `http://localhost` for integration-style tests

**Hook Logic Tests** (`src/hooks/__tests__/use-auto-scroll.test.ts`):
- Test mathematical logic separately from React
- Mock scroll behavior by calculating `scrollHeight - scrollTop - clientHeight`
- Verify threshold detection (50px `isAtBottom` check)

**Component Tests** (`src/components/__tests__/artifact-renderer.test.tsx`):
- Mock all child components and icon libraries
- Use `@testing-library/react` for rendering
- Test edge cases: empty code, long content, special characters

---

*Testing analysis: 2026-05-25*