# Vercel AI SDK Migration Completion Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task.

**Goal:** Complete the migration from `@assistant-ui/react` to direct Vercel AI SDK usage. The component already imports `useChat` but still uses `useOtherDevRuntime` internally.

**Current State Analysis:**
- `otherdev-loom-thread.tsx` imports `useChat` from `@ai-sdk/react` but doesn't use it
- `useOtherDevRuntime` in `otherdev-runtime.tsx` is the actual chat runtime (100% assistant-ui based)
- Custom SSE streaming in `/api/chat/stream` route
- `OcrAttachmentAdapter` handles attachments via assistant-ui pattern
- Messages use `ThreadMessage` type from assistant-ui

**Target State:**
- `useChat` hook used directly for all chat logic
- AI SDK's `experimental_attachments` for file uploads
- AI SDK tools pattern for artifact generation
- `UIMessage` type throughout

**Tech Stack:** Next.js 16, React 19, Vercel AI SDK v6 (`ai`, `@ai-sdk/react`), `@ai-sdk/groq`

**Rollback:** Keep `@assistant-ui/react` installed until Phase 3 passes all tests.

---

## Phase 1: API Route Migration (Tasks 1-4)

### Task 1: Update Chat Stream Route to Use AI SDK Tools

**Files:**
- Modify: `src/app/api/chat/stream/route.ts`

**Context:** Current route uses custom SSE format with events: `reasoning`, `content`, `tool-call`, `suggestion`, `content-final`. Need to convert to AI SDK's `streamText` with tools.

**Step 1: Read current route implementation**

Read: `src/app/api/chat/stream/route.ts`

**Step 2: Add AI SDK imports**

Add to top of file:
```typescript
import { streamText, tool } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
```

**Step 3: Add artifact tool definition**

Add before POST function:
```typescript
const artifactTool = tool({
  description: "Create a code artifact for the user",
  parameters: z.object({
    title: z.string(),
    description: z.string(),
    code: z.string(),
    language: z.string(),
  }),
  execute: async ({ title, description, code, language }) => {
    // Return artifact data - UI will handle display
    return { success: true, title, description, code, language };
  },
});
```

**Step 4: Replace POST handler with AI SDK streamText**

Replace entire POST function with:
```typescript
export async function POST(request: Request) {
  const { messages, hasImageContent, supportsArtifacts } = await request.json();

  const groq = createGroq();
  const CHAT_MODEL = "llama-3.1-70b-versatile";

  const result = streamText({
    model: groq(CHAT_MODEL),
    messages,
    tools: supportsArtifacts ? { createArtifact: artifactTool } : undefined,
    experimental_attachments: hasImageContent ? messages.filter((m: any) => m.attachments?.length > 0) : undefined,
  });

  return result.toDataStreamResponse();
}
```

**Step 5: Run TypeScript check**

Run:
```bash
cd D:\work\otherdev-web-v2\web
bunx tsc --noEmit --skipLibCheck
```

Expected: No errors in route file

**Step 6: Commit**

```bash
git add src/app/api/chat/stream/route.ts
git commit -m "feat: migrate chat route to AI SDK streamText with tools"
```

---

### Task 2: Test API Route Manually

**Files:**
- Test: Manual browser testing

**Step 1: Start dev server**

Run:
```bash
bun run dev
```

**Step 2: Test basic chat**

Open browser, send message "Hello", verify response streams correctly

**Step 3: Test artifact generation**

Send: "Create a simple calculator in JavaScript", verify tool is called

**Step 4: Verify no console errors**

Check browser console for any errors

---

## Phase 2: Component Migration (Tasks 3-7)

### Task 3: Replace useOtherDevRuntime with useChat

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`
- Delete: `src/lib/otherdev-runtime.tsx`

**Step 1: Read current component to find useOtherDevRuntime usage**

Read: `src/components/otherdev-loom-thread.tsx` (find where `runtime` is used)

**Step 2: Replace runtime hook with useChat**

In `OtherDevLoomThread` component, replace:
```typescript
const { messages, onNew, onCancel, suggestion, clear } = useOtherDevRuntime();
```

With:
```typescript
const {
  messages,
  sendMessage,
  status,
  error,
  stop,
  setMessages,
  addToolResult,
} = useChat({
  api: "/api/chat/stream",
  experimental_throttle: 100,
  onError: (error) => {
    console.error("Chat error:", error);
  },
});
```

**Step 3: Update message sending**

Replace all `onNew(message)` calls with `sendMessage(message)`.

**Step 4: Update cancel/stop**

Replace `onCancel()` with `stop()`.

**Step 5: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: replace useOtherDevRuntime with useChat hook"
```

---

### Task 4: Update Message Types to UIMessage

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Step 1: Update UserMessage component**

Replace component signature:
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

  // Update component to use textContent and fileParts
}
```

**Step 2: Update AssistantMessage component**

Replace component signature:
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

  // Update component
}
```

**Step 3: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: use UIMessage type in message components"
```

---

### Task 5: Migrate Attachment Handling

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`
- Modify: `src/lib/attachment-adapter.ts`

**Step 1: Add attachment state**

Add to component:
```typescript
const [attachments, setAttachments] = useState<File[]>([]);
const fileInputRef = useRef<HTMLInputElement>(null);
```

**Step 2: Add file input handler**

```typescript
const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length + attachments.length > 5) {
    toast.error("Maximum 5 attachments allowed");
    return;
  }
  setAttachments((prev) => [...prev, ...files]);
}, [attachments.length]);
```

**Step 3: Replace ComposerPrimitive.Attachments**

Find and replace the attachment rendering with manual implementation using `attachments` state.

**Step 4: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: migrate attachments to AI SDK pattern"
```

---

### Task 6: Update Loading State

**Files:**
- Modify: `src/components/otherdev-loom-thread.tsx`

**Step 1: Replace loading indicator**

Replace any logic checking `messages[messages.length - 1]?.role === "assistant"` with:
```typescript
{status === "streaming" && (
  <div className="flex items-center gap-2">
    <Image src="/otherdev-chat-logo.svg" alt="Loading" width={32} height={32} className="animate-spin" />
    <span>Thinking...</span>
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/components/otherdev-loom-thread.tsx
git commit -m "refactor: use AI SDK status for loading state"
```

---

### Task 7: Clean Up Unused Code

**Files:**
- Delete: `src/lib/otherdev-runtime.tsx`
- Delete: `src/lib/attachment-adapter.ts`
- Delete: `src/lib/use-local-storage-messages.ts` (if only used by runtime)
- Modify: `src/components/__tests__/otherdev-loom-thread.test.tsx`

**Step 1: Verify files are unused**

Run:
```bash
cd D:\work\otherdev-web-v2\web
rg "useOtherDevRuntime|OcrAttachmentAdapter" --type ts --type tsx
```

**Step 2: Delete unused files**

```bash
rm src/lib/otherdev-runtime.tsx src/lib/attachment-adapter.ts
```

**Step 3: Update test file**

Remove `@assistant-ui/react` mocks from test file.

**Step 4: Run Biome to clean imports**

```bash
bunx biome check --write src/components/otherdev-loom-thread.tsx
```

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove assistant-ui runtime files"
```

---

## Phase 3: Remove Dependencies (Tasks 8-10)

### Task 8: Remove @assistant-ui/react Packages

**Files:**
- Modify: `package.json`

**Step 1: Remove packages**

Run:
```bash
bun remove @assistant-ui/react @assistant-ui/react-ai-sdk
```

**Step 2: Verify removal**

Run:
```bash
bun list --depth=0 | findstr assistant
```
Expected: No results

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: remove @assistant-ui/react dependencies"
```

---

### Task 9: Fix TypeScript Errors

**Files:**
- Any files with remaining @assistant-ui imports

**Step 1: Run full TypeScript check**

Run:
```bash
bunx tsc --noEmit
```

**Step 2: Fix any remaining errors**

Fix imports/types that reference assistant-ui

**Step 3: Commit**

```bash
git add src/
git commit -m "fix: resolve TypeScript errors after assistant-ui removal"
```

---

### Task 10: Final Verification

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

- [ ] Send text message → receives response
- [ ] Send message with image → image processed correctly
- [ ] Send message with document → text extracted
- [ ] Trigger artifact generation → artifact displays
- [ ] Voice recording → works
- [ ] Suggested prompts → displays and clickable
- [ ] Message persistence → refresh page, messages persist
- [ ] Stop generation → stops correctly
- [ ] Error handling → shows error message

**Step 4: Update plan document**

Add completion date and notes to this file.

**Step 5: Create git tag**

```bash
git tag -a ai-sdk-migration-complete -m "Vercel AI SDK migration complete"
```

---

## Success Criteria

- [ ] `useChat` hook used directly in component
- [ ] `UIMessage` type used throughout
- [ ] No `@assistant-ui/react` imports anywhere
- [ ] No `@assistant-ui/react` packages installed
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] Build succeeds
- [ ] All features work: chat, attachments, artifacts, suggestions, voice
