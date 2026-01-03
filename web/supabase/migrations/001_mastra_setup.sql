-- Mastra Framework Database Migration
-- This migration adds the necessary tables for Mastra framework
-- while preserving the existing documents table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create Mastra threads table for conversation management
CREATE TABLE IF NOT EXISTS mastra_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mastra messages table for conversation history
CREATE TABLE IF NOT EXISTS mastra_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES mastra_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mastra traces table for observability
CREATE TABLE IF NOT EXISTS mastra_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mastra workflow snapshots table
CREATE TABLE IF NOT EXISTS mastra_workflow_snapshot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mastra evaluations table
CREATE TABLE IF NOT EXISTS mastra_evals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eval_id TEXT NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mastra scorers table
CREATE TABLE IF NOT EXISTS mastra_scorers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scorer_id TEXT NOT NULL,
    config JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Mastra resources table
CREATE TABLE IF NOT EXISTS mastra_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mastra_threads_resource_id ON mastra_threads(resource_id);
CREATE INDEX IF NOT EXISTS idx_mastra_threads_created_at ON mastra_threads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mastra_messages_thread_id ON mastra_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_mastra_messages_created_at ON mastra_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mastra_messages_role ON mastra_messages(role);

CREATE INDEX IF NOT EXISTS idx_mastra_traces_run_id ON mastra_traces(run_id);
CREATE INDEX IF NOT EXISTS idx_mastra_traces_type ON mastra_traces(type);
CREATE INDEX IF NOT EXISTS idx_mastra_traces_created_at ON mastra_traces(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mastra_workflow_run_id ON mastra_workflow_snapshot(run_id);
CREATE INDEX IF NOT EXISTS idx_mastra_workflow_workflow_id ON mastra_workflow_snapshot(workflow_id);

CREATE INDEX IF NOT EXISTS idx_mastra_evals_eval_id ON mastra_evals(eval_id);
CREATE INDEX IF NOT EXISTS idx_mastra_scorers_scorer_id ON mastra_scorers(scorer_id);
CREATE INDEX IF NOT EXISTS idx_mastra_resources_resource_id ON mastra_resources(resource_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for threads table
CREATE TRIGGER update_mastra_threads_updated_at
    BEFORE UPDATE ON mastra_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify existing documents table has the correct structure
-- Note: This doesn't modify the existing table, just validates it exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        RAISE EXCEPTION 'documents table does not exist. Please ensure your RAG system is set up correctly.';
    END IF;
END $$;

-- Create HNSW index on documents table if it doesn't exist
-- This improves vector similarity search performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'documents_embedding_idx'
    ) THEN
        -- Using halfvec_cosine_ops for your existing halfvec(1024) column
        CREATE INDEX documents_embedding_idx ON documents USING hnsw (embedding halfvec_cosine_ops);
    END IF;
END $$;

-- Grant necessary permissions (adjust based on your security requirements)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Mastra database migration completed successfully!';
END $$;
