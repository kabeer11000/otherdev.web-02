import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit, getClientIdentifier } from '@/server/lib/rate-limit'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

const leadCaptureSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  role: z.string().min(1, 'Role is required'),
  company: z.string().min(1, 'Company is required'),
  pain_point: z.string().min(1, 'Pain point is required'),
  timeline: z.string().min(1, 'Timeline is required'),
  booking_ref: z.string().optional(),
  source: z.string().optional().default('agent-widget'),
})

function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  })
  return auth
}

async function appendLeadToSheet(data: z.infer<typeof leadCaptureSchema>) {
  const auth = getGoogleAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
  const values = [
    [
      timestamp,
      data.name,
      data.email,
      data.role,
      data.company,
      data.pain_point,
      data.timeline,
      data.booking_ref ?? '',
      data.source,
    ],
  ]
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_LEADS_SHEET_ID,
    range: 'Sheet1!A:I',
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

export async function POST(request: Request) {
  try {
    const identifier = getClientIdentifier(request)
    const { allowed, resetTime } = await checkRateLimit(`lead-capture:${identifier}`)

    if (!allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Try again after ${new Date(resetTime).toLocaleTimeString()}.`,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const result = leadCaptureSchema.safeParse(body)

    if (!result.success) {
      return Response.json({ error: result.error.flatten() }, { status: 400 })
    }

    await appendLeadToSheet(result.data)

    return Response.json({ success: true, message: 'Lead captured successfully' })
  } catch (error) {
    console.error('Lead capture error:', error)
    return Response.json({ error: 'Failed to capture lead. Please try again.' }, { status: 500 })
  }
}
