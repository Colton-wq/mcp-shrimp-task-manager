/**
 * 简化的 RealCodeQualityAnalyzer 测试
 */

import { RealCodeQualityAnalyzer } from './dist/tools/workflow/realCodeQualityAnalyzer.js';
import * as path from 'path';
import * as fs from 'fs';

async function testRealAnalyzer() {
  console.log('🔍 [TEST] Starting direct RealCodeQualityAnalyzer test...');
  
  try {
    const analyzer = RealCodeQualityAnalyzer.getInstance();
    const testFile = path.resolve(process.cwd(), 'src/test-real-quality.ts');
    
    console.log(`📄 [TEST] Analyzing file: ${testFile}`);
    console.log(`📄 [TEST] File exists: ${fs.existsSync(testFile)}`);
    
    if (!fs.existsSync(testFile)) {
      console.error('❌ [TEST] Test file does not exist!');
      return;
    }
    
    const result = await analyzer.analyzeFiles([testFile]);
    
    console.log('✅ [TEST] Analysis completed!');
    console.log(`📊 [TEST] Health Score: ${result.healthScore}/100`);
    console.log(`🔍 [TEST] Total Violations: ${result.violations.length}`);
    console.log(`📈 [TEST] Summary:`, result.summary);
    
    // 显示前5个违规
    console.log('\n🚨 [TEST] Top 5 Violations:');
    result.violations.slice(0, 5).forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.type.toUpperCase()}: ${violation.message}`);
      console.log(`   File: ${path.basename(violation.file)}:${violation.line}:${violation.column}`);
      console.log(`   Rule: ${violation.rule} (${violation.category})`);
      console.log('');
    });
    
    // 显示建议
    console.log('💡 [TEST] Recommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    return result;
  } catch (error) {
    console.error('❌ [TEST] Analysis failed:', error);
    throw error;
  }
}

// 运行测试
testRealAnalyzer()
  .then(() => {
    console.log('\n✅ [TEST] Direct analyzer test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ [TEST] Direct analyzer test failed:', error);
    process.exit(1);
  });