-- =====================================================
-- ANALYTICS AND REPORTING QUERIES
-- =====================================================
-- Collection of queries for analytics, reporting, and insights

-- =====================================================
-- 1. USER ANALYTICS
-- =====================================================

-- User engagement metrics
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    DATE_TRUNC('day', ae.created_at) as date,
    COUNT(DISTINCT ae.user_id) as active_users,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE ae.event_type = 'mvp_created') as mvps_created,
    COUNT(*) FILTER (WHERE ae.event_type = 'mvp_stage_completed') as stages_completed,
    COUNT(*) FILTER (WHERE ae.event_type = 'export_generated') as exports_generated,
    COUNT(*) FILTER (WHERE ae.event_type = 'session_started') as sessions_started
FROM public.analytics_events ae
WHERE ae.created_at >= $1 AND ae.created_at <= $2
GROUP BY DATE_TRUNC('day', ae.created_at)
ORDER BY date DESC;

-- User retention analysis
-- Usage: Replace $1 with cohort_start_date, $2 with analysis_end_date
WITH user_cohorts AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', created_at) as cohort_month
    FROM public.user_profiles
    WHERE created_at >= $1
),
user_activity AS (
    SELECT 
        ae.user_id,
        DATE_TRUNC('month', ae.created_at) as activity_month
    FROM public.analytics_events ae
    WHERE ae.created_at <= $2
    GROUP BY ae.user_id, DATE_TRUNC('month', ae.created_at)
)
SELECT 
    uc.cohort_month,
    COUNT(DISTINCT uc.user_id) as cohort_size,
    COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.activity_month = uc.cohort_month) as month_0,
    COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.activity_month = uc.cohort_month + INTERVAL '1 month') as month_1,
    COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.activity_month = uc.cohort_month + INTERVAL '2 months') as month_2,
    COUNT(DISTINCT ua.user_id) FILTER (WHERE ua.activity_month = uc.cohort_month + INTERVAL '3 months') as month_3
FROM user_cohorts uc
LEFT JOIN user_activity ua ON uc.user_id = ua.user_id
GROUP BY uc.cohort_month
ORDER BY uc.cohort_month;

-- Most active users
-- Usage: Replace $1 with start_date, $2 with end_date, $3 with limit
SELECT 
    ae.user_id,
    up.full_name,
    up.subscription_tier,
    COUNT(*) as total_events,
    COUNT(DISTINCT DATE_TRUNC('day', ae.created_at)) as active_days,
    COUNT(*) FILTER (WHERE ae.event_type = 'mvp_created') as mvps_created,
    COUNT(*) FILTER (WHERE ae.event_type = 'export_generated') as exports_generated,
    MAX(ae.created_at) as last_activity
FROM public.analytics_events ae
JOIN public.user_profiles up ON ae.user_id = up.id
WHERE ae.created_at >= $1 AND ae.created_at <= $2
GROUP BY ae.user_id, up.full_name, up.subscription_tier
ORDER BY total_events DESC
LIMIT $3;

-- =====================================================
-- 2. MVP ANALYTICS
-- =====================================================

-- MVP creation trends
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_mvps,
    COUNT(*) FILTER (WHERE is_mvp_studio_project = true) as mvp_studio_count,
    COUNT(*) FILTER (WHERE is_mvp_studio_project = false) as simple_generator_count,
    COUNT(DISTINCT user_id) as unique_creators
FROM public.mvps
WHERE created_at >= $1 AND created_at <= $2
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Platform popularity analysis
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    UNNEST(platforms) as platform,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    COUNT(*) FILTER (WHERE status = 'Launched') as launched_count,
    ROUND(COUNT(*) FILTER (WHERE status = 'Launched') * 100.0 / COUNT(*), 2) as launch_rate
FROM public.mvps
WHERE created_at >= $1 AND created_at <= $2
GROUP BY platform
ORDER BY usage_count DESC;

-- Design style preferences
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    style,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(completion_stage) FILTER (WHERE is_mvp_studio_project = true) as avg_completion_stage
FROM public.mvps
WHERE created_at >= $1 AND created_at <= $2
GROUP BY style
ORDER BY usage_count DESC;

-- MVP success metrics
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400) as avg_days_to_status
FROM public.mvps
WHERE created_at >= $1 AND created_at <= $2
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- 3. MVP STUDIO SPECIFIC ANALYTICS
-- =====================================================

-- Stage completion funnel
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    completion_stage,
    COUNT(*) as projects_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    LAG(COUNT(*)) OVER (ORDER BY completion_stage) as previous_stage_count,
    CASE 
        WHEN LAG(COUNT(*)) OVER (ORDER BY completion_stage) IS NOT NULL 
        THEN ROUND(COUNT(*) * 100.0 / LAG(COUNT(*)) OVER (ORDER BY completion_stage), 2)
        ELSE 100.0
    END as conversion_rate
FROM public.mvps
WHERE is_mvp_studio_project = true 
    AND created_at >= $1 AND created_at <= $2
GROUP BY completion_stage
ORDER BY completion_stage;

-- Session completion analysis
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    current_stage,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_completed = true) as completed_sessions,
    ROUND(COUNT(*) FILTER (WHERE is_completed = true) * 100.0 / COUNT(*), 2) as completion_rate,
    AVG(time_spent_minutes) as avg_time_spent,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_spent_minutes) as median_time_spent
FROM public.mvp_studio_sessions
WHERE created_at >= $1 AND created_at <= $2
GROUP BY current_stage
ORDER BY current_stage;

-- Time to completion analysis
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    completion_stage,
    COUNT(*) as projects_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours_to_complete,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as median_hours,
    MIN(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as min_hours,
    MAX(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as max_hours
FROM public.mvps
WHERE is_mvp_studio_project = true 
    AND completion_stage > 1
    AND created_at >= $1 AND created_at <= $2
GROUP BY completion_stage
ORDER BY completion_stage;

-- =====================================================
-- 4. EXPORT ANALYTICS
-- =====================================================

-- Export generation trends
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as total_exports,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT mvp_id) as unique_mvps,
    SUM(download_count) as total_downloads
FROM public.export_history
WHERE created_at >= $1 AND created_at <= $2
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Target tool popularity
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    target_tool,
    COUNT(*) as export_count,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(download_count) as total_downloads,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(file_size_bytes) as avg_file_size
FROM public.export_history
WHERE created_at >= $1 AND created_at <= $2
GROUP BY target_tool
ORDER BY export_count DESC;

-- Export type analysis
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    export_type,
    COUNT(*) as export_count,
    SUM(download_count) as total_downloads,
    ROUND(AVG(download_count), 2) as avg_downloads_per_export,
    AVG(file_size_bytes) as avg_file_size
FROM public.export_history
WHERE created_at >= $1 AND created_at <= $2
GROUP BY export_type
ORDER BY export_count DESC;

-- =====================================================
-- 5. SUBSCRIPTION AND REVENUE ANALYTICS
-- =====================================================

-- Subscription tier distribution
SELECT 
    subscription_tier,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) as avg_days_since_signup,
    COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days') as active_last_30_days
FROM public.user_profiles
GROUP BY subscription_tier
ORDER BY 
    CASE subscription_tier 
        WHEN 'enterprise' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'free' THEN 3 
    END;

-- Usage by subscription tier
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    up.subscription_tier,
    COUNT(DISTINCT m.user_id) as active_users,
    COUNT(m.id) as total_mvps,
    ROUND(AVG(m.completion_stage) FILTER (WHERE m.is_mvp_studio_project = true), 2) as avg_completion_stage,
    COUNT(eh.id) as total_exports,
    SUM(eh.download_count) as total_downloads
FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id AND m.created_at >= $1 AND m.created_at <= $2
LEFT JOIN public.export_history eh ON up.id = eh.user_id AND eh.created_at >= $1 AND eh.created_at <= $2
GROUP BY up.subscription_tier
ORDER BY 
    CASE up.subscription_tier 
        WHEN 'enterprise' THEN 1 
        WHEN 'pro' THEN 2 
        WHEN 'free' THEN 3 
    END;

-- =====================================================
-- 6. PERFORMANCE ANALYTICS
-- =====================================================

-- Page load performance
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    event_category,
    COUNT(*) as total_events,
    AVG(load_time_ms) as avg_load_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY load_time_ms) as median_load_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time_ms) as p95_load_time,
    COUNT(*) FILTER (WHERE load_time_ms > 3000) as slow_loads
FROM public.analytics_events
WHERE created_at >= $1 AND created_at <= $2
    AND load_time_ms IS NOT NULL
GROUP BY event_category
ORDER BY avg_load_time DESC;

-- User interaction times
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    event_type,
    COUNT(*) as total_events,
    AVG(interaction_time_ms) as avg_interaction_time,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY interaction_time_ms) as median_interaction_time,
    COUNT(*) FILTER (WHERE interaction_time_ms > 10000) as long_interactions
FROM public.analytics_events
WHERE created_at >= $1 AND created_at <= $2
    AND interaction_time_ms IS NOT NULL
GROUP BY event_type
ORDER BY avg_interaction_time DESC;

-- =====================================================
-- 7. FEEDBACK ANALYTICS
-- =====================================================

-- Feedback trends and sentiment
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as total_feedback,
    COUNT(*) FILTER (WHERE type = 'bug') as bugs,
    COUNT(*) FILTER (WHERE type = 'feature') as feature_requests,
    COUNT(*) FILTER (WHERE type = 'improvement') as improvements,
    COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'critical') as high_priority,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    AVG(user_rating) FILTER (WHERE user_rating IS NOT NULL) as avg_rating
FROM public.feedback
WHERE created_at >= $1 AND created_at <= $2
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;

-- Feedback by category
-- Usage: Replace $1 with start_date, $2 with end_date
SELECT 
    category,
    type,
    COUNT(*) as feedback_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    ROUND(COUNT(*) FILTER (WHERE status = 'resolved') * 100.0 / COUNT(*), 2) as resolution_rate,
    AVG(user_rating) FILTER (WHERE user_rating IS NOT NULL) as avg_rating
FROM public.feedback
WHERE created_at >= $1 AND created_at <= $2
    AND category IS NOT NULL
GROUP BY category, type
ORDER BY feedback_count DESC;
