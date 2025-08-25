/**
 * 测试项目根目录检测逻辑
 */

import * as path from 'path';
import * as fs from 'fs';

function findProjectRoot(startDir = process.cwd()) {
  console.log(`🔍 [TEST] Starting search from: ${startDir}`);
  
  let projectRoot = startDir;
  let iterations = 0;
  const maxIterations = 10; // 防止无限循环
  
  while (projectRoot !== path.dirname(projectRoot) && iterations < maxIterations) {
    console.log(`📁 [TEST] Checking directory: ${projectRoot}`);
    
    const packageJsonPath = path.join(projectRoot, 'package.json');
    console.log(`📄 [TEST] Looking for: ${packageJsonPath}`);
    console.log(`📄 [TEST] Exists: ${fs.existsSync(packageJsonPath)}`);
    
    if (fs.existsSync(packageJsonPath)) {
      console.log(`✅ [TEST] Found project root: ${projectRoot}`);
      return projectRoot;
    }
    
    projectRoot = path.dirname(projectRoot);
    iterations++;
  }
  
  console.log(`❌ [TEST] No project root found after ${iterations} iterations`);
  return startDir; // 回退到起始目录
}

console.log('🚀 [TEST] Testing project root detection...');
console.log(`📁 [TEST] Current working directory: ${process.cwd()}`);

// 测试1：从当前工作目录开始
const rootFromCwd = findProjectRoot();

// 测试2：从不同的子目录开始
const srcDir = path.join(process.cwd(), 'src');
if (fs.existsSync(srcDir)) {
  console.log('\n🔄 [TEST] Testing from src directory...');
  const rootFromSrc = findProjectRoot(srcDir);
}

const toolsDir = path.join(process.cwd(), 'src', 'tools');
if (fs.existsSync(toolsDir)) {
  console.log('\n🔄 [TEST] Testing from tools directory...');
  const rootFromTools = findProjectRoot(toolsDir);
}

// 测试3：验证找到的根目录是否包含预期文件
console.log('\n📋 [TEST] Validating project root contents...');
const expectedFiles = ['package.json', 'src', 'dist', 'tsconfig.json'];
expectedFiles.forEach(file => {
  const filePath = path.join(rootFromCwd, file);
  console.log(`📄 [TEST] ${file}: ${fs.existsSync(filePath) ? '✅' : '❌'}`);
});

// 测试4：测试目标文件路径解析
console.log('\n🎯 [TEST] Testing target file resolution...');
const testFile = 'src/test-real-quality.ts';
const resolvedPath = path.resolve(rootFromCwd, testFile);
console.log(`📄 [TEST] Target file: ${resolvedPath}`);
console.log(`📄 [TEST] File exists: ${fs.existsSync(resolvedPath) ? '✅' : '❌'}`);