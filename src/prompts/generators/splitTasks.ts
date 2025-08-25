/**
 * splitTasks prompt 生成器
 * splitTasks prompt generator
 * 負責將模板和參數組合成最終的 prompt
 * Responsible for combining templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * 文档创建任务过滤器
 * Document creation task filter
 * 检测并过滤可能的文档创建任务
 * Detects and filters potential document creation tasks
 */
const DOCUMENT_CREATION_PATTERNS = [
  /documentation/i,
  /readme/i,
  /guide/i,
  /manual/i,
  /\.md$/i,
  /\.txt$/i,
  /create.*document/i,
  /write.*document/i,
  /generate.*document/i,
  /add.*documentation/i,
  /update.*readme/i,
  /create.*guide/i,
  /write.*guide/i,
  // 中文文档相关模式
  /文档/i,
  /指南/i,
  /手册/i,
  /说明/i,
  /教程/i,
  /编写.*文档/i,
  /创建.*文档/i,
  /生成.*文档/i,
  /写.*文档/i,
  /创建.*指南/i,
  /编写.*指南/i,
  /api.*文档/i,
  /使用.*指南/i,
];

/**
 * 检查任务是否为文档创建任务
 * Check if task is a document creation task
 */
function isDocumentCreationTask(task: Task): boolean {
  const textToCheck = `${task.name} ${task.description} ${task.implementationGuide || ''}`.toLowerCase();

  return DOCUMENT_CREATION_PATTERNS.some(pattern => pattern.test(textToCheck));
}

/**
 * splitTasks prompt 參數介面
 * splitTasks prompt parameter interface
 */
export interface SplitTasksPromptParams {
  updateMode: string;
  createdTasks: Task[];
  allTasks: Task[];
}

/**
 * 獲取 splitTasks 的完整 prompt
 * Get the complete splitTasks prompt
 * @param params prompt 參數
 * @param params prompt parameters
 * @returns 生成的 prompt
 * @returns generated prompt
 */
export async function getSplitTasksPrompt(
  params: SplitTasksPromptParams
): Promise<string> {
  const taskDetailsTemplate = await loadPromptFromTemplate(
    "splitTasks/taskDetails.md"
  );

  // 过滤文档创建任务
  // Filter document creation tasks
  const filteredTasks = params.createdTasks.filter(task => {
    const isDocTask = isDocumentCreationTask(task);
    if (isDocTask) {
      console.log(`🚫 Filtered out document creation task: ${task.name}`);
    }
    return !isDocTask;
  });

  const tasksContent = filteredTasks
    .map((task, index) => {
      let implementationGuide = "no implementation guide";
      if (task.implementationGuide) {
        implementationGuide =
          task.implementationGuide.length > 100
            ? task.implementationGuide.substring(0, 100) + "..."
            : task.implementationGuide;
      }

      let verificationCriteria = "no verification criteria";
      if (task.verificationCriteria) {
        verificationCriteria =
          task.verificationCriteria.length > 100
            ? task.verificationCriteria.substring(0, 100) + "..."
            : task.verificationCriteria;
      }

      const dependencies = task.dependencies
        ? task.dependencies
            .map((d: any) => {
              // 查找依賴任務的名稱，提供更友好的顯示
              // Find the name of the dependent task for more friendly display
              const depTask = params.allTasks.find((t) => t.id === d.taskId);
              return depTask
                ? `"${depTask.name}" (\`${d.taskId}\`)`
                : `\`${d.taskId}\``;
            })
            .join(", ")
        : "no dependencies";

      return generatePrompt(taskDetailsTemplate, {
        index: index + 1,
        name: task.name,
        id: task.id,
        description: task.description,
        notes: task.notes || "no notes",
        implementationGuide: implementationGuide,
        verificationCriteria: verificationCriteria,
        dependencies: dependencies,
      });
    })
    .join("\n");

  const indexTemplate = await loadPromptFromTemplate("splitTasks/index.md");
  const prompt = generatePrompt(indexTemplate, {
    updateMode: params.updateMode,
    tasksContent,
  });

  // 載入可能的自定義 prompt
  // Load possible custom prompt
  return loadPrompt(prompt, "SPLIT_TASKS");
}
