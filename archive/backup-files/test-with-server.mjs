/**
 * 使用模拟服务器的多项目隔离测试
 */

console.log('🚀 开始带服务器的多项目隔离功能测试\n');

try {
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  const { getDataDir, getTasksFilePath, setGlobalServer } = await import('./dist/utils/paths.js');
  
  // 创建模拟 MCP 服务器
  const mockServer = {
    listRoots: async () => [
      { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
    ]
  };
  
  // 设置全局服务器
  setGlobalServer(mockServer);
  console.log('✅ 模拟服务器设置完成');
  
  // 测试项目上下文管理
  console.log('\n🔧 测试项目上下文管理...');
  
  const testProjects = ['TestProject1', 'TestProject2', 'TestProject3'];
  
  for (const project of testProjects) {
    console.log(`\n--- 测试项目: ${project} ---`);
    
    await ProjectSession.withProjectContext(project, async () => {
      try {
        const currentProject = ProjectSession.getCurrentProject();
        console.log(`当前项目: ${currentProject}`);
        
        const dataDir = await getDataDir();
        const tasksFile = await getTasksFilePath();
        
        console.log(`数据目录: ${dataDir}`);
        console.log(`任务文件: ${tasksFile}`);
        
        // 检查路径是否包含项目标识
        const hasProjectInPath = dataDir.includes(project) || tasksFile.includes(project);
        console.log(`包含项目标识: ${hasProjectInPath ? '✅' : '❌'}`);
        
        if (hasProjectInPath) {
          console.log('✅ 路径隔离正常');
        } else {
          console.log('❌ 路径隔离失败');
        }
        
      } catch (error) {
        console.log(`❌ 错误: ${error.message}`);
      }
    });
  }
  
  // 测试并发安全
  console.log('\n🔒 测试并发安全机制...');
  
  const concurrentTests = testProjects.map(async (project, index) => {
    return ProjectSession.withProjectContext(project, async () => {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      
      const currentProject = ProjectSession.getCurrentProject();
      const dataDir = await getDataDir();
      
      return {
        index,
        expectedProject: project,
        actualProject: currentProject,
        dataDir,
        success: currentProject === project
      };
    });
  });
  
  const results = await Promise.all(concurrentTests);
  
  let successCount = 0;
  for (const result of results) {
    if (result.success) {
      console.log(`✅ 并发测试 ${result.index + 1}: ${result.expectedProject}`);
      console.log(`   数据目录: ${result.dataDir}`);
      successCount++;
    } else {
      console.log(`❌ 并发测试 ${result.index + 1}: 期望 ${result.expectedProject}, 实际 ${result.actualProject}`);
    }
  }
  
  console.log(`\n📊 并发测试结果: ${successCount}/${testProjects.length} 通过`);
  
  // 测试项目上下文获取
  console.log('\n🔍 测试项目上下文获取...');
  
  const { getActiveProjectContext } = await import('./dist/utils/projectSession.js');
  
  for (const project of testProjects) {
    try {
      const context = await getActiveProjectContext(mockServer, project);
      
      if (context) {
        console.log(`✅ 项目 ${project}:`);
        console.log(`   项目名称: ${context.projectName}`);
        console.log(`   项目根目录: ${context.projectRoot}`);
        console.log(`   数据目录: ${context.dataDir}`);
        console.log(`   任务文件: ${context.tasksFilePath}`);
        
        // 验证路径包含项目名称
        const hasProjectInDataDir = context.dataDir.includes(project);
        const hasProjectInTasksFile = context.tasksFilePath.includes(project);
        
        console.log(`   数据目录包含项目名: ${hasProjectInDataDir ? '✅' : '❌'}`);
        console.log(`   任务文件包含项目名: ${hasProjectInTasksFile ? '✅' : '❌'}`);
        
      } else {
        console.log(`❌ 项目 ${project}: 无法获取上下文`);
      }
    } catch (error) {
      console.log(`❌ 项目 ${project}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 测试完成！');
  
} catch (error) {
  console.error('❌ 测试执行错误:', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
}