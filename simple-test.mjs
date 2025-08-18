/**
 * 简单的多项目隔离测试
 */

console.log('🚀 开始多项目隔离功能测试\n');

try {
  // 测试1：验证编译后的模块可以正常导入
  console.log('📦 测试模块导入...');
  
  const { ProjectSession } = await import('./dist/utils/projectSession.js');
  console.log('✅ ProjectSession 导入成功');
  
  const { getDataDir, getTasksFilePath } = await import('./dist/utils/paths.js');
  console.log('✅ 路径工具导入成功');
  
  // 测试2：验证项目上下文管理
  console.log('\n🔧 测试项目上下文管理...');
  
  const originalProject = ProjectSession.getCurrentProject();
  console.log(`当前项目: ${originalProject}`);
  
  // 测试项目切换
  const testProjects = ['TestProject1', 'TestProject2', 'TestProject3'];
  
  for (const project of testProjects) {
    ProjectSession.setCurrentProject(project);
    const currentProject = ProjectSession.getCurrentProject();
    
    if (currentProject === project) {
      console.log(`✅ 成功切换到项目: ${project}`);
    } else {
      console.log(`❌ 项目切换失败: 期望 ${project}, 实际 ${currentProject}`);
    }
  }
  
  // 恢复原项目
  ProjectSession.setCurrentProject(originalProject);
  console.log(`✅ 恢复原项目: ${ProjectSession.getCurrentProject()}`);
  
  // 测试3：验证并发安全机制
  console.log('\n🔒 测试并发安全机制...');
  
  const concurrentTests = testProjects.map(async (project, index) => {
    return ProjectSession.withProjectContext(project, async () => {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
      return {
        index,
        expectedProject: project,
        actualProject: ProjectSession.getCurrentProject()
      };
    });
  });
  
  const results = await Promise.all(concurrentTests);
  
  let concurrentTestsPassed = 0;
  for (const result of results) {
    if (result.actualProject === result.expectedProject) {
      console.log(`✅ 并发测试 ${result.index + 1}: ${result.expectedProject}`);
      concurrentTestsPassed++;
    } else {
      console.log(`❌ 并发测试 ${result.index + 1}: 期望 ${result.expectedProject}, 实际 ${result.actualProject}`);
    }
  }
  
  // 测试4：验证路径生成
  console.log('\n📁 测试路径生成...');
  
  for (const project of testProjects) {
    await ProjectSession.withProjectContext(project, async () => {
      try {
        const dataDir = await getDataDir();
        const tasksFile = await getTasksFilePath();
        
        console.log(`✅ 项目 ${project}:`);
        console.log(`   数据目录: ${dataDir}`);
        console.log(`   任务文件: ${tasksFile}`);
        
        // 验证路径包含项目标识
        const hasProjectInPath = dataDir.includes(project) || tasksFile.includes(project);
        if (hasProjectInPath) {
          console.log(`   ✅ 路径包含项目标识`);
        } else {
          console.log(`   ❌ 路径未包含项目标识`);
        }
        
      } catch (error) {
        console.log(`   ❌ 路径生成错误: ${error.message}`);
      }
    });
  }
  
  // 测试5：验证项目上下文验证功能
  console.log('\n🔍 测试项目上下文验证...');
  
  // 测试验证功能
  const testContent = `{
    "tasks": [
      {"id": "1", "name": "Test Task", "description": "Test"}
    ]
  }
  
  <!-- Project: TestProject1 -->`;
  
  const validation1 = ProjectSession.validateProjectContext('TestProject1', testContent);
  console.log(`✅ 正确项目验证: ${validation1.isValid ? '通过' : '失败'}`);
  
  const validation2 = ProjectSession.validateProjectContext('TestProject2', testContent);
  console.log(`✅ 错误项目验证: ${validation2.isValid ? '失败' : '通过'}`);
  if (!validation2.isValid) {
    console.log(`   检测到项目: ${validation2.detectedProject}`);
  }
  
  // 测试自动检测功能
  const detection = ProjectSession.autoDetectProject(testContent);
  console.log(`✅ 自动检测: 项目=${detection.detectedProject}, 置信度=${(detection.confidence * 100).toFixed(1)}%`);
  
  // 测试统计功能
  console.log('\n📊 测试统计功能...');
  const stats = ProjectSession.getProjectContextStats();
  console.log(`✅ 统计信息:`);
  console.log(`   活动上下文: ${stats.activeContexts}`);
  console.log(`   当前项目: ${stats.currentProject}`);
  console.log(`   缓存大小: ${stats.cacheSize}`);
  
  console.log('\n🎉 所有测试完成！');
  console.log(`✅ 并发测试通过率: ${concurrentTestsPassed}/${testProjects.length}`);
  
} catch (error) {
  console.error('❌ 测试执行错误:', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
}