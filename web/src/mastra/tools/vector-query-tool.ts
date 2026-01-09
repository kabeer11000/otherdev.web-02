import { createTool } from "@mastra/core";
import { z } from "zod";
import { vectorStore } from "../rag/vector-store";
import { generateEmbedding } from "../rag/embeddings";
import { detectQueryQuality, getAdaptiveThreshold } from "../lib/query-quality";

export const vectorQueryTool = createTool({
  id: "query_knowledge_base",
  description:
    "Search the knowledge base for relevant information about Other Dev projects, services, and capabilities",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        metadata: z.record(z.any()),
        similarity: z.number(),
      }),
    ),
    context: z.string(),
  }),
  execute: async ({ input }) => {
    const { query } = input;

    const queryQuality = detectQueryQuality(query);
    const threshold = getAdaptiveThreshold(queryQuality);
    const matchCount = Number.parseInt(process.env.RAG_MATCH_COUNT || "10");

    const embedding = await generateEmbedding(query);

    const results = await vectorStore.query({
      indexName: "otherdev_knowledge",
      queryVector: embedding,
      topK: matchCount,
      minScore: threshold,
    });

    let context: string;
    if (results.length > 0) {
      context = results
        .map(
          (doc, idx) =>
            `Document ${idx + 1} (Relevance: ${(doc.score * 100).toFixed(1)}%):\nTitle: ${doc.metadata.title}\n${doc.metadata.content}\n`,
        )
        .join("\n---\n\n");
    } else if (queryQuality.isConversational) {
      context =
        "User sent a conversational message. Respond naturally and helpfully.";
    } else {
      context = "Provide helpful general information about Other Dev.";
    }

    return {
      results: results.map((r) => ({
        content: r.metadata.content as string,
        metadata: r.metadata,
        similarity: r.score,
      })),
      context,
    };
  },
});
