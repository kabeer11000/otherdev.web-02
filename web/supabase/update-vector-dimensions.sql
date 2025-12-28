-- Update the documents table to support 768-dimension vectors (BGE-Base-EN-v1.5)
-- Run this in Supabase SQL Editor before re-ingesting documents

-- Step 1: Drop the existing match_documents function (it references the old vector size)
DROP FUNCTION IF EXISTS match_documents(vector(384), float, int);
DROP FUNCTION IF EXISTS match_documents(vector(768), float, int);

-- Step 2: Recreate the documents table with 768-dimension vectors
DROP TABLE IF EXISTS documents;

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: Create an index for vector similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 4: Create the match_documents RPC function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Step 5: Grant necessary permissions (adjust role name if needed)
GRANT ALL ON documents TO postgres;
GRANT ALL ON documents TO anon;
GRANT ALL ON documents TO authenticated;
GRANT ALL ON documents TO service_role;

-- Verification queries
SELECT 'Schema update complete!' AS status;
SELECT 'Documents table ready for 768D embeddings' AS info;
