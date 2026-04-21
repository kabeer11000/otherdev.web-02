'use client'

import { useChat } from '@ai-sdk/react'
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from 'ai'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUp,
  AudioLines,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode2,
  FileText,
  Globe,
  Paperclip,
  Square,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import type { ArtifactToolCall } from '@/components/artifact-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from '@/components/ui/chat-container'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CopyButton } from '@/components/ui/copy-button'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/ui/prompt-input'
import { VoiceWaveform } from '@/components/voice-waveform'
import { processAttachment } from '@/lib/ai-sdk-attachments'
import { SUGGESTED_PROMPTS } from '@/lib/constants'
import { parseSSEStream } from '@/lib/sse'
import { cleanSuggestionMarkers, cn } from '@/lib/utils'
import { VoiceRecorder } from '@/lib/voice-recorder'

// Define custom data parts for the chat stream
const suggestionDataSchema = z.object({
  suggestion: z.string(),
})

type ChatDataParts = {
  suggestion: z.infer<typeof suggestionDataSchema>
}

// Custom UIMessage type with our data parts
type ChatUIMessage = UIMessage<unknown, ChatDataParts>

const GREETINGS: { range: [number, number]; options: string[] }[] = [
  {
    range: [0, 5],
    options: [
      'Hello, night owl',
      'Burning the midnight oil?',
      'Still up, I see',
      'Late night inspiration strike?',
      'Welcome back, creative soul',
    ],
  },
  {
    range: [5, 9],
    options: ['Good morning', 'Early riser mode on', 'Fresh start ahead', 'Ready to create?'],
  },
  {
    range: [9, 12],
    options: [
      'Good morning',
      "Morning, let's make something great",
      "What's on your mind today?",
      'Feeling creative?',
    ],
  },
  {
    range: [12, 17],
    options: [
      'Good afternoon',
      'Afternoon vibes',
      'Still grinding?',
      "How's the day treating you?",
    ],
  },
  {
    range: [17, 21],
    options: [
      'Good evening',
      'Evening, creator',
      'Golden hour thinking time',
      'Winding down or gearing up?',
    ],
  },
  {
    range: [21, 24],
    options: [
      'Good night',
      'Late night magic hour',
      'Night mode activated',
      'Quiet hours for the best ideas',
    ],
  },
]

function pickGreeting() {
  const hour = new Date().getHours()
  const bucket =
    GREETINGS.find(({ range: [min, max] }) => hour >= min && hour < max) ?? GREETINGS[0]
  return bucket.options[Math.floor(Math.random() * bucket.options.length)]
}

function useTimeBasedGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null)
  const lastHourRef = useRef(new Date().getHours())

  useEffect(() => {
    // Set initial greeting on mount (client-side only)
    setGreeting(pickGreeting())

    const interval = setInterval(() => {
      const hour = new Date().getHours()
      if (hour === lastHourRef.current) return
      lastHourRef.current = hour
      setGreeting(pickGreeting())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  return greeting
}

function useScrollToBottom(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowButton(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
  }, [containerRef])

  return { showButton, scrollToBottom }
}

function ReasoningCollapsible({ reasoning }: { reasoning: string }) {
  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex items-center gap-1 font-sans text-xs text-muted-foreground transition-colors hover:text-foreground group">
        <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
        <span>View thinking process</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="prose prose-sm max-w-full break-words rounded-xl border border-border bg-muted/50 p-3 font-sans text-xs leading-relaxed text-muted-foreground dark:prose-invert sm:p-4 sm:text-sm">
          <MarkdownRenderer>{reasoning}</MarkdownRenderer>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SuggestionButton({
  display,
  prompt,
  sendMessage,
  icon,
}: {
  display: string
  prompt: string
  sendMessage: (message: {
    text: string
    files?: Array<{
      type: 'file'
      mediaType: string
      url: string
      name: string
    }>
  }) => void
  icon?: 'briefcase' | 'users' | 'code' | 'globe'
}) {
  const handleClick = () => {
    sendMessage({ text: prompt })
  }

  const IconComponent = useMemo(() => {
    switch (icon) {
      case 'briefcase':
        return Briefcase
      case 'users':
        return Users
      case 'code':
        return Code2
      case 'globe':
        return Globe
      default:
        return undefined
    }
  }, [icon])

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="h-auto justify-start rounded-xl bg-card p-4 text-left text-xs transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
    >
      <div className="flex items-start gap-3">
        {IconComponent && <IconComponent className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />}
        <span className="flex-1">{display}</span>
      </div>
    </Button>
  )
}

function UserMessage({ message }: { message: UIMessage }) {
  const textContent =
    message.parts
      ?.filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') || ''

  const imageParts =
    (message.parts?.filter(p => p.type === 'file' && p.mediaType?.startsWith('image/')) as Array<{
      type: 'file'
      mediaType: string
      url: string
      filename?: string
    }>) || []

  const fileParts =
    (message.parts?.filter(p => p.type === 'file' && !p.mediaType?.startsWith('image/')) as Array<{
      type: 'file'
      mediaType: string
      url: string
      filename?: string
    }>) || []

  return (
    <div className="flex justify-end items-end gap-2">
      <div className="max-w-[95%] gap-2 sm:max-w-[85%] sm:gap-3 md:max-w-[80%] flex flex-col">
        <div className="flex flex-col gap-2">
          {imageParts.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {imageParts.map((img, i) => (
                // biome-ignore lint/performance/noImgElement: User-uploaded image preview in chat
                <img
                  key={`img-${i}-${img.url}`}
                  src={img.url}
                  alt={img.filename || 'Attachment'}
                  className="max-h-48 max-w-48 rounded-xl object-cover"
                />
              ))}
            </div>
          )}
          {fileParts.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {fileParts.map((file, i) => (
                <div
                  key={`file-${i}-${file.filename || 'file'}`}
                  className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="max-w-[180px] truncate">{file.filename || 'File'}</span>
                </div>
              ))}
            </div>
          )}
          {textContent.trim() && (
            <div className="rounded-2xl bg-accent px-3 py-2 text-sm text-accent-foreground sm:px-4 sm:py-3 sm:text-base">
              {textContent}
            </div>
          )}
        </div>
      </div>
      <Image
        src="/loom-avatar-64.webp"
        alt="User"
        width={32}
        height={32}
        className="h-7 w-7 flex-shrink-0 rounded-full sm:h-8 sm:w-8"
        style={{ width: 'auto', height: 'auto' }}
      />
    </div>
  )
}

function AssistantMessage({
  message,
  setActiveArtifact,
}: {
  message: UIMessage
  setActiveArtifact: (artifact: ArtifactToolCall | null) => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  const textPart =
    message.parts
      ?.filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') || ''

  // Find artifact tool invocation using proper type narrowing
  const artifactToolCall = message.parts?.find(part => {
    if (!isToolUIPart(part)) return false
    const toolName = getToolName(part)
    return (
      toolName === 'createArtifact' &&
      (part.state === 'output-available' || part.state === 'input-available')
    )
  }) as
    | {
        type: `tool-createArtifact`
        toolCallId: string
        state: 'output-available'
        output: {
          title: string
          code: string
          description: string
          success?: boolean
        }
        input?: undefined
      }
    | {
        type: `tool-createArtifact`
        toolCallId: string
        state: 'input-available'
        input: { title: string; code: string; description: string }
        output?: undefined
      }
    | undefined

  const reasoningPart = message.parts?.find(part => part.type === 'reasoning') as
    | {
        type: 'reasoning'
        text: string
      }
    | undefined
  const reasoning = reasoningPart?.text
  const hasArtifact = Boolean(artifactToolCall)

  const cleanedText = cleanSuggestionMarkers(textPart)

  const getHtmlContent = () => contentRef.current?.innerHTML

  if (hasArtifact && artifactToolCall) {
    const artifactData = (
      artifactToolCall.state === 'output-available'
        ? artifactToolCall.output
        : artifactToolCall.input
    ) as { title: string; code: string; description: string; success?: boolean } | undefined
    const title = artifactData?.title
    const _description = artifactData?.description

    return (
      <div className="flex justify-start items-start gap-2 mt-12">
        <Image
          src="/otherdev-chat-logo-32.webp"
          alt="OtherDev Loom"
          width={32}
          height={32}
          className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
          style={{ width: 'auto', height: 'auto' }}
        />
        <div className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl flex flex-col">
          <div className="flex-1 space-y-3 min-w-0">
            {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
            {cleanedText && (
              <div ref={contentRef}>
                <div className="max-w-none rounded-lg bg-transparent p-0">
                  <MarkdownRenderer>{cleanedText}</MarkdownRenderer>
                </div>
              </div>
            )}
            {artifactToolCall && (
              <Card
                onClick={() => {
                  const result =
                    artifactToolCall.state === 'output-available'
                      ? artifactToolCall.output
                      : artifactToolCall.input
                  setActiveArtifact({
                    toolCallId: artifactToolCall.toolCallId,
                    toolName: 'createArtifact',
                    state: 'output-available',
                    // biome-ignore lint/suspicious/noExplicitAny: artifact result type
                    result: (result ?? artifactToolCall.output) as any,
                  })
                }}
                className="w-full max-w-md cursor-pointer border-border/60 bg-card/50 transition-all duration-200 hover:border-foreground/20 hover:bg-card/80 hover:shadow-sm active:scale-[0.99]"
              >
                <CardHeader className="flex-row items-center justify-between gap-4 p-3.5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/50">
                      <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm font-medium leading-tight">
                        {title || 'View Artifact'}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">Artifact · HTML</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start items-start gap-2">
      <Image
        src="/otherdev-chat-logo-32.webp"
        alt="OtherDev Loom"
        width={32}
        height={32}
        className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
        style={{ width: 'auto', height: 'auto' }}
      />
      <div className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl flex flex-col">
        <div className="flex-1 space-y-2 min-w-0">
          {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
          {cleanedText && (
            <div ref={contentRef}>
              <div className="max-w-none rounded-lg bg-transparent p-0">
                <MarkdownRenderer>{cleanedText}</MarkdownRenderer>
              </div>
            </div>
          )}
          {cleanedText && (
            <CopyButton
              content={cleanedText}
              htmlContent={getHtmlContent()}
              copyMessage="Copied response to clipboard"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function AttachmentChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [isImage, file])

  return (
    <div className="relative flex group items-center gap-1.5 border rounded-t-xl pb-4 mb-[-10px] bg-accent px-2 py-1.5 text-xs text-accent-foreground">
      {isImage && previewUrl ? (
        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-background">
          {/* biome-ignore lint/performance/noImgElement: User file preview thumbnail */}
          <img src={previewUrl} alt={file.name} className="h-full w-full object-contain" />
        </div>
      ) : (
        <FileText className="h-6 w-6 shrink-0 opacity-70" />
      )}
      <span className="truncate">{file.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 flex h-8 w-8 ml-auto items-center justify-center rounded-full hover:bg-foreground/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export interface ChatCoreProps {
  /** Callback when active artifact is set (for panel layout) */
  onArtifactOpen?: (artifact: ArtifactToolCall | null) => void
  /** Callback when chat is cleared */
  onClear?: () => void
  /** Initial active artifact (for panel layout) */
  activeArtifact?: ArtifactToolCall | null
  /** Whether to show artifact panel (for desktop split view) */
  showArtifactPanel?: boolean
  /** Custom className for the root container */
  className?: string
  /** Whether to show the greeting screen when empty */
  showGreeting?: boolean
}

/**
 * Core chat component - shared between Loom page and ChatWidget.
 * Handles all chat functionality including:
 * - AI SDK integration with streaming
 * - Voice recording and transcription
 * - File/image attachments
 * - Artifact generation and display
 * - Auto-scrolling and suggested prompts
 */
export function ChatCore({
  onArtifactOpen,
  onClear: _onClear,
  activeArtifact: externalActiveArtifact,
  showArtifactPanel: _showArtifactPanel = false,
  className,
  showGreeting = true,
}: ChatCoreProps) {
  const [internalActiveArtifact, setInternalActiveArtifact] = useState<ArtifactToolCall | null>(
    null
  )
  const [suggestion, setSuggestion] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)

  // Persist chatId in localStorage for session continuity
  const [chatId, setChatId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatId') || crypto.randomUUID()
    }
    return crypto.randomUUID()
  })
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatId', chatId)
    }
  }, [chatId])
  const [isRecording, setIsRecording] = useState(false)
  const [isRecordingProcessing, setIsRecordingProcessing] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<VoiceRecorder | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const _activeArtifact = externalActiveArtifact ?? internalActiveArtifact
  const setActiveArtifact = onArtifactOpen ?? setInternalActiveArtifact

  const greeting = useTimeBasedGreeting()

  const { messages, sendMessage, status, setMessages, addToolOutput } = useChat<ChatUIMessage>({
    dataPartSchemas: {
      suggestion: suggestionDataSchema,
    },
    transport: new DefaultChatTransport({
      api: '/api/chat/stream',
      body: {
        supportsArtifacts: true,
      },
      prepareSendMessagesRequest({ id, messages }) {
        return {
          body: {
            id: chatId,
            message: messages[messages.length - 1],
            supportsArtifacts: true,
          },
        }
      },
    }),
    experimental_throttle: 100,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return
      }
      if (toolCall.toolName === 'createArtifact') {
        addToolOutput({
          tool: 'createArtifact',
          toolCallId: toolCall.toolCallId,
          output: { success: true },
        })
      }
    },
    onData(dataPart) {
      if (dataPart.type === 'data-suggestion') {
        const parsed = suggestionDataSchema.safeParse(dataPart.data)
        if (parsed.success && parsed.data.suggestion) {
          setSuggestion(parsed.data.suggestion)
        }
      }
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: abortControllerRef is a stable ref, accessed via .current
  const _handleClear = useCallback(() => {
    setMessages([])
    setSuggestion('')
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (_onClear) {
      _onClear()
    }
  }, [setMessages, setSuggestion, _onClear])

  const { showButton, scrollToBottom } = useScrollToBottom(contentRef)

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleTranscriptReceived = (text: string) => {
    setInputValue(text)
    inputRef.current?.focus()
  }

  const handleStartRecording = async () => {
    try {
      setIsRecordingProcessing(true)
      const stream = await VoiceRecorder.requestMicrophone()
      const recorder = new VoiceRecorder(stream)
      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
      setRecordingStream(stream)
      setIsRecordingProcessing(false)
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Failed to access microphone')
      setIsRecordingProcessing(false)
    }
  }

  const handleStopRecording = async () => {
    const recorder = recorderRef.current
    if (!recorder) return

    try {
      setIsRecordingProcessing(true)
      const audioBlob = await recorder.stop()
      recorder.release()
      recorderRef.current = null
      setIsRecording(false)
      setRecordingStream(null)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Transcription failed')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Response body is not readable')

      let fullTranscript = ''
      await parseSSEStream(reader, event => {
        if (event.type === 'transcript-chunk' && typeof event.content === 'string') {
          fullTranscript += event.content
          handleTranscriptReceived(fullTranscript)
        } else if (event.type === 'transcript-complete' && typeof event.content === 'string') {
          handleTranscriptReceived(event.content)
        }
      })

      setIsRecordingProcessing(false)
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Transcription error')
      recorderRef.current?.release()
      recorderRef.current = null
      setIsRecording(false)
      setRecordingStream(null)
      setIsRecordingProcessing(false)
    }
  }

  const handleSubmit = async () => {
    if (isRecording || isRecordingProcessing) return

    const value = inputValue.trim()
    if (!value && attachments.length === 0) return

    if (attachments.length === 0) {
      sendMessage({ text: value })
    } else {
      const processed = await Promise.all(attachments.map(processAttachment))
      const fileParts = processed.map(a => ({
        type: 'file' as const,
        mediaType: a.contentType,
        url: a.url,
        filename: a.name,
      }))

      sendMessage({
        role: 'user',
        parts: [...fileParts, { type: 'text' as const, text: value }],
      })
    }

    setSuggestion('')
    setInputValue('')
    setAttachments([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const applySuggestion = () => {
    if (!suggestion) return
    setInputValue(suggestion)
    setSuggestion('')
    inputRef.current?.focus()
  }

  useEffect(() => {
    const inputElement = inputRef.current
    if (!inputElement) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const shouldApplySuggestion =
        (e.key === 'Tab' || e.key === 'ArrowRight') && suggestion && !inputElement.value
      if (shouldApplySuggestion) {
        e.preventDefault()
        setInputValue(suggestion)
        setSuggestion('')
      }
    }

    inputElement.addEventListener('keydown', handleKeyDown)
    return () => inputElement.removeEventListener('keydown', handleKeyDown)
  }, [suggestion])

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  const isSendDisabled = useMemo(() => {
    const hasText = inputValue.trim().length > 0
    const hasValidAttachments = attachments.length > 0
    const isBlocked = isRecording || isRecordingProcessing
    return (!hasText && !hasValidAttachments) || isBlocked
  }, [inputValue, attachments, isRecording, isRecordingProcessing])

  const placeholder = suggestion || 'Type your message...'

  return (
    <div className={cn('relative h-full flex flex-col bg-background', className)}>
      <ChatContainerRoot className="flex-1 w-full">
        <ChatContainerContent
          className="flex-1 scroll-smooth pb-32 sm:pb-40"
          suppressHydrationWarning
        >
          <div ref={contentRef} className="h-full overflow-auto">
            {messages.length === 0 && showGreeting && (
              <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8 mt-40">
                <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
                  <div className="space-y-3 text-center sm:space-y-4">
                    <div className="flex justify-center">
                      <Image
                        src="/otherdev-chat-logo-32.webp"
                        alt="Other Dev Loom"
                        width={32}
                        height={32}
                        className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    </div>
                    {greeting ? (
                      <motion.h2
                        key={greeting}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl"
                        suppressHydrationWarning
                      >
                        {greeting}
                      </motion.h2>
                    ) : (
                      <div className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl" />
                    )}
                    <p className="font-sans text-sm text-muted-foreground sm:text-base">
                      Ask me anything about Other Dev
                    </p>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                    {SUGGESTED_PROMPTS.map(suggestionItem => (
                      <SuggestionButton
                        key={suggestionItem.label}
                        display={suggestionItem.label}
                        prompt={suggestionItem.prompt}
                        sendMessage={sendMessage}
                        icon={suggestionItem.icon}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 w-screen h-30 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            <div className="space-y-4 container px-3 mt-12 md:mt-30 py-6 max-w-4xl mx-auto sm:space-y-6 sm:px-4 sm:py-8 md:px-12">
              {messages.map((message, index) =>
                message.role === 'user' ? (
                  <UserMessage key={message.id} message={message} />
                ) : status === 'streaming' && index === messages.length - 1 ? null : (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    setActiveArtifact={setActiveArtifact}
                  />
                )
              )}

              {(status === 'submitted' || status === 'streaming') && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Image
                    src="/otherdev-chat-logo-32.webp"
                    alt="Other Dev Loom"
                    width={32}
                    height={32}
                    className="h-6 w-6 flex-shrink-0 animate-spin sm:h-6 sm:w-6"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <div className="flex items-center gap-2 font-sans text-xs text-muted-foreground sm:text-sm">
                    <span className="text-sm">Thinking </span>
                    <div className="flex gap-1">
                      <div
                        className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                        style={{ animationDelay: '0ms' }}
                      />
                      <div
                        className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                        style={{ animationDelay: '150ms' }}
                      />
                      <div
                        className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>

      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 sm:bottom-32 right-4 sm:right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:opacity-90 active:scale-95 transition-all"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 w-full max-w-3xl mx-auto pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {inputError && (
            <div className="rounded-t-lg bg-red-100 px-3 py-2 text-sm text-destructive flex items-center justify-between pb-4 mb-[-8px]">
              <span>{inputError}</span>
              <button
                type="button"
                onClick={() => setInputError('')}
                className="ml-0.5 flex h-8 w-8 ml-auto items-center justify-center rounded-full hover:bg-foreground/10"
                aria-label="Remove error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {attachments.map((file, index) => (
            <AttachmentChip
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>

        <PromptInput className="relative rounded-2xl border-border shadow-sm pointer-events-auto">
          {recordingStream ? (
            <VoiceWaveform stream={recordingStream} />
          ) : (
            <PromptInputTextarea
              ref={inputRef}
              placeholder={placeholder}
              className={cn(
                'font-sans text-sm sm:text-base',
                suggestion &&
                  !inputValue &&
                  'placeholder:text-transparent placeholder:md:text-muted-foreground'
              )}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              autoFocus
            />
          )}
          {suggestion && !inputValue && (
            <button
              type="button"
              onClick={applySuggestion}
              className="absolute inset-2 bottom-auto h-[44px] pl-3 pt-2 font-sans text-sm text-muted-foreground hover:opacity-80 transition-opacity md:hidden overflow-hidden text-left"
            >
              {suggestion}
            </button>
          )}
          <PromptInputActions className="w-full justify-between">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.js,.ts,.json,.py"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <PromptInputAction tooltip="Attach file">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:opacity-70 transition-opacity sm:h-7 sm:w-7"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </PromptInputAction>
              <PromptInputAction tooltip="Use voice mode">
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isRecordingProcessing}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 sm:h-7 sm:w-7',
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'text-muted-foreground hover:opacity-70'
                  )}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? (
                    <Square className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                  ) : (
                    <AudioLines className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </PromptInputAction>
            </div>
            <PromptInputAction tooltip="Send message (Enter)">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSendDisabled}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] sm:h-8 sm:w-8',
                  isSendDisabled
                    ? 'bg-muted text-muted-foreground hover:opacity-70 disabled:opacity-50'
                    : 'bg-foreground text-background hover:opacity-90'
                )}
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  )
}
