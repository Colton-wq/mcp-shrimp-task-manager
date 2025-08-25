import "dotenv/config";
import { loadPromptFromTemplate } from "./prompts/loader.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CallToolRequest,
  CallToolResult,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializedNotificationSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { setGlobalServer } from "./utils/paths.js";
import { createWebServer } from "./web/webServer.js";

// 導入所有工具函數和 schema
// Import all tool functions and schemas
import {
  planTask,
  planTaskSchema,
  analyzeTask,
  analyzeTaskSchema,
  reflectTask,
  reflectTaskSchema,
  splitTasks,
  splitTasksSchema,
  splitTasksRaw,
  splitTasksRawSchema,
  listTasksSchema,
  listTasks,
  executeTask,
  executeTaskSchema,
  verifyTask,
  verifyTaskSchema,
  deleteTask,
  deleteTaskSchema,
  clearAllTasks,
  clearAllTasksSchema,
  updateTaskContent,
  updateTaskContentSchema,
  queryTask,
  queryTaskSchema,
  getTaskDetail,
  getTaskDetailSchema,
  processThought,
  processThoughtSchema,
  initProjectRules,
  initProjectRulesSchema,
  researchMode,
  researchModeSchema,
  forceSearchProtocol,
  forceSearchProtocolSchema,
  preventFileCreation,
  preventFileCreationSchema,
  mandatoryCodeReview,
  mandatoryCodeReviewSchema,
} from "./tools/index.js";

// 导入工作流工具
// Import workflow tools
import {
  listProjects,
  listProjectsSchema,
  switchProject,
  switchProjectSchema,
  validateProjectContext,
  validateProjectContextSchema,

} from "./tools/index.js";

async function main() {
  try {
    const ENABLE_GUI = process.env.ENABLE_GUI === "true";
    let webServerInstance: Awaited<ReturnType<typeof createWebServer>> | null =
      null;

    // 創建MCP服務器
    // Create MCP server
    const server = new Server(
      {
        name: "Shrimp Task Manager",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          logging: {},
        },
      }
    );

    // 設置全局 server 實例
    // Set global server instance
    setGlobalServer(server);

    // 監聽 initialized 通知來啟動 web 服務器
    // Listen for initialized notification to start web server
    if (ENABLE_GUI) {
      server.setNotificationHandler(InitializedNotificationSchema, async () => {
        try {
          webServerInstance = await createWebServer();
          await webServerInstance.startServer();
        } catch (error) {}
      });
    }

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      // 工具注册顺序策略 (Tool Registration Order Strategy):
      // 1. 核心任务工具 (Core Task Tools) - 最常用的任务管理功能
      // 2. 质量保证工具 (Quality Assurance Tools) - 提升AI回答质量
      // 3. 任务管理工具 (Task Management Tools) - 任务操作和维护
      // 4. 分析工具 (Analysis Tools) - 深度思考和分析
      // 5. 项目管理工具 (Project Management Tools) - 项目级别操作
      // 6. 研究与搜索工具 (Research & Search Tools) - 信息获取和验证
      // 7. 工作流工具 (Workflow Tools) - 高级工作流程
      // 
      // enhance-response-quality 位于第6位，在核心工具之后、专业工具之前，
      // 平衡可见性和自然性，提升AI主动调用概率
      
      return {
        tools: [
          // === 🚫 强制文件拦截工具 (MANDATORY File Creation Prevention) ===
          // 最高优先级：强制拦截所有文件创建意图
          {
            name: "prevent-file-creation",
            description: await loadPromptFromTemplate(
              "toolsDescription/preventFileCreation.md"
            ),
            inputSchema: zodToJsonSchema(preventFileCreationSchema),
          },

          // === 核心任务工具 (Core Task Tools) ===
          {
            name: "plan_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/planTask.md"
            ),
            inputSchema: zodToJsonSchema(planTaskSchema),
          },
          {
            name: "analyze_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/analyzeTask.md"
            ),
            inputSchema: zodToJsonSchema(analyzeTaskSchema),
          },
          {
            name: "reflect_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/reflectTask.md"
            ),
            inputSchema: zodToJsonSchema(reflectTaskSchema),
          },
          {
            name: "split_tasks",
            description: await loadPromptFromTemplate(
              "toolsDescription/splitTasks.md"
            ),
            inputSchema: zodToJsonSchema(splitTasksRawSchema),
          },
          {
            name: "list_tasks",
            description: await loadPromptFromTemplate(
              "toolsDescription/listTasks.md"
            ),
            inputSchema: zodToJsonSchema(listTasksSchema),
          },
          {
            name: "execute_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/executeTask.md"
            ),
            inputSchema: zodToJsonSchema(executeTaskSchema),
          },
          {
            name: "verify_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/verifyTask.md"
            ),
            inputSchema: zodToJsonSchema(verifyTaskSchema),
          },

          
          // === 任务管理工具 (Task Management Tools) ===
          {
            name: "delete_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/deleteTask.md"
            ),
            inputSchema: zodToJsonSchema(deleteTaskSchema),
          },
          {
            name: "clear_all_tasks",
            description: await loadPromptFromTemplate(
              "toolsDescription/clearAllTasks.md"
            ),
            inputSchema: zodToJsonSchema(clearAllTasksSchema),
          },
          {
            name: "update_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/updateTask.md"
            ),
            inputSchema: zodToJsonSchema(updateTaskContentSchema),
          },
          {
            name: "query_task",
            description: await loadPromptFromTemplate(
              "toolsDescription/queryTask.md"
            ),
            inputSchema: zodToJsonSchema(queryTaskSchema),
          },
          {
            name: "get_task_detail",
            description: await loadPromptFromTemplate(
              "toolsDescription/getTaskDetail.md"
            ),
            inputSchema: zodToJsonSchema(getTaskDetailSchema),
          },
          
          // === 分析工具 (Analysis Tools) ===
          {
            name: "process_thought",
            description: await loadPromptFromTemplate(
              "toolsDescription/processThought.md"
            ),
            inputSchema: zodToJsonSchema(processThoughtSchema),
          },
          
          // === 项目管理工具 (Project Management Tools) ===
          {
            name: "init_project_rules",
            description: await loadPromptFromTemplate(
              "toolsDescription/initProjectRules.md"
            ),
            inputSchema: zodToJsonSchema(initProjectRulesSchema),
          },
          {
            name: "list_projects",
            description: "List available projects by scanning data directory parents; returns a simple list for AI to choose from.",
            inputSchema: zodToJsonSchema(listProjectsSchema),
          },
          {
            name: "switch_project",
            description: "Switch active project context with intelligent naming and conflict detection. Automatically creates projects if needed and provides naming suggestions for AI agents.",
            inputSchema: zodToJsonSchema(switchProjectSchema),
          },
          {
            name: "validate_project_context",
            description: "Validate project context consistency and provide intelligent suggestions for project switching when mismatches are detected.",
            inputSchema: zodToJsonSchema(validateProjectContextSchema),
          },
          
          // === 研究与搜索工具 (Research & Search Tools) ===
          {
            name: "research_mode",
            description: await loadPromptFromTemplate(
              "toolsDescription/researchMode.md"
            ),
            inputSchema: zodToJsonSchema(researchModeSchema),
          },
          {
            name: "force_search_protocol",
            description: await loadPromptFromTemplate(
              "toolsDescription/forceSearchProtocol.md"
            ),
            inputSchema: zodToJsonSchema(forceSearchProtocolSchema),
          },

          // === 审查工具 (Review Tools) ===
          {
            name: "mandatory_code_review",
            description: "Dynamic code review tool that generates mandatory review requirements based on AI submission context. Analyzes submission for deception patterns, verifies evidence authenticity, and enforces critical thinking checkpoints. AI cannot bypass or ignore these requirements. Designed for AI models to ensure honest, evidence-based code review.",
            inputSchema: zodToJsonSchema(mandatoryCodeReviewSchema),
          },

        ],
      };
    });

    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest): Promise<CallToolResult> => {
        try {
          if (!request.params.arguments) {
            throw new Error("No arguments provided");
          }

          let parsedArgs;
          switch (request.params.name) {
            case "prevent-file-creation":
              parsedArgs = await preventFileCreationSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await preventFileCreation(parsedArgs.data);
            case "plan_task":
              parsedArgs = await planTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await planTask(parsedArgs.data);
            case "analyze_task":
              parsedArgs = await analyzeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await analyzeTask(parsedArgs.data);
            case "reflect_task":
              parsedArgs = await reflectTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await reflectTask(parsedArgs.data);
            case "split_tasks":
              parsedArgs = await splitTasksRawSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await splitTasksRaw(parsedArgs.data);
            case "list_tasks":
              parsedArgs = await listTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await listTasks(parsedArgs.data);
            case "execute_task":
              parsedArgs = await executeTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await executeTask(parsedArgs.data);
            case "verify_task":
              parsedArgs = await verifyTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await verifyTask(parsedArgs.data);
            case "delete_task":
              parsedArgs = await deleteTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await deleteTask(parsedArgs.data);
            case "clear_all_tasks":
              parsedArgs = await clearAllTasksSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await clearAllTasks(parsedArgs.data);
            case "update_task":
              parsedArgs = await updateTaskContentSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await updateTaskContent(parsedArgs.data);
            case "query_task":
              parsedArgs = await queryTaskSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await queryTask(parsedArgs.data);
            case "get_task_detail":
              parsedArgs = await getTaskDetailSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await getTaskDetail(parsedArgs.data);
            case "process_thought":
              parsedArgs = await processThoughtSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await processThought(parsedArgs.data);
            case "init_project_rules":
              return await initProjectRules();
            case "list_projects":
              return await listProjects();
            case "switch_project":
              parsedArgs = await switchProjectSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await switchProject(parsedArgs.data);
            case "validate_project_context":
              parsedArgs = await validateProjectContextSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await validateProjectContext(parsedArgs.data);
            case "research_mode":
              parsedArgs = await researchModeSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await researchMode(parsedArgs.data);

            case "force_search_protocol":
              parsedArgs = await forceSearchProtocolSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await forceSearchProtocol(parsedArgs.data);

            case "mandatory_code_review":
              parsedArgs = await mandatoryCodeReviewSchema.safeParseAsync(
                request.params.arguments
              );
              if (!parsedArgs.success) {
                throw new Error(
                  `Invalid arguments for tool ${request.params.name}: ${parsedArgs.error.message}`
                );
              }
              return await mandatoryCodeReview(parsedArgs.data);

            default:
              throw new Error(`Tool ${request.params.name} does not exist`);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error occurred: ${errorMsg} \n Please try correcting the error and calling the tool again`,
              },
            ],
          };
        }
      }
    );

    // 建立連接
    // Establish connection
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

main().catch(console.error);
