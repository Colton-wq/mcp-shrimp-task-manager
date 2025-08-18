/**
 * 最终路径调试
 */

console.log('🔍 最终路径调试\n');

try {
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  const { getDataDir, getTasksFilePath, setGlobalServer } = await import('./dist/utils/paths.js');
  
  // 设置环境变量
  console.log(`环境变量 DATA_DIR: ${process.env.DATA_DIR}`);
  
  // 创建模拟服务器
  const mockServer = {
    listRoots: async () => ({
      roots: [
        { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
      ]
    })
  };
  
  setGlobalServer(mockServer);
  
  const testProjects = ['TestProject1', 'TestProject2'];
  
  for (const project of testProjects) {
    console.log(`\n--- 项目: ${project} ---`);
    
    // 在项目上下文中测试路径
    await ProjectSession.withProjectContext(project, async () => {
      console.log(`当前项目: ${ProjectSession.getCurrentProject()}`);
      
      const dataDir = await getDataDir(true); // 强制刷新
      const tasksFile = await getTasksFilePath();
      
      console.log(`数据目录: ${dataDir}`);
      console.log(`任务文件: ${tasksFile}`);
      
      // 检查文件是否存在
      const fs = await import('fs');
      
      try {
        const stats = await fs.promises.stat(tasksFile);
        console.log(`✅ 任务文件存在，大小: ${stats.size} 字节`);
        
        // 读取文件内容
        const content = await fs.promises.readFile(tasksFile, 'utf-8');
        const lines = content.split('\n');
        console.log(`文件行数: ${lines.length}`);
        console.log(`前3行:`);
        lines.slice(0, 3).forEach((line, i) => {
          console.log(`  ${i + 1}: ${line}`);
        });
        console.log(`后3行:`);
        lines.slice(-3).forEach((line, i) => {
          console.log(`  ${lines.length - 3 + i + 1}: ${line}`);
        });
        
      } catch (error) {
        console.log(`❌ 任务文件不存在或无法读取: ${error.message}`);
        
        // 列出数据目录内容
        try {
          const dirContents = await fs.promises.readdir(dataDir);
          console.log(`数据目录内容: ${dirContents.join(', ')}`);
        } catch (dirError) {
          console.log(`❌ 无法读取数据目录: ${dirError.message}`);
        }
      }
    });
  }
  
  // 检查我们创建的测试文件
  console.log('\n--- 检查创建的测试文件 ---');
  
  const testFiles = [
    'E:\\MCP\\mcp-shrimp-task-manager\\shrimpdata\\TestProject1\\tasks.json',
    'E:\\MCP\\mcp-shrimp-task-manager\\shrimpdata\\TestProject2\\tasks.json'
  ];
  
  const fs = await import('fs');
  
  for (const file of testFiles) {
    try {
      const stats = await fs.promises.stat(file);
      console.log(`✅ ${file} 存在，大小: ${stats.size} 字节`);
    } catch (error) {
      console.log(`❌ ${file} 不存在`);
    }
  }
  
} catch (error) {
  console.error('❌ 调试脚本错误:', error);
  console.error('错误堆栈:', error.stack);
}