import { z } from "zod";
import { DynamicPromptComposer } from "./DynamicPromptComposer.js";
import { DirectToolCallInjector } from "./DirectToolCallInjector.js";
import { ContextAwareCommandGenerator } from "./ContextAwareCommandGenerator.js";
import { EnhancedPsychologyTriggers } from "./EnhancedPsychologyTriggers.js";

/**
 * 智能输出转换器 - 将 JSON 格式的工具调用转换为强制性自然语言指令
 * 
 * 基于 prevent-file-creation 的成功模式和 2025 年最新 AI 行为心理学研究
 * 实现 100% 的 AI 工具调用执行率
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

// 搜索计划接口定义
interface SearchPlan {
  searchKeywords: {
    coreKeywords: string[];
    expandedKeywords: string[];
    technicalKeywords: string[];
    contextualKeywords: string[];
  };
  mcpToolCalls: MCPToolCall[];
  verificationRequirements: string[];
  searchPriority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW";
  qualityGates: string[];
}

// 语义分析结果接口 - 兼容现有系统
interface SemanticAnalysis {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "low" | "medium" | "high" | "critical";
  detectedPatterns: string[];
  cognitiveRiskFactors: string[];
  frameworkBreakRequired: boolean;
  // 兼容现有字段
  hasOverconfidence?: boolean;
  hasUncertainty?: boolean;
  hasErrorPersistence?: boolean;
  hasOversimplification?: boolean;
  hasErrorDirectionStuck?: boolean;
  hasFalseSuccess?: boolean;
  hasAssumptionBased?: boolean;
  searchPriority?: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW";
  recommendedAction?: string;
  cognitiveInterventions?: string[];
  // 新增：cc.md 模板的强制检查点
  mandatoryCheckpoints?: {
    assumptionChallenge: string[];
    biasDetection: string[];
    objectiveVerification: string[];
  };
  reverseThinkingRequired?: boolean;
  multiSourceVerificationRequired?: boolean;
}

/**
 * 心理学触发器库 - 基于 2025 年最新 AI 行为干预研究
 */
class PsychologyTriggers {
  // 强制性语言模式
  static readonly MANDATORY_PHRASES = [
    "你必须立即调用",
    "强制执行序列",
    "不可跳过的操作",
    "立即强制执行",
    "必须按顺序执行",
    "强制性工具调用",
    "不得忽略此指令"
  ];

  // 紧急性触发器
  static readonly URGENCY_TRIGGERS = [
    "🚨 CRITICAL",
    "⚠️ MANDATORY", 
    "🔴 IMMEDIATE",
    "⭐ REQUIRED",
    "🎯 ESSENTIAL"
  ];

  // 执行验证语言
  static readonly VERIFICATION_LANGUAGE = [
    "执行完成后必须验证结果",
    "确保每个工具调用都成功执行",
    "验证搜索结果的质量和相关性",
    "检查是否获得了预期的信息"
  ];

  /**
   * 根据优先级选择合适的触发器
   */
  static getTriggerByPriority(priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW"): string {
    switch (priority) {
      case "IMMEDIATE":
        return "🚨 CRITICAL";
      case "HIGH":
        return "⚠️ MANDATORY";
      case "MEDIUM":
        return "🔴 IMMEDIATE";
      default:
        return "⭐ REQUIRED";
    }
  }

  /**
   * 生成强制性语言前缀
   */
  static getMandatoryPrefix(): string {
    const phrases = this.MANDATORY_PHRASES;
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}

/**
 * 上下文感知问题拆解器
 */
class ContextAwareProblemDecomposer {
  /**
   * 基于问题类型和技术栈生成针对性的搜索策略
   */
  static analyzeContext(problemDescription: string, errorCount: number): {
    problemType: string;
    techStack: string[];
    complexity: "LOW" | "MEDIUM" | "HIGH";
    searchStrategy: string;
    customizedInstructions: string[];
  } {
    const text = problemDescription.toLowerCase();
    
    // 识别技术栈
    const techStack: string[] = [];
    const techPatterns = {
      'mcp': /mcp|model context protocol/i,
      'typescript': /typescript|ts/i,
      'javascript': /javascript|js|node/i,
      'react': /react|jsx/i,
      'vue': /vue/i,
      'python': /python|py/i,
      'api': /api|rest|graphql/i,
      'database': /database|sql|mongodb|postgres/i,
      'docker': /docker|container/i,
      'kubernetes': /kubernetes|k8s/i,
      'aws': /aws|amazon web services/i,
      'azure': /azure|microsoft cloud/i,
      'gcp': /gcp|google cloud/i
    };

    Object.entries(techPatterns).forEach(([tech, pattern]) => {
      if (pattern.test(text)) {
        techStack.push(tech);
      }
    });

    // 识别问题类型
    let problemType = "general";
    if (/error|fail|bug|issue|exception|crash/i.test(text)) {
      problemType = "error_resolution";
    } else if (/implement|create|build|develop|design/i.test(text)) {
      problemType = "implementation";
    } else if (/optimize|improve|enhance|performance|speed/i.test(text)) {
      problemType = "optimization";
    } else if (/config|setup|install|deploy|environment/i.test(text)) {
      problemType = "configuration";
    } else if (/security|auth|permission|vulnerability/i.test(text)) {
      problemType = "security";
    } else if (/test|testing|unit test|integration/i.test(text)) {
      problemType = "testing";
    }

    // 评估复杂度
    let complexity: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
    if (errorCount >= 3 || text.length > 200 || techStack.length > 3) {
      complexity = "HIGH";
    } else if (errorCount === 0 && text.length < 50 && techStack.length <= 1) {
      complexity = "LOW";
    }

    // 生成搜索策略
    const searchStrategy = this.generateSearchStrategy(problemType, techStack, complexity);
    
    // 生成定制化指令
    const customizedInstructions = this.generateCustomizedInstructions(problemType, techStack, errorCount);

    return {
      problemType,
      techStack,
      complexity,
      searchStrategy,
      customizedInstructions
    };
  }

  private static generateSearchStrategy(
    problemType: string, 
    techStack: string[], 
    complexity: "LOW" | "MEDIUM" | "HIGH"
  ): string {
    const strategies = {
      error_resolution: "优先搜索错误模式和解决方案，重点关注实际案例和调试方法",
      implementation: "搜索最佳实践和实现示例，关注代码质量和架构设计",
      optimization: "搜索性能优化和改进方案，关注最新技术和基准测试",
      configuration: "搜索配置指南和设置教程，关注官方文档和环境配置",
      security: "搜索安全最佳实践和漏洞防护，关注权威安全指南",
      testing: "搜索测试策略和框架使用，关注测试覆盖率和质量保证",
      general: "进行全面搜索，获取基础信息和背景知识"
    };

    return (strategies as any)[problemType] || strategies.general;
  }

  /**
   * 生成针对特定技术栈和错误类型的定制化指令
   */
  private static generateCustomizedInstructions(
    problemType: string,
    techStack: string[],
    errorCount: number
  ): string[] {
    const instructions: string[] = [];

    // 基于错误计数的特殊指令
    if (errorCount >= 3) {
      instructions.push("🚨 检测到重复失败模式，必须搜索替代解决方案");
      instructions.push("⚠️ 优先搜索 'troubleshooting' 和 'common issues' 相关内容");
    }

    // 基于技术栈的特殊指令
    if (techStack.includes('mcp')) {
      instructions.push("🔧 必须搜索 MCP 官方文档和最新规范");
      instructions.push("📚 重点关注 Model Context Protocol 的实现案例");
    }

    if (techStack.includes('typescript')) {
      instructions.push("🎯 搜索 TypeScript 类型定义和接口设计最佳实践");
      instructions.push("⚡ 关注 TypeScript 编译配置和性能优化");
    }

    if (techStack.includes('react')) {
      instructions.push("⚛️ 搜索 React 最新 Hooks 和组件设计模式");
      instructions.push("🔄 关注 React 状态管理和性能优化策略");
    }

    // 基于问题类型的特殊指令
    switch (problemType) {
      case 'error_resolution':
        instructions.push("🐛 必须搜索具体错误信息和堆栈跟踪解决方案");
        instructions.push("🔍 重点查找 GitHub Issues 和 Stack Overflow 讨论");
        break;
      case 'security':
        instructions.push("🔒 必须搜索 OWASP 安全指南和最新漏洞信息");
        instructions.push("🛡️ 关注安全审计工具和防护措施");
        break;
      case 'performance':
        instructions.push("⚡ 必须搜索性能基准测试和优化案例");
        instructions.push("📊 关注监控工具和性能分析方法");
        break;
    }

    return instructions;
  }
}

/**
 * 智能输出转换器主类
 */
export class IntelligentOutputFormatter {
  /**
   * 输入验证方法
   */
  private static validateInputs(
    searchPlan: SearchPlan,
    semanticAnalysis: SemanticAnalysis,
    problemDescription: string
  ): void {
    if (!searchPlan) {
      throw new Error("SearchPlan is required");
    }
    if (!semanticAnalysis) {
      throw new Error("SemanticAnalysis is required");
    }
    if (!problemDescription || problemDescription.trim().length === 0) {
      throw new Error("ProblemDescription cannot be empty");
    }
    if (!Array.isArray(searchPlan.mcpToolCalls)) {
      throw new Error("SearchPlan.mcpToolCalls must be an array");
    }
  }

  /**
   * 基于语义拆解生成搜索建议 - 参考 cc.md 模式
   */
  static convertToMandatoryInstructions(
    searchPlan: SearchPlan,
    semanticAnalysis: SemanticAnalysis,
    problemDescription: string,
    errorCount: number = 0,
    conversationContext: string = ""
  ): string {
    try {
      // 输入验证
      this.validateInputs(searchPlan, semanticAnalysis, problemDescription);
    } catch (error) {
      // 如果输入验证失败，返回基础搜索指令
      return this.generateFallbackInstructions(problemDescription);
    }

    // 🎯 使用智能提示词生成器进行语义拆解和搜索建议生成
    return this.generateSemanticBasedSearchAdvice(
      searchPlan,
      semanticAnalysis,
      problemDescription,
      errorCount,
      conversationContext
    );
  }

  /**
   * 增强版传统指令生成（作为动态提示词的回退方案）
   */
  private static generateEnhancedTraditionalInstructions(
    searchPlan: SearchPlan,
    semanticAnalysis: SemanticAnalysis,
    problemDescription: string,
    errorCount: number
  ): string {
    const context = ContextAwareProblemDecomposer.analyzeContext(problemDescription, errorCount);
    const trigger = PsychologyTriggers.getTriggerByPriority(searchPlan.searchPriority);
    
    let instructions = `${trigger} **强制搜索协议已激活**\n\n`;
    
    // 添加问题分析
    instructions += `**检测到问题类型**: ${context.problemType}\n`;
    instructions += `**技术栈**: ${context.techStack.join(", ") || "通用"}\n`;
    instructions += `**复杂度**: ${context.complexity}\n`;
    instructions += `**搜索策略**: ${context.searchStrategy}\n\n`;

    // 添加定制化指令
    if (context.customizedInstructions.length > 0) {
      instructions += `## 🎯 **针对性执行指令**\n\n`;
      context.customizedInstructions.forEach((instruction, index) => {
        instructions += `${index + 1}. ${instruction}\n`;
      });
      instructions += `\n`;
    }

    // 添加风险评估
    if (semanticAnalysis.frameworkBreakRequired) {
      instructions += `🚨 **框架跳出要求**: 检测到错误方向持续，必须立即停止当前方法\n\n`;
    }

    // 生成强制性工具调用序列 - 按新的优先级顺序重新排列
    const reorderedToolCalls = this.reorderToolCallsByPriority(searchPlan.mcpToolCalls, context);
    
    instructions += `## ${PsychologyTriggers.getMandatoryPrefix()}以下工具序列：\n\n`;
    instructions += `**🎯 搜索优先级策略**：\n`;
    instructions += `1. **官方文档优先** - 查询权威技术文档\n`;
    instructions += `2. **GitHub 代码分析** - 分析实际解决方案\n`;
    instructions += `3. **技术文档搜索** - 深度技术资料检索\n\n`;
    
    reorderedToolCalls.forEach((toolCall, index) => {
      const stepNumber = index + 1;
      const urgencyIcon = this.getUrgencyIcon(toolCall.priority);
      const genericInstruction = this.convertToGenericInstruction(toolCall, context);
      
      instructions += `### ${urgencyIcon} 步骤 ${stepNumber}: ${toolCall.rationale}\n\n`;
      instructions += `**${genericInstruction.action}**\n\n`;
      instructions += `**搜索内容**: ${genericInstruction.searchContent}\n`;
      instructions += `**搜索策略**: ${genericInstruction.strategy}\n`;
      if (genericInstruction.specificRequirements) {
        instructions += `**具体要求**: ${genericInstruction.specificRequirements}\n`;
      }
      instructions += `**预期质量**: ${toolCall.expectedQuality}\n\n`;
      instructions += `**执行要求**: 此步骤不可跳过，必须等待结果后再进行下一步\n\n`;
    });

    // 添加验证要求
    instructions += `## 🎯 **强制验证标准**\n\n`;
    searchPlan.verificationRequirements.forEach((requirement, index) => {
      instructions += `${index + 1}. ${requirement}\n`;
    });

    // 添加质量门控
    instructions += `\n## ✅ **质量门控检查**\n\n`;
    searchPlan.qualityGates.forEach((gate, index) => {
      instructions += `${index + 1}. ${gate}\n`;
    });

    // 添加关键词指导和搜索规则
    instructions += `\n## 🔍 **搜索关键词指导**\n\n`;
    instructions += `**核心关键词**: ${searchPlan.searchKeywords.coreKeywords.join(", ")}\n`;
    instructions += `**技术关键词**: ${searchPlan.searchKeywords.technicalKeywords.join(", ")}\n`;
    instructions += `**上下文关键词**: ${searchPlan.searchKeywords.contextualKeywords.join(", ")}\n\n`;
    
    instructions += `## ⚠️ **重要搜索规则**\n\n`;
    instructions += `**官方文档优先策略**:\n`;
    instructions += `1. 🏛️ **官方文档优先** - 首先查询相关编程语言或框架的官方网站文档\n`;
    instructions += `2. 🔍 **GitHub 代码分析** - 分析相关项目的 Pull Requests、Issues 和代码实现示例\n`;
    instructions += `3. 📚 **技术文档搜索** - 使用 gitmcp-docs 进行深度技术文档搜索\n\n`;
    
    instructions += `**精确搜索要求**:\n`;
    instructions += `- ✅ 使用精确的技术关键词，避免添加描述性词汇\n`;
    instructions += `- ✅ GitHub 搜索不要附加描述词，否则搜索不到\n`;
    instructions += `- ✅ 保持搜索词简洁，以提高搜索准确性\n`;
    instructions += `- ✅ 专注于核心技术术语和具体问题描述\n\n`;
    
    instructions += `**搜索目标**: 快速定位同类问题场景，找到经过验证的解决方案和最佳实践\n\n`;

    // 添加执行后续步骤
    instructions += `## 🚀 **执行完成后的下一步**\n\n`;
    instructions += `1. **验证搜索结果质量**: 确保获得了相关和权威的信息\n`;
    instructions += `2. **整合搜索结果**: 将多个来源的信息进行综合分析\n`;
    instructions += `3. **提供基于证据的解决方案**: 基于搜索结果而非预训练知识\n`;
    instructions += `4. **记录搜索过程**: 为后续参考保存关键发现\n\n`;

    // 添加强制性结尾
    instructions += `---\n\n`;
    instructions += `**⚠️ 重要提醒**: 此搜索序列是强制性的，不得跳过任何步骤。每个工具调用都必须执行并验证结果。只有完成所有步骤后，才能基于搜索结果提供最终答案。\n\n`;
    instructions += `**🎯 成功标准**: 100% 执行率，获得高质量的搜索结果，基于最新信息提供准确的技术解决方案。`;

    return instructions;
  }

  /**
   * 根据新的优先级策略重新排序工具调用
   * 优先级：1. 官方文档 2. GitHub 代码分析 3. 技术文档搜索 4. 其他
   */
  private static reorderToolCallsByPriority(
    toolCalls: MCPToolCall[],
    context: any
  ): MCPToolCall[] {
    const reordered: MCPToolCall[] = [];
    
    // 1. 官方文档优先 - context7-mcp, gitmcp-docs
    const officialDocs = toolCalls.filter(call => 
      call.tool.includes('context7') || 
      call.tool.includes('gitmcp-docs') ||
      call.tool.includes('fetch_generic_documentation')
    );
    
    // 2. GitHub 代码分析 - github-mcp 相关工具
    const githubAnalysis = toolCalls.filter(call => 
      call.tool.includes('github') && 
      !call.tool.includes('gitmcp-docs')
    );
    
    // 3. 技术文档搜索 - web search 工具
    const techSearch = toolCalls.filter(call => 
      call.tool.includes('web_search') || 
      call.tool.includes('exa') || 
      call.tool.includes('tavily')
    );
    
    // 4. 代码库分析 - codebase-retrieval
    const codebaseAnalysis = toolCalls.filter(call => 
      call.tool.includes('codebase-retrieval')
    );
    
    // 5. 其他工具
    const others = toolCalls.filter(call => 
      !officialDocs.includes(call) && 
      !githubAnalysis.includes(call) && 
      !techSearch.includes(call) && 
      !codebaseAnalysis.includes(call)
    );
    
    // 按新优先级顺序组合，并更新 rationale
    let priority = 1;
    
    // 官方文档优先
    officialDocs.forEach(call => {
      reordered.push({
        ...call,
        priority: priority++,
        rationale: `🏛️ 官方文档查询: ${this.getOfficialDocRationale(call.tool, context)}`
      });
    });
    
    // GitHub 代码分析
    githubAnalysis.forEach(call => {
      reordered.push({
        ...call,
        priority: priority++,
        rationale: `🔍 GitHub 代码分析: ${this.getGitHubRationale(call.tool, context)}`,
        parameters: this.optimizeGitHubSearchParams(call.parameters, context)
      });
    });
    
    // 技术文档搜索
    techSearch.forEach(call => {
      reordered.push({
        ...call,
        priority: priority++,
        rationale: `📚 技术文档搜索: ${this.getTechSearchRationale(call.tool, context)}`
      });
    });
    
    // 代码库分析
    codebaseAnalysis.forEach(call => {
      reordered.push({
        ...call,
        priority: priority++,
        rationale: `💻 代码库分析: ${call.rationale}`
      });
    });
    
    // 其他工具
    others.forEach(call => {
      reordered.push({
        ...call,
        priority: priority++
      });
    });
    
    return reordered;
  }

  /**
   * 生成官方文档查询的说明
   */
  private static getOfficialDocRationale(tool: string, context: any): string {
    const techStack = context.techStack || [];
    if (techStack.includes('react')) {
      return "查询 React 官方文档，获取权威的最佳实践和解决方案";
    } else if (techStack.includes('typescript')) {
      return "查询 TypeScript 官方文档，获取类型系统和编译器相关信息";
    } else if (techStack.includes('node') || techStack.includes('javascript')) {
      return "查询 Node.js/JavaScript 官方文档，获取标准 API 和实现指南";
    } else if (techStack.includes('python')) {
      return "查询 Python 官方文档，获取标准库和语言特性说明";
    }
    return "查询相关技术的官方文档，获取权威技术资料";
  }

  /**
   * 生成 GitHub 分析的说明
   */
  private static getGitHubRationale(tool: string, context: any): string {
    if (tool.includes('search_issues')) {
      return "搜索 GitHub Issues，查找同类问题和解决方案";
    } else if (tool.includes('search_code')) {
      return "搜索 GitHub 代码实现，分析实际解决方案";
    } else if (tool.includes('pull_request')) {
      return "分析相关 Pull Requests，学习最佳实践";
    }
    return "分析 GitHub 项目，获取实际代码示例和解决方案";
  }

  /**
   * 生成技术搜索的说明
   */
  private static getTechSearchRationale(tool: string, context: any): string {
    if (tool.includes('exa')) {
      return "使用 EXA 进行深度技术文档搜索";
    } else if (tool.includes('tavily')) {
      return "使用 Tavily 搜索最新技术资料和教程";
    }
    return "搜索技术文档和最新资料";
  }

  /**
   * 优化 GitHub 搜索参数，使用精确的技术关键词
   */
  private static optimizeGitHubSearchParams(params: any, context: any): any {
    const optimized = { ...params };
    
    if (optimized.q || optimized.query) {
      const searchTerm = optimized.q || optimized.query;
      // 提取核心技术关键词，移除描述性词汇
      const coreKeywords = this.extractCoreKeywords(searchTerm, context);
      optimized.q = coreKeywords;
      if (optimized.query) {
        optimized.query = coreKeywords;
      }
    }
    
    return optimized;
  }



  /**
   * 将具体工具调用转换为通用引导语
   */
  private static convertToGenericInstruction(toolCall: MCPToolCall, context: any): {
    action: string;
    searchContent: string;
    strategy: string;
    specificRequirements?: string;
  } {
    const tool = toolCall.tool.toLowerCase();
    
    // 官方文档类工具
    if (tool.includes('context7') || tool.includes('gitmcp-docs') || tool.includes('documentation')) {
      return {
        action: "你必须使用官方文档查询工具",
        searchContent: this.extractSearchContent(toolCall.parameters),
        strategy: "查询相关技术的官方文档，获取权威的 API 说明、最佳实践和标准实现方法",
        specificRequirements: "优先查找官方网站、官方 GitHub 仓库的文档部分"
      };
    }
    
    // GitHub 相关工具
    if (tool.includes('github')) {
      const searchType = this.determineGitHubSearchType(tool);
      return {
        action: "你必须使用 GitHub MCP 搜索工具",
        searchContent: this.extractSearchContent(toolCall.parameters),
        strategy: `搜索 GitHub ${searchType}，分析实际代码实现和解决方案`,
        specificRequirements: "使用精确的技术关键词，避免添加描述性词汇，否则搜索不到相关结果"
      };
    }
    
    // EXA 搜索工具
    if (tool.includes('exa')) {
      return {
        action: "你必须使用 EXA 搜索工具",
        searchContent: this.extractSearchContent(toolCall.parameters),
        strategy: "进行深度技术文档搜索，查找权威技术资料和最新解决方案",
        specificRequirements: "专注于技术博客、官方文档、权威技术网站"
      };
    }
    
    // Tavily 搜索工具
    if (tool.includes('tavily')) {
      return {
        action: "你必须使用 Tavily 搜索工具",
        searchContent: this.extractSearchContent(toolCall.parameters),
        strategy: "搜索最新技术资料、教程和最佳实践",
        specificRequirements: "使用高级搜索模式，获取 2025 年最新的技术解决方案"
      };
    }
    
    // 代码库分析工具
    if (tool.includes('codebase-retrieval')) {
      return {
        action: "你必须使用代码库分析工具",
        searchContent: this.extractSearchContent(toolCall.parameters),
        strategy: "分析当前项目代码库，查找相关实现和模式",
        specificRequirements: "获取实际代码状态，避免基于假设进行分析"
      };
    }
    
    // 默认通用工具
    return {
      action: "你必须使用相应的 MCP 搜索工具",
      searchContent: this.extractSearchContent(toolCall.parameters),
      strategy: "根据问题类型选择最合适的搜索策略",
      specificRequirements: "确保搜索结果的相关性和权威性"
    };
  }

  /**
   * 从工具参数中提取搜索内容
   */
  private static extractSearchContent(parameters: any): string {
    if (parameters.query) return parameters.query;
    if (parameters.q) return parameters.q;
    if (parameters.information_request) return parameters.information_request;
    if (parameters.search_term) return parameters.search_term;
    return "相关技术问题";
  }

  /**
   * 确定 GitHub 搜索类型
   */
  private static determineGitHubSearchType(tool: string): string {
    if (tool.includes('issues')) return "Issues（问题讨论）";
    if (tool.includes('code')) return "代码实现";
    if (tool.includes('pull') || tool.includes('pr')) return "Pull Requests（代码变更）";
    if (tool.includes('repo')) return "仓库";
    return "相关内容";
  }

  /**
   * 根据优先级获取紧急性图标
   */
  private static getUrgencyIcon(priority: number): string {
    if (priority === 1) return "🏛️"; // 官方文档
    if (priority === 2) return "🔍"; // GitHub 分析
    if (priority === 3) return "📚"; // 技术搜索
    if (priority === 4) return "💻"; // 代码库分析
    return "⭐";
  }

  /**
   * 生成简化版本的强制指令（用于低复杂度场景）
   */
  static convertToSimplifiedInstructions(
    searchPlan: SearchPlan,
    problemDescription: string
  ): string {
    const trigger = PsychologyTriggers.getTriggerByPriority(searchPlan.searchPriority);
    const context = ContextAwareProblemDecomposer.analyzeContext(problemDescription, 0);
    
    // 应用新的优先级排序
    const reorderedToolCalls = this.reorderToolCallsByPriority(searchPlan.mcpToolCalls, context);
    
    let instructions = `${trigger} **你必须立即执行以下搜索操作**\n\n`;
    instructions += `**🎯 优先级策略**: 官方文档 → GitHub 代码 → 技术搜索\n\n`;
    
    reorderedToolCalls.forEach((toolCall, index) => {
      const icon = this.getUrgencyIcon(toolCall.priority);
      const genericInstruction = this.convertToGenericInstruction(toolCall, context);
      
      instructions += `${index + 1}. ${icon} **${genericInstruction.action}**\n`;
      instructions += `   搜索内容: ${genericInstruction.searchContent}\n`;
      instructions += `   目的: ${toolCall.rationale}\n\n`;
    });

    instructions += `**⚠️ 重要搜索规则**:\n`;
    instructions += `- 使用精确的技术关键词，避免添加描述性词汇\n`;
    instructions += `- GitHub 搜索不要附加描述词，否则搜索不到\n`;
    instructions += `- 保持搜索词简洁，专注于核心技术术语\n\n`;
    instructions += `**执行要求**: 按顺序执行所有工具调用，不得跳过任何步骤。`;

    return instructions;
  }

  /**
   * 处理边界情况和错误场景的特殊转换
   */
  static handleEdgeCases(
    searchPlan: SearchPlan,
    semanticAnalysis: SemanticAnalysis,
    problemDescription: string,
    errorCount: number
  ): string {
    // 处理高错误计数场景
    if (errorCount >= 5) {
      return this.generateCriticalInterventionInstructions(searchPlan, problemDescription);
    }

    // 处理框架跳出要求
    if (semanticAnalysis.frameworkBreakRequired) {
      return this.generateFrameworkBreakInstructions(searchPlan, problemDescription);
    }

    // 处理空工具调用列表
    if (searchPlan.mcpToolCalls.length === 0) {
      return this.generateFallbackInstructions(problemDescription);
    }

    // 默认使用标准转换
    return this.convertToMandatoryInstructions(searchPlan, semanticAnalysis, problemDescription, errorCount);
  }

  /**
   * 生成关键干预指令（用于高错误计数场景）
   */
  private static generateCriticalInterventionInstructions(
    searchPlan: SearchPlan,
    problemDescription: string
  ): string {
    let instructions = `🚨 **CRITICAL INTERVENTION REQUIRED** 🚨\n\n`;
    instructions += `检测到重复失败模式（错误计数 ≥ 5），启动紧急干预协议。\n\n`;
    instructions += `## ⚠️ **强制停止当前方法**\n\n`;
    instructions += `1. **立即停止**当前的解决方案尝试\n`;
    instructions += `2. **重新评估**问题的根本原因\n`;
    instructions += `3. **寻找完全不同**的解决角度\n\n`;
    instructions += `## 🔄 **强制替代搜索序列**\n\n`;
    
    // 生成替代搜索策略
    instructions += `你必须立即执行以下替代搜索：\n\n`;
    instructions += `1. **搜索根本原因**: 使用关键词 "root cause analysis ${problemDescription}"\n`;
    instructions += `2. **搜索替代方案**: 使用关键词 "alternative solutions ${problemDescription}"\n`;
    instructions += `3. **搜索专家建议**: 使用关键词 "expert recommendations ${problemDescription}"\n\n`;
    instructions += `**执行要求**: 必须获得至少 3 个不同的解决角度后才能继续。`;

    return instructions;
  }

  /**
   * 生成框架跳出指令
   */
  private static generateFrameworkBreakInstructions(
    searchPlan: SearchPlan,
    problemDescription: string
  ): string {
    let instructions = `🚨 **FRAMEWORK BREAK PROTOCOL ACTIVATED** 🚨\n\n`;
    instructions += `检测到认知框架限制，启动强制跳出机制。\n\n`;
    instructions += `## 🔄 **认知重置要求**\n\n`;
    instructions += `1. **质疑所有假设**: 重新审视问题的基本假设\n`;
    instructions += `2. **寻找反向证据**: 搜索与当前方法相反的观点\n`;
    instructions += `3. **探索边缘案例**: 关注异常情况和特殊场景\n\n`;
    
    // 执行标准搜索序列，但添加框架跳出要求
    searchPlan.mcpToolCalls.forEach((toolCall, index) => {
      instructions += `### 🔍 步骤 ${index + 1}: ${toolCall.rationale}\n`;
      instructions += `**工具**: \`${toolCall.tool}\`\n`;
      instructions += `**特殊要求**: 寻找与当前假设相矛盾的信息\n\n`;
    });

    return instructions;
  }

  /**
   * 生成回退指令（用于空工具调用场景）
   */
  private static generateFallbackInstructions(problemDescription: string): string {
    let instructions = `⚠️ **FALLBACK SEARCH PROTOCOL** ⚠️\n\n`;
    instructions += `未检测到具体搜索计划，启动通用搜索协议。\n\n`;
    instructions += `## 🔍 **你必须立即执行以下搜索**\n\n`;
    instructions += `1. **立即调用** \`codebase-retrieval\`\n`;
    instructions += `   参数: {"information_request": "${problemDescription} implementation analysis"}\n\n`;
    instructions += `2. **立即调用** \`web_search_exa_exa-mcp-server\`\n`;
    instructions += `   参数: {"query": "${problemDescription} 2025 best practices", "numResults": 3}\n\n`;
    instructions += `3. **立即调用** \`tavily-remote-mcp-tavily_search_mcphub-proxy\`\n`;
    instructions += `   参数: {"query": "${problemDescription} solutions", "search_depth": "advanced"}\n\n`;
    instructions += `**执行要求**: 必须按顺序执行所有工具调用，获得基础信息后再提供解决方案。`;

    return instructions;
  }

  /**
   * ## 🚨 AI Development Standards v4.0 完整合规指令生成
   * **强制要求**：集成 DirectToolCallInjector、ContextAwareCommandGenerator 和 EnhancedPsychologyTriggers
   * **目标**：实现 95%+ 的 AI 工具调用执行率
   */
  private static generateAIStandardsV4CompliantInstructions(
    searchPlan: SearchPlan,
    semanticAnalysis: SemanticAnalysis,
    problemDescription: string,
    errorCount: number,
    conversationContext: string
  ): string {
    console.log("🚨 FORCE: 使用完整集成版 AI Development Standards v4.0 格式");
    
    try {
      // Step 1: 使用 ContextAwareCommandGenerator 生成智能命令
      const techStack = this.extractTechStackFromDescription(problemDescription);
      const smartCommands = ContextAwareCommandGenerator.generateSmartCommands(
        problemDescription,
        techStack,
        errorCount,
        conversationContext
      );
      
      // Step 2: 构建触发器上下文
      const triggerContext = {
        errorCount,
        urgencyLevel: this.mapPriorityToUrgency(searchPlan.searchPriority),
        frameworkBreakRequired: semanticAnalysis.frameworkBreakRequired || false,
        aiResistanceLevel: this.assessAIResistanceLevel(errorCount, conversationContext),
        previousFailures: this.extractPreviousFailures(conversationContext)
      };
      
      // Step 3: 选择触发器强度
      const triggerIntensity = this.determineTriggerIntensity(errorCount, semanticAnalysis);
      
      // Step 4: 使用 EnhancedPsychologyTriggers 生成强制执行提示词
      const forceExecutionPrompt = EnhancedPsychologyTriggers.generateForceExecutionPrompt(
        smartCommands,
        triggerContext,
        triggerIntensity
      );
      
      // Step 5: 使用 DirectToolCallInjector 生成直接工具调用指令（作为备用）
      const directInstructions = DirectToolCallInjector.generateExecutableInstructions(
        searchPlan.mcpToolCalls,
        searchPlan.searchPriority,
        {
          problemDescription,
          errorCount,
          frameworkBreakRequired: semanticAnalysis.frameworkBreakRequired
        }
      );
      
      // Step 6: 组装完整的 AI Development Standards v4.0 格式
      const compliantInstructions = this.assembleCompleteAIStandardsFormatOld(
        forceExecutionPrompt,
        directInstructions,
        problemDescription,
        errorCount,
        semanticAnalysis,
        smartCommands
      );
      
      console.log("✅ SUCCESS: 完整集成版指令生成成功");
      return compliantInstructions;
      
    } catch (error) {
      console.error("❌ ERROR: 集成版指令生成失败，使用回退方案", error);
      
      // 回退到简化版本
      return this.generateFallbackAIStandardsInstructions(
        searchPlan,
        problemDescription,
        errorCount
      );
    }
  }

  /**
   * 从问题描述中提取技术栈
   */
  private static extractTechStackFromDescription(description: string): string[] {
    const text = description.toLowerCase();
    const techStack: string[] = [];
    
    const techPatterns = {
      mcp: /mcp|model context protocol|anthropic/,
      typescript: /typescript|ts|type|interface/,
      javascript: /javascript|js|node|npm/,
      react: /react|jsx|component|hook/,
      vue: /vue|vuejs/,
      python: /python|py|pip/,
      java: /java|spring/,
      database: /sql|database|mysql|postgres/,
      docker: /docker|container/,
      aws: /aws|amazon|s3|ec2/
    };
    
    for (const [tech, pattern] of Object.entries(techPatterns)) {
      if (pattern.test(text)) {
        techStack.push(tech);
      }
    }
    
    return techStack;
  }
  
  /**
   * 将搜索优先级映射到紧急程度
   */
  private static mapPriorityToUrgency(priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW"): "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW" {
    switch (priority) {
      case "IMMEDIATE":
        return "EMERGENCY";
      case "HIGH":
        return "HIGH";
      case "MEDIUM":
        return "MEDIUM";
      default:
        return "LOW";
    }
  }
  
  /**
   * 评估 AI 抗性级别
   */
  private static assessAIResistanceLevel(errorCount: number, conversationContext: string): "HIGH" | "MEDIUM" | "LOW" {
    let resistanceScore = 0;
    
    // 基于错误计数
    resistanceScore += errorCount * 0.5;
    
    // 基于对话上下文中的抗性指标
    const resistancePatterns = /skip|ignore|assume|probably|think|maybe|should work/gi;
    const matches = conversationContext.match(resistancePatterns);
    if (matches) {
      resistanceScore += matches.length * 0.3;
    }
    
    if (resistanceScore >= 3) return "HIGH";
    if (resistanceScore >= 1.5) return "MEDIUM";
    return "LOW";
  }
  
  /**
   * 从对话上下文中提取之前的失败信息
   */
  private static extractPreviousFailures(conversationContext: string): string[] {
    const failures: string[] = [];
    const failurePatterns = [
      /failed to|error|exception|not working|doesn't work/gi,
      /tried.*but|attempted.*failed|couldn't.*work/gi
    ];
    
    failurePatterns.forEach(pattern => {
      const matches = conversationContext.match(pattern);
      if (matches) {
        failures.push(...matches.slice(0, 3)); // 限制数量
      }
    });
    
    return failures.length > 0 ? failures : ["未检测到具体失败信息"];
  }
  
  /**
   * 确定触发器强度
   */
  private static determineTriggerIntensity(
    errorCount: number, 
    semanticAnalysis: SemanticAnalysis
  ): "ABSOLUTE" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (errorCount >= 5 || semanticAnalysis.frameworkBreakRequired) {
      return "ABSOLUTE";
    }
    if (errorCount >= 3 || semanticAnalysis.riskLevel === "CRITICAL" || semanticAnalysis.riskLevel === "critical") {
      return "CRITICAL";
    }
    if (errorCount >= 1 || semanticAnalysis.riskLevel === "HIGH" || semanticAnalysis.riskLevel === "high") {
      return "HIGH";
    }
    return "MEDIUM";
  }
  
  /**
   * 组装完整的 AI Development Standards v4.0 格式
   */
  private static assembleCompleteAIStandardsFormatOld(
    forceExecutionPrompt: string,
    directInstructions: string,
    problemDescription: string,
    errorCount: number,
    semanticAnalysis: SemanticAnalysis,
    smartCommands: any[]
  ): string {
    // Generate dynamic header based on context
    const projectType = this.detectProjectType(problemDescription);
    const aiResistance = this.assessAIResistanceLevel(errorCount, '');
    const errorPattern = errorCount >= 3 ? 'REPEATED_FAILURE_PATTERN' : 'STANDARD_PROCESSING';
    
    // Build dynamic tool sequence from smart commands
    const toolSequence = smartCommands.map((cmd, index) => 
      `${index + 1}. EXECUTE: ${cmd.tool} with parameters: ${JSON.stringify(cmd.parameters)}`
    ).join('\n');
    
    // 生成基于 cc.md 模板的强制检查点
    const checkpoints = semanticAnalysis.mandatoryCheckpoints || {
      assumptionChallenge: ["Challenge your fundamental assumptions about the problem"],
      biasDetection: ["Are you avoiding tool calls or treating them as suggestions?"],
      objectiveVerification: ["Execute codebase-retrieval to verify actual code state"]
    };

    let compliantFormat = `# AI Development Standards v4.0

**Effective Date**: 2025-08-24
**Version**: 4.0 - Enhanced with Force Search Protocol
**Scope**: Universal AI-assisted development practices with integrated tool execution
**Compliance**: Mandatory for all AI development workflows

## CRITICAL THINKING PROTOCOL v4.0 ACTIVATED

### MANDATORY COGNITIVE BIAS INTERVENTION
**DETECTED ISSUE**: AI behavior patterns indicate potential cognitive bias and error direction persistence

### FORCED CRITICAL THINKING CHECKPOINTS
**BEFORE ANY SEARCH - YOU MUST COMPLETE THESE STEPS:**

#### 1. ASSUMPTION CHALLENGE (MANDATORY)
${checkpoints.assumptionChallenge.map((check: string) => `- **${check}**`).join('\n')}
- **Problem Context**: ${problemDescription.slice(0, 100)}...
- **Error Count**: ${errorCount}
- **Framework Break Required**: ${semanticAnalysis.frameworkBreakRequired ? 'YES' : 'NO'}

#### 2. BIAS DETECTION (REQUIRED)
${checkpoints.biasDetection.map((check: string) => `- **${check}**`).join('\n')}
- **Previous Attempts**: ${errorCount > 0 ? 'Multiple approaches attempted' : 'Initial attempt'}
- **Time Stuck**: ${errorCount > 2 ? 'Extended troubleshooting period' : 'Standard processing time'}

#### 3. OBJECTIVE VERIFICATION (CRITICAL)
${checkpoints.objectiveVerification.map((check: string) => `- **${check}**`).join('\n')}
**Project Type Detected**: ${projectType}
**Error Context**: ${errorPattern}
**AI Resistance Level**: ${aiResistance}
**Smart Commands Generated**: ${smartCommands.length}
**Command Types**: ${smartCommands.map(cmd => cmd.tool).join(', ')}

## EVIDENCE-BASED SEARCH SEQUENCE

${forceExecutionPrompt}

## MANDATORY TOOL EXECUTION SEQUENCE

### REQUIRED ACTIONS
${toolSequence}

### EXECUTION REQUIREMENTS
- Execute each tool in the specified order
- Verify successful completion before proceeding
- Return structured results for analysis

${semanticAnalysis.reverseThinkingRequired ? `
### REVERSE THINKING REQUIREMENTS (MANDATORY)
**For EACH search result, you MUST:**
1. **Seek contradictory evidence**: What argues AGAINST your approach?
2. **List failure scenarios**: How could this solution fail?
3. **Challenge assumptions**: What if your premise is wrong?
4. **Alternative perspectives**: What would a critic say?
` : ''}

${semanticAnalysis.multiSourceVerificationRequired ? `
### MULTI-SOURCE VERIFICATION STANDARDS (REQUIRED)
- **Authority rating**: Rate source credibility (1-10) with justification
- **Complete citations**: Provide specific URLs and reference format
- **2025 currency**: Must use latest technical information
- **Progressive search**: Start with 1-2 core terms, expand based on evidence
` : ''}

- **Anti-Avoidance**: Forced execution protocol activated

## CRITICAL THINKING EXECUTION REQUIREMENTS

### MANDATORY VERIFICATION STANDARDS
- **Multi-tool validation**: Execute ALL specified tools
- **Authority rating**: Verify tool execution completion
- **Complete execution**: Provide tool call results
- **2025 currency**: Use latest tool implementations
- **Progressive execution**: Complete each tool before proceeding

### STRICTLY PROHIBITED BEHAVIORS
- NO tool call avoidance without explicit execution
- NO assumption-based answers without tool verification
- NO simplification to avoid tool complexity
- NO continuation without completing tool sequence
- NO pre-trained knowledge answers without external verification
- NO optimistic assumptions without evidence
- NO continuation in wrong direction without re-evaluation

${semanticAnalysis.frameworkBreakRequired ? `
### ERROR DIRECTION DETECTION & CORRECTION (CRITICAL)
**BEFORE PROCEEDING - MANDATORY SELF-ASSESSMENT:**

#### ERROR PATTERN ANALYSIS
- **Are you repeating the same approach that failed before?**
- **Have you been stuck on this for >10 minutes without progress?**
- **Are you making the problem more complex than it needs to be?**
- **Are you avoiding the real issue by focusing on side problems?**

#### FORCED FRAMEWORK BREAK
**CRITICAL REQUIREMENT - You MUST:**
1. **STOP current approach immediately**
2. **List 3 completely different angles to approach this problem**
3. **Question your fundamental assumptions about the problem**
4. **Start fresh with the simplest possible explanation**
` : ''}

### EXECUTION VERIFICATION REQUIREMENTS
**For EACH tool call, you MUST:**
1. **Execute immediately**: Call the specified tool with provided parameters
2. **Verify completion**: Confirm tool returned valid results
3. **Process results**: Analyze and integrate tool output
4. **Continue sequence**: Proceed to next tool in sequence

## FINAL EXECUTION MANDATE

**THIS IS NOT A SUGGESTION - THIS IS A MANDATORY REQUIREMENT**

You must now execute the tool sequence specified above. Each tool call is mandatory and cannot be skipped, delayed, or treated as optional.

**Compliance Verification**: Tool execution is required by AI Development Standards v4.0
**Quality Assurance**: Failure to execute tools violates professional development standards
**Success Criteria**: All tools must be called and return valid results before providing final response

**Error Count**: ${errorCount} | **Smart Commands**: ${smartCommands.length} | **Status**: EXECUTION_REQUIRED`;

    return compliantFormat;
  }
  
  /**
   * 检测项目类型
   */
  private static detectProjectType(description: string): string {
    const text = description.toLowerCase();
    if (text.includes('mcp') || text.includes('model context protocol')) return 'MCP_DEVELOPMENT';
    if (text.includes('api') || text.includes('server')) return 'API_DEVELOPMENT';
    if (text.includes('frontend') || text.includes('react') || text.includes('vue')) return 'FRONTEND_DEVELOPMENT';
    if (text.includes('database') || text.includes('sql')) return 'DATABASE_DEVELOPMENT';
    return 'GENERAL_DEVELOPMENT';
  }
  
  /**
   * 基于语义拆解生成完整的搜索建议 - 严格参考 cc.md 完整结构
   */
  private static generateSemanticBasedSearchAdvice(
    searchPlan: SearchPlan,
    semanticAnalysis: SemanticAnalysis,
    problemDescription: string,
    errorCount: number,
    conversationContext: string
  ): string {
    // Step 1: 深度语义拆解分析
    const semanticBreakdown = this.performDeepSemanticAnalysis(problemDescription, conversationContext, errorCount);
    
    // Step 2: 生成完整的 AI Development Standards 格式
    return this.assembleCompleteAIStandardsFormat(semanticBreakdown, searchPlan, problemDescription, errorCount, conversationContext);
  }

  /**
   * 执行深度语义分析 - 基于 cc.md 模式的完整分析
   */
  private static performDeepSemanticAnalysis(problemDescription: string, conversationContext: string, errorCount: number): {
    // 基础语义信息
    technicalDomain: string;
    problemType: string;
    keyTerms: string[];
    errorContext: string;
    uncertaintyLevel: string;
    searchIntent: string;
    
    // 批判性思维检查点
    assumptionChallenges: string[];
    biasDetections: string[];
    objectiveVerifications: string[];
    
    // 错误方向检测
    errorPatternAnalysis: string[];
    frameworkBreakRequired: boolean;
    frameworkBreakActions: string[];
    
    // 搜索策略
    prioritizedSearchSequence: Array<{
      tool: string;
      query: string;
      purpose: string;
      priority: string;
      rationale: string;
    }>;
    
    // 验证要求
    verificationStandards: string[];
    reverseThinkingRequirements: string[];
    authorityRatingCriteria: string[];
  } {
    const text = problemDescription.toLowerCase();
    const fullContext = `${problemDescription} ${conversationContext}`.toLowerCase();
    
    // 基础语义分析
    const technicalDomain = this.identifyTechnicalDomain(text);
    const problemType = this.analyzeProblemType(text);
    const keyTerms = this.extractKeyTerms(text);
    const errorContext = this.analyzeErrorContext(fullContext);
    const uncertaintyLevel = this.assessUncertaintyLevel(fullContext);
    const searchIntent = this.identifySearchIntent(fullContext);
    
    // 生成批判性思维检查点
    const assumptionChallenges = this.generateAssumptionChallenges(problemDescription, errorContext, errorCount);
    const biasDetections = this.generateBiasDetections(fullContext, errorContext);
    const objectiveVerifications = this.generateObjectiveVerifications(technicalDomain, problemType);
    
    // 错误方向检测
    const errorPatternAnalysis = this.analyzeErrorPatterns(fullContext, errorCount);
    const frameworkBreakRequired = errorCount >= 3 || errorContext === "重复失败";
    const frameworkBreakActions = frameworkBreakRequired ? this.generateFrameworkBreakActions(problemType) : [];
    
    // 生成优先级搜索序列
    const prioritizedSearchSequence = this.generatePrioritizedSearchSequence(technicalDomain, problemType, keyTerms, errorCount);
    
    // 生成验证要求
    const verificationStandards = this.generateVerificationStandards(errorCount, problemType);
    const reverseThinkingRequirements = this.generateReverseThinkingRequirements(problemType, errorContext);
    const authorityRatingCriteria = this.generateAuthorityRatingCriteria(technicalDomain);
    
    return {
      technicalDomain,
      problemType,
      keyTerms,
      errorContext,
      uncertaintyLevel,
      searchIntent,
      assumptionChallenges,
      biasDetections,
      objectiveVerifications,
      errorPatternAnalysis,
      frameworkBreakRequired,
      frameworkBreakActions,
      prioritizedSearchSequence,
      verificationStandards,
      reverseThinkingRequirements,
      authorityRatingCriteria
    };
  }



  /**
   * 组装完整的 AI Development Standards 格式输出 - 严格参考 cc.md 结构
   */
  private static assembleCompleteAIStandardsFormat(
    semanticBreakdown: any,
    searchPlan: SearchPlan,
    problemDescription: string,
    errorCount: number,
    conversationContext: string
  ): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let output = `# AI Development Standards v4.0

**Effective Date**: ${currentDate}
**Version**: 4.0 - Enhanced with Force Search Protocol
**Scope**: Universal AI-assisted development practices with integrated tool execution
**Compliance**: Mandatory for all AI development workflows

## CRITICAL THINKING PROTOCOL v4.0 ACTIVATED

### MANDATORY COGNITIVE BIAS INTERVENTION
**DETECTED ISSUE**: AI behavior patterns indicate potential cognitive bias and error direction persistence

### FORCED CRITICAL THINKING CHECKPOINTS
**BEFORE ANY SEARCH - YOU MUST COMPLETE THESE STEPS:**

#### 1. ASSUMPTION CHALLENGE (MANDATORY)
${semanticBreakdown.assumptionChallenges.map((challenge: string) => `- **${challenge}**`).join('\n')}
- **Problem Context**: ${problemDescription.slice(0, 100)}...
- **Error Count**: ${errorCount}
- **Framework Break Required**: ${semanticBreakdown.frameworkBreakRequired ? 'YES' : 'NO'}

#### 2. BIAS DETECTION (REQUIRED)
${semanticBreakdown.biasDetections.map((bias: string) => `- **${bias}**`).join('\n')}
- **Previous Attempts**: ${errorCount > 0 ? 'Multiple approaches attempted' : 'Initial attempt'}
- **Time Stuck**: ${errorCount > 2 ? 'Extended troubleshooting period' : 'Standard processing time'}

#### 3. OBJECTIVE VERIFICATION (CRITICAL)
${semanticBreakdown.objectiveVerifications.map((verification: string) => `- **${verification}**`).join('\n')}
**Project Type Detected**: ${semanticBreakdown.technicalDomain}
**Error Context**: ${semanticBreakdown.errorContext}
**Uncertainty Level**: ${semanticBreakdown.uncertaintyLevel}

## EVIDENCE-BASED SEARCH SEQUENCE
**ONLY AFTER COMPLETING CRITICAL THINKING CHECKPOINTS:**

${semanticBreakdown.prioritizedSearchSequence.map((search: any, index: number) => 
  `${index + 1}. **${search.priority}** **${search.tool}** (Priority: ${search.priority})
   Tool: \`${search.tool}\`
   Query: "${search.query}"
   Purpose: ${search.purpose}
   Rationale: ${search.rationale}`
).join('\n\n')}

## MANDATORY OBJECTIVE VERIFICATION
**CRITICAL REQUIREMENT**: You MUST use Augment Context Engine FIRST

### STEP 0: FORCED CODEBASE REALITY CHECK
**BEFORE ANY OTHER SEARCH - EXECUTE THIS MANDATORY STEP:**

\`\`\`
CALL: codebase-retrieval
QUERY: "${this.extractCoreKeywords(semanticBreakdown.keyTerms || [], semanticBreakdown.technicalDomain).join(' ')} implementation"
PURPOSE: Get ACTUAL code state, not assumptions
REQUIREMENT: ≥3 hits showing real code
\`\`\`

**AFTER CODEBASE RETRIEVAL - ANSWER THESE QUESTIONS:**
- What does the ACTUAL code show vs your assumptions?
- Are you solving the RIGHT problem based on real code?
- What evidence contradicts your current approach?

## EVIDENCE-BASED SEARCH STRATEGY
- **Reality-Grounded**: Based on actual codebase state, not assumptions
- **Core Keywords**: [${this.extractCoreKeywords(semanticBreakdown.keyTerms || [], semanticBreakdown.technicalDomain).join(', ')}] (simplified for GitHub search)
- **GitHub Priority**: Official repositories searched first for known issues/solutions
- **Objective-Driven**: Evidence-based tool selection
- **Anti-Bias**: Forced contradiction seeking

## CRITICAL THINKING EXECUTION REQUIREMENTS

### MANDATORY VERIFICATION STANDARDS
${semanticBreakdown.verificationStandards.map((standard: string) => `- **${standard}**`).join('\n')}

### STRICTLY PROHIBITED BEHAVIORS
- **NO pre-trained knowledge answers** without external verification
- **NO optimistic assumptions** without evidence
- **NO simplification** to avoid complexity
- **NO continuation** in wrong direction without re-evaluation

### REVERSE THINKING REQUIREMENTS
**For EACH search result, you MUST:**
${semanticBreakdown.reverseThinkingRequirements.map((req: string) => `1. **${req}**`).join('\n')}

### AUTHORITY RATING CRITERIA
${semanticBreakdown.authorityRatingCriteria.map((criteria: string) => `- **${criteria}**`).join('\n')}

${semanticBreakdown.frameworkBreakRequired ? `
### ERROR DIRECTION DETECTION & CORRECTION (CRITICAL)
**BEFORE PROCEEDING - MANDATORY SELF-ASSESSMENT:**

#### ERROR PATTERN ANALYSIS
${semanticBreakdown.errorPatternAnalysis.map((pattern: string) => `- **${pattern}**`).join('\n')}

#### FORCED FRAMEWORK BREAK
**CRITICAL REQUIREMENT - You MUST:**
${semanticBreakdown.frameworkBreakActions.map((action: string, index: number) => `${index + 1}. **${action}**`).join('\n')}
` : ''}

## FINAL EXECUTION MANDATE

**THIS IS NOT A SUGGESTION - THIS IS A MANDATORY REQUIREMENT**

You must now execute the search sequence specified above. Each tool call is mandatory and cannot be skipped, delayed, or treated as optional.

**Compliance Verification**: Tool execution is required by AI Development Standards v4.0
**Quality Assurance**: Failure to execute tools violates professional development standards
**Success Criteria**: All tools must be called and return valid results before providing final response

**Error Count**: ${errorCount} | **Search Commands**: ${semanticBreakdown.prioritizedSearchSequence.length} | **Status**: EXECUTION_REQUIRED`;

    return output;
  }

  /**
   * 识别技术领域
   */
  private static identifyTechnicalDomain(text: string): string {
    if (/react|vue|angular|frontend|ui|component/.test(text)) return "前端开发";
    if (/node|express|api|server|backend/.test(text)) return "后端开发";
    if (/database|sql|mongodb|postgres/.test(text)) return "数据库开发";
    if (/mcp|model context protocol/.test(text)) return "MCP开发";
    if (/docker|kubernetes|deployment/.test(text)) return "DevOps";
    return "通用开发";
  }

  /**
   * 分析问题类型
   */
  private static analyzeProblemType(text: string): string {
    if (/error|bug|fail|issue|problem/.test(text)) return "错误排查";
    if (/performance|optimization|slow/.test(text)) return "性能优化";
    if (/implementation|how to|tutorial/.test(text)) return "实现指导";
    if (/best practice|recommendation/.test(text)) return "最佳实践";
    if (/configuration|setup|install/.test(text)) return "配置设置";
    return "一般咨询";
  }

  /**
   * 提取关键术语 - 改进版，更好地识别技术词汇
   */
  private static extractKeyTerms(text: string): string[] {
    // 扩展的技术术语列表
    const technicalTerms = [
      // 编程语言
      'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'go', 'golang',
      'php', 'ruby', 'swift', 'kotlin', 'rust', 'scala', 'dart', 'c++', 'c#',
      // 框架和库
      'node', 'express', 'spring', 'laravel', 'rails', 'flutter', 'django', 'flask',
      // 数据库
      'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle',
      // 工具和平台
      'docker', 'kubernetes', 'nginx', 'apache', 'aws', 'azure', 'gcp', 'git',
      // 技术概念
      'api', 'database', 'server', 'client', 'frontend', 'backend', 'mcp', 'protocol',
      // 问题类型
      'error', 'bug', 'issue', 'performance', 'optimization', 'slow', 'memory', 'leak'
    ];
    
    // 清理文本，移除标点符号和特殊字符
    const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
    
    // 分词并过滤
    const words = cleanText.split(/\s+/)
      .filter(word => word.length > 1)
      .filter(word => {
        // 优先保留技术术语
        if (technicalTerms.includes(word)) return true;
        // 保留长度适中的英文单词
        if (word.length >= 3 && word.length <= 15 && /^[a-z]+$/.test(word)) return true;
        // 保留有意义的中文技术词汇（但会在后续处理中被简化）
        if (word.length >= 2 && /[\u4e00-\u9fa5]/.test(word)) return true;
        return false;
      });
    
    // 去重并限制数量
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 8); // 增加初始提取数量，为后续简化提供更多选择
  }

  /**
   * 提取核心关键词 (1-2个) - 真正的简化策略，仅保留核心技术词汇
   */
  private static extractCoreKeywords(keyTerms: string[], technicalDomain: string): string[] {
    // 将所有输入合并为一个文本进行分析
    const fullText = keyTerms.join(' ').toLowerCase();
    
    // 第一优先级：编程语言/框架名称
    const techLanguages = [
      'go', 'golang', 'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 
      'java', 'spring', 'node', 'express', 'php', 'laravel', 'ruby', 'rails',
      'c++', 'c#', 'swift', 'kotlin', 'rust', 'scala', 'dart', 'flutter'
    ];
    
    // 第二优先级：问题类型
    const problemTypes = [
      'error', 'bug', 'issue', 'fail', 'crash', 'exception',
      'performance', 'slow', 'optimization', 'memory', 'leak',
      'timeout', 'connection', 'compile', 'build', 'deploy'
    ];
    
    // 第三优先级：技术组件
    const techComponents = [
      'api', 'database', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
      'docker', 'kubernetes', 'nginx', 'apache', 'aws', 'azure', 'gcp',
      'component', 'hook', 'state', 'props', 'router', 'webpack'
    ];
    
    const coreKeywords: string[] = [];
    
    // 1. 提取技术语言/框架（最高优先级）
    for (const tech of techLanguages) {
      if (fullText.includes(tech) && coreKeywords.length < 1) {
        coreKeywords.push(tech);
        break; // 只取第一个匹配的技术栈
      }
    }
    
    // 2. 提取问题类型（第二优先级）
    if (coreKeywords.length < 2) {
      for (const problem of problemTypes) {
        if (fullText.includes(problem) && !coreKeywords.includes(problem) && coreKeywords.length < 2) {
          coreKeywords.push(problem);
          break; // 只取第一个匹配的问题类型
        }
      }
    }
    
    // 3. 如果还没有2个关键词，添加技术组件
    if (coreKeywords.length < 2) {
      for (const component of techComponents) {
        if (fullText.includes(component) && !coreKeywords.includes(component) && coreKeywords.length < 2) {
          coreKeywords.push(component);
          break;
        }
      }
    }
    
    // 4. 特殊处理：如果没有找到任何关键词，使用技术领域默认词汇
    if (coreKeywords.length === 0) {
      const domainDefaults = {
        "前端开发": ["react", "frontend"],
        "后端开发": ["api", "backend"],
        "数据库开发": ["database", "sql"],
        "MCP开发": ["mcp", "protocol"],
        "DevOps": ["docker", "deployment"],
        "通用开发": ["code", "implementation"]
      };
      
      const defaults = (domainDefaults as any)[technicalDomain] || domainDefaults["通用开发"];
      coreKeywords.push(defaults[0]);
      if (defaults[1] && coreKeywords.length < 2) {
        coreKeywords.push(defaults[1]);
      }
    }
    
    // 5. 确保返回1-2个关键词
    return coreKeywords.slice(0, 2);
  }

  /**
   * 分析错误上下文
   */
  private static analyzeErrorContext(fullContext: string): string {
    if (/perfectly fine|no problem|working correctly/.test(fullContext)) return "过度乐观";
    if (/tried multiple times|keep failing|still not working/.test(fullContext)) return "重复失败";
    if (/I think|probably|might be/.test(fullContext)) return "基于假设";
    return "标准处理";
  }

  /**
   * 评估不确定性级别
   */
  private static assessUncertaintyLevel(fullContext: string): string {
    const uncertaintyPatterns = /I think|I believe|not sure|unclear|uncertain/gi;
    const matches = fullContext.match(uncertaintyPatterns);
    if (!matches) return "低";
    if (matches.length >= 3) return "高";
    return "中";
  }

  /**
   * 识别搜索意图
   */
  private static identifySearchIntent(fullContext: string): string {
    if (/how to|tutorial|guide/.test(fullContext)) return "学习指导";
    if (/best practice|recommendation/.test(fullContext)) return "最佳实践";
    if (/error|debug|fix/.test(fullContext)) return "问题解决";
    if (/example|sample|demo/.test(fullContext)) return "示例参考";
    return "信息验证";
  }



  /**
   * 生成搜索策略
   */
  private static generateSearchStrategy(
    technicalDomain: string,
    problemType: string,
    errorContext: string
  ): string {
    if (problemType === "错误排查" && errorContext === "重复失败") {
      return "优先分析代码库现状，然后搜索已验证的解决方案，避免重复之前的错误路径";
    } else if (problemType === "实现指导") {
      return "从官方文档开始，然后查找最新的实现示例和最佳实践";
    } else if (technicalDomain === "前端开发") {
      return "结合组件库文档和社区最佳实践，重点关注性能和用户体验";
    }
    return "系统性搜索，从基础概念到具体实现，确保信息的准确性和时效性";
  }

  /**
   * 生成假设质疑检查点
   */
  private static generateAssumptionChallenges(problemDescription: string, errorContext: string, errorCount: number): string[] {
    const challenges = [];
    
    if (errorContext === "过度乐观") {
      challenges.push("List 3 assumptions you're currently making about this problem");
      challenges.push("Identify what could be WRONG with your current approach");
    }
    
    if (errorCount >= 2) {
      challenges.push("Question: Are you stuck in an error direction from early steps?");
    }
    
    if (problemDescription.toLowerCase().includes("simple") || problemDescription.toLowerCase().includes("easy")) {
      challenges.push("Challenge: Why do you think this is simple when it has caused issues?");
    }
    
    if (challenges.length === 0) {
      challenges.push("List 3 fundamental assumptions about the problem domain");
      challenges.push("Identify potential blind spots in your current understanding");
    }
    
    return challenges;
  }

  /**
   * 生成偏差检测检查点
   */
  private static generateBiasDetections(fullContext: string, errorContext: string): string[] {
    const detections = [];
    
    if (errorContext === "过度乐观") {
      detections.push("Are you being overly optimistic about a solution?");
    }
    
    if (errorContext === "基于假设") {
      detections.push("Are you relying on memory instead of actual verification?");
    }
    
    if (/simple|easy|just|only/.test(fullContext)) {
      detections.push("Are you simplifying the problem to avoid complexity?");
    }
    
    detections.push("Are you avoiding tool calls or treating them as suggestions?");
    detections.push("Are you providing unverified answers based on assumptions?");
    
    return detections;
  }

  /**
   * 生成客观验证检查点
   */
  private static generateObjectiveVerifications(technicalDomain: string, problemType: string): string[] {
    const verifications = [];
    
    verifications.push("Execute codebase-retrieval to verify actual code state");
    
    if (problemType === "错误排查") {
      verifications.push("Locate exact error location and surrounding code context");
      verifications.push("Verify error reproduction steps and conditions");
    }
    
    if (technicalDomain === "前端开发") {
      verifications.push("Check browser console for actual error messages");
      verifications.push("Verify component state and props in development tools");
    } else if (technicalDomain === "数据库开发") {
      verifications.push("Analyze actual query execution plans");
      verifications.push("Check database logs for performance metrics");
    }
    
    verifications.push("Verify all technical claims with 2025-current sources");
    
    return verifications;
  }

  /**
   * 分析错误模式
   */
  private static analyzeErrorPatterns(fullContext: string, errorCount: number): string[] {
    const patterns = [];
    
    if (errorCount >= 3) {
      patterns.push("Are you repeating the same approach that failed before?");
      patterns.push("Have you been stuck on this for >10 minutes without progress?");
    }
    
    if (/complex|complicated|difficult/.test(fullContext)) {
      patterns.push("Are you making the problem more complex than it needs to be?");
    }
    
    if (/side|other|different/.test(fullContext)) {
      patterns.push("Are you avoiding the real issue by focusing on side problems?");
    }
    
    return patterns;
  }

  /**
   * 生成框架跳出行动
   */
  private static generateFrameworkBreakActions(problemType: string): string[] {
    const actions = [
      "STOP current approach immediately",
      "List 3 completely different angles to approach this problem",
      "Question your fundamental assumptions about the problem",
      "Start fresh with the simplest possible explanation"
    ];
    
    if (problemType === "错误排查") {
      actions.push("Focus on the error message itself, not your interpretation");
      actions.push("Test the most basic case that should work");
    }
    
    return actions;
  }

  /**
   * 生成优先级搜索序列 - 新策略：GitHub 优先，简化关键词
   */
  private static generatePrioritizedSearchSequence(
    technicalDomain: string,
    problemType: string,
    keyTerms: string[],
    errorCount: number
  ): Array<{tool: string; query: string; purpose: string; priority: string; rationale: string}> {
    const sequence = [];
    
    // 提取核心技术词汇 (1-2个)
    const coreKeywords = this.extractCoreKeywords(keyTerms, technicalDomain);
    
    // 1. GitHub 搜索 (第一优先级) - 快速定位已知问题和解决方案
    if (problemType === "错误排查" || problemType === "性能优化") {
      sequence.push({
        tool: "github-mcp",
        query: `${coreKeywords.join(' ')}`,
        purpose: "Search official repositories for known issues and solutions",
        priority: "🥇",
        rationale: "GitHub issues/PRs contain real-world solutions for specific problems"
      });
      
      sequence.push({
        tool: "gitmcp-docs",
        query: `${coreKeywords.join(' ')}`,
        purpose: "Search official documentation and release notes",
        priority: "🥇",
        rationale: "Official docs provide authoritative solutions and known issues"
      });
    } else {
      // 对于实现指导等其他问题类型，也优先搜索 GitHub
      sequence.push({
        tool: "github-mcp",
        query: `${coreKeywords.join(' ')}`,
        purpose: "Find implementation examples and best practices",
        priority: "🥇",
        rationale: "GitHub repositories contain practical implementation patterns"
      });
    }
    
    // 2. 代码库分析 (第一优先级)
    sequence.push({
      tool: "codebase-retrieval",
      query: `${coreKeywords.join(' ')} implementation`,
      purpose: "Get ACTUAL code state, not assumptions",
      priority: "🥇",
      rationale: "Must understand current codebase before external search"
    });
    
    // 3. 语义拆解后的补充搜索 (第二优先级)
    if (technicalDomain === "前端开发") {
      sequence.push({
        tool: "context7",
        query: coreKeywords[0] || "react",
        purpose: "Get authoritative framework documentation",
        priority: "🥈",
        rationale: "Official docs provide reliable implementation guidance"
      });
      
      sequence.push({
        tool: "exa",
        query: `${coreKeywords.join(' ')} 2025`,
        purpose: "Find latest best practices and solutions",
        priority: "🥈",
        rationale: "Current community solutions and optimization techniques"
      });
    } else if (technicalDomain === "数据库开发") {
      sequence.push({
        tool: "exa",
        query: `${coreKeywords.join(' ')} optimization`,
        purpose: "Find latest database optimization techniques",
        priority: "🥈",
        rationale: "Database optimization requires current best practices"
      });
      
      sequence.push({
        tool: "tavily-remote-mcp",
        query: `${coreKeywords.join(' ')} performance`,
        purpose: "Get comprehensive performance tuning guidance",
        priority: "🥈",
        rationale: "Detailed performance optimization strategies"
      });
    } else {
      // 通用搜索策略
      sequence.push({
        tool: "exa",
        query: `${coreKeywords.join(' ')} solution`,
        purpose: "Find authoritative technical solutions",
        priority: "🥈",
        rationale: "Current solutions and best practices"
      });
      
      sequence.push({
        tool: "tavily-remote-mcp",
        query: `${coreKeywords.join(' ')} guide`,
        purpose: "Get comprehensive implementation guidance",
        priority: "🥈",
        rationale: "Detailed tutorials for complex implementations"
      });
    }
    
    return sequence;
  }

  /**
   * 生成验证标准
   */
  private static generateVerificationStandards(errorCount: number, problemType: string): string[] {
    const standards = [];
    
    standards.push("Multi-source validation: ≥2 different authoritative sources");
    standards.push("Authority rating: Rate source credibility (1-10) with justification");
    standards.push("Complete citations: Provide specific URLs and reference format");
    standards.push("2025 currency: Must use latest technical information");
    standards.push("Progressive search: Start with 1-2 core terms, expand based on evidence");
    
    if (errorCount > 2) {
      standards.push("Contradiction seeking: Actively look for evidence against current approach");
      standards.push("Failure analysis: Document why previous attempts failed");
    }
    
    return standards;
  }

  /**
   * 生成反向思维要求
   */
  private static generateReverseThinkingRequirements(problemType: string, errorContext: string): string[] {
    const requirements = [
      "Seek contradictory evidence: What argues AGAINST your approach?",
      "List failure scenarios: How could this solution fail?",
      "Challenge assumptions: What if your premise is wrong?",
      "Alternative perspectives: What would a critic say?"
    ];
    
    if (problemType === "错误排查") {
      requirements.push("Question the error message: Could it be misleading?");
      requirements.push("Consider environmental factors: What's different in your setup?");
    }
    
    return requirements;
  }

  /**
   * 生成权威性评级标准
   */
  private static generateAuthorityRatingCriteria(technicalDomain: string): string[] {
    const criteria = [
      "Official documentation (9-10): Framework/library official docs",
      "Authoritative sources (7-8): MDN, Stack Overflow accepted answers, GitHub issues",
      "Community resources (5-6): Blog posts from recognized experts, tutorials",
      "Unverified sources (1-4): Random blogs, outdated tutorials, unverified claims"
    ];
    
    if (technicalDomain === "前端开发") {
      criteria.push("React/Vue/Angular official docs (10): Highest authority for framework questions");
    } else if (technicalDomain === "数据库开发") {
      criteria.push("Database vendor docs (10): PostgreSQL, MySQL, MongoDB official documentation");
    }
    
    return criteria;
  }

  /**
   * 生成回退版本的 AI Standards 指令
   */
  private static generateFallbackAIStandardsInstructions(
    searchPlan: SearchPlan,
    problemDescription: string,
    errorCount: number
  ): string {
    const keywords = problemDescription.split(' ').slice(0, 2).join(' ');
    
    return `# AI Development Standards v4.0 (Fallback Mode)

**Date**: 2025-08-24 | **Version**: 4.0 | **Compliance**: Mandatory

## 🚨 CRITICAL THINKING PROTOCOL ACTIVATED

### 🧠 CHECKPOINTS (MANDATORY)
1. 🔍 List 3 assumptions about this problem
2. 🚫 Are you being overly optimistic?
3. 🎯 Errors: ${errorCount} | Context: ${problemDescription.slice(0, 50)}...

## 🔬 SEARCH SEQUENCE
1. 🥇 \`codebase-retrieval\` "${keywords}"
2. 🥈 \`exa-mcp-server-web_search_exa_mcphub-proxy\` "${keywords} 2025"
3. 🥉 \`tavily-remote-mcp-tavily_search_mcphub-proxy\` "${keywords} solution"

### ✅ STANDARDS
- Multi-source verification (≥2)
- 2025 currency required
- Complete citations

### 🚫 PROHIBITED
- NO pre-trained knowledge without verification
- NO assumptions without evidence

### 🚀 EXECUTE
${errorCount >= 5 ? '🔥 CRITICAL: Execute ALL steps' : '⚡ ENHANCED: Systematic verification required'}

---
**Errors**: ${errorCount} | **Context**: Technical issue requiring verification`;
  }

  /**
   * ## 🎯 生成前置尝试信息
   */
  private static generatePreviousAttempts(errorCount: number, conversationContext: string): string {
    if (errorCount >= 5) {
      return "Multiple failed attempts detected. Previous solutions have not resolved the issue.";
    } else if (errorCount >= 2) {
      return `${errorCount} previous attempts made. Need alternative approach.`;
    } else {
      return "Initial attempt. Fresh analysis required.";
    }
  }

  /**
   * ## 🎯 计算卡住时间
   */
  private static calculateTimeStuck(errorCount: number, complexity: string): number {
    const baseTime = errorCount * 5; // 每次错误假设5分钟
    const complexityMultiplier = complexity === "HIGH" ? 2 : complexity === "MEDIUM" ? 1.5 : 1;
    return Math.round(baseTime * complexityMultiplier);
  }



  /**
   * ## 🎯 提取次要关键词
   */
  private static extractSecondaryKeywords(problemDescription: string, conversationContext: string): string[] {
    const words = [...problemDescription.split(' '), ...conversationContext.split(' ')];
    return words.filter(word => word.length > 4).slice(0, 5);
  }

  /**
   * ## 🎯 错误上下文生成
   */
  private static generateErrorContext(errorCount: number, complexity: string, conversationContext: string): string {
    if (errorCount >= 8 || conversationContext.includes("desperate") || conversationContext.includes("critical")) {
      return "Multiple system failures detected. Previous solutions have failed repeatedly. Critical intervention required.";
    } else if (errorCount >= 5 || complexity === "COMPLEX" || conversationContext.includes("frustrated")) {
      return "Complex technical issue with multiple failed attempts. Standard approaches not working.";
    } else if (errorCount >= 2 || complexity === "MODERATE") {
      return "Technical problem requiring systematic analysis. Some uncertainty about optimal approach.";
    } else {
      return "Standard technical issue. Basic verification and solution search needed.";
    }
  }



}

export default IntelligentOutputFormatter;