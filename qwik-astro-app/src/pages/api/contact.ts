import { google } from 'googleapis'
import nodemailer from 'nodemailer'
import type { APIRoute } from 'astro'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

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

async function appendToSheet(data: {
  name: string
  companyName: string
  email: string
  subject: string
  message: string
}) {
  const auth = getGoogleAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const timestamp = new Date().toISOString()
  const values = [[timestamp, data.name, data.companyName, data.email, data.subject, data.message]]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

async function sendEmail(data: {
  name: string
  companyName: string
  email: string
  subject: string
  message: string
}) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Other Dev Website" <${process.env.GMAIL_USER}>`,
    to: process.env.CONTACT_EMAIL || 'hello@otherdev.com',
    replyTo: data.email,
    subject: `New contact from ${data.name} (${data.companyName}): ${data.subject}`,
    text: [
      `Name: ${data.name}`,
      `Company: ${data.companyName}`,
      `Email: ${data.email}`,
      `Subject: ${data.subject}`,
      `Message: ${data.message}`,
    ].join('\n'),
  })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()

    if (!data.name || !data.email || !data.message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await Promise.all([appendToSheet(data), sendEmail(data)])

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[Contact] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed to submit contact form' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
