"use client";

import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  useAssistantApi,
  AssistantIf,
} from "@assistant-ui/react";
import { Send, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { CopyButton } from "@/components/ui/copy-button";

const SUGGESTED_PROMPTS = [
  "What services does OtherDev offer?",
  "Tell me about your recent projects",
  "What technologies do you use?",
  "Where is OtherDev based?",
];

function SuggestionButton({ prompt }: { prompt: string }) {
  const api = useAssistantApi();

  const handleClick = () => {
    api.thread().append({ role: "user", content: [{ type: "text", text: prompt }] });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="h-auto justify-start rounded-xl border-[#00000015] bg-white p-4 text-left font-serif text-sm font-normal text-[#1a1a18] shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.035)] transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:bg-white hover:shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.05)] active:scale-[0.98] dark:border-[#ffffff15] dark:bg-[#1f1e1b] dark:text-[#eee] dark:hover:bg-[#1f1e1b]"
    >
      {prompt}
    </Button>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root>
      <div className="flex justify-end">
        <div className="flex max-w-[80%] items-start gap-3">
          <div className="flex-1 space-y-2">
            <div className="rounded-2xl bg-[#DDD9CE] px-4 py-3 font-serif text-[#1a1a18] dark:bg-[#393937] dark:text-[#eee]">
              <MessagePrimitive.Content />
            </div>
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ae5630]">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root>
      <div className="flex justify-start">
        <div className="flex max-w-[90%] items-start gap-3">
          <AssistantIf condition={({ message }) => message.status?.type !== "running"}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ae5630]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </AssistantIf>
          <AssistantIf condition={({ message }) => message.status?.type === "running"}>
            <div className="flex h-8 w-8 flex-shrink-0" />
          </AssistantIf>
          <div className="flex-1 space-y-2">
            <div className="text-card-foreground text-sm leading-relaxed prose dark:prose-invert prose-sm max-w-none font-serif">
              <MessagePrimitive.Content
                components={{
                  Text: (props) => (
                    <MarkdownRenderer>{props.text}</MarkdownRenderer>
                  ),
                }}
              />
            </div>
            <AssistantIf condition={({ thread }) => !thread.isRunning}>
              <div className="flex justify-start">
                <MessagePrimitive.Content
                  components={{
                    Text: (props) => (
                      <CopyButton
                        content={props.text}
                        copyMessage="Copied response to clipboard"
                      />
                    ),
                  }}
                />
              </div>
            </AssistantIf>
          </div>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

export function OtherDevLoomThread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-[#F5F5F0] dark:bg-[#2b2a27]">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth">
        <ThreadPrimitive.Empty>
          <div className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="rounded-full bg-[#ae5630] p-4">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="font-serif text-3xl font-normal text-[#1a1a18] dark:text-[#eee] md:text-4xl">
                  How can I help you today?
                </h2>
                <p className="font-serif text-base text-[#6b6a68] dark:text-[#9a9893]">
                  Ask me anything about OtherDev
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <SuggestionButton key={prompt} prompt={prompt} />
                ))}
              </div>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <div className="space-y-6 px-4 py-8 md:px-8">
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              AssistantMessage,
            }}
          />

          <ThreadPrimitive.If running>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#ae5630]">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div className="flex items-center gap-2 font-serif text-sm text-[#6b6a68] dark:text-[#9a9893]">
                <div className="flex gap-1">
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[#ae5630]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[#ae5630]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-[#ae5630]"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          </ThreadPrimitive.If>
        </div>
      </ThreadPrimitive.Viewport>

      <div className="border-t border-[#00000015] bg-white p-4 dark:border-[#ffffff15] dark:bg-[#1f1e1b]">
        <ComposerPrimitive.Root className="relative">
          <ComposerPrimitive.Input
            placeholder="Type your message..."
            className="w-full resize-none rounded-xl border border-[#00000015] bg-[#F5F5F0] px-4 py-3 pr-12 font-serif text-[#1a1a18] placeholder:text-[#6b6a68] focus:outline-none focus:ring-2 focus:ring-[#ae5630] focus:ring-offset-2 dark:border-[#ffffff15] dark:bg-[#2b2a27] dark:text-[#eee] dark:placeholder:text-[#9a9893]"
            rows={1}
            autoFocus
          />
          <ComposerPrimitive.Send className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#ae5630] text-white transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:bg-[#8d4526] active:scale-[0.98] disabled:opacity-50">
            <Send className="h-4 w-4" />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
