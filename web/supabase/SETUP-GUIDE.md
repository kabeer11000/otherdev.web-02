# RAG System Setup Guide - BGE-Base-EN-v1.5 (768D)

## Overview
This guide will help you upgrade your RAG system to use the superior **BGE-Base-EN-v1.5** embedding model (768 dimensions) instead of the previous all-MiniLM-L6-v2 (384 dimensions).

BGE-Base-EN-v1.5 consistently outperforms other models on the MTEB Leaderboard and will give you better search accuracy.

## Step 1: Update Supabase Schema

1. Open your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `web/supabase/update-vector-dimensions.sql`
4. Paste and run the SQL script
5. Verify success message appears

This will:
- Drop old documents table and function
- Create new table with `vector(768)` support
- Create optimized IVFFlat index for fast similarity search
- Recreate the `match_documents` RPC function

## Step 2: Verify Environment Variables

Check your `.env` file has these settings:

```bash
# RAG Chat System
PUBLIC_SUPABASE_URL="your-project-url.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
HUGGINGFACE_API_KEY="your-hf-api-key"
GROQ_API_KEY="your-groq-api-key"

# RAG Configuration
RAG_SIMILARITY_THRESHOLD="0.05"
RAG_MATCH_COUNT="10"
RAG_MAX_MESSAGE_LENGTH="500"
```

## Step 3: Ingest Documents

Run the ingestion script to populate the database with 768D embeddings:

```bash
cd web
bun ingest
```

This will:
- Clear all old documents
- Generate 768D embeddings using BGE-Base-EN-v1.5
- Insert 89 documents into Supabase
- Take approximately 45 seconds (with 500ms rate limiting)

Expected output:
```
Document Ingestion Pipeline
Successful: 89
Failed: 0
```

## Step 4: Test the System

Run the comprehensive test suite:

```bash
bun run scripts/comprehensive-rag-test.ts
```

This will verify:
- Embedding dimensions are correct (768D)
- Database schema is properly configured
- Vector search is working
- Critical queries return relevant results

Expected success rate: **100%**

## Step 5: Test Live Chat

Start your dev server and test the chat widget:

```bash
bun dev
```

Open http://localhost:3000 and test these queries:
- "Who founded OtherDev?"
- "Tell me about Ossaid Qadri"
- "What projects has Other Dev worked on?"
- "What tech stack does Other Dev use?"

All queries should return accurate, relevant answers.

## Troubleshooting

### Issue: Dimension mismatch error
**Solution:** Run the SQL migration script again, then re-ingest documents

### Issue: No documents found in search
**Solution:** Check RAG_SIMILARITY_THRESHOLD (try lowering to 0.03)

### Issue: Rate limit errors
**Solution:** Wait 60 seconds or adjust rate limit in `src/server/lib/rate-limit.ts`

### Issue: Slow embedding generation
**Solution:** BGE models are larger than MiniLM, expect slightly slower inference

## Performance Comparison

### All-MiniLM-L6-v2 (384D)
- Speed: Fast
- Accuracy: Good
- Size: 22M parameters

### BGE-Base-EN-v1.5 (768D)
- Speed: Moderate
- Accuracy: Excellent
- Size: 109M parameters
- MTEB Score: 63.55 (vs 56.26 for MiniLM)

The 2x dimension increase and better model architecture result in **significantly more accurate semantic search**.

## Next Steps

After successful setup:
1. Monitor search quality with real user queries
2. Adjust similarity threshold if needed (0.03-0.1 range)
3. Consider adding more documents to knowledge base
4. Deploy to production with updated schema

## Support

If you encounter issues:
1. Check Supabase logs for vector search errors
2. Verify HuggingFace API key has sufficient quota
3. Test embedding generation manually with `scripts/test-search.ts`
4. Review chat API logs in browser DevTools Network tab
