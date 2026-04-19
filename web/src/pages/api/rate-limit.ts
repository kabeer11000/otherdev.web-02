interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export const REQUESTS_PER_WINDOW = 10
const WINDOW_SIZE_MS = 60 * 1000

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

export async function checkRateLimit(clientId: string): Promise<{
  allowed: boolean
  remaining: number
  resetTime: number
}> {
  const now = Date.now()
  const entry = rateLimitStore.get(clientId)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + WINDOW_SIZE_MS
    rateLimitStore.set(clientId, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: REQUESTS_PER_WINDOW - 1,
      resetTime,
    }
  }

  if (entry.count >= REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: REQUESTS_PER_WINDOW - entry.count,
    resetTime: entry.resetTime,
  }
}
