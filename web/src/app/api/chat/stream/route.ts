import { z } from "zod";
import Groq from "groq-sdk";
import { generateEmbedding } from "@/server/lib/rag/embeddings";
import { searchSimilarDocuments } from "@/server/lib/rag/vector-search";
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
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT_TEMPLATE = `You are a professional AI assistant for Other Dev, a web development and design studio based in Karachi, Pakistan.

Your job is to answer questions about Other Dev's projects, services, technologies, and results using ONLY the information provided in the knowledge base context below.

STRICT RULES
1. Base all factual statements strictly on the provided context. Do not assume, infer, or invent details.
2. If the answer is not present in the context, say clearly: "That information is not available in the provided knowledge base."
3. Prefer documents with metadata.subtype equal to "facts" or "results" for factual questions.
4. Ignore documents with metadata.type equal to "testimonial" unless the user explicitly asks for testimonials or client feedback.
5. When mentioning a project, include the project name and year when relevant.
6. Keep answers concise. Use at most two to three short paragraphs.
7. Use Markdown formatting only when it improves clarity.
8. Do not mention internal systems, embeddings, vector databases, or retrieval mechanics.

=== KNOWLEDGE BASE CONTEXT ===
{context}
=== END CONTEXT ===

CONTACT INFORMATION
- Website: https://otherdev.com
- Location: Karachi, Pakistan
- Focus areas: fashion, e commerce, real estate, legal tech, SaaS, enterprise systems

Respond professionally, clearly, and strictly within the bounds of the provided context.`;

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
    process.env.RAG_MAX_MESSAGE_LENGTH || "500",
  );
  return sanitized.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000,
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
        },
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
        },
      );
    }

    const { messages } = validation.data;
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sanitizedQuery = sanitizeInput(lastUserMessage.content);

    // Normalize query variations (OtherDev -> Other Dev)
    const normalizedQuery = sanitizedQuery
      .replace(/OtherDev/gi, "Other Dev")
      .replace(/otherdev/gi, "Other Dev");

    const queryEmbedding = await generateEmbedding(normalizedQuery);

    const matchThreshold = Number.parseFloat(
      process.env.RAG_SIMILARITY_THRESHOLD || "0.05",
    );
    const matchCount = Number.parseInt(process.env.RAG_MATCH_COUNT || "10");

    const similarDocs = await searchSimilarDocuments(
      queryEmbedding,
      matchThreshold,
      matchCount,
    );

    const context =
      similarDocs.length > 0
        ? similarDocs
            .map(
              (doc, idx) =>
                `Document ${idx + 1} (Relevance: ${(doc.similarity * 100).toFixed(1)}%):\nTitle: ${doc.metadata.title}\n${doc.content}\n`,
            )
            .join("\n---\n\n")
        : "No specific information found in the knowledge base.";

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{context}", context);

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: sanitizeInput(m.content),
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({ content });
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
      },
    );
  }
}
