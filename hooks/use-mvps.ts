'use client';

import { useState, useEffect } from 'react';
import { MVP, MVPListResponse, MVPResponse } from '@/types/mvp';

interface UseMVPsOptions {
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

interface UseMVPsReturn {
  mvps: MVP[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMVPs(options: UseMVPsOptions = {}): UseMVPsReturn {
  const [mvps, setMvps] = useState<MVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMVPs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (options.status) searchParams.append('status', options.status);
      if (options.sortBy) searchParams.append('sortBy', options.sortBy);
      if (options.sortOrder) searchParams.append('sortOrder', options.sortOrder);
      if (options.limit) searchParams.append('limit', options.limit.toString());

      const response = await fetch(`/api/mvps?${searchParams}`);
      const data: MVPListResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch MVPs');
      }

      setMvps(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMVPs();
  }, [options.status, options.sortBy, options.sortOrder, options.limit]);

  return {
    mvps,
    isLoading,
    error,
    refetch: fetchMVPs,
  };
}

interface UseMVPReturn {
  mvp: MVP | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMVP(id: string): UseMVPReturn {
  const [mvp, setMvp] = useState<MVP | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMVP = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/mvps/${id}`);
      const data: MVPResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch MVP');
      }

      setMvp(data.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMVP();
  }, [id]);

  return {
    mvp,
    isLoading,
    error,
    refetch: fetchMVP,
  };
}

// Utility functions for MVP operations
export async function createMVP(mvpData: Omit<MVP, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const response = await fetch('/api/mvps', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mvpData),
  });

  const data: MVPListResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create MVP');
  }

  return data.data?.[0];
}

export async function updateMVP(id: string, mvpData: Partial<MVP>) {
  const response = await fetch(`/api/mvps/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mvpData),
  });

  const data: MVPResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update MVP');
  }

  return data.data;
}

export async function deleteMVP(id: string) {
  const response = await fetch(`/api/mvps/${id}`, {
    method: 'DELETE',
  });

  const data: MVPResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete MVP');
  }

  return data;
}
