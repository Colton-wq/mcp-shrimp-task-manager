// 简单的调试测试
import { AsyncFileOperations } from './dist/utils/asyncFileOperations.js';
import path from 'path';

async function testFileCheck() {
  console.log('🧪 开始独立文件检查测试...');
  
  const testFiles = [
    'package.json',
    'README.md', 
    'tsconfig.json',
    'non-existent-file.xyz'
  ];
  
  const projectRoot = 'E:\\MCP\\mcp-shrimp-task-manager';
  console.log(`📁 项目根目录: ${projectRoot}`);
  
  try {
    const results = await AsyncFileOperations.checkFilesExist(testFiles, projectRoot);
    
    console.log('📊 检查结果:');
    for (const [filePath, exists] of results.entries()) {
      console.log(`  ${exists ? '✅' : '❌'} ${filePath}`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testFileCheck();