/**
 * 测试文档过滤功能
 * Test document filtering functionality
 */

import { getSplitTasksPrompt } from './dist/prompts/generators/splitTasks.js';

// 创建测试任务，包含一些文档创建任务
const testTasks = [
  {
    id: 'task-1',
    name: 'Implement user authentication',
    description: 'Create secure login system with JWT tokens',
    implementationGuide: 'Use bcrypt for password hashing',
    verificationCriteria: 'Login should work correctly',
    dependencies: [],
    notes: 'Core functionality'
  },
  {
    id: 'task-2', 
    name: 'Create README documentation',
    description: 'Write comprehensive README.md file for the project',
    implementationGuide: 'Include installation and usage instructions',
    verificationCriteria: 'Documentation should be clear',
    dependencies: [],
    notes: 'Documentation task'
  },
  {
    id: 'task-3',
    name: 'Add API endpoints',
    description: 'Implement REST API for user management',
    implementationGuide: 'Use Express.js framework',
    verificationCriteria: 'All endpoints should return correct responses',
    dependencies: [],
    notes: 'Core functionality'
  },
  {
    id: 'task-4',
    name: 'Generate user guide',
    description: 'Create user manual for the application',
    implementationGuide: 'Write step-by-step guide',
    verificationCriteria: 'Guide should be easy to follow',
    dependencies: [],
    notes: 'Documentation task'
  }
];

async function testDocumentFilter() {
  console.log('🧪 Testing document filter functionality...\n');
  
  console.log('📋 Original tasks:');
  testTasks.forEach((task, index) => {
    console.log(`${index + 1}. ${task.name} - ${task.description}`);
  });
  
  console.log('\n🔄 Processing tasks through getSplitTasksPrompt...\n');
  
  try {
    const prompt = await getSplitTasksPrompt({
      updateMode: 'clearAllTasks',
      createdTasks: testTasks,
      allTasks: testTasks
    });
    
    console.log('✅ Filter test completed successfully!');
    console.log('\n📄 Generated prompt preview (first 500 chars):');
    console.log(prompt.substring(0, 500) + '...');
    
    // 检查生成的prompt中是否还包含文档相关任务
    const hasDocumentTasks = /README|documentation|guide|manual/i.test(prompt);
    
    if (hasDocumentTasks) {
      console.log('\n⚠️  WARNING: Document-related content still found in prompt!');
    } else {
      console.log('\n✅ SUCCESS: No document-related tasks found in final prompt!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDocumentFilter();
