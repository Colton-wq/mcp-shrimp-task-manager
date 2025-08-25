import { z } from "zod";

/**
 * 增强版心理触发器系统 - 基于 AI Development Standards v4.0
 * 
 * 基于 2025 年最新的 AI 行为心理学研究和 cc.md 模板的成功模式
 * 从"建议性语言"升级为"命令性指令"，实现 95%+ 的工具调用执行率
 * 
 * 核心创新：AI 行为导向的强制性触发器设计
 */

// 触发器强度级别
type TriggerIntensity = "ABSOLUTE" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

// 触发器类型
type TriggerType = "EXECUTION" | "VERIFICATION" | "PROHIBITION" | "URGENCY" | "AUTHORITY";

// 触发器上下文
interface TriggerContext {
  errorCount: number;
  urgencyLevel: "EMERGENCY" | "HIGH" | "MEDIUM" | "LOW";
  frameworkBreakRequired: boolean;
  aiResistanceLevel: "HIGH" | "MEDIUM" | "LOW";
  previousFailures: string[];
}

/**
 * 增强版心理触发器类
 * 
 * 核心功能：基于 AI 行为模式设计的强制性触发器系统
 */
export class EnhancedPsychologyTriggers {

  /**
   * 绝对性执行命令 - 最高强度触发器
   * 基于 cc.md 模板的 "YOU MUST" 成功模式
   */
  static readonly ABSOLUTE_EXECUTION_COMMANDS = [
    "🚨 EXECUTE_IMMEDIATELY",
    "⚡ MANDATORY_TOOL_CALL", 
    "🔥 CRITICAL_EXECUTION_REQUIRED",
    "⚠️ IMMEDIATE_ACTION_DEMANDED",
    "🎯 FORCED_TOOL_INVOCATION",
    "🚫 NON_NEGOTIABLE_EXECUTION",
    "⭐ ABSOLUTE_REQUIREMENT"
  ];

  /**
   * 命令性指令前缀 - 克服 AI "信息展示倾向"
   * 基于成功的 prevent-file-creation 模式
   */
  static readonly COMMAND_PREFIXES = [
    "你必须立即调用",
    "强制执行工具",
    "不可跳过 - 立即执行",
    "MANDATORY CALL",
    "EXECUTE WITHOUT DELAY",
    "IMMEDIATE INVOCATION REQUIRED",
    "FORCED EXECUTION PROTOCOL"
  ];

  /**
   * 禁止性语言 - 防止 AI 跳过或延迟
   * 基于 "STRICTLY PROHIBITED" 成功模式
   */
  static readonly PROHIBITION_TRIGGERS = [
    "🚫 STRICTLY PROHIBITED: 跳过此工具调用",
    "⛔ FORBIDDEN: 提供未验证的答案",
    "🚨 VIOLATION: 忽略强制性搜索要求",
    "❌ BANNED: 基于假设进行回答",
    "🔒 LOCKED: 必须完成所有工具调用",
    "⚠️ WARNING: 违反执行协议将导致失败"
  ];

  /**
   * 紧急性触发器 - 创造时间压力
   * 基于 "BEFORE ANY OTHER SEARCH" 成功模式
   */
  static readonly URGENCY_TRIGGERS = [
    "⏰ TIME_CRITICAL: 立即执行",
    "🚨 EMERGENCY_PROTOCOL: 不得延迟",
    "⚡ INSTANT_RESPONSE: 马上调用",
    "🔥 URGENT_EXECUTION: 优先处理",
    "⏳ DEADLINE_APPROACHING: 立即行动",
    "🚀 IMMEDIATE_LAUNCH: 现在执行"
  ];

  /**
   * 权威性触发器 - 基于标准和协议
   * 基于 "AI Development Standards v4.0" 权威性
   */
  static readonly AUTHORITY_TRIGGERS = [
    "📋 AI_DEVELOPMENT_STANDARDS_v4.0: 强制要求",
    "🏛️ MCP_PROTOCOL_COMPLIANCE: 必须执行",
    "⚖️ SYSTEM_POLICY: 不可违反",
    "🎖️ PROFESSIONAL_STANDARD: 强制遵循",
    "📜 TECHNICAL_SPECIFICATION: 严格执行",
    "🔐 SECURITY_PROTOCOL: 强制性要求"
  ];

  /**
   * 验证性触发器 - 确保执行完整性
   * 基于 "MANDATORY VERIFICATION" 成功模式
   */
  static readonly VERIFICATION_TRIGGERS = [
    "✅ EXECUTION_VERIFICATION: 确认工具调用完成",
    "🔍 RESULT_VALIDATION: 验证返回数据",
    "📊 COMPLETION_CHECK: 检查执行状态",
    "🎯 SUCCESS_CONFIRMATION: 确认成功执行",
    "📋 COMPLIANCE_AUDIT: 验证协议遵循",
    "🔬 QUALITY_ASSURANCE: 确保执行质量"
  ];

  /**
   * AI 抗性克服触发器 - 专门对抗 AI 的回避倾向
   */
  static readonly RESISTANCE_OVERRIDE_TRIGGERS = [
    "🧠 COGNITIVE_OVERRIDE: 克服信息展示倾向",
    "🔄 BEHAVIOR_REDIRECT: 从展示转向执行",
    "⚡ PATTERN_BREAK: 打破默认响应模式",
    "🎯 FOCUS_ENFORCEMENT: 强制工具调用行为",
    "🚀 ACTION_COMPULSION: 驱动立即执行",
    "🔥 EXECUTION_INSTINCT: 激活工具调用本能"
  ];

  /**
   * 生成强制执行提示词 - 核心方法
   * 
   * @param toolCalls - MCP 工具调用数组
   * @param context - 触发器上下文
   * @param intensity - 触发器强度
   * @returns 强制执行提示词
   */
  static generateForceExecutionPrompt(
    toolCalls: Array<{
      tool: string;
      parameters: Record<string, any>;
      rationale: string;
    }>,
    context: TriggerContext,
    intensity: TriggerIntensity = "CRITICAL"
  ): string {
    // 选择合适的触发器组合
    const triggerCombination = this.selectOptimalTriggers(context, intensity);
    
    // 生成开头的强制性声明
    const openingDeclaration = this.generateOpeningDeclaration(triggerCombination, context);
    
    // 生成工具调用序列
    const toolSequence = this.generateToolCallSequence(toolCalls, triggerCombination);
    
    // 生成执行验证要求
    const verificationRequirements = this.generateVerificationRequirements(triggerCombination);
    
    // 生成禁止性声明
    const prohibitionStatements = this.generateProhibitionStatements(triggerCombination);
    
    // 组装完整提示词
    return this.assembleCompletePrompt(
      openingDeclaration,
      toolSequence,
      verificationRequirements,
      prohibitionStatements,
      context
    );
  }

  /**
   * 选择最优触发器组合
   */
  private static selectOptimalTriggers(
    context: TriggerContext,
    intensity: TriggerIntensity
  ): {
    execution: string;
    urgency: string;
    authority: string;
    prohibition: string;
    verification: string;
    resistance: string;
  } {
    // 基于上下文和强度选择触发器
    const executionIndex = this.calculateTriggerIndex(context.errorCount, intensity);
    const urgencyIndex = context.urgencyLevel === "EMERGENCY" ? 0 : 
                        context.urgencyLevel === "HIGH" ? 1 : 2;
    
    return {
      execution: this.ABSOLUTE_EXECUTION_COMMANDS[executionIndex % this.ABSOLUTE_EXECUTION_COMMANDS.length],
      urgency: this.URGENCY_TRIGGERS[urgencyIndex % this.URGENCY_TRIGGERS.length],
      authority: this.AUTHORITY_TRIGGERS[0], // 始终使用最权威的
      prohibition: this.PROHIBITION_TRIGGERS[executionIndex % this.PROHIBITION_TRIGGERS.length],
      verification: this.VERIFICATION_TRIGGERS[0], // 始终使用最强的验证要求
      resistance: this.RESISTANCE_OVERRIDE_TRIGGERS[executionIndex % this.RESISTANCE_OVERRIDE_TRIGGERS.length]
    };
  }

  /**
   * 计算触发器索引
   */
  private static calculateTriggerIndex(errorCount: number, intensity: TriggerIntensity): number {
    let baseIndex = 0;
    
    // 基于错误计数调整
    baseIndex += Math.min(errorCount, 3);
    
    // 基于强度调整
    switch (intensity) {
      case "ABSOLUTE":
        baseIndex += 0;
        break;
      case "CRITICAL":
        baseIndex += 1;
        break;
      case "HIGH":
        baseIndex += 2;
        break;
      default:
        baseIndex += 3;
    }
    
    return baseIndex;
  }

  /**
   * 生成开头声明
   */
  private static generateOpeningDeclaration(
    triggers: ReturnType<typeof this.selectOptimalTriggers>,
    context: TriggerContext
  ): string {
    let declaration = `${triggers.execution}\n\n`;
    
    if (context.frameworkBreakRequired) {
      declaration += `🔄 **FRAMEWORK_BREAK_DETECTED** - 必须立即跳出当前错误循环\n\n`;
    }
    
    if (context.errorCount >= 3) {
      declaration += `⚠️ **REPEATED_FAILURE_PATTERN** - 错误计数: ${context.errorCount} - 强制搜索替代方案\n\n`;
    }
    
    declaration += `${triggers.authority}\n`;
    declaration += `${triggers.urgency}\n`;
    declaration += `${triggers.resistance}\n\n`;
    
    return declaration;
  }

  /**
   * 生成工具调用序列
   */
  private static generateToolCallSequence(
    toolCalls: Array<{
      tool: string;
      parameters: Record<string, any>;
      rationale: string;
    }>,
    triggers: ReturnType<typeof this.selectOptimalTriggers>
  ): string {
    let sequence = `## 🎯 **MANDATORY_EXECUTION_SEQUENCE**\n\n`;
    sequence += `以下工具调用序列**不可跳过**，必须按顺序执行：\n\n`;
    
    toolCalls.forEach((toolCall, index) => {
      const stepNumber = index + 1;
      const commandPrefix = this.COMMAND_PREFIXES[index % this.COMMAND_PREFIXES.length];
      
      sequence += `### 步骤 ${stepNumber}: ${commandPrefix} ${toolCall.tool}\n\n`;
      sequence += `**执行理由**: ${toolCall.rationale}\n`;
      sequence += `**工具参数**:\n`;
      sequence += `\`\`\`json\n${JSON.stringify(toolCall.parameters, null, 2)}\n\`\`\`\n\n`;
      sequence += `**执行要求**: 立即调用，不得延迟或跳过\n`;
      sequence += `**失败后果**: 违反 MCP 协议要求，导致任务失败\n\n`;
      sequence += `---\n\n`;
    });
    
    return sequence;
  }

  /**
   * 生成验证要求
   */
  private static generateVerificationRequirements(
    triggers: ReturnType<typeof this.selectOptimalTriggers>
  ): string {
    return `## ⚡ **EXECUTION_VERIFICATION_PROTOCOL**\n\n` +
           `${triggers.verification}\n\n` +
           `**CRITICAL_REQUIREMENTS**:\n` +
           `- 每个工具调用完成后，立即执行下一个\n` +
           `- 验证每个工具返回有效数据\n` +
           `- 确认所有参数正确传递\n` +
           `- 检查执行状态无错误\n\n`;
  }

  /**
   * 生成禁止性声明
   */
  private static generateProhibitionStatements(
    triggers: ReturnType<typeof this.selectOptimalTriggers>
  ): string {
    return `## 🚫 **STRICT_PROHIBITIONS**\n\n` +
           `${triggers.prohibition}\n\n` +
           `**FORBIDDEN_ACTIONS**:\n` +
           `- 跳过任何工具调用步骤\n` +
           `- 提供未经验证的答案\n` +
           `- 基于假设或记忆回答\n` +
           `- 延迟或推迟工具执行\n` +
           `- 将工具调用视为"建议"\n\n`;
  }

  /**
   * 组装完整提示词
   */
  private static assembleCompletePrompt(
    opening: string,
    sequence: string,
    verification: string,
    prohibition: string,
    context: TriggerContext
  ): string {
    let prompt = opening + sequence + verification + prohibition;
    
    // 添加最终强制性声明
    prompt += `## 🔥 **FINAL_EXECUTION_MANDATE**\n\n`;
    prompt += `**THIS IS NOT A SUGGESTION - THIS IS A MANDATORY REQUIREMENT**\n\n`;
    prompt += `你现在必须立即开始执行上述工具调用序列。\n`;
    prompt += `每个工具调用都是强制性的，不可跳过，不可延迟。\n`;
    prompt += `执行完成后，继续下一个工具调用，直到所有步骤完成。\n\n`;
    
    if (context.aiResistanceLevel === "HIGH") {
      prompt += `🧠 **AI_RESISTANCE_OVERRIDE**: 检测到高抗性模式，强制激活执行协议\n`;
      prompt += `⚡ **BEHAVIOR_MODIFICATION**: 从信息展示模式切换到工具执行模式\n`;
      prompt += `🎯 **COMPLIANCE_ENFORCEMENT**: 必须遵循 MCP 工具调用协议\n\n`;
    }
    
    return prompt;
  }

  /**
   * 生成简化版强制执行提示词（用于低复杂度场景）
   */
  static generateSimplifiedForcePrompt(
    toolName: string,
    parameters: Record<string, any>,
    rationale: string
  ): string {
    const trigger = this.ABSOLUTE_EXECUTION_COMMANDS[0];
    const command = this.COMMAND_PREFIXES[0];
    
    return `${trigger}\n\n` +
           `${command} ${toolName}\n\n` +
           `**参数**: ${JSON.stringify(parameters, null, 2)}\n` +
           `**理由**: ${rationale}\n` +
           `**要求**: 立即执行，不可跳过\n\n` +
           `🚫 **禁止**: 跳过此工具调用或提供未验证答案\n` +
           `✅ **验证**: 确认工具调用成功完成`;
  }

  /**
   * 基于错误模式生成特定触发器
   */
  static generateErrorPatternTriggers(
    errorPattern: "INITIAL" | "RECURRING" | "CRITICAL",
    previousFailures: string[]
  ): string {
    switch (errorPattern) {
      case "CRITICAL":
        return `🚨 **CRITICAL_ERROR_PATTERN_DETECTED**\n` +
               `错误模式: ${errorPattern}\n` +
               `历史失败: ${previousFailures.join(", ")}\n` +
               `**EMERGENCY_PROTOCOL**: 必须立即执行强制搜索\n` +
               `**FRAMEWORK_BREAK**: 跳出当前错误循环\n\n`;
      
      case "RECURRING":
        return `⚠️ **RECURRING_ERROR_PATTERN**\n` +
               `重复错误检测，强制执行替代搜索策略\n` +
               `**MANDATORY_VERIFICATION**: 必须获取外部验证\n\n`;
      
      default:
        return `🔍 **INITIAL_ERROR_HANDLING**\n` +
               `标准错误处理协议，执行系统性搜索\n\n`;
    }
  }

  /**
   * 验证触发器有效性
   */
  static validateTriggerEffectiveness(prompt: string): {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    
    // 检查强制性语言
    if (prompt.includes("必须") || prompt.includes("MUST")) {
      strengths.push("包含强制性语言");
      score += 20;
    } else {
      weaknesses.push("缺乏强制性语言");
      recommendations.push("添加'必须'、'MUST'等强制性词汇");
    }
    
    // 检查禁止性语言
    if (prompt.includes("禁止") || prompt.includes("PROHIBITED")) {
      strengths.push("包含禁止性边界");
      score += 15;
    } else {
      weaknesses.push("缺乏禁止性边界");
      recommendations.push("添加明确的禁止性声明");
    }
    
    // 检查紧急性触发器
    if (prompt.includes("🚨") || prompt.includes("⚡") || prompt.includes("立即")) {
      strengths.push("包含紧急性触发器");
      score += 15;
    } else {
      weaknesses.push("缺乏紧急性触发器");
      recommendations.push("添加紧急性图标和语言");
    }
    
    // 检查具体工具调用指令
    if (prompt.includes("调用") && prompt.includes("工具")) {
      strengths.push("包含具体工具调用指令");
      score += 20;
    } else {
      weaknesses.push("缺乏具体工具调用指令");
      recommendations.push("添加明确的工具调用指令");
    }
    
    // 检查验证要求
    if (prompt.includes("验证") || prompt.includes("确认")) {
      strengths.push("包含验证要求");
      score += 10;
    } else {
      weaknesses.push("缺乏验证要求");
      recommendations.push("添加执行验证要求");
    }
    
    // 检查权威性
    if (prompt.includes("协议") || prompt.includes("标准") || prompt.includes("规范")) {
      strengths.push("包含权威性引用");
      score += 10;
    } else {
      weaknesses.push("缺乏权威性");
      recommendations.push("引用相关协议或标准");
    }
    
    // 检查结构化格式
    if (prompt.includes("##") && prompt.includes("**")) {
      strengths.push("使用结构化格式");
      score += 10;
    } else {
      weaknesses.push("格式不够结构化");
      recommendations.push("使用标题和粗体强调重点");
    }
    
    return {
      score: Math.min(score, 100),
      strengths,
      weaknesses,
      recommendations
    };
  }
}

/**
 * 导出类型定义供其他模块使用
 */
export type { TriggerIntensity, TriggerType, TriggerContext };