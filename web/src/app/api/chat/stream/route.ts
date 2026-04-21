import { createGroq } from '@ai-sdk/groq'
import { tavily } from '@tavily/core'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type LanguageModel,
  type ModelMessage,
  stepCountIs,
  streamText,
  type ToolSet,
  TypeValidationError,
  tool,
  type UIMessage,
  validateUIMessages,
} from 'ai'
import { after } from 'next/server'
import { minimax } from 'vercel-minimax-ai-provider'
import { z } from 'zod'

import { createJsonResponse } from '@/server/lib/api-helpers'
import {
  getCachedResponse,
  getCachedRetrievalContext,
  loadChatMessages,
  saveChatMessages,
  setCachedResponse,
  setCachedRetrievalContext,
} from '@/server/lib/chat-cache-store'
import {
  type ChatRoute,
  classifyChatRoute,
  detectQueryQuality,
  type QueryQuality,
  shouldUseRagFromDecision,
} from '@/server/lib/chat-routing'
import { generateEmbedding } from '@/server/lib/rag/embeddings'
import { searchSimilarDocuments } from '@/server/lib/rag/vector-search'
import { checkRateLimit, getClientIdentifier, REQUESTS_PER_WINDOW } from '@/server/lib/rate-limit'
import { CHAT_MODEL, MINIMAX_CHAT_MODEL, VISION_MODEL } from './helpers'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// AI SDK Groq instance for streamText()
const groqAI = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// AI SDK MiniMax instance (fallback when Groq fails or rate-limits)
// Uses MINIMAX_API_KEY env var automatically
const minimaxAI = minimax

// Tavily client for web search
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

// Web search tool using Tavily (for general chat with web grounding)
const webSearchTool = tool({
  description:
    'Search the web for current information, news, and facts. Use this when you need real-time or up-to-date information that may not be in your training data.',
  inputSchema: z.object({
    query: z.string().describe('The search query to find relevant web information'),
  }),
  execute: async ({ query }: { query: string }) => {
    type SearchResult = { id: number; title: string; url: string; snippet: string; score: number }
    type WebSearchResult = {
      query: string
      results: SearchResult[]
      answer: string | null
      error?: string
    }

    try {
      console.log(`[WebSearch] Searching for: ${query}`)
      const response = await tavilyClient.search(query, {
        searchDepth: 'basic',
        maxResults: 5,
        includeAnswer: false,
        includeRawContent: false,
      })

      const results: SearchResult[] = response.results.map((result, i) => ({
        id: i + 1,
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score,
      }))

      console.log(`[WebSearch] Found ${results.length} results for: ${query}`)
      return {
        query,
        results,
        answer: response.answer ?? null,
      } as WebSearchResult
    } catch (error) {
      console.error('[WebSearch] Tavily error:', error instanceof Error ? error.message : error)
      return {
        query,
        results: [] as SearchResult[],
        answer: null,
        error: 'Web search failed',
      } as WebSearchResult
    }
  },
})

/**
 * Repairs malformed tool calls from Groq models.
 * Groq sometimes returns tool arguments with formatting issues.
 */
async function repairToolCall({
  toolCall,
  error: _error,
}: {
  toolCall: { input: string; toolCallId: string; toolName: string }
  error: unknown
  system?: string | { content: string } | { content: string }[]
  messages?: ModelMessage[]
  tools?: Record<string, unknown>
  inputSchema?: z.ZodType
}): Promise<{ input: string; toolCallId: string; toolName: string } | null> {
  try {
    let fixedInput = toolCall.input
    fixedInput = fixedInput.replace(/^```json\s*/i, '').replace(/\s*```$/, '')
    fixedInput = fixedInput.replace(/^```\s*/i, '').replace(/\s*```$/, '')
    fixedInput = fixedInput.trim()
    const parsed = JSON.parse(fixedInput)
    return { ...toolCall, input: JSON.stringify(parsed) }
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
8. IMPORTANT: After your main response, add a new line with "SUGGESTION:" followed by a short, relevant question or prompt (max 60 characters) that the user might want to ask next. It MUST be phrased from the USER's perspective as if they are typing it — never from the AI's perspective. Good examples: "Tell me about your SaaS projects", "What technologies do you use?", "Show me your e-commerce work". Bad examples (never do this): "I can tell you more about...", "Would you like to know about...", "Let me show you...".

CONTACT INFORMATION
- Website: https://otherdev.com
- Location: Karachi, Pakistan
- Specializations: fashion, e-commerce, real estate, legal tech, SaaS, enterprise systems

Be professional, friendly, and focused on helping potential clients learn about Other Dev. Always be helpful and engaging, never claim to lack information.`

function getCurrentDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Called per-request so the date is never stale from module-load time
function getGeneralSystemPrompt(): string {
  return `You are a helpful, neutral AI assistant.
Current date: ${getCurrentDateString()}

Provide direct, accurate answers for general topics in a concise conversational tone.

RULES
1. ALWAYS be aware of today's date above — do not say "current" events are from previous years.
2. Use web search tool when asked about current events, news, or real-time information.
3. Do not pretend to have live access to breaking events unless the user provides context.
4. For high-stakes or time-sensitive topics (news, wars, laws, finance), provide a best-effort current status first when web search context is available, include concrete dates when relevant, and avoid fabricated specifics.
5. Keep answers practical and clear.
6. For short conversational inputs, reply naturally.
7. After your main response, add a new line with "SUGGESTION:" followed by one short next question from the user's perspective (max 60 characters).`
}

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
      'Create an interactive web artifact that will be displayed in a live preview panel. Supports vanilla HTML/CSS/JS or modern frameworks (React, Vue, Tailwind CSS) via CDN. Use this when the user asks to create, build, make, or generate interactive content like websites, apps, games, visualizations, calculators, forms, dashboards, or any web-based UI. The artifact should be complete, self-contained, and visually polished.',
    inputSchema: z.object({
      title: z.string().max(100).describe('A short, descriptive title for the artifact'),
      code: z
        .string()
        .max(51200)
        .describe(
          'Complete HTML code. Can use modern frameworks via CDN: React, Tailwind CSS, Vue, etc. Include CSS in <style> tags and JavaScript in <script> tags. Must be self-contained and work in a sandboxed iframe.'
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

// Sanitize user message text parts in standard ModelMessage[] (injection protection + length cap)
function sanitizeModelMessages(messages: ModelMessage[]): ModelMessage[] {
  return messages.map(msg => {
    if (msg.role !== 'user' || !Array.isArray(msg.content)) return msg

    const content = msg.content.map(part => {
      if (part.type === 'text') {
        return { ...part, text: sanitizeInput(part.text) }
      }
      return part
    })

    const hasText = content.some(
      p => p.type === 'text' && (p as { type: 'text'; text: string }).text.trim()
    )

    if (!hasText) {
      return { ...msg, content: [...content, { type: 'text' as const, text: ' ' }] }
    }

    return { ...msg, content }
  })
}

// convertToModelMessages maps FileUIPart.url → FilePart.data, so a data: URI becomes
// { type: 'file', data: 'data:image/webp;base64,...' }. The AI SDK's downloadAssets
// calls new URL(data) on strings, which succeeds for data: URIs, then tries to fetch
// them as HTTP resources and fails. Converting to Buffer bypasses the download path.
function resolveDataURIs(messages: ModelMessage[]): ModelMessage[] {
  // biome-ignore lint/suspicious/noExplicitAny: ModelMessage union content arrays resist narrow inference
  return messages.map((msg): any => {
    if (!Array.isArray(msg.content)) return msg
    const content = (msg.content as Array<{ type: string; [k: string]: unknown }>).map(part => {
      if (part.type === 'image') {
        const image = part.image as string | URL | Uint8Array
        if (typeof image === 'string' && image.startsWith('data:')) {
          const commaIdx = image.indexOf(',')
          const header = image.slice(0, commaIdx)
          const base64 = image.slice(commaIdx + 1)
          return {
            ...part,
            image: Buffer.from(base64, 'base64'),
            mediaType: (part.mediaType as string | undefined) ?? header.match(/data:([^;]+)/)?.[1],
          }
        }
      }
      if (part.type === 'file') {
        const data = part.data as string | Uint8Array
        if (typeof data === 'string' && data.startsWith('data:')) {
          const commaIdx = data.indexOf(',')
          const base64 = data.slice(commaIdx + 1)
          return { ...part, data: Buffer.from(base64, 'base64') }
        }
      }
      return part
    })
    return { ...msg, content }
  }) as ModelMessage[]
}

// Inject RAG context into the last user message's first text part
function injectRagContext(messages: ModelMessage[], ragContext: string): ModelMessage[] {
  if (!messages.length) return messages

  const result = [...messages]
  const lastIdx = result.length - 1
  const lastMsg = result[lastIdx]

  if (lastMsg.role !== 'user' || !Array.isArray(lastMsg.content)) return result

  const content = [...lastMsg.content]
  const textIdx = content.findIndex(p => p.type === 'text')
  if (textIdx < 0) return result

  const textPart = content[textIdx] as { type: 'text'; text: string }
  content[textIdx] = {
    type: 'text',
    text: `=== CONTEXT ===\n${ragContext}\n=== END CONTEXT ===\n\n${textPart.text}`,
  }
  result[lastIdx] = { ...lastMsg, content }
  return result
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
      const previousMessages = await loadChatMessages(chatId)
      candidateMessages = [...previousMessages, body.message]
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

    // Create artifact tool once per request — shared for validation and tool calling
    const artifactTool = createArtifactTool()

    let uiMessages: UIMessage[]
    try {
      uiMessages = (await validateUIMessages({
        messages: candidateMessages,
        dataSchemas: {
          suggestion: suggestionDataSchema,
        },
        tools: {
          // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool validation
          createArtifact: artifactTool as any,
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
      routeDecision.route === 'general_chat' ? getGeneralSystemPrompt() : SYSTEM_PROMPT_DOMAIN
    const scopedUIMessages = scopeMessagesForRoute(uiMessages, routeDecision.route)

    if (routeDecision.route === 'clarify') {
      const clarifyMessage =
        'Do you want information about Other Dev specifically, or a general answer? Please clarify in one short line.'
      const assistantMessage: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: clarifyMessage }],
      }

      await saveChatMessages(chatId, [...uiMessages, assistantMessage])

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

    const selectedModel = hasImageContent ? VISION_MODEL : CHAT_MODEL
    const enableResponseCache = ragEnabled && !hasImageContent && !enableArtifacts

    // Fetch RAG context before starting stream
    let ragContext: string | null = null
    if (ragEnabled) {
      try {
        const cachedContext = await getCachedRetrievalContext(normalizedQuery)
        if (cachedContext) {
          ragContext = cachedContext
        } else {
          const queryEmbedding = await generateEmbedding(normalizedQuery)
          const adaptiveThreshold = getAdaptiveThreshold(queryQuality)
          const similarDocs = await searchSimilarDocuments(
            queryEmbedding,
            adaptiveThreshold,
            RAG_MATCH_COUNT
          )
          ragContext = buildContext(similarDocs, queryQuality)
          after(() => setCachedRetrievalContext(normalizedQuery, ragContext as string))
        }
      } catch (error) {
        console.error(
          '[RAG] Error during RAG pipeline:',
          error instanceof Error ? error.message : error
        )
      }
    }

    // Convert UIMessages to standard AI SDK ModelMessage[] format.
    // Both Groq and MiniMax (Anthropic-compatible) accept this format directly —
    // each provider's internal adapter handles the wire-format conversion.
    const rawModelMessages = await convertToModelMessages(scopedUIMessages, {
      tools: { createArtifact: artifactTool },
    })

    // Sanitize user text, decode data URI images to Buffer, then inject RAG context
    const sanitizedMessages = sanitizeModelMessages(rawModelMessages)
    const resolvedMessages = resolveDataURIs(sanitizedMessages)
    const modelMessages = ragContext
      ? injectRagContext(resolvedMessages, ragContext)
      : resolvedMessages

    let responseTextForCache = ''
    let responseSuggestionForCache: string | null = null

    const stream = createUIMessageStream({
      originalMessages: uiMessages,
      onFinish: async ({ messages }) => {
        await saveChatMessages(chatId, messages as UIMessage[])

        if (enableResponseCache && responseTextForCache.trim().length > 0) {
          after(() =>
            setCachedResponse(
              normalizedQuery,
              selectedModel,
              responseTextForCache,
              responseSuggestionForCache
            )
          )
        }
      },
      execute: async ({ writer }) => {
        if (enableResponseCache) {
          const cached = await getCachedResponse(normalizedQuery, selectedModel)
          if (cached) {
            const textId = crypto.randomUUID()
            writer.write({ type: 'start' })
            writer.write({ type: 'text-start', id: textId })
            writer.write({
              type: 'text-delta',
              id: textId,
              delta: cached.text,
            })
            writer.write({ type: 'text-end', id: textId })
            if (cached.suggestion) {
              writer.write({
                type: 'data-suggestion',
                data: { suggestion: cached.suggestion },
              })
            }
            writer.write({ type: 'finish', finishReason: 'stop' })
            responseTextForCache = cached.text
            responseSuggestionForCache = cached.suggestion
            return
          }
        }

        const streamTextWithModel = async (
          modelFactory: (modelId: string) => LanguageModel,
          model: string,
          label: string,
          tools: ToolSet = {},
          abortSignal?: AbortSignal
        ) => {
          console.log(`[LLM] Using ${label} (model: ${model})`)
          return streamText({
            model: modelFactory(model),
            system: selectedPrompt,
            messages: modelMessages,
            temperature: 0.7,
            maxOutputTokens: 1024,
            stopWhen: stepCountIs(5),
            toolChoice: 'auto',
            experimental_repairToolCall: enableArtifacts
              ? // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool repair
                (repairToolCall as any)
              : undefined,
            tools,
            abortSignal,
            timeout: { totalMs: 30000 },
          })
        }

        let result: ReturnType<typeof streamText>

        const minimaxTools: ToolSet = { webSearch: webSearchTool }

        if (enableArtifacts) {
          // Groq required for artifacts (MiniMax doesn't support createArtifact)
          console.log('[LLM] Using Groq with artifacts...')
          result = await streamTextWithModel(groqAI, selectedModel, 'Groq', {
            createArtifact: artifactTool,
          })
        } else if (hasImageContent) {
          // MiniMax M-series models block image input via AI SDK (all API modes).
          // MiniMax-Text-01 supports vision but requires a higher plan tier.
          // Use Groq Llama-4-Scout directly — it supports multimodal natively.
          console.log('[LLM] Image detected, routing to Groq vision (Llama-4-Scout)...')
          result = await streamTextWithModel(groqAI, VISION_MODEL, 'Groq-vision', {})
        } else {
          // Text/general: Groq as primary, MiniMax-M2.7 fallback on failure/rate-limit
          const groqAbort = new AbortController()
          const groqTimeout = setTimeout(() => groqAbort.abort(), 9_000)

          try {
            console.log('[LLM] Using Groq with web search...')
            result = await streamTextWithModel(
              groqAI,
              selectedModel,
              'Groq',
              { webSearch: webSearchTool },
              groqAbort.signal
            )
            clearTimeout(groqTimeout)
          } catch (groqError) {
            clearTimeout(groqTimeout)
            console.warn(
              '[LLM] Groq failed, falling back to MiniMax:',
              groqError instanceof Error ? groqError.message : groqError
            )
            console.log('[LLM] Using MiniMax-M2.7 with web search (fallback)...')
            result = await streamTextWithModel(
              minimaxAI,
              MINIMAX_CHAT_MODEL,
              'MiniMax-M2.7',
              minimaxTools
            )
          }
        }

        writer.merge(result.toUIMessageStream())
        await result.consumeStream()

        // result.text resolves after consumeStream() — no TransformStream accumulator needed
        const fullText = await result.text
        const { cleanText, suggestion } = extractSuggestion(fullText)
        if (suggestion) {
          writer.write({
            type: 'data-suggestion',
            data: { suggestion },
          })
        }
        responseTextForCache = cleanText || fullText
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
