"use client";

import type { ToolCallMessagePart } from "@assistant-ui/react";
import {
  AssistantIf,
  AssistantRuntimeProvider,
  MessagePrimitive,
  ThreadPrimitive,
  useAssistantApi,
  useMessage,
} from "@assistant-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, AudioLines, ChevronRight, File, FileCode2, FileText, Paperclip, Square, Upload, X } from "lucide-react";
import Image from "next/image";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArtifactRenderer } from "@/components/artifact-renderer";
import { Navigation } from "@/components/navigation";
import { useOtherDevRuntime } from "@/lib/use-otherdev-runtime";
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
import { encodeImageToBase64, extractTextFromFile, validateFile } from "@/lib/file-processor";
import { VoiceRecorder } from "@/lib/voice-recorder";
import { cn } from "@/lib/utils";
import { CREATE_ARTIFACT_TOOL_NAME } from "@/server/lib/artifact-tool";

interface ArtifactContextType {
  activeArtifact: ToolCallMessagePart | null;
  setActiveArtifact: (artifact: ToolCallMessagePart | null) => void;
}

const ArtifactContext = createContext<ArtifactContextType | null>(null);

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (!context) throw new Error("useArtifact must be used within ArtifactProvider");
  return context;
}

interface RuntimeContextType {
  suggestion: string;
  setSuggestion: (suggestion: string) => void;
  appendFileContent: (contentBlocks: any[]) => void;
  composedContent: any[];
}

const RuntimeContext = createContext<RuntimeContextType | null>(null);

export function useRuntimeContext() {
  const context = useContext(RuntimeContext);
  if (!context) throw new Error("useRuntimeContext must be used within RuntimeContextProvider");
  return context;
}

const GREETINGS: { range: [number, number]; options: string[] }[] = [
  { range: [0, 5], options: ["Hello, night owl", "Burning the midnight oil?", "Still up, I see", "Late night inspiration strike?", "Welcome back, creative soul"] },
  { range: [5, 9], options: ["Good morning", "Early riser mode on", "Fresh start ahead", "Ready to create?"] },
  { range: [9, 12], options: ["Good morning", "Morning, let's make something great", "What's on your mind today?", "Feeling creative?"] },
  { range: [12, 17], options: ["Good afternoon", "Afternoon vibes", "Still grinding?", "How's the day treating you?"] },
  { range: [17, 21], options: ["Good evening", "Evening, creator", "Golden hour thinking time", "Winding down or gearing up?"] },
  { range: [21, 24], options: ["Good night", "Late night magic hour", "Night mode activated", "Quiet hours for the best ideas"] },
];

function pickGreeting() {
  const hour = new Date().getHours();
  const bucket = GREETINGS.find(({ range: [min, max] }) => hour >= min && hour < max)!;
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

function SuggestionButton({ display, prompt }: { display: string; prompt: string }) {
  const api = useAssistantApi();

  const handleClick = () => {
    api.thread().append({ role: "user", content: [{ type: "text", text: prompt }] });
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
        <MessageAvatar src="/loom-avatar.svg" alt="User" fallback="U" className="h-12 w-12" />
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

  const cleanedText = textPart?.type === "text" ? cleanSuggestionMarkers(textPart.text) : "";

  const getHtmlContent = () => contentRef.current?.innerHTML;

  if (hasToolCall && toolCallPart) {
    const artifactArgs = toolCallPart.args as { title: string; description: string } | undefined;

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
                <MessageContent markdown className="max-w-none rounded-lg bg-transparent p-0">
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
                      <CardDescription className="mt-1 text-xs">Artifact · HTML</CardDescription>
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
        <AssistantIf condition={({ message }) => message.status?.type !== "running"}>
          <MessageAvatar
            src="/otherdev-chat-logo.svg"
            alt="OtherDev Loom"
            className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8"
          />
        </AssistantIf>
        <AssistantIf condition={({ message }) => message.status?.type === "running"}>
          <div className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
        </AssistantIf>
        <div className="flex-1 space-y-2 min-w-0">
          {reasoning && <ReasoningCollapsible reasoning={reasoning} />}
          {cleanedText && (
            <div ref={contentRef}>
              <MessageContent markdown className="max-w-none rounded-lg bg-transparent p-0">
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
  const { suggestion, setSuggestion, appendFileContent, composedContent } = useRuntimeContext();
  const api = useAssistantApi();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const dragCounterRef = useRef(0);

  const [inputValue, setInputValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<File, string>>(new Map());
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [fileError, setFileError] = useState("");
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingProcessing, setIsRecordingProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const greeting = useTimeBasedGreeting();

  useEffect(() => {
    const urls = new Map<File, string>();
    attachedFiles.filter((f) => f.type.startsWith("image/")).forEach((f) => {
      urls.set(f, URL.createObjectURL(f));
    });
    setImageUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [attachedFiles]);

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
      setFileError(error instanceof Error ? error.message : "Failed to process files");
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 5) {
      setFileError("Maximum 5 files allowed");
      return;
    }

    let totalSize = 0;
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setFileError(validation.error || "Invalid file");
        return;
      }
      totalSize += file.size;
      if (totalSize > 50 * 1024 * 1024) {
        setFileError("Total file size exceeds 50MB limit");
        return;
      }
      validFiles.push(file);
    }

    handleFilesSelected(validFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      setFileError(error instanceof Error ? error.message : "Failed to access microphone");
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

      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Transcription failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Response body is not readable");

      let fullTranscript = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "transcript-chunk") {
              fullTranscript += parsed.content;
              handleTranscriptReceived(fullTranscript);
            } else if (parsed.type === "transcript-complete") {
              handleTranscriptReceived(parsed.content);
            }
          } catch {}
        }
      }

      setIsRecordingProcessing(false);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Transcription error");
      recorderRef.current?.release();
      recorderRef.current = null;
      setIsRecording(false);
      setRecordingStream(null);
      setIsRecordingProcessing(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await handleFilesSelected(files);
  };

  const handleSubmit = () => {
    const value = inputValue.trim();
    if (!value && composedContent.length === 0) return;

    api.thread().append({
      role: "user",
      content: [{ type: "text", text: value || "" }],
    });

    setSuggestion("");
    setInputValue("");
    setAttachedFiles([]);
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
        (e.key === "Tab" || e.key === "ArrowRight") && suggestion && !inputElement.value;
      if (shouldApplySuggestion) {
        e.preventDefault();
        setInputValue(suggestion);
        setSuggestion("");
      }
    };

    inputElement.addEventListener("keydown", handleKeyDown);
    return () => inputElement.removeEventListener("keydown", handleKeyDown);
  }, [suggestion, setSuggestion]);

  const placeholder = suggestion || "Type your message...";

  const imageItems: { file: File; idx: number }[] = [];
  const otherItems: { file: File; idx: number }[] = [];
  attachedFiles.forEach((file, idx) => {
    if (file.type.startsWith("image/")) imageItems.push({ file, idx });
    else otherItems.push({ file, idx });
  });

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
            <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />

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
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2" style={{ animationDelay: "0ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2" style={{ animationDelay: "150ms" }} />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground sm:h-2 sm:w-2" style={{ animationDelay: "300ms" }} />
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
              <button onClick={() => setFileError("")} className="text-destructive hover:opacity-70 transition-opacity">
                ×
              </button>
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
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap items-end gap-2 pb-2 border-b border-border/50">
              {imageItems.map(({ file, idx }) => (
                <div key={`${file.name}-${idx}`} className="relative group">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted">
                    {imageUrls.get(file) && (
                      <img src={imageUrls.get(file)} alt={file.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {otherItems.map(({ file, idx }) => {
                const Icon = file.name.match(/\.(ts|tsx|js|jsx|py|json)$/i)
                  ? FileCode2
                  : file.name.match(/\.(txt|md|pdf)$/i)
                  ? FileText
                  : File;
                return (
                  <div key={`${file.name}-${idx}`} className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs text-accent-foreground">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.js,.ts,.json,.py"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isProcessingFiles}
          />
          <PromptInputActions className="w-full justify-between">
            <div className="flex gap-2">
              <PromptInputAction tooltip="Attach file">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFiles}
                  className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:opacity-70 transition-opacity disabled:opacity-50 sm:h-7 sm:w-7"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </PromptInputAction>
              <PromptInputAction tooltip="Use voice mode">
                <button
                  type="button"
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={isProcessingFiles || isRecordingProcessing}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.165,0.85,0.45,1)] active:scale-[0.98] disabled:opacity-50 sm:h-7 sm:w-7",
                    isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "text-muted-foreground hover:opacity-70",
                  )}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
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

export function LoomPageClient() {
  const runtime = useOtherDevRuntime();
  const [activeArtifact, setActiveArtifact] = useState<ToolCallMessagePart | null>(null);

  return (
    <>
      <Navigation
        isLoomPage={true}
        onClear={runtime.clear}
        hasActiveArtifact={!!activeArtifact}
      />
      <main className="h-screen">
        <AssistantRuntimeProvider runtime={runtime}>
          <RuntimeContext.Provider
            value={{
              suggestion: runtime.suggestion,
              setSuggestion: runtime.setSuggestion,
              appendFileContent: runtime.appendFileContent,
              composedContent: runtime.composedContent,
            }}
          >
            <ArtifactContext.Provider value={{ activeArtifact, setActiveArtifact }}>
              <div className="flex h-full overflow-hidden">
                <div className={`h-full ${activeArtifact ? "hidden md:block md:w-1/2" : "w-full"}`}>
                  <OtherDevLoomThread />
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
            </ArtifactContext.Provider>
          </RuntimeContext.Provider>
        </AssistantRuntimeProvider>
      </main>
    </>
  );
}
