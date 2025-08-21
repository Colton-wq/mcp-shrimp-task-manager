/**
 * 测试多项目环境处理
 */

import * as path from 'path';
import * as fs from 'fs';

function findProjectRoot(startDir = process.cwd()) {
  let projectRoot = startDir;
  let iterations = 0;
  const maxIterations = 10;
  
  while (projectRoot !== path.dirname(projectRoot) && iterations < maxIterations) {
    if (fs.existsSync(path.join(projectRoot, 'package.json'))) {
      return projectRoot;
    }
    projectRoot = path.dirname(projectRoot);
    iterations++;
  }
  
  return startDir; // 回退到起始目录
}

console.log('🚀 [TEST] Testing multi-project scenarios...');

// 场景1：当前项目（mcp-shrimp-task-manager）
console.log('\n📁 [SCENARIO 1] Current project (mcp-shrimp-task-manager)');
const currentProject = findProjectRoot();
console.log(`Root: ${currentProject}`);
console.log(`Has package.json: ${fs.existsSync(path.join(currentProject, 'package.json'))}`);

// 场景2：模拟嵌套项目结构
console.log('\n📁 [SCENARIO 2] Nested project structure');
// 检查是否有嵌套的项目（如 tools/task-viewer）
const nestedProject = path.join(currentProject, 'tools', 'task-viewer');
if (fs.existsSync(nestedProject)) {
  console.log(`Testing nested project: ${nestedProject}`);
  const nestedRoot = findProjectRoot(nestedProject);
  console.log(`Nested project root: ${nestedRoot}`);
  console.log(`Has package.json: ${fs.existsSync(path.join(nestedRoot, 'package.json'))}`);
  
  // 验证是否正确识别了嵌套项目而不是父项目
  if (nestedRoot === nestedProject) {
    console.log('✅ Correctly identified nested project root');
  } else if (nestedRoot === currentProject) {
    console.log('⚠️ Identified parent project root (may be expected behavior)');
  } else {
    console.log('❌ Unexpected project root identified');
  }
} else {
  console.log('No nested project found for testing');
}

// 场景3：模拟从不同工作目录启动
console.log('\n📁 [SCENARIO 3] Different working directories');
const testDirs = [
  currentProject,
  path.join(currentProject, 'src'),
  path.join(currentProject, 'src', 'tools'),
  path.join(currentProject, 'dist'),
];

testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\nTesting from: ${dir}`);
    const root = findProjectRoot(dir);
    console.log(`Found root: ${root}`);
    
    // 验证目标文件解析
    const targetFile = path.resolve(root, 'src/test-real-quality.ts');
    console.log(`Target file: ${targetFile}`);
    console.log(`File exists: ${fs.existsSync(targetFile) ? '✅' : '❌'}`);
  }
});

// 场景4：模拟MCP服务器在不同目录启动的情况
console.log('\n📁 [SCENARIO 4] MCP server startup from different directories');

// 模拟从父目录启动
const parentDir = path.dirname(currentProject);
console.log(`\nSimulating startup from parent directory: ${parentDir}`);
// 注意：这里我们不能真正改变process.cwd()，但可以模拟逻辑
const rootFromParent = findProjectRoot(parentDir);
console.log(`Root found from parent: ${rootFromParent}`);

// 检查是否会错误地识别父目录为项目根
if (fs.existsSync(path.join(parentDir, 'package.json'))) {
  console.log('⚠️ Parent directory also has package.json - potential conflict');
} else {
  console.log('✅ Parent directory has no package.json - no conflict');
}

// 场景5：边界情况测试
console.log('\n📁 [SCENARIO 5] Edge cases');

// 测试根目录
console.log('Testing from filesystem root...');
const rootFromFilesystemRoot = findProjectRoot('E:\\');
console.log(`Root from E:\\: ${rootFromFilesystemRoot}`);

// 测试不存在的目录（模拟）
console.log('Testing error handling...');
try {
  const nonExistentDir = 'Z:\\non-existent-path';
  if (!fs.existsSync(nonExistentDir)) {
    console.log('✅ Non-existent directory handling would be needed');
  }
} catch (error) {
  console.log(`Error handling test: ${error.message}`);
}