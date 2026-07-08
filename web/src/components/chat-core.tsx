'use client'

import { useChat } from '@ai-sdk/react'
import { useStore } from '@nanostores/react'
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from 'ai'
import {
  Brain,
  Briefcase,
  ChevronRight,
  Code2,
  Copy,
  FileCode2,
  Globe,
  Paperclip,
  Pencil,
  RotateCcw,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { z } from 'zod'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import type { ArtifactToolCall } from '@/components/artifact-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/components/ui/copy-button'
import { SUGGESTED_PROMPTS } from '@/lib/constants'
import { suggestionDataSchema } from '@/lib/schemas'
import { cleanSuggestionMarkers, cn } from '@/lib/utils'
import {
  clearPersistedMessages,
  ensureChatId,
  loadChatMessagesFromStorage,
  loadPersistedMessages,
  persistMessages,
} from '@/stores/chat-persistence'
import {
  $followUpSuggestions,
  $inputError,
  $inputValue,
  $isDragging,
  $suggestion,
} from '@/stores/chat-ui'
import { processAttachment } from '@/lib/ai-sdk-attachments'
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message'
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from '@/components/ai-elements/attachments'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputButton,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
import { SpeechInput } from '@/components/ai-elements/speech-input'
import type { FileUIPart } from 'ai'

// Define custom data parts for the chat stream
type ChatDataParts = {
  suggestion: z.infer<typeof suggestionDataSchema>
}

type MessageMetadata = {
  suggestions?: string[]
}

export type ChatUIMessage = UIMessage<MessageMetadata, ChatDataParts>

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

function SuggestionButton({
  display,
  prompt,
  sendMessage,
  icon,
}: {
  display: string
  prompt: string
  sendMessage: (message: { text: string }) => void
  icon?: 'briefcase' | 'users' | 'code' | 'globe'
}) {
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
      onClick={() => sendMessage({ text: prompt })}
      className="h-auto justify-start rounded-xl bg-card p-4 text-left text-xs transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
    >
      <div className="flex items-start gap-3">
        {IconComponent && (
          <IconComponent className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1">{display}</span>
      </div>
    </Button>
  )
}

function UserMessage({
  message,
  isEditing,
  onEditConfirm,
  onEditCancel,
  onStartEdit,
}: {
  message: UIMessage
  isEditing?: boolean
  onEditConfirm?: (messageId: string, newText: string) => void
  onEditCancel?: (messageId: string) => void
  onStartEdit?: (messageId: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textContent =
    message.parts
      ?.filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') || ''

  const imageParts = (
    message.parts?.filter(p => p.type === 'file' && p.mediaType?.startsWith('image/')) as Array<{
      type: 'file'
      mediaType: string
      url: string
      filename?: string
    }>
  ) || []

  const fileParts = (
    message.parts?.filter(p => p.type === 'file' && !p.mediaType?.startsWith('image/')) as Array<{
      type: 'file'
      mediaType: string
      url: string
      filename?: string
    }>
  ) || []

  return (
    <Message from="user">
      <MessageContent>
        {imageParts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageParts.map((img, i) => (
              <Image
                key={`img-${i}-${img.url}`}
                src={img.url}
                alt={img.filename || 'Attachment'}
                width={192}
                height={192}
                className="max-h-48 max-w-48 rounded-xl object-cover"
                unoptimized
              />
            ))}
          </div>
        )}
        {fileParts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fileParts.map((file, i) => (
              <div
                key={`file-${i}-${file.filename || 'file'}`}
                className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="max-w-[180px] truncate">{file.filename || 'File'}</span>
              </div>
            ))}
          </div>
        )}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            defaultValue={textContent}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const target = e.currentTarget as HTMLTextAreaElement
                const newText = target.value.trim()
                if (newText) onEditConfirm?.(message.id, newText)
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                onEditCancel?.(message.id)
              }
            }}
            className="w-full rounded-2xl bg-background px-3 py-2 text-sm text-foreground sm:px-4 sm:py-3 sm:text-base resize-none min-h-[60px] max-h-[300px] overflow-y-auto border border-input"
            rows={3}
          />
        ) : (
          textContent.trim() && (
            <div className="px-3 py-2 text-sm text-foreground sm:px-4 sm:py-3 sm:text-base">
              {textContent}
            </div>
          )
        )}
      </MessageContent>
      {!isEditing && (
        <MessageActions>
          <MessageAction tooltip="Edit" onClick={() => onStartEdit?.(message.id)}>
            <Pencil className="h-3.5 w-3.5" />
          </MessageAction>
        </MessageActions>
      )}
      {isEditing && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEditConfirm?.(message.id, (textareaRef.current?.value ?? '').trim())}
            className="px-2 py-1 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90"
            aria-label="Confirm edit"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => onEditCancel?.(message.id)}
            className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80"
            aria-label="Cancel edit"
          >
            Cancel
          </button>
        </div>
      )}
    </Message>
  )
}

// Renders inside PromptInput, where usePromptInputAttachments context is available
function AttachmentChips() {
  const attachmentItems = usePromptInputAttachments()
  if (attachmentItems.files.length === 0) return null
  return (
    <Attachments variant="grid">
      {attachmentItems.files.map(file => (
        <Attachment
          key={file.id}
          data={{ ...file, id: file.id }}
          onRemove={() => attachmentItems.remove(file.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

function AssistantMessage({
  message,
  setActiveArtifact,
  isAnimating = false,
  onRegenerate,
}: {
  message: UIMessage
  setActiveArtifact: (artifact: ArtifactToolCall | null) => void
  isAnimating?: boolean
  onRegenerate?: (message: UIMessage) => void
}) {
  const textPart =
    message.parts
      ?.filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') || ''

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

  const reasoningParts = message.parts?.filter(p => p.type === 'reasoning') as Array<{
    type: 'reasoning'
    text: string
  }>
  const reasoningText = reasoningParts?.map(p => p.text).join('') || ''
  const hasReasoning = reasoningParts && reasoningParts.length > 0
  const hasArtifact = Boolean(artifactToolCall)

  const cleanedText = cleanSuggestionMarkers(textPart)

  const toolResultParts = (
    message.parts?.filter(part => part.type === 'tool-result' && isToolUIPart(part)) as Array<{
      type: `tool-${string}`
      toolCallId: string
      toolName: string
      state: string
      input?: unknown
      output?: unknown
    }>
  ) || []

  if (hasArtifact && artifactToolCall) {
    const artifactData = (
      artifactToolCall.state === 'output-available'
        ? artifactToolCall.output
        : artifactToolCall.input
    ) as { title: string; code: string; description: string; success?: boolean } | undefined
    const title = artifactData?.title

    return (
      <Message from="assistant">
        <MessageContent>
          {hasReasoning && (
            <Reasoning isStreaming={isAnimating}>
              <ReasoningTrigger />
              <ReasoningContent>{reasoningText}</ReasoningContent>
            </Reasoning>
          )}
          {cleanedText && <MessageResponse isAnimating={isAnimating}>{cleanedText}</MessageResponse>}
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
        </MessageContent>
        <MessageActions>
          <MessageAction tooltip="Regenerate" onClick={() => onRegenerate?.(message)}>
            <RotateCcw className="h-3.5 w-3.5" />
          </MessageAction>
        </MessageActions>
      </Message>
    )
  }

  return (
    <Message from="assistant">
      <MessageContent>
        {hasReasoning && (
          <Reasoning isStreaming={isAnimating}>
            <ReasoningTrigger />
            <ReasoningContent>{reasoningText}</ReasoningContent>
          </Reasoning>
        )}
        {toolResultParts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {toolResultParts.map((part, i) => {
              const toolName = part.toolName
              const isKnowledge = toolName === 'retrieveKnowledge'
              return (
                <div
                  key={`tool-${part.toolName}-${i}`}
                  className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <span>{isKnowledge ? 'Knowledge retrieved' : `Tool: ${toolName}`}</span>
                </div>
              )
            })}
          </div>
        )}
        {cleanedText && <MessageResponse isAnimating={isAnimating}>{cleanedText}</MessageResponse>}
      </MessageContent>
      <MessageActions>
        <MessageAction tooltip="Copy response">
          <CopyButton content={cleanedText} copyMessage="Copied response to clipboard">
            <Copy className="h-3.5 w-3.5" />
          </CopyButton>
        </MessageAction>
        <MessageAction tooltip="Regenerate" onClick={() => onRegenerate?.(message)}>
          <RotateCcw className="h-3.5 w-3.5" />
        </MessageAction>
      </MessageActions>
    </Message>
  )
}

export interface ChatCoreProps {
  onArtifactOpen?: (artifact: ArtifactToolCall | null) => void
  onClear?: () => void
  activeArtifact?: ArtifactToolCall | null
  className?: string
  showGreeting?: boolean
}

export function ChatCore({
  onArtifactOpen,
  onClear,
  activeArtifact: _externalActiveArtifact,
  className,
  showGreeting = true,
}: ChatCoreProps) {
  const [_internalActiveArtifact, setInternalActiveArtifact] = useState<ArtifactToolCall | null>(
    null
  )
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  // UI state from nanostores
  const suggestion = useStore($suggestion)
  const followUpSuggestions = useStore($followUpSuggestions)
  const inputError = useStore($inputError)
  const isDragging = useStore($isDragging)

  const [chatId, setChatId] = useState<string>('')
  useEffect(() => {
    const id = ensureChatId()
    setChatId(id)
  }, [])

  // Load persisted messages once on mount; useChat reads this as initialMessages
  useEffect(() => {
    loadChatMessagesFromStorage()
  }, [])

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const setActiveArtifact = onArtifactOpen ?? setInternalActiveArtifact

  const greeting = useTimeBasedGreeting()

  const { messages, sendMessage, status, setMessages, addToolOutput } = useChat<ChatUIMessage>({
    id: chatId,
    initialMessages: typeof window !== 'undefined' ? loadPersistedMessages<UIMessage>() : [],
    throttle: 50,
    dataPartSchemas: {
      suggestion: suggestionDataSchema,
    },
    transport: new DefaultChatTransport({
      api: '/api/chat/stream',
      body: {
        supportsArtifacts: true,
      },
      prepareSendMessagesRequest({ messages: msgs, extraBody }) {
        return {
          body: {
            id: chatId,
            message: msgs[msgs.length - 1],
            messages: msgs,
            supportsArtifacts: true,
            trigger: extraBody?.trigger ?? ('submit-user-message' as const),
          },
        }
      },
    }),
    async onToolCall({ toolCall }) {
      if (toolCall.dynamic) {
        return
      }
      if (toolCall.toolName === 'createArtifact') {
        addToolOutput({
          tool: 'createArtifact',
          toolCallId: toolCall.toolCallId,
          output: toolCall.input,
        })
      }
    },
  })

  useEffect(() => {
    if (messages.length > 0) {
      persistMessages(messages)
    }
  }, [messages])

  const _handleClear = useCallback(() => {
    setMessages([])
    clearPersistedMessages()
    $suggestion.set('')
    $followUpSuggestions.set([])
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    onClear?.()
  }, [setMessages, onClear])

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    const suggestions = (lastAssistant?.metadata as MessageMetadata | undefined)?.suggestions
    if (suggestions?.length) {
      $followUpSuggestions.set(suggestions)
    }
  }, [messages])

  const handleEditCancel = (_messageId: string) => {
    setEditingMessageId(null)
  }

  const handleEditConfirm = async (messageId: string, newText: string) => {
    if (!newText.trim()) {
      setEditingMessageId(null)
      return
    }

    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const editedMsg: ChatUIMessage = {
      ...messages[messageIndex],
      parts: messages[messageIndex].parts?.map(p => {
        if (p.type === 'text') return { ...p, text: newText.trim() }
        return p
      }) as ChatUIMessage['parts'],
    }

    const updatedMessages = messages.slice(0, messageIndex + 1)
    updatedMessages[messageIndex] = editedMsg

    setEditingMessageId(null)
    $suggestion.set('')

    await handleSubmitWithMessages(updatedMessages, editedMsg)
  }

  const handleRegenerate = async (message: UIMessage) => {
    const messageIndex = messages.findIndex(m => m.id === message.id)
    if (messageIndex === -1) return

    const updatedMessages = messages.slice(0, messageIndex)
    setMessages(updatedMessages as ChatUIMessage[])
    setEditingMessageId(null)
    $inputValue.set('')
    $suggestion.set('')

    await handleSubmitWithMessages(updatedMessages as ChatUIMessage[])
  }

  // Upload files and send message
  const handleSubmitWithMessages = async (msgs: ChatUIMessage[], editedUserMsg?: ChatUIMessage) => {
    const lastMsg = editedUserMsg ?? msgs[msgs.length - 1]
    const messageText =
      editedUserMsg?.parts
        ?.filter(p => p.type === 'text')
        .map(p => p.text)
        .join(' ')
        .trim() ?? ''

    if (messageText) {
      sendMessage(
        {
          role: 'user',
          parts: [{ type: 'text' as const, text: messageText }],
        },
        {
          body: {
            id: chatId,
            message: lastMsg,
            messages: msgs,
            trigger: editedUserMsg ? ('edit-message' as const) : ('submit-user-message' as const),
            messageId: lastMsg.id,
            supportsArtifacts: true,
          },
        }
      )
    }

    $suggestion.set('')
  }

  const applyFollowUp = (text: string) => {
    $inputValue.set(text)
    $followUpSuggestions.set([])
    inputRef.current?.focus()
  }

  // AI Elements PromptInput submit handler
  const handlePromptSubmit = async (message: { text: string; files: FileUIPart[] }) => {
    const hasText = Boolean(message.text.trim())
    const hasFiles = message.files && message.files.length > 0
    if (!hasText && !hasFiles) return

    // Process attachments (upload to R2 or convert)
    const attachmentsToSend = hasFiles
      ? await Promise.all(
          message.files.map(async f => {
            if (f.url?.startsWith('blob:')) {
              const res = await fetch(f.url)
              const blob = await res.blob()
              const file = new File([blob], f.filename || 'file', { type: f.mediaType })
              return processAttachment(file)
            }
            return {
              url: f.url ?? '',
              base64: '',
              name: f.filename || 'file',
              contentType: f.mediaType,
            }
          })
        )
      : []

    const fileParts = attachmentsToSend.map(a => ({
      type: 'file' as const,
      mediaType: a.contentType,
      url: a.url,
      filename: a.name,
    }))

    sendMessage(
      {
        role: 'user',
        parts: [
          ...fileParts,
          ...(hasText ? [{ type: 'text' as const, text: message.text }] : []),
        ],
      },
      {
        body: {
          id: chatId,
          message: messages[messages.length - 1],
          messages,
          trigger: 'submit-user-message' as const,
          supportsArtifacts: true,
        },
      }
    )

    $suggestion.set('')
  }

  // SpeechInput transcription callback — sends audio to /api/transcribe and returns transcript
  const handleTranscription = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) throw new Error('Transcription failed')

    let fullTranscript = ''
    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body is not readable')

    const decoder = new TextDecoder()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      // SSE lines: data: {"type":"transcript-chunk","content":"..."}
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        try {
          const json = JSON.parse(trimmed.slice(5))
          if (json.type === 'transcript-chunk' && typeof json.content === 'string') {
            fullTranscript += json.content
            $inputValue.set(fullTranscript)
          } else if (json.type === 'transcript-complete' && typeof json.content === 'string') {
            fullTranscript = json.content
            $inputValue.set(fullTranscript)
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    return fullTranscript
  }, [])

  // Drag and drop on the region
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    $isDragging.set(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      $isDragging.set(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    $isDragging.set(false)
  }

  const isStreaming = status === 'streaming'

  return (
    <div
      role="region"
      aria-label="Chat messages"
      className={cn('relative h-full flex flex-col bg-background', className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="border-2 border-dashed border-foreground/30 rounded-2xl p-8 sm:p-12">
            <div className="flex flex-col items-center gap-3 text-foreground/70">
              <Paperclip className="h-10 w-10 sm:h-12 sm:w-12" />
              <span className="text-base sm:text-lg font-medium">Drop files to attach</span>
            </div>
          </div>
        </div>
      )}

      <Conversation>
        <ConversationContent className="flex-1 scroll-smooth pb-32 sm:pb-40">
          {messages.length === 0 && showGreeting && (
            <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8 mt-40">
              <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
                <div className="space-y-3 text-center sm:space-y-4">
                  <div className="flex justify-center">
                    <Image
                      src="/otherdev-chat-logo-32.webp"
                      alt=""
                      width={32}
                      height={32}
                      className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  {greeting ? (
                    <h2
                      key={greeting}
                      className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                      suppressHydrationWarning
                    >
                      {greeting}
                    </h2>
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

          <div className="space-y-4 container px-3 mt-12 md:mt-30 py-6 max-w-4xl mx-auto sm:space-y-6 sm:px-4 sm:py-8 md:px-12">
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <UserMessage
                  key={message.id}
                  message={message}
                  isEditing={message.id === editingMessageId}
                  onEditConfirm={handleEditConfirm}
                  onEditCancel={handleEditCancel}
                  onStartEdit={id => setEditingMessageId(id)}
                />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  setActiveArtifact={setActiveArtifact}
                  isAnimating={isStreaming && index === messages.length - 1}
                  onRegenerate={handleRegenerate}
                />
              )
            )}

            {status === 'submitted' && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Brain className="h-6 w-6 flex-shrink-0 text-muted-foreground animate-pulse" />
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
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 w-full max-w-3xl mx-auto pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {inputError && (
            <div className="rounded-t-lg bg-red-100 px-3 py-2 text-sm text-destructive flex items-center justify-between pb-4 mb-2">
              <span>{inputError}</span>
              <button
                type="button"
                onClick={() => $inputError.set('')}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10"
                aria-label="Remove error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {followUpSuggestions.length > 0 && (
            <Suggestions className="pb-1">
              {followUpSuggestions.map(q => (
                <Suggestion
                  key={q}
                  suggestion={q}
                  onClick={applyFollowUp}
                  className="max-w-[200px] truncate"
                />
              ))}
            </Suggestions>
          )}
        </div>

        <PromptInput
          className="relative rounded-2xl border-border shadow-sm pointer-events-auto"
          onSubmit={handlePromptSubmit}
          accept="image/*,.pdf,.txt,.md,.js,.ts,.json,.py"
          multiple
        >
          <PromptInputHeader>
            <AttachmentChips />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              ref={inputRef}
              placeholder="Type your message…"
              className="font-sans text-sm sm:text-base"
              autoFocus
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton tooltip={{ content: 'Attach file', shortcut: '⌘K' }}>
                <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
              </PromptInputButton>
              <SpeechInput
                onTranscriptionChange={text => {
                  $inputValue.set(text)
                  inputRef.current?.focus()
                }}
                onAudioRecorded={handleTranscription}
                className="h-9 w-9 sm:h-10 sm:w-10"
              />
            </PromptInputTools>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
