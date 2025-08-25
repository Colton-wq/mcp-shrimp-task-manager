import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskStatus,
  updateTaskSummary,
  getAllTasks,
} from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getVerifyTaskPrompt, analyzeTaskDeviation } from "../../prompts/index.js";
import {
  createSuccessResponse,
  createNotFoundError,
  createValidationError,
  createInternalError,
  createStatusResponse,
  createWorkflowResponse,
} from "../../utils/mcpResponse.js";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";

/**
 * 验证反馈数据
 * Verification feedback data
 */
interface VerificationFeedback {
  taskId: string;
  taskType: string;
  score: number;
  issues: string[];
  successFactors: string[];
  timestamp: string;
  projectContext: string;
}

/**
 * 验证反馈学习系统
 * Verification feedback learning system
 */
class VerificationFeedbackLearner {
  private static feedbackHistory: VerificationFeedback[] = [];

  /**
   * 记录验证反馈
   * Record verification feedback
   */
  static recordFeedback(task: Task, score: number, summary: string, projectContext: string): void {
    const feedback: VerificationFeedback = {
      taskId: task.id,
      taskType: this.classifyTaskType(task),
      score,
      issues: score < 80 ? this.extractIssues(summary) : [],
      successFactors: score >= 80 ? this.extractSuccessFactors(summary) : [],
      timestamp: new Date().toISOString(),
      projectContext
    };

    this.feedbackHistory.push(feedback);

    // 保持历史记录在合理范围内
    if (this.feedbackHistory.length > 100) {
      this.feedbackHistory = this.feedbackHistory.slice(-100);
    }
  }

  /**
   * 分析项目的验证模式
   * Analyze verification patterns for project
   */
  static analyzeProjectPatterns(projectContext: string): {
    commonIssues: string[];
    successPatterns: string[];
    averageScore: number;
    recommendations: string[];
  } {
    const projectFeedback = this.feedbackHistory.filter(f => f.projectContext === projectContext);

    if (projectFeedback.length === 0) {
      return {
        commonIssues: [],
        successPatterns: [],
        averageScore: 0,
        recommendations: ['No historical data available for this project']
      };
    }

    const allIssues = projectFeedback.flatMap(f => f.issues);
    const allSuccessFactors = projectFeedback.flatMap(f => f.successFactors);
    const averageScore = projectFeedback.reduce((sum, f) => sum + f.score, 0) / projectFeedback.length;

    // 统计常见问题
    const issueFrequency = this.countFrequency(allIssues);
    const commonIssues = Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);

    // 统计成功模式
    const successFrequency = this.countFrequency(allSuccessFactors);
    const successPatterns = Object.entries(successFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pattern]) => pattern);

    // 生成建议
    const recommendations = this.generateRecommendations(commonIssues, successPatterns, averageScore);

    return {
      commonIssues,
      successPatterns,
      averageScore: Math.round(averageScore * 10) / 10,
      recommendations
    };
  }

  /**
   * 为后续任务生成改进建议
   * Generate improvement suggestions for subsequent tasks
   */
  static generateTaskImprovementSuggestions(
    upcomingTasks: Task[],
    projectContext: string
  ): Map<string, string[]> {
    const patterns = this.analyzeProjectPatterns(projectContext);
    const suggestions = new Map<string, string[]>();

    upcomingTasks.forEach(task => {
      const taskType = this.classifyTaskType(task);
      const taskSuggestions: string[] = [];

      // 基于常见问题的预防建议
      patterns.commonIssues.forEach(issue => {
        if (issue.includes('test') || issue.includes('验证')) {
          taskSuggestions.push('Ensure comprehensive testing before verification');
        }
        if (issue.includes('documentation') || issue.includes('文档')) {
          taskSuggestions.push('Include proper documentation and comments');
        }
        if (issue.includes('error handling') || issue.includes('错误处理')) {
          taskSuggestions.push('Implement robust error handling mechanisms');
        }
      });

      // 基于成功模式的建议
      patterns.successPatterns.forEach(pattern => {
        if (pattern.includes('incremental') || pattern.includes('渐进')) {
          taskSuggestions.push('Consider incremental implementation approach');
        }
        if (pattern.includes('code review') || pattern.includes('代码审查')) {
          taskSuggestions.push('Conduct thorough code review before completion');
        }
      });

      // 基于任务类型的特定建议
      if (taskType.includes('integration')) {
        taskSuggestions.push('Pay special attention to API compatibility and data flow');
      }
      if (taskType.includes('performance')) {
        taskSuggestions.push('Include performance benchmarks and monitoring');
      }

      if (taskSuggestions.length > 0) {
        suggestions.set(task.id, [...new Set(taskSuggestions)]);
      }
    });

    return suggestions;
  }

  /**
   * 分类任务类型
   * Classify task type
   */
  private static classifyTaskType(task: Task): string {
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();

    if (text.includes('test') || text.includes('验证')) return 'testing';
    if (text.includes('integrate') || text.includes('集成')) return 'integration';
    if (text.includes('performance') || text.includes('性能')) return 'performance';
    if (text.includes('refactor') || text.includes('重构')) return 'refactoring';
    if (text.includes('implement') || text.includes('实现')) return 'implementation';
    if (text.includes('fix') || text.includes('修复')) return 'bugfix';

    return 'general';
  }

  /**
   * 从摘要中提取问题
   * Extract issues from summary
   */
  private static extractIssues(summary: string): string[] {
    const issues: string[] = [];
    const text = summary.toLowerCase();

    if (text.includes('test') && (text.includes('missing') || text.includes('缺少'))) {
      issues.push('Missing or insufficient testing');
    }
    if (text.includes('error') && text.includes('handling')) {
      issues.push('Inadequate error handling');
    }
    if (text.includes('documentation') || text.includes('文档')) {
      issues.push('Documentation issues');
    }
    if (text.includes('performance') || text.includes('性能')) {
      issues.push('Performance concerns');
    }
    if (text.includes('security') || text.includes('安全')) {
      issues.push('Security vulnerabilities');
    }

    return issues;
  }

  /**
   * 从摘要中提取成功因素
   * Extract success factors from summary
   */
  private static extractSuccessFactors(summary: string): string[] {
    const factors: string[] = [];
    const text = summary.toLowerCase();

    if (text.includes('comprehensive') || text.includes('全面')) {
      factors.push('Comprehensive implementation');
    }
    if (text.includes('incremental') || text.includes('渐进')) {
      factors.push('Incremental development approach');
    }
    if (text.includes('well-tested') || text.includes('充分测试')) {
      factors.push('Thorough testing');
    }
    if (text.includes('documented') || text.includes('文档完善')) {
      factors.push('Good documentation');
    }
    if (text.includes('code review') || text.includes('代码审查')) {
      factors.push('Code review process');
    }

    return factors;
  }

  /**
   * 统计频率
   * Count frequency
   */
  private static countFrequency(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * 生成建议
   * Generate recommendations
   */
  private static generateRecommendations(
    commonIssues: string[],
    successPatterns: string[],
    averageScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageScore < 70) {
      recommendations.push('Focus on improving task quality before verification');
      recommendations.push('Consider breaking down complex tasks into smaller subtasks');
    }

    if (commonIssues.length > 0) {
      recommendations.push(`Address common issues: ${commonIssues.slice(0, 2).join(', ')}`);
    }

    if (successPatterns.length > 0) {
      recommendations.push(`Leverage successful patterns: ${successPatterns.slice(0, 2).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue following current development practices');
    }

    return recommendations;
  }
}

// 檢驗任務工具
// Task verification tool
export const verifyTaskSchema = z.object({
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure task data isolation and prevent concurrent conflicts. EXAMPLE: 'my-web-app', 'backend-service', 'mobile-client'. This parameter is mandatory in both MCPHub gateway mode and single IDE mode.",
    })
    .describe("REQUIRED - Target project context for task verification. MANDATORY for multi-agent concurrent safety. Ensures task is verified in correct project context and prevents data conflicts between different agents. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Must be a valid UUID v4 format (8-4-4-4-12 hexadecimal digits). EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. Use list_tasks or query_task to find valid task IDs. COMMON ISSUE: Ensure no extra spaces or characters around the UUID.",
    })
    .describe("Unique identifier of the task to verify and potentially complete. MUST BE: valid UUID v4 format from existing task in system. HOW TO GET: use list_tasks to see all tasks, or query_task to search by name/description. EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. VALIDATION: 8-4-4-4-12 hexadecimal pattern."),
  summary: z
    .string()
    .min(30, {
      message: "Summary must be at least 30 characters. FOR SCORE ≥80: Provide task completion summary with implementation results and key decisions. FOR SCORE <80: List specific issues and correction suggestions. EXAMPLE (completion): 'Successfully implemented JWT authentication with bcrypt password hashing, Redis session storage, and comprehensive error handling.' EXAMPLE (issues): 'Missing input validation on user registration endpoint, password strength requirements not implemented, error messages expose sensitive information.'",
    })
    .describe("Task verification summary based on score. MINIMUM 30 characters. " +
      "IF SCORE ≥80: Provide completion summary describing implementation results, key decisions, and achievements. " +
      "IF SCORE <80: List specific issues, missing requirements, and correction suggestions. " +
      "PURPOSE: Document verification outcome and guide next steps."),
  score: z
    .number()
    .min(0, { message: "分數不能小於0" })
    // .min(0, { message: "Score cannot be less than 0" })
    .max(100, { message: "分數不能大於100" })
    // .max(100, { message: "Score cannot be greater than 100" })
    .describe("針對任務的評分，當評分等於或超過80分時自動完成任務"),
    // .describe("Score for the task, automatically completes task when score equals or exceeds 80")
});

export async function verifyTask({
  taskId,
  summary,
  score,
  project,
}: z.infer<typeof verifyTaskSchema>) {
  const { ProjectSession } = await import("../../utils/projectSession.js");
  
  return await ProjectSession.withProjectContext(project, async () => {
    const task = await getTaskById(taskId, project);

  if (!task) {
    return createNotFoundError(
      "Task",
      taskId,
      "Use list_tasks to see all available tasks, or query_task to search by name/description"
    );
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    return createValidationError(
      "task status",
      task.status,
      "Task must be in IN_PROGRESS status to be verified",
      "Use execute_task to start the task first, then verify when implementation is complete"
    );
  }

  // 状态跟踪：开始验证
  const verificationStarted = createStatusResponse(
    "Task Verification",
    "started",
    `Verifying task "${task.name}" with score ${score}`
  );

  // 记录验证反馈用于学习
  // Record verification feedback for learning
  VerificationFeedbackLearner.recordFeedback(task, score, summary, project);

  if (score >= 80) {
    await updateTaskSummary(taskId, summary, project);
    await updateTaskStatus(taskId, TaskStatus.COMPLETED, project);

    // 状态跟踪：任务完成
    const completionStatus = createStatusResponse(
      "Task Completion",
      "completed",
      `Task "${task.name}" successfully completed with score ${score}/100`,
      100
    );
  }

  // 获取项目验证模式分析
  // Get project verification pattern analysis
  const projectPatterns = VerificationFeedbackLearner.analyzeProjectPatterns(project);

  // 获取所有未完成任务以生成改进建议
  // Get all incomplete tasks to generate improvement suggestions
  const allTasks = await getAllTasks(project);
  const upcomingTasks = allTasks.filter(t =>
    t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
  );
  const improvementSuggestions = VerificationFeedbackLearner.generateTaskImprovementSuggestions(
    upcomingTasks,
    project
  );

  // 执行偏离检测分析
  // Perform deviation detection analysis
  const deviationAnalysis = analyzeTaskDeviation(task, summary);

  // 查找或创建工作流上下文
  let workflow = SimpleWorkflowManager.findWorkflowByTaskId(taskId);
  if (!workflow) {
    // 创建标准的任务验证工作流
    workflow = SimpleWorkflowManager.createWorkflow(
      taskId,
      project,
      ["verify_task", "mandatory_code_review", "execute_task"]
    );
  }

  // 更新verify_task步骤状态
  const verifyStepIndex = workflow.steps.findIndex(s => s.tool === "verify_task");
  if (verifyStepIndex >= 0) {
    SimpleWorkflowManager.updateStepStatus(
      workflow.workflowId,
      verifyStepIndex,
      WorkflowStatus.COMPLETED,
      { score, summary, deviationAnalysis }
    );
  }

  // 生成工作流继续指导
  const workflowContinuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);

  // 生成增强的验证提示词，包含学习反馈和偏离分析
  // Generate enhanced verification prompt with learning feedback and deviation analysis
  const prompt = await getVerifyTaskPrompt({
    task,
    score,
    summary,
    projectPatterns,
    improvementSuggestions: Array.from(improvementSuggestions.entries()).slice(0, 3), // 限制建议数量
    deviationAnalysis
  });

  // 使用工作流感知的响应格式
  return createWorkflowResponse(prompt, workflowContinuation);
  }); // 结束 withProjectContext
}
