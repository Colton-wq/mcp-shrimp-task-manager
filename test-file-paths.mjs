/**
 * 测试文件路径解析
 */

import * as path from 'path';
import * as fs from 'fs';

console.log('🔍 [TEST] Testing file path resolution...');

// 模拟代码审查工具的路径解析逻辑
const __dirname = path.dirname(new URL(import.meta.url).pathname);
console.log(`📁 [TEST] __dirname: ${__dirname}`);

const projectRoot = path.resolve(__dirname, '../../../');
console.log(`📁 [TEST] projectRoot: ${projectRoot}`);

const testFile = 'src/test-real-quality.ts';
const fullPath = path.resolve(projectRoot, testFile);
console.log(`📄 [TEST] fullPath: ${fullPath}`);
console.log(`📄 [TEST] File exists: ${fs.existsSync(fullPath)}`);

// 尝试不同的路径解析方法
const alternativePath = path.resolve(process.cwd(), testFile);
console.log(`📄 [TEST] alternativePath: ${alternativePath}`);
console.log(`📄 [TEST] Alternative exists: ${fs.existsSync(alternativePath)}`);

// 直接检查已知的正确路径
const knownPath = 'e:/MCP/mcp-shrimp-task-manager/src/test-real-quality.ts';
console.log(`📄 [TEST] knownPath: ${knownPath}`);
console.log(`📄 [TEST] Known exists: ${fs.existsSync(knownPath)}`);

// 检查当前工作目录
console.log(`📁 [TEST] Current working directory: ${process.cwd()}`);

// 列出项目根目录的内容
try {
  const rootContents = fs.readdirSync(projectRoot);
  console.log(`📁 [TEST] Project root contents: ${rootContents.join(', ')}`);
  
  if (rootContents.includes('src')) {
    const srcContents = fs.readdirSync(path.join(projectRoot, 'src'));
    console.log(`📁 [TEST] src directory contents: ${srcContents.join(', ')}`);
  }
} catch (error) {
  console.error(`❌ [TEST] Error reading directories: ${error}`);
}