/**
 * 上下文感知机制测试
 * Context awareness mechanism test
 */

import { generatePrompt } from './loader.js';

/**
 * 测试不同场景下的上下文感知效果
 * Test context awareness effects in different scenarios
 */
export function testContextAwareness() {
  console.log('=== 上下文感知机制测试 ===\n');

  // 测试场景1: 问题解决场景
  console.log('📋 测试场景1: 问题解决');
  const problemSolvingResult = generatePrompt(
    '请分析以下任务: {description}',
    {
      description: '修复用户登录时出现的验证错误问题',
      requirements: '需要确保用户体验不受影响',
      enableContextAnalysis: true
    }
  );
  console.log(problemSolvingResult);
  console.log('\n' + '='.repeat(50) + '\n');

  // 测试场景2: 功能实现场景
  console.log('📋 测试场景2: 功能实现');
  const featureImplementationResult = generatePrompt(
    '请分析以下任务: {description}',
    {
      description: '创建一个新的用户管理界面',
      requirements: '需要支持用户增删改查功能',
      enableContextAnalysis: true
    }
  );
  console.log(featureImplementationResult);
  console.log('\n' + '='.repeat(50) + '\n');

  // 测试场景3: 性能优化场景
  console.log('📋 测试场景3: 性能优化');
  const performanceOptimizationResult = generatePrompt(
    '请分析以下任务: {description}',
    {
      description: '优化数据库查询性能',
      requirements: '目前查询响应时间过长，影响用户体验',
      enableContextAnalysis: true
    }
  );
  console.log(performanceOptimizationResult);
  console.log('\n' + '='.repeat(50) + '\n');

  // 测试场景4: 无上下文感知对比
  console.log('📋 对比测试: 无上下文感知');
  const noContextResult = generatePrompt(
    '请分析以下任务: {description}',
    {
      description: '修复用户登录时出现的验证错误问题',
      requirements: '需要确保用户体验不受影响',
      enableContextAnalysis: false
    }
  );
  console.log(noContextResult);
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * 测试上下文分析器的各个组件
 * Test individual components of context analyzer
 */
export async function testContextAnalyzerComponents() {
  console.log('=== 上下文分析器组件测试 ===\n');

  try {
    // 动态导入上下文分析器
    const { ContextAnalyzer } = await import('./contextAnalyzer.js');

    // 测试不同类型的任务描述
    const testCases = [
      {
        name: 'Web开发任务',
        description: '创建一个响应式的用户注册页面，使用React和TypeScript',
        requirements: '需要支持表单验证和错误处理'
      },
      {
        name: 'API开发任务',
        description: '实现用户认证的REST API接口',
        requirements: '需要支持JWT token和角色权限控制'
      },
      {
        name: '数据库任务',
        description: '优化用户查询的SQL性能',
        requirements: '当前查询时间超过2秒，需要优化到500ms以内'
      },
      {
        name: '问题修复任务',
        description: '修复支付流程中的并发问题',
        requirements: '用户反馈支付时偶尔出现重复扣款'
      }
    ];

    testCases.forEach((testCase, index) => {
      console.log(`📊 测试案例 ${index + 1}: ${testCase.name}`);
      const analysis = ContextAnalyzer.analyzeContext(
        testCase.description,
        testCase.requirements
      );
      
      console.log(`   业务领域: ${analysis.businessDomain}`);
      console.log(`   任务复杂度: ${analysis.taskComplexity}`);
      console.log(`   业务意图: ${analysis.businessIntent}`);
      console.log(`   建议模板: ${analysis.suggestedTemplate}`);
      console.log(`   业务确认: ${analysis.businessGoalConfirmation}`);
      console.log(`   推荐工具: ${analysis.toolRecommendations.join(', ')}`);
      console.log(`   简化建议: ${analysis.simplificationOpportunities.join(', ') || '无'}`);
      console.log('');
    });

  } catch (error) {
    console.error('上下文分析器测试失败:', error);
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testContextAwareness();
  testContextAnalyzerComponents();
}