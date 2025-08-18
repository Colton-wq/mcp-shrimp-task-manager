/**
 * 调试 getProjectContext 方法
 */

console.log('🔍 调试 getProjectContext 方法\n');

try {
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  
  // 创建详细的模拟服务器
  const mockServer = {
    listRoots: async () => {
      const result = {
        roots: [
          { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
        ]
      };
      console.log('📞 mockServer.listRoots() 被调用，返回:', JSON.stringify(result, null, 2));
      return result;
    }
  };
  
  const testProject = 'TestProject1';
  console.log(`测试项目: ${testProject}`);
  console.log(`平台: ${process.platform}`);
  
  // 手动模拟 getProjectContext 的逻辑
  console.log('\n--- 手动模拟 getProjectContext 逻辑 ---');
  
  try {
    const roots = await mockServer.listRoots();
    console.log(`获取到的 roots:`, roots);
    
    let projectRoot = "";
    
    if (roots.roots && roots.roots.length > 0) {
      console.log(`roots.roots 存在，长度: ${roots.roots.length}`);
      
      const firstFileRoot = roots.roots.find((root) =>
        root.uri.startsWith("file://")
      );
      
      console.log(`找到的第一个 file:// 根目录:`, firstFileRoot);
      
      if (firstFileRoot) {
        // Extract actual path from file:// URI
        if (process.platform === 'win32') {
          projectRoot = firstFileRoot.uri.replace("file:///", "").replace(/\//g, "\\");
        } else {
          projectRoot = firstFileRoot.uri.replace("file://", "");
        }
        console.log(`提取的项目根目录: ${projectRoot}`);
      }
    } else {
      console.log('❌ roots.roots 不存在或为空');
    }
    
    if (!projectRoot) {
      console.log('❌ projectRoot 为空，将返回 null');
    } else {
      console.log('✅ projectRoot 有效，继续创建上下文');
      
      // 模拟项目名称清理
      const projectId = testProject.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      console.log(`项目ID: ${projectId}`);
      
      // 模拟路径生成
      const path = await import('path');
      const sanitizedProjectName = projectId; // 简化版清理
      
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
      
      const tasksFilePath = path.join(dataDir, "tasks.json");
      console.log(`生成的任务文件路径: ${tasksFilePath}`);
    }
    
  } catch (error) {
    console.log(`❌ 手动模拟错误: ${error.message}`);
  }
  
  // 调用实际的 getProjectContext 方法
  console.log('\n--- 调用实际的 getProjectContext 方法 ---');
  
  try {
    const context = await ProjectSession.getProjectContext(testProject, mockServer);
    
    if (context) {
      console.log('✅ 获取到项目上下文:');
      console.log(`   项目ID: ${context.projectId}`);
      console.log(`   项目名称: ${context.projectName}`);
      console.log(`   项目根目录: ${context.projectRoot}`);
      console.log(`   数据目录: ${context.dataDir}`);
      console.log(`   任务文件: ${context.tasksFilePath}`);
    } else {
      console.log('❌ 未获取到项目上下文 (返回 null)');
    }
  } catch (error) {
    console.log(`❌ getProjectContext 错误: ${error.message}`);
    console.log(`错误堆栈: ${error.stack}`);
  }
  
} catch (error) {
  console.error('❌ 调试脚本错误:', error);
  console.error('错误堆栈:', error.stack);
}