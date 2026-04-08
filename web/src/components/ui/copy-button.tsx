'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { stripMarkdown } from '@/lib/utils'

interface CopyButtonProps {
  content: string
  copyMessage?: string
  htmlContent?: string
}

export function CopyButton({ content, copyMessage = 'Copied!', htmlContent }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const plainText = stripMarkdown(content)

    if (htmlContent && navigator.clipboard.write) {
      try {
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const textBlob = new Blob([plainText], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blob,
            'text/plain': textBlob,
          }),
        ])
      } catch {
        await navigator.clipboard.writeText(plainText)
      }
    } else {
      await navigator.clipboard.writeText(plainText)
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="h-6 w-6"
      onClick={handleCopy}
      aria-label={copied ? copyMessage : 'Copy to clipboard'}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
