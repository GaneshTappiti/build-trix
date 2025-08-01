-- =====================================================
-- MVP STUDIO COMPREHENSIVE QUERIES
-- =====================================================
-- All working queries for MVP Studio functionality

-- =====================================================
-- 1. USER MANAGEMENT QUERIES
-- =====================================================

-- Get user profile with MVP statistics
SELECT 
    up.id,
    up.full_name,
    up.avatar_url,
    up.subscription_tier,
    up.mvp_limit,
    COUNT(m.id) as total_mvps,
    COUNT(CASE WHEN m.status = 'Launched' THEN 1 END) as launched_mvps,
    COUNT(CASE WHEN m.is_mvp_studio_project = true THEN 1 END) as mvp_studio_projects,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
WHERE up.id = $1
GROUP BY up.id, up.full_name, up.avatar_url, up.subscription_tier, up.mvp_limit, up.created_at, up.updated_at;

-- Create or update user profile
INSERT INTO public.user_profiles (id, full_name, avatar_url, subscription_tier)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) 
DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    subscription_tier = EXCLUDED.subscription_tier,
    updated_at = NOW();

-- =====================================================
-- 2. MVP STUDIO PROJECT QUERIES
-- =====================================================

-- Create new MVP Studio project
INSERT INTO public.mvps (
    user_id, app_name, platforms, style, style_description, 
    app_description, target_users, generated_prompt, 
    app_blueprint, screen_prompts, app_flow, export_prompts,
    completion_stage, is_mvp_studio_project, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14
) RETURNING *;

-- Update MVP Studio project (for auto-save)
UPDATE public.mvps 
SET 
    app_name = $2,
    platforms = $3,
    style = $4,
    style_description = $5,
    app_description = $6,
    target_users = $7,
    generated_prompt = $8,
    app_blueprint = $9,
    screen_prompts = $10,
    app_flow = $11,
    export_prompts = $12,
    completion_stage = $13,
    status = $14,
    updated_at = NOW()
WHERE id = $1 AND user_id = $15
RETURNING *;

-- Get user's MVP projects with filtering and sorting
SELECT 
    id, app_name, platforms, style, style_description,
    app_description, target_users, status, completion_stage,
    is_mvp_studio_project, created_at, updated_at
FROM public.mvps 
WHERE user_id = $1
    AND ($2::text IS NULL OR status = $2)
    AND ($3::boolean IS NULL OR is_mvp_studio_project = $3)
ORDER BY 
    CASE WHEN $4 = 'created_at' THEN created_at END DESC,
    CASE WHEN $4 = 'updated_at' THEN updated_at END DESC,
    CASE WHEN $4 = 'app_name' THEN app_name END ASC
LIMIT $5 OFFSET $6;

-- Get single MVP project with full details
SELECT 
    m.*,
    q.idea_validated,
    q.talked_to_people,
    q.motivation,
    q.target_market_research,
    q.competitive_analysis,
    q.technical_feasibility
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
WHERE m.id = $1 AND m.user_id = $2;

-- Delete MVP project
DELETE FROM public.mvps 
WHERE id = $1 AND user_id = $2
RETURNING id;

-- Update MVP status
UPDATE public.mvps 
SET status = $2, updated_at = NOW()
WHERE id = $1 AND user_id = $3
RETURNING *;

-- =====================================================
-- 3. QUESTIONNAIRE QUERIES
-- =====================================================

-- Insert questionnaire response
INSERT INTO public.questionnaire (
    mvp_id, user_id, idea_validated, talked_to_people, motivation,
    target_market_research, competitive_analysis, technical_feasibility
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (mvp_id) 
DO UPDATE SET 
    idea_validated = EXCLUDED.idea_validated,
    talked_to_people = EXCLUDED.talked_to_people,
    motivation = EXCLUDED.motivation,
    target_market_research = EXCLUDED.target_market_research,
    competitive_analysis = EXCLUDED.competitive_analysis,
    technical_feasibility = EXCLUDED.technical_feasibility,
    updated_at = NOW()
RETURNING *;

-- Get questionnaire for MVP
SELECT * FROM public.questionnaire 
WHERE mvp_id = $1 AND user_id = $2;

-- =====================================================
-- 4. MVP STUDIO SESSION QUERIES
-- =====================================================

-- Save MVP Studio session (auto-save)
INSERT INTO public.mvp_studio_sessions (
    user_id, mvp_id, session_data, current_stage, is_completed
) VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (user_id, mvp_id) 
DO UPDATE SET 
    session_data = EXCLUDED.session_data,
    current_stage = EXCLUDED.current_stage,
    is_completed = EXCLUDED.is_completed,
    last_saved_at = NOW()
RETURNING *;

-- Get latest session for user
SELECT * FROM public.mvp_studio_sessions 
WHERE user_id = $1 
ORDER BY last_saved_at DESC 
LIMIT 1;

-- Get session for specific MVP
SELECT * FROM public.mvp_studio_sessions 
WHERE user_id = $1 AND mvp_id = $2;

-- Clean up old sessions (older than 30 days)
DELETE FROM public.mvp_studio_sessions 
WHERE last_saved_at < NOW() - INTERVAL '30 days';

-- =====================================================
-- 5. RATE LIMITING QUERIES
-- =====================================================

-- Check current month's MVP generation count
SELECT COUNT(*) as count
FROM public.mvps 
WHERE user_id = $1 
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- Check rate limit for user (30-day sliding window)
SELECT COUNT(*) as count
FROM public.mvps 
WHERE user_id = $1 
    AND created_at >= NOW() - INTERVAL '30 days';

-- Get user's rate limit info
SELECT 
    up.mvp_limit,
    COUNT(m.id) as used_this_month,
    (up.mvp_limit - COUNT(m.id)) as remaining
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id 
    AND m.created_at >= NOW() - INTERVAL '30 days'
WHERE up.id = $1
GROUP BY up.id, up.mvp_limit;

-- Insert/update rate limit tracking
INSERT INTO public.rate_limits (user_id, resource_type, count, reset_date)
VALUES ($1, 'mvp_generation', 1, DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')
ON CONFLICT (user_id, resource_type, reset_date)
DO UPDATE SET 
    count = rate_limits.count + 1,
    updated_at = NOW()
RETURNING *;

-- =====================================================
-- 6. ANALYTICS QUERIES
-- =====================================================

-- Track analytics event
INSERT INTO public.analytics_events (
    user_id, event_type, event_data, session_id, page_url, user_agent
) VALUES ($1, $2, $3, $4, $5, $6);

-- Get user analytics summary
SELECT 
    event_type,
    COUNT(*) as event_count,
    DATE_TRUNC('day', created_at) as event_date
FROM public.analytics_events 
WHERE user_id = $1 
    AND created_at >= $2 
    AND created_at <= $3
GROUP BY event_type, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC;

-- Get platform usage statistics
SELECT 
    UNNEST(platforms) as platform,
    COUNT(*) as usage_count
FROM public.mvps 
WHERE created_at >= $1
GROUP BY platform
ORDER BY usage_count DESC;

-- Get design style preferences
SELECT 
    style,
    COUNT(*) as usage_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.mvps 
WHERE created_at >= $1
GROUP BY style
ORDER BY usage_count DESC;

-- =====================================================
-- 7. DASHBOARD STATISTICS QUERIES
-- =====================================================

-- Get comprehensive user dashboard stats
WITH user_stats AS (
    SELECT 
        COUNT(*) as total_mvps,
        COUNT(CASE WHEN status = 'Yet To Build' THEN 1 END) as yet_to_build,
        COUNT(CASE WHEN status = 'Built' THEN 1 END) as built,
        COUNT(CASE WHEN status = 'Launched' THEN 1 END) as launched,
        COUNT(CASE WHEN status = 'Abandoned' THEN 1 END) as abandoned,
        COUNT(CASE WHEN is_mvp_studio_project = true THEN 1 END) as mvp_studio_projects,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_mvps
    FROM public.mvps 
    WHERE user_id = $1
),
platform_stats AS (
    SELECT 
        UNNEST(platforms) as platform,
        COUNT(*) as count
    FROM public.mvps 
    WHERE user_id = $1
    GROUP BY platform
)
SELECT 
    us.*,
    COALESCE(
        jsonb_object_agg(ps.platform, ps.count) FILTER (WHERE ps.platform IS NOT NULL),
        '{}'::jsonb
    ) as platform_distribution
FROM user_stats us
LEFT JOIN platform_stats ps ON true
GROUP BY us.total_mvps, us.yet_to_build, us.built, us.launched, us.abandoned, us.mvp_studio_projects, us.recent_mvps;

-- Get recent activity for dashboard
SELECT 
    'mvp_created' as activity_type,
    app_name as title,
    'Created new MVP project' as description,
    created_at as timestamp
FROM public.mvps 
WHERE user_id = $1
UNION ALL
SELECT 
    'mvp_updated' as activity_type,
    app_name as title,
    'Updated MVP project' as description,
    updated_at as timestamp
FROM public.mvps 
WHERE user_id = $1 AND updated_at > created_at
ORDER BY timestamp DESC
LIMIT 10;

-- =====================================================
-- 8. FEEDBACK QUERIES
-- =====================================================

-- Submit feedback
INSERT INTO public.feedback (
    user_id, type, title, description, priority, 
    page_url, user_agent, browser_info
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- Get user's feedback history
SELECT * FROM public.feedback 
WHERE user_id = $1 
ORDER BY created_at DESC;

-- Admin: Get all feedback with user info
SELECT 
    f.*,
    up.full_name as user_name,
    up.subscription_tier
FROM public.feedback f
LEFT JOIN public.user_profiles up ON f.user_id = up.id
WHERE ($1::text IS NULL OR f.status = $1)
    AND ($2::text IS NULL OR f.type = $2)
ORDER BY 
    CASE WHEN f.priority = 'critical' THEN 1
         WHEN f.priority = 'high' THEN 2
         WHEN f.priority = 'medium' THEN 3
         ELSE 4 END,
    f.created_at DESC;

-- =====================================================
-- 9. SEARCH AND FILTERING QUERIES
-- =====================================================

-- Search MVPs by name or description
SELECT * FROM public.mvps 
WHERE user_id = $1 
    AND (
        app_name ILIKE '%' || $2 || '%' 
        OR app_description ILIKE '%' || $2 || '%'
        OR target_users ILIKE '%' || $2 || '%'
    )
ORDER BY 
    CASE 
        WHEN app_name ILIKE '%' || $2 || '%' THEN 1
        WHEN app_description ILIKE '%' || $2 || '%' THEN 2
        ELSE 3
    END,
    created_at DESC;

-- Advanced filtering with multiple criteria
SELECT * FROM public.mvps
WHERE user_id = $1
    AND ($2::text IS NULL OR status = $2)
    AND ($3::text[] IS NULL OR platforms && $3)
    AND ($4::text IS NULL OR style = $4)
    AND ($5::boolean IS NULL OR is_mvp_studio_project = $5)
    AND ($6::date IS NULL OR created_at::date >= $6)
    AND ($7::date IS NULL OR created_at::date <= $7)
ORDER BY created_at DESC;

-- =====================================================
-- 10. BACKUP AND EXPORT QUERIES
-- =====================================================

-- Export user's complete MVP data
SELECT
    m.*,
    q.idea_validated,
    q.talked_to_people,
    q.motivation,
    q.target_market_research,
    q.competitive_analysis,
    q.technical_feasibility
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
WHERE m.user_id = $1
ORDER BY m.created_at DESC;

-- Export MVP Studio session data
SELECT
    s.*,
    m.app_name,
    m.status
FROM public.mvp_studio_sessions s
JOIN public.mvps m ON s.mvp_id = m.id
WHERE s.user_id = $1
ORDER BY s.last_saved_at DESC;

-- =====================================================
-- 11. MAINTENANCE AND CLEANUP QUERIES
-- =====================================================

-- Clean up orphaned questionnaire records
DELETE FROM public.questionnaire
WHERE mvp_id NOT IN (SELECT id FROM public.mvps);

-- Clean up old analytics events (older than 1 year)
DELETE FROM public.analytics_events
WHERE created_at < NOW() - INTERVAL '1 year';

-- Clean up expired rate limit records
DELETE FROM public.rate_limits
WHERE reset_date < CURRENT_DATE;

-- Update completion stages based on data presence
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

-- =====================================================
-- 12. REPORTING AND ANALYTICS QUERIES
-- =====================================================

-- Monthly MVP creation report
SELECT
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_mvps,
    COUNT(CASE WHEN is_mvp_studio_project = true THEN 1 END) as mvp_studio_count,
    COUNT(CASE WHEN status = 'Launched' THEN 1 END) as launched_count
FROM public.mvps
WHERE created_at >= $1 AND created_at <= $2
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- User engagement report
SELECT
    u.id as user_id,
    up.full_name,
    up.subscription_tier,
    COUNT(m.id) as total_mvps,
    COUNT(CASE WHEN m.status = 'Launched' THEN 1 END) as launched_mvps,
    MAX(m.created_at) as last_mvp_created,
    COUNT(s.id) as session_count,
    MAX(s.last_saved_at) as last_session
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
LEFT JOIN public.mvps m ON u.id = m.user_id
LEFT JOIN public.mvp_studio_sessions s ON u.id = s.user_id
WHERE u.created_at >= $1
GROUP BY u.id, up.full_name, up.subscription_tier
ORDER BY total_mvps DESC, last_mvp_created DESC;

-- Feature usage analytics
SELECT
    'total_mvps' as metric,
    COUNT(*) as value
FROM public.mvps
UNION ALL
SELECT
    'mvp_studio_projects' as metric,
    COUNT(*) as value
FROM public.mvps WHERE is_mvp_studio_project = true
UNION ALL
SELECT
    'completed_projects' as metric,
    COUNT(*) as value
FROM public.mvps WHERE completion_stage = 6
UNION ALL
SELECT
    'launched_projects' as metric,
    COUNT(*) as value
FROM public.mvps WHERE status = 'Launched';

-- =====================================================
-- 13. PERFORMANCE OPTIMIZATION QUERIES
-- =====================================================

-- Get MVP list with pagination and counts
WITH mvp_data AS (
    SELECT
        id, app_name, platforms, style, status,
        is_mvp_studio_project, completion_stage, created_at, updated_at,
        ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
    FROM public.mvps
    WHERE user_id = $1
),
total_count AS (
    SELECT COUNT(*) as total FROM mvp_data
)
SELECT
    md.*,
    tc.total
FROM mvp_data md
CROSS JOIN total_count tc
WHERE md.row_num BETWEEN $2 AND $3;

-- Efficient dashboard data loading
WITH RECURSIVE user_data AS (
    -- Get basic user info
    SELECT id, full_name, subscription_tier, mvp_limit
    FROM public.user_profiles
    WHERE id = $1
),
mvp_stats AS (
    -- Get MVP statistics
    SELECT
        COUNT(*) as total_mvps,
        COUNT(CASE WHEN status = 'Launched' THEN 1 END) as launched,
        COUNT(CASE WHEN is_mvp_studio_project = true THEN 1 END) as studio_projects,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent
    FROM public.mvps
    WHERE user_id = $1
),
recent_activity AS (
    -- Get recent MVPs
    SELECT app_name, status, created_at, updated_at
    FROM public.mvps
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT 5
)
SELECT
    ud.*,
    ms.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'app_name', ra.app_name,
                'status', ra.status,
                'created_at', ra.created_at,
                'updated_at', ra.updated_at
            )
        ) FILTER (WHERE ra.app_name IS NOT NULL),
        '[]'::jsonb
    ) as recent_mvps
FROM user_data ud
CROSS JOIN mvp_stats ms
LEFT JOIN recent_activity ra ON true
GROUP BY ud.id, ud.full_name, ud.subscription_tier, ud.mvp_limit,
         ms.total_mvps, ms.launched, ms.studio_projects, ms.recent;
