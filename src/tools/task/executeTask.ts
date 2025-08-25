import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskStatus,
  canExecuteTask,
  assessTaskComplexity,
} from "../../models/taskModel.js";
import { TaskStatus, Task, TaskComplexityLevel, TaskComplexityAssessment } from "../../types/index.js";
import { getExecuteTaskPrompt } from "../../prompts/index.js";
import { loadTaskRelatedFiles } from "../../utils/fileLoader.js";
import {
  createSuccessResponse,
  createNotFoundError,
  createDependencyError,
  createInternalError,
  createStatusResponse,
  withErrorHandling,
} from "../../utils/mcpResponse.js";
import { ContextDepth } from "../../types/executeTask.js";

// 執行任務工具
// Execute task tool
export const executeTaskSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Must be a valid UUID v4 format (8-4-4-4-12 hexadecimal digits). EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. Use list_tasks or query_task to find valid task IDs. COMMON ISSUE: Ensure no extra spaces or characters around the UUID.",
    })
    .describe("Unique identifier of the task to execute. MUST BE: valid UUID v4 format from existing task in system. HOW TO GET: use list_tasks to see all tasks, or query_task to search by name/description. EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. VALIDATION: 8-4-4-4-12 hexadecimal pattern."),
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure task data isolation and prevent concurrent conflicts. EXAMPLE: 'my-web-app', 'backend-service', 'mobile-client'. This parameter is mandatory in both MCPHub gateway mode and single IDE mode.",
    })
    .describe("REQUIRED - Target project context for task execution. MANDATORY for multi-agent concurrent safety. Ensures task is executed in correct project context and prevents data conflicts between different agents. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
  
  // 🔥 新增：简单的上下文增强参数 - 基于成功模式设计
  // New: Simple context enhancement parameters - based on successful patterns
  enableContextAnalysis: z
    .boolean()
    .optional()
    .default(false)
    .describe("Enable intelligent context analysis for enhanced task execution guidance. DEFAULT: false for backward compatibility. When enabled, provides project-specific insights, workflow stage detection, and quality focus recommendations. USAGE: Set to true when you need context-aware execution guidance."),
  
  contextDepth: z
    .nativeEnum(ContextDepth)
    .optional()
    .default(ContextDepth.BASIC)
    .describe("Depth of context analysis to perform. BASIC: Tech stack detection and project type identification. ENHANCED: Includes workflow stage detection and quality focus prediction. DEFAULT: 'basic'. Only effective when enableContextAnalysis is true."),
  
  workflowHint: z
    .string()
    .optional()
    .describe("Optional workflow hint to assist context analysis. Provide brief context about the current development stage or specific focus area. EXAMPLES: 'Setting up new feature', 'Fixing security issue', 'Performance optimization'. USAGE: Helps improve context analysis accuracy.")
});

export async function executeTask({
  taskId,
  project,
  enableContextAnalysis = false,
  contextDepth = ContextDepth.BASIC,
  workflowHint,
}: z.infer<typeof executeTaskSchema>) {
  try {
    // 使用强制项目参数确保并发安全的项目上下文管理
    // Use mandatory project parameter for concurrent-safe project context management
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

    // 檢查任務是否可以執行（依賴任務都已完成）
    // Check if task can be executed (all dependency tasks are completed)
    const executionCheck = await canExecuteTask(taskId, project);
    if (!executionCheck.canExecute) {
      const blockedBy = executionCheck.blockedBy || [];
      return createDependencyError(taskId, blockedBy);
    }

    // 如果任務已經標記為「進行中」，提示用戶
    // If task is already marked as "in progress", prompt user
    if (task.status === TaskStatus.IN_PROGRESS) {
      return {
        content: [
          {
            type: "text" as const,
            text: `任務 "${task.name}" (ID: \`${taskId}\`) 已經處於進行中狀態。`,
            // Task "${task.name}" (ID: `${taskId}`) is already in progress status.
          },
        ],
      };
    }

    // 如果任務已經標記為「已完成」，提示用戶
    // If task is already marked as "completed", prompt user
    if (task.status === TaskStatus.COMPLETED) {
      return {
        content: [
          {
            type: "text" as const,
            text: `任務 "${task.name}" (ID: \`${taskId}\`) 已經標記為完成。如需重新執行，請先使用 delete_task 刪除該任務並重新創建。`,
            // Task "${task.name}" (ID: `${taskId}`) is already marked as completed. If you need to re-execute, please first use delete_task to delete the task and recreate it.
          },
        ],
      };
    }

    // 更新任務狀態為「進行中」
    // Update task status to "in progress"
    await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS, project);

    // 評估任務複雜度
    // Assess task complexity
    const complexityResult = await assessTaskComplexity(taskId, project);

    // 智能路径建议
    // Smart path recommendations
    const pathRecommendation = generatePathRecommendation(complexityResult, task);

    // 將複雜度結果轉換為適當的格式
    // Convert complexity results to appropriate format
    const complexityAssessment = complexityResult
      ? {
          level: complexityResult.level,
          pathRecommendation,
          metrics: {
            descriptionLength: complexityResult.metrics.descriptionLength,
            dependenciesCount: complexityResult.metrics.dependenciesCount,
          },
          recommendations: complexityResult.recommendations,
        }
      : undefined;

    // 獲取依賴任務，用於顯示完成摘要
    // Get dependency tasks for displaying completion summary
    const dependencyTasks: Task[] = [];
    if (task.dependencies && task.dependencies.length > 0) {
      for (const dep of task.dependencies) {
        const depTask = await getTaskById(dep.taskId, project);
        if (depTask) {
          dependencyTasks.push(depTask);
        }
      }
    }

    // 加載任務相關的文件內容
    // Load task-related file content
    let relatedFilesSummary = "";
    if (task.relatedFiles && task.relatedFiles.length > 0) {
      try {
        const relatedFilesResult = await loadTaskRelatedFiles(
          task.relatedFiles
        );
        relatedFilesSummary =
          typeof relatedFilesResult === "string"
            ? relatedFilesResult
            : relatedFilesResult.summary || "";
      } catch (error) {
        relatedFilesSummary =
          "Error loading related files, please check the files manually.";
      }
    }

    // 使用prompt生成器獲取最終prompt
    // Use prompt generator to get final prompt
    const prompt = await getExecuteTaskPrompt({
      task,
      complexityAssessment,
      relatedFilesSummary,
      dependencyTasks,
      pathRecommendation,
      enableIntelligentAnalysis: true, // 启用智能分析功能
      projectContext: project,
      relatedTasks: dependencyTasks || [],
    });

      return createSuccessResponse(prompt);
    }); // 结束 withProjectContext
  } catch (error) {
    return createInternalError(
      "task execution",
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Generate smart path recommendation based on task complexity
 */
function generatePathRecommendation(
  complexityResult: TaskComplexityAssessment | null,
  task: Task
): string {
  if (!complexityResult) {
    return "📋 **Standard Path Recommended**: Use plan_task → execute_task for structured approach";
  }

  const { level } = complexityResult;
  const isSmartRoutingEnabled = process.env.MCP_ENABLE_SMART_ROUTING === "true";

  if (!isSmartRoutingEnabled) {
    return "";
  }

  switch (level) {
    case TaskComplexityLevel.LOW:
      return `🚀 **Fast Path Detected**: This is a simple task that can be executed directly.
      
**Recommended Approach:**
- ✅ You chose the optimal path by calling execute_task directly
- ⚡ This should save ~60% processing time compared to full analysis cycle
- 🎯 Focus on implementation rather than extensive planning

**Why Fast Path:**
- Low complexity indicators detected
- Straightforward implementation expected
- Minimal dependencies and risks`;

    case TaskComplexityLevel.MEDIUM:
      return `📋 **Standard Path Recommended**: Medium complexity detected.

**Optimal Sequence:**
1. ✅ plan_task → Get structured approach
2. ➡️ execute_task → Implement solution

**Current Status:**
- ⚠️ You called execute_task directly (Fast Path)
- 💡 Consider using plan_task first for better results
- 🔄 You can still proceed, but planning would help

**Why Standard Path:**
- Medium complexity requires structured approach
- Planning reduces implementation risks
- Better task breakdown and dependency management`;

    case TaskComplexityLevel.HIGH:
    case TaskComplexityLevel.VERY_HIGH:
      return `🔬 **Deep Path Strongly Recommended**: High complexity detected.

**Optimal Sequence:**
1. 📋 plan_task → Initial planning and scope
2. 🔍 analyze_task → Deep technical analysis  
3. 🤔 reflect_task → Quality review and optimization
4. ✂️ split_tasks → Break into manageable subtasks
5. ⚡ execute_task → Implement individual tasks

**Current Status:**
- ⚠️ You called execute_task directly (Fast Path)
- 🚨 High risk of incomplete or suboptimal implementation
- 🔄 Strongly consider starting with plan_task

**Why Deep Path:**
- High complexity requires thorough analysis
- Risk of missing critical requirements
- Better quality and maintainability with full cycle`;

    default:
      return "📋 **Standard Path Recommended**: Use plan_task → execute_task for structured approach";
  }
}
