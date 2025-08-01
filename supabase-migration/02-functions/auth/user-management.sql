-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================
-- This file contains all database functions for user management
-- Run this after schema creation

-- =====================================================
-- 1. USER PROFILE FUNCTIONS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        full_name, 
        avatar_url,
        subscription_tier,
        mvp_limit,
        export_limit,
        api_calls_limit
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        'free',
        3,
        10,
        100
    );
    
    -- Create default RAG preferences
    INSERT INTO public.rag_user_preferences (
        user_id,
        default_complexity,
        default_experience,
        enable_enhancement_suggestions,
        enable_confidence_scoring,
        enable_tool_recommendations
    )
    VALUES (
        NEW.id,
        'medium',
        'intermediate',
        true,
        true,
        true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with computed fields
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    subscription_tier TEXT,
    mvp_limit INTEGER,
    export_limit INTEGER,
    api_calls_limit INTEGER,
    mvps_created INTEGER,
    exports_generated INTEGER,
    api_calls_made INTEGER,
    mvps_remaining INTEGER,
    exports_remaining INTEGER,
    api_calls_remaining INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.full_name,
        up.avatar_url,
        up.subscription_tier,
        up.mvp_limit,
        up.export_limit,
        up.api_calls_limit,
        up.mvps_created,
        up.exports_generated,
        up.api_calls_made,
        (up.mvp_limit - up.mvps_created) as mvps_remaining,
        (up.export_limit - up.exports_generated) as exports_remaining,
        (up.api_calls_limit - up.api_calls_made) as api_calls_remaining,
        up.created_at,
        up.updated_at
    FROM public.user_profiles up
    WHERE up.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION public.update_user_profile(
    user_id_param UUID,
    full_name_param TEXT DEFAULT NULL,
    avatar_url_param TEXT DEFAULT NULL,
    default_ai_tool_param TEXT DEFAULT NULL,
    preferred_platforms_param TEXT[] DEFAULT NULL,
    preferred_style_param TEXT DEFAULT NULL
)
RETURNS public.user_profiles AS $$
DECLARE
    updated_profile public.user_profiles;
BEGIN
    UPDATE public.user_profiles
    SET 
        full_name = COALESCE(full_name_param, full_name),
        avatar_url = COALESCE(avatar_url_param, avatar_url),
        default_ai_tool = COALESCE(default_ai_tool_param, default_ai_tool),
        preferred_platforms = COALESCE(preferred_platforms_param, preferred_platforms),
        preferred_style = COALESCE(preferred_style_param, preferred_style),
        updated_at = NOW()
    WHERE id = user_id_param
    RETURNING * INTO updated_profile;
    
    RETURN updated_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. SUBSCRIPTION MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to upgrade/downgrade subscription
CREATE OR REPLACE FUNCTION public.update_subscription(
    user_id_param UUID,
    new_tier TEXT
)
RETURNS TABLE (
    id UUID,
    subscription_tier TEXT,
    mvp_limit INTEGER,
    export_limit INTEGER,
    api_calls_limit INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    new_mvp_limit INTEGER;
    new_export_limit INTEGER;
    new_api_calls_limit INTEGER;
BEGIN
    -- Validate subscription tier
    IF new_tier NOT IN ('free', 'pro', 'enterprise') THEN
        RAISE EXCEPTION 'Invalid subscription tier: %', new_tier;
    END IF;
    
    -- Set limits based on tier
    CASE new_tier
        WHEN 'free' THEN
            new_mvp_limit := 3;
            new_export_limit := 10;
            new_api_calls_limit := 100;
        WHEN 'pro' THEN
            new_mvp_limit := 25;
            new_export_limit := 100;
            new_api_calls_limit := 1000;
        WHEN 'enterprise' THEN
            new_mvp_limit := 100;
            new_export_limit := 500;
            new_api_calls_limit := 10000;
    END CASE;
    
    -- Update subscription
    RETURN QUERY
    UPDATE public.user_profiles 
    SET 
        subscription_tier = new_tier,
        mvp_limit = new_mvp_limit,
        export_limit = new_export_limit,
        api_calls_limit = new_api_calls_limit,
        updated_at = NOW()
    WHERE id = user_id_param
    RETURNING 
        user_profiles.id,
        user_profiles.subscription_tier,
        user_profiles.mvp_limit,
        user_profiles.export_limit,
        user_profiles.api_calls_limit,
        user_profiles.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION public.check_subscription_limits(user_id_param UUID)
RETURNS TABLE (
    subscription_tier TEXT,
    can_create_mvp BOOLEAN,
    can_generate_export BOOLEAN,
    can_make_api_call BOOLEAN,
    mvps_remaining INTEGER,
    exports_remaining INTEGER,
    api_calls_remaining INTEGER,
    limit_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.subscription_tier,
        (up.mvps_created < up.mvp_limit) as can_create_mvp,
        (up.exports_generated < up.export_limit) as can_generate_export,
        (up.api_calls_made < up.api_calls_limit) as can_make_api_call,
        (up.mvp_limit - up.mvps_created) as mvps_remaining,
        (up.export_limit - up.exports_generated) as exports_remaining,
        (up.api_calls_limit - up.api_calls_made) as api_calls_remaining,
        CASE 
            WHEN up.mvps_created >= up.mvp_limit THEN 'MVP limit reached'
            WHEN up.exports_generated >= up.export_limit THEN 'Export limit reached'
            WHEN up.api_calls_made >= up.api_calls_limit THEN 'API limit reached'
            ELSE 'All limits OK'
        END as limit_status
    FROM public.user_profiles up
    WHERE up.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. USAGE TRACKING FUNCTIONS
-- =====================================================

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION public.increment_usage_counter(
    user_id_param UUID,
    counter_type TEXT,
    increment_by INTEGER DEFAULT 1
)
RETURNS TABLE (
    counter_name TEXT,
    current_count INTEGER,
    limit_value INTEGER,
    remaining INTEGER,
    can_continue BOOLEAN
) AS $$
DECLARE
    current_count_val INTEGER;
    limit_val INTEGER;
BEGIN
    CASE counter_type
        WHEN 'mvps_created' THEN
            UPDATE public.user_profiles 
            SET mvps_created = mvps_created + increment_by, updated_at = NOW()
            WHERE id = user_id_param
            RETURNING mvps_created, mvp_limit INTO current_count_val, limit_val;
            
        WHEN 'exports_generated' THEN
            UPDATE public.user_profiles 
            SET exports_generated = exports_generated + increment_by, updated_at = NOW()
            WHERE id = user_id_param
            RETURNING exports_generated, export_limit INTO current_count_val, limit_val;
            
        WHEN 'api_calls_made' THEN
            UPDATE public.user_profiles 
            SET api_calls_made = api_calls_made + increment_by, updated_at = NOW()
            WHERE id = user_id_param
            RETURNING api_calls_made, api_calls_limit INTO current_count_val, limit_val;
            
        ELSE
            RAISE EXCEPTION 'Invalid counter type: %', counter_type;
    END CASE;
    
    RETURN QUERY
    SELECT 
        counter_type as counter_name,
        current_count_val as current_count,
        limit_val as limit_value,
        (limit_val - current_count_val) as remaining,
        (current_count_val < limit_val) as can_continue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly counters
CREATE OR REPLACE FUNCTION public.reset_monthly_counters()
RETURNS TABLE (
    user_id UUID,
    subscription_tier TEXT,
    exports_reset INTEGER,
    api_calls_reset INTEGER
) AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    RETURN QUERY
    UPDATE public.user_profiles
    SET
        exports_generated = 0,
        api_calls_made = 0,
        updated_at = NOW()
    WHERE subscription_tier IN ('free', 'pro')
    RETURNING
        id as user_id,
        subscription_tier,
        0 as exports_reset, -- Return 0 since we reset to 0
        0 as api_calls_reset; -- Return 0 since we reset to 0

    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RAISE NOTICE 'Reset monthly counters for % users', reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. USER ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get comprehensive user analytics
CREATE OR REPLACE FUNCTION public.get_user_analytics(user_id_param UUID)
RETURNS TABLE (
    user_id UUID,
    subscription_tier TEXT,
    user_since TIMESTAMP WITH TIME ZONE,
    total_mvps BIGINT,
    built_mvps BIGINT,
    launched_mvps BIGINT,
    studio_projects BIGINT,
    total_exports BIGINT,
    rag_generations BIGINT,
    avg_rag_confidence NUMERIC,
    most_used_platform TEXT,
    most_used_tool TEXT,
    avg_project_complexity NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            up.id,
            up.subscription_tier,
            up.created_at as user_since,
            COUNT(DISTINCT m.id) as total_mvps,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'Built') as built_mvps,
            COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'Launched') as launched_mvps,
            COUNT(DISTINCT m.id) FILTER (WHERE m.is_mvp_studio_project = true) as studio_projects,
            COUNT(DISTINCT eh.id) as total_exports,
            COUNT(DISTINCT rpg.id) as rag_generations,
            AVG(rpg.confidence_score) as avg_rag_confidence
        FROM public.user_profiles up
        LEFT JOIN public.mvps m ON up.id = m.user_id
        LEFT JOIN public.export_history eh ON up.id = eh.user_id
        LEFT JOIN public.rag_prompt_generations rpg ON up.id = rpg.user_id
        WHERE up.id = user_id_param
        GROUP BY up.id, up.subscription_tier, up.created_at
    ),
    platform_stats AS (
        SELECT platform, COUNT(*) as count
        FROM public.mvps, unnest(platforms) as platform
        WHERE user_id = user_id_param
        GROUP BY platform
        ORDER BY count DESC
        LIMIT 1
    ),
    tool_stats AS (
        SELECT target_tool, COUNT(*) as count
        FROM public.rag_prompt_generations
        WHERE user_id = user_id_param
        GROUP BY target_tool
        ORDER BY count DESC
        LIMIT 1
    ),
    complexity_stats AS (
        SELECT AVG(complexity_score) as avg_complexity
        FROM public.mvps
        WHERE user_id = user_id_param AND complexity_score IS NOT NULL
    )
    SELECT 
        us.id,
        us.subscription_tier,
        us.user_since,
        us.total_mvps,
        us.built_mvps,
        us.launched_mvps,
        us.studio_projects,
        us.total_exports,
        us.rag_generations,
        us.avg_rag_confidence,
        ps.platform as most_used_platform,
        ts.target_tool as most_used_tool,
        cs.avg_complexity
    FROM user_stats us
    LEFT JOIN platform_stats ps ON true
    LEFT JOIN tool_stats ts ON true
    LEFT JOIN complexity_stats cs ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ADMIN FUNCTIONS
-- =====================================================

-- Function to get user statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    free_users BIGINT,
    pro_users BIGINT,
    enterprise_users BIGINT,
    active_users_30d BIGINT,
    total_mvps BIGINT,
    total_exports BIGINT,
    avg_mvps_per_user NUMERIC,
    avg_exports_per_user NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH user_counts AS (
        SELECT 
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_users,
            COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_users,
            COUNT(*) FILTER (WHERE subscription_tier = 'enterprise') as enterprise_users
        FROM public.user_profiles
    ),
    activity_stats AS (
        SELECT COUNT(DISTINCT user_id) as active_users_30d
        FROM public.mvps
        WHERE updated_at > NOW() - INTERVAL '30 days'
    ),
    usage_stats AS (
        SELECT 
            SUM(mvps_created) as total_mvps,
            SUM(exports_generated) as total_exports,
            AVG(mvps_created) as avg_mvps_per_user,
            AVG(exports_generated) as avg_exports_per_user
        FROM public.user_profiles
    )
    SELECT 
        uc.total_users,
        uc.free_users,
        uc.pro_users,
        uc.enterprise_users,
        ast.active_users_30d,
        us.total_mvps,
        us.total_exports,
        us.avg_mvps_per_user,
        us.avg_exports_per_user
    FROM user_counts uc, activity_stats ast, usage_stats us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup inactive users
CREATE OR REPLACE FUNCTION public.cleanup_inactive_users(days_inactive INTEGER DEFAULT 365)
RETURNS TABLE (
    cleaned_user_id UUID,
    full_name TEXT,
    last_activity TIMESTAMP WITH TIME ZONE,
    mvp_count BIGINT
) AS $$
BEGIN
    -- Validate input
    IF days_inactive <= 0 THEN
        RAISE EXCEPTION 'days_inactive must be positive, got: %', days_inactive;
    END IF;

    RETURN QUERY
    WITH inactive_users AS (
        SELECT
            up.id,
            up.full_name,
            GREATEST(up.updated_at, COALESCE(MAX(m.updated_at), up.updated_at)) as last_activity,
            COUNT(m.id) as mvp_count
        FROM public.user_profiles up
        LEFT JOIN public.mvps m ON up.id = m.user_id
        WHERE up.subscription_tier = 'free'
        GROUP BY up.id, up.full_name, up.updated_at
        HAVING GREATEST(up.updated_at, COALESCE(MAX(m.updated_at), up.updated_at)) < NOW() - INTERVAL '1 day' * days_inactive
            AND COUNT(m.id) = 0
    )
    DELETE FROM public.user_profiles
    WHERE id IN (SELECT id FROM inactive_users)
    RETURNING
        id as cleaned_user_id,
        full_name,
        updated_at as last_activity,
        0 as mvp_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
