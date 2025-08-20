#!/usr/bin/env node

/**
 * 集成测试运行脚本
 * 自动化运行集成测试、性能测试和代码质量检查
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class IntegrationTestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      integration: null,
      performance: null,
      quality: null,
      startTime: performance.now(),
      endTime: null,
    };
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始运行集成测试套件...\n');

    try {
      // 1. 运行集成测试
      console.log('📋 运行集成测试...');
      this.results.integration = await this.runIntegrationTests();
      
      // 2. 运行性能基准测试
      console.log('⚡ 运行性能基准测试...');
      this.results.performance = await this.runPerformanceTests();
      
      // 3. 运行代码质量检查
      console.log('🔍 运行代码质量检查...');
      this.results.quality = await this.runQualityCheck();
      
      // 4. 生成综合报告
      this.results.endTime = performance.now();
      await this.generateReport();
      
      console.log('✅ 所有测试完成！');
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 运行集成测试
   */
  async runIntegrationTests() {
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config=jest.integration.config.js',
        '--coverage',
        '--verbose',
        '--passWithNoTests',
      ], {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      jest.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      jest.on('close', (code) => {
        const result = {
          success: code === 0,
          exitCode: code,
          output,
          errorOutput,
          coverage: this.parseCoverageFromOutput(output),
        };

        if (code === 0) {
          console.log('✅ 集成测试通过\n');
          resolve(result);
        } else {
          console.log('❌ 集成测试失败\n');
          resolve(result); // 不reject，继续运行其他测试
        }
      });

      jest.on('error', (error) => {
        console.error('❌ 集成测试运行错误:', error.message);
        reject(error);
      });
    });
  }

  /**
   * 运行性能基准测试
   */
  async runPerformanceTests() {
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config=jest.integration.config.js',
        '--testNamePattern=Performance Benchmark',
        '--verbose',
        '--passWithNoTests',
      ], {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      jest.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });

      jest.on('close', (code) => {
        const result = {
          success: code === 0,
          exitCode: code,
          output,
          errorOutput,
          benchmarks: this.parseBenchmarksFromOutput(output),
        };

        if (code === 0) {
          console.log('✅ 性能测试通过\n');
          resolve(result);
        } else {
          console.log('❌ 性能测试失败\n');
          resolve(result);
        }
      });

      jest.on('error', (error) => {
        console.error('❌ 性能测试运行错误:', error.message);
        reject(error);
      });
    });
  }

  /**
   * 运行代码质量检查
   */
  async runQualityCheck() {
    const results = {
      eslint: await this.runESLint(),
      typescript: await this.runTypeScriptCheck(),
      prettier: await this.runPrettierCheck(),
    };

    const allPassed = Object.values(results).every(result => result.success);
    
    return {
      success: allPassed,
      results,
    };
  }

  /**
   * 运行ESLint检查
   */
  async runESLint() {
    return new Promise((resolve) => {
      const eslint = spawn('npx', [
        'eslint',
        'src/**/*.{js,jsx,ts,tsx}',
        '--format=json',
        '--output-file=coverage/integration/eslint-report.json',
      ], {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      eslint.stdout.on('data', (data) => {
        output += data.toString();
      });

      eslint.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      eslint.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          output,
          errorOutput,
        });
      });
    });
  }

  /**
   * 运行TypeScript检查
   */
  async runTypeScriptCheck() {
    return new Promise((resolve) => {
      const tsc = spawn('npx', [
        'tsc',
        '--noEmit',
        '--pretty',
      ], {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      tsc.stdout.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tsc.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          output,
          errorOutput,
        });
      });
    });
  }

  /**
   * 运行Prettier检查
   */
  async runPrettierCheck() {
    return new Promise((resolve) => {
      const prettier = spawn('npx', [
        'prettier',
        '--check',
        'src/**/*.{js,jsx,ts,tsx,css,scss,json}',
      ], {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      prettier.stdout.on('data', (data) => {
        output += data.toString();
      });

      prettier.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      prettier.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          output,
          errorOutput,
        });
      });
    });
  }

  /**
   * 从输出中解析覆盖率信息
   */
  parseCoverageFromOutput(output) {
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
    
    if (coverageMatch) {
      return {
        statements: parseFloat(coverageMatch[1]),
        branches: parseFloat(coverageMatch[2]),
        functions: parseFloat(coverageMatch[3]),
        lines: parseFloat(coverageMatch[4]),
      };
    }
    
    return null;
  }

  /**
   * 从输出中解析性能基准信息
   */
  parseBenchmarksFromOutput(output) {
    const benchmarks = [];
    
    // 查找性能相关的测试结果
    const performanceMatches = output.match(/should.*within \d+ms/g);
    
    if (performanceMatches) {
      performanceMatches.forEach(match => {
        const timeMatch = match.match(/(\d+)ms/);
        if (timeMatch) {
          benchmarks.push({
            test: match,
            threshold: parseInt(timeMatch[1]),
            passed: output.includes(`✓ ${match}`),
          });
        }
      });
    }
    
    return benchmarks;
  }

  /**
   * 生成综合测试报告
   */
  async generateReport() {
    const totalTime = this.results.endTime - this.results.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: Math.round(totalTime),
      summary: {
        integration: this.results.integration?.success || false,
        performance: this.results.performance?.success || false,
        quality: this.results.quality?.success || false,
        overall: this.calculateOverallSuccess(),
      },
      details: this.results,
    };

    // 保存JSON报告
    const reportPath = path.join(this.projectRoot, 'coverage/integration/test-report.json');
    await this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(this.projectRoot, 'coverage/integration/test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    // 打印摘要
    this.printSummary(report);

    console.log(`📊 详细报告已生成:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  /**
   * 计算总体成功状态
   */
  calculateOverallSuccess() {
    const integration = this.results.integration?.success || false;
    const performance = this.results.performance?.success || false;
    const quality = this.results.quality?.success || false;
    
    return integration && performance && quality;
  }

  /**
   * 生成HTML报告
   */
  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>集成测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .metric.pass { border-left: 4px solid #4caf50; }
        .metric.fail { border-left: 4px solid #f44336; }
        .details { margin: 20px 0; }
        .section { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .coverage { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .coverage-item { text-align: center; padding: 10px; background: #f9f9f9; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>集成测试报告</h1>
        <p>生成时间: ${report.timestamp}</p>
        <p>总耗时: ${report.duration}ms</p>
        <p>总体状态: ${report.summary.overall ? '✅ 通过' : '❌ 失败'}</p>
    </div>

    <div class="summary">
        <div class="metric ${report.summary.integration ? 'pass' : 'fail'}">
            <h3>集成测试</h3>
            <p>${report.summary.integration ? '✅ 通过' : '❌ 失败'}</p>
        </div>
        <div class="metric ${report.summary.performance ? 'pass' : 'fail'}">
            <h3>性能测试</h3>
            <p>${report.summary.performance ? '✅ 通过' : '❌ 失败'}</p>
        </div>
        <div class="metric ${report.summary.quality ? 'pass' : 'fail'}">
            <h3>代码质量</h3>
            <p>${report.summary.quality ? '✅ 通过' : '❌ 失败'}</p>
        </div>
    </div>

    ${report.details.integration?.coverage ? `
    <div class="section">
        <h2>测试覆盖率</h2>
        <div class="coverage">
            <div class="coverage-item">
                <strong>语句</strong><br>
                ${report.details.integration.coverage.statements}%
            </div>
            <div class="coverage-item">
                <strong>分支</strong><br>
                ${report.details.integration.coverage.branches}%
            </div>
            <div class="coverage-item">
                <strong>函数</strong><br>
                ${report.details.integration.coverage.functions}%
            </div>
            <div class="coverage-item">
                <strong>行数</strong><br>
                ${report.details.integration.coverage.lines}%
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>详细结果</h2>
        <pre>${JSON.stringify(report.details, null, 2)}</pre>
    </div>
</body>
</html>
    `;
  }

  /**
   * 打印测试摘要
   */
  printSummary(report) {
    console.log('\n📊 测试摘要:');
    console.log('=====================================');
    console.log(`总体状态: ${report.summary.overall ? '✅ 通过' : '❌ 失败'}`);
    console.log(`集成测试: ${report.summary.integration ? '✅ 通过' : '❌ 失败'}`);
    console.log(`性能测试: ${report.summary.performance ? '✅ 通过' : '❌ 失败'}`);
    console.log(`代码质量: ${report.summary.quality ? '✅ 通过' : '❌ 失败'}`);
    console.log(`总耗时: ${report.duration}ms`);
    
    if (report.details.integration?.coverage) {
      console.log('\n📈 测试覆盖率:');
      console.log(`语句: ${report.details.integration.coverage.statements}%`);
      console.log(`分支: ${report.details.integration.coverage.branches}%`);
      console.log(`函数: ${report.details.integration.coverage.functions}%`);
      console.log(`行数: ${report.details.integration.coverage.lines}%`);
    }
    
    console.log('=====================================\n');
  }

  /**
   * 确保目录存在
   */
  async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// 运行测试
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTestRunner;