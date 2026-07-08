'use client'

import { useStore } from '@nanostores/react'
import { useCallback, useState } from 'react'
import { ArtifactRenderer } from '@/components/artifact-renderer'
import { ChatCore } from '@/components/chat-core'
import { Navigation } from '@/components/navigation'
import { $activeArtifact } from '@/stores/artifact'

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
  const activeArtifact = useStore($activeArtifact)
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
              onArtifactOpen={artifact => $activeArtifact.set(artifact)}
              onClear={handleClear}
            />
          </div>
          {activeArtifact && (
            <div className="h-full w-full md:w-1/2">
              <ArtifactRenderer
                toolCall={activeArtifact}
                mode="panel"
                onClose={() => $activeArtifact.set(null)}
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
