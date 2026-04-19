# Vercel AI SDK Direct Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task.

**Goal:** Complete Vercel AI SDK migration using primitives directly (no wrapper abstractions).

**Architecture:** Use `useChat` hook directly in components with AI SDK's native `UIMessage` type. No intermediate layers.

**Tech Stack:** Next.js 16, React 19, Vercel AI SDK v6 (`ai`, `@ai-sdk/react`), Groq via `@ai-sdk/groq`

**QWEN.md Compliance:**
- ✅ Simplicity First: Direct AI SDK usage, no abstractions
- ✅ Explicit over clever: UIMessage types used directly
- ✅ DRY: No duplicate type definitions
- ✅ No wrapper components

---

## Phase 1: Clean Up Wrapper (Tasks 1-3)

### Task 1: Delete useChatWrapper Files

**Files:**
- Delete: `src/lib/use-chat-wrapper.ts`
- Delete: `src/lib/__tests__/use-chat-wrapper.test.ts`

**Steps:**

1. Delete files:
```bash
cd D:\work\otherdev-web-v2\web
rm src/lib/use-chat-wrapper.ts src/lib/__tests__/use-chat-wrapper.test.ts
```

2. Verify deletion:
```bash
ls src/lib/use-chat-wrapper.ts  # Should not exist
```

3. Commit:
```bash
git add -A
git commit -m "refactor: remove useChatWrapper abstraction"
```

**Verification:** No files reference `useChatWrapper`

---

### Task 2: Update otherdev-loom-thread.tsx Imports

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Steps:**

1. Replace imports (lines 49-53):
```typescript
// Remove
import { useChatWrapper } from "@/lib/use-chat-wrapper";

// Add
import { useChat } from "@ai-sdk/react";
import { UIMessage, DefaultChatTransport } from "ai";
```

2. Commit:
```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: import AI SDK primitives directly"
```

---

### Task 3: Replace useChatWrapper with useChat

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Steps:**

1. Replace hook call in `OtherDevLoomThread` (around line 395):
```typescript
// Before
const { messages, sendMessage } = useChatWrapper();

// After
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    api: "/api/chat/stream",
  }),
  experimental_throttle: 100,
});
```

2. Commit:
```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: use useChat directly"
```

---

## Phase 2: Fix Message Types (Tasks 4-7)

### Task 4: Update UserMessage Component

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Steps:**

1. Update component signature and content extraction:
```typescript
function UserMessage({ message }: { message: UIMessage }) {
  const textContent = message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("") || "";

  const fileParts = (message.parts?.filter((p) => p.type === "file") as Array<{
    type: "file";
    mediaType: string;
    url: string;
  }>) || [];

  // ... rest of component
}
```

2. Replace `message.content` references with `textContent`

3. Commit:
```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: UserMessage uses UIMessage directly"
```

---

### Task 5: Update AssistantMessage Component

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Steps:**

1. Update component signature:
```typescript
function AssistantMessage({
  message,
  setActiveArtifact,
}: {
  message: UIMessage;
  setActiveArtifact: (artifact: ArtifactToolCall | null) => void;
}) {
  const textPart = message.parts
    ?.filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("") || "";

  const toolCallPart = message.parts?.find(
    (part) => part.type === "tool-invocation",
  );

  // ... rest
}
```

2. Commit:
```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: AssistantMessage uses UIMessage directly"
```

---

### Task 6: Fix Message Rendering Logic

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Steps:**

1. Update message rendering (around line 620):
```typescript
{messages.map((message) =>
  message.role === "user" ? (
    <UserMessage key={message.id} message={message} />
  ) : (
    <AssistantMessage
      key={message.id}
      message={message}
      setActiveArtifact={setActiveArtifact}
    />
  ),
)}
```

2. Remove any loading state that checks `messages[messages.length - 1]?.role === "assistant"` - use `status` instead:
```typescript
{status === "streaming" && (
  <div className="flex items-center gap-2">
    <Image src="/otherdev-chat-logo.svg" alt="Loading" width={32} height={32} className="animate-spin" />
    <span>Thinking...</span>
  </div>
)}
```

3. Commit:
```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: use AI SDK status for loading state"
```

---

### Task 7: Verify TypeScript Compilation

**Steps:**

1. Run TypeScript check:
```bash
cd D:\work\otherdev-web-v2\web
bunx tsc --noEmit --skipLibCheck
```

2. Fix any remaining type errors

3. Expected: No errors in `otherdev-loom-thread.tsx`

---

## Phase 3: Cleanup (Tasks 8-10)

### Task 8: Remove Unused Imports

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Steps:**

1. Run Biome:
```bash
bunx biome check --write src/components/otherdev-loom-thread.tsx
```

2. Manually remove any unused imports

3. Commit:
```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: remove unused imports"
```

---

### Task 9: Update Message Storage (if still used)

**Files:**
- Check: `src/lib/message-storage.ts`
- Check: `src/lib/otherdev-runtime.tsx`

**Steps:**

1. If `message-storage.ts` is no longer used (since we're using AI SDK directly), delete it:
```bash
rm src/lib/message-storage.ts src/lib/__tests__/message-storage.test.ts
```

2. If `otherdev-runtime.tsx` still uses `@assistant-ui/react`, keep it for now (Phase 4 removal)

3. Commit:
```bash
git add -A
git commit -m "refactor: remove unused message storage"
```

---

### Task 10: Final Verification

**Steps:**

1. Run dev server:
```bash
bun run dev
```

2. Test in browser:
- Send a message → should see response
- Check console for errors
- Verify attachments work
- Verify artifact tool calls work

3. Run tests:
```bash
bun test
```

4. Document completion in plan file

---

## Success Criteria

- [ ] No `useChatWrapper` or similar abstractions
- [ ] `useChat` used directly in components
- [ ] `UIMessage` type used throughout
- [ ] Messages display correctly
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] All existing features work (attachments, artifacts, suggestions)
