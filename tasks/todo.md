# Chat Latency Fix + Voyage AI Embeddings Migration

**Goal:** Fix slow chat response times by (1) fast-failing MiniMax before Groq fallback, and (2) replacing Mistral embeddings with Voyage AI for better RAG quality and lower latency. Reduce the 5-retry embedding loop that can exceed the 30s route budget.

**Root causes diagnosed:**
- MiniMax primary → Groq fallback has no per-provider timeout. If MiniMax is slow/down, the full 30s maxDuration is consumed before Groq even starts.
- Mistral `generateEmbedding` has MAX_RETRIES=5 with exponential backoff (1+2+4+8+16 = 31s total sleep) — longer than the route's `maxDuration = 30`.
- Two sequential Redis round-trips before streaming starts (can be batched).

**Why Voyage AI over Mistral for embeddings:**
- Voyage AI's `voyage-3-large` consistently tops MTEB retrieval benchmarks.
- The `input_type: "query"` vs `"document"` asymmetric encoding is a significant RAG quality improvement — Mistral `mistral-embed` has no equivalent.
- Official Node.js/TypeScript SDK (`voyageai`) vs raw fetch with manual retry logic.
- Same 1024 dimensions as current Mistral setup → no Firestore index rebuild needed.

**What stays unchanged:**
- `@ai-sdk/mistral` is kept — `process-document/route.ts` uses it for OCR (Mistral vision). Only the raw fetch in `embeddings.ts` is replaced.
- `MISTRAL_API_KEY` env var stays (still required for OCR route).
- Firestore vector index stays — `voyage-3-large` defaults to 1024 dims, matching the current index.

**Re-ingestion is required:** Voyage AI and Mistral vectors are incompatible even at the same 1024 dimensions. Run `bun ingest` after migration.

---

## Files Touched

| File | Action | Why |
|---|---|---|
| `web/src/server/lib/rag/embeddings.ts` | Rewrite | Switch to Voyage AI SDK, add `inputType`, reduce retries to 2 |
| `web/scripts/ingest-documents.ts` | Modify | Pass `inputType: 'document'` for knowledge base ingestion |
| `web/src/app/api/chat/stream/route.ts` | Modify | Add AbortController fast-fail for MiniMax (~9s timeout) |
| `web/package.json` | Modify | Add `voyageai` dependency |

---

## Task 1: Install `voyageai` package

- [ ] **Step 1:** Install the Voyage AI Node.js SDK

  ```bash
  cd web && bun add voyageai
  ```

- [ ] **Step 2:** Verify it appears in `package.json` dependencies

---

## Task 2: Rewrite `embeddings.ts` with Voyage AI

**File:** `web/src/server/lib/rag/embeddings.ts`

**Changes:**
- Replace the raw Mistral `fetch` loop with `VoyageAIClient.embed()`
- Add `inputType: 'query' | 'document'` parameter (default `'query'`)
- Reduce `MAX_RETRIES` from 5 → 2 (covers transient blips; RAG pipeline already silently skips on error at `route.ts:582`)
- Reduce `INITIAL_DELAY_MS` from 1000 → 300ms (shorter baseline backoff)
- Keep React `cache()` for per-request deduplication
- Model: `voyage-3-large` (1024 dims, MTEB top-ranked for retrieval)
- Env var: `VOYAGE_API_KEY`

**Key pattern from Voyage AI docs:**
```ts
const client = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY })

const response = await client.embed({
  model: 'voyage-3-large',
  input: [text],
  inputType,         // 'query' for runtime lookups, 'document' for ingestion
})

return response.data[0].embedding as number[]
```

- [ ] **Step 1:** Rewrite `embeddings.ts` using the pattern above, keeping `cache()` wrapper and 2-retry loop
- [ ] **Step 2:** Verify the function signature is backward-compatible: `generateEmbedding(text: string, inputType?: 'query' | 'document')`
- [ ] **Step 3:** Run `bun run type-check` from `web/` — must pass with no new errors

---

## Task 3: Update ingest script to use `input_type: "document"`

**File:** `web/scripts/ingest-documents.ts`

Currently calls `generateEmbedding(doc.content)` with no `inputType` — defaults to `'query'`, which is wrong for stored documents and degrades retrieval quality.

- [ ] **Step 1:** Change `generateEmbedding(doc.content)` → `generateEmbedding(doc.content, 'document')`
- [ ] **Step 2:** The dimension check `embedding.length !== 1024` stays — `voyage-3-large` defaults to 1024

---

## Task 4: Add MiniMax fast-fail (AbortController) in route.ts

**File:** `web/src/app/api/chat/stream/route.ts`

**Problem (lines 688–714):** If MiniMax is slow to respond, `await streamTextWithModel(minimaxAI, ...)` blocks for up to 30s before the catch fires and Groq starts. The route's `maxDuration = 30` means the entire request times out.

**Fix:** Thread an `AbortSignal` through `streamTextWithModel` and race MiniMax against a 9s timeout. AI SDK's `streamText` accepts `abortSignal` natively.

**Changes:**
1. Add optional `abortSignal?: AbortSignal` param to `streamTextWithModel` and pass it to `streamText`
2. Wrap the MiniMax attempt with `AbortController` + `setTimeout(..., 9_000)`
3. Call `clearTimeout` on success to prevent aborting a healthy in-progress stream

```ts
// Inside the text/general branch
const minimaxAbort = new AbortController()
const minimaxTimeout = setTimeout(() => minimaxAbort.abort(), 9_000)

try {
  result = await streamTextWithModel(
    minimaxAI, MINIMAX_CHAT_MODEL, 'MiniMax-M2.7', minimaxTools, minimaxAbort.signal
  )
  clearTimeout(minimaxTimeout)
} catch (minimaxError) {
  clearTimeout(minimaxTimeout)
  // Groq fallback now starts within 9s instead of up to 30s
  ...
}
```

- [ ] **Step 1:** Add `abortSignal?: AbortSignal` to `streamTextWithModel` signature and forward it to `streamText`
- [ ] **Step 2:** Add `AbortController` + 9s `setTimeout` wrapping the MiniMax `streamTextWithModel` call
- [ ] **Step 3:** Call `clearTimeout` in both the success path and catch block
- [ ] **Step 4:** Run `bun run type-check` — must pass

---

## Task 5: Re-ingest knowledge base with Voyage AI

This step is mandatory — Mistral and Voyage AI vectors are in different embedding spaces.

- [ ] **Step 1:** Add `VOYAGE_API_KEY` to `.env.local`
- [ ] **Step 2:** Run `bun ingest` from `web/` — clears Firestore and re-ingests all documents with Voyage AI `document` embeddings
- [ ] **Step 3:** Verify ingestion completed with 0 errors

---

## Task 6: Verify end-to-end

- [ ] **Step 1:** Start dev server: `bun dev` from `web/`
- [ ] **Step 2:** Send a domain query ("tell me about Other Dev") — verify RAG retrieval returns relevant documents (check console logs)
- [ ] **Step 3:** Send a general query — verify Groq responds within a few seconds (not 9s+)
- [ ] **Step 4:** (Optional) Temporarily set an invalid `MINIMAX_API_KEY` to force fallback — verify Groq starts within ~9s
- [ ] **Step 5:** Run `bun run type-check` one final time

---

## Deferred (not in this plan)

- **Batch Redis reads:** Replace two sequential `redis.get()` calls with `redis.mget()` to save one round-trip. Low impact compared to above — defer to separate task.
- **Voyage AI reranker:** `voyage-rerank-2` could further improve RAG quality post-retrieval. Out of scope here.

---

## Review checklist

- [ ] No `any` types introduced without justification
- [ ] `VOYAGE_API_KEY` documented in CLAUDE.md env vars section (or noted for the user)
- [ ] `MISTRAL_API_KEY` still present (needed for OCR route)
- [ ] Ingest script run and verified
- [ ] Type check passes
