import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { SupabaseClient } from '@supabase/supabase-js';

type Unit = 'ms' | 's' | 'm' | 'h' | 'd';
type Duration = `${number} ${Unit}` | `${number}${Unit}`;

// A function to create a ratelimiter instance with a given configuration
export function createRateLimiter(requests: number, duration: Duration) {
  // During development, we don't want to rate-limit.
  if (process.env.NODE_ENV === 'development') {
    return {
      limit: () => {
        return {
          success: true,
          pending: Promise.resolve(),
          limit: requests,
          remaining: requests,
          reset: Date.now() + 1000,
        };
      },
    };
  }

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, duration),
    analytics: true,
    // Create a unique prefix for each ratelimiter to avoid collisions
    prefix: `@clndr/ratelimit/${requests}-requests/${duration.replace(' ', '')}`,
  });
}

// Monthly MVP generation rate limiter
export const mvpGenerationLimiter = createRateLimiter(3, '30d'); // 3 MVPs per 30 days

// Helper function to get current month key for tracking
export function getCurrentMonthKey(userId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  return `mvp-generation:${userId}:${year}-${month.toString().padStart(2, '0')}`;
}

// Helper function to CHECK rate limit status without consuming (for UI display)
// This queries the database directly to count MVPs created this month
export async function checkMVPRateLimit(userId: string, supabaseClient: SupabaseClient) {
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      limit: 3,
      remaining: 3,
      reset: Date.now() + 1000,
    };
  }

  try {
    const limit = 3; // Match the actual rate limiter limit

    // Get the start of current month (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count MVPs created by this user in the last 30 days
    const { count, error } = await supabaseClient
      .from('mvps')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error counting MVPs for rate limit:', error);
      // Return conservative estimate
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Date.now() + 24 * 60 * 60 * 1000, // Reset in 24 hours
      };
    }

    const used = count || 0;
    const remaining = Math.max(0, limit - used);

    // Calculate when the oldest MVP will be 30 days old (when limit resets)
    const now = new Date();
    const resetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    return {
      success: remaining > 0,
      limit,
      remaining,
      reset: resetDate.getTime(),
    };
  } catch (error) {
    console.error('Error checking MVP rate limit:', error);
    // Return safe fallback values
    return {
      success: true,
      limit: 3,
      remaining: 3,
      reset: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
  }
}

// Helper function to CONSUME rate limit for MVP generation
export async function consumeMVPRateLimit(userId: string) {
  const identifier = getCurrentMonthKey(userId);
  return await mvpGenerationLimiter.limit(identifier);
}

// Helper function to clear Redis rate limit data (for debugging/fixing inconsistencies)
export async function clearMVPRateLimit(userId: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Rate limit clear skipped');
    return { success: true };
  }

  try {
    const redis = Redis.fromEnv();
    const identifier = getCurrentMonthKey(userId);

    // Clear the current rate limit key
    const rateLimitKey = `@clndr/ratelimit/3-requests/30d:${identifier}`;
    await redis.del(rateLimitKey);

    // Also clear any old keys with different limits that might exist
    const oldKeys = [`@clndr/ratelimit/10-requests/30d:${identifier}`, `@clndr/ratelimit/5-requests/30d:${identifier}`];

    for (const key of oldKeys) {
      await redis.del(key);
    }

    console.log(`Cleared rate limit data for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error clearing rate limit:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
