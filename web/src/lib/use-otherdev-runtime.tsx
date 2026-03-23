"use client";

import type {
  AppendMessage,
  TextMessagePart,
  ThreadAssistantMessage,
  ThreadMessage,
  ToolCallMessagePart,
} from "@assistant-ui/react";
import { useExternalStoreRuntime } from "@assistant-ui/react";
import { useCallback, useRef, useState } from "react";
import { useLocalStorageMessages } from "@/hooks/use-local-storage-messages";
import type { ContentBlock } from "@/lib/content-types";
import { parseSSEStream } from "@/lib/sse";

const LOOM_STORAGE_KEY = "otherdev-loom-messages";

type ContentPart = TextMessagePart | ToolCallMessagePart;
type MessageStatus = ThreadAssistantMessage["status"];

/**
 * AppendableContentPart is an alias for ContentBlock, representing
 * content that can be appended from file attachments (text and image blocks).
 */
export type AppendableContentPart = ContentBlock;

function serializeLoomMessages(messages: ThreadMessage[]): string {
  return JSON.stringify(
    messages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt.toISOString(),
    })),
  );
}

function deserializeLoomMessages(data: string): ThreadMessage[] {
  const parsed = JSON.parse(data);
  return parsed.map((msg: ThreadMessage & { createdAt: string }) => ({
    ...msg,
    createdAt: new Date(msg.createdAt),
  }));
}

function buildContentParts(
  text: string,
  toolCalls: ToolCallMessagePart[],
): ContentPart[] {
  const parts: ContentPart[] = [];
  if (text) {
    parts.push({ type: "text" as const, text });
  }
  parts.push(...toolCalls);
  return parts;
}

function createAssistantMessage(
  id: string,
  content: ContentPart[],
  status: MessageStatus,
  customMetadata: Record<string, unknown> = {},
): ThreadAssistantMessage {
  return {
    id,
    role: "assistant",
    content,
    createdAt: new Date(),
    status,
    metadata: {
      unstable_state: null,
      unstable_annotations: [],
      unstable_data: [],
      steps: [],
      custom: customMetadata,
    },
  };
}

export function useOtherDevRuntime() {
  const { messages, setMessages } = useLocalStorageMessages<ThreadMessage>({
    key: LOOM_STORAGE_KEY,
    serialize: serializeLoomMessages,
    deserialize: deserializeLoomMessages,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [composedContent, setComposedContent] = useState<
    AppendableContentPart[]
  >([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const textContent = message.content.find((part) => part.type === "text");
      const hasImages = composedContent.some((b) => b.type === "image_url");

      // Store only text in the thread message — assistant-ui can't render image_url parts
      // Images and file text blocks are kept in metadata for API serialization
      const imageUrls = composedContent
        .filter((b) => b.type === "image_url")
        .map(
          (b) =>
            (b as { type: "image_url"; image_url: { url: string } }).image_url,
        );

      const fileTexts = composedContent
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text);

      const userMessage: ThreadMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: textContent ? [textContent] : [],
        createdAt: new Date(),
        attachments: [],
        metadata: {
          custom: { hasImageContent: hasImages, images: imageUrls, fileTexts },
        },
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsRunning(true);
      setComposedContent([]);

      abortControllerRef.current = new AbortController();
      const assistantMessageId = `assistant-${Date.now()}`;
      let messageAdded = false;

      try {
        const apiMessages = messages.concat(userMessage).map((msg) => {
          const text = msg.content.find((c) => c.type === "text");
          const custom = msg.metadata?.custom as
            | { images?: { url: string }[]; fileTexts?: string[] }
            | undefined;
          const storedImages = custom?.images ?? [];
          const storedFileTexts = custom?.fileTexts ?? [];

          if (storedImages.length > 0 || storedFileTexts.length > 0) {
            const inputText = text && text.type === "text" ? text.text : "";
            const combinedText = [...storedFileTexts, inputText]
              .filter(Boolean)
              .join("\n\n");
            return {
              role: msg.role,
              content: [
                ...storedImages.map((img) => ({
                  type: "image_url",
                  image_url: img,
                })),
                { type: "text", text: combinedText },
              ],
            };
          }

          return {
            role: msg.role,
            content: text && text.type === "text" ? text.text : "",
          };
        });

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            hasImageContent: hasImages,
            supportsArtifacts: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        let accumulatedContent = "";
        let accumulatedReasoning = "";
        const toolCalls: ToolCallMessagePart[] = [];

        const updateOrAddMessage = (
          updates: Partial<
            Pick<ThreadAssistantMessage, "content" | "metadata">
          >,
        ) => {
          const contentParts = buildContentParts(accumulatedContent, toolCalls);

          if (!messageAdded) {
            const customMetadata = {
              reasoning: accumulatedReasoning,
              ...updates.metadata?.custom,
            };
            const assistantMessage = createAssistantMessage(
              assistantMessageId,
              updates.content || contentParts,
              { type: "running" },
              customMetadata,
            );
            setMessages((prev) => [...prev, assistantMessage]);
            messageAdded = true;
          } else {
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== assistantMessageId || msg.role !== "assistant")
                  return msg;
                const assistantMsg = msg as ThreadAssistantMessage;
                return {
                  ...assistantMsg,
                  content: updates.content || contentParts,
                  metadata: updates.metadata
                    ? {
                        ...assistantMsg.metadata,
                        custom: {
                          ...assistantMsg.metadata?.custom,
                          ...updates.metadata.custom,
                        },
                      }
                    : assistantMsg.metadata,
                };
              }),
            );
          }
        };

        await parseSSEStream(reader, (event) => {
          switch (event.type) {
            case "reasoning":
              if (typeof event.content === "string") {
                accumulatedReasoning += event.content;
                updateOrAddMessage({
                  metadata: { custom: { reasoning: accumulatedReasoning } },
                });
              }
              break;

            case "content":
              if (typeof event.content === "string") {
                accumulatedContent += event.content;
                updateOrAddMessage({});
              }
              break;

            case "tool-call": {
              const toolCall: ToolCallMessagePart = {
                type: "tool-call",
                toolCallId: event.toolCallId as string,
                toolName: event.toolName as string,
                args: JSON.parse(event.args as string),
                argsText: event.args as string,
              };
              toolCalls.push(toolCall);
              updateOrAddMessage({});
              break;
            }

            case "suggestion":
              if (typeof event.content === "string") {
                setSuggestion(event.content);
              }
              break;

            case "content-final":
              if (typeof event.content === "string") {
                const contentParts = buildContentParts(
                  event.content,
                  toolCalls,
                );
                updateOrAddMessage({ content: contentParts });
              }
              break;
          }
        });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  status: { type: "complete", reason: "stop" },
                }
              : msg,
          ),
        );
      } catch (error) {
        const isAborted = error instanceof Error && error.name === "AbortError";

        if (isAborted) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    status: { type: "incomplete", reason: "cancelled" },
                  }
                : msg,
            ),
          );
          return;
        }

        console.error("Chat error:", error);
        const errorContent = [
          {
            type: "text" as const,
            text: "Failed to get response. Please try again.",
          },
        ];
        const errorStatus = {
          type: "incomplete" as const,
          reason: "error" as const,
          error: String(error),
        };

        if (!messageAdded) {
          const errorMessage: ThreadMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: errorContent,
            createdAt: new Date(),
            status: errorStatus,
            metadata: {
              unstable_state: null,
              unstable_annotations: [],
              unstable_data: [],
              steps: [],
              custom: {},
            },
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: errorContent, status: errorStatus }
                : msg,
            ),
          );
        }
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [messages, setMessages, composedContent],
  );

  const appendFileContent = useCallback(
    (contentBlocks: AppendableContentPart[]) => {
      setComposedContent(contentBlocks);
    },
    [],
  );

  const onCancel = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setSuggestion("");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRunning(false);
  }, [setMessages]);

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    onCancel,
  });

  return {
    ...runtime,
    suggestion,
    setSuggestion,
    clear,
    appendFileContent,
    composedContent,
  };
}
