#!/usr/bin/env node

/**
 * 动态指导生成系统有效性验证测试
 * Dynamic Guidance Generation System Effectiveness Validation Test
 * 
 * 通过多种技术场景测试验证动态指导生成系统的有效性
 * Verify the effectiveness of dynamic guidance generation system through multiple technical scenarios
 */

import { TaskAttributeGenerator } from './dist/utils/TaskAttributeGenerator.js';
import { DynamicGuidanceGenerator } from './dist/utils/DynamicGuidanceGenerator.js';
import { OperationType } from './dist/types/semanticAnalysis.js';

console.log('🎯 动态指导生成系统有效性验证测试');
console.log('='.repeat(60));

/**
 * 测试场景定义
 * Test scenario definitions
 */
const testScenarios = [
  {
    name: 'React + TypeScript 前端组件开发',
    description: '创建React组件，使用TypeScript类型定义，实现用户界面交互功能',
    semanticAnalysis: {
      operationType: OperationType.CREATE,
      keywords: ['react', 'typescript', 'component', 'interface', 'useState', 'props'],
      entities: ['React', 'TypeScript', 'Component'],
      implementationGuidance: {
        techStackGuidance: ['使用React Hooks', '实现TypeScript接口'],
        bestPractices: ['组件化设计', '类型安全'],
        riskAlerts: []
      },
      complexityIndicators: {
        complexityScore: 35,
        technicalComplexity: 'MEDIUM',
        businessComplexity: 'LOW',
        integrationComplexity: 'LOW',
        timeComplexity: 'LOW'
      },
      priority: 'P1'
    },
    expectedKeywords: ['React', 'TypeScript', 'useState', 'Props', '组件']
  },
  
  {
    name: 'Node.js + JWT 认证系统',
    description: '使用Node.js和Express创建JWT认证中间件，集成bcrypt密码哈希',
    semanticAnalysis: {
      operationType: OperationType.CREATE,
      keywords: ['nodejs', 'express', 'jwt', 'bcrypt', 'authentication', 'middleware'],
      entities: ['Node.js', 'Express', 'JWT', 'bcrypt'],
      implementationGuidance: {
        techStackGuidance: ['使用Express框架', '实现JWT令牌'],
        bestPractices: ['安全认证', '中间件设计'],
        riskAlerts: ['安全风险']
      },
      complexityIndicators: {
        complexityScore: 55,
        technicalComplexity: 'HIGH',
        businessComplexity: 'MEDIUM',
        integrationComplexity: 'MEDIUM',
        timeComplexity: 'MEDIUM'
      },
      priority: 'P0'
    },
    expectedKeywords: ['Node.js', 'JWT', 'Express', 'bcrypt', '认证']
  },
  
  {
    name: 'MongoDB 数据库设计',
    description: '设计MongoDB数据模型，实现数据验证和索引策略',
    semanticAnalysis: {
      operationType: OperationType.CREATE,
      keywords: ['mongodb', 'database', 'schema', 'index', 'validation'],
      entities: ['MongoDB', 'Database', 'Schema'],
      implementationGuidance: {
        techStackGuidance: ['使用MongoDB', '设计数据模型'],
        bestPractices: ['数据库设计', '性能优化'],
        riskAlerts: []
      },
      complexityIndicators: {
        complexityScore: 45,
        technicalComplexity: 'MEDIUM',
        businessComplexity: 'MEDIUM',
        integrationComplexity: 'LOW',
        timeComplexity: 'MEDIUM'
      },
      priority: 'P1'
    },
    expectedKeywords: ['MongoDB', 'Schema', '数据模型', '索引']
  },
  
  {
    name: 'Docker 容器化部署',
    description: '创建Docker容器配置，实现应用程序的容器化部署',
    semanticAnalysis: {
      operationType: OperationType.DEPLOY,
      keywords: ['docker', 'container', 'deployment', 'kubernetes'],
      entities: ['Docker', 'Container', 'Kubernetes'],
      implementationGuidance: {
        techStackGuidance: ['使用Docker', '容器编排'],
        bestPractices: ['容器化部署', '微服务架构'],
        riskAlerts: []
      },
      complexityIndicators: {
        complexityScore: 60,
        technicalComplexity: 'HIGH',
        businessComplexity: 'LOW',
        integrationComplexity: 'HIGH',
        timeComplexity: 'MEDIUM'
      },
      priority: 'P1'
    },
    expectedKeywords: ['Docker', 'Container', '容器', '部署']
  },
  
  {
    name: '通用代码重构',
    description: '重构现有代码，改进代码结构和可维护性',
    semanticAnalysis: {
      operationType: OperationType.REFACTOR,
      keywords: ['refactor', 'code', 'structure', 'maintainability'],
      entities: ['Code', 'Structure'],
      implementationGuidance: {
        techStackGuidance: [],
        bestPractices: ['代码重构', '可维护性'],
        riskAlerts: []
      },
      complexityIndicators: {
        complexityScore: 25,
        technicalComplexity: 'LOW',
        businessComplexity: 'LOW',
        integrationComplexity: 'LOW',
        timeComplexity: 'LOW'
      },
      priority: 'P2'
    },
    expectedKeywords: ['重构', '代码结构', '可维护性']
  }
];

/**
 * 验证结果统计
 * Validation result statistics
 */
const validationResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  differentiationScore: 0,
  specificityScore: 0,
  results: []
};

/**
 * 执行单个测试场景
 * Execute single test scenario
 */
function executeTestScenario(scenario) {
  console.log(`\n📋 测试场景: ${scenario.name}`);
  console.log(`📝 描述: ${scenario.description}`);
  
  try {
    // 生成动态指导
    const dynamicGuidance = DynamicGuidanceGenerator.generateTechStackAwareGuidance(
      scenario.semanticAnalysis,
      scenario.semanticAnalysis.operationType
    );
    
    console.log('🎯 生成的动态指导:');
    dynamicGuidance.forEach((guidance, index) => {
      console.log(`  ${index + 1}. ${guidance}`);
    });
    
    // 验证差异化程度
    const differentiationScore = calculateDifferentiation(dynamicGuidance, scenario);
    
    // 验证具体性程度
    const specificityScore = calculateSpecificity(dynamicGuidance, scenario);
    
    // 验证预期关键词覆盖
    const keywordCoverage = calculateKeywordCoverage(dynamicGuidance, scenario);
    
    const testResult = {
      scenario: scenario.name,
      passed: differentiationScore >= 70 && specificityScore >= 70 && keywordCoverage >= 50,
      differentiationScore,
      specificityScore,
      keywordCoverage,
      guidanceCount: dynamicGuidance.length,
      guidance: dynamicGuidance
    };
    
    console.log(`📊 验证结果:`);
    console.log(`  差异化程度: ${differentiationScore}%`);
    console.log(`  具体性程度: ${specificityScore}%`);
    console.log(`  关键词覆盖: ${keywordCoverage}%`);
    console.log(`  测试结果: ${testResult.passed ? '✅ 通过' : '❌ 失败'}`);
    
    return testResult;
    
  } catch (error) {
    console.error(`❌ 测试执行失败: ${error.message}`);
    return {
      scenario: scenario.name,
      passed: false,
      error: error.message,
      differentiationScore: 0,
      specificityScore: 0,
      keywordCoverage: 0
    };
  }
}

/**
 * 计算差异化程度
 * Calculate differentiation level
 */
function calculateDifferentiation(guidance, scenario) {
  // 检查是否包含技术栈特定内容
  const techStackKeywords = scenario.expectedKeywords;
  let techStackMatches = 0;
  
  guidance.forEach(item => {
    techStackKeywords.forEach(keyword => {
      if (item.toLowerCase().includes(keyword.toLowerCase())) {
        techStackMatches++;
      }
    });
  });
  
  // 检查是否避免了通用模板语言
  const genericPhrases = [
    '确保新建组件的可测试性和可维护性',
    '遵循项目的编码规范和架构模式',
    '考虑组件的可扩展性和复用性'
  ];
  
  let genericMatches = 0;
  guidance.forEach(item => {
    genericPhrases.forEach(phrase => {
      if (item.includes(phrase)) {
        genericMatches++;
      }
    });
  });
  
  // 差异化分数 = (技术栈匹配度 * 80) + (避免通用模板 * 20)
  const techStackScore = Math.min(100, (techStackMatches / techStackKeywords.length) * 100);
  const avoidGenericScore = genericMatches === 0 ? 100 : Math.max(0, 100 - (genericMatches * 50));
  
  return Math.round(techStackScore * 0.8 + avoidGenericScore * 0.2);
}

/**
 * 计算具体性程度
 * Calculate specificity level
 */
function calculateSpecificity(guidance, scenario) {
  let specificityScore = 0;
  
  guidance.forEach(item => {
    // 检查是否包含具体的技术术语
    const technicalTerms = ['API', 'JWT', 'React', 'MongoDB', 'Docker', 'TypeScript', 'Express', 'bcrypt'];
    const hasTechnicalTerms = technicalTerms.some(term => 
      item.toLowerCase().includes(term.toLowerCase())
    );
    
    // 检查是否包含具体的操作步骤
    const actionWords = ['实现', '配置', '设计', '创建', '添加', '建立', '优化'];
    const hasActionWords = actionWords.some(word => item.includes(word));
    
    // 检查是否包含具体的技术细节
    const technicalDetails = ['中间件', '令牌', '组件', '接口', '索引', '容器', '镜像'];
    const hasTechnicalDetails = technicalDetails.some(detail => item.includes(detail));
    
    if (hasTechnicalTerms) specificityScore += 30;
    if (hasActionWords) specificityScore += 30;
    if (hasTechnicalDetails) specificityScore += 40;
  });
  
  return Math.min(100, Math.round(specificityScore / guidance.length));
}

/**
 * 计算关键词覆盖率
 * Calculate keyword coverage
 */
function calculateKeywordCoverage(guidance, scenario) {
  const expectedKeywords = scenario.expectedKeywords;
  let coveredKeywords = 0;
  
  expectedKeywords.forEach(keyword => {
    const isKeywordCovered = guidance.some(item => 
      item.toLowerCase().includes(keyword.toLowerCase())
    );
    if (isKeywordCovered) {
      coveredKeywords++;
    }
  });
  
  return Math.round((coveredKeywords / expectedKeywords.length) * 100);
}

/**
 * 执行所有测试场景
 * Execute all test scenarios
 */
function runAllTests() {
  console.log('🚀 开始执行所有测试场景...\n');
  
  testScenarios.forEach(scenario => {
    const result = executeTestScenario(scenario);
    validationResults.results.push(result);
    validationResults.totalTests++;
    
    if (result.passed) {
      validationResults.passedTests++;
    } else {
      validationResults.failedTests++;
    }
    
    validationResults.differentiationScore += result.differentiationScore || 0;
    validationResults.specificityScore += result.specificityScore || 0;
  });
  
  // 计算平均分数
  validationResults.differentiationScore = Math.round(
    validationResults.differentiationScore / validationResults.totalTests
  );
  validationResults.specificityScore = Math.round(
    validationResults.specificityScore / validationResults.totalTests
  );
}

/**
 * 生成验证报告
 * Generate validation report
 */
function generateValidationReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 动态指导生成系统验证报告');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 总体测试结果:`);
  console.log(`  总测试数: ${validationResults.totalTests}`);
  console.log(`  通过测试: ${validationResults.passedTests}`);
  console.log(`  失败测试: ${validationResults.failedTests}`);
  console.log(`  成功率: ${Math.round((validationResults.passedTests / validationResults.totalTests) * 100)}%`);
  
  console.log(`\n📈 系统性能指标:`);
  console.log(`  平均差异化程度: ${validationResults.differentiationScore}%`);
  console.log(`  平均具体性程度: ${validationResults.specificityScore}%`);
  
  console.log(`\n📋 详细测试结果:`);
  validationResults.results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${index + 1}. ${status} ${result.scenario}`);
    if (result.error) {
      console.log(`     错误: ${result.error}`);
    } else {
      console.log(`     差异化: ${result.differentiationScore}%, 具体性: ${result.specificityScore}%, 覆盖率: ${result.keywordCoverage}%`);
    }
  });
  
  // 生成结论
  const overallSuccess = validationResults.passedTests >= validationResults.totalTests * 0.8;
  const avgDifferentiation = validationResults.differentiationScore >= 70;
  const avgSpecificity = validationResults.specificityScore >= 70;
  
  console.log(`\n🎯 验证结论:`);
  if (overallSuccess && avgDifferentiation && avgSpecificity) {
    console.log('✅ 动态指导生成系统验证通过！');
    console.log('   系统能够基于不同技术上下文生成差异化的、具体的、可执行的指导内容');
    console.log('   固定模板重复问题已成功解决');
  } else {
    console.log('❌ 动态指导生成系统验证失败');
    if (!overallSuccess) console.log('   - 测试通过率不足80%');
    if (!avgDifferentiation) console.log('   - 差异化程度不足70%');
    if (!avgSpecificity) console.log('   - 具体性程度不足70%');
  }
  
  return {
    success: overallSuccess && avgDifferentiation && avgSpecificity,
    passRate: Math.round((validationResults.passedTests / validationResults.totalTests) * 100),
    differentiationScore: validationResults.differentiationScore,
    specificityScore: validationResults.specificityScore,
    details: validationResults.results
  };
}

/**
 * 主执行函数
 * Main execution function
 */
function main() {
  try {
    console.log('🚀 开始执行验证测试...');
    runAllTests();
    const report = generateValidationReport();
    
    console.log('\n✅ 验证测试完成');
    // 返回验证结果供外部使用
    return report;
    
  } catch (error) {
    console.error('❌ 验证测试执行失败:', error);
    console.error('错误堆栈:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

// 如果直接运行此脚本
console.log('🔍 检查执行条件...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// 直接执行main函数
main();

export {
  main,
  testScenarios,
  executeTestScenario,
  generateValidationReport
};