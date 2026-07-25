'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

let browserQueryClient: QueryClient | undefined

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={typeof window === 'undefined' ? new QueryClient() : (browserQueryClient ??= new QueryClient())}>
      {children}
    </QueryClientProvider>
  )
}
