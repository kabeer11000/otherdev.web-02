import type { Metadata } from 'next'
import Link from 'next/link'
import { searchContent } from '@/lib/payload-api'
import { buildSocialMetadata } from '@/lib/metadata'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata: Metadata = {
  title: 'Search | Other Dev',
  description: 'Search blog posts and projects on Other Dev.',
  ...buildSocialMetadata({
    title: 'Search | Other Dev',
    description: 'Search blog posts and projects on Other Dev.',
    path: '/blog/search',
  }),
}

export const revalidate = 604800

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const results = q ? await searchContent(q) : []

  return (
    <div className="relative px-4 py-4">
      <div className="flex sticky top-0">
        <h1 className="text-sm mb-2 bg-neutral-200 rounded-md p-2 cursor-pointer hover:bg-neutral-300 animate-in fade-in">
          <span className="font-bold">OD</span> / Blog / Search
        </h1>
      </div>

      <form method="get" action="/blog/search" className="mb-8">
        <div className="flex gap-2 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search posts and projects..."
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-neutral-900 text-white px-4 py-2 rounded-md text-sm hover:bg-neutral-700"
          >
            Search
          </button>
        </div>
      </form>

      {q && (
        <p className="text-neutral-600 text-xs mb-4">
          {results.length === 0
            ? `No results for "${q}"`
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`}
        </p>
      )}

      {results.length > 0 && (
        <div className="grid gap-6">
          {results.map((result) => {
            const isBlog = result.doc.relationTo === 'blog'
            const isProjects = result.doc.relationTo === 'projects'
            const doc = result.doc.value as { slug?: string; excerpt?: string; title?: string; image?: string }

            return (
              <article
                key={result.id}
                className="border rounded-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded">
                    {isBlog ? 'Blog' : isProjects ? 'Project' : result.doc.relationTo}
                  </span>
                </div>
                <h2 className="text-sm font-bold mb-1">
                  <Link
                    href={isBlog ? `/blog/${doc?.slug}` : isProjects ? `/projects/${doc?.slug}` : '#'}
                    className="text-neutral-900 hover:text-blue-600"
                  >
                    {result.title || doc?.title || 'Untitled'}
                  </Link>
                </h2>
                {doc?.excerpt && (
                  <p className="text-neutral-600 text-sm line-clamp-2">{doc.excerpt}</p>
                )}
              </article>
            )
          })}
        </div>
      )}

      {!q && (
        <p className="text-neutral-500 text-sm">Enter a search term to find blog posts and projects.</p>
      )}
    </div>
  )
}