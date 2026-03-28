import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const REQUESTS_PER_WINDOW = 10;

const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(REQUESTS_PER_WINDOW, "1 m"),
  prefix: "rl:chat",
});

const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:contact",
});

export async function checkRateLimit(
  identifier: string,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const limiter = identifier.startsWith("contact:")
    ? contactRatelimit
    : chatRatelimit;

  const { success, remaining, reset } = await limiter.limit(identifier);

  return {
    allowed: success,
    remaining,
    resetTime: reset,
  };
}

export function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
