import { defineMiddleware } from 'astro:middleware'

/**
 * Multi-tenant middleware for qwik-astro-app
 * Extracts tenant domain from host header and makes it available via context.locals
 *
 * Domain mapping:
 * - otherdev.com → otherdev
 * - localhost → localhost (development)
 * - clientname.com → clientname (custom domains)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const hostname = context.request.headers.get('host') || ''

  // Extract domain (remove port for localhost)
  const domain = hostname.split(':')[0]

  // Make domain available to all API routes via context.locals
  context.locals.tenantDomain = domain

  return next()
})
