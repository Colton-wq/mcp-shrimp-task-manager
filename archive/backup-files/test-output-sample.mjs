/**
 * 查看 DirectToolCallInjector 生成的实际指令内容
 */

console.log('🔍 查看 DirectToolCallInjector 生成的实际指令\n');

try {
  const { DirectToolCallInjector } = await import('./dist/tools/search/DirectToolCallInjector.js');
  
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
  
  console.log('=== 生成的强制执行指令 ===\n');
  
  const instructions = DirectToolCallInjector.generateExecutableInstructions(
    mockToolCalls,
    "HIGH",
    {
      problemDescription: "force_search_protocol 工具执行率优化",
      errorCount: 2
    }
  );
  
  console.log(instructions);
  
  console.log('\n=== 指令分析 ===');
  console.log('- 总长度：', instructions.length, '字符');
  console.log('- 包含"你必须立即调用"：', instructions.includes('你必须立即调用'));
  console.log('- 包含"强制执行"：', instructions.includes('强制执行'));
  console.log('- 包含"不可跳过"：', instructions.includes('不可跳过'));
  console.log('- 包含JSON参数：', instructions.includes('```json'));
  console.log('- 包含执行验证：', instructions.includes('执行验证'));
  
} catch (error) {
  console.error('❌ 测试失败：', error.message);
}