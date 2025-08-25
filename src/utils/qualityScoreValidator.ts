/**
 * 质量评分一致性验证工具
 * Quality Score Consistency Validator
 * 
 * 确保所有质量检查模块使用一致的评分算法
 */

import { RealCodeQualityAnalyzer } from '../tools/workflow/realCodeQualityAnalyzer.js';

export interface QualityScoreValidationResult {
  isConsistent: boolean;
  issues: string[];
  recommendations: string[];
  validatedModules: string[];
}

/**
 * 质量评分验证器
 */
export class QualityScoreValidator {
  private static instance: QualityScoreValidator;

  public static getInstance(): QualityScoreValidator {
    if (!QualityScoreValidator.instance) {
      QualityScoreValidator.instance = new QualityScoreValidator();
    }
    return QualityScoreValidator.instance;
  }

  /**
   * 验证质量评分算法的一致性
   */
  public async validateScoreConsistency(): Promise<QualityScoreValidationResult> {
    const result: QualityScoreValidationResult = {
      isConsistent: true,
      issues: [],
      recommendations: [],
      validatedModules: []
    };

    try {
      // 1. 验证 RealCodeQualityAnalyzer 是否使用正确的算法
      await this.validateRealAnalyzer(result);

      // 2. 验证 CodeQualityChecker 是否正确处理默认值
      await this.validateCodeQualityChecker(result);

      // 3. 验证 SimpleCodeReview 是否正确处理默认值
      await this.validateSimpleCodeReview(result);

      // 4. 生成建议
      this.generateRecommendations(result);

    } catch (error) {
      result.isConsistent = false;
      result.issues.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * 验证 RealCodeQualityAnalyzer 的算法
   */
  private async validateRealAnalyzer(result: QualityScoreValidationResult): Promise<void> {
    result.validatedModules.push('RealCodeQualityAnalyzer');

    try {
      const analyzer = RealCodeQualityAnalyzer.getInstance();
      
      // 测试指数衰减算法的特性
      const testViolations = [
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

      const testMetrics = {
        cyclomaticComplexity: 5,
        cognitiveComplexity: 3,
        linesOfCode: 100,
        maintainabilityIndex: 50,
        classCount: 1,
        methodCount: 5,
        functionCount: 3,
        halsteadVolume: 200
      };

      // 使用反射访问私有方法
      const calculateHealthScore = (analyzer as any).calculateRealHealthScore.bind(analyzer);
      const score = calculateHealthScore(testViolations, testMetrics);

      // 验证评分在合理范围内
      if (score < 0 || score > 100) {
        result.isConsistent = false;
        result.issues.push(`RealCodeQualityAnalyzer: Score out of range (${score})`);
      }

      // 验证指数衰减特性
      const noErrorScore = calculateHealthScore([], testMetrics);
      if (noErrorScore !== 100) {
        result.isConsistent = false;
        result.issues.push(`RealCodeQualityAnalyzer: No errors should result in 100 score, got ${noErrorScore}`);
      }

    } catch (error) {
      result.isConsistent = false;
      result.issues.push(`RealCodeQualityAnalyzer validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证 CodeQualityChecker 的默认值处理
   */
  private async validateCodeQualityChecker(result: QualityScoreValidationResult): Promise<void> {
    result.validatedModules.push('CodeQualityChecker');

    try {
      // 读取 CodeQualityChecker.ts 文件内容
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'src/tools/workflow/modules/CodeQualityChecker.ts');
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 检查是否使用了正确的默认值处理
      if (content.includes('healthScore || 100')) {
        result.isConsistent = false;
        result.issues.push('CodeQualityChecker: Still using incorrect default value logic (|| instead of ??)');
      }

      if (content.includes('healthScore ?? 100')) {
        // 正确的实现
      } else {
        result.isConsistent = false;
        result.issues.push('CodeQualityChecker: Missing correct default value handling (??)');
      }

    } catch (error) {
      result.isConsistent = false;
      result.issues.push(`CodeQualityChecker validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证 SimpleCodeReview 的默认值处理
   */
  private async validateSimpleCodeReview(result: QualityScoreValidationResult): Promise<void> {
    result.validatedModules.push('SimpleCodeReview');

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'src/tools/workflow/simpleCodeReview.ts');
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 检查是否使用了正确的默认值处理
      if (content.includes('healthScore || 100')) {
        result.isConsistent = false;
        result.issues.push('SimpleCodeReview: Still using incorrect default value logic (|| instead of ??)');
      }

      if (content.includes('healthScore ?? 100')) {
        // 正确的实现
      } else {
        result.isConsistent = false;
        result.issues.push('SimpleCodeReview: Missing correct default value handling (??)');
      }

    } catch (error) {
      result.isConsistent = false;
      result.issues.push(`SimpleCodeReview validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(result: QualityScoreValidationResult): void {
    if (result.isConsistent) {
      result.recommendations.push('✅ All quality scoring modules are consistent');
      result.recommendations.push('Continue monitoring for consistency in future changes');
    } else {
      result.recommendations.push('🔧 Fix identified inconsistencies immediately');
      result.recommendations.push('Add automated tests to prevent regression');
      result.recommendations.push('Consider creating a shared scoring utility');
    }

    // 通用建议
    result.recommendations.push('Document the scoring algorithm for team reference');
    result.recommendations.push('Add integration tests for end-to-end scoring validation');
  }

  /**
   * 生成验证报告
   */
  public generateValidationReport(result: QualityScoreValidationResult): string {
    let report = '# 质量评分一致性验证报告\n\n';
    
    report += `**验证状态**: ${result.isConsistent ? '✅ 通过' : '❌ 失败'}\n`;
    report += `**验证模块**: ${result.validatedModules.join(', ')}\n\n`;

    if (result.issues.length > 0) {
      report += '## 🚨 发现的问题\n\n';
      result.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue}\n`;
      });
      report += '\n';
    }

    if (result.recommendations.length > 0) {
      report += '## 💡 改进建议\n\n';
      result.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }

    report += `**验证时间**: ${new Date().toISOString()}\n`;
    
    return report;
  }
}

/**
 * 快速验证质量评分一致性
 */
export async function validateQualityScoreConsistency(): Promise<QualityScoreValidationResult> {
  const validator = QualityScoreValidator.getInstance();
  return await validator.validateScoreConsistency();
}