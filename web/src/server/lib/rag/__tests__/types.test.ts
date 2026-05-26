import { describe, expect, test } from 'bun:test'
import type { MatchedDocument, SearchFilter } from '../types'

describe('RAG Types', () => {
  describe('MatchedDocument', () => {
    test('has correct shape for valid document', () => {
      const doc: MatchedDocument = {
        id: 'abc123',
        content: 'This is a test document about web development.',
        metadata: {
          source: 'https://example.com/article',
          title: 'Test Article',
          type: 'blog',
          category: 'development',
          subtype: 'tutorial',
          project: 'otherdev',
          year: '2024',
        },
        similarity: 0.95,
      }

      expect(doc.id).toBe('abc123')
      expect(typeof doc.content).toBe('string')
      expect(doc.metadata.source).toBe('https://example.com/article')
      expect(doc.metadata.title).toBe('Test Article')
      expect(doc.metadata.type).toBe('blog')
      expect(doc.similarity).toBeLessThanOrEqual(1)
      expect(doc.similarity).toBeGreaterThan(0)
    })

    test('requires all metadata fields', () => {
      const doc: MatchedDocument = {
        id: '123',
        content: 'minimal doc',
        metadata: {
          source: 'file://test.md',
          title: 'Test',
          type: 'doc',
        },
        similarity: 0.5,
      }

      expect(doc.metadata.category).toBeUndefined()
      expect(doc.metadata.project).toBeUndefined()
      expect(doc.metadata.year).toBeUndefined()
    })

    test('similarity score bounds', () => {
      const docs: MatchedDocument[] = [
        { id: '1', content: 'a', metadata: { source: 's', title: 't', type: 'x' }, similarity: 0 },
        { id: '2', content: 'b', metadata: { source: 's', title: 't', type: 'x' }, similarity: 1 },
        {
          id: '3',
          content: 'c',
          metadata: { source: 's', title: 't', type: 'x' },
          similarity: 0.5,
        },
      ]

      docs.forEach(doc => {
        expect(doc.similarity).toBeGreaterThanOrEqual(0)
        expect(doc.similarity).toBeLessThanOrEqual(1)
      })
    })

    test('id is a string', () => {
      const doc: MatchedDocument = {
        id: 'sha256-hash-id',
        content: 'content',
        metadata: { source: 's', title: 't', type: 'x' },
        similarity: 0.8,
      }

      expect(typeof doc.id).toBe('string')
      expect(doc.id.length).toBeGreaterThan(0)
    })
  })

  describe('SearchFilter', () => {
    test('empty filter is valid', () => {
      const filter: SearchFilter = {}

      expect(filter.type).toBeUndefined()
      expect(filter.category).toBeUndefined()
      expect(filter.subtype).toBeUndefined()
      expect(filter.project).toBeUndefined()
      expect(filter.year).toBeUndefined()
    })

    test('partial filter with single field', () => {
      const filter: SearchFilter = { type: 'blog' }

      expect(filter.type).toBe('blog')
      expect(filter.category).toBeUndefined()
    })

    test('full filter with all fields', () => {
      const filter: SearchFilter = {
        type: 'blog',
        category: 'development',
        subtype: 'tutorial',
        project: 'otherdev',
        year: '2024',
      }

      expect(filter.type).toBe('blog')
      expect(filter.category).toBe('development')
      expect(filter.subtype).toBe('tutorial')
      expect(filter.project).toBe('otherdev')
      expect(filter.year).toBe('2024')
    })

    test('filter values are all strings', () => {
      const filter: SearchFilter = {
        type: 'article',
        category: 'tech',
        subtype: 'guide',
        project: 'myproject',
        year: '2025',
      }

      Object.values(filter).forEach(value => {
        if (value !== undefined) {
          expect(typeof value).toBe('string')
        }
      })
    })
  })
})
