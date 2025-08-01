// Simple test script to verify RAG integration
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

// Run tests
const runAllTests = async () => {
  console.log('🧪 RAG Integration Test Suite\n');
  
  await testRAGIntegration();
  await testSupportedTools();
  await testAllTools();
  
  console.log('\n🎉 All tests completed!');
  console.log('\nNext steps:');
  console.log('1. Check that your existing MVP Studio workflow still works');
  console.log('2. Test the enhanced prompts in your chosen AI tool');
  console.log('3. Compare prompt quality before and after RAG enhancement');
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
