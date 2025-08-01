-- RAG Vector Database Schema for MVP Studio
-- This file contains the vector database schema for true RAG functionality using pgvector

-- =====================================================
-- ENABLE PGVECTOR EXTENSION
-- =====================================================

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- RAG KNOWLEDGE BASE TABLE
-- =====================================================

-- Table to store knowledge base documents with vector embeddings
CREATE TABLE IF NOT EXISTS public.rag_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Document Information
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('best_practice', 'example', 'template', 'guide', 'reference')),
    source_url TEXT,
    
    -- Tool and Category Information
    target_tools TEXT[] NOT NULL, -- Array of SupportedTool enum values
    categories TEXT[] NOT NULL, -- Array of categories like 'ui_design', 'backend', 'deployment'
    complexity_level TEXT NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Vector Embedding (1536 dimensions for OpenAI embeddings, adjust as needed)
    embedding vector(1536),
    
    -- Content Metadata
    content_hash TEXT UNIQUE NOT NULL, -- To prevent duplicates
    word_count INTEGER NOT NULL,
    language TEXT DEFAULT 'en',
    
    -- Usage Statistics
    retrieval_count INTEGER DEFAULT 0,
    last_retrieved_at TIMESTAMP WITH TIME ZONE,
    
    -- Quality Metrics
    quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
    user_ratings JSONB DEFAULT '[]'::jsonb, -- Array of user ratings
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb, -- Array of tags for additional categorization
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RAG PROMPT TEMPLATES TABLE
-- =====================================================

-- Table to store prompt templates with vector embeddings for similarity matching
CREATE TABLE IF NOT EXISTS public.rag_prompt_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Template Information
    template_name TEXT NOT NULL,
    template_content TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('skeleton', 'feature', 'optimization', 'debugging')),
    
    -- Tool and Context Information
    target_tool TEXT NOT NULL, -- SupportedTool enum value
    use_case TEXT NOT NULL,
    project_complexity TEXT NOT NULL CHECK (project_complexity IN ('simple', 'medium', 'complex')),
    
    -- Vector Embedding for template similarity
    embedding vector(1536),
    
    -- Template Variables
    required_variables JSONB NOT NULL, -- Array of required template variables
    optional_variables JSONB DEFAULT '[]'::jsonb, -- Array of optional variables
    
    -- Performance Metrics
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0.5 CHECK (success_rate >= 0 AND success_rate <= 1),
    avg_confidence_score DECIMAL(3,2) DEFAULT 0.5,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RAG RETRIEVAL LOGS TABLE
-- =====================================================

-- Table to log retrieval operations for analytics and improvement
CREATE TABLE IF NOT EXISTS public.rag_retrieval_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Query Information
    query_text TEXT NOT NULL,
    query_embedding vector(1536),
    query_type TEXT NOT NULL CHECK (query_type IN ('knowledge_search', 'template_search', 'example_search')),
    
    -- Retrieval Results
    retrieved_documents JSONB NOT NULL, -- Array of retrieved document IDs and scores
    retrieval_count INTEGER NOT NULL,
    max_similarity_score DECIMAL(5,4),
    min_similarity_score DECIMAL(5,4),
    
    -- Context Information
    target_tool TEXT,
    project_complexity TEXT,
    user_experience_level TEXT,
    
    -- Performance Metrics
    retrieval_time_ms INTEGER,
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR VECTOR SIMILARITY SEARCH
-- =====================================================

-- Vector similarity indexes using HNSW (Hierarchical Navigable Small World)
-- These indexes enable fast approximate nearest neighbor search

-- Index for knowledge base embeddings
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_embedding_hnsw 
ON public.rag_knowledge_base 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for prompt template embeddings
CREATE INDEX IF NOT EXISTS idx_rag_templates_embedding_hnsw 
ON public.rag_prompt_templates 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for retrieval log embeddings
CREATE INDEX IF NOT EXISTS idx_rag_retrieval_embedding_hnsw 
ON public.rag_retrieval_logs 
USING hnsw (query_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- =====================================================
-- TRADITIONAL INDEXES FOR FILTERING
-- =====================================================

-- Indexes for rag_knowledge_base table
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_target_tools ON public.rag_knowledge_base USING GIN(target_tools);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_categories ON public.rag_knowledge_base USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_type ON public.rag_knowledge_base(document_type);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_complexity ON public.rag_knowledge_base(complexity_level);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_active ON public.rag_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_quality ON public.rag_knowledge_base(quality_score);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_hash ON public.rag_knowledge_base(content_hash);

-- Indexes for rag_prompt_templates table
CREATE INDEX IF NOT EXISTS idx_rag_templates_tool ON public.rag_prompt_templates(target_tool);
CREATE INDEX IF NOT EXISTS idx_rag_templates_type ON public.rag_prompt_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_rag_templates_complexity ON public.rag_prompt_templates(project_complexity);
CREATE INDEX IF NOT EXISTS idx_rag_templates_active ON public.rag_prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_rag_templates_success_rate ON public.rag_prompt_templates(success_rate);

-- Indexes for rag_retrieval_logs table
CREATE INDEX IF NOT EXISTS idx_rag_retrieval_user_id ON public.rag_retrieval_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_retrieval_type ON public.rag_retrieval_logs(query_type);
CREATE INDEX IF NOT EXISTS idx_rag_retrieval_tool ON public.rag_retrieval_logs(target_tool);
CREATE INDEX IF NOT EXISTS idx_rag_retrieval_created_at ON public.rag_retrieval_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all vector tables
ALTER TABLE public.rag_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_retrieval_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rag_knowledge_base (read-only for users, admin can manage)
CREATE POLICY "Users can view active knowledge base entries" ON public.rag_knowledge_base
    FOR SELECT USING (is_active = true);

-- RLS Policies for rag_prompt_templates (read-only for users, admin can manage)
CREATE POLICY "Users can view active prompt templates" ON public.rag_prompt_templates
    FOR SELECT USING (is_active = true);

-- RLS Policies for rag_retrieval_logs
CREATE POLICY "Users can view their own retrieval logs" ON public.rag_retrieval_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own retrieval logs" ON public.rag_retrieval_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS FOR VECTOR OPERATIONS
-- =====================================================

-- Function to search knowledge base by similarity
CREATE OR REPLACE FUNCTION search_knowledge_base(
    query_embedding vector(1536),
    target_tools_filter text[] DEFAULT NULL,
    categories_filter text[] DEFAULT NULL,
    complexity_filter text DEFAULT NULL,
    similarity_threshold float DEFAULT 0.7,
    max_results integer DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    document_type text,
    target_tools text[],
    categories text[],
    similarity_score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.title,
        kb.content,
        kb.document_type,
        kb.target_tools,
        kb.categories,
        (1 - (kb.embedding <=> query_embedding))::float as similarity_score
    FROM public.rag_knowledge_base kb
    WHERE 
        kb.is_active = true
        AND (target_tools_filter IS NULL OR kb.target_tools && target_tools_filter)
        AND (categories_filter IS NULL OR kb.categories && categories_filter)
        AND (complexity_filter IS NULL OR kb.complexity_level = complexity_filter)
        AND (1 - (kb.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search prompt templates by similarity
CREATE OR REPLACE FUNCTION search_prompt_templates(
    query_embedding vector(1536),
    target_tool_filter text DEFAULT NULL,
    template_type_filter text DEFAULT NULL,
    complexity_filter text DEFAULT NULL,
    similarity_threshold float DEFAULT 0.7,
    max_results integer DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    template_name text,
    template_content text,
    template_type text,
    target_tool text,
    required_variables jsonb,
    similarity_score float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.template_name,
        pt.template_content,
        pt.template_type,
        pt.target_tool,
        pt.required_variables,
        (1 - (pt.embedding <=> query_embedding))::float as similarity_score
    FROM public.rag_prompt_templates pt
    WHERE 
        pt.is_active = true
        AND (target_tool_filter IS NULL OR pt.target_tool = target_tool_filter)
        AND (template_type_filter IS NULL OR pt.template_type = template_type_filter)
        AND (complexity_filter IS NULL OR pt.project_complexity = complexity_filter)
        AND (1 - (pt.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY pt.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to update retrieval count when knowledge base is accessed
CREATE OR REPLACE FUNCTION update_knowledge_retrieval_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.rag_knowledge_base 
    SET 
        retrieval_count = retrieval_count + 1,
        last_retrieved_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update template usage stats
CREATE OR REPLACE FUNCTION update_template_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.rag_prompt_templates 
    SET usage_count = usage_count + 1
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the update triggers to the updated_at columns
CREATE TRIGGER update_rag_knowledge_updated_at
    BEFORE UPDATE ON public.rag_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_templates_updated_at
    BEFORE UPDATE ON public.rag_prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RAG-ENHANCED PROMPT STORAGE
-- =====================================================

-- Table to store generated prompts with RAG enhancements
CREATE TABLE IF NOT EXISTS public.rag_generated_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE,

    -- Prompt Information
    prompt_title TEXT NOT NULL,
    prompt_content TEXT NOT NULL,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('blueprint', 'screen_prompt', 'unified', 'export')),

    -- RAG Enhancement Data
    is_rag_enhanced BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2),
    enhancement_suggestions JSONB DEFAULT '[]'::jsonb,
    tool_optimizations JSONB DEFAULT '[]'::jsonb,
    knowledge_sources JSONB DEFAULT '[]'::jsonb, -- IDs of knowledge base entries used

    -- Context Information
    target_tool TEXT NOT NULL,
    stage_number INTEGER CHECK (stage_number BETWEEN 1 AND 6),
    screen_id TEXT, -- For screen-specific prompts

    -- Version Control
    version INTEGER DEFAULT 1,
    parent_prompt_id UUID REFERENCES public.rag_generated_prompts(id),
    is_current_version BOOLEAN DEFAULT TRUE,

    -- Usage Tracking
    copy_count INTEGER DEFAULT 0,
    last_copied_at TIMESTAMP WITH TIME ZONE,
    export_count INTEGER DEFAULT 0,
    last_exported_at TIMESTAMP WITH TIME ZONE,

    -- Quality Metrics
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    effectiveness_score DECIMAL(3,2),

    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store complete MVP Studio projects with RAG data
CREATE TABLE IF NOT EXISTS public.mvp_studio_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE,

    -- Project Information
    project_name TEXT NOT NULL,
    project_description TEXT,

    -- Stage Data with RAG Enhancements
    app_idea JSONB NOT NULL,
    validation_questions JSONB NOT NULL,
    app_blueprint JSONB,
    screen_prompts JSONB,
    app_flow JSONB,
    export_prompts JSONB,

    -- RAG Enhancement Summary
    rag_enhancement_summary JSONB DEFAULT '{
        "blueprint_enhanced": false,
        "screen_prompts_enhanced": false,
        "overall_confidence": 0,
        "selected_tool": null,
        "enhancement_count": 0
    }'::jsonb,

    -- Project Status
    current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 6),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) DEFAULT 0,

    -- Collaboration
    is_shared BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE,
    shared_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store prompt collections/libraries
CREATE TABLE IF NOT EXISTS public.prompt_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Collection Information
    collection_name TEXT NOT NULL,
    description TEXT,
    collection_type TEXT NOT NULL CHECK (collection_type IN ('personal', 'shared', 'template', 'favorites')),

    -- Collection Data
    prompt_ids UUID[] DEFAULT '{}',
    total_prompts INTEGER DEFAULT 0,

    -- Sharing
    is_public BOOLEAN DEFAULT FALSE,
    share_token TEXT UNIQUE,

    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PROMPT STORAGE
-- =====================================================

-- Indexes for rag_generated_prompts
CREATE INDEX IF NOT EXISTS idx_rag_prompts_user_id ON public.rag_generated_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_mvp_id ON public.rag_generated_prompts(mvp_id);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_type ON public.rag_generated_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_tool ON public.rag_generated_prompts(target_tool);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_stage ON public.rag_generated_prompts(stage_number);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_enhanced ON public.rag_generated_prompts(is_rag_enhanced);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_current ON public.rag_generated_prompts(is_current_version);
CREATE INDEX IF NOT EXISTS idx_rag_prompts_created_at ON public.rag_generated_prompts(created_at);

-- Indexes for mvp_studio_projects
CREATE INDEX IF NOT EXISTS idx_mvp_studio_user_id ON public.mvp_studio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_mvp_studio_stage ON public.mvp_studio_projects(current_stage);
CREATE INDEX IF NOT EXISTS idx_mvp_studio_completed ON public.mvp_studio_projects(is_completed);
CREATE INDEX IF NOT EXISTS idx_mvp_studio_shared ON public.mvp_studio_projects(is_shared);
CREATE INDEX IF NOT EXISTS idx_mvp_studio_created_at ON public.mvp_studio_projects(created_at);

-- Indexes for prompt_collections
CREATE INDEX IF NOT EXISTS idx_prompt_collections_user_id ON public.prompt_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_collections_type ON public.prompt_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_prompt_collections_public ON public.prompt_collections(is_public);

-- =====================================================
-- RLS POLICIES FOR PROMPT STORAGE
-- =====================================================

-- Enable RLS
ALTER TABLE public.rag_generated_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvp_studio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rag_generated_prompts
CREATE POLICY "Users can manage their own prompts" ON public.rag_generated_prompts
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for mvp_studio_projects
CREATE POLICY "Users can manage their own projects" ON public.mvp_studio_projects
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared projects" ON public.mvp_studio_projects
    FOR SELECT USING (is_shared = true OR auth.uid() = user_id);

-- RLS Policies for prompt_collections
CREATE POLICY "Users can manage their own collections" ON public.prompt_collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON public.prompt_collections
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- =====================================================
-- ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get RAG generation statistics
CREATE OR REPLACE FUNCTION get_rag_generation_stats(
    date_filter text DEFAULT '',
    tool_filter text DEFAULT '',
    user_filter text DEFAULT ''
)
RETURNS TABLE (
    total_generations bigint,
    avg_confidence_score numeric,
    success_rate numeric,
    avg_prompt_length numeric
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT
            COUNT(*)::bigint as total_generations,
            COALESCE(AVG(confidence_score), 0)::numeric as avg_confidence_score,
            COALESCE(AVG(CASE WHEN was_successful THEN 1.0 ELSE 0.0 END), 0)::numeric as success_rate,
            COALESCE(AVG(prompt_length), 0)::numeric as avg_prompt_length
        FROM public.rag_prompt_generations
        WHERE 1=1 %s %s %s',
        date_filter, tool_filter, user_filter
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tool performance metrics
CREATE OR REPLACE FUNCTION get_tool_performance_metrics(
    timeframe_days integer DEFAULT 30
)
RETURNS TABLE (
    target_tool text,
    generation_count bigint,
    avg_confidence_score numeric,
    success_rate numeric,
    avg_generation_time numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rpg.target_tool,
        COUNT(*)::bigint as generation_count,
        COALESCE(AVG(rpg.confidence_score), 0)::numeric as avg_confidence_score,
        COALESCE(AVG(CASE WHEN rpg.was_successful THEN 1.0 ELSE 0.0 END), 0)::numeric as success_rate,
        COALESCE(AVG(rpg.generation_time_ms), 0)::numeric as avg_generation_time
    FROM public.rag_prompt_generations rpg
    WHERE rpg.created_at >= NOW() - INTERVAL '%s days'
    GROUP BY rpg.target_tool
    ORDER BY generation_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
