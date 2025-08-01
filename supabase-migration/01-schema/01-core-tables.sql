-- =====================================================
-- CORE TABLES SCHEMA FOR MVP STUDIO
-- =====================================================
-- This file contains the core application tables
-- Run this first before other schema files

-- Enable necessary extensions with proper error handling
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    RAISE NOTICE 'Extension uuid-ossp enabled successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to enable uuid-ossp extension: %', SQLERRM;
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    RAISE NOTICE 'Extension pgcrypto enabled successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to enable pgcrypto extension: %', SQLERRM;
END $$;

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================

-- Extended user profile information beyond Supabase auth
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    mvp_limit INTEGER DEFAULT 3 CHECK (mvp_limit >= 0),
    export_limit INTEGER DEFAULT 10 CHECK (export_limit >= 0),
    api_calls_limit INTEGER DEFAULT 100 CHECK (api_calls_limit >= 0),
    
    -- Preferences
    default_ai_tool TEXT,
    preferred_platforms TEXT[] DEFAULT ARRAY['web'],
    preferred_style TEXT DEFAULT 'Minimal & Clean',
    
    -- Usage tracking
    mvps_created INTEGER DEFAULT 0 CHECK (mvps_created >= 0),
    exports_generated INTEGER DEFAULT 0 CHECK (exports_generated >= 0),
    api_calls_made INTEGER DEFAULT 0 CHECK (api_calls_made >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MVP PROJECTS TABLE
-- =====================================================

-- Core MVP projects table supporting both simple generator and MVP Studio
CREATE TABLE IF NOT EXISTS public.mvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic MVP Information
    app_name TEXT NOT NULL CHECK (LENGTH(TRIM(app_name)) > 0),
    platforms TEXT[] NOT NULL CHECK (platforms IS NOT NULL AND array_length(platforms, 1) > 0),
    style TEXT NOT NULL CHECK (style IN ('Minimal & Clean', 'Playful & Animated', 'Business & Professional')),
    style_description TEXT,
    app_description TEXT NOT NULL CHECK (LENGTH(TRIM(app_description)) > 0),
    target_users TEXT,
    
    -- MVP Studio Enhanced Data
    generated_prompt TEXT NOT NULL CHECK (LENGTH(TRIM(generated_prompt)) > 0),
    app_blueprint JSONB, -- Stores the complete app blueprint from Stage 3
    screen_prompts JSONB, -- Stores individual screen prompts from Stage 4
    app_flow JSONB, -- Stores navigation flow from Stage 5
    export_prompts JSONB, -- Stores final export data from Stage 6
    
    -- Project Management
    status TEXT DEFAULT 'Yet To Build' CHECK (status IN ('Yet To Build', 'Built', 'Launched', 'Abandoned')),
    completion_stage INTEGER DEFAULT 1 CHECK (completion_stage BETWEEN 1 AND 6),
    is_mvp_studio_project BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    estimated_hours INTEGER CHECK (estimated_hours IS NULL OR estimated_hours > 0),
    actual_hours INTEGER CHECK (actual_hours IS NULL OR actual_hours > 0),
    complexity_score INTEGER CHECK (complexity_score BETWEEN 1 AND 10),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for case-insensitive app name per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_mvps_user_app_name_unique
    ON public.mvps(user_id, LOWER(app_name));

-- =====================================================
-- 3. QUESTIONNAIRE RESPONSES TABLE
-- =====================================================

-- Validation questionnaire responses for MVP projects
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
    timeline_weeks INTEGER CHECK (timeline_weeks IS NULL OR timeline_weeks > 0),
    budget_range TEXT,
    team_size INTEGER DEFAULT 1 CHECK (team_size > 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one questionnaire per MVP
    UNIQUE(mvp_id)
);

-- =====================================================
-- 4. MVP STUDIO SESSIONS TABLE
-- =====================================================

-- Auto-save sessions for MVP Studio builder
CREATE TABLE IF NOT EXISTS public.mvp_studio_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE,
    
    -- Session Data
    session_data JSONB NOT NULL, -- Stores the complete builder state
    current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 6),
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Progress tracking
    stages_completed INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    time_spent_minutes INTEGER DEFAULT 0 CHECK (time_spent_minutes >= 0),
    
    -- Auto-save functionality
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. EXPORT HISTORY TABLE
-- =====================================================

-- Track export generations and downloads
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE NOT NULL,
    
    -- Export details
    export_type TEXT NOT NULL CHECK (export_type IN ('prompt', 'blueprint', 'full_project')),
    target_tool TEXT NOT NULL,
    export_format TEXT DEFAULT 'text' CHECK (export_format IN ('text', 'markdown', 'json')),
    
    -- Content
    export_content TEXT NOT NULL CHECK (LENGTH(TRIM(export_content)) > 0),
    export_size_bytes INTEGER CHECK (export_size_bytes IS NULL OR export_size_bytes >= 0),
    
    -- Metadata
    generation_time_ms INTEGER CHECK (generation_time_ms IS NULL OR generation_time_ms >= 0),
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. FEEDBACK TABLE
-- =====================================================

-- User feedback and support ticket system
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feedback Content
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general')),
    title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    description TEXT NOT NULL CHECK (LENGTH(TRIM(description)) > 0),
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

-- =====================================================
-- 7. ANALYTICS EVENTS TABLE
-- =====================================================

-- User interaction and system event tracking
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event Data
    event_type TEXT NOT NULL, -- 'mvp_created', 'stage_completed', 'export_generated', etc.
    event_data JSONB,
    
    -- Context
    session_id TEXT,
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Performance metrics
    page_load_time_ms INTEGER CHECK (page_load_time_ms IS NULL OR page_load_time_ms >= 0),
    api_response_time_ms INTEGER CHECK (api_response_time_ms IS NULL OR api_response_time_ms >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. RATE LIMITS TABLE
-- =====================================================

-- Rate limiting tracking for various resources
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Rate Limit Data
    resource_type TEXT NOT NULL, -- 'mvp_generation', 'export_generation', 'api_calls', etc.
    count INTEGER DEFAULT 0 CHECK (count >= 0),
    reset_date DATE NOT NULL,
    
    -- Limits based on subscription
    daily_limit INTEGER NOT NULL CHECK (daily_limit > 0),
    monthly_limit INTEGER CHECK (monthly_limit IS NULL OR monthly_limit > 0),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, resource_type, reset_date)
);

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information beyond Supabase auth';
COMMENT ON TABLE public.mvps IS 'Core MVP projects table supporting both simple generator and MVP Studio';
COMMENT ON TABLE public.questionnaire IS 'Validation questionnaire responses for MVP projects';
COMMENT ON TABLE public.mvp_studio_sessions IS 'Auto-save sessions for MVP Studio builder';
COMMENT ON TABLE public.export_history IS 'Export generation and download history';
COMMENT ON TABLE public.feedback IS 'User feedback and support ticket system';
COMMENT ON TABLE public.analytics_events IS 'User interaction and system event tracking';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracking for various resources';
