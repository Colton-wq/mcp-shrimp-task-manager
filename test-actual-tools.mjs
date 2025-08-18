/**
 * 测试实际的 MCP 工具调用
 */

console.log('🔍 测试实际的 MCP 工具调用\n');

try {
  // 导入实际的工具函数
  const { listTasks } = await import('./dist/tools/task/listTasks.js');
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  const { setGlobalServer } = await import('./dist/utils/paths.js');
  
  // 创建模拟服务器
  const mockServer = {
    listRoots: async () => ({
      roots: [
        { uri: 'file:///E:/MCP/mcp-shrimp-task-manager' }
      ]
    })
  };
  
  // 设置全局服务器
  setGlobalServer(mockServer);
  console.log('✅ 模拟服务器设置完成');
  
  // 测试不同项目的工具调用
  const testProjects = ['TestProject1', 'TestProject2'];
  
  for (const project of testProjects) {
    console.log(`\n--- 测试项目: ${project} ---`);
    
    try {
      // 调用 listTasks 工具
      const result = await listTasks({
        status: 'all',
        project: project
      });
      
      console.log(`✅ listTasks 调用成功`);
      
      // 检查结果中是否包含项目元数据
      if (result.content && result.content[0] && result.content[0].text) {
        const text = result.content[0].text;
        
        // 检查是否包含项目元数据
        const hasProjectMetadata = text.includes(`<!-- Project: ${project} -->`);
        console.log(`包含项目元数据: ${hasProjectMetadata ? '✅' : '❌'}`);
        
        // 检查是否包含项目上下文警告
        const hasContextWarning = text.includes('项目上下文不匹配警告');
        console.log(`包含上下文警告: ${hasContextWarning ? '⚠️' : '✅'}`);
        
        // 显示结果的前几行
        const lines = text.split('\n').slice(0, 5);
        console.log('结果预览:');
        lines.forEach((line, index) => {
          console.log(`  ${index + 1}: ${line}`);
        });
        
        // 显示最后几行（包含元数据）
        const allLines = text.split('\n');
        const lastLines = allLines.slice(-3);
        console.log('结果尾部:');
        lastLines.forEach((line, index) => {
          console.log(`  ${allLines.length - 3 + index + 1}: ${line}`);
        });
        
      } else {
        console.log('❌ 结果格式异常');
      }
      
    } catch (error) {
      console.log(`❌ listTasks 调用失败: ${error.message}`);
      console.log(`错误堆栈: ${error.stack}`);
    }
  }
  
  // 测试项目上下文验证工具
  console.log('\n--- 测试项目上下文验证工具 ---');
  
  try {
    const { validateProjectContext } = await import('./dist/tools/project/validateProjectContext.js');
    
    const validationResult = await validateProjectContext({
      project: 'TestProject1',
      autoDetect: true
    });
    
    console.log('✅ validateProjectContext 调用成功');
    
    if (validationResult.content && validationResult.content[0]) {
      const text = validationResult.content[0].text;
      console.log('验证结果预览:');
      const lines = text.split('\n').slice(0, 10);
      lines.forEach((line, index) => {
        console.log(`  ${index + 1}: ${line}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ validateProjectContext 调用失败: ${error.message}`);
  }
  
  // 测试项目切换
  console.log('\n--- 测试项目切换 ---');
  
  try {
    const { switchProject } = await import('./dist/tools/project/switchProject.js');
    
    const switchResult = await switchProject({
      project: 'TestProject1'
    });
    
    console.log('✅ switchProject 调用成功');
    console.log(`当前项目: ${ProjectSession.getCurrentProject()}`);
    
    if (switchResult.content && switchResult.content[0]) {
      const text = switchResult.content[0].text;
      console.log('切换结果预览:');
      const lines = text.split('\n').slice(0, 5);
      lines.forEach((line, index) => {
        console.log(`  ${index + 1}: ${line}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ switchProject 调用失败: ${error.message}`);
  }
  
} catch (error) {
  console.error('❌ 测试脚本错误:', error);
  console.error('错误堆栈:', error.stack);
}