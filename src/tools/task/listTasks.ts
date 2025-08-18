import { z } from "zod";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus } from "../../types/index.js";
import { getListTasksPrompt } from "../../prompts/index.js";

export const listTasksSchema = z.object({
  status: z
    .enum(["all", "pending", "in_progress", "completed"])
    .describe("要列出的任務狀態，可選擇 'all' 列出所有任務，或指定具體狀態"),
  project: z.string().optional().describe("指定要讀取的項目（可選），省略則使用目前會話項目"),
});

// 列出任務工具
// List tasks tool
export async function listTasks({ status, project }: z.infer<typeof listTasksSchema>) {
  const { ProjectSession } = await import("../../utils/projectSession.js");

  return await ProjectSession.withProjectContext(project, async () => {
    // 确保使用正确的项目上下文，优先使用传入的项目参数，否则使用当前项目
    // Ensure correct project context, prioritize passed project parameter, otherwise use current project
    const effectiveProject = project || ProjectSession.getCurrentProject();
    const tasks = await getAllTasks(effectiveProject);

    // 验证项目上下文一致性
    // Validate project context consistency
    const { getProjectContextValidation } = await import("../../models/taskModel.js");
    const validation = await getProjectContextValidation(effectiveProject);
  let filteredTasks = tasks;
  switch (status) {
    case "all":
      break;
    case "pending":
      filteredTasks = tasks.filter(
        (task) => task.status === TaskStatus.PENDING
      );
      break;
    case "in_progress":
      filteredTasks = tasks.filter(
        (task) => task.status === TaskStatus.IN_PROGRESS
      );
      break;
    case "completed":
      filteredTasks = tasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      break;
  }

  if (filteredTasks.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 系統通知\n\n目前系統中沒有${
            // ## System Notification\n\nCurrently there are no ${
            status === "all" ? "任何" : `任何 ${status} 的`
            // status === "all" ? "any" : `any ${status}`
          }任務。請查詢其他狀態任務或先使用「split_tasks」工具創建任務結構，再進行後續操作。`,
          // }tasks. Please query other status tasks or first use the "split_tasks" tool to create task structure, then proceed with subsequent operations.
        },
      ],
    };
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // 檢測潛在的專案衝突並準備建議附註
  let suggestionsFooter = "";
  try {
    const { detectProjectConflicts } = await import("../../utils/projectConflictDetector.js");
    const conflict = await detectProjectConflicts(tasks);
    if (conflict.hasConflicts && conflict.recoverySuggestions?.length) {
      const top = conflict.recoverySuggestions
        .slice(0, 2)
        .map(s => s.type)
        .join(" or ");
      suggestionsFooter = `\n\n⚠️ Project conflicts detected. Consider: ${top}`;
    }
  } catch {}

  const prompt = await getListTasksPrompt({
    status,
    tasks: tasksByStatus,
    allTasks: filteredTasks,
  });

  // 添加项目上下文验证警告（如果需要）
  // Add project context validation warning (if needed)
  let contextWarning = "";
  if (!validation.isValid && validation.warning) {
    contextWarning = `\n\n${validation.warning}`;
  }

  // 附加項目元數據，幫助AI識別當前內容所屬項目
  const textWithMeta = ProjectSession.addProjectMetadata(prompt + suggestionsFooter + contextWarning, effectiveProject);

  return {
    content: [
      {
        type: "text" as const,
        text: textWithMeta,
      },
    ],
  };
  });
}
