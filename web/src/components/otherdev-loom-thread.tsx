'use client'

import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from '@/components/ai-elements/attachments'
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputProvider,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input'
import { SpeechInput } from '@/components/ai-elements/speech-input'
import { ArtifactRenderer } from '@/components/artifact-renderer'
import { Navigation } from '@/components/navigation'
import type { ArtifactToolCall } from '@/components/artifact-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SUGGESTED_PROMPTS } from '@/lib/constants'
import { cleanSuggestionMarkers } from '@/lib/utils'
import { processAttachment } from '@/lib/ai-sdk-attachments'
import type { FileUIPart } from 'ai'
import {
  Brain,
  Briefcase,
  Code2,
  FileCode2,
  Globe,
  Paperclip,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MessageMetadata = { suggestions?: string[] }
type ChatSource = { id: string; title: string; url?: string; description?: string }

// ponytail: DOMParser handles all HTML entities
const decodeXmlEntities = (value: string): string =>
  new DOMParser().parseFromString(value, 'text/html').body.textContent ?? ''

const getToolOutputText = (output: unknown): string =>
  output == null ? '' : typeof output === 'string' ? output : JSON.stringify(output)

function extractToolSources(toolName: string, output: unknown): ChatSource[] {
  const text = getToolOutputText(output)
  if (!text) return []

  if (toolName === 'tavilySearch') {
    return [...text.matchAll(/<result\s+title="([^"]*)"\s+url="([^"]*)">([\s\S]*?)<\/result>/g)]
      .flatMap((match, index) => {
        const title = decodeXmlEntities(match[1])
        const url = decodeXmlEntities(match[2])
        return title || url ? [{ id: `web-${index}-${match[2]}`, title, url, description: decodeXmlEntities(match[3]).trim() }] : []
      })
  }

  if (toolName === 'retrieveKnowledge') {
    return [...text.matchAll(/<document\s+index="([^"]*)"\s+relevance="([^"]*)"\s+title="([^"]*)">([\s\S]*?)<\/document>/g)]
      .flatMap((match, index) => {
        const title = decodeXmlEntities(match[3])
        return title ? [{ id: `rag-${match[1] || index}`, title, description: `${decodeXmlEntities(match[2])} relevance` }] : []
      })
  }

  return []
}

// ---------------------------------------------------------------------------
// Greeting (minimal)
// ---------------------------------------------------------------------------

// ponytail: flat object beats range arrays
const GREETINGS: Record<number, string[]> = {
  0: ['Hello, night owl', 'Burning the midnight oil?', 'Still up, I see', 'Late night inspiration strike?', 'Welcome back, creative soul'],
  5: ['Good morning', 'Early riser mode on', 'Fresh start ahead', 'Ready to create?'],
  9: ["Good morning", "Morning, let's make something great", "What's on your mind today?", 'Feeling creative?'],
  12: ['Good afternoon', 'Afternoon vibes', 'Still grinding?', "How's the day treating you?"],
  17: ['Good evening', 'Evening, creator', 'Golden hour thinking time', 'Winding down or gearing up?'],
  21: ['Good night', 'Late night magic hour', 'Night mode activated', 'Quiet hours for the best ideas'],
}

const pickGreeting = () => {
  const hour = new Date().getHours()
  const opts = GREETINGS[hour] ?? GREETINGS[0]
  return opts[Math.floor(Math.random() * opts.length)]
}

// ponytail: schedule to next hour boundary instead of polling every minute
function useTimeBasedGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    setGreeting(pickGreeting())
    const scheduleNext = () => {
      const now = new Date()
      const msUntilNextHour = (60 - now.getMinutes()) * 60000
      return setTimeout(() => {
        setGreeting(pickGreeting())
        timeoutRef.current = scheduleNext()
      }, msUntilNextHour)
    }
    let timeoutRef = { current: scheduleNext() }
    return () => clearTimeout(timeoutRef.current)
  }, [])

  return greeting
}

// ---------------------------------------------------------------------------
// LoomChat — direct AI Elements + AI SDK, no nanostores
// ---------------------------------------------------------------------------

function LoomChat({ onArtifactOpen }: { onArtifactOpen: (artifact: ArtifactToolCall | null) => void }) {
  const controller = usePromptInputController()

  const [isDragging, setIsDragging] = useState(false)
  const [inputError, setInputError] = useState('')
  const [chatId] = useState(() => crypto.randomUUID())

  const { messages, sendMessage, status } = useChat({
    id: chatId,
    throttle: 50,
    transport: new DefaultChatTransport({
      api: '/api/chat/stream',
      body: { supportsArtifacts: true },
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
  })

  const isStreaming = status === 'streaming'
  const greeting = useTimeBasedGreeting()

  // Derive suggestions from last assistant message metadata
  const suggestions = useMemo<MessageMetadata['suggestions']>(() => {
    const last = [...messages].reverse().find(m => m.role === 'assistant')
    return (last?.metadata as MessageMetadata | undefined)?.suggestions ?? []
  }, [messages])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handlePromptSubmit = useCallback(async ({ text, files }: { text: string; files: FileUIPart[] }) => {
    if (!text.trim() && !files.length) return

    const attachmentsToSend = files.length
      ? await Promise.all(
          files.map(async f => {
            if (f.url?.startsWith('blob:')) {
              const res = await fetch(f.url)
              const blob = await res.blob()
              const file = new File([blob], f.filename || 'file', { type: f.mediaType })
              return processAttachment(file)
            }
            return { url: f.url ?? '', base64: '', name: f.filename || 'file', contentType: f.mediaType }
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
          ...(text.trim() ? [{ type: 'text' as const, text: text }] : []),
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
  }, [chatId, messages, sendMessage])

  const handleTranscription = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
    if (!response.ok) throw new Error('Transcription failed')
    const { text } = await response.json()
    controller.textInput.setInput(text)
    return text
  }, [controller])

  const applyFollowUp = useCallback((text: string) => {
    controller.textInput.setInput(text)
    controller.attachments.clear()
  }, [controller])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) setIsDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }

  // ---------------------------------------------------------------------------
  // Message rendering
  // ---------------------------------------------------------------------------

  function UserMessage({ message }: { message: UIMessage }) {
    const textContent = message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || ''
    const imageParts = (message.parts?.filter(p => p.type === 'file' && p.mediaType?.startsWith('image/')) as Array<{ type: 'file'; mediaType: string; url: string; filename?: string }>) || []
    const fileParts = (message.parts?.filter(p => p.type === 'file' && !p.mediaType?.startsWith('image/')) as Array<{ type: 'file'; mediaType: string; url: string; filename?: string }>) || []

    return (
      <div className="flex items-end justify-end gap-2 sm:gap-3">
        <Message from="user" className="items-end">
          <MessageContent>
            {imageParts.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {imageParts.map((img, i) => (
                  <Image key={`img-${i}-${img.url}`} src={img.url} alt={img.filename || 'Attachment'}
                    width={192} height={192} className="max-h-48 max-w-48 rounded-xl object-cover" unoptimized />
                ))}
              </div>
            )}
            {fileParts.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2">
                {fileParts.map((file, i) => (
                  <div key={`file-${i}-${file.filename || 'file'}`}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    <span className="max-w-[180px] truncate">{file.filename || 'File'}</span>
                  </div>
                ))}
              </div>
            )}
            {textContent.trim() && (
              <div className="px-3 py-2 text-sm text-foreground sm:px-4 sm:py-3 sm:text-base">{textContent}</div>
            )}
          </MessageContent>
        </Message>
        <Image src="/loom-avatar-64.webp" alt="" width={32} height={32}
          className="h-7 w-7 flex-shrink-0 rounded-full sm:h-8 sm:w-8" />
      </div>
    )
  }

  function AssistantMessage({ message, isAnimating }: { message: UIMessage; isAnimating?: boolean }) {
    const textPart = message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || ''
    const reasoningParts = message.parts?.filter(p => p.type === 'reasoning') as Array<{ type: 'reasoning'; text: string }>
    const reasoningText = reasoningParts?.map(p => p.text).join('') || ''
    const hasReasoning = (reasoningParts?.length ?? 0) > 0

    const artifactToolCall = message.parts?.find(part => {
      if (!isToolUIPart(part)) return false
      const toolName = getToolName(part)
      return toolName === 'createArtifact' && (part.state === 'output-available' || part.state === 'input-available')
    }) as
      | { type: `tool-createArtifact`; toolCallId: string; state: 'output-available'; output: { title: string; code: string; description: string; success?: boolean } }
      | { type: `tool-createArtifact`; toolCallId: string; state: 'input-available'; input: { title: string; code: string; description: string } }
      | undefined

    const hasArtifact = Boolean(artifactToolCall)
    const cleanedText = cleanSuggestionMarkers(textPart)

    const toolResultParts = (message.parts?.filter(
      (part): part is Extract<UIMessage['parts'][number], { type: `tool-${string}` }> =>
        isToolUIPart(part) && part.state === 'output-available'
    ).map(part => ({ toolName: getToolName(part), output: part.output }))) ?? []
    const sources = toolResultParts.flatMap(part => extractToolSources(part.toolName, part.output))

    if (hasArtifact && artifactToolCall) {
      const artifactData = (artifactToolCall.state === 'output-available' ? artifactToolCall.output : artifactToolCall.input) as { title: string; code: string; description: string } | undefined
      return (
        <div className="flex items-start gap-2 sm:gap-3">
          <Image src="/otherdev-chat-logo-32.webp" alt="" width={32} height={32}
            className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" style={{ width: 'auto', height: 'auto' }} />
          <Message from="assistant">
            <MessageContent>
              {hasReasoning && (
                <Reasoning isStreaming={isAnimating}>
                  <ReasoningTrigger /><ReasoningContent>{reasoningText}</ReasoningContent>
                </Reasoning>
              )}
              {cleanedText && <MessageResponse isAnimating={isAnimating}>{cleanedText}</MessageResponse>}
              <Card onClick={() => {
                const result = artifactToolCall.state === 'output-available' ? artifactToolCall.output : artifactToolCall.input
                onArtifactOpen({
                  toolCallId: artifactToolCall.toolCallId,
                  toolName: 'createArtifact',
                  state: 'output-available',
                  // biome-ignore lint/suspicious/noExplicitAny: artifact result type
                  result: (result ?? artifactToolCall.output) as any,
                })
              }}
                className="w-full max-w-md cursor-pointer border-border/60 bg-card/50 transition-all duration-200 hover:border-foreground/20 hover:bg-card/80 hover:shadow-sm active:scale-[0.99]">
                <CardHeader className="flex-row items-center justify-between gap-4 p-3.5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/50">
                      <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm font-medium leading-tight">
                        {artifactData?.title || 'View Artifact'}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">Artifact · HTML</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </MessageContent>
          </Message>
        </div>
      )
    }

    return (
      <div className="flex items-start gap-2 sm:gap-3">
        <Image src="/otherdev-chat-logo-32.webp" alt="" width={32} height={32}
          className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" style={{ width: 'auto', height: 'auto' }} />
        <Message from="assistant">
          <MessageContent>
            {hasReasoning && (
              <Reasoning isStreaming={isAnimating}>
                <ReasoningTrigger /><ReasoningContent>{reasoningText}</ReasoningContent>
              </Reasoning>
            )}
            {sources.length > 0 && (
              <Sources>
                <SourcesTrigger count={sources.length} />
                <SourcesContent>
                  {sources.map(source =>
                    source.url ? (
                      <Source key={source.id} href={source.url} title={source.title}>
                        <span className="block max-w-[min(32rem,70vw)] truncate font-medium">{source.title || source.url}</span>
                      </Source>
                    ) : (
                      <div key={source.id} className="flex items-center gap-2 text-muted-foreground">
                        <span className="block max-w-[min(32rem,70vw)] truncate font-medium">{source.title}</span>
                        {source.description && <span>{source.description}</span>}
                      </div>
                    )
                  )}
                </SourcesContent>
              </Sources>
            )}
            {cleanedText && <MessageResponse isAnimating={isAnimating}>{cleanedText}</MessageResponse>}
          </MessageContent>
          <MessageActions>
            <MessageAction tooltip="Copy response" copyContent={cleanedText} />
          </MessageActions>
        </Message>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Chat messages"
      className="relative h-full flex flex-col bg-background"
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
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8 mt-40">
              <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
                <div className="space-y-3 text-center sm:space-y-4">
                  <div className="flex justify-center">
                    <Image src="/otherdev-chat-logo-32.webp" alt="" width={32} height={32}
                      className="h-7 w-7 sm:h-8 sm:w-8 object-contain" style={{ width: 'auto', height: 'auto' }} />
                  </div>
                  {greeting ? (
                    <h2 key={greeting}
                      className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                      suppressHydrationWarning>
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
                  {SUGGESTED_PROMPTS.map(suggestionItem => {
                    const IconComponent =
                      suggestionItem.icon === 'briefcase' ? Briefcase :
                      suggestionItem.icon === 'users' ? Users :
                      suggestionItem.icon === 'code' ? Code2 :
                      suggestionItem.icon === 'globe' ? Globe : undefined
                    return (
                      <Button
                        key={suggestionItem.label}
                        type="button"
                        variant="outline"
                        onClick={() => sendMessage({ role: 'user', parts: [{ type: 'text', text: suggestionItem.prompt }] })}
                        className="h-auto justify-start rounded-xl bg-card p-4 text-left text-xs transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
                      >
                        <div className="flex items-start gap-3">
                          {IconComponent && <IconComponent className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />}
                          <span className="flex-1">{suggestionItem.label}</span>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 container px-3 mt-12 md:mt-30 py-6 max-w-5xl mx-auto sm:space-y-6 sm:px-4 sm:py-8 md:px-8 lg:px-10">
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  isAnimating={isStreaming && index === messages.length - 1}
                />
              )
            )}

            {status === 'submitted' && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Brain className="h-6 w-6 flex-shrink-0 text-muted-foreground animate-pulse" />
                <div className="flex items-center gap-2 font-sans text-xs text-muted-foreground sm:text-sm">
                  <span className="text-sm">Thinking </span>
                  <div className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <div key={delay}
                        className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 w-full max-w-4xl mx-auto pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {inputError && (
            <div className="rounded-t-lg bg-red-100 px-3 py-2 text-sm text-destructive flex items-center justify-between pb-4 mb-2">
              <span>{inputError}</span>
              <button type="button" onClick={() => setInputError('')}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full hover:bg-foreground/10"
                aria-label="Remove error message">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {suggestions.length > 0 && (
            <Suggestions className="pb-1">
              {suggestions.map(q => (
                <Suggestion key={q} suggestion={q} onClick={applyFollowUp} />
              ))}
            </Suggestions>
          )}
        </div>

        <PromptInput
          className="relative rounded-2xl border-border pointer-events-auto [&_[data-slot=input-group]]:bg-background/80 dark:[&_[data-slot=input-group]]:bg-background/75 [&_[data-slot=input-group]]:shadow-lg [&_[data-slot=input-group]]:shadow-black/10 [&_[data-slot=input-group]]:backdrop-blur-xl"
          onSubmit={handlePromptSubmit}
          accept="image/*,.pdf,.txt,.md,.js,.ts,.json,.py"
          multiple
        >
          <PromptInputHeader>
            {controller.attachments.files.length > 0 && (
              <Attachments variant="grid">
                {controller.attachments.files.map(file => (
                  <Attachment
                    key={file.id}
                    data={{ ...file, id: file.id }}
                    onRemove={() => controller.attachments.remove(file.id)}
                  >
                    <AttachmentPreview />
                    <AttachmentRemove />
                  </Attachment>
                ))}
              </Attachments>
            )}
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Type your message…"
              className="font-sans text-sm sm:text-base"
              autoFocus
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton
                tooltip={{ content: 'Attach file', shortcut: '⌘K' }}
                onClick={() => controller.attachments.openFileDialog()}
              >
                <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
              </PromptInputButton>
              <SpeechInput
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

// ---------------------------------------------------------------------------
// LoomPageClient — thin orchestrator with PromptInputProvider
// ---------------------------------------------------------------------------

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
  const [activeArtifact, setActiveArtifact] = useState<ArtifactToolCall | null>(null)

  return (
    <PromptInputProvider>
      {noNavigation ? null : (
        <LoomPageInner onClear={() => {}} hasActiveArtifact={!!activeArtifact} />
      )}
      <main className="h-screen">
        <div className="flex h-full overflow-hidden">
          <div className={`h-full ${activeArtifact ? 'hidden md:block md:w-1/2' : 'w-full'}`}>
            <LoomChat onArtifactOpen={setActiveArtifact} />
          </div>
          {activeArtifact && (
            <div className="h-full w-full md:w-1/2">
              <ArtifactRenderer
                toolCall={activeArtifact}
                mode="panel"
                onClose={() => setActiveArtifact(null)}
              />
            </div>
          )}
        </div>
      </main>
    </PromptInputProvider>
  )
}
