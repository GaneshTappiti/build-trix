import { useState, useCallback } from 'react';

export interface KnowledgeDocument {
  id?: string;
  title: string;
  content: string;
  document_type: 'best_practice' | 'example' | 'template' | 'guide' | 'reference';
  target_tools: string[];
  categories: string[];
  complexity_level: 'beginner' | 'intermediate' | 'advanced';
  source_url?: string;
  tags?: string[];
  quality_score?: number;
  similarity_score?: number;
  created_at?: string;
}

export interface PromptTemplate {
  id?: string;
  template_name: string;
  template_content: string;
  template_type: 'skeleton' | 'feature' | 'optimization' | 'debugging';
  target_tool: string;
  use_case: string;
  project_complexity: 'simple' | 'medium' | 'complex';
  required_variables: any;
  optional_variables?: any;
  usage_count?: number;
  success_rate?: number;
  similarity_score?: number;
  created_at?: string;
}

export interface SearchOptions {
  query?: string;
  target_tools?: string[];
  categories?: string[];
  complexity?: string;
  document_type?: string;
  template_type?: string;
  target_tool?: string;
  limit?: number;
}

export function useKnowledgeBase() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);

  // Search knowledge base documents
  const searchDocuments = useCallback(async (options: SearchOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (options.query) params.append('query', options.query);
      if (options.target_tools) params.append('target_tools', options.target_tools.join(','));
      if (options.categories) params.append('categories', options.categories.join(','));
      if (options.complexity) params.append('complexity', options.complexity);
      if (options.document_type) params.append('document_type', options.document_type);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/rag/knowledge-base?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
        return data.documents;
      } else {
        throw new Error(data.error || 'Failed to search documents');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error searching documents:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search prompt templates
  const searchTemplates = useCallback(async (options: SearchOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (options.query) params.append('query', options.query);
      if (options.target_tool) params.append('target_tool', options.target_tool);
      if (options.template_type) params.append('template_type', options.template_type);
      if (options.complexity) params.append('complexity', options.complexity);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/rag/templates?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
        return data.templates;
      } else {
        throw new Error(data.error || 'Failed to search templates');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error searching templates:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add new knowledge document
  const addDocument = useCallback(async (document: Omit<KnowledgeDocument, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/knowledge-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the documents list
        await searchDocuments();
        return data.document_id;
      } else {
        throw new Error(data.error || 'Failed to add document');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error adding document:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchDocuments]);

  // Add new prompt template
  const addTemplate = useCallback(async (template: Omit<PromptTemplate, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the templates list
        await searchTemplates();
        return data.template_id;
      } else {
        throw new Error(data.error || 'Failed to add template');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error adding template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchTemplates]);

  // Update knowledge document
  const updateDocument = useCallback(async (id: string, updates: Partial<KnowledgeDocument>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/knowledge-base', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the documents list
        await searchDocuments();
        return true;
      } else {
        throw new Error(data.error || 'Failed to update document');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error updating document:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchDocuments]);

  // Delete knowledge document
  const deleteDocument = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rag/knowledge-base?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the documents list
        await searchDocuments();
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete document');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting document:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchDocuments]);

  // Delete prompt template
  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rag/templates?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the templates list
        await searchTemplates();
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete template');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting template:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [searchTemplates]);

  return {
    // State
    isLoading,
    error,
    documents,
    templates,
    
    // Actions
    searchDocuments,
    searchTemplates,
    addDocument,
    addTemplate,
    updateDocument,
    deleteDocument,
    deleteTemplate,
    
    // Utilities
    clearError: () => setError(null),
  };
}
