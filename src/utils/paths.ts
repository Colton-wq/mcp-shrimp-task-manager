import path from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import fs from "fs";
import { ProjectSession, getActiveProjectContext } from "./projectSession.js";

// 取得專案根目錄
// Get project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");

// 全局 server 實例
// Global server instance
let globalServer: Server | null = null;

// 項目上下文緩存變量
// Project context cache variables
let cachedDataDir: string | null = null;
let lastRootsCall: number = 0;
const CACHE_DURATION = 5000; // 5秒緩存持續時間 / 5 seconds cache duration

/**
 * 設置全局 server 實例
 * Set global server instance
 */
export function setGlobalServer(server: Server): void {
  globalServer = server;
}

/**
 * 獲取全局 server 實例
 * Get global server instance
 */
export function getGlobalServer(): Server | null {
  return globalServer;
}

/**
 * 取得 DATA_DIR 路徑
 * Get DATA_DIR path
 * 如果有 server 且支援 listRoots，則使用第一筆 file:// 開頭的 root + "/data"
 * If there's a server that supports listRoots, use the first root starting with file:// + "/data"
 * 否則使用環境變數或專案根目錄
 * Otherwise use environment variables or project root directory
 *
 * @param forceRefresh 強制刷新緩存，跳過緩存機制 / Force refresh cache, skip cache mechanism
 * @param projectOverride 可選的項目名稱覆蓋 / Optional project name override
 * @returns DATA_DIR 路徑 / DATA_DIR path
 */
export async function getDataDir(forceRefresh = false, projectOverride?: string): Promise<string> {
  const now = Date.now();
  const server = getGlobalServer();

  // 在多Agent并发安全模式下，禁用全局缓存以确保项目隔离
  // In multi-agent concurrent safety mode, disable global cache to ensure project isolation
  // 每个项目都应该有独立的路径，不能共享缓存
  // Each project should have independent paths, cannot share cache

  // 嘗試使用項目會話管理獲取項目上下文
  // Try to get project context using project session management
  if (server) {
    try {
      const projectContext = await getActiveProjectContext(server, projectOverride);
      if (projectContext) {
        return projectContext.dataDir;
      }
    } catch (error) {
      // 如果項目上下文獲取失敗，回退到原有邏輯
      // If project context acquisition fails, fall back to original logic
    }
  }

  // 在多Agent并发安全模式下，要求明确的项目参数
  // In multi-agent concurrent safety mode, require explicit project parameter
  if (!projectOverride) {
    throw new Error(
      "Project parameter is required for multi-agent safety. " +
      "Please specify the project name explicitly to ensure path isolation and prevent concurrent conflicts. " +
      "This parameter is mandatory in both MCPHub gateway mode and single IDE mode. " +
      "EXAMPLE: getDataDir(false, 'my-web-app')"
    );
  }
  
  const currentProject = projectOverride;
  if (currentProject) {
    // 在多Agent并发安全模式下，所有项目都需要隔离，包括'main'项目
    // In multi-agent concurrent safety mode, all projects need isolation, including 'main' project
    const sanitizedProjectName = currentProject
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100);

    // 项目隔离逻辑：无论是否设置了 DATA_DIR 都要应用
    // Project isolation logic: apply regardless of whether DATA_DIR is set
    if (process.env.DATA_DIR && path.isAbsolute(process.env.DATA_DIR)) {
      const projectDataDir = path.join(process.env.DATA_DIR, sanitizedProjectName);
      return projectDataDir;
    } else {
      // 如果没有设置 DATA_DIR 或不是绝对路径，使用项目根目录下的项目特定目录
      // If DATA_DIR is not set or not absolute, use project-specific directory under project root
      let rootPath: string | null = null;

      if (server) {
        try {
          const roots = await server.listRoots();
          if (roots.roots && roots.roots.length > 0) {
            const firstFileRoot = roots.roots.find((root) =>
              root.uri.startsWith("file://")
            );
            if (firstFileRoot) {
              if (process.platform === 'win32') {
                rootPath = firstFileRoot.uri.replace("file:///", "").replace(/\//g, "\\");
              } else {
                rootPath = firstFileRoot.uri.replace("file://", "");
              }
            }
          }
        } catch (error) {
          // Silently handle error
        }
      }

      const baseDir = rootPath || PROJECT_ROOT;
      const dataDir = process.env.DATA_DIR || "shrimpdata";
      const projectDataDir = path.join(baseDir, dataDir, sanitizedProjectName);

      return projectDataDir;
    }
  }

  let rootPath: string | null = null;

  if (server) {
    try {
      const roots = await server.listRoots();

      // 找出第一筆 file:// 開頭的 root
      // Find the first root starting with file://
      if (roots.roots && roots.roots.length > 0) {
        const firstFileRoot = roots.roots.find((root) =>
          root.uri.startsWith("file://")
        );
        if (firstFileRoot) {
          // 從 file:// URI 中提取實際路徑
          // Extract actual path from file:// URI
          // Windows: file:///C:/path -> C:/path
          // Unix: file:///path -> /path
          if (process.platform === 'win32') {
            rootPath = firstFileRoot.uri.replace("file:///", "").replace(/\//g, "\\");
          } else {
            rootPath = firstFileRoot.uri.replace("file://", "");
          }
        }
      }
    } catch (error) {
      // Silently handle error - console not supported in MCP
    }
  }

  // 處理 process.env.DATA_DIR
  // Handle process.env.DATA_DIR
  if (process.env.DATA_DIR) {
    if (path.isAbsolute(process.env.DATA_DIR)) {
      // 如果 DATA_DIR 是絕對路徑，返回 "DATA_DIR/rootPath最後一個資料夾名稱"
      // If DATA_DIR is an absolute path, return "DATA_DIR/last folder name of rootPath"
      if (rootPath) {
        const lastFolderName = path.basename(rootPath);
        const finalPath = path.join(process.env.DATA_DIR, lastFolderName);
        return finalPath;
      } else {
        // 如果沒有 rootPath，直接返回 DATA_DIR
        // If there's no rootPath, return DATA_DIR directly
        return process.env.DATA_DIR;
      }
    } else {
      // 如果 DATA_DIR 是相對路徑，返回 "rootPath/DATA_DIR"
      // If DATA_DIR is a relative path, return "rootPath/DATA_DIR"
      if (rootPath) {
        const finalPath = path.join(rootPath, process.env.DATA_DIR);
        // 緩存結果
        // Cache the result
        cachedDataDir = finalPath;
        lastRootsCall = now;
        return finalPath;
      } else {
        // 如果沒有 rootPath，使用 PROJECT_ROOT
        // If there's no rootPath, use PROJECT_ROOT
        const finalPath = path.join(PROJECT_ROOT, process.env.DATA_DIR);
        return finalPath;
      }
    }
  }

  // 如果沒有 DATA_DIR，使用預設邏輯（包含项目隔离）
  // If there's no DATA_DIR, use default logic (with project isolation)
  const baseDir = rootPath || PROJECT_ROOT;
  const dataDir = "shrimpdata";

  // 对于 'main' 项目，使用根数据目录；对于其他项目，应该已经在上面处理了
  // For 'main' project, use root data directory; other projects should have been handled above
  let finalPath: string;

  if (currentProject === 'main') {
    finalPath = path.join(baseDir, dataDir);
  } else {
    // 这种情况不应该发生，因为非 'main' 项目应该在上面的逻辑中处理
    // This case should not happen as non-'main' projects should be handled in the logic above
    const sanitizedProjectName = currentProject
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100);
    finalPath = path.join(baseDir, dataDir, sanitizedProjectName);
  }

  // 緩存結果
  return finalPath;
}

/**
 * 取得任務檔案路徑
 * Get task file path
 *
 * @param forceRefresh 強制刷新緩存，跳過緩存機制 / Force refresh cache, skip cache mechanism
 * @param projectOverride 可選的項目名稱覆蓋 / Optional project name override
 * @returns 任務檔案路徑 / Task file path
 */
export async function getTasksFilePath(forceRefresh = false, projectOverride?: string): Promise<string> {
  const dataDir = await getDataDir(forceRefresh, projectOverride);
  return path.join(dataDir, "tasks.json");
}

/**
 * 取得記憶體資料夾路徑
 * Get memory directory path
 *
 * @param forceRefresh 強制刷新緩存，跳過緩存機制 / Force refresh cache, skip cache mechanism
 * @param projectOverride 可選的項目名稱覆蓋 / Optional project name override
 * @returns 記憶體資料夾路徑 / Memory directory path
 */
export async function getMemoryDir(forceRefresh = false, projectOverride?: string): Promise<string> {
  const dataDir = await getDataDir(forceRefresh, projectOverride);
  return path.join(dataDir, "memory");
}

/**
 * 取得 WebGUI 檔案路徑
 * Get WebGUI file path
 *
 * @param forceRefresh 強制刷新緩存，跳過緩存機制 / Force refresh cache, skip cache mechanism
 * @param projectOverride 可選的項目名稱覆蓋 / Optional project name override
 * @returns WebGUI 檔案路徑 / WebGUI file path
 */
export async function getWebGuiFilePath(forceRefresh = false, projectOverride?: string): Promise<string> {
  const dataDir = await getDataDir(forceRefresh, projectOverride);
  return path.join(dataDir, "WebGUI.md");
}

/**
 * 取得專案根目錄
 * Get project root directory
 */
export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

/**
 * 清除路徑緩存
 * Clear path cache
 *
 * 注意：在多Agent并发安全模式下，路径缓存已被禁用以确保项目隔离
 * Note: In multi-agent concurrent safety mode, path caching is disabled to ensure project isolation
 * 此函数主要用于清除ProjectSession缓存
 * This function is mainly used to clear ProjectSession cache
 */
export function clearPathCache(): void {
  cachedDataDir = null;
  lastRootsCall = 0;
  ProjectSession.clearCache();
}
