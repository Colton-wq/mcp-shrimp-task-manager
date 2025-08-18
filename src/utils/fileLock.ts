/**
 * File locking utility for MCP Shrimp Task Manager
 * 
 * Provides atomic file operations using Node.js native APIs to prevent
 * concurrent access conflicts in multi-Agent environments.
 * 
 * Based on .lock file strategy which works atomically on any file system,
 * including network-based ones.
 */

import fs from "fs/promises";
import path from "path";

/**
 * File lock options configuration
 * 文件锁定选项配置
 */
export interface FileLockOptions {
  /** Lock timeout in milliseconds / 锁定超时时间（毫秒） */
  timeout?: number;
  /** Retry interval in milliseconds / 重试间隔（毫秒） */
  retryInterval?: number;
  /** Maximum retry attempts / 最大重试次数 */
  maxRetries?: number;
  /** Lock file suffix / 锁文件后缀 */
  lockSuffix?: string;
}

/**
 * Default file lock options
 * 默认文件锁定选项
 */
const DEFAULT_OPTIONS: Required<FileLockOptions> = {
  timeout: 10000, // 10 seconds / 10秒
  retryInterval: 100, // 100ms
  maxRetries: 100, // 100 retries = 10 seconds max wait / 100次重试 = 最多等待10秒
  lockSuffix: ".lock"
};

/**
 * File lock error class
 * 文件锁定错误类
 */
export class FileLockError extends Error {
  constructor(message: string, public readonly lockPath: string) {
    super(message);
    this.name = "FileLockError";
  }
}

/**
 * File lock timeout error class
 * 文件锁定超时错误类
 */
export class FileLockTimeoutError extends FileLockError {
  constructor(lockPath: string, timeout: number) {
    super(`File lock timeout after ${timeout}ms: ${lockPath}`, lockPath);
    this.name = "FileLockTimeoutError";
  }
}

/**
 * Generate lock file path for a given file
 * 为给定文件生成锁文件路径
 * 
 * @param filePath Original file path / 原始文件路径
 * @param lockSuffix Lock file suffix / 锁文件后缀
 * @returns Lock file path / 锁文件路径
 */
function getLockPath(filePath: string, lockSuffix: string): string {
  return filePath + lockSuffix;
}

/**
 * Acquire a file lock by creating a lock file
 * 通过创建锁文件获取文件锁
 * 
 * @param lockPath Lock file path / 锁文件路径
 * @returns True if lock acquired, false if already locked / 如果获取锁返回true，如果已被锁定返回false
 */
async function tryAcquireLock(lockPath: string): Promise<boolean> {
  try {
    // Use fs.open with 'wx' flag for atomic creation
    // 使用fs.open的'wx'标志进行原子创建
    const fileHandle = await fs.open(lockPath, 'wx');
    
    // Write process info to lock file for debugging
    // 将进程信息写入锁文件以便调试
    const os = await import('os');
    const lockInfo = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      hostname: os.hostname()
    };
    
    await fileHandle.writeFile(JSON.stringify(lockInfo, null, 2));
    await fileHandle.close();
    
    return true;
  } catch (error: any) {
    if (error.code === 'EEXIST') {
      // Lock file already exists, lock is held by another process
      // 锁文件已存在，锁被其他进程持有
      return false;
    }
    // Other errors (permission, disk space, etc.)
    // 其他错误（权限、磁盘空间等）
    throw new FileLockError(`Failed to acquire lock: ${error.message}`, lockPath);
  }
}

/**
 * Release a file lock by removing the lock file
 * 通过删除锁文件释放文件锁
 * 
 * @param lockPath Lock file path / 锁文件路径
 */
async function releaseLock(lockPath: string): Promise<void> {
  try {
    await fs.unlink(lockPath);
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      // Ignore "file not found" errors, but throw others
      // 忽略"文件未找到"错误，但抛出其他错误
      throw new FileLockError(`Failed to release lock: ${error.message}`, lockPath);
    }
  }
}

/**
 * Wait for a file lock with retry mechanism
 * 使用重试机制等待文件锁
 * 
 * @param lockPath Lock file path / 锁文件路径
 * @param options Lock options / 锁定选项
 * @returns Promise that resolves when lock is acquired / 获取锁时解析的Promise
 */
async function waitForLock(lockPath: string, options: Required<FileLockOptions>): Promise<void> {
  const startTime = Date.now();
  let retries = 0;

  while (retries < options.maxRetries) {
    const acquired = await tryAcquireLock(lockPath);
    if (acquired) {
      return;
    }

    // Check timeout
    // 检查超时
    const elapsed = Date.now() - startTime;
    if (elapsed >= options.timeout) {
      throw new FileLockTimeoutError(lockPath, options.timeout);
    }

    // Wait before retry
    // 重试前等待
    await new Promise(resolve => setTimeout(resolve, options.retryInterval));
    retries++;
  }

  throw new FileLockTimeoutError(lockPath, options.timeout);
}

/**
 * Check if a lock file is stale (process no longer exists)
 * 检查锁文件是否过期（进程不再存在）
 * 
 * @param lockPath Lock file path / 锁文件路径
 * @returns True if lock is stale / 如果锁过期返回true
 */
async function isLockStale(lockPath: string): Promise<boolean> {
  try {
    const lockContent = await fs.readFile(lockPath, 'utf-8');
    const lockInfo = JSON.parse(lockContent);
    
    // Check if process still exists (Unix/Linux only)
    // 检查进程是否仍然存在（仅Unix/Linux）
    if (process.platform !== 'win32' && lockInfo.pid) {
      try {
        // process.kill with signal 0 checks if process exists without killing it
        // process.kill使用信号0检查进程是否存在而不杀死它
        process.kill(lockInfo.pid, 0);
        return false; // Process exists
      } catch (error) {
        return true; // Process doesn't exist
      }
    }
    
    // On Windows or if no PID, consider lock valid for safety
    // 在Windows上或没有PID时，为安全起见认为锁有效
    return false;
  } catch (error) {
    // If we can't read the lock file, consider it stale
    // 如果无法读取锁文件，认为它过期
    return true;
  }
}

/**
 * Clean up stale lock files
 * 清理过期的锁文件
 * 
 * @param lockPath Lock file path / 锁文件路径
 */
async function cleanupStaleLock(lockPath: string): Promise<void> {
  const stale = await isLockStale(lockPath);
  if (stale) {
    await releaseLock(lockPath);
  }
}

/**
 * High-order function that wraps file operations with locking
 * 包装文件操作的高阶函数，提供锁定机制
 * 
 * @param filePath Path to the file to lock / 要锁定的文件路径
 * @param operation Function to execute while holding the lock / 持有锁时执行的函数
 * @param options Lock options / 锁定选项
 * @returns Result of the operation / 操作结果
 */
export async function withFileLock<T>(
  filePath: string,
  operation: () => Promise<T>,
  options: FileLockOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lockPath = getLockPath(filePath, opts.lockSuffix);

  // Clean up any stale locks first
  // 首先清理任何过期的锁
  try {
    await cleanupStaleLock(lockPath);
  } catch (error) {
    // Ignore cleanup errors, proceed with locking
    // 忽略清理错误，继续锁定过程
  }

  // Acquire the lock
  // 获取锁
  await waitForLock(lockPath, opts);

  try {
    // Execute the operation while holding the lock
    // 持有锁时执行操作
    return await operation();
  } finally {
    // Always release the lock, even if operation fails
    // 始终释放锁，即使操作失败
    try {
      await releaseLock(lockPath);
    } catch (error) {
      // Log error but don't throw to avoid masking original error
      // 记录错误但不抛出，以避免掩盖原始错误
      // Note: MCP servers should avoid console.log
      // 注意：MCP服务器应避免使用console.log
    }
  }
}

/**
 * Check if a file is currently locked
 * 检查文件是否当前被锁定
 * 
 * @param filePath Path to the file / 文件路径
 * @param lockSuffix Lock file suffix / 锁文件后缀
 * @returns True if file is locked / 如果文件被锁定返回true
 */
export async function isFileLocked(
  filePath: string, 
  lockSuffix: string = DEFAULT_OPTIONS.lockSuffix
): Promise<boolean> {
  const lockPath = getLockPath(filePath, lockSuffix);
  
  try {
    await fs.access(lockPath);
    // Lock file exists, check if it's stale
    // 锁文件存在，检查是否过期
    const stale = await isLockStale(lockPath);
    return !stale;
  } catch (error) {
    // Lock file doesn't exist
    // 锁文件不存在
    return false;
  }
}

/**
 * Force remove a lock file (use with caution)
 * 强制删除锁文件（谨慎使用）
 * 
 * @param filePath Path to the file / 文件路径
 * @param lockSuffix Lock file suffix / 锁文件后缀
 */
export async function forceUnlock(
  filePath: string,
  lockSuffix: string = DEFAULT_OPTIONS.lockSuffix
): Promise<void> {
  const lockPath = getLockPath(filePath, lockSuffix);
  await releaseLock(lockPath);
}
