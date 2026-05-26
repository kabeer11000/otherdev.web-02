import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { knowledgeBase } from '../src/lib/knowledge-base'
import { generateEmbeddingBatch } from '../src/server/lib/rag/embeddings'
import {
  collectionExists,
  deletePointsByFilter,
  type MatchedDocument,
  resetCollection,
  upsertDocumentBatch,
} from '../src/server/lib/rag/vector-search'

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

async function main() {
  // Step A: Ensure collection exists with payload indexes (run once to set up)
  if (!(await collectionExists())) {
    console.log('  Collection does not exist — creating with payload indexes...')
    await resetCollection()
  }

  // Step B: Clear existing points (preserves collection + indexes)
  console.log('  Clearing existing documents...')
  await deletePointsByFilter()

  try {
    // Step C: Chunk all documents before embedding
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      lengthFunction: (text: string) => text.length,
    })

    const chunks: Array<{ content: string; metadata: MatchedDocument['metadata'] }> = []
    for (const doc of knowledgeBase) {
      const split = await textSplitter.splitText(doc.content)
      for (const chunkText of split) {
        chunks.push({ content: chunkText, metadata: doc.metadata })
      }
    }
    console.log(`  Split into ${chunks.length} chunks (was ${knowledgeBase.length} entries)\n`)

    // Step D: Embed all chunks (flat batch — each chunk gets its own vector)
    const texts = chunks.map(c => c.content)
    const allEmbeddings = await generateEmbeddingBatch(texts, 'document')

    // Step E: Build + upsert
    const docsWithEmbeddings: Array<{
      content: string
      metadata: MatchedDocument['metadata']
      embedding: number[]
    }> = chunks.map((c, i) => ({
      content: c.content,
      metadata: c.metadata,
      embedding: allEmbeddings[i],
    }))

    // Validate all embeddings before any upsert
    for (let i = 0; i < allEmbeddings.length; i++) {
      const embedding = allEmbeddings[i]
      if (!embedding || embedding.length !== 1536) {
        throw new Error(
          `Invalid embedding dim at index ${i}: ${embedding?.length ?? 0} (expected 1536)`
        )
      }
    }

    // Upsert in parallel batches
    await upsertDocumentBatch(docsWithEmbeddings)

    console.log(`\n  Done: ${docsWithEmbeddings.length} chunks ingested`)
  } catch (error) {
    console.error(`\n  Fatal error: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error during ingestion:', error)
  process.exit(1)
})
