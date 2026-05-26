import { describe, expect, test } from 'bun:test'
import { cleanSuggestionMarkers, cn, shuffle, stripMarkdown } from '../utils'

describe('cn', () => {
  test('merges two class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  test('merges multiple class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  test('handles empty string', () => {
    expect(cn('', 'foo')).toBe('foo')
  })

  test('handles clsx-style inputs (objects, arrays)', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  test('twMerge handles conflicting tailwind classes', () => {
    // twMerge will prefer the last class when there are conflicts
    expect(cn('p-4 p-6')).toBe('p-6')
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500')
  })
})

describe('stripMarkdown', () => {
  test('removes bold text', () => {
    expect(stripMarkdown('Hello **world**')).toBe('Hello world')
    expect(stripMarkdown('**bold** and **more**')).toBe('bold and more')
  })

  test('removes italic text', () => {
    expect(stripMarkdown('Hello *world*')).toBe('Hello world')
    expect(stripMarkdown('_italic_ and *also italic*')).toBe('italic and also italic')
  })

  test('removes bold italic combined', () => {
    expect(stripMarkdown('***bold italic***')).toBe('bold italic')
  })

  test('removes underline', () => {
    expect(stripMarkdown('Hello _world_')).toBe('Hello world')
  })

  test('removes inline code', () => {
    expect(stripMarkdown('Use `code` here')).toBe('Use code here')
  })

  test('removes strikethrough', () => {
    expect(stripMarkdown('~~deleted~~')).toBe('deleted')
  })

  test('removes links but keeps text', () => {
    expect(stripMarkdown('[Click here](https://example.com)')).toBe('Click here')
  })

  test('removes headings', () => {
    expect(stripMarkdown('# Heading 1')).toBe('Heading 1')
    expect(stripMarkdown('## Heading 2')).toBe('Heading 2')
    expect(stripMarkdown('### Heading 3')).toBe('Heading 3')
  })

  test('removes list markers', () => {
    expect(stripMarkdown('- item 1')).toBe('item 1')
    expect(stripMarkdown('* item 2')).toBe('item 2')
  })

  test('removes numbered list markers', () => {
    expect(stripMarkdown('1. first')).toBe('first')
    expect(stripMarkdown('10. tenth')).toBe('tenth')
  })

  test('trims result', () => {
    expect(stripMarkdown('  Hello world  ')).toBe('Hello world')
  })

  test('handles empty string', () => {
    expect(stripMarkdown('')).toBe('')
  })

  test('handles text with no markdown', () => {
    expect(stripMarkdown('plain text here')).toBe('plain text here')
  })
})

describe('cleanSuggestionMarkers', () => {
  test('removes SUGGESTION: marker at end of content', () => {
    expect(cleanSuggestionMarkers('Some text SUGGESTION: fix this')).toBe('Some text')
  })

  test('removes SUGGESTION: with whitespace', () => {
    expect(cleanSuggestionMarkers('Some text  SUGGESTION:   fix this')).toBe('Some text')
  })

  test('handles multiline SUGGESTION content', () => {
    const input = 'Some text\nSUGGESTION: fix this\nand this too'
    expect(cleanSuggestionMarkers(input)).toBe('Some text')
  })

  test('is case insensitive', () => {
    expect(cleanSuggestionMarkers('Some text suggestion: fix this')).toBe('Some text')
    expect(cleanSuggestionMarkers('Some text Suggestion: fix this')).toBe('Some text')
  })

  test('trims result', () => {
    expect(cleanSuggestionMarkers('Some text  SUGGESTION:  ')).toBe('Some text')
  })

  test('returns original string if no marker', () => {
    expect(cleanSuggestionMarkers('Some text without marker')).toBe('Some text without marker')
  })

  test('handles empty string', () => {
    expect(cleanSuggestionMarkers('')).toBe('')
  })

  test('marker only', () => {
    expect(cleanSuggestionMarkers('SUGGESTION: fix this')).toBe('')
  })
})

describe('shuffle', () => {
  test('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(shuffle(arr).length).toBe(arr.length)
  })

  test('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffled = shuffle(arr)
    expect(shuffle(arr).sort()).toEqual(arr.sort())
  })

  test('does not mutate original array', () => {
    const arr = [1, 2, 3, 4, 5]
    const original = [...arr]
    shuffle(arr)
    expect(arr).toEqual(original)
  })

  test('handles empty array', () => {
    expect(shuffle([])).toEqual([])
  })

  test('handles single element array', () => {
    expect(shuffle([1])).toEqual([1])
  })

  test('handles strings', () => {
    const arr = ['a', 'b', 'c', 'd']
    const shuffled = shuffle(arr)
    expect(shuffled.sort()).toEqual(arr.sort())
    expect(shuffled.length).toBe(arr.length)
  })

  test('handles objects', () => {
    const arr = [{ a: 1 }, { b: 2 }, { c: 3 }]
    const shuffled = shuffle(arr)
    // Verify all original elements exist in shuffled result
    expect(shuffled.length).toBe(arr.length)
    shuffled.forEach((item, i) => {
      const matchIndex = arr.findIndex(
        orig => orig.a === item.a && orig.b === item.b && orig.c === item.c
      )
      expect(matchIndex).toBeGreaterThanOrEqual(0)
    })
  })

  test('produces different order over multiple calls (probabilistic)', () => {
    // Run multiple times - at least one should differ from input
    // (statistically almost certain with 10 iterations on 5-element array)
    const arr = [1, 2, 3, 4, 5]
    const results = new Set<string>()
    for (let i = 0; i < 10; i++) {
      results.add(shuffle(arr).join(','))
    }
    // With Fisher-Yates, we expect some variation
    expect(results.size).toBeGreaterThan(1)
  })
})
