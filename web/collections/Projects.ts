import type { CollectionConfig } from 'payload'
import type { CollectionBeforeChangeHook, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { revalidatePath } from 'next/cache'
import { slugField } from 'payload'

const syncContentHtml: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.content) {
    data.contentHtml = await convertLexicalToHTML({
      data: data.content as SerializedEditorState,
    })
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
    preview: (doc) => doc.slug ? `/projects/${doc.slug}` : null,
  },
  access: {
    read: () => true,
    create: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    update: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  hooks: {
    beforeChange: [syncContentHtml],
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
