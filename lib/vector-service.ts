// Vector Service for RAG Implementation
// Handles embeddings generation and vector similarity search

import { createClient } from '@/utils/supabase/server';
import { GoogleGenAI } from '@google/genai';

export interface VectorSearchResult {
  id: string;
  title: string;
  content: string;
  document_type: string;
  target_tools: string[];
  categories: string[];
  similarity_score: number;
}

export interface PromptTemplateResult {
  id: string;
  template_name: string;
  template_content: string;
  template_type: string;
  target_tool: string;
  required_variables: any;
  similarity_score: number;
}

export interface EmbeddingRequest {
  text: string;
  type: 'knowledge_search' | 'template_search' | 'example_search';
  target_tool?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  user_experience?: 'beginner' | 'intermediate' | 'advanced';
}

export class VectorService {
  private geminiAI: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.geminiAI = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Generate embeddings for text using Gemini AI
   * Note: This is a placeholder implementation. In production, you'd use a dedicated embedding model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.geminiAI) {
      throw new Error('Gemini AI not initialized. Please set GEMINI_API_KEY environment variable.');
    }

    try {
      // For now, we'll create a simple hash-based embedding
      // In production, you'd use a proper embedding model like text-embedding-ada-002
      const embedding = await this.createSimpleEmbedding(text);
      return embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Simple embedding generation (placeholder)
   * In production, replace with proper embedding model
   */
  private async createSimpleEmbedding(text: string): Promise<number[]> {
    // This is a simplified approach - in production use proper embeddings
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0);
    
    // Create a simple hash-based embedding
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const index = (charCode + i + j) % 1536;
        embedding[index] += 1 / (words.length + 1);
      }
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Search knowledge base using vector similarity
   */
  async searchKnowledgeBase(
    query: string,
    options: {
      targetTools?: string[];
      categories?: string[];
      complexity?: string;
      maxResults?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<VectorSearchResult[]> {
    const supabase = await createClient();
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Call the database function for vector search
      const { data, error } = await supabase.rpc('search_knowledge_base', {
        query_embedding: queryEmbedding,
        target_tools_filter: options.targetTools || null,
        categories_filter: options.categories || null,
        complexity_filter: options.complexity || null,
        similarity_threshold: options.similarityThreshold || 0.7,
        max_results: options.maxResults || 10
      });

      if (error) {
        console.error('Error searching knowledge base:', error);
        throw new Error('Failed to search knowledge base');
      }

      return data || [];
    } catch (error) {
      console.error('Vector search error:', error);
      throw error;
    }
  }

  /**
   * Search prompt templates using vector similarity
   */
  async searchPromptTemplates(
    query: string,
    options: {
      targetTool?: string;
      templateType?: string;
      complexity?: string;
      maxResults?: number;
      similarityThreshold?: number;
    } = {}
  ): Promise<PromptTemplateResult[]> {
    const supabase = await createClient();
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Call the database function for template search
      const { data, error } = await supabase.rpc('search_prompt_templates', {
        query_embedding: queryEmbedding,
        target_tool_filter: options.targetTool || null,
        template_type_filter: options.templateType || null,
        complexity_filter: options.complexity || null,
        similarity_threshold: options.similarityThreshold || 0.7,
        max_results: options.maxResults || 5
      });

      if (error) {
        console.error('Error searching prompt templates:', error);
        throw new Error('Failed to search prompt templates');
      }

      return data || [];
    } catch (error) {
      console.error('Template search error:', error);
      throw error;
    }
  }

  /**
   * Log retrieval operation for analytics
   */
  async logRetrieval(
    userId: string,
    request: EmbeddingRequest,
    results: VectorSearchResult[] | PromptTemplateResult[],
    retrievalTimeMs: number
  ): Promise<void> {
    const supabase = await createClient();
    
    try {
      const queryEmbedding = await this.generateEmbedding(request.text);
      
      const maxScore = results.length > 0 ? Math.max(...results.map(r => r.similarity_score)) : 0;
      const minScore = results.length > 0 ? Math.min(...results.map(r => r.similarity_score)) : 0;
      
      const { error } = await supabase
        .from('rag_retrieval_logs')
        .insert({
          user_id: userId,
          query_text: request.text,
          query_embedding: queryEmbedding,
          query_type: request.type,
          retrieved_documents: results.map(r => ({ id: r.id, score: r.similarity_score })),
          retrieval_count: results.length,
          max_similarity_score: maxScore,
          min_similarity_score: minScore,
          target_tool: request.target_tool,
          project_complexity: request.complexity,
          user_experience_level: request.user_experience,
          retrieval_time_ms: retrievalTimeMs,
          was_successful: true
        });

      if (error) {
        console.error('Error logging retrieval:', error);
        // Don't throw error for logging failures
      }
    } catch (error) {
      console.error('Failed to log retrieval:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Add document to knowledge base with embedding
   */
  async addKnowledgeDocument(
    document: {
      title: string;
      content: string;
      document_type: string;
      target_tools: string[];
      categories: string[];
      complexity_level: string;
      source_url?: string;
      tags?: string[];
      created_by?: string;
    }
  ): Promise<string> {
    const supabase = await createClient();
    
    try {
      // Generate embedding for the document content
      const embedding = await this.generateEmbedding(document.content);
      
      // Create content hash to prevent duplicates
      const contentHash = await this.createContentHash(document.content);
      
      const { data, error } = await supabase
        .from('rag_knowledge_base')
        .insert({
          title: document.title,
          content: document.content,
          document_type: document.document_type,
          target_tools: document.target_tools,
          categories: document.categories,
          complexity_level: document.complexity_level,
          embedding: embedding,
          content_hash: contentHash,
          word_count: document.content.split(/\s+/).length,
          source_url: document.source_url,
          tags: document.tags || [],
          created_by: document.created_by
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error adding knowledge document:', error);
        throw new Error('Failed to add knowledge document');
      }

      return data.id;
    } catch (error) {
      console.error('Error in addKnowledgeDocument:', error);
      throw error;
    }
  }

  /**
   * Add prompt template with embedding
   */
  async addPromptTemplate(
    template: {
      template_name: string;
      template_content: string;
      template_type: string;
      target_tool: string;
      use_case: string;
      project_complexity: string;
      required_variables: any;
      optional_variables?: any;
      created_by?: string;
    }
  ): Promise<string> {
    const supabase = await createClient();
    
    try {
      // Generate embedding for the template content
      const embedding = await this.generateEmbedding(template.template_content);
      
      const { data, error } = await supabase
        .from('rag_prompt_templates')
        .insert({
          template_name: template.template_name,
          template_content: template.template_content,
          template_type: template.template_type,
          target_tool: template.target_tool,
          use_case: template.use_case,
          project_complexity: template.project_complexity,
          embedding: embedding,
          required_variables: template.required_variables,
          optional_variables: template.optional_variables || [],
          created_by: template.created_by
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error adding prompt template:', error);
        throw new Error('Failed to add prompt template');
      }

      return data.id;
    } catch (error) {
      console.error('Error in addPromptTemplate:', error);
      throw error;
    }
  }

  /**
   * Create content hash for duplicate detection
   */
  private async createContentHash(content: string): Promise<string> {
    // Simple hash function - in production, use a proper hash like SHA-256
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const vectorService = new VectorService();
