/** @jsxImportSource react */
import { useState, useRef, useEffect } from 'react'
import { cn } from '../lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatWidgetProps {
  apiUrl?: string
}

export function ChatWidget({ apiUrl = '/api/chat/stream' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setSuggestion(null)

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error('Network response was not ok')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk
        }
      }

      // Parse suggestion from SUGGESTION: marker
      const suggestionMatch = assistantMessage.match(/\n?\s*SUGGESTION:\s*(.+)$/i)
      const cleanContent = assistantMessage
        .replace(/\n?\s*SUGGESTION:[\s\S]*$/i, '')
        .trim()

      if (suggestionMatch) {
        setSuggestion(suggestionMatch[1].trim())
      }

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cleanContent,
        },
      ])
    } catch (error) {
      console.error('[ChatWidget] Error:', error)
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8',
          'h-14 w-14 md:h-12 md:w-12',
          'flex border items-center justify-center rounded-full shadow-sm bg-white',
          'hover:opacity-80 hover:scale-110 transition-all focus:outline-none'
        )}
        aria-label="Open chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2C6.477 2 2 6.045 2 11c0 2.012 1.057 3.82 2.709 5.034-.033.314-.033.628-.033.942 0 3.866 3.186 7 7.324 7 3.103 0 5.803-1.78 6.896-4.364.195-.46.683-.828 1.104-.828 2.333 0 3.9-2.097 3.9-4.534 0-.86-.28-1.673-.776-2.37C22.22 5.01 21.16 3.82 19.79 3.82c-.39 0-.777.076-1.145.22" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-[320px] sm:w-[360px] h-[480px] bg-white border border-stone-200 rounded-lg shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div>
          <h3 className="text-[11px] font-twk font-normal text-[#686868]">other dev AI</h3>
          <p className="text-[10px] font-twk text-[#999]">Ask me anything</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[#686868] hover:text-black transition-colors"
          aria-label="Close chat"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 4L4 12M4 4l8 8" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[11px] font-twk text-[#686868]">
              Hi! I&apos;m the Other Dev AI assistant. Ask me about our projects, services, or technologies.
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'text-[11px] font-twk leading-[14px]',
              msg.role === 'user'
                ? 'text-right text-[#686868]'
                : 'text-left text-[#333]'
            )}
          >
            <span>{msg.content}</span>
          </div>
        ))}
        {isLoading && (
          <div className="text-left">
            <span className="text-[11px] font-twk text-[#686868] animate-pulse">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion */}
      {suggestion && (
        <button
          type="button"
          onClick={() => {
            setInput(suggestion)
            setSuggestion(null)
          }}
          className="mx-4 mb-2 px-3 py-1.5 text-[10px] font-twk text-[#686868] bg-stone-100 rounded hover:bg-stone-200 transition-colors text-left"
        >
          {suggestion}
        </button>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about our work..."
            className="flex-1 text-[11px] font-twk px-3 py-2 border border-stone-200 rounded focus:outline-none focus:border-stone-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-black text-white text-[10px] font-twk rounded hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
