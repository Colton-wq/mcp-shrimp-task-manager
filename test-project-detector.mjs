/**
 * 测试项目根目录检测器
 */

import { findProjectRoot, getProjectInfo } from './dist/utils/projectRootDetector.js';
import * as path from 'path';
import * as fs from 'fs';

console.log('🚀 [TEST] Testing ProjectRootDetector...');

try {
  const projectRoot = findProjectRoot({ debug: true });
  console.log(`✅ [TEST] Project root: ${projectRoot}`);
  
  const projectInfo = getProjectInfo({ debug: true });
  console.log(`📋 [TEST] Project info:`, projectInfo);
  
  // 测试文件解析
  
  const testFile = 'src/test-real-quality.ts';
  const resolvedPath = path.resolve(projectRoot, testFile);
  console.log(`📄 [TEST] Test file: ${resolvedPath}`);
  console.log(`📄 [TEST] File exists: ${fs.existsSync(resolvedPath)}`);
  
} catch (error) {
  console.error('❌ [TEST] Error:', error);
}