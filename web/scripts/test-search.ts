import { generateEmbedding } from "@/server/lib/rag/embeddings";
import { searchSimilarDocuments } from "@/server/lib/rag/vector-search";

async function testSearch() {
  console.log("========================================");
  console.log("Testing Vector Search for Founder Query");
  console.log("========================================\n");

  const testQueries = [
    "Who founded Other Dev?",
    "Tell me about Ossaid",
    "Who are the founders?",
    "Ossaid Qadri",
    "founders of Other Dev",
  ];

  for (const query of testQueries) {
    console.log(`\nQuery: "${query}"`);
    console.log("---");

    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(query);
      console.log(`Embedding generated (${queryEmbedding.length} dimensions)`);

      // Search for similar documents
      const matchThreshold = Number.parseFloat(
        process.env.RAG_SIMILARITY_THRESHOLD || "0.1",
      );
      const matchCount = Number.parseInt(process.env.RAG_MATCH_COUNT || "5");

      const similarDocs = await searchSimilarDocuments(
        queryEmbedding,
        matchThreshold,
        matchCount,
      );

      console.log(
        `Found ${similarDocs.length} documents (threshold: ${matchThreshold}):\n`,
      );

      if (similarDocs.length === 0) {
        console.log("❌ NO DOCUMENTS FOUND - This is the problem!\n");

        // Try with lower threshold
        const lowerSimilarDocs = await searchSimilarDocuments(
          queryEmbedding,
          0.01,
          matchCount,
        );
        console.log(
          `Trying with lower threshold (0.01): Found ${lowerSimilarDocs.length} documents\n`,
        );

        for (const doc of lowerSimilarDocs.slice(0, 3)) {
          console.log(`  - ${doc.metadata.title}`);
          console.log(`    Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
          console.log(
            `    Type: ${doc.metadata.type}, Category: ${doc.metadata.category || "N/A"}`,
          );
          console.log();
        }
      } else {
        for (const doc of similarDocs) {
          console.log(`  ✓ ${doc.metadata.title}`);
          console.log(`    Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
          console.log(
            `    Type: ${doc.metadata.type}, Category: ${doc.metadata.category || "N/A"}`,
          );
          console.log(
            `    Content preview: ${doc.content.substring(0, 100)}...`,
          );
          console.log();
        }
      }
    } catch (error) {
      console.error(`Error testing query "${query}":`, error);
    }

    console.log("=====================================\n");
  }
}

testSearch();
