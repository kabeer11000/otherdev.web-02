import type { CollectionConfig } from 'payload'
import type { CollectionBeforeChangeHook, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'
import { slugField } from 'payload'

const autoFillDescription: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.description) return data
  // Future: derive from other project fields when available
  return data
}

const revalidateProject: CollectionAfterChangeHook = ({ doc }) => {
  revalidatePath('/work')
  revalidatePath(`/work/${doc.slug}`)
  revalidatePath('/')
  revalidatePath('/sitemap')
  return doc
}

const revalidateProjectDelete: CollectionAfterDeleteHook = ({ doc }) => {
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
    beforeChange: [autoFillDescription],
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
      name: 'description',
      type: 'textarea',
      admin: {
        placeholder: 'One or two sentences about the project.',
        position: 'sidebar',
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
