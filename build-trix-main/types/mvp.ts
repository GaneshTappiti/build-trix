// MVP Types matching the Supabase database schema

export type PlatformType = 'web' | 'mobile';

export type DesignStyle = 'Minimal & Clean' | 'Playful & Animated' | 'Business & Professional';

export type MvpStatus = 'Yet To Build' | 'Built' | 'Launched' | 'Abandoned';

export interface MVP {
  id: string;
  user_id: string;
  app_name: string;
  platforms: PlatformType[];
  style: DesignStyle;
  style_description?: string;
  app_description: string;
  target_users?: string;
  generated_prompt: string;
  status: MvpStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateMVPData {
  app_name: string;
  platforms: PlatformType[];
  style: DesignStyle;
  style_description?: string;
  app_description: string;
  target_users?: string;
  generated_prompt: string;
  status?: MvpStatus;
}

export interface UpdateMVPData extends Partial<CreateMVPData> {
  id: string;
}

export interface MVPResponse {
  data?: MVP;
  error?: string;
  message?: string;
}

export interface MVPListResponse {
  data?: MVP[];
  error?: string;
  message?: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  used: number;
  reset: number; // Unix timestamp when the limit resets
  resetDate: string; // Human readable reset date
}

export interface RateLimitResponse {
  success: boolean;
  rateLimitInfo: RateLimitInfo;
  error?: string;
}
