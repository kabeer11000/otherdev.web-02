/**
 * One-shot migration: transfer description textarea → content Lexical field
 * for all existing projects. After running, description field can be removed.
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface Project {
  id: string
  description: string | null
  content: unknown | null
}

function textToLexical(text: string): unknown {
  // Convert plain text to a Lexical SerializedEditorState
  // Each line becomes a paragraph node
  const lines = text.split('\n').filter(line => line.trim())
  return {
    root: {
      children: lines.map(lineText => ({
        children: [
          {
            text: lineText,
            type: 'text',
            version: 1,
          },
        ],
        type: 'paragraph',
        version: 1,
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      })),
      type: 'root',
      version: 1,
      direction: null,
    },
  }
}

async function migrate() {
  const payload = await getPayload({ config: configPromise })

  // Find all projects with description but no content
  const { docs: projects } = await payload.find({
    collection: 'projects',
    where: {
      'description': { exists: true },
      'content': { exists: false },
    },
    limit: 1000,
    select: {
      id: true,
      description: true,
    },
  })

  console.log(`Found ${projects.length} projects to migrate`)

  for (const project of projects as Project[]) {
    if (!project.description) continue

    const lexicalState = textToLexical(project.description)

    // Use update with bypass hooks to avoid revalidation loop
    await payload.update({
      collection: 'projects',
      id: project.id,
      data: {
        content: lexicalState,
        description: '', // clear the old field
      },
      context: { skipHooks: true },
    })

    console.log(`  Migrated: ${project.id}`)
  }

  console.log('Done. All projects migrated.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})