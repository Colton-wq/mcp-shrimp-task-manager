/**
 * QualityConfig 修复版单元测试
 * QualityConfig Fixed Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('QualityConfig Fixed Tests', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // 恢复原始环境变量
    process.env = originalEnv;
  });

  describe('Basic Configuration', () => {
    it('should create default configuration', async () => {
      // 动态导入以避免模块缓存问题
      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      const config = manager.getConfig();
      
      expect(config.version).toBe('1.0.0');
      expect(config.thresholds.overallScore).toBe(80);
      expect(config.thresholds.maintainabilityIndex).toBe(50);
      expect(config.thresholds.cyclomaticComplexity).toBe(10);
      expect(config.thresholds.testCoverage).toBe(80);
    });

    it('should handle environment variables correctly', async () => {
      // 设置有效的环境变量
      process.env.QUALITY_SCORE_THRESHOLD = '85';
      process.env.MAINTAINABILITY_THRESHOLD = '60';
      process.env.DEBUG_MODE = 'true';

      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      const thresholds = manager.getThresholds();
      
      expect(thresholds.overallScore).toBe(85);
      expect(thresholds.maintainabilityIndex).toBe(60);
      expect(manager.isDebugEnabled()).toBe(true);
    });

    it('should handle invalid environment variables gracefully', async () => {
      // 设置无效的环境变量
      process.env.QUALITY_SCORE_THRESHOLD = 'invalid-number';
      process.env.MAX_CONCURRENCY = 'not-a-number';
      
      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      // 应该使用默认值
      const thresholds = manager.getThresholds();
      const performance = manager.getPerformanceConfig();
      
      expect(thresholds.overallScore).toBe(80); // 默认值
      expect(performance.maxConcurrency).toBe(10); // 默认值
    });

    it('should provide configuration summary', async () => {
      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      const summary = manager.getConfigSummary();
      
      expect(summary).toContain('Quality Config v1.0.0');
      expect(summary).toContain('Score≥80');
      expect(summary).toContain('Maintainability≥50');
      expect(summary).toContain('Complexity≤10');
      expect(summary).toContain('Coverage≥80%');
    });

    it('should validate configuration values', async () => {
      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      // 测试无效的配置值
      expect(() => {
        manager.updateConfig({
          thresholds: {
            overallScore: 150, // 无效值
            maintainabilityIndex: 50,
            cyclomaticComplexity: 10,
            cognitiveComplexity: 15,
            testCoverage: 80
          }
        });
      }).toThrow('Overall score threshold must be between 0 and 100');
    });

    it('should provide convenience functions', async () => {
      const { getQualityConfig, getQualityThresholds } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const config = await getQualityConfig();
      const thresholds = await getQualityThresholds();
      
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('thresholds');
      expect(thresholds).toHaveProperty('overallScore');
      expect(thresholds).toHaveProperty('maintainabilityIndex');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate threshold ranges', async () => {
      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      // 测试各种无效值
      const invalidConfigs = [
        { thresholds: { overallScore: -1, maintainabilityIndex: 50, cyclomaticComplexity: 10, cognitiveComplexity: 15, testCoverage: 80 } },
        { thresholds: { overallScore: 101, maintainabilityIndex: 50, cyclomaticComplexity: 10, cognitiveComplexity: 15, testCoverage: 80 } },
        { thresholds: { overallScore: 80, maintainabilityIndex: -1, cyclomaticComplexity: 10, cognitiveComplexity: 15, testCoverage: 80 } },
        { thresholds: { overallScore: 80, maintainabilityIndex: 101, cyclomaticComplexity: 10, cognitiveComplexity: 15, testCoverage: 80 } }
      ];
      
      invalidConfigs.forEach(config => {
        expect(() => {
          manager.updateConfig(config as any);
        }).toThrow();
      });
    });

    it('should validate performance configuration', async () => {
      const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
      
      const manager = QualityConfigManager.getInstance();
      manager.resetToDefaults();
      await manager.loadConfig();
      
      // 测试无效的性能配置
      expect(() => {
        manager.updateConfig({
          performance: {
            maxConcurrency: 0,
            memoryLimitMB: 512,
            operationTimeoutMs: 8000,
            cacheTTL: 300000
          }
        });
      }).toThrow('Max concurrency must be at least 1');
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should handle boolean environment variables correctly', async () => {
      const testCases = [
        { value: 'true', expected: true },
        { value: 'TRUE', expected: true },
        { value: 'false', expected: false },
        { value: 'FALSE', expected: false },
        { value: '1', expected: false }, // 只有 'true' 被认为是 true
        { value: '', expected: false }
      ];
      
      for (const testCase of testCases) {
        process.env.DEBUG_MODE = testCase.value;
        
        const { QualityConfigManager } = await import('../../src/tools/workflow/config/QualityConfig.js');
        
        const manager = QualityConfigManager.getInstance();
        manager.resetToDefaults();
        await manager.loadConfig();
        
        expect(manager.isDebugEnabled()).toBe(testCase.expected);
      }
    });
  });
});