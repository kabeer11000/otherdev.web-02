import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'

function createJsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const message = body.message

    if (!message) {
      return createJsonResponse({ error: 'No message' }, 400)
    }

    const stream = createUIMessageStream({
      originalMessages: [message],
      execute: async ({ writer }) => {
        writer.write({ type: 'start' })
        writer.write({
          type: 'text-start',
          id: 'test-id',
        })
        writer.write({
          type: 'text-delta',
          id: 'test-id',
          delta: 'Hello from simple stream!',
        })
        writer.write({ type: 'text-end', id: 'test-id' })
        writer.write({ type: 'finish', finishReason: 'stop' })
      },
    })

    return createUIMessageStreamResponse({ stream })
  } catch (error) {
    console.error('Chat error:', error)
    return createJsonResponse({ error: String(error) }, 500)
  }
}
