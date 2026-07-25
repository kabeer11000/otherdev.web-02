# Lessons

## 2026-07-26 | ponytail-audit apply

### Pattern: always check tests before deleting a utility
- `api-helpers.ts::createJsonResponse` seemed like a pure stdlib replacement (Response.json)
- But `route.test.ts` files imported and used it in mock setups
- Fix: always grep test files for a symbol before deleting the file it lives in
- How to apply: before deleting any shared utility, run `grep <symbol> **/__tests__/**`

### Pattern: verify exports, not just definitions
- `AlertDialogPortal` function body was removed but it stayed in the `export {}` block
- Fix: when removing a named export, edit the export list in the same edit as the function body
- How to apply: remove both the function AND the export in one shot, or grep the export name to verify it's gone

### Pattern: skeleton components may have legitimate contracts
- `Skeleton` had `data-slot` + dynamic `className` forwarding — not just static markup
- The audit was wrong to flag it for deletion; the abstraction is warranted
- How to apply: look at actual usage (data-slot attributes, prop forwarding) before marking dead markup
