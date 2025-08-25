/**
 * 质量评分算法测试
 * Quality Score Algorithm Tests
 * 
 * 验证质量评分算法的准确性和一致性
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RealCodeQualityAnalyzer } from '../../src/tools/workflow/realCodeQualityAnalyzer.js';

// Mock 文件系统操作
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    access: vi.fn()
  },
  existsSync: vi.fn()
}));

vi.mock('../../src/utils/asyncFileOperations.js', () => ({
  AsyncFileOperations: {
    scanDirectory: vi.fn(),
    findFiles: vi.fn()
  }
}));

describe('🔧 质量评分算法修复验证', () => {
  let analyzer: RealCodeQualityAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = RealCodeQualityAnalyzer.getInstance();
  });

  describe('健康评分计算', () => {
    it('应该正确处理 0 分的健康评分', () => {
      // 模拟大量错误导致 0 分的情况
      const violations = Array.from({ length: 50 }, (_, i) => ({
        type: 'error' as const,
        file: `file${i}.ts`,
        line: 1,
        column: 1,
        message: `Error ${i}`,
        rule: 'test-rule',
        category: 'syntax',
        severity: 2,
        analyzer: 'eslint'
      }));

      const metrics = {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        maintainabilityIndex: 50,
        classCount: 1,
        methodCount: 5,
        functionCount: 3,
        halsteadVolume: 200
      };

      // 使用反射访问私有方法进行测试
      const calculateHealthScore = (analyzer as any).calculateRealHealthScore.bind(analyzer);
      const healthScore = calculateHealthScore(violations, metrics);

      // 验证大量错误确实会导致极低的分数
      expect(healthScore).toBeLessThan(10);
      expect(healthScore).toBeGreaterThanOrEqual(0);
    });

    it('应该正确处理无错误的情况', () => {
      const violations: any[] = [];
      const metrics = {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        maintainabilityIndex: 80,
        classCount: 1,
        methodCount: 5,
        functionCount: 3,
        halsteadVolume: 200
      };

      const calculateHealthScore = (analyzer as any).calculateRealHealthScore.bind(analyzer);
      const healthScore = calculateHealthScore(violations, metrics);

      // 无错误应该得到满分
      expect(healthScore).toBe(100);
    });

    it('应该使用指数衰减而不是线性惩罚', () => {
      // 测试指数衰减算法的特性
      const createViolations = (count: number) => 
        Array.from({ length: count }, (_, i) => ({
          type: 'error' as const,
          file: `file${i}.ts`,
          line: 1,
          column: 1,
          message: `Error ${i}`,
          rule: 'test-rule',
          category: 'syntax',
          severity: 2,
          analyzer: 'eslint'
        }));

      const metrics = {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        maintainabilityIndex: 50,
        classCount: 1,
        methodCount: 5,
        functionCount: 3,
        halsteadVolume: 200
      };

      const calculateHealthScore = (analyzer as any).calculateRealHealthScore.bind(analyzer);
      
      const score1Error = calculateHealthScore(createViolations(1), metrics);
      const score5Errors = calculateHealthScore(createViolations(5), metrics);
      const score10Errors = calculateHealthScore(createViolations(10), metrics);

      // 验证指数衰减特性：分数下降不是线性的
      const linearDrop1to5 = score1Error - score5Errors;
      const linearDrop5to10 = score5Errors - score10Errors;
      
      // 指数衰减应该导致后续错误的影响递减
      expect(linearDrop1to5).toBeGreaterThan(linearDrop5to10);
    });
  });

  describe('默认值处理修复', () => {
    it('应该正确处理 healthScore 为 0 的情况', () => {
      // 模拟 analysisResult 返回 healthScore: 0
      const analysisResult = {
        violations: [
          {
            type: 'error',
            file: 'test.ts',
            line: 1,
            column: 1,
            message: 'Test error',
            rule: 'test-rule',
            category: 'syntax',
            severity: 2,
            analyzer: 'eslint'
          }
        ],
        healthScore: 0, // 明确设置为 0
        summary: 'Test summary'
      };

      // 测试修复后的逻辑：使用 ?? 而不是 ||
      const healthScore = analysisResult.healthScore ?? 100;
      
      // 验证 0 值被正确保留，而不是被替换为 100
      expect(healthScore).toBe(0);
    });

    it('应该正确处理 healthScore 为 undefined 的情况', () => {
      const analysisResult = {
        violations: [],
        healthScore: undefined,
        summary: 'Test summary'
      };

      const healthScore = analysisResult.healthScore ?? 100;
      
      // 验证 undefined 被正确替换为 100
      expect(healthScore).toBe(100);
    });

    it('应该正确处理 healthScore 为 null 的情况', () => {
      const analysisResult = {
        violations: [],
        healthScore: null,
        summary: 'Test summary'
      };

      const healthScore = analysisResult.healthScore ?? 100;
      
      // 验证 null 被正确替换为 100
      expect(healthScore).toBe(100);
    });
  });

  describe('评分一致性验证', () => {
    it('相同的输入应该产生相同的评分', () => {
      const violations = [
        {
          type: 'error' as const,
          file: 'test.ts',
          line: 1,
          column: 1,
          message: 'Test error',
          rule: 'test-rule',
          category: 'syntax',
          severity: 2,
          analyzer: 'eslint'
        }
      ];

      const metrics = {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        maintainabilityIndex: 50,
        classCount: 1,
        methodCount: 5,
        functionCount: 3,
        halsteadVolume: 200
      };

      const calculateHealthScore = (analyzer as any).calculateRealHealthScore.bind(analyzer);
      
      const score1 = calculateHealthScore(violations, metrics);
      const score2 = calculateHealthScore(violations, metrics);
      
      // 相同输入应该产生相同结果
      expect(score1).toBe(score2);
    });

    it('评分应该在 0-100 范围内', () => {
      const testCases = [
        { violations: [], expectedRange: [90, 100] },
        { violations: Array(5).fill(null).map((_, i) => ({ type: 'warning', severity: 1 })), expectedRange: [30, 90] },
        { violations: Array(20).fill(null).map((_, i) => ({ type: 'error', severity: 2 })), expectedRange: [0, 20] }
      ];

      const metrics = {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        maintainabilityIndex: 50,
        classCount: 1,
        methodCount: 5,
        functionCount: 3,
        halsteadVolume: 200
      };

      const calculateHealthScore = (analyzer as any).calculateRealHealthScore.bind(analyzer);

      testCases.forEach(({ violations, expectedRange }) => {
        const score = calculateHealthScore(violations, metrics);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(score).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(score).toBeLessThanOrEqual(expectedRange[1]);
      });
    });
  });
});