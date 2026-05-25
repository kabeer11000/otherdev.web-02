import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'
import { slugField } from 'payload'
import sharp from 'sharp'

const OG_WIDTH = 1200
const OG_HEIGHT = 630
const OG_QUALITY = 80

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

async function generateOGForMedia(mediaUrl: string): Promise<string | null> {
  if (!process.env.R2_BUCKET || !process.env.R2_ENDPOINT) {
    return null
  }

  try {
    const response = await fetch(mediaUrl)
    if (!response.ok) return null

    const imageBuffer = await response.arrayBuffer()
    const ogBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'center' })
      .jpeg({ quality: OG_QUALITY })
      .toBuffer()

    const urlParts = mediaUrl.replace(process.env.R2_PUBLIC_URL || '', '').split('/')
    const filename = urlParts.pop() || ''
    const prefix = urlParts.join('/')
    const baseName = filename.replace(/\.[^.]+$/, '')
    const ogFilename = `${baseName}-og.jpg`
    const ogKey = prefix ? `${prefix}/${ogFilename}` : ogFilename

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: ogKey,
        Body: ogBuffer,
        ContentType: 'image/jpeg',
      })
    )

    return `${process.env.R2_PUBLIC_URL}/${ogKey}`
  } catch (error) {
    console.error('Failed to generate OG:', error)
    return null
  }
}

const syncContentHtml: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.content) {
    data.contentHtml = await convertLexicalToHTML({
      data: data.content as SerializedEditorState,
    })
  }
  return data
}

const autoPopulateExcerpt: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data.excerpt && data.contentHtml) {
    const plainText = data.contentHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    const words = plainText.split(' ').slice(0, 10)
    data.excerpt = words.join(' ') + (plainText.split(' ').length > 10 ? '...' : '')
  }
  return data
}

const generateProjectOG: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const imageUrl = data?.image?.url || data?.image

  if (!imageUrl) return data

  // Only regenerate OG if the cover image changed
  if (imageUrl !== originalDoc?.image?.url) {
    const ogUrl = await generateOGForMedia(imageUrl)
    if (ogUrl) {
      console.log(`Generated OG for project cover: ${ogUrl}`)

      // Update the Media document's og size
      const mediaId = data?.image?.id || originalDoc?.image?.id
      if (mediaId) {
        try {
          await req.payload.update({
            collection: 'media',
            id: mediaId,
            data: {
              sizes: {
                og: {
                  url: ogUrl,
                  width: OG_WIDTH,
                  height: OG_HEIGHT,
                },
              },
            },
          })
          console.log(`Updated Media ${mediaId} with OG URL`)
        } catch (err) {
          console.error('Failed to update Media OG:', err)
        }
      }
    }
  }

  return data
}

const revalidateProject: CollectionAfterChangeHook = ({ doc, context }) => {
  if (context.skipHooks) return doc
  revalidatePath('/work')
  revalidatePath(`/work/${doc.slug}`)
  revalidatePath('/')
  revalidatePath('/sitemap')
  return doc
}

const revalidateProjectDelete: CollectionAfterDeleteHook = ({ doc, context }) => {
  if (context.skipHooks) return doc
  revalidatePath('/work')
  revalidatePath(`/work/${doc.slug}`)
  revalidatePath('/')
  revalidatePath('/sitemap')
  return doc
}

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['image', 'title', 'year', 'url'],
    listSearchableFields: ['title', 'slug'],
    preview: doc => (doc.slug ? `/projects/${doc.slug}` : null),
  },
  access: {
    read: () => true,
    create: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    update: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [syncContentHtml, autoPopulateExcerpt, generateProjectOG],
    afterChange: [revalidateProject],
    afterDelete: [revalidateProjectDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      name: 'slug',
      useAsSlug: 'title',
    }),
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short teaser text shown on project cards (~10 words).',
      },
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description: 'Full project description with rich formatting.',
      },
    },
    {
      name: 'contentHtml',
      type: 'textarea',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        placeholder: 'https://...',
        description: 'Live URL of the project (e.g. https://example.com)',
        position: 'sidebar',
      },
    },
    {
      name: 'downloadUrl',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'media',
      type: 'array',
      admin: {
        position: 'sidebar',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
  ],
}
