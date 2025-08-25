import path from 'path';
import { fileURLToPath } from 'url';

/**
 * ES模块环境下的路径工具类
 * Path utilities for ES modules environment
 * 
 * 基于2024-2025年最佳实践，解决ES模块中的路径处理问题
 * Based on 2024-2025 best practices for path handling in ES modules
 */
export class PathUtils {
  
  /**
   * 获取当前模块的目录路径（ES模块版本的 __dirname）
   * Get current module directory path (ES module version of __dirname)
   */
  static getCurrentModuleDir(importMetaUrl: string): string {
    // 使用 fileURLToPath 确保跨平台兼容性
    // 这是处理 import.meta.url 的标准方法
    const currentFilePath = fileURLToPath(importMetaUrl);
    return path.dirname(currentFilePath);
  }

  /**
   * 获取当前模块的文件路径（ES模块版本的 __filename）
   * Get current module file path (ES module version of __filename)
   */
  static getCurrentModulePath(importMetaUrl: string): string {
    return fileURLToPath(importMetaUrl);
  }

  /**
   * 安全的路径连接，自动处理平台差异
   * Safe path joining with automatic platform handling
   */
  static safePath(...segments: string[]): string {
    // 过滤掉空字符串和null/undefined
    const validSegments = segments.filter(segment => 
      segment != null && typeof segment === 'string' && segment.trim().length > 0
    );
    
    if (validSegments.length === 0) {
      throw new Error('至少需要一个有效的路径段');
    }

    // 使用 path.join 自动处理平台差异
    return path.join(...validSegments);
  }

  /**
   * 跨平台的绝对路径解析
   * Cross-platform absolute path resolution
   */
  static resolveAbsolute(basePath: string, ...segments: string[]): string {
    // 确保基础路径是绝对路径
    const absoluteBase = path.isAbsolute(basePath) ? basePath : path.resolve(basePath);
    
    // 使用 path.resolve 确保结果是绝对路径
    return path.resolve(absoluteBase, ...segments);
  }

  /**
   * 规范化路径，处理 .. 和 . 以及多重分隔符
   * Normalize path, handling .. and . and multiple separators
   */
  static normalizePath(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('路径必须是非空字符串');
    }

    // path.normalize 自动处理平台差异
    return path.normalize(inputPath);
  }

  /**
   * 检查路径是否在指定目录内（安全检查）
   * Check if path is within specified directory (security check)
   */
  static isPathWithin(targetPath: string, containerDir: string): boolean {
    const normalizedTarget = path.resolve(targetPath);
    const normalizedContainer = path.resolve(containerDir);
    
    // 确保目标路径在容器目录内
    return normalizedTarget.startsWith(normalizedContainer + path.sep) || 
           normalizedTarget === normalizedContainer;
  }

  /**
   * 获取相对路径
   * Get relative path between two paths
   */
  static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * 解析路径信息
   * Parse path information
   */
  static parsePath(inputPath: string): path.ParsedPath {
    return path.parse(inputPath);
  }

  /**
   * 构建路径信息
   * Format path from parsed components
   */
  static formatPath(pathObject: path.FormatInputPathObject): string {
    return path.format(pathObject);
  }

  /**
   * 检查是否为绝对路径
   * Check if path is absolute
   */
  static isAbsolute(inputPath: string): boolean {
    return path.isAbsolute(inputPath);
  }

  /**
   * 获取文件扩展名
   * Get file extension
   */
  static getExtension(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * 获取文件名（不含扩展名）
   * Get filename without extension
   */
  static getBasename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  /**
   * 获取目录名
   * Get directory name
   */
  static getDirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 平台特定的路径分隔符
   * Platform-specific path separator
   */
  static get separator(): string {
    return path.sep;
  }

  /**
   * 平台特定的路径分隔符（用于环境变量）
   * Platform-specific path delimiter (for environment variables)
   */
  static get delimiter(): string {
    return path.delimiter;
  }

  /**
   * 转换为POSIX风格路径（用于URL等）
   * Convert to POSIX-style path (for URLs etc.)
   */
  static toPosix(inputPath: string): string {
    // 在Windows上将反斜杠转换为正斜杠
    return inputPath.split(path.sep).join(path.posix.sep);
  }

  /**
   * 从POSIX风格路径转换为平台路径
   * Convert from POSIX-style path to platform path
   */
  static fromPosix(posixPath: string): string {
    // 将正斜杠转换为平台特定的分隔符
    return posixPath.split(path.posix.sep).join(path.sep);
  }
}