import { z } from "zod";
import {
  getAllTasks,
  clearAllTasks as modelClearAllTasks,
} from "../../models/taskModel.js";
import { getClearAllTasksPrompt } from "../../prompts/index.js";

// 清除所有任務工具
// Clear all tasks tool
export const clearAllTasksSchema = z.object({
  confirm: z
    .boolean()
    .refine((val) => val === true, {
      message:
        "必須明確確認清除操作，請將 confirm 參數設置為 true 以確認此危險操作",
    })
    .describe("確認刪除所有未完成的任務（此操作不可逆）"),
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure task data isolation and prevent concurrent conflicts. EXAMPLE: 'my-web-app', 'backend-service', 'mobile-client'. This parameter is mandatory in both MCPHub gateway mode and single IDE mode.",
    })
    .describe("REQUIRED - Target project name for clearing tasks. MANDATORY for multi-agent concurrent safety. Ensures tasks are cleared from correct project context and prevents data conflicts between different agents. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
});

export async function clearAllTasks({
  confirm,
  project,
}: z.infer<typeof clearAllTasksSchema>) {
  // 安全檢查：如果沒有確認，則拒絕操作
  // Safety check: refuse operation if not confirmed
  if (!confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text: await getClearAllTasksPrompt({ confirm: false }),
        },
      ],
    };
  }


  // 檢查是否真的有任務需要清除
  // Check if there are actually tasks that need to be cleared
  const allTasks = await getAllTasks(project);
  if (allTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: await getClearAllTasksPrompt({ isEmpty: true }),
        },
      ],
    };
  }

  // 執行清除操作
  // Execute clear operation
  const result = await modelClearAllTasks(project);

  return {
    content: [
      {
        type: "text" as const,
        text: await getClearAllTasksPrompt({
          success: result.success,
          message: result.message,
          backupFile: result.backupFile,
        }),
      },
    ],
    isError: !result.success,
  };
}
