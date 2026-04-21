import { createHash } from 'node:crypto'
import { knowledgeBase } from '../src/lib/knowledge-base'
import { generateEmbedding } from '../src/server/lib/rag/embeddings'
import { deleteAllDocuments, insertDocument } from '../src/server/lib/rag/vector-search'

function computeKbVersion(): string {
  const payload = JSON.stringify(
    knowledgeBase.map(doc => ({
      content: doc.content,
      metadata: doc.metadata,
    }))
  )
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 12)
  return `kb-${hash}`
}

async function main() {
  try {
    await deleteAllDocuments()
  } catch (error) {
    console.error('  Failed to clear old documents:', error)
    console.error('  Aborting ingestion to prevent pollution\n')
    process.exit(1)
  }

  let _successCount = 0
  let errorCount = 0

  for (let i = 0; i < knowledgeBase.length; i++) {
    const doc = knowledgeBase[i]
    const _progress = `[${i + 1}/${knowledgeBase.length}]`

    try {
      const embedding = await generateEmbedding(doc.content, 'document')

      if (!embedding || embedding.length !== 1024) {
        throw new Error(`Invalid embedding dimension: ${embedding?.length || 0} (expected 1024)`)
      }
      const _docId = await insertDocument(doc.content, doc.metadata, embedding)
      _successCount++

      if (i < knowledgeBase.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error(`  Error processing document: ${error}`)
      console.error(`  Document: ${doc.metadata.title}\n`)
      errorCount++
    }
  }

  if (errorCount > 0) {
    process.exit(1)
  }

  const _kbVersion = computeKbVersion()
}

main().catch(error => {
  console.error('Fatal error during ingestion:', error)
  process.exit(1)
})
