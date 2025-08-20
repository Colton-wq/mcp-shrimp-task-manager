/**
 * 新模板效果测试
 * New template effectiveness test
 */

import { getPlanTaskPrompt } from './generators/planTask.js';
import { getAnalyzeTaskPrompt } from './generators/analyzeTask.js';

/**
 * 测试新的业务导向模板
 * Test new business-oriented templates
 */
export async function testNewTemplates() {
  console.log('=== 新模板效果测试 ===\n');

  let planTaskResult = '';
  let analyzeTaskResult = '';

  // 测试场景1: planTask模板
  console.log('📋 测试planTask模板 - 业务导向');
  try {
    planTaskResult = await getPlanTaskPrompt({
      description: '创建一个用户反馈收集系统',
      requirements: '需要支持多种反馈类型，包括文字、评分和文件上传',
      existingTasksReference: false,
      memoryDir: './memory'
    });
    
    console.log('planTask模板输出:');
    console.log(planTaskResult);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('planTask测试失败:', error);
  }

  // 测试场景2: analyzeTask模板
  console.log('📋 测试analyzeTask模板 - 业务导向');
  try {
    analyzeTaskResult = await getAnalyzeTaskPrompt({
      summary: '用户反馈收集系统设计',
      initialConcept: '使用React前端 + Node.js后端 + MongoDB数据库的架构',
      analysisType: 'auto'
    });
    
    console.log('analyzeTask模板输出:');
    console.log(analyzeTaskResult);
    console.log('\n' + '='.repeat(80) + '\n');
  } catch (error) {
    console.error('analyzeTask测试失败:', error);
  }

  // 测试场景3: 对比模板长度
  console.log('📊 模板长度对比分析');
  try {
    const planTaskLines = planTaskResult.split('\n').length;
    const analyzeTaskLines = analyzeTaskResult.split('\n').length;
    
    console.log(`planTask模板行数: ${planTaskLines} (目标: 50-80行)`);
    console.log(`analyzeTask模板行数: ${analyzeTaskLines} (目标: 50-80行)`);
    
    // 检查是否包含业务导向关键词
    const businessKeywords = ['业务目标', '最简', '用户', 'business', 'simple', 'user'];
    const planTaskBusinessFocus = businessKeywords.some(keyword => 
      planTaskResult.toLowerCase().includes(keyword.toLowerCase())
    );
    const analyzeTaskBusinessFocus = businessKeywords.some(keyword => 
      analyzeTaskResult.toLowerCase().includes(keyword.toLowerCase())
    );
    
    console.log(`planTask业务导向: ${planTaskBusinessFocus ? '✅' : '❌'}`);
    console.log(`analyzeTask业务导向: ${analyzeTaskBusinessFocus ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('对比分析失败:', error);
  }
}

/**
 * 测试模板的业务确认机制
 * Test business confirmation mechanism in templates
 */
export async function testBusinessConfirmationMechanism() {
  console.log('=== 业务确认机制测试 ===\n');

  const testCases = [
    {
      name: '问题解决场景',
      description: '修复用户登录时的验证错误',
      requirements: '确保不影响现有用户体验'
    },
    {
      name: '功能开发场景', 
      description: '开发新的数据导出功能',
      requirements: '支持Excel和CSV格式导出'
    },
    {
      name: '性能优化场景',
      description: '优化数据库查询性能',
      requirements: '将查询时间从2秒降低到500ms以内'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🧪 测试: ${testCase.name}`);
    
    try {
      const result = await getPlanTaskPrompt({
        description: testCase.description,
        requirements: testCase.requirements,
        existingTasksReference: false,
        memoryDir: './memory'
      });

      // 检查是否包含业务确认问题
      const hasBusinessConfirmation = result.includes('业务目标确认') || 
                                    result.includes('Business Goal Confirmation') ||
                                    result.includes('REAL business goal');
      
      // 检查是否包含简化提醒
      const hasSimplificationReminder = result.includes('最简') || 
                                       result.includes('simplest') ||
                                       result.includes('简化');

      // 检查是否包含工具使用指导
      const hasToolGuidance = result.includes('codebase-retrieval') ||
                             result.includes('search_code_desktop-commander') ||
                             result.includes('Everything MCP');

      console.log(`   业务确认机制: ${hasBusinessConfirmation ? '✅' : '❌'}`);
      console.log(`   简化提醒: ${hasSimplificationReminder ? '✅' : '❌'}`);
      console.log(`   工具指导: ${hasToolGuidance ? '✅' : '❌'}`);
      console.log('');
      
    } catch (error) {
      console.error(`   测试失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testNewTemplates().then(() => {
    return testBusinessConfirmationMechanism();
  }).catch(console.error);
}