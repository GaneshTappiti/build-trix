-- =====================================================
-- COMPLETE SUPABASE MIGRATION SCRIPT
-- =====================================================
-- This script runs the complete migration for MVP Studio
-- Execute this in Supabase SQL Editor or via psql

-- =====================================================
-- MIGRATION INFORMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'MVP STUDIO - SUPABASE MIGRATION';
    RAISE NOTICE 'Version: 1.0';
    RAISE NOTICE 'Date: %', NOW();
    RAISE NOTICE '=================================================';
END $$;

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Step 1: Enabling PostgreSQL extensions...';
END $$;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable vector extension for RAG system (if available)
-- Note: This requires pgvector extension to be installed
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- 2. CREATE CORE TABLES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Step 2: Creating core application tables...';
END $$;

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    mvp_limit INTEGER DEFAULT 3,
    export_limit INTEGER DEFAULT 10,
    api_calls_limit INTEGER DEFAULT 100,
    
    -- Preferences
    default_ai_tool TEXT,
    preferred_platforms TEXT[] DEFAULT ARRAY['web'],
    preferred_style TEXT DEFAULT 'Minimal & Clean',
    
    -- Usage tracking
    mvps_created INTEGER DEFAULT 0,
    exports_generated INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MVP projects table
CREATE TABLE IF NOT EXISTS public.mvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic MVP Information
    app_name TEXT NOT NULL,
    platforms TEXT[] NOT NULL CHECK (array_length(platforms, 1) > 0),
    style TEXT NOT NULL CHECK (style IN ('Minimal & Clean', 'Playful & Animated', 'Business & Professional')),
    style_description TEXT,
    app_description TEXT NOT NULL,
    target_users TEXT,
    
    -- MVP Studio Enhanced Data
    generated_prompt TEXT NOT NULL,
    app_blueprint JSONB,
    screen_prompts JSONB,
    app_flow JSONB,
    export_prompts JSONB,
    
    -- Project Management
    status TEXT DEFAULT 'Yet To Build' CHECK (status IN ('Yet To Build', 'Built', 'Launched', 'Abandoned')),
    completion_stage INTEGER DEFAULT 1 CHECK (completion_stage BETWEEN 1 AND 6),
    is_mvp_studio_project BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    estimated_hours INTEGER,
    actual_hours INTEGER,
    complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 10),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questionnaire responses table
CREATE TABLE IF NOT EXISTS public.questionnaire (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Validation Questions
    idea_validated BOOLEAN NOT NULL DEFAULT FALSE,
    talked_to_people BOOLEAN NOT NULL DEFAULT FALSE,
    motivation TEXT,
    
    -- Additional MVP Studio Questions
    target_market_research BOOLEAN DEFAULT FALSE,
    competitive_analysis BOOLEAN DEFAULT FALSE,
    technical_feasibility BOOLEAN DEFAULT FALSE,
    
    -- AI Tool Preferences
    preferred_ai_tool TEXT,
    project_complexity TEXT CHECK (project_complexity IN ('simple', 'medium', 'complex')),
    technical_experience TEXT CHECK (technical_experience IN ('beginner', 'intermediate', 'advanced')),
    
    -- Additional context
    timeline_weeks INTEGER,
    budget_range TEXT,
    team_size INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MVP Studio sessions table
CREATE TABLE IF NOT EXISTS public.mvp_studio_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE,
    
    -- Session Data
    session_data JSONB NOT NULL,
    current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 6),
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Progress tracking
    stages_completed INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    time_spent_minutes INTEGER DEFAULT 0,
    
    -- Auto-save functionality
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export history table
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE NOT NULL,
    
    -- Export details
    export_type TEXT NOT NULL CHECK (export_type IN ('prompt', 'blueprint', 'full_project')),
    target_tool TEXT NOT NULL,
    export_format TEXT DEFAULT 'text' CHECK (export_format IN ('text', 'markdown', 'json')),
    
    -- Content
    export_content TEXT NOT NULL,
    export_size_bytes INTEGER,
    
    -- Metadata
    generation_time_ms INTEGER,
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feedback Content
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Context
    page_url TEXT,
    user_agent TEXT,
    browser_info JSONB,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE SET NULL,
    
    -- Attachments
    screenshot_url TEXT,
    additional_files TEXT[],
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_response TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event Data
    event_type TEXT NOT NULL,
    event_data JSONB,
    
    -- Context
    session_id TEXT,
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Performance metrics
    page_load_time_ms INTEGER,
    api_response_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Rate Limit Data
    resource_type TEXT NOT NULL,
    count INTEGER DEFAULT 0,
    reset_date DATE NOT NULL,
    
    -- Limits based on subscription
    daily_limit INTEGER NOT NULL,
    monthly_limit INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, resource_type, reset_date)
);

-- =====================================================
-- 3. CREATE RAG SYSTEM TABLES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Step 3: Creating RAG system tables...';
END $$;

-- RAG knowledge base table
CREATE TABLE IF NOT EXISTS public.rag_knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Document Information
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('best_practice', 'example', 'template', 'guide', 'reference', 'tutorial')),
    
    -- Categorization
    target_tools TEXT[] NOT NULL,
    categories TEXT[] NOT NULL,
    complexity_level TEXT NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Content metadata
    source_url TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    quality_score DECIMAL(3,2) DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
    
    -- Vector embedding (uncomment if pgvector is available)
    -- embedding vector(1536),
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
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

-- RAG prompt generations table
CREATE TABLE IF NOT EXISTS public.rag_prompt_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Project Information
    app_name TEXT NOT NULL,
    target_tool TEXT NOT NULL,
    stage TEXT NOT NULL,
    
    -- Generation Metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prompt_length INTEGER NOT NULL,
    generation_time_ms INTEGER,
    
    -- Context Information
    project_complexity TEXT CHECK (project_complexity IN ('simple', 'medium', 'complex')),
    technical_experience TEXT CHECK (technical_experience IN ('beginner', 'intermediate', 'advanced')),
    platforms TEXT[] NOT NULL,
    design_style TEXT NOT NULL,
    
    -- RAG Enhancement Data
    knowledge_documents_used UUID[] DEFAULT ARRAY[]::UUID[],
    enhancement_suggestions JSONB,
    tool_optimizations_applied JSONB,
    
    -- Generated content
    original_prompt TEXT,
    enhanced_prompt TEXT NOT NULL,
    
    -- Success Metrics
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    user_feedback_rating INTEGER CHECK (user_feedback_rating BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG tool profiles table
CREATE TABLE IF NOT EXISTS public.rag_tool_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Tool Information
    tool_id TEXT UNIQUE NOT NULL,
    tool_name TEXT NOT NULL,
    tool_description TEXT,
    tool_category TEXT NOT NULL,
    complexity_level TEXT NOT NULL CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
    
    -- Tool capabilities
    supported_platforms TEXT[] NOT NULL,
    supported_languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    supported_frameworks TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Profile Configuration
    format_preference TEXT NOT NULL,
    tone_preference TEXT NOT NULL,
    preferred_use_cases JSONB NOT NULL,
    constraints JSONB NOT NULL,
    optimization_tips JSONB NOT NULL,
    common_pitfalls JSONB NOT NULL,
    
    -- Prompting Strategies
    prompting_strategies JSONB NOT NULL,
    stage_templates JSONB,
    
    -- Performance metrics
    average_success_rate DECIMAL(3,2) DEFAULT 0.5,
    total_generations INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    version TEXT DEFAULT '1.0',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG user preferences table
CREATE TABLE IF NOT EXISTS public.rag_user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Default Preferences
    default_ai_tool TEXT,
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
    total_prompts_generated INTEGER DEFAULT 0,
    favorite_tools JSONB DEFAULT '[]'::jsonb,
    most_used_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Learning preferences
    learning_mode BOOLEAN DEFAULT FALSE,
    feedback_frequency TEXT DEFAULT 'sometimes' CHECK (feedback_frequency IN ('never', 'rarely', 'sometimes', 'often', 'always')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG analytics table
CREATE TABLE IF NOT EXISTS public.rag_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Event information
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Context
    tool_id TEXT,
    stage TEXT,
    complexity_level TEXT,
    
    -- Performance metrics
    response_time_ms INTEGER,
    knowledge_documents_count INTEGER,
    similarity_scores DECIMAL(3,2)[],
    
    -- Quality metrics
    confidence_score DECIMAL(3,2),
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    
    -- Event data
    event_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RAG feedback table
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

DO $$
BEGIN
    RAISE NOTICE 'Tables created successfully!';
    RAISE NOTICE 'Next: Run the remaining migration files in order:';
    RAISE NOTICE '  - 01-schema/03-indexes.sql';
    RAISE NOTICE '  - 01-schema/04-rls-policies.sql';
    RAISE NOTICE '  - 01-schema/05-triggers-functions.sql';
    RAISE NOTICE '  - 02-functions/auth/user-management.sql';
    RAISE NOTICE '  - 02-functions/mvp/crud-operations.sql';
    RAISE NOTICE '  - 04-seed-data/tool-profiles.sql';
END $$;
