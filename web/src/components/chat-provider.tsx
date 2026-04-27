// src/components/chat-provider.tsx
'use client'

import { createAI } from '@ai-sdk/rsc'
import type { ReactNode } from 'react'

interface ChatProviderProps {
  children: ReactNode
}

// createAI requires actions to be passed - the actual actions are used
// via useActions() in child components which access the wrapped server actions
export function ChatProvider({ children }: ChatProviderProps) {
  return createAI({
    actions: {},
    initialUIState: [],
    initialAIState: [],
  })({ children })
}
