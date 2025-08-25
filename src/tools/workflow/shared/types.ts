/**
 * 共享类型定义
 * Shared type definitions for workflow tools
 */

/**
 * 审查范围枚举
 * Review scope enumeration
 */
export enum ReviewScope {
  COMPREHENSIVE = "comprehensive",
  DIAGNOSTIC = "diagnostic", 
  SECURITY_ONLY = "security_only",
  QUALITY_ONLY = "quality_only"
}

/**
 * 清理模式枚举
 * Cleanup mode enumeration
 */
export enum CleanupMode {
  SAFE = "safe",
  AGGRESSIVE = "aggressive",
  ANALYSIS_ONLY = "analysis_only"
}

/**
 * 质量检查结果
 * Quality check result
 */
export interface QualityCheckResult {
  category: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: string[];
  suggestions?: string[];
  score?: number;
}

/**
 * 综合质量检查工具的输出结果
 * Comprehensive quality check tool output result
 */
export interface CodeReviewAndCleanupResult {
  taskId: string;
  overallScore: number;
  qualityChecks: QualityCheckResult[];
  cleanupResults: CleanupResult;
  auditCheckpoints: AuditCheckpoint[];
  nextSteps: string[];
  workflowContinuation: {
    shouldProceed: boolean;
    nextTool?: string;
    nextToolParams?: Record<string, any>;
  };
}

/**
 * 文件清理结果
 * File cleanup result
 */
export interface CleanupResult {
  filesAnalyzed: number;
  filesRemoved: number;
  directoriesOptimized: number;
  removedFiles: string[];
  warnings: string[];
  suggestions: string[];
  violations: FileManagementViolation[];
}

/**
 * 文件管理违规详情
 * File management violation details
 */
export interface FileManagementViolation {
  type: FileManagementViolationType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  filePath: string;
  description: string;
  impact: string;
  recommendation: string;
  autoFixAvailable: boolean;
  relatedFiles: string[];
  evidence: Record<string, any>;
}

/**
 * 文件管理违规类型枚举
 * File management violation type enumeration
 */
export enum FileManagementViolationType {
  DUPLICATE_FUNCTIONALITY = "DUPLICATE_FUNCTIONALITY",
  MISPLACED_TEST_FILE = "MISPLACED_TEST_FILE", 
  ISOLATED_DIRECTORY = "ISOLATED_DIRECTORY",
  DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT",
  MULTIPLE_FUNCTIONS_IN_FILE = "MULTIPLE_FUNCTIONS_IN_FILE"
}

/**
 * 审计检查点接口（从其他模块导入）
 * Audit checkpoint interface (imported from other modules)
 */
export interface AuditCheckpoint {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  timestamp: string;
}

/**
 * 结构化代码审查输出格式
 * Structured code review output format (based on crazyrabbitLTC/mcp-code-review-server best practices)
 */
export interface StructuredCodeReviewOutput {
  summary: string;
  issues: CodeIssue[];
  strengths: string[];
  recommendations: string[];
  metadata: ReviewMetadata;
}

/**
 * 代码问题接口
 * Code issue interface
 */
export interface CodeIssue {
  type: 'SECURITY' | 'PERFORMANCE' | 'QUALITY' | 'MAINTAINABILITY' | 'COMPLEXITY' | 'TESTING';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  line_numbers?: number[];
  file_path?: string;
  recommendation: string;
  category: string;
}

/**
 * 审查元数据接口
 * Review metadata interface
 */
export interface ReviewMetadata {
  task_id: string;
  task_name: string;
  timestamp: string;
  review_scope: string;
  cleanup_mode: string;
  quality_score: number;
  files_analyzed: number;
  files_cleaned: number;
  total_checks: number;
  passed_checks: number;
  warning_checks: number;
  failed_checks: number;
  // 智能分析相关字段
  smart_analysis_enabled?: boolean;
  tech_stack_detected?: string[];
  code_type_detected?: string;
}