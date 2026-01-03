import { z } from "zod";
import { mastra, otherDevAgent } from "@/mastra";
import {
  checkRateLimit,
  getClientIdentifier,
  REQUESTS_PER_WINDOW,
} from "@/server/lib/rate-limit";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  threadId: z.string().optional(),
});

function sanitizeInput(text: string): string {
  const dangerousPatterns = [
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[\/INST\]/gi,
    /<\|system\|>/gi,
    /<\|user\|>/gi,
    /<\|assistant\|>/gi,
  ];

  let sanitized = text;
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, "");
  }

  const maxLength = Number.parseInt(
    process.env.RAG_MAX_MESSAGE_LENGTH || "500"
  );
  return sanitized.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { messages, threadId } = validation.data;

    const thread = threadId
      ? await mastra.storage.getThread(threadId)
      : await mastra.storage.createThread({
          resourceId: clientId,
          metadata: { source: "chat-widget" },
        });

    for (const msg of messages) {
      if (msg.role === "user") {
        await mastra.storage.saveMessage({
          threadId: thread.id,
          role: msg.role,
          content: sanitizeInput(msg.content),
        });
      }
    }

    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: "No user message found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const sanitizedQuery = sanitizeInput(lastUserMessage.content);
    const normalizedQuery = sanitizedQuery
      .replace(/OtherDev/gi, "Other Dev")
      .replace(/otherdev/gi, "Other Dev");

    const stream = await otherDevAgent.stream(normalizedQuery, {
      threadId: thread.id,
      context: {
        messages: messages.map((m) => ({
          role: m.role,
          content: sanitizeInput(m.content),
        })),
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = "";
          let suggestionDetected = false;

          for await (const chunk of stream.textStream) {
            fullContent += chunk;

            if (!suggestionDetected && fullContent.includes("SUGGESTION:")) {
              suggestionDetected = true;
              const parts = fullContent.split("SUGGESTION:");
              const contentBeforeSuggestion = parts[0].trim();

              const data = JSON.stringify({
                type: "content",
                content: contentBeforeSuggestion,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else if (!suggestionDetected) {
              const data = JSON.stringify({ type: "content", content: chunk });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          const suggestionMatch = fullContent.match(/SUGGESTION:\s*(.+?)$/m);
          if (suggestionMatch) {
            const suggestion = suggestionMatch[1].trim();
            const data = JSON.stringify({
              type: "suggestion",
              content: suggestion,
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          await mastra.storage.saveMessage({
            threadId: thread.id,
            role: "assistant",
            content: fullContent,
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Thread-Id": thread.id,
        "X-RateLimit-Limit": REQUESTS_PER_WINDOW.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
