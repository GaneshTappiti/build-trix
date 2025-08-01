// RAG System Validation Script
// This script validates that the RAG system is properly configured and working

import { createClient } from '../utils/supabase/server';
import { vectorService } from '../lib/vector-service';
import { ragGenerator } from '../lib/rag-integration';
import { ragService } from '../lib/rag-service';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class RAGSystemValidator {
  private results: ValidationResult[] = [];

  private addResult(component: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) {
    this.results.push({ component, status, message, details });
  }

  // Validate database schema
  async validateDatabaseSchema(): Promise<void> {
    console.log('🔍 Validating database schema...');
    
    try {
      const supabase = await createClient();
      
      // Check if vector extension is enabled
      const { data: extensions, error: extError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector');

      if (extError || !extensions || extensions.length === 0) {
        this.addResult('Database', 'fail', 'pgvector extension not found', extError);
        return;
      }

      // Check if RAG tables exist
      const tables = ['rag_knowledge_base', 'rag_prompt_templates', 'rag_retrieval_logs'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          this.addResult('Database', 'fail', `Table ${table} not accessible`, error);
        } else {
          this.addResult('Database', 'pass', `Table ${table} exists and accessible`);
        }
      }

      // Check if vector indexes exist
      const { data: indexes, error: indexError } = await supabase.rpc('check_vector_indexes');
      
      if (indexError) {
        this.addResult('Database', 'warning', 'Could not verify vector indexes', indexError);
      } else {
        this.addResult('Database', 'pass', 'Vector indexes verified');
      }

    } catch (error) {
      this.addResult('Database', 'fail', 'Database connection failed', error);
    }
  }

  // Validate vector service
  async validateVectorService(): Promise<void> {
    console.log('🧮 Validating vector service...');
    
    try {
      // Test embedding generation
      const testText = 'This is a test document for embedding generation';
      const embedding = await vectorService.generateEmbedding(testText);
      
      if (Array.isArray(embedding) && embedding.length === 1536) {
        this.addResult('Vector Service', 'pass', 'Embedding generation working correctly');
      } else {
        this.addResult('Vector Service', 'fail', 'Invalid embedding format or size');
      }

      // Test knowledge base search
      const searchResults = await vectorService.searchKnowledgeBase('React development', {
        maxResults: 3,
        similarityThreshold: 0.5
      });

      this.addResult('Vector Service', 'pass', `Knowledge base search returned ${searchResults.length} results`);

      // Test template search
      const templateResults = await vectorService.searchPromptTemplates('web application', {
        maxResults: 3,
        similarityThreshold: 0.5
      });

      this.addResult('Vector Service', 'pass', `Template search returned ${templateResults.length} results`);

    } catch (error) {
      this.addResult('Vector Service', 'fail', 'Vector service validation failed', error);
    }
  }

  // Validate RAG prompt generator
  async validateRAGGenerator(): Promise<void> {
    console.log('🤖 Validating RAG prompt generator...');
    
    try {
      const taskContext = {
        task_type: 'build web application',
        project_name: 'Validation Test App',
        description: 'A test application for RAG validation',
        technical_requirements: ['React', 'TypeScript'],
        ui_requirements: ['Responsive design'],
        constraints: ['Web only'],
      };

      const projectInfo = {
        name: 'Validation Test App',
        description: 'A test application for RAG validation',
        tech_stack: ['React', 'TypeScript'],
        target_audience: 'Developers',
        requirements: [],
      };

      // Test prompt generation for different tools
      const tools = ['lovable', 'cursor', 'v0'];
      
      for (const tool of tools) {
        try {
          const prompt = await ragGenerator.generatePrompt(taskContext, projectInfo, tool);
          
          if (prompt && prompt.length > 100) {
            this.addResult('RAG Generator', 'pass', `Prompt generation for ${tool} successful`);
            
            // Validate prompt quality
            const validation = ragGenerator.validatePrompt(prompt);
            if (validation.is_valid) {
              this.addResult('RAG Generator', 'pass', `Generated prompt for ${tool} passed validation (score: ${validation.score})`);
            } else {
              this.addResult('RAG Generator', 'warning', `Generated prompt for ${tool} has quality issues`, validation.issues);
            }
          } else {
            this.addResult('RAG Generator', 'fail', `Prompt generation for ${tool} produced insufficient content`);
          }
        } catch (error) {
          this.addResult('RAG Generator', 'fail', `Prompt generation for ${tool} failed`, error);
        }
      }

    } catch (error) {
      this.addResult('RAG Generator', 'fail', 'RAG generator validation failed', error);
    }
  }

  // Validate RAG service integration
  async validateRAGService(): Promise<void> {
    console.log('🔧 Validating RAG service integration...');
    
    try {
      const testRequest = {
        appIdea: {
          appName: 'Validation Test',
          platforms: ['web'] as ('web' | 'mobile')[],
          designStyle: 'minimal' as 'minimal' | 'playful' | 'business',
          ideaDescription: 'A test application for validation',
          targetAudience: 'Developers',
        },
        validationQuestions: {
          hasValidated: true,
          hasDiscussed: true,
          motivation: 'Testing RAG system validation',
          preferredAITool: 'lovable',
          projectComplexity: 'medium' as 'simple' | 'medium' | 'complex',
          technicalExperience: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
        },
        targetTool: 'lovable',
        stage: 'app_skeleton',
      };

      const result = await ragService.generateEnhancedPrompt(testRequest);
      
      if (result && result.prompt) {
        this.addResult('RAG Service', 'pass', 'Enhanced prompt generation successful');
        
        // Check confidence score
        if (result.confidenceScore > 0.5) {
          this.addResult('RAG Service', 'pass', `Good confidence score: ${result.confidenceScore.toFixed(2)}`);
        } else {
          this.addResult('RAG Service', 'warning', `Low confidence score: ${result.confidenceScore.toFixed(2)}`);
        }

        // Check for tool-specific optimizations
        if (result.toolSpecificOptimizations && result.toolSpecificOptimizations.length > 0) {
          this.addResult('RAG Service', 'pass', `Tool-specific optimizations provided: ${result.toolSpecificOptimizations.length}`);
        } else {
          this.addResult('RAG Service', 'warning', 'No tool-specific optimizations provided');
        }
      } else {
        this.addResult('RAG Service', 'fail', 'Enhanced prompt generation failed');
      }

    } catch (error) {
      this.addResult('RAG Service', 'fail', 'RAG service validation failed', error);
    }
  }

  // Validate API endpoints
  async validateAPIEndpoints(): Promise<void> {
    console.log('🌐 Validating API endpoints...');
    
    const endpoints = [
      { path: '/api/rag/generate-prompt', method: 'POST' },
      { path: '/api/rag/knowledge-base', method: 'GET' },
      { path: '/api/rag/templates', method: 'GET' },
      { path: '/api/rag/analytics', method: 'GET' },
    ];

    for (const endpoint of endpoints) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const url = `${baseUrl}${endpoint.path}`;
        
        let response;
        if (endpoint.method === 'GET') {
          response = await fetch(url);
        } else {
          // For POST endpoints, send minimal test data
          response = await fetch(url, {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true }),
          });
        }

        if (response.status < 500) {
          this.addResult('API Endpoints', 'pass', `${endpoint.method} ${endpoint.path} is accessible`);
        } else {
          this.addResult('API Endpoints', 'fail', `${endpoint.method} ${endpoint.path} returned ${response.status}`);
        }
      } catch (error) {
        this.addResult('API Endpoints', 'fail', `${endpoint.method} ${endpoint.path} failed`, error);
      }
    }
  }

  // Validate environment configuration
  async validateEnvironment(): Promise<void> {
    console.log('⚙️ Validating environment configuration...');
    
    const requiredEnvVars = [
      'GEMINI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        this.addResult('Environment', 'pass', `${envVar} is configured`);
      } else {
        this.addResult('Environment', 'fail', `${envVar} is missing`);
      }
    }

    // Check if we're in the correct environment
    const nodeEnv = process.env.NODE_ENV;
    this.addResult('Environment', 'pass', `Running in ${nodeEnv} environment`);
  }

  // Run all validations
  async runAllValidations(): Promise<void> {
    console.log('🚀 Starting RAG System Validation...\n');
    
    await this.validateEnvironment();
    await this.validateDatabaseSchema();
    await this.validateVectorService();
    await this.validateRAGGenerator();
    await this.validateRAGService();
    await this.validateAPIEndpoints();
    
    this.printResults();
  }

  // Print validation results
  private printResults(): void {
    console.log('\n📊 Validation Results:\n');
    
    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.component]) {
        acc[result.component] = [];
      }
      acc[result.component].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);

    let totalPass = 0;
    let totalFail = 0;
    let totalWarning = 0;

    for (const [component, results] of Object.entries(groupedResults)) {
      console.log(`\n🔧 ${component}:`);
      
      for (const result of results) {
        const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
        console.log(`  ${icon} ${result.message}`);
        
        if (result.details && result.status !== 'pass') {
          console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
        }

        if (result.status === 'pass') totalPass++;
        else if (result.status === 'warning') totalWarning++;
        else totalFail++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${totalPass}`);
    console.log(`⚠️  Warnings: ${totalWarning}`);
    console.log(`❌ Failed: ${totalFail}`);

    if (totalFail === 0) {
      console.log('\n🎉 RAG system validation completed successfully!');
      if (totalWarning > 0) {
        console.log('⚠️  Please review warnings for optimal performance.');
      }
    } else {
      console.log('\n💥 RAG system validation failed. Please fix the issues above.');
      process.exit(1);
    }
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new RAGSystemValidator();
  validator.runAllValidations()
    .then(() => {
      console.log('\n✨ Validation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Validation failed:', error);
      process.exit(1);
    });
}

export { RAGSystemValidator };
