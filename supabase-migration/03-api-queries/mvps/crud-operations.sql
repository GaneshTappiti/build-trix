-- =====================================================
-- MVP CRUD OPERATIONS - API QUERIES
-- =====================================================
-- This file contains all SQL queries for MVP CRUD operations
-- Used by: /api/mvps/* endpoints

-- =====================================================
-- 1. CREATE MVP
-- =====================================================

-- Create new MVP project
-- Usage: Replace parameters with actual values
-- Used in: POST /api/mvps
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
    tags,
    estimated_hours
) VALUES (
    $1, -- user_id (UUID)
    $2, -- app_name (TEXT)
    $3, -- platforms (TEXT[])
    $4, -- style (TEXT)
    $5, -- style_description (TEXT, optional)
    $6, -- app_description (TEXT)
    $7, -- target_users (TEXT, optional)
    $8, -- generated_prompt (TEXT)
    $9, -- app_blueprint (JSONB, optional)
    $10, -- screen_prompts (JSONB, optional)
    $11, -- app_flow (JSONB, optional)
    $12, -- export_prompts (JSONB, optional)
    COALESCE($13, 'Yet To Build'), -- status (TEXT)
    COALESCE($14, 1), -- completion_stage (INTEGER)
    COALESCE($15, false), -- is_mvp_studio_project (BOOLEAN)
    COALESCE($16, ARRAY[]::TEXT[]), -- tags (TEXT[])
    $17 -- estimated_hours (INTEGER, optional)
)
RETURNING *;

-- =====================================================
-- 2. READ MVP OPERATIONS
-- =====================================================

-- Get MVP by ID (with user ownership check)
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: GET /api/mvps/[id]
SELECT 
    id,
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
    is_public,
    tags,
    estimated_hours,
    actual_hours,
    complexity_score,
    created_at,
    updated_at
FROM public.mvps 
WHERE id = $1 AND user_id = $2;

-- Get public MVP by ID (no user ownership required)
-- Usage: Replace $1 with mvp_id
-- Used in: GET /api/mvps/[id] (public access)
SELECT 
    id,
    app_name,
    platforms,
    style,
    app_description,
    target_users,
    status,
    is_mvp_studio_project,
    completion_stage,
    tags,
    created_at
FROM public.mvps 
WHERE id = $1 AND is_public = true;

-- Get all MVPs for user with filtering and sorting
-- Usage: Replace parameters as needed
-- Used in: GET /api/mvps
SELECT 
    id,
    app_name,
    platforms,
    style,
    app_description,
    target_users,
    status,
    completion_stage,
    is_mvp_studio_project,
    tags,
    created_at,
    updated_at
FROM public.mvps 
WHERE user_id = $1
    AND ($2::TEXT IS NULL OR status = $2) -- status filter
    AND ($3::TEXT[] IS NULL OR platforms && $3) -- platforms filter
    AND ($4::TEXT IS NULL OR style = $4) -- style filter
    AND ($5::TEXT[] IS NULL OR tags && $5) -- tags filter
    AND ($6::BOOLEAN IS NULL OR is_mvp_studio_project = $6) -- studio project filter
ORDER BY 
    CASE WHEN $7 = 'created_at' THEN created_at END DESC,
    CASE WHEN $7 = 'updated_at' THEN updated_at END DESC,
    CASE WHEN $7 = 'app_name' THEN app_name END ASC,
    CASE WHEN $7 = 'status' THEN status END ASC,
    created_at DESC -- default sort
LIMIT COALESCE($8, 50) -- limit
OFFSET COALESCE($9, 0); -- offset

-- Get recent MVPs for dashboard
-- Usage: Replace $1 with user_id, $2 with limit
-- Used in: Dashboard components
SELECT 
    id, 
    app_name, 
    status, 
    completion_stage, 
    is_mvp_studio_project,
    platforms, 
    style, 
    created_at, 
    updated_at
FROM public.mvps 
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT $2;

-- Search MVPs by text
-- Usage: Replace $1 with user_id, $2 with search_term
-- Used in: Search functionality
SELECT 
    id,
    app_name,
    app_description,
    platforms,
    style,
    status,
    completion_stage,
    is_mvp_studio_project,
    tags,
    created_at,
    ts_rank(
        to_tsvector('english', app_name || ' ' || app_description || ' ' || array_to_string(tags, ' ')),
        plainto_tsquery('english', $2)
    ) as rank
FROM public.mvps 
WHERE user_id = $1
    AND (
        to_tsvector('english', app_name || ' ' || app_description || ' ' || array_to_string(tags, ' '))
        @@ plainto_tsquery('english', $2)
    )
ORDER BY rank DESC, updated_at DESC
LIMIT 20;

-- =====================================================
-- 3. UPDATE MVP OPERATIONS
-- =====================================================

-- Update MVP basic information
-- Usage: Replace parameters with actual values
-- Used in: PUT /api/mvps/[id]
UPDATE public.mvps 
SET 
    app_name = COALESCE($3, app_name),
    platforms = COALESCE($4, platforms),
    style = COALESCE($5, style),
    style_description = COALESCE($6, style_description),
    app_description = COALESCE($7, app_description),
    target_users = COALESCE($8, target_users),
    status = COALESCE($9, status),
    tags = COALESCE($10, tags),
    estimated_hours = COALESCE($11, estimated_hours),
    actual_hours = COALESCE($12, actual_hours),
    is_public = COALESCE($13, is_public),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Update MVP Studio data
-- Usage: Replace parameters with actual values
-- Used in: MVP Studio save operations
UPDATE public.mvps 
SET 
    app_blueprint = COALESCE($3, app_blueprint),
    screen_prompts = COALESCE($4, screen_prompts),
    app_flow = COALESCE($5, app_flow),
    export_prompts = COALESCE($6, export_prompts),
    completion_stage = COALESCE($7, completion_stage),
    is_mvp_studio_project = COALESCE($8, is_mvp_studio_project),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- Update MVP status
-- Usage: Replace $1 with mvp_id, $2 with user_id, $3 with new_status
-- Used in: Status change operations
UPDATE public.mvps 
SET 
    status = $3,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, status, updated_at;

-- Update MVP completion stage
-- Usage: Replace $1 with mvp_id, $2 with user_id, $3 with completion_stage
-- Used in: MVP Studio progress tracking
UPDATE public.mvps 
SET 
    completion_stage = $3,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, completion_stage, updated_at;

-- =====================================================
-- 4. DELETE MVP OPERATIONS
-- =====================================================

-- Delete MVP (soft delete by setting status)
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: DELETE /api/mvps/[id] (soft delete)
UPDATE public.mvps 
SET 
    status = 'Abandoned',
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, status;

-- Hard delete MVP
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: DELETE /api/mvps/[id] (hard delete)
DELETE FROM public.mvps 
WHERE id = $1 AND user_id = $2
RETURNING id;

-- =====================================================
-- 5. ANALYTICS QUERIES
-- =====================================================

-- Get MVP statistics for user
-- Usage: Replace $1 with user_id
-- Used in: Dashboard analytics
SELECT 
    COUNT(*) as total_mvps,
    COUNT(*) FILTER (WHERE status = 'Yet To Build') as yet_to_build,
    COUNT(*) FILTER (WHERE status = 'Built') as built,
    COUNT(*) FILTER (WHERE status = 'Launched') as launched,
    COUNT(*) FILTER (WHERE status = 'Abandoned') as abandoned,
    COUNT(*) FILTER (WHERE is_mvp_studio_project = true) as studio_projects,
    AVG(completion_stage) as avg_completion_stage,
    AVG(complexity_score) as avg_complexity
FROM public.mvps 
WHERE user_id = $1;

-- Get platform usage statistics
-- Usage: Replace $1 with user_id
-- Used in: Analytics dashboard
SELECT 
    platform,
    COUNT(*) as usage_count
FROM public.mvps,
     unnest(platforms) as platform
WHERE user_id = $1
GROUP BY platform
ORDER BY usage_count DESC;

-- Get style preferences
-- Usage: Replace $1 with user_id
-- Used in: User preferences
SELECT 
    style,
    COUNT(*) as usage_count
FROM public.mvps 
WHERE user_id = $1
GROUP BY style
ORDER BY usage_count DESC;

-- =====================================================
-- 6. VALIDATION QUERIES
-- =====================================================

-- Check if user owns MVP
-- Usage: Replace $1 with mvp_id, $2 with user_id
-- Used in: Authorization checks
SELECT EXISTS(
    SELECT 1 FROM public.mvps 
    WHERE id = $1 AND user_id = $2
) as owns_mvp;

-- Check if MVP name exists for user
-- Usage: Replace $1 with user_id, $2 with app_name
-- Used in: Duplicate name validation
SELECT EXISTS(
    SELECT 1 FROM public.mvps 
    WHERE user_id = $1 AND LOWER(app_name) = LOWER($2)
) as name_exists;

-- Get MVP count for user (for rate limiting)
-- Usage: Replace $1 with user_id
-- Used in: Rate limiting checks
SELECT COUNT(*) as mvp_count
FROM public.mvps 
WHERE user_id = $1 
    AND created_at >= CURRENT_DATE;

-- =====================================================
-- 7. BULK OPERATIONS
-- =====================================================

-- Bulk update MVP status
-- Usage: Replace $1 with user_id, $2 with mvp_ids array, $3 with new_status
-- Used in: Bulk operations
UPDATE public.mvps 
SET 
    status = $3,
    updated_at = NOW()
WHERE user_id = $1 AND id = ANY($2)
RETURNING id, status;

-- Bulk delete MVPs
-- Usage: Replace $1 with user_id, $2 with mvp_ids array
-- Used in: Bulk delete operations
DELETE FROM public.mvps 
WHERE user_id = $1 AND id = ANY($2)
RETURNING id;
