-- =====================================================
-- USER MANAGEMENT QUERIES
-- =====================================================
-- Collection of queries for user profile and authentication management

-- =====================================================
-- 1. USER PROFILE OPERATIONS
-- =====================================================

-- Get user profile with statistics
-- Usage: Replace $1 with user_id
SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.bio,
    up.website_url,
    up.subscription_tier,
    up.mvp_limit,
    up.export_limit,
    up.preferred_ai_tool,
    up.email_notifications,
    up.onboarding_completed,
    up.last_login_at,
    up.created_at,
    up.updated_at,
    -- Statistics
    COUNT(m.id) as total_mvps,
    COUNT(CASE WHEN m.status = 'Launched' THEN 1 END) as launched_mvps,
    COUNT(CASE WHEN m.is_mvp_studio_project = true THEN 1 END) as mvp_studio_projects,
    COUNT(CASE WHEN m.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_mvps,
    -- Rate limit info
    COALESCE(rl.current_count, 0) as current_mvp_usage,
    (up.mvp_limit - COALESCE(rl.current_count, 0)) as remaining_mvps
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
LEFT JOIN public.rate_limits rl ON up.id = rl.user_id 
    AND rl.resource_type = 'mvp_generation' 
    AND rl.reset_date >= CURRENT_DATE
WHERE up.id = $1
GROUP BY up.id, up.full_name, up.avatar_url, up.bio, up.website_url, 
         up.subscription_tier, up.mvp_limit, up.export_limit, up.preferred_ai_tool,
         up.email_notifications, up.onboarding_completed, up.last_login_at,
         up.created_at, up.updated_at, rl.current_count;

-- Create or update user profile
-- Usage: Replace $1-$10 with actual values
INSERT INTO public.user_profiles (
    id, full_name, avatar_url, bio, website_url, 
    subscription_tier, preferred_ai_tool, email_notifications
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) 
DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    website_url = EXCLUDED.website_url,
    subscription_tier = EXCLUDED.subscription_tier,
    preferred_ai_tool = EXCLUDED.preferred_ai_tool,
    email_notifications = EXCLUDED.email_notifications,
    updated_at = NOW()
RETURNING *;

-- Update user preferences
-- Usage: Replace $1-$4 with user_id, preferred_ai_tool, email_notifications
UPDATE public.user_profiles 
SET 
    preferred_ai_tool = $2,
    email_notifications = $3,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Mark onboarding as completed
-- Usage: Replace $1 with user_id
UPDATE public.user_profiles 
SET 
    onboarding_completed = true,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Update last login timestamp
-- Usage: Replace $1 with user_id
UPDATE public.user_profiles 
SET last_login_at = NOW()
WHERE id = $1;

-- =====================================================
-- 2. USER SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Upgrade user subscription
-- Usage: Replace $1 with user_id, $2 with new tier, $3 with new mvp_limit, $4 with new export_limit
UPDATE public.user_profiles 
SET 
    subscription_tier = $2,
    mvp_limit = $3,
    export_limit = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Get users by subscription tier
-- Usage: Replace $1 with subscription tier ('free', 'pro', 'enterprise')
SELECT 
    up.*,
    COUNT(m.id) as total_mvps,
    COUNT(CASE WHEN m.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_mvps
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
WHERE up.subscription_tier = $1
GROUP BY up.id
ORDER BY up.created_at DESC;

-- =====================================================
-- 3. USER ACTIVITY QUERIES
-- =====================================================

-- Get user activity summary
-- Usage: Replace $1 with user_id, $2 with start_date, $3 with end_date
SELECT 
    DATE_TRUNC('day', ae.created_at) as activity_date,
    ae.event_type,
    ae.event_category,
    COUNT(*) as event_count
FROM public.analytics_events ae
WHERE ae.user_id = $1 
    AND ae.created_at >= $2 
    AND ae.created_at <= $3
GROUP BY DATE_TRUNC('day', ae.created_at), ae.event_type, ae.event_category
ORDER BY activity_date DESC, event_count DESC;

-- Get user's recent activity
-- Usage: Replace $1 with user_id, $2 with limit (default 20)
SELECT 
    'mvp_created' as activity_type,
    m.app_name as title,
    'Created new MVP project' as description,
    m.created_at as timestamp,
    jsonb_build_object(
        'mvp_id', m.id,
        'platforms', m.platforms,
        'style', m.style,
        'is_mvp_studio', m.is_mvp_studio_project
    ) as metadata
FROM public.mvps m
WHERE m.user_id = $1

UNION ALL

SELECT 
    'mvp_updated' as activity_type,
    m.app_name as title,
    'Updated MVP project' as description,
    m.updated_at as timestamp,
    jsonb_build_object(
        'mvp_id', m.id,
        'status', m.status,
        'completion_stage', m.completion_stage
    ) as metadata
FROM public.mvps m
WHERE m.user_id = $1 AND m.updated_at > m.created_at

UNION ALL

SELECT 
    'export_generated' as activity_type,
    'Export Generated' as title,
    'Generated export for ' || m.app_name as description,
    eh.created_at as timestamp,
    jsonb_build_object(
        'export_type', eh.export_type,
        'target_tool', eh.target_tool,
        'mvp_id', eh.mvp_id
    ) as metadata
FROM public.export_history eh
JOIN public.mvps m ON eh.mvp_id = m.id
WHERE eh.user_id = $1

ORDER BY timestamp DESC
LIMIT $2;

-- =====================================================
-- 4. USER SEARCH AND FILTERING
-- =====================================================

-- Search users by name or email (admin only)
-- Usage: Replace $1 with search term
SELECT 
    up.id,
    up.full_name,
    au.email,
    up.subscription_tier,
    up.created_at,
    COUNT(m.id) as total_mvps
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
LEFT JOIN public.mvps m ON up.id = m.user_id
WHERE 
    up.full_name ILIKE '%' || $1 || '%' OR
    au.email ILIKE '%' || $1 || '%'
GROUP BY up.id, up.full_name, au.email, up.subscription_tier, up.created_at
ORDER BY up.created_at DESC;

-- Get users with high activity (admin analytics)
-- Usage: Replace $1 with minimum MVP count, $2 with days back
SELECT 
    up.id,
    up.full_name,
    up.subscription_tier,
    COUNT(m.id) as total_mvps,
    COUNT(CASE WHEN m.created_at >= NOW() - INTERVAL $2 || ' days' THEN 1 END) as recent_mvps,
    COUNT(CASE WHEN m.status = 'Launched' THEN 1 END) as launched_mvps,
    MAX(m.created_at) as last_mvp_created
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
GROUP BY up.id, up.full_name, up.subscription_tier
HAVING COUNT(m.id) >= $1
ORDER BY total_mvps DESC, recent_mvps DESC;

-- =====================================================
-- 5. USER CLEANUP AND MAINTENANCE
-- =====================================================

-- Get inactive users (no activity in X days)
-- Usage: Replace $1 with days of inactivity
SELECT 
    up.id,
    up.full_name,
    up.subscription_tier,
    up.last_login_at,
    up.created_at,
    COUNT(m.id) as total_mvps,
    MAX(m.updated_at) as last_mvp_activity
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
WHERE 
    up.last_login_at < NOW() - INTERVAL $1 || ' days' OR
    up.last_login_at IS NULL
GROUP BY up.id, up.full_name, up.subscription_tier, up.last_login_at, up.created_at
ORDER BY up.last_login_at ASC NULLS FIRST;

-- Get users who haven't completed onboarding
SELECT 
    up.id,
    up.full_name,
    up.created_at,
    COUNT(m.id) as mvps_created
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
WHERE up.onboarding_completed = false
GROUP BY up.id, up.full_name, up.created_at
ORDER BY up.created_at DESC;

-- =====================================================
-- 6. USER STATISTICS AND REPORTING
-- =====================================================

-- Get user growth statistics
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    DATE_TRUNC('day', created_at) as signup_date,
    COUNT(*) as new_users,
    COUNT(*) FILTER (WHERE subscription_tier = 'free') as free_users,
    COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_users,
    COUNT(*) FILTER (WHERE subscription_tier = 'enterprise') as enterprise_users
FROM public.user_profiles
WHERE created_at >= $1 AND created_at <= $2
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY signup_date DESC;

-- Get subscription tier distribution
SELECT 
    subscription_tier,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) as avg_days_since_signup
FROM public.user_profiles
GROUP BY subscription_tier
ORDER BY user_count DESC;
