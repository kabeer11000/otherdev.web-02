import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
  Endpoint,
} from 'payload'
import { slugField } from 'payload'

const syncContentHtml: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.content) {
    try {
      data.contentHtml = await convertLexicalToHTML({
        data: data.content as SerializedEditorState,
      })
    } catch (error) {
      console.error('[projects] syncContentHtml: convertLexicalToHTML failed:', error)
    }
  }
  return data
}

const autoPopulateExcerpt: CollectionBeforeChangeHook = async ({ data }) => {
  if (!data.excerpt && data.contentHtml) {
    // Decode HTML entities first, then strip tags
    const textarea = document.createElement('textarea')
    textarea.innerHTML = data.contentHtml
    const plainText = textarea.value.replace(/\s+/g, ' ').trim()
    const words = plainText.split(/\s+/).filter(Boolean).slice(0, 15)
    data.excerpt = words.join(' ') + (words.length === 15 ? '...' : '')
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

type ProjectMediaRow = {
  file?: string | { id?: string } | null
  type?: 'image' | 'video' | null
}

const getMediaID = (media: ProjectMediaRow['file']): string | null => {
  if (!media) return null
  if (typeof media === 'string') return media
  return media.id ?? null
}

const deleteGalleryImagesEndpoint: Endpoint = {
  path: '/:id/delete-gallery-images',
  method: 'post',
  handler: async req => {
    if (req.user?.role !== 'admin') {
      return Response.json({ error: 'Only admins can delete project media.' }, { status: 403 })
    }

    const projectID = req.routeParams?.id

    if (typeof projectID !== 'string') {
      return Response.json({ error: 'Project ID is required.' }, { status: 400 })
    }

    const project = await req.payload.findByID({
      collection: 'projects',
      id: projectID,
      depth: 0,
      overrideAccess: false,
      user: req.user,
    })

    const mediaRows = (Array.isArray(project.media) ? project.media : []) as ProjectMediaRow[]
    const heroImageID = getMediaID(project.image)
    const imageRows = mediaRows.filter(row => row.type !== 'video')
    const imageIDs = [
      ...new Set(
        imageRows
          .map(row => getMediaID(row.file))
          .filter((id): id is string => id !== null && id !== heroImageID)
      ),
    ]
    const remainingRows = mediaRows.filter(row => row.type === 'video')

    await req.payload.update({
      collection: 'projects',
      id: projectID,
      data: {
        media: remainingRows,
      },
      depth: 0,
      overrideAccess: false,
      user: req.user,
    })

    const failed: Array<{ id: string; message: string }> = []

    for (const id of imageIDs) {
      try {
        await req.payload.delete({
          collection: 'media',
          id,
          depth: 0,
          overrideAccess: false,
          user: req.user,
        })
      } catch (error) {
        failed.push({
          id,
          message: error instanceof Error ? error.message : 'Unknown delete error',
        })
      }
    }

    return Response.json(
      {
        deletedCount: imageIDs.length - failed.length,
        failed,
        remainingMedia: remainingRows,
      },
      { status: failed.length ? 207 : 200 }
    )
  },
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
    create: ({ req }) => ['admin', 'editor'].includes(req.user?.role ?? ''),
    update: ({ req }) => ['admin', 'editor'].includes(req.user?.role ?? ''),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [syncContentHtml, autoPopulateExcerpt],
    afterChange: [revalidateProject],
    afterDelete: [revalidateProjectDelete],
  },
  endpoints: [deleteGalleryImagesEndpoint],
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
        components: {
          beforeInput: ['./src/plugins/ProjectMediaBulkActions#ProjectMediaBulkActions'],
        },
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
          ],
          defaultValue: 'image',
          admin: {
            description: 'Choose media type',
          },
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
  ],
}
