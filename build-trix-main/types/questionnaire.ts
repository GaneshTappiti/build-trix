// Simplified Questionnaire Types

export interface QuestionnaireResponse {
  id?: string;
  mvp_id: string;
  user_id?: string;

  // Simplified micro-questionnaire fields
  idea_validated: boolean;
  talked_to_people: boolean;
  motivation?: string; // Optional field

  created_at?: string;
  updated_at?: string;
}

// Form step data interfaces
export interface MVPIdeaFormData {
  app_name: string;
  platforms: string[];
  style: string;
  style_description?: string;
  app_description: string;
  target_users?: string;
}

export interface GenerateMVPRequest {
  ideaDetails: MVPIdeaFormData;
  questionnaire: Omit<QuestionnaireResponse, 'id' | 'mvp_id' | 'user_id' | 'created_at' | 'updated_at'>;
}

export interface GenerateMVPResponse {
  success: boolean;
  mvp_id?: string;
  error?: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    used: number;
    reset: number;
    resetDate: string;
  };
}
