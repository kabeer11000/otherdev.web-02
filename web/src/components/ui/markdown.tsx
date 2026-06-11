'use client'

import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'
import styles from './markdown.module.css'

export type MarkdownProps = {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <Streamdown
      plugins={{ code, math, mermaid }}
      shikiTheme={['github-light', 'github-dark']}
      mermaid={{ config: { flowchart: { useMaxWidth: true } } }}
      controls={{
        code: { copy: true, download: true },
        mermaid: { copy: true, download: true, fullscreen: true, panZoom: true },
        table: { copy: true, download: true },
      }}
      className={className}
      components={{
        inlineCode: ({ children }) => (
          <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-border/50">
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-[var(--link)] hover:text-[var(--link-hover)] underline hover:underline-offset-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 rounded transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
      }}
    >
      {children}
    </Streamdown>
  )
}
