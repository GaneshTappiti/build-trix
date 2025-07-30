-- =====================================================
-- MVP STUDIO SPECIFIC QUERIES
-- =====================================================
-- Collection of queries specifically for MVP Studio functionality

-- =====================================================
-- 1. MVP STUDIO SESSION MANAGEMENT
-- =====================================================

-- Save/Update MVP Studio session (auto-save)
-- Usage: Replace $1-$5 with user_id, mvp_id, session_data, current_stage, is_completed
INSERT INTO public.mvp_studio_sessions (
    user_id, mvp_id, session_data, current_stage, is_completed, time_spent_minutes
) VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, mvp_id) 
DO UPDATE SET 
    session_data = EXCLUDED.session_data,
    current_stage = EXCLUDED.current_stage,
    is_completed = EXCLUDED.is_completed,
    time_spent_minutes = EXCLUDED.time_spent_minutes,
    auto_save_count = mvp_studio_sessions.auto_save_count + 1,
    last_saved_at = NOW()
RETURNING *;

-- Get latest session for user (resume functionality)
-- Usage: Replace $1 with user_id
SELECT 
    s.*,
    m.app_name,
    m.status as mvp_status
FROM public.mvp_studio_sessions s
JOIN public.mvps m ON s.mvp_id = m.id
WHERE s.user_id = $1 
ORDER BY s.last_saved_at DESC 
LIMIT 1;

-- Get session for specific MVP
-- Usage: Replace $1 with user_id, $2 with mvp_id
SELECT * FROM public.mvp_studio_sessions 
WHERE user_id = $1 AND mvp_id = $2;

-- Get all sessions for user with MVP details
-- Usage: Replace $1 with user_id
SELECT 
    s.id as session_id,
    s.current_stage,
    s.is_completed,
    s.time_spent_minutes,
    s.last_saved_at,
    m.id as mvp_id,
    m.app_name,
    m.platforms,
    m.style,
    m.status,
    m.completion_stage
FROM public.mvp_studio_sessions s
JOIN public.mvps m ON s.mvp_id = m.id
WHERE s.user_id = $1
ORDER BY s.last_saved_at DESC;

-- Delete session
-- Usage: Replace $1 with user_id, $2 with mvp_id
DELETE FROM public.mvp_studio_sessions 
WHERE user_id = $1 AND mvp_id = $2
RETURNING *;

-- =====================================================
-- 2. MVP STUDIO STAGE PROGRESSION
-- =====================================================

-- Update stage completion
-- Usage: Replace $1-$4 with mvp_id, user_id, new_stage, stage_data
UPDATE public.mvps 
SET 
    completion_stage = GREATEST(completion_stage, $3),
    app_blueprint = CASE WHEN $3 >= 3 THEN COALESCE($4->>'app_blueprint', app_blueprint::text)::jsonb ELSE app_blueprint END,
    screen_prompts = CASE WHEN $3 >= 4 THEN COALESCE($4->>'screen_prompts', screen_prompts::text)::jsonb ELSE screen_prompts END,
    app_flow = CASE WHEN $3 >= 5 THEN COALESCE($4->>'app_flow', app_flow::text)::jsonb ELSE app_flow END,
    export_prompts = CASE WHEN $3 >= 6 THEN COALESCE($4->>'export_prompts', export_prompts::text)::jsonb ELSE export_prompts END,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Get stage completion statistics for user
-- Usage: Replace $1 with user_id
SELECT 
    completion_stage,
    COUNT(*) as projects_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.mvps 
WHERE user_id = $1 AND is_mvp_studio_project = true
GROUP BY completion_stage
ORDER BY completion_stage;

-- Get incomplete MVP Studio projects
-- Usage: Replace $1 with user_id
SELECT 
    id, app_name, completion_stage, platforms, style,
    created_at, updated_at,
    CASE 
        WHEN completion_stage = 1 THEN 'Define app concept'
        WHEN completion_stage = 2 THEN 'Complete validation'
        WHEN completion_stage = 3 THEN 'Generate blueprint'
        WHEN completion_stage = 4 THEN 'Create screen prompts'
        WHEN completion_stage = 5 THEN 'Define app flow'
        WHEN completion_stage = 6 THEN 'Export prompts'
    END as next_step
FROM public.mvps 
WHERE user_id = $1 
    AND is_mvp_studio_project = true 
    AND completion_stage < 6
ORDER BY updated_at DESC;

-- =====================================================
-- 3. MVP STUDIO DATA QUERIES
-- =====================================================

-- Get MVP with full Studio data
-- Usage: Replace $1 with mvp_id, $2 with user_id
SELECT 
    m.*,
    q.idea_validated,
    q.talked_to_people,
    q.motivation,
    q.target_market_research,
    q.competitive_analysis,
    q.technical_feasibility,
    q.validation_notes,
    s.session_data,
    s.time_spent_minutes,
    s.last_saved_at
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
LEFT JOIN public.mvp_studio_sessions s ON m.id = s.mvp_id AND s.user_id = m.user_id
WHERE m.id = $1 AND m.user_id = $2 AND m.is_mvp_studio_project = true;

-- Extract specific data from MVP Studio projects
-- Get all app blueprints for analysis
-- Usage: Replace $1 with user_id
SELECT 
    id, app_name, 
    app_blueprint->'screens' as screens,
    app_blueprint->'userRoles' as user_roles,
    app_blueprint->'dataModels' as data_models,
    app_blueprint->'architecture' as architecture
FROM public.mvps 
WHERE user_id = $1 
    AND is_mvp_studio_project = true 
    AND app_blueprint IS NOT NULL;

-- Get screen prompts summary
-- Usage: Replace $1 with user_id
SELECT 
    id, app_name,
    jsonb_array_length(screen_prompts) as screen_count,
    screen_prompts
FROM public.mvps 
WHERE user_id = $1 
    AND is_mvp_studio_project = true 
    AND screen_prompts IS NOT NULL;

-- Get export data by target tool
-- Usage: Replace $1 with user_id, $2 with target_tool
SELECT 
    id, app_name,
    export_prompts->'targetTool' as target_tool,
    export_prompts->'unifiedPrompt' as unified_prompt,
    export_prompts->'screenByScreenPrompts' as screen_prompts,
    created_at
FROM public.mvps 
WHERE user_id = $1 
    AND is_mvp_studio_project = true 
    AND export_prompts->>'targetTool' = $2;

-- =====================================================
-- 4. QUESTIONNAIRE MANAGEMENT
-- =====================================================

-- Insert/Update questionnaire for MVP Studio
-- Usage: Replace $1-$9 with mvp_id, user_id, and questionnaire data
INSERT INTO public.questionnaire (
    mvp_id, user_id, idea_validated, talked_to_people, motivation,
    target_market_research, competitive_analysis, technical_feasibility,
    validation_notes
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
ON CONFLICT (mvp_id) 
DO UPDATE SET 
    idea_validated = EXCLUDED.idea_validated,
    talked_to_people = EXCLUDED.talked_to_people,
    motivation = EXCLUDED.motivation,
    target_market_research = EXCLUDED.target_market_research,
    competitive_analysis = EXCLUDED.competitive_analysis,
    technical_feasibility = EXCLUDED.technical_feasibility,
    validation_notes = EXCLUDED.validation_notes,
    updated_at = NOW()
RETURNING *;

-- Get questionnaire completion rate for user
-- Usage: Replace $1 with user_id
SELECT 
    COUNT(DISTINCT m.id) as total_mvp_studio_projects,
    COUNT(DISTINCT q.mvp_id) as projects_with_questionnaire,
    ROUND(COUNT(DISTINCT q.mvp_id) * 100.0 / COUNT(DISTINCT m.id), 2) as completion_rate
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
WHERE m.user_id = $1 AND m.is_mvp_studio_project = true;

-- Get validation insights across user's projects
-- Usage: Replace $1 with user_id
SELECT 
    COUNT(*) as total_questionnaires,
    COUNT(*) FILTER (WHERE idea_validated = true) as validated_ideas,
    COUNT(*) FILTER (WHERE talked_to_people = true) as user_research_done,
    COUNT(*) FILTER (WHERE target_market_research = true) as market_research_done,
    COUNT(*) FILTER (WHERE competitive_analysis = true) as competitor_analysis_done,
    COUNT(*) FILTER (WHERE technical_feasibility = true) as feasibility_checked,
    ROUND(AVG(CASE WHEN idea_validated THEN 1 ELSE 0 END) * 100, 2) as validation_rate
FROM public.questionnaire q
JOIN public.mvps m ON q.mvp_id = m.id
WHERE m.user_id = $1 AND m.is_mvp_studio_project = true;

-- =====================================================
-- 5. MVP STUDIO ANALYTICS
-- =====================================================

-- Get time spent analytics
-- Usage: Replace $1 with user_id
SELECT 
    COUNT(*) as total_sessions,
    SUM(time_spent_minutes) as total_time_minutes,
    AVG(time_spent_minutes) as avg_time_per_session,
    COUNT(*) FILTER (WHERE is_completed = true) as completed_sessions,
    ROUND(COUNT(*) FILTER (WHERE is_completed = true) * 100.0 / COUNT(*), 2) as completion_rate
FROM public.mvp_studio_sessions
WHERE user_id = $1;

-- Get stage progression analytics
-- Usage: Replace $1 with user_id
SELECT 
    current_stage,
    COUNT(*) as sessions_count,
    AVG(time_spent_minutes) as avg_time_spent,
    COUNT(*) FILTER (WHERE is_completed = true) as completed_count
FROM public.mvp_studio_sessions
WHERE user_id = $1
GROUP BY current_stage
ORDER BY current_stage;

-- Get most common app characteristics
-- Usage: Replace $1 with user_id
WITH app_data AS (
    SELECT 
        UNNEST(platforms) as platform,
        style,
        jsonb_array_length(COALESCE(app_blueprint->'screens', '[]'::jsonb)) as screen_count,
        CASE WHEN app_blueprint->'userRoles' IS NOT NULL 
             THEN jsonb_array_length(app_blueprint->'userRoles') 
             ELSE 0 END as role_count
    FROM public.mvps 
    WHERE user_id = $1 AND is_mvp_studio_project = true
)
SELECT 
    'platform' as characteristic_type,
    platform as value,
    COUNT(*) as frequency
FROM app_data
GROUP BY platform
UNION ALL
SELECT 
    'style' as characteristic_type,
    style as value,
    COUNT(*) as frequency
FROM app_data
GROUP BY style
ORDER BY characteristic_type, frequency DESC;

-- =====================================================
-- 6. SESSION CLEANUP AND MAINTENANCE
-- =====================================================

-- Clean up old incomplete sessions
-- Usage: Replace $1 with days_old
DELETE FROM public.mvp_studio_sessions 
WHERE last_saved_at < NOW() - INTERVAL $1 || ' days' 
    AND is_completed = false
RETURNING id, user_id, mvp_id;

-- Archive completed sessions older than X days
-- Usage: Replace $1 with days_old (for archiving completed sessions)
UPDATE public.mvp_studio_sessions 
SET session_data = '{}'::jsonb  -- Clear large session data but keep metadata
WHERE last_saved_at < NOW() - INTERVAL $1 || ' days' 
    AND is_completed = true
    AND session_data != '{}'::jsonb
RETURNING id, user_id, mvp_id;

-- Get session storage usage
SELECT 
    user_id,
    COUNT(*) as session_count,
    SUM(pg_column_size(session_data)) as total_storage_bytes,
    AVG(pg_column_size(session_data)) as avg_session_size_bytes
FROM public.mvp_studio_sessions
GROUP BY user_id
ORDER BY total_storage_bytes DESC;

-- =====================================================
-- 7. ADVANCED MVP STUDIO QUERIES
-- =====================================================

-- Get MVP Studio project timeline with milestones
-- Usage: Replace $1 with user_id
SELECT 
    m.id,
    m.app_name,
    m.created_at as project_started,
    q.created_at as validation_completed,
    CASE WHEN m.completion_stage >= 3 THEN m.updated_at END as blueprint_completed,
    CASE WHEN m.completion_stage >= 4 THEN m.updated_at END as prompts_completed,
    CASE WHEN m.completion_stage >= 5 THEN m.updated_at END as flow_completed,
    CASE WHEN m.completion_stage >= 6 THEN m.updated_at END as export_completed,
    s.time_spent_minutes,
    s.is_completed as session_completed
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
LEFT JOIN public.mvp_studio_sessions s ON m.id = s.mvp_id
WHERE m.user_id = $1 AND m.is_mvp_studio_project = true
ORDER BY m.created_at DESC;

-- Compare MVP Studio vs Simple Generator usage
-- Usage: Replace $1 with user_id
SELECT 
    is_mvp_studio_project,
    COUNT(*) as project_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours_to_complete,
    COUNT(*) FILTER (WHERE status = 'Launched') as launched_count,
    ROUND(COUNT(*) FILTER (WHERE status = 'Launched') * 100.0 / COUNT(*), 2) as launch_rate
FROM public.mvps
WHERE user_id = $1
GROUP BY is_mvp_studio_project;
