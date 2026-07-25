import { groq } from '@ai-sdk/groq'
import { transcribe } from 'ai'

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()

    const { text } = await transcribe({
      model: groq.transcription('whisper-large-v3-turbo'),
      audio: arrayBuffer,
      providerOptions: {
        groq: { language: 'en' },
      },
    })

    return Response.json({ text })
  } catch (error) {
    console.error('Transcription error:', error instanceof Error ? error.message : String(error))
    return Response.json({ error: 'Transcription failed. Please try again.' }, { status: 500 })
  }
}
