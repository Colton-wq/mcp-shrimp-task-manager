import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import { getTaskById, getAllTasks } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { withFileLock } from "../../utils/fileLock.js";
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
import * as fs from "fs";
import * as path from "path";

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
}/**
 * 代码审查和清理工具的参数验证schema
 * Code review and cleanup tool parameter validation schema
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
      const issues: string[] = [];
      const suggestions: string[] = [];

      // 检查相关文件的代码标准
      if (task.relatedFiles) {
        for (const file of task.relatedFiles) {
          if (targetFiles && !targetFiles.includes(file.path)) continue;
          
          // 检查文件是否存在
          if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf-8');
            
            // 基本代码标准检查
            if (content.includes('console.log') && !file.path.includes('test')) {
              issues.push(`Debug console.log found in ${file.path}`);
              suggestions.push('Remove debug console.log statements from production code');
            }
            
            if (content.includes('TODO') || content.includes('FIXME')) {
              issues.push(`TODO/FIXME comments found in ${file.path}`);
              suggestions.push('Address TODO/FIXME comments before completion');
            }
            
            // 检查TypeScript类型安全
            if (file.path.endsWith('.ts') && content.includes('any')) {
              issues.push(`'any' type usage found in ${file.path}`);
              suggestions.push('Replace any types with specific type definitions');
            }
          }
        }
      }

      return {
        category: 'Code Standards',
        status: issues.length === 0 ? 'PASS' : 'WARNING',
        message: issues.length === 0 ? 'Code standards check passed' : `Found ${issues.length} code standard issues`,
        details: issues,
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
      const issues: string[] = [];
      const suggestions: string[] = [];

      if (task.relatedFiles) {
        for (const file of task.relatedFiles) {
          if (targetFiles && !targetFiles.includes(file.path)) continue;
          
          if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf-8');
            const lines = content.split('\n');
            
            // 简单的复杂度分析
            const functionMatches = content.match(/function\s+\w+|=>\s*{|\w+\s*\(/g) || [];
            const avgLinesPerFunction = lines.length / Math.max(functionMatches.length, 1);
            
            if (avgLinesPerFunction > 50) {
              issues.push(`High complexity detected in ${file.path}: ${Math.round(avgLinesPerFunction)} lines per function`);
              suggestions.push('Consider breaking down large functions into smaller, more focused functions');
            }
            
            // 检查嵌套深度
            const maxIndentation = Math.max(...lines.map(line => {
              const match = line.match(/^(\s*)/);
              return match ? match[1].length : 0;
            }));
            
            if (maxIndentation > 12) {
              issues.push(`Deep nesting detected in ${file.path}: ${maxIndentation} spaces max indentation`);
              suggestions.push('Reduce nesting depth by extracting functions or using early returns');
            }
          }
        }
      }

      return {
        category: 'Code Complexity',
        status: issues.length === 0 ? 'PASS' : 'WARNING',
        message: issues.length === 0 ? 'Code complexity analysis passed' : `Found ${issues.length} complexity issues`,
        details: issues,
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
            
            // 基本安全检查
            if (content.includes('eval(') || content.includes('Function(')) {
              issues.push(`Dangerous eval() usage found in ${file.path}`);
              suggestions.push('Avoid using eval() or Function() constructor for security reasons');
            }
            
            if (content.includes('innerHTML') && !content.includes('sanitize')) {
              issues.push(`Potential XSS vulnerability in ${file.path}: innerHTML without sanitization`);
              suggestions.push('Sanitize user input before using innerHTML');
            }
            
            if (content.includes('password') && content.includes('console.log')) {
              issues.push(`Potential password logging in ${file.path}`);
              suggestions.push('Never log sensitive information like passwords');
            }
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
      suggestions: []
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
}/**
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

      // 获取项目路径
      const projectPath = process.cwd(); // 简化实现，实际应该从项目配置获取

      // 执行文件清理
      const cleanupResults = await FileCleanupManager.executeCleanup(
        task,
        cleanupMode,
        projectPath
      );

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

  let totalScore = 0;
  qualityChecks.forEach(check => {
    switch (check.status) {
      case 'PASS':
        totalScore += 100;
        break;
      case 'WARNING':
        totalScore += 70;
        break;
      case 'FAIL':
        totalScore += 30;
        break;
    }
  });

  return Math.round(totalScore / qualityChecks.length);
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