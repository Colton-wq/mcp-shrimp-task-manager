import { TaskSplittingSemanticAnalysis, OperationType } from '../types/semanticAnalysis.js';

/**
 * 技术栈感知的动态内容生成引擎
 * Tech Stack-Aware Dynamic Content Generation Engine
 * 
 * 该引擎能够理解AI提交的技术上下文，并生成对应的具体操作指导序列
 * This engine understands AI submission technical context and generates corresponding specific operation guidance sequences
 */
export class DynamicGuidanceGenerator {
  
  /**
   * 技术栈检测和分类映射
   * Technology stack detection and classification mapping
   */
  private static readonly TECH_STACK_PATTERNS = {
    // 前端技术栈
    frontend: {
      react: /react|jsx|tsx|useState|useEffect|component/i,
      vue: /vue|vuejs|\.vue|composition.*api/i,
      angular: /angular|@angular|component|directive/i,
      typescript: /typescript|ts|interface|type.*alias/i,
      javascript: /javascript|js|function|const|let|var/i
    },
    
    // 后端技术栈
    backend: {
      nodejs: /node\.?js|express|fastify|koa|npm|yarn/i,
      python: /python|django|flask|fastapi|pip|\.py/i,
      java: /java|spring|maven|gradle|\.java/i,
      go: /golang|go|goroutine|channel|\.go/i,
      rust: /rust|cargo|\.rs|tokio|async.*fn/i
    },
    
    // 数据库技术栈
    database: {
      mongodb: /mongodb|mongo|mongoose|bson/i,
      postgresql: /postgresql|postgres|pg|psql/i,
      mysql: /mysql|mariadb/i,
      redis: /redis|cache|session.*store/i,
      sqlite: /sqlite|\.db|\.sqlite/i
    },
    
    // 安全和认证
    security: {
      jwt: /jwt|json.*web.*token|bearer.*token/i,
      oauth: /oauth|openid|sso|saml/i,
      bcrypt: /bcrypt|hash.*password|salt/i,
      auth: /authentication|authorization|auth.*middleware/i
    },
    
    // 云服务和部署
    cloud: {
      docker: /docker|dockerfile|container|image/i,
      kubernetes: /kubernetes|k8s|pod|deployment|service/i,
      aws: /aws|amazon|s3|ec2|lambda|dynamodb/i,
      azure: /azure|microsoft.*cloud/i,
      gcp: /google.*cloud|gcp|firebase/i
    },
    
    // 测试框架
    testing: {
      jest: /jest|\.test\.js|\.spec\.js/i,
      vitest: /vitest|\.test\.ts|\.spec\.ts/i,
      cypress: /cypress|e2e.*test/i,
      playwright: /playwright|browser.*test/i,
      fastcheck: /fast.*check|属性测试|property.*test|算法验证|验证.*算法|数据处理|不变量|invariant|数学.*性质|边界条件|异常.*处理|正确性.*验证/i
    }
  };

  /**
   * 操作类型到技术栈指导的映射
   * Operation type to tech stack guidance mapping
   */
  private static readonly OPERATION_TECH_GUIDANCE = {
    [OperationType.CREATE]: {
      react: [
        '设计可复用的React组件接口和Props类型定义',
        '实现组件的状态管理（useState/useReducer）',
        '添加适当的生命周期钩子（useEffect）',
        '确保组件的可测试性（React Testing Library）'
      ],
      nodejs: [
        '设计RESTful API端点和路由结构',
        '实现中间件链和错误处理机制',
        '配置环境变量和配置管理',
        '添加API文档（Swagger/OpenAPI）'
      ],
      jwt: [
        '实现JWT令牌生成和验证逻辑',
        '配置令牌过期时间和刷新机制',
        '添加令牌黑名单和撤销功能',
        '实现安全的令牌存储策略'
      ],
      mongodb: [
        '设计数据模型和Schema定义',
        '实现数据验证和索引策略',
        '配置连接池和事务处理',
        '添加数据迁移和备份机制'
      ]
    },
    
    [OperationType.MODIFY]: {
      react: [
        '分析现有组件的依赖关系和影响范围',
        '保持向后兼容性，避免破坏性变更',
        '更新相关的TypeScript类型定义',
        '验证修改对子组件的影响'
      ],
      nodejs: [
        '分析API变更对客户端的影响',
        '实施API版本控制策略',
        '更新相关的中间件和路由',
        '确保数据库迁移的兼容性'
      ],
      jwt: [
        '评估令牌格式变更的安全影响',
        '实施渐进式令牌迁移策略',
        '更新令牌验证和解析逻辑',
        '确保现有会话的连续性'
      ]
    },
    
    [OperationType.REFACTOR]: {
      react: [
        '提取可复用的自定义Hook',
        '优化组件渲染性能（memo, useMemo）',
        '重构复杂组件为更小的子组件',
        '改进组件的可测试性和可维护性'
      ],
      nodejs: [
        '重构路由处理器为模块化结构',
        '提取通用中间件和工具函数',
        '优化数据库查询和连接管理',
        '改进错误处理和日志记录'
      ],
      typescript: [
        '优化类型定义和接口设计',
        '消除any类型和类型断言',
        '实现更严格的类型检查',
        '重构复杂类型为可复用的工具类型'
      ]
    },
    
    [OperationType.DELETE]: {
      react: ['安全移除组件和相关依赖', '清理相关的状态和副作用'],
      nodejs: ['移除API端点和相关中间件', '清理数据库相关代码'],
      jwt: ['撤销相关令牌和会话', '清理认证相关配置']
    },
    
    [OperationType.OPTIMIZE]: {
      react: ['优化组件渲染性能', '减少不必要的重新渲染'],
      nodejs: ['优化API响应时间', '改进数据库查询性能'],
      mongodb: ['优化查询索引', '改进数据访问模式']
    },
    
    [OperationType.DEBUG]: {
      react: ['添加调试工具和日志', '分析组件渲染问题'],
      nodejs: ['添加详细的错误日志', '实现请求追踪机制'],
      jwt: ['调试令牌验证问题', '分析认证流程异常']
    },
    
    [OperationType.TEST]: {
      react: ['编写组件单元测试', '实现集成测试'],
      nodejs: ['编写API端点测试', '实现中间件测试'],
      jwt: ['测试认证流程', '验证令牌安全性'],
      fastcheck: ['使用fast-check进行属性测试', '验证函数不变量和数学性质', '测试边界条件和异常输入']
    },
    
    [OperationType.DEPLOY]: {
      react: ['构建生产版本', '配置部署环境'],
      nodejs: ['配置生产环境', '设置监控和日志'],
      docker: ['构建容器镜像', '配置容器编排']
    },
    
    [OperationType.CONFIGURE]: {
      nodejs: ['配置环境变量', '设置应用配置'],
      mongodb: ['配置数据库连接', '设置索引和约束'],
      jwt: ['配置令牌参数', '设置安全策略']
    },
    
    [OperationType.INTEGRATE]: {
      react: ['集成第三方组件库', '实现API集成'],
      nodejs: ['集成外部服务', '实现数据同步'],
      jwt: ['集成认证服务', '实现单点登录']
    },
    
    [OperationType.ANALYZE]: {
      react: ['分析组件性能', '评估用户体验'],
      nodejs: ['分析API性能', '评估系统负载'],
      mongodb: ['分析查询性能', '评估数据模型']
    },
    
    [OperationType.DOCUMENT]: {
      react: ['编写组件文档', '创建使用示例'],
      nodejs: ['编写API文档', '创建部署指南'],
      jwt: ['编写认证文档', '创建安全指南']
    }
  };

  /**
   * 生成技术栈感知的动态指导内容
   * Generate tech stack-aware dynamic guidance content
   */
  static generateTechStackAwareGuidance(
    semanticAnalysis: TaskSplittingSemanticAnalysis,
    operationType: OperationType
  ): string[] {
    const detectedTechStack = this.detectTechStackFromAnalysis(semanticAnalysis);
    const guidance: string[] = [];

    // 为每个检测到的技术栈生成具体指导
    detectedTechStack.forEach(tech => {
      const techGuidance = this.generateTechSpecificGuidance(tech, operationType, semanticAnalysis);
      if (techGuidance.length > 0) {
        guidance.push(`${tech.toUpperCase()}技术栈指导:`);
        guidance.push(...techGuidance.map(item => `- ${item}`));
      }
    });

    // 如果没有检测到特定技术栈，生成通用指导
    if (guidance.length === 0) {
      guidance.push(...this.generateGenericGuidance(operationType));
    }

    return guidance;
  }

  /**
   * 从语义分析结果中检测技术栈
   * Detect tech stack from semantic analysis results
   */
  private static detectTechStackFromAnalysis(semanticAnalysis: TaskSplittingSemanticAnalysis): string[] {
    const detectedTech: string[] = [];
    const analysisText = this.extractAnalysisText(semanticAnalysis);
    
    // 获取原始任务信息（如果可用）
    const taskDescription = (semanticAnalysis as any).originalTask?.description || '';
    const combinedText = (analysisText + ' ' + taskDescription).toLowerCase();

    // 遍历所有技术栈模式进行检测
    Object.entries(this.TECH_STACK_PATTERNS).forEach(([category, patterns]) => {
      Object.entries(patterns).forEach(([tech, pattern]) => {
        if (pattern.test(combinedText)) {
          detectedTech.push(tech);
        }
      });
    });

    // 去重并按优先级排序
    return [...new Set(detectedTech)].sort((a, b) => {
      const priorityOrder = ['react', 'nodejs', 'typescript', 'jwt', 'mongodb', 'docker', 'fastcheck'];
      const aIndex = priorityOrder.indexOf(a);
      const bIndex = priorityOrder.indexOf(b);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
  }

  /**
   * 提取语义分析中的文本内容 - 添加防护逻辑
   * Extract text content from semantic analysis
   */
  private static extractAnalysisText(semanticAnalysis: TaskSplittingSemanticAnalysis): string {
    const textParts = [
      (semanticAnalysis.implementationGuidance?.techStackGuidance || []).join(' '),
      (semanticAnalysis.implementationGuidance?.bestPractices || []).join(' '),
      (semanticAnalysis.implementationGuidance?.riskAlerts || []).join(' '),
      (semanticAnalysis.keywords || []).join(' '),
      (semanticAnalysis.entities || []).join(' '),
      // 添加技术需求中的各个分类
      (semanticAnalysis.technicalRequirements?.techStack || []).join(' '),
      (semanticAnalysis.technicalRequirements?.security || []).join(' '),
      (semanticAnalysis.technicalRequirements?.performance || []).join(' '),
      (semanticAnalysis.technicalRequirements?.compatibility || []).join(' '),
      (semanticAnalysis.technicalRequirements?.scalability || []).join(' ')
    ];
    
    return textParts.join(' ').toLowerCase();
  }

  /**
   * 生成特定技术栈的指导内容
   * Generate guidance content for specific tech stack
   */
  private static generateTechSpecificGuidance(
    tech: string,
    operationType: OperationType,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string[] {
    const operationGuidance = this.OPERATION_TECH_GUIDANCE[operationType];
    if (!operationGuidance || !(tech in operationGuidance)) {
      return this.generateContextualGuidance(tech, operationType, semanticAnalysis);
    }

    return (operationGuidance as any)[tech] || [];
  }

  /**
   * 生成上下文相关的指导内容
   * Generate contextual guidance content
   */
  private static generateContextualGuidance(
    tech: string,
    operationType: OperationType,
    semanticAnalysis: TaskSplittingSemanticAnalysis
  ): string[] {
    const guidance: string[] = [];
    const complexityScore = semanticAnalysis.complexityIndicators.complexityScore;

    // 基于复杂度调整指导深度
    if (complexityScore >= 70) {
      guidance.push(`高复杂度${tech}实现：分阶段设计和实施`);
      guidance.push(`建立详细的${tech}架构文档和设计决策记录`);
      guidance.push(`实施全面的${tech}测试策略和质量保证`);
    } else if (complexityScore >= 40) {
      guidance.push(`中等复杂度${tech}实现：注重模块化和可维护性`);
      guidance.push(`遵循${tech}最佳实践和社区标准`);
    } else {
      guidance.push(`简单${tech}实现：保持代码简洁和可读性`);
      guidance.push(`快速迭代和及时反馈`);
    }

    // 基于操作类型添加特定指导
    switch (operationType) {
      case OperationType.CREATE:
        guidance.push(`设计可扩展的${tech}架构和接口`);
        break;
      case OperationType.MODIFY:
        guidance.push(`确保${tech}修改的向后兼容性`);
        break;
      case OperationType.REFACTOR:
        guidance.push(`优化${tech}代码结构和性能`);
        break;
    }

    return guidance;
  }

  /**
   * 生成通用指导内容
   * Generate generic guidance content
   */
  private static generateGenericGuidance(operationType: OperationType): string[] {
    const baseGuidance = {
      [OperationType.CREATE]: [
        '设计清晰的模块接口和依赖关系',
        '实施适当的错误处理和边界检查',
        '添加必要的文档和使用示例',
        '确保代码的可测试性和可维护性'
      ],
      [OperationType.MODIFY]: [
        '分析修改的影响范围和依赖关系',
        '保持API的向后兼容性',
        '更新相关的文档和测试用例',
        '验证修改不会引入回归问题'
      ],
      [OperationType.REFACTOR]: [
        '保持功能行为的一致性',
        '改进代码结构和可读性',
        '优化性能和资源使用',
        '增强代码的可维护性'
      ],
      [OperationType.TEST]: [
        '设计全面的测试用例覆盖',
        '实施单元测试和集成测试',
        '添加性能测试和边界测试',
        '建立持续集成和测试自动化'
      ],
      [OperationType.INTEGRATE]: [
        '设计清晰的集成接口和协议',
        '实施错误处理和重试机制',
        '添加监控和日志记录',
        '确保集成的稳定性和可靠性'
      ],
      [OperationType.DELETE]: [
        '确认删除操作的影响范围',
        '备份相关数据和配置',
        '清理相关依赖和引用',
        '验证删除操作的完整性'
      ],
      [OperationType.OPTIMIZE]: [
        '建立性能基准和监控',
        '识别性能瓶颈和优化点',
        '实施优化措施并验证效果',
        '平衡性能和可维护性'
      ],
      [OperationType.DEBUG]: [
        '系统性地定位问题根因',
        '添加适当的日志和监控',
        '实施修复措施并验证',
        '建立预防机制避免重复'
      ],
      [OperationType.DEPLOY]: [
        '准备部署环境和配置',
        '实施部署流程和验证',
        '监控部署后的系统状态',
        '准备回滚方案和应急处理'
      ],
      [OperationType.CONFIGURE]: [
        '分析配置需求和依赖',
        '实施配置变更和验证',
        '文档化配置变更过程',
        '建立配置管理和版本控制'
      ],
      [OperationType.ANALYZE]: [
        '明确分析目标和范围',
        '收集和处理相关数据',
        '应用分析方法和工具',
        '总结分析结果和建议'
      ],
      [OperationType.DOCUMENT]: [
        '确定文档目标和受众',
        '组织和结构化内容',
        '编写清晰和准确的文档',
        '维护文档的时效性和准确性'
      ]
    };

    return baseGuidance[operationType] || baseGuidance[OperationType.CREATE];
  }

  /**
   * 生成基于上下文相关性的步骤序列
   * Generate step sequence based on contextual relevance
   */
  static generateContextualStepSequence(
    semanticAnalysis: TaskSplittingSemanticAnalysis,
    operationType: OperationType,
    taskDescription?: string
  ): string[] {
    // 临时存储原始任务描述以便检测使用
    if (taskDescription) {
      (semanticAnalysis as any).originalTask = { description: taskDescription };
    }
    
    const detectedTechStack = this.detectTechStackFromAnalysis(semanticAnalysis);
    const steps: string[] = [];

    // 生成技术栈特定的实施步骤
    if (detectedTechStack.includes('react') && detectedTechStack.includes('typescript')) {
      steps.push(...this.generateReactTypeScriptSteps(operationType));
    } else if ((detectedTechStack.includes('nodejs') || detectedTechStack.includes('javascript')) && detectedTechStack.includes('jwt')) {
      steps.push(...this.generateNodeJWTSteps(operationType));
    } else if (detectedTechStack.includes('jwt')) {
      // 单独的JWT也生成特定步骤（默认假设Node.js环境）
      steps.push(...this.generateNodeJWTSteps(operationType));
    } else if (detectedTechStack.includes('fastcheck') && operationType === OperationType.TEST) {
      steps.push(...this.generateFastCheckTestSteps(operationType));
    } else if (detectedTechStack.includes('mongodb')) {
      steps.push(...this.generateMongoDBSteps(operationType));
    } else {
      steps.push(...this.generateGenericAtomicSteps(operationType));
    }

    // 基于复杂度调整步骤详细程度
    return this.adjustStepsByComplexity(steps, semanticAnalysis.complexityIndicators.complexityScore);
  }

  /**
   * 生成React + TypeScript原子级步骤
   */
  private static generateReactTypeScriptSteps(operationType: OperationType): string[] {
    if (operationType === OperationType.CREATE) {
      return [
        '1. 创建组件文件 ComponentName.tsx',
        '2. 添加基础 React import 语句',
        '3. 定义 Props interface 类型',
        '4. 编写函数组件基础结构',
        '5. 添加 JSX return 语句',
        '6. 导出组件供其他文件使用'
      ];
    }
    return this.generateGenericAtomicSteps(operationType);
  }

  /**
   * 生成Node.js + JWT原子级步骤
   */
  private static generateNodeJWTSteps(operationType: OperationType): string[] {
    if (operationType === OperationType.CREATE) {
      return [
        '1. 安装 jsonwebtoken 依赖包',
        '2. 创建 auth.js 配置文件',
        '3. 编写 generateToken 函数',
        '4. 编写 verifyToken 中间件',
        '5. 创建 /login POST 路由',
        '6. 测试令牌生成和验证'
      ];
    }
    return this.generateGenericAtomicSteps(operationType);
  }

  /**
   * 生成MongoDB原子级步骤
   */
  private static generateMongoDBSteps(operationType: OperationType): string[] {
    if (operationType === OperationType.CREATE) {
      return [
        '1. 安装 mongoose 依赖包',
        '2. 创建数据库连接文件 db.js',
        '3. 定义数据模型 Schema',
        '4. 编写基础 CRUD 函数',
        '5. 测试数据库连接',
        '6. 创建示例数据记录'
      ];
    }
    return this.generateGenericAtomicSteps(operationType);
  }

  /**
   * 生成Fast-check属性测试原子级步骤
   */
  private static generateFastCheckTestSteps(operationType: OperationType): string[] {
    if (operationType === OperationType.TEST) {
      return [
        '1. 安装 fast-check 依赖包',
        '2. 创建属性测试文件',
        '3. 定义函数不变量和属性',
        '4. 编写 fast-check 测试用例',
        '5. 运行属性测试验证',
        '6. 分析失败案例和收缩结果'
      ];
    }
    return this.generateGenericAtomicSteps(operationType);
  }

  /**
   * 生成通用原子级实施步骤
   */
  private static generateGenericAtomicSteps(operationType: OperationType): string[] {
    const stepTemplates = {
      [OperationType.CREATE]: [
        '1. 创建主要文件和基础结构',
        '2. 添加必要的 import/require 语句',
        '3. 编写核心函数或组件框架',
        '4. 添加基础配置和导出',
        '5. 运行基础测试验证',
        '6. 提交初始代码到版本控制'
      ],
      [OperationType.MODIFY]: [
        '1. 定位需要修改的具体文件',
        '2. 备份现有代码片段',
        '3. 实施具体的代码修改',
        '4. 更新相关的类型定义',
        '5. 运行测试确保无破坏',
        '6. 提交修改并添加说明'
      ],
      [OperationType.DELETE]: [
        '1. 识别要删除的具体文件/函数',
        '2. 检查并移除相关引用',
        '3. 删除目标代码片段',
        '4. 清理未使用的导入',
        '5. 运行测试确保系统完整',
        '6. 提交删除操作'
      ],
      [OperationType.REFACTOR]: [
        '1. 确定重构的具体范围',
        '2. 重命名变量或函数',
        '3. 提取或合并代码片段',
        '4. 更新所有调用点',
        '5. 验证功能保持不变',
        '6. 提交重构结果'
      ],
      [OperationType.OPTIMIZE]: [
        '1. 识别性能瓶颈位置',
        '2. 实施具体优化代码',
        '3. 移除不必要的计算',
        '4. 添加缓存或索引',
        '5. 测试性能改进效果',
        '6. 记录优化结果'
      ],
      [OperationType.DEBUG]: [
        '1. 复现问题的具体步骤',
        '2. 添加调试日志输出',
        '3. 定位错误的准确位置',
        '4. 修复具体的代码错误',
        '5. 验证问题已解决',
        '6. 移除调试代码'
      ],
      [OperationType.TEST]: [
        '1. 创建测试文件',
        '2. 编写第一个测试用例',
        '3. 添加成功场景测试',
        '4. 添加失败场景测试',
        '5. 运行测试并确保通过',
        '6. 集成到测试套件'
      ],
      [OperationType.DEPLOY]: [
        '1. 检查代码构建状态',
        '2. 更新部署配置文件',
        '3. 执行部署命令',
        '4. 验证服务启动状态',
        '5. 检查关键功能运行',
        '6. 监控部署后状态'
      ],
      [OperationType.CONFIGURE]: [
        '1. 打开配置文件',
        '2. 修改具体配置项',
        '3. 验证配置语法正确',
        '4. 重启相关服务',
        '5. 测试配置生效',
        '6. 备份新配置文件'
      ],
      [OperationType.INTEGRATE]: [
        '1. 安装必要的依赖包',
        '2. 创建集成接口文件',
        '3. 编写连接配置',
        '4. 实现基础集成功能',
        '5. 测试集成连接',
        '6. 处理集成错误情况'
      ],
      [OperationType.ANALYZE]: [
        '1. 收集具体分析数据',
        '2. 运行分析工具或脚本',
        '3. 整理分析结果',
        '4. 识别关键问题点',
        '5. 生成分析报告',
        '6. 提出具体改进建议'
      ],
      [OperationType.DOCUMENT]: [
        '1. 创建文档文件',
        '2. 编写功能概述',
        '3. 添加代码示例',
        '4. 列出使用步骤',
        '5. 添加常见问题',
        '6. 审核文档准确性'
      ]
    };

    return stepTemplates[operationType] || stepTemplates[OperationType.CREATE];
  }

  /**
   * 基于复杂度调整步骤详细程度
   */
  private static adjustStepsByComplexity(steps: string[], complexityScore: number): string[] {
    if (complexityScore >= 70) {
      // 高复杂度：添加更详细的子步骤
      return steps.map(step => {
        const subSteps = this.generateSubSteps(step, 'high');
        return subSteps.length > 0 ? `${step}\n   ${subSteps.join('\n   ')}` : step;
      });
    } else if (complexityScore >= 40) {
      // 中等复杂度：添加关键检查点
      return steps.map((step, index) => {
        if (index % 2 === 1) { // 每隔一步添加检查点
          return `${step}\n   ✓ 检查点：验证此步骤的完成质量`;
        }
        return step;
      });
    }
    
    // 低复杂度：保持简洁
    return steps;
  }

  /**
   * 生成子步骤
   */
  private static generateSubSteps(step: string, complexity: 'high' | 'medium'): string[] {
    if (complexity === 'high') {
      if (step.includes('设计') || step.includes('架构')) {
        return [
          '- 绘制架构图和数据流图',
          '- 定义接口契约和API规范',
          '- 评估性能和扩展性需求'
        ];
      }
      if (step.includes('实现') || step.includes('创建')) {
        return [
          '- 编写核心业务逻辑',
          '- 添加输入验证和错误处理',
          '- 实施日志记录和监控'
        ];
      }
      if (step.includes('测试')) {
        return [
          '- 编写单元测试用例',
          '- 实施集成测试',
          '- 进行性能和压力测试'
        ];
      }
    }
    
    return [];
  }

  /**
   * 调试方法：检测技术栈并返回详细信息
   * Debug method: Detect tech stack and return detailed information
   */
  static debugTechStackDetection(
    semanticAnalysis: TaskSplittingSemanticAnalysis, 
    taskDescription?: string
  ): {
    extractedText: string;
    detectedTech: string[];
    patternMatches: { [key: string]: boolean };
    combinedText?: string;
  } {
    const extractedText = this.extractAnalysisText(semanticAnalysis);
    const originalTaskDescription = (semanticAnalysis as any).originalTask?.description || taskDescription || '';
    const combinedText = (extractedText + ' ' + originalTaskDescription).toLowerCase();
    const detectedTech = this.detectTechStackFromAnalysis(semanticAnalysis);
    
    // 测试所有安全相关的模式
    const patternMatches: { [key: string]: boolean } = {};
    Object.entries(this.TECH_STACK_PATTERNS.security).forEach(([tech, pattern]) => {
      patternMatches[tech] = pattern.test(combinedText);
    });
    
    // 添加测试框架模式匹配
    Object.entries(this.TECH_STACK_PATTERNS.testing).forEach(([tech, pattern]) => {
      patternMatches[tech] = pattern.test(combinedText);
    });
    
    return {
      extractedText,
      detectedTech,
      patternMatches,
      combinedText
    };
  }
}