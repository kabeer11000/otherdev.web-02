import { google } from 'googleapis'
import nodemailer from 'nodemailer'
import { z } from 'zod'

import type { RequestHandler } from '@builder.io/qwik-city'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  companyName: z.string().min(1, 'Company name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  subject: z.string().min(1, 'Subject is required.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
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

async function appendToSheet(data: z.infer<typeof contactFormSchema>) {
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

async function sendEmail(data: z.infer<typeof contactFormSchema>) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
  const emailContent = `
New Contact Form Submission

Name: ${data.name}
Company: ${data.companyName}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
  `.trim()
  const recipients = process.env.GMAIL_RECIPIENTS || process.env.GMAIL_USER
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: recipients,
    subject: 'New Contact Form Submission',
    text: emailContent,
  })
}

export const onPost: RequestHandler = async (requestEvent) => {
  try {
    const body = await requestEvent.request.json()
    const result = contactFormSchema.safeParse(body)

    if (!result.success) {
      requestEvent.json(400, { error: result.error.flatten() })
      return
    }

    const [sheetResult, emailResult] = await Promise.allSettled([
      appendToSheet(result.data),
      sendEmail(result.data),
    ])

    if (sheetResult.status === 'rejected' && emailResult.status === 'rejected') {
      requestEvent.json(500, { error: 'Failed to submit. Please try again.' })
      return
    }

    requestEvent.json(200, { message: 'Form submitted successfully' })
  } catch {
    requestEvent.json(500, { error: 'Internal server error.' })
  }
}