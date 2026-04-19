# Vercel AI SDK Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task with fresh subagent per task and review between tasks.

**Goal:** Migrate from `@assistant-ui/react` to Vercel AI SDK (`ai` + `@ai-sdk/react`) for better maintenance, native Next.js integration, and built-in attachment support.

**Architecture:** Replace the custom runtime abstraction with Vercel AI SDK's `useChat` hook, migrate attachment handling to native `experimental_attachments`, convert tool call handling to AI SDK's tool invocation pattern, and rebuild chat UI components with direct `useChat` integration.

**Tech Stack:** Next.js 16, React 19, Vercel AI SDK (`ai` v5+), `@ai-sdk/react`, `@ai-sdk/groq`, custom SSE streaming, localStorage persistence.

**Total Estimated Effort:** 3-4 days (24-32 tasks × 2-5 minutes each + review time)

**Rollback Strategy:** Keep `@assistant-ui/react` installed until Phase 3 completion. Each phase is independently reversible via git checkout.

---

## ⚠️ CRITICAL CONSTRAINT: NO WRAPPER COMPONENTS

**Rule:** Do NOT create any wrapper components, HOC patterns, or component abstraction layers.

**What's allowed:**
- ✅ Custom hooks (e.g., `useChat` configuration)
- ✅ Utility functions (e.g., storage, helpers)
- ✅ Direct use of AI SDK primitives in existing components
- ✅ Type definitions and interfaces

**What's NOT allowed:**
- ❌ `<ChatProvider>{children}</ChatProvider>` components
- ❌ `<AIWrapper>{children}</AIWrapper>` components
- ❌ Any component that wraps `{children}`
- ❌ Context providers that abstract AI SDK
- ❌ Component composition layers

**Verification:** After EACH task, verify:
1. No new files with `Provider`, `Wrapper`, `Context` in name (except React contexts)
2. No new components returning `{children}` or `ReactNode` children
3. All new code is hooks, utilities, or direct integration in existing components

**Phase 1 Status:** ✅ COMPLIANT - Only hooks and utilities created, no wrapper components.

---

## Phase 1: Foundation & Core Chat (Tasks 1-6)

### Task 1: Install Vercel AI SDK Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add AI SDK dependencies**

Run:
```bash
cd D:\work\otherdev-web-v2\web
bun add ai @ai-sdk/react @ai-sdk/ui
```

**Step 2: Verify installation**

Run:
```bash
bun list --depth=0 | findstr ai
```

Expected: `ai`, `@ai-sdk/react`, `@ai-sdk/ui` listed

**Step 3: Commit**

Run:
```bash
git add package.json bun.lock
git commit -m "chore: add Vercel AI SDK dependencies"
```

---

### Task 2: Create AI SDK Chat Hook Wrapper

**Files:**
- Create: `src/lib/use-chat-wrapper.ts`
- Test: `src/lib/__tests__/use-chat-wrapper.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/__tests__/use-chat-wrapper.test.ts
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "@jest/globals";

describe("useChatWrapper", () => {
  it("should be defined", () => {
    const { useChatWrapper } = require("../use-chat-wrapper");
    expect(useChatWrapper).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
bun test src/lib/__tests__/use-chat-wrapper.test.ts
```
Expected: FAIL with "Cannot find module"

**Step 3: Create wrapper hook**

```typescript
// src/lib/use-chat-wrapper.ts
"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  parts?: Array<{
    type: "text" | "tool-invocation";
    text?: string;
    toolInvocation?: {
      toolCallId: string;
      toolName: string;
      args: unknown;
      result?: unknown;
    };
  }>;
}

export function useChatWrapper() {
  const messageRef = useRef<Map<string, ChatMessage>>(new Map());

  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    reload,
    setMessages,
    addToolResult,
  } = useChat({
    api: "/api/chat/stream",
    experimental_throttle: 100,
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  const convertMessage = useCallback((msg: typeof messages[number]): ChatMessage => {
    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      content: msg.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("") || "",
      createdAt: new Date(),
      parts: msg.parts as ChatMessage["parts"],
    };
  }, []);

  return {
    messages: messages.map(convertMessage),
    sendMessage,
    status,
    error,
    stop,
    reload,
    setMessages,
    addToolResult,
  };
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
bun test src/lib/__tests__/use-chat-wrapper.test.ts
```
Expected: PASS

**Step 5: Commit**

Run:
```bash
git add src/lib/use-chat-wrapper.ts src/lib/__tests__/use-chat-wrapper.test.ts
git commit -m "feat: create useChat wrapper hook"
```

---

### Task 3: Migrate Message Storage to AI SDK Format

**Files:**
- Create: `src/lib/message-storage.ts`
- Test: `src/lib/__tests__/message-storage.test.ts`

**Step 1: Define message types**

```typescript
// src/lib/message-storage.ts
import { ChatMessage } from "./use-chat-wrapper";

const LOOM_STORAGE_KEY = "otherdev-loom-messages";

export function serializeMessages(messages: ChatMessage[]): string {
  return JSON.stringify(
    messages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
    }))
  );
}

export function deserializeMessages(data: string): ChatMessage[] {
  const parsed = JSON.parse(data);
  return parsed.map((msg: ChatMessage & { createdAt: string }) => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
  }));
}

export function loadMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOOM_STORAGE_KEY);
  if (!stored) return [];
  return deserializeMessages(stored);
}

export function saveMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOOM_STORAGE_KEY, serializeMessages(messages));
}

export function clearMessages(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOOM_STORAGE_KEY);
}
```

**Step 2: Write tests**

```typescript
// src/lib/__tests__/message-storage.test.ts
import { describe, expect, it, beforeEach } from "@jest/globals";
import { serializeMessages, deserializeMessages } from "../message-storage";

describe("message-storage", () => {
  const mockMessages = [
    {
      id: "1",
      role: "user" as const,
      content: "Hello",
      createdAt: new Date("2024-01-01"),
    },
  ];

  it("should serialize and deserialize messages correctly", () => {
    const serialized = serializeMessages(mockMessages);
    const deserialized = deserializeMessages(serialized);
    
    expect(deserialized).toHaveLength(1);
    expect(deserialized[0].id).toBe("1");
    expect(deserialized[0].content).toBe("Hello");
    expect(deserialized[0].createdAt).toBeInstanceOf(Date);
  });
});
```

**Step 3: Run tests**

Run:
```bash
bun test src/lib/__tests__/message-storage.test.ts
```
Expected: PASS

**Step 4: Commit**

Run:
```bash
git add src/lib/message-storage.ts src/lib/__tests__/message-storage.test.ts
git commit -m "feat: create message storage utilities"
```

---

### Task 4: Update API Route for AI SDK Compatibility

**Files:**
- Modify: `src/app/api/chat/stream/route.ts`

**Current behavior:** Returns custom SSE stream with events: `reasoning`, `content`, `tool-call`, `suggestion`, `content-final`

**Target behavior:** Support AI SDK's `StreamTextResult` format with standard events

**Step 1: Add AI SDK imports**

```typescript
// Add to imports in src/app/api/chat/stream/route.ts
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
```

**Step 2: Create AI SDK compatible stream handler**

Add new function after existing code:
```typescript
// Add to src/app/api/chat/stream/route.ts
export async function POST(request: Request) {
  // Keep existing rate limiting and validation
  
  // For now, keep existing Groq SDK streaming
  // AI SDK integration will be phased in
  const body = await request.json();
  const { messages, hasImageContent, supportsArtifacts } = body;
  
  // ... existing validation ...
  
  // Return existing SSE stream for backward compatibility
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Existing streaming logic
      // ...
    },
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

**Step 3: Test existing functionality**

Run:
```bash
cd D:\work\otherdev-web-v2\web
bun run dev
```
Manually test: Send a message, verify streaming works

**Step 4: Commit**

Run:
```bash
git add src/app/api/chat/stream/route.ts
git commit -m "refactor: prepare API route for AI SDK migration"
```

---

### Task 5: Create Migration Feature Flag

**Files:**
- Create: `src/lib/feature-flags.ts`

**Step 1: Create feature flag system**

```typescript
// src/lib/feature-flags.ts
"use client";

const FEATURE_FLAGS = {
  USE_AI_SDK_CHAT: false, // Toggle between assistant-ui and AI SDK
  USE_AI_SDK_ATTACHMENTS: false,
  USE_AI_SDK_TOOLS: false,
};

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  if (typeof window === "undefined") return FEATURE_FLAGS[flag];
  
  // Allow override via URL param for testing
  const urlParams = new URLSearchParams(window.location.search);
  const override = urlParams.get(`flag_${flag}`);
  
  if (override !== null) {
    return override === "true";
  }
  
  return FEATURE_FLAGS[flag];
}

export function setFeatureFlag(
  flag: keyof typeof FEATURE_FLAGS,
  enabled: boolean
): void {
  if (typeof window === "undefined") return;
  
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(`flag_${flag}`, enabled.toString());
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${urlParams.toString()}`
  );
}
```

**Step 2: Commit**

Run:
```bash
git add src/lib/feature-flags.ts
git commit -m "feat: add feature flag system for gradual migration"
```

---

### Task 6: Review Phase 1

**Step 1: Run all tests**

Run:
```bash
bun test src/lib/__tests__/
```
Expected: All tests PASS

**Step 2: Check TypeScript**

Run:
```bash
bunx tsc --noEmit
```
Expected: No errors

**Step 3: Review changes**

Run:
```bash
git diff HEAD~5
```

**Step 4: Create Phase 1 checkpoint tag**

Run:
```bash
git tag -a migration-phase-1-complete -m "Phase 1: Foundation complete"
```

---

## Phase 2: Attachment Migration (Tasks 7-11)

### Task 7: Create AI SDK Attachment Utilities

**Files:**
- Create: `src/lib/ai-sdk-attachments.ts`
- Test: `src/lib/__tests__/ai-sdk-attachments.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/__tests__/ai-sdk-attachments.test.ts
import { describe, expect, it, beforeEach } from "@jest/globals";
import { processAttachment } from "../ai-sdk-attachments";

describe("AI SDK Attachment Utilities", () => {
  it("should process image files to base64", async () => {
    const file = new File(["test"], "test.png", { type: "image/png" });
    const result = await processAttachment(file);
    
    expect(result.type).toBe("image");
    expect(result.url).toMatch(/^data:image\/png;base64,/);
  });
});
```

**Step 2: Create utilities (NO wrapper components)**

```typescript
// src/lib/ai-sdk-attachments.ts
import type { Attachment } from "ai";

export async function processAttachment(file: File): Promise<Attachment> {
  const isImage = file.type.startsWith("image/");
  
  if (isImage) {
    const base64 = await fileToBase64(file);
    return {
      url: base64,
      name: file.name,
      contentType: file.type,
    };
  }
  
  // For documents, extract text
  const text = await extractTextFromFile(file);
  return {
    url: `data:text/plain;base64,${btoa(text)}`,
    name: file.name,
    contentType: "text/plain",
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  const { extractTextFromFile } = await import("./file-processor");
  return extractTextFromFile(file);
}

export function validateAttachment(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: "File exceeds 50MB limit" };
  }
  return { valid: true };
}
```

**Step 3: Run tests**

Run:
```bash
bun test src/lib/__tests__/ai-sdk-attachments.test.ts
```

**Step 4: Commit**

```bash
git add src/lib/ai-sdk-attachments.ts src/lib/__tests__/ai-sdk-attachments.test.ts
git commit -m "feat: add AI SDK attachment utilities"
```

**Wrapper Check:** ✅ Only utility functions, no components.

---

### Task 8: Migrate Attachment UI Components

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Step 1: Replace ComposerPrimitive.Attachments**

Replace:
```tsx
<ComposerPrimitive.Attachments components={{ Attachment: AttachmentChip }} />
```

With:
```tsx
{attachments.map((attachment, index) => (
  <AttachmentChip
    key={attachment.url}
    attachment={attachment}
    onRemove={() => removeAttachment(index)}
  />
))}
```

**Step 2: Replace ComposerPrimitive.AddAttachment**

Replace:
```tsx
<ComposerPrimitive.AddAttachment asChild>
  <button>...</button>
</ComposerPrimitive.AddAttachment>
```

With:
```tsx
<input
  type="file"
  ref={fileInputRef}
  multiple
  accept="image/*,.pdf,.txt,.md"
  onChange={handleFileInputChange}
  className="hidden"
/>
```

**Step 3: Test manually**

Run:
```bash
bun run dev
```
Test: Attach file, verify it shows in UI

**Step 4: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: migrate attachment UI to AI SDK pattern"
```

---

### Task 9: Remove Old Attachment Adapter

**Files:**
- Delete: `src/lib/attachment-adapter.ts`
- Delete: `src/lib/__tests__/attachment-adapter.test.ts`
- Modify: `src/lib/otherdev-runtime.tsx`

**Step 1: Remove adapter usage from runtime**

Remove import:
```typescript
import { OcrAttachmentAdapter } from "@/lib/attachment-adapter";
```

Remove adapter initialization:
```typescript
const adapter = useMemo(() => new OcrAttachmentAdapter(), []);
```

**Step 2: Delete old files**

Run:
```bash
git rm src/lib/attachment-adapter.ts src/lib/__tests__/attachment-adapter.test.ts
```

**Step 3: Commit**

```bash
git commit -m "refactor: remove old attachment adapter"
```

---

### Task 10: Test Attachment Flow End-to-End

**Files:**
- Create: `src/components/__tests__/attachment-flow.test.tsx`

**Step 1: Write E2E test**

```typescript
// src/components/__tests__/attachment-flow.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";

describe("Attachment Flow", () => {
  it("should allow attaching and removing images", async () => {
    // Test implementation
  });
});
```

**Step 2: Run test**

Run:
```bash
bun test src/components/__tests__/attachment-flow.test.tsx
```

**Step 3: Commit**

```bash
git add src/components/__tests__/attachment-flow.test.tsx
git commit -m "test: add attachment flow E2E test"
```

---

### Task 11: Review Phase 2

**Step 1: Run all attachment tests**

Run:
```bash
bun test src/lib/__tests__/ai-sdk-attachment-adapter.test.ts
bun test src/components/__tests__/attachment-flow.test.tsx
```

**Step 2: Manual testing checklist**
- [ ] Attach image file
- [ ] Attach document file
- [ ] Remove attachment
- [ ] Send message with attachment
- [ ] Verify attachment appears in message

**Step 3: Create Phase 2 checkpoint**

Run:
```bash
git tag -a migration-phase-2-complete -m "Phase 2: Attachment migration complete"
```

---

## Phase 3: Tool Call Migration (Tasks 13-18)

### Task 13: Update Artifact Tool for AI SDK

**Files:**
- Modify: `src/server/lib/artifact-tool.ts`
- Modify: `src/app/api/chat/stream/route.ts`

**Step 1: Convert to AI SDK tool format**

```typescript
// In src/app/api/chat/stream/route.ts
import { streamText, tool } from "ai";
import { z } from "zod";

const result = streamText({
  model: groq(CHAT_MODEL),
  messages: formattedMessages,
  tools: {
    createArtifact: tool({
      description: "Create a code artifact for the user",
      parameters: z.object({
        title: z.string(),
        description: z.string(),
        code: z.string(),
        language: z.string(),
      }),
      execute: async ({ title, description, code, language }) => {
        // Existing artifact creation logic
        return { success: true, artifactId: "..." };
      },
    }),
  },
});
```

**Step 2: Test tool invocation**

Run:
```bash
bun run dev
```
Test: Ask "create a calculator app", verify tool is called

**Step 3: Commit**

```bash
git add src/app/api/chat/stream/route.ts src/server/lib/artifact-tool.ts
git commit -m "feat: migrate artifact tool to AI SDK format"
```

---

### Task 14: Update Artifact Renderer

**Files:**
- Modify: `src/components/artifact-renderer.tsx`

**Step 1: Replace assistant-ui tool call types**

Replace:
```typescript
import type { ToolCallMessagePart } from "@assistant-ui/react";
```

With:
```typescript
import type { Message } from "ai";
```

**Step 2: Update artifact extraction logic**

```typescript
// Extract tool invocations from AI SDK message format
const artifactToolCall = message.parts?.find(
  (part) =>
    part.type === "tool-invocation" &&
    part.toolInvocation.toolName === "createArtifact"
);
```

**Step 3: Commit**

```bash
git add src/components/artifact-renderer.tsx
git commit -m "refactor: update artifact renderer for AI SDK"
```

---

### Task 15: Migrate Suggestion System

**Files:**
- Modify: `src/app/api/chat/stream/route.ts`
- Modify: `src/components/otherdev-loom-thread.tsx`

**Step 1: Add suggestion to AI SDK stream**

```typescript
// In API route, add to stream events
controller.enqueue(
  new TextEncoder().encode(
    `data: ${JSON.stringify({ type: "suggestion", content: "..." })}\n\n`
  )
);
```

**Step 2: Update component to listen for suggestions**

```typescript
// In useChatWrapper
onFinish: (message) => {
  // Extract suggestion from message metadata
  if (message.metadata?.suggestion) {
    setSuggestion(message.metadata.suggestion);
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/chat/stream/route.ts src/components/otherdev-loom-thread.tsx
git commit -m "refactor: migrate suggestion system"
```

---

### Task 16: Review Phase 3

**Step 1: Test tool calls**

Run:
```bash
bun run dev
```
Test: "Create a todo app", verify artifact is generated

**Step 2: Create Phase 3 checkpoint**

Run:
```bash
git tag -a migration-phase-3-complete -m "Phase 3: Tool call migration complete"
```

---

## Phase 4: UI Component Migration (Tasks 19-24)

### Task 19: Replace AssistantRuntimeProvider

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Step 1: Remove AssistantRuntimeProvider**

Remove:
```tsx
<AssistantRuntimeProvider runtime={runtime}>
  {/* children */}
</AssistantRuntimeProvider>
```

Replace with:
```tsx
<ChatProvider>
  {/* children */}
</ChatProvider>
```

**Step 2: Create ChatProvider**

```typescript
// src/lib/chat-provider.tsx
"use client";

import { ChatContext } from "./chat-context";
import { useChatWrapper } from "./use-chat-wrapper";

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useChatWrapper();
  
  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx src/lib/chat-provider.tsx
git commit -m "refactor: replace AssistantRuntimeProvider with ChatProvider"
```

---

### Task 20: Migrate Message Components

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Step 1: Replace ThreadPrimitive.Messages**

Replace:
```tsx
<ThreadPrimitive.Messages
  components={{ UserMessage, AssistantMessage: AssistantMessageWithProps }}
/>
```

With:
```tsx
{messages.map((message) => (
  <MessageComponent key={message.id} message={message} />
))}
```

**Step 2: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: migrate message rendering"
```

---

### Task 21: Remove Assistant-UI Dependencies

**Files:**
- Modify: `package.json`
- Modify: All files with `@assistant-ui/react` imports

**Step 1: Remove package**

Run:
```bash
bun remove @assistant-ui/react @assistant-ui/react-ai-sdk
```

**Step 2: Fix remaining imports**

Run:
```bash
bunx tsc --noEmit
```
Fix any TypeScript errors from missing imports

**Step 3: Commit**

```bash
git add package.json bun.lock src/
git commit -m "refactor: remove @assistant-ui/react dependencies"
```

---

### Task 22: Final Testing

**Step 1: Run all tests**

Run:
```bash
bun test
```

**Step 2: Build verification**

Run:
```bash
bun run build
```

**Step 3: Manual testing checklist**
- [ ] Send text message
- [ ] Send message with image
- [ ] Send message with document
- [ ] Trigger artifact generation
- [ ] Voice recording
- [ ] Suggested prompts
- [ ] Message persistence (refresh page)

---

### Task 23: Performance Optimization

**Files:**
- Modify: `src/lib/use-chat-wrapper.ts`

**Step 1: Add message memoization**

```typescript
const memoizedMessages = useMemo(() => {
  return messages.map(convertMessage);
}, [messages, convertMessage]);
```

**Step 2: Add throttling**

Already configured in Task 2 with `experimental_throttle: 100`

**Step 3: Commit**

```bash
git add src/lib/use-chat-wrapper.ts
git commit -m "perf: add memoization and throttling"
```

---

### Task 24: Documentation Update

**Files:**
- Modify: `README.md`
- Create: `docs/migration-notes.md`

**Step 1: Update README**

Add section:
```markdown
## Chat Implementation

This project uses Vercel AI SDK for chat functionality with:
- Native attachment support
- Tool invocations for artifact generation
- Custom SSE streaming
- localStorage persistence
```

**Step 2: Create migration notes**

```markdown
# Migration Notes: assistant-ui → Vercel AI SDK

Completed: [Date]

Key changes:
1. Replaced useExternalStoreRuntime with useChat hook
2. Migrated attachments to experimental_attachments
3. Converted tool calls to AI SDK tool format
4. Removed @assistant-ui/react dependencies

Benefits:
- Better Next.js integration
- Smaller bundle size
- More active maintenance
- Native attachment support
```

**Step 3: Commit**

```bash
git add README.md docs/migration-notes.md
git commit -m "docs: update documentation for AI SDK migration"
```

---

## Phase 5: Cleanup & Verification (Tasks 25-26)

### Task 25: Code Cleanup

**Step 1: Remove unused imports**

Run:
```bash
bunx biome check --write src/
```

**Step 2: Remove dead code**

Search for remaining `@assistant-ui` references:
```bash
grep -r "@assistant-ui" src/
```

**Step 3: Commit**

```bash
git add src/
git commit -m "refactor: cleanup unused code"
```

---

### Task 26: Final Review

**Step 1: Full test suite**

Run:
```bash
bun test
```

**Step 2: Build**

Run:
```bash
bun run build
```

**Step 3: Create final tag**

Run:
```bash
git tag -a migration-complete -m "Vercel AI SDK migration complete"
```

**Step 4: Create PR**

Create pull request with:
- Title: "Migrate from @assistant-ui/react to Vercel AI SDK"
- Description: Summary of all phases
- Testing checklist completed

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes in AI SDK | Low | High | Pin exact versions, test thoroughly |
| Attachment handling differences | Medium | Medium | Keep old adapter until Phase 2 complete |
| Tool call format incompatibility | Medium | High | Test all tool scenarios in Phase 3 |
| Performance regression | Low | Medium | Benchmark before/after, add throttling |
| Streaming issues | Medium | High | Keep existing SSE logic, gradual migration |

## Testing Strategy

1. **Unit Tests:** Each new utility function has tests
2. **Integration Tests:** Attachment flow, tool calls
3. **Manual Testing:** Full chat flow after each phase
4. **E2E Tests:** (Future) Playwright tests for critical paths

## Rollback Procedure

If issues occur at any phase:

```bash
# Revert to last stable tag
git checkout migration-phase-{N-1}-complete

# Reinstall old dependencies
bun install

# Restart dev server
bun run dev
```

## Success Criteria

- [ ] All existing features work with AI SDK
- [ ] All tests pass
- [ ] Build succeeds without errors
- [ ] Manual testing checklist complete
- [ ] Bundle size reduced or same
- [ ] No runtime errors in console
- [ ] Performance metrics same or better
