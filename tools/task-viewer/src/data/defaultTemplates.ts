import { PromptTemplate, TemplateCategory, BUILTIN_TAGS } from '../types/template';

/**
 * 内置默认模板定义
 * 提供常用的任务管理和项目分析模板
 */
export const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'id' | 'metadata' | 'usage'>[] = [
  {
    name: '任务复杂度分析',
    description: '分析任务的技术复杂度、时间估算和风险评估',
    category: TemplateCategory.TASK_ANALYSIS,
    tags: [BUILTIN_TAGS[0], BUILTIN_TAGS[1]], // analysis, planning
    content: `你是一个专业的任务分析专家。请对以下任务进行全面的复杂度分析：

**任务信息：**
- 任务名称：{{taskName}}
- 任务描述：{{taskDescription}}
- 依赖关系：{{taskDependencies}}
- 项目上下文：{{projectContext}}

**分析要求：**
请从以下维度进行详细分析：

1. **技术复杂度评估 (1-10分)**
   - 技术难度和挑战
   - 所需技术栈和工具
   - 技术风险点识别

2. **时间估算**
   - 开发时间预估（小时）
   - 测试时间预估（小时）
   - 总体完成时间

3. **资源需求分析**
   - 人力资源需求
   - 技术资源需求
   - 外部依赖分析

4. **风险评估**
   - 主要风险点
   - 风险概率和影响
   - 风险缓解策略

5. **建议和优化**
   - 实施建议
   - 优化方案
   - 分解建议

请提供结构化的分析结果，包含具体的评分和详细的理由说明。`,
    variables: [
      {
        name: 'taskName',
        type: 'string',
        description: '任务名称',
        required: true,
      },
      {
        name: 'taskDescription',
        type: 'string',
        description: '任务详细描述',
        required: true,
      },
      {
        name: 'taskDependencies',
        type: 'string',
        description: '任务依赖关系',
        required: false,
        defaultValue: '无',
      },
      {
        name: 'projectContext',
        type: 'string',
        description: '项目背景和上下文',
        required: false,
        defaultValue: '通用项目',
      },
    ],
    language: 'zh',
    version: '1.0.0',
    author: 'Shrimp Task Manager',
    builtin: true,
    public: true,
    settings: {
      temperature: 0.3,
      maxTokens: 1500,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },

  {
    name: '项目规划助手',
    description: '协助制定项目计划、里程碑和资源分配',
    category: TemplateCategory.PROJECT_MANAGEMENT,
    tags: [BUILTIN_TAGS[1], BUILTIN_TAGS[0]], // planning, analysis
    content: `你是一个经验丰富的项目管理专家。请为以下项目制定详细的规划方案：

**项目信息：**
- 项目名称：{{projectName}}
- 项目目标：{{projectGoals}}
- 预期时间：{{projectDuration}}
- 团队规模：{{teamSize}}
- 预算范围：{{budget}}

**规划要求：**

1. **项目分解结构 (WBS)**
   - 主要阶段划分
   - 关键任务识别
   - 任务优先级排序

2. **时间规划**
   - 里程碑设定
   - 关键路径分析
   - 时间缓冲安排

3. **资源分配**
   - 人力资源分配
   - 技能需求匹配
   - 资源冲突识别

4. **风险管理**
   - 风险识别和评估
   - 应急预案制定
   - 风险监控机制

5. **质量保证**
   - 质量标准定义
   - 检查点设置
   - 验收标准制定

6. **沟通计划**
   - 汇报机制
   - 会议安排
   - 文档管理

请提供可执行的项目规划方案，包含具体的时间节点和责任分工。`,
    variables: [
      {
        name: 'projectName',
        type: 'string',
        description: '项目名称',
        required: true,
      },
      {
        name: 'projectGoals',
        type: 'string',
        description: '项目目标和期望成果',
        required: true,
      },
      {
        name: 'projectDuration',
        type: 'string',
        description: '项目预期持续时间',
        required: true,
      },
      {
        name: 'teamSize',
        type: 'string',
        description: '团队规模和组成',
        required: false,
        defaultValue: '小型团队（3-5人）',
      },
      {
        name: 'budget',
        type: 'string',
        description: '预算范围或约束',
        required: false,
        defaultValue: '中等预算',
      },
    ],
    language: 'zh',
    version: '1.0.0',
    author: 'Shrimp Task Manager',
    builtin: true,
    public: true,
    settings: {
      temperature: 0.4,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },

  {
    name: '代码审查助手',
    description: '协助进行代码质量审查和改进建议',
    category: TemplateCategory.CODE_REVIEW,
    tags: [BUILTIN_TAGS[2], BUILTIN_TAGS[5]], // review, optimization
    content: `你是一个资深的代码审查专家。请对以下代码进行全面的质量审查：

**代码信息：**
- 编程语言：{{programmingLanguage}}
- 代码类型：{{codeType}}
- 功能描述：{{functionality}}

**代码内容：**
\`\`\`{{programmingLanguage}}
{{codeContent}}
\`\`\`

**审查要求：**

1. **代码质量评估**
   - 代码可读性
   - 命名规范
   - 代码结构
   - 注释质量

2. **功能正确性**
   - 逻辑正确性
   - 边界条件处理
   - 错误处理机制
   - 输入验证

3. **性能分析**
   - 算法效率
   - 内存使用
   - 潜在性能瓶颈
   - 优化建议

4. **安全性检查**
   - 安全漏洞识别
   - 输入安全验证
   - 权限控制
   - 数据保护

5. **最佳实践**
   - 设计模式应用
   - 代码重用性
   - 可维护性
   - 可扩展性

6. **改进建议**
   - 具体修改建议
   - 重构建议
   - 测试建议
   - 文档建议

请提供详细的审查报告，包含具体的问题定位和改进方案。`,
    variables: [
      {
        name: 'programmingLanguage',
        type: 'string',
        description: '编程语言',
        required: true,
        validation: {
          options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'Other'],
        },
      },
      {
        name: 'codeType',
        type: 'string',
        description: '代码类型（如：函数、类、模块等）',
        required: true,
      },
      {
        name: 'functionality',
        type: 'string',
        description: '代码功能描述',
        required: true,
      },
      {
        name: 'codeContent',
        type: 'string',
        description: '要审查的代码内容',
        required: true,
        validation: {
          minLength: 10,
          maxLength: 5000,
        },
      },
    ],
    language: 'zh',
    version: '1.0.0',
    author: 'Shrimp Task Manager',
    builtin: true,
    public: true,
    settings: {
      temperature: 0.2,
      maxTokens: 2000,
      topP: 0.8,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },

  {
    name: '技术文档生成器',
    description: '自动生成技术文档、API文档和用户手册',
    category: TemplateCategory.DOCUMENTATION,
    tags: [BUILTIN_TAGS[3]], // documentation
    content: `你是一个专业的技术文档编写专家。请为以下内容生成高质量的技术文档：

**文档信息：**
- 文档类型：{{documentType}}
- 目标受众：{{targetAudience}}
- 技术栈：{{techStack}}
- 项目名称：{{projectName}}

**内容描述：**
{{contentDescription}}

**文档要求：**

1. **文档结构**
   - 清晰的目录结构
   - 逻辑层次分明
   - 易于导航

2. **内容质量**
   - 准确的技术信息
   - 清晰的说明文字
   - 实用的示例代码
   - 完整的参数说明

3. **格式规范**
   - Markdown格式
   - 统一的样式
   - 适当的代码高亮
   - 清晰的表格和列表

4. **用户体验**
   - 循序渐进的说明
   - 常见问题解答
   - 故障排除指南
   - 快速开始指南

5. **维护性**
   - 版本信息
   - 更新日志
   - 联系方式
   - 反馈渠道

请生成完整的技术文档，确保内容准确、结构清晰、易于理解。`,
    variables: [
      {
        name: 'documentType',
        type: 'string',
        description: '文档类型',
        required: true,
        validation: {
          options: ['API文档', '用户手册', '开发指南', '部署文档', '架构文档', '其他'],
        },
      },
      {
        name: 'targetAudience',
        type: 'string',
        description: '目标读者群体',
        required: true,
        validation: {
          options: ['开发者', '最终用户', '系统管理员', '产品经理', '技术支持', '混合受众'],
        },
      },
      {
        name: 'techStack',
        type: 'string',
        description: '相关技术栈',
        required: false,
        defaultValue: '通用技术',
      },
      {
        name: 'projectName',
        type: 'string',
        description: '项目或产品名称',
        required: true,
      },
      {
        name: 'contentDescription',
        type: 'string',
        description: '需要文档化的内容描述',
        required: true,
        validation: {
          minLength: 20,
          maxLength: 2000,
        },
      },
    ],
    language: 'zh',
    version: '1.0.0',
    author: 'Shrimp Task Manager',
    builtin: true,
    public: true,
    settings: {
      temperature: 0.3,
      maxTokens: 2500,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },

  {
    name: '问题诊断专家',
    description: '协助诊断技术问题和提供解决方案',
    category: TemplateCategory.GENERAL,
    tags: [BUILTIN_TAGS[4], BUILTIN_TAGS[0]], // debugging, analysis
    content: `你是一个经验丰富的技术问题诊断专家。请帮助分析和解决以下技术问题：

**问题信息：**
- 问题类型：{{problemType}}
- 系统环境：{{systemEnvironment}}
- 问题描述：{{problemDescription}}
- 错误信息：{{errorMessage}}
- 复现步骤：{{reproductionSteps}}

**诊断要求：**

1. **问题分析**
   - 问题根本原因分析
   - 影响范围评估
   - 紧急程度判断
   - 相关组件识别

2. **诊断步骤**
   - 系统化的诊断流程
   - 关键检查点
   - 日志分析指导
   - 测试验证方法

3. **解决方案**
   - 临时解决方案
   - 永久解决方案
   - 实施步骤详解
   - 风险评估

4. **预防措施**
   - 监控建议
   - 预警机制
   - 最佳实践
   - 文档更新

5. **验证方法**
   - 解决效果验证
   - 性能影响评估
   - 回归测试建议
   - 持续监控

请提供系统化的诊断报告和可执行的解决方案。`,
    variables: [
      {
        name: 'problemType',
        type: 'string',
        description: '问题类型',
        required: true,
        validation: {
          options: ['性能问题', '功能异常', '系统错误', '网络问题', '安全问题', '兼容性问题', '其他'],
        },
      },
      {
        name: 'systemEnvironment',
        type: 'string',
        description: '系统环境信息',
        required: true,
      },
      {
        name: 'problemDescription',
        type: 'string',
        description: '问题详细描述',
        required: true,
        validation: {
          minLength: 20,
        },
      },
      {
        name: 'errorMessage',
        type: 'string',
        description: '错误信息或日志',
        required: false,
        defaultValue: '无具体错误信息',
      },
      {
        name: 'reproductionSteps',
        type: 'string',
        description: '问题复现步骤',
        required: false,
        defaultValue: '问题随机出现',
      },
    ],
    language: 'zh',
    version: '1.0.0',
    author: 'Shrimp Task Manager',
    builtin: true,
    public: true,
    settings: {
      temperature: 0.3,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },

  {
    name: '性能优化顾问',
    description: '提供系统和代码性能优化建议',
    category: TemplateCategory.GENERAL,
    tags: [BUILTIN_TAGS[5], BUILTIN_TAGS[0]], // optimization, analysis
    content: `你是一个专业的性能优化专家。请对以下系统或代码进行性能分析和优化建议：

**优化目标：**
- 系统类型：{{systemType}}
- 当前性能指标：{{currentPerformance}}
- 性能目标：{{performanceGoals}}
- 约束条件：{{constraints}}

**详细信息：**
{{detailedInfo}}

**优化分析：**

1. **性能瓶颈识别**
   - 关键性能指标分析
   - 瓶颈点定位
   - 资源使用分析
   - 性能监控建议

2. **优化策略**
   - 短期优化方案
   - 长期优化规划
   - 架构优化建议
   - 代码优化重点

3. **具体优化措施**
   - 算法优化
   - 数据结构优化
   - 缓存策略
   - 并发优化
   - 数据库优化
   - 网络优化

4. **实施计划**
   - 优化优先级排序
   - 实施时间安排
   - 风险评估
   - 回滚计划

5. **效果评估**
   - 性能测试方案
   - 监控指标设置
   - 基准测试
   - 持续优化机制

6. **最佳实践**
   - 性能设计原则
   - 开发规范
   - 运维建议
   - 工具推荐

请提供详细的性能优化方案，包含具体的实施步骤和预期效果。`,
    variables: [
      {
        name: 'systemType',
        type: 'string',
        description: '系统或应用类型',
        required: true,
        validation: {
          options: ['Web应用', '移动应用', '桌面应用', '后端服务', '数据库', '网络系统', '其他'],
        },
      },
      {
        name: 'currentPerformance',
        type: 'string',
        description: '当前性能指标和问题',
        required: true,
      },
      {
        name: 'performanceGoals',
        type: 'string',
        description: '期望达到的性能目标',
        required: true,
      },
      {
        name: 'constraints',
        type: 'string',
        description: '优化约束条件（如预算、时间、技术限制等）',
        required: false,
        defaultValue: '无特殊约束',
      },
      {
        name: 'detailedInfo',
        type: 'string',
        description: '系统架构、技术栈、业务场景等详细信息',
        required: true,
        validation: {
          minLength: 50,
        },
      },
    ],
    language: 'zh',
    version: '1.0.0',
    author: 'Shrimp Task Manager',
    builtin: true,
    public: true,
    settings: {
      temperature: 0.3,
      maxTokens: 2500,
      topP: 0.9,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
];

/**
 * 初始化默认模板到PromptTemplateManager
 */
export function initializeDefaultTemplates(templateManager: any): void {
  for (const templateData of DEFAULT_TEMPLATES) {
    try {
      templateManager.createTemplate(templateData);
    } catch (error) {
      console.warn(`Failed to create default template "${templateData.name}":`, error);
    }
  }
}

export default DEFAULT_TEMPLATES;