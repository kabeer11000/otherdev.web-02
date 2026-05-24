# Technical Concerns

**Generated:** 2026-05-25

---

## TypeScript

| Concern | Severity | Details |
|---------|----------|---------|
| `ignoreBuildErrors: true` | HIGH | TypeScript errors are ignored at build time — type safety is compromised |
| `any` usage | MEDIUM | Present in `knowledge-base.ts` and some utility functions — needs audit |

---

## Payload CMS

| Concern | Severity | Details |
|---------|----------|---------|
| `seoPlugin` ghost columns | MEDIUM | SEO plugin creates ghost columns visible in admin UI |
| Dual `getPayload()` access | MEDIUM | Direct `getPayload()` in route handlers AND via `payload-api.ts` — inconsistent initialization patterns |

---

## Knowledge Base

| Concern | Severity | Details |
|---------|----------|---------|
| Static array duplication | HIGH | `knowledge-base.ts` (1587 lines) is a static array separate from Payload collections — two sources of truth for RAG data |
| Large single file | MEDIUM | 1587 lines in one file — difficult to maintain, no search indexing |

---

## Chat Core

| Concern | Severity | Details |
|---------|----------|---------|
| Large file | HIGH | `chat-core.tsx` at 1411 lines — single responsibility violation, hard to test |

---

## API Routes

| Concern | Severity | Details |
|---------|----------|---------|
| Missing test coverage | MEDIUM | API route handlers have no unit/integration tests |
| Error path untested | MEDIUM | Failure modes and error responses not covered |

---

## Rate Limiting

| Concern | Severity | Details |
|---------|----------|---------|
| Upstash Redis dependency | LOW | Rate limiting unavailable if Redis is down — graceful degradation needed |

---

## Security

| Concern | Severity | Details |
|---------|----------|---------|
| Multiple API keys in env | MEDIUM | 15+ env keys tracked — rotation and secrets management a growing concern |
| Firebase private key | HIGH | `FIREBASE_PRIVATE_KEY` in env — service account key, needs rotation policy |
| `ignoreBuildErrors: true` | HIGH | Disabling TS errors can mask runtime type mismatches |

---

## Build / Lockfiles

| Concern | Severity | Details |
|---------|----------|---------|
| `bun.lockb` backup lockfile | LOW | `bun.lockb` backup exists alongside `bun.lock` — potential ambiguity in CI |

---

## Missing Infrastructure

| Concern | Severity | Details |
|---------|----------|---------|
| No database backup strategy | MEDIUM | MongoDB data has no documented backup/restore procedure |
| R2 not connected | LOW | R2 env vars present but may not be wired to Payload storage |

---

## Performance

| Concern | Severity | Details |
|---------|----------|---------|
| Large knowledge base array | MEDIUM | 1600-line static array loaded at startup — consider lazy loading or chunking |
| No image optimization config | LOW | Next.js image optimization may need tuning for R2 storage |