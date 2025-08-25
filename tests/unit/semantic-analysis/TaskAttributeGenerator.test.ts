import { describe, it, expect, beforeEach } from 'vitest';
import { TaskAttributeGenerator } from '../../../src/utils/TaskAttributeGenerator.js';
import { TaskSplittingSemanticAnalysis, OperationType } from '../../../src/types/semanticAnalysis.js';

describe('TaskAttributeGenerator', () => {
  let mockSemanticAnalysis: TaskSplittingSemanticAnalysis;

  beforeEach(() => {
    mockSemanticAnalysis = {
      operationType: OperationType.CREATE,
      priority: 'P0',
      complexityIndicators: {
        complexityScore: 45,
        factors: ['database-design', 'security-requirements']
      },
      implementationGuidance: {
        techStackGuidance: ['使用TypeScript进行类型安全', '使用Jest进行单元测试'],
        bestPractices: ['遵循SOLID原则', '实现适当的错误处理'],
        riskAlerts: ['注意数据库连接安全', '确保输入验证']
      },
      verificationSuggestions: ['单元测试覆盖率达到80%', '集成测试验证API功能'],
      splitRecommendation: {
        shouldSplit: false,
        reason: '任务复杂度适中，可以作为单个任务完成'
      },
      dependencyHints: ['需要先完成数据库设计', '依赖认证模块']
    };
  });

  describe('generateEnhancedImplementationGuide', () => {
    it('should enhance implementation guide with semantic analysis', () => {
      const originalGuide = '1) 设计API；2) 实现功能；3) 测试验证。';
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        originalGuide,
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain(originalGuide);
      expect(enhanced).toContain('技术栈指导');
      expect(enhanced).toContain('TypeScript');
      expect(enhanced).toContain('最佳实践');
      expect(enhanced).toContain('SOLID原则');
    });

    it('should handle undefined original guide', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        undefined,
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('技术栈指导');
      expect(enhanced).toContain('最佳实践');
      expect(enhanced).not.toContain('undefined');
    });

    it('should include operation-specific guidance for CREATE operations', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('操作类型特定指导');
      expect(enhanced).toContain('确保新建组件的可测试性');
    });

    it('should include complexity-based guidance for medium complexity', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('复杂度相关指导');
      expect(enhanced).toContain('中等复杂度任务');
    });

    it('should handle high complexity tasks', () => {
      const highComplexityAnalysis = {
        ...mockSemanticAnalysis,
        complexityIndicators: { ...mockSemanticAnalysis.complexityIndicators, complexityScore: 85 }
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        highComplexityAnalysis
      );
      
      expect(enhanced).toContain('高复杂度任务');
      expect(enhanced).toContain('分阶段实施');
    });

    it('should handle low complexity tasks', () => {
      const lowComplexityAnalysis = {
        ...mockSemanticAnalysis,
        complexityIndicators: { ...mockSemanticAnalysis.complexityIndicators, complexityScore: 25 }
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        lowComplexityAnalysis
      );
      
      expect(enhanced).toContain('低复杂度任务');
      expect(enhanced).toContain('保持代码简洁');
    });
  });

  describe('generateEnhancedVerificationCriteria', () => {
    it('should enhance verification criteria with semantic analysis', () => {
      const originalCriteria = '功能正常工作，测试通过。';
      
      const enhanced = TaskAttributeGenerator.generateEnhancedVerificationCriteria(
        originalCriteria,
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain(originalCriteria);
      expect(enhanced).toContain('语义分析建议的验证标准');
      expect(enhanced).toContain('单元测试覆盖率');
    });

    it('should handle undefined original criteria', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedVerificationCriteria(
        undefined,
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('语义分析建议的验证标准');
      expect(enhanced).not.toContain('undefined');
    });

    it('should include operation-specific verification for CREATE operations', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedVerificationCriteria(
        '基础验证',
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('操作类型特定验证');
      expect(enhanced).toContain('新建组件能够正常编译');
    });

    it('should include complexity-based verification criteria', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedVerificationCriteria(
        '基础验证',
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('复杂度相关验证');
      expect(enhanced).toContain('单元测试覆盖率达到80%');
    });
  });

  describe('generateAnalysisSummary', () => {
    it('should generate comprehensive analysis summary', () => {
      const summary = TaskAttributeGenerator.generateAnalysisSummary(mockSemanticAnalysis);
      
      expect(summary).toContain('语义分析摘要');
      expect(summary).toContain('操作类型: CREATE');
      expect(summary).toContain('任务优先级: P0');
      expect(summary).toContain('复杂度评分: 45/100');
      expect(summary).toContain('拆分建议: 无需拆分');
    });

    it('should include risk alerts when present', () => {
      const summary = TaskAttributeGenerator.generateAnalysisSummary(mockSemanticAnalysis);
      
      expect(summary).toContain('风险提醒');
      expect(summary).toContain('数据库连接安全');
      expect(summary).toContain('输入验证');
    });

    it('should include dependency hints when present', () => {
      const summary = TaskAttributeGenerator.generateAnalysisSummary(mockSemanticAnalysis);
      
      expect(summary).toContain('依赖提示');
      expect(summary).toContain('数据库设计');
      expect(summary).toContain('认证模块');
    });

    it('should handle analysis without risk alerts', () => {
      const analysisWithoutRisks = {
        ...mockSemanticAnalysis,
        implementationGuidance: {
          ...mockSemanticAnalysis.implementationGuidance,
          riskAlerts: []
        }
      };
      
      const summary = TaskAttributeGenerator.generateAnalysisSummary(analysisWithoutRisks);
      
      expect(summary).toContain('语义分析摘要');
      expect(summary).not.toContain('风险提醒');
    });

    it('should handle analysis without dependency hints', () => {
      const analysisWithoutDeps = {
        ...mockSemanticAnalysis,
        dependencyHints: []
      };
      
      const summary = TaskAttributeGenerator.generateAnalysisSummary(analysisWithoutDeps);
      
      expect(summary).toContain('语义分析摘要');
      expect(summary).not.toContain('依赖提示');
    });
  });

  describe('generateEnhancedNotes', () => {
    it('should enhance notes with analysis summary', () => {
      const originalNotes = '这是一个重要的任务。';
      
      const enhanced = TaskAttributeGenerator.generateEnhancedNotes(
        originalNotes,
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain(originalNotes);
      expect(enhanced).toContain('语义分析摘要');
      expect(enhanced).toContain('操作类型: CREATE');
    });

    it('should handle undefined original notes', () => {
      const enhanced = TaskAttributeGenerator.generateEnhancedNotes(
        undefined,
        mockSemanticAnalysis
      );
      
      expect(enhanced).toContain('语义分析摘要');
      expect(enhanced).not.toContain('undefined');
    });
  });

  describe('different operation types', () => {
    it('should provide specific guidance for MODIFY operations', () => {
      const modifyAnalysis = {
        ...mockSemanticAnalysis,
        operationType: OperationType.MODIFY
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        modifyAnalysis
      );
      
      expect(enhanced).toContain('仔细分析现有代码逻辑');
      expect(enhanced).toContain('保持向后兼容性');
    });

    it('should provide specific guidance for DELETE operations', () => {
      const deleteAnalysis = {
        ...mockSemanticAnalysis,
        operationType: OperationType.DELETE
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        deleteAnalysis
      );
      
      expect(enhanced).toContain('确认删除操作不会影响其他组件');
      expect(enhanced).toContain('检查是否有依赖关系');
    });

    it('should provide specific guidance for TEST operations', () => {
      const testAnalysis = {
        ...mockSemanticAnalysis,
        operationType: OperationType.TEST
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        testAnalysis
      );
      
      expect(enhanced).toContain('确保测试覆盖关键路径');
      expect(enhanced).toContain('编写可维护和可读的测试代码');
    });
  });

  describe('edge cases', () => {
    it('should handle empty guidance arrays', () => {
      const emptyGuidanceAnalysis = {
        ...mockSemanticAnalysis,
        implementationGuidance: {
          techStackGuidance: [],
          bestPractices: [],
          riskAlerts: []
        },
        verificationSuggestions: []
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        emptyGuidanceAnalysis
      );
      
      expect(enhanced).toContain('基础指导');
      expect(enhanced).toContain('操作类型特定指导');
    });

    it('should handle unknown operation types gracefully', () => {
      const unknownOpAnalysis = {
        ...mockSemanticAnalysis,
        operationType: 'UNKNOWN' as OperationType
      };
      
      const enhanced = TaskAttributeGenerator.generateEnhancedImplementationGuide(
        '基础指导',
        unknownOpAnalysis
      );
      
      expect(enhanced).toContain('基础指导');
      // Should not crash and should still include complexity guidance
      expect(enhanced).toContain('复杂度相关指导');
    });
  });
});