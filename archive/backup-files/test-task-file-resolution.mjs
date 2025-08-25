/**
 * 测试任务文件解析
 */

import { findProjectRoot } from './dist/utils/projectRootDetector.js';
import { getTaskById } from './dist/models/taskModel.js';
import * as path from 'path';
import * as fs from 'fs';

async function testTaskFileResolution() {
  console.log('🚀 [TEST] Testing task file resolution...');
  
  try {
    // 1. 获取项目根目录
    const projectRoot = findProjectRoot({ debug: true });
    console.log(`✅ [TEST] Project root: ${projectRoot}`);
    
    // 2. 获取任务信息
    const taskId = '9df4b9fa-1b0e-4882-b1ff-09541cd65e28';
    const project = 'code-quality-test';
    
    const task = await getTaskById(taskId, project);
    if (!task) {
      console.log('❌ [TEST] Task not found');
      return;
    }
    
    console.log(`✅ [TEST] Task found: ${task.name}`);
    console.log(`📋 [TEST] Related files count: ${task.relatedFiles?.length || 0}`);
    
    // 3. 测试文件路径解析
    if (task.relatedFiles) {
      for (const file of task.relatedFiles) {
        console.log(`\n📄 [TEST] Processing file:`);
        console.log(`  Path: ${file.path}`);
        console.log(`  Type: ${file.type}`);
        console.log(`  Description: ${file.description}`);
        
        const fullPath = path.isAbsolute(file.path) ? file.path : path.resolve(projectRoot, file.path);
        console.log(`  Full path: ${fullPath}`);
        console.log(`  Exists: ${fs.existsSync(fullPath) ? '✅' : '❌'}`);
        
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          console.log(`  Size: ${stats.size} bytes`);
          console.log(`  Modified: ${stats.mtime}`);
        }
      }
    } else {
      console.log('❌ [TEST] No related files found');
    }
    
    // 4. 测试 targetFiles 路径解析
    console.log('\n🎯 [TEST] Testing targetFiles resolution...');
    const targetFiles = ["src/test-real-quality.ts"];
    
    for (const filePath of targetFiles) {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
      console.log(`📄 [TEST] Target file: ${fullPath}`);
      console.log(`📄 [TEST] Exists: ${fs.existsSync(fullPath) ? '✅' : '❌'}`);
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  }
}

testTaskFileResolution();