/**
 * 查看 EnhancedPsychologyTriggers 生成的实际提示词内容
 */

console.log('🔍 查看 EnhancedPsychologyTriggers 生成的实际提示词\n');

try {
  const { EnhancedPsychologyTriggers } = await import('./dist/tools/search/EnhancedPsychologyTriggers.js');
  
  const mockToolCalls = [
    {
      tool: "codebase-retrieval",
      parameters: {
        information_request: "force_search_protocol 工具优化实现"
      },
      rationale: "分析现有代码结构和实现模式"
    },
    {
      tool: "exa-mcp-server-web_search_exa_mcphub-proxy",
      parameters: {
        query: "AI tool call execution rate 2025",
        numResults: 5
      },
      rationale: "搜索最新的 AI 工具调用优化技术"
    }
  ];
  
  const context = {
    errorCount: 3,
    urgencyLevel: "HIGH",
    frameworkBreakRequired: true,
    aiResistanceLevel: "HIGH",
    previousFailures: ["配置错误", "参数不匹配", "AI 跳过工具调用"]
  };
  
  console.log('=== 生成的强制执行提示词 ===\n');
  
  const prompt = EnhancedPsychologyTriggers.generateForceExecutionPrompt(
    mockToolCalls,
    context,
    "CRITICAL"
  );
  
  console.log(prompt);
  
  console.log('\n=== 提示词分析 ===');
  console.log('- 总长度：', prompt.length, '字符');
  console.log('- 包含"必须立即调用"：', prompt.includes('必须立即调用'));
  console.log('- 包含"EXECUTE_IMMEDIATELY"：', prompt.includes('EXECUTE_IMMEDIATELY'));
  console.log('- 包含"MANDATORY_TOOL_CALL"：', prompt.includes('MANDATORY_TOOL_CALL'));
  console.log('- 包含"不可跳过"：', prompt.includes('不可跳过'));
  console.log('- 包含"FRAMEWORK_BREAK"：', prompt.includes('FRAMEWORK_BREAK'));
  console.log('- 包含"AI_RESISTANCE_OVERRIDE"：', prompt.includes('AI_RESISTANCE_OVERRIDE'));
  console.log('- 包含JSON参数：', prompt.includes('```json'));
  console.log('- 包含验证要求：', prompt.includes('EXECUTION_VERIFICATION'));
  
  console.log('\n=== 简化版提示词示例 ===\n');
  
  const simplifiedPrompt = EnhancedPsychologyTriggers.generateSimplifiedForcePrompt(
    "context7-mcp-get-library-docs_mcphub-proxy",
    { context7CompatibleLibraryID: "/anthropic/mcp" },
    "获取 MCP 官方文档和最新规范"
  );
  
  console.log(simplifiedPrompt);
  
} catch (error) {
  console.error('❌ 测试失败：', error.message);
}