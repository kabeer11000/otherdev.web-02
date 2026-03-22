import { z } from "zod";
import { selectModel, validateImageContent } from "../helpers";

describe("Model Routing and Image Content Handling", () => {
  describe("selectModel", () => {
    it("should return gpt-oss-120b for text-only messages", () => {
      const model = selectModel(false);
      expect(model).toBe("openai/gpt-oss-120b");
    });

    it("should return llama-4-scout-17b for messages with images", () => {
      const model = selectModel(true);
      expect(model).toBe("meta-llama/llama-4-scout-17b-16e-instruct");
    });

    it("should default to gpt-oss-120b when hasImageContent is undefined", () => {
      const model = selectModel(undefined as any);
      expect(model).toBe("openai/gpt-oss-120b");
    });
  });

  describe("validateImageContent", () => {
    it("should not warn when hasImageContent is true and content contains images", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const messages = [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: "Describe" },
            {
              type: "image_url" as const,
              image_url: { url: "data:image/jpeg;base64,abc" },
            },
          ],
        },
      ];

      validateImageContent(messages, true);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should not warn when hasImageContent is false and content is text-only", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const messages = [{ role: "user" as const, content: "Just text" }];

      validateImageContent(messages, false);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should warn when hasImageContent is true but no images found", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const messages = [{ role: "user" as const, content: "Text only" }];

      validateImageContent(messages, true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("hasImageContent flag is true but no images found"),
      );
      consoleSpy.mockRestore();
    });

    it("should warn when hasImageContent is false but images are present", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const messages = [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: "Text" },
            {
              type: "image_url" as const,
              image_url: { url: "data:image/png;base64,xyz" },
            },
          ],
        },
      ];

      validateImageContent(messages, false);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("hasImageContent flag is false but images found"),
      );
      consoleSpy.mockRestore();
    });

    it("should detect images in content blocks correctly", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "image_url" as const,
              image_url: { url: "data:image/jpeg;base64,1" },
            },
            {
              type: "image_url" as const,
              image_url: { url: "data:image/png;base64,2" },
            },
          ],
        },
      ];

      validateImageContent(messages, true);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Backward compatibility (no hasImageContent flag)", () => {
    it("should default to text model when hasImageContent is not provided", () => {
      const model = selectModel(undefined as any);
      expect(model).toBe("openai/gpt-oss-120b");
    });
  });

  describe("Zod Schema Validation", () => {
    it("should validate MessageSchema with string content", () => {
      const MessageSchema = z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([
          z.string(),
          z.array(
            z.discriminatedUnion("type", [
              z.object({ type: z.literal("text"), text: z.string() }),
              z.object({
                type: z.literal("image_url"),
                image_url: z.object({ url: z.string().url() }),
              }),
            ]),
          ),
        ]),
      });

      const result = MessageSchema.safeParse({ role: "user", content: "Hello" });
      expect(result.success).toBe(true);
    });

    it("should validate MessageSchema with content blocks", () => {
      const MessageSchema = z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([
          z.string(),
          z.array(
            z.discriminatedUnion("type", [
              z.object({ type: z.literal("text"), text: z.string() }),
              z.object({
                type: z.literal("image_url"),
                image_url: z.object({ url: z.string().url() }),
              }),
            ]),
          ),
        ]),
      });

      const result = MessageSchema.safeParse({
        role: "user",
        content: [
          { type: "text", text: "What is this?" },
          { type: "image_url", image_url: { url: "data:image/jpeg;base64,abc" } },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should validate RequestSchema with hasImageContent flag", () => {
      const TextBlock = z.object({ type: z.literal("text"), text: z.string() });
      const ImageBlock = z.object({
        type: z.literal("image_url"),
        image_url: z.object({ url: z.string().url() }),
      });
      const MessageSchema = z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([z.string(), z.array(z.union([TextBlock, ImageBlock]))]),
      });
      const RequestSchema = z.object({
        messages: z.array(MessageSchema).min(1),
        hasImageContent: z.boolean().optional(),
      });

      const result = RequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
        hasImageContent: false,
      });
      expect(result.success).toBe(true);
    });

    it("should validate RequestSchema without hasImageContent for backward compatibility", () => {
      const MessageSchema = z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([z.string(), z.array(z.object({ type: z.string() }))]),
      });
      const RequestSchema = z.object({
        messages: z.array(MessageSchema).min(1),
        hasImageContent: z.boolean().optional(),
      });

      const result = RequestSchema.safeParse({
        messages: [{ role: "user", content: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid content blocks", () => {
      const MessageSchema = z.object({
        role: z.enum(["user", "assistant"]),
        content: z.union([
          z.string(),
          z.array(
            z.discriminatedUnion("type", [
              z.object({ type: z.literal("text"), text: z.string() }),
              z.object({
                type: z.literal("image_url"),
                image_url: z.object({ url: z.string().url() }),
              }),
            ]),
          ),
        ]),
      });

      const result = MessageSchema.safeParse({
        role: "user",
        content: [
          { type: "text", text: "Valid" },
          { type: "invalid_type", someField: "value" },
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});
