import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { buildSocialMetadata } from '@/lib/metadata'
import { getBlogPosts } from '@/lib/payload-api'

export const metadata: Metadata = {
  title: 'Blog | Other Dev',
  description:
    'Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.',
  ...buildSocialMetadata({
    title: 'Blog | Other Dev',
    description:
      'Thoughts, insights, and updates from the Other Dev studio on web development, design, and digital platforms.',
    path: '/blog',
    imagePath: '/images/projects/olly-2025/products-page-desktop.webp',
    imageAlt: 'Blog | Other Dev',
  }),
}

export const revalidate = 604800

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        {/* Page label — matches work/page pattern: "OD / Work" */}
        <div className="grid grid-cols-12 mb-8">
          <div className="col-span-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="text-[11px] font-twk font-normal leading-[14px] tracking-[-0.24px] text-[#686868]">
              other dev / blog
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-12 mb-[30px]">
          <p className="text-[#686868] text-[11px] leading-[14px] font-normal col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
            Thoughts, insights, and updates from the Other Dev studio on web development, design,
            and digital platforms.
          </p>
        </div>

        {/* Search + count row */}
        <div className="flex items-center gap-3 mb-[20px]">
          <Link
            href="/blog/search"
            className="text-[11px] font-twk font-normal leading-[14px] tracking-[-0.24px] text-[#686868] bg-stone-200 hover:bg-stone-300 rounded-md px-3 py-2 transition-colors motion-duration-150"
          >
            Search
          </Link>
          <span className="text-[11px] text-[#686868] font-twk tracking-[-0.24px]">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {/* Post list */}
        <div className="mt-[30px]">
          {posts
            .toSorted((a, b) => {
              const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt)
              const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt)
              return dateB.getTime() - dateA.getTime()
            })
            .map((post, index) => {
              const displayDate = post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })

              return (
                <article
                  key={post.id}
                  className="group border-b border-[var(--border)] first:border-t animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-[6px] sm:gap-[24px] py-[16px] pr-[40px] relative"
                  >
                    {/* Title */}
                    <span className="text-[11.4px] text-black tracking-[-0.24px] group-hover:text-[#686868] transition-colors motion-duration-150 font-twk font-normal leading-[14px] not-italic shrink-0 sm:w-[200px] md:w-[260px] lg:w-[320px]">
                      {post.title}
                    </span>

                    {/* Excerpt — only visible on larger screens */}
                    {post.excerpt && (
                      <span className="hidden sm:block text-[#686868] text-[11px] tracking-[-0.24px] group-hover:text-[#686868]/70 transition-colors motion-duration-150 font-twk font-normal leading-[14px] not-italic line-clamp-1 flex-1">
                        {post.excerpt}
                      </span>
                    )}

                    {/* Date — right aligned on larger screens */}
                    <span className="text-[#686868] text-[11px] tracking-[-0.24px] font-twk font-normal leading-[14px] not-italic shrink-0">
                      {displayDate}
                    </span>

                    {/* Hover arrow */}
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity motion-duration-150 text-[#686868]">
                      →
                    </span>
                  </Link>
                </article>
              )
            })}
        </div>

        <Footer />
      </main>
    </div>
  )
}