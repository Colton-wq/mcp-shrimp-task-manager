import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import { getTaskById, getAllTasks } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { withFileLock } from "../../utils/fileLock.js";
import { findProjectRoot, resolveProjectFile, getProjectInfo } from "../../utils/projectRootDetector.js";
import {
  createSuccessResponse,
  createNotFoundError,
  createValidationError,
  createInternalError,
  createWorkflowResponse,
} from "../../utils/mcpResponse.js";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";
import { AuditCheckpoint, TaskType } from "../../prompts/generators/executeTask.js";
import { ConversationPatternDetector } from "../intervention/conversationPatternDetector.js";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

// 导入真实的代码质量检查器 - 使用独立实现
// Import real code quality checker - use standalone implementation
import { RealCodeQualityAnalyzer } from './realCodeQualityAnalyzer.js';




/**
 * 代码审查范围
 * Code review scope
 */
export enum ReviewScope {
  COMPREHENSIVE = "comprehensive",
  DIAGNOSTIC = "diagnostic",
  SECURITY_ONLY = "security_only",
  QUALITY_ONLY = "quality_only"
}

/**
 * 文件清理模式
 * File cleanup mode
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
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string[];
  suggestions?: string[];
}

/**
 * 文件管理违规类型
 * File management violation types
 */
export enum FileManagementViolationType {
  DUPLICATE_FUNCTIONALITY = "DUPLICATE_FUNCTIONALITY",     // 重复功能
  MISPLACED_TEST_FILE = "MISPLACED_TEST_FILE",             // 测试文件位置错误
  ISOLATED_DIRECTORY = "ISOLATED_DIRECTORY",               // 孤立目录
  DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT",               // 重复文档
  MULTIPLE_FUNCTIONS_IN_FILE = "MULTIPLE_FUNCTIONS_IN_FILE" // 一个文件多个功能
}

/**
 * 文件管理违规详情
 * File management violation details
 */
export interface FileManagementViolation {
  type: FileManagementViolationType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  filePath: string;
  description: string;              // 违规描述
  impact: string;                   // 影响说明
  recommendation: string;           // 修正建议
  autoFixAvailable: boolean;        // 是否可自动修复
  relatedFiles: string[];           // 相关文件
  evidence: Record<string, any>;    // 证据数据
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
  violations: FileManagementViolation[];  // 新增：文件管理违规记录
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
 * 代码审查和清理工具的参数验证schema - 集成AI行为约束
 * Code review and cleanup tool parameter validation schema - Integrated AI behavior constraints
 *
 * 🛡️ AI行为约束原则 (AI Behavior Constraint Principles):
 * 1. 功能优先 (Function First) - 任何改进都不能破坏现有功能
 * 2. 真实改进 (Real Improvement) - 专注于解决实际质量问题，而非优化分数
 * 3. 渐进式验证 (Progressive Validation) - 小步快跑，每步验证功能完整性
 * 4. 风险评估 (Risk Assessment) - 改进前评估潜在影响和回滚方案
 *
 * 🚫 严格禁止的行为 (Strictly Prohibited Behaviors):
 * - 创建虚假文件或测试来操控评分
 * - 修改不相关代码来减少警告数量
 * - 重复调用相同工具期望获得更好结果
 * - 进行表面修复而忽略实际质量问题
 * - 为了提升分数而破坏现有功能
 */
export const codeReviewAndCleanupSchema = z.object({
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure data isolation and prevent concurrent conflicts.",
    })
    .describe("REQUIRED - Target project context for code review and cleanup. MANDATORY for multi-agent concurrent safety. Ensures operations are performed in correct project context and prevents data conflicts between different agents. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Must be a valid UUID v4 format (8-4-4-4-12 hexadecimal digits). EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. Use list_tasks or query_task to find valid task IDs.",
    })
    .describe("Unique identifier of the task to review and cleanup. MUST BE: valid UUID v4 format from existing task in system. HOW TO GET: use list_tasks to see all tasks, or query_task to search by name/description. EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. VALIDATION: 8-4-4-4-12 hexadecimal pattern."),
  reviewScope: z
    .nativeEnum(ReviewScope)
    .default(ReviewScope.COMPREHENSIVE)
    .describe("Scope of code review to perform. COMPREHENSIVE: Full quality, security, and cleanup analysis. DIAGNOSTIC: Focus on identifying specific issues. SECURITY_ONLY: Security vulnerabilities only. QUALITY_ONLY: Code quality standards only."),
  cleanupMode: z
    .nativeEnum(CleanupMode)
    .default(CleanupMode.SAFE)
    .describe("File cleanup mode. SAFE: Conservative cleanup of obvious temporary files. AGGRESSIVE: More thorough cleanup including build artifacts. ANALYSIS_ONLY: Analyze cleanup opportunities without making changes."),
  targetFiles: z
    .array(z.string())
    .optional()
    .describe("Optional array of specific files to review. If not provided, reviews all files related to the task."),
});

/**
 * 执行代码质量检查
 * Execute code quality checks
 */
class CodeQualityChecker {
  /**
   * 执行综合代码质量检查
   * Execute comprehensive code quality checks
   */
  static async executeQualityChecks(
    task: Task,
    reviewScope: ReviewScope,
    targetFiles?: string[]
  ): Promise<QualityCheckResult[]> {
    const results: QualityCheckResult[] = [];

    if (reviewScope === ReviewScope.COMPREHENSIVE || reviewScope === ReviewScope.QUALITY_ONLY) {
      // 代码标准检查
      results.push(await this.checkCodeStandards(task, targetFiles));

      // 复杂度分析
      results.push(await this.analyzeComplexity(task, targetFiles));

      // 测试覆盖率检查
      results.push(await this.checkTestCoverage(task, targetFiles));
    }

    if (reviewScope === ReviewScope.COMPREHENSIVE || reviewScope === ReviewScope.SECURITY_ONLY) {
      // 安全漏洞检查
      results.push(await this.checkSecurityVulnerabilities(task, targetFiles));

      // 输入验证检查
      results.push(await this.checkInputValidation(task, targetFiles));
    }

    if (reviewScope === ReviewScope.COMPREHENSIVE || reviewScope === ReviewScope.DIAGNOSTIC) {
      // 错误处理检查
      results.push(await this.checkErrorHandling(task, targetFiles));

      // 性能问题检查
      results.push(await this.checkPerformanceIssues(task, targetFiles));
    }

    return results;
  }  /**
   * 检查代码标准
   * Check code standards
   */
  private static async checkCodeStandards(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      // 使用真实的代码质量检查器 - 消除虚假实现
      // Use real code quality checker - eliminate fake implementations
      const qualityChecker = RealCodeQualityAnalyzer.getInstance();

      // 获取要检查的文件路径 - 修复 targetFiles 处理逻辑
      const filesToCheck: string[] = [];
      
      // 获取正确的项目根目录 - 使用健壮的检测器
      const projectRoot = findProjectRoot({ debug: true });
      
      if (targetFiles && targetFiles.length > 0) {
        // 如果指定了 targetFiles，直接使用这些文件
        for (const filePath of targetFiles) {
          const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
          console.log(`🔍 [DEBUG] Checking targetFile: ${fullPath}, exists: ${fs.existsSync(fullPath)}`);
          if (fs.existsSync(fullPath)) {
            filesToCheck.push(fullPath);
          }
        }
      } else if (task.relatedFiles) {
        // 否则使用任务的相关文件 - 支持所有文件类型（TO_MODIFY, REFERENCE, CREATE等）
        for (const file of task.relatedFiles) {
          const fullPath = path.isAbsolute(file.path) ? file.path : path.resolve(projectRoot, file.path);
          console.log(`🔍 [DEBUG] Checking relatedFile: ${fullPath}, type: ${file.type}, exists: ${fs.existsSync(fullPath)}`);
          if (fs.existsSync(fullPath)) {
            filesToCheck.push(fullPath);
          }
        }
      }

      // 调试信息
      console.log('DEBUG: targetFiles:', targetFiles);
      console.log('DEBUG: filesToCheck:', filesToCheck);
      console.log('DEBUG: task.relatedFiles:', task.relatedFiles?.map(f => f.path));

      if (filesToCheck.length === 0) {
        // 详细的调试信息
        const debugInfo = [];
        debugInfo.push(`Project root: ${projectRoot}`);
        debugInfo.push(`Target files: ${JSON.stringify(targetFiles)}`);
        debugInfo.push(`Related files count: ${task.relatedFiles?.length || 0}`);
        
        if (task.relatedFiles) {
          task.relatedFiles.forEach((file, index) => {
            const fullPath = path.isAbsolute(file.path) ? file.path : path.resolve(projectRoot, file.path);
            debugInfo.push(`File ${index + 1}: ${file.path} (${file.type}) -> ${fullPath} [${fs.existsSync(fullPath) ? 'EXISTS' : 'NOT FOUND'}]`);
          });
        }
        
        return {
          category: 'Code Standards',
          status: 'FAIL',
          message: `No files to check. targetFiles: ${JSON.stringify(targetFiles)}, task.relatedFiles: ${task.relatedFiles?.length || 0}`,
          details: debugInfo,
          suggestions: ['Verify file paths are correct and files exist']
        };
      }

      // 使用全新的真实代码质量分析器
      console.log('🔍 [REAL ANALYZER] Starting comprehensive analysis...');
      const { RealCodeQualityAnalyzer: NewRealAnalyzer } = await import('./realCodeQualityAnalyzer.js');
      const realAnalyzer = NewRealAnalyzer.getInstance();
      
      const analysisResult = await realAnalyzer.analyzeFiles(filesToCheck);
      
      const errorCount = analysisResult.violations.filter(v => v.type === 'error').length;
      const warningCount = analysisResult.violations.filter(v => v.type === 'warning').length;

      let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
      let message = 'Code standards check passed';
      const details: string[] = [];
      const suggestions: string[] = [];

      if (errorCount > 0) {
        status = 'FAIL';
        message = `❌ REAL ANALYZER: Found ${errorCount} errors and ${warningCount} warnings (Health Score: ${analysisResult.healthScore}/100)`;
        details.push(...analysisResult.violations
          .filter(v => v.type === 'error')
          .slice(0, 10)
          .map(v => `${path.basename(v.file)}:${v.line}:${v.column} - ${v.message} (${v.rule})`));
        suggestions.push(...analysisResult.recommendations);
      } else if (warningCount > 5) {
        status = 'WARNING';
        message = `⚠️ REAL ANALYZER: Found ${warningCount} warnings (Health Score: ${analysisResult.healthScore}/100)`;
        details.push(...analysisResult.violations
          .filter(v => v.type === 'warning')
          .slice(0, 5)
          .map(v => `${path.basename(v.file)}:${v.line}:${v.column} - ${v.message} (${v.rule})`));
        suggestions.push(...analysisResult.recommendations);
      } else {
        message = `✅ REAL ANALYZER: Code standards check passed (Health Score: ${analysisResult.healthScore}/100)`;
      }

      // 添加分析统计信息
      details.push(`Files analyzed: ${analysisResult.summary.filesAnalyzed}`);
      details.push(`Total violations: ${analysisResult.summary.totalViolations}`);
      details.push(`Health score: ${analysisResult.healthScore}/100`);

      return {
        category: 'Code Standards',
        status,
        message,
        details,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Code Standards',
        status: 'FAIL',
        message: `Code standards check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review code standards checking implementation']
      };
    }
  }

  /**
   * 分析代码复杂度
   * Analyze code complexity
   */
  private static async analyzeComplexity(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      // 使用真实的复杂度分析 - 基于 TypeScript AST
      // Use real complexity analysis - based on TypeScript AST
      const qualityChecker = RealCodeQualityAnalyzer.getInstance();

      // 获取项目根目录
      const projectRoot = findProjectRoot({ debug: true });

      // 获取要分析的文件路径 - 修复 targetFiles 处理逻辑
      const filesToAnalyze: string[] = [];
      
      if (targetFiles && targetFiles.length > 0) {
        // 如果指定了 targetFiles，直接使用这些文件
        for (const filePath of targetFiles) {
          const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
          if (fs.existsSync(fullPath) && fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
            filesToAnalyze.push(fullPath);
          }
        }
      } else if (task.relatedFiles) {
        // 否则使用任务的相关文件 - 支持所有文件类型（TO_MODIFY, REFERENCE, CREATE等）
        for (const file of task.relatedFiles) {
          const fullPath = path.isAbsolute(file.path) ? file.path : path.resolve(projectRoot, file.path);
          console.log(`🔍 [DEBUG] Complexity check - relatedFile: ${fullPath}, type: ${file.type}, exists: ${fs.existsSync(fullPath)}`);
          if (fs.existsSync(fullPath) && fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
            filesToAnalyze.push(fullPath);
          }
        }
      }

      if (filesToAnalyze.length === 0) {
        return {
          category: 'Code Complexity',
          status: 'PASS',
          message: 'No TypeScript/JavaScript files to analyze',
          details: [],
          suggestions: []
        };
      }

      // 执行真实的复杂度分析
      const complexityAnalysis = await qualityChecker.analyzeFiles(filesToAnalyze);

      let status: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
      let message = 'Code complexity within acceptable limits';
      const details: string[] = [];
      const suggestions: string[] = [];

      // 检查复杂度违规
      const complexityViolations = complexityAnalysis.violations.filter((v: any) => v.category === 'complexity');
      if (complexityViolations.length > 0) {
        status = 'WARNING';
        details.push(...complexityViolations.slice(0, 5).map((v: any) =>
          `${path.basename(v.file)}:${v.line}:${v.column} - ${v.message}`
        ));
        suggestions.push('Consider breaking down complex functions into smaller ones');
        suggestions.push('Reduce nested conditions and loops');
      }

      // 检查可维护性指数
      const maintainabilityThreshold = 50;
      if (complexityAnalysis.metrics.maintainabilityIndex < maintainabilityThreshold) {
        status = 'FAIL';
        details.push(`Maintainability index: ${complexityAnalysis.metrics.maintainabilityIndex} (threshold: ${maintainabilityThreshold})`);
        suggestions.push('Refactor code to improve maintainability');
      }

      // 添加复杂度指标详情
      details.push(`Average cyclomatic complexity: ${complexityAnalysis.metrics.cyclomaticComplexity.toFixed(1)}`);
      details.push(`Average cognitive complexity: ${complexityAnalysis.metrics.cognitiveComplexity.toFixed(1)}`);
      details.push(`Lines of code: ${complexityAnalysis.metrics.linesOfCode}`);
      details.push(`Classes: ${complexityAnalysis.metrics.classCount}, Methods: ${complexityAnalysis.metrics.methodCount}`);

      if (status !== 'PASS') {
        message = `Code complexity issues detected`;
      }

      return {
        category: 'Code Complexity',
        status,
        message,
        details,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Code Complexity',
        status: 'FAIL',
        message: `Complexity analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review complexity analysis implementation']
      };
    }
  }  /**
   * 检查测试覆盖率
   * Check test coverage
   */
  private static async checkTestCoverage(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (task.relatedFiles) {
        const codeFiles = task.relatedFiles.filter(f =>
          f.type === 'TO_MODIFY' || f.type === 'CREATE'
        );
        const testFiles = task.relatedFiles.filter(f =>
          f.path.includes('test') || f.path.includes('spec')
        );

        if (codeFiles.length > 0 && testFiles.length === 0) {
          issues.push('No test files found for implementation');
          suggestions.push('Add unit tests for new functionality');
        }

        // 检查测试文件的质量
        for (const testFile of testFiles) {
          if (fs.existsSync(testFile.path)) {
            const content = fs.readFileSync(testFile.path, 'utf-8');

            if (!content.includes('expect') && !content.includes('assert')) {
              issues.push(`Test file ${testFile.path} appears to have no assertions`);
              suggestions.push('Add proper test assertions to verify functionality');
            }
          }
        }
      }

      return {
        category: 'Test Coverage',
        status: issues.length === 0 ? 'PASS' : 'WARNING',
        message: issues.length === 0 ? 'Test coverage check passed' : `Found ${issues.length} test coverage issues`,
        details: issues,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Test Coverage',
        status: 'FAIL',
        message: `Test coverage check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review test coverage checking implementation']
      };
    }
  }

  /**
   * 检查安全漏洞
   * Check security vulnerabilities
   */
  private static async checkSecurityVulnerabilities(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (task.relatedFiles) {
        for (const file of task.relatedFiles) {
          if (targetFiles && !targetFiles.includes(file.path)) continue;

          if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf-8');
            // 安全检查保留，但移除其他与质量无关的字符串规则
            if (content.includes('eval(') || content.includes('Function(')) {
              issues.push(`Dangerous eval() usage found in ${file.path}`);
              suggestions.push('Avoid using eval() or Function() constructor for security reasons');
            }
            // 其余更高级安全检查应由专用安全工具完成，这里不使用简单字符串规则以避免误报
          }
        }
      }

      return {
        category: 'Security',
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        message: issues.length === 0 ? 'Security check passed' : `Found ${issues.length} security issues`,
        details: issues,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Security',
        status: 'FAIL',
        message: `Security check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review security checking implementation']
      };
    }
  }  /**
   * 检查输入验证
   * Check input validation
   */
  private static async checkInputValidation(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (task.relatedFiles) {
        for (const file of task.relatedFiles) {
          if (targetFiles && !targetFiles.includes(file.path)) continue;

          if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf-8');

            // 检查是否有输入验证
            if (content.includes('req.body') || content.includes('params') || content.includes('query')) {
              if (!content.includes('validate') && !content.includes('schema') && !content.includes('zod')) {
                issues.push(`Missing input validation in ${file.path}`);
                suggestions.push('Add input validation using Zod or similar validation library');
              }
            }
          }
        }
      }

      return {
        category: 'Input Validation',
        status: issues.length === 0 ? 'PASS' : 'WARNING',
        message: issues.length === 0 ? 'Input validation check passed' : `Found ${issues.length} validation issues`,
        details: issues,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Input Validation',
        status: 'FAIL',
        message: `Input validation check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review input validation checking implementation']
      };
    }
  }

  /**
   * 检查错误处理
   * Check error handling
   */
  private static async checkErrorHandling(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (task.relatedFiles) {
        for (const file of task.relatedFiles) {
          if (targetFiles && !targetFiles.includes(file.path)) continue;

          if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf-8');

            // 检查异步操作的错误处理
            if (content.includes('await') || content.includes('Promise')) {
              if (!content.includes('try') && !content.includes('catch')) {
                issues.push(`Missing error handling for async operations in ${file.path}`);
                suggestions.push('Add try-catch blocks for async operations');
              }
            }
          }
        }
      }

      return {
        category: 'Error Handling',
        status: issues.length === 0 ? 'PASS' : 'WARNING',
        message: issues.length === 0 ? 'Error handling check passed' : `Found ${issues.length} error handling issues`,
        details: issues,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Error Handling',
        status: 'FAIL',
        message: `Error handling check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review error handling checking implementation']
      };
    }
  }

  /**
   * 检查性能问题
   * Check performance issues
   */
  private static async checkPerformanceIssues(task: Task, targetFiles?: string[]): Promise<QualityCheckResult> {
    try {
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (task.relatedFiles) {
        for (const file of task.relatedFiles) {
          if (targetFiles && !targetFiles.includes(file.path)) continue;

          if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf-8');

            // 检查潜在的性能问题
            if (content.includes('for') && content.includes('for')) {
              const nestedLoops = (content.match(/for\s*\(/g) || []).length;
              if (nestedLoops > 2) {
                issues.push(`Potential performance issue: nested loops in ${file.path}`);
                suggestions.push('Consider optimizing nested loops or using more efficient algorithms');
              }
            }
          }
        }
      }

      return {
        category: 'Performance',
        status: issues.length === 0 ? 'PASS' : 'WARNING',
        message: issues.length === 0 ? 'Performance check passed' : `Found ${issues.length} performance issues`,
        details: issues,
        suggestions
      };
    } catch (error) {
      return {
        category: 'Performance',
        status: 'FAIL',
        message: `Performance check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review performance checking implementation']
      };
    }
  }
}/**
 * 文件清理管理器
 * File cleanup manager
 */
class FileCleanupManager {
  /**
   * 执行文件清理
   * Execute file cleanup
   */
  static async executeCleanup(
    task: Task,
    cleanupMode: CleanupMode,
    projectPath: string
  ): Promise<CleanupResult> {
    const result: CleanupResult = {
      filesAnalyzed: 0,
      filesRemoved: 0,
      directoriesOptimized: 0,
      removedFiles: [],
      warnings: [],
      suggestions: [],
      violations: []  // 新增：初始化违规记录
    };

    try {
      // 分析项目目录
      await this.analyzeProjectStructure(projectPath, result);

      if (cleanupMode !== CleanupMode.ANALYSIS_ONLY) {
        // 清理临时文件
        await this.cleanupTemporaryFiles(projectPath, cleanupMode, result);

        // 清理测试文件
        await this.cleanupTestFiles(projectPath, cleanupMode, result);

        // 优化目录结构
        await this.optimizeDirectoryStructure(projectPath, cleanupMode, result);
      }

      // 生成建议
      this.generateCleanupSuggestions(result);

    } catch (error) {
      result.warnings.push(`Cleanup operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 分析项目结构
   * Analyze project structure
   */
  private static async analyzeProjectStructure(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      const analyzeDirectory = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isFile()) {
            result.filesAnalyzed++;

            // 识别可能需要清理的文件
            if (this.isTemporaryFile(item)) {
              result.suggestions.push(`Consider removing temporary file: ${itemPath}`);
            }
          } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
            analyzeDirectory(itemPath);
          }
        }
      };

      analyzeDirectory(projectPath);

      // 🔍 新增：文件管理规范检查
      // File management compliance checks
      await this.validateFileManagementCompliance(projectPath, result);

    } catch (error) {
      result.warnings.push(`Failed to analyze project structure: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 清理临时文件
   * Cleanup temporary files
   */
  private static async cleanupTemporaryFiles(
    projectPath: string,
    cleanupMode: CleanupMode,
    result: CleanupResult
  ): Promise<void> {
    const tempPatterns = [
      /\.tmp$/,
      /\.temp$/,
      /~$/,
      /\.bak$/,
      /\.swp$/,
      /\.log$/
    ];

    if (cleanupMode === CleanupMode.AGGRESSIVE) {
      tempPatterns.push(
        /node_modules/,
        /\.cache/,
        /dist/,
        /build/
      );
    }

    const cleanupDirectory = async (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile()) {
          const shouldRemove = tempPatterns.some(pattern => pattern.test(item));
          if (shouldRemove) {
            try {
              await withFileLock(itemPath, async () => {
                fs.unlinkSync(itemPath);
                result.filesRemoved++;
                result.removedFiles.push(itemPath);
              });
            } catch (error) {
              result.warnings.push(`Failed to remove ${itemPath}: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
          await cleanupDirectory(itemPath);
        }
      }
    };

    await cleanupDirectory(projectPath);
  }  /**
   * 清理测试文件
   * Cleanup test files
   */
  private static async cleanupTestFiles(
    projectPath: string,
    cleanupMode: CleanupMode,
    result: CleanupResult
  ): Promise<void> {
    // 🔍 新增：测试文件管理强制规范检查
    // Enhanced test file management compliance checks
    await this.validateTestFileCompliance(projectPath, result);

    // 只在安全模式下清理明显的测试临时文件
    if (cleanupMode === CleanupMode.SAFE) {
      const testTempPatterns = [
        /test.*\.tmp$/,
        /spec.*\.tmp$/,
        /\.test\.log$/,
        /coverage.*\.tmp$/
      ];

      const cleanupTestDirectory = async (dirPath: string) => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isFile()) {
            const shouldRemove = testTempPatterns.some(pattern => pattern.test(item));
            if (shouldRemove) {
              try {
                fs.unlinkSync(itemPath);
                result.filesRemoved++;
                result.removedFiles.push(itemPath);
              } catch (error) {
                result.warnings.push(`Failed to remove test file ${itemPath}: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          } else if (stat.isDirectory() && (item.includes('test') || item.includes('spec'))) {
            await cleanupTestDirectory(itemPath);
          }
        }
      };

      await cleanupTestDirectory(projectPath);
    }
  }

  /**
   * 优化目录结构
   * Optimize directory structure
   */
  private static async optimizeDirectoryStructure(
    projectPath: string,
    cleanupMode: CleanupMode,
    result: CleanupResult
  ): Promise<void> {
    try {
      // 检查空目录
      const checkEmptyDirectories = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory() && !this.isSystemDirectory(item)) {
            checkEmptyDirectories(itemPath);

            // 检查目录是否为空
            const dirItems = fs.readdirSync(itemPath);
            if (dirItems.length === 0) {
              try {
                fs.rmdirSync(itemPath);
                result.directoriesOptimized++;
                result.suggestions.push(`Removed empty directory: ${itemPath}`);
              } catch (error) {
                result.warnings.push(`Failed to remove empty directory ${itemPath}: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
          }
        }
      };

      checkEmptyDirectories(projectPath);
    } catch (error) {
      result.warnings.push(`Directory optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成清理建议
   * Generate cleanup suggestions
   */
  private static generateCleanupSuggestions(result: CleanupResult): void {
    if (result.filesRemoved === 0) {
      result.suggestions.push('Project appears to be clean - no temporary files found');
    } else {
      result.suggestions.push(`Successfully cleaned ${result.filesRemoved} temporary files`);
    }

    if (result.directoriesOptimized > 0) {
      result.suggestions.push(`Optimized ${result.directoriesOptimized} directories`);
    }

    result.suggestions.push('Consider running cleanup regularly to maintain project hygiene');
  }

  /**
   * 检查是否为临时文件
   * Check if file is temporary
   */
  private static isTemporaryFile(filename: string): boolean {
    const tempPatterns = [
      /\.tmp$/,
      /\.temp$/,
      /~$/,
      /\.bak$/,
      /\.swp$/,
      /\.log$/,
      /\.cache$/
    ];

    return tempPatterns.some(pattern => pattern.test(filename));
  }

  /**
   * 检查是否为系统目录
   * Check if directory is system directory
   */
  private static isSystemDirectory(dirname: string): boolean {
    const systemDirs = [
      '.git',
      '.vscode',
      '.idea',
      'node_modules',
      '.next',
      '.nuxt',
      'dist',
      'build'
    ];

    return systemDirs.includes(dirname);
  }

  /**
   * 验证文件管理合规性
   * Validate file management compliance
   */
  private static async validateFileManagementCompliance(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      // 1. 检查重复功能文件
      await this.validateDuplicateFunctionality(projectPath, result);

      // 2. 检查测试文件隔离
      await this.validateTestFileIsolation(projectPath, result);

      // 3. 检查文档重复
      await this.validateDocumentDuplication(projectPath, result);

      // 4. 检查一功能一文件原则
      await this.validateOneFileOneFunction(projectPath, result);

      // 5. 检查孤立目录
      await this.validateIsolatedDirectories(projectPath, result);

    } catch (error) {
      result.warnings.push(`File management compliance validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查重复功能文件
   * Check for duplicate functionality files
   */
  private static async validateDuplicateFunctionality(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      // 复用现有的analyzeDuplication逻辑，但增强为功能级别检测
      const srcDir = path.join(projectPath, 'src');
      if (!fs.existsSync(srcDir)) return;

      const files = this.getSourceFiles(srcDir);
      const functionMap = new Map<string, string[]>(); // 功能签名 -> 文件列表

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const functions = this.extractFunctionSignatures(content, filePath);
          
          for (const func of functions) {
            if (!functionMap.has(func)) {
              functionMap.set(func, []);
            }
            functionMap.get(func)!.push(filePath);
          }
        } catch (error) {
          // 跳过无法读取的文件
          continue;
        }
      }

      // 检查重复功能
      for (const [funcSignature, filePaths] of functionMap) {
        if (filePaths.length > 1) {
          const violation: FileManagementViolation = {
            type: FileManagementViolationType.DUPLICATE_FUNCTIONALITY,
            severity: 'MEDIUM',
            filePath: filePaths[0],
            description: `Duplicate functionality detected: "${funcSignature}" found in ${filePaths.length} files`,
            impact: 'Code duplication increases maintenance cost and potential for bugs',
            recommendation: `Consider consolidating duplicate functionality into a shared module. Affected files: ${filePaths.map(p => path.basename(p)).join(', ')}`,
            autoFixAvailable: false,
            relatedFiles: filePaths.slice(1),
            evidence: { functionSignature: funcSignature, duplicateCount: filePaths.length }
          };
          result.violations.push(violation);
        }
      }
    } catch (error) {
      result.warnings.push(`Duplicate functionality validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查测试文件隔离
   * Check test file isolation
   */
  private static async validateTestFileIsolation(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      const standardTestDirs = ['tests', 'test', '__tests__', 'spec', '__spec__'];
      const testFilePatterns = [/\.test\.(ts|js|tsx|jsx)$/, /\.spec\.(ts|js|tsx|jsx)$/];
      
      const findTestFiles = (dirPath: string, currentPath: string = ''): void => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const relativePath = path.join(currentPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isFile()) {
            const isTestFile = testFilePatterns.some(pattern => pattern.test(item));
            if (isTestFile) {
              const isInTestDir = standardTestDirs.some(testDir => 
                relativePath.includes(testDir + path.sep) || currentPath.includes(testDir)
              );

              if (!isInTestDir) {
                const violation: FileManagementViolation = {
                  type: FileManagementViolationType.MISPLACED_TEST_FILE,
                  severity: 'HIGH',
                  filePath: itemPath,
                  description: `Test file "${item}" is not in a standard test directory`,
                  impact: 'Misplaced test files make project structure confusing and harder to maintain',
                  recommendation: `Move test file to one of the standard test directories: ${standardTestDirs.join(', ')}`,
                  autoFixAvailable: true,
                  relatedFiles: [],
                  evidence: { expectedDirectories: standardTestDirs, currentLocation: relativePath }
                };
                result.violations.push(violation);
              }
            }
          } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
            findTestFiles(itemPath, relativePath);
          }
        }
      };

      findTestFiles(projectPath);
    } catch (error) {
      result.warnings.push(`Test file isolation validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查文档重复
   * Check document duplication
   */
  private static async validateDocumentDuplication(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      const docPatterns = [/\.md$/, /\.txt$/, /readme/i, /changelog/i, /license/i];
      const docFiles: { path: string; content: string; type: string }[] = [];

      const findDocFiles = (dirPath: string): void => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isFile()) {
            const isDocFile = docPatterns.some(pattern => pattern.test(item));
            if (isDocFile) {
              try {
                const content = fs.readFileSync(itemPath, 'utf-8');
                const type = this.getDocumentType(item);
                docFiles.push({ path: itemPath, content, type });
              } catch (error) {
                // 跳过无法读取的文件
              }
            }
          } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
            findDocFiles(itemPath);
          }
        }
      };

      findDocFiles(projectPath);

      // 检查同类型文档重复
      const typeGroups = new Map<string, typeof docFiles>();
      for (const doc of docFiles) {
        if (!typeGroups.has(doc.type)) {
          typeGroups.set(doc.type, []);
        }
        typeGroups.get(doc.type)!.push(doc);
      }

      for (const [type, docs] of typeGroups) {
        if (docs.length > 1) {
          const violation: FileManagementViolation = {
            type: FileManagementViolationType.DUPLICATE_DOCUMENT,
            severity: 'MEDIUM',
            filePath: docs[0].path,
            description: `Multiple ${type} documents found: ${docs.length} files`,
            impact: 'Duplicate documents can confuse users and lead to inconsistent information',
            recommendation: `Consolidate ${type} documents into a single authoritative file. Consider which document should be the primary one and merge or remove others.`,
            autoFixAvailable: false,
            relatedFiles: docs.slice(1).map(d => d.path),
            evidence: { documentType: type, duplicateCount: docs.length }
          };
          result.violations.push(violation);
        }
      }
    } catch (error) {
      result.warnings.push(`Document duplication validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查一功能一文件原则
   * Check one function one file principle
   */
  private static async validateOneFileOneFunction(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      const srcDir = path.join(projectPath, 'src');
      if (!fs.existsSync(srcDir)) return;

      const files = this.getSourceFiles(srcDir);
      
      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const functions = this.extractFunctionSignatures(content, filePath);
          
          // 检查是否有多个主要功能（排除辅助函数）
          const mainFunctions = functions.filter(func => !this.isHelperFunction(func));
          
          if (mainFunctions.length > 1) {
            const violation: FileManagementViolation = {
              type: FileManagementViolationType.MULTIPLE_FUNCTIONS_IN_FILE,
              severity: 'LOW',
              filePath: filePath,
              description: `File contains ${mainFunctions.length} main functions, violating single responsibility principle`,
              impact: 'Files with multiple responsibilities are harder to understand, test, and maintain',
              recommendation: `Consider splitting this file into separate modules, each with a single responsibility. Main functions: ${mainFunctions.slice(0, 3).join(', ')}${mainFunctions.length > 3 ? '...' : ''}`,
              autoFixAvailable: false,
              relatedFiles: [],
              evidence: { functionCount: mainFunctions.length, functions: mainFunctions }
            };
            result.violations.push(violation);
          }
        } catch (error) {
          // 跳过无法分析的文件
          continue;
        }
      }
    } catch (error) {
      result.warnings.push(`One function one file validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查孤立目录
   * Check isolated directories
   */
  private static async validateIsolatedDirectories(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      const prohibitedDirPatterns = [
        /^test_scripts$/,     // 孤立的测试脚本目录
        /^docs?$/,            // 孤立的文档目录（除非是标准docs）
        /^html$/,             // HTML文件目录
        /^startup$/,          // 启动脚本目录
        /^demo$/,             // 演示目录
        /^temp$/,             // 临时目录
        /^tmp$/,              // 临时目录
        /^examples?$/,        // 示例目录（在根目录下）
      ];

      const checkDirectory = (dirPath: string, currentPath: string = ''): void => {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stat = fs.statSync(itemPath);

          if (stat.isDirectory() && !this.isSystemDirectory(item)) {
            // 检查是否为禁止的孤立目录
            const isProhibited = prohibitedDirPatterns.some(pattern => pattern.test(item));
            
            if (isProhibited && currentPath === '') { // 只检查根目录下的孤立目录
              const violation: FileManagementViolation = {
                type: FileManagementViolationType.ISOLATED_DIRECTORY,
                severity: 'MEDIUM',
                filePath: itemPath,
                description: `Isolated directory "${item}" found in project root`,
                impact: 'Isolated directories clutter the project structure and make it harder to navigate',
                recommendation: `Consider moving contents to appropriate standard directories or removing if unnecessary. For tests, use standard test directories like 'tests/' or '__tests__/'`,
                autoFixAvailable: true,
                relatedFiles: [],
                evidence: { directoryName: item, location: 'project root' }
              };
              result.violations.push(violation);
            }

            checkDirectory(itemPath, path.join(currentPath, item));
          }
        }
      };

      checkDirectory(projectPath);
    } catch (error) {
      result.warnings.push(`Isolated directories validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取源代码文件列表
   * Get source code files list
   */
  private static getSourceFiles(dirPath: string): string[] {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
    const files: string[] = [];

    const scanDirectory = (currentDir: string): void => {
      if (!fs.existsSync(currentDir)) return;

      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile()) {
          const ext = path.extname(item);
          if (sourceExtensions.includes(ext)) {
            files.push(itemPath);
          }
        } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
          scanDirectory(itemPath);
        }
      }
    };

    scanDirectory(dirPath);
    return files;
  }

  /**
   * 提取函数签名
   * Extract function signatures
   */
  private static extractFunctionSignatures(content: string, filePath: string): string[] {
    const signatures: string[] = [];
    
    // 简化的函数检测正则表达式
    const functionPatterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,           // function declarations
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/g,    // const arrow functions
      /(?:export\s+)?(\w+)\s*:\s*(?:async\s+)?\(/g,            // object method definitions
      /class\s+(\w+)/g,                                         // class declarations
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        signatures.push(match[1]);
      }
    }

    return signatures;
  }

  /**
   * 判断是否为辅助函数
   * Check if function is a helper function
   */
  private static isHelperFunction(functionName: string): boolean {
    const helperPatterns = [
      /^_/,           // 私有函数（下划线开头）
      /helper/i,      // 包含helper的函数
      /util/i,        // 包含util的函数
      /^get/,         // getter函数
      /^set/,         // setter函数
      /^is/,          // 判断函数
      /^has/,         // 检查函数
    ];

    return helperPatterns.some(pattern => pattern.test(functionName));
  }

  /**
   * 获取文档类型
   * Get document type
   */
  private static getDocumentType(filename: string): string {
    const lowerName = filename.toLowerCase();
    
    if (lowerName.includes('readme')) return 'README';
    if (lowerName.includes('changelog')) return 'CHANGELOG';
    if (lowerName.includes('license')) return 'LICENSE';
    if (lowerName.includes('contributing')) return 'CONTRIBUTING';
    if (lowerName.includes('api')) return 'API';
    if (lowerName.includes('guide')) return 'GUIDE';
    if (lowerName.endsWith('.md')) return 'MARKDOWN';
    if (lowerName.endsWith('.txt')) return 'TEXT';
    
    return 'OTHER';
  }

  /**
   * 验证测试文件合规性
   * Validate test file compliance
   */
  private static async validateTestFileCompliance(projectPath: string, result: CleanupResult): Promise<void> {
    try {
      // 定义标准测试目录
      const standardTestDirectories = [
        'tests',
        'test', 
        '__tests__',
        'spec',
        '__spec__',
        'test_scripts' // 允许但不推荐
      ];

      // 定义测试文件模式
      const testFilePatterns = [
        /\.test\.(ts|tsx|js|jsx|mjs|cjs)$/,
        /\.spec\.(ts|tsx|js|jsx|mjs|cjs)$/,
        /test.*\.(ts|tsx|js|jsx|mjs|cjs)$/,
        /spec.*\.(ts|tsx|js|jsx|mjs|cjs)$/
      ];

      // 定义禁止的孤立测试目录模式
      const prohibitedTestDirPatterns = [
        /^test_.*$/,        // test_开头的目录（除了test_scripts）
        /^.*_test$/,        // _test结尾的目录
        /^.*_tests$/,       // _tests结尾的目录
        /^testing$/,        // testing目录
        /^testdata$/,       // testdata目录
        /^test-.*$/,        // test-开头的目录
        /^.*-test$/,        // -test结尾的目录
      ];

      // 1. 检查错误放置的测试文件
      await this.checkMisplacedTestFiles(projectPath, standardTestDirectories, testFilePatterns, result);

      // 2. 检查孤立的测试目录
      await this.checkIsolatedTestDirectories(projectPath, prohibitedTestDirPatterns, result);

      // 3. 检查测试文件组织结构
      await this.checkTestFileOrganization(projectPath, standardTestDirectories, result);

      // 4. 检查临时测试文件清理
      await this.checkTemporaryTestFiles(projectPath, result);

    } catch (error) {
      result.warnings.push(`Test file compliance validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 检查错误放置的测试文件
   * Check misplaced test files
   */
  private static async checkMisplacedTestFiles(
    projectPath: string,
    standardTestDirectories: string[],
    testFilePatterns: RegExp[],
    result: CleanupResult
  ): Promise<void> {
    const scanDirectory = (dirPath: string, relativePath: string = ''): void => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const currentRelativePath = path.join(relativePath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile()) {
          // 检查是否为测试文件
          const isTestFile = testFilePatterns.some(pattern => pattern.test(item));
          
          if (isTestFile) {
            // 检查是否在标准测试目录中
            const isInStandardTestDir = standardTestDirectories.some(testDir => {
              const normalizedPath = currentRelativePath.replace(/\\/g, '/');
              return normalizedPath.includes(`${testDir}/`) || 
                     normalizedPath.startsWith(`${testDir}/`) ||
                     relativePath.includes(testDir);
            });

            if (!isInStandardTestDir) {
              const violation: FileManagementViolation = {
                type: FileManagementViolationType.MISPLACED_TEST_FILE,
                severity: 'HIGH',
                filePath: itemPath,
                description: `Test file "${item}" is not in a standard test directory`,
                impact: 'Misplaced test files make project structure confusing and harder to maintain. They may not be discovered by test runners.',
                recommendation: `Move test file to one of the standard test directories: ${standardTestDirectories.join(', ')}. Suggested location: tests/${path.dirname(currentRelativePath)}/${item}`,
                autoFixAvailable: true,
                relatedFiles: [],
                evidence: { 
                  expectedDirectories: standardTestDirectories, 
                  currentLocation: currentRelativePath,
                  suggestedLocation: `tests/${path.dirname(currentRelativePath)}/${item}`
                }
              };
              result.violations.push(violation);
            }
          }
        } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
          scanDirectory(itemPath, currentRelativePath);
        }
      }
    };

    scanDirectory(projectPath);
  }

  /**
   * 检查孤立的测试目录
   * Check isolated test directories
   */
  private static async checkIsolatedTestDirectories(
    projectPath: string,
    prohibitedTestDirPatterns: RegExp[],
    result: CleanupResult
  ): Promise<void> {
    const scanDirectory = (dirPath: string, relativePath: string = ''): void => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const currentRelativePath = path.join(relativePath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory() && !this.isSystemDirectory(item)) {
          // 检查是否为禁止的孤立测试目录
          const isProhibitedTestDir = prohibitedTestDirPatterns.some(pattern => pattern.test(item));
          
          if (isProhibitedTestDir && relativePath === '') { // 只检查根目录下的孤立目录
            const violation: FileManagementViolation = {
              type: FileManagementViolationType.ISOLATED_DIRECTORY,
              severity: 'MEDIUM',
              filePath: itemPath,
              description: `Isolated test directory "${item}" found in project root`,
              impact: 'Isolated test directories clutter the project structure and make it harder to navigate. They may not follow standard testing conventions.',
              recommendation: `Consider moving test files to standard test directories (tests/, __tests__/, spec/) or removing if unnecessary. If this directory contains valid tests, reorganize them into the standard structure.`,
              autoFixAvailable: true,
              relatedFiles: [],
              evidence: { 
                directoryName: item, 
                location: 'project root',
                standardAlternatives: ['tests/', '__tests__/', 'spec/']
              }
            };
            result.violations.push(violation);
          }

          scanDirectory(itemPath, currentRelativePath);
        }
      }
    };

    scanDirectory(projectPath);
  }

  /**
   * 检查测试文件组织结构
   * Check test file organization
   */
  private static async checkTestFileOrganization(
    projectPath: string,
    standardTestDirectories: string[],
    result: CleanupResult
  ): Promise<void> {
    // 检查是否有多个测试目录
    const existingTestDirs: string[] = [];
    
    const items = fs.readdirSync(projectPath);
    for (const item of items) {
      const itemPath = path.join(projectPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && standardTestDirectories.includes(item)) {
        existingTestDirs.push(item);
      }
    }

    // 如果有多个测试目录，建议整合
    if (existingTestDirs.length > 1) {
      const primaryTestDir = existingTestDirs[0];
      for (let i = 1; i < existingTestDirs.length; i++) {
        const secondaryTestDir = existingTestDirs[i];
        const secondaryPath = path.join(projectPath, secondaryTestDir);
        
        const violation: FileManagementViolation = {
          type: FileManagementViolationType.ISOLATED_DIRECTORY,
          severity: 'LOW',
          filePath: secondaryPath,
          description: `Multiple test directories detected: ${existingTestDirs.join(', ')}`,
          impact: 'Multiple test directories can confuse developers and test runners about where to find or place tests.',
          recommendation: `Consider consolidating all tests into a single directory: "${primaryTestDir}". Move tests from "${secondaryTestDir}" to "${primaryTestDir}" and remove the empty directory.`,
          autoFixAvailable: false,
          relatedFiles: existingTestDirs.map(dir => path.join(projectPath, dir)),
          evidence: { 
            testDirectories: existingTestDirs,
            recommendedPrimary: primaryTestDir
          }
        };
        result.violations.push(violation);
      }
    }
  }

  /**
   * 检查临时测试文件清理
   * Check temporary test files cleanup
   */
  private static async checkTemporaryTestFiles(projectPath: string, result: CleanupResult): Promise<void> {
    const tempTestPatterns = [
      /\.test\.tmp$/,
      /\.spec\.tmp$/,
      /test.*\.log$/,
      /spec.*\.log$/,
      /coverage.*\.tmp$/,
      /jest.*\.tmp$/,
      /mocha.*\.tmp$/,
      /\.nyc_output/,
      /coverage\/.*\.tmp$/
    ];

    const scanDirectory = (dirPath: string): void => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile()) {
          const isTempTestFile = tempTestPatterns.some(pattern => pattern.test(item));
          
          if (isTempTestFile) {
            // 检查文件是否过期（超过1小时）
            const fileAge = Date.now() - stat.mtime.getTime();
            const oneHour = 60 * 60 * 1000;
            
            if (fileAge > oneHour) {
              result.suggestions.push(`Consider removing old temporary test file: ${itemPath} (${Math.round(fileAge / oneHour)}h old)`);
            }
          }
        } else if (stat.isDirectory() && !this.isSystemDirectory(item)) {
          scanDirectory(itemPath);
        }
      }
    };

    scanDirectory(projectPath);
  }
}

/**
 * 生成违规摘要
 * Generate violation summary
 */
function generateViolationSummary(violations: FileManagementViolation[]): string {
  const summary = [`检测到 ${violations.length} 个文件管理规范违规：\n`];
  
  const groupedViolations = violations.reduce((groups, violation) => {
    if (!groups[violation.type]) {
      groups[violation.type] = [];
    }
    groups[violation.type].push(violation);
    return groups;
  }, {} as Record<string, FileManagementViolation[]>);

  for (const [type, typeViolations] of Object.entries(groupedViolations)) {
    const typeDescription = getViolationTypeDescription(type as FileManagementViolationType);
    summary.push(`### ${typeDescription} (${typeViolations.length}个)`);
    
    for (const violation of typeViolations.slice(0, 3)) { // 只显示前3个
      const severity = getSeverityIcon(violation.severity);
      summary.push(`${severity} **${path.basename(violation.filePath)}**: ${violation.description}`);
    }
    
    if (typeViolations.length > 3) {
      summary.push(`   ... 还有 ${typeViolations.length - 3} 个类似违规`);
    }
    summary.push('');
  }

  return summary.join('\n');
}

/**
 * 生成教育内容
 * Generate educational content
 */
function generateEducationalContent(violations: FileManagementViolation[]): string {
  const educationalTopics = new Set<string>();
  
  for (const violation of violations) {
    switch (violation.type) {
      case FileManagementViolationType.DUPLICATE_FUNCTIONALITY:
        educationalTopics.add('duplicate_functionality');
        break;
      case FileManagementViolationType.MISPLACED_TEST_FILE:
        educationalTopics.add('test_isolation');
        break;
      case FileManagementViolationType.ISOLATED_DIRECTORY:
        educationalTopics.add('directory_structure');
        break;
      case FileManagementViolationType.DUPLICATE_DOCUMENT:
        educationalTopics.add('document_management');
        break;
      case FileManagementViolationType.MULTIPLE_FUNCTIONS_IN_FILE:
        educationalTopics.add('single_responsibility');
        break;
    }
  }

  const content: string[] = [];

  if (educationalTopics.has('duplicate_functionality')) {
    content.push(`**🔄 重复功能问题**
重复功能会导致：
- 维护成本增加（需要在多个地方修改相同逻辑）
- 代码不一致性（不同实现可能产生不同行为）
- 测试复杂度增加（需要测试多个相同功能的实现）
- 代码库膨胀（不必要的代码增加项目大小）`);
  }

  if (educationalTopics.has('test_isolation')) {
    content.push(`**🧪 测试文件隔离原则**
测试文件应该放在标准目录中：
- \`tests/\` - 通用测试目录
- \`__tests__/\` - Jest风格测试目录
- \`test/\` - 简化测试目录
- \`spec/\` - 规范测试目录

好处：
- 清晰的项目结构
- 易于配置测试工具
- 便于CI/CD集成
- 避免测试文件污染源码目录`);
  }

  if (educationalTopics.has('directory_structure')) {
    content.push(`**🗂️ 目录结构规范**
避免创建孤立目录：
- 不要在根目录创建临时性目录
- 使用标准的目录命名约定
- 保持目录结构的一致性和可预测性
- 遵循项目类型的最佳实践`);
  }

  if (educationalTopics.has('document_management')) {
    content.push(`**📄 文档管理最佳实践**
避免文档重复：
- 一个主题只保留一个权威文档
- 定期审查和更新现有文档
- 使用链接而不是复制内容
- 建立清晰的文档层次结构`);
  }

  if (educationalTopics.has('single_responsibility')) {
    content.push(`**🎯 单一职责原则**
每个文件应该只有一个主要职责：
- 更容易理解和维护
- 更好的可测试性
- 更低的耦合度
- 更高的代码复用性`);
  }

  return content.join('\n\n');
}

/**
 * 生成自动修复建议
 * Generate auto-fix suggestions
 */
function generateAutoFixSuggestions(violations: FileManagementViolation[]): string {
  const suggestions: string[] = [];
  
  const autoFixableViolations = violations.filter(v => v.autoFixAvailable);
  const manualFixViolations = violations.filter(v => !v.autoFixAvailable);

  if (autoFixableViolations.length > 0) {
    suggestions.push(`### 🤖 可自动修复的问题 (${autoFixableViolations.length}个)`);
    for (const violation of autoFixableViolations) {
      suggestions.push(`- **${path.basename(violation.filePath)}**: ${violation.recommendation}`);
    }
    suggestions.push('');
  }

  if (manualFixViolations.length > 0) {
    suggestions.push(`### ✋ 需要手动修复的问题 (${manualFixViolations.length}个)`);
    for (const violation of manualFixViolations) {
      suggestions.push(`- **${path.basename(violation.filePath)}**: ${violation.recommendation}`);
      if (violation.relatedFiles.length > 0) {
        suggestions.push(`  相关文件: ${violation.relatedFiles.map(f => path.basename(f)).join(', ')}`);
      }
    }
    suggestions.push('');
  }

  // 添加通用建议
  suggestions.push(`### 💡 通用建议`);
  suggestions.push(`1. **逐步修复**: 优先修复CRITICAL和HIGH级别的违规`);
  suggestions.push(`2. **测试验证**: 修复后运行测试确保功能正常`);
  suggestions.push(`3. **代码审查**: 请团队成员审查修复方案`);
  suggestions.push(`4. **文档更新**: 如有必要，更新相关文档`);

  return suggestions.join('\n');
}

/**
 * 获取违规类型描述
 * Get violation type description
 */
function getViolationTypeDescription(type: FileManagementViolationType): string {
  switch (type) {
    case FileManagementViolationType.DUPLICATE_FUNCTIONALITY:
      return '🔄 重复功能';
    case FileManagementViolationType.MISPLACED_TEST_FILE:
      return '🧪 测试文件位置错误';
    case FileManagementViolationType.ISOLATED_DIRECTORY:
      return '🗂️ 孤立目录';
    case FileManagementViolationType.DUPLICATE_DOCUMENT:
      return '📄 重复文档';
    case FileManagementViolationType.MULTIPLE_FUNCTIONS_IN_FILE:
      return '🎯 多功能文件';
    default:
      return '❓ 未知违规类型';
  }
}

/**
 * 获取严重程度图标
 * Get severity icon
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return '🔴';
    case 'HIGH':
      return '🟠';
    case 'MEDIUM':
      return '🟡';
    case 'LOW':
      return '🟢';
    default:
      return '⚪';
  }
}

/**
 * 代码审查和清理工具主函数
 * Code review and cleanup tool main function
 */
export async function codeReviewAndCleanupTool({
  project,
  taskId,
  reviewScope,
  cleanupMode,
  targetFiles,
}: z.infer<typeof codeReviewAndCleanupSchema>) {
  const { ProjectSession } = await import("../../utils/projectSession.js");

  return await ProjectSession.withProjectContext(project, async () => {
    try {
      // 🛡️ AI行为约束检查 - 防止代码质量作弊行为
      // AI Behavior Constraint Check - Prevent code quality cheating behavior
      const behaviorAnalysis = ConversationPatternDetector.detectCodeQualityCheatingBehavior(
        `代码质量检查工具调用: taskId=${taskId}, reviewScope=${reviewScope}`,
        [] // 工具调用历史将在实际实现中传入
      );

      if (behaviorAnalysis.preventionRequired) {
        console.log(`🚨 [AI行为约束] 检测到代码质量作弊行为: ${behaviorAnalysis.detectedCheatingPatterns.join(", ")}`);

        return createWorkflowResponse(
          `⚠️ **AI行为约束警告**

检测到可能的代码质量作弊行为模式：
${behaviorAnalysis.detectedCheatingPatterns.map(pattern => `• ${pattern}`).join('\n')}

**正确的质量改进方法**：
1. 🎯 **功能优先原则** - 确保任何改进都不会破坏现有功能
2. 🔍 **真实问题识别** - 区分真实质量问题 vs 工具误报
3. 📈 **渐进式改进** - 小步快跑，每步验证功能完整性
4. 🛡️ **风险评估** - 改进前评估潜在影响和回滚方案

**建议行动**：
- 先分析质量问题是否真的需要解决
- 评估改进对现有功能的影响
- 制定具体的改进计划和验证方法
- 避免为了提升分数而进行破坏性修改

请重新考虑改进策略，确保以功能完整性为优先。`,
          {
            shouldProceed: true,
            nextTool: "analyze_task",
            nextToolParams: { taskId, summary: "重新分析任务，制定安全的质量改进策略" },
            reason: "AI行为约束：防止破坏性质量改进"
          }
        );
      }

      // 获取任务信息
      const task = await getTaskById(taskId, project);
      if (!task) {
        return createNotFoundError(
          "Task",
          taskId,
          "Use list_tasks to see all available tasks, or query_task to search by name/description"
        );
      }

      // 执行代码质量检查
      const qualityChecks = await CodeQualityChecker.executeQualityChecks(
        task,
        reviewScope,
        targetFiles
      );

      // 获取项目路径 - 使用健壮的检测器
      const projectPath = findProjectRoot({ debug: true });

      // 执行文件清理
      const cleanupResults = await FileCleanupManager.executeCleanup(
        task,
        cleanupMode,
        projectPath
      );

      // 🛡️ 新增：文件管理规范违规检查和强制性错误阻断
      // File management compliance violation check and mandatory error blocking
      if (cleanupResults.violations && cleanupResults.violations.length > 0) {
        const criticalViolations = cleanupResults.violations.filter(v => v.severity === 'CRITICAL');
        const highViolations = cleanupResults.violations.filter(v => v.severity === 'HIGH');
        
        // 检查是否有阻断性违规
        if (criticalViolations.length > 0 || highViolations.length > 0) {
          console.log(`🚨 [文件管理规范] 检测到 ${criticalViolations.length} 个关键违规和 ${highViolations.length} 个高级违规`);
          
          const violationSummary = generateViolationSummary(cleanupResults.violations);
          const educationalContent = generateEducationalContent(cleanupResults.violations);
          const autoFixSuggestions = generateAutoFixSuggestions(cleanupResults.violations);
          
          return createWorkflowResponse(
            `🚨 **文件管理规范违规检测**

${violationSummary}

## 📚 规范教育

${educationalContent}

## 🔧 修正建议

${autoFixSuggestions}

## ⚠️ 操作阻断

为了维护项目质量和结构整洁，当前操作已被阻断。请先解决上述违规问题，然后重新运行代码审查。

**核心原则**：
- 🎯 **一功能一文件** - 每个文件应该只负责一个主要功能
- 🧪 **测试文件隔离** - 所有测试文件必须放在标准测试目录中
- 📄 **文档去重** - 避免创建重复或不必要的文档
- 🗂️ **目录规范** - 禁止创建孤立或不规范的目录结构

**下一步行动**：
1. 根据上述建议修正违规问题
2. 重新运行 \`code_review_and_cleanup_tool\`
3. 确保所有违规都已解决后继续开发`,
            {
              shouldProceed: false,
              nextTool: "code_review_and_cleanup_tool",
              nextToolParams: { 
                project, 
                taskId, 
                reviewScope: "comprehensive", 
                cleanupMode: "analysis_only" 
              },
              reason: "文件管理规范违规：需要先解决违规问题才能继续"
            }
          );
        }
      }

      // 生成审计检查点
      const auditCheckpoints = generateAuditCheckpoints(task, qualityChecks);

      // 计算总体评分
      const overallScore = calculateOverallScore(qualityChecks);

      // 生成下一步建议
      const nextSteps = generateNextSteps(qualityChecks, cleanupResults, overallScore);

      // 查找或创建工作流上下文
      let workflow = SimpleWorkflowManager.findWorkflowByTaskId(taskId);
      if (!workflow) {
        // 创建标准的任务验证工作流
        workflow = SimpleWorkflowManager.createWorkflow(
          taskId,
          project,
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
      }

      // 更新当前步骤状态
      const currentStepIndex = workflow.steps.findIndex(s => s.tool === "code_review_and_cleanup_tool");
      if (currentStepIndex >= 0) {
        SimpleWorkflowManager.updateStepStatus(
          workflow.workflowId,
          currentStepIndex,
          overallScore >= 80 ? WorkflowStatus.COMPLETED : WorkflowStatus.FAILED,
          { overallScore, qualityChecks, cleanupResults },
          overallScore < 80 ? "Quality standards not met" : undefined
        );
      }

      // 生成工作流继续指导
      const workflowContinuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);

      const result: CodeReviewAndCleanupResult = {
        taskId,
        overallScore,
        qualityChecks,
        cleanupResults,
        auditCheckpoints,
        nextSteps,
        workflowContinuation
      };

      // 生成结构化的响应提示词
      const responsePrompt = generateResponsePrompt(result);

      // 使用工作流感知的响应格式
      return createWorkflowResponse(responsePrompt, workflowContinuation);

    } catch (error) {
      return createInternalError(
        "Code review and cleanup",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  });
}

/**
 * 生成审计检查点
 * Generate audit checkpoints
 */
function generateAuditCheckpoints(task: Task, qualityChecks: QualityCheckResult[]): AuditCheckpoint[] {
  const checkpoints: AuditCheckpoint[] = [];

  // 基于质量检查结果生成检查点
  qualityChecks.forEach(check => {
    if (check.status === 'FAIL') {
      checkpoints.push({
        name: `${check.category} Review`,
        description: check.message,
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: check.details || [],
        tools: ['code-review', 'static-analysis']
      });
    }
  });

  // 添加通用安全检查点
  checkpoints.push({
    name: 'Security Review',
    description: 'Comprehensive security vulnerability assessment',
    mandatory: true,
    timing: 'BEFORE_COMPLETION',
    criteria: ['No security vulnerabilities', 'Input validation present', 'Access controls proper'],
    tools: ['security-scan', 'vulnerability-check', 'access-review']
  });

  return checkpoints;
}

/**
 * 计算总体评分
 * Calculate overall score
 */
function calculateOverallScore(qualityChecks: QualityCheckResult[]): number {
  if (qualityChecks.length === 0) return 100;

  // 基于类别的加权评分，避免“PASS=100/FAIL=30”简化
  const weights: Record<string, number> = {
    'Code Standards': 0.25,      // ESLint 错误和警告
    'Code Complexity': 0.30,     // 循环复杂度和认知复杂度
    'Test Coverage': 0.20,       // 实际测试覆盖率
    'Security': 0.15,            // 安全漏洞检测
    'Maintainability': 0.10,     // 可维护性指数
  };

  let score = 0;
  let totalWeight = 0;

  for (const check of qualityChecks) {
    const w = weights[check.category] ?? 0.05;
    totalWeight += w;
    // 基于真实数值计算评分，消除虚假的 PASS=100/WARNING=70/FAIL=30 评分
    let categoryScore = 100;

    if (check.details && check.details.length > 0) {
      // 根据问题数量和严重程度计算真实评分
      const issueCount = check.details.length;
      const severity = check.status === 'FAIL' ? 3 : check.status === 'WARNING' ? 2 : 1;

      // 使用指数衰减函数计算评分，避免线性惩罚
      categoryScore = Math.max(0, 100 * Math.exp(-0.1 * issueCount * severity));
    }

    score += categoryScore * w;
  }

  if (totalWeight === 0) return 100;
  return Math.round(score / totalWeight);
}/**
 * 生成下一步建议
 * Generate next steps
 */
function generateNextSteps(
  qualityChecks: QualityCheckResult[],
  cleanupResults: CleanupResult,
  overallScore: number
): string[] {
  const steps: string[] = [];

  // 基于质量检查结果生成建议
  qualityChecks.forEach(check => {
    if (check.status === 'FAIL' && check.suggestions) {
      steps.push(...check.suggestions);
    }
  });

  // 基于清理结果生成建议
  if (cleanupResults.suggestions) {
    steps.push(...cleanupResults.suggestions);
  }

  // 基于总体评分生成建议
  if (overallScore >= 80) {
    steps.push('Quality standards met - ready to proceed to next task');
  } else {
    steps.push('Address quality issues before proceeding');
    steps.push('Re-run code review after fixes');
  }

  return steps;
}

/**
 * 确定工作流程继续
 * Determine workflow continuation
 */
function determineWorkflowContinuation(overallScore: number, project: string): {
  shouldProceed: boolean;
  nextTool?: string;
  nextToolParams?: Record<string, any>;
} {
  if (overallScore >= 80) {
    return {
      shouldProceed: true,
      nextTool: 'execute_task',
      nextToolParams: {
        project: project,
        // 下一个任务ID需要从任务列表中获取
      }
    };
  } else {
    return {
      shouldProceed: false
    };
  }
}

/**
 * 生成响应提示词
 * Generate response prompt
 */
function generateResponsePrompt(result: CodeReviewAndCleanupResult): string {
  let prompt = `## 🔍 Code Review and Cleanup Results\n\n`;

  prompt += `**Task ID:** ${result.taskId}\n`;
  prompt += `**Overall Quality Score:** ${result.overallScore}/100\n\n`;

  // 质量检查结果
  prompt += `### Quality Check Results\n\n`;
  result.qualityChecks.forEach(check => {
    const statusIcon = check.status === 'PASS' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
    prompt += `${statusIcon} **${check.category}**: ${check.message}\n`;

    if (check.details && check.details.length > 0) {
      prompt += `   - Issues: ${check.details.join(', ')}\n`;
    }

    if (check.suggestions && check.suggestions.length > 0) {
      prompt += `   - Suggestions: ${check.suggestions.join(', ')}\n`;
    }
    prompt += `\n`;
  });

  // 清理结果
  prompt += `### File Cleanup Results\n\n`;
  prompt += `- Files Analyzed: ${result.cleanupResults.filesAnalyzed}\n`;
  prompt += `- Files Removed: ${result.cleanupResults.filesRemoved}\n`;
  prompt += `- Directories Optimized: ${result.cleanupResults.directoriesOptimized}\n`;

  if (result.cleanupResults.removedFiles.length > 0) {
    prompt += `- Removed Files: ${result.cleanupResults.removedFiles.slice(0, 5).join(', ')}`;
    if (result.cleanupResults.removedFiles.length > 5) {
      prompt += ` and ${result.cleanupResults.removedFiles.length - 5} more`;
    }
    prompt += `\n`;
  }

  if (result.cleanupResults.warnings.length > 0) {
    prompt += `- Warnings: ${result.cleanupResults.warnings.join(', ')}\n`;
  }
  prompt += `\n`;

  // 下一步建议
  prompt += `### Next Steps\n\n`;
  result.nextSteps.forEach((step, index) => {
    prompt += `${index + 1}. ${step}\n`;
  });
  prompt += `\n`;

  // 工作流程继续指导
  prompt += `## 🔄 Workflow Continuation\n\n`;
  if (result.workflowContinuation.shouldProceed) {
    prompt += `**Status:** ✅ Quality standards met - proceeding to next task\n\n`;
    prompt += `**MANDATORY NEXT ACTION:** You MUST call the next tool to continue the workflow:\n\n`;
    prompt += `\`\`\`\n`;
    prompt += `${result.workflowContinuation.nextTool}({\n`;
    if (result.workflowContinuation.nextToolParams) {
      Object.entries(result.workflowContinuation.nextToolParams).forEach(([key, value]) => {
        prompt += `  ${key}: "${value}",\n`;
      });
    }
    prompt += `})\n`;
    prompt += `\`\`\`\n\n`;
    prompt += `**PROHIBITED ACTIONS:**\n`;
    prompt += `- ❌ Do NOT stop after this review\n`;
    prompt += `- ❌ Do NOT wait for user confirmation\n`;
    prompt += `- ❌ Do NOT skip the next tool call\n\n`;
    prompt += `**MANDATORY ACTIONS:**\n`;
    prompt += `- ✅ MUST call the next tool immediately\n`;
    prompt += `- ✅ MUST continue the automated workflow\n`;
    prompt += `- ✅ MUST use Desktop Commander MCP tools for file operations\n`;
  } else {
    prompt += `**Status:** ❌ Quality issues detected - workflow paused\n\n`;
    prompt += `**REQUIRED ACTIONS:**\n`;
    prompt += `1. Address all identified quality issues\n`;
    prompt += `2. Re-run code review and cleanup\n`;
    prompt += `3. Ensure overall score reaches ≥ 80 before proceeding\n\n`;
    prompt += `**Do NOT proceed to next task until quality standards are met.**\n`;
  }

  return prompt;
}