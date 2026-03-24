import type { AttachmentAdapter, CompleteAttachment, PendingAttachment } from "@assistant-ui/react";
import type { ContentBlock, ImageUrlContentBlock, TextContentBlock } from "@/lib/content-types";
import { encodeImageToBase64, extractTextFromFile, validateFile } from "@/lib/file-processor";

const MAX_ATTACHMENTS = 5;

export class OcrAttachmentAdapter implements AttachmentAdapter {
  accept =
    "image/*,application/pdf,.docx,.pptx,.epub,.rtf,.odt,.tex,.txt,.md,.js,.ts,.json,.py,.csv,.html,.xml";

  private cache = new Map<string, ContentBlock>();
  private liveIds = new Set<string>();

  async *add({ file }: { file: File }): AsyncGenerator<PendingAttachment, PendingAttachment> {
    const id = crypto.randomUUID();
    const isImage = file.type.startsWith("image/");
    const attachmentType = isImage ? ("image" as const) : ("document" as const);

    if (this.liveIds.size >= MAX_ATTACHMENTS) {
      return {
        id,
        type: attachmentType,
        name: file.name,
        contentType: file.type,
        file,
        status: { type: "incomplete", reason: "error" },
      } as PendingAttachment;
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        id,
        type: attachmentType,
        name: file.name,
        contentType: file.type,
        file,
        status: { type: "incomplete", reason: "error" },
      } as PendingAttachment;
    }

    this.liveIds.add(id);

    yield {
      id,
      type: attachmentType,
      name: file.name,
      contentType: file.type,
      file,
      status: { type: "running" } as PendingAttachment["status"],
    } as PendingAttachment;

    try {
      let block: ContentBlock;
      if (isImage) {
        const dataUri = await encodeImageToBase64(file);
        block = { type: "image_url", image_url: { url: dataUri } };
      } else {
        const text = await extractTextFromFile(file);
        block = { type: "text", text: `[File: ${file.name}]\n${text}` };
      }
      this.cache.set(id, block);
    } catch {
      this.liveIds.delete(id);
      return {
        id,
        type: attachmentType,
        name: file.name,
        contentType: file.type,
        file,
        status: { type: "incomplete", reason: "error" },
      } as PendingAttachment;
    }

    return {
      id,
      type: attachmentType,
      name: file.name,
      contentType: file.type,
      file,
      status: { type: "requires-action", reason: "composer-send" },
    } as PendingAttachment;
  }

  async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    const block = this.cache.get(attachment.id);
    this.cache.delete(attachment.id);
    this.liveIds.delete(attachment.id);

    const content =
      block == null
        ? []
        : block.type === "image_url"
          ? [{ type: "image" as const, image: (block as ImageUrlContentBlock).image_url.url }]
          : [{ type: "text" as const, text: (block as TextContentBlock).text }];

    return {
      id: attachment.id,
      type: attachment.type,
      name: attachment.name,
      contentType: attachment.contentType,
      content,
      status: { type: "complete" },
    };
  }

  async remove(attachment: PendingAttachment): Promise<void> {
    this.cache.delete(attachment.id);
    this.liveIds.delete(attachment.id);
  }
}
