/**
 * 性能基准测试运行脚本
 * Performance Benchmark Runner Script
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简化的性能测试
 */
class SimpleBenchmark {
  constructor() {
    this.testDataPath = path.join(__dirname, 'testData');
  }

  /**
   * 测量操作执行时间
   */
  async measureOperation(operationName, operation, fileCount = 0) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    const result = await operation();

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    return {
      operation: operationName,
      duration: endTime - startTime,
      memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
      fileCount,
      result
    };
  }

  /**
   * 创建测试文件
   */
  createTestFiles(size) {
    const testDir = path.join(this.testDataPath, size);
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const fileCount = size === 'small' ? 10 : size === 'medium' ? 100 : 500;
    const filePaths = [];

    for (let i = 0; i < fileCount; i++) {
      const fileName = `test-file-${i}.ts`;
      const filePath = path.join(testDir, fileName);
      
      const content = this.generateTestContent(i);
      fs.writeFileSync(filePath, content);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  /**
   * 生成测试内容
   */
  generateTestContent(index) {
    return `
// Test file ${index}
export class TestClass${index} {
  private value: number = ${index};

  public getValue(): number {
    return this.value;
  }

  public processData(input: any): any {
    if (input) {
      if (typeof input === 'string') {
        return input.toUpperCase();
      } else if (typeof input === 'number') {
        return input * 2;
      }
    }
    return null;
  }

  public complexMethod(data: any[]): any {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i]) {
        for (let j = 0; j < data[i].length; j++) {
          if (data[i][j] && data[i][j].value > 10) {
            result.push(data[i][j].value * 2);
          }
        }
      }
    }
    return result;
  }
}

export function utilityFunction${index}(): string {
  return 'utility-${index}';
}
`;
  }

  /**
   * 文件扫描测试
   */
  async benchmarkFileScanning(filePaths) {
    return this.measureOperation(
      'File Scanning',
      async () => {
        const results = [];
        for (const filePath of filePaths) {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            results.push({
              path: filePath,
              size: stats.size,
              lines: fs.readFileSync(filePath, 'utf-8').split('\n').length
            });
          }
        }
        return results;
      },
      filePaths.length
    );
  }

  /**
   * 代码分析测试
   */
  async benchmarkCodeAnalysis(filePaths) {
    return this.measureOperation(
      'Code Analysis',
      async () => {
        const results = [];
        for (const filePath of filePaths) {
          if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // 简单的代码分析
              const analysis = {
                file: filePath,
                linesOfCode: content.split('\n').length,
                functions: (content.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || []).length,
                classes: (content.match(/class\s+\w+/g) || []).length,
                complexity: (content.match(/if|for|while|switch|catch/g) || []).length + 1,
                imports: (content.match(/import\s+.*from/g) || []).length
              };
              
              results.push(analysis);
            } catch (error) {
              // 忽略错误文件
            }
          }
        }
        return results;
      },
      filePaths.length
    );
  }

  /**
   * 文件清理测试
   */
  async benchmarkFileCleanup(testDir) {
    return this.measureOperation(
      'File Cleanup',
      async () => {
        // 创建临时文件
        const tempFiles = [];
        const tempExtensions = ['.tmp', '.log', '.cache'];
        
        for (let i = 0; i < 20; i++) {
          const ext = tempExtensions[i % tempExtensions.length];
          const tempFile = path.join(testDir, `temp-${i}${ext}`);
          fs.writeFileSync(tempFile, `temp content ${i}`);
          tempFiles.push(tempFile);
        }

        // 清理操作
        let cleaned = 0;
        for (const tempFile of tempFiles) {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            cleaned++;
          }
        }

        return { cleanedFiles: cleaned };
      },
      20
    );
  }

  /**
   * 运行基准测试
   */
  async runBenchmark(size) {
    console.log(`\n🚀 运行 ${size} 项目基准测试...`);
    
    const results = [];
    const startTime = performance.now();

    // 创建测试文件
    const filePaths = this.createTestFiles(size);
    console.log(`📁 创建了 ${filePaths.length} 个测试文件`);

    // 文件扫描测试
    console.log('🔍 测试文件扫描...');
    const scanResult = await this.benchmarkFileScanning(filePaths);
    results.push(scanResult);

    // 代码分析测试
    console.log('📋 测试代码分析...');
    const analysisResult = await this.benchmarkCodeAnalysis(filePaths);
    results.push(analysisResult);

    // 文件清理测试
    console.log('🧹 测试文件清理...');
    const cleanupResult = await this.benchmarkFileCleanup(path.dirname(filePaths[0]));
    results.push(cleanupResult);

    const totalTime = performance.now() - startTime;

    // 清理测试数据
    const testDir = path.join(this.testDataPath, size);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    return {
      size,
      totalTime,
      results,
      summary: this.generateSummary(results, totalTime)
    };
  }

  /**
   * 生成摘要
   */
  generateSummary(results, totalTime) {
    const durations = results.map(r => r.duration);
    const memoryUsages = results.map(r => r.memoryUsed);
    
    const slowestOperation = results.reduce((prev, current) => 
      prev.duration > current.duration ? prev : current
    );

    return {
      totalTime,
      averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      peakMemory: Math.max(...memoryUsages),
      bottleneck: `${slowestOperation.operation}: ${slowestOperation.duration.toFixed(2)}ms`
    };
  }

  /**
   * 生成报告
   */
  generateReport(benchmarks) {
    let report = `# 性能基准测试报告\n\n`;
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;

    for (const benchmark of benchmarks) {
      report += `## ${benchmark.size.toUpperCase()} 项目测试\n\n`;
      report += `**总耗时**: ${benchmark.totalTime.toFixed(2)}ms\n`;
      report += `**平均耗时**: ${benchmark.summary.averageTime.toFixed(2)}ms\n`;
      report += `**峰值内存**: ${(benchmark.summary.peakMemory / 1024 / 1024).toFixed(2)}MB\n`;
      report += `**主要瓶颈**: ${benchmark.summary.bottleneck}\n\n`;

      report += `### 详细结果\n\n`;
      report += `| 操作 | 耗时(ms) | 内存(MB) | 文件数 |\n`;
      report += `|------|----------|----------|--------|\n`;
      
      for (const result of benchmark.results) {
        const memoryMB = (result.memoryUsed / 1024 / 1024).toFixed(2);
        report += `| ${result.operation} | ${result.duration.toFixed(2)} | ${memoryMB} | ${result.fileCount} |\n`;
      }
      report += `\n`;
    }

    // 性能分析
    report += `## 性能分析\n\n`;
    
    const allResults = benchmarks.flatMap(b => b.results);
    const operationStats = {};
    
    for (const result of allResults) {
      if (!operationStats[result.operation]) {
        operationStats[result.operation] = [];
      }
      operationStats[result.operation].push(result.duration);
    }

    report += `### 操作性能对比\n\n`;
    for (const [operation, durations] of Object.entries(operationStats)) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      
      report += `**${operation}**:\n`;
      report += `- 平均: ${avg.toFixed(2)}ms\n`;
      report += `- 最大: ${max.toFixed(2)}ms\n`;
      report += `- 最小: ${min.toFixed(2)}ms\n\n`;
    }

    report += `## 优化建议\n\n`;
    report += `1. **文件扫描优化**: 考虑并行处理多个文件\n`;
    report += `2. **代码分析优化**: 实现增量分析，避免重复分析未修改的文件\n`;
    report += `3. **内存管理**: 对于大项目，考虑流式处理避免内存峰值\n`;
    report += `4. **缓存机制**: 为重复的分析操作实现结果缓存\n\n`;

    return report;
  }
}

/**
 * 主函数
 */
async function main() {
  const benchmark = new SimpleBenchmark();
  const benchmarks = [];

  try {
    console.log('🎯 开始性能基准测试...');

    // 运行不同规模的测试
    for (const size of ['small', 'medium', 'large']) {
      const result = await benchmark.runBenchmark(size);
      benchmarks.push(result);
      
      console.log(`✅ ${size} 项目测试完成: ${result.totalTime.toFixed(2)}ms`);
    }

    // 生成报告
    const report = benchmark.generateReport(benchmarks);
    
    // 保存报告
    const reportPath = path.join(__dirname, 'performance-report.md');
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📋 性能报告已保存到: ${reportPath}`);
    console.log('🎉 性能基准测试完成！');

    // 输出关键指标
    console.log('\n📊 关键性能指标:');
    for (const benchmark of benchmarks) {
      console.log(`${benchmark.size}: ${benchmark.summary.bottleneck}`);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
main();