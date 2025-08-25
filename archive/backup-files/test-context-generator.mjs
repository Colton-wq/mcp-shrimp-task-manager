/**
 * 测试 ContextAwareCommandGenerator 类的功能
 */

console.log('🔍 测试 ContextAwareCommandGenerator 类功能\n');

try {
  // 导入 ContextAwareCommandGenerator
  const { ContextAwareCommandGenerator } = await import('./dist/tools/search/ContextAwareCommandGenerator.js');
  
  console.log('✅ ContextAwareCommandGenerator 模块导入成功');
  
  // 测试场景1：MCP 开发错误解决
  console.log('\n--- 测试场景1：MCP 开发错误解决 ---');
  
  const mcpCommands = ContextAwareCommandGenerator.generateSmartCommands(
    "MCP 工具注册失败，Claude 无法连接到自定义 MCP 服务器",
    ["mcp", "typescript", "nodejs"],
    3,
    "用户多次尝试修改配置文件但都失败了，显得很沮丧"
  );
  
  console.log('生成的命令数量：', mcpCommands.length);
  mcpCommands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.tool}`);
    console.log(`     理由: ${cmd.rationale}`);
    console.log(`     优先级: ${cmd.priority}, 质量: ${cmd.expectedQuality}`);
  });
  
  // 测试场景2：React 性能优化
  console.log('\n--- 测试场景2：React 性能优化 ---');
  
  const reactCommands = ContextAwareCommandGenerator.generateSmartCommands(
    "React 应用渲染性能慢，需要优化组件重渲染问题",
    ["react", "javascript"],
    1,
    "用户希望提升应用性能"
  );
  
  console.log('生成的命令数量：', reactCommands.length);
  reactCommands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.tool}`);
    console.log(`     理由: ${cmd.rationale}`);
    console.log(`     参数: ${JSON.stringify(cmd.parameters, null, 2).slice(0, 100)}...`);
  });
  
  // 测试场景3：数据库配置问题
  console.log('\n--- 测试场景3：数据库配置问题 ---');
  
  const dbCommands = ContextAwareCommandGenerator.generateSmartCommands(
    "PostgreSQL 数据库连接配置错误，应用启动失败",
    ["database", "nodejs"],
    0,
    "新项目设置阶段"
  );
  
  console.log('生成的命令数量：', dbCommands.length);
  dbCommands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.tool}`);
    console.log(`     理由: ${cmd.rationale}`);
  });
  
  // 测试场景4：无技术栈的通用问题
  console.log('\n--- 测试场景4：通用问题处理 ---');
  
  const genericCommands = ContextAwareCommandGenerator.generateSmartCommands(
    "如何实现用户认证功能",
    [],
    0,
    ""
  );
  
  console.log('生成的命令数量：', genericCommands.length);
  genericCommands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.tool}`);
    console.log(`     理由: ${cmd.rationale}`);
  });
  
  // 测试场景5：紧急情况处理
  console.log('\n--- 测试场景5：紧急情况处理 ---');
  
  const emergencyCommands = ContextAwareCommandGenerator.generateSmartCommands(
    "生产环境 API 服务器崩溃，需要紧急修复",
    ["nodejs", "database"],
    5,
    "critical emergency situation, production down"
  );
  
  console.log('生成的命令数量：', emergencyCommands.length);
  emergencyCommands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.tool}`);
    console.log(`     理由: ${cmd.rationale}`);
    console.log(`     优先级: ${cmd.priority}, 超时: ${cmd.timeout}ms`);
  });
  
  // 测试验证功能
  console.log('\n--- 测试验证功能 ---');
  
  const validation = ContextAwareCommandGenerator.validateCommands(mcpCommands);
  console.log('验证结果：');
  console.log('- 有效性：', validation.isValid);
  console.log('- 错误数量：', validation.errors.length);
  console.log('- 警告数量：', validation.warnings.length);
  
  if (validation.errors.length > 0) {
    console.log('- 错误详情：', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.log('- 警告详情：', validation.warnings);
  }
  
  console.log('\n✅ 所有测试完成 - ContextAwareCommandGenerator 功能正常');
  
} catch (error) {
  console.error('❌ 测试失败：', error.message);
  console.error('错误详情：', error.stack);
}