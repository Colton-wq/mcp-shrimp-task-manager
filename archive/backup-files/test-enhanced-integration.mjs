/**
 * 测试增强后的 force_search_protocol 工具集成效果
 */

console.log('🔍 测试增强后的 force_search_protocol 工具集成效果\n');

try {
  // 导入增强后的 force_search_protocol
  const { forceSearchProtocol } = await import('./dist/tools/search/forceSearchProtocol.js');
  
  console.log('✅ 增强版 Force Search Protocol 模块导入成功');
  
  // 测试场景1：集成组件测试 - MCP 工具调用优化
  console.log('\n--- 测试场景1：集成组件测试 (MCP 工具调用优化) ---');
  
  const integrationTest = await forceSearchProtocol({
    conversationContext: "用户多次反馈 AI 不执行工具调用，force_search_protocol 工具执行率低，需要集成 DirectToolCallInjector、ContextAwareCommandGenerator 和 EnhancedPsychologyTriggers 三个组件来提高执行率",
    problemDescription: "force_search_protocol 工具执行率低，AI 经常跳过工具调用，需要优化心理触发器系统",
    currentApproach: "集成三个新组件：DirectToolCallInjector、ContextAwareCommandGenerator、EnhancedPsychologyTriggers",
    uncertaintyLevel: "high",
    errorCount: 3
  });
  
  console.log('集成组件测试结果：');
  const integrationOutput = integrationTest.content[0].text;
  console.log('- 输出长度：', integrationOutput.length, '字符');
  console.log('- 包含 AI Development Standards v4.0：', integrationOutput.includes('AI Development Standards v4.0'));
  console.log('- 包含强制执行协议：', integrationOutput.includes('MANDATORY_EXECUTION_SEQUENCE'));
  console.log('- 包含心理触发器：', integrationOutput.includes('🚨') || integrationOutput.includes('⚡'));
  console.log('- 包含禁止性语言：', integrationOutput.includes('PROHIBITED') || integrationOutput.includes('禁止'));
  console.log('- 包含验证要求：', integrationOutput.includes('VERIFICATION') || integrationOutput.includes('验证'));
  console.log('- 包含框架跳出检测：', integrationOutput.includes('FRAMEWORK_BREAK'));
  console.log('- 包含工具调用参数：', integrationOutput.includes('```json'));
  
  // 测试场景2：上下文感知命令生成测试
  console.log('\n--- 测试场景2：上下文感知命令生成测试 ---');
  
  const contextAwareTest = await forceSearchProtocol({
    conversationContext: "TypeScript 项目中的 React 组件性能优化问题，用户尝试了多种方法但都没有效果",
    problemDescription: "React 组件渲染性能慢，需要优化重渲染问题",
    currentApproach: "使用 React.memo 和 useMemo 优化",
    uncertaintyLevel: "medium",
    errorCount: 2
  });
  
  console.log('上下文感知测试结果：');
  const contextOutput = contextAwareTest.content[0].text;
  console.log('- 技术栈识别：', contextOutput.includes('React') || contextOutput.includes('TypeScript'));
  console.log('- 问题类型识别：', contextOutput.includes('performance') || contextOutput.includes('optimization') || contextOutput.includes('性能'));
  console.log('- 智能工具选择：', contextOutput.includes('context7-mcp') || contextOutput.includes('github-local'));
  console.log('- 针对性搜索：', contextOutput.includes('React') && contextOutput.includes('performance'));
  
  // 测试场景3：心理触发器强度测试
  console.log('\n--- 测试场景3：心理触发器强度测试 ---');
  
  const triggerIntensityTest = await forceSearchProtocol({
    conversationContext: "CRITICAL EMERGENCY: 生产环境 API 服务器崩溃，多次修复尝试失败，用户非常沮丧和焦急",
    problemDescription: "生产环境 Node.js API 服务器崩溃，需要紧急修复",
    currentApproach: "重启服务器和检查日志",
    uncertaintyLevel: "high",
    errorCount: 5
  });
  
  console.log('心理触发器强度测试结果：');
  const triggerOutput = triggerIntensityTest.content[0].text;
  console.log('- 紧急性触发器：', triggerOutput.includes('CRITICAL') || triggerOutput.includes('EMERGENCY'));
  console.log('- 强制性语言：', triggerOutput.includes('MANDATORY') || triggerOutput.includes('必须'));
  console.log('- 立即执行指令：', triggerOutput.includes('IMMEDIATE') || triggerOutput.includes('立即'));
  console.log('- 错误计数识别：', triggerOutput.includes('5') || triggerOutput.includes('多次'));
  console.log('- 高强度触发器：', triggerOutput.includes('🚨') && triggerOutput.includes('⚡'));
  
  // 测试场景4：AI Development Standards v4.0 格式验证
  console.log('\n--- 测试场景4：AI Development Standards v4.0 格式验证 ---');
  
  const standardsTest = await forceSearchProtocol({
    conversationContext: "标准格式测试",
    problemDescription: "验证 AI Development Standards v4.0 格式输出",
    currentApproach: "测试标准合规性",
    uncertaintyLevel: "low",
    errorCount: 1
  });
  
  console.log('AI Development Standards v4.0 格式验证：');
  const standardsOutput = standardsTest.content[0].text;
  console.log('- 包含标准头部：', standardsOutput.includes('AI Development Standards v4.0'));
  console.log('- 包含生效日期：', standardsOutput.includes('2025-08-24') || standardsOutput.includes('Effective Date'));
  console.log('- 包含批判性思维协议：', standardsOutput.includes('CRITICAL THINKING PROTOCOL'));
  console.log('- 包含认知偏差干预：', standardsOutput.includes('COGNITIVE BIAS INTERVENTION'));
  console.log('- 包含强制检查点：', standardsOutput.includes('CHECKPOINTS') || standardsOutput.includes('检查点'));
  console.log('- 包含证据搜索序列：', standardsOutput.includes('EVIDENCE-BASED SEARCH'));
  console.log('- 包含验证标准：', standardsOutput.includes('VERIFICATION STANDARDS'));
  console.log('- 包含禁止行为：', standardsOutput.includes('PROHIBITED BEHAVIORS'));
  
  // 测试场景5：执行率提升效果评估
  console.log('\n--- 测试场景5：执行率提升效果评估 ---');
  
  const executionRateTest = await forceSearchProtocol({
    conversationContext: "测试新的强制执行机制是否能提高 AI 工具调用执行率",
    problemDescription: "评估 DirectToolCallInjector、ContextAwareCommandGenerator、EnhancedPsychologyTriggers 集成效果",
    currentApproach: "使用增强版心理触发器和直接工具调用注入",
    uncertaintyLevel: "medium",
    errorCount: 0
  });
  
  console.log('执行率提升效果评估：');
  const executionOutput = executionRateTest.content[0].text;
  
  // 计算强制性指令密度
  const mandatoryKeywords = ['MANDATORY', 'MUST', 'REQUIRED', 'CRITICAL', '必须', '强制', '不可跳过'];
  const mandatoryCount = mandatoryKeywords.reduce((count, keyword) => {
    return count + (executionOutput.match(new RegExp(keyword, 'gi')) || []).length;
  }, 0);
  
  // 计算触发器密度
  const triggerSymbols = ['🚨', '⚡', '🔥', '⚠️', '🎯'];
  const triggerCount = triggerSymbols.reduce((count, symbol) => {
    return count + (executionOutput.match(new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  }, 0);
  
  console.log('- 强制性指令密度：', mandatoryCount, '个关键词');
  console.log('- 视觉触发器密度：', triggerCount, '个图标');
  console.log('- 直接工具调用指令：', executionOutput.includes('你必须立即调用') || executionOutput.includes('EXECUTE_IMMEDIATELY'));
  console.log('- 禁止跳过声明：', executionOutput.includes('不可跳过') || executionOutput.includes('cannot be skipped'));
  console.log('- 执行验证要求：', executionOutput.includes('执行验证') || executionOutput.includes('EXECUTION_VERIFICATION'));
  
  // 综合评估
  console.log('\n🎉 增强版 Force Search Protocol 测试完成！');
  console.log('\n📊 集成效果评估：');
  
  const hasStandardsFormat = integrationOutput.includes('AI Development Standards v4.0');
  const hasMandatorySequence = integrationOutput.includes('MANDATORY_EXECUTION_SEQUENCE');
  const hasEnhancedTriggers = mandatoryCount >= 5 && triggerCount >= 3;
  const hasContextAwareness = contextOutput.includes('React') || contextOutput.includes('TypeScript');
  const hasDirectInjection = executionOutput.includes('你必须立即调用') || executionOutput.includes('EXECUTE_IMMEDIATELY');
  
  console.log('✅ AI Development Standards v4.0 格式：', hasStandardsFormat ? '通过' : '失败');
  console.log('✅ 强制执行序列：', hasMandatorySequence ? '通过' : '失败');
  console.log('✅ 增强心理触发器：', hasEnhancedTriggers ? '通过' : '失败');
  console.log('✅ 上下文感知命令：', hasContextAwareness ? '通过' : '失败');
  console.log('✅ 直接工具调用注入：', hasDirectInjection ? '通过' : '失败');
  
  const passedTests = [hasStandardsFormat, hasMandatorySequence, hasEnhancedTriggers, hasContextAwareness, hasDirectInjection].filter(Boolean).length;
  const totalTests = 5;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`\n🎯 集成成功率：${successRate}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 80) {
    console.log('🎉 集成测试通过！新机制工作正常，预期能显著提高 AI 工具调用执行率。');
  } else {
    console.log('⚠️ 集成测试部分通过，需要进一步优化。');
  }
  
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error('错误详情:', error.stack);
}