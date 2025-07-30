-- =====================================================
-- MVP STUDIO COMPLETE DATABASE SCHEMA & QUERIES
-- =====================================================
-- This file contains all SQL queries for MVP Studio functionality
-- including user management, MVP projects, rate limiting, and analytics

-- =====================================================
-- 1. CORE TABLES SCHEMA
-- =====================================================

-- Users table (handled by Supabase Auth, but we can extend it)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    mvp_limit INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MVP Projects table
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
    app_blueprint JSONB, -- Stores the complete app blueprint from Stage 3
    screen_prompts JSONB, -- Stores individual screen prompts from Stage 4
    app_flow JSONB, -- Stores navigation flow from Stage 5
    export_prompts JSONB, -- Stores final export data from Stage 6
    
    -- Project Management
    status TEXT DEFAULT 'Yet To Build' CHECK (status IN ('Yet To Build', 'Built', 'Launched', 'Abandoned')),
    completion_stage INTEGER DEFAULT 1 CHECK (completion_stage BETWEEN 1 AND 6),
    is_mvp_studio_project BOOLEAN DEFAULT FALSE,
    
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MVP Studio Sessions table (for tracking user progress)
CREATE TABLE IF NOT EXISTS public.mvp_studio_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mvp_id UUID REFERENCES public.mvps(id) ON DELETE CASCADE,
    
    -- Session Data
    session_data JSONB NOT NULL, -- Stores the complete builder state
    current_stage INTEGER DEFAULT 1 CHECK (current_stage BETWEEN 1 AND 6),
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Auto-save functionality
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    admin_response TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table for tracking usage
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Rate Limit Data
    resource_type TEXT NOT NULL, -- 'mvp_generation', 'export_generation', etc.
    count INTEGER DEFAULT 0,
    reset_date DATE NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, resource_type, reset_date)
);

-- =====================================================
-- 2. INDEXES FOR PERFORMANCE
-- =====================================================

-- MVP table indexes
CREATE INDEX IF NOT EXISTS idx_mvps_user_id ON public.mvps(user_id);
CREATE INDEX IF NOT EXISTS idx_mvps_status ON public.mvps(status);
CREATE INDEX IF NOT EXISTS idx_mvps_created_at ON public.mvps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mvps_is_mvp_studio ON public.mvps(is_mvp_studio_project);
CREATE INDEX IF NOT EXISTS idx_mvps_completion_stage ON public.mvps(completion_stage);

-- Questionnaire indexes
CREATE INDEX IF NOT EXISTS idx_questionnaire_mvp_id ON public.questionnaire(mvp_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id ON public.questionnaire(user_id);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.mvp_studio_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mvp_id ON public.mvp_studio_sessions(mvp_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_saved ON public.mvp_studio_sessions(last_saved_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);

-- Rate limit indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_resource ON public.rate_limits(user_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_date ON public.rate_limits(reset_date);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvp_studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- MVP policies
CREATE POLICY "Users can view own MVPs" ON public.mvps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own MVPs" ON public.mvps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MVPs" ON public.mvps
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own MVPs" ON public.mvps
    FOR DELETE USING (auth.uid() = user_id);

-- Questionnaire policies
CREATE POLICY "Users can view own questionnaires" ON public.questionnaire
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own questionnaires" ON public.questionnaire
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Session policies
CREATE POLICY "Users can manage own sessions" ON public.mvp_studio_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Feedback policies
CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Analytics policies (users can only insert, not read)
CREATE POLICY "Users can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Rate limit policies
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (true); -- This will be restricted by application logic

-- =====================================================
-- 4. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mvps_updated_at BEFORE UPDATE ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questionnaire_updated_at BEFORE UPDATE ON public.questionnaire
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to track analytics events
CREATE OR REPLACE FUNCTION track_mvp_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.analytics_events (user_id, event_type, event_data)
    VALUES (
        NEW.user_id,
        'mvp_created',
        jsonb_build_object(
            'mvp_id', NEW.id,
            'app_name', NEW.app_name,
            'platforms', NEW.platforms,
            'style', NEW.style,
            'is_mvp_studio', NEW.is_mvp_studio_project
        )
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_mvp_creation_trigger AFTER INSERT ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION track_mvp_creation();
