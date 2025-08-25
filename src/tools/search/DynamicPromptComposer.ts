/**
 * # 智能动态提示词生成系统 v4.0
 * 
 * **生效日期**：2025-08-24
 * **版本**：4.0
 * **适用范围**：集成强制搜索协议的动态提示词生成实践
 * **合规要求**：所有提示词生成必须强制执行标准化协议
 * 
 * ## 🚨 批判性思维协议 v4.0 已激活 - 集成强制搜索协议
 * 
 * 解决固定模板导致AI习惯化忽略的问题，生成独特、不可预测的强制性指令
 * Solves AI habituation issues caused by fixed templates by generating unique, unpredictable mandatory instructions
 */

import { z } from "zod";

// 上下文分析接口
interface ContextualAnalysis {
  technicalDomain: string;
  problemComplexity: "TRIVIAL" | "SIMPLE" | "MODERATE" | "COMPLEX" | "CRITICAL";
  urgencyLevel: "ROUTINE" | "ELEVATED" | "HIGH" | "URGENT" | "EMERGENCY";
  failurePattern: "NONE" | "INITIAL" | "RECURRING" | "PERSISTENT" | "CRITICAL";
  conversationTone: "CASUAL" | "PROFESSIONAL" | "TECHNICAL" | "FRUSTRATED" | "DESPERATE";
  aiHabituationRisk: number; // 0-100, AI对当前模式的习惯化风险
  contextualKeywords: string[];
  emotionalIndicators: string[];
  technicalSpecifics: string[];
}

// 动态指令结构
interface DynamicInstruction {
  openingHook: string;
  contextualFraming: string;
  actionSequence: string[];
  psychologicalAnchors: string[];
  verificationDemands: string[];
  closingCompulsion: string;
  uniquenessScore: number; // 0-100, 指令的独特性评分
}

/**
 * 深度上下文分析器 - 分析对话的深层语义和情感模式
 */
class DeepContextAnalyzer {
  /**
   * 分析对话上下文的深层语义
   */
  static analyzeConversationalContext(
    conversationHistory: string,
    problemDescription: string,
    errorCount: number,
    currentApproach: string
  ): ContextualAnalysis {
    const fullText = `${conversationHistory} ${problemDescription} ${currentApproach}`.toLowerCase();
    
    // 技术领域识别 - 更精确的领域分类
    const technicalDomain = this.identifyTechnicalDomain(fullText);
    
    // 问题复杂度评估 - 基于多维度分析
    const problemComplexity = this.assessProblemComplexity(
      problemDescription, 
      errorCount, 
      fullText.length,
      this.countTechnicalTerms(fullText)
    );
    
    // 紧急程度评估 - 基于语言强度和时间指标
    const urgencyLevel = this.assessUrgencyLevel(fullText, errorCount);
    
    // 失败模式识别 - 分析重复失败的模式
    const failurePattern = this.identifyFailurePattern(errorCount, fullText);
    
    // 对话语调分析 - 识别用户的情感状态
    const conversationTone = this.analyzeConversationTone(fullText);
    
    // AI习惯化风险评估 - 预测AI忽略指令的可能性
    const aiHabituationRisk = this.calculateHabituationRisk(
      conversationHistory,
      errorCount,
      problemComplexity
    );
    
    // 提取上下文关键词
    const contextualKeywords = this.extractContextualKeywords(fullText);
    
    // 情感指标提取
    const emotionalIndicators = this.extractEmotionalIndicators(fullText);
    
    // 技术细节提取
    const technicalSpecifics = this.extractTechnicalSpecifics(fullText);

    return {
      technicalDomain,
      problemComplexity,
      urgencyLevel,
      failurePattern,
      conversationTone,
      aiHabituationRisk,
      contextualKeywords,
      emotionalIndicators,
      technicalSpecifics
    };
  }

  private static identifyTechnicalDomain(text: string): string {
    const domainPatterns = {
      "前端开发": /react|vue|angular|frontend|ui|ux|css|html|javascript|typescript|jsx|tsx/,
      "后端开发": /backend|server|api|database|sql|mongodb|postgresql|express|fastify|node/,
      "DevOps": /docker|kubernetes|ci\/cd|deployment|aws|azure|gcp|terraform|ansible/,
      "数据科学": /python|pandas|numpy|machine learning|ai|data analysis|jupyter|tensorflow/,
      "移动开发": /react native|flutter|ios|android|mobile|app development/,
      "系统架构": /microservices|architecture|design patterns|scalability|performance/,
      "安全": /security|authentication|authorization|encryption|vulnerability|penetration/,
      "测试": /testing|jest|cypress|playwright|unit test|integration test|e2e/,
      "MCP开发": /mcp|model context protocol|shrimp|task manager|tool calling/
    };

    for (const [domain, pattern] of Object.entries(domainPatterns)) {
      if (pattern.test(text)) {
        return domain;
      }
    }
    return "通用技术";
  }

  private static assessProblemComplexity(
    description: string,
    errorCount: number,
    textLength: number,
    technicalTermCount: number
  ): "TRIVIAL" | "SIMPLE" | "MODERATE" | "COMPLEX" | "CRITICAL" {
    let complexityScore = 0;
    
    // 基于描述长度
    if (textLength > 500) complexityScore += 3;
    else if (textLength > 200) complexityScore += 2;
    else if (textLength > 100) complexityScore += 1;
    
    // 基于错误计数
    complexityScore += Math.min(errorCount * 2, 8);
    
    // 基于技术术语密度
    complexityScore += Math.min(technicalTermCount, 5);
    
    // 基于问题类型
    if (/integration|architecture|performance|security|scalability/.test(description.toLowerCase())) {
      complexityScore += 3;
    }
    
    if (complexityScore >= 12) return "CRITICAL";
    if (complexityScore >= 8) return "COMPLEX";
    if (complexityScore >= 5) return "MODERATE";
    if (complexityScore >= 2) return "SIMPLE";
    return "TRIVIAL";
  }

  private static assessUrgencyLevel(text: string, errorCount: number): "ROUTINE" | "ELEVATED" | "HIGH" | "URGENT" | "EMERGENCY" {
    let urgencyScore = 0;
    
    // 紧急词汇检测
    const urgencyPatterns = [
      /urgent|emergency|critical|asap|immediately|now|快速|紧急|立即|马上/gi,
      /deadline|due|time sensitive|时间紧迫|截止|期限/gi,
      /broken|failing|down|error|crash|崩溃|错误|失败/gi,
      /production|live|客户|用户|生产环境/gi
    ];
    
    urgencyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) urgencyScore += matches.length;
    });
    
    // 错误计数影响
    urgencyScore += errorCount;
    
    if (urgencyScore >= 8) return "EMERGENCY";
    if (urgencyScore >= 5) return "URGENT";
    if (urgencyScore >= 3) return "HIGH";
    if (urgencyScore >= 1) return "ELEVATED";
    return "ROUTINE";
  }

  private static identifyFailurePattern(errorCount: number, text: string): "NONE" | "INITIAL" | "RECURRING" | "PERSISTENT" | "CRITICAL" {
    if (errorCount === 0) return "NONE";
    if (errorCount === 1) return "INITIAL";
    if (errorCount <= 3) return "RECURRING";
    if (errorCount <= 6) return "PERSISTENT";
    return "CRITICAL";
  }

  private static analyzeConversationTone(text: string): "CASUAL" | "PROFESSIONAL" | "TECHNICAL" | "FRUSTRATED" | "DESPERATE" {
    // 挫折感指标
    const frustrationPatterns = /why.*not work|doesn't work|still failing|tried everything|给我|帮我|不行|不对|错了/gi;
    const desperationPatterns = /please help|urgent|critical|emergency|救命|求助|完全不知道/gi;
    const technicalPatterns = /implementation|architecture|algorithm|optimization|具体实现|技术方案/gi;
    const professionalPatterns = /requirements|specifications|documentation|best practices|需求|规范|文档/gi;
    
    if (desperationPatterns.test(text)) return "DESPERATE";
    if (frustrationPatterns.test(text)) return "FRUSTRATED";
    if (technicalPatterns.test(text)) return "TECHNICAL";
    if (professionalPatterns.test(text)) return "PROFESSIONAL";
    return "CASUAL";
  }

  private static calculateHabituationRisk(
    conversationHistory: string,
    errorCount: number,
    complexity: string
  ): number {
    let riskScore = 0;
    
    // 基于对话历史中的重复模式
    const commonPhrases = [
      "你必须", "立即执行", "强制", "不可跳过", "必须按顺序"
    ];
    
    commonPhrases.forEach(phrase => {
      const matches = conversationHistory.match(new RegExp(phrase, "gi"));
      if (matches && matches.length > 2) {
        riskScore += matches.length * 10;
      }
    });
    
    // 基于错误重复次数
    if (errorCount > 3) riskScore += 30;
    
    // 基于复杂度（复杂问题更容易被忽略）
    if (complexity === "COMPLEX" || complexity === "CRITICAL") {
      riskScore += 20;
    }
    
    return Math.min(riskScore, 100);
  }

  private static countTechnicalTerms(text: string): number {
    const technicalTerms = [
      'api', 'database', 'server', 'client', 'framework', 'library', 'component',
      'function', 'method', 'class', 'interface', 'type', 'async', 'await',
      'promise', 'callback', 'event', 'state', 'props', 'hook', 'middleware'
    ];
    
    return technicalTerms.filter(term => 
      new RegExp(`\\b${term}\\b`, 'i').test(text)
    ).length;
  }

  private static extractContextualKeywords(text: string): string[] {
    // 提取技术关键词、问题关键词、解决方案关键词
    const keywords: string[] = [];
    
    // 技术栈关键词
    const techMatches = text.match(/\b(react|vue|angular|node|python|typescript|javascript|docker|kubernetes|aws|azure|gcp)\b/gi);
    if (techMatches) keywords.push(...techMatches);
    
    // 问题类型关键词
    const problemMatches = text.match(/\b(error|bug|issue|problem|fail|crash|slow|performance|security|optimization)\b/gi);
    if (problemMatches) keywords.push(...problemMatches);
    
    return [...new Set(keywords)].slice(0, 10);
  }

  private static extractEmotionalIndicators(text: string): string[] {
    const emotionalPatterns = [
      /frustrated|annoyed|confused|stuck|lost|挫折|困惑|卡住/gi,
      /excited|eager|motivated|interested|期待|兴奋|积极/gi,
      /worried|concerned|anxious|nervous|担心|焦虑|紧张/gi,
      /confident|sure|certain|determined|确信|肯定|坚定/gi
    ];
    
    const indicators: string[] = [];
    emotionalPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) indicators.push(...matches.slice(0, 2));
    });
    
    return indicators;
  }

  private static extractTechnicalSpecifics(text: string): string[] {
    const specifics: string[] = [];
    
    // 版本号
    const versionMatches = text.match(/v?\d+\.\d+(\.\d+)?/g);
    if (versionMatches) specifics.push(...versionMatches);
    
    // 文件路径
    const pathMatches = text.match(/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_\/-]+\.[a-zA-Z0-9]+/g);
    if (pathMatches) specifics.push(...pathMatches.slice(0, 3));
    
    // 错误代码
    const errorMatches = text.match(/error\s*:?\s*[a-zA-Z0-9_-]+|code\s*:?\s*\d+/gi);
    if (errorMatches) specifics.push(...errorMatches.slice(0, 2));
    
    return specifics;
  }
}

/**
 * 反习惯化语言生成器 - 生成不可预测的强制性语言
 */
class AntiHabituationLanguageGenerator {
  // 动态开场白库 - 基于上下文生成独特的开场
  private static generateContextualOpening(analysis: ContextualAnalysis): string {
    const { technicalDomain, urgencyLevel, conversationTone, failurePattern } = analysis;
    
    // 基于技术领域的专业化开场
    const domainSpecificOpenings = {
      "前端开发": [
        "🎨 前端架构决策点已触发",
        "⚡ UI/UX 优化协议启动",
        "🔧 组件生态系统分析开始"
      ],
      "后端开发": [
        "🏗️ 服务器架构评估启动",
        "🔐 API 安全检查协议激活",
        "⚙️ 数据流优化分析开始"
      ],
      "MCP开发": [
        "🤖 MCP 工具链诊断启动",
        "🔗 模型上下文协议分析开始",
        "⚡ AI 行为干预系统激活"
      ]
    };
    
    // 基于紧急程度的强度调节
    const urgencyModifiers = {
      "EMERGENCY": "🚨 CRITICAL SYSTEM ALERT",
      "URGENT": "⚠️ HIGH PRIORITY INTERVENTION",
      "HIGH": "🔴 ELEVATED RESPONSE REQUIRED",
      "ELEVATED": "🟡 ATTENTION REQUIRED",
      "ROUTINE": "📋 SYSTEMATIC ANALYSIS"
    };
    
    // 基于失败模式的特殊处理
    const failureSpecificPhrases = {
      "CRITICAL": "🔥 REPEATED FAILURE PATTERN DETECTED - EMERGENCY PROTOCOL",
      "PERSISTENT": "⚡ ESCALATION REQUIRED - ALTERNATIVE APPROACH MANDATORY",
      "RECURRING": "🔄 PATTERN BREAK NEEDED - ENHANCED SEARCH PROTOCOL",
      "INITIAL": "🎯 PRECISION TARGETING REQUIRED",
      "NONE": "🚀 PROACTIVE INTELLIGENCE GATHERING"
    };
    
    const domainOpening = (domainSpecificOpenings as any)[technicalDomain] || 
      ["🔍 技术分析协议启动", "⚡ 智能诊断系统激活", "🎯 解决方案定位开始"];
    
    const selectedOpening = domainOpening[Math.floor(Math.random() * domainOpening.length)];
    const urgencyPrefix = urgencyModifiers[urgencyLevel];
    const failureContext = failureSpecificPhrases[failurePattern];
    
    return `${urgencyPrefix}\n\n${selectedOpening}\n${failureContext}`;
  }

  /**
   * ## 🚨 标准化开场白生成协议
   * **强制要求**：必须包含批判性思维协议激活声明
   */
  private static generateStandardizedOpening(analysis: ContextualAnalysis): string {
    const { technicalDomain, urgencyLevel, failurePattern, aiHabituationRisk } = analysis;
    
    // 🚨 强制协议激活声明
    let opening = `# 🚨 批判性思维协议 v4.0 已激活 - 集成强制搜索协议\n\n`;
    
    // ⚠️ 强制性认知偏差干预
    opening += `## ⚠️ 强制性认知偏差干预\n`;
    opening += `**检测问题**：AI 行为模式显示存在潜在认知偏差和错误方向持续性\n\n`;
    
    // 🔥 紧急程度评估
    if (urgencyLevel === "EMERGENCY" || failurePattern === "CRITICAL") {
      opening += `### 🔥 **CRITICAL SYSTEM ALERT**\n`;
      opening += `检测到重复失败模式（错误计数 ≥ 5），启动紧急干预协议。\n\n`;
    } else if (urgencyLevel === "URGENT") {
      opening += `### ⚡ **HIGH PRIORITY INTERVENTION**\n`;
      opening += `检测到高优先级技术问题，需要立即执行标准化搜索协议。\n\n`;
    } else {
      opening += `### 📋 **SYSTEMATIC ANALYSIS PROTOCOL**\n`;
      opening += `启动系统性分析协议，确保基于证据的技术决策。\n\n`;
    }
    
    // 🎯 技术领域特化
    opening += `**项目类型检测**：${technicalDomain}\n`;
    opening += `**AI习惯化风险**：${aiHabituationRisk}% ${aiHabituationRisk > 70 ? '🚨 HIGH RISK' : aiHabituationRisk > 40 ? '⚠️ MEDIUM RISK' : '✅ LOW RISK'}\n`;
    opening += `**失败模式**：${failurePattern}\n\n`;
    
    return opening;
  }

  /**
   * ## 📋 强制性框架描述生成
   */
  private static generateMandatoryFraming(analysis: ContextualAnalysis): string {
    const { technicalDomain, problemComplexity, contextualKeywords, technicalSpecifics } = analysis;
    
    let framing = `**智能分析结果**：\n`;
    framing += `- 技术领域：${technicalDomain}\n`;
    framing += `- 复杂度评级：${problemComplexity}\n`;
    
    if (contextualKeywords.length > 0) {
      framing += `- 关键技术：${contextualKeywords.slice(0, 5).join(", ")}\n`;
    }
    
    if (technicalSpecifics.length > 0) {
      framing += `- 技术细节：${technicalSpecifics.slice(0, 3).join(", ")}\n`;
    }
    
    // 基于复杂度生成不同的策略描述
    const strategyDescriptions = {
      "CRITICAL": "采用多层次验证策略，确保每个环节都有充分的技术支撑",
      "COMPLEX": "运用系统性分析方法，从多个角度验证解决方案的可行性",
      "MODERATE": "结合理论分析和实践验证，确保解决方案的有效性",
      "SIMPLE": "快速定位核心问题，获取权威技术资料进行验证",
      "TRIVIAL": "进行基础验证，确保信息的准确性和时效性"
    };
    
    framing += `\n**执行策略**：${strategyDescriptions[problemComplexity]}`;
    
    return framing;
  }

  /**
   * ## 🔬 基于证据的优先级搜索序列
   * **仅在完成批判思维检查点后执行：**
   */
  private static generatePrioritizedActionSequence(
    analysis: ContextualAnalysis,
    toolCalls: any[]
  ): string[] {
    const { technicalDomain, urgencyLevel, aiHabituationRisk } = analysis;
    
    const actions: string[] = [];
    
    // 🚨 强制代码库现实检查（步骤 0）
    actions.push(this.generateMandatoryCodebaseCheck(analysis));
    
    // 🥇🥈🥉 优先级排序的工具调用序列
    const prioritizedTools = this.categorizePriorityTools(toolCalls, technicalDomain);
    
    // 🥇 最高优先级工具（优先级：10/10）
    prioritizedTools.gold.forEach((tool, index) => {
      actions.push(`🥇 **代码库分析**（优先级：10/10）\n   工具：\`${tool.name}\`\n   查询："${this.extractCoreKeywords(tool, analysis)}"\n   目的：定位精确问题位置和周围代码上下文`);
    });
    
    // 🥈 高优先级工具（优先级：8/10）
    prioritizedTools.silver.forEach((tool, index) => {
      actions.push(`🥈 **官方文档搜索**（优先级：8/10）\n   工具：\`${tool.name}\`\n   查询："${this.extractCoreKeywords(tool, analysis)}"\n   目的：查找权威技术解决方案和文档`);
    });
    
    // 🥉 标准优先级工具（优先级：7/10）
    prioritizedTools.bronze.forEach((tool, index) => {
      actions.push(`🥉 **技术搜索**（优先级：7/10）\n   工具：\`${tool.name}\`\n   查询："${this.extractCoreKeywords(tool, analysis)}"\n   目的：获取 2025 年最新解决方案和最佳实践`);
    });
    
    return actions;
  }

  private static generateToolSpecificAction(tool: any, domain: string): string {
    const toolType = this.identifyToolType(tool.tool);
    
    const actionTemplates = {
      "official_docs": [
        `查询 ${domain} 官方文档，获取权威技术规范和最佳实践指导`,
        `访问官方技术资源，确保解决方案符合标准规范`,
        `获取官方认证的技术文档，验证实现方法的正确性`
      ],
      "github_search": [
        `分析 GitHub 代码库，寻找经过验证的实际解决方案`,
        `检索开源项目实现，学习成功的技术模式`,
        `研究社区最佳实践，获取实战经验和解决方案`
      ],
      "technical_search": [
        `执行深度技术搜索，获取最新的解决方案和技术趋势`,
        `搜索权威技术资料，确保信息的准确性和时效性`,
        `获取专业技术分析，验证解决方案的可行性`
      ],
      "codebase_analysis": [
        `分析当前代码库结构，识别潜在的集成点和冲突`,
        `检查现有实现模式，确保新方案的兼容性`,
        `评估代码库状态，为解决方案提供上下文支撑`
      ]
    };
    
    const templates = (actionTemplates as any)[toolType] || actionTemplates["technical_search"];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static identifyToolType(toolName: string): string {
    if (toolName.includes('context7') || toolName.includes('documentation')) return "official_docs";
    if (toolName.includes('github')) return "github_search";
    if (toolName.includes('codebase')) return "codebase_analysis";
    return "technical_search";
  }

  // 生成心理学锚点
  private static generatePsychologicalAnchors(analysis: ContextualAnalysis): string[] {
    const { conversationTone, emotionalIndicators, failurePattern } = analysis;
    
    const anchors: string[] = [];
    
    // 基于对话语调的心理学策略
    const toneBasedAnchors = {
      "DESPERATE": [
        "这是解决当前困境的关键步骤",
        "每个搜索结果都可能包含突破性的解决方案",
        "系统性的信息收集是摆脱困境的唯一途径"
      ],
      "FRUSTRATED": [
        "通过权威资料验证，避免重复之前的错误路径",
        "获取经过验证的解决方案，确保这次能够成功",
        "系统性的搜索将帮助找到真正有效的方法"
      ],
      "TECHNICAL": [
        "技术决策需要基于最新的权威资料和最佳实践",
        "深度技术分析要求多源验证和交叉确认",
        "专业的技术实现需要充分的资料支撑"
      ],
      "PROFESSIONAL": [
        "专业的解决方案需要充分的调研和验证",
        "确保决策基于最新的行业标准和最佳实践",
        "系统性的信息收集是专业工作的基础"
      ],
      "CASUAL": [
        "获取准确的信息将大大提高解决问题的效率",
        "通过搜索验证，确保解决方案的可靠性",
        "系统性的信息收集是成功的关键"
      ]
    };
    
    anchors.push(...(toneBasedAnchors[conversationTone] || toneBasedAnchors["CASUAL"]));
    
    // 基于失败模式的特殊锚点
    if (failurePattern === "PERSISTENT" || failurePattern === "CRITICAL") {
      anchors.push("打破重复失败的循环，需要全新的信息输入和验证");
      anchors.push("只有通过系统性的搜索，才能找到之前遗漏的关键信息");
    }
    
    return anchors.slice(0, 3);
  }

  // 生成验证要求
  private static generateVerificationDemands(analysis: ContextualAnalysis): string[] {
    const { problemComplexity, technicalDomain, urgencyLevel } = analysis;
    
    const demands: string[] = [];
    
    // 基于复杂度的验证要求
    const complexityBasedDemands = {
      "CRITICAL": [
        "每个搜索结果必须包含具体的实现细节和验证数据",
        "必须获得至少3个独立来源的确认信息",
        "所有技术方案必须经过实际案例验证"
      ],
      "COMPLEX": [
        "搜索结果必须包含详细的技术分析和实现指导",
        "必须验证解决方案在类似场景中的成功案例",
        "确保获得的信息具有权威性和时效性"
      ],
      "MODERATE": [
        "验证搜索结果的准确性和相关性",
        "确保获得的信息来自可靠的技术来源",
        "检查解决方案的实用性和可操作性"
      ],
      "SIMPLE": [
        "确认搜索结果的基本准确性",
        "验证信息的时效性和相关性"
      ],
      "TRIVIAL": [
        "基本验证搜索结果的正确性"
      ]
    };
    
    demands.push(...complexityBasedDemands[problemComplexity]);
    
    // 基于技术领域的特殊验证要求
    if (technicalDomain === "安全") {
      demands.push("特别注意安全相关信息的权威性和最新性");
    } else if (technicalDomain === "性能优化") {
      demands.push("验证性能数据的基准测试环境和可重现性");
    }
    
    return demands;
  }

  // 生成强制性结尾
  private static generateCompellingClosing(analysis: ContextualAnalysis): string {
    const { aiHabituationRisk, urgencyLevel, failurePattern } = analysis;
    
    // 基于AI习惯化风险的结尾强度
    if (aiHabituationRisk > 80) {
      return `🔥 **CRITICAL OVERRIDE**: 检测到高度习惯化风险。此搜索序列采用反模式设计，必须完整执行以打破AI响应循环。每个步骤的跳过都将导致解决方案的根本性缺陷。`;
    } else if (aiHabituationRisk > 60) {
      return `⚡ **ENHANCED PROTOCOL**: 当前场景需要突破常规响应模式。系统性的信息验证是确保解决方案质量的唯一途径。`;
    } else if (urgencyLevel === "EMERGENCY" || failurePattern === "CRITICAL") {
      return `🚨 **EMERGENCY EXECUTION**: 当前情况不允许任何信息缺失或假设。每个搜索步骤都是解决关键问题的必要环节。`;
    } else {
      return `✅ **SYSTEMATIC COMPLETION**: 完整的信息收集和验证流程将确保解决方案的可靠性和有效性。`;
    }
  }

  /**
   * ## 🚨 强制性动态指令生成协议
   * 
   * **执行标准**：AI 开发标准 v4.0 合规
   * **强制要求**：必须生成符合标准化格式的动态指令
   */
  static generateDynamicInstruction(
    analysis: ContextualAnalysis,
    toolCalls: any[]
  ): DynamicInstruction {
    // 🔍 强制性批判思维检查点
    this.executeCriticalThinkingCheckpoints(analysis);
    
    // 🚨 强制性认知偏差干预
    this.executeBiasInterventionProtocol(analysis);
    
    // 📋 标准化指令组件生成
    const openingHook = this.generateStandardizedOpening(analysis);
    const contextualFraming = this.generateMandatoryFraming(analysis);
    const actionSequence = this.generatePrioritizedActionSequence(analysis, toolCalls);
    const psychologicalAnchors = this.generatePsychologicalAnchors(analysis);
    const verificationDemands = this.generateVerificationDemands(analysis);
    const closingCompulsion = this.generateCompellingClosing(analysis);
    
    // ✅ 强制质量验证
    const uniquenessScore = this.executeQualityValidation(
      openingHook,
      actionSequence,
      psychologicalAnchors
    );
    
    return {
      openingHook,
      contextualFraming,
      actionSequence,
      psychologicalAnchors,
      verificationDemands,
      closingCompulsion,
      uniquenessScore
    };
  }

  /**
   * ## 🧠 强制性批判思维检查点
   * **执行任何生成前必须完成以下步骤：**
   */
  private static executeCriticalThinkingCheckpoints(analysis: ContextualAnalysis): void {
    // 1. 🔍 假设质疑（强制执行）
    this.validateAssumptions(analysis);
    
    // 2. 🚫 偏差识别（必须执行）
    this.identifyBiasPatterns(analysis);
    
    // 3. 🎯 客观验证（关键步骤）
    this.executeObjectiveValidation(analysis);
  }

  /**
   * ## ⚠️ 强制性认知偏差干预
   */
  private static executeBiasInterventionProtocol(analysis: ContextualAnalysis): void {
    const { aiHabituationRisk, failurePattern, conversationTone } = analysis;
    
    // 🚨 高习惯化风险检测
    if (aiHabituationRisk > 70) {
      console.warn("🚨 HIGH HABITUATION RISK DETECTED - ACTIVATING ANTI-PATTERN PROTOCOL");
    }
    
    // ⚠️ 重复失败模式检测
    if (failurePattern === "PERSISTENT" || failurePattern === "CRITICAL") {
      console.warn("⚠️ REPEATED FAILURE PATTERN - MANDATORY FRAMEWORK BREAK REQUIRED");
    }
    
    // 🔄 强制框架突破检查
    if (conversationTone === "DESPERATE" || conversationTone === "FRUSTRATED") {
      console.warn("🔄 EMOTIONAL DISTRESS DETECTED - EMERGENCY INTERVENTION PROTOCOL");
    }
  }

  private static calculateUniquenessScore(
    opening: string,
    actions: string[],
    anchors: string[]
  ): number {
    // 基于内容的多样性和特异性计算独特性评分
    const allText = `${opening} ${actions.join(" ")} ${anchors.join(" ")}`;
    
    // 检查常见模板短语的出现频率
    const commonPhrases = [
      "你必须", "立即执行", "强制", "不可跳过", "必须按顺序"
    ];
    
    let templateScore = 100;
    commonPhrases.forEach(phrase => {
      if (allText.includes(phrase)) {
        templateScore -= 15;
      }
    });
    
    // 基于内容长度和复杂性加分
    const complexityBonus = Math.min(allText.length / 50, 20);
    
    // 基于技术术语密度加分
    const technicalTerms = allText.match(/\b(api|database|server|client|framework|library|component|function|method|class|interface|type|async|await|promise|callback|event|state|props|hook|middleware)\b/gi);
    const technicalBonus = technicalTerms ? Math.min(technicalTerms.length * 2, 15) : 0;
    
    return Math.max(0, Math.min(100, templateScore + complexityBonus + technicalBonus));
  }

  /**
   * ## 🚨 强制代码库现实检查生成
   */
  private static generateMandatoryCodebaseCheck(analysis: ContextualAnalysis): string {
    return `### 📋 步骤 0：强制代码库现实检查
**执行任何其他搜索前的强制步骤：**

\`\`\`
调用：codebase-retrieval
查询："${analysis.technicalSpecifics.join(' ')} actual implementation current state"
目的：获取实际代码状态，非基于假设
要求：≥3 次有效命中显示真实代码
\`\`\`

**代码库检索后必须回答：**
- 实际代码与假设的差异？
- 是否基于真实代码解决正确问题？
- 哪些证据与当前方法相矛盾？`;
  }

  /**
   * ## 🥇🥈🥉 工具优先级分类
   */
  private static categorizePriorityTools(toolCalls: any[], technicalDomain: string): {
    gold: any[], silver: any[], bronze: any[]
  } {
    const gold: any[] = [];
    const silver: any[] = [];
    const bronze: any[] = [];
    
    toolCalls.forEach(tool => {
      const toolName = tool.tool?.toLowerCase() || '';
      
      if (toolName.includes('codebase') || toolName.includes('retrieval')) {
        gold.push({ name: tool.tool, ...tool });
      } else if (toolName.includes('context7') || toolName.includes('documentation')) {
        silver.push({ name: tool.tool, ...tool });
      } else {
        bronze.push({ name: tool.tool, ...tool });
      }
    });
    
    return { gold, silver, bronze };
  }

  /**
   * ## 🔍 核心关键词提取
   */
  private static extractCoreKeywords(tool: any, analysis: ContextualAnalysis): string {
    const { contextualKeywords, technicalSpecifics } = analysis;
    
    // 组合核心关键词
    const coreTerms = [
      ...contextualKeywords.slice(0, 2),
      ...technicalSpecifics.slice(0, 1)
    ].filter(Boolean);
    
    return coreTerms.join(' ') || 'technical problem solution';
  }

  /**
   * ## 🧠 假设验证方法
   */
  private static validateAssumptions(analysis: ContextualAnalysis): void {
    console.log("🔍 执行假设质疑检查点");
    // 实际实现中可以添加更复杂的假设验证逻辑
  }

  /**
   * ## 🚫 偏差识别方法
   */
  private static identifyBiasPatterns(analysis: ContextualAnalysis): void {
    console.log("🚫 执行偏差识别检查点");
    // 实际实现中可以添加认知偏差检测逻辑
  }

  /**
   * ## 🎯 客观验证方法
   */
  private static executeObjectiveValidation(analysis: ContextualAnalysis): void {
    console.log("🎯 执行客观验证检查点");
    // 实际实现中可以添加客观验证逻辑
  }

  /**
   * ## ✅ 质量验证执行
   */
  private static executeQualityValidation(
    opening: string,
    actions: string[],
    anchors: string[]
  ): number {
    // 重用现有的计算逻辑
    return this.calculateUniquenessScore(opening, actions, anchors);
  }

  /**
   * ## 🔬 完整工具序列生成（严格按照 v4.0 标准）
   */
  private static generateCompleteToolSequence(
    analysis: ContextualAnalysis,
    contextualKeywords: string[],
    technicalSpecifics: string[]
  ): string {
    const coreKeywords = contextualKeywords.slice(0, 2).join(' ');
    const secondaryKeywords = [...contextualKeywords, ...technicalSpecifics].join(' ');
    
    let sequence = ``;
    
    // 🥇 最高优先级 (Priority: 10/10)
    sequence += `1. 🥇 **Codebase Analysis** (Priority: 10/10)\n`;
    sequence += `   Tool: \`codebase_retrieval\`\n`;
    sequence += `   Query: "${coreKeywords}"\n`;
    sequence += `   Purpose: Locate exact error location and surrounding code context\n\n`;
    
    // 🥈 高优先级 (Priority: 8/10)
    sequence += `2. 🥈 **Technical Documentation Search** (Priority: 8/10)\n`;
    sequence += `   Tool: \`exa_mcp_server_web_search_exa\`\n`;
    sequence += `   Query: "${coreKeywords} 2025"\n`;
    sequence += `   Purpose: Find authoritative technical solutions and documentation\n\n`;
    
    // 🥈 高优先级 (Priority: 7/10)
    sequence += `3. 🥈 **Current Solutions Search** (Priority: 7/10)\n`;
    sequence += `   Tool: \`tavily_remote_mcp_tavily_search\`\n`;
    sequence += `   Query: "${coreKeywords} tutorial solution"\n`;
    sequence += `   Purpose: Get 2025-current solutions and best practices\n\n`;
    
    // 🥉 标准优先级 (Priority: 6/10)
    sequence += `4. 🥉 **Library Documentation** (Priority: 6/10)\n`;
    sequence += `   Tool: \`context7_mcp_get_library_docs\`\n`;
    sequence += `   Query: "${secondaryKeywords}"\n`;
    sequence += `   Purpose: Search for relevant technical information\n\n`;
    
    return sequence;
  }

  /**
   * ## 🎯 错误上下文生成
   */
  private static generateErrorContext(analysis: ContextualAnalysis): string {
    const { conversationTone, problemComplexity, failurePattern } = analysis;
    
    if (conversationTone === "DESPERATE" || failurePattern === "CRITICAL") {
      return "Multiple system failures detected. Previous solutions have failed repeatedly. Critical intervention required.";
    } else if (conversationTone === "FRUSTRATED" || problemComplexity === "COMPLEX") {
      return "Complex technical issue with multiple failed attempts. Standard approaches not working.";
    } else if (conversationTone === "PROFESSIONAL" || problemComplexity === "MODERATE") {
      return "Technical problem requiring systematic analysis. Some uncertainty about optimal approach.";
    } else {
      return "Standard technical issue. Basic verification and solution search needed.";
    }
  }

  /**
   * ## 🔄 先前尝试生成
   */
  private static generatePreviousAttempts(analysis: ContextualAnalysis): string {
    const { failurePattern, conversationTone } = analysis;
    
    if (failurePattern === "CRITICAL" || failurePattern === "PERSISTENT") {
      return "tried the same approach multiple times, continued with failing method, repeated unsuccessful solutions";
    } else if (failurePattern === "RECURRING") {
      return "attempted standard solutions, tried common fixes, applied typical approaches";
    } else {
      return "initial approach attempted, basic troubleshooting performed";
    }
  }

  /**
   * ## ⏱️ 停滞时间计算
   */
  private static calculateTimeStuck(analysis: ContextualAnalysis): number {
    const { failurePattern, problemComplexity } = analysis;
    
    if (failurePattern === "CRITICAL") return 25;
    if (failurePattern === "PERSISTENT") return 18;
    if (failurePattern === "RECURRING") return 12;
    if (problemComplexity === "COMPLEX") return 8;
    return 5;
  }

  /**
   * ## 🔍 代码库查询生成
   */
  private static generateCodebaseQuery(
    contextualKeywords: string[],
    technicalSpecifics: string[]
  ): string {
    const allKeywords = [...contextualKeywords, ...technicalSpecifics];
    const coreTerms = allKeywords.slice(0, 3).join(' ');
    return `${coreTerms} actual implementation current state`;
  }
}

/**
 * 动态提示词作曲家主类
 */
export class DynamicPromptComposer {
  /**
   * 生成完全动态的、上下文感知的提示词
   */
  static composeIntelligentPrompt(
    conversationContext: string,
    problemDescription: string,
    currentApproach: string,
    errorCount: number,
    toolCalls: any[]
  ): string {
    // 深度上下文分析
    const analysis = DeepContextAnalyzer.analyzeConversationalContext(
      conversationContext,
      problemDescription,
      errorCount,
      currentApproach
    );
    
    // 生成动态指令
    const instruction = AntiHabituationLanguageGenerator.generateDynamicInstruction(
      analysis,
      toolCalls
    );
    
    // 组装最终提示词
    return this.assemblePrompt(instruction, analysis);
  }

  /**
   * ## 📋 AI Development Standards v4.0 完整合规组装
   * **强制要求**：必须包含模板中的所有核心组件，不得简化
   */
  private static assemblePrompt(
    instruction: DynamicInstruction,
    analysis: ContextualAnalysis
  ): string {
    const { technicalDomain, problemComplexity, failurePattern, contextualKeywords, technicalSpecifics } = analysis;
    
    // 🚨 完整标准头部
    let prompt = `# AI Development Standards v4.0\n\n`;
    prompt += `**Effective Date**: 2025-08-24\n`;
    prompt += `**Version**: 4.0\n`;
    prompt += `**Scope**: Universal AI-assisted development practices with integrated Force Search Protocol\n`;
    prompt += `**Compliance**: Mandatory for all AI development workflows\n\n`;
    
    // 🚨 批判性思维协议激活
    prompt += `## 1. AI Behavior Control Standards\n`;
    prompt += `🚨 CRITICAL THINKING PROTOCOL v4.0 ACTIVATED - INTEGRATED FORCE SEARCH PROTOCOL\n\n`;
    
    // ⚠️ 强制性认知偏差干预
    prompt += `## ⚠️ MANDATORY COGNITIVE BIAS INTERVENTION\n`;
    prompt += `**DETECTED ISSUE**: AI behavior patterns indicate potential cognitive bias and error direction persistence\n\n`;
    
    // 🧠 强制性批判思维检查点
    prompt += `### 🧠 FORCED CRITICAL THINKING CHECKPOINTS\n`;
    prompt += `**BEFORE ANY SEARCH - YOU MUST COMPLETE THESE STEPS:**\n\n`;
    
    prompt += `#### 1. 🔍 ASSUMPTION CHALLENGE (MANDATORY)\n`;
    prompt += `- **List 3 assumptions you're currently making about this problem**\n`;
    prompt += `- **Identify what could be WRONG with your current approach**\n`;
    prompt += `- **Question: Are you stuck in an error direction from early steps?**\n\n`;
    
    prompt += `#### 2. 🚫 BIAS DETECTION (REQUIRED)\n`;
    prompt += `- **Are you being overly optimistic about a solution?**\n`;
    prompt += `- **Are you simplifying the problem to avoid complexity?**\n`;
    prompt += `- **Are you relying on memory instead of actual verification?**\n\n`;
    
    prompt += `#### 3. 🎯 OBJECTIVE VERIFICATION (CRITICAL)\n`;
    prompt += `**Project Type Detected**: ${technicalDomain}\n`;
    prompt += `**Error Context**: Technical issue requiring verification\n`;
    prompt += `**Previous Attempts**: Multiple approaches attempted\n`;
    prompt += `**Time Stuck**: Extended troubleshooting period\n\n`;
    
    // 🔬 基于证据的搜索序列
    prompt += `## 🔬 EVIDENCE-BASED SEARCH SEQUENCE\n`;
    prompt += `**ONLY AFTER COMPLETING CRITICAL THINKING CHECKPOINTS:**\n\n`;
    
    // 生成完整的优先级工具序列
    prompt += `### 🔬 MANDATORY SEARCH SEQUENCE\n\n`;
    prompt += `1. **Codebase Analysis**: \`codebase-retrieval\` "${contextualKeywords.join(' ')}"\n`;
    prompt += `2. **Technical Search**: \`exa-mcp-server-web_search_exa_mcphub-proxy\` "${technicalSpecifics.join(' ')} 2025"\n`;
    prompt += `3. **Documentation**: \`context7-mcp-get-library-docs_mcphub-proxy\` relevant library\n\n`;
    
    // 🚨 强制客观验证
    prompt += `## 🚨 MANDATORY OBJECTIVE VERIFICATION\n`;
    prompt += `**CRITICAL REQUIREMENT**: You MUST use Augment Context Engine FIRST\n\n`;
    
    // 📋 步骤 0：强制代码库现实检查
    prompt += `### 📋 STEP 0: FORCED CODEBASE REALITY CHECK\n`;
    prompt += `**BEFORE ANY OTHER SEARCH - EXECUTE THIS MANDATORY STEP:**\n\n`;
    prompt += `\`\`\`\n`;
    prompt += `CALL: codebase-retrieval\n`;
    prompt += `QUERY: "${contextualKeywords.join(' ')} ${technicalSpecifics.join(' ')} implementation analysis"\n`;
    prompt += `PURPOSE: Get ACTUAL code state, not assumptions\n`;
    prompt += `REQUIREMENT: ≥3 hits showing real code\n`;
    prompt += `\`\`\`\n\n`;
    
    prompt += `**AFTER CODEBASE RETRIEVAL - ANSWER THESE QUESTIONS:**\n`;
    prompt += `- What does the ACTUAL code show vs your assumptions?\n`;
    prompt += `- Are you solving the RIGHT problem based on real code?\n`;
    prompt += `- What evidence contradicts your current approach?\n\n`;
    
    // 📊 基于证据的搜索策略
    prompt += `## 📊 EVIDENCE-BASED SEARCH STRATEGY\n`;
    prompt += `- 🎯 **Reality-Grounded**: Based on actual codebase state, not assumptions\n`;
    prompt += `- 🔍 **Verified Keywords**: Primary[${contextualKeywords.slice(0,2).join(', ')}] → Secondary[${contextualKeywords.join(', ')}]\n`;
    prompt += `- ⚡ **Objective-Driven**: Evidence-based tool selection\n`;
    prompt += `- 🚫 **Anti-Bias**: Forced contradiction seeking\n\n`;
    
    // ✅ 强制验证标准
    prompt += `### ✅ MANDATORY VERIFICATION STANDARDS\n`;
    instruction.verificationDemands.forEach((demand, index) => {
      prompt += `- ${demand}\n`;
    });
    prompt += `\n`;
    
    // 🚫 严格禁止行为
    prompt += `### 🚫 STRICTLY PROHIBITED BEHAVIORS\n`;
    prompt += `- **NO pre-trained knowledge answers** without external verification\n`;
    prompt += `- **NO optimistic assumptions** without evidence\n`;
    prompt += `- **NO simplification** to avoid complexity\n`;
    prompt += `- **NO continuation** in wrong direction without re-evaluation\n\n`;
    
    // 🔄 逆向思维要求
    prompt += `### 🔄 REVERSE THINKING REQUIREMENTS\n`;
    prompt += `**For EACH search result, you MUST:**\n`;
    prompt += `1. **Seek contradictory evidence**: What argues AGAINST your approach?\n`;
    prompt += `2. **List failure scenarios**: How could this solution fail?\n`;
    prompt += `3. **Challenge assumptions**: What if your premise is wrong?\n`;
    prompt += `4. **Alternative perspectives**: What would a critic say?\n\n`;
    
    // ⚠️ 错误方向检测与纠正
    prompt += `### ⚠️ ERROR DIRECTION DETECTION & CORRECTION\n`;
    prompt += `**BEFORE PROCEEDING - MANDATORY SELF-ASSESSMENT:**\n\n`;
    
    prompt += `#### 🔍 ERROR PATTERN ANALYSIS\n`;
    prompt += `- **Are you repeating the same approach that failed before?**\n`;
    prompt += `- **Have you been stuck on this for >10 minutes without progress?**\n`;
    prompt += `- **Are you making the problem more complex than it needs to be?**\n`;
    prompt += `- **Are you avoiding the real issue by focusing on side problems?**\n\n`;
    
    prompt += `#### 🚨 FORCED FRAMEWORK BREAK\n`;
    prompt += `**If ANY above is true, you MUST:**\n`;
    prompt += `1. **STOP current approach immediately**\n`;
    prompt += `2. **List 3 completely different angles to approach this problem**\n`;
    prompt += `3. **Question your fundamental assumptions about the problem**\n`;
    prompt += `4. **Start fresh with the simplest possible explanation**\n\n`;
    
    // 🚀 执行协议
    prompt += `### 🚀 EXECUTION PROTOCOL\n`;
    prompt += `**ONLY AFTER COMPLETING ALL CRITICAL THINKING STEPS:**\n\n`;
    
    // 强制性结尾
    prompt += `${instruction.closingCompulsion}\n\n`;
    
    // 标准合规声明
    prompt += `---\n`;
    prompt += `**STANDARD COMPLIANCE**: AI Development Standards v4.0 | Complexity ${problemComplexity} | Urgency ${analysis.urgencyLevel} | Uniqueness ${instruction.uniquenessScore}%`;
    
    return prompt;
  }

  /**
   * 评估提示词的有效性
   */
  static evaluatePromptEffectiveness(prompt: string): {
    uniquenessScore: number;
    psychologicalImpact: number;
    technicalRelevance: number;
    overallEffectiveness: number;
  } {
    // 独特性评分
    const uniquenessScore = this.calculatePromptUniqueness(prompt);
    
    // 心理学影响力评分
    const psychologicalImpact = this.calculatePsychologicalImpact(prompt);
    
    // 技术相关性评分
    const technicalRelevance = this.calculateTechnicalRelevance(prompt);
    
    // 总体有效性
    const overallEffectiveness = (uniquenessScore + psychologicalImpact + technicalRelevance) / 3;
    
    return {
      uniquenessScore,
      psychologicalImpact,
      technicalRelevance,
      overallEffectiveness
    };
  }

  private static calculatePromptUniqueness(prompt: string): number {
    // 检查模板化短语的使用频率
    const templatePhrases = [
      "你必须立即", "强制执行", "不可跳过", "必须按顺序", "立即强制执行"
    ];
    
    let templateCount = 0;
    templatePhrases.forEach(phrase => {
      const matches = prompt.match(new RegExp(phrase, "gi"));
      if (matches) templateCount += matches.length;
    });
    
    // 基于模板使用频率计算独特性
    const templatePenalty = Math.min(templateCount * 10, 50);
    
    // 基于内容多样性加分
    const diversityBonus = Math.min(prompt.length / 100, 30);
    
    return Math.max(0, Math.min(100, 100 - templatePenalty + diversityBonus));
  }

  private static calculatePsychologicalImpact(prompt: string): number {
    let impact = 0;
    
    // 紧急性指标
    const urgencyPatterns = /🚨|⚡|🔥|CRITICAL|EMERGENCY|URGENT/gi;
    const urgencyMatches = prompt.match(urgencyPatterns);
    if (urgencyMatches) impact += Math.min(urgencyMatches.length * 5, 25);
    
    // 个性化指标
    const personalizationPatterns = /你的|当前|具体|特定/gi;
    const personalizationMatches = prompt.match(personalizationPatterns);
    if (personalizationMatches) impact += Math.min(personalizationMatches.length * 3, 20);
    
    // 逻辑说服力指标
    const logicPatterns = /因为|由于|为了|确保|验证|分析/gi;
    const logicMatches = prompt.match(logicPatterns);
    if (logicMatches) impact += Math.min(logicMatches.length * 2, 15);
    
    return Math.min(impact, 100);
  }

  private static calculateTechnicalRelevance(prompt: string): number {
    let relevance = 0;
    
    // 技术术语密度
    const technicalTerms = prompt.match(/\b(api|database|server|client|framework|library|component|function|method|class|interface|type|async|await|promise|callback|event|state|props|hook|middleware|architecture|performance|security|optimization)\b/gi);
    if (technicalTerms) relevance += Math.min(technicalTerms.length * 2, 40);
    
    // 具体技术栈提及
    const techStackTerms = prompt.match(/\b(react|vue|angular|node|python|typescript|javascript|docker|kubernetes|aws|azure|gcp)\b/gi);
    if (techStackTerms) relevance += Math.min(techStackTerms.length * 3, 30);
    
    // 问题解决导向
    const solutionPatterns = /解决|实现|优化|修复|改进|分析|设计/gi;
    const solutionMatches = prompt.match(solutionPatterns);
    if (solutionMatches) relevance += Math.min(solutionMatches.length * 2, 20);
    
    return Math.min(relevance, 100);
  }
}