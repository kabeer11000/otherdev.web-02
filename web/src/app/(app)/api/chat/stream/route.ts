import { type UIMessage } from 'ai'
import { suggestionDataSchema } from '@/lib/schemas'
import { buildUIMessageStreamResponse, handleStreamChat } from '@/server/lib/chat/stream-handler'
import { replaceMessageAtId } from '@/server/lib/chat/message-utils'
import {
  createArtifactTool,
  retrieveKnowledgeTool,
  tavilySearchTool,
} from '@/server/lib/chat/tools'
import { checkRateLimit, getClientIdentifier, REQUESTS_PER_WINDOW } from '@/server/lib/rate-limit'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

type RequestBody = {
  id?: string
  message?: UIMessage
  messages?: UIMessage[]
  supportsArtifacts?: boolean
  trigger?: 'submit-user-message' | 'edit-message'
  messageId?: string
}

export async function POST(request: Request): Promise<Response> {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await checkRateLimit(clientId)

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      return Response.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': REQUESTS_PER_WINDOW.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      )
    }

    const body = (await request.json()) as RequestBody

    const chatId =
      typeof body.id === 'string' && body.id.trim().length > 0 ? body.id : crypto.randomUUID()
    const supportsArtifacts = body.supportsArtifacts === true
    const isEditMessage = body.trigger === 'edit-message'

    let candidateMessages: UIMessage[] = []

    if (isEditMessage) {
      // Industry-standard replace-and-replay: client sends full history + the messageId to edit
      // We slice at messageId, replace with the new content, and re-run the model.
      if (!body.messageId || !Array.isArray(body.messages)) {
        return Response.json(
          { error: 'messageId and messages required for edit-message' },
          { status: 400 }
        )
      }
      candidateMessages = replaceMessageAtId(body.messages, body.messageId, body.message!)
    } else {
      // Anthropic pattern: client sends full history — use body.messages directly
      candidateMessages = Array.isArray(body.messages) ? body.messages : []
    }

    if (candidateMessages.length === 0) {
      return Response.json({ error: 'No messages provided' }, { status: 400 })
    }

    // Filter to only valid messages
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
      return Response.json({ error: 'No valid messages provided' }, { status: 400 })
    }

    // For submit: save AFTER streaming via onFinish (industry standard)
    // Anthropic pattern: client owns history persistence — no server-side save needed

    const handleResult = await handleStreamChat({
      messages: candidateMessages,
      supportsArtifacts,
      request,
    })

    if (!handleResult.ok) {
      return handleResult.errorResponse
    }

    const { result: textResult, suggestions } = handleResult
    return buildUIMessageStreamResponse(textResult, candidateMessages, suggestions)
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
  }
}
