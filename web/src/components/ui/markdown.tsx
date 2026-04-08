import { marked } from 'marked'
import { memo, useId, useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { CodeBlock, CodeBlockCode } from './code-block'

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  return marked.lexer(markdown).map(token => token.raw)
}

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext'
  const match = className.match(/language-(\w+)/)
  return match?.[1] ?? 'plaintext'
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line

    if (isInline) {
      return (
        <span
          className={cn(
            'bg-muted px-1.5 py-0.5 rounded text-[0.875em] font-mono border border-border/50',
            className
          )}
          {...props}
        >
          {children}
        </span>
      )
    }

    const language = extractLanguage(className)

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    )
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
  table: function TableComponent({ children }) {
    return (
      <div className="my-4 w-full overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-foreground">{children}</table>
        </div>
      </div>
    )
  },
  thead: function THeadComponent({ children }) {
    return (
      <thead className="bg-muted/50 text-left font-medium text-muted-foreground [&_tr]:border-b">
        {children}
      </thead>
    )
  },
  tbody: function TBodyComponent({ children }) {
    return <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
  },
  tr: function TRComponent({ children }) {
    return (
      <tr className="border-b border-border transition-colors hover:bg-muted/50">{children}</tr>
    )
  },
  th: function THComponent({ children }) {
    return (
      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-left border-r border-border last:border-r-0">
        {children}
      </th>
    )
  },
  td: function TDComponent({ children }) {
    return (
      <td className="p-4 align-middle text-foreground border-r border-border last:border-r-0">
        {children}
      </td>
    )
  },
}

type MarkdownBlockProps = {
  content: string
  components?: Partial<Components>
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({ content, components = INITIAL_COMPONENTS }: MarkdownBlockProps) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    )
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
)

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock'

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId()
  const blockId = id ?? generatedId

  // If content contains a table, render it as a single block to prevent splitting issues
  const blocks = useMemo(() => {
    if (children.includes('|') && children.includes('---')) {
      return [children]
    }
    return parseMarkdownIntoBlocks(children)
  }, [children])

  return (
    <div className={cn('space-y-2', className)}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          // biome-ignore lint/suspicious/noArrayIndexKey: stable block order
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  )
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = 'Markdown'

export { Markdown }
