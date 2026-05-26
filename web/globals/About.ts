import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { revalidatePath } from 'next/cache'
import type {
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  GlobalBeforeValidateHook,
  GlobalConfig,
} from 'payload'

const syncAboutTextPlain: GlobalBeforeChangeHook = async ({ data }) => {
  if (data.aboutText) {
    data.aboutTextPlain = await convertLexicalToPlaintext({
      data: data.aboutText as SerializedEditorState,
    })
  }
  return data
}

const deriveFoundingYear: GlobalBeforeValidateHook = async ({ data }) => {
  if (data.foundingDate && !data.foundingYear) {
    data.foundingYear = new Date(data.foundingDate).getFullYear().toString()
  }
  return data
}

const revalidateAbout: GlobalAfterChangeHook = ({ doc }) => {
  revalidatePath('/about')
  return doc
}

export const About: GlobalConfig = {
  slug: 'about',
  hooks: {
    beforeChange: [syncAboutTextPlain],
    beforeValidate: [deriveFoundingYear],
    afterChange: [revalidateAbout],
  },
  fields: [
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'heroImageAlt',
      type: 'text',
      required: true,
    },
    {
      name: 'aboutLabel',
      type: 'text',
      defaultValue: 'About',
    },
    {
      name: 'aboutText',
      type: 'richText',
    },
    {
      name: 'aboutTextPlain',
      type: 'textarea',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'clientsLabel',
      type: 'text',
      defaultValue: 'Clients',
    },
    {
      name: 'clientsDesktop',
      type: 'relationship',
      relationTo: 'clients',
      hasMany: true,
    },
    {
      name: 'clientsMobile',
      type: 'relationship',
      relationTo: 'clients',
      hasMany: true,
    },
    {
      name: 'foundingDate',
      type: 'date',
    },
    {
      name: 'foundingYear',
      type: 'text',
    },
    {
      name: 'founders',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
