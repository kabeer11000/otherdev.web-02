import { initTRPC } from '@trpc/server'
import superjson from 'superjson'

/**
 * Create tRPC context with domain from request headers
 * Domain is extracted from the request object passed by the adapter
 */
export const createTRPCContext = async (opts: { req: Request }) => {
  // Extract domain from request headers set by proxy.ts
  const domain = opts.req.headers.get('x-tenant-domain') || 'otherdev.com'

  return {
    domain,
    req: opts.req,
  }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
