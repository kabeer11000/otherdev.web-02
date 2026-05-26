import { tavily } from '@tavily/core'
import { tool } from 'ai'
import { z } from 'zod'
import type { MatchedDocument } from '@/server/lib/rag/types'

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

/**
 * Escapes special XML characters to prevent XML injection.
 * Follows Anthropic Ch4 principle: wrapping variable content in XML tags
 * prevents confusion between user content and prompt instructions.
 */
const escapeXml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

/**
 * RAG retrieval tool — searches Other Dev's knowledge base via Qdrant + Cohere.
 * Called by the model when the user asks about projects, services, technologies,
 * or anything related to Other Dev's work.
 *
 * Follows AI SDK tool pattern: description guides model behavior, execute runs server-side.
 */
export const retrieveKnowledgeTool = tool({
  description: `Search Other Dev's knowledge base to answer questions about their projects,
services, technologies, team, case studies, or capabilities.
Use this when the user asks about: Other Dev's portfolio, past projects, client work,
services offered, tech stack, team members, company background, or anything specific
to Other Dev's business.
Returns the most relevant knowledge base entries with relevance scores.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The search query to find relevant knowledge base entries. Be specific — include project names, technologies, or service names when available.'
      ),
  }),
  execute: async ({ query }: { query: string }): Promise<string> => {
    try {
      const { generateEmbedding } = await import('@/server/lib/rag/embeddings')
      const { searchSimilarDocuments } = await import('@/server/lib/rag/vector-search')

      const embedding = await generateEmbedding(query)
      const results = await searchSimilarDocuments(query, embedding, 0.1, 5)

      if (results.length === 0) {
        return 'No relevant knowledge base entries found for this query.'
      }

      return (
        '<documents>\n' +
        results
          .map(
            (doc: MatchedDocument, idx: number) =>
              `<document index="${idx + 1}" relevance="${(doc.similarity * 100).toFixed(1)}%" title="${escapeXml(doc.metadata.title)}">\n${escapeXml(doc.content)}\n</document>`
          )
          .join('\n') +
        '\n</documents>'
      )
    } catch (error) {
      console.error(
        '[retrieveKnowledge] execute error:',
        error instanceof Error ? error.message : String(error)
      )
      return 'No relevant knowledge base entries found for this query.'
    }
  },
})

/**
 * Web search tool using Tavily — grounded general chat.
 * Works with any provider (Groq, MiniMax, etc.) routed through AI Gateway.
 */
export const tavilySearchTool = tool({
  description:
    'Search the web for current information, news, and facts. Use this when you need real-time or up-to-date information. Returns all results immediately in a single response. Do NOT call more than twice per conversation. Do NOT pass id, cursor, or pagination parameters — only the query field is accepted.',
  inputSchema: z.object({
    query: z
      .string()
      .describe('The plain text search query. No id, cursor, or pagination fields — query only.'),
  }),
  execute: async ({ query }: { query: string }) => {
    type SearchResult = { id: number; title: string; url: string; snippet: string; score: number }
    type WebSearchResult = {
      query: string
      results: SearchResult[]
      answer: string | null
      error?: string
    }

    try {
      console.log(`[WebSearch] Searching for: ${query}`)
      const response = await tavilyClient.search(query, {
        searchDepth: 'basic',
        maxResults: 3,
        includeAnswer: false,
        includeRawContent: false,
      })

      const results: SearchResult[] = response.results.map((result, i) => ({
        id: i + 1,
        title: result.title,
        url: result.url,
        snippet: result.content.slice(0, 300),
        score: result.score,
      }))

      console.log(`[WebSearch] Found ${results.length} results for: ${query}`)
      const answer = response.answer ?? null
      return (
        '<search_results>\n' +
        `<query>${escapeXml(query)}</query>\n` +
        response.results
          .map(
            r =>
              `<result title="${escapeXml(r.title)}" url="${escapeXml(r.url)}">${escapeXml(r.content.slice(0, 300))}</result>`
          )
          .join('\n') +
        (answer ? `\n<answer>${escapeXml(answer)}</answer>` : '') +
        '\n</search_results>'
      )
    } catch (error) {
      console.error('[WebSearch] Tavily error:', error instanceof Error ? error.message : error)
      return `<search_results>\n<query>${escapeXml(query)}</query>\n<error>Web search failed</error>\n</search_results>`
    }
  },
})

/**
 * Artifact creation tool — generates complete, self-contained web content
 * that renders in a live preview panel.
 * Server-side execute function returns the artifact data directly.
 */
export const createArtifactTool = tool({
  description:
    'Create an interactive web artifact that will be displayed in a live preview panel. Supports vanilla HTML/CSS/JS or modern frameworks (React, Vue, Tailwind CSS) via CDN. Use this when the user asks to create, build, make, or generate interactive content like websites, apps, games, visualizations, calculators, forms, dashboards, or any web-based UI. The artifact should be complete, self-contained, and visually polished.',
  inputSchema: z.object({
    title: z.string().max(100).describe('A short, descriptive title for the artifact'),
    code: z
      .string()
      .max(51200)
      .describe(
        'Complete HTML code. Can use modern frameworks via CDN: React, Tailwind CSS, Vue, etc. Include CSS in <style> tags and JavaScript in <script> tags. Must be self-contained and work in a sandboxed iframe.'
      ),
    description: z
      .string()
      .max(500)
      .describe('A brief explanation of what this artifact does and how to use it'),
  }),
})
