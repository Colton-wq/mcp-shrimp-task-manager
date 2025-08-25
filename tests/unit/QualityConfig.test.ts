/**
 * QualityConfig 单元测试
 * QualityConfig Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QualityConfigManager, getQualityConfig, getQualityThresholds } from '../../src/tools/workflow/config/QualityConfig.js';

describe('QualityConfig', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = { ...process.env };
    
    // 重置配置管理器
    const manager = QualityConfigManager.getInstance();
    manager.resetToDefaults();
  });

  afterEach(() => {
    // 恢复原始环境变量
    process.env = originalEnv;
  });

  describe('QualityConfigManager', () => {
    it('should implement singleton pattern', () => {
      const manager1 = QualityConfigManager.getInstance();
      const manager2 = QualityConfigManager.getInstance();
      
      expect(manager1).toBe(manager2);
    });

    it('should load default configuration', async () => {
      const manager = QualityConfigManager.getInstance();
      await manager.loadConfig();
      
      const config = manager.getConfig();
      
      expect(config.version).toBe('1.0.0');
      expect(config.thresholds.overallScore).toBe(80);
      expect(config.thresholds.maintainabilityIndex).toBe(50);
      expect(config.thresholds.cyclomaticComplexity).toBe(10);
      expect(config.thresholds.testCoverage).toBe(80);
    });

    it('should load configuration from environment variables', async () => {
      // 设置环境变量
      process.env.QUALITY_SCORE_THRESHOLD = '85';
      process.env.MAINTAINABILITY_THRESHOLD = '60';
      process.env.COMPLEXITY_THRESHOLD = '15';
      process.env.TEST_COVERAGE_THRESHOLD = '90';
      process.env.MAX_CONCURRENCY = '20';
      process.env.DEBUG_MODE = 'true';

      const manager = QualityConfigManager.getInstance();
      await manager.loadConfig();
      
      const thresholds = manager.getThresholds();
      const performance = manager.getPerformanceConfig();
      
      expect(thresholds.overallScore).toBe(85);
      expect(thresholds.maintainabilityIndex).toBe(60);
      expect(thresholds.cyclomaticComplexity).toBe(15);
      expect(thresholds.testCoverage).toBe(90);
      expect(performance.maxConcurrency).toBe(20);
      expect(manager.isDebugEnabled()).toBe(true);
    });

    it('should validate configuration values', async () => {
      const manager = QualityConfigManager.getInstance();
      
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

    it('should provide configuration summary', async () => {
      const manager = QualityConfigManager.getInstance();
      await manager.loadConfig();
      
      const summary = manager.getConfigSummary();
      
      expect(summary).toContain('Quality Config v1.0.0');
      expect(summary).toContain('Score≥80');
      expect(summary).toContain('Maintainability≥50');
      expect(summary).toContain('Complexity≤10');
      expect(summary).toContain('Coverage≥80%');
    });

    it('should handle configuration loading errors gracefully', async () => {
      // 设置无效的环境变量
      process.env.QUALITY_SCORE_THRESHOLD = 'invalid';
      
      const manager = QualityConfigManager.getInstance();
      
      // 应该不抛出错误，而是使用默认配置
      await expect(manager.loadConfig()).resolves.not.toThrow();
      
      const config = manager.getConfig();
      expect(config.thresholds.overallScore).toBe(80); // 默认值
    });

    it('should provide separate config getters', async () => {
      const manager = QualityConfigManager.getInstance();
      await manager.loadConfig();
      
      const thresholds = manager.getThresholds();
      const fileScan = manager.getFileScanConfig();
      const performance = manager.getPerformanceConfig();
      const cleanup = manager.getCleanupConfig();
      
      expect(thresholds).toHaveProperty('overallScore');
      expect(fileScan).toHaveProperty('maxFiles');
      expect(performance).toHaveProperty('maxConcurrency');
      expect(cleanup).toHaveProperty('tempFilePatterns');
    });

    it('should return deep copies of configuration objects', async () => {
      const manager = QualityConfigManager.getInstance();
      await manager.loadConfig();
      
      const thresholds1 = manager.getThresholds();
      const thresholds2 = manager.getThresholds();
      
      // 应该是不同的对象实例
      expect(thresholds1).not.toBe(thresholds2);
      // 但内容应该相同
      expect(thresholds1).toEqual(thresholds2);
      
      // 修改一个不应该影响另一个
      thresholds1.overallScore = 999;
      expect(thresholds2.overallScore).toBe(80);
    });

    it('should reset to defaults correctly', async () => {
      const manager = QualityConfigManager.getInstance();
      
      // 先加载配置
      await manager.loadConfig();
      
      // 修改配置
      manager.updateConfig({
        thresholds: {
          overallScore: 90,
          maintainabilityIndex: 60,
          cyclomaticComplexity: 15,
          cognitiveComplexity: 20,
          testCoverage: 85
        }
      });
      
      let thresholds = manager.getThresholds();
      expect(thresholds.overallScore).toBe(90);
      
      // 重置为默认值
      manager.resetToDefaults();
      await manager.loadConfig();
      
      thresholds = manager.getThresholds();
      expect(thresholds.overallScore).toBe(80);
    });
  });

  describe('Convenience Functions', () => {
    it('should provide getQualityConfig function', async () => {
      const config = await getQualityConfig();
      
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('thresholds');
      expect(config).toHaveProperty('fileScan');
      expect(config).toHaveProperty('performance');
      expect(config).toHaveProperty('cleanup');
    });

    it('should provide getQualityThresholds function', async () => {
      const thresholds = await getQualityThresholds();
      
      expect(thresholds).toHaveProperty('overallScore');
      expect(thresholds).toHaveProperty('maintainabilityIndex');
      expect(thresholds).toHaveProperty('cyclomaticComplexity');
      expect(thresholds).toHaveProperty('testCoverage');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate threshold ranges', () => {
      const manager = QualityConfigManager.getInstance();
      
      // 测试各种无效值
      const invalidConfigs = [
        { thresholds: { overallScore: -1 } },
        { thresholds: { overallScore: 101 } },
        { thresholds: { maintainabilityIndex: -1 } },
        { thresholds: { maintainabilityIndex: 101 } },
        { thresholds: { cyclomaticComplexity: 0 } },
        { thresholds: { testCoverage: -1 } },
        { thresholds: { testCoverage: 101 } }
      ];
      
      invalidConfigs.forEach(config => {
        expect(() => {
          manager.updateConfig(config as any);
        }).toThrow();
      });
    });

    it('should validate performance configuration', () => {
      const manager = QualityConfigManager.getInstance();
      
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
      
      expect(() => {
        manager.updateConfig({
          fileScan: {
            maxFiles: 1000,
            batchSize: 0,
            timeoutMs: 30000,
            includedExtensions: ['.ts'],
            excludePatterns: []
          }
        });
      }).toThrow('Batch size must be at least 1');
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should handle invalid environment variable values', async () => {
      // 设置无效的环境变量
      process.env.QUALITY_SCORE_THRESHOLD = 'not-a-number';
      process.env.MAX_CONCURRENCY = 'invalid';
      
      const manager = QualityConfigManager.getInstance();
      await manager.loadConfig();
      
      // 应该使用默认值
      const thresholds = manager.getThresholds();
      const performance = manager.getPerformanceConfig();
      
      expect(thresholds.overallScore).toBe(80); // 默认值
      expect(performance.maxConcurrency).toBe(10); // 默认值
    });

    it('should handle boolean environment variables correctly', async () => {
      // 测试各种布尔值表示
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
        
        const manager = QualityConfigManager.getInstance();
        manager.resetToDefaults();
        await manager.loadConfig();
        
        expect(manager.isDebugEnabled()).toBe(testCase.expected);
      }
    });
  });
});