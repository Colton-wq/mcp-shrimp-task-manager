/**
 * 语义分析相关类型定义
 * Semantic analysis related type definitions
 */

/**
 * 操作类型枚举
 * Operation type enumeration
 */
export enum OperationType {
  CREATE = 'CREATE',           // 创建新功能
  MODIFY = 'MODIFY',           // 修改现有功能
  DELETE = 'DELETE',           // 删除功能
  REFACTOR = 'REFACTOR',       // 重构代码
  OPTIMIZE = 'OPTIMIZE',       // 性能优化
  DEBUG = 'DEBUG',             // 调试修复
  TEST = 'TEST',               // 测试相关
  DEPLOY = 'DEPLOY',           // 部署相关
  CONFIGURE = 'CONFIGURE',     // 配置设置
  INTEGRATE = 'INTEGRATE',     // 集成功能
  ANALYZE = 'ANALYZE',         // 分析研究
  DOCUMENT = 'DOCUMENT'        // 文档编写
}

/**
 * 技术要求类型
 * Technical requirement type
 */
export interface TechnicalRequirement {
  /** 技术栈要求 */
  techStack: string[];
  /** 性能要求 */
  performance?: string[];
  /** 安全要求 */
  security?: string[];
  /** 兼容性要求 */
  compatibility?: string[];
  /** 可扩展性要求 */
  scalability?: string[];
}

/**
 * 复杂度指标
 * Complexity indicators
 */
export interface ComplexityIndicators {
  /** 技术复杂度 */
  technicalComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 业务复杂度 */
  businessComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 集成复杂度 */
  integrationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 时间复杂度 */
  timeComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 复杂度评分 (0-100) */
  complexityScore: number;
}

/**
 * 关键要素
 * Key elements
 */
export interface KeyElements {
  /** 核心功能 */
  coreFunctions: string[];
  /** 输入要求 */
  inputs: string[];
  /** 输出要求 */
  outputs: string[];
  /** 约束条件 */
  constraints: string[];
  /** 依赖关系 */
  dependencies: string[];
}

/**
 * 预期结果
 * Expected outcomes
 */
export interface ExpectedOutcomes {
  /** 功能性结果 */
  functional: string[];
  /** 非功能性结果 */
  nonFunctional: string[];
  /** 质量指标 */
  qualityMetrics: string[];
  /** 成功标准 */
  successCriteria: string[];
}

/**
 * 上下文信息
 * Contextual information
 */
export interface ContextualInfo {
  /** 技术栈 */
  techStack: string[];
  /** 项目类型 */
  projectType: string;
  /** 相关文件 */
  relatedFiles: string[];
  /** 是否有测试 */
  hasTests: boolean;
  /** 是否有文档 */
  hasDocumentation: boolean;
  /** 依赖数量 */
  dependencyCount: number;
  /** 估计任务大小 */
  estimatedSize: 'SMALL' | 'MEDIUM' | 'LARGE';
}

/**
 * 风险评估
 * Risk assessment
 */
export interface RiskAssessment {
  /** 技术风险 */
  technicalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 业务风险 */
  businessRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 时间风险 */
  timeRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 风险描述 */
  riskFactors: string[];
  /** 缓解措施 */
  mitigationStrategies: string[];
}

/**
 * 技术栈兼容性
 * Tech stack compatibility
 */
export interface TechStackCompatibility {
  /** 兼容性评分 (0-100) */
  compatibilityScore: number;
  /** 潜在冲突 */
  potentialConflicts: string[];
  /** 推荐配置 */
  recommendedConfigurations: string[];
}

/**
 * 语义分析结果
 * Semantic analysis result
 */
export interface SemanticAnalysis {
  /** 操作类型 */
  operationType: OperationType;
  /** 技术要求 */
  technicalRequirements: TechnicalRequirement;
  /** 复杂度指标 */
  complexityIndicators: ComplexityIndicators;
  /** 关键要素 */
  keyElements: KeyElements;
  /** 预期结果 */
  expectedOutcomes: ExpectedOutcomes;
  /** 关键词列表 */
  keywords: string[];
  /** 实体识别 */
  entities: string[];
  /** 情感倾向 */
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  /** 紧急程度 */
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 分析置信度 (0-1) */
  confidence: number;
  /** 风险评估 */
  riskAssessment?: RiskAssessment;
  /** 技术栈兼容性 */
  techStackCompatibility?: TechStackCompatibility;
  /** 分析时间戳 */
  analyzedAt: string;
}

/**
 * 任务拆分语义分析结果
 * Task splitting semantic analysis result
 */
export interface TaskSplittingSemanticAnalysis extends SemanticAnalysis {
  /** 任务优先级 */
  priority: 'P0' | 'P1' | 'P2';
  /** 拆分建议 */
  splitRecommendation: {
    /** 是否建议拆分 */
    shouldSplit: boolean;
    /** 建议的子任务数量 */
    suggestedSubtasks: number;
    /** 拆分原因 */
    reason: string;
  };
  /** 依赖关系提示 */
  dependencyHints: string[];
  /** 实施指导增强 */
  implementationGuidance: {
    /** 技术栈特定指导 */
    techStackGuidance: string[];
    /** 最佳实践建议 */
    bestPractices: string[];
    /** 风险点提醒 */
    riskAlerts: string[];
  };
  /** 验证标准建议 */
  verificationSuggestions: string[];
}

/**
 * 语义分析配置
 * Semantic analysis configuration
 */
export interface SemanticAnalysisConfig {
  /** 是否启用深度分析 */
  enableDeepAnalysis: boolean;
  /** 是否提取实体 */
  extractEntities: boolean;
  /** 是否分析情感 */
  analyzeSentiment: boolean;
  /** 关键词提取数量限制 */
  maxKeywords: number;
  /** 最小置信度阈值 */
  minConfidence: number;
}