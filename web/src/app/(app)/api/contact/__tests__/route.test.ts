import { beforeEach, describe, expect, test, vi } from 'bun:test'
import { checkRateLimit, getClientIdentifier } from '@/server/lib/rate-limit'

// Mock the rate-limit module
vi.mock('@/server/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getClientIdentifier: vi.fn().mockReturnValue('test-client'),
}))

// Mock googleapis
vi.mock('googleapis', () => ({
  google: {
    sheets: vi.fn().mockReturnValue({
      spreadsheets: {
        values: {
          append: vi.fn().mockResolvedValue({}),
        },
      },
    }),
    auth: {
      GoogleAuth: vi.fn().mockImplementation(() => ({})),
    },
  },
}))

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    }),
  },
}))

// Mock environment variables
const OLD_ENV = process.env
beforeEach(() => {
  process.env = {
    ...OLD_ENV,
    GOOGLE_CLIENT_EMAIL: 'test@example.com',
    GOOGLE_PRIVATE_KEY: 'test-private-key',
    GOOGLE_SHEET_ID: 'test-sheet-id',
    GMAIL_USER: 'test@gmail.com',
    GMAIL_APP_PASSWORD: 'test-password',
    GMAIL_RECIPIENTS: 'recipient@example.com',
  }
})

afterEach(() => {
  process.env = OLD_ENV
  vi.clearAllMocks()
})

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 400 when name is too short', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A',
        companyName: 'Test Corp',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough.',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  test('returns 400 when email is invalid', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        companyName: 'Test Corp',
        email: 'not-an-email',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough.',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  test('returns 400 when message is too short', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        companyName: 'Test Corp',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Short',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  test('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        companyName: 'Test Corp',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough to pass validation.',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(429)
    const data = await response.json()
    expect(data.error).toContain('Too many submissions')
  })

  test('returns 200 on successful submission', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        companyName: 'Test Corp',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough to pass validation.',
      }),
    })

    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toContain('successfully')
  })

  test('returns 500 when both sheet and email fail', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })

    // Re-mock to make both fail
    vi.resetModules()
    vi.doMock('googleapis', () => ({
      google: {
        sheets: vi.fn().mockReturnValue({
          spreadsheets: {
            values: {
              append: vi.fn().mockRejectedValue(new Error('Sheets API failed')),
            },
          },
        }),
        auth: {
          GoogleAuth: vi.fn().mockImplementation(() => ({})),
        },
      },
    }))
    vi.doMock('nodemailer', () => ({
      default: {
        createTransport: vi.fn().mockReturnValue({
          sendMail: vi.fn().mockRejectedValue(new Error('Email failed')),
        }),
      },
    }))

    // Need to re-import after mocking
    const { google } = await import('googleapis')
    const { default: nodemailer } = await import('nodemailer')

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        companyName: 'Test Corp',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message that is long enough to pass validation.',
      }),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
  })

  test('validates required fields', async () => {
    const { checkRateLimit } = await import('@/server/lib/rate-limit')
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
    })

    const response = await fetch('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })
})
