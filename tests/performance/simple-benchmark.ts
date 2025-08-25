/**
 * 简化的性能基准测试
 * Simplified Performance Benchmark
 */

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface TestResult {
  operation: string;
  duration: number;
  fileCount: number;
}

interface TestReport {
  testSize: string;
  totalTime: number;
  results: TestResult[];
}

/**
 * 简化的性能测试类
 */
export class SimpleBenchmark {
  private testDataPath: string;

  constructor() {
    this.testDataPath = path.join(__dirname, 'testData');
  }

  /**
   * 测量操作时间
   */
  private async measureTime<T>(
    operation: () => Promise<T> | T,
    operationName: string,
    fileCount: number = 0
  ): Promise<TestResult> {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();

    return {
      operation: operationName,
      duration: endTime - startTime,
      fileCount
    };
  }

  /**
   * 创建测试文件
   */
  private createTestFiles(size: string): string[] {
    const testDir = path.join(this.testDataPath, size);
    
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const fileCount = this.getFileCount(size);
    const filePaths: string[] = [];

    for (let i = 0; i < fileCount; i++) {
      const filePath = path.join(testDir, `test-${i}.ts`);
      const content = this.generateContent(i);
      fs.writeFileSync(filePath, content);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  /**
   * 获取文件数量
   */
  private getFileCount(size: string): number {
    switch (size) {
      case 'small': return 10;
      case 'medium': return 100;
      case 'large': return 500;
      default: return 10;
    }
  }

  /**
   * 生成文件内容
   */
  private generateContent(index: number): string {
    return `
export class TestClass${index} {
  private value = ${index};
  
  getValue(): number {
    return this.value;
  }
  
  processData(input: any): any {
    return input ? input.toString() : null;
  }
}
`;
  }

  /**
   * 文件扫描测试
   */
  private async testFileScanning(filePaths: string[]): Promise<TestResult> {
    return this.measureTime(
      () => {
        const results = [];
        for (const filePath of filePaths) {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            results.push({ path: filePath, size: stats.size });
          }
        }
        return results;
      },
      'File Scanning',
      filePaths.length
    );
  }

  /**
   * 代码分析测试
   */
  private async testCodeAnalysis(filePaths: string[]): Promise<TestResult> {
    return this.measureTime(
      () => {
        const results = [];
        for (const filePath of filePaths) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const analysis = {
            lines: content.split('\n').length,
            functions: (content.match(/function|=>/g) || []).length,
            classes: (content.match(/class/g) || []).length
          };
          results.push(analysis);
        }
        return results;
      },
      'Code Analysis',
      filePaths.length
    );
  }

  /**
   * 文件清理测试
   */
  private async testFileCleanup(testDir: string): Promise<TestResult> {
    return this.measureTime(
      () => {
        // 创建临时文件
        const tempFiles = [];
        for (let i = 0; i < 10; i++) {
          const tempFile = path.join(testDir, `temp-${i}.tmp`);
          fs.writeFileSync(tempFile, 'temp');
          tempFiles.push(tempFile);
        }

        // 清理文件
        for (const tempFile of tempFiles) {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        }

        return tempFiles.length;
      },
      'File Cleanup',
      10
    );
  }

  /**
   * 运行基准测试
   */
  public async runBenchmark(size: string): Promise<TestReport> {
    const startTime = performance.now();
    const filePaths = this.createTestFiles(size);
    
    const results: TestResult[] = [];
    
    // 运行各项测试
    results.push(await this.testFileScanning(filePaths));
    results.push(await this.testCodeAnalysis(filePaths));
    results.push(await this.testFileCleanup(path.dirname(filePaths[0])));

    const totalTime = performance.now() - startTime;

    // 清理测试数据
    this.cleanupTestData(size);

    return {
      testSize: size,
      totalTime,
      results
    };
  }

  /**
   * 清理测试数据
   */
  private cleanupTestData(size: string): void {
    const testDir = path.join(this.testDataPath, size);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  }

  /**
   * 生成报告
   */
  public generateReport(reports: TestReport[]): string {
    let report = `# 性能基准测试报告\n\n`;
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;

    for (const testReport of reports) {
      report += `## ${testReport.testSize.toUpperCase()} 项目\n\n`;
      report += `总耗时: ${testReport.totalTime.toFixed(2)}ms\n\n`;
      
      report += `| 操作 | 耗时(ms) | 文件数 |\n`;
      report += `|------|----------|--------|\n`;
      
      for (const result of testReport.results) {
        report += `| ${result.operation} | ${result.duration.toFixed(2)} | ${result.fileCount} |\n`;
      }
      report += `\n`;
    }

    return report;
  }
}

/**
 * 运行性能测试
 */
export async function runSimpleBenchmark(): Promise<void> {
  const benchmark = new SimpleBenchmark();
  const reports: TestReport[] = [];

  console.log('🎯 开始简化性能测试...');

  for (const size of ['small', 'medium', 'large']) {
    console.log(`📊 测试 ${size} 项目...`);
    const report = await benchmark.runBenchmark(size);
    reports.push(report);
    console.log(`✅ 完成: ${report.totalTime.toFixed(2)}ms`);
  }

  const finalReport = benchmark.generateReport(reports);
  const reportPath = path.join(__dirname, 'simple-performance-report.md');
  fs.writeFileSync(reportPath, finalReport);
  
  console.log(`📋 报告保存到: ${reportPath}`);
  console.log('🎉 性能测试完成！');
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runSimpleBenchmark().catch(console.error);
}