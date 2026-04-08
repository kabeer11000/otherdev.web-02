# Groq Citations System

Professional citation display for Groq compound models (openai/gpt-oss-120b, groq/compound) with AI SDK.

## Overview

This system implements the three-step citation strategy for Groq compound models:

1. **Disable** - Keep response text clean (no `【1†source】` markers)
2. **Extract** - Pull search results from tool executions
3. **Map** - Display with custom UI components

## Files

```
src/
├── lib/
│   └── groq-citations.ts       # Citation extraction utilities
├── hooks/
│   └── use-citations.ts        # React hooks for citation extraction
└── components/ui/
    ├── source.tsx              # Source hover card component (provided)
    └── citations.tsx           # Citation display components
```

## Setup

### 1. Enable browserSearch in API Route

Your API route must enable the `browserSearch` tool for citations to work:

```typescript
// src/app/api/chat/stream/route.ts
import { groqAI } from "@ai-sdk/groq"

const result = streamText({
  model: groqAI("openai/gpt-oss-120b"),
  toolChoice: "required", // or "auto"
  tools: {
    browser_search: groqAI.tools.browserSearch({}),
  },
  // ... other options
})
```

### 2. Use the Citation Hook

```typescript
// In your chat component
import { useCitations } from "@/hooks/use-citations"
import { Citations } from "@/components/ui/citations"

function ChatComponent() {
  const { messages } = useChat()
  const { citations } = useCitations({ messages })
  
  return (
    <div>
      {/* Your message rendering */}
      
      {/* Show citations when available */}
      {citations.length > 0 && (
        <Citations citations={citations} variant="pills" />
      )}
    </div>
  )
}
```

## Components

### Citations

Main component for displaying citations.

```tsx
<Citations 
  citations={citations} 
  variant="pills" // "pills" | "footnotes" | "inline"
  className="mt-4"
/>
```

**Variants:**

- **pills** (default): Horizontal scrollable list with favicon badges
- **footnotes**: Vertical list with full SourceContent cards
- **inline**: Not implemented (returns null)

### CitationInline

For inline citations within text:

```tsx
<p>
  According to recent reports
  <CitationInline citation={citations[0]} />
  the company has grown significantly.
</p>
```

### Source (Base Component)

Hover card component that shows source details on hover:

```tsx
<Source href="https://example.com">
  <SourceTrigger label="Source 1" showFavicon />
  <SourceContent 
    title="Article Title" 
    description="Brief description or snippet" 
  />
</Source>
```

## Hooks

### useCitations

Extract citations from all messages:

```typescript
const { citations } = useCitations({ messages })
```

### useLatestCitations

Extract citations from the most recent assistant message only:

```typescript
const { citations } = useLatestCitations({ messages })
```

## Utilities

### extractCitationsFromAISDK

Extract citations from AI SDK tool results:

```typescript
import { extractCitationsFromAISDK } from "@/lib/groq-citations"

const citations = extractCitationsFromAISDK({
  toolResults: [
    {
      toolCallId: "call_123",
      toolName: "browserSearch",
      result: {
        results: [
          {
            title: "Article Title",
            url: "https://example.com",
            snippet: "Description...",
          }
        ]
      }
    }
  ]
})
```

### extractCitationsFromGroqAPI

Extract citations from Groq native API responses:

```typescript
import { extractCitationsFromGroqAPI } from "@/lib/groq-citations"

const citations = extractCitationsFromGroqAPI(executedTools)
```

### cleanCitationMarkers

Remove citation markers from text:

```typescript
import { cleanCitationMarkers } from "@/lib/groq-citations"

const cleanText = cleanCitationMarkers("Hello [1] world【2†source】")
// "Hello world"
```

## Citation Object

```typescript
interface Citation {
  id: number           // 1-based index
  title: string        // Article/page title
  url: string          // Full URL
  domain: string       // Domain (e.g., "bloomberg.com")
  snippet: string      // Description/snippet
  publishedDate?: string // Optional publication date
}
```

## Example: Full Integration

```typescript
"use client"

import { useChat } from "@ai-sdk/react"
import { useCitations } from "@/hooks/use-citations"
import { Citations } from "@/components/ui/citations"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

export function ChatWithCitations() {
  const { messages } = useChat()
  const { citations } = useLatestCitations({ messages })
  
  const lastMessage = messages[messages.length - 1]
  
  return (
    <div className="space-y-4">
      {lastMessage?.role === "assistant" && (
        <>
          <MarkdownRenderer 
            content={lastMessage.parts?.[0]?.text || ""} 
          />
          
          {citations.length > 0 && (
            <Citations 
              citations={citations} 
              variant="pills"
              className="border-t pt-4 mt-4"
            />
          )}
        </>
      )}
    </div>
  )
}
```

## Notes

1. **Citations only appear when browserSearch is triggered** - The model decides when to search. Use `toolChoice: "required"` to force it, or `toolChoice: "auto"` for automatic decisions.

2. **Query type matters** - Search-like queries (3+ tokens, not conversational) are more likely to trigger browser search.

3. **Empty citations are handled** - The `Citations` component returns `null` if there are no citations.

4. **Favicons use Google's service** - The `SourceTrigger` component fetches favicons from `https://www.google.com/s2/favicons`.

## Troubleshooting

### No citations appearing

1. Check that `browser_search` tool is enabled in your API route
2. Verify `toolChoice` is set to `"required"` or `"auto"`
3. Ensure the query is search-like (not conversational)
4. Check browser console for tool execution logs

### Citations showing but empty

Check the tool result structure in your hook. The extraction expects:
```typescript
{
  toolName: "browserSearch",
  result: {
    results: [{ title, url, snippet, ... }]
  }
}
```

### TypeScript errors

Ensure you're importing types correctly:
```typescript
import { type Citation } from "@/lib/groq-citations"
```
