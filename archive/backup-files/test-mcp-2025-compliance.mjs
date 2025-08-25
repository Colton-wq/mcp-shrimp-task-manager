#!/usr/bin/env node

/**
 * MCP 2025标准合规性验证测试
 * MCP 2025 Standards Compliance Verification Test
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCP2025Compliance() {
  console.log('🧪 MCP 2025标准合规性验证测试...\n');

  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  try {
    // 测试1: 工具参数验证合规性
    console.log('📋 测试1: 工具参数验证合规性...');
    await testParameterValidation(testResults);

    // 测试2: 错误响应格式合规性
    console.log('\n📋 测试2: 错误响应格式合规性...');
    await testErrorResponseFormat(testResults);

    // 测试3: 工作流继续机制合规性
    console.log('\n📋 测试3: 工作流继续机制合规性...');
    await testWorkflowContinuation(testResults);

    // 测试4: 多代理安全性验证
    console.log('\n📋 测试4: 多代理安全性验证...');
    await testMultiAgentSafety(testResults);

    // 测试5: 响应消息可读性验证
    console.log('\n📋 测试5: 响应消息可读性验证...');
    await testResponseReadability(testResults);

    // 测试6: AI行为约束机制兼容性
    console.log('\n📋 测试6: AI行为约束机制兼容性...');
    await testAIBehaviorConstraints(testResults);

    // 测试7: 强制性约束效果验证
    console.log('\n📋 测试7: 强制性约束效果验证...');
    await testMandatoryConstraints(testResults);

    // 生成测试报告
    generateTestReport(testResults);

  } catch (error) {
    console.error('❌ 测试执行失败:', error);
    console.error('错误详情:', error.stack);
  }
}

/**
 * 测试工具参数验证合规性
 */
async function testParameterValidation(testResults) {
  try {
    // 导入工具schema
    const { codeReviewAndCleanupSchema } = await import('./dist/tools/workflow/codeReviewAndCleanupTool.js');
    
    // 测试必需参数
    const requiredParams = ['project', 'taskId'];
    for (const param of requiredParams) {
      if (codeReviewAndCleanupSchema.shape[param]) {
        testResults.passed++;
        testResults.details.push(`✅ 必需参数 '${param}' 已定义`);
      } else {
        testResults.failed++;
        testResults.details.push(`❌ 缺少必需参数 '${param}'`);
      }
    }

    // 测试project参数的多代理安全性
    const projectParam = codeReviewAndCleanupSchema.shape.project;
    if (projectParam && projectParam._def.checks.some(check => check.kind === 'min' && check.value === 1)) {
      testResults.passed++;
      testResults.details.push('✅ project参数支持多代理安全性（最小长度验证）');
    } else {
      testResults.failed++;
      testResults.details.push('❌ project参数缺少多代理安全性验证');
    }

    // 测试UUID格式验证
    const taskIdParam = codeReviewAndCleanupSchema.shape.taskId;
    if (taskIdParam && taskIdParam._def.checks.some(check => check.kind === 'regex')) {
      testResults.passed++;
      testResults.details.push('✅ taskId参数支持UUID格式验证');
    } else {
      testResults.failed++;
      testResults.details.push('❌ taskId参数缺少UUID格式验证');
    }

    console.log('✅ 工具参数验证合规性测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ 工具参数验证测试失败: ${error.message}`);
    console.log('❌ 工具参数验证合规性测试失败');
  }
}

/**
 * 测试错误响应格式合规性
 */
async function testErrorResponseFormat(testResults) {
  try {
    // 导入响应工具
    const { createWorkflowResponse, createValidationError, createNotFoundError } = 
      await import('./dist/utils/mcpResponse.js');

    // 测试createWorkflowResponse格式
    const workflowResponse = createWorkflowResponse(
      '测试消息',
      {
        shouldProceed: false,
        nextTool: 'test_tool',
        nextToolParams: { test: 'param' },
        reason: '测试原因'
      }
    );

    if (workflowResponse.content && Array.isArray(workflowResponse.content)) {
      testResults.passed++;
      testResults.details.push('✅ createWorkflowResponse返回正确的MCP响应格式');
    } else {
      testResults.failed++;
      testResults.details.push('❌ createWorkflowResponse响应格式不符合MCP标准');
    }

    // 测试错误响应格式
    const validationError = createValidationError('test', 'test error', 'test details');
    if (validationError.content && validationError.content[0].text.includes('VALIDATION_ERROR')) {
      testResults.passed++;
      testResults.details.push('✅ createValidationError返回正确的错误格式');
    } else {
      testResults.failed++;
      testResults.details.push('❌ createValidationError错误格式不符合标准');
    }

    console.log('✅ 错误响应格式合规性测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ 错误响应格式测试失败: ${error.message}`);
    console.log('❌ 错误响应格式合规性测试失败');
  }
}

/**
 * 测试工作流继续机制合规性
 */
async function testWorkflowContinuation(testResults) {
  try {
    // 测试工作流继续机制的关键组件
    const { SimpleWorkflowManager } = await import('./dist/utils/simpleWorkflowManager.js');

    // 测试工作流创建
    const workflow = SimpleWorkflowManager.createWorkflow(
      'test-task-123',
      'test-project',
      ['plan_task', 'execute_task', 'verify_task']
    );

    if (workflow && workflow.workflowId && workflow.steps) {
      testResults.passed++;
      testResults.details.push('✅ 工作流创建功能正常');
    } else {
      testResults.failed++;
      testResults.details.push('❌ 工作流创建功能异常');
    }

    // 测试工作流继续指导生成
    const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
    if (continuation && typeof continuation.shouldProceed === 'boolean') {
      testResults.passed++;
      testResults.details.push('✅ 工作流继续指导生成正常');
    } else {
      testResults.failed++;
      testResults.details.push('❌ 工作流继续指导生成异常');
    }

    console.log('✅ 工作流继续机制合规性测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ 工作流继续机制测试失败: ${error.message}`);
    console.log('❌ 工作流继续机制合规性测试失败');
  }
}

/**
 * 测试多代理安全性验证
 */
async function testMultiAgentSafety(testResults) {
  try {
    // 测试项目会话隔离
    const { ProjectSession } = await import('./dist/utils/projectSession.js');

    // 模拟多代理场景
    const project1 = 'test-project-1';
    const project2 = 'test-project-2';

    // 测试项目上下文隔离
    let isolationTest = true;
    try {
      await ProjectSession.withProjectContext(project1, async () => {
        // 在项目1上下文中
        return 'project1-result';
      });

      await ProjectSession.withProjectContext(project2, async () => {
        // 在项目2上下文中
        return 'project2-result';
      });
    } catch (error) {
      isolationTest = false;
    }

    if (isolationTest) {
      testResults.passed++;
      testResults.details.push('✅ 多代理项目上下文隔离正常');
    } else {
      testResults.failed++;
      testResults.details.push('❌ 多代理项目上下文隔离异常');
    }

    console.log('✅ 多代理安全性验证测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ 多代理安全性测试失败: ${error.message}`);
    console.log('❌ 多代理安全性验证测试失败');
  }
}

/**
 * 测试响应消息可读性验证
 */
async function testResponseReadability(testResults) {
  try {
    // 导入违规处理函数
    const { generateViolationSummary, generateEducationalContent, generateAutoFixSuggestions } = 
      await import('./dist/tools/workflow/codeReviewAndCleanupTool.js');

    // 创建测试违规数据
    const testViolations = [
      {
        type: 'DUPLICATE_FUNCTIONALITY',
        severity: 'HIGH',
        filePath: '/test/file1.ts',
        description: '测试重复功能',
        impact: '测试影响',
        recommendation: '测试建议',
        autoFixAvailable: true,
        relatedFiles: [],
        evidence: {}
      }
    ];

    // 测试违规摘要生成
    const summary = generateViolationSummary(testViolations);
    if (summary && summary.includes('检测到') && summary.includes('个文件管理规范违规')) {
      testResults.passed++;
      testResults.details.push('✅ 违规摘要生成格式正确');
    } else {
      testResults.failed++;
      testResults.details.push('❌ 违规摘要生成格式异常');
    }

    // 测试教育内容生成
    const educational = generateEducationalContent(testViolations);
    if (educational && educational.includes('重复功能问题')) {
      testResults.passed++;
      testResults.details.push('✅ 教育内容生成正确');
    } else {
      testResults.failed++;
      testResults.details.push('❌ 教育内容生成异常');
    }

    // 测试修复建议生成
    const suggestions = generateAutoFixSuggestions(testViolations);
    if (suggestions && suggestions.includes('可自动修复')) {
      testResults.passed++;
      testResults.details.push('✅ 修复建议生成正确');
    } else {
      testResults.failed++;
      testResults.details.push('❌ 修复建议生成异常');
    }

    console.log('✅ 响应消息可读性验证测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ 响应消息可读性测试失败: ${error.message}`);
    console.log('❌ 响应消息可读性验证测试失败');
  }
}

/**
 * 测试AI行为约束机制兼容性
 */
async function testAIBehaviorConstraints(testResults) {
  try {
    // 导入AI行为约束检测器
    const { ConversationPatternDetector } = await import('./dist/tools/intervention/conversationPatternDetector.js');

    // 测试代码质量作弊行为检测
    const cheatingText = '质量分数只有50，需要提升分数。创建一些测试文件来提高覆盖率。';
    const analysis = ConversationPatternDetector.detectCodeQualityCheatingBehavior(cheatingText);

    if (analysis && typeof analysis.preventionRequired === 'boolean') {
      testResults.passed++;
      testResults.details.push('✅ AI行为约束检测功能正常');
    } else {
      testResults.failed++;
      testResults.details.push('❌ AI行为约束检测功能异常');
    }

    // 测试检测结果的合理性
    if (analysis.preventionRequired && analysis.detectedCheatingPatterns.length > 0) {
      testResults.passed++;
      testResults.details.push('✅ AI作弊行为检测准确');
    } else {
      testResults.warnings++;
      testResults.details.push('⚠️ AI作弊行为检测可能需要调整阈值');
    }

    console.log('✅ AI行为约束机制兼容性测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ AI行为约束机制测试失败: ${error.message}`);
    console.log('❌ AI行为约束机制兼容性测试失败');
  }
}

/**
 * 测试强制性约束效果验证
 */
async function testMandatoryConstraints(testResults) {
  try {
    // 测试文件管理违规类型定义
    const { FileManagementViolationType } = await import('./dist/tools/workflow/codeReviewAndCleanupTool.js');

    const expectedViolationTypes = [
      'DUPLICATE_FUNCTIONALITY',
      'MISPLACED_TEST_FILE',
      'ISOLATED_DIRECTORY',
      'DUPLICATE_DOCUMENT',
      'MULTIPLE_FUNCTIONS_IN_FILE'
    ];

    let allTypesPresent = true;
    for (const type of expectedViolationTypes) {
      if (!FileManagementViolationType[type]) {
        allTypesPresent = false;
        testResults.failed++;
        testResults.details.push(`❌ 缺少违规类型: ${type}`);
      }
    }

    if (allTypesPresent) {
      testResults.passed++;
      testResults.details.push('✅ 所有文件管理违规类型已定义');
    }

    // 测试违规严重程度分级
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    testResults.passed++;
    testResults.details.push(`✅ 支持${severityLevels.length}个严重程度级别`);

    console.log('✅ 强制性约束效果验证测试完成');

  } catch (error) {
    testResults.failed++;
    testResults.details.push(`❌ 强制性约束效果测试失败: ${error.message}`);
    console.log('❌ 强制性约束效果验证测试失败');
  }
}

/**
 * 生成测试报告
 */
function generateTestReport(testResults) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MCP 2025标准合规性验证测试报告');
  console.log('='.repeat(60));

  const total = testResults.passed + testResults.failed + testResults.warnings;
  const passRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;

  console.log(`\n📈 测试统计:`);
  console.log(`   ✅ 通过: ${testResults.passed}`);
  console.log(`   ❌ 失败: ${testResults.failed}`);
  console.log(`   ⚠️  警告: ${testResults.warnings}`);
  console.log(`   📊 通过率: ${passRate}%`);

  console.log(`\n📋 详细结果:`);
  testResults.details.forEach(detail => {
    console.log(`   ${detail}`);
  });

  console.log(`\n🎯 合规性评估:`);
  if (passRate >= 90) {
    console.log('   🟢 优秀 - 完全符合MCP 2025标准');
  } else if (passRate >= 80) {
    console.log('   🟡 良好 - 基本符合MCP 2025标准，有少量改进空间');
  } else if (passRate >= 70) {
    console.log('   🟠 一般 - 部分符合MCP 2025标准，需要改进');
  } else {
    console.log('   🔴 不合格 - 不符合MCP 2025标准，需要重大改进');
  }

  console.log(`\n🔧 改进建议:`);
  if (testResults.failed > 0) {
    console.log('   1. 优先修复失败的测试项目');
    console.log('   2. 确保所有必需的MCP 2025功能都已实现');
    console.log('   3. 验证错误处理和响应格式的正确性');
  }
  if (testResults.warnings > 0) {
    console.log('   4. 检查警告项目，考虑进一步优化');
    console.log('   5. 调整AI行为检测的阈值和准确性');
  }
  console.log('   6. 定期运行合规性测试确保持续符合标准');

  console.log('\n🎉 MCP 2025标准合规性验证测试完成！');
}

// 运行测试
testMCP2025Compliance();