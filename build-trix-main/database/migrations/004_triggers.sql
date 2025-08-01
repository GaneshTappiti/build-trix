-- =====================================================
-- MVP STUDIO - TRIGGERS AND FUNCTIONS
-- =====================================================
-- Migration: 004_triggers.sql
-- Description: Creates triggers and automated functions
-- Dependencies: 001_initial_schema.sql, 002_indexes.sql, 003_rls_policies.sql
-- =====================================================

-- =====================================================
-- 1. TIMESTAMP UPDATE FUNCTIONS
-- =====================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. APPLY TIMESTAMP TRIGGERS
-- =====================================================

-- User profiles
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- MVP projects
CREATE TRIGGER update_mvps_updated_at 
    BEFORE UPDATE ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Questionnaire
CREATE TRIGGER update_questionnaire_updated_at 
    BEFORE UPDATE ON public.questionnaire
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Feedback
CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Rate limits
CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Export history
CREATE TRIGGER update_export_history_updated_at 
    BEFORE UPDATE ON public.export_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. ANALYTICS TRACKING FUNCTIONS
-- =====================================================

-- Function to track MVP creation events
CREATE OR REPLACE FUNCTION track_mvp_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.analytics_events (
        user_id, 
        event_type, 
        event_category,
        event_data
    ) VALUES (
        NEW.user_id,
        'mvp_created',
        CASE WHEN NEW.is_mvp_studio_project THEN 'mvp_studio' ELSE 'simple_generator' END,
        jsonb_build_object(
            'mvp_id', NEW.id,
            'app_name', NEW.app_name,
            'platforms', NEW.platforms,
            'style', NEW.style,
            'is_mvp_studio', NEW.is_mvp_studio_project,
            'completion_stage', NEW.completion_stage
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track MVP updates
CREATE OR REPLACE FUNCTION track_mvp_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track significant updates
    IF OLD.status != NEW.status OR 
       OLD.completion_stage != NEW.completion_stage OR
       OLD.app_blueprint IS DISTINCT FROM NEW.app_blueprint OR
       OLD.screen_prompts IS DISTINCT FROM NEW.screen_prompts OR
       OLD.app_flow IS DISTINCT FROM NEW.app_flow OR
       OLD.export_prompts IS DISTINCT FROM NEW.export_prompts THEN
        
        INSERT INTO public.analytics_events (
            user_id, 
            event_type, 
            event_category,
            event_data
        ) VALUES (
            NEW.user_id,
            CASE 
                WHEN OLD.status != NEW.status THEN 'mvp_status_changed'
                WHEN OLD.completion_stage != NEW.completion_stage THEN 'mvp_stage_completed'
                ELSE 'mvp_updated'
            END,
            CASE WHEN NEW.is_mvp_studio_project THEN 'mvp_studio' ELSE 'simple_generator' END,
            jsonb_build_object(
                'mvp_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_stage', OLD.completion_stage,
                'new_stage', NEW.completion_stage,
                'has_blueprint', NEW.app_blueprint IS NOT NULL,
                'has_screen_prompts', NEW.screen_prompts IS NOT NULL,
                'has_app_flow', NEW.app_flow IS NOT NULL,
                'has_export_prompts', NEW.export_prompts IS NOT NULL
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track export events
CREATE OR REPLACE FUNCTION track_export_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.analytics_events (
        user_id, 
        event_type, 
        event_category,
        event_data
    ) VALUES (
        NEW.user_id,
        'export_generated',
        'export',
        jsonb_build_object(
            'export_id', NEW.id,
            'mvp_id', NEW.mvp_id,
            'export_type', NEW.export_type,
            'target_tool', NEW.target_tool,
            'file_size_bytes', NEW.file_size_bytes
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to track session activity
CREATE OR REPLACE FUNCTION track_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Track session creation
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.analytics_events (
            user_id, 
            event_type, 
            event_category,
            event_data
        ) VALUES (
            NEW.user_id,
            'session_started',
            'mvp_studio',
            jsonb_build_object(
                'session_id', NEW.id,
                'mvp_id', NEW.mvp_id,
                'current_stage', NEW.current_stage
            )
        );
        RETURN NEW;
    END IF;
    
    -- Track significant session updates
    IF TG_OP = 'UPDATE' AND (
        OLD.current_stage != NEW.current_stage OR
        OLD.is_completed != NEW.is_completed
    ) THEN
        INSERT INTO public.analytics_events (
            user_id, 
            event_type, 
            event_category,
            event_data
        ) VALUES (
            NEW.user_id,
            CASE 
                WHEN OLD.is_completed = false AND NEW.is_completed = true THEN 'session_completed'
                WHEN OLD.current_stage != NEW.current_stage THEN 'session_stage_changed'
                ELSE 'session_updated'
            END,
            'mvp_studio',
            jsonb_build_object(
                'session_id', NEW.id,
                'mvp_id', NEW.mvp_id,
                'old_stage', OLD.current_stage,
                'new_stage', NEW.current_stage,
                'is_completed', NEW.is_completed,
                'time_spent_minutes', NEW.time_spent_minutes
            )
        );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. APPLY ANALYTICS TRIGGERS
-- =====================================================

-- MVP creation tracking
CREATE TRIGGER track_mvp_creation_trigger 
    AFTER INSERT ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION track_mvp_creation();

-- MVP update tracking
CREATE TRIGGER track_mvp_update_trigger 
    AFTER UPDATE ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION track_mvp_update();

-- Export tracking
CREATE TRIGGER track_export_creation_trigger 
    AFTER INSERT ON public.export_history
    FOR EACH ROW EXECUTE FUNCTION track_export_creation();

-- Session tracking
CREATE TRIGGER track_session_activity_trigger 
    AFTER INSERT OR UPDATE ON public.mvp_studio_sessions
    FOR EACH ROW EXECUTE FUNCTION track_session_activity();

-- =====================================================
-- 5. RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_and_update_rate_limit(
    p_user_id UUID,
    p_resource_type TEXT,
    p_limit_value INTEGER DEFAULT 3,
    p_window_type TEXT DEFAULT 'monthly'
)
RETURNS JSONB AS $$
DECLARE
    current_count INTEGER;
    reset_date DATE;
    result JSONB;
BEGIN
    -- Calculate reset date based on window type
    reset_date := CASE p_window_type
        WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
        WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
        WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        WHEN 'yearly' THEN DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
        ELSE DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    END;
    
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (
        user_id, 
        resource_type, 
        limit_value, 
        window_type, 
        current_count, 
        reset_date,
        first_request_at,
        last_request_at
    ) VALUES (
        p_user_id, 
        p_resource_type, 
        p_limit_value, 
        p_window_type, 
        1, 
        reset_date,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, resource_type, reset_date)
    DO UPDATE SET 
        current_count = rate_limits.current_count + 1,
        last_request_at = NOW()
    RETURNING current_count INTO current_count;
    
    -- Build result
    result := jsonb_build_object(
        'success', current_count <= p_limit_value,
        'current_count', current_count,
        'limit_value', p_limit_value,
        'remaining', GREATEST(0, p_limit_value - current_count),
        'reset_date', reset_date,
        'window_type', p_window_type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get current rate limit status
CREATE OR REPLACE FUNCTION get_rate_limit_status(
    p_user_id UUID,
    p_resource_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    rate_limit_record RECORD;
    result JSONB;
BEGIN
    -- Get the most recent rate limit record
    SELECT * INTO rate_limit_record
    FROM public.rate_limits
    WHERE user_id = p_user_id 
        AND resource_type = p_resource_type
        AND reset_date >= CURRENT_DATE
    ORDER BY reset_date DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- No rate limit record found, return default
        result := jsonb_build_object(
            'success', true,
            'current_count', 0,
            'limit_value', 3,
            'remaining', 3,
            'reset_date', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
            'window_type', 'monthly'
        );
    ELSE
        result := jsonb_build_object(
            'success', rate_limit_record.current_count < rate_limit_record.limit_value,
            'current_count', rate_limit_record.current_count,
            'limit_value', rate_limit_record.limit_value,
            'remaining', GREATEST(0, rate_limit_record.limit_value - rate_limit_record.current_count),
            'reset_date', rate_limit_record.reset_date,
            'window_type', rate_limit_record.window_type
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up old analytics events (older than 1 year)
    DELETE FROM public.analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Clean up old sessions (older than 30 days and not completed)
    DELETE FROM public.mvp_studio_sessions 
    WHERE last_saved_at < NOW() - INTERVAL '30 days' 
        AND is_completed = false;
    
    -- Clean up expired rate limits
    DELETE FROM public.rate_limits 
    WHERE reset_date < CURRENT_DATE;
    
    -- Clean up orphaned questionnaire records
    DELETE FROM public.questionnaire 
    WHERE mvp_id NOT IN (SELECT id FROM public.mvps);
    
    RAISE NOTICE 'Cleanup completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to update completion stages based on data
CREATE OR REPLACE FUNCTION update_completion_stages()
RETURNS VOID AS $$
BEGIN
    UPDATE public.mvps 
    SET completion_stage = CASE 
        WHEN export_prompts IS NOT NULL THEN 6
        WHEN app_flow IS NOT NULL THEN 5
        WHEN screen_prompts IS NOT NULL THEN 4
        WHEN app_blueprint IS NOT NULL THEN 3
        WHEN EXISTS (SELECT 1 FROM public.questionnaire WHERE mvp_id = mvps.id) THEN 2
        ELSE 1
    END
    WHERE is_mvp_studio_project = true;
    
    RAISE NOTICE 'Completion stages updated successfully';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. USER PROFILE MANAGEMENT
-- =====================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        full_name,
        avatar_url,
        subscription_tier,
        mvp_limit,
        onboarding_completed
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        'free',
        3,
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next: Run 005_seed_data.sql for initial data (optional)
