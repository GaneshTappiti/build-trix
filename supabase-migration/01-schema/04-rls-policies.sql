-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- This file contains all RLS policies for data security
-- Run this after creating tables and indexes

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Core tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvp_studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RAG tables
ALTER TABLE public.rag_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_prompt_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_tool_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_feedback ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. USER PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. MVP PROJECTS POLICIES
-- =====================================================

-- Users can view their own MVPs
CREATE POLICY "Users can view own MVPs" ON public.mvps
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view public MVPs
CREATE POLICY "Users can view public MVPs" ON public.mvps
    FOR SELECT USING (is_public = true);

-- Users can create their own MVPs
CREATE POLICY "Users can create own MVPs" ON public.mvps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own MVPs
CREATE POLICY "Users can update own MVPs" ON public.mvps
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own MVPs
CREATE POLICY "Users can delete own MVPs" ON public.mvps
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. QUESTIONNAIRE POLICIES
-- =====================================================

-- Users can view their own questionnaires
CREATE POLICY "Users can view own questionnaires" ON public.questionnaire
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own questionnaires
CREATE POLICY "Users can create own questionnaires" ON public.questionnaire
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own questionnaires
CREATE POLICY "Users can update own questionnaires" ON public.questionnaire
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own questionnaires
CREATE POLICY "Users can delete own questionnaires" ON public.questionnaire
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. MVP STUDIO SESSIONS POLICIES
-- =====================================================

-- Users can manage their own sessions
CREATE POLICY "Users can manage own sessions" ON public.mvp_studio_sessions
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 6. EXPORT HISTORY POLICIES
-- =====================================================

-- Users can view their own export history
CREATE POLICY "Users can view own exports" ON public.export_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own export records
CREATE POLICY "Users can create own exports" ON public.export_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. FEEDBACK POLICIES
-- =====================================================

-- Users can create feedback (including anonymous)
CREATE POLICY "Users can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own feedback (before admin response)
CREATE POLICY "Users can update own feedback" ON public.feedback
    FOR UPDATE USING (auth.uid() = user_id AND admin_response IS NULL);

-- =====================================================
-- 8. ANALYTICS EVENTS POLICIES
-- =====================================================

-- Users can create analytics events (including anonymous)
CREATE POLICY "Users can create analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users cannot read analytics events (admin only)
-- This is handled by not granting SELECT permissions

-- =====================================================
-- 9. RATE LIMITS POLICIES
-- =====================================================

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- System can manage rate limits (handled by service role)
-- Note: This policy allows service role to bypass RLS for rate limit management
-- The service role key should be used for system operations only

-- =====================================================
-- 10. RAG KNOWLEDGE BASE POLICIES
-- =====================================================

-- Users can view active knowledge base entries
CREATE POLICY "Users can view active knowledge" ON public.rag_knowledge_base
    FOR SELECT USING (is_active = true AND review_status = 'approved');

-- Users can create knowledge base entries (pending review)
CREATE POLICY "Users can create knowledge" ON public.rag_knowledge_base
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own knowledge entries (if not reviewed)
CREATE POLICY "Users can update own knowledge" ON public.rag_knowledge_base
    FOR UPDATE USING (auth.uid() = created_by AND review_status = 'pending');

-- Users can delete their own knowledge entries (if not reviewed)
CREATE POLICY "Users can delete own knowledge" ON public.rag_knowledge_base
    FOR DELETE USING (auth.uid() = created_by AND review_status = 'pending');

-- =====================================================
-- 11. RAG PROMPT GENERATIONS POLICIES
-- =====================================================

-- Users can view their own RAG generations
CREATE POLICY "Users can view own RAG generations" ON public.rag_prompt_generations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own RAG generations
CREATE POLICY "Users can create own RAG generations" ON public.rag_prompt_generations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own RAG generations
CREATE POLICY "Users can update own RAG generations" ON public.rag_prompt_generations
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 12. RAG TOOL PROFILES POLICIES
-- =====================================================

-- Users can view active tool profiles
CREATE POLICY "Users can view active tool profiles" ON public.rag_tool_profiles
    FOR SELECT USING (is_active = true);

-- Only admins can modify tool profiles (handled by service role)

-- =====================================================
-- 13. RAG USER PREFERENCES POLICIES
-- =====================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own RAG preferences" ON public.rag_user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own preferences
CREATE POLICY "Users can create own RAG preferences" ON public.rag_user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own RAG preferences" ON public.rag_user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 14. RAG ANALYTICS POLICIES
-- =====================================================

-- Users can create RAG analytics events
CREATE POLICY "Users can create RAG analytics" ON public.rag_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users cannot read RAG analytics (admin only)

-- =====================================================
-- 15. RAG FEEDBACK POLICIES
-- =====================================================

-- Users can view their own RAG feedback
CREATE POLICY "Users can view own RAG feedback" ON public.rag_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own RAG feedback
CREATE POLICY "Users can create own RAG feedback" ON public.rag_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own RAG feedback
CREATE POLICY "Users can update own RAG feedback" ON public.rag_feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 16. ADMIN POLICIES (Service Role)
-- =====================================================

-- Note: Admin policies are typically handled by using the service role key
-- which bypasses RLS. For specific admin user access, create separate policies:

-- Example admin policy for feedback management
-- CREATE POLICY "Admins can manage all feedback" ON public.feedback
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.user_profiles 
--             WHERE id = auth.uid() 
--             AND subscription_tier = 'admin'
--         )
--     );

-- =====================================================
-- 17. SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND subscription_tier = 'enterprise' -- Using enterprise as admin tier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns MVP
CREATE OR REPLACE FUNCTION public.user_owns_mvp(mvp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mvps 
        WHERE id = mvp_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    resource_type_param TEXT,
    limit_count INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    user_limit INTEGER;
BEGIN
    -- Get current count for today
    SELECT COALESCE(count, 0) INTO current_count
    FROM public.rate_limits
    WHERE user_id = auth.uid()
    AND resource_type = resource_type_param
    AND reset_date = CURRENT_DATE;
    
    -- Get user's limit based on subscription
    SELECT 
        CASE 
            WHEN resource_type_param = 'mvp_generation' THEN mvp_limit
            WHEN resource_type_param = 'export_generation' THEN export_limit
            WHEN resource_type_param = 'api_calls' THEN api_calls_limit
            ELSE COALESCE(limit_count, 10)
        END INTO user_limit
    FROM public.user_profiles
    WHERE id = auth.uid();
    
    RETURN current_count < COALESCE(user_limit, 10);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
