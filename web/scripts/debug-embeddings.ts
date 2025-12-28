import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEmbeddings() {
  console.log("Fetching raw document data...\n");

  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, metadata, embedding")
    .limit(3);

  if (error) {
    console.error("Error:", error);
    return;
  }

  for (const doc of docs || []) {
    console.log(`\nDocument: ${doc.metadata?.title || "Unknown"}`);
    console.log(`ID: ${doc.id}`);
    console.log(`Embedding type: ${typeof doc.embedding}`);
    console.log(`Is array: ${Array.isArray(doc.embedding)}`);

    if (doc.embedding) {
      if (typeof doc.embedding === "string") {
        console.log("Embedding is a string, attempting to parse...");
        try {
          const parsed = JSON.parse(doc.embedding);
          console.log(`Parsed embedding length: ${parsed.length}`);
        } catch (e) {
          console.log("Failed to parse as JSON");
          console.log(`String length: ${doc.embedding.length}`);
          console.log(`First 100 chars: ${doc.embedding.substring(0, 100)}`);
        }
      } else if (Array.isArray(doc.embedding)) {
        console.log(`Array length: ${doc.embedding.length}`);
        console.log(`First 5 values: ${doc.embedding.slice(0, 5).join(", ")}`);
      } else {
        console.log(`Unexpected type: ${typeof doc.embedding}`);
      }
    }
  }

  console.log("\n\nAttempting to manually clear all documents...");
  const { error: deleteError, count } = await supabase
    .from("documents")
    .delete()
    .gte("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    console.error("Delete error:", deleteError);
  } else {
    console.log(`Deleted ${count} documents`);
  }

  const { count: remaining } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });

  console.log(`Remaining documents: ${remaining}`);
}

debugEmbeddings();
