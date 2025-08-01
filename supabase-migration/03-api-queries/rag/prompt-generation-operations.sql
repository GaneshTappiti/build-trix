-- =====================================================
-- RAG PROMPT GENERATION OPERATIONS - API QUERIES
-- =====================================================
-- This file contains all SQL queries for RAG prompt generation operations
-- Used by: /api/rag/generate-prompt/* endpoints

-- =====================================================
-- 1. LOG PROMPT GENERATION
-- =====================================================

-- Log RAG prompt generation
-- Usage: Replace parameters with actual values
-- Used in: POST /api/rag/generate-prompt
INSERT INTO public.rag_prompt_generations (
    user_id,
    app_name,
    target_tool,
    stage,
    confidence_score,
    prompt_length,
    generation_time_ms,
    project_complexity,
    technical_experience,
    platforms,
    design_style,
    knowledge_documents_used,
    enhancement_suggestions,
    tool_optimizations_applied,
    original_prompt,
    enhanced_prompt,
    was_successful,
    error_message
) VALUES (
    $1, -- user_id
    $2, -- app_name
    $3, -- target_tool
    $4, -- stage
    $5, -- confidence_score
    $6, -- prompt_length
    $7, -- generation_time_ms
    $8, -- project_complexity
    $9, -- technical_experience
    $10, -- platforms
    $11, -- design_style
    $12, -- knowledge_documents_used (UUID[])
    $13, -- enhancement_suggestions (JSONB)
    $14, -- tool_optimizations_applied (JSONB)
    $15, -- original_prompt
    $16, -- enhanced_prompt
    $17, -- was_successful
    $18  -- error_message
)
RETURNING id, created_at;

-- =====================================================
-- 2. GET PROMPT GENERATIONS
-- =====================================================

-- Get user's prompt generation history
-- Usage: Replace $1 with user_id, $2 with limit, $3 with offset
-- Used in: User prompt history
SELECT 
    id,
    app_name,
    target_tool,
    stage,
    confidence_score,
    prompt_length,
    generation_time_ms,
    project_complexity,
    technical_experience,
    platforms,
    design_style,
    was_successful,
    created_at
FROM public.rag_prompt_generations
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- Get specific prompt generation
-- Usage: Replace $1 with generation_id, $2 with user_id
-- Used in: View specific generation details
SELECT 
    id,
    app_name,
    target_tool,
    stage,
    confidence_score,
    prompt_length,
    generation_time_ms,
    project_complexity,
    technical_experience,
    platforms,
    design_style,
    knowledge_documents_used,
    enhancement_suggestions,
    tool_optimizations_applied,
    original_prompt,
    enhanced_prompt,
    was_successful,
    error_message,
    user_feedback_rating,
    created_at,
    updated_at
FROM public.rag_prompt_generations
WHERE id = $1 AND user_id = $2;

-- Get generations by tool and stage
-- Usage: Replace parameters with actual values
-- Used in: Tool-specific analytics
SELECT 
    id,
    app_name,
    confidence_score,
    prompt_length,
    generation_time_ms,
    was_successful,
    created_at
FROM public.rag_prompt_generations
WHERE user_id = $1
    AND ($2::TEXT IS NULL OR target_tool = $2)
    AND ($3::TEXT IS NULL OR stage = $3)
    AND ($4::TEXT IS NULL OR project_complexity = $4)
ORDER BY created_at DESC
LIMIT $5;

-- =====================================================
-- 3. UPDATE PROMPT GENERATION
-- =====================================================

-- Update user feedback rating
-- Usage: Replace $1 with generation_id, $2 with user_id, $3 with rating
-- Used in: User feedback submission
UPDATE public.rag_prompt_generations
SET 
    user_feedback_rating = $3,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING id, user_feedback_rating, updated_at;

-- Update generation with additional data
-- Usage: Replace parameters with actual values
-- Used in: Post-generation updates
UPDATE public.rag_prompt_generations
SET 
    enhancement_suggestions = COALESCE($3, enhancement_suggestions),
    tool_optimizations_applied = COALESCE($4, tool_optimizations_applied),
    was_successful = COALESCE($5, was_successful),
    error_message = COALESCE($6, error_message),
    updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- =====================================================
-- 4. ANALYTICS QUERIES
-- =====================================================

-- Get generation statistics for user
-- Usage: Replace $1 with user_id
-- Used in: User analytics dashboard
SELECT 
    COUNT(*) as total_generations,
    COUNT(*) FILTER (WHERE was_successful = true) as successful_generations,
    AVG(confidence_score) as avg_confidence_score,
    AVG(prompt_length) as avg_prompt_length,
    AVG(generation_time_ms) as avg_generation_time,
    AVG(user_feedback_rating) FILTER (WHERE user_feedback_rating IS NOT NULL) as avg_user_rating,
    COUNT(DISTINCT target_tool) as tools_used,
    COUNT(DISTINCT stage) as stages_used
FROM public.rag_prompt_generations
WHERE user_id = $1;

-- Get tool usage statistics
-- Usage: Replace $1 with user_id (optional)
-- Used in: Tool popularity analytics
SELECT 
    target_tool,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence,
    AVG(generation_time_ms) as avg_generation_time,
    COUNT(*) FILTER (WHERE was_successful = true) as successful_count,
    AVG(user_feedback_rating) FILTER (WHERE user_feedback_rating IS NOT NULL) as avg_rating
FROM public.rag_prompt_generations
WHERE ($1::UUID IS NULL OR user_id = $1)
GROUP BY target_tool
ORDER BY usage_count DESC;

-- Get stage performance statistics
-- Usage: No parameters needed
-- Used in: Stage effectiveness analysis
SELECT 
    stage,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence,
    AVG(generation_time_ms) as avg_generation_time,
    COUNT(*) FILTER (WHERE was_successful = true) as successful_count
FROM public.rag_prompt_generations
GROUP BY stage
ORDER BY usage_count DESC;

-- Get complexity and experience correlation
-- Usage: No parameters needed
-- Used in: User experience analysis
SELECT 
    project_complexity,
    technical_experience,
    COUNT(*) as generation_count,
    AVG(confidence_score) as avg_confidence,
    AVG(user_feedback_rating) FILTER (WHERE user_feedback_rating IS NOT NULL) as avg_rating
FROM public.rag_prompt_generations
WHERE project_complexity IS NOT NULL AND technical_experience IS NOT NULL
GROUP BY project_complexity, technical_experience
ORDER BY generation_count DESC;

-- =====================================================
-- 5. KNOWLEDGE DOCUMENT USAGE TRACKING
-- =====================================================

-- Get most used knowledge documents
-- Usage: Replace $1 with limit
-- Used in: Knowledge base optimization
SELECT 
    doc_id,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence_when_used
FROM public.rag_prompt_generations,
     unnest(knowledge_documents_used) as doc_id
WHERE knowledge_documents_used IS NOT NULL
GROUP BY doc_id
ORDER BY usage_count DESC
LIMIT $1;

-- Get knowledge document effectiveness
-- Usage: Replace $1 with document_id
-- Used in: Document quality assessment
SELECT 
    COUNT(*) as times_used,
    AVG(confidence_score) as avg_confidence,
    AVG(user_feedback_rating) FILTER (WHERE user_feedback_rating IS NOT NULL) as avg_user_rating,
    COUNT(*) FILTER (WHERE was_successful = true) as successful_generations
FROM public.rag_prompt_generations
WHERE $1 = ANY(knowledge_documents_used);

-- =====================================================
-- 6. PERFORMANCE MONITORING
-- =====================================================

-- Get generation performance trends
-- Usage: Replace $1 with days_back
-- Used in: Performance monitoring
SELECT 
    DATE(created_at) as generation_date,
    COUNT(*) as total_generations,
    AVG(confidence_score) as avg_confidence,
    AVG(generation_time_ms) as avg_generation_time,
    COUNT(*) FILTER (WHERE was_successful = true) as successful_count
FROM public.rag_prompt_generations
WHERE created_at >= NOW() - INTERVAL '1 day' * $1
GROUP BY DATE(created_at)
ORDER BY generation_date DESC;

-- Get slow generations for optimization
-- Usage: Replace $1 with time_threshold_ms, $2 with limit
-- Used in: Performance optimization
SELECT 
    id,
    app_name,
    target_tool,
    stage,
    generation_time_ms,
    prompt_length,
    array_length(knowledge_documents_used, 1) as docs_used_count,
    created_at
FROM public.rag_prompt_generations
WHERE generation_time_ms > $1
ORDER BY generation_time_ms DESC
LIMIT $2;

-- =====================================================
-- 7. ERROR ANALYSIS
-- =====================================================

-- Get failed generations for analysis
-- Usage: Replace $1 with limit
-- Used in: Error analysis and debugging
SELECT 
    id,
    app_name,
    target_tool,
    stage,
    project_complexity,
    technical_experience,
    error_message,
    generation_time_ms,
    created_at
FROM public.rag_prompt_generations
WHERE was_successful = false
ORDER BY created_at DESC
LIMIT $1;

-- Get error patterns
-- Usage: No parameters needed
-- Used in: Error pattern analysis
SELECT 
    target_tool,
    stage,
    COUNT(*) as error_count,
    array_agg(DISTINCT error_message) as error_messages
FROM public.rag_prompt_generations
WHERE was_successful = false
GROUP BY target_tool, stage
ORDER BY error_count DESC;

-- =====================================================
-- 8. USER PREFERENCES ANALYSIS
-- =====================================================

-- Get user's preferred tools and settings
-- Usage: Replace $1 with user_id
-- Used in: Personalization recommendations
SELECT 
    target_tool,
    project_complexity,
    technical_experience,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence,
    AVG(user_feedback_rating) FILTER (WHERE user_feedback_rating IS NOT NULL) as avg_rating
FROM public.rag_prompt_generations
WHERE user_id = $1
GROUP BY target_tool, project_complexity, technical_experience
ORDER BY usage_count DESC, avg_rating DESC NULLS LAST;

-- Get user's platform preferences
-- Usage: Replace $1 with user_id
-- Used in: Platform recommendation
SELECT 
    platform,
    COUNT(*) as usage_count,
    AVG(confidence_score) as avg_confidence
FROM public.rag_prompt_generations,
     unnest(platforms) as platform
WHERE user_id = $1
GROUP BY platform
ORDER BY usage_count DESC;

-- =====================================================
-- 9. CLEANUP OPERATIONS
-- =====================================================

-- Delete old generations (data retention)
-- Usage: Replace $1 with days_to_keep
-- Used in: Data cleanup jobs
DELETE FROM public.rag_prompt_generations
WHERE created_at < NOW() - INTERVAL '1 day' * $1
RETURNING COUNT(*) as deleted_count;

-- Archive old generations to separate table (if needed)
-- Usage: Replace $1 with days_to_keep
-- Used in: Data archiving
WITH archived_data AS (
    DELETE FROM public.rag_prompt_generations
    WHERE created_at < NOW() - INTERVAL '1 day' * $1
    RETURNING *
)
INSERT INTO public.rag_prompt_generations_archive
SELECT * FROM archived_data;
