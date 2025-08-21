/**
 * 项目根目录检测工具
 * Project Root Directory Detection Utility
 * 
 * 解决多项目环境和工作目录依赖性问题
 * Solves multi-project environment and working directory dependency issues
 */

import * as path from 'path';
import * as fs from 'fs';

export interface ProjectRootOptions {
  /** 起始搜索目录，默认为当前工作目录 */
  startDir?: string;
  /** 最大搜索深度，防止无限循环 */
  maxDepth?: number;
  /** 项目标识文件，默认为 package.json */
  projectMarkers?: string[];
  /** 是否启用调试输出 */
  debug?: boolean;
}

export class ProjectRootDetector {
  private static instance: ProjectRootDetector;
  private cache = new Map<string, string>();

  public static getInstance(): ProjectRootDetector {
    if (!ProjectRootDetector.instance) {
      ProjectRootDetector.instance = new ProjectRootDetector();
    }
    return ProjectRootDetector.instance;
  }

  /**
   * 查找项目根目录
   * Find project root directory
   */
  public findProjectRoot(options: ProjectRootOptions = {}): string {
    const {
      startDir = process.cwd(),
      maxDepth = 10,
      projectMarkers = ['package.json'],
      debug = false
    } = options;

    // 🔧 MCP聚合环境适配：智能检测项目根目录
    // MCP Aggregation Environment Adaptation: Intelligent project root detection
    const expectedProjectName = 'mcp-shrimp-task-manager';
    const resolvedStartDir = path.resolve(startDir);
    
    // 策略1：检查环境变量中的明确路径指示
    // Strategy 1: Check environment variables for explicit path indication
    if (process.env.MCP_PROJECT_ROOT && fs.existsSync(process.env.MCP_PROJECT_ROOT)) {
      const envProjectRoot = path.resolve(process.env.MCP_PROJECT_ROOT);
      if (fs.existsSync(path.join(envProjectRoot, 'package.json'))) {
        if (debug) console.log(`🔍 [ProjectRoot] Using MCP_PROJECT_ROOT: ${envProjectRoot}`);
        this.cache.set(`${startDir}:${projectMarkers.join(',')}`, envProjectRoot);
        return envProjectRoot;
      }
    }
    
    // 策略2：从命令行参数推断项目路径
    // Strategy 2: Infer project path from command line arguments
    if (process.argv && process.argv.length > 0) {
      const scriptPath = process.argv[1];
      if (scriptPath && scriptPath.includes(expectedProjectName)) {
        // 从脚本路径推断项目根目录
        const scriptDir = path.dirname(scriptPath);
        let candidateRoot = scriptDir;
        
        // 向上查找直到找到包含 package.json 的目录
        while (candidateRoot !== path.dirname(candidateRoot)) {
          if (fs.existsSync(path.join(candidateRoot, 'package.json'))) {
            const packageJson = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'package.json'), 'utf-8'));
            if (packageJson.name === expectedProjectName) {
              if (debug) console.log(`🔍 [ProjectRoot] Inferred from script path: ${candidateRoot}`);
              this.cache.set(`${startDir}:${projectMarkers.join(',')}`, candidateRoot);
              return candidateRoot;
            }
          }
          candidateRoot = path.dirname(candidateRoot);
        }
      }
    }
    
    // 策略3：如果当前目录不包含期望的项目名，尝试查找
    // Strategy 3: If current directory doesn't contain expected project name, try to find it
    if (!resolvedStartDir.includes(expectedProjectName)) {
      // 尝试在常见位置查找项目
      const commonPaths = [
        'E:\\MCP\\mcp-shrimp-task-manager',
        'D:\\MCP\\mcp-shrimp-task-manager',
        'C:\\MCP\\mcp-shrimp-task-manager',
        path.join(process.env.USERPROFILE || '', 'MCP', 'mcp-shrimp-task-manager'),
        // 添加相对于当前工作目录的搜索
        path.join(process.cwd(), '..', 'mcp-shrimp-task-manager'),
        path.join(process.cwd(), 'mcp-shrimp-task-manager'),
      ];
      
      for (const commonPath of commonPaths) {
        if (fs.existsSync(commonPath) && fs.existsSync(path.join(commonPath, 'package.json'))) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(commonPath, 'package.json'), 'utf-8'));
            if (packageJson.name === expectedProjectName) {
              if (debug) console.log(`🔍 [ProjectRoot] Found expected project at: ${commonPath}`);
              this.cache.set(`${startDir}:${projectMarkers.join(',')}`, commonPath);
              return commonPath;
            }
          } catch (error) {
            // 忽略 JSON 解析错误，继续查找
            continue;
          }
        }
      }
    }

    // 检查缓存
    const cacheKey = `${startDir}:${projectMarkers.join(',')}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (debug) console.log(`🔄 [ProjectRoot] Using cached result: ${cached}`);
      return cached;
    }

    if (debug) console.log(`🔍 [ProjectRoot] Starting search from: ${startDir}`);

    let currentDir = path.resolve(startDir);
    let iterations = 0;

    while (currentDir !== path.dirname(currentDir) && iterations < maxDepth) {
      if (debug) console.log(`📁 [ProjectRoot] Checking: ${currentDir}`);

      // 检查是否包含项目标识文件
      for (const marker of projectMarkers) {
        const markerPath = path.join(currentDir, marker);
        if (fs.existsSync(markerPath)) {
          if (debug) console.log(`✅ [ProjectRoot] Found ${marker} at: ${currentDir}`);
          
          // 缓存结果
          this.cache.set(cacheKey, currentDir);
          return currentDir;
        }
      }

      currentDir = path.dirname(currentDir);
      iterations++;
    }

    if (debug) {
      console.log(`⚠️ [ProjectRoot] No project root found after ${iterations} iterations`);
      console.log(`📁 [ProjectRoot] Falling back to start directory: ${startDir}`);
    }

    // 回退到起始目录
    this.cache.set(cacheKey, startDir);
    return startDir;
  }

  /**
   * 解析相对于项目根目录的文件路径
   * Resolve file path relative to project root
   */
  public resolveProjectFile(filePath: string, options: ProjectRootOptions = {}): string {
    const projectRoot = this.findProjectRoot(options);
    
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    
    return path.resolve(projectRoot, filePath);
  }

  /**
   * 验证项目根目录的有效性
   * Validate project root directory
   */
  public validateProjectRoot(projectRoot: string, options: ProjectRootOptions = {}): boolean {
    const { projectMarkers = ['package.json'] } = options;
    
    for (const marker of projectMarkers) {
      if (fs.existsSync(path.join(projectRoot, marker))) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 获取项目信息
   * Get project information
   */
  public getProjectInfo(options: ProjectRootOptions = {}): {
    root: string;
    name?: string;
    version?: string;
    hasTypeScript: boolean;
    hasESLint: boolean;
    hasPrettier: boolean;
  } {
    const root = this.findProjectRoot(options);
    const packageJsonPath = path.join(root, 'package.json');
    
    let name: string | undefined;
    let version: string | undefined;
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        name = packageJson.name;
        version = packageJson.version;
      } catch (error) {
        // 忽略 JSON 解析错误
      }
    }
    
    return {
      root,
      name,
      version,
      hasTypeScript: fs.existsSync(path.join(root, 'tsconfig.json')),
      hasESLint: fs.existsSync(path.join(root, '.eslintrc.js')) || 
                 fs.existsSync(path.join(root, '.eslintrc.json')) ||
                 fs.existsSync(path.join(root, 'eslint.config.js')),
      hasPrettier: fs.existsSync(path.join(root, '.prettierrc')) ||
                   fs.existsSync(path.join(root, '.prettierrc.json')) ||
                   fs.existsSync(path.join(root, 'prettier.config.js'))
    };
  }

  /**
   * 处理多项目环境
   * Handle multi-project environments
   */
  public findNearestProject(filePath: string, options: ProjectRootOptions = {}): string {
    const fileDir = path.isAbsolute(filePath) ? path.dirname(filePath) : path.dirname(path.resolve(filePath));
    
    return this.findProjectRoot({
      ...options,
      startDir: fileDir
    });
  }

  /**
   * 清除缓存
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 导出单例实例
export const projectRootDetector = ProjectRootDetector.getInstance();

// 便捷函数
export function findProjectRoot(options?: ProjectRootOptions): string {
  return projectRootDetector.findProjectRoot(options);
}

export function resolveProjectFile(filePath: string, options?: ProjectRootOptions): string {
  return projectRootDetector.resolveProjectFile(filePath, options);
}

export function getProjectInfo(options?: ProjectRootOptions) {
  return projectRootDetector.getProjectInfo(options);
}