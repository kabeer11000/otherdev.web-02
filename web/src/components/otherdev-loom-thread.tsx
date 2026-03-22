"use client";

import type { ToolCallMessagePart } from "@assistant-ui/react";
import {
  AssistantIf,
  MessagePrimitive,
  ThreadPrimitive,
  useAssistantApi,
  useMessage,
} from "@assistant-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ChevronRight, FileCode2, FileText, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useArtifact, useRuntimeContext } from "@/app/loom/page";

function useTimeBasedGreeting() {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      let greetings: string[] = [];

      if (hour >= 0 && hour < 5) {
        greetings = [
          "Hello, night owl",
          "Burning the midnight oil?",
          "Still up, I see",
          "Late night inspiration strike?",
          "Welcome back, creative soul",
        ];
      } else if (hour >= 5 && hour < 9) {
        greetings = [
          "Good morning",
          "Early riser mode on",
          "Fresh start ahead",
          "Ready to create?",
        ];
      } else if (hour >= 9 && hour < 12) {
        greetings = [
          "Good morning",
          "Morning, let's make something great",
          "What's on your mind today?",
          "Feeling creative?",
        ];
      } else if (hour >= 12 && hour < 17) {
        greetings = [
          "Good afternoon",
          "Afternoon vibes",
          "Still grinding?",
          "How's the day treating you?",
        ];
      } else if (hour >= 17 && hour < 21) {
        greetings = [
          "Good evening",
          "Evening, creator",
          "Golden hour thinking time",
          "Winding down or gearing up?",
        ];
      } else {
        greetings = [
          "Good night",
          "Late night magic hour",
          "Night mode activated",
          "Quiet hours for the best ideas",
        ];
      }

      const random = greetings[Math.floor(Math.random() * greetings.length)];
      setGreeting(random);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return greeting;
}
import { FileAttachmentButton } from "@/components/file-attachment-button";
import { FilePreview } from "@/components/file-preview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CopyButton } from "@/components/ui/copy-button";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { VoiceRecorderButton } from "@/components/voice-recorder-button";
import { VoiceWaveform } from "@/components/voice-waveform";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
import { encodeImageToBase64, extractTextFromFile } from "@/lib/file-processor";
import { cn } from "@/lib/utils";
import { CREATE_ARTIFACT_TOOL_NAME } from "@/server/lib/artifact-tool";

type ContentBlock =
  | { type: "image_url"; image_url: { url: string } }
  | { type: "text"; text: string };

function cleanSuggestionMarkers(content: string): string {
  return content.replace(/\s*SUGGESTION:[\s\S]*$/i, "").trim();
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
  );
}

function SuggestionButton({
  display,
  prompt,
}: {
  display: string;
  prompt: string;
}) {
  const api = useAssistantApi();

  const handleClick = () => {
    api
      .thread()
      .append({ role: "user", content: [{ type: "text", text: prompt }] });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="h-auto justify-start rounded-xl bg-card p-3 text-left font-sans text-xs font-normal text-foreground shadow-sm transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
    >
      {display}
    </Button>
  );
}

function UserMessage() {
  const message = useMessage();
  const custom = message.metadata?.custom as { images?: { url: string }[]; fileTexts?: string[] } | undefined;
  const images = custom?.images ?? [];
  const fileNames = (custom?.fileTexts ?? []).map((t) => {
    const match = t.match(/^\[File: (.+?)\]/);
    return match ? match[1] : "Attached file";
  });

  return (
    <div className="flex justify-end">
      <Message className="max-w-[95%] gap-2 sm:max-w-[85%] sm:gap-3 md:max-w-[80%]">
        <div className="flex flex-col gap-2">
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt="Attached image"
                  className="max-h-48 max-w-48 rounded-xl object-cover"
                />
              ))}
            </div>
          )}
          {fileNames.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {fileNames.map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="max-w-[180px] truncate">{name}</span>
                </div>
              ))}
            </div>
          )}
          {message.content.some((p) => p.type === "text" && p.text.trim()) && (
            <MessageContent className="rounded-2xl bg-accent px-3 py-2 text-sm text-accent-foreground sm:px-4 sm:py-3 sm:text-base">
              <MessagePrimitive.Content />
            </MessageContent>
          )}
        </div>
        <MessageAvatar
          src="/loom-avatar.svg"
          alt="User"
          fallback="U"
          className="h-12 w-12"
        />
      </Message>
    </div>
  );
}

function AssistantMessage() {
  const message = useMessage();
  const { setActiveArtifact } = useArtifact();
  const contentRef = useRef<HTMLDivElement>(null);

  const textPart = message.content.find((part) => part.type === "text");
  const toolCallPart = message.content.find(
    (part) => part.type === "tool-call",
  ) as ToolCallMessagePart | undefined;
  const reasoning = message.metadata?.custom?.reasoning as string | undefined;
  const hasToolCall = Boolean(toolCallPart);

  const cleanedText =
    textPart?.type === "text" ? cleanSuggestionMarkers(textPart.text) : "";

  const getHtmlContent = () => {
    if (contentRef.current) {
      return contentRef.current.innerHTML;
    }
    return undefined;
  };

  if (hasToolCall && toolCallPart) {
    const artifactArgs = toolCallPart.args as
      | { title: string; description: string }
      | undefined;

    return (
      <div className="flex justify-start">
        <Message className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl">
          <MessageAvatar
            src="/otherdev-chat-logo.svg"
            alt="OtherDev Loom"
            className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
          />
          <div className="flex-1 space-y-3 min-w-0">
            {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
            {cleanedText && (
              <div ref={contentRef}>
                <MessageContent
                  markdown
                  className="max-w-none rounded-lg bg-transparent p-0"
                >
                  {cleanedText}
                </MessageContent>
              </div>
            )}
            {toolCallPart.toolName === CREATE_ARTIFACT_TOOL_NAME && (
              <Card
                onClick={() => setActiveArtifact(toolCallPart)}
                className="w-full max-w-md cursor-pointer border-border/60 bg-card/50 transition-all duration-200 hover:border-foreground/20 hover:bg-card/80 hover:shadow-sm active:scale-[0.99]"
              >
                <CardHeader className="flex-row items-center justify-between gap-4 p-3.5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted/50">
                      <FileCode2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate text-sm font-medium leading-tight">
                        {artifactArgs?.title || "View Artifact"}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        Artifact · HTML
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
                </CardHeader>
              </Card>
            )}
          </div>
        </Message>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <Message className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl">
        <AssistantIf
          condition={({ message }) => message.status?.type !== "running"}
        >
          <MessageAvatar
            src="/otherdev-chat-logo.svg"
            alt="OtherDev Loom"
            className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
          />
        </AssistantIf>
        <AssistantIf
          condition={({ message }) => message.status?.type === "running"}
        >
          <div className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
        </AssistantIf>
        <div className="flex-1 space-y-2 min-w-0">
          {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
          {cleanedText && (
            <div ref={contentRef}>
              <MessageContent
                markdown
                className="max-w-none rounded-lg bg-transparent p-0"
              >
                {cleanedText}
              </MessageContent>
            </div>
          )}
          <AssistantIf condition={({ thread }) => !thread.isRunning}>
            {cleanedText && (
              <CopyButton
                content={cleanedText}
                htmlContent={getHtmlContent()}
                copyMessage="Copied response to clipboard"
              />
            )}
          </AssistantIf>
        </div>
      </Message>
    </div>
  );
}

export function OtherDevLoomThread() {
  const { suggestion, setSuggestion, appendFileContent, composedContent } =
    useRuntimeContext();
  const api = useAssistantApi();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [fileError, setFileError] = useState("");
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const greeting = useTimeBasedGreeting();

  const processAndAttachFiles = async (files: File[]) => {
    if (files.length === 0) {
      appendFileContent([]);
      return;
    }

    try {
      setFileError("");
      setIsProcessingFiles(true);
      const contentBlocks: ContentBlock[] = [];

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const dataUri = await encodeImageToBase64(file);
          contentBlocks.push({ type: "image_url", image_url: { url: dataUri } });
        } else {
          const text = await extractTextFromFile(file);
          contentBlocks.push({ type: "text", text: `[File: ${file.name}]\n${text}` });
        }
      }

      appendFileContent(contentBlocks);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process files";
      setFileError(message);
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    setAttachedFiles(files);
    await processAndAttachFiles(files);
  };

  const handleRemoveFile = async (index: number) => {
    const remaining = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(remaining);
    await processAndAttachFiles(remaining);
  };

  const handleTranscriptReceived = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const handleRecorderError = (error: string) => {
    setFileError(error);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFilesSelected(files);
    }
  };

  const handleSubmit = () => {
    const value = inputValue.trim();
    if (!value && composedContent.length === 0) return;

    // Only pass text through append() — images are already in composedContent
    // on the runtime and will be merged in onNew
    api.thread().append({
      role: "user",
      content: [{ type: "text", text: value || "" }],
    });

    setSuggestion("");
    setInputValue("");
    setAttachedFiles([]);
    // composedContent is cleared by onNew after use
  };

  const applySuggestion = () => {
    if (!suggestion) return;

    setInputValue(suggestion);
    setSuggestion("");
    inputRef.current?.focus();
  };

  useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const shouldApplySuggestion =
        (e.key === "Tab" || e.key === "ArrowRight") &&
        suggestion &&
        !inputElement.value;

      if (shouldApplySuggestion) {
        e.preventDefault();
        setInputValue(suggestion);
        setSuggestion("");
      }
    };

    inputElement.addEventListener("keydown", handleKeyDown);

    return () => {
      inputElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestion, setSuggestion]);

  const placeholder = suggestion || "Type your message...";

  return (
    <div
      className="relative h-full flex flex-col bg-background"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.165, 0.85, 0.45, 1] }}
              className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-foreground/20 bg-card/50 px-12 py-10"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Upload className="h-8 w-8 text-foreground/40" />
              </motion.div>
              <div className="text-center">
                <p className="font-sans text-sm font-medium text-foreground">Drop files to attach</p>
                <p className="mt-1 font-sans text-xs text-muted-foreground">Images, PDFs, code, and documents</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ChatContainerRoot className="flex-1 w-full">
        <ChatContainerContent
          className="flex-1 scroll-smooth pb-32 sm:pb-40"
          suppressHydrationWarning
        >
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
                  <motion.h2
                    key={greeting}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl"
                  >
                    {greeting}
                  </motion.h2>
                  <p className="font-sans text-sm text-muted-foreground sm:text-base">
                    Ask me anything about OtherDev
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {SUGGESTED_PROMPTS.map((suggestion) => (
                    <SuggestionButton
                      key={suggestion.label}
                      display={suggestion.label}
                      prompt={suggestion.prompt}
                    />
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
                  className="h-7 w-7 flex-shrink-0 animate-spin sm:h-8 sm:w-8"
                />
                <div className="flex items-center gap-2 font-sans text-xs text-muted-foreground sm:text-sm">
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
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>

      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4 w-full max-w-3xl mx-auto pointer-events-none">
        <div className="space-y-3 pointer-events-auto">
          {fileError && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between">
              <span>{fileError}</span>
              <button
                onClick={() => setFileError("")}
                className="text-destructive hover:opacity-70 transition-opacity"
              >
                ×
              </button>
            </div>
          )}

          {attachedFiles.length > 0 && (
            <div className="rounded-lg border border-border bg-card/50 p-3">
              <FilePreview files={attachedFiles} onRemove={handleRemoveFile} />
            </div>
          )}
        </div>

        <PromptInput
          className="relative rounded-2xl border-border shadow-sm pointer-events-auto"
          disabled={false}
          maxHeight={96}
          value={inputValue}
          onValueChange={setInputValue}
          onSubmit={handleSubmit}
        >
          {recordingStream ? (
            <VoiceWaveform stream={recordingStream} />
          ) : (
            <PromptInputTextarea
              ref={inputRef}
              placeholder={placeholder}
              className={cn(
                "font-sans text-sm sm:text-base",
                suggestion && !inputValue && "placeholder:text-transparent placeholder:md:text-muted-foreground",
              )}
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
              <PromptInputAction tooltip="Attach file">
                <FileAttachmentButton
                  onFilesSelected={handleFilesSelected}
                  disabled={isProcessingFiles}
                />
              </PromptInputAction>
              <PromptInputAction tooltip="Record voice message">
                <VoiceRecorderButton
                  onTranscript={handleTranscriptReceived}
                  onError={handleRecorderError}
                  onRecordingChange={(active, stream) =>
                    setRecordingStream(active && stream ? stream : null)
                  }
                  disabled={isProcessingFiles}
                />
              </PromptInputAction>
            </div>
            <PromptInputAction tooltip="Send message (Enter)">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!inputValue.trim() && composedContent.length === 0}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] sm:h-8 sm:w-8",
                  inputValue.trim() || composedContent.length > 0
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-muted text-muted-foreground hover:opacity-70 disabled:opacity-50",
                )}
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
