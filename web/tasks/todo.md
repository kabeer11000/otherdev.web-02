# Qdrant Node 22 Runtime Pin

## Goal

Fix the RAG/Qdrant runtime failure after the AI SDK v7 tool refactor by running the Next.js app on Node 22 LTS instead of Node 26.

## Root Cause

The env vars, Cohere embeddings, Qdrant Cloud endpoint, and raw fetch requests work. The failure is specific to `@qdrant/js-client-rest` under Node `26.3.1`, where its undici dispatcher path throws `UND_ERR_INVALID_ARG` / `fetch failed`.

## Implementation

- [x] Add Node 22 version files for local tooling.
- [x] Add Bun metadata to `package.json` while keeping Node 22 in version-manager files only.
- [x] Keep the existing Qdrant JS client and RAG code unchanged.
- [x] Do not use `checkCompatibility=false` as the fix because it does not repair the failing request path.
- [x] Remove the MiniMax structured-output warning by avoiding unsupported `responseFormat` on MiniMax suggestion generation.
- [x] Refine AI Elements suggestion pills so longer suggestions wrap cleanly.
- [x] Increase the prompt input bar background opacity.

## Verification

- [ ] Confirm the active shell is running Node 22 before final live verification.
- [x] Verify the Qdrant JS client can read the `otherdev_documents` collection under Node 22.
- [ ] Verify `GET /api/qdrant-ping` returns `ok: true` under Node 22.
- [ ] Verify `POST /api/chat/stream` no longer logs `[retrieveKnowledge] execute error: fetch failed`.
- [ ] Prompt the user to run lint instead of running it directly.

## Follow-up Sources/Citations

- [x] Render currently available Tavily and RAG tool outputs with the AI Elements `Sources` component.
- [ ] Change `retrieveKnowledge` and `tavilySearch` tool outputs to return structured source metadata instead of XML-like strings.
- [ ] Add URLs/slugs to RAG documents where possible so knowledge-base sources can be clickable.
- [ ] Consider AI Elements `InlineCitation` only after the model is instructed to cite specific claims with source ids.

## Review

Added `.node-version`, `.nvmrc`, and Bun package metadata. Node is intentionally not listed in `package.json`. Verified with a temp-only Node `v22.23.1` binary that `@qdrant/js-client-rest` can read the `otherdev_documents` collection and perform a search successfully. The MiniMax suggestion path now asks for JSON as plain text and validates it locally, so it no longer sends `Output.object()` / `responseFormat` to the MiniMax provider. Follow-up suggestion pills still use the local AI Elements component and now wrap longer text. Verified the runtime config parses and `git diff --check` passes.

Live Next route verification is still pending because an existing Next dev server is running on port 3000 under Node `26.3.1`; replacing that server was not approved. Lint was not run directly because this repo asks for a user prompt before lint runs.
