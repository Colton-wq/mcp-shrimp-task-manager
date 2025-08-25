/**
 * CodeQualityChecker 单元测试
 * CodeQualityChecker Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeQualityChecker, ReviewScope } from '../../src/tools/workflow/modules/CodeQualityChecker.js';
import { Task } from '../../src/types/index.js';

// Mock 依赖
vi.mock('../../src/tools/workflow/realCodeQualityAnalyzer.js', () => ({
  RealCodeQualityAnalyzer: {
    getInstance: vi.fn(() => ({
      analyzeFiles: vi.fn()
    }))
  }
}));

vi.mock('../../src/utils/asyncFileOperations.js', () => ({
  AsyncFileOperations: {
    checkFilesExist: vi.fn(),
    readMultipleFiles: vi.fn()
  }
}));

vi.mock('../../src/utils/projectRootDetector.js', () => ({
  findProjectRoot: vi.fn(() => '/test/project')
}));

vi.mock('../../src/tools/workflow/config/index.js', () => ({
  getQualityThresholds: vi.fn(() => Promise.resolve({
    overallScore: 80,
    maintainabilityIndex: 50,
    cyclomaticComplexity: 10,
    cognitiveComplexity: 15,
    testCoverage: 80
  })),
  getFileScanConfig: vi.fn(() => Promise.resolve({
    maxFiles: 1000,
    batchSize: 50,
    timeoutMs: 30000,
    includedExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludePatterns: ['node_modules', '.git']
  })),
  getPerformanceConfig: vi.fn(() => Promise.resolve({
    maxConcurrency: 10,
    memoryLimitMB: 512,
    operationTimeoutMs: 8000,
    cacheTTL: 300000
  }))
}));

vi.mock('fs', () => ({
  existsSync: vi.fn()
}));

describe('CodeQualityChecker', () => {
  let mockTask: Task;
  let mockAnalyzer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 创建模拟任务
    mockTask = {
      id: 'test-task-id',
      name: 'Test Task',
      description: 'Test task description',
      status: 'pending' as any,
      relatedFiles: [
        { path: '/test/project/src/main.ts', type: 'TO_MODIFY', description: 'Main file' },
        { path: '/test/project/src/utils.ts', type: 'REFERENCE', description: 'Utils file' }
      ]
    } as Task;

    // 设置模拟分析器
    const { RealCodeQualityAnalyzer } = require('../../src/tools/workflow/realCodeQualityAnalyzer.js');
    mockAnalyzer = {
      analyzeFiles: vi.fn()
    };
    RealCodeQualityAnalyzer.getInstance.mockReturnValue(mockAnalyzer);

    // Mock fs.existsSync
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeQualityChecks', () => {
    it('should execute comprehensive quality checks', async () => {
      // Mock 分析结果
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [],
        healthScore: 85,
        summary: 'No issues found'
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.COMPREHENSIVE
      );

      expect(results).toHaveLength(7); // 所有检查类型
      expect(results.every(r => r.status === 'PASS')).toBe(true);
    });

    it('should execute quality-only checks', async () => {
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [],
        healthScore: 85,
        summary: 'No issues found'
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.QUALITY_ONLY
      );

      expect(results).toHaveLength(3); // 只有质量检查
      const categories = results.map(r => r.category);
      expect(categories).toContain('Code Standards');
      expect(categories).toContain('Code Complexity');
      expect(categories).toContain('Test Coverage');
    });

    it('should execute security-only checks', async () => {
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [],
        healthScore: 85,
        summary: 'No issues found'
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.SECURITY_ONLY
      );

      expect(results).toHaveLength(2); // 只有安全检查
      const categories = results.map(r => r.category);
      expect(categories).toContain('Security');
      expect(categories).toContain('Input Validation');
    });

    it('should handle check failures gracefully', async () => {
      // Mock 一个检查失败
      mockAnalyzer.analyzeFiles.mockRejectedValue(new Error('Analysis failed'));

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.COMPREHENSIVE
      );

      // 应该有失败的检查
      const failedChecks = results.filter(r => r.status === 'FAIL');
      expect(failedChecks.length).toBeGreaterThan(0);
    });
  });

  describe('checkCodeStandards', () => {
    it('should pass when no violations found', async () => {
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [],
        healthScore: 90,
        summary: 'No violations'
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.QUALITY_ONLY
      );

      const codeStandardsResult = results.find(r => r.category === 'Code Standards');
      expect(codeStandardsResult?.status).toBe('PASS');
      expect(codeStandardsResult?.message).toContain('passed');
    });

    it('should fail when violations found', async () => {
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [
          { type: 'error', message: 'Syntax error', file: 'main.ts', line: 10 }
        ],
        healthScore: 60,
        summary: 'Found violations'
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.QUALITY_ONLY
      );

      const codeStandardsResult = results.find(r => r.category === 'Code Standards');
      expect(codeStandardsResult?.status).toBe('FAIL');
      expect(codeStandardsResult?.message).toContain('Found 1');
    });

    it('should handle no files to check', async () => {
      const emptyTask = { ...mockTask, relatedFiles: [] };

      const results = await CodeQualityChecker.executeQualityChecks(
        emptyTask,
        ReviewScope.QUALITY_ONLY
      );

      const codeStandardsResult = results.find(r => r.category === 'Code Standards');
      expect(codeStandardsResult?.status).toBe('FAIL');
      expect(codeStandardsResult?.message).toContain('No files to check');
    });
  });

  describe('analyzeComplexity', () => {
    it('should pass when no complexity issues', async () => {
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [],
        healthScore: 85
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.QUALITY_ONLY
      );

      const complexityResult = results.find(r => r.category === 'Code Complexity');
      expect(complexityResult?.status).toBe('PASS');
    });

    it('should fail when complexity issues found', async () => {
      mockAnalyzer.analyzeFiles.mockResolvedValue({
        violations: [
          { 
            category: 'complexity', 
            message: 'Function too complex', 
            file: 'main.ts', 
            line: 20,
            column: 5
          }
        ],
        healthScore: 70
      });

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.QUALITY_ONLY
      );

      const complexityResult = results.find(r => r.category === 'Code Complexity');
      expect(complexityResult?.status).toBe('FAIL');
      expect(complexityResult?.message).toContain('complexity issues detected');
    });

    it('should handle non-code files gracefully', async () => {
      const taskWithNonCodeFiles = {
        ...mockTask,
        relatedFiles: [
          { path: '/test/project/README.md', type: 'REFERENCE', description: 'Documentation' },
          { path: '/test/project/package.json', type: 'REFERENCE', description: 'Config' }
        ]
      };

      const results = await CodeQualityChecker.executeQualityChecks(
        taskWithNonCodeFiles,
        ReviewScope.QUALITY_ONLY
      );

      const complexityResult = results.find(r => r.category === 'Code Complexity');
      expect(complexityResult?.status).toBe('PASS');
      expect(complexityResult?.message).toContain('No TypeScript/JavaScript files');
    });
  });

  describe('checkTestCoverage', () => {
    it('should pass when test files exist for code files', async () => {
      const taskWithTests = {
        ...mockTask,
        relatedFiles: [
          { path: '/test/project/src/main.ts', type: 'TO_MODIFY', description: 'Main file' },
          { path: '/test/project/tests/main.test.ts', type: 'REFERENCE', description: 'Test file' }
        ]
      };

      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/tests/main.test.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/tests/main.test.ts', 'expect(result).toBe(true);']
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        taskWithTests,
        ReviewScope.QUALITY_ONLY
      );

      const testCoverageResult = results.find(r => r.category === 'Test Coverage');
      expect(testCoverageResult?.status).toBe('PASS');
    });

    it('should warn when no test files found', async () => {
      const taskWithoutTests = {
        ...mockTask,
        relatedFiles: [
          { path: '/test/project/src/main.ts', type: 'TO_MODIFY', description: 'Main file' }
        ]
      };

      const results = await CodeQualityChecker.executeQualityChecks(
        taskWithoutTests,
        ReviewScope.QUALITY_ONLY
      );

      const testCoverageResult = results.find(r => r.category === 'Test Coverage');
      expect(testCoverageResult?.status).toBe('WARNING');
      expect(testCoverageResult?.message).toContain('No test files found');
    });

    it('should warn when test files have no assertions', async () => {
      const taskWithEmptyTests = {
        ...mockTask,
        relatedFiles: [
          { path: '/test/project/src/main.ts', type: 'TO_MODIFY', description: 'Main file' },
          { path: '/test/project/tests/main.test.ts', type: 'REFERENCE', description: 'Test file' }
        ]
      };

      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/tests/main.test.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/tests/main.test.ts', 'console.log("test");'] // 没有断言
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        taskWithEmptyTests,
        ReviewScope.QUALITY_ONLY
      );

      const testCoverageResult = results.find(r => r.category === 'Test Coverage');
      expect(testCoverageResult?.status).toBe('WARNING');
      expect(testCoverageResult?.details?.[0]).toContain('no assertions');
    });
  });

  describe('checkSecurityVulnerabilities', () => {
    it('should pass when no security issues found', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', 'const result = calculate(input);']
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.SECURITY_ONLY
      );

      const securityResult = results.find(r => r.category === 'Security');
      expect(securityResult?.status).toBe('PASS');
    });

    it('should fail when dangerous eval usage found', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', 'const result = eval(userInput);'] // 危险的 eval 使用
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.SECURITY_ONLY
      );

      const securityResult = results.find(r => r.category === 'Security');
      expect(securityResult?.status).toBe('FAIL');
      expect(securityResult?.details?.[0]).toContain('eval()');
    });
  });

  describe('checkInputValidation', () => {
    it('should pass when no input validation issues', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', 'const result = process(data);']
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.SECURITY_ONLY
      );

      const inputValidationResult = results.find(r => r.category === 'Input Validation');
      expect(inputValidationResult?.status).toBe('PASS');
    });

    it('should warn when input validation is missing', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', 'app.post("/api", (req, res) => { process(req.body); });'] // 缺少验证
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.SECURITY_ONLY
      );

      const inputValidationResult = results.find(r => r.category === 'Input Validation');
      expect(inputValidationResult?.status).toBe('WARNING');
      expect(inputValidationResult?.details?.[0]).toContain('Missing input validation');
    });
  });

  describe('checkErrorHandling', () => {
    it('should pass when proper error handling exists', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', 'try { await process(); } catch (error) { handle(error); }']
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.DIAGNOSTIC
      );

      const errorHandlingResult = results.find(r => r.category === 'Error Handling');
      expect(errorHandlingResult?.status).toBe('PASS');
    });

    it('should warn when error handling is missing for async operations', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      (AsyncFileOperations.checkFilesExist as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', true]
        ])
      );
      (AsyncFileOperations.readMultipleFiles as any).mockResolvedValue(
        new Map([
          ['/test/project/src/main.ts', 'await process();'] // 缺少错误处理
        ])
      );

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.DIAGNOSTIC
      );

      const errorHandlingResult = results.find(r => r.category === 'Error Handling');
      expect(errorHandlingResult?.status).toBe('WARNING');
      expect(errorHandlingResult?.details?.[0]).toContain('Missing error handling');
    });
  });

  describe('Edge Cases', () => {
    it('should handle task without related files', async () => {
      const emptyTask = { ...mockTask, relatedFiles: undefined };

      const results = await CodeQualityChecker.executeQualityChecks(
        emptyTask,
        ReviewScope.COMPREHENSIVE
      );

      // 应该有一些失败的检查，因为没有文件可检查
      const failedChecks = results.filter(r => r.status === 'FAIL');
      expect(failedChecks.length).toBeGreaterThan(0);
    });

    it('should handle non-existent files gracefully', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false); // 文件不存在

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.COMPREHENSIVE
      );

      // 应该处理文件不存在的情况
      const failedChecks = results.filter(r => r.status === 'FAIL');
      expect(failedChecks.length).toBeGreaterThan(0);
    });

    it('should handle analyzer errors gracefully', async () => {
      mockAnalyzer.analyzeFiles.mockRejectedValue(new Error('Analyzer crashed'));

      const results = await CodeQualityChecker.executeQualityChecks(
        mockTask,
        ReviewScope.COMPREHENSIVE
      );

      // 应该有失败的检查，但不应该抛出异常
      const failedChecks = results.filter(r => r.status === 'FAIL');
      expect(failedChecks.length).toBeGreaterThan(0);
    });
  });
});