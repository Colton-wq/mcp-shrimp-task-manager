// 优化后的智能文档管理功能测试
import { splitTasksRaw } from './dist/tools/task/splitTasksRaw.js';

async function optimizationTest() {
  console.log('🚀 开始优化验证测试...');
  
  const testData = {
    updateMode: 'clearAllTasks',
    project: 'optimization-test-project',
    tasksRaw: JSON.stringify([
      {
        name: "优化验证测试",
        description: "验证基于2024-2025最佳实践的路径处理和文件检查优化是否正常工作",
        implementationGuide: "测试跨平台路径处理和批量文件检查性能",
        dependencies: [],
        relatedFiles: [
          {
            path: "package.json",
            type: "CREATE",
            description: "根目录文件 - 应转换为TO_MODIFY"
          },
          {
            path: "src/utils/pathUtils.ts",
            type: "CREATE", 
            description: "新创建的工具文件 - 应转换为TO_MODIFY"
          },
          {
            path: "src/utils/projectRoot.ts",
            type: "CREATE",
            description: "深层路径文件 - 应转换为TO_MODIFY"
          },
          {
            path: "src/utils/asyncFileOperations.ts",
            type: "CREATE",
            description: "异步文件操作 - 应转换为TO_MODIFY"
          },
          {
            path: "dist/index.js",
            type: "CREATE",
            description: "编译后文件 - 应转换为TO_MODIFY"
          },
          {
            path: "non-existent-optimization-test.xyz",
            type: "CREATE",
            description: "不存在文件 - 应保持CREATE"
          },
          {
            path: "another/deep/non-existent/path.txt",
            type: "CREATE",
            description: "深层不存在路径 - 应保持CREATE"
          }
        ],
        verificationCriteria: "验证所有存在文件正确转换，不存在文件保持CREATE"
      }
    ]),
    globalAnalysisResult: '优化验证测试 - 基于2024-2025最佳实践'
  };

  try {
    console.log('📤 调用优化后的 splitTasksRaw...');
    const startTime = performance.now();
    
    const result = await splitTasksRaw(testData);
    
    const endTime = performance.now();
    console.log(`⚡ 执行时间: ${(endTime - startTime).toFixed(2)}ms`);
    
    console.log('📥 优化测试完成');
    
    // 检查结果中的文件类型转换
    const content = result.content[0].text;
    
    // 查找Related Files部分
    const relatedFilesMatch = content.match(/Related Files:([\s\S]*?)(?=\n\n|\*\*Creation Time)/);
    if (relatedFilesMatch) {
      console.log('📄 Related Files 部分:', relatedFilesMatch[1]);
    }
    
    const toModifyCount = (content.match(/\(TO_MODIFY\)/g) || []).length;
    const createCount = (content.match(/\(CREATE\)/g) || []).length;
    
    console.log(`📊 转换统计:`);
    console.log(`  - TO_MODIFY: ${toModifyCount} 个文件`);
    console.log(`  - CREATE: ${createCount} 个文件`);
    
    if (toModifyCount >= 4 && createCount >= 2) {
      console.log('✅ 优化验证测试通过！');
    } else {
      console.log('⚠️ 优化验证测试结果异常');
    }
    
  } catch (error) {
    console.error('❌ 优化测试失败:', error);
  }
}

optimizationTest();