import { TaskSplittingSemanticAnalysis, OperationType } from '../types/semanticAnalysis.js';

/**
 * 任务属性生成器
 * 基于语义分析结果生成增强的任务属性
 */
export class TaskAttributeGenerator {
  
  /**
   * 基于语义分析结果生成增强的实施指导
   */
  static generateEnhancedImplementationGuide(
    originalGuide: string | undefined,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string {
    const enhancements: string[] = [];
    
    // 添加技术栈特定指导
    if (semanticAnalysis.implementationGuidance.techStackGuidance.length > 0) {
      enhancements.push('技术栈指导:');
      semanticAnalysis.implementationGuidance.techStackGuidance.forEach(guidance => {
        enhancements.push(`- ${guidance}`);
      });
    }
    
    // 添加最佳实践建议
    if (semanticAnalysis.implementationGuidance.bestPractices.length > 0) {
      enhancements.push('最佳实践:');
      semanticAnalysis.implementationGuidance.bestPractices.forEach(practice => {
        enhancements.push(`- ${practice}`);
      });
    }
    
    // 根据操作类型添加特定指导
    const operationSpecificGuidance = this.getOperationSpecificGuidance(semanticAnalysis.operationType);
    if (operationSpecificGuidance.length > 0) {
      enhancements.push('操作类型特定指导:');
      operationSpecificGuidance.forEach(guidance => {
        enhancements.push(`- ${guidance}`);
      });
    }
    
    // 根据复杂度添加指导
    const complexityGuidance = this.getComplexityBasedGuidance(semanticAnalysis.complexityIndicators.complexityScore);
    if (complexityGuidance.length > 0) {
      enhancements.push('复杂度相关指导:');
      complexityGuidance.forEach(guidance => {
        enhancements.push(`- ${guidance}`);
      });
    }
    
    // 合并原始指导和增强内容
    if (enhancements.length === 0) {
      return originalGuide || '';
    }
    
    return originalGuide 
      ? `${originalGuide}\n\n${enhancements.join('\n')}`
      : enhancements.join('\n');
  }
  
  /**
   * 基于语义分析结果生成增强的验证标准
   */
  static generateEnhancedVerificationCriteria(
    originalCriteria: string | undefined,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string {
    const enhancements: string[] = [];
    
    // 添加语义分析建议的验证标准
    if (semanticAnalysis.verificationSuggestions.length > 0) {
      enhancements.push('语义分析建议的验证标准:');
      semanticAnalysis.verificationSuggestions.forEach(suggestion => {
        enhancements.push(`- ${suggestion}`);
      });
    }
    
    // 根据操作类型添加特定验证标准
    const operationSpecificCriteria = this.getOperationSpecificVerificationCriteria(semanticAnalysis.operationType);
    if (operationSpecificCriteria.length > 0) {
      enhancements.push('操作类型特定验证:');
      operationSpecificCriteria.forEach(criteria => {
        enhancements.push(`- ${criteria}`);
      });
    }
    
    // 根据复杂度添加验证标准
    const complexityCriteria = this.getComplexityBasedVerificationCriteria(semanticAnalysis.complexityIndicators.complexityScore);
    if (complexityCriteria.length > 0) {
      enhancements.push('复杂度相关验证:');
      complexityCriteria.forEach(criteria => {
        enhancements.push(`- ${criteria}`);
      });
    }
    
    // 合并原始标准和增强内容
    if (enhancements.length === 0) {
      return originalCriteria || '';
    }
    
    return originalCriteria
      ? `${originalCriteria}\n\n${enhancements.join('\n')}`
      : enhancements.join('\n');
  }
  
  /**
   * 生成语义分析摘要
   */
  static generateAnalysisSummary(semanticAnalysis: TaskSplittingSemanticAnalysis): string {
    const summary = [
      `语义分析摘要 (${new Date().toISOString()}) [SIMPLIFIED]:`,
      `- 拆分建议: ${semanticAnalysis.splitRecommendation.shouldSplit ? '建议拆分' : '无需拆分'} (${semanticAnalysis.splitRecommendation.reason})`
    ];
    
    // 添加依赖提示
    if (semanticAnalysis.dependencyHints.length > 0) {
      summary.push('- 依赖提示:');
      semanticAnalysis.dependencyHints.forEach(hint => {
        summary.push(`  * ${hint}`);
      });
    }
    
    // 添加风险提醒
    if (semanticAnalysis.implementationGuidance.riskAlerts.length > 0) {
      summary.push('- 风险提醒:');
      semanticAnalysis.implementationGuidance.riskAlerts.forEach(alert => {
        summary.push(`  * ${alert}`);
      });
    }
    
    return summary.join('\n');
  }
  
  /**
   * 生成增强的备注
   */
  static generateEnhancedNotes(
    originalNotes: string | undefined,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string {
    const analysisSummary = this.generateAnalysisSummary(semanticAnalysis);
    
    return originalNotes 
      ? `${originalNotes}\n\n${analysisSummary}`
      : analysisSummary;
  }
  
  /**
   * 根据操作类型获取特定指导
   */
  private static getOperationSpecificGuidance(operationType: OperationType): string[] {
    const guidanceMap: Record<OperationType, string[]> = {
      [OperationType.CREATE]: [
        '确保新建组件的可测试性和可维护性',
        '遵循项目的编码规范和架构模式',
        '考虑组件的可扩展性和复用性'
      ],
      [OperationType.MODIFY]: [
        '仔细分析现有代码逻辑，避免破坏现有功能',
        '保持向后兼容性，特别是公共API',
        '更新相关文档和注释'
      ],
      [OperationType.DELETE]: [
        '确认删除操作不会影响其他组件',
        '检查是否有依赖关系需要处理',
        '考虑是否需要数据迁移或清理'
      ],
      [OperationType.REFACTOR]: [
        '保持功能不变的前提下改进代码结构',
        '小步重构，频繁测试',
        '更新相关测试用例'
      ],
      [OperationType.OPTIMIZE]: [
        '建立性能基准，量化优化效果',
        '避免过早优化，专注于瓶颈',
        '考虑可读性和维护性的平衡'
      ],
      [OperationType.DEBUG]: [
        '系统性地定位问题根因',
        '添加适当的日志和监控',
        '考虑添加防御性编程措施'
      ],
      [OperationType.TEST]: [
        '确保测试覆盖关键路径和边界情况',
        '编写可维护和可读的测试代码',
        '考虑测试的执行效率'
      ],
      [OperationType.DEPLOY]: [
        '确保部署过程的可重复性',
        '准备回滚方案',
        '监控部署后的系统状态'
      ],
      [OperationType.CONFIGURE]: [
        '文档化配置变更的原因和影响',
        '使用版本控制管理配置文件',
        '考虑配置的环境差异'
      ],
      [OperationType.INTEGRATE]: [
        '确保接口的稳定性和兼容性',
        '实施全面的集成测试',
        '考虑错误处理和降级策略'
      ],
      [OperationType.ANALYZE]: [
        '明确分析目标和成功标准',
        '使用数据驱动的方法',
        '文档化分析过程和结论'
      ],
      [OperationType.DOCUMENT]: [
        '确保文档的准确性和时效性',
        '考虑目标读者的需求',
        '使用清晰的结构和示例'
      ]
    };
    
    return guidanceMap[operationType] || [];
  }
  
  /**
   * 根据操作类型获取特定验证标准
   */
  private static getOperationSpecificVerificationCriteria(operationType: OperationType): string[] {
    const criteriaMap: Record<OperationType, string[]> = {
      [OperationType.CREATE]: [
        '新建组件能够正常编译和运行',
        '通过所有相关的单元测试',
        '符合项目的代码质量标准'
      ],
      [OperationType.MODIFY]: [
        '修改后功能正常，无回归问题',
        '通过回归测试套件',
        '性能无显著下降'
      ],
      [OperationType.DELETE]: [
        '删除操作完成，无残留引用',
        '相关测试和文档已更新',
        '系统整体功能正常'
      ],
      [OperationType.REFACTOR]: [
        '重构后功能与之前完全一致',
        '代码质量指标有所改善',
        '测试覆盖率保持或提升'
      ],
      [OperationType.OPTIMIZE]: [
        '性能指标达到预期改善',
        '功能正确性未受影响',
        '资源使用更加高效'
      ],
      [OperationType.DEBUG]: [
        '问题已被正确识别和修复',
        '修复方案不引入新问题',
        '添加了适当的预防措施'
      ],
      [OperationType.TEST]: [
        '测试用例覆盖预期场景',
        '测试结果准确反映系统状态',
        '测试执行稳定可靠'
      ],
      [OperationType.DEPLOY]: [
        '部署成功，服务正常运行',
        '监控指标显示系统健康',
        '回滚方案已验证可用'
      ],
      [OperationType.CONFIGURE]: [
        '配置变更生效且符合预期',
        '系统行为符合配置要求',
        '配置文档已更新'
      ],
      [OperationType.INTEGRATE]: [
        '集成接口工作正常',
        '数据流转正确无误',
        '错误处理机制有效'
      ],
      [OperationType.ANALYZE]: [
        '分析结果准确可信',
        '分析方法科学合理',
        '结论有数据支撑'
      ],
      [OperationType.DOCUMENT]: [
        '文档内容准确完整',
        '格式规范易于阅读',
        '示例代码可以运行'
      ]
    };
    
    return criteriaMap[operationType] || [];
  }
  
  /**
   * 根据复杂度获取指导建议
   */
  private static getComplexityBasedGuidance(complexityScore: number): string[] {
    if (complexityScore >= 70) {
      return [
        '高复杂度任务，建议分阶段实施',
        '加强代码审查和测试覆盖',
        '考虑引入设计模式简化复杂性',
        '建立详细的实施计划和里程碑'
      ];
    } else if (complexityScore >= 40) {
      return [
        '中等复杂度任务，注意模块化设计',
        '确保充分的单元测试',
        '考虑代码的可读性和可维护性'
      ];
    } else {
      return [
        '低复杂度任务，保持代码简洁',
        '遵循基本的编程最佳实践'
      ];
    }
  }
  
  /**
   * 根据复杂度获取验证标准
   */
  private static getComplexityBasedVerificationCriteria(complexityScore: number): string[] {
    if (complexityScore >= 70) {
      return [
        '通过全面的集成测试和端到端测试',
        '代码审查通过，无重大设计问题',
        '性能测试满足要求',
        '安全性审查通过'
      ];
    } else if (complexityScore >= 40) {
      return [
        '单元测试覆盖率达到80%以上',
        '代码质量检查通过',
        '基本性能要求满足'
      ];
    } else {
      return [
        '基本功能测试通过',
        '代码符合项目规范'
      ];
    }
  }
}