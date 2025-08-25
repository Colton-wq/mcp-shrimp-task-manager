import { getAnalyzeTaskPrompt } from './dist/prompts/generators/analyzeTask.js';

async function testTemplateSelection() {
  try {
    console.log('Testing template selection...');
    
    // Test 1: Security analysis (should select deep-code-analysis)
    const securityResult = await getAnalyzeTaskPrompt({
      summary: 'Analyze security vulnerabilities in authentication system',
      initialConcept: 'Review JWT implementation for potential security issues',
      analysisType: 'auto'
    });
    
    console.log('\n=== Security Analysis Test ===');
    console.log('Template length:', securityResult.length);
    console.log('Contains "Security Vulnerability Assessment":', securityResult.includes('Security Vulnerability Assessment'));
    console.log('Contains "Deep Code Analysis":', securityResult.includes('Deep Code Analysis'));
    
    // Test 2: Architecture analysis (should select architecture-understanding)
    const archResult = await getAnalyzeTaskPrompt({
      summary: 'Evaluate microservices architecture design',
      initialConcept: 'Analyze system components and integration patterns',
      analysisType: 'auto'
    });
    
    console.log('\n=== Architecture Analysis Test ===');
    console.log('Template length:', archResult.length);
    console.log('Contains "Architecture Understanding":', archResult.includes('Architecture Understanding'));
    console.log('Contains "Component Identification":', archResult.includes('Component Identification'));
    
    // Test 3: Performance analysis (should select performance-analysis)
    const perfResult = await getAnalyzeTaskPrompt({
      summary: 'Optimize application performance and identify bottlenecks',
      initialConcept: 'Analyze resource consumption and scaling issues',
      analysisType: 'auto'
    });
    
    console.log('\n=== Performance Analysis Test ===');
    console.log('Template length:', perfResult.length);
    console.log('Contains "Performance Analysis Template":', perfResult.includes('Performance Analysis Template'));
    console.log('Contains "Resource Consumption Analysis":', perfResult.includes('Resource Consumption Analysis'));
    console.log('Contains "Performance Baseline":', perfResult.includes('Performance Baseline'));
    
    console.log('\n✅ All template selection tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testTemplateSelection();