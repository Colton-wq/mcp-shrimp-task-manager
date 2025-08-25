import { z } from "zod";

/**
 * 上下文感知命令生成器 - 智能搜索策略定制系统
 * 
 * 基于问题类型、技术栈、错误计数等上下文信息，智能生成 2-4 个具体的搜索命令
 * 确保搜索策略针对具体问题定制，避免千篇一律的搜索模式
 * 
 * 核心创新：从通用模板转向智能化、个性化的搜索策略
 */

// MCP 工具调用接口定义
interface MCPToolCall {
  tool: string;
  priority: number;
  parameters: Record<string, any>;
  rationale: string;
  timeout: number;
  expectedQuality: "HIGH" | "MEDIUM" | "LOW";
}

// 上下文分析结果接口
interface ContextAnalysis {
  problemType: string;
  techStack: string[];
  complexity: "LOW" | "MEDIUM" | "HIGH";
  errorPattern: "NONE" | "INITIAL" | "RECURRING" | "CRITICAL";
  urgencyLevel: "ROUTINE" | "ELEVATED" | "HIGH" | "EMERGENCY";
  domainSpecific: boolean;
  searchStrategy: string;
}

// 搜索命令模板接口
interface SearchCommandTemplate {
  toolName: string;
  parameterTemplate: Record<string, any>;
  rationale: string;
  priority: number;
  timeout: number;
  expectedQuality: "HIGH" | "MEDIUM" | "LOW";
  applicableContexts: string[];
}

/**
 * 上下文感知命令生成器类
 * 
 * 核心功能：基于具体上下文智能生成针对性的搜索命令序列
 */
export class ContextAwareCommandGenerator {

  /**
   * 技术栈特定的搜索策略映射
   */
  private static readonly TECH_STACK_STRATEGIES = {
    // MCP 开发相关
    mcp: {
      primaryTools: ["context7-mcp-get-library-docs_mcphub-proxy", "github-local-search_repositories_mcphub-proxy"],
      searchKeywords: ["Model Context Protocol", "MCP server", "anthropic/mcp"],
      specialRequirements: ["官方文档优先", "实现案例分析", "配置问题排查"]
    },
    
    // TypeScript/JavaScript 开发
    typescript: {
      primaryTools: ["codebase-retrieval", "exa-mcp-server-web_search_exa_mcphub-proxy"],
      searchKeywords: ["TypeScript", "type definitions", "compilation"],
      specialRequirements: ["类型系统分析", "编译配置", "最佳实践"]
    },
    
    // Node.js 开发
    nodejs: {
      primaryTools: ["github-local-search_code_mcphub-proxy", "exa-mcp-server-web_search_exa_mcphub-proxy"],
      searchKeywords: ["Node.js", "npm", "package.json"],
      specialRequirements: ["包管理", "依赖解析", "运行时问题"]
    },
    
    // React/前端开发
    react: {
      primaryTools: ["context7-mcp-get-library-docs_mcphub-proxy", "github-local-search_code_mcphub-proxy"],
      searchKeywords: ["React", "hooks", "components"],
      specialRequirements: ["组件设计", "状态管理", "性能优化"]
    },
    
    // 数据库相关
    database: {
      primaryTools: ["exa-mcp-server-web_search_exa_mcphub-proxy", "tavily-remote-mcp-tavily_search_mcphub-proxy"],
      searchKeywords: ["database", "SQL", "query optimization"],
      specialRequirements: ["查询优化", "数据建模", "性能调优"]
    }
  };

  /**
   * 问题类型特定的搜索模板
   */
  private static readonly PROBLEM_TYPE_TEMPLATES = {
    // 错误解决类
    error_resolution: {
      searchSequence: ["codebase-retrieval", "github-local-search_issues_mcphub-proxy", "exa-mcp-server-web_search_exa_mcphub-proxy"],
      focusAreas: ["错误信息分析", "类似问题解决方案", "官方文档说明"],
      urgencyMultiplier: 1.5
    },
    
    // 功能实现类
    implementation: {
      searchSequence: ["context7-mcp-get-library-docs_mcphub-proxy", "github-local-search_code_mcphub-proxy", "codebase-retrieval"],
      focusAreas: ["API 文档", "实现示例", "现有代码模式"],
      urgencyMultiplier: 1.0
    },
    
    // 性能优化类
    optimization: {
      searchSequence: ["codebase-retrieval", "exa-mcp-server-web_search_exa_mcphub-proxy", "github-local-search_code_mcphub-proxy"],
      focusAreas: ["性能瓶颈分析", "优化最佳实践", "基准测试"],
      urgencyMultiplier: 0.8
    },
    
    // 配置问题类
    configuration: {
      searchSequence: ["github-local-search_repositories_mcphub-proxy", "exa-mcp-server-web_search_exa_mcphub-proxy", "codebase-retrieval"],
      focusAreas: ["配置文件示例", "环境设置", "故障排除"],
      urgencyMultiplier: 1.2
    }
  };

  /**
   * 错误模式特定的搜索增强策略
   */
  private static readonly ERROR_PATTERN_ENHANCEMENTS = {
    CRITICAL: {
      additionalTools: ["tavily-remote-mcp-tavily_search_mcphub-proxy"],
      searchModifiers: ["troubleshooting", "emergency fix", "critical issue"],
      priorityBoost: 2
    },
    
    RECURRING: {
      additionalTools: ["github-local-search_issues_mcphub-proxy"],
      searchModifiers: ["recurring problem", "persistent issue", "root cause"],
      priorityBoost: 1
    },
    
    INITIAL: {
      additionalTools: [],
      searchModifiers: ["getting started", "basic setup", "introduction"],
      priorityBoost: 0
    }
  };

  /**
   * 智能生成搜索命令序列 - 核心方法
   * 
   * @param problemDescription - 问题描述
   * @param techStack - 技术栈数组
   * @param errorCount - 错误计数
   * @param conversationContext - 对话上下文
   * @returns 定制化的工具调用数组
   */
  static generateSmartCommands(
    problemDescription: string,
    techStack: string[] = [],
    errorCount: number = 0,
    conversationContext: string = ""
  ): MCPToolCall[] {
    // Step 1: 分析上下文
    const context = this.analyzeContext(problemDescription, techStack, errorCount, conversationContext);
    
    // Step 2: 选择基础搜索策略
    const baseStrategy = this.selectBaseStrategy(context);
    
    // Step 3: 应用技术栈特定增强
    const techEnhancedCommands = this.applyTechStackEnhancements(baseStrategy, context);
    
    // Step 4: 应用错误模式增强
    const errorEnhancedCommands = this.applyErrorPatternEnhancements(techEnhancedCommands, context);
    
    // Step 5: 优化和排序
    const optimizedCommands = this.optimizeCommandSequence(errorEnhancedCommands, context);
    
    return optimizedCommands;
  }

  /**
   * 分析问题上下文
   */
  private static analyzeContext(
    problemDescription: string,
    techStack: string[],
    errorCount: number,
    conversationContext: string
  ): ContextAnalysis {
    const text = problemDescription.toLowerCase();
    const fullContext = `${problemDescription} ${conversationContext}`.toLowerCase();
    
    // 问题类型识别
    const problemType = this.identifyProblemType(text);
    
    // 技术栈补充识别
    const detectedTechStack = this.detectTechStack(text);
    const completeTechStack = [...new Set([...techStack, ...detectedTechStack])];
    
    // 复杂度评估
    const complexity = this.assessComplexity(problemDescription, completeTechStack.length, errorCount);
    
    // 错误模式分析
    const errorPattern = this.analyzeErrorPattern(errorCount, fullContext);
    
    // 紧急程度评估
    const urgencyLevel = this.assessUrgency(errorCount, fullContext, problemType);
    
    // 领域特定性检测
    const domainSpecific = completeTechStack.length > 0 || this.hasDomainSpecificTerms(text);
    
    // 搜索策略确定
    const searchStrategy = this.determineSearchStrategy(problemType, complexity, errorPattern);
    
    return {
      problemType,
      techStack: completeTechStack,
      complexity,
      errorPattern,
      urgencyLevel,
      domainSpecific,
      searchStrategy
    };
  }

  /**
   * 识别问题类型
   */
  private static identifyProblemType(text: string): string {
    const patterns = {
      error_resolution: /error|fail|bug|issue|problem|exception|crash|broken/,
      implementation: /implement|create|build|develop|add|feature|function/,
      optimization: /optimize|performance|slow|speed|improve|efficient/,
      configuration: /config|setup|install|deploy|environment|setting/,
      security: /security|auth|permission|access|vulnerability|encrypt/,
      testing: /test|spec|unit|integration|coverage|mock/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return type;
      }
    }
    
    return "general";
  }

  /**
   * 检测技术栈
   */
  private static detectTechStack(text: string): string[] {
    const techPatterns = {
      mcp: /mcp|model context protocol|anthropic/,
      typescript: /typescript|ts|type|interface/,
      javascript: /javascript|js|node|npm/,
      react: /react|jsx|component|hook/,
      vue: /vue|vuejs|composition/,
      angular: /angular|ng|directive/,
      python: /python|py|pip|django|flask/,
      java: /java|spring|maven|gradle/,
      database: /sql|database|mysql|postgres|mongodb/,
      docker: /docker|container|dockerfile/,
      kubernetes: /k8s|kubernetes|kubectl/,
      aws: /aws|amazon|s3|ec2|lambda/
    };

    const detected: string[] = [];
    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(text)) {
        detected.push(tech);
      }
    }
    
    return detected;
  }

  /**
   * 评估复杂度
   */
  private static assessComplexity(
    description: string,
    techStackSize: number,
    errorCount: number
  ): "LOW" | "MEDIUM" | "HIGH" {
    let complexityScore = 0;
    
    // 描述长度因子
    complexityScore += Math.min(description.length / 100, 3);
    
    // 技术栈复杂度
    complexityScore += techStackSize * 0.5;
    
    // 错误计数影响
    complexityScore += errorCount * 0.3;
    
    // 复杂度关键词
    const complexKeywords = /integration|architecture|system|multiple|complex|advanced|enterprise/;
    if (complexKeywords.test(description.toLowerCase())) {
      complexityScore += 2;
    }
    
    if (complexityScore >= 4) return "HIGH";
    if (complexityScore >= 2) return "MEDIUM";
    return "LOW";
  }

  /**
   * 分析错误模式
   */
  private static analyzeErrorPattern(
    errorCount: number,
    fullContext: string
  ): "NONE" | "INITIAL" | "RECURRING" | "CRITICAL" {
    if (errorCount >= 5 || /critical|urgent|emergency/.test(fullContext)) {
      return "CRITICAL";
    }
    if (errorCount >= 2 || /recurring|persistent|repeated/.test(fullContext)) {
      return "RECURRING";
    }
    if (errorCount >= 1) {
      return "INITIAL";
    }
    return "NONE";
  }

  /**
   * 评估紧急程度
   */
  private static assessUrgency(
    errorCount: number,
    fullContext: string,
    problemType: string
  ): "ROUTINE" | "ELEVATED" | "HIGH" | "EMERGENCY" {
    let urgencyScore = 0;
    
    // 错误计数影响
    urgencyScore += errorCount;
    
    // 上下文关键词
    if (/urgent|critical|emergency|asap/.test(fullContext)) urgencyScore += 3;
    if (/important|priority|soon/.test(fullContext)) urgencyScore += 1;
    
    // 问题类型影响
    if (problemType === "error_resolution") urgencyScore += 1;
    if (problemType === "security") urgencyScore += 2;
    
    if (urgencyScore >= 5) return "EMERGENCY";
    if (urgencyScore >= 3) return "HIGH";
    if (urgencyScore >= 1) return "ELEVATED";
    return "ROUTINE";
  }

  /**
   * 检测领域特定术语
   */
  private static hasDomainSpecificTerms(text: string): boolean {
    const domainTerms = /api|framework|library|protocol|algorithm|architecture|pattern|design/;
    return domainTerms.test(text);
  }

  /**
   * 确定搜索策略
   */
  private static determineSearchStrategy(
    problemType: string,
    complexity: "LOW" | "MEDIUM" | "HIGH",
    errorPattern: "NONE" | "INITIAL" | "RECURRING" | "CRITICAL"
  ): string {
    if (errorPattern === "CRITICAL") {
      return "emergency_resolution";
    }
    if (complexity === "HIGH") {
      return "comprehensive_analysis";
    }
    if (problemType === "implementation") {
      return "guided_implementation";
    }
    return "standard_search";
  }

  /**
   * 选择基础搜索策略
   */
  private static selectBaseStrategy(context: ContextAnalysis): MCPToolCall[] {
    const template = (this.PROBLEM_TYPE_TEMPLATES as any)[context.problemType] || this.PROBLEM_TYPE_TEMPLATES.implementation;
    const commands: MCPToolCall[] = [];
    
    template.searchSequence.forEach((toolName: string, index: number) => {
      commands.push({
        tool: toolName,
        priority: index + 1,
        parameters: this.generateBaseParameters(toolName, context),
        rationale: template.focusAreas[index] || `${toolName} 搜索`,
        timeout: 30000 - (index * 5000), // 递减超时
        expectedQuality: index === 0 ? "HIGH" : "MEDIUM"
      });
    });
    
    return commands;
  }

  /**
   * 生成基础参数
   */
  private static generateBaseParameters(toolName: string, context: ContextAnalysis): Record<string, any> {
    const baseKeywords = context.techStack.length > 0 
      ? `${context.techStack.join(" ")} ${context.problemType}`
      : context.problemType;
    
    switch (toolName) {
      case "codebase-retrieval":
        return {
          information_request: `${baseKeywords} implementation analysis and patterns`
        };
      
      case "exa-mcp-server-web_search_exa_mcphub-proxy":
        return {
          query: `${baseKeywords} 2025 best practices solution`,
          numResults: 5
        };
      
      case "github-local-search_repositories_mcphub-proxy":
        return {
          q: `${baseKeywords} example implementation`,
          sort: "updated",
          per_page: 5
        };
      
      case "context7-mcp-get-library-docs_mcphub-proxy":
        const libraryId = this.inferLibraryId(context.techStack);
        return libraryId ? { context7CompatibleLibraryID: libraryId } : {};
      
      case "tavily-remote-mcp-tavily_search_mcphub-proxy":
        return {
          query: `${baseKeywords} troubleshooting guide`,
          search_depth: "advanced",
          max_results: 5
        };
      
      default:
        return { query: baseKeywords };
    }
  }

  /**
   * 推断库 ID
   */
  private static inferLibraryId(techStack: string[]): string | null {
    const libraryMap: Record<string, string> = {
      mcp: "/anthropic/mcp",
      react: "/facebook/react",
      vue: "/vuejs/vue",
      angular: "/angular/angular",
      typescript: "/microsoft/typescript",
      nodejs: "/nodejs/node"
    };
    
    for (const tech of techStack) {
      if (libraryMap[tech]) {
        return libraryMap[tech];
      }
    }
    
    return null;
  }

  /**
   * 应用技术栈特定增强
   */
  private static applyTechStackEnhancements(
    baseCommands: MCPToolCall[],
    context: ContextAnalysis
  ): MCPToolCall[] {
    const enhanced = [...baseCommands];
    
    // 为每个技术栈应用特定增强
    context.techStack.forEach(tech => {
      const strategy = (this.TECH_STACK_STRATEGIES as any)[tech];
      if (strategy) {
        // 添加技术栈特定的工具
        strategy.primaryTools.forEach((toolName: string) => {
          if (!enhanced.some(cmd => cmd.tool === toolName)) {
            enhanced.push({
              tool: toolName,
              priority: enhanced.length + 1,
              parameters: this.generateTechSpecificParameters(toolName, tech, context),
              rationale: `${tech} 特定搜索 - ${strategy.specialRequirements[0]}`,
              timeout: 25000,
              expectedQuality: "HIGH"
            });
          }
        });
      }
    });
    
    return enhanced;
  }

  /**
   * 生成技术特定参数
   */
  private static generateTechSpecificParameters(
    toolName: string,
    tech: string,
    context: ContextAnalysis
  ): Record<string, any> {
    const strategy = (this.TECH_STACK_STRATEGIES as any)[tech];
    const keywords = strategy?.searchKeywords.join(" ") || tech;
    
    return this.generateBaseParameters(toolName, {
      ...context,
      problemType: `${tech} ${context.problemType}`
    });
  }

  /**
   * 应用错误模式增强
   */
  private static applyErrorPatternEnhancements(
    commands: MCPToolCall[],
    context: ContextAnalysis
  ): MCPToolCall[] {
    const enhancement = (this.ERROR_PATTERN_ENHANCEMENTS as any)[context.errorPattern];
    if (!enhancement) return commands;
    
    const enhanced = commands.map(cmd => ({
      ...cmd,
      priority: cmd.priority + enhancement.priorityBoost,
      parameters: this.enhanceParametersWithErrorContext(cmd.parameters, enhancement.searchModifiers)
    }));
    
    // 添加错误模式特定的工具
    enhancement.additionalTools.forEach((toolName: string) => {
      if (!enhanced.some(cmd => cmd.tool === toolName)) {
        enhanced.push({
          tool: toolName,
          priority: enhanced.length + 1,
          parameters: this.generateBaseParameters(toolName, context),
          rationale: `错误模式增强搜索 - ${context.errorPattern}`,
          timeout: 20000,
          expectedQuality: "HIGH"
        });
      }
    });
    
    return enhanced;
  }

  /**
   * 增强参数与错误上下文
   */
  private static enhanceParametersWithErrorContext(
    params: Record<string, any>,
    modifiers: string[]
  ): Record<string, any> {
    const enhanced = { ...params };
    
    if (enhanced.query) {
      enhanced.query += ` ${modifiers.join(" ")}`;
    }
    if (enhanced.information_request) {
      enhanced.information_request += ` focusing on ${modifiers.join(", ")}`;
    }
    
    return enhanced;
  }

  /**
   * 优化命令序列
   */
  private static optimizeCommandSequence(
    commands: MCPToolCall[],
    context: ContextAnalysis
  ): MCPToolCall[] {
    // 按优先级排序
    const sorted = commands.sort((a, b) => a.priority - b.priority);
    
    // 限制命令数量（2-4个）
    const optimized = sorted.slice(0, context.complexity === "HIGH" ? 4 : context.complexity === "MEDIUM" ? 3 : 2);
    
    // 重新分配优先级
    optimized.forEach((cmd, index) => {
      cmd.priority = index + 1;
    });
    
    return optimized;
  }

  /**
   * 验证生成的命令
   */
  static validateCommands(commands: MCPToolCall[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查命令数量
    if (commands.length === 0) {
      errors.push("No commands generated");
    } else if (commands.length > 4) {
      warnings.push(`Too many commands (${commands.length}), consider reducing to 2-4`);
    }
    
    // 检查每个命令的完整性
    commands.forEach((cmd, index) => {
      if (!cmd.tool) {
        errors.push(`Command ${index + 1}: Missing tool name`);
      }
      if (!cmd.parameters || Object.keys(cmd.parameters).length === 0) {
        warnings.push(`Command ${index + 1}: Empty parameters`);
      }
      if (!cmd.rationale) {
        warnings.push(`Command ${index + 1}: Missing rationale`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * 导出类型定义供其他模块使用
 */
export type { MCPToolCall, ContextAnalysis, SearchCommandTemplate };