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

  // 檢查緩存有效性（如果不強制刷新）
  // Check cache validity (if not forcing refresh)
  if (!forceRefresh && cachedDataDir && (now - lastRootsCall) < CACHE_DURATION) {
    return cachedDataDir;
  }

  // 嘗試使用項目會話管理獲取項目上下文
  // Try to get project context using project session management
  if (server) {
    try {
      const projectContext = await getActiveProjectContext(server, projectOverride);
      if (projectContext) {
        cachedDataDir = projectContext.dataDir;
        lastRootsCall = now;
        return cachedDataDir;
      }
    } catch (error) {
      // 如果項目上下文獲取失敗，回退到原有邏輯
      // If project context acquisition fails, fall back to original logic
    }
  }

  // 如果没有服务器或项目上下文获取失败，但有项目覆盖参数，使用简化的项目隔离逻辑
  // If no server or project context failed, but have project override, use simplified project isolation logic
  if (projectOverride || !server) {
    const currentProject = projectOverride || ProjectSession.getCurrentProject();
    if (currentProject && currentProject !== 'main') {
      // 使用项目特定的数据目录
      // Use project-specific data directory
      const sanitizedProjectName = currentProject
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_+|_+$/g, '')
        .substring(0, 100);

      if (process.env.DATA_DIR && path.isAbsolute(process.env.DATA_DIR)) {
        const projectDataDir = path.join(process.env.DATA_DIR, sanitizedProjectName);
        cachedDataDir = projectDataDir;
        lastRootsCall = now;
        return cachedDataDir;
      }
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
        // 緩存結果
        // Cache the result
        cachedDataDir = finalPath;
        lastRootsCall = now;
        return finalPath;
      } else {
        // 如果沒有 rootPath，直接返回 DATA_DIR
        // If there's no rootPath, return DATA_DIR directly
        cachedDataDir = process.env.DATA_DIR;
        lastRootsCall = now;
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
        cachedDataDir = finalPath;
        lastRootsCall = now;
        return finalPath;
      }
    }
  }

  // 如果沒有 DATA_DIR，使用預設邏輯
  // If there's no DATA_DIR, use default logic
  let finalPath: string;
  if (rootPath) {
    finalPath = path.join(rootPath, "data");
  } else {
    // 最後回退到專案根目錄
    // Finally fall back to project root directory
    finalPath = path.join(PROJECT_ROOT, "data");
  }

  // 緩存結果
  // Cache the result
  cachedDataDir = finalPath;
  lastRootsCall = now;

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
 * 當需要強制重新計算路徑時調用此函數
 * Call this function when you need to force recalculation of paths
 */
export function clearPathCache(): void {
  cachedDataDir = null;
  lastRootsCall = 0;
  ProjectSession.clearCache();
}
