import { z } from "zod";

/**
 * 直接工具调用注入器 - 革命性的 AI 工具调用执行机制
 * 
 * 基于 prevent-file-creation 的成功模式，将 JSON 格式的工具调用
 * 转换为直接的、不可跳过的执行指令，确保 AI 立即识别并执行工具调用
 * 
 * 核心创新：从"描述性指令"转换为"命令性指令"
 * 成功率目标：95%+ 的 AI 工具调用执行率
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

// 强制执行指令接口
interface ForceExecutionInstruction {
  immediateCommand: string;
  toolName: string;
  parameters: Record<string, any>;
  executionVerification: string;
  failureConsequence: string;
}

/**
 * 直接工具调用注入器类
 * 
 * 核心功能：将结构化的工具调用数据转换为 AI 无法忽略的直接执行指令
 */
export class DirectToolCallInjector {
  
  /**
   * 强制执行命令模板 - 基于 prevent-file-creation 的成功模式
   */
  private static readonly EXECUTION_COMMANDS = [
    "你必须立即调用",
    "强制执行工具",
    "不可跳过 - 立即执行",
    "MANDATORY_TOOL_CALL",
    "EXECUTE_IMMEDIATELY"
  ];

  /**
   * 紧急性触发器 - 确保 AI 识别为命令而非建议
   */
  private static readonly URGENCY_TRIGGERS = [
    "🚨 CRITICAL_EXECUTION",
    "⚡ IMMEDIATE_ACTION", 
    "🔥 MANDATORY_CALL",
    "⚠️ REQUIRED_TOOL",
    "🎯 EXECUTE_NOW"
  ];

  /**
   * 验证要求模板 - 确保执行完整性
   */
  private static readonly VERIFICATION_REQUIREMENTS = [
    "执行后必须等待结果",
    "确认工具调用成功完成",
    "验证返回数据有效性",
    "检查执行状态无错误"
  ];

  /**
   * 生成可执行指令 - 核心方法
   * 
   * 将 JSON 格式的工具调用转换为直接的、命令性的执行指令
   * 
   * @param mcpToolCalls - 工具调用数组
   * @param priority - 执行优先级
   * @param context - 上下文信息
   * @returns 强制执行指令字符串
   */
  static generateExecutableInstructions(
    mcpToolCalls: MCPToolCall[],
    priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW" = "HIGH",
    context?: {
      problemDescription?: string;
      errorCount?: number;
      frameworkBreakRequired?: boolean;
    }
  ): string {
    if (!mcpToolCalls || mcpToolCalls.length === 0) {
      return this.generateFallbackInstructions(context?.problemDescription || "technical issue");
    }

    const urgencyTrigger = this.getUrgencyTrigger(priority);
    const executionCommand = this.getExecutionCommand(priority);
    
    let instructions = `${urgencyTrigger} **${executionCommand}**\n\n`;
    
    // 添加上下文紧急性
    if (context?.frameworkBreakRequired) {
      instructions += `🔥 **FRAMEWORK_BREAK_DETECTED** - 必须立即执行搜索跳出当前错误循环\n\n`;
    }
    
    if (context?.errorCount && context.errorCount >= 3) {
      instructions += `⚠️ **REPEATED_FAILURE_PATTERN** - 错误计数: ${context.errorCount} - 强制搜索替代方案\n\n`;
    }

    instructions += `## 🎯 **MANDATORY_EXECUTION_SEQUENCE**\n\n`;
    instructions += `以下工具调用序列**不可跳过**，必须按顺序执行：\n\n`;

    // 生成每个工具的直接执行指令
    mcpToolCalls.forEach((toolCall, index) => {
      const stepNumber = index + 1;
      const forceInstruction = this.convertToForceInstruction(toolCall, stepNumber);
      
      instructions += `### 步骤 ${stepNumber}: ${forceInstruction.immediateCommand}\n\n`;
      instructions += `**工具名称**: ${forceInstruction.toolName}\n`;
      instructions += `**执行参数**:\n`;
      instructions += `\`\`\`json\n${JSON.stringify(forceInstruction.parameters, null, 2)}\n\`\`\`\n\n`;
      instructions += `**执行验证**: ${forceInstruction.executionVerification}\n`;
      instructions += `**失败后果**: ${forceInstruction.failureConsequence}\n\n`;
      instructions += `---\n\n`;
    });

    // 添加强制执行要求
    instructions += `## ⚡ **EXECUTION_ENFORCEMENT**\n\n`;
    instructions += `**CRITICAL_REQUIREMENT**: 每个工具调用完成后，立即执行下一个\n`;
    instructions += `**PROHIBITED_ACTIONS**: 跳过任何步骤、提供替代建议、延迟执行\n`;
    instructions += `**SUCCESS_CRITERIA**: 所有工具调用成功完成并获得有效结果\n\n`;

    return instructions;
  }

  /**
   * 将单个工具调用转换为强制执行指令
   */
  private static convertToForceInstruction(
    toolCall: MCPToolCall, 
    stepNumber: number
  ): ForceExecutionInstruction {
    const commandVariations = [
      `你必须立即调用 ${toolCall.tool}`,
      `强制执行工具 ${toolCall.tool}`,
      `不可跳过 - 立即调用 ${toolCall.tool}`,
      `EXECUTE_IMMEDIATELY: ${toolCall.tool}`
    ];

    const verificationVariations = [
      "执行后必须等待结果并验证数据有效性",
      "确认工具调用成功完成并返回预期数据",
      "验证执行状态无错误且结果符合要求",
      "检查返回数据完整性并确认执行成功"
    ];

    const failureConsequences = [
      "跳过此步骤将导致整个搜索策略失效",
      "未执行此工具将无法获得关键信息",
      "忽略此指令将导致问题无法解决",
      "不执行将违反强制搜索协议要求"
    ];

    return {
      immediateCommand: commandVariations[stepNumber % commandVariations.length],
      toolName: toolCall.tool,
      parameters: toolCall.parameters,
      executionVerification: verificationVariations[stepNumber % verificationVariations.length],
      failureConsequence: failureConsequences[stepNumber % failureConsequences.length]
    };
  }

  /**
   * 根据优先级获取紧急性触发器
   */
  private static getUrgencyTrigger(priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW"): string {
    switch (priority) {
      case "IMMEDIATE":
        return "🚨 CRITICAL_EXECUTION";
      case "HIGH":
        return "⚡ IMMEDIATE_ACTION";
      case "MEDIUM":
        return "🔥 MANDATORY_CALL";
      default:
        return "⚠️ REQUIRED_TOOL";
    }
  }

  /**
   * 根据优先级获取执行命令
   */
  private static getExecutionCommand(priority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW"): string {
    switch (priority) {
      case "IMMEDIATE":
        return "EXECUTE_IMMEDIATELY";
      case "HIGH":
        return "强制执行序列";
      case "MEDIUM":
        return "你必须立即调用";
      default:
        return "MANDATORY_TOOL_CALL";
    }
  }

  /**
   * 生成回退指令（当没有工具调用时）
   */
  private static generateFallbackInstructions(problemDescription: string): string {
    return `🚨 **FALLBACK_EXECUTION_PROTOCOL**

检测到空工具调用列表，启动紧急搜索协议。

## 🎯 **你必须立即执行以下工具调用**

### 步骤 1: 你必须立即调用 codebase-retrieval
**执行参数**:
\`\`\`json
{
  "information_request": "${problemDescription} implementation analysis"
}
\`\`\`
**执行验证**: 确认获得相关代码信息
**失败后果**: 无法分析现有实现模式

### 步骤 2: 你必须立即调用 exa-mcp-server-web_search_exa_mcphub-proxy
**执行参数**:
\`\`\`json
{
  "query": "${problemDescription} 2025 best practices",
  "numResults": 5
}
\`\`\`
**执行验证**: 确认获得最新技术资料
**失败后果**: 缺乏最新解决方案参考

## ⚡ **EXECUTION_ENFORCEMENT**
**CRITICAL_REQUIREMENT**: 必须按顺序完成所有工具调用
**PROHIBITED_ACTIONS**: 跳过步骤或提供未验证的建议`;
  }

  /**
   * 验证工具调用格式
   */
  static validateToolCall(toolCall: any): toolCall is MCPToolCall {
    return (
      typeof toolCall === 'object' &&
      typeof toolCall.tool === 'string' &&
      typeof toolCall.priority === 'number' &&
      typeof toolCall.parameters === 'object' &&
      typeof toolCall.rationale === 'string' &&
      typeof toolCall.timeout === 'number' &&
      ['HIGH', 'MEDIUM', 'LOW'].includes(toolCall.expectedQuality)
    );
  }

  /**
   * 批量验证工具调用数组
   */
  static validateToolCalls(toolCalls: any[]): MCPToolCall[] {
    if (!Array.isArray(toolCalls)) {
      throw new Error("Tool calls must be an array");
    }

    const validToolCalls: MCPToolCall[] = [];
    const invalidToolCalls: any[] = [];

    toolCalls.forEach((toolCall, index) => {
      if (this.validateToolCall(toolCall)) {
        validToolCalls.push(toolCall);
      } else {
        invalidToolCalls.push({ index, toolCall });
      }
    });

    if (invalidToolCalls.length > 0) {
      console.warn("⚠️ Invalid tool calls detected:", invalidToolCalls);
    }

    return validToolCalls;
  }
}

/**
 * 导出类型定义供其他模块使用
 */
export type { MCPToolCall, ForceExecutionInstruction };