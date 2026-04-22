import {
  component$,
  useSignal,
  $,
  useVisibleTask$,
} from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { animate } from "motion";

import { Navigation } from "~/components/navigation";
import { UserMessage } from "~/components/user-message";
import { AssistantMessage } from "~/components/assistant-message";
import { PromptInput } from "~/components/prompt-input";
import { ScrollToBottomButton } from "~/components/scroll-to-bottom-button";
import { SuggestionButton } from "~/components/suggestion-button";
import { SUGGESTED_PROMPTS } from "~/lib/constants";
import { getGreeting } from "~/lib/greetings";
import { VoiceRecorder } from "~/lib/voice-recorder";
import { parseSSEStream, type SSEEvent } from "~/lib/sse";
import { processAttachment } from "~/lib/attachments";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  attachments?: File[];
  artifact?: {
    toolCallId: string;
    toolName: "createArtifact";
    state: "output-available";
    result: {
      title: string;
      code: string;
      description: string;
      success?: boolean;
    };
  };
  createdAt: Date;
}

export default component$(() => {
  const messages = useSignal<WidgetMessage[]>([]);
  const inputValue = useSignal("");
  const isLoading = useSignal(false);
  const isRecording = useSignal(false);
  const attachments = useSignal<File[]>([]);
  const suggestion = useSignal("");
  const activeArtifact = useSignal<WidgetMessage["artifact"] | null>(null);
  const showScrollButton = useSignal(false);
  const scrollContainerRef = useSignal<Element | undefined>(undefined);
  const greeting = useSignal("");
  const greetingKey = useSignal(0);
  const isGreetingVisible = useSignal(false);

  const chatIdRef = useSignal<string>("");

  // Load messages from localStorage on mount
  useVisibleTask$(() => {
    const stored = localStorage.getItem("loom-messages");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        messages.value = parsed.map((m: WidgetMessage & { createdAt?: string }) => ({
          ...m,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
      } catch {
        // Ignore
      }
    }

    const storedChatId = localStorage.getItem("loom-chat-id");
    chatIdRef.value = storedChatId || crypto.randomUUID();
    localStorage.setItem("loom-chat-id", chatIdRef.value);

    // Set greeting
    greeting.value = getGreeting();
    greetingKey.value = 0;
  });

  // Animate greeting when it changes
  useVisibleTask$(({ track }) => {
    track(() => greetingKey.value);
    if (!greeting.value || messages.value.length > 0) return;

    isGreetingVisible.value = true;
    const el = document.querySelector(".greeting-text") as HTMLElement | null;
    if (el) {
      animate(el as HTMLElement, { opacity: [0, 1], y: [8, 0] }, { duration: 0.4, ease: "easeOut" });
    }
  });

  // Persist messages to localStorage
  useVisibleTask$(({ track }) => {
    track(() => messages.value);
    if (messages.value.length > 0) {
      localStorage.setItem("loom-messages", JSON.stringify(messages.value));
    }
  });

  // Scroll tracking for scroll-to-bottom button
  useVisibleTask$(({ track }) => {
    track(() => showScrollButton.value);
    const container = scrollContainerRef.value;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      showScrollButton.value = !isNearBottom;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  });

  // Auto-scroll to bottom on new messages
  useVisibleTask$(({ track }) => {
    track(() => messages.value.length);
    const container = scrollContainerRef.value;
    if (container && !showScrollButton.value) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  });

  const scrollToBottom = $(() => {
    const container = scrollContainerRef.value;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  });

  const handleVoiceToggle = $(async () => {
    if (isRecording.value) {
      // Stop recording
      isRecording.value = false;
    } else {
      // Start recording
      try {
        const stream = await VoiceRecorder.requestMicrophone();
        const recorder = new VoiceRecorder(stream);
        recorder.start();
        isRecording.value = true;

        // Store recorder for stopping
        (window as unknown as { __voiceRecorder?: VoiceRecorder }).__voiceRecorder = recorder;
      } catch (err) {
        console.error("Microphone error:", err);
        isRecording.value = false;
      }
    }
  });

  const handleStopRecordingAndTranscribe = $(async () => {
    const recorder = (window as unknown as { __voiceRecorder?: VoiceRecorder }).__voiceRecorder;
    if (!recorder) return;

    try {
      const audioBlob = await recorder.stop();
      recorder.release();
      isRecording.value = false;

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Transcription failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      let transcript = "";
      await parseSSEStream(reader, (event: SSEEvent) => {
        if (event.type === "transcript-chunk" && typeof event.content === "string") {
          transcript += event.content;
          inputValue.value = transcript;
        } else if (event.type === "transcript-complete" && typeof event.content === "string") {
          inputValue.value = event.content;
        }
      });
    } catch (err) {
      console.error("Transcription error:", err);
    }
  });

  const handleAttach = $((files: File[]) => {
    attachments.value = [...attachments.value, ...files];
  });

  const handleRemoveAttachment = $((index: number) => {
    attachments.value = attachments.value.filter((_, i) => i !== index);
  });

  const handleSuggestionSelect = $((prompt: string) => {
    handleSubmit(prompt);
  });

  const handleSubmit = $(async (promptText?: string) => {
    const text = promptText || inputValue.value.trim();
    if (!text || isLoading.value) return;

    const userMessage: WidgetMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      attachments: attachments.value.length > 0 ? [...attachments.value] : undefined,
      createdAt: new Date(),
    };

    messages.value = [...messages.value, userMessage];
    inputValue.value = "";
    attachments.value = [];
    isLoading.value = true;
    suggestion.value = "";

    // Add placeholder for assistant response
    const assistantMessageId = crypto.randomUUID();
    messages.value = [
      ...messages.value,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      },
    ];

    try {
      // Process attachments if any
      let processedAttachments: Array<{
        type: "file";
        mediaType: string;
        url: string;
        filename: string;
      }> = [];

      if (userMessage.attachments && userMessage.attachments.length > 0) {
        processedAttachments = await Promise.all(
          userMessage.attachments.map(processAttachment)
        );
      }

      const body = {
        id: chatIdRef.value,
        message: {
          role: "user",
          parts: [
            ...processedAttachments.map((att) => ({
              type: "file" as const,
              data: att.url,
              mediaType: att.mediaType,
              filename: att.filename,
            })),
            { type: "text" as const, text: text },
          ],
        },
        supportsArtifacts: true,
      };

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.value.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      let assistantContent = "";
      let currentReasoning = "";

      await parseSSEStream(reader, (event: SSEEvent) => {
        if (event.type === "text" && typeof event.content === "string") {
          assistantContent += event.content;
        } else if (event.type === "reasoning") {
          currentReasoning = (event.content as string) || currentReasoning;
        } else if (event.type === "data-suggestion" && event.data && typeof (event.data as { suggestion?: string }).suggestion === "string") {
          suggestion.value = (event.data as { suggestion: string }).suggestion;
        }

        // Update the last message
        messages.value = [
          ...messages.value.slice(0, -1),
          {
            id: assistantMessageId,
            role: "assistant" as const,
            content: assistantContent,
            reasoning: currentReasoning || undefined,
            createdAt: new Date(),
          },
        ];
      });
    } catch (err) {
      console.error("Chat error:", err);
      messages.value = [
        ...messages.value.slice(0, -1),
        {
          id: assistantMessageId,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date(),
        },
      ];
    } finally {
      isLoading.value = false;
    }
  });

  const greetingEl = (
    <div class="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 mt-32 sm:mt-40">
      <div class="w-full max-w-2xl space-y-6 sm:space-y-8">
        <div class="space-y-3 text-center sm:space-y-4">
          <div class="flex justify-center">
            <img
              src="/otherdev-chat-logo-32.webp"
              alt="Other Dev Loom"
              width={32}
              height={32}
              class="h-7 w-7 sm:h-8 sm:w-8 object-contain"
            />
          </div>
          <h2 class="greeting-text font-[var(--twk-lausanne)] text-2xl font-normal text-foreground opacity-0 sm:text-3xl md:text-4xl">
            {greeting.value}
          </h2>
          <p class="font-[var(--twk-lausanne)] text-sm text-muted-foreground sm:text-base">
            Ask me anything about Other Dev
          </p>
        </div>

        <div class="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          {SUGGESTED_PROMPTS.map((s, i) => (
            <SuggestionButton
              key={i}
              label={s.label}
              prompt={s.prompt}
              icon={s.icon}
              onSelect$={handleSuggestionSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <main class="min-h-screen bg-background">
      <Navigation />

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        class="h-screen overflow-auto pb-32 sm:pb-40"
      >
        {messages.value.length === 0 && isGreetingVisible.value && greetingEl}

        {/* Messages */}
        <div class="container px-3 mt-12 md:mt-16 py-6 max-w-4xl mx-auto sm:px-4 sm:py-8 md:px-12 space-y-4">
          {messages.value.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <UserMessage
                  content={msg.content}
                  attachments={msg.attachments}
                />
              ) : (
                <AssistantMessage
                  content={msg.content}
                  reasoning={msg.reasoning}
                  artifact={msg.artifact}
                  setArtifact$={(artifact) => {
                    activeArtifact.value = artifact;
                  }}
                />
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading.value && messages.value.length > 0 && (
            <div class="flex items-center gap-2 sm:gap-3">
              <img
                src="/otherdev-chat-logo-32.webp"
                alt="Other Dev Loom"
                width={32}
                height={32}
                class="h-6 w-6 flex-shrink-0 animate-spin sm:h-6 sm:w-6"
              />
              <div class="flex items-center gap-2 font-[var(--twk-lausanne)] text-xs text-muted-foreground sm:text-sm">
                <span class="text-sm">Thinking </span>
                <div class="flex gap-1">
                  <div
                    class="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    class="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    class="h-1 w-1 animate-bounce rounded-full bg-muted-foreground"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      <ScrollToBottomButton
        visible={showScrollButton.value}
        onScroll$={scrollToBottom}
      />

      {/* Fixed input */}
      <div class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent p-3 sm:p-4 z-10">
        <div class="max-w-2xl mx-auto">
          <PromptInput
            value={inputValue}
            onSubmit$={handleSubmit}
            isRecording={isRecording}
            isLoading={isLoading}
            attachments={attachments}
            onAttach$={handleAttach}
            onRemoveAttachment$={handleRemoveAttachment}
            onVoiceToggle$={
              isRecording.value ? handleStopRecordingAndTranscribe : handleVoiceToggle
            }
          />
        </div>
      </div>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Loom | otherdev | AI Assistant",
  meta: [
    {
      name: "description",
      content:
        "Chat with Other Dev's AI assistant. Ask anything about our services, technologies, and company.",
    },
  ],
};
