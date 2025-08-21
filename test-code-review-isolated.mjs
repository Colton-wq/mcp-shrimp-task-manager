/**
 * 隔离测试代码审查工具
 */

import { findProjectRoot } from './dist/utils/projectRootDetector.js';
import * as path from 'path';
import * as fs from 'fs';

async function testCodeReview() {
  console.log('🚀 [TEST] Testing isolated code review logic...');
  
  try {
    // 1. 测试项目根目录检测
    const projectRoot = findProjectRoot({ debug: true });
    console.log(`✅ [TEST] Project root: ${projectRoot}`);
    
    // 2. 测试文件路径解析
    const targetFiles = ["src/test-real-quality.ts"];
    const filesToCheck = [];
    
    for (const filePath of targetFiles) {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
      console.log(`🔍 [TEST] Checking file: ${fullPath}, exists: ${fs.existsSync(fullPath)}`);
      if (fs.existsSync(fullPath)) {
        filesToCheck.push(fullPath);
      }
    }
    
    console.log(`📊 [TEST] Files to check: ${filesToCheck.length}`);
    
    if (filesToCheck.length === 0) {
      console.log('❌ [TEST] No files to check - this is the problem!');
      return;
    }
    
    // 3. 测试真实分析器导入
    console.log('🔍 [TEST] Importing RealCodeQualityAnalyzer...');
    const { RealCodeQualityAnalyzer } = await import('./dist/tools/workflow/realCodeQualityAnalyzer.js');
    const analyzer = RealCodeQualityAnalyzer.getInstance();
    console.log('✅ [TEST] Analyzer imported and instantiated');
    
    // 4. 测试分析
    console.log('🔍 [TEST] Running analysis...');
    const result = await analyzer.analyzeFiles(filesToCheck);
    console.log(`✅ [TEST] Analysis completed: ${result.violations.length} violations, score: ${result.healthScore}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    console.error('Stack:', error.stack);
  }
}

testCodeReview();