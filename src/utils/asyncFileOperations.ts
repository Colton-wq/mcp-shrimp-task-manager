/**
 * 异步文件操作工具类
 * Async File Operations Utility
 * 
 * 提供高性能的异步文件操作，支持并行处理和缓存
 * Provides high-performance async file operations with parallel processing and caching
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectRootDetector } from './projectRoot.js';

/**
 * 文件信息接口
 */
export interface FileInfo {
  path: string;
  size: number;
  mtime: Date;
  isDirectory: boolean;
  content?: string;
}

/**
 * 文件缓存项
 */
interface CacheItem {
  content: string;
  mtime: number;
  size: number;
}

/**
 * 异步文件操作类
 * 🚀 v2.0: 集成智能策略选择器，自动优化性能
 */
export class AsyncFileOperations {
  private static fileCache = new Map<string, CacheItem>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  
  // 🎯 性能优化: 智能策略选择器集成
  private static smartOps: any = null; // 延迟加载避免循环依赖
  private static readonly MAX_CACHE_SIZE = 100; // 最大缓存文件数

  /**
   * 异步读取文件内容（带缓存）
   */
  static async readFileWithCache(filePath: string): Promise<string> {
    try {
      const stats = await fs.promises.stat(filePath);
      const cacheKey = path.resolve(filePath);
      const cached = this.fileCache.get(cacheKey);

      // 检查缓存是否有效
      if (cached && cached.mtime === stats.mtime.getTime() && cached.size === stats.size) {
        return cached.content;
      }

      // 读取文件内容
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 更新缓存
      this.updateCache(cacheKey, {
        content,
        mtime: stats.mtime.getTime(),
        size: stats.size
      });

      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 🎯 智能批量文件读取 - 自动选择最优策略
   */
  static async readMultipleFilesIntelligent(filePaths: string[]): Promise<Map<string, string>> {
    // 延迟加载智能操作器避免循环依赖
    if (!this.smartOps) {
      try {
        const { SmartFileOperations } = await import('./smartFileOperations.js');
        this.smartOps = SmartFileOperations.getInstance();
      } catch (error) {
        console.warn('SmartFileOperations not available, falling back to traditional async');
        return this.readMultipleFiles(filePaths);
      }
    }
    
    return await this.smartOps.readFiles(filePaths);
  }

  /**
   * 批量异步读取文件 (传统方法)
   */
  static async readMultipleFiles(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // 并行读取文件，但限制并发数
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          const content = await this.readFileWithCache(filePath);
          return { filePath, content, success: true };
        } catch (error) {
          console.warn(`Failed to read file ${filePath}:`, error);
          return { filePath, content: '', success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result.success) {
          results.set(result.filePath, result.content);
        }
      }
    }

    return results;
  }

  /**
   * 异步扫描目录
   */
  static async scanDirectory(dirPath: string, options: {
    recursive?: boolean;
    includeFiles?: boolean;
    includeDirectories?: boolean;
    filter?: (item: string) => boolean;
  } = {}): Promise<FileInfo[]> {
    const {
      recursive = true,
      includeFiles = true,
      includeDirectories = false,
      filter = () => true
    } = options;

    const results: FileInfo[] = [];

    const scanDir = async (currentPath: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentPath);
        
        // 并行处理目录项
        const itemPromises = items.map(async (item) => {
          if (!filter(item)) return;

          const itemPath = path.join(currentPath, item);
          
          try {
            const stats = await fs.promises.stat(itemPath);
            
            const fileInfo: FileInfo = {
              path: itemPath,
              size: stats.size,
              mtime: stats.mtime,
              isDirectory: stats.isDirectory()
            };

            if (stats.isFile() && includeFiles) {
              results.push(fileInfo);
            } else if (stats.isDirectory()) {
              if (includeDirectories) {
                results.push(fileInfo);
              }
              
              if (recursive && !this.isSystemDirectory(item)) {
                await scanDir(itemPath);
              }
            }
          } catch (error) {
            console.warn(`Failed to stat ${itemPath}:`, error);
          }
        });

        await Promise.all(itemPromises);
      } catch (error) {
        console.warn(`Failed to read directory ${currentPath}:`, error);
      }
    };

    await scanDir(dirPath);
    return results;
  }

  /**
   * 异步获取文件统计信息
   */
  static async getFileStats(filePaths: string[]): Promise<Map<string, fs.Stats>> {
    const results = new Map<string, fs.Stats>();
    
    const batchSize = 20;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          const stats = await fs.promises.stat(filePath);
          return { filePath, stats, success: true };
        } catch (error) {
          return { filePath, stats: null, success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result.success && result.stats) {
          results.set(result.filePath, result.stats);
        }
      }
    }

    return results;
  }

  /**
   * 检查文件是否存在（批量）- 增强版
   */
  static async checkFilesExist(filePaths: string[], projectRoot?: string): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // 增强的路径验证和安全检查
    console.log(`🔍 开始文件存在性检查，输入路径数量: ${filePaths.length}`);
    console.log(`📋 输入路径列表:`, filePaths);
    
    const validPaths = filePaths.filter(filePath => {
      const isValid = this.validatePathSecurity(filePath);
      if (!isValid) {
        console.log(`❌ 路径安全验证失败: ${filePath}`);
      }
      return isValid;
    });
    
    console.log(`✅ 通过安全验证的路径数量: ${validPaths.length}`);
    
    if (validPaths.length === 0) {
      console.log(`⚠️ 没有有效路径，返回空结果`);
      return results;
    }
    
    // 动态批次大小优化
    const batchSize = Math.min(50, Math.max(10, Math.floor(validPaths.length / 4)));
    
    for (let i = 0; i < validPaths.length; i += batchSize) {
      const batch = validPaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath) => {
        try {
          // 路径规范化处理
          const normalizedPath = this.normalizePath(filePath, projectRoot);
          console.log(`🔄 路径规范化: ${filePath} → ${normalizedPath}`);
          
          // 使用 fs.promises.access 进行高效检查 - 2024最佳实践
          // 这比 fs.existsSync 更高效，且不会阻塞事件循环
          const checkPromise = fs.promises.access(normalizedPath, fs.constants.F_OK).then(() => {
            console.log(`✅ 文件存在: ${normalizedPath}`);
            return { 
              filePath: normalizedPath, 
              exists: true,
              error: null 
            };
          });
          
          return await checkPromise;
        } catch (error) {
          const errorType = this.classifyFileError(error);
          console.log(`❌ 文件检查失败: ${filePath} - ${this.getErrorMessage(errorType)}`);
          return { 
            filePath, 
            exists: false, 
            error: errorType 
          };
        }
      });

      try {
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          results.set(result.filePath, result.exists);
        }
      } catch (error) {
        console.error('批量文件检查失败:', error);
        // 如果批量检查失败，将所有文件标记为不存在
        for (const filePath of batch) {
          results.set(filePath, false);
        }
      }
    }

    return results;
  }

  /**
   * 路径安全验证
   */
  static validatePathSecurity(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') return false;
    
    const trimmedPath = filePath.trim();
    if (trimmedPath.length === 0) return false;
    
    // 检查路径长度限制
    if (trimmedPath.length > 260) return false; // Windows路径限制
    
    // 防止路径穿越攻击
    const normalizedPath = path.normalize(trimmedPath);
    if (normalizedPath.includes('..') && normalizedPath.includes('/..')) return false;
    
    // 检查危险字符
    const dangerousChars = /[\x00-\x1f<>:"|?*]/;
    if (dangerousChars.test(trimmedPath)) return false;
    
    // 排除明显的恶意路径
    const maliciousPatterns = [
      /^\/etc\/passwd/i,
      /^\/proc\//i,
      /^\/sys\//i,
      /^C:\\Windows\\System32/i
    ];
    
    if (maliciousPatterns.some(pattern => pattern.test(normalizedPath))) {
      console.warn(`🚨 安全警告: 拒绝访问敏感路径 ${trimmedPath}`);
      return false;
    }
    
    return true;
  }

  /**
   * 路径规范化处理 - 跨平台兼容的最佳实践
   * Cross-platform path normalization using 2024 best practices
   */
  static normalizePath(filePath: string, projectRoot?: string): string {
    // 处理相对路径 - 使用可靠的项目根目录检测
    if (!path.isAbsolute(filePath)) {
      const baseDir = projectRoot || ProjectRootDetector.getProjectRoot();
      // 使用 path.resolve 确保跨平台兼容性
      // path.resolve 自动处理 Windows 反斜杠和 POSIX 正斜杠
      const resolvedPath = path.resolve(baseDir, filePath);
      console.log(`🔄 路径规范化: ${filePath} → ${resolvedPath} (基于: ${baseDir})`);
      return resolvedPath;
    }
    
    // 对于绝对路径，使用 path.normalize 处理 .. 和 . 以及多重斜杠
    // path.normalize 自动处理平台差异
    const normalizedPath = path.normalize(filePath);
    console.log(`🔄 绝对路径规范化: ${filePath} → ${normalizedPath}`);
    return normalizedPath;
  }

  /**
   * 获取最优超时时间
   */
  static getOptimalTimeout(filePath: string): number {
    // 网络路径使用更长超时
    if (filePath.startsWith('\\\\') || filePath.startsWith('//')) {
      return 10000; // 10秒
    }
    
    // 本地路径使用较短超时
    return 3000; // 3秒
  }

  /**
   * 文件错误分类
   */
  static classifyFileError(error: any): string {
    if (!error) return 'UNKNOWN';
    
    if (error.message === 'TIMEOUT') return 'TIMEOUT';
    
    if (error.code) {
      switch (error.code) {
        case 'ENOENT': return 'NOT_EXISTS';
        case 'EACCES': return 'PERMISSION_DENIED';
        case 'EPERM': return 'PERMISSION_DENIED';
        case 'ENOTDIR': return 'INVALID_PATH';
        case 'EISDIR': return 'IS_DIRECTORY';
        default: return `SYSTEM_ERROR_${error.code}`;
      }
    }
    
    return 'UNKNOWN';
  }

  /**
   * 获取用户友好的错误消息
   */
  static getErrorMessage(errorType: string): string {
    const messages: Record<string, string> = {
      'NOT_EXISTS': '文件不存在',
      'PERMISSION_DENIED': '权限不足',
      'TIMEOUT': '检查超时',
      'INVALID_PATH': '路径无效',
      'IS_DIRECTORY': '是目录而非文件',
      'UNKNOWN': '未知错误'
    };
    
    return messages[errorType] || `系统错误: ${errorType}`;
  }

  /**
   * 查找特定类型的文件
   */
  static async findFiles(
    rootPath: string, 
    extensions: string[], 
    options: {
      maxDepth?: number;
      excludePatterns?: string[];
      includeHidden?: boolean;
    } = {}
  ): Promise<string[]> {
    const { maxDepth = 10, excludePatterns = [], includeHidden = false } = options;
    const results: string[] = [];

    const shouldExclude = (filePath: string): boolean => {
      return excludePatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(filePath);
      });
    };

    const findInDir = async (dirPath: string, currentDepth: number): Promise<void> => {
      if (currentDepth > maxDepth) return;

      try {
        const items = await fs.promises.readdir(dirPath);
        
        const itemPromises = items.map(async (item) => {
          if (!includeHidden && item.startsWith('.')) return;
          
          const itemPath = path.join(dirPath, item);
          
          if (shouldExclude(itemPath)) return;

          try {
            const stats = await fs.promises.stat(itemPath);
            
            if (stats.isFile()) {
              const ext = path.extname(item).toLowerCase();
              if (extensions.includes(ext)) {
                results.push(itemPath);
              }
            } else if (stats.isDirectory() && !this.isSystemDirectory(item)) {
              await findInDir(itemPath, currentDepth + 1);
            }
          } catch (error) {
            // 忽略无法访问的文件
          }
        });

        await Promise.all(itemPromises);
      } catch (error) {
        // 忽略无法访问的目录
      }
    };

    await findInDir(rootPath, 0);
    return results;
  }

  /**
   * 更新缓存
   */
  private static updateCache(key: string, item: CacheItem): void {
    // 如果缓存已满，删除最旧的项
    if (this.fileCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.fileCache.keys().next().value;
      if (firstKey) {
        this.fileCache.delete(firstKey);
      }
    }

    this.fileCache.set(key, item);
  }

  /**
   * 清理过期缓存
   */
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.fileCache.entries()) {
      if (now - item.mtime > this.CACHE_TTL) {
        this.fileCache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  static clearAllCache(): void {
    this.fileCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.fileCache.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  /**
   * 检查是否为系统目录
   */
  static isSystemDirectory(dirName: string): boolean {
    const systemDirs = [
      'node_modules', '.git', '.svn', '.hg',
      'dist', 'build', 'coverage', '.nyc_output',
      'logs', 'tmp', 'temp', '.cache'
    ];
    return systemDirs.includes(dirName) || dirName.startsWith('.');
  }
}

/**
 * 进度回调接口
 */
export interface ProgressCallback {
  (current: number, total: number, currentFile?: string): void;
}

/**
 * 带进度反馈的文件操作
 */
export class ProgressiveFileOperations extends AsyncFileOperations {
  /**
   * 带进度的批量文件读取
   */
  static async readMultipleFilesWithProgress(
    filePaths: string[], 
    onProgress?: ProgressCallback
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const total = filePaths.length;
    
    const batchSize = 5;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (filePath, index) => {
        try {
          const content = await this.readFileWithCache(filePath);
          
          // 报告进度
          if (onProgress) {
            onProgress(i + index + 1, total, filePath);
          }
          
          return { filePath, content, success: true };
        } catch (error) {
          console.warn(`Failed to read file ${filePath}:`, error);
          return { filePath, content: '', success: false };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const result of batchResults) {
        if (result.success) {
          results.set(result.filePath, result.content);
        }
      }
    }

    return results;
  }

  /**
   * 带进度的目录扫描
   */
  static async scanDirectoryWithProgress(
    dirPath: string,
    onProgress?: ProgressCallback,
    options: {
      recursive?: boolean;
      includeFiles?: boolean;
      includeDirectories?: boolean;
      filter?: (item: string) => boolean;
    } = {}
  ): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    let processedCount = 0;
    let totalEstimate = 0;

    // 首先估算总数
    const estimateTotal = async (path: string, depth: number = 0): Promise<number> => {
      if (depth > 5) return 0; // 限制估算深度
      
      try {
        const items = await fs.promises.readdir(path);
        let count = items.length;
        
        for (const item of items.slice(0, 10)) { // 只检查前10个项目进行估算
          const itemPath = path + '/' + item;
          try {
            const stats = await fs.promises.stat(itemPath);
            if (stats.isDirectory() && options.recursive !== false) {
              count += await estimateTotal(itemPath, depth + 1);
            }
          } catch {
            // 忽略错误
          }
        }
        
        return count;
      } catch {
        return 0;
      }
    };

    totalEstimate = await estimateTotal(dirPath);

    const scanDir = async (currentPath: string): Promise<void> => {
      try {
        const items = await fs.promises.readdir(currentPath);
        
        for (const item of items) {
          processedCount++;
          
          if (onProgress) {
            onProgress(processedCount, totalEstimate, currentPath);
          }

          if (options.filter && !options.filter(item)) continue;

          const itemPath = path.join(currentPath, item);
          
          try {
            const stats = await fs.promises.stat(itemPath);
            
            const fileInfo: FileInfo = {
              path: itemPath,
              size: stats.size,
              mtime: stats.mtime,
              isDirectory: stats.isDirectory()
            };

            if (stats.isFile() && options.includeFiles !== false) {
              results.push(fileInfo);
            } else if (stats.isDirectory()) {
              if (options.includeDirectories) {
                results.push(fileInfo);
              }
              
              if (options.recursive !== false && !AsyncFileOperations.isSystemDirectory(item)) {
                await scanDir(itemPath);
              }
            }
          } catch (error) {
            console.warn(`Failed to stat ${itemPath}:`, error);
          }
        }
      } catch (error) {
        console.warn(`Failed to read directory ${currentPath}:`, error);
      }
    };

    await scanDir(dirPath);
    return results;
  }
}