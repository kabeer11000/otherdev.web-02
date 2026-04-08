'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import { type BundledLanguage, codeToHtml } from 'shiki'
import type { Plugin } from 'unified'
import { SHIKI_THEMES } from '@/lib/shiki-config'
import { CopyButton } from './copy-button'

interface CodeBlockProps {
  children: string
  className?: string
}

function CodeBlock({ children, className }: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = React.useState<string>('')
  const language = (className?.replace('language-', '') as BundledLanguage) || 'plaintext'

  React.useEffect(() => {
    const highlightCode = async () => {
      try {
        const html = await codeToHtml(children.trim(), {
          lang: language,
          themes: SHIKI_THEMES,
        })
        setHighlightedCode(html)
      } catch (error) {
        console.error('Error highlighting code:', error)
        setHighlightedCode(`<pre><code>${children}</code></pre>`)
      }
    }

    highlightCode()
  }, [children, language])

  return (
    <div className="relative group my-4 w-full overflow-x-auto">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <CopyButton content={children.trim()} copyMessage="Code copied to clipboard" />
      </div>
      {highlightedCode ? (
        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: highlighted code
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
          className="[&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:leading-relaxed [&>pre]:max-w-full"
        />
      ) : (
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-w-full">
          <code>{children}</code>
        </pre>
      )}
    </div>
  )
}

interface MarkdownRendererProps {
  children: string
}

function autoLinkPhoneNumbers(text: string): string {
  const phoneRegex = /(\+?\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4})/g
  return text.replace(phoneRegex, match => {
    const cleanNumber = match.replace(/[\s-]/g, '')
    return `[${match}](tel:${cleanNumber})`
  })
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  // Replace <br> and <br/> tags with double spaces + newline for proper markdown line breaks
  let processedContent = children.replace(/<br\s*\/?>/gi, '  \n')
  processedContent = autoLinkPhoneNumbers(processedContent)

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw as unknown as Plugin]}
      components={{
        code({ className, children }: { className?: string; children?: React.ReactNode }) {
          const content = String(children).replace(/\n$/, '')
          const isInline = !className

          if (isInline) {
            return (
              <code className="bg-muted/50 px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-border/50">
                {content}
              </code>
            )
          }

          return <CodeBlock className={className}>{content}</CodeBlock>
        },
        p({ children }) {
          return <p className="my-2 leading-relaxed">{children}</p>
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
        },
        li({ children }) {
          return <li className="ml-4">{children}</li>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-3 italic">
              {children}
            </blockquote>
          )
        },
        a({ href, children }) {
          const isTelLink = href?.startsWith('tel:')
          return (
            <a
              href={href}
              target={isTelLink ? undefined : '_blank'}
              rel={isTelLink ? undefined : 'noopener noreferrer'}
              className={isTelLink ? 'text-foreground hover:underline' : undefined}
            >
              {children}
            </a>
          )
        },
        strong({ children }) {
          return <strong className="font-semibold">{children}</strong>
        },
        em({ children }) {
          return <em className="italic">{children}</em>
        },
        hr() {
          return <hr className="my-4 border-border" />
        },
        br() {
          return <br />
        },
        table({ children }) {
          return (
            <div className="my-4 w-full overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm text-foreground">{children}</table>
              </div>
            </div>
          )
        },
        thead({ children }) {
          return (
            <thead className="bg-muted/50 text-left font-medium text-muted-foreground [&_tr]:border-b">
              {children}
            </thead>
          )
        },
        tbody({ children }) {
          return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
        },
        tr({ children }) {
          return (
            <tr className="border-b border-border transition-colors hover:bg-muted/50">
              {children}
            </tr>
          )
        },
        th({ children }) {
          return (
            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-left border-r border-border last:border-r-0">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="p-4 align-middle text-foreground border-r border-border last:border-r-0">
              {children}
            </td>
          )
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  )
}
