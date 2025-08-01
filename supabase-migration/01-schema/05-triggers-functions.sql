-- =====================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- =====================================================
-- This file contains all database functions and triggers
-- Run this after creating tables, indexes, and RLS policies

-- =====================================================
-- 1. UTILITY FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a random UUID
CREATE OR REPLACE FUNCTION public.generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Function to validate email format
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats(
    user_id_param UUID,
    stat_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
    CASE stat_type
        WHEN 'mvps_created' THEN
            UPDATE public.user_profiles 
            SET mvps_created = mvps_created + increment_by
            WHERE id = user_id_param;
        WHEN 'exports_generated' THEN
            UPDATE public.user_profiles 
            SET exports_generated = exports_generated + increment_by
            WHERE id = user_id_param;
        WHEN 'api_calls_made' THEN
            UPDATE public.user_profiles 
            SET api_calls_made = api_calls_made + increment_by
            WHERE id = user_id_param;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to increment rate limit counter
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
    user_id_param UUID,
    resource_type_param TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER;
    user_limit INTEGER;
BEGIN
    -- Get user's limit based on subscription
    SELECT 
        CASE 
            WHEN resource_type_param = 'mvp_generation' THEN mvp_limit
            WHEN resource_type_param = 'export_generation' THEN export_limit
            WHEN resource_type_param = 'api_calls' THEN api_calls_limit
            ELSE 10
        END INTO user_limit
    FROM public.user_profiles
    WHERE id = user_id_param;
    
    -- Insert or update rate limit record
    INSERT INTO public.rate_limits (user_id, resource_type, count, reset_date, daily_limit)
    VALUES (user_id_param, resource_type_param, increment_by, CURRENT_DATE, user_limit)
    ON CONFLICT (user_id, resource_type, reset_date)
    DO UPDATE SET 
        count = rate_limits.count + increment_by,
        updated_at = NOW();
    
    -- Check if limit exceeded
    SELECT count INTO current_count
    FROM public.rate_limits
    WHERE user_id = user_id_param
    AND resource_type = resource_type_param
    AND reset_date = CURRENT_DATE;
    
    RETURN current_count <= user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset rate limits (daily job)
CREATE OR REPLACE FUNCTION public.reset_daily_rate_limits()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.rate_limits
    WHERE reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. MVP MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to calculate MVP completion percentage
CREATE OR REPLACE FUNCTION public.calculate_mvp_completion(mvp_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_stage INTEGER;
    has_blueprint BOOLEAN;
    has_screen_prompts BOOLEAN;
    has_app_flow BOOLEAN;
    has_export_prompts BOOLEAN;
    completion_percentage INTEGER;
BEGIN
    SELECT 
        completion_stage,
        (app_blueprint IS NOT NULL) as has_blueprint,
        (screen_prompts IS NOT NULL) as has_screen_prompts,
        (app_flow IS NOT NULL) as has_app_flow,
        (export_prompts IS NOT NULL) as has_export_prompts
    INTO completion_stage, has_blueprint, has_screen_prompts, has_app_flow, has_export_prompts
    FROM public.mvps
    WHERE id = mvp_id_param;
    
    -- Calculate completion based on stage and data presence
    completion_percentage := CASE
        WHEN completion_stage >= 6 AND has_export_prompts THEN 100
        WHEN completion_stage >= 5 AND has_app_flow THEN 85
        WHEN completion_stage >= 4 AND has_screen_prompts THEN 70
        WHEN completion_stage >= 3 AND has_blueprint THEN 55
        WHEN completion_stage >= 2 THEN 40
        ELSE 20
    END;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update MVP complexity score
CREATE OR REPLACE FUNCTION public.update_mvp_complexity(mvp_id_param UUID)
RETURNS VOID AS $$
DECLARE
    platform_count INTEGER;
    feature_count INTEGER;
    complexity INTEGER;
    mvp_record RECORD;
BEGIN
    -- Get MVP record with null checks
    SELECT
        array_length(platforms, 1) as platform_count,
        CASE
            WHEN app_blueprint IS NOT NULL THEN
                COALESCE(jsonb_array_length(app_blueprint->'features'), 0)
            ELSE 0
        END as feature_count,
        is_mvp_studio_project
    INTO mvp_record
    FROM public.mvps
    WHERE id = mvp_id_param;

    -- Check if MVP exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'MVP with ID % not found', mvp_id_param;
    END IF;

    -- Calculate complexity score (1-10) with null safety
    complexity := LEAST(10, GREATEST(1,
        (COALESCE(mvp_record.platform_count, 1) * 2) +
        (COALESCE(mvp_record.feature_count, 0) / 3) +
        CASE WHEN mvp_record.is_mvp_studio_project THEN 2 ELSE 0 END
    ));

    UPDATE public.mvps
    SET complexity_score = complexity,
        updated_at = NOW()
    WHERE id = mvp_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. ANALYTICS FUNCTIONS
-- =====================================================

-- Function to track analytics event
CREATE OR REPLACE FUNCTION public.track_analytics_event(
    user_id_param UUID,
    event_type_param TEXT,
    event_data_param JSONB DEFAULT NULL,
    session_id_param TEXT DEFAULT NULL,
    page_url_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.analytics_events (
        user_id, event_type, event_data, session_id, page_url
    )
    VALUES (
        user_id_param, event_type_param, event_data_param, 
        session_id_param, page_url_param
    )
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RAG SYSTEM FUNCTIONS
-- =====================================================

-- Function to update knowledge base usage stats
CREATE OR REPLACE FUNCTION public.update_knowledge_usage(knowledge_id_param UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.rag_knowledge_base
    SET 
        usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = knowledge_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate RAG confidence score
CREATE OR REPLACE FUNCTION public.calculate_rag_confidence(
    similarity_scores DECIMAL[],
    knowledge_count INTEGER,
    tool_success_rate DECIMAL DEFAULT 0.5
)
RETURNS DECIMAL AS $$
DECLARE
    avg_similarity DECIMAL;
    confidence DECIMAL;
BEGIN
    -- Validate inputs
    IF similarity_scores IS NULL OR array_length(similarity_scores, 1) = 0 THEN
        avg_similarity := 0;
    ELSE
        -- Calculate average similarity with null safety
        SELECT AVG(score) INTO avg_similarity
        FROM unnest(similarity_scores) AS score
        WHERE score IS NOT NULL;
    END IF;

    -- Ensure knowledge_count is not negative
    knowledge_count := GREATEST(0, COALESCE(knowledge_count, 0));

    -- Ensure tool_success_rate is within bounds
    tool_success_rate := LEAST(1.0, GREATEST(0.0, COALESCE(tool_success_rate, 0.5)));

    -- Calculate confidence based on multiple factors
    confidence := (
        (COALESCE(avg_similarity, 0) * 0.4) +
        (LEAST(knowledge_count / 5.0, 1.0) * 0.3) +
        (tool_success_rate * 0.3)
    );

    RETURN LEAST(1.0, GREATEST(0.0, confidence));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger for user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mvps_updated_at
    BEFORE UPDATE ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questionnaire_updated_at
    BEFORE UPDATE ON public.questionnaire
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rag_generations_updated_at
    BEFORE UPDATE ON public.rag_prompt_generations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rag_profiles_updated_at
    BEFORE UPDATE ON public.rag_tool_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rag_preferences_updated_at
    BEFORE UPDATE ON public.rag_user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rag_knowledge_updated_at
    BEFORE UPDATE ON public.rag_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. ANALYTICS TRIGGERS
-- =====================================================

-- Function to track MVP creation
CREATE OR REPLACE FUNCTION public.track_mvp_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Track analytics event
    PERFORM public.track_analytics_event(
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
    
    -- Update user stats
    PERFORM public.update_user_stats(NEW.user_id, 'mvps_created');
    
    -- Increment rate limit
    PERFORM public.increment_rate_limit(NEW.user_id, 'mvp_generation');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track export generation
CREATE OR REPLACE FUNCTION public.track_export_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Track analytics event
    PERFORM public.track_analytics_event(
        NEW.user_id,
        'export_generated',
        jsonb_build_object(
            'export_id', NEW.id,
            'mvp_id', NEW.mvp_id,
            'export_type', NEW.export_type,
            'target_tool', NEW.target_tool,
            'was_successful', NEW.was_successful
        )
    );
    
    -- Update user stats
    PERFORM public.update_user_stats(NEW.user_id, 'exports_generated');
    
    -- Increment rate limit
    PERFORM public.increment_rate_limit(NEW.user_id, 'export_generation');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply analytics triggers
CREATE TRIGGER track_mvp_creation_trigger
    AFTER INSERT ON public.mvps
    FOR EACH ROW EXECUTE FUNCTION public.track_mvp_creation();

CREATE TRIGGER track_export_creation_trigger
    AFTER INSERT ON public.export_history
    FOR EACH ROW EXECUTE FUNCTION public.track_export_creation();

-- =====================================================
-- 9. MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean old analytics data
CREATE OR REPLACE FUNCTION public.cleanup_old_analytics(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.analytics_events
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tool profile success rates
CREATE OR REPLACE FUNCTION public.update_tool_success_rates()
RETURNS VOID AS $$
BEGIN
    UPDATE public.rag_tool_profiles
    SET 
        average_success_rate = subquery.success_rate,
        total_generations = subquery.total_count
    FROM (
        SELECT 
            target_tool,
            AVG(CASE WHEN was_successful THEN 1.0 ELSE 0.0 END) as success_rate,
            COUNT(*) as total_count
        FROM public.rag_prompt_generations
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY target_tool
    ) AS subquery
    WHERE tool_id = subquery.target_tool;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
