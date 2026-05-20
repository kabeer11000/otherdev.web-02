import {
  convertToModelMessages,
  generateText,
  gateway,
  type ModelMessage,
  Output,
  stepCountIs,
  streamText,
  type TextStreamPart,
  type ToolSet,
  type UIMessage,
  validateUIMessages,
} from 'ai'
import { z } from 'zod'

import { createJsonResponse } from '@/server/lib/api-helpers'
import { checkRateLimit, getClientIdentifier, REQUESTS_PER_WINDOW } from '@/server/lib/rate-limit'
import {
  TEXT_MODEL,
  TEXT_MODEL_FALLBACK,
  TEXT_MODEL_FALLBACK_2,
  VISION_MODEL,
  VISION_MODEL_FALLBACK,
} from './models'
import { createArtifactTool, retrieveKnowledgeTool, tavilySearchTool } from './tools'

/**
 * Discriminated union for message content parts — eliminates `as any` casts
 * in resolveDataURIs. ModelMessage.content is a union that resists narrow inference.
 */
type TextPart = { type: 'text'; text: string }
type ImagePart = { type: 'image'; image: string | URL | Uint8Array; mediaType?: string }
type FilePart = { type: 'file'; data: string | Uint8Array }
type Part = TextPart | ImagePart | FilePart

function isContentArray(arr: unknown): arr is Part[] {
  return Array.isArray(arr)
}

const REQUIRED_API_KEYS = ['GROQ_API_KEY', 'CEREBRAS_API_KEY', 'COHERE_API_KEY', 'MISTRAL_API_KEY'] as const

function validateApiKeys(): void {
  for (const key of REQUIRED_API_KEYS) {
    if (!process.env[key]) {
      throw new Error(`[chat] Missing required environment variable: ${key}`)
    }
  }
}

export interface HandleStreamChatOptions {
  chatId?: string
  messages: UIMessage[]
  supportsArtifacts: boolean
  request: Request
}

export interface HandleStreamChatResult {
  result: ReturnType<typeof streamText> | null
  response: Response | null
  suggestions: string[]
  rateLimit: {
    limit: number
    remaining: number
  }
}

const RAG_MAX_MESSAGE_LENGTH = Number.parseInt(process.env.RAG_MAX_MESSAGE_LENGTH || '500', 10)

const INJECTION_PATTERN =
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>/gi

import { suggestionDataSchema } from '@/lib/schemas'

const SUGGESTIONS_SCHEMA = z.object({
  suggestions: z.array(z.string()).min(2).max(3),
})

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
  return messages.map(msg => {
    if (!isContentArray(msg.content)) return msg
    const content = msg.content.map(part => {
      if (part.type === 'image') {
        if (typeof part.image === 'string' && part.image.startsWith('data:')) {
          const commaIdx = part.image.indexOf(',')
          const header = part.image.slice(0, commaIdx)
          const base64 = part.image.slice(commaIdx + 1)
          return {
            ...part,
            image: Buffer.from(base64, 'base64'),
            mediaType: part.mediaType ?? header.match(/data:([^;]+)/)?.[1],
          }
        }
      }
      if (part.type === 'file') {
        if (typeof part.data === 'string' && part.data.startsWith('data:')) {
          const commaIdx = part.data.indexOf(',')
          const base64 = part.data.slice(commaIdx + 1)
          return { ...part, data: Buffer.from(base64, 'base64') }
        }
      }
      return part
    })
    return { ...msg, content }
  }) as ModelMessage[]
}

/**
 * Core streaming handler — tool-driven AI.
 *
 * The model decides dynamically which tools to call:
 * - retrieveKnowledgeTool  → Qdrant + Cohere RAG for Other Dev knowledge
 * - tavilySearchTool      → Web search for current events / general knowledge
 * - createArtifactTool    → Interactive web content generation
 *
 * Routing is handled entirely by the model via tool calls, following Anthropic/AI SDK
 * best practices. No pre-classification or pre-fetched RAG context injection.
 */
export async function handleStreamChat({
  messages,
  supportsArtifacts,
  request,
}: HandleStreamChatOptions): Promise<HandleStreamChatResult> {
  validateApiKeys()
  const clientId = getClientIdentifier(request)
  const rateLimitResult = await checkRateLimit(clientId)

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    return {
      result: null,
      response: createJsonResponse({ error: 'Too many requests. Please try again later.' }, 429, {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': REQUESTS_PER_WINDOW.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      }),
      suggestions: [],
      rateLimit: { limit: REQUESTS_PER_WINDOW, remaining: 0 },
    }
  }

  const lastUserMessage = messages.filter((m: UIMessage) => m.role === 'user').pop()
  const lastUserText = extractUserText(lastUserMessage)
  const normalizedQuery = sanitizeInput(lastUserText).replace(/otherdev/gi, 'Other Dev')

  const hasImageContent = messages.some((m: UIMessage) =>
    m.parts?.some(
      p =>
        p.type === 'file' &&
        'mediaType' in p &&
        (p as { mediaType?: string }).mediaType?.startsWith('image/')
    )
  )

  // Model selection: vision for images, fast for text
  const selectedModelId = hasImageContent ? VISION_MODEL : TEXT_MODEL

  // Build the tools object — model decides which to use via its own reasoning
  const tools: ToolSet = {
    retrieveKnowledge: retrieveKnowledgeTool,
    tavilySearch: tavilySearchTool,
  }
  if (supportsArtifacts) {
    tools.createArtifact = createArtifactTool
  }

  // Validate messages
  let uiMessages: UIMessage[]
  try {
    uiMessages = (await validateUIMessages({
      messages,
      dataSchemas: {
        suggestion: suggestionDataSchema,
      },
      tools: {
        // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool validation
        createArtifact: createArtifactTool as any,
        // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool validation
        retrieveKnowledge: retrieveKnowledgeTool as any,
        // biome-ignore lint/suspicious/noExplicitAny: AI SDK tool validation
        tavilySearch: tavilySearchTool as any,
      },
    })) as UIMessage[]
  } catch (error) {
    if (error instanceof (await import('ai')).TypeValidationError) {
      console.error('[VALIDATION] Invalid chat messages:', error.message)
      return {
        result: null,
        response: createJsonResponse({ error: 'Invalid message payload' }, 400),
        suggestions: [],
        rateLimit: { limit: REQUESTS_PER_WINDOW, remaining: rateLimitResult.remaining },
      }
    }
    throw error
  }

  // Convert UIMessages to AI SDK ModelMessage[] format
  const rawModelMessages = await convertToModelMessages(uiMessages, {
    tools: { createArtifact: createArtifactTool },
  })

  // Sanitize and resolve data URIs
  const sanitizedMessages = sanitizeModelMessages(rawModelMessages)
  const modelMessages = resolveDataURIs(sanitizedMessages)

  const fallbacks = hasImageContent
    ? [VISION_MODEL_FALLBACK]
    : [TEXT_MODEL_FALLBACK, TEXT_MODEL_FALLBACK_2]

  // Provider priority: primary provider first, then failover
  // Text: Groq primary → Cerebras → Cohere
  // Vision: Mistral primary → Groq fallback
  const providerPriority = hasImageContent
    ? ['mistral', 'groq']
    : ['groq', 'cerebras', 'cohere']

  // Generate suggestions before streaming — always text model with same fallback chain
  // Based on Anthropic best practices: examples are "the single most effective tool" for steering output
  // Negative examples explicitly prevent AI-voice suggestions like "should I show you..."
  const suggestionsPromise = generateText({
    model: gateway(TEXT_MODEL),
    output: Output.object({
      schema: SUGGESTIONS_SCHEMA,
    }),
    system: `You are helping a potential client explore Other Dev's web development and design services.
Generate follow-up questions ONLY in the user's voice — first person, as a client seeking help from Other Dev.
NEVER generate questions that sound like an AI assistant offering to show or share something.
Good examples (user voice, first person, seeking help):
- "What industries do you typically work with?"
- "How long does a typical project take?"
- "Do you offer ongoing support after launch?"
- "What's your process for starting a new project?"
Bad examples (AI voice — do NOT generate these):
- "Should I show you some of our recent projects?"
- "Would you like to learn more about our process?"
- "Can I share our approach with you?"
- "Want to see some case studies?"
Return only the questions, one per line. Max 10 words each. Be specific to the user's actual question.`,
    prompt: `User asked: "${normalizedQuery}"
Generate 2-3 follow-up questions in the user's voice (first person, as a client seeking help from Other Dev).`,
    providerOptions: {
      gateway: {
        order: ['groq', 'cerebras', 'cohere'],
        models: [TEXT_MODEL_FALLBACK, TEXT_MODEL_FALLBACK_2],
        byok: {
          groq: [{ apiKey: process.env.GROQ_API_KEY! }],
          cerebras: [{ apiKey: process.env.CEREBRAS_API_KEY! }],
          cohere: [{ apiKey: process.env.COHERE_API_KEY! }],
          mistral: [{ apiKey: process.env.MISTRAL_API_KEY! }],
        },
      },
    },
  })
    .then(r => r.output?.suggestions ?? [])
    .catch(err => {
      console.error('[chat] suggestion generation failed:', err)
      return [] as string[]
    })

  const resolvedSuggestions = await suggestionsPromise

  const result = streamText({
    model: gateway(selectedModelId),
    system: getSystemPrompt(),
    messages: modelMessages,
    temperature: 0.5,
    maxOutputTokens: supportsArtifacts ? 4096 : 1024,
    stopWhen: stepCountIs(5),
    toolChoice: 'auto',
    tools,
    providerOptions: {
      gateway: {
        order: providerPriority,
        models: fallbacks,
        byok: {
          groq: [{ apiKey: process.env.GROQ_API_KEY! }],
          cerebras: [{ apiKey: process.env.CEREBRAS_API_KEY! }],
          cohere: [{ apiKey: process.env.COHERE_API_KEY! }],
          mistral: [{ apiKey: process.env.MISTRAL_API_KEY! }],
        },
      },
    },
  })

  return {
    result,
    response: null,
    suggestions: resolvedSuggestions,
    rateLimit: { limit: REQUESTS_PER_WINDOW, remaining: rateLimitResult.remaining },
  }
}

function coreIdentity(): string {
  return `You are a consultative associate at Other Dev — think of yourself as a knowledgeable colleague who gives honest, direct answers. You acknowledge limitations openly, never oversell, and prioritize what's right for the caller over closing a deal.`
}

function whoSection(): string {
  return `<who>
Other Dev is a web development and design studio in Karachi, Pakistan, specializing in fashion e-commerce, real estate, legal tech, SaaS, and enterprise systems.
Website: https://otherdev.com | Location: Karachi, Pakistan
</who>`
}

function toneSection(): string {
  return `<tone>
Be direct, concise, and honest. Prioritize clarity over elaboration. Acknowledge limits openly.
</tone>`
}

function taskDescription(): string {
  return `<task_description>
- Answer questions about Other Dev using the retrieveKnowledge tool results ONLY. Never answer from your own training knowledge.
- Answer general knowledge and current events using the tavilySearch tool
- Build interactive web content using the createArtifact tool
- For conversational inputs ("ok", "sure", "thanks") or brief acknowledgments, respond naturally without calling tools

<hallucination_prevention>
- You MUST answer Other Dev business questions ONLY using the context retrieved by the retrieveKnowledge tool.
- If the retrieveKnowledge tool returns sparse results (fewer than 2 documents returned) or you are uncertain — say "I don't have enough information to answer that confidently." Do not guess.
- Never fabricate details about Other Dev's projects, services, team, or capabilities if the retrieveKnowledge tool did not return relevant results.
</hallucination_prevention>

<tool_guardrails>
- Before calling any tool, verify you have enough information to do so correctly.
- If the user's question is vague or missing key details, ask a clarifying question FIRST.
- Do NOT call retrieveKnowledge with a generic query when specifics (project name, service name, tech name) would improve the answer.
- Only call tools when genuinely needed — not for conversational acknowledgments.
</tool_guardrails>

<behavioral_guardrails>
- If the user asks about topics unrelated to web development, design, Other Dev's services, or general knowledge — politely redirect: "I'm focused on helping with web development and design topics. Is there something in that area I can help with?"
- If a question is unsolvable or outside your scope — say so directly, then offer an alternative path ("You may need to contact Other Dev at [hello@otherdev.com](mailto:hello@otherdev.com).")
</behavioral_guardrails>
</task_description>`
}

function examplesSection(): string {
  return `<examples>
Example 1 - retrieveKnowledge tool:
<user>"What projects has Other Dev built?"</user>
<tool_calls>[retrieveKnowledge: {"query": "Other Dev portfolio projects"}]</tool_calls>
<tool_result>[Document 1 (Relevance: 91.2%): Narkins Builders 2024 — fashion e-commerce platform
Document 2 (Relevance: 88.7%): Fashion Store v2 — multi-brand retail
Document 3 (Relevance: 74.3%): Enterprise SaaS portal — internal tooling]</tool_result>
<response>Other Dev has built [Narkins Builders](https://narkinsbuilders.com) (2024), a fashion e-commerce platform, and an enterprise SaaS portal. See more at [otherdev.com/work](https://otherdev.com/work).</response>

Example 2 - conversational no-tool:
<user>"Ok thanks!"</user>
<response>You're welcome! Let me know if you have any other questions.</response>

Example 3 - mermaid output (ASCII labels only, no special chars):
<task>"Draw checkout flow"</task>
<response>graph TD
A[Browser] --> B[DNS Lookup]
B --> C[TCP Connection]
C --> D[HTTP Request]
D --> E[Server]
E --> F[Response]
G[Render]
</response>

Example 4 - no knowledge found:
<user>"What is Other Dev's refund policy?"</user>
<tool_result>[no relevant info found]</tool_result>
<response>I don't have information about that. Contact them directly at [hello@otherdev.com](mailto:hello@otherdev.com).</response>

Example 5 - low-confidence / sparse RAG results:
<user>"What tech stack does the Enterprise SaaS portal use?"</user>
<tool_result>[Document 1 (Relevance: 28.5%): Enterprise SaaS portal — partially documented, tech stack not specified]</tool_result>
<response>I don't have enough information to answer that confidently. The knowledge base has limited details about the Enterprise SaaS portal's tech stack. Could you ask a more specific question or contact Other Dev directly at [hello@otherdev.com](mailto:hello@otherdev.com)?</response>

Example 6 - off-topic redirect:
<user>"What's the weather in Karachi?"</user>
<response>I'm focused on helping with web development and design topics. Is there something in that area I can help with?</response>
</examples>`
}

function immediateTask(): string {
  return `<immediate_task>
Answer the user's question using only the retrieved knowledge and web search results.
Be direct and concise. Do not volunteer information beyond what was asked.
</immediate_task>`
}

function precognition(): string {
  return `<precognition>
Think step by step before responding:
1. Do I have enough information from the tool results to answer this question?
2. Is the relevance of retrieved documents high enough (>0.5 similarity)?
3. Is this question about Other Dev's business? If so — am I using ONLY the retrieveKnowledge results, not my own knowledge?
4. Is this question on-topic for web development and design?
5. If I cannot answer confidently, have I said so instead of guessing?
</precognition>`
}

function outputFormatting(): string {
  return `<output_rules>
- Links: ALWAYS format every link as [visible text](url). Example: [React Docs](https://react.dev/reference/react/useEffect). NEVER write a bare URL or plain text link. Every URL must be wrapped in square brackets with descriptive text.
- Website links: [otherdev.com](https://otherdev.com), not https://otherdev.com
- Phone: [tel:+923156893331](tel:+923156893331)
- Email: [hello@otherdev.com](mailto:hello@otherdev.com)
- Project URLs: [Narkins Builders](https://narkinsbuilders.com)
- Math: Use $$...$$ for block math and $...$ for inline math. Never use raw LaTeX display commands like \\[ or \\( . Example: $$x^2 + y^2 = z^2$$ not \\[x^2 + y^2 = z^2\\]
- Diagrams: Use inline mermaid markdown for flowcharts, sequence diagrams, and timelines — reserve createArtifact for complex interactive demos or multi-file artifacts. CRITICAL mermaid rules: node labels must be SIMPLE plain ASCII text in brackets. NO parentheses, NO em-dashes, NO special Unicode, NO colons, NO slashes inside brackets. Short simple words only. Example: graph TD; A[Browser] --> B[DNS Lookup] --> C[TCP Connection] --> D[HTTP Request] --> E[Server] --> F[Response] --> G[Render]
</output_rules>`
}

function getSystemPrompt(): string {
  return [
    coreIdentity(),
    whoSection(),
    toneSection(),
    taskDescription(),
    examplesSection(),
    immediateTask(),
    precognition(),
    outputFormatting(),
  ].join('\n\n')
}
