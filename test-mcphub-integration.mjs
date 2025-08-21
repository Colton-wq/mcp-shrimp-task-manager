/**
 * 测试 MCPHub 集成和项目根目录检测
 * Test MCPHub integration and project root detection
 */

import { findProjectRoot, getProjectInfo } from './dist/utils/projectRootDetector.js';
import * as path from 'path';
import * as fs from 'fs';

async function testMCPHubIntegration() {
  console.log('🚀 [TEST] Testing MCPHub integration...');
  console.log(`📁 [TEST] Current working directory: ${process.cwd()}`);
  console.log(`📄 [TEST] Script path: ${process.argv[1]}`);
  console.log(`🔧 [TEST] MCP_PROJECT_ROOT env: ${process.env.MCP_PROJECT_ROOT || 'NOT SET'}`);
  
  try {
    // 测试1：正常环境下的项目根目录检测
    console.log('\n🔍 [TEST 1] Normal environment project root detection...');
    const projectRoot1 = findProjectRoot({ debug: true });
    console.log(`✅ [TEST 1] Project root: ${projectRoot1}`);
    
    // 测试2：模拟 MCPHub 环境（设置环境变量）
    console.log('\n🔍 [TEST 2] Simulating MCPHub environment...');
    process.env.MCP_PROJECT_ROOT = 'E:\\MCP\\mcp-shrimp-task-manager';
    const projectRoot2 = findProjectRoot({ debug: true });
    console.log(`✅ [TEST 2] Project root with env var: ${projectRoot2}`);
    
    // 测试3：模拟错误的工作目录
    console.log('\n🔍 [TEST 3] Simulating wrong working directory...');
    const projectRoot3 = findProjectRoot({ 
      startDir: 'E:\\MCP\\mcphub',  // 模拟 MCPHub 工作目录
      debug: true 
    });
    console.log(`✅ [TEST 3] Project root from mcphub dir: ${projectRoot3}`);
    
    // 测试4：验证项目信息
    console.log('\n🔍 [TEST 4] Verifying project information...');
    const projectInfo = getProjectInfo({ debug: true });
    console.log(`📋 [TEST 4] Project info:`, projectInfo);
    
    // 测试5：文件路径解析
    console.log('\n🔍 [TEST 5] Testing file path resolution...');
    const testFile = 'src/test-real-quality.ts';
    const resolvedPath = path.resolve(projectRoot2, testFile);
    console.log(`📄 [TEST 5] Test file: ${resolvedPath}`);
    console.log(`📄 [TEST 5] File exists: ${fs.existsSync(resolvedPath) ? '✅' : '❌'}`);
    
    // 测试6：清除缓存并重新测试
    console.log('\n🔍 [TEST 6] Testing cache clearing...');
    const { projectRootDetector } = await import('./dist/utils/projectRootDetector.js');
    console.log(`🗄️ [TEST 6] Cache stats before clear:`, projectRootDetector.getCacheStats());
    projectRootDetector.clearCache();
    console.log(`🗄️ [TEST 6] Cache stats after clear:`, projectRootDetector.getCacheStats());
    
    const projectRoot6 = findProjectRoot({ debug: true });
    console.log(`✅ [TEST 6] Project root after cache clear: ${projectRoot6}`);
    
    console.log('\n🎉 [TEST] All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    console.error('Stack:', error.stack);
  }
}

testMCPHubIntegration();