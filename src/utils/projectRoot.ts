import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PathUtils } from './pathUtils.js';

/**
 * 项目根目录检测工具
 * 提供可靠的项目根目录检测，适用于各种运行环境
 */
export class ProjectRootDetector {
  private static cachedRoot: string | null = null;

  /**
   * 获取项目根目录
   * 优先级：环境变量 > package.json检测 > 固定路径 > 当前工作目录
   */
  static getProjectRoot(): string {
    if (this.cachedRoot) {
      return this.cachedRoot;
    }

    // 1. 优先使用环境变量
    if (process.env.PROJECT_ROOT && fs.existsSync(process.env.PROJECT_ROOT)) {
      this.cachedRoot = path.resolve(process.env.PROJECT_ROOT);
      console.log(`📁 使用环境变量项目根目录: ${this.cachedRoot}`);
      return this.cachedRoot;
    }

    // 2. 基于package.json向上查找项目根目录
    const packageJsonRoot = this.findPackageJsonRoot();
    if (packageJsonRoot) {
      this.cachedRoot = packageJsonRoot;
      console.log(`📁 通过package.json检测到项目根目录: ${this.cachedRoot}`);
      return this.cachedRoot;
    }

    // 3. 基于已知的项目特征文件检测
    const knownRoot = this.detectByKnownFiles();
    if (knownRoot) {
      this.cachedRoot = knownRoot;
      console.log(`📁 通过特征文件检测到项目根目录: ${this.cachedRoot}`);
      return this.cachedRoot;
    }

    // 4. 使用固定的已知路径（适用于MCP环境）
    const fixedPath = 'E:\\MCP\\mcp-shrimp-task-manager';
    if (fs.existsSync(fixedPath)) {
      this.cachedRoot = fixedPath;
      console.log(`📁 使用固定项目路径: ${this.cachedRoot}`);
      return this.cachedRoot;
    }

    // 5. 最后回退到当前工作目录
    this.cachedRoot = process.cwd();
    console.log(`📁 回退到当前工作目录: ${this.cachedRoot}`);
    return this.cachedRoot;
  }

  /**
   * 向上查找包含package.json的目录
   */
  private static findPackageJsonRoot(): string | null {
    // 在ES模块中获取当前目录 - 使用PathUtils确保跨平台兼容性
    let currentDir = PathUtils.getCurrentModuleDir(import.meta.url);
    
    // 从当前文件位置开始向上查找
    for (let i = 0; i < 10; i++) { // 最多向上查找10层
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          // 确认这是我们的项目
          if (packageJson.name === 'mcp-shrimp-task-manager' || 
              packageJson.name === 'shrimp-task-manager') {
            return currentDir;
          }
        } catch (error) {
          // 忽略JSON解析错误，继续查找
        }
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) break; // 已到根目录
      currentDir = parentDir;
    }
    
    return null;
  }

  /**
   * 基于已知特征文件检测项目根目录
   */
  private static detectByKnownFiles(): string | null {
    // 在ES模块中获取当前目录 - 使用PathUtils确保跨平台兼容性
    const currentDir = PathUtils.getCurrentModuleDir(import.meta.url);
    
    const possibleRoots = [
      // 基于当前文件位置推断的可能路径 - 使用PathUtils确保跨平台兼容性
      PathUtils.resolveAbsolute(currentDir, '../../../'),
      PathUtils.resolveAbsolute(currentDir, '../../'),
      PathUtils.resolveAbsolute(currentDir, '../'),
      // 基于process.cwd()的可能路径
      process.cwd(),
      PathUtils.resolveAbsolute(process.cwd(), '../'),
      PathUtils.resolveAbsolute(process.cwd(), '../../'),
    ];

    for (const rootPath of possibleRoots) {
      if (this.isProjectRoot(rootPath)) {
        return rootPath;
      }
    }

    return null;
  }

  /**
   * 检查目录是否为项目根目录
   */
  private static isProjectRoot(dirPath: string): boolean {
    if (!fs.existsSync(dirPath)) return false;

    // 检查特征文件
    const requiredFiles = ['package.json', 'tsconfig.json'];
    const optionalFiles = ['src', 'dist', 'README.md'];

    // 所有必需文件都必须存在
    for (const file of requiredFiles) {
      if (!fs.existsSync(path.join(dirPath, file))) {
        return false;
      }
    }

    // 至少一个可选文件存在
    const hasOptionalFile = optionalFiles.some(file => 
      fs.existsSync(path.join(dirPath, file))
    );

    return hasOptionalFile;
  }

  /**
   * 重置缓存（用于测试）
   */
  static resetCache(): void {
    this.cachedRoot = null;
  }

  /**
   * 获取相对于项目根目录的绝对路径
   */
  static resolveProjectPath(relativePath: string): string {
    const projectRoot = this.getProjectRoot();
    return PathUtils.resolveAbsolute(projectRoot, relativePath);
  }

  /**
   * 检查文件是否在项目目录内
   */
  static isWithinProject(filePath: string): boolean {
    const projectRoot = this.getProjectRoot();
    return PathUtils.isPathWithin(filePath, projectRoot);
  }
}