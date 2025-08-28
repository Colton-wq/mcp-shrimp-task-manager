/**
 * executeTask prompt 生成器 - 增强版
 * 負責將模板和參數組合成最終的 prompt，支持智能任务拆分和动态建议
 * executeTask prompt generator - Enhanced version
 * Responsible for combining templates and parameters into the final prompt with intelligent task decomposition and dynamic recommendations
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
  enhancePromptWithContext,
} from "../loader.js";
import { Task, TaskStatus } from "../../types/index.js";
import { TaskContext } from "../../types/executeTask.js";
import { 
  SemanticAnalysis, 
  TaskSplittingSemanticAnalysis,
  OperationType, 
  TechnicalRequirement, 
  ComplexityIndicators,
  ContextualInfo,
  RiskAssessment,
  TechStackCompatibility, 
  KeyElements, 
  ExpectedOutcomes,
  SemanticAnalysisConfig 
} from "../../types/semanticAnalysis.js";
import { ContextAnalyzer, BusinessDomain, BusinessIntent } from "../contextAnalyzer.js";
import { 
  generateTechStackGuidance, 
  generateContextAwareGuidance, 
  generateBestPracticesGuidance,
  generateSemanticAnalysisSection
} from "./executeTask-helpers.js";

/**
 * 任務複雜度評估的介面
 * Interface for task complexity assessment
 */
interface ComplexityAssessment {
  level: string;
  metrics: {
    descriptionLength: number;
    dependenciesCount: number;
  };
  recommendations?: string[];
}

/**
 * 任务类型分类 - 用于智能分析
 * Task type classification for intelligent analysis
 */
export enum TaskType {
  CODE_UNDERSTANDING = 'code-understanding',
  CODE_SEARCH = 'code-search',
  ARCHITECTURE_ANALYSIS = 'architecture-analysis',
  PROBLEM_DIAGNOSIS = 'problem-diagnosis',
  CODE_GENERATION = 'code-generation',
  INTEGRATION = 'integration',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  REFACTORING = 'refactoring',
  PERFORMANCE_OPTIMIZATION = 'performance-optimization'
}

/**
 * 边界情况识别
 * Edge case identification
 */
export interface EdgeCase {
  type: string;
  description: string;
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  testingStrategy: string;
  preventionMeasures: string[];
}

/**
 * 强制审计检查点
 * Mandatory audit checkpoint
 */
export interface AuditCheckpoint {
  name: string;
  description: string;
  mandatory: boolean;
  timing: 'BEFORE_EXECUTION' | 'DURING_EXECUTION' | 'BEFORE_COMPLETION';
  criteria: string[];
  tools: string[];
}

/**
 * 动态任务拆分建议
 * Dynamic task decomposition recommendation
 */
export interface DecompositionRecommendation {
  shouldDecompose: boolean;
  suggestedSubtasks: {
    name: string;
    description: string;
    estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    dependencies: string[];
  }[];
  decompositionRationale: string;
}

/**
 * executeTask prompt 參數介面 - 增强版
 * executeTask prompt parameter interface - Enhanced version
 */
export interface ExecuteTaskPromptParams {
  task: Task;
  complexityAssessment?: ComplexityAssessment;
  relatedFilesSummary?: string;
  dependencyTasks?: Task[];
  pathRecommendation?: string;
  // 新增的智能分析参数
  enableIntelligentAnalysis?: boolean;
  projectContext?: any;
  relatedTasks?: Task[];
  // 🔥 新增：相关文件列表，用于增强边界情况识别
  // New: Related files list for enhanced edge case identification
  relatedFiles?: string[];
}

/**
 * 獲取複雜度級別的樣式文字
 * Get styled text for complexity level
 * @param level 複雜度級別
 * @param level complexity level
 * @returns 樣式文字
 * @returns styled text
 */
function getComplexityStyle(level: string): string {
  switch (level) {
    case "VERY_HIGH":
      return "⚠️ **警告：此任務複雜度極高** ⚠️";
      // ⚠️ **Warning: This task has extremely high complexity** ⚠️
    case "HIGH":
      return "⚠️ **注意：此任務複雜度較高**";
      // ⚠️ **Notice: This task has relatively high complexity**
    case "MEDIUM":
      return "**提示：此任務具有一定複雜性**";
      // **Tip: This task has some complexity**
    default:
      return "";
  }
}

/**
 * 智能任务分析器
 * Intelligent task analyzer
 */
class IntelligentTaskAnalyzer {
  /**
   * 分析任务类型 - 增强版
   * Analyze task type - Enhanced version
   */
  static classifyTaskType(task: Task): TaskType {
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();
    
    // 🔥 增强：权重计算系统
    // Enhanced: Weight calculation system
    const typeScores: Record<TaskType, number> = {
      [TaskType.CODE_UNDERSTANDING]: 0,
      [TaskType.CODE_SEARCH]: 0,
      [TaskType.ARCHITECTURE_ANALYSIS]: 0,
      [TaskType.PROBLEM_DIAGNOSIS]: 0,
      [TaskType.CODE_GENERATION]: 0,
      [TaskType.INTEGRATION]: 0,
      [TaskType.TESTING]: 0,
      [TaskType.DOCUMENTATION]: 0,
      [TaskType.REFACTORING]: 0,
      [TaskType.PERFORMANCE_OPTIMIZATION]: 0
    };

    // 🔥 增强：扩展关键词词典和权重
    // Enhanced: Extended keyword dictionary with weights
    const keywordPatterns = {
      [TaskType.CODE_UNDERSTANDING]: {
        primary: ['understand', 'explain', 'analyze code', 'comprehend', 'interpret', 'examine'],
        secondary: ['review', 'study', 'investigate', 'explore', 'learn', 'grasp'],
        context: ['how does', 'what is', 'why does', 'how to understand', 'code analysis']
      },
      [TaskType.CODE_SEARCH]: {
        primary: ['find', 'search', 'locate', 'discover', 'identify'],
        secondary: ['lookup', 'query', 'seek', 'hunt', 'retrieve', 'extract'],
        context: ['where is', 'find all', 'search for', 'locate the', 'grep']
      },
      [TaskType.ARCHITECTURE_ANALYSIS]: {
        primary: ['architecture', 'design', 'structure', 'pattern', 'framework'],
        secondary: ['system design', 'architectural', 'blueprint', 'layout', 'organization'],
        context: ['overall structure', 'system architecture', 'design pattern', 'architectural decision']
      },
      [TaskType.PROBLEM_DIAGNOSIS]: {
        primary: ['debug', 'fix', 'error', 'bug', 'issue', 'problem'],
        secondary: ['troubleshoot', 'resolve', 'solve', 'repair', 'diagnose'],
        context: ['not working', 'broken', 'failing', 'exception', 'crash', 'malfunction']
      },
      [TaskType.CODE_GENERATION]: {
        primary: ['create', 'implement', 'build', 'develop', 'generate', 'write'],
        secondary: ['construct', 'produce', 'make', 'code', 'program', 'craft'],
        context: ['new feature', 'from scratch', 'build a', 'create new', 'implement new']
      },
      [TaskType.INTEGRATION]: {
        primary: ['integrate', 'connect', 'merge', 'combine', 'link'],
        secondary: ['join', 'unite', 'bind', 'attach', 'couple', 'sync'],
        context: ['api integration', 'connect to', 'merge with', 'integrate with']
      },
      [TaskType.TESTING]: {
        primary: ['test', 'verify', 'validate', 'check', 'ensure'],
        secondary: ['confirm', 'prove', 'examine', 'assess', 'evaluate'],
        context: ['unit test', 'integration test', 'test case', 'testing', 'quality assurance']
      },
      [TaskType.DOCUMENTATION]: {
        primary: ['document', 'readme', 'guide', 'manual', 'documentation'],
        secondary: ['explain', 'describe', 'record', 'note', 'comment'],
        context: ['write docs', 'create documentation', 'user guide', 'api docs']
      },
      [TaskType.REFACTORING]: {
        primary: ['refactor', 'restructure', 'clean', 'reorganize', 'improve'],
        secondary: ['optimize code', 'cleanup', 'rewrite', 'modernize', 'simplify'],
        context: ['code quality', 'clean up', 'refactor code', 'improve structure']
      },
      [TaskType.PERFORMANCE_OPTIMIZATION]: {
        primary: ['optimize', 'performance', 'speed', 'efficiency', 'faster'],
        secondary: ['accelerate', 'enhance', 'boost', 'improve performance', 'tune'],
        context: ['make faster', 'improve speed', 'performance issue', 'optimization']
      }
    };

    // 🔥 增强：权重计算
    // Enhanced: Weight calculation
    for (const [taskType, patterns] of Object.entries(keywordPatterns)) {
      const type = taskType as TaskType;
      
      // 主要关键词权重：3分
      patterns.primary.forEach(keyword => {
        if (text.includes(keyword)) {
          typeScores[type] += 3;
        }
      });
      
      // 次要关键词权重：2分
      patterns.secondary.forEach(keyword => {
        if (text.includes(keyword)) {
          typeScores[type] += 2;
        }
      });
      
      // 上下文关键词权重：1分
      patterns.context.forEach(keyword => {
        if (text.includes(keyword)) {
          typeScores[type] += 1;
        }
      });
    }

    // 🔥 增强：语义关联分析
    // Enhanced: Semantic association analysis
    this.applySemanticBoosts(text, typeScores);

    // 找到最高分的任务类型
    let maxScore = 0;
    let bestType = TaskType.CODE_GENERATION; // 默认类型
    
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestType = type as TaskType;
      }
    }

    return bestType;
  }

  /**
   * 应用语义增强
   * Apply semantic boosts
   */
  private static applySemanticBoosts(text: string, typeScores: Record<TaskType, number>): void {
    // 动词-名词组合分析
    if (text.includes('create') && text.includes('function')) {
      typeScores[TaskType.CODE_GENERATION] += 2;
    }
    if (text.includes('fix') && text.includes('bug')) {
      typeScores[TaskType.PROBLEM_DIAGNOSIS] += 2;
    }
    if (text.includes('write') && text.includes('test')) {
      typeScores[TaskType.TESTING] += 2;
    }
    
    // 否定词处理
    if (text.includes('not') || text.includes("don't") || text.includes('avoid')) {
      // 降低所有分数，因为否定词可能改变意图
      Object.keys(typeScores).forEach(type => {
        typeScores[type as TaskType] *= 0.8;
      });
    }
    
    // 技术栈特定增强
    if (text.includes('typescript') || text.includes('javascript')) {
      if (text.includes('type') || text.includes('interface')) {
        typeScores[TaskType.CODE_GENERATION] += 1;
      }
    }
  }

  /**
   * 识别边界情况 - 增强版
   * Identify edge cases - Enhanced version
   * 
   * 🔥 增强功能：集成上下文分析，基于技术栈和项目类型生成特定的边界情况
   * Enhanced: Integrates context analysis to generate specific edge cases based on tech stack and project type
   */
  static identifyEdgeCases(task: Task, taskType: TaskType, relatedFiles: string[] = []): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    // 🔥 新增：获取任务上下文分析
    // New: Get task context analysis
    const taskContext = this.analyzeTaskContext(task, relatedFiles);
    const { techStack, projectType, complexity } = taskContext;

    // 基于任务类型的边界情况（保持原有逻辑）
    // Task type based edge cases (maintain original logic)
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        edgeCases.push({
          type: 'Input Validation',
          description: 'Invalid or unexpected input data formats',
          likelihood: 'HIGH',
          impact: 'MEDIUM',
          testingStrategy: 'Test with boundary values and invalid inputs',
          preventionMeasures: ['Input validation', 'Type checking', 'Error handling']
        });
        break;
      case TaskType.INTEGRATION:
        edgeCases.push({
          type: 'API Compatibility',
          description: 'Version mismatches or API changes',
          likelihood: 'MEDIUM',
          impact: 'HIGH',
          testingStrategy: 'Test with different API versions',
          preventionMeasures: ['Version pinning', 'Compatibility checks', 'Fallback mechanisms']
        });
        break;
      case TaskType.PERFORMANCE_OPTIMIZATION:
        edgeCases.push({
          type: 'Resource Constraints',
          description: 'Memory or CPU limitations under load',
          likelihood: 'MEDIUM',
          impact: 'HIGH',
          testingStrategy: 'Load testing and resource monitoring',
          preventionMeasures: ['Resource monitoring', 'Graceful degradation', 'Caching strategies']
        });
        break;
    }

    // 🔥 新增：基于技术栈的特定边界情况
    // New: Tech stack specific edge cases
    edgeCases.push(...this.getTechStackSpecificEdgeCases(techStack, taskType));

    // 🔥 新增：基于项目类型的特定边界情况
    // New: Project type specific edge cases
    edgeCases.push(...this.getProjectTypeSpecificEdgeCases(projectType, taskType));

    // 🔥 新增：基于复杂度的边界情况
    // New: Complexity based edge cases
    edgeCases.push(...this.getComplexityBasedEdgeCases(complexity, taskType));

    // 通用边界情况（保持原有逻辑）
    // General edge cases (maintain original logic)
    edgeCases.push({
      type: 'Backward Compatibility',
      description: 'Changes may break existing functionality',
      likelihood: 'MEDIUM',
      impact: 'MEDIUM',
      testingStrategy: 'Regression testing and compatibility checks',
      preventionMeasures: ['Version control', 'Feature flags', 'Gradual rollout']
    });

    return edgeCases;
  }

  /**
   * 获取技术栈特定的边界情况
   * Get tech stack specific edge cases
   */
  private static getTechStackSpecificEdgeCases(techStack: string[], taskType: TaskType): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    // React 相关边界情况
    if (techStack.includes('react')) {
      edgeCases.push({
        type: 'React Component Lifecycle',
        description: 'Component unmounting before async operations complete',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Test component mounting/unmounting scenarios',
        preventionMeasures: ['useEffect cleanup', 'AbortController', 'Component state checks']
      });

      edgeCases.push({
        type: 'State Management',
        description: 'State updates on unmounted components or stale closures',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        testingStrategy: 'Test rapid state changes and component lifecycle',
        preventionMeasures: ['Proper cleanup', 'State management libraries', 'Functional updates']
      });
    }

    // TypeScript 相关边界情况
    if (techStack.includes('typescript')) {
      edgeCases.push({
        type: 'Type Safety',
        description: 'Runtime type mismatches despite compile-time checks',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test with dynamic data and external APIs',
        preventionMeasures: ['Runtime validation', 'Type guards', 'Strict TypeScript config']
      });

      edgeCases.push({
        type: 'Generic Type Constraints',
        description: 'Complex generic types causing compilation issues',
        likelihood: 'LOW',
        impact: 'MEDIUM',
        testingStrategy: 'Test with various type combinations',
        preventionMeasures: ['Proper type constraints', 'Type utilities', 'Incremental compilation']
      });
    }

    // Node.js 相关边界情况
    if (techStack.includes('javascript') || techStack.includes('nodejs')) {
      edgeCases.push({
        type: 'Asynchronous Operations',
        description: 'Race conditions and unhandled promise rejections',
        likelihood: 'HIGH',
        impact: 'HIGH',
        testingStrategy: 'Test concurrent operations and error scenarios',
        preventionMeasures: ['Proper async/await', 'Error boundaries', 'Promise.allSettled']
      });

      edgeCases.push({
        type: 'Memory Leaks',
        description: 'Event listeners and closures causing memory leaks',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Memory profiling and long-running tests',
        preventionMeasures: ['Proper cleanup', 'WeakMap/WeakSet', 'Memory monitoring']
      });
    }

    // 🔥 增强：更多技术栈特定边界情况
    // Enhanced: More tech stack specific edge cases

    // Python 相关边界情况
    if (techStack.includes('python')) {
      edgeCases.push({
        type: 'GIL Limitations',
        description: 'Global Interpreter Lock affecting multi-threading performance',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Test CPU-intensive multi-threaded operations',
        preventionMeasures: ['Multiprocessing', 'Async/await', 'C extensions']
      });

      edgeCases.push({
        type: 'Package Dependencies',
        description: 'Version conflicts and missing dependencies in different environments',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        testingStrategy: 'Test in clean virtual environments',
        preventionMeasures: ['Virtual environments', 'Requirements.txt', 'Docker containers']
      });
    }

    // Database 相关边界情况
    if (techStack.includes('sql') || techStack.includes('mongodb')) {
      edgeCases.push({
        type: 'Database Connection Pool',
        description: 'Connection pool exhaustion under high load',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Load testing with concurrent database operations',
        preventionMeasures: ['Connection pooling', 'Connection timeouts', 'Circuit breakers']
      });

      edgeCases.push({
        type: 'Data Consistency',
        description: 'Race conditions in concurrent data modifications',
        likelihood: 'HIGH',
        impact: 'HIGH',
        testingStrategy: 'Test concurrent write operations',
        preventionMeasures: ['Transactions', 'Optimistic locking', 'Database constraints']
      });
    }

    // Docker/Kubernetes 相关边界情况
    if (techStack.includes('docker') || techStack.includes('kubernetes')) {
      edgeCases.push({
        type: 'Container Resource Limits',
        description: 'Application exceeding container memory or CPU limits',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test with resource constraints and monitoring',
        preventionMeasures: ['Resource limits', 'Health checks', 'Horizontal scaling']
      });

      edgeCases.push({
        type: 'Service Discovery',
        description: 'Service unavailability during rolling updates',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Test deployment scenarios and service mesh',
        preventionMeasures: ['Health checks', 'Circuit breakers', 'Graceful shutdown']
      });
    }

    // API 相关边界情况
    if (techStack.includes('rest') || techStack.includes('graphql')) {
      edgeCases.push({
        type: 'Rate Limiting',
        description: 'API rate limits causing request failures',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        testingStrategy: 'Test with high request volumes',
        preventionMeasures: ['Rate limiting', 'Request queuing', 'Exponential backoff']
      });

      edgeCases.push({
        type: 'API Versioning',
        description: 'Breaking changes in API versions affecting clients',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test with multiple API versions',
        preventionMeasures: ['Semantic versioning', 'Backward compatibility', 'Deprecation notices']
      });
    }

    // Python 相关边界情况
    if (techStack.includes('python')) {
      edgeCases.push({
        type: 'GIL Limitations',
        description: 'Global Interpreter Lock affecting concurrent performance',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Test CPU-intensive concurrent operations',
        preventionMeasures: ['Multiprocessing', 'Async/await', 'C extensions']
      });

      edgeCases.push({
        type: 'Package Dependencies',
        description: 'Version conflicts and missing dependencies',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        testingStrategy: 'Test in clean environments and different Python versions',
        preventionMeasures: ['Virtual environments', 'Requirements pinning', 'Dependency management']
      });
    }

    // Database 相关边界情况
    if (techStack.includes('sql') || techStack.includes('mongodb')) {
      edgeCases.push({
        type: 'Database Connection',
        description: 'Connection pool exhaustion and timeout issues',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test under high load and network issues',
        preventionMeasures: ['Connection pooling', 'Timeout configuration', 'Retry mechanisms']
      });

      edgeCases.push({
        type: 'Data Consistency',
        description: 'Race conditions in concurrent database operations',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test concurrent transactions and data modifications',
        preventionMeasures: ['Proper transactions', 'Optimistic locking', 'Database constraints']
      });
    }

    // Docker/Kubernetes 相关边界情况
    if (techStack.includes('docker') || techStack.includes('kubernetes')) {
      edgeCases.push({
        type: 'Container Resource Limits',
        description: 'Memory or CPU limits causing container crashes',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test with resource constraints and load',
        preventionMeasures: ['Proper resource limits', 'Health checks', 'Graceful degradation']
      });

      edgeCases.push({
        type: 'Service Discovery',
        description: 'Network issues affecting service communication',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Test network partitions and service failures',
        preventionMeasures: ['Circuit breakers', 'Retry policies', 'Service mesh']
      });
    }

    return edgeCases;
  }

  /**
   * 获取项目类型特定的边界情况
   * Get project type specific edge cases
   */
  private static getProjectTypeSpecificEdgeCases(projectType: string, taskType: TaskType): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    if (projectType.includes('Frontend') || projectType.includes('Web Application')) {
      edgeCases.push({
        type: 'Browser Compatibility',
        description: 'Different behavior across browsers and versions',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Cross-browser testing and feature detection',
        preventionMeasures: ['Progressive enhancement', 'Polyfills', 'Feature detection']
      });

      edgeCases.push({
        type: 'Performance on Low-End Devices',
        description: 'Poor performance on mobile or older devices',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        testingStrategy: 'Test on various devices and network conditions',
        preventionMeasures: ['Code splitting', 'Lazy loading', 'Performance budgets']
      });
    }

    if (projectType.includes('Backend') || projectType.includes('API')) {
      edgeCases.push({
        type: 'Rate Limiting',
        description: 'API abuse and excessive request rates',
        likelihood: 'HIGH',
        impact: 'HIGH',
        testingStrategy: 'Load testing and abuse simulation',
        preventionMeasures: ['Rate limiting', 'Authentication', 'Request validation']
      });

      edgeCases.push({
        type: 'Data Validation',
        description: 'Malicious or malformed input data',
        likelihood: 'HIGH',
        impact: 'HIGH',
        testingStrategy: 'Security testing and input fuzzing',
        preventionMeasures: ['Input sanitization', 'Schema validation', 'Security headers']
      });
    }

    if (projectType.includes('Mobile')) {
      edgeCases.push({
        type: 'Network Connectivity',
        description: 'Poor or intermittent network connections',
        likelihood: 'HIGH',
        impact: 'MEDIUM',
        testingStrategy: 'Test offline scenarios and poor connectivity',
        preventionMeasures: ['Offline support', 'Data caching', 'Progressive sync']
      });

      edgeCases.push({
        type: 'Battery and Performance',
        description: 'High battery drain and performance issues',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Battery usage testing and performance profiling',
        preventionMeasures: ['Background task optimization', 'Efficient algorithms', 'Resource management']
      });
    }

    return edgeCases;
  }

  /**
   * 获取基于复杂度的边界情况
   * Get complexity based edge cases
   */
  private static getComplexityBasedEdgeCases(complexity: 'LOW' | 'MEDIUM' | 'HIGH', taskType: TaskType): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    if (complexity === 'HIGH') {
      edgeCases.push({
        type: 'System Integration',
        description: 'Complex interactions between multiple system components',
        likelihood: 'HIGH',
        impact: 'HIGH',
        testingStrategy: 'End-to-end testing and integration testing',
        preventionMeasures: ['Modular design', 'Interface contracts', 'Comprehensive testing']
      });

      edgeCases.push({
        type: 'Scalability Issues',
        description: 'Performance degradation under high load or data volume',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        testingStrategy: 'Load testing and stress testing',
        preventionMeasures: ['Horizontal scaling', 'Caching strategies', 'Database optimization']
      });
    }

    if (complexity === 'MEDIUM' || complexity === 'HIGH') {
      edgeCases.push({
        type: 'Configuration Management',
        description: 'Environment-specific configuration issues',
        likelihood: 'MEDIUM',
        impact: 'MEDIUM',
        testingStrategy: 'Test in multiple environments',
        preventionMeasures: ['Environment parity', 'Configuration validation', 'Infrastructure as code']
      });
    }

    return edgeCases;
  }

  /**
   * 定义强制审计检查点 - 增强版
   * Define mandatory audit checkpoints - Enhanced version
   * 
   * 🔥 增强功能：集成上下文分析，基于技术栈和复杂度生成针对性的审查要点
   * Enhanced: Integrates context analysis to generate targeted audit checkpoints based on tech stack and complexity
   */
  static defineMandatoryAudits(task: Task, taskType: TaskType, relatedFiles: string[] = []): AuditCheckpoint[] {
    const audits: AuditCheckpoint[] = [];

    // 🔥 新增：获取任务上下文分析
    // New: Get task context analysis
    const taskContext = this.analyzeTaskContext(task, relatedFiles);
    const { techStack, projectType, complexity } = taskContext;

    // 🔥 新增：获取语义分析结果
    // New: Get semantic analysis results
    const semanticAnalysis = this.performSemanticAnalysis(task);
    const { technicalRequirements, complexityIndicators } = semanticAnalysis;

    // 基于任务类型的审计（保持原有逻辑）
    // Task type based audits (maintain original logic)
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        audits.push({
          name: 'Code Quality Review',
          description: 'Ensure code meets quality standards and best practices',
          mandatory: true,
          timing: 'DURING_EXECUTION',
          criteria: ['Code follows standards', 'Complexity is reasonable', 'Test coverage adequate'],
          tools: ['eslint', 'sonarqube', 'code-review']
        });
        break;
      case TaskType.INTEGRATION:
        audits.push({
          name: 'Integration Testing',
          description: 'Verify integration functionality works correctly',
          mandatory: true,
          timing: 'BEFORE_COMPLETION',
          criteria: ['API calls succeed', 'Data flows correctly', 'Error handling works'],
          tools: ['integration-test', 'api-test', 'monitoring']
        });
        break;
    }

    // 🔥 新增：基于技术栈的特定审查要点
    // New: Tech stack specific audit checkpoints
    audits.push(...this.getTechStackSpecificAudits(techStack, taskType));

    // 🔥 新增：基于项目类型的特定审查要点
    // New: Project type specific audit checkpoints
    audits.push(...this.getProjectTypeSpecificAudits(projectType, taskType));

    // 🔥 新增：基于复杂度的审查深度调整
    // New: Complexity based audit depth adjustment
    audits.push(...this.getComplexityBasedAudits(complexity, complexityIndicators));

    // 🔥 新增：基于技术要求的特定审查
    // New: Technical requirements specific audits
    audits.push(...this.getTechnicalRequirementsAudits(technicalRequirements));

    // 通用审计检查点（保持原有逻辑）
    // General audit checkpoints (maintain original logic)
    audits.push({
      name: 'Security Review',
      description: 'Check for security vulnerabilities and best practices',
      mandatory: true,
      timing: 'BEFORE_COMPLETION',
      criteria: ['No security vulnerabilities', 'Input validation present', 'Access controls proper'],
      tools: ['security-scan', 'vulnerability-check', 'access-review']
    });

    return audits;
  }

  /**
   * 获取技术栈特定的审查要点
   * Get tech stack specific audit checkpoints
   */
  private static getTechStackSpecificAudits(techStack: string[], taskType: TaskType): AuditCheckpoint[] {
    const audits: AuditCheckpoint[] = [];

    // TypeScript 特定审查
    if (techStack.includes('typescript')) {
      audits.push({
        name: 'TypeScript Type Safety Review',
        description: 'Ensure proper TypeScript usage and type safety',
        mandatory: true,
        timing: 'DURING_EXECUTION',
        criteria: [
          'All types properly defined',
          'No any types used without justification',
          'Strict mode enabled',
          'Type guards implemented where needed'
        ],
        tools: ['tsc', 'typescript-eslint', 'type-coverage']
      });
    }

    // React 特定审查
    if (techStack.includes('react')) {
      audits.push({
        name: 'React Component Review',
        description: 'Ensure React best practices and component design',
        mandatory: true,
        timing: 'DURING_EXECUTION',
        criteria: [
          'Components are properly structured',
          'Hooks usage follows rules',
          'Props are properly typed',
          'State management is appropriate',
          'Effect cleanup is implemented'
        ],
        tools: ['react-hooks-eslint', 'react-testing-library', 'react-devtools']
      });
    }

    // Node.js 特定审查
    if (techStack.includes('javascript') || techStack.includes('nodejs')) {
      audits.push({
        name: 'Node.js Async Safety Review',
        description: 'Ensure proper async/await usage and error handling',
        mandatory: true,
        timing: 'DURING_EXECUTION',
        criteria: [
          'Async operations properly handled',
          'Promise rejections caught',
          'No callback hell',
          'Error propagation correct',
          'Memory leaks prevented'
        ],
        tools: ['node-clinic', 'async-hooks', 'promise-lint']
      });
    }

    // Python 特定审查
    if (techStack.includes('python')) {
      audits.push({
        name: 'Python Code Quality Review',
        description: 'Ensure Python best practices and PEP compliance',
        mandatory: true,
        timing: 'DURING_EXECUTION',
        criteria: [
          'PEP 8 style compliance',
          'Type hints properly used',
          'Exception handling appropriate',
          'Virtual environment used',
          'Dependencies properly managed'
        ],
        tools: ['black', 'flake8', 'mypy', 'bandit']
      });
    }

    // 数据库相关审查
    if (techStack.includes('sql') || techStack.includes('mongodb')) {
      audits.push({
        name: 'Database Security Review',
        description: 'Ensure database operations are secure and efficient',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'SQL injection prevention',
          'Connection pooling implemented',
          'Transactions properly handled',
          'Indexes optimized',
          'Data validation present'
        ],
        tools: ['sqlmap', 'db-migrate', 'query-analyzer']
      });
    }

    // Docker/Kubernetes 特定审查
    if (techStack.includes('docker') || techStack.includes('kubernetes')) {
      audits.push({
        name: 'Container Security Review',
        description: 'Ensure container and orchestration security',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Base images are secure',
          'Resource limits defined',
          'Secrets properly managed',
          'Network policies configured',
          'Health checks implemented'
        ],
        tools: ['docker-bench', 'kube-score', 'trivy']
      });
    }

    return audits;
  }

  /**
   * 获取项目类型特定的审查要点
   * Get project type specific audit checkpoints
   */
  private static getProjectTypeSpecificAudits(projectType: string, taskType: TaskType): AuditCheckpoint[] {
    const audits: AuditCheckpoint[] = [];

    if (projectType.includes('Frontend') || projectType.includes('Web Application')) {
      audits.push({
        name: 'Frontend Performance Review',
        description: 'Ensure frontend performance and accessibility standards',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Bundle size optimized',
          'Loading performance acceptable',
          'Accessibility standards met',
          'Cross-browser compatibility',
          'Mobile responsiveness'
        ],
        tools: ['lighthouse', 'webpack-bundle-analyzer', 'axe-core']
      });
    }

    if (projectType.includes('Backend') || projectType.includes('API')) {
      audits.push({
        name: 'API Security Review',
        description: 'Ensure API security and performance standards',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Authentication implemented',
          'Authorization checks present',
          'Rate limiting configured',
          'Input validation comprehensive',
          'API documentation updated'
        ],
        tools: ['owasp-zap', 'postman', 'swagger-validator']
      });
    }

    if (projectType.includes('Mobile')) {
      audits.push({
        name: 'Mobile Performance Review',
        description: 'Ensure mobile app performance and user experience',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Battery usage optimized',
          'Network efficiency maintained',
          'Offline functionality works',
          'Platform guidelines followed',
          'Performance on low-end devices'
        ],
        tools: ['xcode-instruments', 'android-profiler', 'flipper']
      });
    }

    return audits;
  }

  /**
   * 获取基于复杂度的审查要点
   * Get complexity based audit checkpoints
   */
  private static getComplexityBasedAudits(complexity: string, complexityIndicators: any): AuditCheckpoint[] {
    const audits: AuditCheckpoint[] = [];

    if (complexity === 'HIGH') {
      audits.push({
        name: 'Architecture Review',
        description: 'Comprehensive architecture and design review for high complexity',
        mandatory: true,
        timing: 'DURING_EXECUTION',
        criteria: [
          'Architecture patterns appropriate',
          'Scalability considerations addressed',
          'Performance bottlenecks identified',
          'Monitoring and logging comprehensive',
          'Documentation complete'
        ],
        tools: ['sonarqube', 'architecture-decision-records', 'performance-profiler']
      });

      audits.push({
        name: 'Integration Testing',
        description: 'Comprehensive integration testing for complex systems',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'End-to-end scenarios tested',
          'System integration verified',
          'Performance under load tested',
          'Failure scenarios handled',
          'Recovery procedures tested'
        ],
        tools: ['cypress', 'k6', 'chaos-engineering']
      });
    }

    if (complexity === 'MEDIUM' || complexity === 'HIGH') {
      audits.push({
        name: 'Code Review',
        description: 'Thorough code review for medium to high complexity',
        mandatory: true,
        timing: 'DURING_EXECUTION',
        criteria: [
          'Code structure is clear',
          'Error handling comprehensive',
          'Performance considerations addressed',
          'Security best practices followed',
          'Test coverage adequate'
        ],
        tools: ['code-review-tools', 'static-analysis', 'test-coverage']
      });
    }

    return audits;
  }

  /**
   * 获取基于技术要求的特定审查
   * Get technical requirements specific audits
   */
  private static getTechnicalRequirementsAudits(technicalRequirements: any): AuditCheckpoint[] {
    const audits: AuditCheckpoint[] = [];

    // 性能要求相关审查
    if (technicalRequirements.performance && technicalRequirements.performance.length > 0) {
      audits.push({
        name: 'Performance Requirements Review',
        description: 'Verify performance requirements are met',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Response times within limits',
          'Throughput requirements met',
          'Resource usage optimized',
          'Scalability targets achieved'
        ],
        tools: ['performance-testing', 'load-testing', 'profiling']
      });
    }

    // 安全要求相关审查
    if (technicalRequirements.security && technicalRequirements.security.length > 0) {
      audits.push({
        name: 'Security Requirements Review',
        description: 'Verify security requirements are implemented',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Authentication mechanisms secure',
          'Data encryption implemented',
          'Access controls enforced',
          'Security vulnerabilities addressed'
        ],
        tools: ['security-scanner', 'penetration-testing', 'vulnerability-assessment']
      });
    }

    // 可扩展性要求相关审查
    if (technicalRequirements.scalability && technicalRequirements.scalability.length > 0) {
      audits.push({
        name: 'Scalability Requirements Review',
        description: 'Verify scalability requirements are addressed',
        mandatory: true,
        timing: 'BEFORE_COMPLETION',
        criteria: [
          'Horizontal scaling supported',
          'Database scaling considered',
          'Caching strategies implemented',
          'Load balancing configured'
        ],
        tools: ['load-testing', 'scaling-simulation', 'capacity-planning']
      });
    }

    return audits;
  }

  /**
   * 分析是否需要拆分任务
   * Analyze if task decomposition is needed
   */
  static analyzeDecomposition(task: Task, complexityAssessment?: ComplexityAssessment): DecompositionRecommendation {
    const shouldDecompose = this.shouldDecomposeTask(task, complexityAssessment);

    if (!shouldDecompose) {
      return {
        shouldDecompose: false,
        suggestedSubtasks: [],
        decompositionRationale: 'Task complexity is manageable as a single unit'
      };
    }

    const suggestedSubtasks = this.generateSubtaskSuggestions(task);

    return {
      shouldDecompose,
      suggestedSubtasks,
      decompositionRationale: 'Task complexity suggests decomposition would improve success rate and maintainability'
    };
  }

  /**
   * 判断是否需要拆分
   * Determine if decomposition is needed
   */
  private static shouldDecomposeTask(task: Task, complexityAssessment?: ComplexityAssessment): boolean {
    // 基于复杂度评估
    if (complexityAssessment?.level === 'VERY_HIGH') return true;
    if (complexityAssessment?.level === 'HIGH' && task.dependencies.length > 2) return true;

    // 基于描述长度
    if (task.description.length > 800) return true;

    // 基于关键词检测
    const complexityKeywords = ['multiple', 'various', 'several', 'complex', 'comprehensive'];
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();
    const keywordCount = complexityKeywords.filter(keyword => text.includes(keyword)).length;

    return keywordCount >= 2;
  }

  /**
   * 生成子任务建议
   * Generate subtask suggestions
   */
  private static generateSubtaskSuggestions(task: Task) {
    const suggestions = [];
    const taskType = this.classifyTaskType(task);

    // 基于任务类型生成建议
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        suggestions.push(
          {
            name: 'Design and Planning',
            description: 'Define interfaces, data structures, and implementation approach',
            estimatedComplexity: 'MEDIUM' as const,
            dependencies: []
          },
          {
            name: 'Core Implementation',
            description: 'Implement main functionality and business logic',
            estimatedComplexity: 'HIGH' as const,
            dependencies: ['Design and Planning']
          },
          {
            name: 'Testing and Validation',
            description: 'Create tests and validate functionality',
            estimatedComplexity: 'MEDIUM' as const,
            dependencies: ['Core Implementation']
          }
        );
        break;
      case TaskType.INTEGRATION:
        suggestions.push(
          {
            name: 'Interface Analysis',
            description: 'Analyze existing interfaces and integration points',
            estimatedComplexity: 'MEDIUM' as const,
            dependencies: []
          },
          {
            name: 'Integration Implementation',
            description: 'Implement integration logic and data mapping',
            estimatedComplexity: 'HIGH' as const,
            dependencies: ['Interface Analysis']
          }
        );
        break;
    }

    return suggestions;
  }

  // 🔥 新增：增强任务分析深度的方法
  // New: Enhanced task analysis depth methods

  /**
   * 分析任务上下文 - 核心增强方法
   * Analyze task context - Core enhancement method
   */
  static analyzeTaskContext(task: Task, relatedFiles: string[] = []): TaskContext {
    const techStack = this.detectTechStack(task, relatedFiles);
    const projectType = this.detectProjectType(task, techStack);
    const complexity = this.assessProjectComplexity(task, techStack, relatedFiles);
    
    return {
      techStack,
      projectType,
      complexity,
      analyzedAt: new Date().toISOString(),
      relatedFilesCount: relatedFiles.length,
      taskType: this.classifyTaskType(task)
    };
  }

  /**
   * 检测技术栈 - 增强版
   * Detect technology stack - Enhanced version
   */
  static detectTechStack(task: Task, relatedFiles: string[] = []): string[] {
    const techStack = new Set<string>();
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();
    
    // 🔥 增强：扩展技术栈检测词典
    // Enhanced: Extended technology stack detection dictionary
    const techKeywords = {
      // 前端框架和库
      'typescript': ['typescript', 'ts', '.ts', 'tsc', 'tsconfig', 'type script', 'ts-node'],
      'javascript': ['javascript', 'js', '.js', 'node.js', 'nodejs', 'node js', 'ecmascript', 'es6', 'es2015'],
      'react': ['react', 'jsx', 'tsx', 'component', 'hook', 'react.js', 'reactjs', 'useState', 'useEffect'],
      'vue': ['vue', 'vue.js', 'vuejs', '.vue', 'vue3', 'composition api', 'vue-cli'],
      'angular': ['angular', 'ng', '@angular', 'angular.js', 'angularjs', 'angular cli'],
      'svelte': ['svelte', 'sveltekit', 'svelte.js'],
      'solid': ['solid.js', 'solidjs', 'solid js'],
      
      // 后端语言和框架
      'python': ['python', 'py', '.py', 'pip', 'django', 'flask', 'fastapi', 'python3', 'pypi'],
      'java': ['java', '.java', 'spring', 'maven', 'gradle', 'spring boot', 'jvm', 'openjdk'],
      'csharp': ['c#', 'csharp', '.cs', '.net', 'dotnet', 'asp.net', 'entity framework'],
      'go': ['golang', 'go', '.go', 'go mod', 'gofmt'],
      'rust': ['rust', '.rs', 'cargo', 'rustc', 'rust lang'],
      'php': ['php', '.php', 'laravel', 'symfony', 'composer', 'php7', 'php8'],
      'ruby': ['ruby', '.rb', 'rails', 'gem', 'bundler', 'ruby on rails'],
      'swift': ['swift', '.swift', 'ios', 'xcode', 'cocoapods'],
      'kotlin': ['kotlin', '.kt', 'android', 'gradle kotlin'],
      
      // 前端技术
      'html': ['html', '.html', 'dom', 'html5', 'semantic html'],
      'css': ['css', '.css', 'scss', 'sass', 'less', 'css3', 'flexbox', 'grid'],
      'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
      'bootstrap': ['bootstrap', 'bootstrap css'],
      
      // 数据库
      'sql': ['sql', 'database', 'mysql', 'postgresql', 'sqlite', 'mariadb', 'sql server'],
      'mongodb': ['mongodb', 'mongo', 'nosql', 'mongoose'],
      'redis': ['redis', 'cache', 'redis cache'],
      'elasticsearch': ['elasticsearch', 'elastic search', 'es'],
      
      // 云服务和部署
      'docker': ['docker', 'dockerfile', 'container', 'docker-compose'],
      'kubernetes': ['kubernetes', 'k8s', 'kubectl', 'helm'],
      'aws': ['aws', 'amazon', 'ec2', 's3', 'lambda', 'cloudformation', 'aws cli'],
      'azure': ['azure', 'microsoft cloud', 'azure functions'],
      'gcp': ['gcp', 'google cloud', 'firebase', 'gcloud'],
      'vercel': ['vercel', 'vercel deployment'],
      'netlify': ['netlify', 'netlify deployment'],
      
      // Node.js 生态
      'express': ['express', 'express.js', 'expressjs'],
      'fastify': ['fastify', 'fastify.js'],
      'nestjs': ['nestjs', 'nest.js', 'nest js'],
      'nextjs': ['nextjs', 'next.js', 'next js', 'next.js app'],
      'nuxtjs': ['nuxtjs', 'nuxt.js', 'nuxt js'],
      'gatsby': ['gatsby', 'gatsbyjs', 'gatsby.js'],
      
      // 构建工具
      'webpack': ['webpack', 'bundler', 'webpack config'],
      'vite': ['vite', 'vitejs', 'vite.js'],
      'rollup': ['rollup', 'rollup.js'],
      'parcel': ['parcel', 'parcel bundler'],
      'esbuild': ['esbuild', 'es build'],
      
      // 测试框架
      'jest': ['jest', 'testing', 'jest test'],
      'cypress': ['cypress', 'e2e', 'cypress test'],
      'playwright': ['playwright', 'playwright test'],
      'vitest': ['vitest', 'vite test'],
      'mocha': ['mocha', 'mocha test'],
      'jasmine': ['jasmine', 'jasmine test'],
      
      // 版本控制和CI/CD
      'git': ['git', 'github', 'gitlab', 'version control', 'git flow'],
      'github-actions': ['github actions', 'gh actions', 'workflow'],
      'jenkins': ['jenkins', 'jenkins ci'],
      'circleci': ['circleci', 'circle ci'],
      
      // 移动开发
      'react-native': ['react native', 'react-native', 'rn'],
      'flutter': ['flutter', 'dart', 'flutter app'],
      'ionic': ['ionic', 'ionic framework'],
      
      // 其他工具
      'graphql': ['graphql', 'graph ql', 'apollo'],
      'rest': ['rest api', 'restful', 'rest'],
      'websocket': ['websocket', 'ws', 'socket.io'],
      'grpc': ['grpc', 'protocol buffers'],
      'microservices': ['microservices', 'micro services'],
      'serverless': ['serverless', 'lambda functions', 'functions as a service']
    };

    // 🔥 增强：权重计算和上下文分析
    // Enhanced: Weight calculation and context analysis
    const techScores: Record<string, number> = {};
    
    for (const [tech, keywords] of Object.entries(techKeywords)) {
      techScores[tech] = 0;
      
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          // 基础分数
          techScores[tech] += 1;
          
          // 🔥 上下文增强
          // Context enhancement
          if (text.includes(`${keyword} project`) || text.includes(`${keyword} application`)) {
            techScores[tech] += 2;
          }
          if (text.includes(`using ${keyword}`) || text.includes(`with ${keyword}`)) {
            techScores[tech] += 1;
          }
        }
      });
    }

    // 添加得分超过阈值的技术栈
    for (const [tech, score] of Object.entries(techScores)) {
      if (score > 0) {
        techStack.add(tech);
      }
    }

    // 基于相关文件扩展名的技术栈检测
    const fileExtensions = relatedFiles.map(file => {
      const ext = file.split('.').pop()?.toLowerCase();
      return ext;
    }).filter(Boolean);

    const extensionTechMap: Record<string, string[]> = {
      'ts': ['typescript'],
      'tsx': ['typescript', 'react'],
      'js': ['javascript'],
      'jsx': ['javascript', 'react'],
      'vue': ['vue'],
      'py': ['python'],
      'java': ['java'],
      'cs': ['csharp'],
      'go': ['go'],
      'rs': ['rust'],
      'php': ['php'],
      'rb': ['ruby'],
      'swift': ['swift'],
      'kt': ['kotlin'],
      'html': ['html'],
      'css': ['css'],
      'scss': ['css'],
      'sass': ['css'],
      'less': ['css'],
      'sql': ['sql'],
      'dockerfile': ['docker'],
      'yaml': ['kubernetes'],
      'yml': ['kubernetes'],
      'json': ['javascript'] // 通常与 JS 项目相关
    };

    fileExtensions.forEach(ext => {
      if (ext && extensionTechMap[ext]) {
        extensionTechMap[ext].forEach(tech => techStack.add(tech));
      }
    });

    // 智能推断：基于技术栈组合
    const stackArray = Array.from(techStack);
    
    // 如果有 React 但没有明确的 JS/TS，推断为前端项目
    if (stackArray.includes('react') && !stackArray.includes('javascript') && !stackArray.includes('typescript')) {
      techStack.add('javascript');
    }
    
    // 如果有 Express 但没有 Node.js，添加 Node.js
    if (stackArray.includes('express') && !stackArray.includes('javascript')) {
      techStack.add('javascript');
      techStack.add('nodejs');
    }

    return Array.from(techStack);
  }

  /**
   * 检测项目类型
   * Detect project type
   */
  static detectProjectType(task: Task, techStack: string[]): string {
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();
    
    // 基于技术栈推断项目类型
    if (techStack.includes('react') || techStack.includes('vue') || techStack.includes('angular')) {
      if (techStack.includes('nextjs') || techStack.includes('nuxtjs')) {
        return 'Full-Stack Web Application';
      }
      return 'Frontend Web Application';
    }
    
    if (techStack.includes('express') || techStack.includes('fastapi') || techStack.includes('nestjs')) {
      return 'Backend API Service';
    }
    
    if (techStack.includes('swift') || techStack.includes('kotlin')) {
      return 'Mobile Application';
    }
    
    if (techStack.includes('docker') || techStack.includes('kubernetes')) {
      return 'DevOps/Infrastructure';
    }
    
    if (techStack.includes('sql') || techStack.includes('mongodb')) {
      return 'Database/Data Management';
    }
    
    // 基于任务描述的项目类型检测
    const typeKeywords = {
      'web application': ['web app', 'website', 'frontend', 'backend', 'full stack'],
      'mobile app': ['mobile', 'ios', 'android', 'app store', 'play store'],
      'api service': ['api', 'rest', 'graphql', 'microservice', 'service'],
      'library/framework': ['library', 'framework', 'package', 'npm', 'pip'],
      'cli tool': ['cli', 'command line', 'terminal', 'script'],
      'desktop application': ['desktop', 'electron', 'gui'],
      'data processing': ['data', 'etl', 'pipeline', 'analytics'],
      'machine learning': ['ml', 'ai', 'model', 'training', 'prediction'],
      'devops/infrastructure': ['devops', 'ci/cd', 'deployment', 'infrastructure'],
      'testing/qa': ['test', 'testing', 'qa', 'quality assurance']
    };
    
    for (const [type, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }
    
    // 默认基于主要技术栈
    if (techStack.includes('javascript') || techStack.includes('typescript')) {
      return 'JavaScript/TypeScript Project';
    }
    
    if (techStack.includes('python')) {
      return 'Python Project';
    }
    
    return 'General Software Project';
  }

  /**
   * 评估项目复杂度
   * Assess project complexity
   */
  static assessProjectComplexity(task: Task, techStack: string[], relatedFiles: string[] = []): 'LOW' | 'MEDIUM' | 'HIGH' {
    let complexityScore = 0;
    
    // 基于技术栈数量
    if (techStack.length >= 5) complexityScore += 3;
    else if (techStack.length >= 3) complexityScore += 2;
    else if (techStack.length >= 1) complexityScore += 1;
    
    // 基于相关文件数量
    if (relatedFiles.length >= 10) complexityScore += 3;
    else if (relatedFiles.length >= 5) complexityScore += 2;
    else if (relatedFiles.length >= 2) complexityScore += 1;
    
    // 基于任务描述复杂度
    const text = `${task.description} ${task.implementationGuide || ''}`;
    if (text.length >= 500) complexityScore += 2;
    else if (text.length >= 200) complexityScore += 1;
    
    // 基于复杂度关键词
    const complexityKeywords = [
      'integration', 'microservice', 'distributed', 'scalable', 'performance',
      'security', 'authentication', 'authorization', 'real-time', 'concurrent',
      'async', 'parallel', 'optimization', 'algorithm', 'architecture'
    ];
    
    const keywordMatches = complexityKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    ).length;
    
    complexityScore += Math.min(keywordMatches, 4);
    
    // 基于依赖数量
    if (task.dependencies.length >= 3) complexityScore += 2;
    else if (task.dependencies.length >= 1) complexityScore += 1;
    
    // 复杂度评分转换
    if (complexityScore >= 8) return 'HIGH';
    if (complexityScore >= 4) return 'MEDIUM';
    return 'LOW';
  }

  // 🔥 新增：语义分析能力
  // New: Semantic analysis capability

  /**
   * 执行语义分析 - 增强版
   * Perform semantic analysis - Enhanced version
   */
  static performSemanticAnalysis(task: Task, config: SemanticAnalysisConfig = {
    enableDeepAnalysis: true,
    extractEntities: true,
    analyzeSentiment: true,
    maxKeywords: 20,
    minConfidence: 0.7
  }): SemanticAnalysis {
    const text = `${task.description} ${task.implementationGuide || ''}`;
    
    // 🔥 增强：预处理文本，提取更多上下文信息
    // Enhanced: Preprocess text and extract more contextual information
    const preprocessedText = this.preprocessText(text);
    const contextualInfo = this.extractContextualInfo(task);
    
    // 操作类型识别 - 保持兼容性
    const operationType = this.identifyOperationType(preprocessedText);
    
    // 技术要求提取 - 保持兼容性
    const technicalRequirements = this.extractTechnicalRequirements(preprocessedText);
    
    // 复杂度指标分析 - 保持兼容性
    const complexityIndicators = this.analyzeComplexityIndicators(preprocessedText, task);
    
    // 关键要素提取 - 保持兼容性
    const keyElements = this.extractKeyElements(preprocessedText);
    
    // 预期结果分析 - 保持兼容性
    const expectedOutcomes = this.analyzeExpectedOutcomes(preprocessedText);
    
    // 关键词提取 - 保持兼容性
    const keywords = this.extractKeywords(preprocessedText, config.maxKeywords);
    
    // 实体识别 - 保持兼容性
    const entities = config.extractEntities ? this.extractEntities(preprocessedText) : [];
    
    // 情感分析 - 保持兼容性
    const sentiment = config.analyzeSentiment ? this.analyzeSentiment(preprocessedText) : 'NEUTRAL';
    
    // 紧急程度分析 - 保持兼容性
    const urgency = this.analyzeUrgency(preprocessedText);
    
    // 🔥 新增：风险评估
    // New: Risk assessment
    const riskAssessment = this.assessRisks(preprocessedText, operationType, complexityIndicators);
    
    // 🔥 新增：技术栈兼容性分析
    // New: Tech stack compatibility analysis
    const techStackCompatibility = this.analyzeTechStackCompatibility(contextualInfo.techStack);
    
    // 计算置信度 - 保持兼容性
    const confidence = this.calculateConfidence(preprocessedText, operationType, technicalRequirements);
    
    return {
      operationType,
      technicalRequirements,
      complexityIndicators,
      keyElements,
      expectedOutcomes,
      keywords,
      entities,
      sentiment,
      urgency,
      confidence,
      riskAssessment,
      techStackCompatibility,
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * 🔥 新增：预处理文本
   * New: Preprocess text
   */
  private static preprocessText(text: string): string {
    // 标准化文本
    let processed = text.toLowerCase().trim();
    
    // 移除多余空格
    processed = processed.replace(/\s+/g, ' ');
    
    // 标准化常见缩写
    const abbreviations: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'api': 'application programming interface',
      'ui': 'user interface',
      'ux': 'user experience',
      'db': 'database',
      'ci/cd': 'continuous integration continuous deployment'
    };
    
    for (const [abbr, full] of Object.entries(abbreviations)) {
      processed = processed.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
    }
    
    return processed;
  }

  /**
   * 🔥 新增：提取上下文信息
   * New: Extract contextual information
   */
  private static extractContextualInfo(task: Task): ContextualInfo {
    const relatedFiles = task.relatedFiles?.map(f => f.path) || [];
    const techStack = this.detectTechStack(task, relatedFiles);
    const projectType = this.detectProjectType(task, techStack);
    
    return {
      techStack,
      projectType,
      relatedFiles,
      hasTests: relatedFiles.some(f => f.includes('test') || f.includes('spec')),
      hasDocumentation: relatedFiles.some(f => f.includes('readme') || f.includes('doc')),
      dependencyCount: task.dependencies?.length || 0,
      estimatedSize: this.estimateTaskSize(task)
    };
  }

  /**
   * 🔥 新增：估计任务大小
   * New: Estimate task size
   */
  private static estimateTaskSize(task: Task): 'SMALL' | 'MEDIUM' | 'LARGE' {
    const descriptionLength = task.description.length;
    const implementationLength = task.implementationGuide?.length || 0;
    const relatedFilesCount = task.relatedFiles?.length || 0;
    const dependenciesCount = task.dependencies?.length || 0;
    
    const totalComplexity = descriptionLength + implementationLength + (relatedFilesCount * 50) + (dependenciesCount * 30);
    
    if (totalComplexity < 300) return 'SMALL';
    if (totalComplexity < 800) return 'MEDIUM';
    return 'LARGE';
  }

  /**
   * 🔥 新增：风险评估
   * New: Risk assessment
   */
  private static assessRisks(text: string, operationType: OperationType, complexityIndicators: ComplexityIndicators): RiskAssessment {
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];
    
    let technicalRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let businessRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let timeRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    // 基于操作类型评估风险
    switch (operationType) {
      case OperationType.CREATE:
        technicalRisk = 'MEDIUM';
        riskFactors.push('新功能可能引入未知问题');
        mitigationStrategies.push('充分的单元测试和集成测试');
        break;
      case OperationType.MODIFY:
        businessRisk = 'MEDIUM';
        riskFactors.push('修改可能影响现有功能');
        mitigationStrategies.push('回归测试和功能验证');
        break;
      case OperationType.INTEGRATE:
        technicalRisk = 'HIGH';
        riskFactors.push('集成可能导致兼容性问题');
        mitigationStrategies.push('接口测试和兼容性验证');
        break;
    }
    
    // 基于复杂度评估时间风险
    if (complexityIndicators.complexityScore > 70) {
      timeRisk = 'HIGH';
      riskFactors.push('高复杂度可能导致开发时间超预期');
      mitigationStrategies.push('任务拆分和里程碑管理');
    }
    
    return {
      technicalRisk,
      businessRisk,
      timeRisk,
      riskFactors,
      mitigationStrategies
    };
  }

  /**
   * 🔥 新增：技术栈兼容性分析
   * New: Tech stack compatibility analysis
   */
  private static analyzeTechStackCompatibility(techStack: string[]): TechStackCompatibility {
    const potentialConflicts: string[] = [];
    const recommendedConfigurations: string[] = [];
    let compatibilityScore = 100;
    
    // 检查常见的技术栈冲突
    if (techStack.includes('react') && techStack.includes('vue')) {
      potentialConflicts.push('React和Vue不应在同一项目中使用');
      compatibilityScore -= 30;
    }
    
    if (techStack.includes('typescript') && techStack.includes('javascript')) {
      recommendedConfigurations.push('建议统一使用TypeScript以获得更好的类型安全');
      compatibilityScore -= 5;
    }
    
    // 推荐配置
    if (techStack.includes('react')) {
      recommendedConfigurations.push('建议使用React 18+和函数组件');
    }
    
    if (techStack.includes('nodejs')) {
      recommendedConfigurations.push('建议使用Node.js 18+LTS版本');
    }
    
    return {
      compatibilityScore: Math.max(0, compatibilityScore),
      potentialConflicts,
      recommendedConfigurations
    };
  }

  /**
   * 专门用于任务拆分的语义分析
   * Semantic analysis specifically for task splitting
   */
  static analyzeForTaskSplitting(task: Task, config: SemanticAnalysisConfig = {
    enableDeepAnalysis: true,
    extractEntities: true,
    analyzeSentiment: true,
    maxKeywords: 20,
    minConfidence: 0.7
  }): TaskSplittingSemanticAnalysis {
    // 首先执行基础语义分析
    const baseAnalysis = this.performSemanticAnalysis(task, config);
    
    // 分析任务优先级
    const priority = this.analyzePriority(baseAnalysis.operationType, baseAnalysis.complexityIndicators, baseAnalysis.urgency);
    
    // 分析拆分建议
    const splitRecommendation = this.analyzeSplitRecommendation(task, baseAnalysis);
    
    // 生成依赖关系提示
    const dependencyHints = this.generateDependencyHints(baseAnalysis);
    
    // 生成实施指导增强
    const implementationGuidance = this.generateImplementationGuidance(baseAnalysis);
    
    // 生成验证标准建议
    const verificationSuggestions = this.generateVerificationSuggestions(baseAnalysis);
    
    return {
      ...baseAnalysis,
      priority,
      splitRecommendation,
      dependencyHints,
      implementationGuidance,
      verificationSuggestions
    };
  }

  /**
   * 分析任务优先级
   * Analyze task priority
   */
  private static analyzePriority(
    operationType: OperationType, 
    complexityIndicators: ComplexityIndicators, 
    urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  ): 'P0' | 'P1' | 'P2' {
    // P0: 核心功能，高紧急度，或者是基础设施类型
    if (urgency === 'HIGH' || 
        operationType === OperationType.CREATE || 
        operationType === OperationType.DEBUG ||
        complexityIndicators.complexityScore >= 70) {
      return 'P0';
    }
    
    // P1: 重要功能，中等紧急度
    if (urgency === 'MEDIUM' || 
        operationType === OperationType.MODIFY ||
        operationType === OperationType.INTEGRATE ||
        complexityIndicators.complexityScore >= 40) {
      return 'P1';
    }
    
    // P2: 优化和增强功能
    return 'P2';
  }

  /**
   * 分析拆分建议 - 彻底重写版本
   * Analyze split recommendation - Complete rewrite
   */
  private static analyzeSplitRecommendation(task: Task, analysis: SemanticAnalysis): {
    shouldSplit: boolean;
    suggestedSubtasks: number;
    reason: string;
  } {
    const { complexityIndicators, keyElements } = analysis;
    const descriptionLength = task.description.length;
    const dependenciesCount = task.dependencies?.length || 0;
    const relatedFilesCount = task.relatedFiles?.length || 0;
    
    // 🔥 CRITICAL FIX: 重写拆分逻辑，使用合理阈值
    // 基于描述长度的智能拆分（大幅降低阈值）
    if (descriptionLength > 150) {
      const suggestedSubtasks = Math.min(Math.ceil(descriptionLength / 100), 8);
      return {
        shouldSplit: true,
        suggestedSubtasks,
        reason: `任务描述较长（${descriptionLength}字符），建议拆分为${suggestedSubtasks}个子任务以提高执行效率`
      };
    }
    
    // 基于核心功能数量的拆分（降低阈值）
    if (keyElements.coreFunctions.length > 1) {
      return {
        shouldSplit: true,
        suggestedSubtasks: Math.min(keyElements.coreFunctions.length, 6),
        reason: `包含多个核心功能（${keyElements.coreFunctions.length}个），建议按功能模块拆分`
      };
    }
    
    // 基于技术栈复杂度的拆分（降低阈值）
    const techStackCount = analysis.technicalRequirements.techStack.length;
    if (techStackCount > 2) {
      return {
        shouldSplit: true,
        suggestedSubtasks: Math.min(Math.ceil(techStackCount / 2) + 1, 5),
        reason: `涉及多个技术栈（${techStackCount}个），建议按技术层次拆分`
      };
    }
    
    // 基于依赖关系的拆分（降低阈值）
    if (dependenciesCount > 2) {
      return {
        shouldSplit: true,
        suggestedSubtasks: Math.min(Math.ceil(dependenciesCount / 2), 4),
        reason: `依赖关系较多（${dependenciesCount}个），建议拆分以降低耦合度`
      };
    }
    
    // 基于相关文件数量的拆分
    if (relatedFilesCount > 3) {
      return {
        shouldSplit: true,
        suggestedSubtasks: Math.min(Math.ceil(relatedFilesCount / 3), 5),
        reason: `涉及多个文件（${relatedFilesCount}个），建议按文件组织拆分`
      };
    }
    
    // 基于关键词密度的拆分判断
    const keywordCount = analysis.keywords.length;
    if (keywordCount > 8) {
      return {
        shouldSplit: true,
        suggestedSubtasks: Math.min(Math.ceil(keywordCount / 5), 4),
        reason: `任务涉及概念较多（${keywordCount}个关键词），建议按主题拆分`
      };
    }
    
    // 基于任务复杂度评分的拆分（大幅降低阈值）
    if (complexityIndicators.complexityScore > 15) {
      const suggestedSubtasks = Math.min(Math.ceil(complexityIndicators.complexityScore / 20), 6);
      return {
        shouldSplit: true,
        suggestedSubtasks,
        reason: `任务复杂度较高（评分: ${complexityIndicators.complexityScore}），建议拆分为${suggestedSubtasks}个子任务`
      };
    }
    
    // 特殊关键词检测 - 强制拆分
    const forceVSplitKeywords = [
      '电商', 'e-commerce', '购物网站', '在线商店', 'shopping', 'marketplace',
      '用户系统', '管理后台', '支付', 'payment', '订单', 'order',
      '微服务', 'microservice', '分布式', 'distributed',
      '完整', 'complete', '整套', '全套', 'full system'
    ];
    
    const taskText = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();
    const hasForceVSplitKeyword = forceVSplitKeywords.some(keyword => taskText.includes(keyword));
    
    if (hasForceVSplitKeyword) {
      return {
        shouldSplit: true,
        suggestedSubtasks: 6,
        reason: '检测到复杂项目关键词，建议拆分为多个独立模块进行开发'
      };
    }
    
    // 只有非常简单的任务才不拆分
    if (descriptionLength < 30 && keywordCount < 3 && techStackCount < 2) {
      return {
        shouldSplit: false,
        suggestedSubtasks: 1,
        reason: '任务较为简单，可作为单一任务执行'
      };
    }
    
    // 默认建议拆分（更积极的拆分策略）
    return {
      shouldSplit: true,
      suggestedSubtasks: 3,
      reason: '为提高开发效率和代码质量，建议进行适当拆分'
    };
  }

  /**
   * 生成依赖关系提示
   * Generate dependency hints
   */
  private static generateDependencyHints(analysis: SemanticAnalysis): string[] {
    const hints: string[] = [];
    const { operationType, technicalRequirements, keyElements } = analysis;
    
    // 基于操作类型的依赖提示
    switch (operationType) {
      case OperationType.CREATE:
        hints.push('确保基础架构和依赖库已准备就绪');
        break;
      case OperationType.MODIFY:
        hints.push('需要先了解现有代码结构和业务逻辑');
        break;
      case OperationType.INTEGRATE:
        hints.push('确保所有集成组件都已完成并测试');
        break;
      case OperationType.TEST:
        hints.push('需要先完成功能开发和基础测试环境搭建');
        break;
    }
    
    // 基于技术栈的依赖提示
    if (technicalRequirements.techStack.length > 0) {
      hints.push(`确保${technicalRequirements.techStack.join('、')}相关环境和工具已配置`);
    }
    
    // 基于约束条件的依赖提示
    if (keyElements.constraints.length > 0) {
      hints.push('注意约束条件可能影响实施顺序和方法');
    }
    
    return hints;
  }

  /**
   * 生成实施指导增强
   * Generate implementation guidance
   */
  private static generateImplementationGuidance(analysis: SemanticAnalysis): {
    techStackGuidance: string[];
    bestPractices: string[];
    riskAlerts: string[];
  } {
    const { operationType, technicalRequirements, complexityIndicators } = analysis;
    
    const techStackGuidance: string[] = [];
    const bestPractices: string[] = [];
    const riskAlerts: string[] = [];
    
    // 技术栈特定指导
    technicalRequirements.techStack.forEach(tech => {
      switch (tech.toLowerCase()) {
        case 'typescript':
          techStackGuidance.push('使用严格的类型定义，避免使用any类型');
          break;
        case 'react':
          techStackGuidance.push('遵循React Hooks最佳实践，注意组件生命周期');
          break;
        case 'node.js':
          techStackGuidance.push('注意异步操作的错误处理和性能优化');
          break;
      }
    });
    
    // 基于操作类型的最佳实践
    switch (operationType) {
      case OperationType.CREATE:
        bestPractices.push('采用测试驱动开发(TDD)方法');
        bestPractices.push('确保代码可读性和可维护性');
        break;
      case OperationType.MODIFY:
        bestPractices.push('先理解现有代码逻辑，再进行修改');
        bestPractices.push('保持向后兼容性');
        break;
      case OperationType.REFACTOR:
        bestPractices.push('小步重构，频繁测试');
        bestPractices.push('保持功能不变的前提下改进代码结构');
        break;
    }
    
    // 基于复杂度的风险提醒
    if (complexityIndicators.technicalComplexity === 'HIGH') {
      riskAlerts.push('技术复杂度较高，需要充分的技术调研和原型验证');
    }
    if (complexityIndicators.integrationComplexity === 'HIGH') {
      riskAlerts.push('集成复杂度较高，需要详细的接口设计和集成测试');
    }
    if (complexityIndicators.timeComplexity === 'HIGH') {
      riskAlerts.push('时间复杂度较高，建议分阶段实施并设置里程碑');
    }
    
    return {
      techStackGuidance,
      bestPractices,
      riskAlerts
    };
  }

  /**
   * 生成验证标准建议
   * Generate verification suggestions
   */
  private static generateVerificationSuggestions(analysis: SemanticAnalysis): string[] {
    const suggestions: string[] = [];
    const { operationType, expectedOutcomes, complexityIndicators } = analysis;
    
    // 基于操作类型的验证建议
    switch (operationType) {
      case OperationType.CREATE:
        suggestions.push('功能完整性测试：验证所有预期功能都已实现');
        suggestions.push('单元测试覆盖率达到80%以上');
        break;
      case OperationType.MODIFY:
        suggestions.push('回归测试：确保修改不影响现有功能');
        suggestions.push('性能对比测试：验证修改后性能无显著下降');
        break;
      case OperationType.INTEGRATE:
        suggestions.push('集成测试：验证各组件间的交互正常');
        suggestions.push('端到端测试：验证完整业务流程');
        break;
    }
    
    // 基于预期结果的验证建议
    if (expectedOutcomes.qualityMetrics.length > 0) {
      suggestions.push('质量指标验证：确保满足预定的质量标准');
    }
    
    // 基于复杂度的验证建议
    if (complexityIndicators.complexityScore >= 60) {
      suggestions.push('代码审查：进行详细的代码质量和安全性审查');
      suggestions.push('压力测试：验证系统在高负载下的表现');
    }
    
    return suggestions;
  }

  /**
   * 识别操作类型 - 增强版
   * Identify operation type - Enhanced version
   */
  private static identifyOperationType(text: string): OperationType {
    const lowerText = text.toLowerCase();
    
    // 🔥 增强：权重计算系统
    // Enhanced: Weight calculation system
    const operationScores: Record<OperationType, number> = {} as Record<OperationType, number>;
    
    // 🔥 增强：扩展关键词词典和权重
    // Enhanced: Extended keyword dictionary with weights
    const operationPatterns = {
      [OperationType.CREATE]: {
        primary: ['create', 'build', 'develop', 'implement', 'generate', 'establish', '创建', '构建', '开发', '实现', '生成', '建立'],
        secondary: ['add', 'new', 'make', 'construct', 'produce', '添加', '新建', '制作', '构造', '产生'],
        context: ['from scratch', 'new feature', 'build a', 'create new', '从零开始', '新功能']
      },
      [OperationType.MODIFY]: {
        primary: ['modify', 'update', 'change', 'edit', 'enhance', 'improve', '修改', '更新', '变更', '编辑', '增强', '改进'],
        secondary: ['alter', 'adjust', 'revise', 'amend', 'upgrade', '调整', '修订', '升级'],
        context: ['existing code', 'current implementation', 'modify existing', '现有代码', '当前实现']
      },
      [OperationType.DELETE]: {
        primary: ['delete', 'remove', 'eliminate', 'drop', 'clear', '删除', '移除', '清除', '去掉'],
        secondary: ['clean', 'purge', 'erase', 'discard', '清理', '清空', '丢弃'],
        context: ['remove old', 'delete unused', 'clean up', '删除旧的', '清理无用']
      },
      [OperationType.REFACTOR]: {
        primary: ['refactor', 'restructure', 'reorganize', 'rewrite', 'redesign', '重构', '重组', '重新组织', '重写', '重新设计'],
        secondary: ['cleanup', 'simplify', 'modernize', 'streamline', '清理', '简化', '现代化', '精简'],
        context: ['code quality', 'improve structure', 'refactor code', '代码质量', '改进结构']
      },
      [OperationType.OPTIMIZE]: {
        primary: ['optimize', 'performance', 'efficiency', 'faster', 'speed up', '优化', '性能', '效率', '加速'],
        secondary: ['enhance', 'boost', 'accelerate', 'tune', '增强', '提升', '调优'],
        context: ['improve performance', 'make faster', 'optimization', '提升性能', '性能优化']
      },
      [OperationType.DEBUG]: {
        primary: ['debug', 'fix', 'resolve', 'solve', 'repair', '调试', '修复', '解决', '修理'],
        secondary: ['troubleshoot', 'diagnose', 'correct', 'patch', '排查', '诊断', '纠正', '补丁'],
        context: ['bug fix', 'error handling', 'not working', '错误修复', '错误处理', '不工作']
      },
      [OperationType.TEST]: {
        primary: ['test', 'testing', 'verify', 'validate', 'check', '测试', '验证', '校验', '检查'],
        secondary: ['qa', 'quality assurance', 'examine', 'assess', '质量保证', '检验', '评估'],
        context: ['unit test', 'integration test', 'test case', '单元测试', '集成测试', '测试用例']
      },
      [OperationType.DEPLOY]: {
        primary: ['deploy', 'deployment', 'release', 'publish', 'launch', '部署', '发布', '上线', '启动'],
        secondary: ['rollout', 'ship', 'deliver', 'go live', '推出', '交付', '上线'],
        context: ['production', 'staging', 'environment', '生产环境', '预发布', '环境']
      },
      [OperationType.CONFIGURE]: {
        primary: ['configure', 'setup', 'config', 'settings', 'environment', '配置', '设置', '环境配置'],
        secondary: ['install', 'initialize', 'prepare', 'establish', '安装', '初始化', '准备', '建立'],
        context: ['configuration file', 'environment setup', 'config settings', '配置文件', '环境设置']
      },
      [OperationType.INTEGRATE]: {
        primary: ['integrate', 'integration', 'connect', 'combine', 'merge', '集成', '整合', '连接', '合并'],
        secondary: ['join', 'unite', 'link', 'bind', 'sync', '联合', '链接', '绑定', '同步'],
        context: ['api integration', 'third party', 'external service', 'API集成', '第三方', '外部服务']
      },
      [OperationType.ANALYZE]: {
        primary: ['analyze', 'analysis', 'research', 'investigate', 'study', '分析', '研究', '调研', '调查'],
        secondary: ['examine', 'explore', 'review', 'assess', '检查', '探索', '审查', '评估'],
        context: ['data analysis', 'code review', 'performance analysis', '数据分析', '代码审查', '性能分析']
      },
      [OperationType.DOCUMENT]: {
        primary: ['document', 'documentation', 'readme', 'guide', 'manual', '文档', '说明', '指南', '手册'],
        secondary: ['explain', 'describe', 'record', 'note', 'comment', '解释', '描述', '记录', '注释'],
        context: ['user guide', 'api docs', 'technical documentation', '用户指南', 'API文档', '技术文档']
      }
    };

    // 🔥 增强：权重计算
    // Enhanced: Weight calculation
    for (const [operationType, patterns] of Object.entries(operationPatterns)) {
      const type = operationType as OperationType;
      operationScores[type] = 0;
      
      // 主要关键词权重：3分
      patterns.primary.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          operationScores[type] += 3;
        }
      });
      
      // 次要关键词权重：2分
      patterns.secondary.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          operationScores[type] += 2;
        }
      });
      
      // 上下文关键词权重：1分
      patterns.context.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          operationScores[type] += 1;
        }
      });
    }

    // 🔥 增强：语义增强和上下文分析
    // Enhanced: Semantic enhancement and context analysis
    this.applyOperationTypeBoosts(lowerText, operationScores);

    // 找到最高分的操作类型
    let maxScore = 0;
    let bestType = OperationType.CREATE; // 默认类型
    
    for (const [type, score] of Object.entries(operationScores)) {
      if (score > maxScore) {
        maxScore = score;
        bestType = type as OperationType;
      }
    }

    return bestType;
  }

  /**
   * 🔥 新增：应用操作类型语义增强
   * New: Apply operation type semantic boosts
   */
  private static applyOperationTypeBoosts(text: string, scores: Record<OperationType, number>): void {
    // 动词-名词组合分析
    if (text.includes('create') && text.includes('function')) {
      scores[OperationType.CREATE] += 2;
    }
    if (text.includes('fix') && text.includes('bug')) {
      scores[OperationType.DEBUG] += 2;
    }
    if (text.includes('improve') && text.includes('performance')) {
      scores[OperationType.OPTIMIZE] += 2;
    }
    if (text.includes('write') && text.includes('test')) {
      scores[OperationType.TEST] += 2;
    }
    
    // 否定词处理
    if (text.includes('not') || text.includes("don't") || text.includes('avoid')) {
      // 降低所有分数，因为否定词可能改变意图
      Object.keys(scores).forEach(type => {
        scores[type as OperationType] *= 0.8;
      });
    }
    
    // 技术栈特定增强
    if (text.includes('api') && text.includes('integrate')) {
      scores[OperationType.INTEGRATE] += 2;
    }
    if (text.includes('database') && text.includes('optimize')) {
      scores[OperationType.OPTIMIZE] += 1;
    }
  }

  /**
   * 提取技术要求 - 增强版
   * Extract technical requirements - Enhanced version
   */
  private static extractTechnicalRequirements(text: string): TechnicalRequirement {
    const lowerText = text.toLowerCase();
    
    // 🔥 增强：扩展技术栈关键词词典
    // Enhanced: Extended tech stack keyword dictionary
    const techStackKeywords = [
      // 前端框架
      'react', 'vue', 'angular', 'svelte', 'solid.js', 'next.js', 'nuxt.js', 'gatsby',
      // 编程语言
      'typescript', 'javascript', 'python', 'java', 'go', 'rust', 'c#', 'php', 'ruby', 'swift', 'kotlin',
      // 后端框架
      'node.js', 'express', 'fastapi', 'spring', 'django', 'flask', 'nestjs', 'fastify',
      // 数据库
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'sqlite', 'cassandra',
      // 云服务
      'aws', 'azure', 'gcp', 'vercel', 'netlify', 'heroku', 'digitalocean',
      // 容器化
      'docker', 'kubernetes', 'helm', 'docker-compose',
      // 构建工具
      'webpack', 'vite', 'rollup', 'parcel', 'esbuild',
      // 测试框架
      'jest', 'cypress', 'playwright', 'vitest', 'mocha', 'jasmine'
    ];
    
    // 🔥 增强：扩展性能要求关键词
    // Enhanced: Extended performance requirement keywords
    const performanceKeywords = [
      'performance', 'speed', 'fast', 'optimization', 'efficient', 'scalable', 'responsive',
      'real-time', 'low latency', 'high throughput', 'caching', 'cdn', 'lazy loading',
      'code splitting', 'tree shaking', 'minification', 'compression', 'memory usage',
      'cpu usage', 'load time', 'first contentful paint', 'time to interactive'
    ];
    
    // 🔥 增强：扩展安全要求关键词
    // Enhanced: Extended security requirement keywords
    const securityKeywords = [
      'security', 'authentication', 'authorization', 'encryption', 'secure', 'privacy',
      'jwt', 'oauth', 'ssl', 'https', 'validation', 'sanitization', 'csrf', 'xss',
      'sql injection', 'cors', 'rate limiting', 'firewall', 'vpn', 'two-factor',
      'multi-factor', 'rbac', 'access control', 'audit trail', 'compliance'
    ];
    
    // 🔥 增强：扩展兼容性要求关键词
    // Enhanced: Extended compatibility requirement keywords
    const compatibilityKeywords = [
      'compatibility', 'cross-browser', 'mobile', 'responsive', 'backward compatible',
      'legacy', 'migration', 'upgrade', 'ie support', 'safari', 'chrome', 'firefox',
      'edge', 'ios', 'android', 'progressive web app', 'pwa', 'accessibility',
      'wcag', 'aria', 'screen reader', 'keyboard navigation'
    ];
    
    // 🔥 增强：扩展可扩展性要求关键词
    // Enhanced: Extended scalability requirement keywords
    const scalabilityKeywords = [
      'scalable', 'scalability', 'extensible', 'modular', 'flexible', 'configurable',
      'microservices', 'distributed', 'horizontal scaling', 'vertical scaling',
      'load balancing', 'auto scaling', 'elastic', 'fault tolerant', 'high availability',
      'disaster recovery', 'backup', 'replication', 'sharding', 'partitioning'
    ];

    // 🔥 增强：权重计算和上下文分析
    // Enhanced: Weight calculation and context analysis
    const extractWithContext = (keywords: string[], contextBoosts: Record<string, string[]> = {}): string[] => {
      const found: string[] = [];
      const scores: Record<string, number> = {};
      
      // 基础匹配
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          scores[keyword] = 1;
        }
      });
      
      // 上下文增强
      for (const [keyword, contexts] of Object.entries(contextBoosts)) {
        if (scores[keyword]) {
          contexts.forEach(context => {
            if (lowerText.includes(context)) {
              scores[keyword] += 0.5;
            }
          });
        }
      }
      
      // 返回得分大于0的关键词
      return Object.keys(scores).filter(keyword => scores[keyword] > 0);
    };

    // 🔥 增强：上下文增强映射
    // Enhanced: Context enhancement mapping
    const techStackContexts = {
      'react': ['component', 'jsx', 'hook', 'state'],
      'vue': ['component', 'directive', 'composition api'],
      'typescript': ['type', 'interface', 'generic'],
      'node.js': ['server', 'backend', 'api'],
      'docker': ['container', 'image', 'deployment']
    };

    const performanceContexts = {
      'optimization': ['bundle size', 'load time', 'memory'],
      'caching': ['redis', 'memcached', 'browser cache'],
      'scalable': ['load balancing', 'horizontal scaling']
    };

    return {
      techStack: extractWithContext(techStackKeywords, techStackContexts),
      performance: extractWithContext(performanceKeywords, performanceContexts),
      security: extractWithContext(securityKeywords),
      compatibility: extractWithContext(compatibilityKeywords),
      scalability: extractWithContext(scalabilityKeywords)
    };
  }

  /**
   * 分析复杂度指标 - 增强版
   * Analyze complexity indicators - Enhanced version
   */
  private static analyzeComplexityIndicators(text: string, task: Task): ComplexityIndicators {
    const lowerText = text.toLowerCase();
    
    // 🔥 增强：扩展技术复杂度评估
    // Enhanced: Extended technical complexity assessment
    const techComplexityKeywords = [
      // 算法复杂度
      'algorithm', 'optimization', 'performance', 'complexity', 'big o', 'time complexity',
      // 并发和异步
      'concurrent', 'parallel', 'async', 'await', 'promise', 'callback', 'event loop',
      // 架构复杂度
      'distributed', 'microservices', 'architecture', 'design pattern', 'scalable',
      // 数据结构
      'data structure', 'tree', 'graph', 'hash', 'queue', 'stack', 'heap',
      // 高级概念
      'machine learning', 'ai', 'blockchain', 'cryptography', 'real-time', 'streaming'
    ];
    
    // 🔥 增强：权重计算
    // Enhanced: Weight calculation
    let techComplexityScore = 0;
    techComplexityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // 高复杂度关键词给更高权重
        if (['machine learning', 'ai', 'blockchain', 'cryptography'].includes(keyword)) {
          techComplexityScore += 3;
        } else if (['distributed', 'microservices', 'real-time'].includes(keyword)) {
          techComplexityScore += 2;
        } else {
          techComplexityScore += 1;
        }
      }
    });
    
    // 🔥 增强：扩展业务复杂度评估
    // Enhanced: Extended business complexity assessment
    const businessComplexityKeywords = [
      // 业务流程
      'workflow', 'business logic', 'rules', 'validation', 'process', 'procedure',
      // 集成复杂度
      'integration', 'third-party', 'external', 'api', 'webhook', 'callback',
      // 数据复杂度
      'multiple', 'various', 'complex', 'comprehensive', 'dynamic', 'configurable',
      // 用户交互
      'user interface', 'user experience', 'interactive', 'responsive', 'accessibility',
      // 业务规则
      'compliance', 'regulation', 'policy', 'approval', 'authorization', 'audit'
    ];
    
    let businessComplexityScore = 0;
    businessComplexityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // 高业务复杂度关键词给更高权重
        if (['compliance', 'regulation', 'audit'].includes(keyword)) {
          businessComplexityScore += 3;
        } else if (['integration', 'third-party', 'dynamic'].includes(keyword)) {
          businessComplexityScore += 2;
        } else {
          businessComplexityScore += 1;
        }
      }
    });
    
    // 🔥 增强：扩展集成复杂度评估
    // Enhanced: Extended integration complexity assessment
    const integrationComplexityKeywords = [
      // API集成
      'api', 'rest', 'graphql', 'grpc', 'soap', 'webhook', 'callback',
      // 第三方服务
      'integration', 'third-party', 'external', 'service', 'provider',
      // 数据库集成
      'database', 'sql', 'nosql', 'orm', 'migration', 'sync',
      // 认证授权
      'authentication', 'authorization', 'oauth', 'jwt', 'saml', 'sso',
      // 消息队列
      'queue', 'message', 'event', 'streaming', 'kafka', 'rabbitmq',
      // 支付集成
      'payment', 'stripe', 'paypal', 'billing', 'subscription'
    ];
    
    let integrationComplexityScore = 0;
    integrationComplexityKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        // 高集成复杂度关键词给更高权重
        if (['oauth', 'saml', 'sso', 'payment', 'billing'].includes(keyword)) {
          integrationComplexityScore += 3;
        } else if (['graphql', 'grpc', 'streaming', 'kafka'].includes(keyword)) {
          integrationComplexityScore += 2;
        } else {
          integrationComplexityScore += 1;
        }
      }
    });
    
    // 🔥 增强：时间复杂度评估（基于多个因素）
    // Enhanced: Time complexity assessment (based on multiple factors)
    let timeComplexityScore = 0;
    
    // 基于描述长度
    timeComplexityScore += Math.floor(text.length / 300);
    
    // 基于依赖数量
    timeComplexityScore += task.dependencies?.length || 0;
    
    // 基于相关文件数量
    timeComplexityScore += Math.floor((task.relatedFiles?.length || 0) / 3);
    
    // 基于实施指南长度
    timeComplexityScore += Math.floor((task.implementationGuide?.length || 0) / 500);
    
    // 🔥 增强：动态复杂度级别计算
    // Enhanced: Dynamic complexity level calculation
    const getComplexityLevel = (score: number, type: 'tech' | 'business' | 'integration' | 'time'): 'LOW' | 'MEDIUM' | 'HIGH' => {
      // 不同类型的复杂度有不同的阈值
      const thresholds = {
        tech: { medium: 2, high: 5 },
        business: { medium: 2, high: 4 },
        integration: { medium: 3, high: 6 },
        time: { medium: 2, high: 4 }
      };
      
      const threshold = thresholds[type];
      if (score >= threshold.high) return 'HIGH';
      if (score >= threshold.medium) return 'MEDIUM';
      return 'LOW';
    };
    
    // 🔥 增强：智能总体复杂度评分
    // Enhanced: Smart overall complexity scoring
    const weightedScore = (techComplexityScore * 0.3) + 
                         (businessComplexityScore * 0.25) + 
                         (integrationComplexityScore * 0.25) + 
                         (timeComplexityScore * 0.2);
    
    const complexityScore = Math.min(Math.round(weightedScore * 10), 100);
    
    return {
      technicalComplexity: getComplexityLevel(techComplexityScore, 'tech'),
      businessComplexity: getComplexityLevel(businessComplexityScore, 'business'),
      integrationComplexity: getComplexityLevel(integrationComplexityScore, 'integration'),
      timeComplexity: getComplexityLevel(timeComplexityScore, 'time'),
      complexityScore
    };
  }

  /**
   * 提取关键要素 - 增强版
   * Extract key elements - Enhanced version
   */
  private static extractKeyElements(text: string): KeyElements {
    const lowerText = text.toLowerCase();
    
    // 🔥 增强：扩展核心功能关键词
    // Enhanced: Extended core function keywords
    const functionKeywords = [
      // 基础功能
      'function', 'feature', 'capability', 'functionality', 'component', 'module',
      // 服务和接口
      'service', 'api', 'endpoint', 'interface', 'method', 'operation',
      // 业务功能
      'workflow', 'process', 'logic', 'algorithm', 'calculation', 'validation',
      // 用户功能
      'user story', 'use case', 'scenario', 'interaction', 'behavior'
    ];
    
    // 🔥 增强：扩展输入要求关键词
    // Enhanced: Extended input requirement keywords
    const inputKeywords = [
      // 基础输入
      'input', 'parameter', 'argument', 'data', 'request', 'payload',
      // 用户输入
      'form', 'field', 'value', 'selection', 'choice', 'option',
      // 文件输入
      'file', 'upload', 'import', 'attachment', 'document', 'image',
      // 数据输入
      'json', 'xml', 'csv', 'database', 'query', 'filter'
    ];
    
    // 🔥 增强：扩展输出要求关键词
    // Enhanced: Extended output requirement keywords
    const outputKeywords = [
      // 基础输出
      'output', 'result', 'response', 'return', 'outcome', 'product',
      // 展示输出
      'display', 'render', 'show', 'present', 'visualize', 'chart',
      // 文件输出
      'export', 'download', 'report', 'document', 'file', 'pdf',
      // 数据输出
      'json', 'xml', 'csv', 'api response', 'notification', 'alert'
    ];
    
    // 🔥 增强：扩展约束条件关键词
    // Enhanced: Extended constraint keywords
    const constraintKeywords = [
      // 硬约束
      'constraint', 'limitation', 'requirement', 'must', 'cannot', 'forbidden',
      // 软约束
      'should', 'prefer', 'recommend', 'suggest', 'guideline', 'best practice',
      // 业务约束
      'restriction', 'rule', 'policy', 'compliance', 'regulation', 'standard',
      // 技术约束
      'compatibility', 'performance', 'security', 'scalability', 'maintainability'
    ];
    
    // 🔥 增强：扩展依赖关系关键词
    // Enhanced: Extended dependency keywords
    const dependencyKeywords = [
      // 直接依赖
      'dependency', 'require', 'depend', 'prerequisite', 'need', 'rely on',
      // 集成依赖
      'integrate with', 'connect to', 'use', 'based on', 'built on',
      // 数据依赖
      'data from', 'input from', 'feed from', 'source from', 'derived from',
      // 服务依赖
      'service', 'api', 'library', 'framework', 'platform', 'infrastructure'
    ];

    // 🔥 增强：智能短语提取
    // Enhanced: Smart phrase extraction
    const extractPhrasesEnhanced = (text: string, keywords: string[]): string[] => {
      const phrases: string[] = [];
      const sentences = text.split(/[.!?;]/);
      
      keywords.forEach(keyword => {
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(keyword)) {
            // 提取包含关键词的短语（前后各5个词）
            const words = sentence.trim().split(/\s+/);
            const keywordIndex = words.findIndex(word => 
              word.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (keywordIndex !== -1) {
              const start = Math.max(0, keywordIndex - 2);
              const end = Math.min(words.length, keywordIndex + 3);
              const phrase = words.slice(start, end).join(' ').trim();
              
              if (phrase.length > 10 && phrase.length < 100) {
                phrases.push(phrase);
              }
            }
          }
        });
      });
      
      // 去重并返回前5个最相关的短语
      return [...new Set(phrases)].slice(0, 5);
    };

    return {
      coreFunctions: extractPhrasesEnhanced(text, functionKeywords),
      inputs: extractPhrasesEnhanced(text, inputKeywords),
      outputs: extractPhrasesEnhanced(text, outputKeywords),
      constraints: extractPhrasesEnhanced(text, constraintKeywords),
      dependencies: extractPhrasesEnhanced(text, dependencyKeywords)
    };
  }

  /**
   * 分析预期结果
   * Analyze expected outcomes
   */
  private static analyzeExpectedOutcomes(text: string): ExpectedOutcomes {
    const lowerText = text.toLowerCase();
    
    // 功能性结果关键词
    const functionalKeywords = [
      'work', 'function', 'operate', 'process', 'handle', 'manage', 'control',
      'execute', 'perform', 'complete'
    ];
    
    // 非功能性结果关键词
    const nonFunctionalKeywords = [
      'fast', 'secure', 'reliable', 'maintainable', 'scalable', 'usable',
      'accessible', 'compatible', 'efficient', 'robust'
    ];
    
    // 质量指标关键词
    const qualityKeywords = [
      'quality', 'performance', 'accuracy', 'precision', 'coverage', 'reliability',
      'availability', 'response time', 'throughput', 'error rate'
    ];
    
    // 成功标准关键词
    const successKeywords = [
      'success', 'complete', 'achieve', 'meet', 'satisfy', 'fulfill', 'deliver',
      'pass', 'validate', 'verify'
    ];
    
    return {
      functional: this.extractPhrases(text, functionalKeywords),
      nonFunctional: this.extractPhrases(text, nonFunctionalKeywords),
      qualityMetrics: this.extractPhrases(text, qualityKeywords),
      successCriteria: this.extractPhrases(text, successKeywords)
    };
  }

  /**
   * 提取关键词
   * Extract keywords
   */
  private static extractKeywords(text: string, maxKeywords: number): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // 计算词频
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 排序并返回前 N 个关键词
    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * 提取实体
   * Extract entities
   */
  private static extractEntities(text: string): string[] {
    // 简单的实体识别：大写字母开头的词组
    const entityPattern = /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g;
    const entities = text.match(entityPattern) || [];
    
    // 去重并过滤
    return [...new Set(entities)]
      .filter(entity => entity.length > 1 && entity.length < 50);
  }

  /**
   * 分析情感倾向
   * Analyze sentiment
   */
  private static analyzeSentiment(text: string): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' {
    const lowerText = text.toLowerCase();
    
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'awesome', 'perfect', 'best',
      'improve', 'enhance', 'optimize', 'upgrade', 'better'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'worst', 'problem', 'issue', 'bug', 'error',
      'fail', 'broken', 'slow', 'difficult'
    ];
    
    const positiveScore = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeScore = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveScore > negativeScore) return 'POSITIVE';
    if (negativeScore > positiveScore) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  /**
   * 分析紧急程度
   * Analyze urgency
   */
  private static analyzeUrgency(text: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const lowerText = text.toLowerCase();
    
    const urgentKeywords = [
      'urgent', 'asap', 'immediately', 'critical', 'emergency', 'priority',
      'deadline', 'rush', 'quick', 'fast'
    ];
    
    const urgentCount = urgentKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    if (urgentCount >= 2) return 'HIGH';
    if (urgentCount >= 1) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 计算置信度 - 增强版
   * Calculate confidence - Enhanced version
   */
  private static calculateConfidence(
    text: string, 
    operationType: OperationType, 
    technicalRequirements: TechnicalRequirement
  ): number {
    let confidence = 0.3; // 🔥 降低基础置信度，更严格评估
    
    // 🔥 增强：基于文本质量的置信度
    // Enhanced: Text quality based confidence
    const textLength = text.length;
    if (textLength > 50) confidence += 0.05;
    if (textLength > 150) confidence += 0.05;
    if (textLength > 300) confidence += 0.05;
    if (textLength > 500) confidence += 0.05;
    
    // 文本结构质量
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) confidence += 0.05; // 多句描述
    if (sentences.length > 3) confidence += 0.05; // 详细描述
    
    // 🔥 增强：基于技术栈识别的置信度
    // Enhanced: Tech stack identification based confidence
    const techStackCount = technicalRequirements.techStack.length;
    if (techStackCount > 0) confidence += 0.1;
    if (techStackCount > 2) confidence += 0.1;
    if (techStackCount > 4) confidence += 0.05;
    
    // 技术要求完整性
    let requirementCategories = 0;
    if (technicalRequirements.performance && technicalRequirements.performance.length > 0) requirementCategories++;
    if (technicalRequirements.security && technicalRequirements.security.length > 0) requirementCategories++;
    if (technicalRequirements.compatibility && technicalRequirements.compatibility.length > 0) requirementCategories++;
    if (technicalRequirements.scalability && technicalRequirements.scalability.length > 0) requirementCategories++;
    
    confidence += requirementCategories * 0.05;
    
    // 🔥 增强：基于操作类型识别的置信度
    // Enhanced: Operation type identification based confidence
    if (operationType !== OperationType.CREATE) {
      confidence += 0.1; // 非默认类型说明识别准确
    }
    
    // 特定操作类型的置信度调整
    const operationConfidenceBoost = {
      [OperationType.DEBUG]: 0.05, // 调试任务通常描述明确
      [OperationType.OPTIMIZE]: 0.05, // 优化任务目标清晰
      [OperationType.TEST]: 0.05, // 测试任务验证明确
      [OperationType.INTEGRATE]: 0.03, // 集成任务复杂度高
      [OperationType.ANALYZE]: 0.04, // 分析任务需求明确
      [OperationType.REFACTOR]: 0.04, // 重构任务范围清晰
      [OperationType.CONFIGURE]: 0.03, // 配置任务步骤明确
      [OperationType.DEPLOY]: 0.03, // 部署任务流程清晰
      [OperationType.DOCUMENT]: 0.02, // 文档任务主观性强
      [OperationType.MODIFY]: 0.02, // 修改任务范围可能模糊
      [OperationType.DELETE]: 0.04, // 删除任务目标明确
      [OperationType.CREATE]: 0.01  // 创建任务变数较多
    };
    
    confidence += operationConfidenceBoost[operationType] || 0;
    
    // 🔥 增强：基于关键词密度的置信度
    // Enhanced: Keyword density based confidence
    const lowerText = text.toLowerCase();
    const technicalKeywords = [
      'implement', 'develop', 'create', 'build', 'design', 'optimize', 'test',
      'integrate', 'configure', 'deploy', 'debug', 'fix', 'refactor', 'analyze'
    ];
    
    const keywordMatches = technicalKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    confidence += Math.min(keywordMatches * 0.02, 0.1);
    
    // 🔥 增强：基于具体性的置信度
    // Enhanced: Specificity based confidence
    const specificityIndicators = [
      'function', 'method', 'class', 'component', 'api', 'endpoint',
      'database', 'table', 'field', 'parameter', 'variable', 'config'
    ];
    
    const specificityMatches = specificityIndicators.filter(indicator => 
      lowerText.includes(indicator)
    ).length;
    
    confidence += Math.min(specificityMatches * 0.015, 0.08);
    
    // 🔥 新增：质量惩罚机制
    // New: Quality penalty mechanism
    if (textLength < 20) confidence -= 0.2; // 描述过短
    if (sentences.length === 1 && textLength < 50) confidence -= 0.1; // 单句且过短
    if (!lowerText.match(/[a-z]/)) confidence -= 0.15; // 缺少英文字母（可能是乱码）
    
    // 确保置信度在合理范围内
    return Math.max(0.1, Math.min(confidence, 0.95));
  }

  /**
   * 提取短语
   * Extract phrases
   */
  private static extractPhrases(text: string, keywords: string[]): string[] {
    const phrases: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
          const trimmed = sentence.trim();
          if (trimmed && trimmed.length < 200) {
            phrases.push(trimmed);
          }
        }
      });
    });
    
    return [...new Set(phrases)].slice(0, 5); // 去重并限制数量
  }
}

/**
 * 獲取 executeTask 的完整 prompt - 增强版
 * Get the complete prompt for executeTask - Enhanced version
 * @param params prompt 參數
 * @param params prompt parameters
 * @returns 生成的 prompt
 * @returns generated prompt
 */
export async function getExecuteTaskPrompt(
  params: ExecuteTaskPromptParams
): Promise<string> {
  const {
    task,
    complexityAssessment,
    relatedFilesSummary,
    dependencyTasks,
    pathRecommendation,
    enableIntelligentAnalysis = true,
    projectContext,
    relatedTasks = [],
    relatedFiles = []
  } = params;

  const notesTemplate = await loadPromptFromTemplate("executeTask/notes.md");
  let notesPrompt = "";
  if (task.notes) {
    notesPrompt = generatePrompt(notesTemplate, {
      notes: task.notes,
    });
  }

  const implementationGuideTemplate = await loadPromptFromTemplate(
    "executeTask/implementationGuide.md"
  );
  let implementationGuidePrompt = "";
  if (task.implementationGuide) {
    implementationGuidePrompt = generatePrompt(implementationGuideTemplate, {
      implementationGuide: task.implementationGuide,
    });
  }

  const verificationCriteriaTemplate = await loadPromptFromTemplate(
    "executeTask/verificationCriteria.md"
  );
  let verificationCriteriaPrompt = "";
  if (task.verificationCriteria) {
    verificationCriteriaPrompt = generatePrompt(verificationCriteriaTemplate, {
      verificationCriteria: task.verificationCriteria,
    });
  }

  const analysisResultTemplate = await loadPromptFromTemplate(
    "executeTask/analysisResult.md"
  );
  let analysisResultPrompt = "";
  if (task.analysisResult) {
    analysisResultPrompt = generatePrompt(analysisResultTemplate, {
      analysisResult: task.analysisResult,
    });
  }

  const dependencyTasksTemplate = await loadPromptFromTemplate(
    "executeTask/dependencyTasks.md"
  );
  let dependencyTasksPrompt = "";
  if (dependencyTasks && dependencyTasks.length > 0) {
    const completedDependencyTasks = dependencyTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.summary
    );

    if (completedDependencyTasks.length > 0) {
      let dependencyTasksContent = "";
      for (const depTask of completedDependencyTasks) {
        dependencyTasksContent += `### ${depTask.name}\n${
          depTask.summary || "*無完成摘要*"
          // "*No completion summary*"
        }\n\n`;
      }
      dependencyTasksPrompt = generatePrompt(dependencyTasksTemplate, {
        dependencyTasks: dependencyTasksContent,
      });
    }
  }

  const relatedFilesSummaryTemplate = await loadPromptFromTemplate(
    "executeTask/relatedFilesSummary.md"
  );
  let relatedFilesSummaryPrompt = "";
  relatedFilesSummaryPrompt = generatePrompt(relatedFilesSummaryTemplate, {
    relatedFilesSummary: relatedFilesSummary || "當前任務沒有關聯的文件。",
    // "The current task has no associated files."
  });

  // 智能分析部分
  // Intelligent analysis section
  let intelligentAnalysisPrompt = "";
  if (enableIntelligentAnalysis) {
    try {
      console.log('🔍 开始智能分析，enableIntelligentAnalysis:', enableIntelligentAnalysis);
      const taskType = IntelligentTaskAnalyzer.classifyTaskType(task);
      console.log('Task type classification:', taskType);
      const edgeCases = IntelligentTaskAnalyzer.identifyEdgeCases(task, taskType, relatedFiles);
      console.log('🔍 边界情况数量:', edgeCases.length);
      const auditCheckpoints = IntelligentTaskAnalyzer.defineMandatoryAudits(task, taskType, relatedFiles);
      console.log('🔒 审计检查点数量:', auditCheckpoints.length);
      const decompositionAnalysis = IntelligentTaskAnalyzer.analyzeDecomposition(task, complexityAssessment);
      console.log('⚡ 拆分建议:', decompositionAnalysis.shouldDecompose);

      // 生成智能分析内容
      intelligentAnalysisPrompt = await generateIntelligentAnalysisPrompt({
        taskType,
        edgeCases,
        auditCheckpoints,
        decompositionAnalysis,
        task
      });
      console.log('✅ 智能分析内容长度:', intelligentAnalysisPrompt.length);
    } catch (error) {
      console.error('❌ 智能分析生成失败:', error);
      intelligentAnalysisPrompt = `\n## ⚠️ 智能分析暂时不可用\n\n由于技术问题，智能分析功能暂时不可用。请按照标准流程执行任务。\n\n错误信息: ${error instanceof Error ? error.message : String(error)}\n\n`;
    }
  } else {
    console.log('⚠️ 智能分析未启用，enableIntelligentAnalysis:', enableIntelligentAnalysis);
  }

  const complexityTemplate = await loadPromptFromTemplate(
    "executeTask/complexity.md"
  );
  let complexityPrompt = "";
  if (complexityAssessment) {
    const complexityStyle = getComplexityStyle(complexityAssessment.level);
    let recommendationContent = "";
    if (
      complexityAssessment.recommendations &&
      complexityAssessment.recommendations.length > 0
    ) {
      for (const recommendation of complexityAssessment.recommendations) {
        recommendationContent += `- ${recommendation}\n`;
      }
    }
    complexityPrompt = generatePrompt(complexityTemplate, {
      level: complexityAssessment.level,
      complexityStyle: complexityStyle,
      descriptionLength: complexityAssessment.metrics.descriptionLength,
      dependenciesCount: complexityAssessment.metrics.dependenciesCount,
      recommendation: recommendationContent,
      pathRecommendation: pathRecommendation || "",
    });
  } else {
    // 即使没有复杂度评估，也要显示路径推荐
    complexityPrompt = generatePrompt(complexityTemplate, {
      level: "未知",
      complexityStyle: "",
      descriptionLength: 0,
      dependenciesCount: 0,
      recommendation: "",
      pathRecommendation: pathRecommendation || "",
    });
  }

  const indexTemplate = await loadPromptFromTemplate("executeTask/index.md");
  let prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    description: task.description,
    notesTemplate: notesPrompt,
    implementationGuideTemplate: implementationGuidePrompt,
    verificationCriteriaTemplate: verificationCriteriaPrompt,
    analysisResultTemplate: analysisResultPrompt,
    dependencyTasksTemplate: dependencyTasksPrompt,
    relatedFilesSummaryTemplate: relatedFilesSummaryPrompt,
    complexityTemplate: complexityPrompt,
    intelligentAnalysisTemplate: intelligentAnalysisPrompt, // 新增智能分析
  });

  // 强制集成代码库分析 - 根据E:\MCP\rules.md要求
  // Force codebase analysis integration - per E:\MCP\rules.md requirements
  try {
    prompt = await enhancePromptWithContext(prompt, {
      description: task.description,
      requirements: task.implementationGuide || '',
      forceCodebaseAnalysis: true,
      minimumHits: 5,
      taskType: 'execute'
    });
  } catch (error) {
    console.warn("Codebase analysis failed in executeTask, proceeding with basic prompt:", error);
  }

  // 如果任務有指定的代理，添加 sub-agent 命令
  if (task.agent) {
    // 在 prompt 開頭添加 use sub-agent 命令
    prompt = `use sub-agent ${task.agent}\n\n${prompt}`;
  }

  // 載入可能的自定義 prompt
  // Load possible custom prompt
  return loadPrompt(prompt, "EXECUTE_TASK");
}

/**
 * 生成智能分析提示词内容 - 增强版
 * Generate intelligent analysis prompt content - Enhanced version
 * 
 * 🔥 增强功能：集成上下文分析，生成针对性的执行指导
 * Enhanced: Integrates context analysis to generate targeted execution guidance
 */
async function generateIntelligentAnalysisPrompt(params: {
  taskType: TaskType;
  edgeCases: EdgeCase[];
  auditCheckpoints: AuditCheckpoint[];
  decompositionAnalysis: DecompositionRecommendation;
  task: Task;
  relatedFiles?: string[];
}): Promise<string> {
  const { taskType, edgeCases, auditCheckpoints, decompositionAnalysis, task, relatedFiles = [] } = params;

  // 🔥 新增：获取任务上下文分析
  // New: Get task context analysis
  const taskContext = IntelligentTaskAnalyzer.analyzeTaskContext(task, relatedFiles);
  const { techStack, projectType, complexity } = taskContext;

  // 🔥 新增：执行语义分析
  // New: Perform semantic analysis
  const semanticAnalysis = IntelligentTaskAnalyzer.performSemanticAnalysis(task);
  const { operationType, technicalRequirements, complexityIndicators, keyElements } = semanticAnalysis;

  let content = `\n## Intelligent Task Analysis\n\n`;

  // 🔥 增强：任务类型和上下文分析
  // Enhanced: Task type and context analysis
  content += `**Task Type**: ${taskType}\n`;
  content += `**Operation Type**: ${operationType}\n`;
  content += `**Project Type**: ${projectType}\n`;
  content += `**Technology Stack**: ${techStack.join(', ')}\n`;
  content += `**Complexity Level**: ${complexity}\n`;
  content += `**Analysis Confidence**: ${Math.round(semanticAnalysis.confidence * 100)}%\n\n`;

  // 🔥 新增：语义分析详情
  // New: Semantic analysis details
  content += await generateSemanticAnalysisSection(semanticAnalysis);

  // 🔥 新增：基于技术栈的具体实施建议
  // New: Tech stack specific implementation guidance
  content += await generateTechStackGuidance(techStack, taskType, task);

  // 任务拆分建议（保持原有逻辑）
  // Task decomposition recommendations (maintain original logic)
  if (decompositionAnalysis.shouldDecompose) {
    content += `### ⚠️ Task Decomposition Recommended\n\n`;
    content += `**Rationale**: ${decompositionAnalysis.decompositionRationale}\n\n`;
    content += `**Suggested Subtasks**:\n`;
    decompositionAnalysis.suggestedSubtasks.forEach((subtask, index) => {
      content += `${index + 1}. **${subtask.name}** (${subtask.estimatedComplexity})\n`;
      content += `   - ${subtask.description}\n`;
      if (subtask.dependencies.length > 0) {
        content += `   - Dependencies: ${subtask.dependencies.join(', ')}\n`;
      }
      content += `\n`;
    });
    content += `**Recommendation**: Consider using \`split_tasks\` to break this down into manageable subtasks.\n\n`;
  }

  // 边界情况识别（保持原有逻辑）
  // Edge case identification (maintain original logic)
  if (edgeCases.length > 0) {
    content += `### 🔍 Edge Cases & Risk Analysis\n\n`;
    edgeCases.forEach((edgeCase, index) => {
      content += `**${index + 1}. ${edgeCase.type}** (${edgeCase.likelihood} likelihood, ${edgeCase.impact} impact)\n`;
      content += `- **Description**: ${edgeCase.description}\n`;
      content += `- **Testing Strategy**: ${edgeCase.testingStrategy}\n`;
      content += `- **Prevention**: ${edgeCase.preventionMeasures.join(', ')}\n\n`;
    });
  }

  // 强制审计检查点（保持原有逻辑）
  // Mandatory audit checkpoints (maintain original logic)
  if (auditCheckpoints.length > 0) {
    content += `### 🔒 Mandatory Quality Gates\n\n`;
    auditCheckpoints.forEach((checkpoint, index) => {
      content += `**${index + 1}. ${checkpoint.name}** (${checkpoint.timing})\n`;
      content += `- **Description**: ${checkpoint.description}\n`;
      content += `- **Criteria**: ${checkpoint.criteria.join(', ')}\n`;
      content += `- **Tools**: ${checkpoint.tools.join(', ')}\n`;
      if (checkpoint.mandatory) {
        content += `- **⚠️ MANDATORY**: This checkpoint must be completed before proceeding\n`;
      }
      content += `\n`;
    });
  }

  // 🔥 增强：基于上下文的执行指导
  // Enhanced: Context-aware execution guidance
  content += await generateContextAwareGuidance(taskContext, taskType, task);

  // 🔥 新增：基于项目类型的最佳实践建议
  // New: Project type specific best practices
  content += await generateBestPracticesGuidance(projectType, techStack, complexity);

  return content;
}

// 导出 IntelligentTaskAnalyzer 类供外部使用
export { IntelligentTaskAnalyzer };
