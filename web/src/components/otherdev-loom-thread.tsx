'use client'

import { useCallback, useState } from 'react'
import type { ArtifactToolCall } from '@/components/artifact-renderer'
import { ArtifactRenderer } from '@/components/artifact-renderer'
import { ChatCore } from '@/components/chat-core'
import { Navigation } from '@/components/navigation'

function LoomPageInner({
  onClear,
  hasActiveArtifact,
}: {
  onClear: () => void
  hasActiveArtifact: boolean
}) {
  return <Navigation isLoomPage={true} onClear={onClear} hasActiveArtifact={hasActiveArtifact} />
}

export function LoomPageClient({ noNavigation }: { noNavigation?: boolean }) {
  const [activeArtifact, setActiveArtifact] = useState<ArtifactToolCall | null>(null)
  const [chatKey, setChatKey] = useState(0)

  const handleClear = useCallback(() => {
    setChatKey(k => k + 1)
  }, [])

  return (
    <>
      {noNavigation ? null : (
        <LoomPageInner onClear={handleClear} hasActiveArtifact={!!activeArtifact} />
      )}
      <main className="h-screen">
        <div className="flex h-full overflow-hidden">
          <div className={`h-full ${activeArtifact ? 'hidden md:block md:w-1/2' : 'w-full'}`}>
            <ChatCore
              key={chatKey}
              activeArtifact={activeArtifact}
              onArtifactOpen={setActiveArtifact}
              onClear={handleClear}
            />
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
    </>
  )
}

// Re-export for backwards compatibility
export { ChatCore as OtherDevLoomThread }
