# ponytail-audit: apply findings

## Status: completed

## Applied (25 of 28 — 3 skipped with reason)

### DELETE (files, zero callers)
- [x] `web/src/lib/elevenlabs-agent-config.ts` — 223 lines, zero imports
- [x] `web/src/lib/knowledge-base.ts` — ~1593 lines, never imported
- [x] `web/src/lib/feature-flags.ts` — never imported
- [x] `web/src/server/lib/chat/index.ts` — pure re-export, callers import directly
- [x] `web/src/app/.well-known/api-catalog/route.ts` — hardcoded, mismatches API
- [x] `web/src/app/(app)/robots.ts` — canonical URL mismatch with root robots.ts
- [x] `web/src/app/(app)/api/transcribe/route.ts` — SSE chunking → Response.json; updated caller in chat-core.tsx
- [x] `web/src/app/(app)/api/blog/route.ts` — deleted
- [x] `web/src/app/(app)/api/about/route.ts` — deleted
- [x] `web/src/app/(app)/api/work/route.ts` — deleted
- [x] `web/src/app/(app)/api/work/[slug]/route.ts` — deleted
- [x] `web/src/app/(app)/api/blog/[slug]/route.ts` — deleted
- [x] `web/src/lib/tenant-context.tsx` — deleted; useTenant() had zero call sites
- [x] `web/src/server/lib/api-helpers.ts` — deleted after all callers migrated to Response.json()

### DELETE (exports within files)
- [x] `web/src/components/ui/popover.tsx::PopoverAnchor` — removed
- [x] `web/src/components/ui/alert-dialog.tsx::AlertDialogPortal` — removed (function body + export)
- [x] `web/src/components/ui/dialog.tsx::DialogPortal` — removed (function body + export)

### STDLIB (replace hand-rolled with platform)
- [x] `web/src/server/lib/api-helpers.ts::createJsonResponse` → removed; all 18 callers updated to `Response.json()`
- [x] `web/src/server/lib/chat/message-utils.ts::replaceMessageAtId` → `Array.splice(index, 1, replacement)` (was findIndex+slice+assignment)
- [x] `web/src/server/lib/rag/vector-search.ts::filterCacheKey` → removed dead `?? ''` (JSON.stringify always returns string)
- [x] `web/src/server/lib/rate-limit.ts::getClientIdentifier` → removed dead `'unknown'` fallback; replaced with `!` assertion + comment

### YAGNI (unused abstractions)
- [x] `web/src/components/ui/accordion.tsx::AccordionRoot` → replaced with `Accordion.Root` direct export

### SHRINK (inline, simplify)
- [x] `web/src/components/providers.tsx::getQueryClient` → inlined into single call site
- [x] `web/src/app/(app)/about/page.tsx` → `getAboutContent()` called once, result shared between `generateMetadata` and `AboutPage`
- [x] `web/src/app/(app)/sitemap.ts` → `new Date('2025-01-01')` → `new Date()` (twice)

## Skipped (3 items)

- **Skeleton component** — has legitimate contract: `data-slot` attributes and `className` forwarding are real abstraction value
- **SimpleLRU** — `lru-cache` not installed; hand-rolled is explicit and correct for this use case
- **Spinner** — audit said inline, but `Spinner` wraps `Loader2Icon` with `role`/`aria-label` semantics; abstraction is warranted

## Review
- Applied: 2026-07-26
- net: ~-2100 lines estimated, 1 dep file deleted (api-helpers.ts)
- New issues found during apply: test files imported deleted utility — always check `__tests__/` before deleting shared code
