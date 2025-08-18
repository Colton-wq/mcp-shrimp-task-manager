/**
 * Project session management for MCP Shrimp Task Manager.
 * 
 * Provides simple in-memory project context for MCP tools, allowing AI agents to switch
 * between projects during a conversation without restarting the server.
 * 
 * Based on basic-memory's ProjectSession pattern but adapted for TypeScript and
 * the current project architecture.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

/**
 * Project context information for session management
 * 项目上下文信息，用于会话管理
 */
export interface ProjectContext {
  /** Project unique identifier / 项目唯一标识符 */
  projectId: string;
  /** Human-readable project name / 人类可读的项目名称 */
  projectName: string;
  /** Project root directory path / 项目根目录路径 */
  projectRoot: string;
  /** Data directory path for this project / 此项目的数据目录路径 */
  dataDir: string;
  /** Tasks file path for this project / 此项目的任务文件路径 */
  tasksFilePath: string;
  /** Last accessed timestamp / 最后访问时间戳 */
  lastAccessed: Date;
}

/**
 * Simple in-memory project context for MCP session.
 * 
 * This class manages the current project context that tools use when no explicit
 * project is specified. It's initialized with the default project from config
 * and can be changed during the conversation.
 * 
 * 简单的内存项目上下文管理，用于MCP会话。
 * 此类管理工具在未明确指定项目时使用的当前项目上下文。
 */
export class ProjectSession {
  private static currentProject: string | null = null;
  private static defaultProject: string | null = null;
  private static projectContextCache: Map<string, ProjectContext> = new Map();
  private static lastCacheUpdate: number = 0;
  private static readonly CACHE_DURATION = 5000; // 5 seconds cache duration / 5秒缓存持续时间

  /**
   * Initialize the project session with default project
   * 使用默认项目初始化项目会话
   * 
   * @param defaultProject The project name from configuration / 配置中的项目名称
   * @returns The initialized ProjectSession instance / 初始化的ProjectSession实例
   */
  static initialize(defaultProject: string): typeof ProjectSession {
    this.defaultProject = defaultProject;
    this.currentProject = defaultProject;
    this.lastCacheUpdate = Date.now();
    
    // Log initialization (MCP servers should avoid console.log)
    // 记录初始化（MCP服务器应避免使用console.log）
    return this;
  }

  /**
   * Get the currently active project name
   * 获取当前活跃的项目名称
   * 
   * @returns The current project name, falling back to default, then 'main'
   * 返回当前项目名称，回退到默认值，然后是'main'
   */
  static getCurrentProject(): string {
    return this.currentProject || this.defaultProject || "main";
  }

  /**
   * Set the current project context
   * 设置当前项目上下文
   * 
   * @param projectName The project to switch to / 要切换到的项目
   */
  static setCurrentProject(projectName: string): void {
    const previous = this.currentProject;
    this.currentProject = projectName;
    this.lastCacheUpdate = Date.now();
    
    // Update cache access time if project context exists
    // 如果项目上下文存在，更新缓存访问时间
    const context = this.projectContextCache.get(projectName);
    if (context) {
      context.lastAccessed = new Date();
    }
  }

  /**
   * Get the default project name from startup
   * 获取启动时的默认项目名称
   * 
   * @returns The default project name, or 'main' if not set
   * 返回默认项目名称，如果未设置则返回'main'
   */
  static getDefaultProject(): string {
    return this.defaultProject || "main";
  }

  /**
   * Reset current project back to the default project
   * 将当前项目重置为默认项目
   */
  static resetToDefault(): void {
    this.currentProject = this.defaultProject;
    this.lastCacheUpdate = Date.now();
  }

  /**
   * Get project context from cache or create new one
   * 从缓存获取项目上下文或创建新的
   * 
   * @param projectName Project name to get context for / 要获取上下文的项目名称
   * @param server MCP Server instance for listRoots() / 用于listRoots()的MCP服务器实例
   * @returns Project context information / 项目上下文信息
   */
  static async getProjectContext(
    projectName: string, 
    server?: Server
  ): Promise<ProjectContext | null> {
    const now = Date.now();
    
    // Check cache validity / 检查缓存有效性
    if (
      this.projectContextCache.has(projectName) && 
      (now - this.lastCacheUpdate) < this.CACHE_DURATION
    ) {
      const context = this.projectContextCache.get(projectName)!;
      context.lastAccessed = new Date();
      return context;
    }

    // If no server provided, return cached context or null
    // 如果未提供服务器，返回缓存的上下文或null
    if (!server) {
      return this.projectContextCache.get(projectName) || null;
    }

    try {
      // Get project root from server.listRoots()
      // 从server.listRoots()获取项目根目录
      const roots = await server.listRoots();
      let projectRoot = "";

      if (roots.roots && roots.roots.length > 0) {
        const firstFileRoot = roots.roots.find((root) =>
          root.uri.startsWith("file://")
        );
        if (firstFileRoot) {
          // Extract actual path from file:// URI
          // 从file:// URI中提取实际路径
          if (process.platform === 'win32') {
            projectRoot = firstFileRoot.uri.replace("file:///", "").replace(/\//g, "\\");
          } else {
            projectRoot = firstFileRoot.uri.replace("file://", "");
          }
        }
      }

      if (!projectRoot) {
        return null;
      }

      // Create project context
      // 创建项目上下文
      const context: ProjectContext = {
        projectId: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        projectName,
        projectRoot,
        dataDir: this.generateDataDir(projectRoot, projectName),
        tasksFilePath: this.generateTasksFilePath(projectRoot, projectName),
        lastAccessed: new Date()
      };

      // Cache the context
      // 缓存上下文
      this.projectContextCache.set(projectName, context);
      this.lastCacheUpdate = now;

      return context;
    } catch (error) {
      // Silently handle error - MCP servers should not use console
      // 静默处理错误 - MCP服务器不应使用console
      return this.projectContextCache.get(projectName) || null;
    }
  }

  /**
   * Generate data directory path for a project
   * 为项目生成数据目录路径
   */
  private static generateDataDir(projectRoot: string, projectName: string): string {
    const path = require('path');
    
    if (process.env.DATA_DIR) {
      if (path.isAbsolute(process.env.DATA_DIR)) {
        return path.join(process.env.DATA_DIR, projectName);
      } else {
        return path.join(projectRoot, process.env.DATA_DIR);
      }
    }
    
    return path.join(projectRoot, "data");
  }

  /**
   * Generate tasks file path for a project
   * 为项目生成任务文件路径
   */
  private static generateTasksFilePath(projectRoot: string, projectName: string): string {
    const path = require('path');
    const dataDir = this.generateDataDir(projectRoot, projectName);
    return path.join(dataDir, "tasks.json");
  }

  /**
   * Clear project context cache
   * 清除项目上下文缓存
   */
  static clearCache(): void {
    this.projectContextCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Get all cached project contexts
   * 获取所有缓存的项目上下文
   */
  static getAllCachedProjects(): ProjectContext[] {
    return Array.from(this.projectContextCache.values());
  }

  /**
   * Add project metadata as footer for AI awareness
   * 为AI感知添加项目元数据作为页脚
   * 
   * @param result The tool result string / 工具结果字符串
   * @param projectName The project name that was used / 使用的项目名称
   * @returns Result with project metadata footer / 带有项目元数据页脚的结果
   */
  static addProjectMetadata(result: string, projectName: string): string {
    return `${result}\n\n<!-- Project: ${projectName} -->`;
  }
}

/**
 * Get the active project context for a tool call
 * 获取工具调用的活跃项目上下文
 * 
 * This is the main function tools should use to determine which project
 * to operate on.
 * 这是工具应该用来确定操作哪个项目的主要函数。
 * 
 * @param server MCP Server instance / MCP服务器实例
 * @param projectOverride Optional explicit project name from tool parameter / 工具参数中的可选显式项目名称
 * @returns The project context to use / 要使用的项目上下文
 */
export async function getActiveProjectContext(
  server?: Server,
  projectOverride?: string
): Promise<ProjectContext | null> {
  if (projectOverride) {
    ProjectSession.setCurrentProject(projectOverride);
    return await ProjectSession.getProjectContext(projectOverride, server);
  }

  const currentProject = ProjectSession.getCurrentProject();
  return await ProjectSession.getProjectContext(currentProject, server);
}
