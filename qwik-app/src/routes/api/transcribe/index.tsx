import { createGroq } from '@ai-sdk/groq'
import { experimental_transcribe as transcribe } from 'ai'

import type { RequestHandler } from '@builder.io/qwik-city'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export const onPost: RequestHandler = async (requestEvent) => {
  try {
    const formData = await requestEvent.request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      requestEvent.json(400, { error: 'No audio file provided' })
      return
    }

    const arrayBuffer = await audioFile.arrayBuffer()

    const { text } = await transcribe({
      model: groq.transcription('whisper-large-v3-turbo'),
      audio: arrayBuffer,
    })

    const encoder = new TextEncoder()

    requestEvent.headers.set('content-type', 'text/event-stream')
    requestEvent.headers.set('cache-control', 'no-cache')

    const writableStream = requestEvent.getWritableStream()
    const writer = writableStream.getWriter()

    let index = 0
    const streamChunks = async () => {
      while (index < text.length) {
        let chunkEnd = Math.min(index + 50, text.length)
        if (chunkEnd < text.length) {
          const nextSpace = text.indexOf(' ', chunkEnd)
          if (nextSpace !== -1 && nextSpace < index + 80) {
            chunkEnd = nextSpace
          }
        }

        const chunk = text.slice(index, chunkEnd)
        index = chunkEnd

        const data = JSON.stringify({
          type: 'transcript-chunk',
          content: chunk,
        })
        writer.write(encoder.encode(`data: ${data}\n`))
        await new Promise(resolve => setTimeout(resolve, 3))
      }

      const completeData = JSON.stringify({
        type: 'transcript-complete',
        content: text,
      })
      writer.write(encoder.encode(`data: ${completeData}\n`))
      writer.write(encoder.encode('data: [DONE]\n'))
      writer.close()
    }

    streamChunks().catch(error => {
      console.error('Streaming error:', error)
      writer.abort(error)
    })
  } catch (error) {
    console.error('Transcription error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    requestEvent.json(500, { error: `Transcription failed: ${errorMessage}` })
  }
}