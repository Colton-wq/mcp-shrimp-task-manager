/**
 * 调试 getProjectContext 方法中的异常
 */

console.log('🔍 调试 getProjectContext 方法中的异常\n');

try {
  // 我们需要修改 ProjectSession 类来暴露异常
  // 由于我们无法直接修改编译后的代码，让我们尝试其他方法
  
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  
  // 创建模拟服务器
  const mockServer = {
    listRoots: async () => ({
      roots: [
        { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
      ]
    })
  };
  
  const testProject = 'TestProject1';
  
  // 尝试手动重现 getProjectContext 的逻辑，逐步检查每个部分
  console.log('--- 逐步重现 getProjectContext 逻辑 ---');
  
  try {
    // 1. 检查缓存
    console.log('1. 检查缓存...');
    const stats = ProjectSession.getProjectContextStats();
    console.log(`缓存大小: ${stats.cacheSize}`);
    
    // 2. 调用 listRoots
    console.log('2. 调用 listRoots...');
    const roots = await mockServer.listRoots();
    console.log(`roots 结果:`, roots);
    
    // 3. 检查 roots 结构
    console.log('3. 检查 roots 结构...');
    console.log(`roots.roots 存在: ${!!roots.roots}`);
    console.log(`roots.roots 长度: ${roots.roots ? roots.roots.length : 'N/A'}`);
    
    if (roots.roots && roots.roots.length > 0) {
      const firstFileRoot = roots.roots.find((root) =>
        root.uri.startsWith("file://")
      );
      console.log(`第一个 file:// 根目录:`, firstFileRoot);
      
      if (firstFileRoot) {
        // 4. 提取路径
        console.log('4. 提取路径...');
        let projectRoot = "";
        if (process.platform === 'win32') {
          projectRoot = firstFileRoot.uri.replace("file:///", "").replace(/\//g, "\\");
        } else {
          projectRoot = firstFileRoot.uri.replace("file://", "");
        }
        console.log(`提取的项目根目录: ${projectRoot}`);
        
        // 5. 创建项目上下文对象
        console.log('5. 创建项目上下文对象...');
        
        try {
          const projectId = testProject.toLowerCase().replace(/[^a-z0-9-]/g, '-');
          console.log(`项目ID: ${projectId}`);
          
          // 6. 调用 generateDataDir (这里可能出错)
          console.log('6. 生成数据目录...');
          
          // 手动实现 generateDataDir 逻辑
          const path = await import('path');
          const sanitizedProjectName = projectId;
          
          let dataDir = "";
          if (process.env.DATA_DIR) {
            if (path.isAbsolute(process.env.DATA_DIR)) {
              dataDir = path.join(process.env.DATA_DIR, sanitizedProjectName);
            } else {
              dataDir = path.join(projectRoot, process.env.DATA_DIR);
            }
          } else {
            dataDir = path.join(projectRoot, "data");
          }
          console.log(`生成的数据目录: ${dataDir}`);
          
          // 7. 生成任务文件路径
          console.log('7. 生成任务文件路径...');
          const tasksFilePath = path.join(dataDir, "tasks.json");
          console.log(`生成的任务文件路径: ${tasksFilePath}`);
          
          // 8. 创建上下文对象
          console.log('8. 创建上下文对象...');
          const context = {
            projectId,
            projectName: testProject,
            projectRoot,
            dataDir,
            tasksFilePath,
            lastAccessed: new Date()
          };
          console.log('✅ 上下文对象创建成功:', context);
          
        } catch (error) {
          console.log(`❌ 创建上下文对象时出错: ${error.message}`);
          console.log(`错误堆栈: ${error.stack}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`❌ 逐步重现过程中出错: ${error.message}`);
    console.log(`错误堆栈: ${error.stack}`);
  }
  
  // 现在尝试调用实际的方法
  console.log('\n--- 调用实际的 getProjectContext 方法 ---');
  
  // 由于我们无法直接捕获内部异常，让我们尝试一些可能导致问题的情况
  
  // 测试不同的项目名称
  const testProjects = ['TestProject1', 'test-project', 'simple', 'a'];
  
  for (const project of testProjects) {
    try {
      console.log(`\n测试项目: "${project}"`);
      const context = await ProjectSession.getProjectContext(project, mockServer);
      
      if (context) {
        console.log(`✅ 成功: ${context.dataDir}`);
      } else {
        console.log(`❌ 失败: 返回 null`);
      }
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`);
    }
  }
  
} catch (error) {
  console.error('❌ 调试脚本错误:', error);
  console.error('错误堆栈:', error.stack);
}