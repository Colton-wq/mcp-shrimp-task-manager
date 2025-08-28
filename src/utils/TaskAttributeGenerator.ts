import { TaskSplittingSemanticAnalysis, OperationType } from '../types/semanticAnalysis.js';
import { DynamicGuidanceGenerator } from './DynamicGuidanceGenerator.js';

/**
 * 任务属性生成器 - 简化版本，专注于动态内容生成
 * 基于语义分析结果生成技术栈感知的任务属性
 */
export class TaskAttributeGenerator {
  
  /**
   * 智能任务拆分判断 - 与IntelligentTaskAnalyzer保持一致
   */
  static shouldSplitTask(taskDescription: string, implementationGuide?: string): boolean {
    const fullText = `${taskDescription} ${implementationGuide || ''}`;
    const descriptionLength = taskDescription.length;
    
    // 基于长度的直接判断（大幅降低阈值）
    if (descriptionLength > 150) return true;
    
    // 技术关键词检测（2个或更多技术栈标识）
    const techKeywords = [
      /react|vue|angular/i,
      /node\.?js|express|fastify/i, 
      /mongodb|postgres|mysql|redis/i,
      /jwt|oauth|auth/i,
      /docker|kubernetes/i,
      /api|endpoint|rest|graphql/i,
      /微服务|microservice/i,
      /支付|payment/i,
      /电商|e-commerce|购物/i
    ];
    
    const matchCount = techKeywords.filter(pattern => pattern.test(fullText)).length;
    if (matchCount >= 2) return true;
    
    // 复杂项目关键词强制拆分
    const forceVSplitKeywords = [
      /完整.*?(系统|网站|平台|应用)/i,
      /电商|e-commerce|购物网站|在线商店/i,
      /用户系统|管理后台|订单管理/i,
      /微服务|分布式系统/i,
      /全套|整套|complete.*system/i
    ];
    
    if (forceVSplitKeywords.some(pattern => pattern.test(fullText))) return true;
    
    // 功能模块数量检测
    const moduleKeywords = [
      /用户|user/i, /商品|product/i, /订单|order/i, /支付|payment/i,
      /搜索|search/i, /评价|review/i, /后台|admin/i, /认证|auth/i
    ];
    
    const moduleCount = moduleKeywords.filter(pattern => pattern.test(fullText)).length;
    if (moduleCount > 2) return true;
    
    // 只有非常简单的任务不拆分
    if (descriptionLength < 30) return false;
    
    // 默认倾向于拆分
    return true;
  }
  /**
   * 生成动态技术栈感知的实施指导
   */
  static generateEnhancedImplementationGuide(
    originalGuide: string | undefined,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string {
    // 使用DynamicGuidanceGenerator生成技术栈感知指导
    const dynamicGuidance = DynamicGuidanceGenerator.generateTechStackAwareGuidance(
      semanticAnalysis,
      semanticAnalysis.operationType
    );
    
    // 生成上下文步骤序列
    const stepSequence = DynamicGuidanceGenerator.generateContextualStepSequence(
      semanticAnalysis,
      semanticAnalysis.operationType
    );
    
    const enhancements = [...dynamicGuidance, ...stepSequence];
    
    if (enhancements.length === 0) {
      return originalGuide || '';
    }
    
    return originalGuide 
      ? `${originalGuide}\n\n${enhancements.join('\n')}`
      : enhancements.join('\n');
  }
  /**
   * 生成简化的验证标准
   */
  static generateEnhancedVerificationCriteria(
    originalCriteria: string | undefined,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string {
    const criteria: string[] = [];
    
    // 基于操作类型生成核心验证点
    switch (semanticAnalysis.operationType) {
      case OperationType.CREATE:
        criteria.push('✓ 新组件正常编译和运行', '✓ 通过基础功能测试');
        break;
      case OperationType.MODIFY:
        criteria.push('✓ 修改功能正常，无回归问题', '✓ 通过回归测试');
        break;
      case OperationType.TEST:
        criteria.push('✓ 测试用例覆盖关键场景', '✓ 测试执行稳定可靠');
        break;
      default:
        criteria.push('✓ 实现符合预期', '✓ 基本验证通过');
    }
    
    return originalCriteria
      ? `${originalCriteria}\n\n${criteria.join('\n')}`
      : criteria.join('\n');
  }
  /**
   * 生成简化的语义分析摘要
   */
  static generateAnalysisSummary(semanticAnalysis: TaskSplittingSemanticAnalysis): string {
    const splitReason = semanticAnalysis.splitRecommendation.shouldSplit 
      ? '建议拆分 - ' + semanticAnalysis.splitRecommendation.reason
      : '无需拆分';
    
    return `[${new Date().toISOString().split('T')[0]}] ${splitReason}`;
  }
  
  /**
   * 生成增强的备注 - 简化版本
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
}
