import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function migrate() {
  const payload = await getPayload({ config: configPromise })

  const { docs: projects, totalDocs } = await payload.find({
    collection: 'projects',
    limit: 1000,
  })

  console.log(`Found ${totalDocs} projects`)

  let updated = 0

  for (const project of projects) {
    if (!project.contentHtml) {
      console.log(`Skipped (no contentHtml): ${project.title}`)
      continue
    }

    const plainText = project.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = plainText.split(' ').slice(0, 15)
    const excerpt = words.join(' ') + (plainText.split(' ').length > 15 ? '...' : '')

    await payload.update({
      collection: 'projects',
      id: project.id,
      data: { excerpt },
      context: { skipHooks: true },
    })

    updated++
    console.log(`Updated: ${project.title} -> "${excerpt}"`)
  }

  console.log(`\nDone. Updated ${updated} projects.`)
}

migrate().catch(console.error)
