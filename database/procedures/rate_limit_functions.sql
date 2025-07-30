-- =====================================================
-- RATE LIMITING STORED PROCEDURES AND FUNCTIONS
-- =====================================================
-- Comprehensive rate limiting functionality for MVP Studio

-- =====================================================
-- 1. CORE RATE LIMITING FUNCTIONS
-- =====================================================

-- Function to check and consume rate limit in one operation
CREATE OR REPLACE FUNCTION check_and_consume_rate_limit(
    p_user_id UUID,
    p_resource_type TEXT,
    p_limit_value INTEGER DEFAULT NULL,
    p_window_type TEXT DEFAULT 'monthly'
)
RETURNS JSONB AS $$
DECLARE
    user_profile RECORD;
    current_limit INTEGER;
    reset_date DATE;
    rate_limit_record RECORD;
    result JSONB;
BEGIN
    -- Get user profile to determine default limits
    SELECT subscription_tier, mvp_limit, export_limit 
    INTO user_profile
    FROM public.user_profiles 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found',
            'error_code', 'USER_NOT_FOUND'
        );
    END IF;
    
    -- Determine the limit value
    current_limit := COALESCE(
        p_limit_value,
        CASE p_resource_type
            WHEN 'mvp_generation' THEN user_profile.mvp_limit
            WHEN 'export_generation' THEN user_profile.export_limit
            ELSE 3
        END
    );
    
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
        current_limit, 
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
    RETURNING * INTO rate_limit_record;
    
    -- Build result
    result := jsonb_build_object(
        'success', rate_limit_record.current_count <= rate_limit_record.limit_value,
        'current_count', rate_limit_record.current_count,
        'limit_value', rate_limit_record.limit_value,
        'remaining', GREATEST(0, rate_limit_record.limit_value - rate_limit_record.current_count),
        'reset_date', rate_limit_record.reset_date,
        'window_type', rate_limit_record.window_type,
        'user_tier', user_profile.subscription_tier
    );
    
    -- Add error information if limit exceeded
    IF rate_limit_record.current_count > rate_limit_record.limit_value THEN
        result := result || jsonb_build_object(
            'error', 'Rate limit exceeded',
            'error_code', 'RATE_LIMIT_EXCEEDED',
            'retry_after', rate_limit_record.reset_date
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limit without consuming
CREATE OR REPLACE FUNCTION check_rate_limit_status(
    p_user_id UUID,
    p_resource_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    user_profile RECORD;
    rate_limit_record RECORD;
    default_limit INTEGER;
    result JSONB;
BEGIN
    -- Get user profile
    SELECT subscription_tier, mvp_limit, export_limit 
    INTO user_profile
    FROM public.user_profiles 
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
    
    -- Determine default limit
    default_limit := CASE p_resource_type
        WHEN 'mvp_generation' THEN user_profile.mvp_limit
        WHEN 'export_generation' THEN user_profile.export_limit
        ELSE 3
    END;
    
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
            'limit_value', default_limit,
            'remaining', default_limit,
            'reset_date', DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
            'window_type', 'monthly',
            'user_tier', user_profile.subscription_tier
        );
    ELSE
        result := jsonb_build_object(
            'success', rate_limit_record.current_count < rate_limit_record.limit_value,
            'current_count', rate_limit_record.current_count,
            'limit_value', rate_limit_record.limit_value,
            'remaining', GREATEST(0, rate_limit_record.limit_value - rate_limit_record.current_count),
            'reset_date', rate_limit_record.reset_date,
            'window_type', rate_limit_record.window_type,
            'user_tier', user_profile.subscription_tier
        );
        
        -- Add error if limit exceeded
        IF rate_limit_record.current_count >= rate_limit_record.limit_value THEN
            result := result || jsonb_build_object(
                'error', 'Rate limit would be exceeded',
                'error_code', 'RATE_LIMIT_WOULD_EXCEED'
            );
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. RATE LIMIT MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to reset rate limit for a user
CREATE OR REPLACE FUNCTION reset_user_rate_limit(
    p_user_id UUID,
    p_resource_type TEXT
)
RETURNS JSONB AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.rate_limits 
    SET 
        current_count = 0,
        first_request_at = NULL,
        last_request_at = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id 
        AND resource_type = p_resource_type
        AND reset_date >= CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'reset_count', updated_count,
        'message', 'Rate limit reset successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update rate limits after subscription change
CREATE OR REPLACE FUNCTION update_rate_limits_for_subscription(
    p_user_id UUID,
    p_new_mvp_limit INTEGER,
    p_new_export_limit INTEGER
)
RETURNS JSONB AS $$
DECLARE
    updated_mvp INTEGER := 0;
    updated_export INTEGER := 0;
BEGIN
    -- Update MVP generation limits
    UPDATE public.rate_limits 
    SET 
        limit_value = p_new_mvp_limit,
        updated_at = NOW()
    WHERE user_id = p_user_id 
        AND resource_type = 'mvp_generation'
        AND reset_date >= CURRENT_DATE;
    
    GET DIAGNOSTICS updated_mvp = ROW_COUNT;
    
    -- Update export generation limits
    UPDATE public.rate_limits 
    SET 
        limit_value = p_new_export_limit,
        updated_at = NOW()
    WHERE user_id = p_user_id 
        AND resource_type = 'export_generation'
        AND reset_date >= CURRENT_DATE;
    
    GET DIAGNOSTICS updated_export = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'updated_mvp_limits', updated_mvp,
        'updated_export_limits', updated_export,
        'message', 'Rate limits updated for subscription change'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. BULK RATE LIMIT OPERATIONS
-- =====================================================

-- Function to reset rate limits for all users (monthly reset)
CREATE OR REPLACE FUNCTION reset_monthly_rate_limits()
RETURNS JSONB AS $$
DECLARE
    reset_count INTEGER;
    current_month DATE;
BEGIN
    current_month := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Reset all monthly rate limits that have expired
    UPDATE public.rate_limits 
    SET 
        current_count = 0,
        reset_date = current_month + INTERVAL '1 month',
        first_request_at = NULL,
        last_request_at = NULL,
        updated_at = NOW()
    WHERE window_type = 'monthly' 
        AND reset_date <= current_month;
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'reset_count', reset_count,
        'reset_date', current_month,
        'message', 'Monthly rate limits reset successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.rate_limits 
    WHERE reset_date < CURRENT_DATE - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'message', 'Expired rate limits cleaned up successfully'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. RATE LIMIT ANALYTICS FUNCTIONS
-- =====================================================

-- Function to get rate limit usage analytics
CREATE OR REPLACE FUNCTION get_rate_limit_analytics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    resource_type TEXT,
    subscription_tier TEXT,
    total_users BIGINT,
    avg_usage NUMERIC,
    users_at_limit BIGINT,
    limit_hit_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rl.resource_type,
        up.subscription_tier,
        COUNT(DISTINCT rl.user_id) as total_users,
        ROUND(AVG(rl.current_count), 2) as avg_usage,
        COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as users_at_limit,
        ROUND(
            COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) * 100.0 / COUNT(*), 
            2
        ) as limit_hit_rate
    FROM public.rate_limits rl
    JOIN public.user_profiles up ON rl.user_id = up.id
    WHERE rl.created_at >= p_start_date 
        AND rl.created_at <= p_end_date
    GROUP BY rl.resource_type, up.subscription_tier
    ORDER BY rl.resource_type, up.subscription_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to identify users who frequently hit limits
CREATE OR REPLACE FUNCTION get_frequent_limit_hitters(
    p_days_back INTEGER DEFAULT 30,
    p_min_violations INTEGER DEFAULT 3
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    subscription_tier TEXT,
    resource_type TEXT,
    violation_count BIGINT,
    total_usage BIGINT,
    avg_usage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rl.user_id,
        up.full_name,
        up.subscription_tier,
        rl.resource_type,
        COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as violation_count,
        SUM(rl.current_count) as total_usage,
        ROUND(AVG(rl.current_count), 2) as avg_usage
    FROM public.rate_limits rl
    JOIN public.user_profiles up ON rl.user_id = up.id
    WHERE rl.created_at >= CURRENT_DATE - INTERVAL p_days_back || ' days'
    GROUP BY rl.user_id, up.full_name, up.subscription_tier, rl.resource_type
    HAVING COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) >= p_min_violations
    ORDER BY violation_count DESC, total_usage DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. UTILITY FUNCTIONS
-- =====================================================

-- Function to get user's current rate limit status for all resources
CREATE OR REPLACE FUNCTION get_user_all_rate_limits(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    mvp_status JSONB;
    export_status JSONB;
BEGIN
    -- Get MVP generation status
    SELECT check_rate_limit_status(p_user_id, 'mvp_generation') INTO mvp_status;
    
    -- Get export generation status
    SELECT check_rate_limit_status(p_user_id, 'export_generation') INTO export_status;
    
    result := jsonb_build_object(
        'mvp_generation', mvp_status,
        'export_generation', export_status,
        'user_id', p_user_id,
        'checked_at', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to simulate rate limit check (for testing)
CREATE OR REPLACE FUNCTION simulate_rate_limit_check(
    p_user_id UUID,
    p_resource_type TEXT,
    p_requests_to_simulate INTEGER
)
RETURNS JSONB AS $$
DECLARE
    i INTEGER;
    result JSONB;
    final_result JSONB;
BEGIN
    FOR i IN 1..p_requests_to_simulate LOOP
        SELECT check_and_consume_rate_limit(p_user_id, p_resource_type) INTO result;
        final_result := result;
    END LOOP;
    
    RETURN jsonb_build_object(
        'simulated_requests', p_requests_to_simulate,
        'final_status', final_result,
        'simulation_completed_at', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Check and consume rate limit:
-- SELECT check_and_consume_rate_limit('user-uuid', 'mvp_generation');

-- Check status without consuming:
-- SELECT check_rate_limit_status('user-uuid', 'mvp_generation');

-- Reset user's rate limit:
-- SELECT reset_user_rate_limit('user-uuid', 'mvp_generation');

-- Get analytics:
-- SELECT * FROM get_rate_limit_analytics();

-- Get all rate limits for user:
-- SELECT get_user_all_rate_limits('user-uuid');
