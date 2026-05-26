import {
  collectionExists,
  deletePointsByFilter,
  resetCollection,
} from '../src/server/lib/rag/vector-search'

async function main() {
  const shouldReset = process.argv.includes('--reset')
  const shouldClear = process.argv.includes('--clear')

  try {
    if (shouldReset) {
      // Full reset: destroy and recreate collection with payload indexes (HNSW rebuilt with indexes present)
      console.log('  Resetting collection (destroys + recreates with payload indexes)...')
      await resetCollection()
    } else if (!(await collectionExists())) {
      // Collection doesn't exist at all — create it fresh with payload indexes
      console.log('  Collection does not exist — creating with payload indexes...')
      await resetCollection()
    } else if (shouldClear) {
      // Clear all points but preserve collection + indexes
      console.log('  Clearing all documents (preserving collection + indexes)...')
      await deletePointsByFilter()
    } else {
      // Default: clear points only (preserves collection + indexes)
      console.log('  Clearing all documents (preserving collection + indexes)...')
      await deletePointsByFilter()
    }
    console.log('  Done.')
  } catch (error) {
    console.error('Failed to clear documents:', error)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
