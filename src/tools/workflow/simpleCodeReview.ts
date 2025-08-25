/**
 * 简化的代码审查工具
 * Simplified Code Review Tool
 * 
 * 专注于核心功能，避免过度复杂的实现
 */

import { Task } from "../../types/index.js";
import { RealCodeQualityAnalyzer } from './realCodeQualityAnalyzer.js';
import { findProjectRoot } from "../../utils/projectRootDetector.js";
import { AsyncFileOperations } from '../../utils/asyncFileOperations.js';
import * as fs from 'fs';
import * as path from 'path';

export interface SimpleQualityResult {
  category: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: string[];
  suggestions?: string[];
}

export interface SimpleCleanupResult {
  filesAnalyzed: number;
  filesRemoved: number;
  directoriesOptimized: number;
  warnings: string[];
  removedFiles: string[];
}

/**
 * 简化的代码审查器
 */
export class SimpleCodeReviewer {
  /**
   * 执行基本的质量检查
   */
  static async executeBasicChecks(task: Task, targetFiles?: string[]): Promise<SimpleQualityResult[]> {
    const results: SimpleQualityResult[] = [];
    
    try {
      // 代码标准检查
      results.push(await this.checkCodeStandards(task, targetFiles));
      
      // 复杂度检查
      results.push(await this.checkComplexity(task, targetFiles));
      
      // 测试覆盖率检查
      results.push(await this.checkTestCoverage(task, targetFiles));
      
      // 安全检查
      results.push(await this.checkSecurity(task, targetFiles));
      
    } catch (error) {
      results.push({
        category: 'General',
        status: 'FAIL',
        message: `Quality check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review quality checking implementation']
      });
    }
    
    return results;
  }

  /**
   * 检查代码标准
   */
  private static async checkCodeStandards(task: Task, targetFiles?: string[]): Promise<SimpleQualityResult> {
    try {
      const filesToCheck = await this.getFilesToCheck(task, targetFiles);
      
      if (filesToCheck.length === 0) {
        return {
          category: 'Code Standards',
          status: 'FAIL',
          message: 'No files to check',
          suggestions: ['Verify file paths are correct and files exist']
        };
      }

      const qualityChecker = RealCodeQualityAnalyzer.getInstance();
      const analysisResult = await qualityChecker.analyzeFiles(filesToCheck);
      
      const hasViolations = analysisResult.violations && analysisResult.violations.length > 0;
      // 🔧 FIX: 修复默认值问题 - 分析失败时应返回低分而非满分
      const healthScore = analysisResult.healthScore ?? 0;
      
      if (hasViolations) {
        return {
          category: 'Code Standards',
          status: 'FAIL',
          message: `Found ${analysisResult.violations.length} violations (Health Score: ${healthScore}/100)`,
          details: [`Files analyzed: ${filesToCheck.length}`, `Health score: ${healthScore}/100`],
          suggestions: ['Fix critical violations', 'Improve code maintainability']
        };
      } else {
        return {
          category: 'Code Standards',
          status: 'PASS',
          message: `Code standards check passed (Health Score: ${healthScore}/100)`,
          suggestions: ['Continue following current standards']
        };
      }
    } catch (error) {
      return {
        category: 'Code Standards',
        status: 'FAIL',
        message: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review implementation']
      };
    }
  }

  /**
   * 检查代码复杂度
   */
  private static async checkComplexity(task: Task, targetFiles?: string[]): Promise<SimpleQualityResult> {
    try {
      const codeFiles = await this.getCodeFiles(task, targetFiles);
      
      if (codeFiles.length === 0) {
        return {
          category: 'Code Complexity',
          status: 'PASS',
          message: 'No TypeScript/JavaScript files to analyze',
          suggestions: []
        };
      }

      const qualityChecker = RealCodeQualityAnalyzer.getInstance();
      const analysisResult = await qualityChecker.analyzeFiles(codeFiles);
      
      const complexityIssues = analysisResult.violations?.filter((v: any) => v.category === 'complexity') || [];
      
      if (complexityIssues.length > 0) {
        return {
          category: 'Code Complexity',
          status: 'FAIL',
          message: 'Code complexity issues detected',
          details: complexityIssues.slice(0, 3).map((v: any) => `${path.basename(v.file)}: ${v.message}`),
          suggestions: ['Break down complex functions', 'Reduce nested conditions']
        };
      } else {
        return {
          category: 'Code Complexity',
          status: 'PASS',
          message: 'Code complexity check passed',
          suggestions: []
        };
      }
    } catch (error) {
      return {
        category: 'Code Complexity',
        status: 'FAIL',
        message: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review implementation']
      };
    }
  }

  /**
   * 检查测试覆盖率
   */
  private static async checkTestCoverage(task: Task, targetFiles?: string[]): Promise<SimpleQualityResult> {
    try {
      if (!task.relatedFiles) {
        return {
          category: 'Test Coverage',
          status: 'PASS',
          message: 'No related files to check',
          suggestions: []
        };
      }

      const codeFiles = task.relatedFiles.filter(f => f.type === 'TO_MODIFY' || f.type === 'CREATE');
      const testFiles = task.relatedFiles.filter(f => f.path.includes('test') || f.path.includes('spec'));

      if (codeFiles.length > 0 && testFiles.length === 0) {
        return {
          category: 'Test Coverage',
          status: 'WARNING',
          message: 'No test files found for implementation',
          suggestions: ['Add unit tests for new functionality']
        };
      }

      return {
        category: 'Test Coverage',
        status: 'PASS',
        message: 'Test coverage check passed',
        suggestions: []
      };
    } catch (error) {
      return {
        category: 'Test Coverage',
        status: 'FAIL',
        message: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review implementation']
      };
    }
  }

  /**
   * 检查安全性
   */
  private static async checkSecurity(task: Task, targetFiles?: string[]): Promise<SimpleQualityResult> {
    try {
      const filesToCheck = await this.getFilesToCheck(task, targetFiles);
      
      if (filesToCheck.length === 0) {
        return {
          category: 'Security',
          status: 'PASS',
          message: 'No files to check',
          suggestions: []
        };
      }

      const fileContents = await AsyncFileOperations.readMultipleFiles(filesToCheck);
      const securityIssues: string[] = [];

      for (const [filePath, content] of fileContents.entries()) {
        if (content.includes('eval(') || content.includes('Function(')) {
          securityIssues.push(`Dangerous eval() usage found in ${path.basename(filePath)}`);
        }
      }

      if (securityIssues.length > 0) {
        return {
          category: 'Security',
          status: 'FAIL',
          message: `Found ${securityIssues.length} security issues`,
          details: securityIssues,
          suggestions: ['Avoid using eval() or Function() constructor']
        };
      }

      return {
        category: 'Security',
        status: 'PASS',
        message: 'Security check passed',
        suggestions: []
      };
    } catch (error) {
      return {
        category: 'Security',
        status: 'FAIL',
        message: `Check failed: ${error instanceof Error ? error.message : String(error)}`,
        suggestions: ['Review implementation']
      };
    }
  }

  /**
   * 获取要检查的文件列表
   */
  private static async getFilesToCheck(task: Task, targetFiles?: string[]): Promise<string[]> {
    const projectRoot = findProjectRoot({ debug: true });
    const filesToCheck: string[] = [];
    
    if (targetFiles && targetFiles.length > 0) {
      for (const filePath of targetFiles) {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(projectRoot, filePath);
        if (fs.existsSync(fullPath)) {
          filesToCheck.push(fullPath);
        }
      }
    } else if (task.relatedFiles) {
      for (const file of task.relatedFiles) {
        const fullPath = path.isAbsolute(file.path) ? file.path : path.resolve(projectRoot, file.path);
        if (fs.existsSync(fullPath)) {
          filesToCheck.push(fullPath);
        }
      }
    }
    
    return filesToCheck;
  }

  /**
   * 获取代码文件列表
   */
  private static async getCodeFiles(task: Task, targetFiles?: string[]): Promise<string[]> {
    const allFiles = await this.getFilesToCheck(task, targetFiles);
    return allFiles.filter(filePath => /\.(ts|tsx|js|jsx)$/.test(filePath));
  }
}

/**
 * 简化的文件清理器
 */
export class SimpleFileCleanup {
  /**
   * 执行基本的文件清理
   */
  static async executeBasicCleanup(projectPath: string): Promise<SimpleCleanupResult> {
    const result: SimpleCleanupResult = {
      filesAnalyzed: 0,
      filesRemoved: 0,
      directoriesOptimized: 0,
      warnings: [],
      removedFiles: []
    };

    try {
      // 扫描项目文件
      const fileInfos = await AsyncFileOperations.scanDirectory(projectPath, {
        recursive: true,
        includeFiles: true,
        includeDirectories: false
      });

      result.filesAnalyzed = fileInfos.length;

      // 清理临时文件
      const tempPatterns = [/\.tmp$/, /\.temp$/, /~$/, /\.bak$/, /\.swp$/];
      
      for (const fileInfo of fileInfos) {
        const fileName = path.basename(fileInfo.path);
        const shouldRemove = tempPatterns.some(pattern => pattern.test(fileName));
        
        if (shouldRemove) {
          try {
            await fs.promises.unlink(fileInfo.path);
            result.filesRemoved++;
            result.removedFiles.push(fileInfo.path);
          } catch (error) {
            result.warnings.push(`Failed to remove ${fileInfo.path}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

    } catch (error) {
      result.warnings.push(`Cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }
}