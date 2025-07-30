-- =====================================================
-- MVP OPERATIONS QUERIES
-- =====================================================
-- Collection of queries for MVP CRUD operations and management

-- =====================================================
-- 1. MVP CREATION AND UPDATES
-- =====================================================

-- Create new MVP project (Simple Generator)
-- Usage: Replace $1-$8 with actual values
INSERT INTO public.mvps (
    user_id, app_name, platforms, style, style_description, 
    app_description, target_users, generated_prompt, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, 'Yet To Build'
) RETURNING *;

-- Create new MVP Studio project
-- Usage: Replace $1-$14 with actual values
INSERT INTO public.mvps (
    user_id, app_name, platforms, style, style_description, 
    app_description, target_users, generated_prompt, 
    app_blueprint, screen_prompts, app_flow, export_prompts,
    completion_stage, is_mvp_studio_project, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14
) RETURNING *;

-- Update MVP basic information
-- Usage: Replace $1-$8 with mvp_id, user_id, and new values
UPDATE public.mvps 
SET 
    app_name = $3,
    platforms = $4,
    style = $5,
    style_description = $6,
    app_description = $7,
    target_users = $8,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Update MVP Studio data (auto-save)
-- Usage: Replace $1-$8 with mvp_id, user_id, and new data
UPDATE public.mvps 
SET 
    app_blueprint = $3,
    screen_prompts = $4,
    app_flow = $5,
    export_prompts = $6,
    completion_stage = $7,
    generated_prompt = $8,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Update MVP status
-- Usage: Replace $1-$3 with mvp_id, new_status, user_id
UPDATE public.mvps 
SET 
    status = $2,
    updated_at = NOW()
WHERE id = $1 AND user_id = $3
RETURNING *;

-- Update MVP completion stage
-- Usage: Replace $1-$3 with mvp_id, new_stage, user_id
UPDATE public.mvps 
SET 
    completion_stage = $2,
    updated_at = NOW()
WHERE id = $1 AND user_id = $3
RETURNING *;

-- =====================================================
-- 2. MVP RETRIEVAL QUERIES
-- =====================================================

-- Get single MVP with full details
-- Usage: Replace $1 with mvp_id, $2 with user_id
SELECT 
    m.*,
    q.idea_validated,
    q.talked_to_people,
    q.motivation,
    q.target_market_research,
    q.competitive_analysis,
    q.technical_feasibility,
    q.validation_notes
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
WHERE m.id = $1 AND m.user_id = $2;

-- Get user's MVP list with filtering and pagination
-- Usage: Replace $1 with user_id, $2 with status filter (or NULL), $3 with is_mvp_studio filter (or NULL), 
--        $4 with sort_by, $5 with limit, $6 with offset
SELECT 
    id, app_name, platforms, style, style_description,
    app_description, target_users, status, completion_stage,
    is_mvp_studio_project, tags, created_at, updated_at
FROM public.mvps 
WHERE user_id = $1
    AND ($2::text IS NULL OR status = $2)
    AND ($3::boolean IS NULL OR is_mvp_studio_project = $3)
ORDER BY 
    CASE WHEN $4 = 'created_at' THEN created_at END DESC,
    CASE WHEN $4 = 'updated_at' THEN updated_at END DESC,
    CASE WHEN $4 = 'app_name' THEN app_name END ASC,
    CASE WHEN $4 = 'status' THEN status END ASC
LIMIT $5 OFFSET $6;

-- Get MVP count for user (for pagination)
-- Usage: Replace $1 with user_id, $2 with status filter (or NULL), $3 with is_mvp_studio filter (or NULL)
SELECT COUNT(*) as total_count
FROM public.mvps 
WHERE user_id = $1
    AND ($2::text IS NULL OR status = $2)
    AND ($3::boolean IS NULL OR is_mvp_studio_project = $3);

-- Get recent MVPs for dashboard
-- Usage: Replace $1 with user_id, $2 with limit
SELECT 
    id, app_name, status, completion_stage, is_mvp_studio_project,
    platforms, style, created_at, updated_at
FROM public.mvps 
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT $2;

-- Get MVP by ID (public access for shared MVPs)
-- Usage: Replace $1 with mvp_id
SELECT 
    id, app_name, platforms, style, app_description, 
    target_users, status, is_mvp_studio_project, 
    completion_stage, tags, created_at
FROM public.mvps 
WHERE id = $1 AND is_public = true;

-- =====================================================
-- 3. MVP SEARCH AND FILTERING
-- =====================================================

-- Search MVPs by text
-- Usage: Replace $1 with user_id, $2 with search_term
SELECT 
    id, app_name, app_description, target_users, platforms, 
    style, status, is_mvp_studio_project, created_at,
    ts_rank(
        to_tsvector('english', app_name || ' ' || app_description || ' ' || COALESCE(target_users, '')),
        plainto_tsquery('english', $2)
    ) as relevance_score
FROM public.mvps 
WHERE user_id = $1 
    AND (
        to_tsvector('english', app_name || ' ' || app_description || ' ' || COALESCE(target_users, '')) 
        @@ plainto_tsquery('english', $2)
    )
ORDER BY relevance_score DESC, created_at DESC;

-- Advanced filtering with multiple criteria
-- Usage: Replace parameters as needed (use NULL for unused filters)
SELECT * FROM public.mvps 
WHERE user_id = $1
    AND ($2::text IS NULL OR status = $2)
    AND ($3::text[] IS NULL OR platforms && $3)
    AND ($4::text IS NULL OR style = $4)
    AND ($5::boolean IS NULL OR is_mvp_studio_project = $5)
    AND ($6::date IS NULL OR created_at::date >= $6)
    AND ($7::date IS NULL OR created_at::date <= $7)
    AND ($8::text[] IS NULL OR tags && $8)
    AND ($9::integer IS NULL OR completion_stage >= $9)
ORDER BY created_at DESC;

-- Filter MVPs by tags
-- Usage: Replace $1 with user_id, $2 with tag array
SELECT * FROM public.mvps 
WHERE user_id = $1 AND tags && $2
ORDER BY created_at DESC;

-- =====================================================
-- 4. MVP ANALYTICS AND STATISTICS
-- =====================================================

-- Get user's MVP statistics
-- Usage: Replace $1 with user_id
SELECT 
    COUNT(*) as total_mvps,
    COUNT(CASE WHEN status = 'Yet To Build' THEN 1 END) as yet_to_build,
    COUNT(CASE WHEN status = 'Built' THEN 1 END) as built,
    COUNT(CASE WHEN status = 'Launched' THEN 1 END) as launched,
    COUNT(CASE WHEN status = 'Abandoned' THEN 1 END) as abandoned,
    COUNT(CASE WHEN is_mvp_studio_project = true THEN 1 END) as mvp_studio_projects,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_mvps,
    COUNT(CASE WHEN completion_stage = 6 THEN 1 END) as completed_projects,
    AVG(completion_stage) FILTER (WHERE is_mvp_studio_project = true) as avg_completion_stage
FROM public.mvps 
WHERE user_id = $1;

-- Get platform distribution for user
-- Usage: Replace $1 with user_id
SELECT 
    UNNEST(platforms) as platform,
    COUNT(*) as usage_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.mvps 
WHERE user_id = $1
GROUP BY platform
ORDER BY usage_count DESC;

-- Get style preferences for user
-- Usage: Replace $1 with user_id
SELECT 
    style,
    COUNT(*) as usage_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.mvps 
WHERE user_id = $1
GROUP BY style
ORDER BY usage_count DESC;

-- Get MVP creation timeline
-- Usage: Replace $1 with user_id, $2 with days back
SELECT 
    DATE_TRUNC('day', created_at) as creation_date,
    COUNT(*) as mvps_created,
    COUNT(CASE WHEN is_mvp_studio_project = true THEN 1 END) as studio_projects,
    COUNT(CASE WHEN is_mvp_studio_project = false THEN 1 END) as simple_projects
FROM public.mvps 
WHERE user_id = $1 
    AND created_at >= NOW() - INTERVAL $2 || ' days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY creation_date DESC;

-- =====================================================
-- 5. MVP COLLABORATION (FUTURE FEATURE)
-- =====================================================

-- Add collaborator to MVP
-- Usage: Replace $1 with mvp_id, $2 with user_id (owner), $3 with collaborator_id
UPDATE public.mvps 
SET 
    collaborators = array_append(collaborators, $3),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND NOT ($3 = ANY(collaborators))
RETURNING *;

-- Remove collaborator from MVP
-- Usage: Replace $1 with mvp_id, $2 with user_id (owner), $3 with collaborator_id
UPDATE public.mvps 
SET 
    collaborators = array_remove(collaborators, $3),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Get MVPs where user is collaborator
-- Usage: Replace $1 with user_id
SELECT 
    m.*,
    up.full_name as owner_name
FROM public.mvps m
JOIN public.user_profiles up ON m.user_id = up.id
WHERE $1 = ANY(m.collaborators)
ORDER BY m.updated_at DESC;

-- =====================================================
-- 6. MVP DELETION AND CLEANUP
-- =====================================================

-- Soft delete MVP (mark as abandoned)
-- Usage: Replace $1 with mvp_id, $2 with user_id
UPDATE public.mvps 
SET 
    status = 'Abandoned',
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Hard delete MVP (permanent removal)
-- Usage: Replace $1 with mvp_id, $2 with user_id
DELETE FROM public.mvps 
WHERE id = $1 AND user_id = $2
RETURNING id;

-- Bulk delete abandoned MVPs older than X days
-- Usage: Replace $1 with user_id, $2 with days
DELETE FROM public.mvps 
WHERE user_id = $1 
    AND status = 'Abandoned' 
    AND updated_at < NOW() - INTERVAL $2 || ' days'
RETURNING id, app_name;

-- =====================================================
-- 7. MVP EXPORT AND BACKUP
-- =====================================================

-- Export user's complete MVP data
-- Usage: Replace $1 with user_id
SELECT 
    m.*,
    q.idea_validated,
    q.talked_to_people,
    q.motivation,
    q.target_market_research,
    q.competitive_analysis,
    q.technical_feasibility,
    q.validation_notes,
    q.research_links,
    q.competitor_analysis
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
WHERE m.user_id = $1
ORDER BY m.created_at DESC;

-- Get MVP with all related data for backup
-- Usage: Replace $1 with mvp_id, $2 with user_id
SELECT 
    jsonb_build_object(
        'mvp', row_to_json(m),
        'questionnaire', row_to_json(q),
        'sessions', (
            SELECT jsonb_agg(row_to_json(s)) 
            FROM public.mvp_studio_sessions s 
            WHERE s.mvp_id = m.id
        ),
        'exports', (
            SELECT jsonb_agg(row_to_json(e)) 
            FROM public.export_history e 
            WHERE e.mvp_id = m.id
        )
    ) as complete_mvp_data
FROM public.mvps m
LEFT JOIN public.questionnaire q ON m.id = q.mvp_id
WHERE m.id = $1 AND m.user_id = $2;
