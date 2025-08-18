import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { getAllTasks } from "../../models/taskModel.js";
import { TaskStatus, Task } from "../../types/index.js";
import { getPlanTaskPrompt } from "../../prompts/index.js";
import { getMemoryDir } from "../../utils/paths.js";

// 開始規劃工具
// Start planning tool
export const planTaskSchema = z.object({
  description: z
    .string()
    .min(10, {
      message: "Task description must be at least 10 characters. Please provide detailed description including: (1) Clear objectives, (2) Background context, (3) Expected outcomes, (4) Technical scope. Example: 'Implement user authentication system with JWT tokens, including login/logout functionality and role-based access control for a React web application.'",
    })
    .describe("Complete detailed task problem description. REQUIRED ELEMENTS: task objectives, background context, expected outcomes, technical scope. MINIMUM 10 characters. EXAMPLE: 'Build REST API for user management with CRUD operations, authentication middleware, and PostgreSQL database integration.'"),
  requirements: z
    .string()
    .optional()
    .describe("Specific technical requirements, business constraints, or quality standards. OPTIONAL but recommended for complex tasks. EXAMPLES: 'Must support 1000+ concurrent users', 'Follow GDPR compliance', 'Use TypeScript with strict mode', 'Implement comprehensive error handling'"),
  existingTasksReference: z
    .boolean()
    .optional()
    .default(false)
    .describe("OPTIONAL - Whether to reference existing tasks for continuity planning. SET TO TRUE when: extending existing features, maintaining consistency with previous work, building upon completed tasks. SET TO FALSE for: new independent projects, fresh starts, unrelated features. DEFAULT: false"),
});

export async function planTask({
  description,
  requirements,
  existingTasksReference = false,
}: z.infer<typeof planTaskSchema>) {
  // 獲取基礎目錄路徑
  // Get base directory path
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const PROJECT_ROOT = path.resolve(__dirname, "../../..");
  const MEMORY_DIR = await getMemoryDir();

  // 準備所需參數
  // Prepare required parameters
  let completedTasks: Task[] = [];
  let pendingTasks: Task[] = [];

  // 當 existingTasksReference 為 true 時，從數據庫中載入所有任務作為參考
  // When existingTasksReference is true, load all tasks from database as reference
  if (existingTasksReference) {
    try {
      const allTasks = await getAllTasks();

      // 將任務分為已完成和未完成兩類
      // Divide tasks into completed and incomplete categories
      completedTasks = allTasks.filter(
        (task) => task.status === TaskStatus.COMPLETED
      );
      pendingTasks = allTasks.filter(
        (task) => task.status !== TaskStatus.COMPLETED
      );
    } catch (error) {}
  }

  // 使用prompt生成器獲取最終prompt
  // Use prompt generator to get the final prompt
  const prompt = await getPlanTaskPrompt({
    description,
    requirements,
    existingTasksReference,
    completedTasks,
    pendingTasks,
    memoryDir: MEMORY_DIR,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
