/**
 * MCP Test Runner
 * Comprehensive test suite for MCP protocol compliance and AI calling effectiveness
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  details: string[];
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  overallDuration: number;
  suites: TestResult[];
  summary: {
    mcpCompliance: boolean;
    aiEffectiveness: boolean;
    toolDescriptions: boolean;
    overallScore: number;
  };
}

class MCPTestRunner {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting MCP Shrimp Task Manager Test Suite...\n');

    const startTime = Date.now();

    // Run test suites
    await this.runTestSuite('MCP Protocol Compliance', 'src/tests/mcp-compliance');
    await this.runTestSuite('AI Calling Effectiveness', 'src/tests/ai-calling');

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Generate report
    const report = this.generateReport(duration);
    
    // Save report
    this.saveReport(report);
    
    // Display summary
    this.displaySummary(report);

    return report;
  }

  private async runTestSuite(name: string, path: string): Promise<void> {
    console.log(`📋 Running ${name}...`);
    
    const startTime = Date.now();
    let output = '';
    let passed = 0;
    let failed = 0;
    let total = 0;

    try {
      // Run vitest for the specific path
      output = execSync(`npx vitest run ${path} --reporter=verbose`, {
        encoding: 'utf8',
        cwd: process.cwd()
      });

      // Parse results (simplified parsing)
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('✓') || line.includes('PASS')) {
          passed++;
          total++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
          failed++;
          total++;
        }
      }

    } catch (error) {
      console.error(`❌ Error running ${name}:`, error);
      failed = 1;
      total = 1;
      output = `Error: ${error}`;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    this.results.push({
      suite: name,
      passed,
      failed,
      total,
      duration,
      details: output.split('\n').filter(line => line.trim())
    });

    console.log(`   ✅ ${passed} passed, ❌ ${failed} failed (${duration}ms)\n`);
  }

  private generateReport(totalDuration: number): TestReport {
    const totalTests = this.results.reduce((sum, result) => sum + result.total, 0);
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);

    // Calculate compliance scores
    const mcpCompliance = this.results.find(r => r.suite.includes('Protocol'))?.failed === 0;
    const aiEffectiveness = this.results.find(r => r.suite.includes('Effectiveness'))?.failed === 0;
    const toolDescriptions = this.results.find(r => r.suite.includes('Description'))?.failed === 0;

    const overallScore = Math.round((totalPassed / totalTests) * 100);

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      totalPassed,
      totalFailed,
      overallDuration: totalDuration,
      suites: this.results,
      summary: {
        mcpCompliance,
        aiEffectiveness,
        toolDescriptions,
        overallScore
      }
    };
  }

  private saveReport(report: TestReport): void {
    const reportPath = path.join(process.cwd(), 'test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Test report saved to: ${reportPath}`);
  }

  private displaySummary(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MCP SHRIMP TASK MANAGER TEST SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🕒 Total Duration: ${report.overallDuration}ms`);
    console.log(`📈 Overall Score: ${report.summary.overallScore}%`);
    console.log(`✅ Tests Passed: ${report.totalPassed}/${report.totalTests}`);
    
    if (report.totalFailed > 0) {
      console.log(`❌ Tests Failed: ${report.totalFailed}`);
    }

    console.log('\n📋 Compliance Status:');
    console.log(`   MCP Protocol: ${report.summary.mcpCompliance ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   AI Effectiveness: ${report.summary.aiEffectiveness ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Tool Descriptions: ${report.summary.toolDescriptions ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n🎯 Performance Targets:');
    console.log('   Parameter Accuracy: Target 90%+ ⭐');
    console.log('   Error Recovery: Target 70%+ ⭐');
    console.log('   Path Efficiency: Target 85%+ ⭐');

    if (report.summary.overallScore >= 90) {
      console.log('\n🎉 EXCELLENT! All optimization goals achieved.');
    } else if (report.summary.overallScore >= 80) {
      console.log('\n👍 GOOD! Most optimization goals achieved.');
    } else {
      console.log('\n⚠️  NEEDS IMPROVEMENT! Some optimization goals not met.');
    }

    console.log('\n📚 For detailed results, see test-report.json');
    console.log('📖 For best practices, see docs/ai-calling-guide.md');
    console.log('='.repeat(60));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new MCPTestRunner();
  runner.runAllTests().catch(console.error);
}

export { MCPTestRunner, TestReport, TestResult };
