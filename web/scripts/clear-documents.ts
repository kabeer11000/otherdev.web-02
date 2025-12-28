import { deleteAllDocuments } from "../src/server/lib/rag/vector-search";

async function main() {
  console.log("========================================");
  console.log("Clearing All Documents");
  console.log("========================================\n");

  try {
    console.log("Deleting all documents from vector database...");
    await deleteAllDocuments();
    console.log("Successfully cleared all documents!\n");
    console.log("========================================");
  } catch (error) {
    console.error("Failed to clear documents:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
