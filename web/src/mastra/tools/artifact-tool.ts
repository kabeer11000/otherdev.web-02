import { createTool } from "@mastra/core";
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
    .describe(
      "A brief explanation of what this artifact does and how to use it",
    ),
});

export const createArtifactTool = createTool({
  id: "create_artifact",
  description:
    "Create an interactive HTML/CSS/JavaScript artifact that will be displayed in a live preview panel. Use this when the user asks to create, build, or generate interactive content like games, visualizations, calculators, forms, or any web-based UI.",
  inputSchema: createArtifactSchema,
  outputSchema: z.object({
    success: z.boolean(),
    artifactId: z.string().optional(),
  }),
  execute: async ({ context, input }) => {
    return {
      success: true,
      artifactId: `artifact-${Date.now()}`,
    };
  },
});
