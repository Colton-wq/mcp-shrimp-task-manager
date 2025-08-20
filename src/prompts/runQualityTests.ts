/**
 * 自动化模板质量测试脚本
 * Automated template quality testing script
 */

import { TemplateQualityController } from './qualityControl.js';

/**
 * 运行完整的质量测试套件
 * Run complete quality test suite
 */
async function runCompleteQualityTests() {
  console.log('🚀 启动模板质量控制测试\n');
  
  const controller = new TemplateQualityController();

  try {
    // 1. 批量测试所有模板
    console.log('📊 执行批量模板测试...');
    const batchResults = await controller.runBatchTests();
    
    // 2. 执行A/B测试对比
    console.log('\n🔄 执行A/B测试对比...');
    await runABTests(controller);
    
    // 3. 生成测试报告
    console.log('\n📈 生成测试统计报告...');
    const stats = controller.getTestStatistics();
    console.log('测试统计:', stats);
    
    // 4. 保存测试结果
    await controller.saveTestResults();
    
    // 5. 生成质量评估报告
    generateQualityReport(batchResults);
    
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

/**
 * 执行A/B测试
 * Execute A/B tests
 */
async function runABTests(controller: TemplateQualityController) {
  const testCases = [
    {
      id: 'ab-test-1',
      name: '新旧planTask模板对比',
      description: '对比新的业务导向planTask模板与原始模板',
      category: 'feature-development' as const,
      expectedBusinessFocus: ['业务目标', '用户需求'],
      expectedTools: ['codebase-retrieval'],
      expectedSimplification: ['最简方案']
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`   🧪 A/B测试: ${testCase.name}`);
      
      const result = await controller.executeABTest(
        'templates_en/planTask/index-original.md',  // 原始模板
        'templates_en/planTask/index.md',           // 新模板
        testCase
      );
      
      console.log(`      模板A评分: ${result.metricsA.overallScore}/100`);
      console.log(`      模板B评分: ${result.metricsB.overallScore}/100`);
      console.log(`      获胜者: ${result.winner} (置信度: ${result.confidence.toFixed(1)}%)`);
      
      if (result.winner === 'B') {
        console.log('      ✅ 新模板表现更好');
      } else if (result.winner === 'A') {
        console.log('      ⚠️ 原始模板表现更好');
      } else {
        console.log('      🤝 两个模板表现相当');
      }
      
    } catch (error) {
      console.error(`   A/B测试失败: ${error}`);
    }
  }
}

/**
 * 生成质量评估报告
 * Generate quality assessment report
 */
function generateQualityReport(results: any[]) {
  console.log('\n📋 模板质量评估报告');
  console.log('='.repeat(50));
  
  if (results.length === 0) {
    console.log('❌ 没有测试结果可用于生成报告');
    return;
  }
  
  // 计算平均分数
  const avgOverall = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  const avgBusiness = results.reduce((sum, r) => sum + r.businessFocusScore, 0) / results.length;
  const avgSimplicity = results.reduce((sum, r) => sum + r.simplicityScore, 0) / results.length;
  const avgTool = results.reduce((sum, r) => sum + r.toolIntegrationScore, 0) / results.length;
  const avgAction = results.reduce((sum, r) => sum + r.actionabilityScore, 0) / results.length;
  
  console.log(`📊 平均评分:`);
  console.log(`   总体质量: ${avgOverall.toFixed(1)}/100`);
  console.log(`   业务导向: ${avgBusiness.toFixed(1)}/100`);
  console.log(`   简洁性: ${avgSimplicity.toFixed(1)}/100`);
  console.log(`   工具集成: ${avgTool.toFixed(1)}/100`);
  console.log(`   可操作性: ${avgAction.toFixed(1)}/100`);
  
  // 质量等级评估
  let qualityLevel = '';
  if (avgOverall >= 90) {
    qualityLevel = '🏆 优秀 (Excellent)';
  } else if (avgOverall >= 80) {
    qualityLevel = '✅ 良好 (Good)';
  } else if (avgOverall >= 70) {
    qualityLevel = '⚠️ 一般 (Fair)';
  } else {
    qualityLevel = '❌ 需要改进 (Needs Improvement)';
  }
  
  console.log(`\n🎯 整体质量等级: ${qualityLevel}`);
  
  // 改进建议
  console.log('\n💡 改进建议:');
  if (avgBusiness < 80) {
    console.log('   • 加强业务目标确认机制');
  }
  if (avgSimplicity < 80) {
    console.log('   • 简化模板内容和结构');
  }
  if (avgTool < 80) {
    console.log('   • 增强MCP工具集成指导');
  }
  if (avgAction < 80) {
    console.log('   • 提升模板的可操作性');
  }
  
  if (avgOverall >= 85) {
    console.log('   • 模板质量已达到高标准，建议保持并持续监控');
  }
}

/**
 * 运行特定模板的质量检查
 * Run quality check for specific template
 */
async function runSpecificTemplateCheck(templatePath: string) {
  console.log(`🔍 检查模板: ${templatePath}`);
  
  const controller = new TemplateQualityController();
  
  // 使用第一个测试用例进行快速检查
  const testCase = {
    id: 'quick-check',
    name: '快速质量检查',
    description: '验证模板基本质量指标',
    category: 'general' as const,
    expectedBusinessFocus: ['业务目标'],
    expectedTools: ['codebase-retrieval'],
    expectedSimplification: ['简化']
  };
  
  try {
    const templateContent = await controller['readTemplate'](templatePath);
    const metrics = await controller.evaluateTemplateQuality(templateContent, testCase);
    
    console.log(`✅ 质量评估完成:`);
    console.log(`   总体评分: ${metrics.overallScore}/100`);
    console.log(`   业务导向: ${metrics.businessFocusScore}/100`);
    console.log(`   简洁性: ${metrics.simplicityScore}/100`);
    console.log(`   工具集成: ${metrics.toolIntegrationScore}/100`);
    console.log(`   可操作性: ${metrics.actionabilityScore}/100`);
    
    if (metrics.feedback.length > 0) {
      console.log(`\n💡 建议:`);
      metrics.feedback.forEach(feedback => {
        console.log(`   • ${feedback}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ 检查失败: ${error}`);
  }
}

// 如果直接运行此文件，执行完整测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--template') {
    // 检查特定模板
    const templatePath = args[1];
    if (templatePath) {
      runSpecificTemplateCheck(templatePath);
    } else {
      console.error('请提供模板路径: --template <path>');
    }
  } else {
    // 运行完整测试套件
    runCompleteQualityTests();
  }
}

export { runCompleteQualityTests, runSpecificTemplateCheck };