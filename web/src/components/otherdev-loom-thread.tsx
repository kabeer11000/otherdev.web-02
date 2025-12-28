"use client";

import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  useAssistantApi,
  AssistantIf,
  useMessage,
} from "@assistant-ui/react";
import type { ToolCallMessagePart } from "@assistant-ui/react";
import { Send, FileCode2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { CopyButton } from "@/components/ui/copy-button";
import { useArtifact } from "@/app/otherdevloom/page";
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
      className="h-auto justify-start rounded-xl bg-card p-3 text-left font-serif text-xs font-normal text-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
    >
      {prompt}
    </Button>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root>
      <div className="flex justify-end">
        <div className="flex max-w-[95%] items-start gap-2 sm:max-w-[85%] sm:gap-3 md:max-w-[80%]">
          <div className="break-words rounded-2xl bg-accent px-3 py-2 font-serif text-sm text-accent-foreground sm:px-4 sm:py-3 sm:text-base">
            <MessagePrimitive.Content />
          </div>
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback className="bg-muted font-serif text-xs text-muted-foreground sm:text-sm">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  const message = useMessage();
  const { setActiveArtifact } = useArtifact();
  const hasToolCall = message.content.some((part) => part.type === "tool-call");
  const textPart = message.content.find((part) => part.type === "text");
  const toolCallPart = message.content.find((part) => part.type === "tool-call") as
    | ToolCallMessagePart
    | undefined;

  if (hasToolCall) {
    const artifactArgs = toolCallPart?.args as
      | { title: string; description: string }
      | undefined;

    return (
      <MessagePrimitive.Root>
        <div className="flex justify-start">
          <div className="w-full max-w-[95%] space-y-3 sm:max-w-[90%] md:max-w-[85%]">
            <div className="flex items-start gap-2 sm:gap-3">
              <Image
                src="/otherdev-chat-logo.svg"
                alt="OtherDev Loom"
                width={32}
                height={32}
                className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
              />
              <div className="flex-1 space-y-3">
                {textPart && textPart.type === "text" && (
                  <div className="prose prose-sm max-w-none break-words font-serif text-sm leading-relaxed text-card-foreground dark:prose-invert sm:text-base">
                    <MarkdownRenderer>{textPart.text}</MarkdownRenderer>
                  </div>
                )}
                {toolCallPart && toolCallPart.toolName === "create_artifact" && (
                  <Button
                    variant="outline"
                    onClick={() => setActiveArtifact(toolCallPart)}
                    className="flex w-fit max-w-sm items-center gap-2 rounded-xl font-serif"
                  >
                    <FileCode2 className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <div className="break-words text-sm font-medium">
                        {artifactArgs?.title || "View Artifact"}
                      </div>
                      {artifactArgs?.description && (
                        <div className="break-words text-xs text-muted-foreground line-clamp-2">
                          {artifactArgs.description}
                        </div>
                      )}
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </MessagePrimitive.Root>
    );
  }

  return (
    <MessagePrimitive.Root>
      <div className="flex justify-start">
        <div className="flex w-full max-w-[95%] items-start gap-2 sm:max-w-[90%] sm:gap-3 md:max-w-[85%]">
          <AssistantIf condition={({ message }) => message.status?.type !== "running"}>
            <Image
              src="/otherdev-chat-logo.svg"
              alt="OtherDev Loom"
              width={32}
              height={32}
              className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
            />
          </AssistantIf>
          <AssistantIf condition={({ message }) => message.status?.type === "running"}>
            <div className="flex h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
          </AssistantIf>
          <div className="flex-1 space-y-2">
            <div className="prose prose-sm max-w-none break-words font-serif text-sm leading-relaxed text-card-foreground dark:prose-invert sm:text-base">
              <MessagePrimitive.Content
                components={{
                  Text: (props) => <MarkdownRenderer>{props.text}</MarkdownRenderer>,
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
      <ThreadPrimitive.Viewport className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth">
        <ThreadPrimitive.Empty>
          <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
              <div className="space-y-3 text-center sm:space-y-4">
                <div className="flex justify-center">
                  <Image
                    src="/otherdev-chat-logo.svg"
                    alt="OtherDev Loom"
                    width={32}
                    height={32}
                    className="h-7 w-7 sm:h-8 sm:w-8"
                  />
                </div>
                <h2 className="font-serif text-2xl font-normal text-foreground sm:text-3xl md:text-4xl">
                  How can I help you today?
                </h2>
                <p className="font-serif text-sm text-muted-foreground sm:text-base">
                  Ask me anything about OtherDev
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <SuggestionButton key={prompt} prompt={prompt} />
                ))}
              </div>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <div className="space-y-4 px-3 py-6 sm:space-y-6 sm:px-4 sm:py-8 md:px-8">
          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              AssistantMessage,
            }}
          />

          <ThreadPrimitive.If running>
            <div className="flex items-start gap-2 sm:gap-3">
              <Image
                src="/otherdev-chat-logo.svg"
                alt="OtherDev Loom"
                width={32}
                height={32}
                className="h-7 w-7 flex-shrink-0 animate-pulse sm:h-8 sm:w-8"
              />
              <div className="flex items-center gap-2 font-serif text-xs text-muted-foreground sm:text-sm">
                <div className="flex gap-1">
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          </ThreadPrimitive.If>
        </div>
      </ThreadPrimitive.Viewport>

      <div className="border-t border-border bg-card p-3 sm:p-4">
        <ComposerPrimitive.Root className="relative">
          <ComposerPrimitive.Input
            placeholder="Type your message..."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 pr-10 font-serif text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:px-4 sm:py-3 sm:pr-12 sm:text-base"
            rows={1}
            autoFocus
          />
          <ComposerPrimitive.Send className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:bottom-3 sm:right-3 sm:h-8 sm:w-8">
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
