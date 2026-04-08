'use client'

import { layout, prepare } from '@chenglou/pretext'
import { ArrowUp, Square } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  submitOnEnter?: boolean
  stop?: () => void
  isGenerating: boolean
  onSubmit?: () => void
}

export function MessageInput({
  placeholder = 'Ask AI...',
  className,
  onKeyDown: onKeyDownProp,
  submitOnEnter = true,
  stop,
  isGenerating,
  onSubmit,
  ...props
}: MessageInputProps) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [textareaWidth, setTextareaWidth] = useState(300)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setTextareaWidth(rect.width - 48)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const prepared = useMemo(
    () =>
      prepare(props.value || '', '14px TWKLausanne', {
        whiteSpace: 'pre-wrap',
      }),
    [props.value]
  )

  useEffect(() => {
    if (!textAreaRef.current || textareaWidth <= 0) return

    const { height } = layout(prepared, textareaWidth - 24, 21)
    const clampedHeight = Math.min(height, 240)

    textAreaRef.current.style.height = 'auto'
    textAreaRef.current.style.height = `${clampedHeight}px`
  }, [prepared, textareaWidth])

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit?.()
    }
    onKeyDownProp?.(event)
  }

  return (
    <div ref={containerRef} className="relative flex w-full items-center space-x-2">
      <div className="relative flex-1">
        <textarea
          aria-label="Write your prompt here"
          placeholder={placeholder}
          ref={textAreaRef}
          onKeyDown={onKeyDown}
          className={cn(
            'z-10 w-full grow resize-none rounded-xl border border-input bg-background p-3 pr-12 text-sm ring-offset-background transition-[border] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          rows={1}
          style={{ maxHeight: '240px' }}
          {...props}
        />
      </div>

      <div className="absolute right-3 top-3 z-20 flex gap-2">
        {isGenerating && stop ? (
          <Button
            type="button"
            size="icon"
            className="h-8 w-8"
            aria-label="Stop generating"
            onClick={stop}
          >
            <Square className="h-3 w-3 animate-pulse" fill="currentColor" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 transition-opacity"
            aria-label="Send message"
            disabled={props.value === '' || isGenerating}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
