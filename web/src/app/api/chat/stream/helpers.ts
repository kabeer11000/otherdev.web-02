import type { ContentBlock, MessageContent } from "@/lib/content-types";

export type { ContentBlock, MessageContent };

export interface Message {
  role: "user" | "assistant";
  content: MessageContent;
}

export const CHAT_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export function warnOnImageContentMismatch(
  messages: Message[],
  hasImageContent: boolean | undefined,
): void {
  const hasImages = messages.some((message) => {
    if (Array.isArray(message.content)) {
      return message.content.some((block) => block.type === "image_url");
    }
    return false;
  });

  if (hasImageContent === true && !hasImages) {
    console.warn(
      "WARNING: hasImageContent flag is true but no images found in message content.",
    );
  }

  if (hasImageContent === false && hasImages) {
    console.warn(
      "WARNING: hasImageContent flag is false but images found in message content.",
    );
  }
}
