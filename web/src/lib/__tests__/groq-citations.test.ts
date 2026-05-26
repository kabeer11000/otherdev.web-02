import { describe, expect, test } from 'bun:test'
import {
  cleanCitationMarkers,
  extractCitationsFromAISDK,
  extractCitationsFromGroqAPI,
} from '../groq-citations'

describe('extractCitationsFromAISDK', () => {
  test('returns empty array when no tool results', () => {
    expect(extractCitationsFromAISDK({ toolResults: [] })).toEqual([])
  })

  test('extracts citations from browserSearch tool results', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'browserSearch',
        result: {
          results: [
            {
              title: 'Test Page',
              url: 'https://example.com/page',
              snippet: 'This is a test snippet',
              published_date: '2024-01-15',
            },
          ],
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })

    expect(citations).toHaveLength(1)
    expect(citations[0]).toMatchObject({
      id: 1,
      title: 'Test Page',
      url: 'https://example.com/page',
      snippet: 'This is a test snippet',
      publishedDate: '2024-01-15',
    })
  })

  test('extracts citations with domain stripped of www', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'browserSearch',
        result: {
          results: [
            {
              title: 'Test',
              url: 'https://www.example.com/page',
              snippet: 'Test',
            },
          ],
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })
    expect(citations[0].domain).toBe('example.com')
  })

  test('uses content as fallback for snippet', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'browserSearch',
        result: {
          results: [
            {
              title: 'Test',
              url: 'https://example.com',
              content: 'Fallback content',
            },
          ],
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })
    expect(citations[0].snippet).toBe('Fallback content')
  })

  test('handles search_results wrapper format', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'browserSearch',
        result: {
          search_results: {
            results: [
              {
                title: 'Wrapped Result',
                url: 'https://example.com/wrapped',
                snippet: 'Wrapped snippet',
              },
            ],
          },
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })
    expect(citations).toHaveLength(1)
    expect(citations[0].title).toBe('Wrapped Result')
  })

  test('filters out non-browserSearch tools', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'someOtherTool',
        result: { data: 'ignored' },
      },
      {
        toolCallId: 'call_2',
        toolName: 'browserSearch',
        result: {
          results: [
            {
              title: 'Valid Result',
              url: 'https://example.com/valid',
              snippet: 'Valid snippet',
            },
          ],
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })
    expect(citations).toHaveLength(1)
    expect(citations[0].title).toBe('Valid Result')
  })

  test('handles missing title with fallback', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'browserSearch',
        result: {
          results: [
            {
              url: 'https://example.com/no-title',
              snippet: 'No title provided',
            },
          ],
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })
    expect(citations[0].title).toBe('Untitled')
  })

  test('assigns sequential ids to multiple citations', () => {
    const toolResults = [
      {
        toolCallId: 'call_1',
        toolName: 'browserSearch',
        result: {
          results: [
            { title: 'First', url: 'https://example.com/1', snippet: 'First' },
            { title: 'Second', url: 'https://example.com/2', snippet: 'Second' },
            { title: 'Third', url: 'https://example.com/3', snippet: 'Third' },
          ],
        },
      },
    ]

    const citations = extractCitationsFromAISDK({ toolResults })
    expect(citations[0].id).toBe(1)
    expect(citations[1].id).toBe(2)
    expect(citations[2].id).toBe(3)
  })
})

describe('extractCitationsFromGroqAPI', () => {
  test('returns empty array for empty input', () => {
    expect(extractCitationsFromGroqAPI([])).toEqual([])
  })

  test('extracts from browser_automation tools', () => {
    const tools = [
      {
        type: 'browser_automation',
        output: JSON.stringify({
          results: [
            { title: 'Auto Page', url: 'https://example.com/auto', snippet: 'Auto snippet' },
          ],
        }),
      },
    ]

    const citations = extractCitationsFromGroqAPI(tools)
    expect(citations).toHaveLength(1)
    expect(citations[0].title).toBe('Auto Page')
  })

  test('extracts from web_search tools', () => {
    const tools = [
      {
        name: 'web_search',
        type: 'web_search',
        output: JSON.stringify({
          results: [
            {
              title: 'Search Result',
              url: 'https://example.com/search',
              snippet: 'Search snippet',
            },
          ],
        }),
      },
    ]

    const citations = extractCitationsFromGroqAPI(tools)
    expect(citations).toHaveLength(1)
    expect(citations[0].title).toBe('Search Result')
  })

  test('uses search_results field directly', () => {
    const tools = [
      {
        type: 'browser_automation',
        output: 'not json',
        search_results: {
          results: [
            { title: 'Direct Results', url: 'https://example.com/direct', snippet: 'Direct' },
          ],
        },
      },
    ]

    const citations = extractCitationsFromGroqAPI(tools)
    expect(citations).toHaveLength(1)
    expect(citations[0].title).toBe('Direct Results')
  })

  test('handles nested search_results in output', () => {
    const tools = [
      {
        type: 'browser_automation',
        output: JSON.stringify({
          search_results: {
            results: [{ title: 'Nested', url: 'https://example.com/nested', snippet: 'Nested' }],
          },
        }),
      },
    ]

    const citations = extractCitationsFromGroqAPI(tools)
    expect(citations).toHaveLength(1)
  })
})

describe('cleanCitationMarkers', () => {
  test('removes numeric citation markers [1], [2], etc.', () => {
    expect(cleanCitationMarkers('Hello [1] world')).toBe('Hello world')
    expect(cleanCitationMarkers('Text [42] here')).toBe('Text here')
  })

  test('removes citation markers with source annotation', () => {
    expect(cleanCitationMarkers('Hello 【1†source】 world')).toBe('Hello world')
    expect(cleanCitationMarkers('Text 【10†match at L2】 here')).toBe('Text here')
  })

  test('removes (source) case-insensitively', () => {
    expect(cleanCitationMarkers('Hello (source) world')).toBe('Hello world')
    expect(cleanCitationMarkers('Text (Source) here')).toBe('Text here')
  })

  test('collapses whitespace after removal', () => {
    expect(cleanCitationMarkers('Hello  [1]   world')).toBe('Hello world')
  })

  test('trims result', () => {
    expect(cleanCitationMarkers('  Hello [1] world  ')).toBe('Hello world')
  })

  test('handles multiple markers', () => {
    expect(cleanCitationMarkers('Hello[1]world[2]again')).toBe('Helloworldagain')
  })

  test('handles empty string', () => {
    expect(cleanCitationMarkers('')).toBe('')
  })

  test('returns original if no markers', () => {
    expect(cleanCitationMarkers('plain text')).toBe('plain text')
  })
})
