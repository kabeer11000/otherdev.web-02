# Groq to MiniMax Migration — SPEC

## Context

The `otherdev` web app uses **Groq** (`@ai-sdk/groq`) for LLM-powered chat streaming and transcription. We are switching the LLM provider to **MiniMax** for cost/performance reasons. This is a drop-in provider swap — the AI SDK's `streamText()` interface remains identical.

---

## Scope

| What changes | What stays |
|---|---|
| Provider: `@ai-sdk/groq` → `vercel-minimax-ai-provider` | AI SDK `streamText()` interface |
| API key env var: `GROQ_API_KEY` → `MINIMAX_API_KEY` | Chat routing, RAG pipeline |
| Model IDs: Groq model names → `MiniMax-M2` | Caching, rate limiting |
| Transcription endpoint | Returns 501 (MiniMax has no transcription model) |
| `groq-citations.ts` + readme | Deleted (Groq-specific) |

---

## Key Decisions

1. **Provider:** `vercel-minimax-ai-provider` — exists at `vercel-minimax-ai-provider@0.0.2` on npm. Provides `minimax` (OpenAI-compatible), `minimaxAnthropic`, `minimaxOpenAI` exports. Uses `MINIMAX_API_KEY` env var by default.

2. **Models:** `MiniMax-M2` for both chat and vision. `MiniMax-M2-Stable` is available for stricter stability needs.

3. **Transcription:** Removed — MiniMax does not offer a transcription/whisper model. The `/api/transcribe` route will return `501 Not Implemented`.

4. **Citations:** `groq-citations.ts` is deleted — it is Groq-specific and MiniMax citations work differently (if at all).

5. **Tool calling:** Groq-specific `repairToolCall` function removed. MiniMax is expected to produce cleaner JSON.

6. **File deletion:** `src/lib/groq-citations.ts`, `src/lib/groq-citations-readme.md` — deleted.

---

## Env Var Changes

```env
# Before
GROQ_API_KEY=your-groq-api-key-here

# After
MINIMAX_API_KEY=your-minimax-api-key-here
```

---

## Acceptance Criteria

- [ ] `bun build` passes with no Groq references
- [ ] Chat stream endpoint uses `minimax` provider and `MiniMax-M2` model
- [ ] `groq-citations.ts` and readme deleted
- [ ] Transcribe endpoint returns 501
- [ ] Env example uses `MINIMAX_API_KEY`
- [ ] No `repairToolCall` usage remains (or it's stubbed)

---

## Files

| File | Action |
|---|---|
| `web/.env.example` | Modify — replace GROQ_API_KEY |
| `web/package.json` | Modify — remove `@ai-sdk/groq`, add `vercel-minimax-ai-provider` |
| `web/src/app/api/chat/stream/route.ts` | Modify — swap provider, model |
| `web/src/app/api/chat/stream/helpers.ts` | Modify — update model IDs |
| `web/src/app/api/transcribe/route.ts` | Modify — return 501 |
| `web/src/hooks/use-citations.ts` | Modify — clean Groq comments |
| `web/src/lib/groq-citations.ts` | Delete |
| `web/src/lib/groq-citations-readme.md` | Delete |
| `web/src/components/ui/citations.tsx` | Modify — clean Groq comments |
