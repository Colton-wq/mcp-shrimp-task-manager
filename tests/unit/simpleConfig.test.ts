/**
 * 简化配置系统测试
 * Simplified Configuration System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleConfigManager, ProjectType, SimpleConfig } from '../../src/tools/workflow/config/simpleConfig.js';

describe('🎯 简化配置系统测试', () => {
  let configManager: SimpleConfigManager;

  beforeEach(() => {
    configManager = SimpleConfigManager.getInstance();
  });

  describe('配置生成', () => {
    it('应该为小型项目生成正确的配置', () => {
      const simpleConfig: SimpleConfig = {
        projectType: ProjectType.SMALL,
        qualityLevel: 3,
        safeMode: true,
        debug: false
      };

      const fullConfig = configManager.generateFullConfig(simpleConfig);

      expect(fullConfig.thresholds.overallScore).toBe(70);
      expect(fullConfig.fileScan.maxFiles).toBe(500);
      expect(fullConfig.performance.maxConcurrency).toBe(5);
      expect(fullConfig.cleanup.safeDeleteMode).toBe(true);
    });

    it('应该为大型项目生成正确的配置', () => {
      const simpleConfig: SimpleConfig = {
        projectType: ProjectType.LARGE,
        qualityLevel: 4,
        safeMode: true,
        debug: false
      };

      const fullConfig = configManager.generateFullConfig(simpleConfig);

      expect(fullConfig.thresholds.overallScore).toBe(82); // 80 + (1 * 0.1 * 20)
      expect(fullConfig.fileScan.maxFiles).toBe(2000);
      expect(fullConfig.performance.maxConcurrency).toBe(12);
    });

    it('应该根据质量级别调整阈值', () => {
      const baseConfig: SimpleConfig = {
        projectType: ProjectType.MEDIUM,
        qualityLevel: 3,
        safeMode: true,
        debug: false
      };

      const strictConfig: SimpleConfig = {
        ...baseConfig,
        qualityLevel: 5
      };

      const baseResult = configManager.generateFullConfig(baseConfig);
      const strictResult = configManager.generateFullConfig(strictConfig);

      expect(strictResult.thresholds.overallScore).toBeGreaterThan(baseResult.thresholds.overallScore);
      expect(strictResult.thresholds.testCoverage).toBeGreaterThan(baseResult.thresholds.testCoverage);
    });
  });

  describe('安全模式', () => {
    it('应该在安全模式下提供更保守的清理设置', () => {
      const safeConfig: SimpleConfig = {
        projectType: ProjectType.MEDIUM,
        qualityLevel: 3,
        safeMode: true,
        debug: false
      };

      const unsafeConfig: SimpleConfig = {
        ...safeConfig,
        safeMode: false
      };

      const safeResult = configManager.generateFullConfig(safeConfig);
      const unsafeResult = configManager.generateFullConfig(unsafeConfig);

      expect(safeResult.cleanup.safeDeleteMode).toBe(true);
      expect(safeResult.cleanup.systemDirectories.length).toBeGreaterThan(
        unsafeResult.cleanup.systemDirectories.length
      );
    });
  });

  describe('配置向导', () => {
    it('应该生成正确的向导问题', () => {
      const questions = configManager.generateConfigWizardQuestions();

      expect(questions).toHaveLength(4);
      expect(questions[0].key).toBe('projectType');
      expect(questions[1].key).toBe('qualityLevel');
      expect(questions[2].key).toBe('safeMode');
      expect(questions[3].key).toBe('debug');

      // 验证每个问题都有选项和默认值
      questions.forEach(question => {
        expect(question.question).toBeTruthy();
        expect(question.default).toBeDefined();
        if (question.options) {
          expect(question.options.length).toBeGreaterThan(0);
        }
      });
    });

    it('应该生成配置摘要', () => {
      const config: SimpleConfig = {
        projectType: ProjectType.MEDIUM,
        qualityLevel: 3,
        safeMode: true,
        debug: false
      };

      const summary = configManager.getConfigSummary(config);

      expect(summary).toContain('中型项目');
      expect(summary).toContain('质量级别: 3/5');
      expect(summary).toContain('安全模式: 启用');
      expect(summary).toContain('总体评分');
    });
  });

  describe('边界情况', () => {
    it('应该处理极端质量级别', () => {
      const minConfig: SimpleConfig = {
        projectType: ProjectType.MEDIUM,
        qualityLevel: 1,
        safeMode: true,
        debug: false
      };

      const maxConfig: SimpleConfig = {
        projectType: ProjectType.MEDIUM,
        qualityLevel: 5,
        safeMode: true,
        debug: false
      };

      const minResult = configManager.generateFullConfig(minConfig);
      const maxResult = configManager.generateFullConfig(maxConfig);

      // 验证阈值在合理范围内
      expect(minResult.thresholds.overallScore).toBeGreaterThanOrEqual(50);
      expect(maxResult.thresholds.overallScore).toBeLessThanOrEqual(95);
      
      expect(minResult.thresholds.cyclomaticComplexity).toBeLessThanOrEqual(25);
      expect(maxResult.thresholds.cyclomaticComplexity).toBeGreaterThanOrEqual(5);
    });
  });
});