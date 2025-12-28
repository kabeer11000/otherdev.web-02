# OtherDev AI Page Implementation Plan

## Overview
Create a new `/ai` page using `@assistant-ui/react` library with OtherDev Loom-style UI, utilizing the existing `/api/chat/stream` backend (no backend changes).

## Current State Analysis

### Existing Backend
- **Endpoint**: `/api/chat/stream`
- **Location**: `src/app/api/chat/stream/route.ts`
- **Technology**: Groq LLM (openai/gpt-oss-120b) + RAG
- **Streaming Format**: Server-Sent Events (SSE)
  - Format: `data: {"content": "..."}\n\n`
  - End signal: `data: [DONE]\n\n`
- **Features**:
  - Rate limiting (10 req/min per IP)
  - Vector search via Supabase
  - Input sanitization
  - Prompt injection protection

### Existing Chat Widget
- **Location**: `src/components/chat-widget.tsx`
- **Type**: Floating modal widget
- **Status**: Keep as-is, no changes

### Installed Packages
- `@assistant-ui/react@0.11.53`
- `@assistant-ui/react-ai-sdk@1.1.20`
- `@assistant-ui/react-markdown@0.11.9`
- `remark-gfm@4.0.1`
- `zustand@5.0.9`

## Implementation Plan

### Phase 1: Runtime Adapter (Custom Backend Integration)

#### File: `src/lib/use-otherdev-runtime.tsx`

**Purpose**: Create a custom runtime adapter using `useExternalStoreRuntime` to connect assistant-ui with our existing `/api/chat/stream` backend.

**Key Requirements**:
1. Use `useExternalStoreRuntime` from `@assistant-ui/react`
2. Manage messages state as `ThreadMessage[]` type
3. Handle SSE streaming from `/api/chat/stream`
4. Parse `data: {"content": "..."}` format
5. Handle `[DONE]` signal
6. Support abort/cancel functionality
7. Proper error handling and status management

**Message Flow**:
```
User Input → AppendMessage → API Call → SSE Stream → ThreadMessage updates → UI
```

**Types to Use**:
- `ThreadMessage` from `@assistant-ui/react`
- `AppendMessage` from `@assistant-ui/react`
- `ExternalStoreAdapter` interface

**State Management**:
- `messages`: Array of `ThreadMessage` objects
- `isRunning`: Boolean for loading state
- `abortController`: For cancellation support

**Implementation Steps**:
1. Import required types and hooks
2. Create state for messages and isRunning
3. Implement `onNew` callback that:
   - Adds user message to state
   - Calls `/api/chat/stream` with proper format
   - Streams response and updates assistant message
   - Handles errors and completion
4. Implement `onCancel` callback
5. Return `useExternalStoreRuntime` with adapter config

---

### Phase 2: Thread Component (OtherDev Loom-Style UI)

#### File: `src/components/otherdev-loom-thread.tsx`

**Purpose**: Create an OtherDev Loom-styled chat interface using assistant-ui primitives.

**Design Requirements** (from OtherDev Loom example):
- **Colors**:
  - Background: `#F5F5F0` (light), `#2b2a27` (dark)
  - Primary orange: `#ae5630`
  - Text: `#1a1a18` (light), `#eee` (dark)
  - Muted: `#6b6a68` (light), `#9a9893` (dark)
  - User bubble: `#DDD9CE` (light), `#393937` (dark)
  - Composer bg: `white` (light), `#1f1e1b` (dark)
- **Typography**:
  - Use `font-serif` throughout
  - Refined, readable aesthetic
- **Effects**:
  - Multi-layered shadows: `shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.035)]`
  - Smooth transitions: `duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)]`
  - Active states: `active:scale-[0.98]`

**Components to Use** (from `@assistant-ui/react`):
- `ThreadPrimitive.Root` - Main container
- `ThreadPrimitive.Viewport` - Scrollable message area
- `ThreadPrimitive.Messages` - Message list
- `ThreadPrimitive.Empty` - Empty state
- `MessagePrimitive.Root` - Individual message
- `MessagePrimitive.Content` - Message content
- `ComposerPrimitive.Root` - Input composer
- `ComposerPrimitive.Input` - Text input
- `ComposerPrimitive.Send` - Submit button
- `ContentPart.Text` - Text content renderer

**Markdown Rendering**:
- Use `@assistant-ui/react-markdown`
- Apply `remark-gfm` for GitHub-flavored markdown
- Match existing markdown styling from `src/components/ui/markdown-renderer.tsx`

**Layout Structure**:
```
ThreadPrimitive.Root (warm beige background, full height)
├── ThreadPrimitive.Viewport (scrollable)
│   ├── ThreadPrimitive.Empty (when no messages)
│   │   └── Welcome message + suggestions
│   └── ThreadPrimitive.Messages
│       └── MessagePrimitive.Root (for each message)
│           ├── Avatar (if assistant)
│           └── MessagePrimitive.Content
│               └── ContentPart.Text (with markdown)
└── ComposerPrimitive.Root (fixed bottom, white bg)
    ├── ComposerPrimitive.Input (serif font)
    └── ComposerPrimitive.Send (orange accent)
```

**Implementation Steps**:
1. Import all required primitives
2. Create styled components following OtherDev Loom design
3. Configure markdown renderer
4. Add empty state with suggestions
5. Style message bubbles (user vs assistant)
6. Style composer with serif input
7. Add proper spacing and responsive design

---

### Phase 3: AI Page Route

#### File: `src/app/ai/page.tsx`

**Purpose**: Create the main AI page route that uses the runtime and thread component.

**Page Structure**:
```tsx
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useOtherDevRuntime } from "@/lib/use-otherdev-runtime";
import { OtherDevLoomThread } from "@/components/otherdev-loom-thread";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "OtherDev AI | AI-Powered Assistance",
  description: "Chat with OtherDev AI to learn about our services, projects, and expertise",
};

function AIPageContent() {
  const runtime = useOtherDevRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <OtherDevLoomThread />
    </AssistantRuntimeProvider>
  );
}

export default function AIPage() {
  return (
    <>
      <Navigation />
      <main className="h-screen pt-[60px]">
        <AIPageContent />
      </main>
      <Footer />
    </>
  );
}
```

**Requirements**:
1. Must be a client component (`"use client"`) for the content
2. Metadata for SEO
3. Full-height layout (h-screen)
4. Account for navigation height
5. Include Navigation and Footer

**Implementation Steps**:
1. Create page.tsx with metadata export
2. Create client component for runtime
3. Wrap with AssistantRuntimeProvider
4. Add Navigation and Footer
5. Configure full-height layout

---

### Phase 4: Navigation Update

#### File: `src/components/navigation.tsx`

**Purpose**: Add "OtherDev AI" or "ai" link to navigation.

**Changes Required**:
1. Add new nav item in mobile menu (lines 110-179)
2. Add new nav item in desktop menu (lines 220-282)
3. Follow existing pattern with `navItemVariants`
4. Use pathname matching: `pathname?.startsWith("/ai")`

**Mobile Menu Addition** (after "about" button):
```tsx
<motion.div
  initial={{ opacity: 0, x: -10 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.27, duration: 0.3 }}
>
  <Link
    href="/ai"
    data-slot="nav-item"
    className={cn(
      navItemVariants({
        size: "mobile",
        active: pathname?.startsWith("/ai"),
      }),
    )}
  >
    ai
  </Link>
</motion.div>
```

**Desktop Menu Addition** (after "about" link):
```tsx
<Link
  href="/ai"
  data-slot="nav-item"
  className={cn(
    navItemVariants({
      size: "default",
      active: pathname?.startsWith("/ai"),
    }),
  )}
>
  ai
</Link>
```

**Implementation Steps**:
1. Add mobile nav item with proper animation delay
2. Add desktop nav item
3. Ensure active state works correctly
4. Test mobile menu animation sequence

---

## Testing Checklist

### Functional Testing
- [ ] Runtime connects to `/api/chat/stream` correctly
- [ ] SSE streaming works and displays incrementally
- [ ] Messages persist in state
- [ ] Error handling works (network errors, API errors)
- [ ] Cancel/abort functionality works
- [ ] Rate limiting displays properly

### UI Testing
- [ ] OtherDev Loom color palette applied correctly
- [ ] Serif typography throughout
- [ ] Shadows and effects render properly
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Navigation link highlights on `/ai` page
- [ ] Mobile menu animation works
- [ ] Empty state displays suggestions
- [ ] Markdown renders correctly (code blocks, lists, etc.)
- [ ] User vs assistant message styling differentiated

### Integration Testing
- [ ] No conflicts with existing chat widget
- [ ] Navigation works from all pages
- [ ] Footer displays correctly
- [ ] Dark mode support (if applicable)
- [ ] Accessibility (keyboard navigation, ARIA labels)

---

## File Checklist

### New Files
- [ ] `src/lib/use-otherdev-runtime.tsx` - Runtime adapter
- [ ] `src/components/otherdev-loom-thread.tsx` - Thread component
- [ ] `src/app/ai/page.tsx` - AI page route
- [ ] `AI_PAGE_IMPLEMENTATION_PLAN.md` - This file

### Modified Files
- [ ] `src/components/navigation.tsx` - Add AI link

### No Changes
- ✓ `src/app/api/chat/stream/route.ts` - Backend stays the same
- ✓ `src/components/chat-widget.tsx` - Widget stays the same
- ✓ All other existing files

---

## Success Criteria

1. New `/ai` page accessible from navigation
2. OtherDev Loom-style UI matches design requirements
3. Uses existing backend without modifications
4. Streaming responses work correctly
5. No breaking changes to existing features
6. Follows all CLAUDE.md guidelines:
   - Read existing files first
   - Follow established patterns
   - Use existing tech stack
   - No wrapper solutions
   - Industry standard implementation
   - Proper optimization

---

## Next Steps After Plan Approval

1. Get user approval on this plan
2. Implement runtime adapter
3. Build thread component
4. Create AI page
5. Update navigation
6. Run full testing checklist
7. Deploy and verify
