import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { searchPlugin } from '@payloadcms/plugin-search'
import { seoPlugin } from '@payloadcms/plugin-seo'
import {
  BlocksFeature,
  CodeBlock,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import nodemailer from 'nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Blog } from './collections/Blog'
import { Categories } from './collections/Categories'
import { Clients } from './collections/Clients'
import { Contacts } from './collections/Contacts'
import { Media } from './collections/Media'
import { Projects } from './collections/Projects'
import { Users } from './collections/Users'
import { About } from './globals/About'
import { adminThemePlugin } from './src/plugins/index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: __dirname,
    },
    meta: {
      title: 'OD-Canvas',
      titleSuffix: '',
      icons: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          url: '/favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          type: 'image/png',
          url: '/apple-touch-icon.png',
        },
      ],
    },
    avatar: {
      Component: './src/plugins/UserAvatar#UserAvatar',
    },
    components: {
      graphics: {
        Icon: './src/plugins/Logo#Icon',
        Logo: './src/plugins/Logo#Logo',
      },
      beforeLogin: ['./src/plugins/BeforeLogin#BeforeLogin'],
    },
    routes: {
      account: '/my-profile',
    },
    livePreview: {
      url: ({ data, collectionConfig }) => {
        if (!collectionConfig) return `/${data.slug}`
        if (collectionConfig.slug === 'blog') return `/blog/${data.slug}`
        if (collectionConfig.slug === 'projects') return `/projects/${data.slug}`
        return `/${data.slug}`
      },
      collections: ['blog', 'projects'],
    },
  },
  collections: [Users, Media, Projects, Categories, Blog, Clients, Contacts],
  globals: [About],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      BlocksFeature({
        blocks: [
          CodeBlock({
            defaultLanguage: 'ts',
            languages: {
              plaintext: 'Plain Text',
              ts: 'TypeScript',
              js: 'JavaScript',
              tsx: 'TSX',
              jsx: 'JSX',
            },
          }),
        ],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(__dirname, 'src/payload-types.ts'),
  },
  email: nodemailerAdapter({
    defaultFromName: 'Otherdev',
    defaultFromAddress: process.env.GMAIL_USER || '',
    transport: nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    }),
  }),
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  plugins: [
    // seoPlugin({
    //   collections: ['blog', 'projects'],
    //   globals: ['about'],
    //   uploadsCollection: 'media',
    //   fields: ({ defaultFields }) => defaultFields,
    //   generateTitle: ({ doc, globalConfig }) => {
    //     if (globalConfig) return doc?.seo?.meta?.title ?? 'About'
    //     return doc?.title ?? ''
    //   },
    //   generateDescription: ({ doc, globalConfig }) => {
    //     if (globalConfig) return doc?.seo?.meta?.description ?? ''
    //     return doc?.description?.slice(0, 157) ?? ''
    //   },
    //   generateImage: ({ doc, collectionConfig }) => {
    //     if (collectionConfig?.slug === 'blog' && doc?.featuredImage) {
    //       return { id: doc.featuredImage }
    //     }
    //     if (collectionConfig?.slug === 'projects' && doc?.image) {
    //       return { id: doc.image }
    //     }
    //     return undefined
    //   },
    //   generateURL: ({ doc, collectionConfig, req }) => {
    //     const origin = (req.headers.get('origin') ?? process.env.SITE_URL ?? '') as string
    //     if (collectionConfig?.slug === 'blog') return `${origin}/blog/${doc?.slug ?? ''}`
    //     if (collectionConfig?.slug === 'projects') return `${origin}/projects/${doc?.slug ?? ''}`
    //     return `${origin}/about`
    //   },
    // }),
    searchPlugin({
      collections: ['blog', 'projects', 'media'],
    }),
    redirectsPlugin({
      collections: ['blog', 'projects'],
    }),
    // mcpPlugin({
    //   collections: {
    //     blog: { enabled: { find: true, update: true } },
    //     projects: { enabled: { find: true, update: true } },
    //     media: { enabled: { find: true } },
    //   },
    // }),
    ...(process.env.NODE_ENV === 'development'
      ? [
          mcpPlugin({
            collections: {
              blog: { enabled: { find: true, update: true } },
              projects: { enabled: { find: true, update: true } },
              media: { enabled: { find: true } },
            },
          }),
        ]
      : []),
    ...(process.env.R2_BUCKET
      ? [
          s3Storage({
            enabled: true,
            collections: {
              media: {
                disablePayloadAccessControl: true,
                // All files are at R2 root (prefix field in MongoDB is obsolete — ignore it).
                generateFileURL: ({ filename }) => `${process.env.R2_PUBLIC_URL}/${filename}`,
              },
            },
            bucket: process.env.R2_BUCKET,
            config: {
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
              },
              region: 'auto',
              endpoint: process.env.R2_ENDPOINT || '',
              forcePathStyle: true,
            },
          }),
        ]
      : []),
    adminThemePlugin(),
  ],
})
