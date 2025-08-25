/**
 * 质量检查专用类型定义
 * Quality check specific type definitions
 */

/**
 * 代码质量分析问题
 * Code quality analysis issue
 */
export interface CodeQualityIssue {
  type: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  category?: 'complexity' | 'maintainability' | 'standards' | 'security';
  severity?: number;
}

/**
 * 代码质量指标
 * Code quality metrics
 */
export interface CodeQualityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  classCount: number;
  methodCount: number;
}

/**
 * 代码质量分析结果
 * Code quality analysis result
 */
export interface CodeQualityAnalysisResult {
  violations: CodeQualityIssue[];
  metrics: CodeQualityMetrics;
  healthScore: number;
  summary: {
    totalFiles: number;
    totalViolations: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * 质量阈值配置
 * Quality threshold configuration
 */
export interface QualityThresholds {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  maintainabilityIndex: number;
  eslintErrorsPerFile: number;
  eslintWarningsPerFile: number;
  maxMethodsPerClass: number;
  maxParametersPerMethod: number;
}