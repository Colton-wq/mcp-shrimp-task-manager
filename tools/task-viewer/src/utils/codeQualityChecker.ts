/**
 * 代码质量检查工具
 * 提供代码质量分析、最佳实践检查和改进建议
 */

interface QualityMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

interface QualityReport {
  overall: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    status: 'pass' | 'warning' | 'fail';
  };
  metrics: QualityMetric[];
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    file: string;
    line?: number;
    message: string;
    rule: string;
    severity: number;
  }>;
  suggestions: string[];
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

interface CodeComplexity {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
}

class CodeQualityChecker {
  private static instance: CodeQualityChecker;
  private qualityThresholds = {
    cyclomaticComplexity: 10,
    cognitiveComplexity: 15,
    linesOfCode: 300,
    maintainabilityIndex: 70,
    testCoverage: 80,
    duplicateCode: 5,
    technicalDebt: 30,
  };

  private constructor() {}

  static getInstance(): CodeQualityChecker {
    if (!CodeQualityChecker.instance) {
      CodeQualityChecker.instance = new CodeQualityChecker();
    }
    return CodeQualityChecker.instance;
  }

  /**
   * 分析代码质量
   */
  async analyzeCodeQuality(projectPath: string): Promise<QualityReport> {
    const metrics: QualityMetric[] = [];
    const issues: QualityReport['issues'] = [];
    const suggestions: string[] = [];

    try {
      // 分析代码复杂度
      const complexity = await this.analyzeComplexity(projectPath);
      metrics.push(...this.createComplexityMetrics(complexity));

      // 分析测试覆盖率
      const coverage = await this.analyzeCoverage(projectPath);
      metrics.push(this.createCoverageMetric(coverage));

      // 分析代码重复
      const duplication = await this.analyzeDuplication(projectPath);
      metrics.push(this.createDuplicationMetric(duplication));

      // 分析技术债务
      const technicalDebt = await this.analyzeTechnicalDebt(projectPath);
      metrics.push(this.createTechnicalDebtMetric(technicalDebt));

      // ESLint检查
      const lintResults = await this.runESLintCheck(projectPath);
      issues.push(...lintResults.issues);

      // TypeScript检查
      const typeResults = await this.runTypeScriptCheck(projectPath);
      issues.push(...typeResults.issues);

      // 生成建议
      suggestions.push(...this.generateSuggestions(metrics, issues));

      // 计算总体评分
      const overall = this.calculateOverallScore(metrics, issues);

      return {
        overall,
        metrics,
        issues,
        suggestions,
        coverage,
      };

    } catch (error) {
      console.error('Code quality analysis failed:', error);
      throw new Error(`代码质量分析失败: ${error.message}`);
    }
  }

  /**
   * 分析代码复杂度
   */
  private async analyzeComplexity(projectPath: string): Promise<CodeComplexity> {
    // 这里应该集成实际的复杂度分析工具
    // 例如：typescript-complexity, jscpd等
    
    // 模拟复杂度分析结果
    return {
      cyclomaticComplexity: 8,
      cognitiveComplexity: 12,
      linesOfCode: 250,
      maintainabilityIndex: 75,
    };
  }

  /**
   * 分析测试覆盖率
   */
  private async analyzeCoverage(projectPath: string): Promise<QualityReport['coverage']> {
    // 这里应该集成Jest或其他测试覆盖率工具
    
    // 模拟覆盖率数据
    return {
      statements: 85,
      branches: 78,
      functions: 90,
      lines: 83,
    };
  }

  /**
   * 分析代码重复
   */
  private async analyzeDuplication(projectPath: string): Promise<number> {
    // 这里应该集成jscpd或类似工具
    
    // 模拟重复代码百分比
    return 3.2;
  }

  /**
   * 分析技术债务
   */
  private async analyzeTechnicalDebt(projectPath: string): Promise<number> {
    // 这里应该集成SonarQube或类似工具
    
    // 模拟技术债务分钟数
    return 25;
  }

  /**
   * 运行ESLint检查
   */
  private async runESLintCheck(projectPath: string): Promise<{ issues: QualityReport['issues'] }> {
    // 这里应该集成ESLint API
    
    // 模拟ESLint结果
    const issues: QualityReport['issues'] = [
      {
        type: 'warning',
        file: 'src/components/ChatAgent.tsx',
        line: 45,
        message: 'Missing dependency in useEffect hook',
        rule: 'react-hooks/exhaustive-deps',
        severity: 2,
      },
      {
        type: 'error',
        file: 'src/utils/errorHandler.ts',
        line: 123,
        message: 'Unexpected console statement',
        rule: 'no-console',
        severity: 3,
      },
    ];

    return { issues };
  }

  /**
   * 运行TypeScript检查
   */
  private async runTypeScriptCheck(projectPath: string): Promise<{ issues: QualityReport['issues'] }> {
    // 这里应该集成TypeScript编译器API
    
    // 模拟TypeScript检查结果
    const issues: QualityReport['issues'] = [
      {
        type: 'error',
        file: 'src/types/template.ts',
        line: 67,
        message: "Property 'id' is missing in type",
        rule: 'typescript',
        severity: 4,
      },
    ];

    return { issues };
  }

  /**
   * 创建复杂度指标
   */
  private createComplexityMetrics(complexity: CodeComplexity): QualityMetric[] {
    return [
      {
        name: 'Cyclomatic Complexity',
        value: complexity.cyclomaticComplexity,
        threshold: this.qualityThresholds.cyclomaticComplexity,
        status: complexity.cyclomaticComplexity <= this.qualityThresholds.cyclomaticComplexity ? 'pass' : 'warning',
        description: '圈复杂度衡量代码的复杂程度',
      },
      {
        name: 'Cognitive Complexity',
        value: complexity.cognitiveComplexity,
        threshold: this.qualityThresholds.cognitiveComplexity,
        status: complexity.cognitiveComplexity <= this.qualityThresholds.cognitiveComplexity ? 'pass' : 'warning',
        description: '认知复杂度衡量代码的理解难度',
      },
      {
        name: 'Lines of Code',
        value: complexity.linesOfCode,
        threshold: this.qualityThresholds.linesOfCode,
        status: complexity.linesOfCode <= this.qualityThresholds.linesOfCode ? 'pass' : 'warning',
        description: '代码行数指标',
      },
      {
        name: 'Maintainability Index',
        value: complexity.maintainabilityIndex,
        threshold: this.qualityThresholds.maintainabilityIndex,
        status: complexity.maintainabilityIndex >= this.qualityThresholds.maintainabilityIndex ? 'pass' : 'warning',
        description: '可维护性指数',
      },
    ];
  }

  /**
   * 创建覆盖率指标
   */
  private createCoverageMetric(coverage: QualityReport['coverage']): QualityMetric {
    const averageCoverage = (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4;
    
    return {
      name: 'Test Coverage',
      value: averageCoverage,
      threshold: this.qualityThresholds.testCoverage,
      status: averageCoverage >= this.qualityThresholds.testCoverage ? 'pass' : 'warning',
      description: '测试覆盖率',
    };
  }

  /**
   * 创建重复代码指标
   */
  private createDuplicationMetric(duplication: number): QualityMetric {
    return {
      name: 'Code Duplication',
      value: duplication,
      threshold: this.qualityThresholds.duplicateCode,
      status: duplication <= this.qualityThresholds.duplicateCode ? 'pass' : 'warning',
      description: '代码重复率',
    };
  }

  /**
   * 创建技术债务指标
   */
  private createTechnicalDebtMetric(debt: number): QualityMetric {
    return {
      name: 'Technical Debt',
      value: debt,
      threshold: this.qualityThresholds.technicalDebt,
      status: debt <= this.qualityThresholds.technicalDebt ? 'pass' : 'warning',
      description: '技术债务（分钟）',
    };
  }

  /**
   * 计算总体评分
   */
  private calculateOverallScore(metrics: QualityMetric[], issues: QualityReport['issues']): QualityReport['overall'] {
    // 基础分数
    let score = 100;

    // 根据指标扣分
    for (const metric of metrics) {
      if (metric.status === 'warning') {
        score -= 5;
      } else if (metric.status === 'fail') {
        score -= 15;
      }
    }

    // 根据问题扣分
    for (const issue of issues) {
      if (issue.type === 'error') {
        score -= 10;
      } else if (issue.type === 'warning') {
        score -= 3;
      }
    }

    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));

    // 确定等级
    let grade: QualityReport['overall']['grade'];
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    // 确定状态
    let status: QualityReport['overall']['status'];
    if (score >= 80) status = 'pass';
    else if (score >= 60) status = 'warning';
    else status = 'fail';

    return { score, grade, status };
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(metrics: QualityMetric[], issues: QualityReport['issues']): string[] {
    const suggestions: string[] = [];

    // 基于指标的建议
    for (const metric of metrics) {
      if (metric.status !== 'pass') {
        switch (metric.name) {
          case 'Cyclomatic Complexity':
            suggestions.push('考虑将复杂函数拆分为更小的函数');
            break;
          case 'Cognitive Complexity':
            suggestions.push('简化条件逻辑，减少嵌套层级');
            break;
          case 'Lines of Code':
            suggestions.push('将大文件拆分为多个模块');
            break;
          case 'Test Coverage':
            suggestions.push('增加单元测试覆盖率，特别是边界情况');
            break;
          case 'Code Duplication':
            suggestions.push('提取重复代码为公共函数或组件');
            break;
          case 'Technical Debt':
            suggestions.push('优先处理技术债务，重构遗留代码');
            break;
        }
      }
    }

    // 基于问题的建议
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;

    if (errorCount > 0) {
      suggestions.push(`修复 ${errorCount} 个错误，确保代码正确性`);
    }

    if (warningCount > 5) {
      suggestions.push(`处理 ${warningCount} 个警告，提升代码质量`);
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push('代码质量良好，继续保持最佳实践');
    } else {
      suggestions.push('定期进行代码审查，持续改进代码质量');
      suggestions.push('使用自动化工具集成到CI/CD流程中');
    }

    return suggestions;
  }

  /**
   * 生成质量报告HTML
   */
  generateHTMLReport(report: QualityReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>代码质量报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .score { font-size: 2em; font-weight: bold; color: ${this.getScoreColor(report.overall.score)}; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric.pass { border-left: 4px solid #4caf50; }
        .metric.warning { border-left: 4px solid #ff9800; }
        .metric.fail { border-left: 4px solid #f44336; }
        .issues { margin: 20px 0; }
        .issue { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .issue.error { background: #ffebee; border-left: 4px solid #f44336; }
        .issue.warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .suggestions { background: #e3f2fd; padding: 15px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>代码质量报告</h1>
        <div class="score">${report.overall.score}/100 (${report.overall.grade})</div>
        <p>状态: ${report.overall.status}</p>
    </div>

    <h2>质量指标</h2>
    <div class="metrics">
        ${report.metrics.map(metric => `
            <div class="metric ${metric.status}">
                <h3>${metric.name}</h3>
                <p>值: ${metric.value} (阈值: ${metric.threshold})</p>
                <p>${metric.description}</p>
            </div>
        `).join('')}
    </div>

    <h2>问题列表</h2>
    <div class="issues">
        ${report.issues.map(issue => `
            <div class="issue ${issue.type}">
                <strong>${issue.file}${issue.line ? `:${issue.line}` : ''}</strong><br>
                ${issue.message} (${issue.rule})
            </div>
        `).join('')}
    </div>

    <h2>改进建议</h2>
    <div class="suggestions">
        <ul>
            ${report.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
        </ul>
    </div>

    <h2>测试覆盖率</h2>
    <div class="coverage">
        <p>语句覆盖率: ${report.coverage.statements}%</p>
        <p>分支覆盖率: ${report.coverage.branches}%</p>
        <p>函数覆盖率: ${report.coverage.functions}%</p>
        <p>行覆盖率: ${report.coverage.lines}%</p>
    </div>
</body>
</html>
    `;
  }

  /**
   * 获取分数颜色
   */
  private getScoreColor(score: number): string {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#8bc34a';
    if (score >= 70) return '#ff9800';
    if (score >= 60) return '#ff5722';
    return '#f44336';
  }

  /**
   * 设置质量阈值
   */
  setThresholds(thresholds: Partial<typeof this.qualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
  }

  /**
   * 获取质量阈值
   */
  getThresholds(): typeof this.qualityThresholds {
    return { ...this.qualityThresholds };
  }
}

// 导出单例实例
export const codeQualityChecker = CodeQualityChecker.getInstance();

export default CodeQualityChecker;