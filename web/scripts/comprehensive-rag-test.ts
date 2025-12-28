import { generateEmbedding } from "../src/server/lib/rag/embeddings";
import { searchSimilarDocuments } from "../src/server/lib/rag/vector-search";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runComprehensiveTest() {
  console.log("========================================");
  console.log("COMPREHENSIVE RAG SYSTEM DIAGNOSTIC");
  console.log("========================================\n");

  console.log("STEP 1: Database Configuration Check");
  console.log("---");
  const { count: totalDocs } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });
  console.log(`Total documents in database: ${totalDocs}\n`);

  console.log("STEP 2: Embedding Dimension Verification");
  console.log("---");
  const { data: sampleDoc } = await supabase
    .from("documents")
    .select("id, metadata, embedding")
    .limit(1)
    .single();

  if (sampleDoc) {
    let storedDimensions = 0;

    // Parse embedding if it's stored as JSON string
    if (typeof sampleDoc.embedding === "string") {
      try {
        const parsed = JSON.parse(sampleDoc.embedding);
        storedDimensions = Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        console.error("Failed to parse embedding");
      }
    } else if (Array.isArray(sampleDoc.embedding)) {
      storedDimensions = sampleDoc.embedding.length;
    }

    console.log(`Stored embedding dimensions: ${storedDimensions}`);

    const testEmbedding = await generateEmbedding("test query");
    console.log(`Current model dimensions: ${testEmbedding.length}`);

    const expectedDimensions = 768;
    if (testEmbedding.length !== expectedDimensions) {
      console.error("\nERROR: Model dimension mismatch!");
      console.error(`Expected ${expectedDimensions}D but got ${testEmbedding.length}D`);
      console.error("Check embeddings.ts MODEL configuration\n");
      return false;
    }

    if (storedDimensions !== testEmbedding.length) {
      console.error("\nERROR: DIMENSION MISMATCH DETECTED!");
      console.error(`Database has ${storedDimensions}D embeddings`);
      console.error(`Current model generates ${testEmbedding.length}D embeddings`);
      console.error("\nREQUIRED ACTION: Run 'bun ingest' to regenerate all embeddings\n");
      return false;
    } else {
      console.log(`Dimension check passed! (${testEmbedding.length}D)\n`);
    }
  }

  console.log("STEP 3: Testing Critical Queries");
  console.log("---\n");

  const criticalQueries = [
    {
      query: "Who founded OtherDev?",
      expectedDocs: ["FAQ - Who Founded Other Dev", "Other Dev - Company Facts"],
      minSimilarity: 0.3,
    },
    {
      query: "Tell me about the founders",
      expectedDocs: ["FAQ - About the Founders", "Other Dev - Team Facts"],
      minSimilarity: 0.25,
    },
    {
      query: "What is Ossaid Qadri role?",
      expectedDocs: ["Ossaid Qadri - Founder Profile", "FAQ - About Ossaid Qadri"],
      minSimilarity: 0.25,
    },
    {
      query: "What projects has Other Dev worked on?",
      expectedDocs: ["Narkins Builders", "Bin Yousuf Group", "Lexa"],
      minSimilarity: 0.15,
    },
    {
      query: "What services does Other Dev offer?",
      expectedDocs: ["Web Development Service", "Digital Marketing Service"],
      minSimilarity: 0.2,
    },
    {
      query: "What tech stack does Other Dev use?",
      expectedDocs: ["Web Development Service - Tech Stack", "Other Dev - Technical Capabilities"],
      minSimilarity: 0.2,
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of criticalQueries) {
    console.log(`Query: "${test.query}"`);

    try {
      const queryEmbedding = await generateEmbedding(test.query);
      const threshold = Number.parseFloat(process.env.RAG_SIMILARITY_THRESHOLD || "0.05");
      const matchCount = Number.parseInt(process.env.RAG_MATCH_COUNT || "10");

      const results = await searchSimilarDocuments(queryEmbedding, threshold, matchCount);

      if (results.length === 0) {
        console.log("  FAILED: No documents found");
        console.log(`  Threshold used: ${threshold}`);

        const lowerResults = await searchSimilarDocuments(queryEmbedding, 0.01, matchCount);
        if (lowerResults.length > 0) {
          console.log(`  With lower threshold (0.01): Found ${lowerResults.length} docs`);
          console.log(`  Top match: ${lowerResults[0].metadata.title} (${(lowerResults[0].similarity * 100).toFixed(1)}%)`);
        }
        console.log("");
        failedTests++;
        continue;
      }

      const topResult = results[0];
      const foundExpected = results.some(r =>
        test.expectedDocs.some(expected =>
          r.metadata.title.toLowerCase().includes(expected.toLowerCase())
        )
      );

      if (topResult.similarity >= test.minSimilarity && foundExpected) {
        console.log(`  PASSED: Found ${results.length} relevant documents`);
        console.log(`  Top match: ${topResult.metadata.title} (${(topResult.similarity * 100).toFixed(1)}%)`);
        passedTests++;
      } else {
        console.log(`  WARNING: Results may not be optimal`);
        console.log(`  Top match: ${topResult.metadata.title} (${(topResult.similarity * 100).toFixed(1)}%)`);
        console.log(`  Expected one of: ${test.expectedDocs.join(", ")}`);
        if (topResult.similarity < test.minSimilarity) {
          console.log(`  Similarity too low: ${(topResult.similarity * 100).toFixed(1)}% < ${(test.minSimilarity * 100).toFixed(1)}%`);
        }
        failedTests++;
      }
    } catch (error) {
      console.log(`  ERROR: ${error}`);
      failedTests++;
    }

    console.log("");
  }

  console.log("========================================");
  console.log("TEST RESULTS SUMMARY");
  console.log("========================================");
  console.log(`Total Tests: ${criticalQueries.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / criticalQueries.length) * 100).toFixed(1)}%`);
  console.log("========================================\n");

  if (failedTests > 0) {
    console.log("RECOMMENDED ACTIONS:");
    console.log("1. If dimension mismatch: Run 'bun ingest' to regenerate embeddings");
    console.log("2. If low similarity: Consider lowering RAG_SIMILARITY_THRESHOLD");
    console.log("3. If wrong documents: Review knowledge base content relevance");
    console.log("4. Test the live chat endpoint with: curl -X POST http://localhost:3000/api/chat/stream");
    return false;
  }

  console.log("All tests passed! RAG system is working correctly.");
  return true;
}

runComprehensiveTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
