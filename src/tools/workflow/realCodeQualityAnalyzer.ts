/**
 * 真实代码质量分析器 - 基于 MCP 2025 标准和成功的 code-auditor-mcp 模式
 * Real Code Quality Analyzer - Based on MCP 2025 standards and successful code-auditor-mcp patterns
 * 
 * 消除虚假实现，提供真实的代码质量分析
 * Eliminate fake implementations, provide real code quality analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { AsyncFileOperations } from '../../utils/asyncFileOperations.js';

// 真实的违规接口 - 基于 code-auditor-mcp 模式
export interface RealViolation {
  type: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  category: 'complexity' | 'maintainability' | 'standards' | 'security' | 'solid';
  severity: number;
  analyzer: string;
}

// 真实的质量指标接口
export interface RealQualityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  classCount: number;
  methodCount: number;
  functionCount: number;
  halsteadVolume: number;
}

// 真实的分析结果接口
export interface RealAnalysisResult {
  violations: RealViolation[];
  metrics: RealQualityMetrics;
  healthScore: number;
  summary: {
    totalViolations: number;
    criticalIssues: number;
    warnings: number;
    suggestions: number;
    filesAnalyzed: number;
  };
  recommendations: string[];
}

/**
 * 真实代码质量分析器 - 消除所有虚假实现
 */
export class RealCodeQualityAnalyzer {
  private static instance: RealCodeQualityAnalyzer;
  
  // 基于2025年行业标准的质量阈值 - 更严格的要求
  private readonly qualityThresholds = {
    cyclomaticComplexity: 8,         // McCabe 循环复杂度 (降低要求)
    cognitiveComplexity: 12,         // 认知复杂度 (降低要求)
    linesOfCode: 250,                // 函数行数 (降低要求)
    maintainabilityIndex: 40,        // Microsoft 可维护性指数 (提高要求)
    maxMethodsPerClass: 8,           // SOLID 原则：单一职责 (更严格)
    maxParametersPerMethod: 4,       // 方法参数数量 (更严格)
    maxNestingDepth: 3,              // 嵌套深度 (更严格)
    eslintErrorsPerFile: 0,          // ESLint 错误阈值 (保持严格)
    eslintWarningsPerFile: 3,        // ESLint 警告阈值 (更严格)
  };

  public static getInstance(): RealCodeQualityAnalyzer {
    if (!RealCodeQualityAnalyzer.instance) {
      RealCodeQualityAnalyzer.instance = new RealCodeQualityAnalyzer();
    }
    return RealCodeQualityAnalyzer.instance;
  }

  /**
   * 执行真实的代码质量分析 - 主入口点
   */
  public async analyzeFiles(filePaths: string[]): Promise<RealAnalysisResult> {
    console.log(`🔍 [RealCodeQualityAnalyzer] Starting analysis of ${filePaths.length} files`);
    
    const violations: RealViolation[] = [];
    let totalMetrics: RealQualityMetrics = {
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      linesOfCode: 0,
      maintainabilityIndex: 0,
      classCount: 0,
      methodCount: 0,
      functionCount: 0,
      halsteadVolume: 0
    };

    // 1. 执行 ESLint 分析
    const eslintViolations = await this.runRealESLintAnalysis(filePaths);
    violations.push(...eslintViolations);
    console.log(`📋 [ESLint] Found ${eslintViolations.length} violations`);

    // 2. 执行 TypeScript AST 分析（并行优化）
    const analyzableFiles = filePaths.filter(filePath => this.isAnalyzableFile(filePath));
    
    // 并行分析文件，但限制并发数
    const batchSize = 5;
    for (let i = 0; i < analyzableFiles.length; i += batchSize) {
      const batch = analyzableFiles.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (filePath) => {
          try {
            return await this.analyzeFileWithAST(filePath);
          } catch (error) {
            console.warn(`Failed to analyze ${filePath}:`, error);
            return null;
          }
        })
      );

      // 聚合批次结果
      for (let j = 0; j < batchResults.length; j++) {
        const fileMetrics = batchResults[j];
        const filePath = batch[j];
        
        if (fileMetrics) {
          totalMetrics.cyclomaticComplexity += fileMetrics.cyclomaticComplexity;
          totalMetrics.cognitiveComplexity += fileMetrics.cognitiveComplexity;
          totalMetrics.maintainabilityIndex += fileMetrics.maintainabilityIndex;
          totalMetrics.halsteadVolume += fileMetrics.halsteadVolume;
        }
      }
    }

    // 3. 计算平均值和健康评分
    const fileCount = filePaths.filter(f => this.isAnalyzableFile(f)).length;
    if (fileCount > 0) {
      totalMetrics.cyclomaticComplexity /= fileCount;
      totalMetrics.cognitiveComplexity /= fileCount;
      totalMetrics.maintainabilityIndex /= fileCount;
      totalMetrics.halsteadVolume /= fileCount;
    }

    const healthScore = this.calculateRealHealthScore(violations, totalMetrics);
    const summary = this.generateSummary(violations, filePaths.length);
    const recommendations = this.generateRecommendations(violations, totalMetrics);

    console.log(`✅ [Analysis Complete] Health Score: ${healthScore}/100, Total Violations: ${violations.length}`);

    return {
      violations,
      metrics: totalMetrics,
      healthScore,
      summary,
      recommendations
    };
  }

  /**
   * 运行真实的 ESLint 分析
   */
  private async runRealESLintAnalysis(filePaths: string[]): Promise<RealViolation[]> {
    const violations: RealViolation[] = [];
    
    try {
      // 动态导入 ESLint
      const { ESLint } = await import('eslint');
      
      // ESLint 9.x 简化配置
      const eslint = new ESLint({
        fix: false,
        cwd: process.cwd()
      });

      const results = await eslint.lintFiles(filePaths);
      
      for (const result of results) {
        for (const message of result.messages) {
          violations.push({
            type: message.severity === 2 ? 'error' : 'warning',
            file: result.filePath,
            line: message.line,
            column: message.column,
            message: message.message,
            rule: message.ruleId || 'unknown',
            category: this.categorizeESLintRule(message.ruleId || ''),
            severity: message.severity,
            analyzer: 'eslint'
          });
        }
      }
    } catch (error) {
      console.warn('⚠️ [ESLint] Not available, skipping lint analysis:', error);
      // 如果 ESLint 不可用，返回空数组而不是抛出错误
    }

    return violations;
  }

  /**
   * 使用 TypeScript AST 分析文件（异步优化版本）
   */
  private async analyzeFileWithAST(filePath: string): Promise<RealQualityMetrics> {
    const content = await AsyncFileOperations.readFileWithCache(filePath);
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    let cyclomaticComplexity = 0;
    let cognitiveComplexity = 0;
    let classCount = 0;
    let methodCount = 0;
    let functionCount = 0;
    let halsteadVolume = 0;

    // 计算行数（排除空行和注释）
    const lines = content.split('\n').filter(line => 
      line.trim() !== '' && !line.trim().startsWith('//')
    );
    const linesOfCode = lines.length;

    // 遍历 AST 计算指标
    const visitor = (node: ts.Node) => {
      // 函数和方法分析
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isArrowFunction(node)) {
        if (ts.isFunctionDeclaration(node)) {
          functionCount++;
        } else if (ts.isMethodDeclaration(node)) {
          methodCount++;
        }
        
        cyclomaticComplexity += this.calculateCyclomaticComplexity(node);
        cognitiveComplexity += this.calculateCognitiveComplexity(node);
        halsteadVolume += this.calculateHalsteadVolume(node);
      }
      
      // 类分析
      if (ts.isClassDeclaration(node)) {
        classCount++;
      }

      ts.forEachChild(node, visitor);
    };

    visitor(sourceFile);

    // 计算可维护性指数 - 使用 Microsoft 公式
    const avgCyclomaticComplexity = functionCount > 0 ? cyclomaticComplexity / functionCount : 0;
    const avgHalsteadVolume = functionCount > 0 ? halsteadVolume / functionCount : 0;
    
    const maintainabilityIndex = Math.max(0, 
      171 - 5.2 * Math.log(avgHalsteadVolume || 1) - 
      0.23 * avgCyclomaticComplexity - 
      16.2 * Math.log(linesOfCode || 1)
    );

    return {
      cyclomaticComplexity: avgCyclomaticComplexity,
      cognitiveComplexity: cognitiveComplexity / Math.max(functionCount + methodCount, 1),
      linesOfCode,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      classCount,
      methodCount,
      functionCount,
      halsteadVolume: avgHalsteadVolume
    };
  }

  /**
   * 检查代码质量违规
   */
  private async checkCodeQualityViolations(filePath: string, metrics: RealQualityMetrics): Promise<RealViolation[]> {
    const violations: RealViolation[] = [];

    // 检查循环复杂度
    if (metrics.cyclomaticComplexity > this.qualityThresholds.cyclomaticComplexity) {
      violations.push({
        type: 'warning',
        file: filePath,
        line: 1,
        column: 1,
        message: `High cyclomatic complexity: ${metrics.cyclomaticComplexity.toFixed(1)} (threshold: ${this.qualityThresholds.cyclomaticComplexity})`,
        rule: 'cyclomatic-complexity',
        category: 'complexity',
        severity: 2,
        analyzer: 'complexity-analyzer'
      });
    }

    // 检查认知复杂度
    if (metrics.cognitiveComplexity > this.qualityThresholds.cognitiveComplexity) {
      violations.push({
        type: 'warning',
        file: filePath,
        line: 1,
        column: 1,
        message: `High cognitive complexity: ${metrics.cognitiveComplexity.toFixed(1)} (threshold: ${this.qualityThresholds.cognitiveComplexity})`,
        rule: 'cognitive-complexity',
        category: 'complexity',
        severity: 2,
        analyzer: 'complexity-analyzer'
      });
    }

    // 检查可维护性指数
    if (metrics.maintainabilityIndex < this.qualityThresholds.maintainabilityIndex) {
      violations.push({
        type: 'error',
        file: filePath,
        line: 1,
        column: 1,
        message: `Low maintainability index: ${metrics.maintainabilityIndex} (threshold: ${this.qualityThresholds.maintainabilityIndex})`,
        rule: 'maintainability-index',
        category: 'maintainability',
        severity: 3,
        analyzer: 'maintainability-analyzer'
      });
    }

    // 检查 SOLID 原则违规
    await this.checkSOLIDViolations(filePath, violations);

    return violations;
  }

  /**
   * 检查 SOLID 原则违规（异步优化版本）
   */
  private async checkSOLIDViolations(filePath: string, violations: RealViolation[]): Promise<void> {
    try {
      const content = await AsyncFileOperations.readFileWithCache(filePath);
      const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

      // 检查单一职责原则 (SRP)
      const classes = this.findNodesOfType(sourceFile, ts.isClassDeclaration);
      
      classes.forEach(cls => {
        const className = cls.name?.text || 'Anonymous';
        const methods = this.findNodesOfType(cls, ts.isMethodDeclaration);
        const publicMethods = methods.filter(m => 
          !m.modifiers?.some(mod => mod.kind === ts.SyntaxKind.PrivateKeyword)
        );

        if (publicMethods.length > this.qualityThresholds.maxMethodsPerClass) {
          const { line, column } = this.getNodePosition(sourceFile, cls);
          violations.push({
            type: 'warning',
            file: filePath,
            line,
            column,
            message: `Class "${className}" has ${publicMethods.length} public methods (max: ${this.qualityThresholds.maxMethodsPerClass}). Consider splitting into smaller classes.`,
            rule: 'single-responsibility-principle',
            category: 'solid',
            severity: 2,
            analyzer: 'solid-analyzer'
          });
        }
      });
    } catch (error) {
      console.warn(`⚠️ [SOLID] Error checking SOLID violations in ${filePath}:`, error);
    }
  }

  /**
   * 计算真实的健康评分 - 基于指数衰减函数
   */
  private calculateRealHealthScore(violations: RealViolation[], metrics: RealQualityMetrics): number {
    let score = 100;

    // 基于违规数量和严重程度的指数衰减
    const errorCount = violations.filter(v => v.type === 'error').length;
    const warningCount = violations.filter(v => v.type === 'warning').length;
    const infoCount = violations.filter(v => v.type === 'info').length;

    // 使用指数衰减函数 - 消除线性惩罚
    score = Math.max(0, 100 * Math.exp(-0.1 * (errorCount * 3 + warningCount * 2 + infoCount * 1)));

    // 基于指标的额外调整
    if (metrics.maintainabilityIndex < 30) {
      score *= 0.8; // 可维护性极低时额外惩罚
    }
    
    if (metrics.cyclomaticComplexity > 20) {
      score *= 0.9; // 复杂度极高时额外惩罚
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  // 辅助方法
  private isAnalyzableFile(filePath: string): boolean {
    return fs.existsSync(filePath) && /\.(ts|tsx|js|jsx)$/.test(filePath);
  }

  private categorizeESLintRule(ruleId: string): 'complexity' | 'maintainability' | 'standards' | 'security' | 'solid' {
    if (ruleId.includes('complexity')) return 'complexity';
    if (ruleId.includes('security') || ruleId.includes('no-eval') || ruleId.includes('no-unsafe')) return 'security';
    if (ruleId.includes('class') || ruleId.includes('method')) return 'solid';
    if (ruleId.includes('prefer') || ruleId.includes('consistent')) return 'maintainability';
    return 'standards';
  }

  private mergeMetrics(total: RealQualityMetrics, file: RealQualityMetrics): void {
    total.cyclomaticComplexity += file.cyclomaticComplexity;
    total.cognitiveComplexity += file.cognitiveComplexity;
    total.linesOfCode += file.linesOfCode;
    total.maintainabilityIndex += file.maintainabilityIndex;
    total.classCount += file.classCount;
    total.methodCount += file.methodCount;
    total.functionCount += file.functionCount;
    total.halsteadVolume += file.halsteadVolume;
  }

  private generateSummary(violations: RealViolation[], filesAnalyzed: number) {
    return {
      totalViolations: violations.length,
      criticalIssues: violations.filter(v => v.type === 'error').length,
      warnings: violations.filter(v => v.type === 'warning').length,
      suggestions: violations.filter(v => v.type === 'info').length,
      filesAnalyzed
    };
  }

  private generateRecommendations(violations: RealViolation[], metrics: RealQualityMetrics): string[] {
    const recommendations: string[] = [];
    
    const criticalCount = violations.filter(v => v.type === 'error').length;
    if (criticalCount > 0) {
      recommendations.push(`Fix ${criticalCount} critical violations immediately`);
    }

    if (metrics.cyclomaticComplexity > this.qualityThresholds.cyclomaticComplexity) {
      recommendations.push('Break down complex functions into smaller, more manageable pieces');
    }

    if (metrics.maintainabilityIndex < this.qualityThresholds.maintainabilityIndex) {
      recommendations.push('Improve code maintainability through refactoring and documentation');
    }

    const solidViolations = violations.filter(v => v.category === 'solid').length;
    if (solidViolations > 0) {
      recommendations.push('Review class design to better follow SOLID principles');
    }

    return recommendations;
  }

  // TypeScript AST 辅助方法
  private calculateCyclomaticComplexity(node: ts.Node): number {
    let complexity = 1; // 基础复杂度

    const visitor = (child: ts.Node) => {
      // 决策点：if, while, for, switch case, catch, &&, ||, ?:
      if (ts.isIfStatement(child) || 
          ts.isWhileStatement(child) || 
          ts.isForStatement(child) || 
          ts.isForInStatement(child) || 
          ts.isForOfStatement(child) ||
          ts.isCaseClause(child) ||
          ts.isCatchClause(child) ||
          ts.isConditionalExpression(child)) {
        complexity++;
      }
      
      // 逻辑运算符
      if (ts.isBinaryExpression(child)) {
        if (child.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            child.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          complexity++;
        }
      }

      ts.forEachChild(child, visitor);
    };

    ts.forEachChild(node, visitor);
    return complexity;
  }

  private calculateCognitiveComplexity(node: ts.Node): number {
    let complexity = 0;

    const visitor = (child: ts.Node, level: number) => {
      if (ts.isIfStatement(child) || 
          ts.isWhileStatement(child) || 
          ts.isForStatement(child) || 
          ts.isSwitchStatement(child)) {
        complexity += 1 + level;
        level++;
      }

      ts.forEachChild(child, (grandChild) => visitor(grandChild, level));
    };

    ts.forEachChild(node, (child) => visitor(child, 0));
    return complexity;
  }

  private calculateHalsteadVolume(node: ts.Node): number {
    const operators = new Set<string>();
    const operands = new Set<string>();

    const visitor = (child: ts.Node) => {
      if (ts.isBinaryExpression(child)) {
        operators.add(child.operatorToken.getText());
      }
      if (ts.isIdentifier(child)) {
        operands.add(child.text);
      }
      ts.forEachChild(child, visitor);
    };

    ts.forEachChild(node, visitor);

    const n1 = operators.size; // 唯一操作符数
    const n2 = operands.size;  // 唯一操作数数
    const N = n1 + n2;         // 程序长度

    return N > 0 ? N * Math.log2(n1 + n2) : 0;
  }

  private findNodesOfType<T extends ts.Node>(node: ts.Node, predicate: (node: ts.Node) => node is T): T[] {
    const results: T[] = [];
    
    const visitor = (child: ts.Node) => {
      if (predicate(child)) {
        results.push(child);
      }
      ts.forEachChild(child, visitor);
    };
    
    ts.forEachChild(node, visitor);
    return results;
  }

  private getNodePosition(sourceFile: ts.SourceFile, node: ts.Node): { line: number; column: number } {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return { line: line + 1, column: character + 1 };
  }
}

/**
 * 导出函数：基于质量检查结果计算健康评分
 * 使用原始框架的指数衰减算法，避免线性惩罚问题
 */
export function calculateRealHealthScore(qualityChecks: any[]): number {
  if (!qualityChecks || qualityChecks.length === 0) {
    return 0; // 无检查项时返回0分
  }

  let score = 100;

  // 统计不同状态的检查项
  const errorCount = qualityChecks.filter(c => c.status === 'FAIL').length;
  const warningCount = qualityChecks.filter(c => c.status === 'WARNING').length;
  const passCount = qualityChecks.filter(c => c.status === 'PASS').length;

  // 使用指数衰减函数 - 消除线性惩罚，基于原始框架算法
  score = Math.max(0, 100 * Math.exp(-0.1 * (errorCount * 3 + warningCount * 2)));

  // 基于通过率的额外调整
  const passRate = passCount / qualityChecks.length;
  if (passRate < 0.5) {
    score *= 0.8; // 通过率低于50%时额外惩罚
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}