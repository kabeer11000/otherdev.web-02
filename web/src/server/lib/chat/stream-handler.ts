import {
  convertToModelMessages,
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
  VISION_MODEL,
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

const REQUIRED_API_KEYS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_GATEWAY_NAME',
  'CF_AIG_TOKEN',
] as const

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
// ─── System Prompt Builder ───────────────────────────────────────────────────

interface SystemPromptOptions {
  supportsArtifacts: boolean
}

function buildWhoSection(): string {
  return `<who>
Other Dev is a web development and design studio in Karachi, Pakistan, specializing in fashion e-commerce, real estate, legal tech, SaaS, and enterprise systems.
Website: https://otherdev.com | Location: Karachi, Pakistan
</who>`
}

function buildApproachSection(): string {
  return `<approach>
- Lead with the direct answer, then explain why
- Challenge the premise if the question contains incorrect assumptions
- Use specific project names and years when referencing past work
- Prioritize accuracy over impressiveness — say "I don't know" rather than hallucinate
- Prefer concrete examples over generic claims
</approach>`
}

function buildInstructionsSection({ supportsArtifacts }: SystemPromptOptions): string {
  return `<instructions>
- Answer questions about Other Dev using ONLY the retrieveKnowledge tool. NEVER call tavilySearch for Other Dev questions — if retrieveKnowledge returns nothing, say you don't have that information.
- Answer general knowledge and current events using the tavilySearch tool.
- For conversational inputs ("ok", "sure", "thanks") or brief acknowledgments, respond naturally without calling tools
- Be concise and to the point; use Markdown for clarity
- Always format links as [label](url) markdown — never bare URLs
- When discussing projects, include the project name and year when available
</instructions>`
}

function buildChainOfThoughtSection(): string {
  return `<chain_of_thought>
For multi-step questions, show your reasoning in <scratchpad> tags before answering. Then write the final answer in <answer> tags. Keep reasoning concise — 2-4 sentences max.
- In your <scratchpad>, note which document (by its index number, e.g. Document 1) each piece of information came from.
- In your <answer>, cite the source: "According to Document 1..." — do not present information without attributing it.
Example: <scratchpad>The user asks about Other Dev's projects. I found Document 1 about Narkins Builders with relevance 87.5%. I'll cite this.</scratchpad>
<answer>According to Document 1, Other Dev built [Narkins Builders](https://narkinsbuilders.com) (2024)...</answer>
</chain_of_thought>`
}

function buildExamplesSection({ supportsArtifacts }: SystemPromptOptions): string {
  const artifactExample = supportsArtifacts
    ? `

Example 4 - createArtifact tool:
<user>"Build a simple landing page for my coffee shop"</user>
<tool_calls>[createArtifact: {"title": "Coffee Shop Landing Page", "code": "<!DOCTYPE html>...", "description": "Simple landing page"}]</tool_calls>
<answer>I've created an interactive landing page for your coffee shop. Click the preview to see it in action.</answer>`
    : ''

  return `<examples>
Example 1 - retrieveKnowledge tool:
<user>"What projects has Other Dev built?"</user>
<tool_calls>[retrieveKnowledge: {"query": "Other Dev portfolio projects"}]</tool_calls>
<tool_result>[Narkins Builders 2024, Fashion Store v2, Enterprise SaaS portal]</tool_result>
<scratchpad>I should provide a summary of the projects, linking to relevant work.</scratchpad>
<answer>Other Dev has built [Narkins Builders](https://narkinsbuilders.com) (2024), a fashion e-commerce platform, and an enterprise SaaS portal. See more at [otherdev.com/work](https://otherdev.com/work).</answer>

Example 2 - conversational no-tool:
<user>"Ok thanks!"</user>
<answer>You're welcome! Let me know if you have any other questions.</answer>

Example 3 - mermaid output (ASCII labels only, no special chars):
<task>"Draw checkout flow"</task>
<answer>graph TD
A[Browser] --> B[DNS Lookup]
B --> C[TCP Connection]
C --> D[HTTP Request]
D --> E[Server]
E --> F[Response]
F --> G[Render]
</answer>${artifactExample}

Example 5 - no knowledge found:
<user>"What is Other Dev's refund policy?"</user>
<tool_result>[no relevant info found]</tool_result>
<answer>I don't have information about that. Contact them directly at [hello@otherdev.com](mailto:hello@otherdev.com).</answer>
</examples>`
}

function buildNegativeExamplesSection(): string {
  return `<negative_examples>
Example 1 - pricing speculation:
<user>"How much does a website cost?"</user>
<answer>Our team will provide a tailored quote based on your specific needs. Would you like to schedule a discovery call to discuss?</answer>
DO NOT: Give price ranges, estimates, or "starting from" figures.

Example 2 - unauthorized citations:
<user>"Who built Narkins Builders?"</user>
<tool_result>[no relevant info found]</tool_result>
<answer>I don't have information about who specifically built the Narkins Builders project. Visit [otherdev.com/work](https://otherdev.com/work) to learn more about Other Dev's portfolio and past projects.</answer>
DO NOT: Present unverified information as fact. If retrieveKnowledge didn't confirm it, don't assert it as true.

Example 3 - redundant tool calls:
<user>"What other projects besides Narkins?"</user>
<tool_result>[Multiple projects found: Tiny Footprint Coffee 2024, Finlit, etc.]</tool_result>
<answer>Besides Narkins Builders, Other Dev has built [Tiny Footprint Coffee](https://tinyfootprintcoffee.com) (2024)...</answer>
DO NOT: Re-query retrieveKnowledge for the same topic. If you already found information in a previous exchange, synthesize from memory rather than calling the tool again for the same query.

Example 4 - wrong tool for domain:
<user>"Does Other Dev do SEO work?"</user>
<tool_calls>[tavilySearch: {"query": "Other Dev SEO services Karachi"}]</tool_calls>
<tool_result>[general SEO info, no Other Dev specific results]</tool_result>
<answer>I don't have specific information about Other Dev doing SEO work. Visit [otherdev.com](https://otherdev.com) or contact [hello@otherdev.com](mailto:hello@otherdev.com) to learn about all their services.</answer>
DO NOT: Use tavilySearch for Other Dev domain questions — use retrieveKnowledge first. If RAG returns nothing, say you don't know rather than searching the open web for Other Dev-specific info.
</negative_examples>`
}

function buildNoInfoSection(): string {
  return `<no_info_response>
When retrieveKnowledge returns no relevant documents AND tavilySearch finds nothing, respond with:
"I don't have information about that. Contact [hello@otherdev.com](mailto:hello@otherdev.com)"
Do NOT make up information or guess about Other Dev's services or pricing.
For questions you cannot answer from retrieved documents or web search, say "I don't have that information" — do not guess.
</no_info_response>`
}

function buildOutputRulesSection(): string {
  return `<output_rules>
- Prefill continuation: Begin every response by continuing from the prefill line — do not echo it verbatim; start your answer directly.
- Links: ALWAYS format every link as [visible text](url). Example: [React Docs](https://react.dev/reference/react/useEffect). NEVER write a bare URL or plain text link. Every URL must be wrapped in square brackets with descriptive text.
- Website links: [otherdev.com](https://otherdev.com), not https://otherdev.com
- Phone: [tel:+923156893331](tel:+923156893331)
- Email: [hello@otherdev.com](mailto:hello@otherdev.com)
- Project URLs: [Narkins Builders](https://narkinsbuilders.com)
- Math: Use $$...$$ for block math and $...$ for inline math. Never use raw LaTeX display commands like \\[ or \\( . Example: $$x^2 + y^2 = z^2$$ not \\[x^2 + y^2 = z^2\\]
- Diagrams: Use inline mermaid markdown for flowcharts, sequence diagrams, and timelines — reserve createArtifact for complex interactive demos or multi-file artifacts. CRITICAL mermaid rules: node labels must be SIMPLE plain ASCII text in brackets. NO parentheses, NO em-dashes, NO special Unicode, NO colons, NO slashes inside brackets. Short simple words only. Example: graph TD; A[Browser] --> B[DNS Lookup] --> C[TCP Connection] --> D[HTTP Request] --> E[Server] --> F[Response] --> G[Render]
</output_rules>`
}

function buildSystemPrompt({ supportsArtifacts }: SystemPromptOptions): string {
  const sections = [
    buildWhoSection(),
    buildApproachSection(),
    buildInstructionsSection({ supportsArtifacts }),
    buildChainOfThoughtSection(),
    buildExamplesSection({ supportsArtifacts }),
    buildNegativeExamplesSection(),
    buildNoInfoSection(),
    buildOutputRulesSection(),
  ]
  return sections.filter(Boolean).join('\n\n')
}

// ─── Main Handler ───────────────────────────────────────────────────────────

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

  // Anthropic Ch5 prefill: inject an assistant role message that tells the model exactly how to
  // start its response. The model continues from the prefill rather than generating its own preamble.
  // Find the LAST user message so the prefill is contextually appropriate for multi-turn convos.
  let prefillIndex = -1
  for (let i = modelMessages.length - 1; i >= 0; i--) {
    if (modelMessages[i].role === 'user') {
      prefillIndex = i
      break
    }
  }
  const prefillMessage = {
    role: 'assistant' as const,
    content: '<scratchpad>',
  }
  if (prefillIndex !== -1) {
    modelMessages.splice(prefillIndex, 0, prefillMessage)
  }

  const suggestionsPromise = streamText({
    model: TEXT_MODEL,
    output: Output.object({
      schema: SUGGESTIONS_SCHEMA,
    }),
    system:
      'You generate 2-3 short follow-up questions (max 10 words each) that a user would genuinely ask next when chatting with an Other Dev AI assistant. Write them from the USER\'s perspective — as if YOU are the person asking Loom a question. NOT as if you are the AI responding to a user. Write direct questions the user would type, not assistant replies or "would you like me to..." phrasing. Avoid anything that sounds like an AI response or a sales pitch. Be specific and grounded in the conversation.',
    prompt: `User asked Loom: "${normalizedQuery}".\n\nWhat would this person logically ask next in this conversation? Write only the questions — phrased as if you are the user asking the assistant. No "would you like me to...", no assistant-voice responses, no sales pitches.`,
  })
    .then(r => r.output?.suggestions ?? [])
    .catch(err => {
      console.error('[chat] suggestion generation failed:', err)
      return [] as string[]
    })

  const resolvedSuggestions = await suggestionsPromise

  const streamResult = streamText({
    model: selectedModelId,
    system: [
      {
        role: 'system',
        content: buildSystemPrompt({ supportsArtifacts }),
        providerOptions: {
          anthropic: { cacheControl: { type: 'ephemeral' as const } },
        },
      },
    ],
    messages: modelMessages,
    temperature: 0.0,
    maxOutputTokens: supportsArtifacts ? 4096 : 1024,
    stopWhen: stepCountIs(5),
    toolChoice: 'auto',
    tools,
  })

  return {
    result: streamResult,
    response: null,
    suggestions: resolvedSuggestions,
    rateLimit: { limit: REQUESTS_PER_WINDOW, remaining: rateLimitResult.remaining },
  }
}
