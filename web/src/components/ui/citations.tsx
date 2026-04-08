'use client'

import { Source, SourceContent, SourceTrigger } from '@/components/ui/source'
import type { Citation } from '@/lib/groq-citations'

export type CitationsProps = {
  citations: Citation[]
  variant?: 'pills' | 'footnotes' | 'inline'
  className?: string
}

/**
 * Display citations from Groq compound model responses
 *
 * Variants:
 * - pills: Horizontal scrollable list of source pills (default)
 * - footnotes: Numbered list at bottom
 * - inline: Superscript numbers (requires manual placement)
 */
export function Citations({ citations, variant = 'pills', className }: CitationsProps) {
  if (citations.length === 0) {
    return null
  }

  if (variant === 'pills') {
    return (
      <div className={className}>
        <div className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
          Sources
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {citations.map(citation => (
            <Source key={citation.id} href={citation.url}>
              <SourceTrigger label={citation.id} showFavicon />
            </Source>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'footnotes') {
    return (
      <div className={className}>
        <div className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
          Sources
        </div>
        <div className="flex flex-col gap-2">
          {citations.map(citation => (
            <Source key={citation.id} href={citation.url}>
              <SourceTrigger label={citation.id} className="max-w-none justify-start" />
            </Source>
          ))}
        </div>
        <div className="border-t pt-3 mt-3">
          {citations.map(citation => (
            <div key={citation.id} className="mb-2 last:mb-0">
              <Source href={citation.url}>
                <SourceTrigger label={citation.id} showFavicon className="mb-1" />
              </Source>
              <SourceContent title={citation.title} description={citation.snippet} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

/**
 * Inline citation trigger - use within text
 * Example: "According to reports{CitationInline citation={citations[0]}}"
 */
export function CitationInline({
  citation,
  className,
}: {
  citation: Citation
  className?: string
}) {
  return (
    <Source href={citation.url}>
      <SourceTrigger label={citation.id} className={className} />
    </Source>
  )
}
