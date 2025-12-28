import { knowledgeBase } from "../src/lib/knowledge-base";
import { generateEmbedding } from "../src/server/lib/rag/embeddings";
import {
  insertDocument,
  deleteAllDocuments,
} from "../src/server/lib/rag/vector-search";

async function main() {
  console.log("========================================");
  console.log("Document Ingestion Pipeline");
  console.log("========================================\n");

  console.log("Step 1: Clearing old embeddings from database...");
  try {
    await deleteAllDocuments();
    console.log("  Successfully cleared all old documents\n");
  } catch (error) {
    console.error("  Failed to clear old documents:", error);
    console.error("  Aborting ingestion to prevent pollution\n");
    process.exit(1);
  }

  console.log("Step 2: Ingesting new documents...");
  console.log(`Total documents to process: ${knowledgeBase.length}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < knowledgeBase.length; i++) {
    const doc = knowledgeBase[i];
    const progress = `[${i + 1}/${knowledgeBase.length}]`;

    try {
      console.log(`${progress} Processing: ${doc.metadata.title}`);

      console.log(`  Generating embedding...`);
      const embedding = await generateEmbedding(doc.content);

      if (!embedding || embedding.length !== 768) {
        throw new Error(
          `Invalid embedding dimension: ${embedding?.length || 0} (expected 768)`,
        );
      }

      console.log(`  Inserting into database...`);
      const docId = await insertDocument(doc.content, doc.metadata, embedding);

      console.log(`  Success! Document ID: ${docId}\n`);
      successCount++;

      if (i < knowledgeBase.length - 1) {
        console.log("  Waiting 500ms before next request...\n");
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`  Error processing document: ${error}`);
      console.error(`  Document: ${doc.metadata.title}\n`);
      errorCount++;
    }
  }

  console.log("========================================");
  console.log("Ingestion Complete!");
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${errorCount}`);
  console.log(`  Total: ${knowledgeBase.length}`);
  console.log("========================================");

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error during ingestion:", error);
  process.exit(1);
});
