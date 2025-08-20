# 真实代码分析架构设计

## 📋 概述

本文档设计了一个基于真实代码分析工具的架构，用于替换现有的模拟数据系统。该架构集成ESLint、TypeScript编译器、测试覆盖率工具等真实分析工具，确保评分机制基于实际代码质量。

## 🎯 设计目标

### 核心原则
1. **真实性**: 所有分析结果必须基于真实工具，杜绝模拟数据
2. **准确性**: 评分机制反映实际代码质量，而非固定阈值
3. **性能**: 支持大型项目的高效分析
4. **可扩展性**: 易于集成新的分析工具
5. **一致性**: 确保分析结果的可重现性

### 替换目标
- 移除CodeQualityChecker中的所有硬编码值
- 实现基于真实工具的复杂度分析
- 集成真实的测试覆盖率检测
- 建立动态的技术债务评估
- 创建智能的评分算法

## 🏗️ 架构概览

### 系统分层
```
┌─────────────────────────────────────────┐
│           MCP工具接口层                  │
├─────────────────────────────────────────┤
│           分析协调器                     │
├─────────────────────────────────────────┤
│           分析引擎层                     │
│  ┌─────────┬─────────┬─────────┬─────────┐│
│  │复杂度   │覆盖率   │质量     │安全     ││
│  │分析器   │分析器   │分析器   │分析器   ││
│  └─────────┴─────────┴─────────┴─────────┘│
├─────────────────────────────────────────┤
│           工具集成层                     │
│  ┌─────────┬─────────┬─────────┬─────────┐│
│  │ESLint   │TypeScript│Jest    │SonarJS  ││
│  │集成     │编译器API │覆盖率   │集成     ││
│  └─────────┴─────────┴─────────┴─────────┘│
├─────────────────────────────────────────┤
│           缓存和存储层                   │
└─────────────────────────────────────────┘
```

## 🔧 核心组件设计

### 1. 分析协调器 (AnalysisCoordinator)

**职责**: 统一管理所有分析器，协调分析流程，聚合结果

```typescript
interface AnalysisCoordinator {
  // 执行完整的代码分析
  analyzeProject(projectPath: string, options: AnalysisOptions): Promise<AnalysisResult>;
  
  // 增量分析（仅分析变更文件）
  analyzeIncremental(changedFiles: string[], options: AnalysisOptions): Promise<AnalysisResult>;
  
  // 获取分析进度
  getProgress(): AnalysisProgress;
  
  // 取消正在进行的分析
  cancelAnalysis(): void;
}

interface AnalysisOptions {
  // 分析范围配置
  includePatterns: string[];
  excludePatterns: string[];
  
  // 分析器启用配置
  enabledAnalyzers: AnalyzerType[];
  
  // 性能配置
  maxConcurrency: number;
  timeoutMs: number;
  
  // 缓存配置
  useCache: boolean;
  cacheStrategy: CacheStrategy;
}

interface AnalysisResult {
  // 整体评分
  overallScore: number;
  
  // 各维度评分
  complexityScore: number;
  coverageScore: number;
  qualityScore: number;
  securityScore: number;
  
  // 详细分析结果
  complexity: ComplexityAnalysisResult;
  coverage: CoverageAnalysisResult;
  quality: QualityAnalysisResult;
  security: SecurityAnalysisResult;
  
  // 元数据
  analysisTime: number;
  filesAnalyzed: number;
  cacheHitRate: number;
}
```

### 2. 复杂度分析器 (ComplexityAnalyzer)

**基于**: TypeScript Compiler API + 自定义算法

```typescript
interface ComplexityAnalyzer extends ICodeAnalyzer {
  // 分析圈复杂度
  analyzeCyclomaticComplexity(sourceFile: ts.SourceFile): CyclomaticComplexityResult;
  
  // 分析认知复杂度
  analyzeCognitiveComplexity(sourceFile: ts.SourceFile): CognitiveComplexityResult;
  
  // 分析嵌套深度
  analyzeNestingDepth(sourceFile: ts.SourceFile): NestingDepthResult;
  
  // 分析函数长度
  analyzeFunctionLength(sourceFile: ts.SourceFile): FunctionLengthResult;
  
  // 分析可维护性指数
  calculateMaintainabilityIndex(metrics: ComplexityMetrics): number;
}

interface CyclomaticComplexityResult {
  // 文件级别复杂度
  fileComplexity: number;
  
  // 函数级别复杂度
  functionComplexities: Array<{
    functionName: string;
    complexity: number;
    startLine: number;
    endLine: number;
    riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  }>;
  
  // 统计信息
  averageComplexity: number;
  maxComplexity: number;
  complexityDistribution: Record<string, number>;
}

// 实现示例
class TypeScriptComplexityAnalyzer implements ComplexityAnalyzer {
  private typeChecker: ts.TypeChecker;
  
  constructor(private program: ts.Program) {
    this.typeChecker = program.getTypeChecker();
  }
  
  analyzeCyclomaticComplexity(sourceFile: ts.SourceFile): CyclomaticComplexityResult {
    const functionComplexities: Array<any> = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        const complexity = this.calculateCyclomaticComplexity(node);
        const symbol = this.typeChecker.getSymbolAtLocation(node.name);
        
        functionComplexities.push({
          functionName: symbol?.getName() || 'anonymous',
          complexity,
          startLine: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          endLine: sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1,
          riskLevel: this.getRiskLevel(complexity)
        });
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    
    return {
      fileComplexity: functionComplexities.reduce((sum, f) => sum + f.complexity, 0),
      functionComplexities,
      averageComplexity: functionComplexities.length > 0 
        ? functionComplexities.reduce((sum, f) => sum + f.complexity, 0) / functionComplexities.length 
        : 0,
      maxComplexity: Math.max(...functionComplexities.map(f => f.complexity), 0),
      complexityDistribution: this.calculateDistribution(functionComplexities)
    };
  }
  
  private calculateCyclomaticComplexity(node: ts.FunctionLikeDeclaration): number {
    let complexity = 1; // 基础复杂度
    
    const visit = (node: ts.Node) => {
      switch (node.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
        case ts.SyntaxKind.SwitchStatement:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.ConditionalExpression:
          complexity++;
          break;
        case ts.SyntaxKind.CaseClause:
          complexity++;
          break;
        case ts.SyntaxKind.BinaryExpression:
          const binaryExpr = node as ts.BinaryExpression;
          if (binaryExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              binaryExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
            complexity++;
          }
          break;
      }
      
      ts.forEachChild(node, visit);
    };
    
    if (node.body) {
      visit(node.body);
    }
    
    return complexity;
  }
  
  private getRiskLevel(complexity: number): 'low' | 'medium' | 'high' | 'very-high' {
    if (complexity <= 5) return 'low';
    if (complexity <= 10) return 'medium';
    if (complexity <= 20) return 'high';
    return 'very-high';
  }
  
  private calculateDistribution(complexities: Array<{complexity: number}>): Record<string, number> {
    const distribution = { low: 0, medium: 0, high: 0, 'very-high': 0 };
    
    complexities.forEach(f => {
      const level = this.getRiskLevel(f.complexity);
      distribution[level]++;
    });
    
    return distribution;
  }
}
```

### 3. 覆盖率分析器 (CoverageAnalyzer)

**基于**: Jest Coverage API + c8 + nyc

```typescript
interface CoverageAnalyzer extends ICodeAnalyzer {
  // 运行测试并收集覆盖率
  runTestsWithCoverage(testPattern: string): Promise<CoverageResult>;
  
  // 分析现有覆盖率报告
  analyzeCoverageReport(reportPath: string): CoverageResult;
  
  // 计算覆盖率趋势
  calculateCoverageTrend(historicalData: CoverageResult[]): CoverageTrend;
}

interface CoverageResult {
  // 整体覆盖率
  overall: CoverageMetrics;
  
  // 文件级别覆盖率
  files: Array<{
    filePath: string;
    coverage: CoverageMetrics;
    uncoveredLines: number[];
    uncoveredBranches: BranchInfo[];
  }>;
  
  // 目录级别覆盖率
  directories: Array<{
    directoryPath: string;
    coverage: CoverageMetrics;
    fileCount: number;
  }>;
  
  // 测试执行信息
  testExecution: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    executionTime: number;
  };
}

interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

// 实现示例
class JestCoverageAnalyzer implements CoverageAnalyzer {
  async runTestsWithCoverage(testPattern: string): Promise<CoverageResult> {
    const jestConfig = {
      collectCoverage: true,
      coverageDirectory: 'coverage',
      coverageReporters: ['json', 'lcov', 'text'],
      testMatch: [testPattern],
      coverageThreshold: {
        global: {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0
        }
      }
    };
    
    // 使用Jest API运行测试
    const jest = require('jest');
    const results = await jest.runCLI(jestConfig, [process.cwd()]);
    
    // 解析覆盖率报告
    const coverageMap = results.results.coverageMap;
    
    return this.parseCoverageMap(coverageMap);
  }
  
  private parseCoverageMap(coverageMap: any): CoverageResult {
    const files: Array<any> = [];
    const directories = new Map<string, CoverageMetrics>();
    
    coverageMap.files().forEach((filePath: string) => {
      const fileCoverage = coverageMap.fileCoverageFor(filePath);
      const summary = fileCoverage.toSummary();
      
      files.push({
        filePath,
        coverage: {
          statements: summary.statements.pct,
          branches: summary.branches.pct,
          functions: summary.functions.pct,
          lines: summary.lines.pct
        },
        uncoveredLines: fileCoverage.getUncoveredLines(),
        uncoveredBranches: this.getUncoveredBranches(fileCoverage)
      });
      
      // 聚合目录级别覆盖率
      const dirPath = path.dirname(filePath);
      if (!directories.has(dirPath)) {
        directories.set(dirPath, {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0
        });
      }
    });
    
    // 计算整体覆盖率
    const overall = this.calculateOverallCoverage(files);
    
    return {
      overall,
      files,
      directories: Array.from(directories.entries()).map(([path, coverage]) => ({
        directoryPath: path,
        coverage,
        fileCount: files.filter(f => f.filePath.startsWith(path)).length
      })),
      testExecution: {
        totalTests: 0, // 从Jest结果中获取
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        executionTime: 0
      }
    };
  }
  
  private calculateOverallCoverage(files: Array<any>): CoverageMetrics {
    if (files.length === 0) {
      return { statements: 0, branches: 0, functions: 0, lines: 0 };
    }
    
    return {
      statements: files.reduce((sum, f) => sum + f.coverage.statements, 0) / files.length,
      branches: files.reduce((sum, f) => sum + f.coverage.branches, 0) / files.length,
      functions: files.reduce((sum, f) => sum + f.coverage.functions, 0) / files.length,
      lines: files.reduce((sum, f) => sum + f.coverage.lines, 0) / files.length
    };
  }
  
  private getUncoveredBranches(fileCoverage: any): BranchInfo[] {
    const branches: BranchInfo[] = [];
    const branchMap = fileCoverage.getBranchCoverageByLine();
    
    Object.keys(branchMap).forEach(line => {
      const lineBranches = branchMap[line];
      lineBranches.forEach((branch: any, index: number) => {
        if (branch.coverage === 0) {
          branches.push({
            line: parseInt(line),
            branch: index,
            type: branch.type
          });
        }
      });
    });
    
    return branches;
  }
}

interface BranchInfo {
  line: number;
  branch: number;
  type: string;
}
```

### 4. 质量分析器 (QualityAnalyzer)

**基于**: ESLint + TypeScript Compiler API + 自定义规则

```typescript
interface QualityAnalyzer extends ICodeAnalyzer {
  // ESLint规则检查
  runESLintAnalysis(files: string[]): Promise<ESLintResult>;
  
  // TypeScript类型检查
  runTypeScriptAnalysis(files: string[]): Promise<TypeScriptResult>;
  
  // 代码重复检测
  detectCodeDuplication(files: string[]): Promise<DuplicationResult>;
  
  // 代码异味检测
  detectCodeSmells(files: string[]): Promise<CodeSmellResult>;
}

// 实现示例
class ESLintQualityAnalyzer implements QualityAnalyzer {
  private eslint: ESLint;
  
  constructor(configPath?: string) {
    this.eslint = new ESLint({
      configFile: configPath,
      useEslintrc: !configPath,
      fix: false
    });
  }
  
  async runESLintAnalysis(files: string[]): Promise<ESLintResult> {
    const results = await this.eslint.lintFiles(files);
    
    const issues: QualityIssue[] = [];
    let errorCount = 0;
    let warningCount = 0;
    
    results.forEach(result => {
      result.messages.forEach(message => {
        issues.push({
          type: message.severity === 2 ? 'error' : 'warning',
          file: result.filePath,
          line: message.line,
          column: message.column,
          message: message.message,
          rule: message.ruleId || 'unknown',
          severity: message.severity,
          fixable: message.fix !== undefined
        });
        
        if (message.severity === 2) {
          errorCount++;
        } else {
          warningCount++;
        }
      });
    });
    
    return {
      issues,
      summary: {
        totalIssues: issues.length,
        errorCount,
        warningCount,
        filesWithIssues: results.filter(r => r.messages.length > 0).length,
        totalFiles: results.length
      },
      ruleViolations: this.aggregateRuleViolations(issues)
    };
  }
  
  private aggregateRuleViolations(issues: QualityIssue[]): Record<string, number> {
    const violations: Record<string, number> = {};
    
    issues.forEach(issue => {
      violations[issue.rule] = (violations[issue.rule] || 0) + 1;
    });
    
    return violations;
  }
}

interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: number;
  fixable: boolean;
}

interface ESLintResult {
  issues: QualityIssue[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    filesWithIssues: number;
    totalFiles: number;
  };
  ruleViolations: Record<string, number>;
}
```

### 5. 安全分析器 (SecurityAnalyzer)

**基于**: ESLint Security Plugin + Semgrep + 自定义规则

```typescript
interface SecurityAnalyzer extends ICodeAnalyzer {
  // 安全漏洞扫描
  scanVulnerabilities(files: string[]): Promise<SecurityResult>;
  
  // 依赖安全检查
  checkDependencySecurity(packageJsonPath: string): Promise<DependencySecurityResult>;
  
  // 敏感信息检测
  detectSensitiveData(files: string[]): Promise<SensitiveDataResult>;
}

// 实现示例
class ESLintSecurityAnalyzer implements SecurityAnalyzer {
  async scanVulnerabilities(files: string[]): Promise<SecurityResult> {
    const eslint = new ESLint({
      baseConfig: {
        plugins: ['security'],
        extends: ['plugin:security/recommended']
      }
    });
    
    const results = await eslint.lintFiles(files);
    
    const vulnerabilities: SecurityVulnerability[] = [];
    
    results.forEach(result => {
      result.messages.forEach(message => {
        if (message.ruleId?.startsWith('security/')) {
          vulnerabilities.push({
            type: this.mapRuleToVulnerabilityType(message.ruleId),
            severity: this.mapSeverityToSecurityLevel(message.severity),
            file: result.filePath,
            line: message.line,
            column: message.column,
            message: message.message,
            rule: message.ruleId,
            cwe: this.getCWEForRule(message.ruleId)
          });
        }
      });
    });
    
    return {
      vulnerabilities,
      summary: {
        totalVulnerabilities: vulnerabilities.length,
        criticalCount: vulnerabilities.filter(v => v.severity === 'critical').length,
        highCount: vulnerabilities.filter(v => v.severity === 'high').length,
        mediumCount: vulnerabilities.filter(v => v.severity === 'medium').length,
        lowCount: vulnerabilities.filter(v => v.severity === 'low').length
      },
      riskScore: this.calculateRiskScore(vulnerabilities)
    };
  }
  
  private mapRuleToVulnerabilityType(ruleId: string): string {
    const mapping: Record<string, string> = {
      'security/detect-object-injection': 'Object Injection',
      'security/detect-non-literal-regexp': 'ReDoS',
      'security/detect-unsafe-regex': 'ReDoS',
      'security/detect-buffer-noassert': 'Buffer Overflow',
      'security/detect-child-process': 'Command Injection',
      'security/detect-disable-mustache-escape': 'XSS',
      'security/detect-eval-with-expression': 'Code Injection',
      'security/detect-no-csrf-before-method-override': 'CSRF',
      'security/detect-possible-timing-attacks': 'Timing Attack',
      'security/detect-pseudoRandomBytes': 'Weak Randomness'
    };
    
    return mapping[ruleId] || 'Unknown';
  }
  
  private mapSeverityToSecurityLevel(severity: number): 'critical' | 'high' | 'medium' | 'low' {
    if (severity === 2) return 'high';
    return 'medium';
  }
  
  private getCWEForRule(ruleId: string): string | undefined {
    const cweMapping: Record<string, string> = {
      'security/detect-object-injection': 'CWE-94',
      'security/detect-non-literal-regexp': 'CWE-1333',
      'security/detect-unsafe-regex': 'CWE-1333',
      'security/detect-buffer-noassert': 'CWE-120',
      'security/detect-child-process': 'CWE-78',
      'security/detect-disable-mustache-escape': 'CWE-79',
      'security/detect-eval-with-expression': 'CWE-94'
    };
    
    return cweMapping[ruleId];
  }
  
  private calculateRiskScore(vulnerabilities: SecurityVulnerability[]): number {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    
    const totalScore = vulnerabilities.reduce((score, vuln) => {
      return score + weights[vuln.severity];
    }, 0);
    
    // 归一化到0-100分
    const maxPossibleScore = vulnerabilities.length * weights.critical;
    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 100;
  }
}

interface SecurityVulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  cwe?: string;
}

interface SecurityResult {
  vulnerabilities: SecurityVulnerability[];
  summary: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  riskScore: number;
}
```

## 📊 智能评分算法

### 加权评分模型

```typescript
class IntelligentScoringEngine {
  private weights: ScoringWeights;
  
  constructor(weights?: Partial<ScoringWeights>) {
    this.weights = {
      complexity: 0.25,
      coverage: 0.30,
      quality: 0.25,
      security: 0.20,
      ...weights
    };
  }
  
  calculateOverallScore(results: AnalysisResult): number {
    const complexityScore = this.calculateComplexityScore(results.complexity);
    const coverageScore = this.calculateCoverageScore(results.coverage);
    const qualityScore = this.calculateQualityScore(results.quality);
    const securityScore = this.calculateSecurityScore(results.security);
    
    const weightedScore = 
      complexityScore * this.weights.complexity +
      coverageScore * this.weights.coverage +
      qualityScore * this.weights.quality +
      securityScore * this.weights.security;
    
    return Math.round(weightedScore);
  }
  
  private calculateComplexityScore(complexity: ComplexityAnalysisResult): number {
    // 基于复杂度分布计算评分
    const { complexityDistribution, averageComplexity, maxComplexity } = complexity;
    
    let score = 100;
    
    // 平均复杂度惩罚
    if (averageComplexity > 10) score -= 20;
    else if (averageComplexity > 7) score -= 10;
    else if (averageComplexity > 5) score -= 5;
    
    // 最大复杂度惩罚
    if (maxComplexity > 20) score -= 30;
    else if (maxComplexity > 15) score -= 20;
    else if (maxComplexity > 10) score -= 10;
    
    // 高复杂度函数比例惩罚
    const totalFunctions = Object.values(complexityDistribution).reduce((a, b) => a + b, 0);
    const highComplexityRatio = (complexityDistribution['high'] + complexityDistribution['very-high']) / totalFunctions;
    
    if (highComplexityRatio > 0.3) score -= 25;
    else if (highComplexityRatio > 0.2) score -= 15;
    else if (highComplexityRatio > 0.1) score -= 8;
    
    return Math.max(0, score);
  }
  
  private calculateCoverageScore(coverage: CoverageAnalysisResult): number {
    const { overall } = coverage;
    
    // 使用加权平均计算覆盖率评分
    const weightedCoverage = 
      overall.statements * 0.3 +
      overall.branches * 0.3 +
      overall.functions * 0.2 +
      overall.lines * 0.2;
    
    // 非线性评分曲线
    if (weightedCoverage >= 90) return 100;
    if (weightedCoverage >= 80) return 90 + (weightedCoverage - 80) * 1;
    if (weightedCoverage >= 70) return 75 + (weightedCoverage - 70) * 1.5;
    if (weightedCoverage >= 60) return 60 + (weightedCoverage - 60) * 1.5;
    if (weightedCoverage >= 50) return 40 + (weightedCoverage - 50) * 2;
    
    return Math.max(0, weightedCoverage * 0.8);
  }
  
  private calculateQualityScore(quality: QualityAnalysisResult): number {
    const { summary } = quality;
    
    let score = 100;
    
    // 错误惩罚
    score -= summary.errorCount * 5;
    
    // 警告惩罚
    score -= summary.warningCount * 2;
    
    // 文件问题比例惩罚
    const problemFileRatio = summary.filesWithIssues / summary.totalFiles;
    if (problemFileRatio > 0.5) score -= 20;
    else if (problemFileRatio > 0.3) score -= 10;
    else if (problemFileRatio > 0.1) score -= 5;
    
    return Math.max(0, score);
  }
  
  private calculateSecurityScore(security: SecurityAnalysisResult): number {
    const { summary, riskScore } = security;
    
    let score = 100;
    
    // 严重漏洞惩罚
    score -= summary.criticalCount * 30;
    score -= summary.highCount * 20;
    score -= summary.mediumCount * 10;
    score -= summary.lowCount * 5;
    
    // 风险评分调整
    score = Math.min(score, 100 - riskScore);
    
    return Math.max(0, score);
  }
}

interface ScoringWeights {
  complexity: number;
  coverage: number;
  quality: number;
  security: number;
}
```

## ⚡ 性能优化策略

### 1. 缓存机制

```typescript
interface AnalysisCache {
  // 文件级别缓存
  getFileAnalysis(filePath: string, fileHash: string): Promise<FileAnalysisResult | null>;
  setFileAnalysis(filePath: string, fileHash: string, result: FileAnalysisResult): Promise<void>;
  
  // 项目级别缓存
  getProjectAnalysis(projectHash: string): Promise<AnalysisResult | null>;
  setProjectAnalysis(projectHash: string, result: AnalysisResult): Promise<void>;
  
  // 缓存清理
  cleanup(maxAge: number): Promise<void>;
}

class FileSystemAnalysisCache implements AnalysisCache {
  private cacheDir: string;
  
  constructor(cacheDir: string = '.analysis-cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }
  
  async getFileAnalysis(filePath: string, fileHash: string): Promise<FileAnalysisResult | null> {
    const cacheKey = this.generateCacheKey(filePath, fileHash);
    const cachePath = path.join(this.cacheDir, 'files', `${cacheKey}.json`);
    
    try {
      if (await fs.pathExists(cachePath)) {
        const cached = await fs.readJson(cachePath);
        
        // 检查缓存是否过期
        if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) { // 24小时
          return cached.result;
        }
      }
    } catch (error) {
      // 缓存读取失败，继续执行分析
    }
    
    return null;
  }
  
  async setFileAnalysis(filePath: string, fileHash: string, result: FileAnalysisResult): Promise<void> {
    const cacheKey = this.generateCacheKey(filePath, fileHash);
    const cachePath = path.join(this.cacheDir, 'files', `${cacheKey}.json`);
    
    await fs.ensureDir(path.dirname(cachePath));
    await fs.writeJson(cachePath, {
      timestamp: Date.now(),
      filePath,
      fileHash,
      result
    });
  }
  
  private generateCacheKey(filePath: string, fileHash: string): string {
    return crypto.createHash('md5').update(`${filePath}:${fileHash}`).digest('hex');
  }
  
  private async ensureCacheDir(): Promise<void> {
    await fs.ensureDir(this.cacheDir);
    await fs.ensureDir(path.join(this.cacheDir, 'files'));
    await fs.ensureDir(path.join(this.cacheDir, 'projects'));
  }
}
```

### 2. 并发处理

```typescript
class ConcurrentAnalysisManager {
  private semaphore: Semaphore;
  
  constructor(private maxConcurrency: number = 4) {
    this.semaphore = new Semaphore(maxConcurrency);
  }
  
  async analyzeFiles(files: string[], analyzer: ICodeAnalyzer): Promise<FileAnalysisResult[]> {
    const chunks = this.chunkArray(files, this.maxConcurrency);
    const results: FileAnalysisResult[] = [];
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(file => this.analyzeFileWithSemaphore(file, analyzer))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }
  
  private async analyzeFileWithSemaphore(file: string, analyzer: ICodeAnalyzer): Promise<FileAnalysisResult> {
    await this.semaphore.acquire();
    
    try {
      return await analyzer.analyzeFile(file);
    } finally {
      this.semaphore.release();
    }
  }
  
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];
  
  constructor(permits: number) {
    this.permits = permits;
  }
  
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    
    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(): void {
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}
```

### 3. 增量分析

```typescript
class IncrementalAnalysisManager {
  private fileHashCache = new Map<string, string>();
  
  async detectChangedFiles(projectPath: string): Promise<string[]> {
    const allFiles = await this.getAllSourceFiles(projectPath);
    const changedFiles: string[] = [];
    
    for (const file of allFiles) {
      const currentHash = await this.calculateFileHash(file);
      const cachedHash = this.fileHashCache.get(file);
      
      if (currentHash !== cachedHash) {
        changedFiles.push(file);
        this.fileHashCache.set(file, currentHash);
      }
    }
    
    return changedFiles;
  }
  
  async analyzeIncremental(
    changedFiles: string[], 
    previousResult: AnalysisResult,
    analyzer: AnalysisCoordinator
  ): Promise<AnalysisResult> {
    // 只分析变更的文件
    const incrementalResult = await analyzer.analyzeFiles(changedFiles);
    
    // 合并结果
    return this.mergeResults(previousResult, incrementalResult, changedFiles);
  }
  
  private async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  private async getAllSourceFiles(projectPath: string): Promise<string[]> {
    const glob = require('glob');
    
    return new Promise((resolve, reject) => {
      glob('**/*.{ts,tsx,js,jsx}', {
        cwd: projectPath,
        ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**']
      }, (err: any, files: string[]) => {
        if (err) reject(err);
        else resolve(files.map(f => path.join(projectPath, f)));
      });
    });
  }
  
  private mergeResults(
    previous: AnalysisResult, 
    incremental: AnalysisResult, 
    changedFiles: string[]
  ): AnalysisResult {
    // 实现结果合并逻辑
    // 这里需要根据具体的结果结构来实现
    return {
      ...previous,
      ...incremental,
      // 重新计算整体评分
      overallScore: this.recalculateOverallScore(previous, incremental, changedFiles)
    };
  }
  
  private recalculateOverallScore(
    previous: AnalysisResult, 
    incremental: AnalysisResult, 
    changedFiles: string[]
  ): number {
    // 基于变更文件的影响重新计算评分
    const scoringEngine = new IntelligentScoringEngine();
    return scoringEngine.calculateOverallScore(incremental);
  }
}
```

## 🔧 配置管理

### 分析配置

```typescript
interface AnalysisConfig {
  // 工具配置
  tools: {
    eslint: {
      configPath?: string;
      rules?: Record<string, any>;
      plugins?: string[];
    };
    typescript: {
      configPath?: string;
      compilerOptions?: ts.CompilerOptions;
    };
    jest: {
      configPath?: string;
      coverageThreshold?: {
        global: {
          branches: number;
          functions: number;
          lines: number;
          statements: number;
        };
      };
    };
  };
  
  // 评分配置
  scoring: {
    weights: ScoringWeights;
    thresholds: {
      complexity: {
        low: number;
        medium: number;
        high: number;
      };
      coverage: {
        excellent: number;
        good: number;
        fair: number;
      };
    };
  };
  
  // 性能配置
  performance: {
    maxConcurrency: number;
    timeoutMs: number;
    cacheEnabled: boolean;
    incrementalEnabled: boolean;
  };
  
  // 文件过滤
  files: {
    include: string[];
    exclude: string[];
    extensions: string[];
  };
}

class AnalysisConfigManager {
  private static readonly DEFAULT_CONFIG: AnalysisConfig = {
    tools: {
      eslint: {
        plugins: ['@typescript-eslint', 'security']
      },
      typescript: {
        compilerOptions: {
          strict: true,
          noImplicitAny: true,
          strictNullChecks: true
        }
      },
      jest: {
        coverageThreshold: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
          }
        }
      }
    },
    scoring: {
      weights: {
        complexity: 0.25,
        coverage: 0.30,
        quality: 0.25,
        security: 0.20
      },
      thresholds: {
        complexity: {
          low: 5,
          medium: 10,
          high: 20
        },
        coverage: {
          excellent: 90,
          good: 80,
          fair: 70
        }
      }
    },
    performance: {
      maxConcurrency: 4,
      timeoutMs: 300000, // 5分钟
      cacheEnabled: true,
      incrementalEnabled: true
    },
    files: {
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    }
  };
  
  static loadConfig(configPath?: string): AnalysisConfig {
    if (configPath && fs.existsSync(configPath)) {
      const userConfig = require(configPath);
      return this.mergeConfig(this.DEFAULT_CONFIG, userConfig);
    }
    
    return this.DEFAULT_CONFIG;
  }
  
  private static mergeConfig(defaultConfig: AnalysisConfig, userConfig: Partial<AnalysisConfig>): AnalysisConfig {
    return {
      tools: { ...defaultConfig.tools, ...userConfig.tools },
      scoring: { ...defaultConfig.scoring, ...userConfig.scoring },
      performance: { ...defaultConfig.performance, ...userConfig.performance },
      files: { ...defaultConfig.files, ...userConfig.files }
    };
  }
}
```

## 📈 监控和报告

### 分析报告生成

```typescript
class AnalysisReportGenerator {
  generateReport(result: AnalysisResult, format: 'json' | 'html' | 'markdown' = 'json'): string {
    switch (format) {
      case 'html':
        return this.generateHTMLReport(result);
      case 'markdown':
        return this.generateMarkdownReport(result);
      default:
        return JSON.stringify(result, null, 2);
    }
  }
  
  private generateMarkdownReport(result: AnalysisResult): string {
    return `
# 代码质量分析报告

## 总体评分: ${result.overallScore}/100

### 各维度评分
- 复杂度: ${result.complexityScore}/100
- 覆盖率: ${result.coverageScore}/100  
- 质量: ${result.qualityScore}/100
- 安全性: ${result.securityScore}/100

### 分析统计
- 分析文件数: ${result.filesAnalyzed}
- 分析耗时: ${result.analysisTime}ms
- 缓存命中率: ${(result.cacheHitRate * 100).toFixed(1)}%

### 复杂度分析
- 平均复杂度: ${result.complexity.averageComplexity}
- 最大复杂度: ${result.complexity.maxComplexity}
- 高复杂度函数: ${result.complexity.complexityDistribution['high'] + result.complexity.complexityDistribution['very-high']}

### 测试覆盖率
- 语句覆盖率: ${result.coverage.overall.statements.toFixed(1)}%
- 分支覆盖率: ${result.coverage.overall.branches.toFixed(1)}%
- 函数覆盖率: ${result.coverage.overall.functions.toFixed(1)}%
- 行覆盖率: ${result.coverage.overall.lines.toFixed(1)}%

### 质量问题
- 错误数量: ${result.quality.summary.errorCount}
- 警告数量: ${result.quality.summary.warningCount}
- 问题文件比例: ${((result.quality.summary.filesWithIssues / result.quality.summary.totalFiles) * 100).toFixed(1)}%

### 安全漏洞
- 严重漏洞: ${result.security.summary.criticalCount}
- 高危漏洞: ${result.security.summary.highCount}
- 中危漏洞: ${result.security.summary.mediumCount}
- 低危漏洞: ${result.security.summary.lowCount}
- 风险评分: ${result.security.riskScore}/100
`;
  }
  
  private generateHTMLReport(result: AnalysisResult): string {
    // 生成HTML格式的详细报告
    // 包含图表、交互式元素等
    return `<!DOCTYPE html>
<html>
<head>
    <title>代码质量分析报告</title>
    <style>
        /* CSS样式 */
    </style>
</head>
<body>
    <!-- HTML内容 -->
</body>
</html>`;
  }
}
```

## 🔄 集成接口

### MCP工具接口

```typescript
// 更新后的MCP工具接口，符合2025标准
export const codeReviewAndCleanupTool = {
  name: 'code_review_and_cleanup_tool',
  description: 'Execute comprehensive code quality review and project cleanup operations',
  inputSchema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
        description: 'Unique identifier of task to review'
      },
      project: {
        type: 'string',
        minLength: 1,
        description: 'Target project context for operations'
      },
      reviewScope: {
        type: 'string',
        enum: ['comprehensive', 'diagnostic', 'security_only', 'quality_only'],
        default: 'comprehensive',
        description: 'Scope of review operations'
      },
      cleanupMode: {
        type: 'string',
        enum: ['safe', 'aggressive', 'analysis_only'],
        default: 'safe',
        description: 'File cleanup mode'
      }
    },
    required: ['taskId', 'project']
  },
  outputSchema: {
    type: 'object',
    properties: {
      overallScore: { type: 'number', minimum: 0, maximum: 100 },
      qualityChecks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            status: { type: 'string', enum: ['PASS', 'WARNING', 'FAIL'] },
            score: { type: 'number' },
            details: { type: 'string' }
          }
        }
      },
      analysisTime: { type: 'number' },
      filesAnalyzed: { type: 'number' },
      nextSteps: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  }
};

// 实现真实的分析逻辑
export async function executeCodeReviewAndCleanup(params: any): Promise<any> {
  const config = AnalysisConfigManager.loadConfig();
  const coordinator = new AnalysisCoordinator(config);
  
  try {
    // 获取项目路径
    const projectPath = await getProjectPath(params.project);
    
    // 执行真实的代码分析
    const result = await coordinator.analyzeProject(projectPath, {
      includePatterns: config.files.include,
      excludePatterns: config.files.exclude,
      enabledAnalyzers: ['complexity', 'coverage', 'quality', 'security'],
      maxConcurrency: config.performance.maxConcurrency,
      timeoutMs: config.performance.timeoutMs,
      useCache: config.performance.cacheEnabled,
      cacheStrategy: 'file-based'
    });
    
    // 生成结构化输出
    return {
      content: [
        {
          type: 'text',
          text: `Code quality analysis completed. Overall score: ${result.overallScore}/100`
        }
      ],
      structuredContent: {
        overallScore: result.overallScore,
        qualityChecks: [
          {
            name: 'Code Complexity',
            status: result.complexityScore >= 80 ? 'PASS' : result.complexityScore >= 60 ? 'WARNING' : 'FAIL',
            score: result.complexityScore,
            details: `Average complexity: ${result.complexity.averageComplexity}, Max: ${result.complexity.maxComplexity}`
          },
          {
            name: 'Test Coverage',
            status: result.coverageScore >= 80 ? 'PASS' : result.coverageScore >= 60 ? 'WARNING' : 'FAIL',
            score: result.coverageScore,
            details: `Overall coverage: ${result.coverage.overall.statements.toFixed(1)}%`
          },
          {
            name: 'Code Quality',
            status: result.qualityScore >= 80 ? 'PASS' : result.qualityScore >= 60 ? 'WARNING' : 'FAIL',
            score: result.qualityScore,
            details: `${result.quality.summary.errorCount} errors, ${result.quality.summary.warningCount} warnings`
          },
          {
            name: 'Security',
            status: result.securityScore >= 80 ? 'PASS' : result.securityScore >= 60 ? 'WARNING' : 'FAIL',
            score: result.securityScore,
            details: `${result.security.summary.totalVulnerabilities} vulnerabilities found`
          }
        ],
        analysisTime: result.analysisTime,
        filesAnalyzed: result.filesAnalyzed,
        nextSteps: generateNextSteps(result)
      }
    };
    
  } catch (error) {
    // 标准JSON-RPC错误处理
    return {
      content: [
        {
          type: 'text',
          text: `Analysis failed: ${error.message}`
        }
      ],
      isError: true
    };
  }
}

function generateNextSteps(result: AnalysisResult): string[] {
  const steps: string[] = [];
  
  if (result.complexityScore < 80) {
    steps.push('Refactor high-complexity functions to improve maintainability');
  }
  
  if (result.coverageScore < 80) {
    steps.push('Add unit tests to increase code coverage');
  }
  
  if (result.qualityScore < 80) {
    steps.push('Fix ESLint errors and warnings');
  }
  
  if (result.securityScore < 80) {
    steps.push('Address security vulnerabilities');
  }
  
  if (steps.length === 0) {
    steps.push('Code quality is excellent - consider code review and documentation updates');
  }
  
  return steps;
}
```

## 📝 总结

这个真实代码分析架构设计提供了：

1. **完全真实的分析能力**: 基于TypeScript Compiler API、ESLint、Jest等真实工具
2. **智能评分算法**: 替代固定阈值的动态评分机制
3. **高性能设计**: 缓存、并发、增量分析等优化策略
4. **MCP 2025合规**: 符合最新标准的工具接口设计
5. **可扩展架构**: 易于集成新的分析工具和评分算法

该架构彻底解决了现有系统的虚假分析问题，提供了真正可靠的代码质量评估能力。

---
**文档版本**: 1.0
**设计日期**: 2025-08-21
**架构复杂度**: 中等
**实现优先级**: 高