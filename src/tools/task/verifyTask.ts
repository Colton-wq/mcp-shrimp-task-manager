import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  getTaskById,
  updateTaskStatus,
  updateTaskSummary,
} from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getVerifyTaskPrompt } from "../../prompts/index.js";
import {
  createSuccessResponse,
  createNotFoundError,
  createValidationError,
  createInternalError,
  createStatusResponse,
} from "../../utils/mcpResponse.js";

// 檢驗任務工具
// Task verification tool
export const verifyTaskSchema = z.object({
  project: z
    .string()
    .optional()
    .describe("Target project context for task verification. OPTIONAL - defaults to current session project if not specified. USE WHEN: working with multiple projects, need to verify task in specific project context. EXAMPLE: 'my-web-app', 'backend-service'. LEAVE EMPTY: to use current session project."),
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
    const task = await getTaskById(taskId);

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

  if (score >= 80) {
    await updateTaskSummary(taskId, summary);
    await updateTaskStatus(taskId, TaskStatus.COMPLETED);
    
    // 状态跟踪：任务完成
    const completionStatus = createStatusResponse(
      "Task Completion",
      "completed",
      `Task "${task.name}" successfully completed with score ${score}/100`,
      100
    );
  }

  const prompt = await getVerifyTaskPrompt({ task, score, summary });

  return createSuccessResponse(prompt);
  }); // 结束 withProjectContext
}
