-- =====================================================
-- MVP STUDIO - INDEXES MIGRATION
-- =====================================================
-- Migration: 002_indexes.sql
-- Description: Creates performance indexes for all tables
-- Dependencies: 001_initial_schema.sql
-- =====================================================

-- =====================================================
-- 1. USER PROFILES INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier 
    ON public.user_profiles(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login 
    ON public.user_profiles(last_login_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at 
    ON public.user_profiles(created_at DESC);

-- Onboarding tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding 
    ON public.user_profiles(onboarding_completed, created_at);

-- =====================================================
-- 2. MVP PROJECTS INDEXES
-- =====================================================

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_mvps_user_id 
    ON public.mvps(user_id);

CREATE INDEX IF NOT EXISTS idx_mvps_status 
    ON public.mvps(status);

CREATE INDEX IF NOT EXISTS idx_mvps_created_at 
    ON public.mvps(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mvps_updated_at 
    ON public.mvps(updated_at DESC);

-- MVP Studio specific indexes
CREATE INDEX IF NOT EXISTS idx_mvps_is_mvp_studio 
    ON public.mvps(is_mvp_studio_project);

CREATE INDEX IF NOT EXISTS idx_mvps_completion_stage 
    ON public.mvps(completion_stage);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mvps_user_status 
    ON public.mvps(user_id, status);

CREATE INDEX IF NOT EXISTS idx_mvps_user_created 
    ON public.mvps(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mvps_user_studio 
    ON public.mvps(user_id, is_mvp_studio_project);

CREATE INDEX IF NOT EXISTS idx_mvps_user_stage 
    ON public.mvps(user_id, completion_stage);

-- Platform and style indexes for analytics
CREATE INDEX IF NOT EXISTS idx_mvps_platforms 
    ON public.mvps USING GIN(platforms);

CREATE INDEX IF NOT EXISTS idx_mvps_style 
    ON public.mvps(style);

CREATE INDEX IF NOT EXISTS idx_mvps_tags 
    ON public.mvps USING GIN(tags);

-- Public projects index (for future sharing feature)
CREATE INDEX IF NOT EXISTS idx_mvps_public 
    ON public.mvps(is_public, created_at DESC) 
    WHERE is_public = true;

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_mvps_app_name_search 
    ON public.mvps USING GIN(to_tsvector('english', app_name));

CREATE INDEX IF NOT EXISTS idx_mvps_description_search 
    ON public.mvps USING GIN(to_tsvector('english', app_description));

-- =====================================================
-- 3. QUESTIONNAIRE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questionnaire_mvp_id 
    ON public.questionnaire(mvp_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id 
    ON public.questionnaire(user_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_created_at 
    ON public.questionnaire(created_at DESC);

-- Validation status indexes
CREATE INDEX IF NOT EXISTS idx_questionnaire_validated 
    ON public.questionnaire(idea_validated, talked_to_people);

-- =====================================================
-- 4. MVP STUDIO SESSIONS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
    ON public.mvp_studio_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_mvp_id 
    ON public.mvp_studio_sessions(mvp_id);

CREATE INDEX IF NOT EXISTS idx_sessions_last_saved 
    ON public.mvp_studio_sessions(last_saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_current_stage 
    ON public.mvp_studio_sessions(current_stage);

-- Composite indexes for session management
CREATE INDEX IF NOT EXISTS idx_sessions_user_mvp 
    ON public.mvp_studio_sessions(user_id, mvp_id);

CREATE INDEX IF NOT EXISTS idx_sessions_active 
    ON public.mvp_studio_sessions(user_id, is_completed, last_saved_at DESC);

-- Cleanup index for old sessions
CREATE INDEX IF NOT EXISTS idx_sessions_cleanup 
    ON public.mvp_studio_sessions(last_saved_at) 
    WHERE is_completed = false;

-- =====================================================
-- 5. FEEDBACK INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_feedback_user_id 
    ON public.feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_type 
    ON public.feedback(type);

CREATE INDEX IF NOT EXISTS idx_feedback_category 
    ON public.feedback(category);

CREATE INDEX IF NOT EXISTS idx_feedback_status 
    ON public.feedback(status);

CREATE INDEX IF NOT EXISTS idx_feedback_priority 
    ON public.feedback(priority);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at 
    ON public.feedback(created_at DESC);

-- Admin management indexes
CREATE INDEX IF NOT EXISTS idx_feedback_admin_queue 
    ON public.feedback(status, priority, created_at) 
    WHERE status IN ('open', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_feedback_resolution 
    ON public.feedback(resolved_at DESC) 
    WHERE resolved_at IS NOT NULL;

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_feedback_title_search 
    ON public.feedback USING GIN(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_feedback_description_search 
    ON public.feedback USING GIN(to_tsvector('english', description));

-- =====================================================
-- 6. ANALYTICS EVENTS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_analytics_user_id 
    ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
    ON public.analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_event_category 
    ON public.analytics_events(event_category);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
    ON public.analytics_events(created_at DESC);

-- Composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_type 
    ON public.analytics_events(user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_type_date 
    ON public.analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_category_date 
    ON public.analytics_events(event_category, created_at DESC);

-- Session tracking
CREATE INDEX IF NOT EXISTS idx_analytics_session 
    ON public.analytics_events(session_id, created_at);

-- Performance monitoring
CREATE INDEX IF NOT EXISTS idx_analytics_performance 
    ON public.analytics_events(event_type, load_time_ms) 
    WHERE load_time_ms IS NOT NULL;

-- Data cleanup index
CREATE INDEX IF NOT EXISTS idx_analytics_cleanup 
    ON public.analytics_events(created_at) 
    WHERE created_at < NOW() - INTERVAL '1 year';

-- =====================================================
-- 7. RATE LIMITS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_resource 
    ON public.rate_limits(user_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_date 
    ON public.rate_limits(reset_date);

CREATE INDEX IF NOT EXISTS idx_rate_limits_resource_type 
    ON public.rate_limits(resource_type);

-- Active rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_active 
    ON public.rate_limits(user_id, resource_type, reset_date) 
    WHERE reset_date >= CURRENT_DATE;

-- Cleanup index
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
    ON public.rate_limits(reset_date) 
    WHERE reset_date < CURRENT_DATE;

-- =====================================================
-- 8. EXPORT HISTORY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_export_history_user_id 
    ON public.export_history(user_id);

CREATE INDEX IF NOT EXISTS idx_export_history_mvp_id 
    ON public.export_history(mvp_id);

CREATE INDEX IF NOT EXISTS idx_export_history_export_type 
    ON public.export_history(export_type);

CREATE INDEX IF NOT EXISTS idx_export_history_target_tool 
    ON public.export_history(target_tool);

CREATE INDEX IF NOT EXISTS idx_export_history_created_at 
    ON public.export_history(created_at DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_export_history_user_mvp 
    ON public.export_history(user_id, mvp_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_history_user_type 
    ON public.export_history(user_id, export_type, created_at DESC);

-- Download tracking
CREATE INDEX IF NOT EXISTS idx_export_history_downloads 
    ON public.export_history(download_count, last_downloaded_at) 
    WHERE download_count > 0;

-- Status monitoring
CREATE INDEX IF NOT EXISTS idx_export_history_status 
    ON public.export_history(status, created_at DESC);

-- =====================================================
-- 9. JSONB INDEXES FOR MVP STUDIO DATA
-- =====================================================

-- App blueprint indexes
CREATE INDEX IF NOT EXISTS idx_mvps_blueprint_screens 
    ON public.mvps USING GIN((app_blueprint->'screens'));

CREATE INDEX IF NOT EXISTS idx_mvps_blueprint_user_roles 
    ON public.mvps USING GIN((app_blueprint->'userRoles'));

-- Screen prompts indexes
CREATE INDEX IF NOT EXISTS idx_mvps_screen_prompts 
    ON public.mvps USING GIN(screen_prompts);

-- Export prompts indexes
CREATE INDEX IF NOT EXISTS idx_mvps_export_target_tool 
    ON public.mvps USING GIN((export_prompts->'targetTool'));

-- Session data indexes
CREATE INDEX IF NOT EXISTS idx_sessions_app_idea 
    ON public.mvp_studio_sessions USING GIN((session_data->'appIdea'));

-- Analytics event data indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event_data 
    ON public.analytics_events USING GIN(event_data);

-- =====================================================
-- 10. PARTIAL INDEXES FOR OPTIMIZATION
-- =====================================================

-- Active MVPs only
CREATE INDEX IF NOT EXISTS idx_mvps_active 
    ON public.mvps(user_id, updated_at DESC) 
    WHERE status != 'Abandoned';

-- Incomplete MVP Studio projects
CREATE INDEX IF NOT EXISTS idx_mvps_incomplete_studio 
    ON public.mvps(user_id, completion_stage, updated_at DESC) 
    WHERE is_mvp_studio_project = true AND completion_stage < 6;

-- Recent feedback
CREATE INDEX IF NOT EXISTS idx_feedback_recent 
    ON public.feedback(created_at DESC, status) 
    WHERE created_at >= NOW() - INTERVAL '30 days';

-- Active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_recent 
    ON public.mvp_studio_sessions(user_id, last_saved_at DESC) 
    WHERE last_saved_at >= NOW() - INTERVAL '7 days';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next: Run 003_rls_policies.sql for security setup
