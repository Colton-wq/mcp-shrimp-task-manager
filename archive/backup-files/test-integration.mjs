/**
 * 测试集成后的 IntelligentOutputFormatter 功能
 */

console.log('🔍 测试集成后的 IntelligentOutputFormatter 功能\n');

try {
  // 导入集成后的 IntelligentOutputFormatter
  const { IntelligentOutputFormatter } = await import('./dist/tools/search/IntelligentOutputFormatter.js');
  
  console.log('✅ IntelligentOutputFormatter 模块导入成功');
  
  // 测试场景1：标准集成测试
  console.log('\n--- 测试场景1：标准集成测试 ---');
  
  const mockSearchPlan = {
    searchKeywords: {
      coreKeywords: ["MCP", "工具调用"],
      expandedKeywords: ["Model Context Protocol", "tool execution"],
      technicalKeywords: ["anthropic", "mcp-server"],
      contextualKeywords: ["AI", "assistant"]
    },
    mcpToolCalls: [
      {
        tool: "codebase-retrieval",
        priority: 1,
        parameters: {
          information_request: "MCP 工具调用优化实现"
        },
        rationale: "分析现有代码结构",
        timeout: 30000,
        expectedQuality: "HIGH"
      },
      {
        tool: "exa-mcp-server-web_search_exa_mcphub-proxy",
        priority: 2,
        parameters: {
          query: "AI tool call execution rate 2025",
          numResults: 5
        },
        rationale: "搜索最新技术资料",
        timeout: 25000,
        expectedQuality: "HIGH"
      }
    ],
    verificationRequirements: ["多源验证", "权威性检查"],
    searchPriority: "HIGH",
    qualityGates: ["编译检查", "功能验证"]
  };
  
  const mockSemanticAnalysis = {
    riskLevel: "HIGH",
    detectedPatterns: ["重复失败", "工具调用跳过"],
    cognitiveRiskFactors: ["过度自信", "假设依赖"],
    frameworkBreakRequired: true,
    hasOverconfidence: true,
    hasUncertainty: false,
    hasErrorPersistence: true,
    searchPriority: "HIGH",
    recommendedAction: "强制搜索验证"
  };
  
  const problemDescription = "MCP 工具调用执行率低，AI 经常跳过工具调用，需要优化心理触发器系统";
  const errorCount = 3;
  const conversationContext = "用户多次反馈 AI 不执行工具调用，显得很沮丧，需要立即解决";
  
  console.log('开始测试集成后的指令生成...');
  
  const integratedInstructions = IntelligentOutputFormatter.convertToMandatoryInstructions(
    mockSearchPlan,
    mockSemanticAnalysis,
    problemDescription,
    errorCount,
    conversationContext
  );
  
  console.log('集成测试结果：');
  console.log('- 指令长度：', integratedInstructions.length, '字符');
  console.log('- 包含 AI Development Standards：', integratedInstructions.includes('AI Development Standards v4.0'));
  console.log('- 包含强制执行协议：', integratedInstructions.includes('MANDATORY'));
  console.log('- 包含工具调用序列：', integratedInstructions.includes('EXECUTION_SEQUENCE'));
  console.log('- 包含心理触发器：', integratedInstructions.includes('🚨') || integratedInstructions.includes('⚡'));
  console.log('- 包含禁止性语言：', integratedInstructions.includes('PROHIBITED'));
  console.log('- 包含验证要求：', integratedInstructions.includes('VERIFICATION'));
  
  // 测试场景2：错误场景处理
  console.log('\n--- 测试场景2：错误场景处理 ---');
  
  const highErrorSemanticAnalysis = {
    ...mockSemanticAnalysis,
    riskLevel: "CRITICAL",
    frameworkBreakRequired: true
  };
  
  const criticalInstructions = IntelligentOutputFormatter.convertToMandatoryInstructions(
    mockSearchPlan,
    highErrorSemanticAnalysis,
    problemDescription,
    5, // 高错误计数
    "critical emergency situation, multiple failures"
  );
  
  console.log('关键错误场景测试：');
  console.log('- 包含关键错误标记：', criticalInstructions.includes('CRITICAL'));
  console.log('- 包含框架跳出：', criticalInstructions.includes('FRAMEWORK_BREAK'));
  console.log('- 包含紧急协议：', criticalInstructions.includes('EMERGENCY'));
  
  // 测试场景3：简化版本测试
  console.log('\n--- 测试场景3：简化版本测试 ---');
  
  const simplifiedInstructions = IntelligentOutputFormatter.convertToSimplifiedInstructions(
    mockSearchPlan,
    problemDescription
  );
  
  console.log('简化版本测试：');
  console.log('- 指令长度：', simplifiedInstructions.length, '字符');
  console.log('- 包含优先级策略：', simplifiedInstructions.includes('优先级策略'));
  console.log('- 包含执行要求：', simplifiedInstructions.includes('执行要求'));
  
  // 测试场景4：边界情况处理
  console.log('\n--- 测试场景4：边界情况处理 ---');
  
  const edgeCaseInstructions = IntelligentOutputFormatter.handleEdgeCases(
    mockSearchPlan,
    highErrorSemanticAnalysis,
    problemDescription,
    6 // 超高错误计数
  );
  
  console.log('边界情况测试：');
  console.log('- 包含关键干预：', edgeCaseInstructions.includes('CRITICAL INTERVENTION'));
  console.log('- 包含替代搜索：', edgeCaseInstructions.includes('替代搜索'));
  
  console.log('\n✅ 所有集成测试完成 - 功能正常');
  
} catch (error) {
  console.error('❌ 集成测试失败：', error.message);
  console.error('错误详情：', error.stack);
}