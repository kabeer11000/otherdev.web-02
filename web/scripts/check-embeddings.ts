import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  console.log("========================================");
  console.log("Checking Documents in Supabase");
  console.log("========================================\n");

  // Count total documents
  const { count, error: countError } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error counting documents:", countError);
    return;
  }

  console.log(`Total documents in database: ${count}\n`);

  // Get a few sample documents with their metadata
  const { data: samples, error: sampleError } = await supabase
    .from("documents")
    .select("id, metadata, embedding")
    .limit(5);

  if (sampleError) {
    console.error("Error fetching samples:", sampleError);
    return;
  }

  console.log("Sample Documents:\n");
  for (const doc of samples || []) {
    console.log(`ID: ${doc.id}`);
    console.log(`Title: ${doc.metadata?.title || "N/A"}`);
    console.log(`Type: ${doc.metadata?.type || "N/A"}`);
    console.log(`Category: ${doc.metadata?.category || "N/A"}`);
    console.log(
      `Embedding dimensions: ${doc.embedding ? doc.embedding.length : "N/A"}`,
    );
    console.log("---\n");
  }

  // Search for founder-related documents
  const { data: founderDocs, error: founderError } = await supabase
    .from("documents")
    .select("id, metadata, content")
    .ilike("content", "%founder%")
    .limit(5);

  if (founderError) {
    console.error("Error fetching founder docs:", founderError);
    return;
  }

  console.log("\nFounder-related Documents:\n");
  for (const doc of founderDocs || []) {
    console.log(`Title: ${doc.metadata?.title || "N/A"}`);
    console.log(`Content preview: ${doc.content.substring(0, 150)}...`);
    console.log("---\n");
  }

  // Check for Ossaid-specific documents
  const { data: ossaidDocs, error: ossaidError } = await supabase
    .from("documents")
    .select("id, metadata, content")
    .ilike("content", "%ossaid%")
    .limit(5);

  if (ossaidError) {
    console.error("Error fetching Ossaid docs:", ossaidError);
    return;
  }

  console.log("\nOssaid-related Documents:\n");
  for (const doc of ossaidDocs || []) {
    console.log(`Title: ${doc.metadata?.title || "N/A"}`);
    console.log(`Content preview: ${doc.content.substring(0, 150)}...`);
    console.log("---\n");
  }

  console.log("========================================");
  console.log("Check Complete!");
  console.log("========================================");
}

checkEmbeddings();
