interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const REQUESTS_PER_WINDOW = 10;
const WINDOW_MS = 60 * 1000;
const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  // If still over limit after cleanup, evict oldest entries
  if (rateLimitMap.size > MAX_ENTRIES) {
    const overflow = rateLimitMap.size - MAX_ENTRIES;
    let evicted = 0;
    for (const key of rateLimitMap.keys()) {
      if (evicted >= overflow) break;
      rateLimitMap.delete(key);
      evicted++;
    }
  }
}

// Periodic cleanup to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
}

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + WINDOW_MS;
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      remaining: REQUESTS_PER_WINDOW - 1,
      resetTime,
    };
  }

  if (entry.count >= REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  rateLimitMap.set(identifier, entry);

  return {
    allowed: true,
    remaining: REQUESTS_PER_WINDOW - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    const ips = forwardedFor.split(",");
    return ips[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
