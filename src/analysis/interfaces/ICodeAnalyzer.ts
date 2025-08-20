/**
 * 代码分析器统一接口定义
 * 
 * 本文件定义了所有代码分析器必须实现的统一接口，确保分析器之间的一致性和可互换性。
 * 基于真实工具集成，杜绝模拟数据，提供可靠的代码质量分析能力。
 */

import { EventEmitter } from 'events';

// ============================================================================
// 核心接口定义
// ============================================================================

/**
 * 代码分析器基础接口
 * 所有具体分析器都必须实现此接口
 */
export interface ICodeAnalyzer extends EventEmitter {
  /**
   * 分析器名称
   */
  readonly name: string;
  
  /**
   * 分析器版本
   */
  readonly version: string;
  
  /**
   * 支持的文件扩展名
   */
  readonly supportedExtensions: string[];
  
  /**
   * 分析单个文件
   * @param filePath 文件路径
   * @param options 分析选项
   * @returns 文件分析结果
   */
  analyzeFile(filePath: string, options?: AnalysisOptions): Promise<FileAnalysisResult>;
  
  /**
   * 分析多个文件
   * @param filePaths 文件路径数组
   * @param options 分析选项
   * @returns 批量分析结果
   */
  analyzeFiles(filePaths: string[], options?: AnalysisOptions): Promise<BatchAnalysisResult>;
  
  /**
   * 分析整个项目
   * @param projectPath 项目根路径
   * @param options 分析选项
   * @returns 项目分析结果
   */
  analyzeProject(projectPath: string, options?: AnalysisOptions): Promise<ProjectAnalysisResult>;
  
  /**
   * 验证分析器配置
   * @param config 配置对象
   * @returns 配置验证结果
   */
  validateConfig(config: any): ConfigValidationResult;
  
  /**
   * 获取分析器健康状态
   * @returns 健康检查结果
   */
  getHealthStatus(): Promise<HealthStatus>;
  
  /**
   * 清理资源
   */
  dispose(): Promise<void>;
}

// ============================================================================
// 分析选项和配置
// ============================================================================

/**
 * 通用分析选项
 */
export interface AnalysisOptions {
  /**
   * 包含的文件模式
   */
  includePatterns?: string[];
  
  /**
   * 排除的文件模式
   */
  excludePatterns?: string[];
  
  /**
   * 最大并发数
   */
  maxConcurrency?: number;
  
  /**
   * 超时时间（毫秒）
   */
  timeoutMs?: number;
  
  /**
   * 是否使用缓存
   */
  useCache?: boolean;
  
  /**
   * 缓存策略
   */
  cacheStrategy?: CacheStrategy;
  
  /**
   * 进度回调
   */
  onProgress?: (progress: AnalysisProgress) => void;
  
  /**
   * 分析器特定配置
   */
  analyzerConfig?: Record<string, any>;
}

/**
 * 缓存策略枚举
 */
export enum CacheStrategy {
  NONE = 'none',
  FILE_BASED = 'file-based',
  MEMORY = 'memory',
  HYBRID = 'hybrid'
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /**
   * 是否有效
   */
  isValid: boolean;
  
  /**
   * 错误信息
   */
  errors: string[];
  
  /**
   * 警告信息
   */
  warnings: string[];
  
  /**
   * 建议配置
   */
  suggestions?: Record<string, any>;
}

/**
 * 健康状态
 */
export interface HealthStatus {
  /**
   * 是否健康
   */
  isHealthy: boolean;
  
  /**
   * 状态消息
   */
  message: string;
  
  /**
   * 依赖检查结果
   */
  dependencies: DependencyStatus[];
  
  /**
   * 性能指标
   */
  metrics: PerformanceMetrics;
  
  /**
   * 最后检查时间
   */
  lastCheckTime: Date;
}

/**
 * 依赖状态
 */
export interface DependencyStatus {
  /**
   * 依赖名称
   */
  name: string;
  
  /**
   * 是否可用
   */
  available: boolean;
  
  /**
   * 版本信息
   */
  version?: string;
  
  /**
   * 错误信息
   */
  error?: string;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /**
   * 平均分析时间（毫秒）
   */
  averageAnalysisTime: number;
  
  /**
   * 内存使用量（MB）
   */
  memoryUsage: number;
  
  /**
   * CPU使用率（百分比）
   */
  cpuUsage: number;
  
  /**
   * 缓存命中率
   */
  cacheHitRate: number;
  
  /**
   * 分析文件总数
   */
  totalFilesAnalyzed: number;
  
  /**
   * 错误率
   */
  errorRate: number;
}

// ============================================================================
// 分析结果接口
// ============================================================================

/**
 * 基础分析结果
 */
export interface BaseAnalysisResult {
  /**
   * 分析器名称
   */
  analyzerName: string;
  
  /**
   * 分析器版本
   */
  analyzerVersion: string;
  
  /**
   * 分析开始时间
   */
  startTime: Date;
  
  /**
   * 分析结束时间
   */
  endTime: Date;
  
  /**
   * 分析耗时（毫秒）
   */
  duration: number;
  
  /**
   * 是否成功
   */
  success: boolean;
  
  /**
   * 错误信息
   */
  error?: string;
  
  /**
   * 警告信息
   */
  warnings: string[];
  
  /**
   * 元数据
   */
  metadata: Record<string, any>;
}

/**
 * 文件分析结果
 */
export interface FileAnalysisResult extends BaseAnalysisResult {
  /**
   * 文件路径
   */
  filePath: string;
  
  /**
   * 文件哈希
   */
  fileHash: string;
  
  /**
   * 文件大小（字节）
   */
  fileSize: number;
  
  /**
   * 行数
   */
  lineCount: number;
  
  /**
   * 分析数据
   */
  data: Record<string, any>;
  
  /**
   * 问题列表
   */
  issues: AnalysisIssue[];
  
  /**
   * 指标数据
   */
  metrics: Record<string, number>;
}

/**
 * 批量分析结果
 */
export interface BatchAnalysisResult extends BaseAnalysisResult {
  /**
   * 文件分析结果
   */
  fileResults: FileAnalysisResult[];
  
  /**
   * 成功分析的文件数
   */
  successCount: number;
  
  /**
   * 失败分析的文件数
   */
  failureCount: number;
  
  /**
   * 聚合指标
   */
  aggregatedMetrics: Record<string, number>;
  
  /**
   * 聚合问题
   */
  aggregatedIssues: AnalysisIssue[];
}

/**
 * 项目分析结果
 */
export interface ProjectAnalysisResult extends BatchAnalysisResult {
  /**
   * 项目路径
   */
  projectPath: string;
  
  /**
   * 项目名称
   */
  projectName: string;
  
  /**
   * 项目版本
   */
  projectVersion?: string;
  
  /**
   * 目录结构分析
   */
  directoryAnalysis: DirectoryAnalysis[];
  
  /**
   * 依赖分析
   */
  dependencyAnalysis?: DependencyAnalysis;
  
  /**
   * 项目级别指标
   */
  projectMetrics: ProjectMetrics;
  
  /**
   * 质量评分
   */
  qualityScore: number;
  
  /**
   * 趋势数据
   */
  trends?: TrendData[];
}

// ============================================================================
// 其他接口定义（简化版本）
// ============================================================================

export interface DirectoryAnalysis {
  directoryPath: string;
  fileCount: number;
  totalLines: number;
  averageFileSize: number;
  metrics: Record<string, number>;
  subdirectories: DirectoryAnalysis[];
}

export interface DependencyAnalysis {
  directDependencies: DependencyInfo[];
  devDependencies: DependencyInfo[];
  dependencyTreeDepth: number;
  circularDependencies: CircularDependency[];
  unusedDependencies: string[];
  outdatedDependencies: OutdatedDependency[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  license?: string;
  size?: number;
  vulnerabilities?: SecurityVulnerability[];
}

export interface CircularDependency {
  path: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface OutdatedDependency {
  name: string;
  currentVersion: string;
  latestVersion: string;
  updateType: 'patch' | 'minor' | 'major';
}

export interface ProjectMetrics {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageFileSize: number;
  maxFileSize: number;
  fileTypeDistribution: Record<string, number>;
  complexityMetrics: ComplexityMetrics;
  qualityMetrics: QualityMetrics;
}

export interface ComplexityMetrics {
  averageCyclomaticComplexity: number;
  maxCyclomaticComplexity: number;
  averageCognitiveComplexity: number;
  maxCognitiveComplexity: number;
  averageNestingDepth: number;
  maxNestingDepth: number;
  maintainabilityIndex: number;
}

export interface QualityMetrics {
  duplicationRate: number;
  technicalDebtMinutes: number;
  codeSmellCount: number;
  testCoverage: CoverageMetrics;
  documentationCoverage: number;
}

export interface CoverageMetrics {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

export interface TrendData {
  timestamp: Date;
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface AnalysisIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  filePath: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  ruleId?: string;
  ruleName?: string;
  fixable: boolean;
  fixSuggestion?: string;
  references?: string[];
  tags: string[];
  metadata: Record<string, any>;
}

export enum IssueType {
  SYNTAX_ERROR = 'syntax-error',
  TYPE_ERROR = 'type-error',
  LOGIC_ERROR = 'logic-error',
  STYLE_VIOLATION = 'style-violation',
  PERFORMANCE_ISSUE = 'performance-issue',
  SECURITY_VULNERABILITY = 'security-vulnerability',
  CODE_SMELL = 'code-smell',
  DUPLICATION = 'duplication',
  COMPLEXITY = 'complexity',
  MAINTAINABILITY = 'maintainability',
  ACCESSIBILITY = 'accessibility',
  COMPATIBILITY = 'compatibility',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  DEPENDENCY = 'dependency'
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface SecurityVulnerability {
  id: string;
  cve?: string;
  cwe?: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  cvssScore?: number;
  affectedPackage: string;
  affectedVersions: string;
  fixedVersions?: string;
  fixRecommendation?: string;
  references: string[];
  discoveredAt: Date;
  publishedAt?: Date;
}

export interface AnalysisProgress {
  stage: AnalysisStage;
  totalFiles: number;
  processedFiles: number;
  percentage: number;
  currentFile?: string;
  estimatedTimeRemaining?: number;
  processingSpeed: number;
  errorCount: number;
  warningCount: number;
  message?: string;
}

export enum AnalysisStage {
  INITIALIZING = 'initializing',
  SCANNING_FILES = 'scanning-files',
  LOADING_CONFIG = 'loading-config',
  ANALYZING_FILES = 'analyzing-files',
  AGGREGATING_RESULTS = 'aggregating-results',
  GENERATING_REPORT = 'generating-report',
  CLEANING_UP = 'cleaning-up',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface AnalyzerEvents {
  'progress': (progress: AnalysisProgress) => void;
  'file-analyzed': (result: FileAnalysisResult) => void;
  'error': (error: Error) => void;
  'warning': (warning: string) => void;
  'stage-changed': (stage: AnalysisStage) => void;
  'completed': (result: ProjectAnalysisResult) => void;
  'cancelled': () => void;
}

export enum AnalyzerType {
  COMPLEXITY = 'complexity',
  COVERAGE = 'coverage',
  QUALITY = 'quality',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility',
  DOCUMENTATION = 'documentation',
  DEPENDENCY = 'dependency'
}

export interface IAnalyzerFactory {
  createAnalyzer(type: AnalyzerType, config?: any): ICodeAnalyzer;
  getSupportedTypes(): AnalyzerType[];
  registerAnalyzer(type: AnalyzerType, constructor: new (config?: any) => ICodeAnalyzer): void;
}

export interface AnalyzerRegistration {
  type: AnalyzerType;
  name: string;
  description: string;
  version: string;
  constructor: new (config?: any) => ICodeAnalyzer;
  defaultConfig?: any;
  configSchema?: any;
}