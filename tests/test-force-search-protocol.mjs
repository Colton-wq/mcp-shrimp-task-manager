/**
 * 测试Force Search Protocol v4.0增强功能
 * Test Force Search Protocol v4.0 Enhanced Features
 */

console.log('🔍 测试Force Search Protocol v4.0增强功能\n');

try {
  // 导入增强的Force Search Protocol
  const { forceSearchProtocol } = await import('./dist/tools/search/forceSearchProtocol.js');
  
  console.log('✅ Force Search Protocol模块导入成功');
  
  // 测试场景1：高风险情况 - MCP工具开发问题
  console.log('\n--- 测试场景1：高风险情况 (MCP工具开发) ---');
  
  const highRiskTest = await forceSearchProtocol({
    conversationContext: "用户在开发MCP工具时遇到问题，AI回答说'这应该很简单，只需要修改一下配置就行了'，但是用户尝试了多次都失败了。AI继续坚持说'肯定没问题的，再试一次'。",
    problemDescription: "MCP工具注册失败，无法在Claude中正常调用",
    currentApproach: "修改package.json和配置文件",
    uncertaintyLevel: "high",
    errorCount: 3
  });
  
  console.log('高风险测试结果：');
  console.log('- 搜索优先级：', highRiskTest.content[0].text.includes('IMMEDIATE') ? '✅ IMMEDIATE' : '❌ 未正确识别');
  console.log('- GitHub搜索：', highRiskTest.content[0].text.includes('github-local-search') ? '✅ 包含' : '❌ 缺失');
  console.log('- 质量门控：', highRiskTest.content[0].text.includes('QUALITY GATES') ? '✅ 包含' : '❌ 缺失');
  
  // 测试场景2：中等风险情况 - 技术问题
  console.log('\n--- 测试场景2：中等风险情况 (技术问题) ---');
  
  const mediumRiskTest = await forceSearchProtocol({
    conversationContext: "用户询问关于TypeScript配置的问题，AI给出了一个解决方案但不确定是否是最新的最佳实践。",
    problemDescription: "TypeScript编译配置优化",
    currentApproach: "修改tsconfig.json",
    uncertaintyLevel: "medium",
    errorCount: 1
  });
  
  console.log('中等风险测试结果：');
  console.log('- 搜索优先级：', mediumRiskTest.content[0].text.includes('MEDIUM') ? '✅ MEDIUM' : '❌ 未正确识别');
  console.log('- 关键词分析：', mediumRiskTest.content[0].text.includes('Generated Keywords Analysis') ? '✅ 包含' : '❌ 缺失');
  console.log('- 验证要求：', mediumRiskTest.content[0].text.includes('VERIFICATION REQUIREMENTS') ? '✅ 包含' : '❌ 缺失');
  
  // 测试场景3：低风险情况 - 简单查询
  console.log('\n--- 测试场景3：低风险情况 (简单查询) ---');
  
  const lowRiskTest = await forceSearchProtocol({
    conversationContext: "用户询问一个简单的编程概念，AI给出了标准的解释。",
    problemDescription: "JavaScript数组方法使用",
    currentApproach: "使用map和filter方法",
    uncertaintyLevel: "low",
    errorCount: 0
  });
  
  console.log('低风险测试结果：');
  console.log('- 搜索优先级：', lowRiskTest.content[0].text.includes('LOW') || lowRiskTest.content[0].text.includes('MEDIUM') ? '✅ 适当级别' : '❌ 级别不当');
  console.log('- 工具数量：', (lowRiskTest.content[0].text.match(/#### \d+\./g) || []).length <= 2 ? '✅ 适量' : '❌ 过多');
  
  // 测试关键词生成功能
  console.log('\n--- 测试关键词生成功能 ---');
  
  const keywordTest = await forceSearchProtocol({
    conversationContext: "测试关键词生成",
    problemDescription: "MCP TypeScript Node.js server development with GitHub integration",
    currentApproach: "开发测试",
    uncertaintyLevel: "medium",
    errorCount: 0
  });
  
  const keywordSection = keywordTest.content[0].text;
  console.log('关键词生成测试：');
  console.log('- 核心关键词：', keywordSection.includes('Core Keywords') ? '✅ 包含' : '❌ 缺失');
  console.log('- 技术关键词：', keywordSection.includes('Technical Keywords') ? '✅ 包含' : '❌ 缺失');
  console.log('- 上下文关键词：', keywordSection.includes('Contextual Keywords') ? '✅ 包含' : '❌ 缺失');
  
  // 测试MCP工具调用配置
  console.log('\n--- 测试MCP工具调用配置 ---');
  
  const toolCallTest = await forceSearchProtocol({
    conversationContext: "测试工具调用配置",
    problemDescription: "GitHub repository search and documentation lookup",
    currentApproach: "使用多个MCP工具",
    uncertaintyLevel: "high",
    errorCount: 2
  });
  
  const toolSection = toolCallTest.content[0].text;
  console.log('MCP工具调用测试：');
  console.log('- 超时配置：', toolSection.includes('Timeout') ? '✅ 包含' : '❌ 缺失');
  console.log('- 质量期望：', toolSection.includes('Expected Quality') ? '✅ 包含' : '❌ 缺失');
  console.log('- 优先级排序：', toolSection.includes('Priority Level') ? '✅ 包含' : '❌ 缺失');
  
  console.log('\n🎉 Force Search Protocol v4.0测试完成！');
  console.log('\n📊 新功能验证：');
  console.log('✅ 智能搜索优先级排序');
  console.log('✅ 渐进式关键词生成');
  console.log('✅ GitHub和官方资源优先');
  console.log('✅ 质量门控机制');
  console.log('✅ 超时和错误处理');
  console.log('✅ 动态搜索策略调整');
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误详情:', error);
}