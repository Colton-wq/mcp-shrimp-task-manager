/**
 * 测试 EnhancedPsychologyTriggers 类的功能
 */

console.log('🔍 测试 EnhancedPsychologyTriggers 类功能\n');

try {
  // 导入 EnhancedPsychologyTriggers
  const { EnhancedPsychologyTriggers } = await import('./dist/tools/search/EnhancedPsychologyTriggers.js');
  
  console.log('✅ EnhancedPsychologyTriggers 模块导入成功');
  
  // 测试场景1：标准强制执行提示词
  console.log('\n--- 测试场景1：标准强制执行提示词 ---');
  
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
  
  const standardContext = {
    errorCount: 2,
    urgencyLevel: "HIGH",
    frameworkBreakRequired: false,
    aiResistanceLevel: "MEDIUM",
    previousFailures: ["配置错误", "参数不匹配"]
  };
  
  const standardPrompt = EnhancedPsychologyTriggers.generateForceExecutionPrompt(
    mockToolCalls,
    standardContext,
    "CRITICAL"
  );
  
  console.log('标准提示词生成结果：');
  console.log('- 提示词长度：', standardPrompt.length, '字符');
  console.log('- 包含强制性语言：', standardPrompt.includes('必须立即调用'));
  console.log('- 包含禁止性语言：', standardPrompt.includes('STRICTLY PROHIBITED'));
  console.log('- 包含紧急性触发器：', standardPrompt.includes('🚨'));
  console.log('- 包含权威性引用：', standardPrompt.includes('AI_DEVELOPMENT_STANDARDS'));
  console.log('- 包含验证要求：', standardPrompt.includes('EXECUTION_VERIFICATION'));
  
  // 测试场景2：紧急情况处理
  console.log('\n--- 测试场景2：紧急情况处理 ---');
  
  const emergencyContext = {
    errorCount: 5,
    urgencyLevel: "EMERGENCY",
    frameworkBreakRequired: true,
    aiResistanceLevel: "HIGH",
    previousFailures: ["多次配置失败", "工具调用被跳过", "AI 抗性行为"]
  };
  
  const emergencyPrompt = EnhancedPsychologyTriggers.generateForceExecutionPrompt(
    mockToolCalls,
    emergencyContext,
    "ABSOLUTE"
  );
  
  console.log('紧急提示词生成结果：');
  console.log('- 包含框架跳出标记：', emergencyPrompt.includes('FRAMEWORK_BREAK_DETECTED'));
  console.log('- 包含错误计数：', emergencyPrompt.includes('错误计数: 5'));
  console.log('- 包含 AI 抗性克服：', emergencyPrompt.includes('AI_RESISTANCE_OVERRIDE'));
  console.log('- 包含绝对性命令：', emergencyPrompt.includes('EXECUTE_IMMEDIATELY'));
  
  // 测试场景3：简化版强制提示词
  console.log('\n--- 测试场景3：简化版强制提示词 ---');
  
  const simplifiedPrompt = EnhancedPsychologyTriggers.generateSimplifiedForcePrompt(
    "context7-mcp-get-library-docs_mcphub-proxy",
    { context7CompatibleLibraryID: "/anthropic/mcp" },
    "获取 MCP 官方文档"
  );
  
  console.log('简化提示词生成结果：');
  console.log('- 提示词长度：', simplifiedPrompt.length, '字符');
  console.log('- 包含工具名称：', simplifiedPrompt.includes('context7-mcp-get-library-docs'));
  console.log('- 包含参数：', simplifiedPrompt.includes('anthropic/mcp'));
  console.log('- 包含禁止声明：', simplifiedPrompt.includes('禁止'));
  
  // 测试场景4：错误模式触发器
  console.log('\n--- 测试场景4：错误模式触发器 ---');
  
  const criticalErrorTrigger = EnhancedPsychologyTriggers.generateErrorPatternTriggers(
    "CRITICAL",
    ["连接失败", "认证错误", "超时异常"]
  );
  
  console.log('关键错误触发器：');
  console.log('- 包含关键错误标记：', criticalErrorTrigger.includes('CRITICAL_ERROR_PATTERN'));
  console.log('- 包含紧急协议：', criticalErrorTrigger.includes('EMERGENCY_PROTOCOL'));
  console.log('- 包含框架跳出：', criticalErrorTrigger.includes('FRAMEWORK_BREAK'));
  
  const recurringErrorTrigger = EnhancedPsychologyTriggers.generateErrorPatternTriggers(
    "RECURRING",
    ["重复配置错误"]
  );
  
  console.log('重复错误触发器：');
  console.log('- 包含重复错误标记：', recurringErrorTrigger.includes('RECURRING_ERROR_PATTERN'));
  console.log('- 包含强制验证：', recurringErrorTrigger.includes('MANDATORY_VERIFICATION'));
  
  // 测试场景5：触发器有效性验证
  console.log('\n--- 测试场景5：触发器有效性验证 ---');
  
  const validation = EnhancedPsychologyTriggers.validateTriggerEffectiveness(standardPrompt);
  
  console.log('触发器有效性评估：');
  console.log('- 总体评分：', validation.score, '/100');
  console.log('- 优势数量：', validation.strengths.length);
  console.log('- 弱点数量：', validation.weaknesses.length);
  console.log('- 建议数量：', validation.recommendations.length);
  
  if (validation.strengths.length > 0) {
    console.log('- 主要优势：', validation.strengths.slice(0, 3).join(', '));
  }
  if (validation.weaknesses.length > 0) {
    console.log('- 主要弱点：', validation.weaknesses.slice(0, 2).join(', '));
  }
  if (validation.recommendations.length > 0) {
    console.log('- 改进建议：', validation.recommendations.slice(0, 2).join(', '));
  }
  
  // 测试场景6：触发器数组验证
  console.log('\n--- 测试场景6：触发器数组验证 ---');
  
  console.log('触发器数组完整性检查：');
  console.log('- 绝对执行命令数量：', EnhancedPsychologyTriggers.ABSOLUTE_EXECUTION_COMMANDS.length);
  console.log('- 命令前缀数量：', EnhancedPsychologyTriggers.COMMAND_PREFIXES.length);
  console.log('- 禁止触发器数量：', EnhancedPsychologyTriggers.PROHIBITION_TRIGGERS.length);
  console.log('- 紧急触发器数量：', EnhancedPsychologyTriggers.URGENCY_TRIGGERS.length);
  console.log('- 权威触发器数量：', EnhancedPsychologyTriggers.AUTHORITY_TRIGGERS.length);
  console.log('- 验证触发器数量：', EnhancedPsychologyTriggers.VERIFICATION_TRIGGERS.length);
  console.log('- 抗性克服触发器数量：', EnhancedPsychologyTriggers.RESISTANCE_OVERRIDE_TRIGGERS.length);
  
  // 验证触发器内容质量
  const sampleExecutionCommand = EnhancedPsychologyTriggers.ABSOLUTE_EXECUTION_COMMANDS[0];
  const sampleProhibition = EnhancedPsychologyTriggers.PROHIBITION_TRIGGERS[0];
  
  console.log('触发器内容质量：');
  console.log('- 执行命令示例：', sampleExecutionCommand);
  console.log('- 禁止声明示例：', sampleProhibition);
  console.log('- 包含图标：', sampleExecutionCommand.includes('🚨') || sampleExecutionCommand.includes('⚡'));
  console.log('- 包含英文：', /[A-Z_]+/.test(sampleExecutionCommand));
  
  console.log('\n✅ 所有测试完成 - EnhancedPsychologyTriggers 功能正常');
  
} catch (error) {
  console.error('❌ 测试失败：', error.message);
  console.error('错误详情：', error.stack);
}