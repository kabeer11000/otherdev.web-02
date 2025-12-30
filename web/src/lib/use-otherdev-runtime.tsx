"use client";

import { useExternalStoreRuntime } from "@assistant-ui/react";
import type {
  AppendMessage,
  ThreadMessage,
  ToolCallMessagePart,
  TextMessagePart,
  ThreadAssistantMessage,
} from "@assistant-ui/react";
import { useState, useCallback, useRef } from "react";
import { useLocalStorageMessages } from "@/hooks/use-local-storage-messages";

const LOOM_STORAGE_KEY = "otherdev-loom-messages";

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

export function useOtherDevRuntime() {
  const { messages, setMessages } = useLocalStorageMessages<ThreadMessage>({
    key: LOOM_STORAGE_KEY,
    serialize: serializeLoomMessages,
    deserialize: deserializeLoomMessages,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const textContent = message.content.find((part) => part.type === "text");
      if (!textContent || textContent.type !== "text") return;

      const userMessage: ThreadMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: [textContent],
        createdAt: new Date(),
        attachments: [],
        metadata: {
          custom: {},
        },
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsRunning(true);

      abortControllerRef.current = new AbortController();
      const assistantMessageId = `assistant-${Date.now()}`;
      let messageAdded = false;

      try {
        const apiMessages = messages.concat(userMessage).map((msg) => ({
          role: msg.role,
          content: msg.content.find((c) => c.type === "text")?.text ?? "",
        }));

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        let accumulatedContent = "";
        let accumulatedReasoning = "";
        let currentSuggestion = "";
        const toolCalls: ToolCallMessagePart[] = [];

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                break;
              }

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "reasoning" && parsed.content) {
                  accumulatedReasoning += parsed.content;

                  const contentParts: (TextMessagePart | ToolCallMessagePart)[] = [];
                  if (accumulatedContent) {
                    contentParts.push({ type: "text" as const, text: accumulatedContent });
                  }
                  contentParts.push(...toolCalls);

                  if (!messageAdded) {
                    const assistantMessage: ThreadAssistantMessage = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: contentParts,
                      createdAt: new Date(),
                      status: { type: "running" },
                      metadata: {
                        unstable_state: null,
                        unstable_annotations: [],
                        unstable_data: [],
                        steps: [],
                        custom: { reasoning: accumulatedReasoning },
                      },
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    messageAdded = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId && msg.role === "assistant"
                          ? {
                              ...(msg as ThreadAssistantMessage),
                              metadata: {
                                ...(msg as ThreadAssistantMessage).metadata,
                                custom: { reasoning: accumulatedReasoning },
                              },
                            }
                          : msg,
                      ),
                    );
                  }
                }

                if (parsed.type === "content" && parsed.content) {
                  accumulatedContent += parsed.content;

                  const contentParts: (TextMessagePart | ToolCallMessagePart)[] = [];
                  if (accumulatedContent) {
                    contentParts.push({ type: "text" as const, text: accumulatedContent });
                  }
                  contentParts.push(...toolCalls);

                  if (!messageAdded) {
                    const assistantMessage: ThreadAssistantMessage = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: contentParts,
                      createdAt: new Date(),
                      status: { type: "running" },
                      metadata: {
                        unstable_state: null,
                        unstable_annotations: [],
                        unstable_data: [],
                        steps: [],
                        custom: { reasoning: accumulatedReasoning },
                      },
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    messageAdded = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId && msg.role === "assistant"
                          ? {
                              ...(msg as ThreadAssistantMessage),
                              content: contentParts,
                            }
                          : msg,
                      ),
                    );
                  }
                } else if (parsed.type === "tool-call") {
                  const toolCall: ToolCallMessagePart = {
                    type: "tool-call",
                    toolCallId: parsed.toolCallId,
                    toolName: parsed.toolName,
                    args: JSON.parse(parsed.args),
                    argsText: parsed.args,
                  };
                  toolCalls.push(toolCall);

                  const contentParts: (TextMessagePart | ToolCallMessagePart)[] = [];
                  if (accumulatedContent) {
                    contentParts.push({ type: "text" as const, text: accumulatedContent });
                  }
                  contentParts.push(...toolCalls);

                  if (!messageAdded) {
                    const assistantMessage: ThreadAssistantMessage = {
                      id: assistantMessageId,
                      role: "assistant",
                      content: contentParts,
                      createdAt: new Date(),
                      status: { type: "running" },
                      metadata: {
                        unstable_state: null,
                        unstable_annotations: [],
                        unstable_data: [],
                        steps: [],
                        custom: { reasoning: accumulatedReasoning },
                      },
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                    messageAdded = true;
                  } else {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId && msg.role === "assistant"
                          ? {
                              ...(msg as ThreadAssistantMessage),
                              content: contentParts,
                            }
                          : msg,
                      ),
                    );
                  }
                } else if (parsed.type === "suggestion" && parsed.content) {
                  currentSuggestion = parsed.content;
                  setSuggestion(currentSuggestion);
                } else if (parsed.type === "content-final" && parsed.content) {
                  const contentParts: (TextMessagePart | ToolCallMessagePart)[] = [
                    { type: "text" as const, text: parsed.content }
                  ];
                  contentParts.push(...toolCalls);

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId && msg.role === "assistant"
                        ? {
                            ...(msg as ThreadAssistantMessage),
                            content: contentParts,
                          }
                        : msg,
                    ),
                  );
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }

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
        if (error instanceof Error && error.name === "AbortError") {
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

        if (!messageAdded) {
          const errorMessage: ThreadMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: [
              { type: "text", text: "Failed to get response. Please try again." },
            ],
            createdAt: new Date(),
            status: { type: "incomplete", reason: "error", error: String(error) },
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
                ? {
                    ...msg,
                    content: [
                      { type: "text", text: "Failed to get response. Please try again." },
                    ],
                    status: { type: "incomplete", reason: "error", error: String(error) },
                  }
                : msg,
            ),
          );
        }
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [messages],
  );

  const onCancel = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

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
  };
}
