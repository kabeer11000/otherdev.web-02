import { knowledgeBase } from "../src/lib/knowledge-base";
import { vectorStore } from "../src/mastra/rag/vector-store";
import { generateEmbedding } from "../src/mastra/rag/embeddings";

interface VectorMetadata {
  content: string;
  source: string;
  title: string;
  type: string;
  category?: string;
  subtype?: string;
  project?: string;
  year?: string;
}

async function main() {
  console.log("========================================");
  console.log("Mastra Document Ingestion Pipeline");
  console.log("========================================\n");

  console.log("Step 1: Creating vector index...");
  try {
    await vectorStore.createIndex({
      indexName: "otherdev_knowledge",
      dimension: 1024,
      metric: "cosine",
    });
    console.log("  Vector index created successfully\n");
  } catch (error) {
    console.error("  Failed to create vector index:", error);
    process.exit(1);
  }

  console.log("Step 2: Ingesting documents...");
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

      if (!embedding || embedding.length !== 1024) {
        throw new Error(
          `Invalid embedding dimension: ${embedding?.length || 0} (expected 1024)`,
        );
      }

      console.log(`  Upserting to vector store...`);

      const metadata: VectorMetadata = {
        content: doc.content,
        source: doc.metadata.source,
        title: doc.metadata.title,
        type: doc.metadata.type,
      };

      if (doc.metadata.category !== undefined) {
        metadata.category = doc.metadata.category;
      }
      if (doc.metadata.subtype !== undefined) {
        metadata.subtype = doc.metadata.subtype;
      }
      if (doc.metadata.project !== undefined) {
        metadata.project = doc.metadata.project;
      }
      if (doc.metadata.year !== undefined) {
        metadata.year = doc.metadata.year;
      }

      await vectorStore.upsert({
        indexName: "otherdev_knowledge",
        vectors: [embedding],
        ids: [`doc-${i}-${Date.now()}`],
        metadata: [metadata],
      });

      console.log(`  Success!\n`);
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
