'use client'

import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import type React from 'react'
import { Streamdown } from 'streamdown'
import 'katex/dist/katex.min.css'

// All stable constants are hoisted to module level so Streamdown's React.memo
// shallow-equality check never sees changed references — only `children` and
// `isAnimating` vary between renders, which is the intended behaviour.

const PLUGINS = { code, math, mermaid }

const ANIMATED = {
  animation: 'blurIn' as const,
  duration: 250,
  easing: 'ease-out',
  sep: 'word' as const,
}

const SHIKI_THEME: [string, string] = ['github-light', 'github-dark']

const CONTROLS = {
  code: { copy: true, download: true },
  mermaid: { copy: true, download: true, fullscreen: true },
  table: { copy: true, download: true },
}

const COMPONENTS = {
  inlineCode: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-border/50">
      {children}
    </code>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="my-2 leading-relaxed">{children}</p>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li className="ml-4">{children}</li>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => {
    const isExternal = href?.startsWith('http') || href?.startsWith('//')
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="text-[var(--link)] hover:text-[var(--link-hover)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 rounded"
      >
        {children}
      </a>
    )
  },
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-4 border-border" />,
  br: () => <br />,
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="my-4 w-full overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm text-foreground">{children}</table>
      </div>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-muted/50 text-left font-medium text-muted-foreground [&_tr]:border-b">
      {children}
    </thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
  ),
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="border-b border-border transition-colors hover:bg-muted/50">{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-left border-r border-border last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="p-4 align-middle text-foreground border-r border-border last:border-r-0">
      {children}
    </td>
  ),
}

interface MarkdownRendererProps {
  children: string
  isAnimating?: boolean
}

export function MarkdownRenderer({ children, isAnimating = false }: MarkdownRendererProps) {
  return (
    <Streamdown
      plugins={PLUGINS}
      animated={ANIMATED}
      caret="block"
      isAnimating={isAnimating}
      shikiTheme={SHIKI_THEME}
      controls={CONTROLS}
      components={COMPONENTS}
    >
      {children}
    </Streamdown>
  )
}
