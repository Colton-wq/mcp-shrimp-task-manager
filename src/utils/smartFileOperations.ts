/**
 * 智能文件操作策略选择器
 * Smart File Operations Strategy Selector
 * 
 * 基于文件大小、数量和操作类型智能选择同步或异步操作策略
 * 解决异步操作在小文件场景下性能比同步操作差298%的问题
 */

import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { AsyncFileOperations, FileInfo } from './asyncFileOperations.js';

/**
 * 操作策略类型
 */
export enum OperationStrategy {
  SYNC = 'sync',           // 同步操作 - 适合小文件
  ASYNC = 'async',         // 异步操作 - 适合大文件
  HYBRID = 'hybrid'        // 混合策略 - 智能选择
}

/**
 * 性能阈值配置
 */
export interface PerformanceThresholds {
  // 文件大小阈值 (字节)
  smallFileSize: number;      // < 1KB 使用同步
  mediumFileSize: number;     // 1KB-100KB 混合策略
  largeFileSize: number;      // > 100KB 使用异步
  
  // 文件数量阈值
  smallBatchSize: number;     // < 10 文件使用同步
  mediumBatchSize: number;    // 10-100 文件混合策略
  largeBatchSize: number;     // > 100 文件使用异步
  
  // 并发控制
  maxConcurrency: number;     // 最大并发数
  optimalBatchSize: number;   // 最优批处理大小
}

/**
 * 操作性能指标
 */
export interface PerformanceMetrics {
  strategy: OperationStrategy;
  duration: number;
  fileCount: number;
  totalSize: number;
  throughput: number;        // 文件/秒
  efficiency: number;        // MB/秒
}

/**
 * 智能文件操作管理器
 */
export class SmartFileOperations {
  private static instance: SmartFileOperations;
  private performanceHistory: PerformanceMetrics[] = [];
  
  // 默认性能阈值
  private thresholds: PerformanceThresholds = {
    smallFileSize: 1024,        // 1KB
    mediumFileSize: 102400,     // 100KB
    largeFileSize: 1048576,     // 1MB
    smallBatchSize: 10,
    mediumBatchSize: 100,
    largeBatchSize: 500,
    maxConcurrency: 8,
    optimalBatchSize: 20
  };

  public static getInstance(): SmartFileOperations {
    if (!SmartFileOperations.instance) {
      SmartFileOperations.instance = new SmartFileOperations();
    }
    return SmartFileOperations.instance;
  }

  /**
   * 🎯 智能策略选择 - 核心算法
   */
  public selectOptimalStrategy(
    fileCount: number,
    estimatedTotalSize: number = 0,
    operationType: 'read' | 'write' | 'scan' | 'stat' = 'read'
  ): OperationStrategy {
    const avgFileSize = fileCount > 0 ? estimatedTotalSize / fileCount : 0;

    // 1. 小文件小批量 - 强制同步
    if (fileCount <= this.thresholds.smallBatchSize && 
        avgFileSize <= this.thresholds.smallFileSize) {
      return OperationStrategy.SYNC;
    }

    // 2. 大文件或大批量 - 强制异步
    if (fileCount >= this.thresholds.largeBatchSize || 
        avgFileSize >= this.thresholds.largeFileSize) {
      return OperationStrategy.ASYNC;
    }

    // 3. 中等规模 - 基于历史性能数据智能选择
    const historicalPerformance = this.getHistoricalPerformance(operationType);
    if (historicalPerformance) {
      return historicalPerformance.strategy;
    }

    // 4. 默认混合策略
    return OperationStrategy.HYBRID;
  }

  /**
   * 🚀 智能文件读取 - 自动选择最优策略
   */
  public async readFiles(filePaths: string[]): Promise<Map<string, string>> {
    const startTime = performance.now();
    
    // 预估文件大小
    const estimatedSize = await this.estimateFileSizes(filePaths.slice(0, 5)); // 采样前5个文件
    const strategy = this.selectOptimalStrategy(filePaths.length, estimatedSize, 'read');
    
    let results: Map<string, string>;
    
    switch (strategy) {
      case OperationStrategy.SYNC:
        results = await this.readFilesSynchronously(filePaths);
        break;
      case OperationStrategy.ASYNC:
        results = await this.readFilesAsynchronously(filePaths);
        break;
      case OperationStrategy.HYBRID:
        results = await this.readFilesHybrid(filePaths);
        break;
      default:
        results = await this.readFilesAsynchronously(filePaths);
    }

    // 记录性能指标
    const duration = performance.now() - startTime;
    this.recordPerformance({
      strategy,
      duration,
      fileCount: filePaths.length,
      totalSize: estimatedSize,
      throughput: filePaths.length / (duration / 1000),
      efficiency: (estimatedSize / 1024 / 1024) / (duration / 1000)
    });

    return results;
  }

  /**
   * 📊 同步文件读取 - 适合小文件
   */
  private async readFilesSynchronously(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const filePath of filePaths) {
      try {
        // 使用同步操作避免异步开销
        const content = fs.readFileSync(filePath, 'utf-8');
        results.set(filePath, content);
      } catch (error) {
        console.warn(`Failed to read file ${filePath}:`, error);
      }
    }
    
    return results;
  }

  /**
   * ⚡ 异步文件读取 - 适合大文件
   */
  private async readFilesAsynchronously(filePaths: string[]): Promise<Map<string, string>> {
    return await AsyncFileOperations.readMultipleFiles(filePaths);
  }

  /**
   * 🔄 混合策略文件读取 - 智能分组处理
   */
  private async readFilesHybrid(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // 将文件分组：小文件用同步，大文件用异步
    const smallFiles: string[] = [];
    const largeFiles: string[] = [];
    
    // 快速采样判断文件大小
    for (const filePath of filePaths) {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size <= this.thresholds.mediumFileSize) {
          smallFiles.push(filePath);
        } else {
          largeFiles.push(filePath);
        }
      } catch (error) {
        // 无法获取大小的文件默认为小文件
        smallFiles.push(filePath);
      }
    }

    // 并行处理两组文件
    const [smallResults, largeResults] = await Promise.all([
      this.readFilesSynchronously(smallFiles),
      this.readFilesAsynchronously(largeFiles)
    ]);

    // 合并结果
    for (const [path, content] of smallResults) {
      results.set(path, content);
    }
    for (const [path, content] of largeResults) {
      results.set(path, content);
    }

    return results;
  }

  /**
   * 🎯 智能目录扫描
   */
  public async scanDirectory(
    dirPath: string,
    options: {
      recursive?: boolean;
      includeFiles?: boolean;
      includeDirectories?: boolean;
      filter?: (item: string) => boolean;
    } = {}
  ): Promise<FileInfo[]> {
    const startTime = performance.now();
    
    // 预估目录大小
    const estimatedFileCount = await this.estimateDirectorySize(dirPath);
    const strategy = this.selectOptimalStrategy(estimatedFileCount, 0, 'scan');
    
    let results: FileInfo[];
    
    switch (strategy) {
      case OperationStrategy.SYNC:
        results = await this.scanDirectorySynchronously(dirPath, options);
        break;
      case OperationStrategy.ASYNC:
        results = await AsyncFileOperations.scanDirectory(dirPath, options);
        break;
      case OperationStrategy.HYBRID:
        results = await this.scanDirectoryHybrid(dirPath, options);
        break;
      default:
        results = await AsyncFileOperations.scanDirectory(dirPath, options);
    }

    // 记录性能指标
    const duration = performance.now() - startTime;
    this.recordPerformance({
      strategy,
      duration,
      fileCount: results.length,
      totalSize: results.reduce((sum, file) => sum + file.size, 0),
      throughput: results.length / (duration / 1000),
      efficiency: 0 // 扫描操作不计算效率
    });

    return results;
  }

  /**
   * 📊 同步目录扫描
   */
  private async scanDirectorySynchronously(
    dirPath: string,
    options: {
      recursive?: boolean;
      includeFiles?: boolean;
      includeDirectories?: boolean;
      filter?: (item: string) => boolean;
    }
  ): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    const { recursive = true, includeFiles = true, includeDirectories = false, filter } = options;

    const scanDir = (currentPath: string): void => {
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          if (filter && !filter(item)) continue;

          const itemPath = path.join(currentPath, item);
          
          try {
            const stats = fs.statSync(itemPath);
            
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
              
              if (recursive && !AsyncFileOperations.isSystemDirectory(item)) {
                scanDir(itemPath);
              }
            }
          } catch (error) {
            // 忽略无法访问的文件
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
    };

    scanDir(dirPath);
    return results;
  }

  /**
   * 🔄 混合策略目录扫描
   */
  private async scanDirectoryHybrid(
    dirPath: string,
    options: {
      recursive?: boolean;
      includeFiles?: boolean;
      includeDirectories?: boolean;
      filter?: (item: string) => boolean;
    }
  ): Promise<FileInfo[]> {
    // 先同步扫描第一层，根据结果决定后续策略
    const firstLevelItems = fs.readdirSync(dirPath);
    
    if (firstLevelItems.length <= this.thresholds.smallBatchSize) {
      // 小目录使用同步扫描
      return await this.scanDirectorySynchronously(dirPath, options);
    } else {
      // 大目录使用异步扫描
      return await AsyncFileOperations.scanDirectory(dirPath, options);
    }
  }

  /**
   * 📏 估算文件大小
   */
  private async estimateFileSizes(samplePaths: string[]): Promise<number> {
    let totalSize = 0;
    let validSamples = 0;

    for (const filePath of samplePaths) {
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        validSamples++;
      } catch (error) {
        // 忽略无法访问的文件
      }
    }

    return validSamples > 0 ? totalSize : 0;
  }

  /**
   * 📏 估算目录大小
   */
  private async estimateDirectorySize(dirPath: string): Promise<number> {
    try {
      const items = fs.readdirSync(dirPath);
      return items.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📊 记录性能指标
   */
  private recordPerformance(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    // 保持历史记录在合理范围内
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-50);
    }
  }

  /**
   * 📈 获取历史性能数据
   */
  private getHistoricalPerformance(operationType: string): PerformanceMetrics | null {
    if (this.performanceHistory.length < 3) return null;

    // 分析最近的性能数据，选择最佳策略
    const recentMetrics = this.performanceHistory.slice(-10);
    const strategyPerformance = new Map<OperationStrategy, number>();

    for (const metric of recentMetrics) {
      const currentPerf = strategyPerformance.get(metric.strategy) || 0;
      strategyPerformance.set(metric.strategy, currentPerf + metric.throughput);
    }

    // 选择吞吐量最高的策略
    let bestStrategy = OperationStrategy.ASYNC;
    let bestPerformance = 0;

    for (const [strategy, performance] of strategyPerformance) {
      if (performance > bestPerformance) {
        bestStrategy = strategy;
        bestPerformance = performance;
      }
    }

    return recentMetrics.find(m => m.strategy === bestStrategy) || null;
  }

  /**
   * 📊 获取性能报告
   */
  public getPerformanceReport(): {
    totalOperations: number;
    averageThroughput: number;
    strategyDistribution: Record<OperationStrategy, number>;
    recommendations: string[];
  } {
    const totalOps = this.performanceHistory.length;
    const avgThroughput = totalOps > 0 
      ? this.performanceHistory.reduce((sum, m) => sum + m.throughput, 0) / totalOps 
      : 0;

    const strategyDist: Record<OperationStrategy, number> = {
      [OperationStrategy.SYNC]: 0,
      [OperationStrategy.ASYNC]: 0,
      [OperationStrategy.HYBRID]: 0
    };

    for (const metric of this.performanceHistory) {
      strategyDist[metric.strategy]++;
    }

    const recommendations: string[] = [];
    
    if (strategyDist[OperationStrategy.SYNC] > totalOps * 0.7) {
      recommendations.push('大部分操作使用同步策略，考虑提高异步操作阈值');
    }
    
    if (avgThroughput < 100) {
      recommendations.push('整体吞吐量较低，建议优化并发控制参数');
    }

    return {
      totalOperations: totalOps,
      averageThroughput: avgThroughput,
      strategyDistribution: strategyDist,
      recommendations
    };
  }

  /**
   * 🔧 更新性能阈值
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * 🧹 清理性能历史
   */
  public clearPerformanceHistory(): void {
    this.performanceHistory = [];
  }
}