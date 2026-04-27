import { createHash } from 'node:crypto'
import { knowledgeBase } from '../src/lib/knowledge-base'
import { generateEmbeddingBatch } from '../src/server/lib/rag/embeddings'
import { deleteAllDocuments, insertDocument } from '../src/server/lib/rag/vector-search'

// voyage-4-lite rate limits: 10K TPM, 3 RPM
// Batch size of 10 docs (~200-400 tokens each ≈ 2-4K tokens/call) stays well under 10K TPM
// 8 batches total → 8 API calls → at 3 RPM, ~160s (2min 40sec) total with spacing
const BATCH_SIZE = 10
// 3 RPM = 1 request per 20 seconds minimum
const BATCH_DELAY_MS = 21_000

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

  let successCount = 0
  let errorCount = 0
  const totalDocs = knowledgeBase.length
  const totalBatches = Math.ceil(totalDocs / BATCH_SIZE)

  console.log(
    `  Ingesting ${totalDocs} documents in ${totalBatches} batches (${BATCH_SIZE} docs/batch, ${BATCH_DELAY_MS / 1000}s between batches)\n`
  )

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE
    const end = Math.min(start + BATCH_SIZE, totalDocs)
    const batch = knowledgeBase.slice(start, end)
    const batchNum = batchIdx + 1

    process.stdout.write(`  Batch ${batchNum}/${totalBatches}: [${start + 1}–${end}] `)

    try {
      const texts = batch.map(doc => doc.content)
      const embeddings = await generateEmbeddingBatch(texts, 'document')

      for (let i = 0; i < batch.length; i++) {
        const embedding = embeddings[i]
        const doc = batch[i]

        if (!embedding || embedding.length !== 1024) {
          throw new Error(`Invalid embedding dim: ${embedding?.length ?? 0} (expected 1024)`)
        }
        await insertDocument(doc.content, doc.metadata, embedding)
        successCount++
      }

      console.log(`OK (${batch.length} docs)`)
    } catch (error) {
      console.error(`FAILED: ${error instanceof Error ? error.message : error}`)
      for (const doc of batch) {
        console.error(`  - ${doc.metadata.title}`)
      }
      errorCount += batch.length
    }

    // Rate limit delay between batches (not after last batch)
    if (batchIdx < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
    }
  }

  console.log(`\n  Done: ${successCount} succeeded, ${errorCount} failed`)

  if (errorCount > 0) {
    process.exit(1)
  }

  const _kbVersion = computeKbVersion()
}

main().catch(error => {
  console.error('Fatal error during ingestion:', error)
  process.exit(1)
})
