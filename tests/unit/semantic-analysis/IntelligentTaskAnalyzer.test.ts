import { describe, it, expect, beforeEach } from 'vitest';
import { IntelligentTaskAnalyzer } from '../../../src/prompts/generators/executeTask.js';
import { Task } from '../../../src/types/task.js';
import { OperationType } from '../../../src/types/semanticAnalysis.js';

describe('IntelligentTaskAnalyzer', () => {
  let mockTask: Task;

  beforeEach(() => {
    mockTask = {
      id: 'test-task-123',
      name: '实现用户认证系统',
      description: '创建一个完整的用户认证系统，包括登录、注册、密码重置功能。使用JWT进行会话管理，支持多种认证方式。',
      status: 'pending',
      dependencies: [{ taskId: 'setup-database' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      implementationGuide: '1) 设计数据库模式；2) 实现认证API；3) 添加前端界面；4) 集成测试。',
      verificationCriteria: '认证功能正常工作，安全性测试通过。',
      notes: '这是一个安全相关的核心功能。'
    };
  });

  describe('analyzeForTaskSplitting', () => {
    it('should analyze task and return semantic analysis result', () => {
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(mockTask);
      
      expect(result).toBeDefined();
      expect(result.operationType).toBeDefined();
      expect(result.priority).toBeDefined();
      expect(result.complexityIndicators).toBeDefined();
      expect(result.complexityIndicators.complexityScore).toBeGreaterThanOrEqual(0);
      expect(result.complexityIndicators.complexityScore).toBeLessThanOrEqual(100);
    });

    it('should identify CREATE operation for implementation tasks', () => {
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(mockTask);
      
      expect(result.operationType).toBe(OperationType.CREATE);
    });

    it('should assign appropriate priority based on task content', () => {
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(mockTask);
      
      expect(['P0', 'P1', 'P2']).toContain(result.priority);
    });

    it('should provide implementation guidance', () => {
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(mockTask);
      
      expect(result.implementationGuidance).toBeDefined();
      expect(result.implementationGuidance.techStackGuidance).toBeInstanceOf(Array);
      expect(result.implementationGuidance.bestPractices).toBeInstanceOf(Array);
      expect(result.implementationGuidance.riskAlerts).toBeInstanceOf(Array);
    });

    it('should provide verification suggestions', () => {
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(mockTask);
      
      expect(result.verificationSuggestions).toBeInstanceOf(Array);
    });

    it('should provide split recommendation', () => {
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(mockTask);
      
      expect(result.splitRecommendation).toBeDefined();
      expect(typeof result.splitRecommendation.shouldSplit).toBe('boolean');
      expect(typeof result.splitRecommendation.reason).toBe('string');
    });

    it('should handle tasks with different complexity levels', () => {
      // Test simple task
      const simpleTask = {
        ...mockTask,
        name: '修复按钮样式',
        description: '调整登录按钮的颜色和边距。'
      };
      
      const simpleResult = IntelligentTaskAnalyzer.analyzeForTaskSplitting(simpleTask);
      
      // Test complex task
      const complexTask = {
        ...mockTask,
        name: '构建分布式微服务架构',
        description: '设计和实现完整的微服务架构，包括服务发现、负载均衡、配置管理、监控、日志聚合、分布式追踪、API网关、服务网格等组件。'
      };
      
      const complexResult = IntelligentTaskAnalyzer.analyzeForTaskSplitting(complexTask);
      
      // 验证复杂度评分都在有效范围内
      expect(simpleResult.complexityIndicators.complexityScore).toBeGreaterThanOrEqual(0);
      expect(simpleResult.complexityIndicators.complexityScore).toBeLessThanOrEqual(100);
      expect(complexResult.complexityIndicators.complexityScore).toBeGreaterThanOrEqual(0);
      expect(complexResult.complexityIndicators.complexityScore).toBeLessThanOrEqual(100);
      
      // 验证复杂任务的复杂度不低于简单任务
      expect(complexResult.complexityIndicators.complexityScore)
        .toBeGreaterThanOrEqual(simpleResult.complexityIndicators.complexityScore);
    });

    it('should handle tasks with no dependencies', () => {
      const taskWithoutDeps = {
        ...mockTask,
        dependencies: []
      };
      
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(taskWithoutDeps);
      
      expect(result).toBeDefined();
      expect(result.dependencyHints).toBeInstanceOf(Array);
    });

    it('should handle tasks with minimal information', () => {
      const minimalTask = {
        ...mockTask,
        description: '简单任务',
        implementationGuide: undefined,
        verificationCriteria: undefined,
        notes: undefined
      };
      
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(minimalTask);
      
      expect(result).toBeDefined();
      expect(result.operationType).toBeDefined();
      expect(result.priority).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty task name', () => {
      const taskWithEmptyName = {
        ...mockTask,
        name: ''
      };
      
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(taskWithEmptyName);
      
      expect(result).toBeDefined();
      expect(result.operationType).toBeDefined();
    });

    it('should handle very long task descriptions', () => {
      const longDescription = 'A'.repeat(10000);
      const taskWithLongDesc = {
        ...mockTask,
        description: longDescription
      };
      
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(taskWithLongDesc);
      
      expect(result).toBeDefined();
      expect(result.complexityIndicators.complexityScore).toBeGreaterThan(0);
    });

    it('should handle special characters in task content', () => {
      const taskWithSpecialChars = {
        ...mockTask,
        name: '实现API接口 @#$%^&*()',
        description: '创建RESTful API，支持CRUD操作。包含特殊字符：<>&"\'`'
      };
      
      const result = IntelligentTaskAnalyzer.analyzeForTaskSplitting(taskWithSpecialChars);
      
      expect(result).toBeDefined();
      expect(result.operationType).toBeDefined();
    });
  });
});