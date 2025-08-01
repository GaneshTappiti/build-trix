-- =====================================================
-- MVP STUDIO SAVE OPERATIONS - API QUERIES
-- =====================================================
-- This file contains all SQL queries for MVP Studio save operations
-- Used by: /api/mvp-studio/* endpoints

-- =====================================================
-- 1. SAVE MVP STUDIO PROJECT
-- =====================================================

-- Save complete MVP Studio project
-- Usage: Replace parameters with actual values
-- Used in: POST /api/mvp-studio/save
WITH mvp_insert AS (
    INSERT INTO public.mvps (
        user_id,
        app_name,
        platforms,
        style,
        style_description,
        app_description,
        target_users,
        generated_prompt,
        app_blueprint,
        screen_prompts,
        app_flow,
        export_prompts,
        status,
        completion_stage,
        is_mvp_studio_project,
        tags
    ) VALUES (
        $1, -- user_id
        $2, -- app_name
        $3, -- platforms
        $4, -- style
        $5, -- style_description
        $6, -- app_description
        $7, -- target_users
        $8, -- generated_prompt
        $9, -- app_blueprint
        $10, -- screen_prompts
        $11, -- app_flow
        $12, -- export_prompts
        COALESCE($13, 'Yet To Build'), -- status
        COALESCE($14, 6), -- completion_stage (6 for complete)
        true, -- is_mvp_studio_project
        COALESCE($15, ARRAY[]::TEXT[]) -- tags
    )
    RETURNING *
),
questionnaire_insert AS (
    INSERT INTO public.questionnaire (
        mvp_id,
        user_id,
        idea_validated,
        talked_to_people,
        motivation,
        preferred_ai_tool,
        project_complexity,
        technical_experience
    )
    SELECT 
        mvp_insert.id,
        mvp_insert.user_id,
        $16, -- idea_validated
        $17, -- talked_to_people
        $18, -- motivation
        $19, -- preferred_ai_tool
        $20, -- project_complexity
        $21  -- technical_experience
    FROM mvp_insert
    RETURNING *
)
SELECT 
    mvp_insert.*,
    questionnaire_insert.id as questionnaire_id
FROM mvp_insert, questionnaire_insert;

-- =====================================================
-- 2. UPDATE MVP STUDIO PROJECT
-- =====================================================

-- Update existing MVP Studio project
-- Usage: Replace parameters with actual values
-- Used in: PUT /api/mvp-studio/save
UPDATE public.mvps 
SET 
    app_name = COALESCE($3, app_name),
    platforms = COALESCE($4, platforms),
    style = COALESCE($5, style),
    style_description = COALESCE($6, style_description),
    app_description = COALESCE($7, app_description),
    target_users = COALESCE($8, target_users),
    generated_prompt = COALESCE($9, generated_prompt),
    app_blueprint = COALESCE($10, app_blueprint),
    screen_prompts = COALESCE($11, screen_prompts),
    app_flow = COALESCE($12, app_flow),
    export_prompts = COALESCE($13, export_prompts),
    completion_stage = COALESCE($14, completion_stage),
    tags = COALESCE($15, tags),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- =====================================================
-- 3. SAVE SESSION DATA
-- =====================================================

-- Save or update MVP Studio session
-- Usage: Replace parameters with actual values
-- Used in: Auto-save functionality
INSERT INTO public.mvp_studio_sessions (
    user_id,
    mvp_id,
    session_data,
    current_stage,
    stages_completed,
    time_spent_minutes
) VALUES (
    $1, -- user_id
    $2, -- mvp_id (optional)
    $3, -- session_data (JSONB)
    $4, -- current_stage
    $5, -- stages_completed (INTEGER[])
    $6  -- time_spent_minutes
)
ON CONFLICT (user_id, COALESCE(mvp_id, '00000000-0000-0000-0000-000000000000'::UUID))
DO UPDATE SET
    session_data = EXCLUDED.session_data,
    current_stage = EXCLUDED.current_stage,
    stages_completed = EXCLUDED.stages_completed,
    time_spent_minutes = EXCLUDED.time_spent_minutes,
    last_saved_at = NOW()
RETURNING *;

-- =====================================================
-- 4. LOAD SESSION DATA
-- =====================================================

-- Load latest session for user
-- Usage: Replace $1 with user_id
-- Used in: Session restoration
SELECT 
    id,
    mvp_id,
    session_data,
    current_stage,
    stages_completed,
    time_spent_minutes,
    is_completed,
    last_saved_at,
    created_at
FROM public.mvp_studio_sessions
WHERE user_id = $1
ORDER BY last_saved_at DESC
LIMIT 1;

-- Load session for specific MVP
-- Usage: Replace $1 with user_id, $2 with mvp_id
-- Used in: Resume specific project
SELECT 
    id,
    session_data,
    current_stage,
    stages_completed,
    time_spent_minutes,
    is_completed,
    last_saved_at
FROM public.mvp_studio_sessions
WHERE user_id = $1 AND mvp_id = $2
ORDER BY last_saved_at DESC
LIMIT 1;

-- =====================================================
-- 5. STAGE COMPLETION TRACKING
-- =====================================================

-- Update stage completion
-- Usage: Replace parameters with actual values
-- Used in: Stage progression tracking
UPDATE public.mvp_studio_sessions
SET 
    current_stage = $3,
    stages_completed = array_append(
        COALESCE(stages_completed, ARRAY[]::INTEGER[]), 
        $4
    ),
    session_data = $5,
    last_saved_at = NOW()
WHERE user_id = $1 AND mvp_id = $2
RETURNING *;

-- Mark session as completed
-- Usage: Replace $1 with user_id, $2 with mvp_id
-- Used in: Project completion
UPDATE public.mvp_studio_sessions
SET 
    is_completed = true,
    current_stage = 6,
    last_saved_at = NOW()
WHERE user_id = $1 AND mvp_id = $2
RETURNING *;

-- =====================================================
-- 6. QUESTIONNAIRE OPERATIONS
-- =====================================================

-- Save questionnaire responses
-- Usage: Replace parameters with actual values
-- Used in: Questionnaire submission
INSERT INTO public.questionnaire (
    mvp_id,
    user_id,
    idea_validated,
    talked_to_people,
    motivation,
    target_market_research,
    competitive_analysis,
    technical_feasibility,
    preferred_ai_tool,
    project_complexity,
    technical_experience,
    timeline_weeks,
    budget_range,
    team_size
) VALUES (
    $1, -- mvp_id
    $2, -- user_id
    $3, -- idea_validated
    $4, -- talked_to_people
    $5, -- motivation
    $6, -- target_market_research
    $7, -- competitive_analysis
    $8, -- technical_feasibility
    $9, -- preferred_ai_tool
    $10, -- project_complexity
    $11, -- technical_experience
    $12, -- timeline_weeks
    $13, -- budget_range
    $14  -- team_size
)
ON CONFLICT (mvp_id, user_id)
DO UPDATE SET
    idea_validated = EXCLUDED.idea_validated,
    talked_to_people = EXCLUDED.talked_to_people,
    motivation = EXCLUDED.motivation,
    target_market_research = EXCLUDED.target_market_research,
    competitive_analysis = EXCLUDED.competitive_analysis,
    technical_feasibility = EXCLUDED.technical_feasibility,
    preferred_ai_tool = EXCLUDED.preferred_ai_tool,
    project_complexity = EXCLUDED.project_complexity,
    technical_experience = EXCLUDED.technical_experience,
    timeline_weeks = EXCLUDED.timeline_weeks,
    budget_range = EXCLUDED.budget_range,
    team_size = EXCLUDED.team_size,
    updated_at = NOW()
RETURNING *;

-- Get questionnaire for MVP
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: Loading questionnaire data
SELECT 
    id,
    idea_validated,
    talked_to_people,
    motivation,
    target_market_research,
    competitive_analysis,
    technical_feasibility,
    preferred_ai_tool,
    project_complexity,
    technical_experience,
    timeline_weeks,
    budget_range,
    team_size,
    created_at,
    updated_at
FROM public.questionnaire
WHERE mvp_id = $1 AND user_id = $2;

-- =====================================================
-- 7. EXPORT OPERATIONS
-- =====================================================

-- Save export record
-- Usage: Replace parameters with actual values
-- Used in: Export generation tracking
INSERT INTO public.export_history (
    user_id,
    mvp_id,
    export_type,
    target_tool,
    export_format,
    export_content,
    export_size_bytes,
    generation_time_ms,
    was_successful,
    error_message
) VALUES (
    $1, -- user_id
    $2, -- mvp_id
    $3, -- export_type
    $4, -- target_tool
    $5, -- export_format
    $6, -- export_content
    $7, -- export_size_bytes
    $8, -- generation_time_ms
    $9, -- was_successful
    $10 -- error_message
)
RETURNING *;

-- Get export history for MVP
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: Export history display
SELECT 
    id,
    export_type,
    target_tool,
    export_format,
    export_size_bytes,
    generation_time_ms,
    was_successful,
    error_message,
    created_at
FROM public.export_history
WHERE mvp_id = $1 AND user_id = $2
ORDER BY created_at DESC;

-- =====================================================
-- 8. VALIDATION QUERIES
-- =====================================================

-- Check if MVP Studio project exists
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: Validation before operations
SELECT EXISTS(
    SELECT 1 FROM public.mvps 
    WHERE id = $1 
        AND user_id = $2 
        AND is_mvp_studio_project = true
) as exists;

-- Get MVP Studio project with all related data
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: Complete project loading
SELECT 
    m.*,
    q.idea_validated,
    q.talked_to_people,
    q.motivation,
    q.preferred_ai_tool,
    q.project_complexity,
    q.technical_experience,
    s.session_data,
    s.current_stage,
    s.stages_completed,
    s.time_spent_minutes,
    s.is_completed as session_completed
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
LEFT JOIN public.mvp_studio_sessions s ON m.id = s.mvp_id
WHERE m.id = $1 AND m.user_id = $2;

-- =====================================================
-- 9. ANALYTICS QUERIES
-- =====================================================

-- Get completion statistics
-- Usage: Replace $1 with user_id
-- Used in: Progress analytics
SELECT 
    COUNT(*) as total_studio_projects,
    COUNT(*) FILTER (WHERE completion_stage = 6) as completed_projects,
    AVG(completion_stage) as avg_completion_stage,
    COUNT(*) FILTER (WHERE s.is_completed = true) as completed_sessions
FROM public.mvps m
LEFT JOIN public.mvp_studio_sessions s ON m.id = s.mvp_id
WHERE m.user_id = $1 AND m.is_mvp_studio_project = true;

-- Get time spent statistics
-- Usage: Replace $1 with user_id
-- Used in: Time tracking analytics
SELECT 
    AVG(time_spent_minutes) as avg_time_spent,
    SUM(time_spent_minutes) as total_time_spent,
    MAX(time_spent_minutes) as max_time_spent
FROM public.mvp_studio_sessions
WHERE user_id = $1;
