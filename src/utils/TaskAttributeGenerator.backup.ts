import { TaskSplittingSemanticAnalysis, OperationType } from '../types/semanticAnalysis.js';
import { DynamicGuidanceGenerator } from './DynamicGuidanceGenerator.js';

/**
 * Property-Based Testing项目状态接口
 */
interface PropertyBasedTestingStatus {
  fastCheckInstalled: boolean;      // fast-check是否已安装
  vitestConfigured: boolean;        // vitest是否已配置
  testFilesExist: boolean;          // 是否存在Property-Based测试文件
  packageManagerDetected: 'npm' | 'yarn' | 'pnpm'; // 检测到的包管理器
}

/**
 * 数据一致性验证结果接口
 */
interface DataConsistencyValidation {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  timestamp: string;
}

/**
 * 任务属性生成器
 * 基于语义分析结果生成增强的任务属性
 */
export class TaskAttributeGenerator {

  /**
   * 验证任务数据的一致性
   */
  static validateTaskDataConsistency(
    taskData: {
      name: string;
      description: string;
      implementationGuide?: string;
      verificationCriteria?: string;
      notes?: string;
    },
    enhancedData: {
      implementationGuide: string;
      verificationCriteria: string;
      notes: string;
    }
  ): DataConsistencyValidation {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 验证增强内容是否包含原始内容
    if (taskData.implementationGuide && !enhancedData.implementationGuide.includes(taskData.implementationGuide)) {
      issues.push('增强的实施指导丢失了原始内容');
      recommendations.push('确保增强过程保留所有原始指导内容');
    }

    // 验证Property-Based Testing推荐是否正确生成
    const hasTestingKeywords = ['typescript', 'react', 'express', 'vitest', 'jest', 'testing'].some(keyword =>
      taskData.description.toLowerCase().includes(keyword) ||
      taskData.name.toLowerCase().includes(keyword)
    );

    if (hasTestingKeywords && !enhancedData.implementationGuide.includes('Property-Based Testing')) {
      issues.push('缺少Property-Based Testing推荐（应该为全栈测试任务生成）');
      recommendations.push('为包含测试关键词的任务添加Property-Based Testing推荐');
    }

    // 验证数据长度合理性
    if (enhancedData.implementationGuide.length < (taskData.implementationGuide?.length || 0)) {
      issues.push('增强后的实施指导比原始内容更短，可能存在数据丢失');
      recommendations.push('检查增强逻辑，确保不会截断或丢失内容');
    }

    // 验证内容质量
    if (enhancedData.implementationGuide.length > 0 && enhancedData.implementationGuide.split('\n').length < 3) {
      issues.push('增强后的实施指导内容过于简单，可能缺少必要的指导信息');
      recommendations.push('增加更详细的技术指导和最佳实践建议');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 基于语义分析结果生成增强的实施指导（带数据一致性验证）
   */
  static generateEnhancedImplementationGuide(
    originalGuide: string | undefined,
    semanticAnalysis: TaskSplittingSemanticAnalysis,
    originalTaskContent?: { name: string; description: string } // 新增：原始任务内容
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

    // 🔥 新增：Property-Based Testing 智能推荐
    // New: Intelligent Property-Based Testing recommendations
    console.log('🔍 [MAIN] 开始生成Property-Based Testing推荐...');
    const propertyTestingRecommendation = this.generatePropertyBasedTestingRecommendation(
      semanticAnalysis,
      originalTaskContent
    );
    console.log('🔍 [MAIN] Property-Based Testing推荐结果:', propertyTestingRecommendation);
    if (propertyTestingRecommendation) {
      console.log('🔍 [MAIN] 添加Property-Based Testing推荐到增强内容');
      enhancements.push(propertyTestingRecommendation);
    } else {
      console.log('🔍 [MAIN] 没有生成Property-Based Testing推荐');
    }
    
    // 根据操作类型添加特定指导（传递语义分析参数）
    const operationSpecificGuidance = this.getOperationSpecificGuidance(semanticAnalysis.operationType, semanticAnalysis);
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

    const enhancedGuide = originalGuide
      ? `${originalGuide}\n\n${enhancements.join('\n')}`
      : enhancements.join('\n');

    // 🔍 数据一致性验证和调试输出
    try {
      const validation = this.validateTaskDataConsistency(
        {
          name: 'current-task',
          description: '', // 暂时使用空字符串，因为taskContext不在语义分析中
          implementationGuide: originalGuide
        },
        {
          implementationGuide: enhancedGuide,
          verificationCriteria: '',
          notes: ''
        }
      );

      console.log(`🔍 [DATA-CONSISTENCY] 任务实施指导一致性验证:`);
      console.log(`🔍 [DATA-CONSISTENCY] 验证结果: ${validation.isValid ? '✅ 通过' : '❌ 失败'}`);

      if (!validation.isValid) {
        console.log(`🔍 [DATA-CONSISTENCY] 发现问题:`, validation.issues);
        console.log(`🔍 [DATA-CONSISTENCY] 建议修复:`, validation.recommendations);
      }

      // 写入数据一致性验证日志（同步方式避免async问题）
      console.log(`🔍 [DATA-CONSISTENCY] 验证日志:`, {
        timestamp: validation.timestamp,
        type: 'implementationGuide',
        isValid: validation.isValid,
        issues: validation.issues,
        recommendations: validation.recommendations,
        originalLength: originalGuide?.length || 0,
        enhancedLength: enhancedGuide.length,
        hasPropertyTesting: enhancedGuide.includes('Property-Based Testing')
      });
    } catch (error) {
      console.error('数据一致性验证失败:', error);
    }

    return enhancedGuide;
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
   * 根据操作类型获取特定指导（集成动态生成引擎）
   * Get operation-specific guidance with integrated dynamic generation engine
   */
  private static getOperationSpecificGuidance(
    operationType: OperationType, 
    semanticAnalysis?: TaskSplittingSemanticAnalysis
  ): string[] {
    // 🔥 优先使用动态生成引擎
    if (semanticAnalysis) {
      const dynamicGuidance = DynamicGuidanceGenerator.generateTechStackAwareGuidance(
        semanticAnalysis,
        operationType
      );
      
      if (dynamicGuidance.length > 0) {
        return dynamicGuidance;
      }
    }
    
    // 🔄 Fallback到固定映射表
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

  /**
   * 🔥 新增：生成Property-Based Testing推荐
   * Generate Property-Based Testing recommendations
   */
  private static generatePropertyBasedTestingRecommendation(
    semanticAnalysis: TaskSplittingSemanticAnalysis,
    originalTaskContent?: { name: string; description: string }
  ): string | null {
    // 🚨 调试输出
    console.log('🔍 Property-Based Testing 检测开始...');
    console.log('📊 语义分析数据:', {
      operationType: semanticAnalysis.operationType,
      priority: semanticAnalysis.priority,
      complexityScore: semanticAnalysis.complexityIndicators.complexityScore,
      techStackGuidance: semanticAnalysis.implementationGuidance.techStackGuidance,
      bestPractices: semanticAnalysis.implementationGuidance.bestPractices
    });

    // 检测全栈开发场景
    const isFullStackScenario = this.detectFullStackScenario(semanticAnalysis, originalTaskContent);
    console.log('🎯 全栈场景检测结果:', isFullStackScenario);

    if (!isFullStackScenario) {
      console.log('❌ 非全栈场景，不推荐Property-Based Testing');
      return null; // 非全栈场景不推荐
    }

    // 检测是否为最后一个任务（基于优先级和复杂度）
    const isLikelyFinalTask = this.detectFinalTaskScenario(semanticAnalysis);
    console.log('🏁 最后任务检测结果:', isLikelyFinalTask);

    if (!isLikelyFinalTask) {
      console.log('❌ 非最后任务，不推荐Property-Based Testing');
      return null; // 非最后任务不推荐
    }

    console.log('✅ 满足条件，生成Property-Based Testing推荐');
    // 生成Property-Based Testing推荐内容
    return this.buildPropertyBasedTestingGuidance(semanticAnalysis);
  }

  /**
   * 检测全栈开发场景（增强版 - 直接检测原始任务内容）
   */
  private static detectFullStackScenario(
    semanticAnalysis: TaskSplittingSemanticAnalysis,
    originalTaskContent?: { name: string; description: string }
  ): boolean {
    // 🔥 新增：直接从原始任务内容检测（最可靠的方法）
    let originalText = '';
    if (originalTaskContent) {
      originalText = `${originalTaskContent.name} ${originalTaskContent.description}`.toLowerCase();
      console.log('🔍 [FULLSTACK-DETECTION] 原始任务内容:', originalText);
    }

    // 从语义分析结果检测关键词
    const techStackGuidance = semanticAnalysis.implementationGuidance.techStackGuidance.join(' ').toLowerCase();
    const bestPractices = semanticAnalysis.implementationGuidance.bestPractices.join(' ').toLowerCase();
    const keywords = semanticAnalysis.keywords.join(' ').toLowerCase();
    const entities = semanticAnalysis.entities.join(' ').toLowerCase();

    // 合并所有文本来源（包括原始任务内容）
    const allText = `${techStackGuidance} ${bestPractices} ${keywords} ${entities} ${originalText}`;

    console.log('🔍 [FULLSTACK-DETECTION] 检测文本:', allText);

    // 全栈开发关键词检测
    const fullStackKeywords = [
      'typescript', 'javascript', 'react', 'vue', 'angular', 'nextjs', 'nuxtjs',
      'express', 'fastapi', 'nestjs', 'api', 'database', 'frontend', 'backend',
      'full-stack', 'fullstack', 'web application', 'mcp', 'vitest', 'testing',
      'jest', 'cypress', 'playwright', 'node', 'npm', 'yarn', 'pnpm'
    ];

    const detectedKeywords = fullStackKeywords.filter(keyword => allText.includes(keyword));
    console.log('🔍 [FULLSTACK-DETECTION] 检测到的关键词:', detectedKeywords);

    // 降低阈值：需要至少检测到2个相关关键词（原来是3个）
    const isFullStack = detectedKeywords.length >= 2;
    console.log('🔍 [FULLSTACK-DETECTION] 全栈场景判断:', isFullStack);

    return isFullStack;
  }

  /**
   * 检测是否为最后任务场景（放宽条件版）
   */
  private static detectFinalTaskScenario(semanticAnalysis: TaskSplittingSemanticAnalysis): boolean {
    // 基于优先级判断（P1和P2优先级都可以）
    const isLowPriority = semanticAnalysis.priority === 'P2' || semanticAnalysis.priority === 'P1';

    // 基于操作类型判断（测试、验证、部署、创建类型都可以）
    const isFinalOperationType = [
      OperationType.TEST, OperationType.DEPLOY, OperationType.OPTIMIZE,
      OperationType.CREATE, OperationType.INTEGRATE, OperationType.CONFIGURE
    ].includes(semanticAnalysis.operationType);

    // 基于复杂度判断（中低复杂度都可以）
    const isLowComplexity = semanticAnalysis.complexityIndicators.complexityScore < 60;

    // 基于任务内容判断（包含测试相关关键词）
    const keywords = semanticAnalysis.keywords.join(' ').toLowerCase();
    const entities = semanticAnalysis.entities.join(' ').toLowerCase();
    const hasTestingKeywords = ['test', 'testing', '测试', '验证', 'verify', 'vitest', 'jest'].some(keyword =>
      keywords.includes(keyword) || entities.includes(keyword)
    );

    console.log('🔍 [FINAL-TASK-DETECTION] 检测结果:', {
      isLowPriority,
      isFinalOperationType,
      isLowComplexity,
      hasTestingKeywords,
      operationType: semanticAnalysis.operationType,
      priority: semanticAnalysis.priority,
      complexityScore: semanticAnalysis.complexityIndicators.complexityScore
    });

    // 满足任一条件即可认为是最后任务
    const isFinalTask = isLowPriority || isFinalOperationType || isLowComplexity || hasTestingKeywords;
    console.log('🔍 [FINAL-TASK-DETECTION] 最终判断:', isFinalTask);

    return isFinalTask;
  }

  /**
   * 构建Property-Based Testing指导内容（智能状态感知版本）
   */
  private static buildPropertyBasedTestingGuidance(semanticAnalysis: TaskSplittingSemanticAnalysis): string {
    // 检测项目的Property-Based Testing状态
    const projectStatus = this.detectPropertyBasedTestingStatus();

    console.log('🔍 Property-Based Testing 项目状态检测:', projectStatus);

    // 根据状态生成不同的推荐内容
    return this.generateContextualGuidance(projectStatus, semanticAnalysis);
  }

  /**
   * 检测项目的Property-Based Testing集成状态
   */
  private static detectPropertyBasedTestingStatus(): PropertyBasedTestingStatus {
    const status: PropertyBasedTestingStatus = {
      fastCheckInstalled: false,
      vitestConfigured: false,
      testFilesExist: false,
      packageManagerDetected: 'npm'
    };

    try {
      // 检测项目根目录
      const projectRoot = process.cwd();
      const fs = require('fs');
      const path = require('path');

      // 检测package.json中的fast-check依赖
      const packageJsonPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        // 检查devDependencies和dependencies
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        status.fastCheckInstalled = !!(allDeps['fast-check'] || allDeps['@fast-check/vitest']);

        // 检测包管理器
        if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
          status.packageManagerDetected = 'yarn';
        } else if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
          status.packageManagerDetected = 'pnpm';
        }
      }

      // 检测vitest配置
      const vitestConfigPaths = [
        'vitest.config.ts',
        'vitest.config.js',
        'vite.config.ts',
        'vite.config.js'
      ];

      for (const configPath of vitestConfigPaths) {
        const fullPath = path.join(projectRoot, configPath);
        if (fs.existsSync(fullPath)) {
          const configContent = fs.readFileSync(fullPath, 'utf8');
          // 检查是否包含fast-check相关配置
          if (configContent.includes('fast-check') ||
              configContent.includes('@fast-check') ||
              configContent.includes('setupFiles')) {
            status.vitestConfigured = true;
            break;
          }
        }
      }

      // 检测Property-Based测试文件
      const testDirs = ['tests', 'test', '__tests__', 'src/tests', 'src/test'];
      for (const testDir of testDirs) {
        const testDirPath = path.join(projectRoot, testDir);
        if (fs.existsSync(testDirPath)) {
          const files = this.findPropertyTestFiles(testDirPath);
          if (files.length > 0) {
            status.testFilesExist = true;
            break;
          }
        }
      }

    } catch (error) {
      console.warn('⚠️ Property-Based Testing状态检测失败:', error);
    }

    return status;
  }

  /**
   * 递归查找Property-Based测试文件
   */
  private static findPropertyTestFiles(dir: string): string[] {
    const fs = require('fs');
    const path = require('path');
    const files: string[] = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...this.findPropertyTestFiles(fullPath));
        } else if (stat.isFile()) {
          // 检查文件名和内容
          if (item.includes('property') || item.includes('prop.test')) {
            files.push(fullPath);
          } else if (item.endsWith('.test.ts') || item.endsWith('.test.js')) {
            // 检查文件内容是否包含fast-check
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('fast-check') || content.includes('fc.property')) {
              files.push(fullPath);
            }
          }
        }
      }
    } catch (error) {
      // 忽略权限错误等
    }

    return files;
  }

  /**
   * 根据项目状态生成上下文相关的指导内容
   */
  private static generateContextualGuidance(
    status: PropertyBasedTestingStatus,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string {
    const guidance: string[] = ['🧪 Property-Based Testing 智能推荐:'];

    // 根据不同状态生成不同的推荐内容
    if (status.fastCheckInstalled && status.vitestConfigured && status.testFilesExist) {
      // 场景1: 已完全集成 - 推荐扩展和优化
      guidance.push(...this.generateAdvancedGuidance(status));
    } else if (status.fastCheckInstalled && status.vitestConfigured) {
      // 场景2: 已安装和配置，但缺少测试文件 - 推荐开始编写测试
      guidance.push(...this.generateTestWritingGuidance(status));
    } else if (status.fastCheckInstalled) {
      // 场景3: 已安装但未配置 - 推荐配置
      guidance.push(...this.generateConfigurationGuidance(status));
    } else {
      // 场景4: 未安装 - 推荐安装和初始配置
      guidance.push(...this.generateInstallationGuidance(status));
    }

    // 添加通用的AI协作提示词
    guidance.push(...this.generateAICollaborationTemplate());

    // 添加预期收益
    guidance.push('- 预期收益: 自动发现边界情况，提高代码质量，减少生产环境bug');

    return guidance.join('\n');
  }

  /**
   * 检查任务数据的完整性
   */
  static checkTaskDataIntegrity(
    originalTask: {
      name: string;
      description: string;
      implementationGuide?: string;
      verificationCriteria?: string;
      notes?: string;
    },
    processedTask: {
      name: string;
      description: string;
      implementationGuide: string;
      verificationCriteria: string;
      notes: string;
    }
  ): {
    isIntegrityMaintained: boolean;
    integrityReport: string[];
    dataLossDetected: boolean;
    enhancementQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    const report: string[] = [];
    let dataLossDetected = false;
    let enhancementQuality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

    // 检查基本字段完整性
    if (originalTask.name !== processedTask.name) {
      report.push('❌ 任务名称被意外修改');
      dataLossDetected = true;
    }

    if (originalTask.description !== processedTask.description) {
      report.push('❌ 任务描述被意外修改');
      dataLossDetected = true;
    }

    // 检查增强字段的质量
    if (originalTask.implementationGuide) {
      if (!processedTask.implementationGuide.includes(originalTask.implementationGuide)) {
        report.push('❌ 原始实施指导内容丢失');
        dataLossDetected = true;
        enhancementQuality = 'LOW';
      } else if (processedTask.implementationGuide.length <= originalTask.implementationGuide.length * 1.2) {
        report.push('⚠️ 实施指导增强幅度较小');
        enhancementQuality = 'MEDIUM';
      } else {
        report.push('✅ 实施指导成功增强');
      }
    }

    // 检查Property-Based Testing推荐的生成
    const shouldHavePropertyTesting = this.shouldGeneratePropertyBasedTestingRecommendation(
      originalTask.name,
      originalTask.description
    );

    if (shouldHavePropertyTesting && !processedTask.implementationGuide.includes('Property-Based Testing')) {
      report.push('❌ 缺少预期的Property-Based Testing推荐');
      enhancementQuality = 'LOW';
    } else if (shouldHavePropertyTesting && processedTask.implementationGuide.includes('Property-Based Testing')) {
      report.push('✅ Property-Based Testing推荐正确生成');
    }

    // 检查数据一致性
    const consistencyCheck = this.validateTaskDataConsistency(originalTask, processedTask);
    if (!consistencyCheck.isValid) {
      report.push('❌ 数据一致性验证失败');
      report.push(...consistencyCheck.issues.map(issue => `  - ${issue}`));
      dataLossDetected = true;
      enhancementQuality = 'LOW';
    }

    return {
      isIntegrityMaintained: !dataLossDetected,
      integrityReport: report,
      dataLossDetected,
      enhancementQuality
    };
  }

  /**
   * 判断是否应该生成Property-Based Testing推荐
   */
  private static shouldGeneratePropertyBasedTestingRecommendation(
    taskName: string,
    taskDescription: string
  ): boolean {
    const combinedText = `${taskName} ${taskDescription}`.toLowerCase();

    // 全栈开发关键词
    const fullStackKeywords = [
      'typescript', 'javascript', 'react', 'vue', 'angular', 'nextjs',
      'express', 'fastapi', 'nestjs', 'api', 'database', 'frontend', 'backend',
      'full-stack', 'fullstack', 'web application', 'vitest', 'testing',
      'jest', 'cypress', 'playwright', 'node', 'npm', 'yarn', 'pnpm'
    ];

    // 测试相关关键词
    const testingKeywords = [
      'test', 'testing', '测试', '验证', 'verify', 'validation',
      'integration', '集成', 'e2e', 'end-to-end', 'quality', '质量'
    ];

    const hasFullStackKeywords = fullStackKeywords.some(keyword => combinedText.includes(keyword));
    const hasTestingKeywords = testingKeywords.some(keyword => combinedText.includes(keyword));

    return hasFullStackKeywords && hasTestingKeywords;
  }

  /**
   * 生成高级用法指导（已完全集成的情况）
   */
  private static generateAdvancedGuidance(status: PropertyBasedTestingStatus): string[] {
    return [
      '✅ 检测到fast-check已完全集成！推荐高级用法:',
      '- 扩展现有Property-Based测试覆盖更多业务逻辑',
      '- 使用fc.commands()进行状态机测试',
      '- 集成fc.scheduler()进行异步操作测试',
      '- 考虑添加性能基准测试和回归测试',
      '- 优化测试执行速度，使用fc.sample()进行调试'
    ];
  }

  /**
   * 生成测试编写指导（已安装配置但缺少测试文件）
   */
  private static generateTestWritingGuidance(status: PropertyBasedTestingStatus): string[] {
    return [
      '✅ 检测到fast-check已安装配置！推荐开始编写测试:',
      '- 为核心业务逻辑创建Property-Based测试文件',
      '- 建议测试文件命名: *.property.test.ts 或 *.prop.test.ts',
      '- 重点测试: 状态管理、数据验证、API接口、算法逻辑',
      '- 从简单的数学不变量开始，逐步扩展到复杂业务逻辑'
    ];
  }

  /**
   * 生成配置指导（已安装但未配置）
   */
  private static generateConfigurationGuidance(status: PropertyBasedTestingStatus): string[] {
    return [
      '✅ 检测到fast-check已安装！推荐完善配置:',
      '- 在vitest.config.ts中添加: setupFiles: ["./vitest.setup.ts"]',
      '- 创建vitest.setup.ts配置全局fast-check参数',
      '- 配置示例: fc.configureGlobal({ numRuns: 100, verbose: false })',
      '- 考虑添加自定义arbitraries和测试工具函数'
    ];
  }

  /**
   * 生成安装指导（未安装的情况）
   */
  private static generateInstallationGuidance(status: PropertyBasedTestingStatus): string[] {
    const installCmd = this.getInstallCommand(status.packageManagerDetected);

    return [
      '📦 推荐安装fast-check框架:',
      `- 安装命令: \`${installCmd}\``,
      '- 在vitest.config.ts中添加: setupFiles: ["./vitest.setup.ts"]',
      '- 创建vitest.setup.ts进行全局配置',
      '- 为核心业务逻辑生成自动化测试用例，验证不变量和边界情况'
    ];
  }

  /**
   * 生成AI协作提示词模板
   */
  private static generateAICollaborationTemplate(): string[] {
    return [
      '- 🤖 AI协作提示词模板:',
      '  ```',
      '  请为以下函数生成Property-Based测试:',
      '  [函数代码]',
      '  要求: 1. 使用fast-check的fc.property()',
      '       2. 测试核心不变量而不是具体值',
      '       3. 包含边界情况和异常处理',
      '       4. 生成至少3个不同的property测试',
      '       5. 使用TypeScript类型安全',
      '  ```'
    ];
  }

  /**
   * 根据包管理器生成安装命令
   */
  private static getInstallCommand(packageManager: 'npm' | 'yarn' | 'pnpm'): string {
    const commands = {
      npm: 'npm install --save-dev fast-check @fast-check/vitest',
      yarn: 'yarn add --dev fast-check @fast-check/vitest',
      pnpm: 'pnpm add --save-dev fast-check @fast-check/vitest'
    };

    return commands[packageManager];
  }
}