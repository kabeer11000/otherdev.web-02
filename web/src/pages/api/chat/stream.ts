import { createGroq } from '@ai-sdk/groq'
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  TypeValidationError,
  tool,
  type UIMessage,
  validateUIMessages,
} from 'ai'
import { z } from 'zod'

function extractBase64(dataUri: string): string {
  return dataUri.includes(',') ? dataUri.split(',')[1] : dataUri
}

import { createJsonResponse } from '../api-helpers'
import {
  type ChatRoute,
  classifyChatRoute,
  detectQueryQuality,
  type QueryQuality,
  shouldUseRagFromDecision,
} from '../chat-routing'
import { generateEmbedding } from '../embeddings'
import { searchSimilarDocuments } from '../vector-search'
import { checkRateLimit, getClientIdentifier, REQUESTS_PER_WINDOW } from '../rate-limit'

export const maxDuration = 30

function getGroqProvider() {
  return createGroq({
    apiKey: process.env.GROQ_API_KEY,
  })
}

type ModelMessageContent = { type: 'text'; text: string } | { type: 'image'; image: string }

interface ModelMessage {
  role: 'user' | 'assistant' | 'system'
  content: ModelMessageContent[]
}

async function repairToolCall({
  toolCall,
  error: _error,
}: {
  toolCall: { input: string; toolCallId: string; toolName: string }
  error: unknown
  system?: string | { content: string } | { content: string }[]
  messages?: UIMessage[]
  tools?: Record<string, unknown>
  inputSchema?: z.ZodType
}): Promise<{ input: string; toolCallId: string; toolName: string } | null> {
  try {
    let fixedInput = toolCall.input
    fixedInput = fixedInput.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    fixedInput = fixedInput.replace(/^```\s*/i, '').replace(/\s*```$/, '')
    fixedInput = fixedInput.trim()
    const parsed = JSON.parse(fixedInput)
    return {
      ...toolCall,
      input: JSON.stringify(parsed),
    }
  } catch (_parseError) {
    return null
  }
}

const RAG_MAX_MESSAGE_LENGTH = Number.parseInt(process.env.RAG_MAX_MESSAGE_LENGTH || '500', 10)
const RAG_SIMILARITY_THRESHOLD = Number.parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.1')
const RAG_MATCH_COUNT = Number.parseInt(process.env.RAG_MATCH_COUNT || '5', 10)

const INJECTION_PATTERN =
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>/gi

const suggestionDataSchema = z.object({
  suggestion: z.string(),
})

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
9. CONTACT: Website: https://otherdev.com, Location: Karachi, Pakistan, Specializations: fashion, e-commerce, real estate, legal tech, SaaS, enterprise systems.

Be professional, friendly, and focused on helping potential clients learn about Other Dev.`

const SYSTEM_PROMPT_GENERAL = `You are a helpful, neutral AI assistant.

Provide direct, accurate answers for general topics in a concise conversational tone.

RULES
1. Do not pretend to have live access to breaking events unless the user provides context.
2. For high-stakes or time-sensitive topics (news, wars, laws, finance), provide a best-effort current status first.
3. Keep answers practical and clear.
4. For short conversational inputs, reply naturally.
5. After your main response, add a new line with "SUGGESTION:" followed by one short next question from the user's perspective (max 60 characters).`

function sanitizeInput(text: string): string {
  return text.replace(INJECTION_PATTERN, '').slice(0, RAG_MAX_MESSAGE_LENGTH)
}

function extractUserText(message: UIMessage | undefined): string {
  if (!message || message.role !== 'user' || !Array.isArray(message.parts)) {
    return ''
  }
  return message.parts
    .filter(part => part.type === 'text')
    .map(part => (part as { type: 'text'; text: string }).text)
    .join(' ')
}

function isDomainRoute(route: ChatRoute): boolean {
  return route === 'otherdev_rag' || route === 'otherdev_no_rag'
}

function scopeMessagesForRoute(messages: UIMessage[], activeRoute: ChatRoute): UIMessage[] {
  if (messages.length <= 1) return messages

  const targetIsDomain = isDomainRoute(activeRoute)
  let startIndex = 0

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i]
    if (msg.role !== 'user') continue

    const rawUserText = extractUserText(msg)
    const query = sanitizeInput(rawUserText).replace(/otherdev/gi, 'Other Dev')
    const decision = classifyChatRoute(query, detectQueryQuality(query))
    const decisionIsDomain = isDomainRoute(decision.route)

    if (decisionIsDomain !== targetIsDomain) {
      startIndex = i + 1
      break
    }
  }

  const scoped = messages.slice(startIndex)
  return scoped.length > 0 ? scoped : [messages[messages.length - 1]]
}

function extractSuggestion(text: string): {
  cleanText: string
  suggestion: string | null
} {
  const suggestionMatch = text.match(/\n?\s*SUGGESTION:\s*(.+)$/i)
  if (!suggestionMatch) {
    return { cleanText: text, suggestion: null }
  }

  const cleanText = text.replace(/\n?\s*SUGGESTION:[\s\S]*$/i, '').trim()
  const suggestion = suggestionMatch[1]?.trim() || null

  return { cleanText, suggestion }
}

function getAdaptiveThreshold(queryQuality: QueryQuality): number {
  if (queryQuality.isConversational) {
    return RAG_SIMILARITY_THRESHOLD * 0.5
  }
  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords) {
    return RAG_SIMILARITY_THRESHOLD * 0.7
  }
  if (queryQuality.tokenCount < 5) {
    return RAG_SIMILARITY_THRESHOLD * 0.8
  }
  return RAG_SIMILARITY_THRESHOLD
}

function createArtifactTool() {
  return tool({
    description:
      'Create an interactive web artifact displayed in a live preview panel. Supports vanilla HTML/CSS/JS or modern frameworks via CDN.',
    inputSchema: z.object({
      title: z.string().max(100).describe('A short, descriptive title for the artifact'),
      code: z
        .string()
        .max(51200)
        .describe(
          'Complete HTML code. Can use modern frameworks via CDN. Include CSS in <style> tags and JavaScript in <script> tags. Must be self-contained.'
        ),
      description: z
        .string()
        .max(500)
        .describe('A brief explanation of what this artifact does and how to use it'),
    }),
    execute: async ({ title, code, description }) => {
      return { success: true, title, code, description }
    },
  })
}

interface SimilarDocument {
  similarity: number
  metadata: { title: string }
  content: string
}

function buildContext(similarDocs: SimilarDocument[], queryQuality: QueryQuality): string {
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

  if (queryQuality.isConversational) {
    return `Context: ${baseFacts}. User sent a conversational message. Respond naturally and helpfully.`
  }

  if (queryQuality.isLowQuality || queryQuality.hasRepeatedWords) {
    return `Context: ${baseFacts}. User query is unclear. Respond naturally and offer to help with information about Other Dev's work, services, or projects.`
  }

  return `Context: ${baseFacts}. Provide helpful general information about Other Dev's projects, services, and capabilities based on common topics.`
}

export async function POST(request: Request): Promise<Response> {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await checkRateLimit(clientId)

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      return createJsonResponse({ error: 'Too many requests. Please try again later.' }, 429, {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': REQUESTS_PER_WINDOW.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      })
    }

    const body = (await request.json()) as {
      id?: string
      message?: UIMessage
      messages?: UIMessage[]
      supportsArtifacts?: boolean
    }

    const chatId =
      typeof body.id === 'string' && body.id.trim().length > 0 ? body.id : crypto.randomUUID()
    const supportsArtifacts = body.supportsArtifacts === true

    let candidateMessages: UIMessage[] = []

    if (body.message) {
      candidateMessages = [body.message]
    } else if (Array.isArray(body.messages)) {
      candidateMessages = body.messages
    }

    if (candidateMessages.length === 0) {
      return createJsonResponse({ error: 'No messages provided' }, 400)
    }

    candidateMessages = candidateMessages.filter(m => {
      if (m.role === 'user') {
        if (!m.parts || m.parts.length === 0) {
          return false
        }
        return m.parts.some(p => {
          if (p.type === 'text') return Boolean('text' in p && p.text?.trim())
          if (p.type === 'file') return true
          return false
        })
      }

      return Boolean(m.parts && m.parts.length > 0)
    })

    if (candidateMessages.length === 0) {
      return createJsonResponse({ error: 'No valid messages provided' }, 400)
    }

    let uiMessages: UIMessage[]
    try {
      uiMessages = (await validateUIMessages({
        messages: candidateMessages,
        dataSchemas: {
          suggestion: suggestionDataSchema,
        },
        tools: {
          createArtifact: createArtifactTool() as any,
        },
      })) as UIMessage[]
    } catch (error) {
      if (error instanceof TypeValidationError) {
        console.error('[VALIDATION] Invalid chat messages:', error.message)
        return createJsonResponse({ error: 'Invalid message payload' }, 400)
      }
      throw error
    }

    const lastUserMessage = uiMessages.filter((m: UIMessage) => m.role === 'user').pop()
    const lastUserText = extractUserText(lastUserMessage)
    const sanitizedQuery = sanitizeInput(lastUserText)
    const normalizedQuery = sanitizedQuery.replace(/otherdev/gi, 'Other Dev')

    const queryQuality = detectQueryQuality(normalizedQuery)
    const routeDecision = classifyChatRoute(normalizedQuery, queryQuality)
    const ragEnabled = shouldUseRagFromDecision(routeDecision)
    const enableArtifacts = supportsArtifacts && queryQuality.needsArtifact
    const selectedPrompt =
      routeDecision.route === 'general_chat' ? SYSTEM_PROMPT_GENERAL : SYSTEM_PROMPT_DOMAIN
    const scopedUIMessages = scopeMessagesForRoute(uiMessages, routeDecision.route)

    if (routeDecision.route === 'clarify') {
      const clarifyMessage =
        'Do you want information about Other Dev specifically, or a general answer? Please clarify in one short line.'
      const assistantMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: clarifyMessage }],
      }

      const stream = createUIMessageStream({
        originalMessages: uiMessages,
        execute: ({ writer }) => {
          const textId = crypto.randomUUID()
          writer.write({ type: 'start' })
          writer.write({ type: 'text-start', id: textId })
          writer.write({
            type: 'text-delta',
            id: textId,
            delta: clarifyMessage,
          })
          writer.write({ type: 'text-end', id: textId })
          writer.write({ type: 'finish', finishReason: 'stop' })
        },
      })

      return createUIMessageStreamResponse({
        stream,
        headers: {
          'X-RateLimit-Limit': REQUESTS_PER_WINDOW.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        },
      })
    }

    const hasImageContent = scopedUIMessages.some((m: UIMessage) =>
      m.parts?.some(
        p =>
          p.type === 'file' &&
          'mediaType' in p &&
          (p as { mediaType?: string }).mediaType?.startsWith('image/')
      )
    )

    const modelMessages: ModelMessage[] = scopedUIMessages
      .map((msg: UIMessage) => {
        const content: ModelMessageContent[] = []

        const textParts =
          msg.parts?.filter(
            (p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p
          ) || []
        for (const part of textParts) {
          if (part.text?.trim()) {
            content.push({ type: 'text' as const, text: part.text })
          }
        }

        const fileParts = msg.parts?.filter(p => p.type === 'file') || []
        for (const part of fileParts) {
          const mediaType =
            'mediaType' in part ? (part as { mediaType?: string }).mediaType : undefined
          if (mediaType?.startsWith('image/')) {
            const dataUri =
              ('url' in part ? (part as { url?: string }).url : undefined) ||
              ('data' in part ? (part as { data?: string }).data : undefined)

            if (dataUri && typeof dataUri === 'string') {
              content.push({
                type: 'image' as const,
                image: extractBase64(dataUri),
              })
            }
          }
        }

        if (content.length === 0) return null

        return {
          role: msg.role as 'user' | 'assistant' | 'system',
          content,
        }
      })
      .filter((msg): msg is ModelMessage => msg !== null)

    const sanitized: ModelMessage[] = modelMessages.map((msg: ModelMessage) => {
      if (msg.role !== 'user' || !Array.isArray(msg.content)) return msg

      const sanitizedContent = msg.content.map((part: ModelMessageContent) => {
        if (part.type === 'text' && typeof part.text === 'string') {
          return { ...part, text: sanitizeInput(part.text) }
        }
        return part
      })

      const hasText = sanitizedContent.some(
        (p: ModelMessageContent) => p.type === 'text' && p.text && p.text.trim()
      )

      if (!hasText) {
        sanitizedContent.push({ type: 'text' as const, text: ' ' })
      }

      return { ...msg, content: sanitizedContent }
    })

    const selectedModel = hasImageContent ? 'llama-3.3-70b-versatile' : 'llama-3.3-70b-versatile'
    const isSearchLikeQuery = !queryQuality.isConversational && queryQuality.tokenCount >= 3
    const enableBrowserSearch =
      routeDecision.route === 'general_chat' &&
      isSearchLikeQuery &&
      !hasImageContent &&
      !enableArtifacts
    const enableResponseCache = ragEnabled && !hasImageContent && !enableArtifacts && !enableBrowserSearch

    let ragContext: string | null = null
    if (ragEnabled) {
      try {
        const queryEmbedding = await generateEmbedding(normalizedQuery)
        const adaptiveThreshold = getAdaptiveThreshold(queryQuality)
        const similarDocs = await searchSimilarDocuments(
          queryEmbedding,
          adaptiveThreshold,
          RAG_MATCH_COUNT
        )
        ragContext = buildContext(similarDocs, queryQuality)
      } catch (error) {
        console.error(
          '[RAG] Error during RAG pipeline:',
          error instanceof Error ? error.message : error
        )
      }
    }

    if (ragContext && sanitized.length > 0) {
      const lastMsg = sanitized[sanitized.length - 1]
      if (lastMsg.role === 'user' && Array.isArray(lastMsg.content)) {
        const textPartIndex = lastMsg.content.findIndex(
          (p: ModelMessageContent) => p.type === 'text'
        )
        if (textPartIndex >= 0) {
          const part = lastMsg.content[textPartIndex]
          const originalText = part.type === 'text' ? part.text : ''
          lastMsg.content[textPartIndex] = {
            type: 'text',
            text: `=== CONTEXT ===\n${ragContext}\n=== END CONTEXT ===\n\n${originalText}`,
          }
        }
      }
    }

    let responseTextForCache = ''
    let responseSuggestionForCache: string | null = null

    const stream = createUIMessageStream({
      originalMessages: uiMessages,
      execute: async ({ writer }) => {
        let accumulatedText = ''

        const result = streamText({
          model: getGroqProvider()(selectedModel),
          system: selectedPrompt,
          messages: sanitized as any,
          temperature: 0.7,
          maxOutputTokens: 1024,
          stopWhen: stepCountIs(5),
          toolChoice: enableBrowserSearch ? 'required' : 'auto',
          experimental_repairToolCall: enableArtifacts ? (repairToolCall as any) : undefined,
          tools: (enableArtifacts
            ? {
                createArtifact: createArtifactTool(),
              }
            : enableBrowserSearch
              ? {
                  browser_search: getGroqProvider().tools.browserSearch({}),
                }
              : {}) as any,
          timeout: {
            totalMs: 30000,
          },
          experimental_transform: () =>
            new TransformStream({
              transform(chunk, controller) {
                controller.enqueue(chunk)
                if (chunk.type === 'text-delta') {
                  accumulatedText += chunk.text
                }
              },
            }),
          onFinish: async _event => {},
        })

        writer.merge(result.toUIMessageStream())
        await result.consumeStream()

        const { cleanText, suggestion } = extractSuggestion(accumulatedText)
        if (suggestion) {
          writer.write({
            type: 'data-suggestion',
            data: { suggestion },
          })
        }
        responseTextForCache = cleanText || accumulatedText
        responseSuggestionForCache = suggestion
      },
      onError: error => {
        console.error('[STREAM] Error:', error instanceof Error ? error.message : error)
        return 'An error occurred while processing your request.'
      },
    })

    return createUIMessageStreamResponse({
      stream,
      headers: {
        'X-RateLimit-Limit': REQUESTS_PER_WINDOW.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return createJsonResponse({ error: 'Internal server error. Please try again.' }, 500)
  }
}
