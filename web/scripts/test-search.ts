import { generateEmbedding } from '@/server/lib/rag/embeddings'
import { searchSimilarDocuments } from '@/server/lib/rag/vector-search'

async function testSearch() {
  const testQueries = [
    'Who founded Other Dev?',
    'Tell me about Ossaid',
    'Who are the founders?',
    'Ossaid Qadri',
    'founders of Other Dev',
  ]

  for (const query of testQueries) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query)

      // Search for similar documents
      const matchThreshold = Number.parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || '0.1')
      const matchCount = Number.parseInt(process.env.RAG_MATCH_COUNT || '5', 10)

      const similarDocs = await searchSimilarDocuments(queryEmbedding, matchThreshold, matchCount)

      if (similarDocs.length === 0) {
        // Try with lower threshold
        const lowerSimilarDocs = await searchSimilarDocuments(queryEmbedding, 0.01, matchCount)

        for (const _doc of lowerSimilarDocs.slice(0, 3)) {
        }
      } else {
        for (const _doc of similarDocs) {
        }
      }
    } catch (error) {
      console.error(`Error testing query "${query}":`, error)
    }
  }
}

testSearch()
