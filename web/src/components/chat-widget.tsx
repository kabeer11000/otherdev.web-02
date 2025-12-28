'use client';

import { useState, useCallback, useEffect } from 'react';
import { MessageCircle, X, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type Message } from '@/components/ui/chat-message';
import { CopyButton } from '@/components/ui/copy-button';
import { MessageInput } from '@/components/ui/message-input';
import { MessageList } from '@/components/ui/message-list';
import { PromptSuggestions } from '@/components/ui/prompt-suggestions';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { cn } from '@/lib/utils';

const SUGGESTED_PROMPTS = [
  'What services does OtherDev offer?',
  'Tell me about your recent projects',
  'What technologies do you use?',
  'Where is OtherDev based?',
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const lastMessage = messages.at(-1);
  const isEmpty = messages.length === 0;
  const isTyping = lastMessage?.role === 'user';

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const messageContent = input.trim();
    if (!messageContent || isGenerating) return;

    setInput('');
    setError(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      createdAt: new Date(),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new Error(
            `Too many requests. Please try again in ${retryAfter} seconds.`
          );
        }
        throw new Error('Failed to get response. Please try again.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let assistantMessage = '';
      const assistantMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsGenerating(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantMessage += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIdx = newMessages.length - 1;
                  if (newMessages[lastIdx]?.role === 'assistant') {
                    newMessages[lastIdx].content = assistantMessage;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      setIsGenerating(false);
    } catch (err) {
      console.error('Chat error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
      setMessages((prev) => prev.slice(0, -1));
      setIsGenerating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const append = (message: { role: 'user'; content: string }) => {
    setInput(message.content);
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  const stop = useCallback(() => {
    setIsGenerating(false);
  }, []);

  const messageOptions = useCallback(
    (message: Message) => ({
      actions: message.role === 'assistant' ? (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ) : undefined,
    }),
    []
  );

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-lg transition-all hover:scale-110 hover:opacity-80"
        aria-label="Open chat"
      >
        <Image
          src="/otherdev-chat-logo.svg"
          alt="OtherDev AI"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed flex flex-col shadow-2xl border overflow-hidden bg-card",
        "inset-0 rounded-none",
        "sm:inset-4 sm:rounded-2xl sm:max-w-[90vw] sm:max-h-[calc(100vh-2rem)]",
        "md:w-96 md:h-[600px] md:max-h-[calc(100vh-4rem)]"
      )}
      style={{
        zIndex: 9999,
        ...(isMounted && window.innerWidth >= 768 ? {
          top: 'auto',
          left: 'auto',
          bottom: '1.5rem',
          right: '1.5rem'
        } : {})
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Chat with OtherDev</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages Container */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden">
        {isEmpty && append ? (
          <div className="flex items-center justify-center p-4">
            <PromptSuggestions
              label="Ask me anything about OtherDev"
              append={append}
              suggestions={SUGGESTED_PROMPTS}
            />
          </div>
        ) : (
          <div
            className="grid grid-cols-1 overflow-y-auto px-4 py-3"
            ref={containerRef}
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
          >
            <div className="max-w-full [grid-column:1/1] [grid-row:1/1]">
              <MessageList
                messages={messages}
                isTyping={isTyping && isGenerating}
                messageOptions={messageOptions}
              />
            </div>

            {!shouldAutoScroll && (
              <div className="pointer-events-none flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
                <div className="sticky bottom-0 left-0 flex w-full justify-end">
                  <Button
                    onClick={scrollToBottom}
                    className="pointer-events-auto mb-2 mr-2 h-8 w-8 rounded-full animate-in fade-in-0 slide-in-from-bottom-1"
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t border-neutral-200 bg-red-50 px-4 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-neutral-200 p-4">
        <form onSubmit={handleSubmit}>
          <MessageInput
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isGenerating}
            isGenerating={isGenerating}
            stop={stop}
            onSubmit={handleSubmit}
            maxLength={500}
          />
        </form>
        <p className="mt-1 text-xs text-neutral-500">
          {input.length}/500 characters
        </p>
      </div>
    </Card>
  );
}
