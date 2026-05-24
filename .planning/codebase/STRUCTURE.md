# Project Structure

## Root

```
otherdev-v2/
├── web/                    # Next.js 16 portfolio (main production)
├── flutter_app/            # Flutter desktop + mobile companion
├── docs/                   # Shared project documentation
├── .planning/              # GSD planning artifacts
├── AGENTS.md               # Agent configuration
├── HANDOFF.md              # Session handoff notes
└── README.md               # This file
```

---

## `web/` — Next.js Portfolio

```
web/
├── src/
│   ├── app/
│   │   ├── (app)/              # Public routes
│   │   │   ├── api/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── stream/  # Streaming chat (web useChat)
│   │   │   │   │   └── native/  # SSE endpoint (Flutter)
│   │   │   │   ├── blog/
│   │   │   │   ├── work/
│   │   │   │   ├── lead-capture/
│   │   │   │   ├── transcribe/
│   │   │   │   ├── process-document/
│   │   │   │   ├── elevenlabs/signed-url/
│   │   │   │   └── contact/
│   │   │   ├── blog/page.tsx
│   │   │   ├── work/page.tsx
│   │   │   └── ...
│   │   │
│   │   ├── (payload)/           # Payload CMS (admin + API)
│   │   │   ├── api/
│   │   │   │   ├── graphql/
│   │   │   │   └── [...slug]/
│   │   │   ├── admin/
│   │   │   └── layout.tsx
│   │   │
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                  # Radix UI primitives
│   │   ├── artifact-renderer.tsx # Streamdown progressive markdown
│   │   ├── chat-container.tsx    # Chat UI shell
│   │   ├── providers.tsx         # Context providers
│   │   ├── error-page.tsx
│   │   ├── otherdev-loom-thread.tsx
│   │   ├── voice-waveform.tsx
│   │   └── ...
│   │
│   ├── server/
│   │   └── lib/
│   │       ├── chat/
│   │       │   ├── index.ts      # Stream handler entry
│   │       │   ├── tools.ts      # Tool definitions
│   │       │   └── models.ts    # LLM model selection
│   │       ├── rag/
│   │       │   ├── embeddings.ts
│   │       │   ├── vector-search.ts
│   │       │   └── types.ts
│   │       ├── reasoning-tool.ts
│   │       └── rate-limit.ts
│   │
│   ├── lib/
│   │   ├── payload-api.ts       # Payload REST client
│   │   ├── knowledge-base.ts    # Static RAG knowledge array
│   │   ├── ai-sdk-attachments.ts
│   │   ├── shiki-config.ts
│   │   ├── sse.ts
│   │   ├── utils.ts
│   │   └── ...
│   │
│   └── hooks/                   # React hooks
│       ├── use-autosize-textarea.ts
│       ├── use-auto-scroll.ts
│       ├── use-citations.ts
│       └── ...
│
├── collections/                 # Payload CMS collection definitions
├── docs/                       # Architecture + API docs
├── public/
│   ├── og-work.png
│   └── og-work-page.png
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## `flutter_app/` — Flutter Desktop + Mobile

```
flutter_app/
├── lib/
│   ├── main.dart
│   ├── chat_repository.dart    # SSE + REST chat client
│   ├── providers/              # Riverpod providers
│   └── ...
├── README.md
└── pubspec.yaml
```

---

## Key Files

| File | Purpose |
|------|---------|
| `web/src/server/lib/chat/index.ts` | Main streaming handler |
| `web/src/server/lib/rag/embeddings.ts` | Cohere embed-v4 integration |
| `web/src/server/lib/rag/vector-search.ts` | Qdrant search logic |
| `web/src/lib/knowledge-base.ts` | Static RAG knowledge (1600 lines) |
| `web/src/components/artifact-renderer.tsx` | Streamdown markdown renderer |
| `web/src/app/(payload)/api/graphql/route.ts` | Payload GraphQL endpoint |
| `web/collections/` | Payload collection schemas |