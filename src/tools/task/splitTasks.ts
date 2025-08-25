import { z } from "zod";
import path from "path";
import {
  getAllTasks,
  batchCreateOrUpdateTasks,
  clearAllTasks as modelClearAllTasks,
} from "../../models/taskModel.js";
import { RelatedFileType, Task } from "../../types/index.js";
import { getSplitTasksPrompt } from "../../prompts/index.js";
import { getAllAvailableAgents } from "../../utils/agentLoader.js";
import { matchAgentToTask } from "../../utils/agentMatcher.js";
import { AsyncFileOperations } from "../../utils/asyncFileOperations.js";
import { ProjectRootDetector } from "../../utils/projectRoot.js";
import { IntelligentTaskAnalyzer } from "../../prompts/generators/executeTask.js";
import { TaskAttributeGenerator } from "../../utils/TaskAttributeGenerator.js";

// 拆分任務工具
// Task splitting tool
export const splitTasksSchema = z.object({
  updateMode: z
    .enum(["append", "overwrite", "selective", "clearAllTasks"])
    .describe(
      "Task update strategy for managing existing tasks. CHOOSE BASED ON INTENT: 'append' = add new tasks while keeping all existing ones (use for expanding project scope), 'overwrite' = replace incomplete tasks but keep completed ones (use for major plan changes), 'selective' = smart update by task name matching, preserve unlisted tasks (use for minor adjustments), 'clearAllTasks' = clear all tasks and create backup (use for fresh start). DEFAULT: 'clearAllTasks' for new projects. CHANGE ONLY when user explicitly requests modifications to existing plan."
    ),
  tasks: z
    .array(
      z.object({
        name: z
          .string()
          .max(100, {
            message: "Task name too long (max 100 characters). Please provide concise but descriptive name that clearly indicates the task purpose. GOOD EXAMPLES: 'Implement user authentication API', 'Design database schema', 'Setup CI/CD pipeline'. AVOID: overly long descriptions, vague names like 'Task 1' or 'Fix stuff'.",
          })
          .describe("Concise and clear task name that clearly expresses the task purpose. MAXIMUM 100 characters. SHOULD BE: specific, actionable, and descriptive. EXAMPLES: 'Implement JWT authentication middleware', 'Create user registration form', 'Setup PostgreSQL database connection'. AVOID: vague names, overly technical jargon, or generic descriptions."),
        description: z
          .string()
          .min(10, {
            message: "Task description too short (minimum 10 characters). Please provide detailed description including: (1) Implementation points and key requirements, (2) Technical details and specifications, (3) Acceptance criteria and success metrics. EXAMPLE: 'Implement user authentication system with JWT tokens, including login/logout endpoints, password hashing with bcrypt, and role-based access control middleware.'",
          })
          .describe("Detailed task description with implementation points, technical details, and acceptance criteria. MINIMUM 10 characters. MUST INCLUDE: specific requirements, technical approach, success criteria, any constraints or considerations. EXAMPLE: 'Create responsive user dashboard with React components, integrate with REST API for data fetching, implement real-time updates using WebSocket, and ensure mobile compatibility.'"),
        implementationGuide: z
          .string()
          .describe(
            "此特定任務的具體實現方法和步驟，請參考之前的分析結果提供精簡pseudocode"
            // Specific implementation methods and steps for this particular task, please refer to previous analysis results to provide concise pseudocode
          ),
        dependencies: z
          .array(z.string())
          .optional()
          .describe(
            "此任務依賴的前置任務ID或任務名稱列表，支持兩種引用方式，名稱引用更直觀，是一個字串陣列"
            // List of prerequisite task IDs or task names that this task depends on, supports two reference methods, name reference is more intuitive, is a string array
          ),
        notes: z
          .string()
          .optional()
          .describe("補充說明、特殊處理要求或實施建議（選填）"),
          // Additional notes, special handling requirements or implementation suggestions (optional)
        relatedFiles: z
          .array(
            z.object({
              path: z
                .string()
                .min(1, {
                  message: "文件路徑不能為空",
                  // File path cannot be empty
                })
                .describe("文件路徑，可以是相對於項目根目錄的路徑或絕對路徑"),
                // File path, can be a path relative to the project root directory or an absolute path
              type: z
                .nativeEnum(RelatedFileType)
                .describe(
                  "文件類型 (TO_MODIFY: 待修改, REFERENCE: 參考資料, CREATE: 待建立, DEPENDENCY: 依賴文件, OTHER: 其他)"
                  // File type (TO_MODIFY: to be modified, REFERENCE: reference material, CREATE: to be created, DEPENDENCY: dependency file, OTHER: other)
                ),
              description: z
                .string()
                .min(1, {
                  message: "文件描述不能為空",
                  // File description cannot be empty
                })
                .describe("文件描述，用於說明文件的用途和內容"),
                // File description, used to explain the purpose and content of the file
              lineStart: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("相關代碼區塊的起始行（選填）"),
                // Starting line of the related code block (optional)
              lineEnd: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("相關代碼區塊的結束行（選填）"),
                // Ending line of the related code block (optional)
            })
          )
          .optional()
          .describe(
            "與任務相關的文件列表，用於記錄與任務相關的代碼文件、參考資料、要建立的文件等（選填）"
            // List of files related to the task, used to record code files, reference materials, files to be created, etc. related to the task (optional)
          ),
        verificationCriteria: z
          .string()
          .optional()
          .describe("此特定任務的驗證標準和檢驗方法"),
          // Verification standards and inspection methods for this specific task
      })
    )
    .min(1, {
      message: "請至少提供一個任務",
      // Please provide at least one task
    })
    .describe(
      "結構化的任務清單，每個任務應保持原子性且有明確的完成標準，避免過於簡單的任務，簡單修改可與其他任務整合，避免任務過多"
      // Structured task list, each task should maintain atomicity and have clear completion criteria, avoid overly simple tasks, simple modifications can be integrated with other tasks, avoid too many tasks
    ),
  globalAnalysisResult: z
    .string()
    .optional()
    .describe("任務最終目標，來自之前分析適用於所有任務的通用部分"),
    // Task final objectives, from previous analysis applicable to the common part of all tasks
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure task data isolation and prevent concurrent conflicts. EXAMPLE: 'my-web-app', 'backend-service', 'mobile-client'. This parameter is mandatory in both MCPHub gateway mode and single IDE mode.",
    })
    .describe("REQUIRED - Target project name for task splitting. MANDATORY for multi-agent concurrent safety. If project does not exist, it will be created automatically with intelligent naming based on task content. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
  projectDescription: z
    .string()
    .optional()
    .describe("Project description for intelligent categorization and naming when creating new projects")
});

export async function splitTasks({
  updateMode,
  tasks,
  globalAnalysisResult,
  project,
  projectDescription,
}: z.infer<typeof splitTasksSchema>) {
  try {
    // Handle intelligent project creation/switching with mandatory project parameter
    // 使用强制项目参数处理智能项目创建/切换
    {
      const { ProjectSession } = await import("../../utils/projectSession.js");
      const fs = await import("fs/promises");
      const path = await import("path");

      // Clean project name
      const cleanProject = ProjectSession.sanitizeProjectName(project);

      // Check if project exists
      try {
        const { getDataDir } = await import("../../utils/paths.js");
        const dataDir = await getDataDir(true);
        const parentDir = path.dirname(dataDir);
        const projectPath = path.join(parentDir, cleanProject);

        try {
          await fs.access(projectPath);
          // Project exists, switch to it
          ProjectSession.setCurrentProject(cleanProject);
        } catch {
          // Project doesn't exist, create it
          await fs.mkdir(projectPath, { recursive: true });

          // Create basic tasks.json
          const tasksFile = path.join(projectPath, 'tasks.json');
          await fs.writeFile(tasksFile, JSON.stringify({ tasks: [] }, null, 2));

          // Switch to new project
          ProjectSession.setCurrentProject(cleanProject);
        }
      } catch (error) {
        // If project handling fails, continue with current project
        // 如果项目处理失败，继续使用当前项目
      }
    }

    // 載入可用的代理
    // Load available agents
    let availableAgents: any[] = [];
    try {
      availableAgents = await getAllAvailableAgents();
    } catch (error) {
      // 如果載入代理失敗，繼續執行但不分配代理
      // If agent loading fails, continue execution but don't assign agents
      availableAgents = [];
    }

    // 檢查 tasks 裡面的 name 是否有重複
    // Check if there are duplicate names in tasks
    const nameSet = new Set();
    for (const task of tasks) {
      if (nameSet.has(task.name)) {
        return {
          content: [
            {
              type: "text" as const,
              text: "tasks 參數中存在重複的任務名稱，請確保每個任務名稱是唯一的",
              // Duplicate task names exist in tasks parameter, please ensure each task name is unique
            },
          ],
        };
      }
      nameSet.add(task.name);
    }

    // 根據不同的更新模式處理任務
    // Handle tasks according to different update modes
    let message = "";
    let actionSuccess = true;
    let backupFile = null;
    let createdTasks: Task[] = [];
    let allTasks: Task[] = [];

    // 將任務資料轉換為符合batchCreateOrUpdateTasks的格式
    // Convert task data to format compatible with batchCreateOrUpdateTasks
    const convertedTasks = await Promise.all(tasks.map(async (task) => {
      // 創建一個臨時的 Task 對象用於代理匹配
      // Create a temporary Task object for agent matching
      const tempTask: Partial<Task> = {
        name: task.name,
        description: task.description,
        notes: task.notes,
        implementationGuide: task.implementationGuide,
      };

      // 使用 matchAgentToTask 找到最適合的代理
      // Use matchAgentToTask to find the most suitable agent
      const matchedAgent = availableAgents.length > 0 
        ? matchAgentToTask(tempTask as Task, availableAgents)
        : undefined;

      // 🎯 增强智能文档存在性检查和类型转换
      // Enhanced intelligent document existence check and type conversion
      let processedRelatedFiles = task.relatedFiles;
      let conversionStats = { total: 0, converted: 0, errors: 0 };
      
      if (task.relatedFiles && task.relatedFiles.length > 0) {
        try {
          // 提取所有文件路径进行批量检查
          // Extract all file paths for batch checking
          const filePaths = task.relatedFiles.map(file => file.path);
          conversionStats.total = filePaths.length;
          
          console.log(`🔍 智能文档管理: 开始检查 ${filePaths.length} 个文件...`);
          const startTime = performance.now();
          
          // 使用可靠的项目根目录检测
          const projectRoot = ProjectRootDetector.getProjectRoot();
          console.log(`📁 检测到的项目根目录: ${projectRoot}`);
          
          const fileExistenceMap = await AsyncFileOperations.checkFilesExist(filePaths, projectRoot);
          
          const checkDuration = performance.now() - startTime;
          console.log(`⚡ 文件检查完成，耗时 ${checkDuration.toFixed(2)}ms`);
          
          // 智能转换文件类型：存在的文件从 CREATE 转为 TO_MODIFY
          // Smart file type conversion: existing files from CREATE to TO_MODIFY
          processedRelatedFiles = task.relatedFiles.map((file) => {
            const fileExists = fileExistenceMap.get(file.path) || false;
            let finalType = file.type as RelatedFileType;
            
            // 如果文件存在且原类型是 CREATE，自动转换为 TO_MODIFY
            // If file exists and original type is CREATE, automatically convert to TO_MODIFY
            if (fileExists && file.type === 'CREATE') {
              finalType = RelatedFileType.TO_MODIFY;
              conversionStats.converted++;
              console.log(`📝 智能转换: ${file.path} (CREATE → TO_MODIFY)`);
            } else if (!fileExists && file.type === 'CREATE') {
              console.log(`📄 新建文件: ${file.path} (保持 CREATE)`);
            } else if (fileExists && file.type !== 'CREATE') {
              console.log(`📋 现有文件: ${file.path} (保持 ${file.type})`);
            }
            
            return {
              path: file.path,
              type: finalType,
              description: file.description,
              lineStart: file.lineStart,
              lineEnd: file.lineEnd,
            };
          });
          
          // 输出转换统计
          console.log(`✅ 智能文档管理完成: ${conversionStats.converted}/${conversionStats.total} 文件已转换`);
          
        } catch (error) {
          conversionStats.errors++;
          console.error(`❌ 智能文档管理失败:`, error);
          // 发生错误时保持原始文件配置
          processedRelatedFiles = task.relatedFiles;
        }
      }

      // 🔥 新增：语义分析集成
      // New: Semantic analysis integration
      let enhancedImplementationGuide = task.implementationGuide;
      let enhancedVerificationCriteria = task.verificationCriteria;
      let enhancedNotes = task.notes;
      
      try {
        console.log(`🧠 开始语义分析: ${task.name}`);
        
        // 创建临时任务对象用于语义分析
        const tempTaskForAnalysis: Task = {
          id: 'temp-' + Date.now(),
          name: task.name,
          description: task.description,
          notes: task.notes,
          status: 'pending' as any,
          dependencies: task.dependencies?.map(dep => ({ taskId: dep })) || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          implementationGuide: task.implementationGuide,
          verificationCriteria: task.verificationCriteria,
          relatedFiles: processedRelatedFiles
        };
        
        // 执行任务拆分语义分析
        const semanticAnalysis = IntelligentTaskAnalyzer.analyzeForTaskSplitting(tempTaskForAnalysis);
        
        // 使用 TaskAttributeGenerator 生成增强的任务属性
        enhancedImplementationGuide = TaskAttributeGenerator.generateEnhancedImplementationGuide(
          task.implementationGuide,
          semanticAnalysis
        );
        
        enhancedVerificationCriteria = TaskAttributeGenerator.generateEnhancedVerificationCriteria(
          task.verificationCriteria,
          semanticAnalysis
        );
        
        enhancedNotes = TaskAttributeGenerator.generateEnhancedNotes(
          task.notes,
          semanticAnalysis
        );
        
        console.log(`✅ 语义分析完成: ${task.name} (优先级: ${semanticAnalysis.priority}, 复杂度: ${semanticAnalysis.complexityIndicators.complexityScore})`);
        
      } catch (error) {
        console.error(`❌ 语义分析失败: ${task.name}`, error);
        // 发生错误时保持原始任务属性
      }

      return {
        name: task.name,
        description: task.description,
        notes: enhancedNotes, // 使用语义分析增强的notes
        dependencies: task.dependencies,
        implementationGuide: enhancedImplementationGuide, // 使用语义分析增强的实施指导
        verificationCriteria: enhancedVerificationCriteria, // 使用语义分析增强的验证标准
        agent: matchedAgent, // 添加代理分配
        // Add agent assignment
        relatedFiles: processedRelatedFiles, // 直接使用已处理的文件列表，保留智能转换结果
      };
    }));

    // 處理 clearAllTasks 模式
    // Handle clearAllTasks mode
    if (updateMode === "clearAllTasks") {
      const clearResult = await modelClearAllTasks();

      if (clearResult.success) {
        message = clearResult.message;
        backupFile = clearResult.backupFile;

        try {
          // 清空任務後再創建新任務
          // Clear tasks and then create new tasks
          createdTasks = await batchCreateOrUpdateTasks(
            convertedTasks,
            "append",
            globalAnalysisResult
          );
          message += `\n成功創建了 ${createdTasks.length} 個新任務。`;
          // Successfully created ${createdTasks.length} new tasks.
        } catch (error) {
          actionSuccess = false;
          message += `\n創建新任務時發生錯誤: ${
          // Error occurred when creating new tasks: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      } else {
        actionSuccess = false;
        message = clearResult.message;
      }
    } else {
      // 對於其他模式，直接使用 batchCreateOrUpdateTasks
      // For other modes, use batchCreateOrUpdateTasks directly
      try {
        createdTasks = await batchCreateOrUpdateTasks(
          convertedTasks,
          updateMode,
          globalAnalysisResult
        );

        // 根據不同的更新模式生成消息
        // Generate messages based on different update modes
        switch (updateMode) {
          case "append":
            message = `成功追加了 ${createdTasks.length} 個新任務。`;
            // Successfully appended ${createdTasks.length} new tasks.
            break;
          case "overwrite":
            message = `成功清除未完成任務並創建了 ${createdTasks.length} 個新任務。`;
            // Successfully cleared incomplete tasks and created ${createdTasks.length} new tasks.
            break;
          case "selective":
            message = `成功選擇性更新/創建了 ${createdTasks.length} 個任務。`;
            // Successfully selectively updated/created ${createdTasks.length} tasks.
            break;
        }
      } catch (error) {
        actionSuccess = false;
        message = `任務創建失敗：${
        // Task creation failed: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }
    }

    // 獲取所有任務用於顯示依賴關係
    // Get all tasks for displaying dependency relationships
    try {
      allTasks = await getAllTasks();
    } catch (error) {
      allTasks = [...createdTasks]; // 如果獲取失敗，至少使用剛創建的任務
      // If retrieval fails, at least use the newly created tasks
    }

    // 使用prompt生成器獲取最終prompt
    // Use prompt generator to get the final prompt
    const prompt = await getSplitTasksPrompt({
      updateMode,
      createdTasks,
      allTasks,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: prompt,
        },
      ],
      ephemeral: {
        taskCreationResult: {
          success: actionSuccess,
          message,
          backupFilePath: backupFile,
        },
      },
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            "執行任務拆分時發生錯誤: " +
            // Error occurred when executing task splitting: " +
            (error instanceof Error ? error.message : String(error)),
        },
      ],
    };
  }
}
