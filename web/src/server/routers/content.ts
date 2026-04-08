import { z } from 'zod'
import { payloadAPI } from '@/lib/payload-api'
import { publicProcedure, router } from '../trpc'

/**
 * Content router for fetching blog posts and categories from Canvas (Payload CMS)
 * Domain is automatically detected from request headers via tRPC context
 */
export const contentRouter = router({
  /**
   * Get all blog posts for the current domain (from context)
   */
  getBlogPosts: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
        page: z.number().optional().default(1),
      })
    )
    .query(async ({ ctx, input }) => {
      return await payloadAPI.getBlogPosts(ctx.domain, {
        limit: input.limit,
        page: input.page,
      })
    }),

  /**
   * Get a single blog post by slug (domain from context)
   */
  getBlogPost: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await payloadAPI.getBlogPost(input.slug, ctx.domain)
    }),

  /**
   * Get all categories for the current domain (from context)
   */
  getCategories: publicProcedure.query(async ({ ctx }) => {
    return await payloadAPI.getCategories(ctx.domain)
  }),
})
