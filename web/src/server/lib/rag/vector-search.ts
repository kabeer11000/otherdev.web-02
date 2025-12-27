import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface MatchedDocument {
  id: string;
  content: string;
  metadata: {
    source: string;
    title: string;
    type: string;
    category?: string;
  };
  similarity: number;
}

export async function searchSimilarDocuments(
  queryEmbedding: number[],
  matchThreshold: number = 0.1,
  matchCount: number = 5
): Promise<MatchedDocument[]> {
  try {
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw new Error('Failed to search documents');
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((doc: any) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      similarity: doc.similarity,
    }));
  } catch (error) {
    console.error('Error searching documents:', error);
    throw new Error('Failed to search documents');
  }
}

export async function insertDocument(
  content: string,
  metadata: {
    source: string;
    title: string;
    type: string;
    category?: string;
  },
  embedding: number[]
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        content,
        metadata,
        embedding,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error('Failed to insert document');
    }

    return data.id;
  } catch (error) {
    console.error('Error inserting document:', error);
    throw new Error('Failed to insert document');
  }
}
