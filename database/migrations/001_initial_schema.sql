-- =====================================================
-- MVP STUDIO - INITIAL SCHEMA MIGRATION
-- =====================================================
-- Migration: 001_initial_schema.sql
-- Description: Creates all core tables for MVP Studio
-- Dependencies: Supabase Auth (auth.users table)
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Extends Supabase auth.users with additional profile information

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Profile Information
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    
    -- Subscription & Limits
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    mvp_limit INTEGER DEFAULT 3,
    export_limit INTEGER DEFAULT 10,
    
    -- Preferences
    preferred_ai_tool TEXT DEFAULT 'cursor' CHECK (preferred_ai_tool IN ('cursor', 'v0', 'claude', 'chatgpt', 'bolt')),
    email_notifications BOOLEAN DEFAULT true,
    
    -- Metadata
    onboarding_completed BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. MVP PROJECTS TABLE
-- =====================================================
-- Core table for storing MVP projects from both simple generator and MVP Studio

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
    
    -- Generated Content
    generated_prompt TEXT NOT NULL,
    
    -- MVP Studio Enhanced Data (JSONB for flexibility)
    app_blueprint JSONB, -- Stage 3: App structure, screens, user roles, data models
    screen_prompts JSONB, -- Stage 4: Individual screen implementation prompts
    app_flow JSONB, -- Stage 5: Navigation flow and user journey
    export_prompts JSONB, -- Stage 6: Final export data for AI tools
    
    -- Project Management
    status TEXT DEFAULT 'Yet To Build' CHECK (status IN ('Yet To Build', 'Built', 'Launched', 'Abandoned')),
    completion_stage INTEGER DEFAULT 1 CHECK (completion_stage BETWEEN 1 AND 6),
    is_mvp_studio_project BOOLEAN DEFAULT FALSE,
    
    -- Collaboration (for future use)
    is_public BOOLEAN DEFAULT FALSE,
    collaborators UUID[] DEFAULT '{}',
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    estimated_hours INTEGER,
    actual_hours INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. QUESTIONNAIRE TABLE
-- =====================================================
-- Stores validation questionnaire responses

CREATE TABLE IF NOT EXISTS public.questionnaire (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Basic Validation Questions (from simple generator)
    idea_validated BOOLEAN NOT NULL DEFAULT FALSE,
    talked_to_people BOOLEAN NOT NULL DEFAULT FALSE,
    motivation TEXT,
    
    -- Extended MVP Studio Questions
    target_market_research BOOLEAN DEFAULT FALSE,
    competitive_analysis BOOLEAN DEFAULT FALSE,
    technical_feasibility BOOLEAN DEFAULT FALSE,
    business_model_defined BOOLEAN DEFAULT FALSE,
    mvp_scope_defined BOOLEAN DEFAULT FALSE,
    
    -- Additional Insights
    validation_notes TEXT,
    research_links TEXT[],
    competitor_analysis JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one questionnaire per MVP
    UNIQUE(mvp_id)
);

-- =====================================================
-- 4. MVP STUDIO SESSIONS TABLE
-- =====================================================
-- Tracks user sessions and enables auto-save functionality

CREATE TABLE IF NOT EXISTS public.mvp_studio_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE,
    
    -- Session Data
    session_data JSONB NOT NULL, -- Complete builder state for recovery
    current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 6),
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Progress Tracking
    stages_completed INTEGER[] DEFAULT '{}',
    time_spent_minutes INTEGER DEFAULT 0,
    
    -- Auto-save Metadata
    auto_save_count INTEGER DEFAULT 0,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Session Context
    browser_info JSONB,
    ip_address INET,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active session per user-mvp combination
    UNIQUE(user_id, mvp_id)
);

-- =====================================================
-- 5. FEEDBACK TABLE
-- =====================================================
-- User feedback and support system

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feedback Content
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'general', 'support')),
    category TEXT CHECK (category IN ('mvp_studio', 'dashboard', 'export', 'ui_ux', 'performance', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Context Information
    page_url TEXT,
    user_agent TEXT,
    browser_info JSONB,
    screenshot_url TEXT,
    
    -- Status Management
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'duplicate')),
    admin_response TEXT,
    admin_user_id UUID,
    resolution_notes TEXT,
    
    -- Voting/Rating
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 6. ANALYTICS EVENTS TABLE
-- =====================================================
-- Tracks user interactions and system events

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Event Information
    event_type TEXT NOT NULL, -- 'mvp_created', 'stage_completed', 'export_generated', etc.
    event_category TEXT, -- 'mvp_studio', 'dashboard', 'export', etc.
    event_data JSONB, -- Flexible event-specific data
    
    -- Context
    session_id TEXT,
    page_url TEXT,
    referrer_url TEXT,
    user_agent TEXT,
    ip_address INET,
    
    -- Performance Metrics
    load_time_ms INTEGER,
    interaction_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. RATE LIMITS TABLE
-- =====================================================
-- Tracks rate limiting for various resources

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Rate Limit Configuration
    resource_type TEXT NOT NULL, -- 'mvp_generation', 'export_generation', 'ai_requests', etc.
    limit_value INTEGER NOT NULL,
    window_type TEXT NOT NULL CHECK (window_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    
    -- Current Usage
    current_count INTEGER DEFAULT 0,
    reset_date DATE NOT NULL,
    
    -- Metadata
    first_request_at TIMESTAMP WITH TIME ZONE,
    last_request_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique rate limit per user-resource-period
    UNIQUE(user_id, resource_type, reset_date)
);

-- =====================================================
-- 8. EXPORT HISTORY TABLE
-- =====================================================
-- Tracks export generations and downloads

CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE NOT NULL,
    
    -- Export Details
    export_type TEXT NOT NULL CHECK (export_type IN ('unified_prompt', 'screen_prompts', 'full_package')),
    target_tool TEXT NOT NULL CHECK (target_tool IN ('cursor', 'v0', 'claude', 'chatgpt', 'bolt', 'custom')),
    
    -- Export Content
    export_data JSONB NOT NULL,
    file_size_bytes INTEGER,
    
    -- Status
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    error_message TEXT,
    
    -- Usage Tracking
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information beyond Supabase auth';
COMMENT ON TABLE public.mvps IS 'Core MVP projects table supporting both simple generator and MVP Studio';
COMMENT ON TABLE public.questionnaire IS 'Validation questionnaire responses for MVP projects';
COMMENT ON TABLE public.mvp_studio_sessions IS 'Auto-save sessions for MVP Studio builder';
COMMENT ON TABLE public.feedback IS 'User feedback and support ticket system';
COMMENT ON TABLE public.analytics_events IS 'User interaction and system event tracking';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracking for various resources';
COMMENT ON TABLE public.export_history IS 'Export generation and download history';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next: Run 002_indexes.sql for performance optimization
