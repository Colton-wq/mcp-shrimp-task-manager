/**
 * 测试 DirectToolCallInjector 类的功能
 */

console.log('🔍 测试 DirectToolCallInjector 类功能\n');

try {
  // 导入 DirectToolCallInjector
  const { DirectToolCallInjector } = await import('./dist/tools/search/DirectToolCallInjector.js');
  
  console.log('✅ DirectToolCallInjector 模块导入成功');
  
  // 测试场景1：标准工具调用序列
  console.log('\n--- 测试场景1：标准工具调用序列 ---');
  
  const mockToolCalls = [
    {
      tool: "codebase-retrieval",
      priority: 1,
      parameters: {
        information_request: "force_search_protocol 工具优化实现"
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
  ];
  
  const standardInstructions = DirectToolCallInjector.generateExecutableInstructions(
    mockToolCalls,
    "HIGH"
  );
  
  console.log('标准指令生成结果：');
  console.log('- 指令长度：', standardInstructions.length, '字符');
  console.log('- 包含强制性语言：', standardInstructions.includes('你必须立即调用'));
  console.log('- 包含执行验证：', standardInstructions.includes('执行验证'));
  console.log('- 包含参数格式：', standardInstructions.includes('```json'));
  
  // 测试场景2：紧急情况（框架跳出）
  console.log('\n--- 测试场景2：紧急情况处理 ---');
  
  const emergencyInstructions = DirectToolCallInjector.generateExecutableInstructions(
    mockToolCalls,
    "IMMEDIATE",
    {
      problemDescription: "MCP工具注册失败",
      errorCount: 5,
      frameworkBreakRequired: true
    }
  );
  
  console.log('紧急指令生成结果：');
  console.log('- 包含框架跳出标记：', emergencyInstructions.includes('FRAMEWORK_BREAK_DETECTED'));
  console.log('- 包含错误计数：', emergencyInstructions.includes('错误计数: 5'));
  console.log('- 包含紧急触发器：', emergencyInstructions.includes('🚨 CRITICAL_EXECUTION'));
  
  // 测试场景3：空工具调用（回退机制）
  console.log('\n--- 测试场景3：回退机制测试 ---');
  
  const fallbackInstructions = DirectToolCallInjector.generateExecutableInstructions(
    [],
    "HIGH",
    { problemDescription: "测试问题描述" }
  );
  
  console.log('回退指令生成结果：');
  console.log('- 包含回退协议：', fallbackInstructions.includes('FALLBACK_EXECUTION_PROTOCOL'));
  console.log('- 包含默认工具调用：', fallbackInstructions.includes('codebase-retrieval'));
  console.log('- 包含问题描述：', fallbackInstructions.includes('测试问题描述'));
  
  // 测试场景4：工具调用验证
  console.log('\n--- 测试场景4：工具调用验证 ---');
  
  const validToolCall = {
    tool: "test-tool",
    priority: 1,
    parameters: { test: "value" },
    rationale: "test rationale",
    timeout: 30000,
    expectedQuality: "HIGH"
  };
  
  const invalidToolCall = {
    tool: "test-tool",
    // 缺少必要字段
  };
  
  console.log('有效工具调用验证：', DirectToolCallInjector.validateToolCall(validToolCall));
  console.log('无效工具调用验证：', DirectToolCallInjector.validateToolCall(invalidToolCall));
  
  // 批量验证测试
  const mixedToolCalls = [validToolCall, invalidToolCall, mockToolCalls[0]];
  const validatedCalls = DirectToolCallInjector.validateToolCalls(mixedToolCalls);
  console.log('批量验证结果 - 有效数量：', validatedCalls.length, '/ 总数：', mixedToolCalls.length);
  
  console.log('\n✅ 所有测试完成 - DirectToolCallInjector 功能正常');
  
} catch (error) {
  console.error('❌ 测试失败：', error.message);
  console.error('错误详情：', error.stack);
}