/**
 * 测试项目覆盖参数
 */

console.log('🔍 测试项目覆盖参数\n');

try {
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  const { getDataDir, setGlobalServer } = await import('./dist/utils/paths.js');
  
  // 创建模拟服务器
  const mockServer = {
    listRoots: async () => ({
      roots: [
        { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
      ]
    })
  };
  
  setGlobalServer(mockServer);
  console.log('✅ 模拟服务器设置完成');
  
  const testProject = 'TestProject1';
  console.log(`\n--- 测试项目: ${testProject} ---`);
  
  // 测试1：不传递项目覆盖参数
  console.log('\n1. 不传递项目覆盖参数:');
  console.log(`当前项目: ${ProjectSession.getCurrentProject()}`);
  const dataDir1 = await getDataDir(true);
  console.log(`数据目录: ${dataDir1}`);
  
  // 测试2：传递项目覆盖参数
  console.log('\n2. 传递项目覆盖参数:');
  const dataDir2 = await getDataDir(true, testProject);
  console.log(`数据目录 (覆盖): ${dataDir2}`);
  console.log(`当前项目: ${ProjectSession.getCurrentProject()}`);
  
  // 测试3：在 withProjectContext 中测试
  console.log('\n3. 在 withProjectContext 中测试:');
  await ProjectSession.withProjectContext(testProject, async () => {
    console.log(`上下文中当前项目: ${ProjectSession.getCurrentProject()}`);
    
    // 不传递覆盖参数
    const dataDir3a = await getDataDir(true);
    console.log(`数据目录 (无覆盖): ${dataDir3a}`);
    
    // 传递覆盖参数
    const dataDir3b = await getDataDir(true, testProject);
    console.log(`数据目录 (有覆盖): ${dataDir3b}`);
  });
  
  // 测试4：直接调用 getActiveProjectContext
  console.log('\n4. 直接调用 getActiveProjectContext:');
  const { getActiveProjectContext } = await import('./dist/utils/projectSession.js');
  
  // 不传递项目覆盖
  const context1 = await getActiveProjectContext(mockServer);
  console.log(`上下文1 (无覆盖): ${context1 ? context1.dataDir : 'null'}`);
  
  // 传递项目覆盖
  const context2 = await getActiveProjectContext(mockServer, testProject);
  console.log(`上下文2 (有覆盖): ${context2 ? context2.dataDir : 'null'}`);
  
  if (context2) {
    console.log(`项目名称: ${context2.projectName}`);
    console.log(`项目ID: ${context2.projectId}`);
    console.log(`项目根目录: ${context2.projectRoot}`);
  }
  
  // 测试5：验证项目名称清理
  console.log('\n5. 验证项目名称清理:');
  const testNames = ['TestProject1', 'TestProject2', 'TestProject3'];
  for (const name of testNames) {
    const context = await getActiveProjectContext(mockServer, name);
    if (context) {
      console.log(`项目 "${name}" -> ID: "${context.projectId}", 数据目录: ${context.dataDir}`);
    }
  }
  
} catch (error) {
  console.error('❌ 测试错误:', error);
  console.error('错误堆栈:', error.stack);
}