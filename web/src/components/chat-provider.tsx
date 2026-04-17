// src/components/chat-provider.tsx
'use client'

import { AI } from '@ai-sdk/rsc'
import { type ReactNode } from 'react'

interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  return (
    <AI
      initialUIState={[]}
      initialAIState={[]}
    >
      {children}
    </AI>
  )
}
