import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import type { RequestHandler } from '@builder.io/qwik-city';
import { knowledgeBase } from '~/lib/knowledge-base';

// Simple in-memory rate limiting (use Redis/KV in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

// Context window for llama-3.3-70b (128k tokens)
const MAX_CONTEXT_TOKENS = 128000;
const SYSTEM_PROMPT_TOKENS = 500; // Rough estimate for system prompt

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

function checkRateLimit(clientId: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now > entry.resetTime) {
    const resetTime = now + RATE_WINDOW_MS;
    rateLimitMap.set(clientId, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetTime };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetTime: entry.resetTime };
}

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() ?? 'anonymous';
}

function buildRAGContext(query: string): string {
  const queryLower = query.toLowerCase();
  const relevantDocs = knowledgeBase.filter((doc) => {
    const content = doc.content.toLowerCase();
    const title = doc.metadata.title.toLowerCase();
    return (
      content.includes('other dev') ||
      title.includes('other dev') ||
      (queryLower.includes('service') &&
        (content.includes('service') || title.includes('service'))) ||
      (queryLower.includes('project') && doc.metadata.type === 'project') ||
      (queryLower.includes('founder') &&
        (content.includes('kabeer') || content.includes('ossaid'))) ||
      (queryLower.includes('price') && content.includes('rs ')) ||
      (queryLower.includes('tech') && doc.content.includes('Tech Stack'))
    );
  }).slice(0, 5);

  if (relevantDocs.length === 0) return '';

  return relevantDocs
    .map(
      (doc) =>
        `[${doc.metadata.type.toUpperCase()} - ${doc.metadata.title}]\n${doc.content}`
    )
    .join('\n\n');
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

function truncateMessages(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  maxTokens: number
): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
  const availableTokens = maxTokens - SYSTEM_PROMPT_TOKENS;

  if (availableTokens <= 0) {
    return [];
  }

  let totalTokens = 0;
  const truncated: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  // Process messages from newest to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateTokens(msg.content);

    if (totalTokens + msgTokens <= availableTokens) {
      truncated.unshift(msg);
      totalTokens += msgTokens;
    } else {
      // Stop if adding more messages would exceed limit
      break;
    }
  }

  return truncated;
}

export const onPost: RequestHandler = async (requestEvent) => {
  const clientIp = getClientIp(requestEvent.request.headers);
  const rateLimitResult = checkRateLimit(clientIp);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil(
      (rateLimitResult.resetTime - Date.now()) / 1000
    );
    requestEvent.json(429, {
      error: 'Too many requests. Please try again later.',
      retryAfter,
    });
    return;
  }

  const groqApiKey = requestEvent.env.get('GROQ_API_KEY');
  if (!groqApiKey) {
    requestEvent.json(500, { error: 'GROQ_API_KEY not configured' });
    return;
  }

  const groq = createGroq({ apiKey: groqApiKey });

  const { messages } = (await requestEvent.request.json()) as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  };

  const lastUserMessage =
    messages.length > 0
      ? messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || ''
      : '';

  const ragContext = buildRAGContext(lastUserMessage);

  const systemPrompt = ragContext
    ? `You are a helpful AI assistant for Other Dev, a Karachi-based software and design studio. Use the following context:

${ragContext}

Be specific with results and statistics.
IMPORTANT: After your response, add "SUGGESTION:" followed by a short relevant follow-up question (max 60 characters) from the user's perspective.`
    : `You are a helpful AI assistant for Other Dev, a Karachi-based software and design studio founded in 2021 by Kabeer Jaffri and Ossaid Qadri.

IMPORTANT: After your response, add "SUGGESTION:" followed by a short relevant follow-up question (max 60 characters) from the user's perspective.`;

  // Truncate messages to fit within context window
  const truncatedMessages = truncateMessages(messages, MAX_CONTEXT_TOKENS);

  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    messages: [
      { role: 'system' as const, content: systemPrompt },
      ...truncatedMessages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
    ],
    system: systemPrompt,
  });

  // Send streaming response - AI SDK handles SSE formatting
  const response = result.toUIMessageStreamResponse();
  const responseBody = response.body;

  if (responseBody) {
    // Create a new response with rate limit headers
    const finalResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      },
    });

    // Send the response using Qwik City's send method
    requestEvent.send(finalResponse);
  }
};
