'use client'

import { ConversationProvider, useConversationStatus } from '@elevenlabs/react'
import { useStore } from '@nanostores/react'
import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback } from 'react'
import { ConversationBar } from '@/components/ui/conversation-bar'
import type { AgentState } from '@/components/ui/orb'
import { Z_INDEX } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { $agentOpen, closeActiveWidget, openAgent } from '@/stores/widgets'

const OrbButton = dynamic(() => import('@/components/ui/orb-button').then(mod => mod.OrbButton), {
  ssr: false,
  loading: () => <div className="h-10 w-10" />,
})

interface AgentWidgetProps {
  agentId?: string
  avatarUrl?: string
  className?: string
}

export function AgentWidget({ agentId, avatarUrl, className }: AgentWidgetProps) {
  const isOpen = useStore($agentOpen)

  const handleOpen = useCallback(() => {
    if (!agentId) return
    openAgent()
  }, [agentId])

  const handleClose = useCallback(() => {
    closeActiveWidget()
  }, [])

  if (!agentId) {
    return (
      <>
        {!isOpen && (
          <button
            type="button"
            onClick={handleOpen}
            className={cn(
              'fixed bottom-20 right-4 sm:bottom-24 sm:right-6 md:bottom-28 md:right-8',
              'h-14 w-14 md:h-12 md:w-12',
              'flex items-center justify-center rounded-full shadow-md',
              'bg-primary text-primary-foreground',
              'hover:opacity-90 hover:scale-110 active:scale-95',
              'transition-all focus:outline-none duration-200',
              className
            )}
            style={{ zIndex: Z_INDEX.chatButton - 1 }}
            aria-label="Open sales assistant"
          >
            <div className="h-10 w-10 md:h-9 md:w-9">
              <OrbButton agentState={null} className="h-full w-full" />
            </div>
          </button>
        )}
        {isOpen && <AgentWidgetNoConfig onClose={handleClose} />}
      </>
    )
  }

  return (
    <ConversationProvider>
      <AgentWidgetInner
        agentId={agentId}
        avatarUrl={avatarUrl}
        isOpen={isOpen}
        onOpen={handleOpen}
        onClose={handleClose}
        className={className}
      />
    </ConversationProvider>
  )
}

interface AgentWidgetInnerProps {
  agentId: string
  avatarUrl?: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  className?: string
}

function AgentWidgetInner({
  agentId,
  avatarUrl,
  isOpen,
  onOpen,
  onClose,
  className,
}: AgentWidgetInnerProps) {
  const { status, isSpeaking, isListening } = useConversationStatus()

  const agentState: AgentState =
    status === 'connected'
      ? isSpeaking
        ? 'talking'
        : isListening
          ? 'listening'
          : null
      : status === 'connecting'
        ? 'thinking'
        : null

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={onOpen}
          className={cn(
            'fixed bottom-20 right-4 sm:bottom-24 sm:right-6 md:bottom-28 md:right-8',
            'h-14 w-14 md:h-12 md:w-12',
            'flex items-center justify-center rounded-full shadow-md',
            'bg-primary text-primary-foreground',
            'hover:opacity-90 hover:scale-110 active:scale-95',
            'transition-all focus:outline-none duration-200',
            className
          )}
          style={{ zIndex: Z_INDEX.chatButton - 1 }}
          aria-label="Open sales assistant"
        >
          <div className="h-10 w-10 md:h-9 md:w-9">
            <OrbButton agentState={agentState} className="h-full w-full" />
          </div>
        </button>
      )}

      {isOpen && <AgentWidgetPanel agentId={agentId} avatarUrl={avatarUrl} onClose={onClose} />}
    </>
  )
}

interface AgentWidgetNoConfigProps {
  onClose: () => void
}

function AgentWidgetNoConfig({ onClose }: AgentWidgetNoConfigProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 sm:inset-4 sm:rounded-2xl sm:max-w-[90vw] sm:max-h-[calc(100vh-2rem)]',
        'md:inset-[unset] md:bottom-8 md:right-8 md:w-[420px] md:h-[600px] md:max-h-[calc(100vh-4rem)]',
        'bg-background border rounded-none sm:rounded-2xl shadow-2xl',
        'flex flex-col overflow-hidden',
        'animate-[slideInFromBottom_0.3s_ease-out_forwards]',
        'z-[60]'
      )}
    >
      <div className="flex-shrink-0 flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
            <div className="h-5 w-5">
              <OrbButton agentState={null} className="h-full w-full" />
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-foreground">Sales Assistant</h3>
            <p className="text-xs text-muted-foreground">Offline</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none hover:opacity-80 transition-opacity cursor-pointer p-1"
          aria-label="Close assistant"
        >
          <X className="h-5 w-5 text-foreground" strokeWidth={2} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground text-sm p-8">
          <p className="mb-2">Agent ID not configured.</p>
          <p className="text-xs">
            Set{' '}
            <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_ELEVENLABS_AGENT_ID</code> in
            your environment.
          </p>
        </div>
      </div>
    </div>
  )
}

interface AgentWidgetPanelProps {
  agentId: string
  avatarUrl?: string
  onClose: () => void
}

function AgentWidgetPanel({ agentId, avatarUrl, onClose }: AgentWidgetPanelProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 sm:inset-4 sm:rounded-2xl sm:max-w-[90vw] sm:max-h-[calc(100vh-2rem)]',
        'md:inset-[unset] md:bottom-8 md:right-8 md:w-[420px] md:h-[600px] md:max-h-[calc(100vh-4rem)]',
        'bg-background border rounded-none sm:rounded-2xl shadow-2xl',
        'flex flex-col overflow-hidden',
        'animate-[slideInFromBottom_0.3s_ease-out_forwards]',
        'z-[60]'
      )}
    >
      <div className="flex-shrink-0 flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Agent" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <div className="h-5 w-5">
                <OrbButton agentState={null} className="h-full w-full" />
              </div>
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-foreground">Sales Assistant</h3>
            <ConversationStatusIndicator />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none hover:opacity-80 transition-opacity cursor-pointer p-1"
          aria-label="Close assistant"
        >
          <X className="h-5 w-5 text-foreground" strokeWidth={2} />
        </button>
      </div>

      <AgentConversation agentId={agentId} />
    </div>
  )
}

function ConversationStatusIndicator() {
  const { status, isSpeaking, isListening } = useConversationStatus()

  const statusConfig = {
    idle: { label: 'Ready', color: 'bg-muted-foreground/30', animate: false },
    connecting: { label: 'Connecting...', color: 'bg-yellow-500', animate: true },
    connected: {
      label: isSpeaking ? 'Speaking' : isListening ? 'Listening...' : 'Online',
      color: isSpeaking
        ? 'bg-green-500'
        : isListening
          ? 'bg-yellow-500 animate-pulse'
          : 'bg-green-400',
      animate: isListening,
    },
    error: { label: 'Error', color: 'bg-red-500', animate: false },
  }

  const config = statusConfig[status] ?? statusConfig.idle

  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {config.animate && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75 animate-ping" />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', config.color)} />
      </span>
      {config.label}
    </p>
  )
}

interface AgentConversationProps {
  agentId: string
}

function AgentConversation({ agentId }: AgentConversationProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1" />
      <div className="border-t p-4">
        <ConversationBar agentId={agentId} className="w-full" />
      </div>
    </div>
  )
}
