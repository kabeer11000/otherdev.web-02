import { z } from "zod";

export const createArtifactSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less")
    .describe("A short, descriptive title for the artifact"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50000, "Code must be 50KB or less")
    .describe(
      "Complete HTML code including CSS in <style> tags and JavaScript in <script> tags. Must be self-contained and work in a sandboxed iframe.",
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be 500 characters or less")
    .describe("A brief explanation of what this artifact does and how to use it"),
});

export type CreateArtifactArgs = z.infer<typeof createArtifactSchema>;

export const createArtifactTool = {
  type: "function" as const,
  function: {
    name: "create_artifact",
    description:
      "Create an interactive HTML/CSS/JavaScript artifact that will be displayed in a live preview panel. Use this when the user asks to create, build, or generate interactive content like games, visualizations, calculators, forms, or any web-based UI. The artifact should be complete and self-contained.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "A short, descriptive title for the artifact (max 100 chars)",
        },
        code: {
          type: "string",
          description:
            "Complete HTML code including CSS in <style> tags and JavaScript in <script> tags. Must be self-contained and work in a sandboxed iframe (max 50KB)",
        },
        description: {
          type: "string",
          description:
            "A brief explanation of what this artifact does and how to use it (max 500 chars)",
        },
      },
      required: ["title", "code", "description"],
    },
  },
};
