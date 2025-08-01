-- =====================================================
-- USER DASHBOARD VIEWS
-- =====================================================
-- Database views for user dashboard data aggregation

-- =====================================================
-- 1. USER DASHBOARD SUMMARY VIEW
-- =====================================================

CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    up.id as user_id,
    up.full_name,
    up.subscription_tier,
    up.mvp_limit,
    up.export_limit,
    
    -- MVP Statistics
    COUNT(m.id) as total_mvps,
    COUNT(CASE WHEN m.status = 'Yet To Build' THEN 1 END) as yet_to_build,
    COUNT(CASE WHEN m.status = 'Built' THEN 1 END) as built,
    COUNT(CASE WHEN m.status = 'Launched' THEN 1 END) as launched,
    COUNT(CASE WHEN m.status = 'Abandoned' THEN 1 END) as abandoned,
    COUNT(CASE WHEN m.is_mvp_studio_project = true THEN 1 END) as mvp_studio_projects,
    COUNT(CASE WHEN m.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_mvps,
    COUNT(CASE WHEN m.completion_stage = 6 THEN 1 END) as completed_projects,
    
    -- Rate Limit Information
    COALESCE(rl_mvp.current_count, 0) as mvp_usage_current_period,
    COALESCE(rl_export.current_count, 0) as export_usage_current_period,
    (up.mvp_limit - COALESCE(rl_mvp.current_count, 0)) as mvp_remaining,
    (up.export_limit - COALESCE(rl_export.current_count, 0)) as export_remaining,
    
    -- Activity Metrics
    MAX(m.updated_at) as last_mvp_activity,
    up.last_login_at,
    
    -- Platform Distribution (as JSON)
    COALESCE(
        jsonb_object_agg(
            platform_stats.platform, 
            platform_stats.count
        ) FILTER (WHERE platform_stats.platform IS NOT NULL),
        '{}'::jsonb
    ) as platform_distribution

FROM public.user_profiles up
LEFT JOIN public.mvps m ON up.id = m.user_id
LEFT JOIN public.rate_limits rl_mvp ON up.id = rl_mvp.user_id 
    AND rl_mvp.resource_type = 'mvp_generation' 
    AND rl_mvp.reset_date >= CURRENT_DATE
LEFT JOIN public.rate_limits rl_export ON up.id = rl_export.user_id 
    AND rl_export.resource_type = 'export_generation' 
    AND rl_export.reset_date >= CURRENT_DATE
LEFT JOIN LATERAL (
    SELECT 
        UNNEST(m2.platforms) as platform,
        COUNT(*) as count
    FROM public.mvps m2 
    WHERE m2.user_id = up.id
    GROUP BY UNNEST(m2.platforms)
) platform_stats ON true

GROUP BY 
    up.id, up.full_name, up.subscription_tier, up.mvp_limit, up.export_limit,
    up.last_login_at, rl_mvp.current_count, rl_export.current_count;

-- =====================================================
-- 2. USER RECENT ACTIVITY VIEW
-- =====================================================

CREATE OR REPLACE VIEW user_recent_activity AS
SELECT 
    user_id,
    activity_type,
    title,
    description,
    timestamp,
    metadata,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC) as activity_rank
FROM (
    -- MVP Creation Activity
    SELECT 
        m.user_id,
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
    
    UNION ALL
    
    -- MVP Update Activity
    SELECT 
        m.user_id,
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
    WHERE m.updated_at > m.created_at
    
    UNION ALL
    
    -- Export Generation Activity
    SELECT 
        eh.user_id,
        'export_generated' as activity_type,
        'Export Generated' as title,
        'Generated export for ' || m.app_name as description,
        eh.created_at as timestamp,
        jsonb_build_object(
            'export_type', eh.export_type,
            'target_tool', eh.target_tool,
            'mvp_id', eh.mvp_id,
            'mvp_name', m.app_name
        ) as metadata
    FROM public.export_history eh
    JOIN public.mvps m ON eh.mvp_id = m.id
    
    UNION ALL
    
    -- Session Completion Activity
    SELECT 
        s.user_id,
        'session_completed' as activity_type,
        'MVP Studio Session' as title,
        'Completed MVP Studio session for ' || m.app_name as description,
        s.last_saved_at as timestamp,
        jsonb_build_object(
            'session_id', s.id,
            'mvp_id', s.mvp_id,
            'mvp_name', m.app_name,
            'final_stage', s.current_stage,
            'time_spent', s.time_spent_minutes
        ) as metadata
    FROM public.mvp_studio_sessions s
    JOIN public.mvps m ON s.mvp_id = m.id
    WHERE s.is_completed = true
) activities
ORDER BY user_id, timestamp DESC;

-- =====================================================
-- 3. USER MVP PROGRESS VIEW
-- =====================================================

CREATE OR REPLACE VIEW user_mvp_progress AS
SELECT 
    m.user_id,
    m.id as mvp_id,
    m.app_name,
    m.platforms,
    m.style,
    m.status,
    m.completion_stage,
    m.is_mvp_studio_project,
    m.created_at,
    m.updated_at,
    
    -- Progress Indicators
    CASE 
        WHEN m.completion_stage = 1 THEN 'Define app concept and preferences'
        WHEN m.completion_stage = 2 THEN 'Complete validation questionnaire'
        WHEN m.completion_stage = 3 THEN 'Generate app blueprint'
        WHEN m.completion_stage = 4 THEN 'Create screen prompts'
        WHEN m.completion_stage = 5 THEN 'Define navigation flow'
        WHEN m.completion_stage = 6 THEN 'Export implementation prompts'
        ELSE 'Unknown stage'
    END as next_step,
    
    ROUND((m.completion_stage - 1) * 100.0 / 5, 0) as progress_percentage,
    
    -- Validation Status
    q.idea_validated,
    q.talked_to_people,
    q.target_market_research,
    q.competitive_analysis,
    q.technical_feasibility,
    
    -- Session Information
    s.time_spent_minutes,
    s.last_saved_at as last_session_activity,
    s.is_completed as session_completed,
    
    -- Export Information
    COUNT(eh.id) as export_count,
    MAX(eh.created_at) as last_export_date,
    
    -- Time Metrics
    EXTRACT(EPOCH FROM (COALESCE(m.updated_at, m.created_at) - m.created_at)) / 3600 as hours_since_creation,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(s.last_saved_at, m.updated_at))) / 86400 as days_since_last_activity

FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
LEFT JOIN public.mvp_studio_sessions s ON m.id = s.mvp_id
LEFT JOIN public.export_history eh ON m.id = eh.mvp_id
GROUP BY 
    m.user_id, m.id, m.app_name, m.platforms, m.style, m.status, 
    m.completion_stage, m.is_mvp_studio_project, m.created_at, m.updated_at,
    q.idea_validated, q.talked_to_people, q.target_market_research, 
    q.competitive_analysis, q.technical_feasibility,
    s.time_spent_minutes, s.last_saved_at, s.is_completed;

-- =====================================================
-- 4. USER ANALYTICS SUMMARY VIEW
-- =====================================================

CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT 
    up.id as user_id,
    up.full_name,
    up.subscription_tier,
    up.created_at as signup_date,
    
    -- Engagement Metrics
    COUNT(DISTINCT ae.session_id) as total_sessions,
    COUNT(ae.id) as total_events,
    COUNT(DISTINCT DATE_TRUNC('day', ae.created_at)) as active_days,
    MAX(ae.created_at) as last_activity,
    
    -- Event Type Breakdown
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'mvp_created') as mvp_creation_events,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'mvp_stage_completed') as stage_completion_events,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'export_generated') as export_events,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'session_started') as session_start_events,
    
    -- Performance Metrics
    AVG(ae.load_time_ms) FILTER (WHERE ae.load_time_ms IS NOT NULL) as avg_load_time,
    AVG(ae.interaction_time_ms) FILTER (WHERE ae.interaction_time_ms IS NOT NULL) as avg_interaction_time,
    
    -- Recent Activity (30 days)
    COUNT(ae.id) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days') as events_last_30_days,
    COUNT(DISTINCT DATE_TRUNC('day', ae.created_at)) FILTER (WHERE ae.created_at >= NOW() - INTERVAL '30 days') as active_days_last_30_days

FROM public.user_profiles up
LEFT JOIN public.analytics_events ae ON up.id = ae.user_id
GROUP BY up.id, up.full_name, up.subscription_tier, up.created_at;

-- =====================================================
-- 5. USER EXPORT SUMMARY VIEW
-- =====================================================

CREATE OR REPLACE VIEW user_export_summary AS
SELECT 
    eh.user_id,
    COUNT(*) as total_exports,
    COUNT(DISTINCT eh.mvp_id) as unique_mvps_exported,
    SUM(eh.download_count) as total_downloads,
    
    -- Export Type Breakdown
    COUNT(*) FILTER (WHERE eh.export_type = 'unified_prompt') as unified_prompt_exports,
    COUNT(*) FILTER (WHERE eh.export_type = 'screen_prompts') as screen_prompt_exports,
    COUNT(*) FILTER (WHERE eh.export_type = 'full_package') as full_package_exports,
    
    -- Target Tool Breakdown
    COUNT(*) FILTER (WHERE eh.target_tool = 'cursor') as cursor_exports,
    COUNT(*) FILTER (WHERE eh.target_tool = 'v0') as v0_exports,
    COUNT(*) FILTER (WHERE eh.target_tool = 'claude') as claude_exports,
    COUNT(*) FILTER (WHERE eh.target_tool = 'chatgpt') as chatgpt_exports,
    COUNT(*) FILTER (WHERE eh.target_tool = 'bolt') as bolt_exports,
    
    -- Recent Activity
    COUNT(*) FILTER (WHERE eh.created_at >= NOW() - INTERVAL '30 days') as exports_last_30_days,
    MAX(eh.created_at) as last_export_date,
    
    -- File Size Statistics
    AVG(eh.file_size_bytes) as avg_file_size,
    SUM(eh.file_size_bytes) as total_file_size

FROM public.export_history eh
GROUP BY eh.user_id;

-- =====================================================
-- 6. HELPER FUNCTIONS FOR VIEWS
-- =====================================================

-- Function to get user dashboard data efficiently
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE (
    dashboard_summary jsonb,
    recent_activity jsonb,
    mvp_progress jsonb,
    analytics_summary jsonb,
    export_summary jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(uds) as dashboard_summary,
        (
            SELECT jsonb_agg(to_jsonb(ura)) 
            FROM user_recent_activity ura 
            WHERE ura.user_id = p_user_id 
                AND ura.activity_rank <= 10
        ) as recent_activity,
        (
            SELECT jsonb_agg(to_jsonb(ump)) 
            FROM user_mvp_progress ump 
            WHERE ump.user_id = p_user_id
            ORDER BY ump.updated_at DESC
        ) as mvp_progress,
        to_jsonb(uas) as analytics_summary,
        to_jsonb(ues) as export_summary
    FROM user_dashboard_summary uds
    LEFT JOIN user_analytics_summary uas ON uds.user_id = uas.user_id
    LEFT JOIN user_export_summary ues ON uds.user_id = ues.user_id
    WHERE uds.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Get complete dashboard for a user:
-- SELECT * FROM get_user_dashboard_data('user-uuid-here');

-- Get recent activity for a user:
-- SELECT * FROM user_recent_activity WHERE user_id = 'user-uuid-here' AND activity_rank <= 5;

-- Get MVP progress for incomplete projects:
-- SELECT * FROM user_mvp_progress WHERE user_id = 'user-uuid-here' AND completion_stage < 6;

-- Get analytics summary:
-- SELECT * FROM user_analytics_summary WHERE user_id = 'user-uuid-here';
