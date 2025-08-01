# Rate Limiting Implementation

## Overview

A comprehensive rate limiting system has been implemented to control MVP generation. Users are limited to 3 MVPs per month, with the limit resetting every 30 days.

## Features Implemented

### 1. Backend Rate Limiting
- **Monthly Rate Limiter**: Uses Upstash Redis to track MVP generation per user per month
- **Configurable Limits**: Currently set to 10 MVPs per 30-day period
- **Sliding Window**: Uses sliding window algorithm for accurate rate limiting
- **Development Mode**: Bypasses rate limiting during development

### 2. API Endpoints

#### Rate Limit Status Endpoint
- **Route**: `GET /api/rate-limit/mvp`
- **Purpose**: Returns current rate limit status for authenticated user
- **Response**: Includes limit, remaining, used count, and reset date

#### Enhanced Generate MVP Endpoint
- **Route**: `POST /api/generate-mvp`
- **Enhancement**: Checks rate limit before MVP creation
- **Error Handling**: Returns 429 status with detailed rate limit info when limit exceeded

### 3. Frontend UI Integration

#### Dashboard Integration
- **Rate Limit Card**: Shows monthly usage progress with visual indicators
- **Stats Integration**: Replaces platform stats when rate limit info is available
- **Color Coding**: Yellow warning when ≤2 remaining, red when limit reached

#### MVP Generator Page
- **Rate Limit Alert**: Prominent warning when approaching or at limit
- **Form Validation**: Disables form submission when limit reached
- **Error Handling**: Shows specific rate limit error messages

#### Your MVPs Page
- **Usage Alert**: Shows rate limit status at top of MVP list
- **Visual Indicators**: Color-coded alerts based on remaining limit

### 4. Type Safety
- **TypeScript Types**: Complete type definitions for rate limit responses
- **Interface Updates**: Enhanced API response types to include rate limit info

## Technical Implementation

### Rate Limiting Logic
```typescript
// Monthly rate limiter using Upstash Redis (only for actual consumption)
export const mvpGenerationLimiter = createRateLimiter(3, '30d');

// Database-based rate limit checking (for UI display)
export async function checkMVPRateLimit(userId: string, supabaseClient: SupabaseClient) {
  // Counts MVPs created in last 30 days from database
  // Does NOT consume rate limit slots
}

// Rate limit consumption (only when actually creating MVP)
export async function consumeMVPRateLimit(userId: string) {
  // Consumes actual rate limit slot from Redis
}
```

### API Integration
```typescript
// FIXED: Two-step rate limiting to prevent consumption on status checks
// Step 1: Check limit without consuming (database-based)
const preCheckResult = await checkMVPRateLimit(user.id, supabase);
if (!preCheckResult.success) {
  return NextResponse.json({ /* limit exceeded error */ }, { status: 429 });
}

// Step 2: Only consume rate limit when actually creating MVP
const rateLimitResult = await consumeMVPRateLimit(user.id);
```

### React Hook
```typescript
// Custom hook for rate limit management
export function useRateLimit(): UseRateLimitReturn {
  // Fetches and manages rate limit state
  // Provides refetch capability for real-time updates
}
```

## User Experience

### Visual Indicators
1. **Green**: Normal usage (3+ MVPs remaining)
2. **Yellow**: Low remaining (1-2 MVPs left)
3. **Red**: Limit reached (0 MVPs remaining)

### User Journey
1. **Normal Usage**: No restrictions, standard MVP creation flow
2. **Approaching Limit**: Warning messages appear across dashboard and forms
3. **Limit Reached**: Form disabled, clear messaging about reset date
4. **Post-Reset**: Automatic restoration of full functionality

### Error Messages
- **Approaching Limit**: "You have X MVPs remaining this month"
- **Limit Reached**: "Monthly MVP generation limit reached. Limit resets on [date]"
- **Form Disabled**: Button shows "Limit Reached" with alert icon

## Bug Fix: Rate Limit Consumption on Page Visits

### Issue
The initial implementation had a critical bug where visiting pages (dashboard, MVP list) would consume rate limit slots because the UI status checks were calling the same function used for MVP creation.

### Root Cause
- `getMVPRateLimit()` function used `ratelimiter.limit()` which both checks AND consumes slots
- UI components called this function to display current status
- Every page visit would decrement the user's monthly limit

### Solution
Separated rate limiting into two distinct functions:

1. **`checkMVPRateLimit()`**: Database-based status checking for UI display
   - Queries `mvps` table directly to count recent creations
   - Does NOT consume any rate limit slots
   - Used by: Dashboard, MVP list, status API endpoint

2. **`consumeMVPRateLimit()`**: Actual rate limit enforcement
   - Uses Upstash Redis rate limiter to consume slots
   - Only called when actually creating an MVP
   - Used by: MVP generation endpoint

### Implementation Details
```typescript
// UI Status Check (Safe - no consumption)
const status = await checkMVPRateLimit(userId, supabase);
// Counts from database: SELECT COUNT(*) FROM mvps WHERE user_id = ? AND created_at > 30_days_ago

// MVP Creation (Consumes rate limit)
const canCreate = await consumeMVPRateLimit(userId);
// Uses Redis rate limiter: ratelimiter.limit(userId)
```

This ensures users can safely browse the application without accidentally consuming their monthly MVP generation allowance.

### Production Bug: 429 Error Despite Available Quota

#### Issue
After fixing the initial bug, some users experienced 429 (rate limit exceeded) errors when trying to generate MVPs, even though the dashboard showed available quota.

#### Root Cause
Redis rate limiter retained consumed slots from when the original bug was active, creating inconsistency between:
- Database count (accurate): Based on actual MVP records
- Redis count (stale): Included page visit consumptions from the bug

#### Solution
Implemented automatic detection and recovery:

1. **Inconsistency Detection**: When Redis fails but database check passes
2. **Automatic Recovery**: Clear stale Redis data and retry
3. **User Fix Button**: Dashboard button to manually clear rate limit data
4. **Graceful Fallback**: Use database count when Redis is inconsistent

#### Implementation
```typescript
// Auto-recovery in MVP generation endpoint
if (!rateLimitResult.success) {
  console.log('Rate limit mismatch detected - clearing stale Redis data');
  await clearMVPRateLimit(user.id);
  const retryResult = await consumeMVPRateLimit(user.id);
  // Continue with MVP creation if retry succeeds
}
```

#### Manual Fix
Users can click "Fix Rate Limit Issue" button on dashboard when limit shows as reached incorrectly.

### Recent Update: Limit Reduced to 3 MVPs

The monthly limit has been reduced from 10 to 3 MVPs per month to provide a more controlled user experience. This change affects:

- **Rate Limiter**: Now enforces 3 MVP generations per 30-day period
- **UI Display**: All counters and progress bars show X/3 format
- **Redis Keys**: Updated to use `3-requests/30d` format
- **Cleanup**: Previous 10-request keys are automatically cleared as "old keys"

The system maintains backward compatibility and will automatically handle the transition from the previous 10-MVP limit.

## Configuration

### Environment Variables
```env
# Upstash Redis credentials (required for production)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Development mode bypasses rate limiting
NODE_ENV=development
```

### Customizable Settings
- **Monthly Limit**: Change `3` in `createRateLimiter(3, '30d')`
- **Time Window**: Change `'30d'` to desired duration
- **Warning Threshold**: Modify `rateLimitInfo.remaining <= 2` conditions

## Security Features

### Rate Limiting Security
- **User Isolation**: Each user has separate rate limit tracking
- **Authenticated Access**: All endpoints require user authentication
- **Tamper Resistance**: Server-side enforcement prevents client manipulation

### Data Protection
- **RLS Policies**: Database row-level security ensures data isolation
- **Input Validation**: All inputs validated before processing
- **Error Sanitization**: Rate limit errors don't expose system internals

## Monitoring & Analytics

### Available Metrics
- **Current Usage**: Real-time tracking via `/api/rate-limit/mvp`
- **Historical Data**: Upstash Redis analytics (if enabled)
- **User Patterns**: Monthly reset cycles and usage distribution

### Dashboard Visibility
- **Admin View**: Rate limit status visible on dashboard
- **User Feedback**: Clear communication of current status
- **Trend Analysis**: Usage patterns over time

## Future Enhancements

### Potential Improvements
1. **Tiered Limits**: Different limits for different user types
2. **Usage Analytics**: Detailed reporting on rate limit patterns
3. **Burst Allowance**: Temporary increases for special cases
4. **Custom Reset Dates**: Per-user or per-plan reset schedules

### Integration Points
- **Payment System**: Upgrade plans for higher limits
- **User Management**: Admin controls for limit adjustments
- **Notifications**: Email alerts when approaching limits

## Testing

### Development Testing
- Rate limiting bypassed in development mode
- Full testing possible without Redis setup
- Easy toggle between development and production behavior

### Production Validation
- Redis-based accurate tracking
- Cross-session persistence
- Proper reset handling

The rate limiting system provides a robust foundation for controlling MVP generation while maintaining excellent user experience and clear communication about usage limits. 