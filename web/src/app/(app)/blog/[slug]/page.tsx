import Link from 'next/link'
import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { buildSocialMetadata } from '@/lib/metadata'
import { getBlogPostBySlug, getPublishedBlogSlugs } from '@/lib/payload-api'

export const revalidate = 604800

export async function generateStaticParams() {
  const slugs = await getPublishedBlogSlugs()
  return slugs.map(slug => ({ slug }))
}

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: 'Blog Post Not Found | Other Dev',
    }
  }

  const description = post.excerpt ?? ''

  return {
    title: `${post.title} | Other Dev Blog`,
    description,
    ...buildSocialMetadata({
      title: `${post.title} | Other Dev Blog`,
      description,
      path: `/blog/${slug}`,
      imagePath: post.featuredImage?.url ?? '',
      imageAlt: `${post.title} | Other Dev Blog`,
      type: 'article',
    }),
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
          <div className="grid grid-cols-12">
            <div className="col-span-12 sm:col-span-8 md:col-span-7 lg:col-span-6">
              <p className="text-[#686868] text-[11px] font-sans tracking-[-0.24px] leading-[14px] mb-4">
                404 — post not found
              </p>
              <Link
                href="/blog"
                className="text-[11px] font-sans tracking-[-0.24px] text-[#686868] hover:text-foreground transition-colors"
              >
                ← Back to blog
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const displayDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(post.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container -mx-auto px-3 pr-3 md:pr-[8%] lg:pr-[15%] pt-[60px] pb-12">
        <article>
          {/* Header */}
          <header className="grid grid-cols-12 mb-12">
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-serif font-light text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-[-0.03em] text-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ fontFamily: 'var(--fraunces), serif' }}
              >
                {post.title}
              </h1>
              <div
                className="flex items-center gap-4 text-[#686868] text-[11px] font-sans tracking-[-0.24px] leading-[14px] animate-in fade-in slide-in-from-bottom-2 duration-500"
                style={{ animationDelay: '80ms' }}
              >
                <time dateTime={post.publishedAt ?? post.createdAt}>{displayDate}</time>
                {post.author && (
                  <>
                    <span>·</span>
                    <span>{typeof post.author === 'object' ? post.author.name : 'Other Dev'}</span>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          {post.contentHtml && (
            <div
              className="grid grid-cols-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '160ms' }}
            >
              <div className="col-span-12 lg:col-span-8">
                <div
                  className="prose-article"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div
            className="mt-16 pt-8 border-t border-[var(--border)] animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: '200ms' }}
          >
            <Link
              href="/blog"
              className="text-[11px] font-sans tracking-[-0.24px] text-[#686868] hover:text-foreground transition-colors"
            >
              ← Back to all posts
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
