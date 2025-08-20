/**
 * 上下文分析器 - 智能模板选择和内容调整
 * Context Analyzer - Intelligent template selection and content adjustment
 * 
 * 基于用户输入、任务类型和项目上下文，智能选择最合适的模板变体
 * 并动态调整模板内容，确保AI助手能够针对具体业务场景提供相关指导
 */

/**
 * 业务领域类型
 * Business domain types
 */
export enum BusinessDomain {
  WEB_DEVELOPMENT = 'web-development',
  API_DEVELOPMENT = 'api-development',
  DATABASE = 'database',
  FRONTEND_UI = 'frontend-ui',
  BACKEND_LOGIC = 'backend-logic',
  DEVOPS = 'devops',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  GENERAL = 'general'
}

/**
 * 任务复杂度级别
 * Task complexity levels
 */
export enum TaskComplexity {
  SIMPLE = 'simple',      // 简单任务，直接执行
  MEDIUM = 'medium',      // 中等复杂度，需要规划
  COMPLEX = 'complex'     // 复杂任务，需要深度分析
}

/**
 * 业务意图类型
 * Business intent types
 */
export enum BusinessIntent {
  UNDERSTAND_REQUIREMENT = 'understand-requirement',  // 理解需求
  SOLVE_PROBLEM = 'solve-problem',                   // 解决问题
  IMPLEMENT_FEATURE = 'implement-feature',           // 实现功能
  OPTIMIZE_PERFORMANCE = 'optimize-performance',     // 优化性能
  FIX_BUG = 'fix-bug',                              // 修复错误
  REFACTOR_CODE = 'refactor-code',                  // 重构代码
  ANALYZE_SYSTEM = 'analyze-system',                // 分析系统
  PLAN_PROJECT = 'plan-project'                     // 项目规划
}

/**
 * 上下文分析结果
 * Context analysis result
 */
export interface ContextAnalysis {
  businessDomain: BusinessDomain;
  taskComplexity: TaskComplexity;
  businessIntent: BusinessIntent;
  keyTerms: string[];
  suggestedTemplate: string;
  businessGoalConfirmation: string;
  toolRecommendations: string[];
  simplificationOpportunities: string[];
}

/**
 * 上下文分析器类
 * Context Analyzer class
 */
export class ContextAnalyzer {
  
  /**
   * 分析用户输入的上下文
   * Analyze context from user input
   */
  static analyzeContext(
    description: string,
    requirements?: string,
    existingTasks?: any[]
  ): ContextAnalysis {
    const text = `${description} ${requirements || ''}`.toLowerCase();
    
    // 分析业务领域
    const businessDomain = this.detectBusinessDomain(text);
    
    // 分析任务复杂度
    const taskComplexity = this.assessTaskComplexity(description, requirements, existingTasks);
    
    // 分析业务意图
    const businessIntent = this.detectBusinessIntent(text);
    
    // 提取关键术语
    const keyTerms = this.extractKeyTerms(text);
    
    // 建议模板
    const suggestedTemplate = this.suggestTemplate(businessDomain, taskComplexity, businessIntent);
    
    // 生成业务目标确认问题
    const businessGoalConfirmation = this.generateBusinessGoalConfirmation(businessIntent, keyTerms);
    
    // 推荐工具
    const toolRecommendations = this.recommendTools(businessDomain, businessIntent);
    
    // 识别简化机会
    const simplificationOpportunities = this.identifySimplificationOpportunities(text, taskComplexity);
    
    return {
      businessDomain,
      taskComplexity,
      businessIntent,
      keyTerms,
      suggestedTemplate,
      businessGoalConfirmation,
      toolRecommendations,
      simplificationOpportunities
    };
  }

  /**
   * 检测业务领域
   * Detect business domain
   */
  private static detectBusinessDomain(text: string): BusinessDomain {
    const domainKeywords = {
      [BusinessDomain.WEB_DEVELOPMENT]: ['web', 'website', 'html', 'css', 'javascript', 'react', 'vue', 'angular'],
      [BusinessDomain.API_DEVELOPMENT]: ['api', 'rest', 'graphql', 'endpoint', 'service', 'microservice'],
      [BusinessDomain.DATABASE]: ['database', 'sql', 'mongodb', 'postgres', 'mysql', 'query', 'schema'],
      [BusinessDomain.FRONTEND_UI]: ['ui', 'frontend', 'interface', 'component', 'layout', 'design'],
      [BusinessDomain.BACKEND_LOGIC]: ['backend', 'server', 'logic', 'business logic', 'processing'],
      [BusinessDomain.DEVOPS]: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'infrastructure'],
      [BusinessDomain.TESTING]: ['test', 'testing', 'unit test', 'integration test', 'qa'],
      [BusinessDomain.DOCUMENTATION]: ['document', 'docs', 'readme', 'guide', 'manual'],
      [BusinessDomain.PERFORMANCE]: ['performance', 'optimization', 'speed', 'efficiency', 'bottleneck'],
      [BusinessDomain.SECURITY]: ['security', 'auth', 'authentication', 'authorization', 'encryption']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return domain as BusinessDomain;
      }
    }

    return BusinessDomain.GENERAL;
  }

  /**
   * 评估任务复杂度
   * Assess task complexity
   */
  private static assessTaskComplexity(
    description: string,
    requirements?: string,
    existingTasks?: any[]
  ): TaskComplexity {
    let complexityScore = 0;

    // 基于描述长度
    if (description.length > 500) complexityScore += 2;
    else if (description.length > 200) complexityScore += 1;

    // 基于需求复杂度
    if (requirements && requirements.length > 300) complexityScore += 2;
    else if (requirements && requirements.length > 100) complexityScore += 1;

    // 基于现有任务数量
    if (existingTasks && existingTasks.length > 10) complexityScore += 2;
    else if (existingTasks && existingTasks.length > 5) complexityScore += 1;

    // 基于复杂度关键词
    const complexityKeywords = ['integration', 'architecture', 'system', 'multiple', 'complex', 'advanced'];
    const text = `${description} ${requirements || ''}`.toLowerCase();
    complexityScore += complexityKeywords.filter(keyword => text.includes(keyword)).length;

    if (complexityScore >= 5) return TaskComplexity.COMPLEX;
    if (complexityScore >= 2) return TaskComplexity.MEDIUM;
    return TaskComplexity.SIMPLE;
  }

  /**
   * 检测业务意图
   * Detect business intent
   */
  private static detectBusinessIntent(text: string): BusinessIntent {
    const intentKeywords = {
      [BusinessIntent.UNDERSTAND_REQUIREMENT]: ['understand', 'clarify', 'analyze requirement', 'what does'],
      [BusinessIntent.SOLVE_PROBLEM]: ['solve', 'fix', 'resolve', 'issue', 'problem'],
      [BusinessIntent.IMPLEMENT_FEATURE]: ['implement', 'create', 'build', 'develop', 'add feature'],
      [BusinessIntent.OPTIMIZE_PERFORMANCE]: ['optimize', 'improve performance', 'speed up', 'efficiency'],
      [BusinessIntent.FIX_BUG]: ['bug', 'error', 'fix', 'debug', 'not working'],
      [BusinessIntent.REFACTOR_CODE]: ['refactor', 'restructure', 'clean up', 'improve code'],
      [BusinessIntent.ANALYZE_SYSTEM]: ['analyze', 'review', 'assess', 'evaluate'],
      [BusinessIntent.PLAN_PROJECT]: ['plan', 'design', 'architecture', 'strategy']
    };

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return intent as BusinessIntent;
      }
    }

    return BusinessIntent.UNDERSTAND_REQUIREMENT;
  }

  /**
   * 提取关键术语
   * Extract key terms
   */
  private static extractKeyTerms(text: string): string[] {
    // 简单的关键词提取逻辑
    const words = text.split(/\s+/);
    const technicalTerms = words.filter(word => 
      word.length > 4 && 
      /^[a-zA-Z]+$/.test(word) &&
      !['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word.toLowerCase())
    );
    
    return [...new Set(technicalTerms)].slice(0, 10);
  }

  /**
   * 建议模板
   * Suggest template
   */
  private static suggestTemplate(
    domain: BusinessDomain,
    complexity: TaskComplexity,
    intent: BusinessIntent
  ): string {
    // 根据复杂度选择基础模板
    if (complexity === TaskComplexity.SIMPLE) {
      return 'simple-execution';
    }
    
    if (complexity === TaskComplexity.COMPLEX) {
      return 'deep-analysis';
    }

    // 根据业务意图选择中等复杂度模板
    switch (intent) {
      case BusinessIntent.SOLVE_PROBLEM:
        return 'problem-solving';
      case BusinessIntent.IMPLEMENT_FEATURE:
        return 'feature-implementation';
      case BusinessIntent.OPTIMIZE_PERFORMANCE:
        return 'performance-optimization';
      default:
        return 'standard-planning';
    }
  }

  /**
   * 生成业务目标确认问题
   * Generate business goal confirmation questions
   */
  private static generateBusinessGoalConfirmation(intent: BusinessIntent, keyTerms: string[]): string {
    const baseQuestions = {
      [BusinessIntent.UNDERSTAND_REQUIREMENT]: "在开始技术分析前，请确认：用户真正想要达到什么业务目标？",
      [BusinessIntent.SOLVE_PROBLEM]: "在开始解决方案设计前，请确认：这个问题对用户的实际影响是什么？",
      [BusinessIntent.IMPLEMENT_FEATURE]: "在开始功能实现前，请确认：这个功能要解决用户的什么具体需求？",
      [BusinessIntent.OPTIMIZE_PERFORMANCE]: "在开始性能优化前，请确认：当前性能问题对业务的具体影响是什么？",
      [BusinessIntent.FIX_BUG]: "在开始错误修复前，请确认：这个错误对用户体验的具体影响是什么？",
      [BusinessIntent.REFACTOR_CODE]: "在开始代码重构前，请确认：重构要解决什么具体的维护或扩展问题？",
      [BusinessIntent.ANALYZE_SYSTEM]: "在开始系统分析前，请确认：分析的目的是为了解决什么业务问题？",
      [BusinessIntent.PLAN_PROJECT]: "在开始项目规划前，请确认：项目要达到什么具体的业务价值？"
    };

    return baseQuestions[intent] || baseQuestions[BusinessIntent.UNDERSTAND_REQUIREMENT];
  }

  /**
   * 推荐工具
   * Recommend tools
   */
  private static recommendTools(domain: BusinessDomain, intent: BusinessIntent): string[] {
    const tools = [];

    // 基于业务领域推荐工具
    switch (domain) {
      case BusinessDomain.WEB_DEVELOPMENT:
      case BusinessDomain.FRONTEND_UI:
        tools.push('codebase-retrieval (查看现有UI组件)', 'search_code_desktop-commander (搜索样式文件)');
        break;
      case BusinessDomain.API_DEVELOPMENT:
      case BusinessDomain.BACKEND_LOGIC:
        tools.push('codebase-retrieval (分析API结构)', 'search_code_desktop-commander (查找路由定义)');
        break;
      case BusinessDomain.DATABASE:
        tools.push('search_files_desktop-commander (查找数据库配置)', 'codebase-retrieval (分析数据模型)');
        break;
    }

    // 基于业务意图推荐工具
    switch (intent) {
      case BusinessIntent.SOLVE_PROBLEM:
      case BusinessIntent.FIX_BUG:
        tools.push('Force Search Protocol (搜索解决方案)', 'codebase-retrieval (分析相关代码)');
        break;
      case BusinessIntent.UNDERSTAND_REQUIREMENT:
        tools.push('query_task (查看相关任务)', 'read_file_desktop-commander (查看项目文档)');
        break;
    }

    // 通用工具推荐
    tools.push('Everything MCP (文件搜索)', 'Desktop Commander (文件操作)');

    return [...new Set(tools)];
  }

  /**
   * 识别简化机会
   * Identify simplification opportunities
   */
  private static identifySimplificationOpportunities(text: string, complexity: TaskComplexity): string[] {
    const opportunities = [];

    if (complexity === TaskComplexity.COMPLEX) {
      opportunities.push('考虑将复杂任务分解为多个简单任务');
      opportunities.push('优先实现核心功能，后续迭代添加高级特性');
    }

    if (text.includes('integration') || text.includes('multiple')) {
      opportunities.push('考虑先实现单个组件，再进行集成');
    }

    if (text.includes('advanced') || text.includes('sophisticated')) {
      opportunities.push('考虑先实现基础版本，验证可行性后再优化');
    }

    return opportunities;
  }
}