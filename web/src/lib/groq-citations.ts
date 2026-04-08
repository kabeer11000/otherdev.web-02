/**
 * Citation types for Groq compound model responses
 * Works with both Groq native API and AI SDK responses
 */
export interface Citation {
  id: number
  title: string
  url: string
  domain: string
  snippet: string
  publishedDate?: string
}

/**
 * Groq native API executed_tools format
 */
export interface GroqExecutedTool {
  type: string
  name?: string
  output: string | Record<string, unknown>
  search_results?: {
    results: Array<{
      title?: string
      url: string
      snippet?: string
      content?: string
      published_date?: string
    }>
  }
  arguments?: string
}

/**
 * AI SDK tool call format
 */
export interface AISDKToolCall {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

/**
 * AI SDK tool result format
 */
export interface AISDKToolResult {
  toolCallId: string
  toolName: string
  result: unknown
}

/**
 * Extract citations from Groq native API response
 * For use with direct Groq API calls
 */
export function extractCitationsFromGroqAPI(executedTools: GroqExecutedTool[] = []): Citation[] {
  const rawResults = executedTools
    .filter(tool => tool.type === 'browser_automation' || tool.name === 'web_search')
    .flatMap(tool => {
      // Try to parse search_results from output
      try {
        const output = typeof tool.output === 'string' ? JSON.parse(tool.output) : tool.output

        return output?.results || output?.search_results?.results || []
      } catch {
        return tool.search_results?.results || []
      }
    })

  return rawResults.map((res, index) => ({
    id: index + 1,
    title: res.title || 'Untitled',
    url: res.url,
    domain: new URL(res.url).hostname.replace('www.', ''),
    snippet: res.snippet || res.content || '',
    publishedDate: res.published_date,
  }))
}

/**
 * Extract citations from AI SDK response with browserSearch tool
 * For use with @ai-sdk/groq provider
 */
export function extractCitationsFromAISDK(args: {
  toolCalls?: AISDKToolCall[]
  toolResults?: AISDKToolResult[]
}): Citation[] {
  const { toolResults = [] } = args

  // Extract results from browserSearch tool
  const browserSearchResults = toolResults
    .filter(result => result.toolName === 'browserSearch')
    .flatMap(result => {
      const rawResult = result.result as Record<string, unknown>

      // Handle different response formats
      if (rawResult?.results && Array.isArray(rawResult.results)) {
        return rawResult.results as Array<{
          title?: string
          url: string
          snippet?: string
          content?: string
          published_date?: string
        }>
      }

      const searchResults = rawResult?.search_results as Record<string, unknown> | undefined
      if (searchResults?.results && Array.isArray(searchResults.results)) {
        return searchResults.results as Array<{
          title?: string
          url: string
          snippet?: string
          content?: string
          published_date?: string
        }>
      }

      return []
    })

  return browserSearchResults.map((res, index) => ({
    id: index + 1,
    title: res.title || 'Untitled',
    url: res.url,
    domain: new URL(res.url).hostname.replace('www.', ''),
    snippet: res.snippet || res.content || '',
    publishedDate: res.published_date,
  }))
}

/**
 * Remove citation markers from text (e.g., [1], 【1†source】)
 */
export function cleanCitationMarkers(text: string): string {
  return (
    text
      // Remove [1], [2], etc.
      .replace(/\[\d+\]/g, '')
      // Remove【1†source】, 【1†match at L2】, etc.
      .replace(/【\d+†[^】]*】/g, '')
      // Remove (Source), (source), etc.
      .replace(/\(source\)/gi, '')
      // Clean up extra spaces left behind
      .replace(/\s+/g, ' ')
      .trim()
  )
}
