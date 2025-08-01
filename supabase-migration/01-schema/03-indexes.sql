-- =====================================================
-- PERFORMANCE INDEXES FOR MVP STUDIO
-- =====================================================
-- This file contains all performance indexes for optimal query performance
-- Run this after creating all tables

-- =====================================================
-- 1. USER PROFILES INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier 
    ON public.user_profiles(subscription_tier);

CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at 
    ON public.user_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_mvps_created 
    ON public.user_profiles(mvps_created DESC);

-- =====================================================
-- 2. MVP PROJECTS INDEXES
-- =====================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_mvps_user_id 
    ON public.mvps(user_id);

CREATE INDEX IF NOT EXISTS idx_mvps_status 
    ON public.mvps(status);

CREATE INDEX IF NOT EXISTS idx_mvps_created_at 
    ON public.mvps(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mvps_updated_at 
    ON public.mvps(updated_at DESC);

-- MVP Studio specific
CREATE INDEX IF NOT EXISTS idx_mvps_is_mvp_studio 
    ON public.mvps(is_mvp_studio_project);

CREATE INDEX IF NOT EXISTS idx_mvps_completion_stage 
    ON public.mvps(completion_stage);

-- Search and filtering
CREATE INDEX IF NOT EXISTS idx_mvps_platforms 
    ON public.mvps USING GIN(platforms);

CREATE INDEX IF NOT EXISTS idx_mvps_tags 
    ON public.mvps USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_mvps_style 
    ON public.mvps(style);

-- Public MVPs
CREATE INDEX IF NOT EXISTS idx_mvps_public 
    ON public.mvps(is_public) WHERE is_public = true;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mvps_user_status 
    ON public.mvps(user_id, status);

CREATE INDEX IF NOT EXISTS idx_mvps_user_created 
    ON public.mvps(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mvps_user_studio 
    ON public.mvps(user_id, is_mvp_studio_project);

-- =====================================================
-- 3. QUESTIONNAIRE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_questionnaire_mvp_id 
    ON public.questionnaire(mvp_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_user_id 
    ON public.questionnaire(user_id);

CREATE INDEX IF NOT EXISTS idx_questionnaire_created_at 
    ON public.questionnaire(created_at DESC);

-- Analytics queries
CREATE INDEX IF NOT EXISTS idx_questionnaire_validated 
    ON public.questionnaire(idea_validated);

CREATE INDEX IF NOT EXISTS idx_questionnaire_complexity 
    ON public.questionnaire(project_complexity);

CREATE INDEX IF NOT EXISTS idx_questionnaire_experience 
    ON public.questionnaire(technical_experience);

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

CREATE INDEX IF NOT EXISTS idx_sessions_completed 
    ON public.mvp_studio_sessions(is_completed);

-- Composite for active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_active 
    ON public.mvp_studio_sessions(user_id, last_saved_at DESC) 
    WHERE is_completed = false;

-- =====================================================
-- 5. EXPORT HISTORY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_export_history_user_id 
    ON public.export_history(user_id);

CREATE INDEX IF NOT EXISTS idx_export_history_mvp_id 
    ON public.export_history(mvp_id);

CREATE INDEX IF NOT EXISTS idx_export_history_created_at 
    ON public.export_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_history_export_type 
    ON public.export_history(export_type);

CREATE INDEX IF NOT EXISTS idx_export_history_target_tool 
    ON public.export_history(target_tool);

CREATE INDEX IF NOT EXISTS idx_export_history_successful 
    ON public.export_history(was_successful);

-- Composite for user exports
CREATE INDEX IF NOT EXISTS idx_export_history_user_date 
    ON public.export_history(user_id, created_at DESC);

-- =====================================================
-- 6. FEEDBACK INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_feedback_user_id 
    ON public.feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_feedback_type 
    ON public.feedback(type);

CREATE INDEX IF NOT EXISTS idx_feedback_status 
    ON public.feedback(status);

CREATE INDEX IF NOT EXISTS idx_feedback_priority 
    ON public.feedback(priority);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at 
    ON public.feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_mvp_id 
    ON public.feedback(mvp_id);

-- Admin queries
CREATE INDEX IF NOT EXISTS idx_feedback_admin_id 
    ON public.feedback(admin_id);

CREATE INDEX IF NOT EXISTS idx_feedback_open_priority 
    ON public.feedback(status, priority) 
    WHERE status IN ('open', 'in_progress');

-- =====================================================
-- 7. ANALYTICS EVENTS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_analytics_user_id 
    ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type 
    ON public.analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at 
    ON public.analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_session_id 
    ON public.analytics_events(session_id);

-- Time-based partitioning support
CREATE INDEX IF NOT EXISTS idx_analytics_created_date 
    ON public.analytics_events(DATE(created_at));

-- Composite for user analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_type_date 
    ON public.analytics_events(user_id, event_type, created_at DESC);

-- Performance metrics
CREATE INDEX IF NOT EXISTS idx_analytics_page_load_time 
    ON public.analytics_events(page_load_time_ms) 
    WHERE page_load_time_ms IS NOT NULL;

-- =====================================================
-- 8. RATE LIMITS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_resource 
    ON public.rate_limits(user_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_date 
    ON public.rate_limits(reset_date);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_date 
    ON public.rate_limits(user_id, reset_date);

-- Active rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_active 
    ON public.rate_limits(user_id, resource_type, reset_date) 
    WHERE reset_date >= CURRENT_DATE;

-- =====================================================
-- 9. RAG KNOWLEDGE BASE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_target_tools 
    ON public.rag_knowledge_base USING GIN(target_tools);

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_categories 
    ON public.rag_knowledge_base USING GIN(categories);

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_complexity 
    ON public.rag_knowledge_base(complexity_level);

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_document_type 
    ON public.rag_knowledge_base(document_type);

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_active 
    ON public.rag_knowledge_base(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_quality 
    ON public.rag_knowledge_base(quality_score DESC);

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_usage 
    ON public.rag_knowledge_base(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_rag_knowledge_tags 
    ON public.rag_knowledge_base USING GIN(tags);

-- Vector similarity search (conditional based on extension availability)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        -- Check if index doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE indexname = 'idx_rag_knowledge_embedding'
            AND schemaname = 'public'
        ) THEN
            EXECUTE 'CREATE INDEX idx_rag_knowledge_embedding ON public.rag_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
            RAISE NOTICE 'Vector similarity index created successfully';
        ELSE
            RAISE NOTICE 'Vector similarity index already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Vector extension not available, skipping vector index creation';
    END IF;
END $$;

-- Text-based embedding index (fallback)
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_embedding_text
    ON public.rag_knowledge_base(embedding_text)
    WHERE embedding_text IS NOT NULL;

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_content_fts 
    ON public.rag_knowledge_base USING GIN(to_tsvector('english', title || ' ' || content));

-- =====================================================
-- 10. RAG PROMPT GENERATIONS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rag_generations_user_id 
    ON public.rag_prompt_generations(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_generations_target_tool 
    ON public.rag_prompt_generations(target_tool);

CREATE INDEX IF NOT EXISTS idx_rag_generations_stage 
    ON public.rag_prompt_generations(stage);

CREATE INDEX IF NOT EXISTS idx_rag_generations_created_at 
    ON public.rag_prompt_generations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rag_generations_confidence 
    ON public.rag_prompt_generations(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_rag_generations_successful 
    ON public.rag_prompt_generations(was_successful);

CREATE INDEX IF NOT EXISTS idx_rag_generations_platforms 
    ON public.rag_prompt_generations USING GIN(platforms);

-- Analytics queries
CREATE INDEX IF NOT EXISTS idx_rag_generations_complexity 
    ON public.rag_prompt_generations(project_complexity);

CREATE INDEX IF NOT EXISTS idx_rag_generations_experience 
    ON public.rag_prompt_generations(technical_experience);

-- Composite for user analytics
CREATE INDEX IF NOT EXISTS idx_rag_generations_user_tool_date 
    ON public.rag_prompt_generations(user_id, target_tool, created_at DESC);

-- =====================================================
-- 11. RAG TOOL PROFILES INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rag_profiles_tool_id 
    ON public.rag_tool_profiles(tool_id);

CREATE INDEX IF NOT EXISTS idx_rag_profiles_category 
    ON public.rag_tool_profiles(tool_category);

CREATE INDEX IF NOT EXISTS idx_rag_profiles_complexity 
    ON public.rag_tool_profiles(complexity_level);

CREATE INDEX IF NOT EXISTS idx_rag_profiles_active 
    ON public.rag_tool_profiles(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_rag_profiles_success_rate 
    ON public.rag_tool_profiles(average_success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_rag_profiles_platforms 
    ON public.rag_tool_profiles USING GIN(supported_platforms);

-- =====================================================
-- 12. RAG USER PREFERENCES INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rag_preferences_user_id 
    ON public.rag_user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_preferences_default_tool 
    ON public.rag_user_preferences(default_ai_tool);

CREATE INDEX IF NOT EXISTS idx_rag_preferences_complexity 
    ON public.rag_user_preferences(default_complexity);

-- =====================================================
-- 13. RAG ANALYTICS INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rag_analytics_event_type 
    ON public.rag_analytics(event_type);

CREATE INDEX IF NOT EXISTS idx_rag_analytics_user_id 
    ON public.rag_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_analytics_created_at 
    ON public.rag_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rag_analytics_tool_id 
    ON public.rag_analytics(tool_id);

CREATE INDEX IF NOT EXISTS idx_rag_analytics_confidence 
    ON public.rag_analytics(confidence_score DESC);

-- =====================================================
-- 14. RAG FEEDBACK INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_rag_feedback_user_id 
    ON public.rag_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_rag_feedback_prompt_generation_id 
    ON public.rag_feedback(prompt_generation_id);

CREATE INDEX IF NOT EXISTS idx_rag_feedback_type 
    ON public.rag_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_rag_feedback_rating 
    ON public.rag_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_rag_feedback_created_at 
    ON public.rag_feedback(created_at DESC);
