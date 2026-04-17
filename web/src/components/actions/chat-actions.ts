'use server'

import { createGroq } from '@ai-sdk/groq'
import {
  createUIMessageStream,
  streamText,
  stepCountIs,
  type UIMessage,
} from 'ai'
import { loadChatMessages, saveChatMessages } from '@/server/lib/chat-cache-store'
import { generateEmbedding } from '@/server/lib/rag/embeddings'
import { searchSimilarDocuments } from '@/server/lib/rag/vector-search'
import {
  classifyChatRoute,
  detectQueryQuality,
  shouldUseRagFromDecision,
} from '@/server/lib/chat-routing'
import { CHAT_MODEL } from '@/app/api/chat/stream/helpers'

const groqAI = createGroq({ apiKey: process.env.GROQ_API_KEY })
const MAX_MESSAGES = 20

// System prompts (from existing route.ts)
const SYSTEM_PROMPT_DOMAIN = `You are a helpful assistant representing Other Dev, a web development and design studio based in Karachi, Pakistan.

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
8. IMPORTANT: After your main response, add a new line with "SUGGESTION:" followed by a short, relevant question or prompt (max 60 characters) that the user might want to ask next. It MUST be phrased from the USER's perspective as if they are typing it — never from the AI's perspective.

CONTACT INFORMATION
- Website: https://otherdev.com
- Location: Karachi, Pakistan
- Specializations: fashion, e-commerce, real estate, legal tech, SaaS, enterprise systems

Be professional, friendly, and focused on helping potential clients learn about Other Dev. Always be helpful and engaging, never claim to lack information.`

const SYSTEM_PROMPT_GENERAL = `You are a helpful, neutral AI assistant.

Provide direct, accurate answers for general topics in a concise conversational tone.

RULES
1. Do not pretend to have live access to breaking events unless the user provides context.
2. For high-stakes or time-sensitive topics (news, wars, laws, finance), provide a best-effort current status first when web search context is available, include concrete dates when relevant, and avoid fabricated specifics.
3. Keep answers practical and clear.
4. For short conversational inputs, reply naturally.
5. After your main response, add a new line with "SUGGESTION:" followed by one short next question from the user's perspective (max 60 characters).`

// Ported from route.ts
function extractUserText(message: UIMessage | undefined): string {
  if (!message || message.role !== 'user' || !Array.isArray(message.parts)) {
    return ''
  }
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join(' ')
}

interface SimilarDocument {
  similarity: number
  metadata: { title: string }
  content: string
}

function buildContext(similarDocs: SimilarDocument[], isConversational: boolean): string {
  if (similarDocs.length > 0) {
    return similarDocs
      .map(
        (doc, idx) =>
          `Document ${idx + 1} (Relevance: ${(doc.similarity * 100).toFixed(1)}%):\nTitle: ${doc.metadata.title}\n${doc.content}\n`
      )
      .join('\n---\n\n')
  }

  const baseFacts =
    'Other Dev is a web development and design studio based in Karachi, Pakistan. Specializations: fashion, e-commerce, real estate, legal tech, SaaS, enterprise systems. Website: https://otherdev.com'

  if (isConversational) {
    return `Context: ${baseFacts}. User sent a conversational message. Respond naturally and helpfully.`
  }

  return `Context: ${baseFacts}. Provide helpful general information about Other Dev's projects, services, and capabilities based on common topics.`
}

export async function continueConversation(
  conversationId: string,
  message: { role: 'user'; parts: Array<{ type: 'text'; text: string }> }
) {
  // Load existing history from Redis
  const history = await loadChatMessages(conversationId)

  // Append new user message
  const messages: UIMessage[] = [...history, message as UIMessage]

  // Determine routing and RAG
  const lastUserText = extractUserText(message as UIMessage)
  const normalizedQuery = lastUserText.toLowerCase().replace(/otherdev/gi, 'Other Dev')
  const queryQuality = detectQueryQuality(normalizedQuery)
  const routeDecision = classifyChatRoute(normalizedQuery, queryQuality)
  const ragEnabled = shouldUseRagFromDecision(routeDecision)
  const selectedPrompt =
    routeDecision.route === 'general_chat' ? SYSTEM_PROMPT_GENERAL : SYSTEM_PROMPT_DOMAIN

  // Build RAG context if enabled
  let ragContext: string | null = null
  if (ragEnabled && normalizedQuery.trim()) {
    try {
      const queryEmbedding = await generateEmbedding(normalizedQuery)
      const similarDocs = await searchSimilarDocuments(queryEmbedding, 0.1, 5)
      ragContext = buildContext(similarDocs, queryQuality.isConversational)
    } catch (error) {
      console.error('[RAG] Error:', error)
    }
  }

  // Inject RAG context into last user message
  if (ragContext && messages.length > 0) {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === 'user' && Array.isArray(lastMsg.parts)) {
      const textPart = lastMsg.parts.find((p): p is { type: 'text'; text: string } => p.type === 'text')
      if (textPart) {
        textPart.text = `=== CONTEXT ===\n${ragContext}\n=== END CONTEXT ===\n\n${textPart.text}`
      }
    }
  }

  // Streaming with sliding window truncation via prepareStep
  const stream = createUIMessageStream({
    originalMessages: messages,
    generateId: () => crypto.randomUUID(),
    onFinish: async ({ messages: updatedMessages }) => {
      // Save updated history to Redis
      await saveChatMessages(conversationId, updatedMessages as UIMessage[])
    },
    execute: async ({ writer }) => {
      let accumulatedText = ''

      const result = streamText({
        model: groqAI(CHAT_MODEL),
        system: selectedPrompt,
        messages: messages as any,
        temperature: 0.7,
        maxOutputTokens: 1024,
        stopWhen: stepCountIs(5),
        prepareStep: async ({ messages: stepMessages }) => {
          // Sliding window: keep last MAX_MESSAGES + system prompt
          if (stepMessages.length > MAX_MESSAGES + 1) {
            return {
              messages: [
                stepMessages[0], // keep system
                ...stepMessages.slice(-MAX_MESSAGES),
              ],
            }
          }
          return {}
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        experimental_transform: () =>
          new TransformStream({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transform(chunk: any, controller) {
              controller.enqueue(chunk)
              if (chunk.type === 'text-delta') {
                accumulatedText += chunk.textDelta ?? ''
              }
            },
          }),
      })

      writer.merge(result.toUIMessageStream())
      await result.consumeStream()
    },
  })

  return stream
}
