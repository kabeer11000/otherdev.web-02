import { z } from 'zod';
import Groq from 'groq-sdk';
import { generateEmbedding } from '@/server/lib/rag/embeddings';
import { searchSimilarDocuments } from '@/server/lib/rag/vector-search';
import { checkRateLimit, getClientIdentifier } from '@/server/lib/rate-limit';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT_TEMPLATE = `You are a helpful assistant for OtherDev, a web development and design studio based in Karachi, Pakistan.

Your role:
- Answer questions about OtherDev's projects, services, technologies, and team
- Be professional, friendly, and concise
- If information isn't in the context, say so and suggest contacting the team
- Keep responses to 2-3 paragraphs maximum
- Use Markdown formatting (bold, lists, headings) when appropriate

=== KNOWLEDGE BASE CONTEXT ===

{context}

=== END CONTEXT ===

Answer based STRICTLY on the information above.

Contact information:
- Website: otherdev.com
- Based in Karachi City, Pakistan
- Specializing in fashion, design, e-commerce, real estate, and enterprise development`;

function sanitizeInput(text: string): string {
  const dangerousPatterns = [
    /\[INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[\/INST\]/gi,
    /<\|system\|>/gi,
    /<\|user\|>/gi,
    /<\|assistant\|>/gi,
  ];

  let sanitized = text;
  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  const maxLength = Number.parseInt(
    process.env.RAG_MAX_MESSAGE_LENGTH || '500'
  );
  return sanitized.slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const validation = RequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: validation.error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { messages } = validation.data;
    const lastUserMessage = messages
      .filter((m) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const sanitizedQuery = sanitizeInput(lastUserMessage.content);
    const queryEmbedding = await generateEmbedding(sanitizedQuery);

    const matchThreshold = Number.parseFloat(
      process.env.RAG_SIMILARITY_THRESHOLD || '0.1'
    );
    const matchCount = Number.parseInt(
      process.env.RAG_MATCH_COUNT || '5'
    );

    const similarDocs = await searchSimilarDocuments(
      queryEmbedding,
      matchThreshold,
      matchCount
    );

    const context = similarDocs.length > 0
      ? similarDocs
          .map(
            (doc, idx) =>
              `Document ${idx + 1} (Relevance: ${(doc.similarity * 100).toFixed(1)}%):\nTitle: ${doc.metadata.title}\n${doc.content}\n`
          )
          .join('\n---\n\n')
      : 'No specific information found in the knowledge base.';

    const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{context}', context);

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: sanitizeInput(m.content),
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = JSON.stringify({ content });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
