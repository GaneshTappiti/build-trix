-- =====================================================
-- USER MANAGEMENT OPERATIONS - API QUERIES
-- =====================================================
-- This file contains all SQL queries for user management operations
-- Used by: Authentication and user profile endpoints

-- =====================================================
-- 1. USER PROFILE OPERATIONS
-- =====================================================

-- Get user profile
-- Usage: Replace $1 with user_id
-- Used in: Profile loading, dashboard
SELECT 
    id,
    full_name,
    avatar_url,
    subscription_tier,
    mvp_limit,
    export_limit,
    api_calls_limit,
    default_ai_tool,
    preferred_platforms,
    preferred_style,
    mvps_created,
    exports_generated,
    api_calls_made,
    created_at,
    updated_at
FROM public.user_profiles
WHERE id = $1;

-- Create user profile (triggered on signup)
-- Usage: Replace parameters with actual values
-- Used in: User registration trigger
INSERT INTO public.user_profiles (
    id,
    full_name,
    avatar_url,
    subscription_tier,
    mvp_limit,
    export_limit,
    api_calls_limit,
    default_ai_tool,
    preferred_platforms,
    preferred_style
) VALUES (
    $1, -- user_id (from auth.users)
    $2, -- full_name
    $3, -- avatar_url
    COALESCE($4, 'free'), -- subscription_tier
    COALESCE($5, 3), -- mvp_limit
    COALESCE($6, 10), -- export_limit
    COALESCE($7, 100), -- api_calls_limit
    $8, -- default_ai_tool
    COALESCE($9, ARRAY['web']), -- preferred_platforms
    COALESCE($10, 'Minimal & Clean') -- preferred_style
)
ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
    updated_at = NOW()
RETURNING *;

-- Update user profile
-- Usage: Replace parameters with actual values
-- Used in: Profile update endpoints
UPDATE public.user_profiles
SET 
    full_name = COALESCE($2, full_name),
    avatar_url = COALESCE($3, avatar_url),
    default_ai_tool = COALESCE($4, default_ai_tool),
    preferred_platforms = COALESCE($5, preferred_platforms),
    preferred_style = COALESCE($6, preferred_style),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- =====================================================
-- 2. SUBSCRIPTION MANAGEMENT
-- =====================================================

-- Update subscription tier
-- Usage: Replace $1 with user_id, $2 with new_tier
-- Used in: Subscription upgrade/downgrade
UPDATE public.user_profiles 
SET 
    subscription_tier = $2,
    mvp_limit = CASE 
        WHEN $2 = 'free' THEN 3
        WHEN $2 = 'pro' THEN 25
        WHEN $2 = 'enterprise' THEN 100
        ELSE mvp_limit
    END,
    export_limit = CASE 
        WHEN $2 = 'free' THEN 10
        WHEN $2 = 'pro' THEN 100
        WHEN $2 = 'enterprise' THEN 500
        ELSE export_limit
    END,
    api_calls_limit = CASE 
        WHEN $2 = 'free' THEN 100
        WHEN $2 = 'pro' THEN 1000
        WHEN $2 = 'enterprise' THEN 10000
        ELSE api_calls_limit
    END,
    updated_at = NOW()
WHERE id = $1
RETURNING id, subscription_tier, mvp_limit, export_limit, api_calls_limit;

-- Get subscription details
-- Usage: Replace $1 with user_id
-- Used in: Billing and limits checking
SELECT 
    id,
    subscription_tier,
    mvp_limit,
    export_limit,
    api_calls_limit,
    mvps_created,
    exports_generated,
    api_calls_made,
    (mvp_limit - mvps_created) as mvps_remaining,
    (export_limit - exports_generated) as exports_remaining,
    (api_calls_limit - api_calls_made) as api_calls_remaining
FROM public.user_profiles
WHERE id = $1;

-- =====================================================
-- 3. USAGE TRACKING
-- =====================================================

-- Increment MVP count
-- Usage: Replace $1 with user_id, $2 with increment (default 1)
-- Used in: When user creates MVP
UPDATE public.user_profiles
SET 
    mvps_created = mvps_created + COALESCE($2, 1),
    updated_at = NOW()
WHERE id = $1
RETURNING mvps_created, mvp_limit, (mvp_limit - mvps_created) as remaining;

-- Increment export count
-- Usage: Replace $1 with user_id, $2 with increment (default 1)
-- Used in: When user generates export
UPDATE public.user_profiles
SET 
    exports_generated = exports_generated + COALESCE($2, 1),
    updated_at = NOW()
WHERE id = $1
RETURNING exports_generated, export_limit, (export_limit - exports_generated) as remaining;

-- Increment API calls count
-- Usage: Replace $1 with user_id, $2 with increment (default 1)
-- Used in: API rate limiting
UPDATE public.user_profiles
SET 
    api_calls_made = api_calls_made + COALESCE($2, 1),
    updated_at = NOW()
WHERE id = $1
RETURNING api_calls_made, api_calls_limit, (api_calls_limit - api_calls_made) as remaining;

-- Reset monthly counters (scheduled job)
-- Usage: No parameters needed
-- Used in: Monthly reset job
UPDATE public.user_profiles
SET 
    exports_generated = 0,
    api_calls_made = 0,
    updated_at = NOW()
WHERE subscription_tier IN ('free', 'pro')
RETURNING id, subscription_tier;

-- =====================================================
-- 4. RATE LIMITING CHECKS
-- =====================================================

-- Check if user can create MVP
-- Usage: Replace $1 with user_id
-- Used in: Before MVP creation
SELECT 
    (mvps_created < mvp_limit) as can_create_mvp,
    mvps_created,
    mvp_limit,
    (mvp_limit - mvps_created) as remaining_mvps
FROM public.user_profiles
WHERE id = $1;

-- Check if user can generate export
-- Usage: Replace $1 with user_id
-- Used in: Before export generation
SELECT 
    (exports_generated < export_limit) as can_generate_export,
    exports_generated,
    export_limit,
    (export_limit - exports_generated) as remaining_exports
FROM public.user_profiles
WHERE id = $1;

-- Check if user can make API call
-- Usage: Replace $1 with user_id
-- Used in: API rate limiting
SELECT 
    (api_calls_made < api_calls_limit) as can_make_api_call,
    api_calls_made,
    api_calls_limit,
    (api_calls_limit - api_calls_made) as remaining_calls
FROM public.user_profiles
WHERE id = $1;

-- Get comprehensive rate limit status
-- Usage: Replace $1 with user_id
-- Used in: Dashboard rate limit display
SELECT 
    subscription_tier,
    mvps_created,
    mvp_limit,
    (mvps_created < mvp_limit) as can_create_mvp,
    exports_generated,
    export_limit,
    (exports_generated < export_limit) as can_generate_export,
    api_calls_made,
    api_calls_limit,
    (api_calls_made < api_calls_limit) as can_make_api_call,
    CASE 
        WHEN mvps_created >= mvp_limit THEN 'MVP limit reached'
        WHEN exports_generated >= export_limit THEN 'Export limit reached'
        WHEN api_calls_made >= api_calls_limit THEN 'API limit reached'
        ELSE 'All limits OK'
    END as limit_status
FROM public.user_profiles
WHERE id = $1;

-- =====================================================
-- 5. USER PREFERENCES
-- =====================================================

-- Get user preferences for RAG system
-- Usage: Replace $1 with user_id
-- Used in: RAG system personalization
SELECT 
    up.default_ai_tool,
    up.preferred_platforms,
    up.preferred_style,
    rup.default_complexity,
    rup.default_experience,
    rup.enable_enhancement_suggestions,
    rup.enable_confidence_scoring,
    rup.enable_tool_recommendations,
    rup.preferred_prompt_style,
    rup.preferred_detail_level,
    rup.learning_mode
FROM public.user_profiles up
LEFT JOIN public.rag_user_preferences rup ON up.id = rup.user_id
WHERE up.id = $1;

-- Update user preferences
-- Usage: Replace parameters with actual values
-- Used in: Preferences update
UPDATE public.user_profiles
SET 
    default_ai_tool = COALESCE($2, default_ai_tool),
    preferred_platforms = COALESCE($3, preferred_platforms),
    preferred_style = COALESCE($4, preferred_style),
    updated_at = NOW()
WHERE id = $1
RETURNING default_ai_tool, preferred_platforms, preferred_style;

-- =====================================================
-- 6. USER ANALYTICS
-- =====================================================

-- Get user activity summary
-- Usage: Replace $1 with user_id
-- Used in: User dashboard analytics
SELECT 
    up.mvps_created,
    up.exports_generated,
    up.api_calls_made,
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
WHERE up.id = $1
GROUP BY up.id, up.mvps_created, up.exports_generated, up.api_calls_made, 
         up.subscription_tier, up.created_at;

-- Get user's most used tools and platforms
-- Usage: Replace $1 with user_id
-- Used in: Usage pattern analysis
SELECT 
    'platform' as type,
    platform as name,
    COUNT(*) as usage_count
FROM public.mvps,
     unnest(platforms) as platform
WHERE user_id = $1
GROUP BY platform
UNION ALL
SELECT 
    'tool' as type,
    target_tool as name,
    COUNT(*) as usage_count
FROM public.rag_prompt_generations
WHERE user_id = $1
GROUP BY target_tool
ORDER BY usage_count DESC;

-- =====================================================
-- 7. ADMIN QUERIES
-- =====================================================

-- Get all users with statistics (admin only)
-- Usage: Replace $1 with limit, $2 with offset
-- Used in: Admin user management
SELECT 
    up.id,
    up.full_name,
    up.subscription_tier,
    up.mvps_created,
    up.exports_generated,
    up.api_calls_made,
    up.created_at,
    up.updated_at,
    COUNT(DISTINCT m.id) as total_mvps,
    COUNT(DISTINCT eh.id) as total_exports,
    MAX(m.updated_at) as last_mvp_activity,
    MAX(eh.created_at) as last_export_activity
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
LEFT JOIN public.export_history eh ON up.id = eh.user_id
GROUP BY up.id, up.full_name, up.subscription_tier, up.mvps_created, 
         up.exports_generated, up.api_calls_made, up.created_at, up.updated_at
ORDER BY up.created_at DESC
LIMIT $1 OFFSET $2;

-- Get subscription tier statistics
-- Usage: No parameters needed
-- Used in: Admin analytics
SELECT 
    subscription_tier,
    COUNT(*) as user_count,
    AVG(mvps_created) as avg_mvps_created,
    AVG(exports_generated) as avg_exports_generated,
    SUM(mvps_created) as total_mvps_created,
    SUM(exports_generated) as total_exports_generated
FROM public.user_profiles
GROUP BY subscription_tier
ORDER BY 
    CASE subscription_tier 
        WHEN 'enterprise' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'free' THEN 3 
        ELSE 4 
    END;

-- =====================================================
-- 8. USER CLEANUP
-- =====================================================

-- Get inactive users for cleanup
-- Usage: Replace $1 with days_inactive
-- Used in: Cleanup inactive accounts
SELECT 
    up.id,
    up.full_name,
    up.created_at,
    up.updated_at,
    COUNT(m.id) as mvp_count,
    MAX(m.updated_at) as last_mvp_activity
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
WHERE up.updated_at < NOW() - INTERVAL '1 day' * $1
    AND (m.updated_at IS NULL OR m.updated_at < NOW() - INTERVAL '1 day' * $1)
GROUP BY up.id, up.full_name, up.created_at, up.updated_at
HAVING COUNT(m.id) = 0 OR MAX(m.updated_at) < NOW() - INTERVAL '1 day' * $1
ORDER BY up.updated_at ASC;

-- Delete user and all related data (GDPR compliance)
-- Usage: Replace $1 with user_id
-- Used in: Account deletion
WITH deleted_data AS (
    DELETE FROM public.user_profiles WHERE id = $1 RETURNING *
)
SELECT 
    'User deleted' as status,
    id,
    full_name,
    created_at
FROM deleted_data;
