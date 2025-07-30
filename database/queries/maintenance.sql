-- =====================================================
-- MAINTENANCE AND CLEANUP QUERIES
-- =====================================================
-- Collection of queries for database maintenance, cleanup, and optimization

-- =====================================================
-- 1. DATA CLEANUP OPERATIONS
-- =====================================================

-- Clean up old analytics events (older than 1 year)
-- Usage: Run monthly to maintain performance
DELETE FROM public.analytics_events 
WHERE created_at < NOW() - INTERVAL '1 year'
RETURNING 
    COUNT(*) as deleted_count,
    MIN(created_at) as oldest_deleted,
    MAX(created_at) as newest_deleted;

-- Clean up old incomplete sessions (older than 30 days)
-- Usage: Run weekly to free up storage
DELETE FROM public.mvp_studio_sessions 
WHERE last_saved_at < NOW() - INTERVAL '30 days' 
    AND is_completed = false
RETURNING 
    user_id, 
    mvp_id, 
    last_saved_at,
    pg_size_pretty(pg_column_size(session_data)) as freed_space;

-- Clean up expired rate limits
-- Usage: Run daily to maintain clean rate limit table
DELETE FROM public.rate_limits 
WHERE reset_date < CURRENT_DATE - INTERVAL '7 days'
RETURNING 
    user_id, 
    resource_type, 
    reset_date,
    current_count;

-- Clean up orphaned questionnaire records
-- Usage: Run after MVP deletions to maintain referential integrity
DELETE FROM public.questionnaire 
WHERE mvp_id NOT IN (SELECT id FROM public.mvps)
RETURNING 
    id, 
    mvp_id, 
    user_id;

-- Clean up orphaned export history records
-- Usage: Run after MVP deletions
DELETE FROM public.export_history 
WHERE mvp_id NOT IN (SELECT id FROM public.mvps)
RETURNING 
    id, 
    mvp_id, 
    user_id, 
    export_type;

-- Archive old completed sessions (clear session_data but keep metadata)
-- Usage: Replace $1 with days_old (e.g., 90 for 3 months)
UPDATE public.mvp_studio_sessions 
SET 
    session_data = '{}'::jsonb,
    updated_at = NOW()
WHERE last_saved_at < NOW() - INTERVAL $1 || ' days' 
    AND is_completed = true
    AND session_data != '{}'::jsonb
RETURNING 
    id, 
    user_id, 
    mvp_id, 
    pg_size_pretty(pg_column_size(session_data)) as space_freed;

-- =====================================================
-- 2. DATA INTEGRITY CHECKS
-- =====================================================

-- Check for MVPs without users (should not exist due to FK constraints)
SELECT 
    m.id, 
    m.user_id, 
    m.app_name, 
    m.created_at
FROM public.mvps m
LEFT JOIN auth.users u ON m.user_id = u.id
WHERE u.id IS NULL;

-- Check for user profiles without auth users
SELECT 
    up.id, 
    up.full_name, 
    up.created_at
FROM public.user_profiles up
LEFT JOIN auth.users u ON up.id = u.id
WHERE u.id IS NULL;

-- Check for questionnaires without corresponding MVPs
SELECT 
    q.id, 
    q.mvp_id, 
    q.user_id, 
    q.created_at
FROM public.questionnaire q
LEFT JOIN public.mvps m ON q.mvp_id = m.id
WHERE m.id IS NULL;

-- Check for sessions without corresponding MVPs
SELECT 
    s.id, 
    s.mvp_id, 
    s.user_id, 
    s.last_saved_at
FROM public.mvp_studio_sessions s
LEFT JOIN public.mvps m ON s.mvp_id = m.id
WHERE m.id IS NULL;

-- Check for inconsistent completion stages
SELECT 
    id, 
    app_name, 
    completion_stage,
    CASE 
        WHEN app_blueprint IS NULL AND completion_stage >= 3 THEN 'Missing blueprint for stage ' || completion_stage
        WHEN screen_prompts IS NULL AND completion_stage >= 4 THEN 'Missing screen prompts for stage ' || completion_stage
        WHEN app_flow IS NULL AND completion_stage >= 5 THEN 'Missing app flow for stage ' || completion_stage
        WHEN export_prompts IS NULL AND completion_stage >= 6 THEN 'Missing export prompts for stage ' || completion_stage
        ELSE 'Consistent'
    END as consistency_check
FROM public.mvps 
WHERE is_mvp_studio_project = true
    AND (
        (app_blueprint IS NULL AND completion_stage >= 3) OR
        (screen_prompts IS NULL AND completion_stage >= 4) OR
        (app_flow IS NULL AND completion_stage >= 5) OR
        (export_prompts IS NULL AND completion_stage >= 6)
    );

-- =====================================================
-- 3. PERFORMANCE OPTIMIZATION
-- =====================================================

-- Update table statistics for query optimization
-- Usage: Run after major data changes
ANALYZE public.user_profiles;
ANALYZE public.mvps;
ANALYZE public.questionnaire;
ANALYZE public.mvp_studio_sessions;
ANALYZE public.feedback;
ANALYZE public.analytics_events;
ANALYZE public.rate_limits;
ANALYZE public.export_history;

-- Reindex tables for performance
-- Usage: Run during maintenance windows
REINDEX TABLE public.mvps;
REINDEX TABLE public.analytics_events;
REINDEX TABLE public.mvp_studio_sessions;

-- Vacuum tables to reclaim space
-- Usage: Run after large deletions
VACUUM ANALYZE public.analytics_events;
VACUUM ANALYZE public.mvp_studio_sessions;
VACUUM ANALYZE public.rate_limits;

-- Check table sizes and bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 4. DATA CORRECTION OPERATIONS
-- =====================================================

-- Fix completion stages based on actual data
UPDATE public.mvps 
SET completion_stage = CASE 
    WHEN export_prompts IS NOT NULL THEN 6
    WHEN app_flow IS NOT NULL THEN 5
    WHEN screen_prompts IS NOT NULL THEN 4
    WHEN app_blueprint IS NOT NULL THEN 3
    WHEN EXISTS (SELECT 1 FROM public.questionnaire WHERE mvp_id = mvps.id) THEN 2
    ELSE 1
END
WHERE is_mvp_studio_project = true
RETURNING 
    id, 
    app_name, 
    completion_stage;

-- Update user last login timestamps from analytics
UPDATE public.user_profiles 
SET last_login_at = (
    SELECT MAX(created_at) 
    FROM public.analytics_events 
    WHERE user_id = user_profiles.id
)
WHERE last_login_at IS NULL
    AND EXISTS (
        SELECT 1 FROM public.analytics_events 
        WHERE user_id = user_profiles.id
    )
RETURNING 
    id, 
    full_name, 
    last_login_at;

-- Fix missing user profiles for existing auth users
INSERT INTO public.user_profiles (
    id, 
    full_name, 
    subscription_tier, 
    mvp_limit, 
    onboarding_completed
)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Unknown User'),
    'free',
    3,
    false
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING
RETURNING 
    id, 
    full_name;

-- =====================================================
-- 5. BACKUP AND EXPORT OPERATIONS
-- =====================================================

-- Export user data for GDPR compliance
-- Usage: Replace $1 with user_id
SELECT 
    'user_profile' as data_type,
    row_to_json(up) as data
FROM public.user_profiles up
WHERE up.id = $1

UNION ALL

SELECT 
    'mvps' as data_type,
    jsonb_agg(row_to_json(m)) as data
FROM public.mvps m
WHERE m.user_id = $1

UNION ALL

SELECT 
    'questionnaires' as data_type,
    jsonb_agg(row_to_json(q)) as data
FROM public.questionnaire q
WHERE q.user_id = $1

UNION ALL

SELECT 
    'sessions' as data_type,
    jsonb_agg(row_to_json(s)) as data
FROM public.mvp_studio_sessions s
WHERE s.user_id = $1

UNION ALL

SELECT 
    'exports' as data_type,
    jsonb_agg(row_to_json(eh)) as data
FROM public.export_history eh
WHERE eh.user_id = $1

UNION ALL

SELECT 
    'feedback' as data_type,
    jsonb_agg(row_to_json(f)) as data
FROM public.feedback f
WHERE f.user_id = $1;

-- Create backup of critical data
-- Usage: Run before major updates
CREATE TABLE IF NOT EXISTS backup_mvps_$(date) AS 
SELECT * FROM public.mvps;

CREATE TABLE IF NOT EXISTS backup_user_profiles_$(date) AS 
SELECT * FROM public.user_profiles;

-- =====================================================
-- 6. MONITORING QUERIES
-- =====================================================

-- Database health check
SELECT 
    'Total Users' as metric,
    COUNT(*)::text as value
FROM public.user_profiles

UNION ALL

SELECT 
    'Total MVPs' as metric,
    COUNT(*)::text as value
FROM public.mvps

UNION ALL

SELECT 
    'MVP Studio Projects' as metric,
    COUNT(*)::text as value
FROM public.mvps 
WHERE is_mvp_studio_project = true

UNION ALL

SELECT 
    'Active Sessions (7 days)' as metric,
    COUNT(*)::text as value
FROM public.mvp_studio_sessions 
WHERE last_saved_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    'Analytics Events (30 days)' as metric,
    COUNT(*)::text as value
FROM public.analytics_events 
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value;

-- Check for potential issues
SELECT 
    'Large Session Data' as issue_type,
    COUNT(*) as count,
    'Sessions with >1MB data' as description
FROM public.mvp_studio_sessions 
WHERE pg_column_size(session_data) > 1048576

UNION ALL

SELECT 
    'Old Incomplete Sessions' as issue_type,
    COUNT(*) as count,
    'Sessions >30 days old and incomplete' as description
FROM public.mvp_studio_sessions 
WHERE last_saved_at < NOW() - INTERVAL '30 days' 
    AND is_completed = false

UNION ALL

SELECT 
    'Orphaned Questionnaires' as issue_type,
    COUNT(*) as count,
    'Questionnaires without MVPs' as description
FROM public.questionnaire q
LEFT JOIN public.mvps m ON q.mvp_id = m.id
WHERE m.id IS NULL

UNION ALL

SELECT 
    'Users Without Profiles' as issue_type,
    COUNT(*) as count,
    'Auth users without user profiles' as description
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE up.id IS NULL;

-- =====================================================
-- 7. SCHEDULED MAINTENANCE FUNCTIONS
-- =====================================================

-- Daily maintenance routine
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    deleted_count INTEGER;
BEGIN
    -- Clean expired rate limits
    DELETE FROM public.rate_limits 
    WHERE reset_date < CURRENT_DATE - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Cleaned ' || deleted_count || ' expired rate limits. ';
    
    -- Update table statistics
    ANALYZE public.mvps;
    ANALYZE public.analytics_events;
    result := result || 'Updated table statistics. ';
    
    RETURN result || 'Daily maintenance completed.';
END;
$$ LANGUAGE plpgsql;

-- Weekly maintenance routine
CREATE OR REPLACE FUNCTION weekly_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    deleted_count INTEGER;
BEGIN
    -- Clean old incomplete sessions
    DELETE FROM public.mvp_studio_sessions 
    WHERE last_saved_at < NOW() - INTERVAL '30 days' 
        AND is_completed = false;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Cleaned ' || deleted_count || ' old sessions. ';
    
    -- Clean orphaned records
    DELETE FROM public.questionnaire 
    WHERE mvp_id NOT IN (SELECT id FROM public.mvps);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Cleaned ' || deleted_count || ' orphaned questionnaires. ';
    
    -- Vacuum analyze
    VACUUM ANALYZE public.mvp_studio_sessions;
    result := result || 'Vacuumed session table. ';
    
    RETURN result || 'Weekly maintenance completed.';
END;
$$ LANGUAGE plpgsql;

-- Monthly maintenance routine
CREATE OR REPLACE FUNCTION monthly_maintenance()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    deleted_count INTEGER;
BEGIN
    -- Clean old analytics events
    DELETE FROM public.analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 year';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Cleaned ' || deleted_count || ' old analytics events. ';
    
    -- Archive old session data
    UPDATE public.mvp_studio_sessions 
    SET session_data = '{}'::jsonb
    WHERE last_saved_at < NOW() - INTERVAL '90 days' 
        AND is_completed = true
        AND session_data != '{}'::jsonb;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result := result || 'Archived ' || deleted_count || ' old session data. ';
    
    -- Full vacuum and reindex
    VACUUM ANALYZE;
    result := result || 'Full vacuum completed. ';
    
    RETURN result || 'Monthly maintenance completed.';
END;
$$ LANGUAGE plpgsql;
