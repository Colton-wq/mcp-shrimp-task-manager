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
  
  // 并发安全的项目上下文管理
  // Concurrent-safe project context management
  private static contextStack: Map<string, string> = new Map();
  private static contextCounter: number = 0;

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

    // 清理项目名称，确保文件系统安全
    // Sanitize project name for filesystem safety
    const sanitizedProjectName = this.sanitizeProjectName(projectName);

    // 绝对路径模式：使用项目名称作为子目录，确保不同项目名称对应不同目录
    // Absolute path mode: use project name as subfolder to ensure different project names get different directories
    if (process.env.DATA_DIR) {
      if (path.isAbsolute(process.env.DATA_DIR)) {
        return path.join(process.env.DATA_DIR, sanitizedProjectName);
      } else {
        // 相对路径模式：数据放在项目根目录下的相对目录，本身已隔离
        // Relative path mode: data under project root, already isolated per project
        return path.join(projectRoot, process.env.DATA_DIR);
      }
    }

    // 未配置DATA_DIR时，默认使用项目根目录下的data目录，本身已隔离
    // When DATA_DIR not set, default to projectRoot/data which is per-project
    return path.join(projectRoot, "data");
  }

  /**
   * Sanitize project name for filesystem safety
   * 清理项目名称以确保文件系统安全
   */
  private static sanitizeProjectName(projectName: string): string {
    // 移除或替换不安全的字符，保留字母、数字、连字符和下划线
    // Remove or replace unsafe characters, keep letters, numbers, hyphens and underscores
    return projectName
      .replace(/[<>:"/\\|?*]/g, '_')  // 替换文件系统不安全字符
      .replace(/\s+/g, '_')           // 替换空格为下划线
      .replace(/_{2,}/g, '_')         // 合并多个下划线
      .replace(/^_+|_+$/g, '')        // 移除开头和结尾的下划线
      .substring(0, 100);             // 限制长度以避免路径过长
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

  /**
   * Execute a function with a specific project context in a thread-safe manner
   * 以线程安全的方式在特定项目上下文中执行函数
   * 
   * @param projectName The project name to use for this operation / 此操作要使用的项目名称
   * @param operation The async function to execute / 要执行的异步函数
   * @returns The result of the operation / 操作的结果
   */
  static async withProjectContext<T>(
    projectName: string | undefined,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!projectName) {
      // 如果没有指定项目，直接执行操作
      // If no project specified, execute operation directly
      return await operation();
    }

    // 生成唯一的上下文标识符
    // Generate unique context identifier
    const contextId = `ctx_${Date.now()}_${++this.contextCounter}`;
    const previousProject = this.getCurrentProject();
    
    try {
      // 设置上下文映射和项目
      // Set context mapping and project
      this.contextStack.set(contextId, projectName);
      this.setCurrentProject(projectName);
      
      // 执行操作
      // Execute operation
      return await operation();
    } finally {
      // 清理上下文并恢复原项目
      // Clean up context and restore original project
      this.contextStack.delete(contextId);
      this.setCurrentProject(previousProject);
    }
  }

  /**
   * Get the current project context for the active thread
   * 获取活动线程的当前项目上下文
   * 
   * @returns The current project name for this thread / 此线程的当前项目名称
   */
  static getCurrentThreadProject(): string {
    // 在单线程环境中，直接返回当前项目
    // In single-threaded environment, return current project directly
    return this.getCurrentProject();
  }

  /**
   * Clean up any leaked project contexts
   * 清理任何泄漏的项目上下文
   */
  static cleanupProjectContexts(): void {
    // 清理超过一定时间的上下文
    // Clean up contexts older than a certain time
    const now = Date.now();
    const maxAge = 60000; // 1 minute
    
    for (const [contextId] of this.contextStack) {
      const timestamp = parseInt(contextId.split('_')[1]);
      if (now - timestamp > maxAge) {
        this.contextStack.delete(contextId);
      }
    }
  }

  /**
   * Get statistics about active project contexts (for debugging)
   * 获取活动项目上下文的统计信息（用于调试）
   */
  static getProjectContextStats(): {
    activeContexts: number;
    currentProject: string;
    cacheSize: number;
  } {
    return {
      activeContexts: this.contextStack.size,
      currentProject: this.getCurrentProject(),
      cacheSize: this.projectContextCache.size,
    };
  }

  /**
   * Validate project context against task metadata
   * 根据任务元数据验证项目上下文
   * 
   * @param expectedProject The expected project name / 预期的项目名称
   * @param taskContent The task content to check / 要检查的任务内容
   * @returns Validation result / 验证结果
   */
  static validateProjectContext(expectedProject: string, taskContent?: string): {
    isValid: boolean;
    detectedProject?: string;
    suggestion?: string;
  } {
    if (!taskContent) {
      return { isValid: true };
    }

    // 从任务内容中提取项目元数据
    // Extract project metadata from task content
    const projectMetadataMatch = taskContent.match(/<!-- Project: (.+?) -->/);
    
    if (!projectMetadataMatch) {
      // 没有项目元数据，假设有效
      // No project metadata, assume valid
      return { isValid: true };
    }

    const detectedProject = projectMetadataMatch[1].trim();
    
    if (detectedProject !== expectedProject) {
      // 项目上下文不匹配
      // Project context mismatch
      return {
        isValid: false,
        detectedProject,
        suggestion: this.generateProjectSwitchSuggestion(detectedProject, expectedProject)
      };
    }

    return { isValid: true, detectedProject };
  }

  /**
   * Generate intelligent project switch suggestion
   * 生成智能项目切换建议
   * 
   * @param detectedProject The project detected from metadata / 从元数据检测到的项目
   * @param currentProject The current project context / 当前项目上下文
   * @returns User-friendly suggestion message / 用户友好的建议消息
   */
  static generateProjectSwitchSuggestion(detectedProject: string, currentProject: string): string {
    return `检测到任务列表属于项目 "${detectedProject}"，但当前项目上下文为 "${currentProject}"。
建议切换到正确的项目上下文以避免数据混乱。
使用工具：switchProject({ project: "${detectedProject}" })`;
  }

  /**
   * Auto-detect project from task list content
   * 从任务列表内容自动检测项目
   * 
   * @param taskListContent The full task list content / 完整的任务列表内容
   * @returns Detected project information / 检测到的项目信息
   */
  static autoDetectProject(taskListContent: string): {
    detectedProject?: string;
    confidence: number;
    metadata: {
      hasProjectMetadata: boolean;
      metadataCount: number;
      consistentProject: boolean;
    };
  } {
    // 查找所有项目元数据标记
    // Find all project metadata markers
    const projectMatches = taskListContent.match(/<!-- Project: (.+?) -->/g);
    
    if (!projectMatches || projectMatches.length === 0) {
      return {
        confidence: 0,
        metadata: {
          hasProjectMetadata: false,
          metadataCount: 0,
          consistentProject: false
        }
      };
    }

    // 提取项目名称
    // Extract project names
    const projectNames = projectMatches.map(match => {
      const nameMatch = match.match(/<!-- Project: (.+?) -->/);
      return nameMatch ? nameMatch[1].trim() : '';
    }).filter(name => name);

    // 检查项目一致性
    // Check project consistency
    const uniqueProjects = [...new Set(projectNames)];
    const consistentProject = uniqueProjects.length === 1;
    const mostCommonProject = uniqueProjects.length > 0 ? uniqueProjects[0] : undefined;

    // 计算置信度
    // Calculate confidence
    let confidence = 0;
    if (consistentProject && mostCommonProject) {
      confidence = Math.min(0.9, 0.5 + (projectMatches.length * 0.1));
    } else if (mostCommonProject) {
      confidence = 0.3;
    }

    return {
      detectedProject: mostCommonProject,
      confidence,
      metadata: {
        hasProjectMetadata: true,
        metadataCount: projectMatches.length,
        consistentProject
      }
    };
  }

  /**
   * Generate project context mismatch warning
   * 生成项目上下文不匹配警告
   * 
   * @param validation The validation result / 验证结果
   * @returns Formatted warning message / 格式化的警告消息
   */
  static generateContextMismatchWarning(validation: {
    isValid: boolean;
    detectedProject?: string;
    suggestion?: string;
  }): string {
    if (validation.isValid) {
      return '';
    }

    return `⚠️ **项目上下文不匹配警告**

${validation.suggestion}

**注意**：继续在错误的项目上下文中操作可能导致：
- 任务数据被写入错误的项目文件
- 任务列表混乱和数据覆盖
- 项目间数据泄露

建议立即切换到正确的项目上下文。`;
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
