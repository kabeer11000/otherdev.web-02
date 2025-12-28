"use client";

import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  useAssistantApi,
  AssistantIf,
} from "@assistant-ui/react";
import { Send } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { CopyButton } from "@/components/ui/copy-button";
import { SUGGESTED_PROMPTS } from "@/lib/constants";

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
      className="h-auto justify-start rounded-xl bg-card p-4 text-left font-serif text-sm font-normal text-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98]"
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
            <div className="rounded-2xl bg-accent px-4 py-3 font-serif text-accent-foreground">
              <MessagePrimitive.Content />
            </div>
          </div>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback className="bg-muted font-serif text-sm text-muted-foreground">
              U
            </AvatarFallback>
          </Avatar>
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
            <Image
              src="/otherdev-chat-logo.svg"
              alt="OtherDev Loom"
              width={32}
              height={32}
              className="h-8 w-8 flex-shrink-0"
            />
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
    <ThreadPrimitive.Root className="flex h-full flex-col bg-background">
      <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth">
        <ThreadPrimitive.Empty>
          <div className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <Image
                    src="/otherdev-chat-logo.svg"
                    alt="OtherDev Loom"
                    width={32}
                    height={32}
                    className="h-8 w-8"
                  />
                </div>
                <h2 className="font-serif text-3xl font-normal text-foreground md:text-4xl">
                  How can I help you today?
                </h2>
                <p className="font-serif text-base text-muted-foreground">
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
              <Image
                src="/otherdev-chat-logo.svg"
                alt="OtherDev Loom"
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 animate-pulse"
              />
              <div className="flex items-center gap-2 font-serif text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          </ThreadPrimitive.If>
        </div>
      </ThreadPrimitive.Viewport>

      <div className="border-t border-border bg-card p-4">
        <ComposerPrimitive.Root className="relative">
          <ComposerPrimitive.Input
            placeholder="Type your message..."
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12 font-serif text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            rows={1}
            autoFocus
          />
          <ComposerPrimitive.Send className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
            <Send className="h-4 w-4" />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
