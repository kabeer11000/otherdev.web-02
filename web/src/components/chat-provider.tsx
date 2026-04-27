// src/components/chat-provider.tsx
'use client'

import type { ReactNode } from 'react'

interface ChatProviderProps {
  children: ReactNode
}

// ChatProvider was previously used for AI SDK RSC integration (createAI).
// In AI SDK v6, createAI from @ai-sdk/rsc was removed. Since ChatProvider
// is not currently imported anywhere in the codebase, it is a passthrough.
export function ChatProvider({ children }: ChatProviderProps) {
  return <>{children}</>
}
