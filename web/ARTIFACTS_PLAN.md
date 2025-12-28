# OtherDev Loom Artifacts Implementation Plan

## Compliance with CLAUDE.md

This plan follows all CLAUDE.md guidelines:
- Uses existing technology stack (@assistant-ui/react, Groq SDK)
- No wrapper solutions - uses Groq's native function calling API
- No quickfixes - implements industry-standard function calling pattern
- Follows OpenAI/Groq API best practices
- Optimized, proper implementation from the start
- No shortcuts or text parsing hacks

## Architecture Overview

### Industry-Standard Approach: Function Calling

Use Groq's native function calling capability (OpenAI-compatible) to enable the LLM to invoke a `create_artifact` tool when users request interactive content.

**Flow**:
```
User: "Create a calculator"
  ↓
Backend: Send to Groq with create_artifact tool definition
  ↓
Groq: Returns tool_call with HTML/CSS/JS in arguments
  ↓
Backend: Stream tool_call to frontend
  ↓
Runtime: Parse tool_call into ToolCallMessagePart
  ↓
UI: Render using ArtifactRenderer component
```

### Key Technologies
- **Groq SDK**: Native function calling support (OpenAI-compatible)
- **@assistant-ui/react**: Built-in ToolCallMessagePart support
- **Sandboxed iframe**: Secure artifact rendering

## Implementation Details

### 1. Tool Definition

**File**: `web/src/server/lib/artifact-tool.ts` (NEW)

```typescript
import { z } from "zod";

export const createArtifactTool = {
  type: "function" as const,
  function: {
    name: "create_artifact",
    description: "Create an interactive HTML/CSS/JavaScript artifact when users request websites, web apps, calculators, games, visualizations, or other interactive content. Only use this for complete, functional HTML artifacts.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A short, descriptive title for the artifact (e.g., 'Simple Calculator', 'Todo List App')"
        },
        code: {
          type: "string",
          description: "Complete HTML document including <style> and <script> tags. Must be a full, valid HTML5 document."
        },
        description: {
          type: "string",
          description: "Brief description of what the artifact does and how to use it"
        }
      },
      required: ["title", "code", "description"]
    }
  }
};

// Zod schema for type safety
export const ArtifactSchema = z.object({
  title: z.string(),
  code: z.string(),
  description: z.string()
});

export type ArtifactArgs = z.infer<typeof ArtifactSchema>;
```

### 2. Backend Implementation

**File**: `web/src/app/api/chat/stream/route.ts` (MODIFY)

#### Changes Required:

**A. Add tool to Groq API call**:
```typescript
import { createArtifactTool } from "@/server/lib/artifact-tool";

const completion = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: chatMessages,
  temperature: 0.7,
  max_tokens: 1024,
  stream: true,
  tools: [createArtifactTool],  // Add this
  tool_choice: "auto"            // Let model decide when to use it
});
```

**B. Handle tool_calls in streaming response**:
```typescript
const stream = new ReadableStream({
  async start(controller) {
    try {
      for await (const chunk of completion) {
        const delta = chunk.choices[0]?.delta;

        // Handle text content
        if (delta?.content) {
          const data = JSON.stringify({
            type: "text",
            content: delta.content
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            // Groq streams tool calls incrementally
            // We need to accumulate them
            if (!toolCallsAccumulator[toolCall.index]) {
              toolCallsAccumulator[toolCall.index] = {
                id: toolCall.id || `tool-${Date.now()}-${toolCall.index}`,
                type: "function",
                function: {
                  name: toolCall.function?.name || "",
                  arguments: ""
                }
              };
            }

            if (toolCall.function?.arguments) {
              toolCallsAccumulator[toolCall.index].function.arguments +=
                toolCall.function.arguments;
            }
          }
        }
      }

      // After streaming completes, send accumulated tool calls
      if (Object.keys(toolCallsAccumulator).length > 0) {
        for (const toolCall of Object.values(toolCallsAccumulator)) {
          const data = JSON.stringify({
            type: "tool-call",
            toolCallId: toolCall.id,
            toolName: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments),
            argsText: toolCall.function.arguments
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    } catch (error) {
      console.error("Streaming error:", error);
      controller.error(error);
    }
  },
});
```

**C. Update system prompt**:
```typescript
const SYSTEM_PROMPT_TEMPLATE = `You are a helpful assistant representing Other Dev, a web development and design studio.

You have access to a create_artifact tool that lets you generate interactive HTML/CSS/JavaScript content. Use this tool when users request:
- Websites or web pages
- Web applications (calculators, converters, tools)
- Games or interactive demos
- Data visualizations
- Animations or CSS demos
- Forms or UI components

When creating artifacts:
1. Generate complete, valid HTML5 documents
2. Include all CSS in <style> tags in the <head>
3. Include all JavaScript in <script> tags before </body>
4. Use modern, semantic HTML
5. Make it responsive and accessible
6. Use the OtherDev color palette when appropriate (warm tones, serif fonts)
7. Ensure all functionality works standalone (no external dependencies)
8. Test edge cases in your implementation

IMPORTANT: Only use create_artifact for complete, functional artifacts. For simple code snippets or examples, respond with text and markdown code blocks.

{context}

Be professional, friendly, and focused on helping clients learn about Other Dev.`;
```

### 3. Runtime Updates

**File**: `web/src/lib/use-otherdev-runtime.tsx` (MODIFY)

#### Changes Required:

**A. Update SSE parsing to handle tool-call events**:
```typescript
for (const line of lines) {
  if (line.startsWith("data: ")) {
    const data = line.slice(6);

    if (data === "[DONE]") {
      break;
    }

    try {
      const parsed = JSON.parse(data);

      // Handle text content
      if (parsed.type === "text" && parsed.content) {
        accumulatedContent += parsed.content;
        // ... existing text handling logic
      }

      // Handle tool calls
      if (parsed.type === "tool-call") {
        const toolCallPart: ToolCallMessagePart = {
          type: "tool-call",
          toolCallId: parsed.toolCallId,
          toolName: parsed.toolName,
          args: parsed.args,
          argsText: parsed.argsText,
          result: parsed.args  // For artifacts, args contain the code
        };

        toolCalls.push(toolCallPart);
      }
    } catch (parseError) {
      console.error("Error parsing SSE data:", parseError);
    }
  }
}
```

**B. Update message construction**:
```typescript
// Build content parts array
const contentParts: ThreadAssistantMessagePart[] = [];

// Add text part if there's content
if (accumulatedContent) {
  contentParts.push({ type: "text", text: accumulatedContent });
}

// Add tool call parts
contentParts.push(...toolCalls);

const assistantMessage: ThreadMessage = {
  id: assistantMessageId,
  role: "assistant",
  content: contentParts,
  createdAt: new Date(),
  status: { type: "running" },
  metadata: {
    unstable_state: null,
    unstable_annotations: [],
    unstable_data: [],
    steps: [],
    custom: {},
  },
};
```

**C. Add proper TypeScript imports**:
```typescript
import type {
  AppendMessage,
  ThreadMessage,
  ToolCallMessagePart,
  ThreadAssistantMessagePart
} from "@assistant-ui/react";
```

### 4. UI Components

#### A. ArtifactRenderer Component

**File**: `web/src/components/artifact-renderer.tsx` (NEW)

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Maximize2, Minimize2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ArtifactRendererProps {
  title: string;
  code: string;
  description: string;
}

export function ArtifactRenderer({ title, code, description }: ArtifactRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(code);
    doc.close();
  }, [code]);

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 w-full space-y-2">
      {/* Browser chrome */}
      <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-muted px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2 font-serif text-sm text-muted-foreground">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-8 w-8 p-0"
            title="View code"
          >
            <Code2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
            title="Download HTML"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-none border-x border-border bg-card px-4 py-2">
        <p className="font-serif text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Code view (collapsible) */}
      {showCode && (
        <div className="max-h-[300px] overflow-auto rounded-none border-x border-border bg-muted p-4">
          <pre className="font-mono text-xs text-foreground">
            <code>{code}</code>
          </pre>
        </div>
      )}

      {/* Iframe preview */}
      <div className="overflow-hidden rounded-b-xl border border-border bg-background">
        <iframe
          ref={iframeRef}
          title={title}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
          className={`w-full border-none transition-all duration-300 ${
            isExpanded ? "h-[600px]" : "h-[400px]"
          }`}
        />
      </div>
    </div>
  );
}
```

**Security**: Iframe `sandbox` attribute restricts:
- No access to parent window (`allow-same-origin` is safe here as content is from LLM)
- No plugins
- No pointer lock
- No presentation mode
- Allows scripts, forms, modals (needed for interactivity)

#### B. Update OtherDevLoomThread

**File**: `web/src/components/otherdev-loom-thread.tsx` (MODIFY)

**Changes**:

1. Import ArtifactRenderer and ToolCallMessagePart type
2. Add ToolCall component to handle rendering
3. Update MessagePrimitive.Content components prop

```typescript
import { ArtifactRenderer } from "@/components/artifact-renderer";
import type { ToolCallMessagePart } from "@assistant-ui/react";

// Add ToolCall renderer component
function ToolCallRenderer(props: { part: ToolCallMessagePart }) {
  const { part } = props;

  if (part.toolName === "create_artifact" && part.result) {
    const args = part.args as { title: string; code: string; description: string };
    return (
      <ArtifactRenderer
        title={args.title}
        code={args.code}
        description={args.description}
      />
    );
  }

  // Fallback for unknown tools
  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <p className="font-serif text-sm text-muted-foreground">
        Tool: {part.toolName}
      </p>
    </div>
  );
}

// Update AssistantMessage component
function AssistantMessage() {
  return (
    <MessagePrimitive.Root>
      <div className="flex justify-start">
        <div className="flex max-w-[90%] items-start gap-3">
          {/* ... existing avatar code ... */}
          <div className="flex-1 space-y-2">
            <div className="text-card-foreground text-sm leading-relaxed prose dark:prose-invert prose-sm max-w-none font-serif">
              <MessagePrimitive.Content
                components={{
                  Text: (props) => (
                    <MarkdownRenderer>{props.text}</MarkdownRenderer>
                  ),
                  ToolCall: (props) => <ToolCallRenderer part={props} />  // Add this
                }}
              />
            </div>
            {/* ... existing copy button code ... */}
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
```

## File Changes Summary

```
web/src/
├── server/lib/
│   └── artifact-tool.ts                [NEW] Tool definition
├── components/
│   ├── artifact-renderer.tsx           [NEW] Artifact UI component
│   └── otherdev-loom-thread.tsx        [MODIFY] Add ToolCall rendering
├── lib/
│   └── use-otherdev-runtime.tsx        [MODIFY] Parse tool-call events
└── app/api/chat/stream/
    └── route.ts                         [MODIFY] Add function calling
```

## Testing Strategy

### Unit Tests (Optional)
- Test ArtifactRenderer with various HTML inputs
- Test SSE parsing with tool-call events
- Test message construction with mixed content parts

### Integration Tests
1. **Simple artifact**: "Create a button that says hello"
2. **Complex artifact**: "Build a calculator"
3. **Text + artifact**: "Explain calculators and create one"
4. **No artifact**: "What is Other Dev?" (should not trigger tool)
5. **Invalid request**: "Create a website" (too vague - model should ask for details or create something simple)

### Security Tests
1. XSS attempt in artifact code
2. Attempt to break out of iframe
3. Attempt to access parent window
4. External script loading

## Dependencies

### Already Installed
- `@assistant-ui/react` (^0.11.53)
- `groq-sdk` (^0.37.0)
- `zod` (^4.1.12)
- `lucide-react` (^0.562.0)

### No New Dependencies Required

## Performance Considerations

1. **Streaming**: Tool calls sent after text streaming completes
2. **Iframe**: Minimal overhead, isolated JavaScript execution
3. **Code size**: LLM naturally keeps artifacts reasonable size
4. **Memory**: Each iframe is independent, garbage collected when unmounted

## Security

1. **Iframe sandbox**: Prevents malicious code from accessing parent
2. **Input sanitization**: Already exists in backend
3. **CSP**: Consider adding Content-Security-Policy headers to iframe
4. **No external resources**: Artifacts are self-contained (no CDN scripts)

## Success Criteria

- [ ] Groq function calling properly configured
- [ ] Tool calls stream from backend
- [ ] Runtime parses tool_calls into ToolCallMessagePart
- [ ] Artifacts render in sandboxed iframe
- [ ] Text and artifacts can appear in same message
- [ ] Expand/collapse works
- [ ] Code view toggle works
- [ ] Download functionality works
- [ ] OtherDev design maintained
- [ ] No security vulnerabilities
- [ ] Mobile responsive

## Future Enhancements

1. **Artifact editing**: "Update the calculator to support decimals"
2. **Artifact persistence**: Save to database
3. **Artifact gallery**: Browse past creations
4. **More artifact types**: React components, Mermaid diagrams, SVGs
5. **Collaborative artifacts**: Share and remix

## References

- [Groq Tool Use Docs](https://console.groq.com/docs/tool-use)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [@assistant-ui/react Docs](https://www.assistant-ui.com/docs)
- [iframe sandbox MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox)

---

**Sources**:
- [Introduction to Tool Use - GroqDocs](https://console.groq.com/docs/tool-use)
- [Tool Use Overview - GroqDocs](https://console.groq.com/docs/tool-use/overview)
- [Local Tool Calling - GroqDocs](https://console.groq.com/docs/tool-use/local-tool-calling)
