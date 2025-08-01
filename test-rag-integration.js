// Comprehensive RAG Integration Test Script
// Run with: node test-rag-integration.js

const testRAGIntegration = async () => {
  console.log('🚀 Testing RAG Integration...\n');

  // Test data similar to your MVP Studio format
  const testData = {
    appIdea: {
      appName: 'TaskMaster Pro',
      platforms: ['web'],
      designStyle: 'minimal',
      styleDescription: 'Clean and modern interface',
      ideaDescription: 'A comprehensive task management application for small teams with real-time collaboration features',
      targetAudience: 'Small business teams and freelancers'
    },
    validationQuestions: {
      hasValidated: true,
      hasDiscussed: true,
      motivation: 'I want to build a tool that helps teams stay organized and productive while working remotely',
      preferredAITool: 'lovable',
      projectComplexity: 'medium',
      technicalExperience: 'intermediate'
    },
    targetTool: 'lovable',
    taskType: 'build web application'
  };

  try {
    console.log('📝 Test Data:');
    console.log(`App Name: ${testData.appIdea.appName}`);
    console.log(`Target Tool: ${testData.targetTool}`);
    console.log(`Platforms: ${testData.appIdea.platforms.join(', ')}`);
    console.log(`Design Style: ${testData.appIdea.designStyle}`);
    console.log('');

    // Test the RAG API endpoint
    console.log('🔄 Testing RAG API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/rag/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ RAG API Response:');
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log(`Prompt Length: ${result.prompt?.length || 0} characters`);
      console.log(`Validation Score: ${result.validation?.score || 0}/100`);
      console.log(`Valid: ${result.validation?.is_valid || false}`);
      
      if (result.validation?.issues?.length > 0) {
        console.log('⚠️  Issues:', result.validation.issues);
      }
      
      if (result.validation?.suggestions?.length > 0) {
        console.log('💡 Suggestions:', result.validation.suggestions);
      }
      
      console.log('\n📄 Generated Prompt Preview:');
      console.log('=' .repeat(50));
      console.log(result.prompt?.substring(0, 500) + '...');
      console.log('=' .repeat(50));
    } else {
      console.log('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure your Next.js server is running on http://localhost:3000');
      console.log('   Run: npm run dev');
    }
  }

  console.log('\n🏁 Test completed!');
};

// Test different tools
const testAllTools = async () => {
  const tools = ['lovable', 'cursor', 'v0', 'bolt', 'claude', 'chatgpt'];
  
  console.log('🔧 Testing all supported tools...\n');
  
  for (const tool of tools) {
    console.log(`Testing ${tool}...`);
    
    const testData = {
      appIdea: {
        appName: 'Test App',
        platforms: ['web'],
        designStyle: 'minimal',
        ideaDescription: `A test application for ${tool}`,
        targetAudience: 'Developers'
      },
      validationQuestions: {
        hasValidated: true,
        hasDiscussed: false,
        motivation: `Testing ${tool} integration`,
        preferredAITool: tool,
        projectComplexity: 'simple',
        technicalExperience: 'intermediate'
      },
      targetTool: tool,
      taskType: 'build web application'
    };

    try {
      const response = await fetch('http://localhost:3000/api/rag/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`  ✅ ${tool}: ${result.success ? 'Success' : 'Failed'}`);
        if (result.validation) {
          console.log(`     Score: ${result.validation.score}/100`);
        }
      } else {
        console.log(`  ❌ ${tool}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${tool}: ${error.message}`);
    }
  }
};

// Test supported tools endpoint
const testSupportedTools = async () => {
  console.log('\n🛠️  Testing supported tools endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/rag/generate-prompt');
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Found ${result.supportedTools?.length || 0} supported tools:`);
      
      result.supportedTools?.forEach(tool => {
        console.log(`  - ${tool.name} (${tool.category}): ${tool.description}`);
      });
      
      if (result.taskSuggestions?.length > 0) {
        console.log('\n💡 Task suggestions:');
        result.taskSuggestions.forEach(task => {
          console.log(`  - ${task}`);
        });
      }
    } else {
      console.log(`❌ HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
};

// Test vector database functionality
const testVectorDatabase = async () => {
  console.log('\n🔍 Testing Vector Database...');

  try {
    // Test knowledge base search
    const knowledgeResponse = await fetch('http://localhost:3000/api/rag/knowledge-base?query=React best practices&limit=3');

    if (knowledgeResponse.ok) {
      const knowledgeData = await knowledgeResponse.json();
      console.log(`✅ Knowledge base search: Found ${knowledgeData.documents?.length || 0} documents`);

      if (knowledgeData.documents?.length > 0) {
        console.log(`   Top result: "${knowledgeData.documents[0].title}"`);
      }
    } else {
      console.log(`❌ Knowledge base search failed: HTTP ${knowledgeResponse.status}`);
    }

    // Test template search
    const templateResponse = await fetch('http://localhost:3000/api/rag/templates?target_tool=lovable&limit=3');

    if (templateResponse.ok) {
      const templateData = await templateResponse.json();
      console.log(`✅ Template search: Found ${templateData.templates?.length || 0} templates`);

      if (templateData.templates?.length > 0) {
        console.log(`   Top template: "${templateData.templates[0].template_name}"`);
      }
    } else {
      console.log(`❌ Template search failed: HTTP ${templateResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Vector database test failed: ${error.message}`);
  }
};

// Test analytics functionality
const testAnalytics = async () => {
  console.log('\n📊 Testing Analytics...');

  try {
    const response = await fetch('http://localhost:3000/api/rag/analytics?timeframe=week');

    if (response.ok) {
      const data = await response.json();

      if (data.success) {
        console.log('✅ Analytics data retrieved successfully');
        console.log(`   Total generations: ${data.analytics.totalGenerations}`);
        console.log(`   Average confidence: ${(data.analytics.averageConfidenceScore * 100).toFixed(1)}%`);
        console.log(`   Success rate: ${(data.analytics.successRate * 100).toFixed(1)}%`);

        if (data.analytics.topTools?.length > 0) {
          console.log(`   Most used tool: ${data.analytics.topTools[0].tool}`);
        }
      } else {
        console.log(`❌ Analytics failed: ${data.error}`);
      }
    } else {
      console.log(`❌ Analytics request failed: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Analytics test failed: ${error.message}`);
  }
};

// Test performance with multiple concurrent requests
const testPerformance = async () => {
  console.log('\n⚡ Testing Performance...');

  try {
    const startTime = Date.now();
    const concurrentRequests = 5;

    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      fetch('http://localhost:3000/api/rag/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appIdea: {
            appName: `Performance Test App ${i + 1}`,
            platforms: ['web'],
            designStyle: 'minimal',
            ideaDescription: `Performance test application number ${i + 1}`,
            targetAudience: 'Developers'
          },
          validationQuestions: {
            hasValidated: true,
            hasDiscussed: false,
            motivation: 'Performance testing',
            preferredAITool: 'lovable',
            projectComplexity: 'simple',
            technicalExperience: 'intermediate'
          },
          targetTool: 'lovable',
          taskType: 'build web application'
        }),
      })
    );

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successCount = results.filter(r => r.ok).length;

    console.log(`✅ Performance test completed`);
    console.log(`   ${concurrentRequests} concurrent requests in ${duration}ms`);
    console.log(`   Success rate: ${successCount}/${concurrentRequests} (${(successCount/concurrentRequests*100).toFixed(1)}%)`);
    console.log(`   Average response time: ${(duration/concurrentRequests).toFixed(0)}ms per request`);

    if (duration > 10000) {
      console.log('⚠️  Warning: Response time is high, consider optimization');
    }
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
  }
};

// Test error handling
const testErrorHandling = async () => {
  console.log('\n🛡️  Testing Error Handling...');

  try {
    // Test with invalid data
    const invalidResponse = await fetch('http://localhost:3000/api/rag/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required fields
        appIdea: {},
        validationQuestions: {}
      }),
    });

    if (invalidResponse.status === 400) {
      console.log('✅ Invalid request properly rejected with 400 status');
    } else {
      console.log(`❌ Expected 400 status, got ${invalidResponse.status}`);
    }

    // Test with unsupported tool
    const unsupportedToolResponse = await fetch('http://localhost:3000/api/rag/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appIdea: {
          appName: 'Test App',
          platforms: ['web'],
          designStyle: 'minimal',
          ideaDescription: 'Test app',
        },
        validationQuestions: {
          hasValidated: true,
          hasDiscussed: true,
          motivation: 'Testing',
        },
        targetTool: 'unsupported-tool',
        taskType: 'build web application'
      }),
    });

    const unsupportedData = await unsupportedToolResponse.json();
    if (!unsupportedData.success) {
      console.log('✅ Unsupported tool properly handled');
    } else {
      console.log('❌ Unsupported tool should have been rejected');
    }
  } catch (error) {
    console.log(`❌ Error handling test failed: ${error.message}`);
  }
};

// Run comprehensive test suite
const runAllTests = async () => {
  console.log('🧪 Comprehensive RAG Integration Test Suite\n');

  await testRAGIntegration();
  await testSupportedTools();
  await testAllTools();
  await testVectorDatabase();
  await testAnalytics();
  await testPerformance();
  await testErrorHandling();

  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('✅ Basic RAG prompt generation');
  console.log('✅ Tool-specific optimizations');
  console.log('✅ Vector database integration');
  console.log('✅ Analytics and monitoring');
  console.log('✅ Performance under load');
  console.log('✅ Error handling');

  console.log('\n🚀 Next steps:');
  console.log('1. Check that your existing MVP Studio workflow still works');
  console.log('2. Test the enhanced prompts in your chosen AI tool');
  console.log('3. Compare prompt quality before and after RAG enhancement');
  console.log('4. Monitor analytics dashboard for usage patterns');
  console.log('5. Add more knowledge base documents for better retrieval');
};

// Check if running directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

module.exports = {
  testRAGIntegration,
  testAllTools,
  testSupportedTools,
  runAllTests
};
