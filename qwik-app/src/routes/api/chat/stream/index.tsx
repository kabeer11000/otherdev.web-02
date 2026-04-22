import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import type { RequestHandler } from '@builder.io/qwik-city'
import { knowledgeBase } from '~/lib/knowledge-base'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

function buildRAGContext(query: string): string {
  const queryLower = query.toLowerCase()
  const relevantDocs = knowledgeBase.filter(doc => {
    const content = doc.content.toLowerCase()
    const title = doc.metadata.title.toLowerCase()
    return (
      content.includes('other dev') ||
      title.includes('other dev') ||
      (queryLower.includes('service') && (content.includes('service') || title.includes('service'))) ||
      (queryLower.includes('project') && doc.metadata.type === 'project') ||
      (queryLower.includes('founder') && (content.includes('kabeer') || content.includes('ossaid'))) ||
      (queryLower.includes('price') && content.includes('rs ')) ||
      (queryLower.includes('tech') && doc.content.includes('Tech Stack'))
    )
  }).slice(0, 5)

  if (relevantDocs.length === 0) return ''

  return relevantDocs
    .map(doc => `[${doc.metadata.type.toUpperCase()} - ${doc.metadata.title}]\n${doc.content}`)
    .join('\n\n')
}

export const onPost: RequestHandler = async (requestEvent) => {
  const { messages } = await requestEvent.request.json()

  const lastUserMessage = messages.length > 0
    ? messages.filter((m: { role: string }) => m.role === 'user').slice(-1)[0]?.content || ''
    : ''

  const ragContext = buildRAGContext(lastUserMessage)

  const systemPrompt = ragContext
    ? `You are a helpful AI assistant for Other Dev, a Karachi-based software and design studio. Use the following context:\n\n${ragContext}\n\nBe specific with results and statistics.`
    : `You are a helpful AI assistant for Other Dev, a Karachi-based software and design studio founded in 2021 by Kabeer Jaffri and Ossaid Qadri.`

  const messagesWithContext = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: messagesWithContext,
  })

  // Set headers before getting writable stream
  requestEvent.headers.set('Content-Type', 'text/plain; charset=utf-8')
  requestEvent.headers.set('Cache-Control', 'no-cache')
  requestEvent.headers.set('Connection', 'keep-alive')

  // Get the text stream from AI SDK result
  const textStream = result.textStream
  const encoder = new TextEncoder()

  const writableStream = requestEvent.getWritableStream()
  const writer = writableStream.getWriter()

  const processStream = async () => {
    try {
      for await (const chunk of textStream) {
        const encoded = encoder.encode(chunk)
        await writer.write(encoded)
      }
      writer.close()
    } catch (err: unknown) {
      console.error('Stream error:', err)
      writer.abort()
    }
  }

  processStream()
}