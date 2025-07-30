-- =====================================================
-- RATE LIMITING QUERIES
-- =====================================================
-- Collection of queries for rate limiting functionality

-- =====================================================
-- 1. RATE LIMIT CHECKING
-- =====================================================

-- Check current rate limit status for user
-- Usage: Replace $1 with user_id, $2 with resource_type
SELECT 
    rl.current_count,
    rl.limit_value,
    (rl.limit_value - rl.current_count) as remaining,
    rl.reset_date,
    rl.window_type,
    CASE 
        WHEN rl.current_count >= rl.limit_value THEN false
        ELSE true
    END as can_proceed,
    CASE 
        WHEN rl.reset_date <= CURRENT_DATE THEN true
        ELSE false
    END as needs_reset
FROM public.rate_limits rl
WHERE rl.user_id = $1 
    AND rl.resource_type = $2
    AND rl.reset_date >= CURRENT_DATE
ORDER BY rl.reset_date DESC
LIMIT 1;

-- Get comprehensive rate limit info for user
-- Usage: Replace $1 with user_id
SELECT 
    up.subscription_tier,
    up.mvp_limit,
    up.export_limit,
    COALESCE(mvp_rl.current_count, 0) as mvp_usage,
    COALESCE(export_rl.current_count, 0) as export_usage,
    (up.mvp_limit - COALESCE(mvp_rl.current_count, 0)) as mvp_remaining,
    (up.export_limit - COALESCE(export_rl.current_count, 0)) as export_remaining,
    mvp_rl.reset_date as mvp_reset_date,
    export_rl.reset_date as export_reset_date
FROM public.user_profiles up
LEFT JOIN public.rate_limits mvp_rl ON up.id = mvp_rl.user_id 
    AND mvp_rl.resource_type = 'mvp_generation' 
    AND mvp_rl.reset_date >= CURRENT_DATE
LEFT JOIN public.rate_limits export_rl ON up.id = export_rl.user_id 
    AND export_rl.resource_type = 'export_generation' 
    AND export_rl.reset_date >= CURRENT_DATE
WHERE up.id = $1;

-- Check if user can perform action (with fallback to profile limits)
-- Usage: Replace $1 with user_id, $2 with resource_type
WITH user_limits AS (
    SELECT 
        id,
        CASE $2
            WHEN 'mvp_generation' THEN mvp_limit
            WHEN 'export_generation' THEN export_limit
            ELSE 3
        END as default_limit
    FROM public.user_profiles
    WHERE id = $1
),
current_usage AS (
    SELECT 
        COALESCE(rl.current_count, 0) as current_count,
        COALESCE(rl.limit_value, ul.default_limit) as limit_value,
        COALESCE(rl.reset_date, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month') as reset_date
    FROM user_limits ul
    LEFT JOIN public.rate_limits rl ON ul.id = rl.user_id 
        AND rl.resource_type = $2
        AND rl.reset_date >= CURRENT_DATE
)
SELECT 
    current_count,
    limit_value,
    (limit_value - current_count) as remaining,
    reset_date,
    CASE 
        WHEN current_count >= limit_value THEN false
        ELSE true
    END as can_proceed
FROM current_usage;

-- =====================================================
-- 2. RATE LIMIT UPDATES
-- =====================================================

-- Increment rate limit counter
-- Usage: Replace $1 with user_id, $2 with resource_type, $3 with limit_value, $4 with window_type
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
    $1, 
    $2, 
    $3, 
    $4, 
    1, 
    CASE $4
        WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
        WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
        WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        WHEN 'yearly' THEN DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
        ELSE DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    END,
    NOW(),
    NOW()
)
ON CONFLICT (user_id, resource_type, reset_date)
DO UPDATE SET 
    current_count = rate_limits.current_count + 1,
    last_request_at = NOW()
RETURNING 
    current_count,
    limit_value,
    (limit_value - current_count) as remaining,
    reset_date,
    CASE 
        WHEN current_count <= limit_value THEN true
        ELSE false
    END as success;

-- Reset rate limit for user (admin function)
-- Usage: Replace $1 with user_id, $2 with resource_type
UPDATE public.rate_limits 
SET 
    current_count = 0,
    first_request_at = NULL,
    last_request_at = NULL,
    updated_at = NOW()
WHERE user_id = $1 AND resource_type = $2
RETURNING *;

-- Update rate limit values (subscription change)
-- Usage: Replace $1 with user_id, $2 with resource_type, $3 with new_limit
UPDATE public.rate_limits 
SET 
    limit_value = $3,
    updated_at = NOW()
WHERE user_id = $1 
    AND resource_type = $2
    AND reset_date >= CURRENT_DATE
RETURNING *;

-- =====================================================
-- 3. RATE LIMIT ANALYTICS
-- =====================================================

-- Get rate limit usage statistics
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    rl.resource_type,
    COUNT(DISTINCT rl.user_id) as unique_users,
    SUM(rl.current_count) as total_usage,
    AVG(rl.current_count) as avg_usage_per_user,
    COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as users_at_limit,
    ROUND(COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) * 100.0 / COUNT(*), 2) as limit_hit_rate
FROM public.rate_limits rl
WHERE rl.created_at >= $1 AND rl.created_at <= $2
GROUP BY rl.resource_type
ORDER BY total_usage DESC;

-- Get users hitting rate limits frequently
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    rl.user_id,
    up.full_name,
    up.subscription_tier,
    rl.resource_type,
    COUNT(*) as limit_periods,
    SUM(rl.current_count) as total_usage,
    COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as periods_at_limit,
    ROUND(COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) * 100.0 / COUNT(*), 2) as limit_hit_rate
FROM public.rate_limits rl
JOIN public.user_profiles up ON rl.user_id = up.id
WHERE rl.created_at >= $1 AND rl.created_at <= $2
GROUP BY rl.user_id, up.full_name, up.subscription_tier, rl.resource_type
HAVING COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) > 0
ORDER BY periods_at_limit DESC, total_usage DESC;

-- Rate limit effectiveness analysis
-- Usage: Replace $1 with start_date, $2 with end_date
WITH limit_stats AS (
    SELECT 
        up.subscription_tier,
        rl.resource_type,
        COUNT(DISTINCT rl.user_id) as users_with_limits,
        AVG(rl.current_count::float / rl.limit_value) as avg_utilization_rate,
        COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as users_at_limit
    FROM public.rate_limits rl
    JOIN public.user_profiles up ON rl.user_id = up.id
    WHERE rl.created_at >= $1 AND rl.created_at <= $2
    GROUP BY up.subscription_tier, rl.resource_type
)
SELECT 
    subscription_tier,
    resource_type,
    users_with_limits,
    ROUND(avg_utilization_rate * 100, 2) as avg_utilization_percentage,
    users_at_limit,
    ROUND(users_at_limit * 100.0 / users_with_limits, 2) as limit_hit_percentage
FROM limit_stats
ORDER BY subscription_tier, resource_type;

-- =====================================================
-- 4. RATE LIMIT MONITORING
-- =====================================================

-- Get users approaching their limits (80%+ usage)
-- Usage: Replace $1 with threshold (e.g., 0.8 for 80%)
SELECT 
    rl.user_id,
    up.full_name,
    up.subscription_tier,
    rl.resource_type,
    rl.current_count,
    rl.limit_value,
    ROUND(rl.current_count::float / rl.limit_value * 100, 2) as usage_percentage,
    rl.reset_date,
    (rl.reset_date - CURRENT_DATE) as days_until_reset
FROM public.rate_limits rl
JOIN public.user_profiles up ON rl.user_id = up.id
WHERE rl.reset_date >= CURRENT_DATE
    AND rl.current_count::float / rl.limit_value >= $1
ORDER BY usage_percentage DESC, days_until_reset ASC;

-- Get rate limit violations (over limit)
SELECT 
    rl.user_id,
    up.full_name,
    up.subscription_tier,
    rl.resource_type,
    rl.current_count,
    rl.limit_value,
    (rl.current_count - rl.limit_value) as over_limit_by,
    rl.last_request_at,
    rl.reset_date
FROM public.rate_limits rl
JOIN public.user_profiles up ON rl.user_id = up.id
WHERE rl.current_count > rl.limit_value
    AND rl.reset_date >= CURRENT_DATE
ORDER BY over_limit_by DESC, rl.last_request_at DESC;

-- Daily rate limit summary
-- Usage: Replace $1 with specific_date
SELECT 
    rl.resource_type,
    up.subscription_tier,
    COUNT(DISTINCT rl.user_id) as active_users,
    SUM(rl.current_count) as total_usage,
    AVG(rl.current_count) as avg_usage,
    COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as users_at_limit,
    MAX(rl.current_count) as max_usage
FROM public.rate_limits rl
JOIN public.user_profiles up ON rl.user_id = up.id
WHERE DATE(rl.last_request_at) = $1
GROUP BY rl.resource_type, up.subscription_tier
ORDER BY rl.resource_type, up.subscription_tier;

-- =====================================================
-- 5. RATE LIMIT MAINTENANCE
-- =====================================================

-- Clean up expired rate limit records
-- Usage: Run periodically to clean old data
DELETE FROM public.rate_limits 
WHERE reset_date < CURRENT_DATE - INTERVAL '30 days'
RETURNING user_id, resource_type, reset_date;

-- Reset all rate limits for new period (monthly job)
-- Usage: Replace $1 with resource_type, $2 with window_type
UPDATE public.rate_limits 
SET 
    current_count = 0,
    reset_date = CASE $2
        WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
        WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week'
        WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        WHEN 'yearly' THEN DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
        ELSE DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    END,
    first_request_at = NULL,
    last_request_at = NULL,
    updated_at = NOW()
WHERE resource_type = $1 
    AND window_type = $2
    AND reset_date <= CURRENT_DATE
RETURNING user_id, resource_type, reset_date;

-- Bulk update rate limits for subscription tier change
-- Usage: Replace $1 with user_ids array, $2 with resource_type, $3 with new_limit
UPDATE public.rate_limits 
SET 
    limit_value = $3,
    updated_at = NOW()
WHERE user_id = ANY($1)
    AND resource_type = $2
    AND reset_date >= CURRENT_DATE
RETURNING user_id, resource_type, limit_value;

-- =====================================================
-- 6. RATE LIMIT REPORTING
-- =====================================================

-- Monthly rate limit report
-- Usage: Replace $1 with year, $2 with month
SELECT 
    rl.resource_type,
    up.subscription_tier,
    COUNT(DISTINCT rl.user_id) as unique_users,
    SUM(rl.current_count) as total_requests,
    AVG(rl.current_count) as avg_requests_per_user,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rl.current_count) as median_requests,
    COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as users_hitting_limit,
    MAX(rl.current_count) as max_requests
FROM public.rate_limits rl
JOIN public.user_profiles up ON rl.user_id = up.id
WHERE EXTRACT(YEAR FROM rl.reset_date) = $1
    AND EXTRACT(MONTH FROM rl.reset_date) = $2
GROUP BY rl.resource_type, up.subscription_tier
ORDER BY rl.resource_type, 
    CASE up.subscription_tier 
        WHEN 'enterprise' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'free' THEN 3 
    END;

-- Rate limit trends over time
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    DATE_TRUNC('week', rl.created_at) as week,
    rl.resource_type,
    COUNT(DISTINCT rl.user_id) as active_users,
    SUM(rl.current_count) as total_usage,
    AVG(rl.current_count) as avg_usage_per_user,
    COUNT(*) FILTER (WHERE rl.current_count >= rl.limit_value) as users_at_limit
FROM public.rate_limits rl
WHERE rl.created_at >= $1 AND rl.created_at <= $2
GROUP BY DATE_TRUNC('week', rl.created_at), rl.resource_type
ORDER BY week DESC, rl.resource_type;
