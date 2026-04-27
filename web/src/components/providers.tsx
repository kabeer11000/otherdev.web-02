'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient()
  }
  return browserQueryClient
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>
}
