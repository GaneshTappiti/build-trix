-- =====================================================
-- MVP STUDIO - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Migration: 003_rls_policies.sql
-- Description: Sets up Row Level Security for all tables
-- Dependencies: 001_initial_schema.sql, 002_indexes.sql
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mvp_studio_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. USER PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users cannot delete their profile (handled by auth cascade)
CREATE POLICY "Users cannot delete profiles" ON public.user_profiles
    FOR DELETE USING (false);

-- Public profiles for sharing (future feature)
CREATE POLICY "Public profiles viewable" ON public.user_profiles
    FOR SELECT USING (
        id IN (
            SELECT user_id FROM public.mvps 
            WHERE is_public = true
        )
    );

-- =====================================================
-- 3. MVP PROJECTS POLICIES
-- =====================================================

-- Users can view their own MVPs
CREATE POLICY "Users can view own MVPs" ON public.mvps
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own MVPs
CREATE POLICY "Users can create own MVPs" ON public.mvps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own MVPs
CREATE POLICY "Users can update own MVPs" ON public.mvps
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own MVPs
CREATE POLICY "Users can delete own MVPs" ON public.mvps
    FOR DELETE USING (auth.uid() = user_id);

-- Public MVPs are viewable by anyone (future feature)
CREATE POLICY "Public MVPs viewable" ON public.mvps
    FOR SELECT USING (is_public = true);

-- Collaborators can view shared MVPs (future feature)
CREATE POLICY "Collaborators can view shared MVPs" ON public.mvps
    FOR SELECT USING (
        auth.uid() = ANY(collaborators) AND 
        auth.uid() IS NOT NULL
    );

-- Collaborators can update shared MVPs (future feature)
CREATE POLICY "Collaborators can update shared MVPs" ON public.mvps
    FOR UPDATE USING (
        auth.uid() = ANY(collaborators) AND 
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- 4. QUESTIONNAIRE POLICIES
-- =====================================================

-- Users can view questionnaires for their MVPs
CREATE POLICY "Users can view own questionnaires" ON public.questionnaire
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create questionnaires for their MVPs
CREATE POLICY "Users can create own questionnaires" ON public.questionnaire
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.mvps 
            WHERE id = mvp_id AND user_id = auth.uid()
        )
    );

-- Users can update questionnaires for their MVPs
CREATE POLICY "Users can update own questionnaires" ON public.questionnaire
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete questionnaires for their MVPs
CREATE POLICY "Users can delete own questionnaires" ON public.questionnaire
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. MVP STUDIO SESSIONS POLICIES
-- =====================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.mvp_studio_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON public.mvp_studio_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON public.mvp_studio_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON public.mvp_studio_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. FEEDBACK POLICIES
-- =====================================================

-- Anyone can create feedback (including anonymous)
CREATE POLICY "Anyone can create feedback" ON public.feedback
    FOR INSERT WITH CHECK (
        user_id IS NULL OR auth.uid() = user_id
    );

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL
    );

-- Users can update their own feedback (within time limit)
CREATE POLICY "Users can update own recent feedback" ON public.feedback
    FOR UPDATE USING (
        auth.uid() = user_id AND
        created_at >= NOW() - INTERVAL '24 hours' AND
        status = 'open'
    );

-- Users cannot delete feedback (for audit trail)
CREATE POLICY "Users cannot delete feedback" ON public.feedback
    FOR DELETE USING (false);

-- Admin users can view all feedback (requires admin role)
CREATE POLICY "Admins can view all feedback" ON public.feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin users can update all feedback
CREATE POLICY "Admins can update all feedback" ON public.feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- 7. ANALYTICS EVENTS POLICIES
-- =====================================================

-- Users can create analytics events for themselves
CREATE POLICY "Users can create own analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (
        user_id IS NULL OR auth.uid() = user_id
    );

-- Users cannot view analytics events (privacy)
CREATE POLICY "Users cannot view analytics" ON public.analytics_events
    FOR SELECT USING (false);

-- Admin users can view all analytics
CREATE POLICY "Admins can view all analytics" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- System can create analytics events
CREATE POLICY "System can create analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. RATE LIMITS POLICIES
-- =====================================================

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits" ON public.rate_limits
    FOR SELECT USING (auth.uid() = user_id);

-- System can manage rate limits (no user access to INSERT/UPDATE/DELETE)
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL USING (
        -- Allow if called from a server context (no auth.uid())
        auth.uid() IS NULL OR
        -- Allow if admin user
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- 9. EXPORT HISTORY POLICIES
-- =====================================================

-- Users can view their own export history
CREATE POLICY "Users can view own exports" ON public.export_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create export records for their MVPs
CREATE POLICY "Users can create own exports" ON public.export_history
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.mvps 
            WHERE id = mvp_id AND user_id = auth.uid()
        )
    );

-- Users can update their own export records (for download tracking)
CREATE POLICY "Users can update own exports" ON public.export_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Users cannot delete export history (for audit trail)
CREATE POLICY "Users cannot delete exports" ON public.export_history
    FOR DELETE USING (false);

-- =====================================================
-- 10. HELPER FUNCTIONS FOR POLICIES
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns MVP
CREATE OR REPLACE FUNCTION public.user_owns_mvp(mvp_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mvps 
        WHERE id = mvp_id AND mvps.user_id = user_owns_mvp.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access MVP (owner or collaborator)
CREATE OR REPLACE FUNCTION public.user_can_access_mvp(mvp_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mvps 
        WHERE id = mvp_id 
        AND (
            mvps.user_id = user_can_access_mvp.user_id OR
            user_can_access_mvp.user_id = ANY(collaborators) OR
            is_public = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. SECURITY GRANTS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables for authenticated users
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.mvps TO authenticated;
GRANT ALL ON public.questionnaire TO authenticated;
GRANT ALL ON public.mvp_studio_sessions TO authenticated;
GRANT ALL ON public.feedback TO authenticated;
GRANT INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.rate_limits TO authenticated;
GRANT ALL ON public.export_history TO authenticated;

-- Grant limited access for anonymous users (feedback only)
GRANT INSERT ON public.feedback TO anon;
GRANT INSERT ON public.analytics_events TO anon;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- 12. SECURITY VALIDATION
-- =====================================================

-- Test policies are working (these should return 0 rows for non-owners)
-- SELECT * FROM public.mvps WHERE user_id != auth.uid(); -- Should return 0
-- SELECT * FROM public.questionnaire WHERE user_id != auth.uid(); -- Should return 0
-- SELECT * FROM public.mvp_studio_sessions WHERE user_id != auth.uid(); -- Should return 0

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next: Run 004_triggers.sql for automated functionality
