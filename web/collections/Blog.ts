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

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;')

const htmlConverters = ({ defaultConverters }: { defaultConverters: Record<string, unknown> }) => ({
  ...defaultConverters,
  blocks: {
    Code: ({
      node,
      providedCSSString,
    }: {
      node: { fields: { code?: string; language?: string } }
      providedCSSString?: string
    }) => {
      const code = escapeHtml(node.fields.code ?? '')
      const lang = escapeHtml(node.fields.language ?? '')
      const attrs = providedCSSString ? ` style="${providedCSSString}"` : ''
      const langAttr = lang ? ` data-lang="${lang}"` : ''
      return `<pre${attrs}${langAttr}><code class="language-${lang}">${code}</code></pre>`
    },
  },
})

const syncContentHtml: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.content) {
    data.contentHtml = await convertLexicalToHTML({
      data: data.content as SerializedEditorState,
      converters: htmlConverters,
    })
  }
  return data
}

const setPublishedAt: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  if (
    data.status === 'published' &&
    !data.publishedAt &&
    (!originalDoc || originalDoc.status !== 'published')
  ) {
    data.publishedAt = new Date().toISOString()
  }
  return data
}

const autoFillExcerpt: CollectionBeforeChangeHook = async ({ data }) => {
  if (data.excerpt || !data.contentHtml) return data
  const text = data.contentHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  data.excerpt = text.slice(0, 160)
  return data
}

const logChange: CollectionAfterChangeHook = ({ doc, operation }) => {
  console.log(`Blog ${operation}: ${doc.title} (${doc.slug})`)
  return doc
}

const revalidateBlog: CollectionAfterChangeHook = ({ doc, operation }) => {
  if (doc._status === 'published') {
    revalidatePath('/blog')
    revalidatePath(`/blog/${doc.slug}`)
    revalidatePath('/sitemap')
  }
  return doc
}

const revalidateBlogDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidatePath('/blog')
  revalidatePath(`/blog/${doc.slug}`)
  revalidatePath('/sitemap')
  return doc
}

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
    listSearchableFields: ['title', 'slug', 'excerpt'],
    preview: doc => (doc.slug ? `/blog/${doc.slug}` : null),
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
  },
  hooks: {
    beforeChange: [syncContentHtml, setPublishedAt, autoFillExcerpt],
    afterChange: [logChange, revalidateBlog],
    afterDelete: [revalidateBlogDelete],
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    update: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g. How to Build a CMS with Payload',
      },
    },
    slugField({
      name: 'slug',
      useAsSlug: 'title',
    }),
    {
      name: 'content',
      type: 'richText',
      access: {
        read: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
        update: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
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
      name: 'excerpt',
      type: 'textarea',
      admin: {
        placeholder: 'A brief summary for listings and SEO...',
        description: 'Short summary shown in listings and social previews.',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      admin: {
        description: 'Draft is only visible to editors. Published is live.',
        position: 'sidebar',
      },
      access: {
        read: ({ req }) => Boolean(req.user),
        update: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
      access: {
        read: () => true,
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      many: true,
      filterOptions: {},
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        description: 'Leave blank to publish immediately on save.',
        position: 'sidebar',
      },
    },
  ],
}
