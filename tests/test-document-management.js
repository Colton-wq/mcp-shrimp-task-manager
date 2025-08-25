// 测试智能文档管理功能
// Test intelligent document management functionality

import { splitTasksRaw } from './dist/tools/task/splitTasksRaw.js';

async function testDocumentManagement() {
  console.log('🧪 测试智能文档管理功能...');
  
  // 创建测试任务，包含已存在和不存在的文件
  const testTasks = JSON.stringify([
    {
      name: "测试文档管理功能",
      description: "验证智能文档存在性检查和类型转换",
      implementationGuide: "测试现有文件的自动转换",
      dependencies: [],
      relatedFiles: [
        {
          path: "README.md", // 这个文件应该存在
          type: "CREATE",
          description: "项目说明文档"
        },
        {
          path: "package.json", // 这个文件应该存在
          type: "CREATE", 
          description: "项目配置文件"
        },
        {
          path: "non-existent-file.md", // 这个文件不存在
          type: "CREATE",
          description: "不存在的文件"
        }
      ],
      verificationCriteria: "验证文件类型是否正确转换"
    }
  ]);

  try {
    const result = await splitTasksRaw({
      updateMode: 'clearAllTasks',
      tasksRaw: testTasks,
      project: 'test-document-management',
      globalAnalysisResult: '测试智能文档管理功能'
    });

    console.log('✅ 测试完成');
    console.log('📊 结果:', result);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testDocumentManagement();