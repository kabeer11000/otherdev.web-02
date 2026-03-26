"use client";

import type { ToolCallMessagePart } from "@assistant-ui/react";
import {
  AssistantIf,
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAssistantApi,
  useMessage,
} from "@assistant-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  AudioLines,
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Paperclip,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtifactRenderer } from "@/components/artifact-renderer";
import { Navigation } from "@/components/navigation";
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
import { VoiceWaveform } from "@/components/voice-waveform";
import { SUGGESTED_PROMPTS } from "@/lib/constants";
import { parseSSEStream } from "@/lib/sse";
import { useOtherDevRuntime } from "@/lib/otherdev-runtime";
import { cleanSuggestionMarkers, cn } from "@/lib/utils";
import { VoiceRecorder } from "@/lib/voice-recorder";
import { CREATE_ARTIFACT_TOOL_NAME } from "@/server/lib/artifact-tool";

const GREETINGS: { range: [number, number]; options: string[] }[] = [
  {
    range: [0, 5],
    options: [
      "Hello, night owl",
      "Burning the midnight oil?",
      "Still up, I see",
      "Late night inspiration strike?",
      "Welcome back, creative soul",
    ],
  },
  {
    range: [5, 9],
    options: [
      "Good morning",
      "Early riser mode on",
      "Fresh start ahead",
      "Ready to create?",
    ],
  },
  {
    range: [9, 12],
    options: [
      "Good morning",
      "Morning, let's make something great",
      "What's on your mind today?",
      "Feeling creative?",
    ],
  },
  {
    range: [12, 17],
    options: [
      "Good afternoon",
      "Afternoon vibes",
      "Still grinding?",
      "How's the day treating you?",
    ],
  },
  {
    range: [17, 21],
    options: [
      "Good evening",
      "Evening, creator",
      "Golden hour thinking time",
      "Winding down or gearing up?",
    ],
  },
  {
    range: [21, 24],
    options: [
      "Good night",
      "Late night magic hour",
      "Night mode activated",
      "Quiet hours for the best ideas",
    ],
  },
];

function pickGreeting() {
  const hour = new Date().getHours();
  const bucket =
    GREETINGS.find(({ range: [min, max] }) => hour >= min && hour < max) ??
    GREETINGS[0];
  return bucket.options[Math.floor(Math.random() * bucket.options.length)];
}

function useTimeBasedGreeting() {
  const [greeting, setGreeting] = useState(pickGreeting);
  const lastHourRef = useRef(new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      if (hour === lastHourRef.current) return;
      lastHourRef.current = hour;
      setGreeting(pickGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return greeting;
}

// ✅ Hook to subscribe to composer state changes reactively
function useComposerState(api: ReturnType<typeof useAssistantApi>) {
  const [state, setState] = useState(() => api.composer().getState());

  useEffect(() => {
    setState(api.composer().getState());
    const unsubscribe = api.composer().subscribe?.((newState) => {
      setState(newState);
    });
    return () => unsubscribe?.();
  }, [api]);

  return state;
}

// ✅ Hook for scroll-to-bottom button visibility
function useScrollToBottom(containerRef: React.RefObject<HTMLElement>) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show button when scrolled up more than 100px from bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check

    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef]);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [containerRef]);

  return { showButton, scrollToBottom };
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
      className="h-auto justify-start rounded-xl bg-card p-4 text-left text-xs transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] hover:shadow-md active:scale-[0.98] sm:p-4 sm:text-sm whitespace-normal break-words"
    >
      {display}
    </Button>
  );
}

function UserMessage() {
  const message = useMessage();
  const custom = message.metadata?.custom as
    | { images?: { url: string }[]; fileTexts?: string[] }
    | undefined;
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
                // biome-ignore lint/performance/noImgElement: base64 data URL
                <img
                  key={i}
                  src={img.url}
                  alt="Attachment"
                  className="max-h-48 max-w-48 rounded-xl object-cover"
                />
              ))}
            </div>
          )}
          {fileNames.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {fileNames.map((name) => (
                <div
                  key={name}
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
      </Message>
    </div>
  );
}

function AssistantMessage({
  setActiveArtifact,
}: {
  setActiveArtifact: (artifact: ToolCallMessagePart | null) => void;
}) {
  const message = useMessage();
  const contentRef = useRef<HTMLDivElement>(null);

  const textPart = message.content.find((part) => part.type === "text");
  const toolCallPart = message.content.find(
    (part) => part.type === "tool-call",
  ) as ToolCallMessagePart | undefined;
  const reasoning = message.metadata?.custom?.reasoning as string | undefined;
  const hasToolCall = Boolean(toolCallPart);

  const cleanedText =
    textPart?.type === "text" ? cleanSuggestionMarkers(textPart.text) : "";

  const getHtmlContent = () => contentRef.current?.innerHTML;

  if (hasToolCall && toolCallPart) {
    const artifactArgs = toolCallPart.args as
      | { title: string; description: string }
      | undefined;

    return (
      <div className="flex justify-start mt-12">
        <Message className="w-full max-w-full gap-2 sm:gap-3 lg:max-w-5xl">
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
        />
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

function AttachmentChip() {
  const api = useAssistantApi();
  const state = api.attachment().getState();
  const isRunning = state.status.type === "running";
  const isError = state.status.type === "incomplete";
  const isImage = state.type === "image";
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const file = (state as { file?: File }).file;
    if (!isImage || !file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isImage, state]);

  return (
    <div className="relative flex group items-center gap-1.5 border rounded-t-xl pb-4 mb-[-10px] bg-accent px-2 py-1.5 text-xs text-accent-foreground">
      {isImage && previewUrl ? (
        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-background">
          {/* biome-ignore lint/performance/noImgElement: object URL preview */}
          <img
            src={previewUrl}
            alt={state.name}
            className={cn(
              "h-full w-full object-contain transition-opacity",
              isRunning && "opacity-40"
            )}
          />
          {/* ✅ Grey overlay during upload */}
          {isRunning && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            </div>
          )}
        </div>
      ) : (
        <FileText className="h-6 w-6 shrink-0 opacity-70" />
      )}
      <span className="truncate">{state.name}</span>
      {isRunning && (
        <div className="h-4 w-4 ml-auto animate-spin rounded-full border border-foreground/30 border-t-foreground/80" />
      )}
      {isError && <span className="ml-auto font-medium text-destructive">!</span>}
      {!isRunning && (
        <button
          type="button"
          onClick={() => api.attachment().remove()}
          className="ml-0.5 flex h-8 w-8 ml-auto items-center justify-center rounded-full hover:bg-foreground/10"
          aria-label={`Remove ${state.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function OtherDevLoomThread({
  setActiveArtifact,
}: {
  setActiveArtifact: (artifact: ToolCallMessagePart | null) => void;
}) {
  const api = useAssistantApi();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(
    null,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingProcessing, setIsRecordingProcessing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const greeting = useTimeBasedGreeting();

  const composerState = useComposerState(api);
  const attachments = composerState.attachments;
  const hasUploadingAttachment = attachments.some(
    (a) => (a as any).status?.type === "running"
  );

  // ✅ Scroll-to-bottom logic
  const { showButton, scrollToBottom } = useScrollToBottom(contentRef);

  const handleTranscriptReceived = (text: string) => {
    setInputValue(text);
    inputRef.current?.focus();
  };

  const handleStartRecording = async () => {
    try {
      setIsRecordingProcessing(true);
      const stream = await VoiceRecorder.requestMicrophone();
      const recorder = new VoiceRecorder(stream);
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingStream(stream);
      setIsRecordingProcessing(false);
    } catch (error) {
      setInputError(
        error instanceof Error ? error.message : "Failed to access microphone",
      );
      setIsRecordingProcessing(false);
    }
  };

  const handleStopRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    try {
      setIsRecordingProcessing(true);
      const audioBlob = await recorder.stop();
      recorder.release();
      recorderRef.current = null;
      setIsRecording(false);
      setRecordingStream(null);

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Transcription failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is not readable");

      let fullTranscript = "";
      await parseSSEStream(reader, (event) => {
        if (
          event.type === "transcript-chunk" &&
          typeof event.content === "string"
        ) {
          fullTranscript += event.content;
          handleTranscriptReceived(fullTranscript);
        } else if (
          event.type === "transcript-complete" &&
          typeof event.content === "string"
        ) {
          handleTranscriptReceived(event.content);
        }
      });

      setIsRecordingProcessing(false);
    } catch (error) {
      setInputError(
        error instanceof Error ? error.message : "Transcription error",
      );
      recorderRef.current?.release();
      recorderRef.current = null;
      setIsRecording(false);
      setRecordingStream(null);
      setIsRecordingProcessing(false);
    }
  };

  const handleSubmit = () => {
    if (isRecording || isRecordingProcessing || hasUploadingAttachment) return;

    const value = inputValue.trim();
    const hasValidAttachments = attachments.length > 0 && !hasUploadingAttachment;
    
    if (!value && !hasValidAttachments) return;

    api.thread().append({
      role: "user",
      content: [{ type: "text", text: value || "" }],
    });

    setSuggestion("");
    setInputValue("");
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
    return () => inputElement.removeEventListener("keydown", handleKeyDown);
  }, [suggestion]);

  // ✅ Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [composerState.messages?.length, scrollToBottom]);

  const isSendDisabled = useMemo(() => {
    const hasText = inputValue.trim().length > 0;
    const hasValidAttachments = attachments.length > 0 && !hasUploadingAttachment;
    const isBlocked = isRecording || isRecordingProcessing || hasUploadingAttachment;
    return (!hasText && !hasValidAttachments) || isBlocked;
  }, [inputValue, attachments, hasUploadingAttachment, isRecording, isRecordingProcessing]);

  const placeholder = suggestion || "Type your message...";

  const AssistantMessageWithProps = () => (
    <AssistantMessage setActiveArtifact={setActiveArtifact} />
  );

  return (
    <div className="relative h-full flex flex-col bg-background">
      <ChatContainerRoot className="flex-1 w-full">
        <ChatContainerContent
          ref={contentRef as any}
          className="flex-1 scroll-smooth pb-32 sm:pb-40"
          suppressHydrationWarning
        >
          <ThreadPrimitive.Empty>
            <div className="flex h-full items-center justify-center p-4 sm:p-6 md:p-8 mt-40">
              <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
                <div className="space-y-3 text-center sm:space-y-4">
                  <div className="flex justify-center">
                    <Image
                      src="/otherdev-chat-logo.svg"
                      alt="OtherDev Loom"
                      width={32}
                      height={32}
                      className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                    />
                  </div>
                  {typeof window !== "undefined" && (
                    <motion.h2
                      key={greeting}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="font-sans text-2xl font-normal text-foreground sm:text-3xl md:text-4xl"
                    >
                      {greeting}
                    </motion.h2>
                  )}
                  <p className="font-sans text-sm text-muted-foreground sm:text-base">
                    Ask me anything about Other Dev
                  </p>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {SUGGESTED_PROMPTS.map((suggestionItem) => (
                    <SuggestionButton
                      key={suggestionItem.label}
                      display={suggestionItem.label}
                      prompt={suggestionItem.prompt}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ThreadPrimitive.Empty>

          <div className="absolute bottom-0 w-screen h-30 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          <div className="space-y-4 container px-3 mt-12 md:mt-30 py-6 max-w-4xl mx-auto sm:space-y-6 sm:px-4 sm:py-8 md:px-12">
            <ThreadPrimitive.Messages
              components={{ UserMessage, AssistantMessage: AssistantMessageWithProps }}
            />

            <ThreadPrimitive.If running>
              <div className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/otherdev-chat-logo.svg"
                  alt="OtherDev Loom"
                  width={32}
                  height={32}
                  className="h-6 w-6 flex-shrink-0 animate-spin sm:h-6 sm:w-6"
                />
                <div className="flex items-center gap-2 font-sans text-xs text-muted-foreground sm:text-sm">
                  <span className="text-sm">Thinking </span>
                  <div className="flex gap-1">
                    <div
                      className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground sm:h-1 sm:w-1"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            </ThreadPrimitive.If>
          </div>
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
      </ChatContainerRoot>

      {/* ✅ Scroll-to-bottom floating button */}
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
                onClick={() => setInputError("")}
                className="ml-0.5 flex h-8 w-8 ml-auto items-center justify-center rounded-full hover:bg-foreground/10"
                aria-label="Remove error message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <ComposerPrimitive.AttachmentDropzone className="relative data-[dragging]:ring-2 pointer-events-auto data-[dragging]:ring-foreground/20 data-[dragging]:rounded-2xl">
          <ComposerPrimitive.Attachments components={{ Attachment: AttachmentChip }} />
          <PromptInput
            className="relative rounded-2xl border-border shadow-sm pointer-events-auto"
            disabled={false}
            maxHeight={142}
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
                  suggestion &&
                  !inputValue &&
                  "placeholder:text-transparent placeholder:md:text-muted-foreground",
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
                  <ComposerPrimitive.AddAttachment asChild>
                    <button
                      type="button"
                      className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:opacity-70 transition-opacity sm:h-7 sm:w-7"
                      aria-label="Attach file"
                    >
                      <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </ComposerPrimitive.AddAttachment>
                </PromptInputAction>
                <PromptInputAction tooltip="Use voice mode">
                  <button
                    type="button"
                    onClick={
                      isRecording ? handleStopRecording : handleStartRecording
                    }
                    disabled={isRecordingProcessing}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 sm:h-7 sm:w-7",
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "text-muted-foreground hover:opacity-70",
                    )}
                    aria-label={
                      isRecording ? "Stop recording" : "Start recording"
                    }
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
                    "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] sm:h-8 sm:w-8",
                    isSendDisabled
                      ? "bg-muted text-muted-foreground hover:opacity-70 disabled:opacity-50"
                      : "bg-foreground text-background hover:opacity-90",
                  )}
                >
                  <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </ComposerPrimitive.AttachmentDropzone>
      </div>
    </div>
  );
}

function LoomPageInner({
  onClear,
  hasActiveArtifact,
}: {
  onClear: () => void;
  hasActiveArtifact: boolean;
}) {
  const api = useAssistantApi();

  const handleClear = useCallback(() => {
    onClear();
    api.composer().clearAttachments();
  }, [onClear, api]);

  return <Navigation isLoomPage={true} onClear={handleClear} hasActiveArtifact={hasActiveArtifact} />;
}

export function LoomPageClient({ noNavigation }: { noNavigation?: boolean }) {
  const runtime = useOtherDevRuntime();
  const [activeArtifact, setActiveArtifact] =
    useState<ToolCallMessagePart | null>(null);

  return (
    <>
      <AssistantRuntimeProvider runtime={runtime}>
        {noNavigation ? null : <LoomPageInner onClear={runtime.clear} hasActiveArtifact={!!activeArtifact} />}
        <main className="h-screen">
          <div className="flex h-full overflow-hidden">
            <div
              className={`h-full ${activeArtifact ? "hidden md:block md:w-1/2" : "w-full"}`}
            >
              <OtherDevLoomThread setActiveArtifact={setActiveArtifact} />
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
      </AssistantRuntimeProvider>
    </>
  );
}