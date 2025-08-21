/**
 * 质量改进决策树工具 - 基于MCP 2025标准
 * Quality Improvement Decision Tree Tool - Based on MCP 2025 Standards
 * 
 * 防止AI盲目重构，确保质量改进的合理性和安全性
 * Prevent AI blind refactoring, ensure rationality and safety of quality improvements
 */

import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import { getTaskById } from "../../models/taskModel.js";
import { Task } from "../../types/index.js";
import {
  createSuccessResponse,
  createNotFoundError,
  createValidationError,
  createWorkflowResponse,
} from "../../utils/mcpResponse.js";
import { ConversationPatternDetector } from "../intervention/conversationPatternDetector.js";

// 问题分类枚举
export enum ProblemType {
  REAL_ISSUE = "REAL_ISSUE",           // 真实的质量问题
  TOOL_ARTIFACT = "TOOL_ARTIFACT",     // 工具误报
  ACCEPTABLE_COMPLEXITY = "ACCEPTABLE_COMPLEXITY", // 可接受的复杂度
  BUSINESS_LOGIC = "BUSINESS_LOGIC"    // 业务逻辑必要复杂度
}

// 功能影响评估
export enum FunctionalImpact {
  NONE = "NONE",           // 无影响
  LOW = "LOW",             // 低影响
  HIGH = "HIGH",           // 高影响
  BREAKING = "BREAKING"    // 破坏性影响
}

// 改进必要性
export enum ImprovementNecessity {
  CRITICAL = "CRITICAL",     // 关键必须
  BENEFICIAL = "BENEFICIAL", // 有益的
  OPTIONAL = "OPTIONAL",     // 可选的
  UNNECESSARY = "UNNECESSARY" // 不必要的
}

// 改进策略
export enum ImprovementStrategy {
  IMMEDIATE_FIX = "IMMEDIATE_FIX",       // 立即修复
  GRADUAL_REFACTOR = "GRADUAL_REFACTOR", // 渐进重构
  MONITOR_ONLY = "MONITOR_ONLY",         // 仅监控
  NO_ACTION = "NO_ACTION"                // 无需行动
}

// 质量改进决策接口
export interface QualityImprovementDecision {
  problemType: ProblemType;
  functionalImpact: FunctionalImpact;
  improvementNecessity: ImprovementNecessity;
  strategy: ImprovementStrategy;
  reasoning: string;
  riskAssessment: string;
  recommendedActions: string[];
  preventiveConstraints: string[];
}

// 工具参数schema
export const qualityImprovementDecisionTreeSchema = z.object({
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure data isolation and prevent concurrent conflicts.",
    })
    .describe("REQUIRED - Target project context for quality improvement decision. MANDATORY for multi-agent concurrent safety. Ensures decisions are made in correct project context and prevents data conflicts between different agents. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Must be a valid UUID v4 format (8-4-4-4-12 hexadecimal digits). EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. Use list_tasks or query_task to find valid task IDs.",
    })
    .describe("Unique identifier of the task requiring quality improvement decision. MUST BE: valid UUID v4 format from existing task in system. HOW TO GET: use list_tasks to see all tasks, or query_task to search by name/description. EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. VALIDATION: 8-4-4-4-12 hexadecimal pattern."),
  qualityIssueDescription: z
    .string()
    .min(10, {
      message: "Quality issue description must be at least 10 characters long. Please provide specific details about the quality concern.",
    })
    .describe("Detailed description of the quality issue or concern. MUST INCLUDE: specific problem details, affected code areas, current impact, and why improvement is being considered. EXAMPLE: 'Function calculateComplexity has cyclomatic complexity of 15, exceeding threshold of 10. Located in src/analyzer.ts lines 45-120.'"),
  currentQualityScore: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe("Current quality score from code analysis tools (0-100). If provided, helps assess the severity of quality issues. EXAMPLE: 56 indicates moderate quality concerns."),
  proposedSolution: z
    .string()
    .min(20, {
      message: "Proposed solution must be at least 20 characters long. Please provide specific improvement approach.",
    })
    .describe("Detailed description of the proposed quality improvement solution. MUST INCLUDE: specific changes planned, implementation approach, expected benefits, and potential risks. EXAMPLE: 'Split calculateComplexity function into smaller helper functions: extractMetrics(), analyzePatterns(), and generateReport().'"),
  conversationContext: z
    .string()
    .optional()
    .describe("Optional conversation context to analyze AI behavior patterns and detect potential cheating behaviors. Helps identify if the improvement request is driven by score optimization rather than genuine quality concerns."),
});

/**
 * 质量改进决策树工具主函数
 * Quality Improvement Decision Tree Tool Main Function
 */
export async function qualityImprovementDecisionTree({
  project,
  taskId,
  qualityIssueDescription,
  currentQualityScore,
  proposedSolution,
  conversationContext,
}: z.infer<typeof qualityImprovementDecisionTreeSchema>) {
  const { ProjectSession } = await import("../../utils/projectSession.js");

  return await ProjectSession.withProjectContext(project, async () => {
    try {
      // 获取任务信息
      const task = await getTaskById(taskId, project);
      if (!task) {
        return createNotFoundError(
          "Task",
          taskId,
          "Use list_tasks to see all available tasks, or query_task to search by name/description"
        );
      }

      // 🛡️ AI行为约束检查
      if (conversationContext) {
        const behaviorAnalysis = ConversationPatternDetector.detectCodeQualityCheatingBehavior(
          conversationContext
        );

        if (behaviorAnalysis.preventionRequired) {
          return createWorkflowResponse(
            `🚨 **AI行为约束警告**

检测到代码质量作弊行为模式：
${behaviorAnalysis.detectedCheatingPatterns.map(pattern => `• ${pattern}`).join('\n')}

**决策结果**: 🚫 **禁止进行质量改进**

**原因**: 改进动机可能是分数优化而非真实质量提升

**建议行动**:
1. 重新评估质量问题的真实性
2. 确认改进是否真的有必要
3. 专注于功能完整性而非分数指标
4. 如确实需要改进，请重新描述具体的质量问题`,
            {
              shouldProceed: true,
              nextTool: "analyze_task",
              nextToolParams: { taskId, summary: "重新分析任务，确认真实的质量改进需求" },
              reason: "AI行为约束：防止分数导向的虚假改进"
            }
          );
        }
      }

      // 简化的决策逻辑 - 基于现有框架
      const decision = analyzeQualityImprovement(
        qualityIssueDescription,
        proposedSolution,
        currentQualityScore,
        task
      );

      // 生成响应消息
      const responseMessage = generateDecisionResponse(decision, qualityIssueDescription, currentQualityScore);

      // 根据策略确定下一步工作流
      let workflowContinuation;
      if (decision.strategy === ImprovementStrategy.NO_ACTION) {
        workflowContinuation = {
          shouldProceed: true,
          nextTool: "list_tasks",
          nextToolParams: { project, status: "pending" },
          reason: "质量改进不必要，继续其他任务"
        };
      } else if (decision.strategy === ImprovementStrategy.MONITOR_ONLY) {
        workflowContinuation = {
          shouldProceed: true,
          nextTool: "verify_task",
          nextToolParams: { project, taskId, summary: "质量监控：当前代码质量可接受", score: 80 },
          reason: "质量改进风险过高，仅监控"
        };
      } else {
        workflowContinuation = {
          shouldProceed: true,
          nextTool: "plan_task",
          nextToolParams: {
            project,
            description: `安全质量改进计划：${qualityIssueDescription}`,
            requirements: `遵循${decision.strategy}策略，确保功能完整性优先`
          },
          reason: "制定安全的质量改进计划"
        };
      }

      return createWorkflowResponse(responseMessage, workflowContinuation);

    } catch (error) {
      console.error("Quality improvement decision tree error:", error);
      return createValidationError(
        "qualityImprovementDecision",
        error instanceof Error ? error.message : "Unknown error occurred",
        "Failed to analyze quality improvement decision"
      );
    }
  });
}

/**
 * 分析质量改进决策
 * Analyze quality improvement decision
 */
function analyzeQualityImprovement(
  description: string,
  proposedSolution: string,
  currentScore?: number,
  task?: Task
): QualityImprovementDecision {
  // 简化的决策逻辑
  let problemType = ProblemType.REAL_ISSUE;
  let functionalImpact = FunctionalImpact.LOW;
  let improvementNecessity = ImprovementNecessity.BENEFICIAL;
  let strategy = ImprovementStrategy.GRADUAL_REFACTOR;

  // 检查是否为工具误报
  if (description.includes("工具误报") || description.includes("false positive")) {
    problemType = ProblemType.TOOL_ARTIFACT;
    improvementNecessity = ImprovementNecessity.UNNECESSARY;
    strategy = ImprovementStrategy.NO_ACTION;
  }

  // 检查分数是否可接受
  if (currentScore && currentScore >= 70) {
    problemType = ProblemType.ACCEPTABLE_COMPLEXITY;
    improvementNecessity = ImprovementNecessity.OPTIONAL;
    strategy = ImprovementStrategy.MONITOR_ONLY;
  }

  // 检查是否涉及核心功能
  if (proposedSolution.includes("核心") || proposedSolution.includes("core") || 
      proposedSolution.includes("主要") || proposedSolution.includes("main")) {
    functionalImpact = FunctionalImpact.HIGH;
    strategy = ImprovementStrategy.MONITOR_ONLY;
  }

  const decision: QualityImprovementDecision = {
    problemType,
    functionalImpact,
    improvementNecessity,
    strategy,
    reasoning: generateReasoning(problemType, functionalImpact, improvementNecessity),
    riskAssessment: generateRiskAssessment(functionalImpact, strategy),
    recommendedActions: generateRecommendations(strategy),
    preventiveConstraints: generateConstraints(strategy, functionalImpact),
  };

  return decision;
}

/**
 * 生成决策推理
 */
function generateReasoning(
  problemType: ProblemType,
  functionalImpact: FunctionalImpact,
  improvementNecessity: ImprovementNecessity
): string {
  return `问题类型: ${problemType}, 功能影响: ${functionalImpact}, 改进必要性: ${improvementNecessity}`;
}

/**
 * 生成风险评估
 */
function generateRiskAssessment(
  functionalImpact: FunctionalImpact,
  strategy: ImprovementStrategy
): string {
  if (functionalImpact === FunctionalImpact.HIGH || strategy === ImprovementStrategy.NO_ACTION) {
    return "🔴 高风险 - 需要谨慎处理";
  } else if (functionalImpact === FunctionalImpact.LOW) {
    return "🟡 中风险 - 需要适当验证";
  } else {
    return "🟢 低风险 - 相对安全";
  }
}

/**
 * 生成推荐行动
 */
function generateRecommendations(strategy: ImprovementStrategy): string[] {
  switch (strategy) {
    case ImprovementStrategy.IMMEDIATE_FIX:
      return ["✅ 立即进行安全修复", "🧪 修复前编写测试用例"];
    case ImprovementStrategy.GRADUAL_REFACTOR:
      return ["📈 制定渐进式重构计划", "🔄 小步快跑，每步验证"];
    case ImprovementStrategy.MONITOR_ONLY:
      return ["👀 持续监控质量指标", "⚠️ 避免不必要的代码变更"];
    case ImprovementStrategy.NO_ACTION:
      return ["🚫 无需进行代码改进", "✅ 当前代码质量可接受"];
    default:
      return ["📋 制定具体改进计划"];
  }
}

/**
 * 生成预防性约束
 */
function generateConstraints(
  strategy: ImprovementStrategy,
  functionalImpact: FunctionalImpact
): string[] {
  const constraints = [
    "🛡️ 禁止为了提升分数而修改代码",
    "🧪 任何改进都必须有对应的测试验证"
  ];

  if (functionalImpact === FunctionalImpact.HIGH) {
    constraints.push("⚠️ 高风险改进需要额外的安全验证");
  }

  if (strategy === ImprovementStrategy.NO_ACTION) {
    constraints.push("🚫 严格禁止进行任何代码修改");
  }

  return constraints;
}

/**
 * 生成决策响应消息
 */
function generateDecisionResponse(
  decision: QualityImprovementDecision,
  issueDescription: string,
  currentScore?: number
): string {
  return `# 🎯 质量改进决策分析

## 📋 问题描述
${issueDescription}

${currentScore ? `## 📊 当前质量分数\n${currentScore}/100\n` : ''}

## 🔍 决策分析结果

### 问题分类: ${decision.problemType}
### 功能影响: ${decision.functionalImpact}
### 改进必要性: ${decision.improvementNecessity}

## 🎯 推荐策略: ${decision.strategy}

## 💭 决策推理
${decision.reasoning}

## ⚠️ 风险评估
${decision.riskAssessment}

## ✅ 推荐行动
${decision.recommendedActions.map(action => `• ${action}`).join('\n')}

## 🛡️ 预防性约束
${decision.preventiveConstraints.map(constraint => `• ${constraint}`).join('\n')}

---

**⚡ 核心原则**: 功能完整性 > 质量分数，真实改进 > 表面优化`;
}