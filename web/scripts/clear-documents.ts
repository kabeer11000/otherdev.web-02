import { deleteAllDocuments } from '../src/server/lib/rag/vector-search'

async function main() {
  try {
    await deleteAllDocuments()
  } catch (error) {
    console.error('Failed to clear documents:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
