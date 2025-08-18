/**
 * 调试路径生成问题
 */

console.log('🔍 调试路径生成机制\n');

try {
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  const { getDataDir, getTasksFilePath } = await import('./dist/utils/paths.js');
  
  console.log('环境变量:');
  console.log(`DATA_DIR: ${process.env.DATA_DIR}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  
  console.log('\n当前项目状态:');
  console.log(`当前项目: ${ProjectSession.getCurrentProject()}`);
  
  // 测试不同项目的路径生成
  const testProjects = ['TestProject1', 'TestProject2'];
  
  for (const project of testProjects) {
    console.log(`\n--- 测试项目: ${project} ---`);
    
    // 方法1：直接切换项目
    console.log('方法1：直接切换项目');
    const originalProject = ProjectSession.getCurrentProject();
    ProjectSession.setCurrentProject(project);
    
    try {
      const dataDir1 = await getDataDir();
      const tasksFile1 = await getTasksFilePath();
      console.log(`  数据目录: ${dataDir1}`);
      console.log(`  任务文件: ${tasksFile1}`);
    } catch (error) {
      console.log(`  错误: ${error.message}`);
    } finally {
      ProjectSession.setCurrentProject(originalProject);
    }
    
    // 方法2：使用 withProjectContext
    console.log('方法2：使用 withProjectContext');
    await ProjectSession.withProjectContext(project, async () => {
      try {
        const dataDir2 = await getDataDir();
        const tasksFile2 = await getTasksFilePath();
        console.log(`  数据目录: ${dataDir2}`);
        console.log(`  任务文件: ${tasksFile2}`);
        console.log(`  当前项目: ${ProjectSession.getCurrentProject()}`);
      } catch (error) {
        console.log(`  错误: ${error.message}`);
      }
    });
    
    // 方法3：使用项目覆盖参数
    console.log('方法3：使用项目覆盖参数');
    try {
      const dataDir3 = await getDataDir(false, project);
      const tasksFile3 = await getTasksFilePath();
      console.log(`  数据目录 (覆盖): ${dataDir3}`);
      console.log(`  任务文件: ${tasksFile3}`);
    } catch (error) {
      console.log(`  错误: ${error.message}`);
    }
  }
  
  // 测试项目上下文生成
  console.log('\n--- 测试项目上下文生成 ---');
  
  // 模拟服务器对象
  const mockServer = {
    listRoots: async () => [{ uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }]
  };
  
  for (const project of testProjects) {
    console.log(`\n项目: ${project}`);
    try {
      const { getActiveProjectContext } = await import('./dist/utils/projectSession.js');
      const context = await getActiveProjectContext(mockServer, project);
      
      if (context) {
        console.log(`  项目名称: ${context.projectName}`);
        console.log(`  项目根目录: ${context.projectRoot}`);
        console.log(`  数据目录: ${context.dataDir}`);
        console.log(`  任务文件: ${context.tasksFilePath}`);
      } else {
        console.log('  无法获取项目上下文');
      }
    } catch (error) {
      console.log(`  错误: ${error.message}`);
    }
  }
  
} catch (error) {
  console.error('❌ 调试脚本错误:', error);
  console.error('错误堆栈:', error.stack);
}