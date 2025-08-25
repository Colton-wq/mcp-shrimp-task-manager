/**
 * Execute Task 上下文增强相关类型定义
 * Context enhancement types for Execute Task tool
 * 
 * 基于 split_tasks 和 mandatory_code_review 成功模式设计
 * Designed based on successful patterns from split_tasks and mandatory_code_review
 */

/**
 * 上下文分析深度
 * Context analysis depth levels
 * 
 * 参考 mandatory_code_review 的 reviewScope 设计
 * Based on reviewScope design from mandatory_code_review
 */
export enum ContextDepth {
  BASIC = 'basic',      // 基础上下文分析 - 技术栈检测、项目类型识别
  ENHANCED = 'enhanced' // 增强上下文分析 - 包含工作流阶段、质量关注点预测
}

/**
 * 项目上下文信息
 * Project context information
 */
export interface ProjectContext {
  /** 检测到的技术栈 */
  techStack: string[];
  /** 项目类型 */
  projectType: string;
  /** 项目复杂度评估 */
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 上下文分析时间戳 */
  analyzedAt: string;
}

/**
 * 工作流阶段
 * Workflow stage enumeration
 */
export enum WorkflowStage {
  SETUP = 'SETUP',           // 项目设置阶段
  DEVELOPMENT = 'DEVELOPMENT', // 开发实现阶段
  TESTING = 'TESTING',       // 测试验证阶段
  DEPLOYMENT = 'DEPLOYMENT'  // 部署发布阶段
}

/**
 * 质量关注点
 * Quality focus areas
 */
export enum QualityFocus {
  SECURITY = 'SECURITY',                    // 安全性
  PERFORMANCE = 'PERFORMANCE',              // 性能
  TYPE_SAFETY = 'TYPE_SAFETY',             // 类型安全
  AUTHENTICATION = 'AUTHENTICATION',        // 认证授权
  SCALABILITY = 'SCALABILITY',             // 可扩展性
  COMPONENT_DESIGN = 'COMPONENT_DESIGN',    // 组件设计
  STATE_MANAGEMENT = 'STATE_MANAGEMENT',    // 状态管理
  TEST_COVERAGE = 'TEST_COVERAGE',          // 测试覆盖
  EDGE_CASES = 'EDGE_CASES'                // 边界情况
}

/**
 * 上下文分析配置
 * Context analysis configuration
 */
export interface ContextAnalysisConfig {
  /** 是否启用项目上下文分析 */
  enableProjectAnalysis: boolean;
  /** 是否启用工作流阶段检测 */
  enableWorkflowDetection: boolean;
  /** 是否启用质量关注点预测 */
  enableQualityPrediction: boolean;
  /** 分析深度 */
  depth: ContextDepth;
}

/**
 * 上下文增强结果
 * Context enhancement result
 */
export interface ContextEnhancementResult {
  /** 项目上下文 */
  projectContext?: ProjectContext;
  /** 工作流阶段 */
  workflowStage?: WorkflowStage;
  /** 质量关注点 */
  qualityFocus?: QualityFocus[];
  /** 上下文特定建议 */
  contextRecommendations?: string[];
  /** 分析配置 */
  config: ContextAnalysisConfig;
}

/**
 * 任务上下文分析结果
 * Task context analysis result
 */
export interface TaskContext {
  /** 检测到的技术栈 */
  techStack: string[];
  /** 项目类型 */
  projectType: string;
  /** 项目复杂度评估 */
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 上下文分析时间戳 */
  analyzedAt: string;
  /** 相关文件数量 */
  relatedFilesCount: number;
  /** 任务类型 */
  taskType: string;
}

/**
 * 执行任务增强参数
 * Enhanced execute task parameters
 * 
 * 设计原则：
 * 1. 所有新参数都是可选的，保持向后兼容
 * 2. 使用枚举而非自由文本，AI 友好
 * 3. 提供合理的默认值
 * 4. 参数数量最小化
 */
export interface ExecuteTaskEnhancementParams {
  /** 是否启用上下文分析 - 默认 false，保持向后兼容 */
  enableContextAnalysis?: boolean;
  
  /** 上下文分析深度 - 枚举值，AI 友好 */
  contextDepth?: ContextDepth;
  
  /** 工作流提示 - 可选的简短提示，帮助上下文分析 */
  workflowHint?: string;
}