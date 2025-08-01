import { useState, useEffect } from 'react';
import { RateLimitInfo } from '@/types/mvp';

interface UseRateLimitReturn {
  rateLimitInfo: RateLimitInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRateLimit(): UseRateLimitReturn {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRateLimit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/rate-limit/mvp');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rate limit information');
      }

      setRateLimitInfo(data.rateLimitInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimit();
  }, []);

  return {
    rateLimitInfo,
    isLoading,
    error,
    refetch: fetchRateLimit,
  };
}
