# External Integrations

**Generated:** 2026-05-25

---

## AI Providers

### Groq (Primary LLM)
- Env: `GROQ_API_KEY`
- Model: `groq/gpt-oss-120b`
- Used for: chat streaming, tool selection

### Vercel AI Gateway
- Env: `AI_GATEWAY_API_KEY` (local dev)
- Env: `VERCEL_OIDC_TOKEN` (Vercel auto-provisioned)
- Purpose: Unified API gateway for Groq, Cohere, Mistral

### Cerebras (Fallback)
- Env: `CEREBRAS_API_KEY`
- Model: `cerebras/qwen-3-235b`
- Used for: fallback when Groq is unavailable

### Mistral (Vision)
- Env: `MISTRAL_API_KEY`
- Model: `mistral/pixtral-large`
- Used for: image understanding

### Cohere (Embeddings + Reranking)
- Env: `COHERE_API_KEY`
- Used via: AI Gateway
- Purpose: `embed-v4.0` for vectorization, `rerank-v4-fast` for result ranking

### Tavily (Web Search)
- Env: `TAVILY_API_KEY`
- Purpose: `tavilySearch` tool for real-time web grounding

---

## Database

### MongoDB
- Env: `DATABASE_URL`
- Driver: `mongoose` 9.6.2
- Used by: Payload CMS 3
- Adapter: `@payloadcms/db-mongodb`

---

## Vector Search

### Qdrant
- Env: `QDRANT_URL`, `QDRANT_API_KEY`
- Collection: `otherdev_documents`
- Dimensions: 1536
- Similarity: Cosine
- Payload indexes: `type`, `category`, `subtype`, `project`, `year`
- Used for: RAG knowledge retrieval

---

## Cache / Rate Limiting

### Upstash Redis
- Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Limits:
  - Chat: 10 req/min
  - Contact: 5 req/min
- Used for: rate limiting, possible caching

---

## File Storage

### Cloudflare R2 (S3-compatible)
- Env: `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`
- Config: `forcePathStyle: true`
- Plugin: `@payloadcms/storage-s3`
- Used for: project images, assets

---

## Email

### Gmail SMTP
- Env: `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- Library: `nodemailer`
- Used for: contact form, lead capture

---

## Authentication

### Firebase Admin
- Env: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Purpose: Admin SDK for Firebase auth (service account)

---

## Voice Agent

### ElevenLabs
- Env: (via `Ahmad.json` config)
- SDK: `@elevenlabs/elevenlabs-js` 2.47.0, `@elevenlabs/react` 1.6.0
- Voice: George (`JBFqnCBsd6RMkjVDRZzb`)
- Tools: `calcom`, `knowledge_base_rag`, `capture_lead`

---

## Deployment

- **Platform:** Vercel
- **CLI:** `vercel` 51.8.0
- **Config:** `@vercel/config` 0.3.0
- **Compute:** Fluid Compute

---

## Summary: All Env Keys

| Key | Service |
|-----|---------|
| `GROQ_API_KEY` | Groq LLM |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway |
| `VERCEL_OIDC_TOKEN` | Vercel OIDC (auto-provisioned) |
| `CEREBRAS_API_KEY` | Cerebras fallback LLM |
| `MISTRAL_API_KEY` | Mistral vision |
| `COHERE_API_KEY` | Cohere embed + rerank |
| `TAVILY_API_KEY` | Tavily web search |
| `DATABASE_URL` | MongoDB |
| `QDRANT_URL` | Qdrant vector DB |
| `QDRANT_API_KEY` | Qdrant API |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth |
| `R2_*` | Cloudflare R2 storage |
| `GMAIL_USER` | Gmail SMTP |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `FIREBASE_*` | Firebase Admin |