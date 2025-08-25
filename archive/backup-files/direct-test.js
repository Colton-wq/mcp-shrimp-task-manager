// 直接测试智能文档管理功能
import { splitTasksRaw } from './dist/tools/task/splitTasksRaw.js';

async function directTest() {
  console.log('🧪 开始直接测试智能文档管理功能...');
  
  const testData = {
    updateMode: 'clearAllTasks',
    project: 'direct-test-project',
    tasksRaw: JSON.stringify([
      {
        name: "直接测试任务",
        description: "直接测试智能文档管理功能是否正常工作",
        implementationGuide: "测试文件类型转换",
        dependencies: [],
        relatedFiles: [
          {
            path: "package.json",
            type: "CREATE",
            description: "应该转换为TO_MODIFY"
          },
          {
            path: "non-existent-file.xyz",
            type: "CREATE", 
            description: "应该保持CREATE"
          }
        ],
        verificationCriteria: "验证转换结果"
      }
    ]),
    globalAnalysisResult: '直接测试'
  };

  try {
    console.log('📤 调用 splitTasksRaw...');
    const result = await splitTasksRaw(testData);
    console.log('📥 结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

directTest();