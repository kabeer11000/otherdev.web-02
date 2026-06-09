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
    beforeChange: [syncContentHtml, autoPopulateExcerpt],
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
