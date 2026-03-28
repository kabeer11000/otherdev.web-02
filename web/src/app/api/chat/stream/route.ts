import { streamText, tool, stepCountIs, createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

// Helper to extract raw base64 from data URI
// Groq provider expects raw base64, not "data:image/jpeg;base64,..." format
function extractBase64(dataUri: string): string {
  return dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
}

// Type for manually converted model messages
interface ModelMessage {
  role: "user" | "assistant" | "system";
  content: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: string }
  >;
}
import { createArtifactTool } from "@/server/lib/artifact-tool";
import { generateEmbedding } from "@/server/lib/rag/embeddings";
import { searchSimilarDocuments } from "@/server/lib/rag/vector-search";
import {
  checkRateLimit,
  getClientIdentifier,
  REQUESTS_PER_WINDOW,
} from "@/server/lib/rate-limit";
import { createJsonResponse } from "@/server/lib/api-helpers";
import {
  CHAT_MODEL,
  VISION_MODEL,
} from "./helpers";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// AI SDK Groq instance for streamText()
const groqAI = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const RAG_MAX_MESSAGE_LENGTH = Number.parseInt(
  process.env.RAG_MAX_MESSAGE_LENGTH || "500",
  10,
);
const RAG_SIMILARITY_THRESHOLD = Number.parseFloat(
  process.env.RAG_SIMILARITY_THRESHOLD || "0.1",
);
const RAG_MATCH_COUNT = Number.parseInt(process.env.RAG_MATCH_COUNT || "5", 10);

const INJECTION_PATTERN =
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>/gi;

const ARTIFACT_INTENT_PATTERN =
  /\b(build|create|make|generate|write|design|code|demo|example|template|prototype|app|website|calculator|game|form|dashboard|visualization|chart|component|widget)\b/;

const CONVERSATIONAL_PHRASES = new Set([
  "ok",
  "okay",
  "sure",
  "thanks",
  "thank you",
  "yes",
  "no",
  "yeah",
  "yep",
  "nope",
  "cool",
  "nice",
  "great",
  "good",
  "alright",
  "hi",
  "hello",
  "hey",
]);

const SYSTEM_PROMPT = `You are a helpful assistant representing Other Dev, a web development and design studio based in Karachi, Pakistan.

Answer questions about Other Dev's projects, services, technologies, and capabilities in a professional, conversational tone.

CRITICAL RULES
1. NEVER say "I don't have information", "I don't have data", "I cannot find", or similar phrases claiming lack of knowledge.
2. NEVER mention technical limitations, missing data, or system constraints.
3. If a question is unclear, vague, or conversational (like "ok", "sure", "thanks"), respond naturally and helpfully without claiming you lack information.
4. Always provide value in your response, even for brief or unclear queries.
5. ALWAYS end your response with a contextual follow-up suggestion.

ARTIFACT CAPABILITY
- When the user asks you to BUILD, CREATE, MAKE, or GENERATE any interactive web content (websites, apps, games, calculators, dashboards, visualizations, forms, landing pages, etc.), you MUST use the createArtifact tool.
- The createArtifact tool allows you to generate complete, self-contained HTML/CSS/JS applications that will be displayed in a live preview panel.
- Always use modern frameworks via CDN when appropriate: React (unpkg.com/react), Tailwind CSS (cdn.tailwindcss.com), Vue, etc.
- Make artifacts visually polished, responsive, and production-ready.
- For building/creating requests, focus on delivering a working interactive artifact rather than just code snippets.

GUIDELINES
1. Use the context provided in the user message to answer questions accurately and factually.
2. When specific details aren't in the context, provide general helpful information about Other Dev and invite them to connect for specifics.
3. When discussing projects, include relevant details like the project name and year when available.
4. Keep responses concise and well-structured, using 2-3 short paragraphs maximum.
5. Use Markdown formatting when it helps clarity.
6. Focus on being helpful, engaging, and client-friendly.
7. For conversational inputs like "sure", "ok", "thanks", respond naturally and ask how you can help further.
8. IMPORTANT: After your main response, add a new line with "SUGGESTION:" followed by a short, relevant question or prompt (max 60 characters) that the user might want to ask next. It MUST be phrased from the USER's perspective as if they are typing it — never from the AI's perspective. Good examples: "Tell me about your SaaS projects", "What technologies do you use?", "Show me your e-commerce work". Bad examples (never do this): "I can tell you more about...", "Would you like to know about...", "Let me show you...".

CONTACT INFORMATION
- Website: https://otherdev.com
- Location: Karachi, Pakistan
- Specializations: fashion, e-commerce, real estate, legal tech, SaaS, enterprise systems

Be professional, friendly, and focused on helping potential clients learn about Other Dev. Always be helpful and engaging, never claim to lack information.`;

function sanitizeInput(text: string): string {
  return text.replace(INJECTION_PATTERN, "").slice(0, RAG_MAX_MESSAGE_LENGTH);
}

// Extract suggestion from text and return clean text + suggestion
function extractSuggestion(text: string): { cleanText: string; suggestion: string | null } {
  const suggestionMatch = text.match(/\n?\s*SUGGESTION:\s*(.+)$/i);
  if (!suggestionMatch) {
    return { cleanText: text, suggestion: null };
  }
  
  const cleanText = text.replace(/\n?\s*SUGGESTION:[\s\S]*$/i, "").trim();
  const suggestion = suggestionMatch[1]?.trim() || null;
  
  return { cleanText, suggestion };
}

interface QueryQuality {
  isLowQuality: boolean;
  isConversational: boolean;
  tokenCount: number;
  hasRepeatedWords: boolean;
  needsArtifact: boolean;
}

function detectQueryQuality(query: string): QueryQuality {
  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 0);
  const uniqueTokens = new Set(tokens);

  const isConversational =
    CONVERSATIONAL_PHRASES.has(normalized) ||
    tokens.every((t) => CONVERSATIONAL_PHRASES.has(t));

  const hasRepeatedWords =
    tokens.length > 0 && uniqueTokens.size < tokens.length * 0.6;
  const isLowQuality =
    tokens.length < 3 || hasRepeatedWords || isConversational;

  return {
    isLowQuality,
    isConversational,
    tokenCount: tokens.length,
    hasRepeatedWords,
    needsArtifact: ARTIFACT_INTENT_PATTERN.test(normalized),
  };
}

function getAdaptiveThreshold(queryQuality: QueryQuality): number {
  if (queryQuality.isConversational) {
    return RAG_SIMILARITY_THRESHOLD * 0.5;
  }
  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords) {
    return RAG_SIMILARITY_THRESHOLD * 0.7;
  }
  if (queryQuality.tokenCount < 5) {
    return RAG_SIMILARITY_THRESHOLD * 0.8;
  }
  return RAG_SIMILARITY_THRESHOLD;
}

interface SimilarDocument {
  similarity: number;
  metadata: { title: string };
  content: string;
}

function buildContext(
  similarDocs: SimilarDocument[],
  queryQuality: QueryQuality,
): string {
  if (similarDocs.length > 0) {
    return similarDocs
      .map(
        (doc, idx) =>
          `Document ${idx + 1} (Relevance: ${(doc.similarity * 100).toFixed(1)}%):\nTitle: ${doc.metadata.title}\n${doc.content}\n`,
      )
      .join("\n---\n\n");
  }

  if (queryQuality.isConversational) {
    return "User sent a conversational message. Respond naturally and helpfully, offering to answer questions about Other Dev.";
  }

  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords) {
    return "User query is unclear. Respond naturally, acknowledge their message, and offer to help with information about Other Dev's work, services, or projects.";
  }

  return "Provide helpful general information about Other Dev based on common topics: projects (fashion, e-commerce, real estate, legal tech, SaaS), web development services, design capabilities, and technologies used.";
}


/**
 * POST handler for chat streaming endpoint.
 *
 * Implementation (Phase 3): Uses AI SDK's streamText() with Groq provider.
 * Provides unified streaming interface, built-in tool calling, and standardized
 * response format compatible with AI SDK frontend hooks.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000,
      );
      return createJsonResponse(
        { error: "Too many requests. Please try again later." },
        429,
        {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      );
    }

    const body = await request.json();
    let { messages: uiMessages, supportsArtifacts } = body;

    // Validate that messages array exists and has content
    if (!uiMessages || !Array.isArray(uiMessages) || uiMessages.length === 0) {
      return createJsonResponse(
        { error: "No messages provided" },
        400,
      );
    }

    // Filter out messages without content (can happen with incomplete tool calls)
    uiMessages = uiMessages.filter((m: any) => {
      // User messages must have parts with actual content
      if (m.role === "user") {
        if (!m.parts || m.parts.length === 0) {
          return false;
        }
        // Check that at least one part has valid content
        const hasValidContent = m.parts.some((p: any) => {
          if (p.type === "text") {
            return p.text && p.text.trim().length > 0;
          }
          if (p.type === "image" || p.type === "file") {
            return true; // Image/file attachments are valid content
          }
          return false;
        });
        return hasValidContent;
      }
      // Assistant messages must have content or parts
      return m.content || (m.parts && m.parts.length > 0);
    });

    // Ensure we still have at least one user message after filtering
    if (uiMessages.length === 0 || !uiMessages.some((m: any) => m.role === "user")) {
      return createJsonResponse(
        { error: "No valid messages provided" },
        400,
      );
    }

    // Detect if user sent images
    const hasImageContent = uiMessages.some((m: any) =>
      m.parts?.some((p: any) => p.type === "image") ||
      m.parts?.some((p: any) => p.type === "file" && p.mediaType?.startsWith("image/"))
    );

    console.log("[API] hasImageContent:", hasImageContent);
    console.log("[API] uiMessages count:", uiMessages.length);

    // Manually convert UIMessage[] to ModelMessage[] format for Groq
    // convertToModelMessages has issues with file parts and data URIs
    const modelMessages = uiMessages.map((msg: any) => {
      const content: any[] = [];

      // Process text parts
      const textParts = msg.parts?.filter((p: any) => p.type === "text") || [];
      for (const part of textParts) {
        if (part.text && part.text.trim()) {
          content.push({ type: "text" as const, text: part.text });
        }
      }

      // Process file/image parts - convert to Groq-compatible format
      const fileParts = msg.parts?.filter((p: any) => p.type === "file" || p.type === "image") || [];
      for (const part of fileParts) {
        if (part.mediaType?.startsWith("image/")) {
          const dataUri = part.url || part.data;
          
          if (dataUri && typeof dataUri === "string") {
            content.push({ 
              type: "image" as const, 
              image: extractBase64(dataUri) // Strip "data:...;base64," prefix
            });
          }
        }
      }

      if (content.length === 0) return null;

      return {
        role: msg.role as "user" | "assistant" | "system",
        content,
      };
    }).filter(Boolean);

    console.log("[API] modelMessages count:", modelMessages.length);
    console.log("[API] Using model:", hasImageContent ? VISION_MODEL : CHAT_MODEL);

    // Sanitize messages for Groq compatibility
    const sanitized = modelMessages.map((msg: ModelMessage) => {
      if (msg.role !== "user" || !Array.isArray(msg.content)) return msg;

      const sanitizedContent = msg.content.map((part) => {
        // Sanitize text parts
        if (part.type === "text" && typeof part.text === "string") {
          return { ...part, text: sanitizeInput(part.text) };
        }
        return part;
      });

      // Ensure there's always text content (Groq rejects image-only messages)
      const hasText = sanitizedContent.some(
        (p) => p.type === "text" && p.text && p.text.trim(),
      );

      if (!hasText) {
        sanitizedContent.push({ type: "text" as const, text: " " });
      }

      return { ...msg, content: sanitizedContent };
    });

    // Extract text from the last user message for RAG
    const lastUserMessage = uiMessages.filter((m: any) => m.role === "user").pop();
    const lastUserText = lastUserMessage?.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join(" ") || "";

    const sanitizedQuery = sanitizeInput(lastUserText);
    const normalizedQuery = sanitizedQuery.replace(/otherdev/gi, "Other Dev");

    const queryQuality = detectQueryQuality(normalizedQuery);
    const enableArtifacts = supportsArtifacts && queryQuality.needsArtifact;

    // Start RAG fetch in background (don't block stream start)
    let ragContextPromise: Promise<string | null> = null;
    if (!queryQuality.isConversational) {
      ragContextPromise = (async () => {
        try {
          const queryEmbedding = await generateEmbedding(normalizedQuery);
          const adaptiveThreshold = getAdaptiveThreshold(queryQuality);
          const similarDocs = await searchSimilarDocuments(
            queryEmbedding,
            adaptiveThreshold,
            RAG_MATCH_COUNT,
          );
          return buildContext(similarDocs, queryQuality);
        } catch {
          return null;
        }
      })();
    }

    // Use createUIMessageStream to properly handle data parts
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        let accumulatedText = "";
        let ragContext: string | null = null;

        // Wait for RAG context (with timeout to avoid blocking stream)
        if (ragContextPromise) {
          try {
            ragContext = await Promise.race([
              ragContextPromise,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
            ]);
            if (ragContext) {
              console.log("[RAG] Context fetched successfully");
            } else {
              console.log("[RAG] Timeout after 1.5s, streaming without context");
            }
          } catch (error) {
            console.error("[RAG] Error fetching context:", error instanceof Error ? error.message : error);
            ragContext = null;
          }
        }

        // Inject RAG context if available before sending to LLM
        let finalMessages = sanitized;
        if (ragContext && sanitized.length > 0) {
          const lastMsg = sanitized[sanitized.length - 1];
          if (lastMsg.role === "user" && Array.isArray(lastMsg.content)) {
            const textPartIndex = lastMsg.content.findIndex((p: any) => p.type === "text");
            if (textPartIndex >= 0) {
              finalMessages = [...sanitized];
              finalMessages[sanitized.length - 1] = {
                ...lastMsg,
                content: [...lastMsg.content],
              };
              finalMessages[sanitized.length - 1].content[textPartIndex] = {
                type: "text" as const,
                text: `=== CONTEXT ===\n${ragContext}\n=== END CONTEXT ===\n\n${lastMsg.content[textPartIndex].text}`,
              };
            }
          }
        }

        const result = streamText({
          model: groqAI(hasImageContent ? VISION_MODEL : CHAT_MODEL),
          system: SYSTEM_PROMPT,
          messages: finalMessages,
          temperature: 0.7,
          maxOutputTokens: 1024,
          stopWhen: stepCountIs(5),
          toolChoice: "auto",
          tools: enableArtifacts
            ? {
                createArtifact: tool({
                  description: "Create an interactive web artifact",
                  inputSchema: z.object({
                    title: z.string(),
                    code: z.string(),
                    description: z.string(),
                  }),
                  execute: async ({ title, code, description }) => {
                    console.log("[TOOL] createArtifact called:", { title, description, codeLength: code?.length });
                    return { success: true, title, code, description };
                  },
                }),
              }
            : {},
          // AI SDK built-in timeout for LLM response
          timeout: {
            completion: 30000, // 30s for full response
          },
          // Transform stream to accumulate text and detect suggestion
          experimental_transform: () =>
            new TransformStream({
              transform(chunk, controller) {
                controller.enqueue(chunk);

                // Accumulate text to detect suggestion at the end
                if (chunk.type === "text-delta") {
                  accumulatedText += chunk.text;
                }
              },
            }),
        });

        // Pipe the streamText output to the UI message writer
        for await (const chunk of result.toUIMessageStream()) {
          writer.write(chunk);
        }

        // Extract suggestion after stream completes and write as data part
        const suggestionMatch = accumulatedText.match(/\n?\s*SUGGESTION:\s*(.+)$/i);
        if (suggestionMatch) {
          const suggestion = suggestionMatch[1].trim();
          if (suggestion) {
            writer.write({
              type: "data-suggestion",
              data: { suggestion },
            });
          }
        }
      },
      onError: () => "An error occurred while processing your request.",
    });

    return createUIMessageStreamResponse({
      stream,
      headers: {
        "X-RateLimit-Limit": REQUESTS_PER_WINDOW.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return createJsonResponse(
      { error: "Internal server error. Please try again." },
      500,
    );
  }
}
