/**
 * 详细调试路径生成问题
 */

console.log('🔍 详细调试路径生成机制\n');

try {
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  const { getDataDir, setGlobalServer } = await import('./dist/utils/paths.js');
  
  console.log('环境变量:');
  console.log(`DATA_DIR: ${process.env.DATA_DIR}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  
  // 创建模拟服务器
  const mockServer = {
    listRoots: async () => {
      console.log('📞 mockServer.listRoots() 被调用');
      return {
        roots: [
          { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
        ]
      };
    }
  };
  
  // 设置全局服务器
  setGlobalServer(mockServer);
  console.log('✅ 模拟服务器设置完成\n');
  
  // 测试项目上下文生成
  const testProject = 'TestProject1';
  console.log(`--- 测试项目: ${testProject} ---`);
  
  // 直接调用 getProjectContext
  console.log('1. 直接调用 ProjectSession.getProjectContext:');
  try {
    const context = await ProjectSession.getProjectContext(testProject, mockServer);
    if (context) {
      console.log(`✅ 获取到项目上下文:`);
      console.log(`   项目ID: ${context.projectId}`);
      console.log(`   项目名称: ${context.projectName}`);
      console.log(`   项目根目录: ${context.projectRoot}`);
      console.log(`   数据目录: ${context.dataDir}`);
      console.log(`   任务文件: ${context.tasksFilePath}`);
    } else {
      console.log('❌ 未获取到项目上下文');
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}`);
    console.log(`错误堆栈: ${error.stack}`);
  }
  
  // 测试 withProjectContext
  console.log('\n2. 使用 withProjectContext:');
  await ProjectSession.withProjectContext(testProject, async () => {
    console.log(`当前项目: ${ProjectSession.getCurrentProject()}`);
    
    try {
      const dataDir = await getDataDir();
      console.log(`数据目录: ${dataDir}`);
      
      // 强制刷新缓存
      const dataDirRefresh = await getDataDir(true);
      console.log(`数据目录 (刷新): ${dataDirRefresh}`);
      
    } catch (error) {
      console.log(`❌ getDataDir 错误: ${error.message}`);
    }
  });
  
  // 测试项目切换后的路径生成
  console.log('\n3. 测试项目切换后的路径生成:');
  const originalProject = ProjectSession.getCurrentProject();
  console.log(`原项目: ${originalProject}`);
  
  ProjectSession.setCurrentProject(testProject);
  console.log(`切换到项目: ${ProjectSession.getCurrentProject()}`);
  
  try {
    const dataDir = await getDataDir(true); // 强制刷新
    console.log(`切换后数据目录: ${dataDir}`);
  } catch (error) {
    console.log(`❌ 切换后 getDataDir 错误: ${error.message}`);
  }
  
  // 恢复原项目
  ProjectSession.setCurrentProject(originalProject);
  
  // 测试 sanitizeProjectName 方法
  console.log('\n4. 测试项目名称清理:');
  try {
    // 这个方法是私有的，我们无法直接调用，但可以通过其他方式测试
    const testNames = ['TestProject1', 'Test Project 2', 'test-project-3', 'Test@Project#4'];
    for (const name of testNames) {
      console.log(`原名称: "${name}"`);
      // 模拟清理逻辑
      const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      console.log(`清理后: "${sanitized}"`);
    }
  } catch (error) {
    console.log(`❌ 项目名称清理错误: ${error.message}`);
  }
  
  // 测试缓存机制
  console.log('\n5. 测试缓存机制:');
  try {
    const stats = ProjectSession.getProjectContextStats();
    console.log(`缓存统计: ${JSON.stringify(stats, null, 2)}`);
  } catch (error) {
    console.log(`❌ 缓存统计错误: ${error.message}`);
  }
  
} catch (error) {
  console.error('❌ 调试脚本错误:', error);
  console.error('错误堆栈:', error.stack);
}