/**
 * 多项目隔离功能综合测试脚本
 * Comprehensive test script for multi-project isolation functionality
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试配置
const TEST_CONFIG = {
  projects: ['TestProject1', 'TestProject2', 'TestProject3'],
  dataDir: process.env.DATA_DIR || path.join(__dirname, 'shrimpdata'),
  testTasks: [
    { name: 'Task-P1-Alpha', description: 'Alpha task for project 1' },
    { name: 'Task-P2-Beta', description: 'Beta task for project 2' },
    { name: 'Task-P3-Gamma', description: 'Gamma task for project 3' }
  ]
};

// 测试结果收集器
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * 记录测试结果
 */
function logTest(testName, passed, details = '') {
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    testResults.errors.push(`❌ ${testName}: ${details}`);
    console.log(`❌ ${testName}: ${details}`);
  }
}

/**
 * 检查文件是否存在
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 读取JSON文件
 */
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * 测试1：验证项目数据目录隔离
 */
async function testProjectDirectoryIsolation() {
  console.log('\n🔍 测试1：项目数据目录隔离');
  
  for (const project of TEST_CONFIG.projects) {
    const projectDir = path.join(TEST_CONFIG.dataDir, project);
    const tasksFile = path.join(projectDir, 'tasks.json');
    
    // 检查项目目录是否独立
    const dirExists = await fileExists(projectDir);
    logTest(`项目 ${project} 目录存在`, dirExists, `目录: ${projectDir}`);
    
    if (dirExists) {
      // 检查任务文件路径
      const tasksExists = await fileExists(tasksFile);
      logTest(`项目 ${project} 任务文件存在`, tasksExists, `文件: ${tasksFile}`);
    }
  }
}

/**
 * 测试2：验证项目数据隔离
 */
async function testProjectDataIsolation() {
  console.log('\n🔍 测试2：项目数据隔离');
  
  const projectTasks = {};
  
  for (const project of TEST_CONFIG.projects) {
    const tasksFile = path.join(TEST_CONFIG.dataDir, project, 'tasks.json');
    const tasks = await readJsonFile(tasksFile);
    
    if (tasks && tasks.tasks) {
      projectTasks[project] = tasks.tasks;
      
      // 检查任务是否包含正确的项目元数据
      const fileContent = await fs.readFile(tasksFile, 'utf-8').catch(() => '');
      const hasProjectMetadata = fileContent.includes(`<!-- Project: ${project} -->`);
      logTest(`项目 ${project} 包含正确的元数据`, hasProjectMetadata);
      
      // 检查任务数据是否属于正确的项目
      const projectSpecificTasks = tasks.tasks.filter(task => 
        task.name.includes(project.replace('TestProject', 'P'))
      );
      logTest(`项目 ${project} 包含项目特定任务`, projectSpecificTasks.length > 0);
    }
  }
  
  // 检查项目间数据不交叉
  const allProjects = Object.keys(projectTasks);
  for (let i = 0; i < allProjects.length; i++) {
    for (let j = i + 1; j < allProjects.length; j++) {
      const project1 = allProjects[i];
      const project2 = allProjects[j];
      
      if (projectTasks[project1] && projectTasks[project2]) {
        const tasks1 = projectTasks[project1];
        const tasks2 = projectTasks[project2];
        
        // 检查是否有任务ID重复
        const ids1 = tasks1.map(t => t.id);
        const ids2 = tasks2.map(t => t.id);
        const duplicateIds = ids1.filter(id => ids2.includes(id));
        
        logTest(`项目 ${project1} 和 ${project2} 无重复任务ID`, duplicateIds.length === 0, 
          `重复ID: ${duplicateIds.join(', ')}`);
      }
    }
  }
}

/**
 * 测试3：验证项目上下文验证机制
 */
async function testProjectContextValidation() {
  console.log('\n🔍 测试3：项目上下文验证机制');
  
  try {
    // 导入项目会话管理
    const { ProjectSession } = await import('./dist/utils/projectSession.js');
    
    // 测试项目上下文验证
    for (const project of TEST_CONFIG.projects) {
      const tasksFile = path.join(TEST_CONFIG.dataDir, project, 'tasks.json');
      const fileExists = await fs.access(tasksFile).then(() => true).catch(() => false);
      
      if (fileExists) {
        const fileContent = await fs.readFile(tasksFile, 'utf-8');
        const validation = ProjectSession.validateProjectContext(project, fileContent);
        
        logTest(`项目 ${project} 上下文验证通过`, validation.isValid, 
          validation.suggestion || '');
      }
    }
    
    // 测试自动检测功能
    for (const project of TEST_CONFIG.projects) {
      const tasksFile = path.join(TEST_CONFIG.dataDir, project, 'tasks.json');
      const fileExists = await fs.access(tasksFile).then(() => true).catch(() => false);
      
      if (fileExists) {
        const fileContent = await fs.readFile(tasksFile, 'utf-8');
        const detection = ProjectSession.autoDetectProject(fileContent);
        
        logTest(`项目 ${project} 自动检测功能正常`, 
          detection.detectedProject === project || detection.confidence > 0.5);
      }
    }
    
  } catch (error) {
    logTest('项目上下文验证机制', false, `导入错误: ${error.message}`);
  }
}

/**
 * 测试4：验证并发安全机制
 */
async function testConcurrentSafety() {
  console.log('\n🔍 测试4：并发安全机制');
  
  try {
    const { ProjectSession } = await import('./dist/utils/projectSession.js');
    
    // 测试并发上下文管理
    const concurrentOperations = TEST_CONFIG.projects.map(async (project, index) => {
      return ProjectSession.withProjectContext(project, async () => {
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return ProjectSession.getCurrentProject();
      });
    });
    
    const results = await Promise.all(concurrentOperations);
    
    // 验证每个操作都返回了正确的项目上下文
    for (let i = 0; i < results.length; i++) {
      const expectedProject = TEST_CONFIG.projects[i];
      const actualProject = results[i];
      logTest(`并发操作 ${i + 1} 项目上下文正确`, 
        actualProject === expectedProject, 
        `期望: ${expectedProject}, 实际: ${actualProject}`);
    }
    
    // 测试上下文统计
    const stats = ProjectSession.getProjectContextStats();
    logTest('项目上下文统计功能正常', 
      typeof stats.activeContexts === 'number' && 
      typeof stats.currentProject === 'string' && 
      typeof stats.cacheSize === 'number');
    
  } catch (error) {
    logTest('并发安全机制', false, `测试错误: ${error.message}`);
  }
}

/**
 * 测试5：验证路径生成机制
 */
async function testPathGeneration() {
  console.log('\n🔍 测试5：路径生成机制');
  
  try {
    const { getDataDir, getTasksFilePath } = await import('./dist/utils/paths.js');
    const { ProjectSession } = await import('./dist/utils/projectSession.js');
    
    // 测试不同项目的路径生成
    for (const project of TEST_CONFIG.projects) {
      // 临时切换项目上下文
      const originalProject = ProjectSession.getCurrentProject();
      ProjectSession.setCurrentProject(project);
      
      try {
        const dataDir = await getDataDir();
        const tasksFile = await getTasksFilePath();
        
        // 验证路径包含项目名称
        const containsProject = dataDir.includes(project) || tasksFile.includes(project);
        logTest(`项目 ${project} 路径生成包含项目标识`, containsProject, 
          `数据目录: ${dataDir}, 任务文件: ${tasksFile}`);
        
        // 验证路径是绝对路径
        logTest(`项目 ${project} 生成绝对路径`, path.isAbsolute(dataDir) && path.isAbsolute(tasksFile));
        
      } finally {
        // 恢复原项目上下文
        ProjectSession.setCurrentProject(originalProject);
      }
    }
    
  } catch (error) {
    logTest('路径生成机制', false, `测试错误: ${error.message}`);
  }
}

/**
 * 测试6：验证项目切换功能
 */
async function testProjectSwitching() {
  console.log('\n🔍 测试6：项目切换功能');
  
  try {
    const { ProjectSession } = await import('./dist/utils/projectSession.js');
    
    const originalProject = ProjectSession.getCurrentProject();
    
    // 测试项目切换
    for (const project of TEST_CONFIG.projects) {
      ProjectSession.setCurrentProject(project);
      const currentProject = ProjectSession.getCurrentProject();
      
      logTest(`切换到项目 ${project}`, currentProject === project, 
        `期望: ${project}, 实际: ${currentProject}`);
    }
    
    // 恢复原项目
    ProjectSession.setCurrentProject(originalProject);
    logTest('恢复原项目上下文', ProjectSession.getCurrentProject() === originalProject);
    
  } catch (error) {
    logTest('项目切换功能', false, `测试错误: ${error.message}`);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始多项目隔离功能综合测试\n');
  console.log(`测试配置:`);
  console.log(`- 项目列表: ${TEST_CONFIG.projects.join(', ')}`);
  console.log(`- 数据目录: ${TEST_CONFIG.dataDir}`);
  
  try {
    await testProjectDirectoryIsolation();
    await testProjectDataIsolation();
    await testProjectContextValidation();
    await testConcurrentSafety();
    await testPathGeneration();
    await testProjectSwitching();
    
  } catch (error) {
    console.error('❌ 测试执行错误:', error);
    testResults.failed++;
    testResults.errors.push(`测试执行错误: ${error.message}`);
  }
  
  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败详情:');
    testResults.errors.forEach(error => console.log(`  ${error}`));
  }
  
  // 返回测试是否全部通过
  return testResults.failed === 0;
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试脚本执行失败:', error);
    process.exit(1);
  });
}

export { runTests, TEST_CONFIG };