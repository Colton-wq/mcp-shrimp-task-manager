/**
 * 查看集成后的实际指令输出内容
 */

console.log('🔍 查看集成后的实际指令输出\n');

try {
  const { IntelligentOutputFormatter } = await import('./dist/tools/search/IntelligentOutputFormatter.js');
  
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
        tool: "context7-mcp-get-library-docs_mcphub-proxy",
        priority: 2,
        parameters: {
          context7CompatibleLibraryID: "/anthropic/mcp"
        },
        rationale: "获取 MCP 官方文档",
        timeout: 25000,
        expectedQuality: "HIGH"
      }
    ],
    verificationRequirements: ["多源验证", "权威性检查"],
    searchPriority: "CRITICAL",
    qualityGates: ["编译检查", "功能验证"]
  };
  
  const mockSemanticAnalysis = {
    riskLevel: "HIGH",
    detectedPatterns: ["重复失败", "工具调用跳过"],
    cognitiveRiskFactors: ["过度自信", "假设依赖"],
    frameworkBreakRequired: true,
    hasOverconfidence: true,
    hasErrorPersistence: true,
    searchPriority: "CRITICAL"
  };
  
  const problemDescription = "force_search_protocol 工具执行率低，需要集成 DirectToolCallInjector、ContextAwareCommandGenerator 和 EnhancedPsychologyTriggers";
  const errorCount = 3;
  const conversationContext = "用户多次反馈 AI 不执行工具调用，需要立即解决这个问题";
  
  console.log('=== 集成后的完整指令输出 ===\n');
  
  const integratedOutput = IntelligentOutputFormatter.convertToMandatoryInstructions(
    mockSearchPlan,
    mockSemanticAnalysis,
    problemDescription,
    errorCount,
    conversationContext
  );
  
  console.log(integratedOutput);
  
  console.log('\n=== 指令分析 ===');
  console.log('- 总长度：', integratedOutput.length, '字符');
  console.log('- 包含三个组件集成：', 
    integratedOutput.includes('DirectToolCallInjector') ||
    integratedOutput.includes('ContextAwareCommandGenerator') ||
    integratedOutput.includes('EnhancedPsychologyTriggers')
  );
  console.log('- 包含强制执行序列：', integratedOutput.includes('MANDATORY_EXECUTION_SEQUENCE'));
  console.log('- 包含 AI 抗性克服：', integratedOutput.includes('AI_RESISTANCE_OVERRIDE'));
  console.log('- 包含框架跳出检测：', integratedOutput.includes('FRAMEWORK_BREAK_DETECTED'));
  console.log('- 包含完整 AI Standards：', integratedOutput.includes('AI Development Standards v4.0'));
  console.log('- 包含工具调用参数：', integratedOutput.includes('```json'));
  
} catch (error) {
  console.error('❌ 测试失败：', error.message);
}