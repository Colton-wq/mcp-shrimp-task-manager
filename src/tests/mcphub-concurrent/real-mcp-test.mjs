#!/usr/bin/env node

/**
 * 真实MCP工具调用并发测试
 * Real MCP Tool Call Concurrent Test
 * 
 * 直接调用编译后的MCP工具进行真实的并发测试
 * Directly calls compiled MCP tools for real concurrent testing
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 导入实际的MCP工具
const toolsPath = path.join(__dirname, '../../../dist/tools');

/**
 * 真实MCP工具测试器
 * Real MCP Tool Tester
 */
class RealMCPTester {
  constructor() {
    this.testResults = {
      projectIsolation: { passed: 0, failed: 0, details: [] },
      concurrentSafety: { passed: 0, failed: 0, details: [] },
      errorHandling: { passed: 0, failed: 0, details: [] },
      pathGeneration: { passed: 0, failed: 0, details: [] }
    };
    this.testProjects = ['test-concurrent-1', 'test-concurrent-2', 'test-concurrent-3'];
  }

  /**
   * 动态导入MCP工具
   * Dynamically import MCP tools
   */
  async importTools() {
    try {
      const { planTask } = await import(path.join(toolsPath, 'task/planTask.js'));
      const { listTasks } = await import(path.join(toolsPath, 'task/listTasks.js'));
      const { splitTasks } = await import(path.join(toolsPath, 'task/splitTasks.js'));
      const { queryTask } = await import(path.join(toolsPath, 'task/queryTask.js'));
      const { clearAllTasks } = await import(path.join(toolsPath, 'task/clearAllTasks.js'));
      
      this.tools = {
        planTask,
        listTasks,
        splitTasks,
        queryTask,
        clearAllTasks
      };
      
      console.log('✅ MCP tools imported successfully');
    } catch (error) {
      console.error('❌ Failed to import MCP tools:', error);
      throw error;
    }
  }

  /**
   * 测试项目隔离
   * Test project isolation
   */
  async testProjectIsolation() {
    console.log('\n🔒 Testing Project Isolation...');

    for (let i = 0; i < this.testProjects.length; i++) {
      const project = this.testProjects[i];
      
      try {
        // 清理项目
        await this.tools.clearAllTasks({ confirm: true, project });
        
        // 在每个项目中创建不同的任务
        const taskData = [{
          name: `Task-${project}-${i}`,
          description: `Test task for project ${project}`,
          implementationGuide: `Implementation for ${project}`,
          dependencies: [],
          relatedFiles: [],
          verificationCriteria: `Verification for ${project}`
        }];

        await this.tools.splitTasks({
          updateMode: 'clearAllTasks',
          tasksRaw: JSON.stringify(taskData),
          project
        });

        console.log(`✅ Created task in project: ${project}`);
        this.recordResult('projectIsolation', true, `Task created in ${project}`);

      } catch (error) {
        console.log(`❌ Failed to create task in project ${project}:`, error.message);
        this.recordResult('projectIsolation', false, `Failed to create task in ${project}: ${error.message}`);
      }
    }

    // 验证项目间隔离
    for (let i = 0; i < this.testProjects.length; i++) {
      const project = this.testProjects[i];
      
      try {
        const result = await this.tools.listTasks({ status: 'all', project });
        
        // 检查是否只包含当前项目的任务
        const hasOwnTasks = result.content[0].text.includes(`Task-${project}-${i}`);
        const hasOtherTasks = this.testProjects.some((otherProject, j) => 
          i !== j && result.content[0].text.includes(`Task-${otherProject}-${j}`)
        );

        if (hasOwnTasks && !hasOtherTasks) {
          console.log(`✅ Project ${project} properly isolated`);
          this.recordResult('projectIsolation', true, `Project ${project} isolation verified`);
        } else {
          console.log(`❌ Project ${project} isolation failed`);
          this.recordResult('projectIsolation', false, `Project ${project} isolation failed`);
        }

      } catch (error) {
        console.log(`❌ Failed to verify isolation for project ${project}:`, error.message);
        this.recordResult('projectIsolation', false, `Failed to verify ${project}: ${error.message}`);
      }
    }
  }

  /**
   * 测试并发安全性
   * Test concurrent safety
   */
  async testConcurrentSafety() {
    console.log('\n⚡ Testing Concurrent Safety...');

    // 并发创建任务
    const concurrentPromises = this.testProjects.map(async (project, index) => {
      try {
        const taskData = [{
          name: `Concurrent-Task-${project}-${Date.now()}`,
          description: `Concurrent test task for ${project}`,
          implementationGuide: `Concurrent implementation for ${project}`,
          dependencies: [],
          relatedFiles: [],
          verificationCriteria: `Concurrent verification for ${project}`
        }];

        const result = await this.tools.splitTasks({
          updateMode: 'append',
          tasksRaw: JSON.stringify(taskData),
          project
        });

        console.log(`✅ Concurrent task created in ${project}`);
        return { project, success: true, result };

      } catch (error) {
        console.log(`❌ Concurrent task creation failed in ${project}:`, error.message);
        return { project, success: false, error: error.message };
      }
    });

    const results = await Promise.all(concurrentPromises);
    
    // 分析结果
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`📊 Concurrent creation results: ${successful.length} success, ${failed.length} failed`);

    if (successful.length === this.testProjects.length) {
      this.recordResult('concurrentSafety', true, 'All concurrent operations succeeded');
    } else {
      this.recordResult('concurrentSafety', false, `${failed.length} concurrent operations failed`);
    }

    // 并发读取测试
    const readPromises = this.testProjects.map(async (project) => {
      try {
        const result = await this.tools.listTasks({ status: 'all', project });
        return { project, success: true, taskCount: result.content[0].text.split('\n').length };
      } catch (error) {
        return { project, success: false, error: error.message };
      }
    });

    const readResults = await Promise.all(readPromises);
    const successfulReads = readResults.filter(r => r.success);

    if (successfulReads.length === this.testProjects.length) {
      console.log('✅ All concurrent reads succeeded');
      this.recordResult('concurrentSafety', true, 'All concurrent reads succeeded');
    } else {
      console.log('❌ Some concurrent reads failed');
      this.recordResult('concurrentSafety', false, 'Some concurrent reads failed');
    }
  }

  /**
   * 测试错误处理
   * Test error handling
   */
  async testErrorHandling() {
    console.log('\n🛠️ Testing Error Handling...');

    // 测试缺少project参数
    try {
      await this.tools.listTasks({ status: 'all' }); // 故意省略project参数
      console.log('❌ Should have failed without project parameter');
      this.recordResult('errorHandling', false, 'Missing project parameter not caught');
    } catch (error) {
      if (error.message.includes('Project parameter is required')) {
        console.log('✅ Correctly caught missing project parameter');
        this.recordResult('errorHandling', true, 'Missing project parameter correctly caught');
      } else {
        console.log(`❌ Unexpected error: ${error.message}`);
        this.recordResult('errorHandling', false, `Unexpected error: ${error.message}`);
      }
    }

    // 测试无效project参数
    try {
      await this.tools.listTasks({ status: 'all', project: '' }); // 空project参数
      console.log('❌ Should have failed with empty project parameter');
      this.recordResult('errorHandling', false, 'Empty project parameter not caught');
    } catch (error) {
      console.log('✅ Correctly caught empty project parameter');
      this.recordResult('errorHandling', true, 'Empty project parameter correctly caught');
    }

    // 测试恢复能力
    try {
      const result = await this.tools.listTasks({ status: 'all', project: this.testProjects[0] });
      console.log('✅ Successfully recovered with valid parameters');
      this.recordResult('errorHandling', true, 'Successfully recovered after errors');
    } catch (error) {
      console.log(`❌ Failed to recover: ${error.message}`);
      this.recordResult('errorHandling', false, `Failed to recover: ${error.message}`);
    }
  }

  /**
   * 测试路径生成
   * Test path generation
   */
  async testPathGeneration() {
    console.log('\n📁 Testing Path Generation...');

    // 导入路径工具
    try {
      const { getDataDir, getTasksFilePath } = await import(path.join(__dirname, '../../../dist/utils/paths.js'));

      // 测试不同项目生成不同路径
      const paths = {};
      for (const project of this.testProjects) {
        try {
          const dataDir = await getDataDir(false, project);
          const tasksFile = await getTasksFilePath(false, project);
          
          paths[project] = { dataDir, tasksFile };
          console.log(`📂 Project ${project}: ${dataDir}`);
        } catch (error) {
          console.log(`❌ Path generation failed for ${project}: ${error.message}`);
          this.recordResult('pathGeneration', false, `Path generation failed for ${project}`);
          return;
        }
      }

      // 验证路径唯一性
      const dataDirs = Object.values(paths).map(p => p.dataDir);
      const uniqueDataDirs = [...new Set(dataDirs)];

      if (dataDirs.length === uniqueDataDirs.length) {
        console.log('✅ All projects have unique data directories');
        this.recordResult('pathGeneration', true, 'All projects have unique paths');
      } else {
        console.log('❌ Some projects share data directories');
        this.recordResult('pathGeneration', false, 'Path collision detected');
      }

      // 验证路径包含项目名
      let allContainProject = true;
      for (const [project, projectPaths] of Object.entries(paths)) {
        if (!projectPaths.dataDir.includes(project)) {
          console.log(`❌ Path for ${project} does not contain project name`);
          allContainProject = false;
        }
      }

      if (allContainProject) {
        console.log('✅ All paths contain project names');
        this.recordResult('pathGeneration', true, 'All paths contain project names');
      } else {
        this.recordResult('pathGeneration', false, 'Some paths missing project names');
      }

    } catch (error) {
      console.log(`❌ Failed to import path utilities: ${error.message}`);
      this.recordResult('pathGeneration', false, `Failed to import path utilities: ${error.message}`);
    }
  }

  /**
   * 记录测试结果
   * Record test result
   */
  recordResult(category, success, details) {
    if (success) {
      this.testResults[category].passed++;
    } else {
      this.testResults[category].failed++;
    }

    this.testResults[category].details.push({
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 清理测试数据
   * Clean up test data
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    for (const project of this.testProjects) {
      try {
        await this.tools.clearAllTasks({ confirm: true, project });
        console.log(`✅ Cleaned up project: ${project}`);
      } catch (error) {
        console.log(`⚠️ Failed to clean up project ${project}: ${error.message}`);
      }
    }
  }

  /**
   * 生成测试报告
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Real MCP Tool Concurrent Test Report');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;

    for (const [category, results] of Object.entries(this.testResults)) {
      const { passed, failed } = results;
      totalPassed += passed;
      totalFailed += failed;

      const successRate = passed + failed > 0 ? Math.round(passed / (passed + failed) * 100) : 0;
      
      console.log(`\n📋 ${category.charAt(0).toUpperCase() + category.slice(1)}:`);
      console.log(`   ✅ Passed: ${passed}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   📈 Success Rate: ${successRate}%`);

      // 显示失败详情
      const failures = results.details.filter(d => !d.success);
      if (failures.length > 0) {
        console.log(`   ❌ Failures:`);
        failures.forEach(failure => {
          console.log(`      • ${failure.details}`);
        });
      }
    }

    const overallSuccessRate = totalPassed + totalFailed > 0 ? 
      Math.round(totalPassed / (totalPassed + totalFailed) * 100) : 0;

    console.log(`\n🎯 Overall Results:`);
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   📈 Overall Success Rate: ${overallSuccessRate}%`);

    console.log('\n' + '=' .repeat(60));

    return {
      categories: this.testResults,
      overall: {
        passed: totalPassed,
        failed: totalFailed,
        successRate: overallSuccessRate
      }
    };
  }

  /**
   * 运行所有测试
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Real MCP Tool Concurrent Tests...\n');

    try {
      // 导入工具
      await this.importTools();

      // 运行测试
      await this.testProjectIsolation();
      await this.testConcurrentSafety();
      await this.testErrorHandling();
      await this.testPathGeneration();

      // 清理
      await this.cleanup();

      // 生成报告
      return this.generateReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    }
  }
}

// 如果直接运行此文件，执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RealMCPTester();
  
  tester.runAllTests()
    .then((report) => {
      console.log('\n🎉 Real MCP tool tests completed!');
      process.exit(report.overall.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test execution crashed:', error);
      process.exit(1);
    });
}