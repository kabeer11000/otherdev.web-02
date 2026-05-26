import type { CollectionConfig } from 'payload'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  labels: {
    singular: 'Contact',
    plural: 'Contacts',
  },
  admin: {
    group: 'Submissions',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'companyName', 'createdAt'],
    listSearchableFields: ['name', 'email', 'companyName', 'subject'],
  },
  access: {
    read: ({ req }) => (req.user ? true : false),
    create: () => true,
    update: ({ req }) => ['admin', 'editor'].includes(req.user?.role),
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the person submitting the contact form.',
      },
    },
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'text',
      required: true,
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The message content from the contact form.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'new',
      admin: {
        description: 'Track whether this contact submission has been handled.',
      },
    },
  ],
  timestamps: true,
}
