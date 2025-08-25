/**
 * 文件管理专用类型定义
 * File management specific type definitions
 */

import { FileManagementViolation, FileManagementViolationType } from '../shared/types.js';

// 重新导出共享类型以便模块内使用
export { FileManagementViolation, FileManagementViolationType };

/**
 * 测试文件检查配置
 * Test file check configuration
 */
export interface TestFileCheckConfig {
  standardTestDirectories: string[];
  testFilePatterns: RegExp[];
  prohibitedTestDirPatterns: RegExp[];
}

/**
 * 违规检测配置
 * Violation detection configuration
 */
export interface ViolationDetectionConfig {
  enableDuplicateFunctionality: boolean;
  enableMisplacedTestFiles: boolean;
  enableIsolatedDirectories: boolean;
  enableDuplicateDocuments: boolean;
  enableMultipleFunctionsInFile: boolean;
}

/**
 * 文件分析上下文
 * File analysis context
 */
export interface FileAnalysisContext {
  projectPath: string;
  relativePath: string;
  isTestFile: boolean;
  isDocumentFile: boolean;
  fileType: 'source' | 'test' | 'document' | 'config' | 'other';
}

/**
 * 违规报告配置
 * Violation report configuration
 */
export interface ViolationReportConfig {
  maxViolationsPerType: number;
  includeEducationalContent: boolean;
  includeAutoFixSuggestions: boolean;
  severityFilter: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}