'use client'

import { useState } from 'react'
import { PromptInputProvider } from '@/components/ai-elements/prompt-input'
import { ArtifactRenderer } from '@/components/artifact-renderer'
import { ChatCore } from '@/components/chat-core'
import { Navigation } from '@/components/navigation'
import type { ArtifactToolCall } from '@/components/artifact-renderer'

export function LoomPageClient({ noNavigation }: { noNavigation?: boolean }) {
  const [activeArtifact, setActiveArtifact] = useState<ArtifactToolCall | null>(null)

  return (
    <PromptInputProvider>
      {!noNavigation && (
        <Navigation isLoomPage onClear={() => {}} hasActiveArtifact={!!activeArtifact} />
      )}
      <main className="h-screen">
        <div className="flex h-full overflow-hidden">
          <div className={`h-full ${activeArtifact ? 'hidden md:block md:w-1/2' : 'w-full'}`}>
            <ChatCore onArtifactOpen={setActiveArtifact} />
          </div>
          {activeArtifact && (
            <div className="h-full w-full md:w-1/2">
              <ArtifactRenderer
                toolCall={activeArtifact}
                mode="panel"
                onClose={() => setActiveArtifact(null)}
              />
            </div>
          )}
        </div>
      </main>
    </PromptInputProvider>
  )
}
