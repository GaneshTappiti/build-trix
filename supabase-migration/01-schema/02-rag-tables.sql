-- =====================================================
-- RAG SYSTEM TABLES SCHEMA
-- =====================================================
-- This file contains the RAG (Retrieval-Augmented Generation) system tables
-- Run this after 01-core-tables.sql

-- =====================================================
-- 1. RAG KNOWLEDGE BASE TABLE
-- =====================================================

-- Knowledge base for RAG system with vector embeddings
CREATE TABLE IF NOT EXISTS public.rag_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Document Information
    title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    content TEXT NOT NULL CHECK (LENGTH(TRIM(content)) > 0),
    document_type TEXT NOT NULL CHECK (document_type IN ('best_practice', 'example', 'template', 'guide', 'reference', 'tutorial')),
    
    -- Categorization
    target_tools TEXT[] NOT NULL CHECK (target_tools IS NOT NULL AND array_length(target_tools, 1) > 0), -- Array of supported tools
    categories TEXT[] NOT NULL CHECK (categories IS NOT NULL AND array_length(categories, 1) > 0), -- Array of categories like 'ui', 'backend', 'deployment'
    complexity_level TEXT NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Content metadata
    source_url TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
    
    -- Vector embedding (for similarity search) - will be added conditionally
    embedding_text TEXT, -- Fallback: store embedding as text if vector extension not available
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Management
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add vector column conditionally if extension is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        -- Check if column doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'rag_knowledge_base'
            AND column_name = 'embedding'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.rag_knowledge_base ADD COLUMN embedding vector(1536);
            RAISE NOTICE 'Vector column added to rag_knowledge_base table';
        ELSE
            RAISE NOTICE 'Vector column already exists in rag_knowledge_base table';
        END IF;
    ELSE
        RAISE NOTICE 'Vector extension not available, using text-based embeddings';
    END IF;
END $$;

-- =====================================================
-- 2. RAG PROMPT GENERATIONS TABLE
-- =====================================================

-- Log RAG prompt generations for analytics and improvement
CREATE TABLE IF NOT EXISTS public.rag_prompt_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Project Information
    app_name TEXT NOT NULL CHECK (LENGTH(TRIM(app_name)) > 0),
    target_tool TEXT NOT NULL CHECK (LENGTH(TRIM(target_tool)) > 0), -- SupportedTool enum value
    stage TEXT NOT NULL CHECK (LENGTH(TRIM(stage)) > 0), -- PromptStage enum value
    
    -- Generation Metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prompt_length INTEGER NOT NULL CHECK (prompt_length > 0),
    generation_time_ms INTEGER CHECK (generation_time_ms IS NULL OR generation_time_ms >= 0), -- Time taken to generate prompt
    
    -- Context Information
    project_complexity TEXT CHECK (project_complexity IN ('simple', 'medium', 'complex')),
    technical_experience TEXT CHECK (technical_experience IN ('beginner', 'intermediate', 'advanced')),
    platforms TEXT[] NOT NULL CHECK (platforms IS NOT NULL AND array_length(platforms, 1) > 0),
    design_style TEXT NOT NULL CHECK (LENGTH(TRIM(design_style)) > 0),
    
    -- RAG Enhancement Data
    knowledge_documents_used UUID[] DEFAULT ARRAY[]::UUID[], -- References to rag_knowledge_base
    enhancement_suggestions JSONB, -- Array of suggestions
    tool_optimizations_applied JSONB, -- Array of optimizations applied
    
    -- Generated content
    original_prompt TEXT,
    enhanced_prompt TEXT NOT NULL CHECK (LENGTH(TRIM(enhanced_prompt)) > 0),
    
    -- Success Metrics
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. RAG TOOL PROFILES TABLE
-- =====================================================

-- AI tool profiles for RAG system optimization
CREATE TABLE IF NOT EXISTS public.rag_tool_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Tool Information
    tool_id TEXT UNIQUE NOT NULL CHECK (LENGTH(TRIM(tool_id)) > 0), -- SupportedTool enum value
    tool_name TEXT NOT NULL CHECK (LENGTH(TRIM(tool_name)) > 0),
    tool_description TEXT,
    tool_category TEXT NOT NULL CHECK (LENGTH(TRIM(tool_category)) > 0), -- 'code_editor', 'ui_generator', 'ai_assistant', etc.
    complexity_level TEXT NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Tool capabilities
    supported_platforms TEXT[] NOT NULL CHECK (supported_platforms IS NOT NULL AND array_length(supported_platforms, 1) > 0),
    supported_languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    supported_frameworks TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Profile Configuration
    format_preference TEXT NOT NULL CHECK (LENGTH(TRIM(format_preference)) > 0),
    tone_preference TEXT NOT NULL CHECK (LENGTH(TRIM(tone_preference)) > 0),
    preferred_use_cases JSONB NOT NULL, -- Array of use cases
    constraints JSONB NOT NULL, -- Array of constraints
    optimization_tips JSONB NOT NULL, -- Array of tips
    common_pitfalls JSONB NOT NULL, -- Array of pitfalls
    
    -- Prompting Strategies
    prompting_strategies JSONB NOT NULL, -- Array of strategy objects
    stage_templates JSONB, -- Object mapping stages to templates
    
    -- Performance metrics
    average_success_rate DECIMAL(3,2) DEFAULT 0.5,
    total_generations INTEGER DEFAULT 0 CHECK (total_generations >= 0),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    version TEXT DEFAULT '1.0',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. RAG USER PREFERENCES TABLE
-- =====================================================

-- User preferences for RAG system personalization
CREATE TABLE IF NOT EXISTS public.rag_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Default Preferences
    default_ai_tool TEXT, -- SupportedTool enum value
    default_complexity TEXT CHECK (default_complexity IN ('simple', 'medium', 'complex')),
    default_experience TEXT CHECK (default_experience IN ('beginner', 'intermediate', 'advanced')),
    
    -- Feature Preferences
    enable_enhancement_suggestions BOOLEAN DEFAULT TRUE,
    enable_confidence_scoring BOOLEAN DEFAULT TRUE,
    enable_tool_recommendations BOOLEAN DEFAULT TRUE,
    enable_auto_optimization BOOLEAN DEFAULT FALSE,
    
    -- Personalization
    preferred_prompt_style TEXT DEFAULT 'structured' CHECK (preferred_prompt_style IN ('structured', 'conversational', 'technical', 'creative')),
    preferred_detail_level TEXT DEFAULT 'medium' CHECK (preferred_detail_level IN ('minimal', 'medium', 'detailed', 'comprehensive')),
    
    -- Usage Statistics
    total_prompts_generated INTEGER DEFAULT 0 CHECK (total_prompts_generated >= 0),
    favorite_tools JSONB DEFAULT '[]'::jsonb, -- Array of frequently used tools
    most_used_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Learning preferences
    learning_mode BOOLEAN DEFAULT FALSE, -- Show educational tips
    feedback_frequency TEXT DEFAULT 'sometimes' CHECK (feedback_frequency IN ('never', 'rarely', 'sometimes', 'often', 'always')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. RAG ANALYTICS TABLE
-- =====================================================

-- Analytics for RAG system performance and usage
CREATE TABLE IF NOT EXISTS public.rag_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event information
    event_type TEXT NOT NULL, -- 'prompt_generated', 'knowledge_retrieved', 'tool_recommended', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Context
    tool_id TEXT,
    stage TEXT,
    complexity_level TEXT,
    
    -- Performance metrics
    response_time_ms INTEGER CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    knowledge_documents_count INTEGER CHECK (knowledge_documents_count IS NULL OR knowledge_documents_count >= 0),
    similarity_scores DECIMAL(3,2)[],
    
    -- Quality metrics
    confidence_score DECIMAL(3,2),
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    
    -- Event data
    event_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. RAG FEEDBACK TABLE
-- =====================================================

-- User feedback specifically for RAG system improvements
CREATE TABLE IF NOT EXISTS public.rag_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_generation_id UUID REFERENCES public.rag_prompt_generations(id) ON DELETE CASCADE,
    
    -- Feedback details
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('quality', 'accuracy', 'relevance', 'completeness', 'bug')),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    
    -- Specific feedback
    was_helpful BOOLEAN,
    would_use_again BOOLEAN,
    suggestions TEXT,
    
    -- Context
    what_worked_well TEXT,
    what_could_improve TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE public.rag_knowledge_base IS 'Knowledge base for RAG system with vector embeddings';
COMMENT ON TABLE public.rag_prompt_generations IS 'Log RAG prompt generations for analytics and improvement';
COMMENT ON TABLE public.rag_tool_profiles IS 'AI tool profiles for RAG system optimization';
COMMENT ON TABLE public.rag_user_preferences IS 'User preferences for RAG system personalization';
COMMENT ON TABLE public.rag_analytics IS 'Analytics for RAG system performance and usage';
COMMENT ON TABLE public.rag_feedback IS 'User feedback specifically for RAG system improvements';
