import { createJsonResponse } from './api-helpers'

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return createJsonResponse({ error: 'No audio file provided' }, 400)
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return createJsonResponse({ error: 'Transcription service not configured' }, 500)
    }

    const audioBuffer = await audioFile.arrayBuffer()

    const groqFormData = new FormData()
    groqFormData.append('file', new Blob([audioBuffer], { type: audioFile.type }), audioFile.name)
    groqFormData.append('model', 'whisper-large-v3')
    groqFormData.append('language', 'en')
    groqFormData.append('timestamp_granularities[]', 'word')

    const groqResponse = await fetch('https://api.groq.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    })

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text()
      console.error('[Transcribe] Groq API error:', errorText)
      return createJsonResponse({ error: 'Transcription failed' }, 500)
    }

    const result = await groqResponse.json()

    return new Response(
      `data: ${JSON.stringify({ type: 'transcript-complete', content: result.text })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      }
    )
  } catch (error) {
    console.error('[Transcribe] Error:', error)
    return createJsonResponse({ error: 'Transcription failed' }, 500)
  }
}
