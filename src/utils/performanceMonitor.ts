/**
 * 性能监控和指标收集系统
 * Performance Monitoring and Metrics Collection System
 * 
 * 实时监控文件操作性能，提供详细的性能分析和优化建议
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { OperationStrategy, PerformanceMetrics } from './smartFileOperations.js';

/**
 * 性能事件类型
 */
export interface PerformanceEvent {
  type: 'operation_start' | 'operation_end' | 'threshold_exceeded' | 'strategy_changed';
  timestamp: number;
  data: any;
}

/**
 * 性能阈值配置
 */
export interface PerformanceAlerts {
  maxDuration: number;        // 最大操作时间 (ms)
  minThroughput: number;      // 最小吞吐量 (files/sec)
  maxMemoryUsage: number;     // 最大内存使用 (MB)
}

/**
 * 详细性能统计
 */
export interface DetailedPerformanceStats {
  // 基础统计
  totalOperations: number;
  totalDuration: number;
  totalFiles: number;
  totalSize: number;
  
  // 平均值
  averageDuration: number;
  averageThroughput: number;
  averageFileSize: number;
  
  // 策略分布
  strategyDistribution: Record<OperationStrategy, {
    count: number;
    totalDuration: number;
    averageThroughput: number;
    successRate: number;
  }>;
  
  // 性能趋势
  performanceTrend: 'improving' | 'stable' | 'degrading';
  
  // 瓶颈分析
  bottlenecks: {
    type: 'file_size' | 'file_count' | 'io_latency' | 'cpu_bound';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }[];
}

/**
 * 性能监控器
 */
export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private activeOperations = new Map<string, { startTime: number; context: any }>();
  private alerts: PerformanceAlerts;
  
  constructor() {
    super();
    this.alerts = {
      maxDuration: 10000,      // 10秒
      minThroughput: 10,       // 10 files/sec
      maxMemoryUsage: 512      // 512MB
    };
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 🚀 开始监控操作
   */
  public startOperation(operationId: string, context: {
    type: 'read' | 'write' | 'scan' | 'stat';
    fileCount: number;
    strategy: OperationStrategy;
    estimatedSize?: number;
  }): void {
    const startTime = performance.now();
    this.activeOperations.set(operationId, { startTime, context });
    
    this.emit('operation_start', {
      type: 'operation_start',
      timestamp: Date.now(),
      data: { operationId, context }
    } as PerformanceEvent);
  }

  /**
   * ✅ 结束监控操作
   */
  public endOperation(operationId: string, result: {
    success: boolean;
    fileCount: number;
    totalSize: number;
    errors?: string[];
  }): PerformanceMetrics | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      console.warn(`Operation ${operationId} not found in active operations`);
      return null;
    }

    const duration = performance.now() - operation.startTime;
    const throughput = result.fileCount / (duration / 1000);
    const efficiency = result.totalSize > 0 ? (result.totalSize / 1024 / 1024) / (duration / 1000) : 0;

    const metrics: PerformanceMetrics = {
      strategy: operation.context.strategy,
      duration,
      fileCount: result.fileCount,
      totalSize: result.totalSize,
      throughput,
      efficiency
    };

    // 记录指标
    this.recordMetrics(metrics);
    
    // 检查性能警报
    this.checkPerformanceAlerts(metrics, operation.context);
    
    // 清理活动操作
    this.activeOperations.delete(operationId);
    
    this.emit('operation_end', {
      type: 'operation_end',
      timestamp: Date.now(),
      data: { operationId, metrics, result }
    } as PerformanceEvent);

    return metrics;
  }

  /**
   * 📊 记录性能指标
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // 保持历史记录在合理范围内
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * 🚨 检查性能警报
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics, context: any): void {
    const alerts: string[] = [];

    // 检查操作时间
    if (metrics.duration > this.alerts.maxDuration) {
      alerts.push(`Operation duration (${metrics.duration.toFixed(2)}ms) exceeded threshold (${this.alerts.maxDuration}ms)`);
    }

    // 检查吞吐量
    if (metrics.throughput < this.alerts.minThroughput) {
      alerts.push(`Throughput (${metrics.throughput.toFixed(2)} files/sec) below threshold (${this.alerts.minThroughput} files/sec)`);
    }

    // 检查内存使用
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (heapUsedMB > this.alerts.maxMemoryUsage) {
      alerts.push(`Memory usage (${heapUsedMB.toFixed(2)}MB) exceeded threshold (${this.alerts.maxMemoryUsage}MB)`);
    }

    if (alerts.length > 0) {
      this.emit('threshold_exceeded', {
        type: 'threshold_exceeded',
        timestamp: Date.now(),
        data: { metrics, context, alerts }
      } as PerformanceEvent);
    }
  }

  /**
   * 📈 获取详细性能统计
   */
  public getDetailedStats(): DetailedPerformanceStats {
    if (this.metrics.length === 0) {
      return this.getEmptyStats();
    }

    const totalOperations = this.metrics.length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalFiles = this.metrics.reduce((sum, m) => sum + m.fileCount, 0);
    const totalSize = this.metrics.reduce((sum, m) => sum + m.totalSize, 0);

    // 计算策略分布
    const strategyStats: Record<OperationStrategy, any> = {
      [OperationStrategy.SYNC]: { count: 0, totalDuration: 0, totalThroughput: 0, successCount: 0 },
      [OperationStrategy.ASYNC]: { count: 0, totalDuration: 0, totalThroughput: 0, successCount: 0 },
      [OperationStrategy.HYBRID]: { count: 0, totalDuration: 0, totalThroughput: 0, successCount: 0 }
    };

    for (const metric of this.metrics) {
      const stats = strategyStats[metric.strategy];
      stats.count++;
      stats.totalDuration += metric.duration;
      stats.totalThroughput += metric.throughput;
      stats.successCount++; // 假设记录的都是成功的操作
    }

    const strategyDistribution: Record<OperationStrategy, any> = {
      sync: 0,
      async: 0,
      hybrid: 0
    };
    for (const [strategy, stats] of Object.entries(strategyStats)) {
      strategyDistribution[strategy as OperationStrategy] = {
        count: stats.count,
        totalDuration: stats.totalDuration,
        averageThroughput: stats.count > 0 ? stats.totalThroughput / stats.count : 0,
        successRate: stats.count > 0 ? stats.successCount / stats.count : 0
      };
    }

    // 分析性能趋势
    const performanceTrend = this.analyzePerformanceTrend();
    
    // 识别瓶颈
    const bottlenecks = this.identifyBottlenecks();

    return {
      totalOperations,
      totalDuration,
      totalFiles,
      totalSize,
      averageDuration: totalDuration / totalOperations,
      averageThroughput: this.metrics.reduce((sum, m) => sum + m.throughput, 0) / totalOperations,
      averageFileSize: totalFiles > 0 ? totalSize / totalFiles : 0,
      strategyDistribution,
      performanceTrend,
      bottlenecks
    };
  }

  /**
   * 📊 分析性能趋势
   */
  private analyzePerformanceTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.metrics.length < 10) return 'stable';

    const recentMetrics = this.metrics.slice(-10);
    const olderMetrics = this.metrics.slice(-20, -10);

    if (olderMetrics.length === 0) return 'stable';

    const recentAvgThroughput = recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length;
    const olderAvgThroughput = olderMetrics.reduce((sum, m) => sum + m.throughput, 0) / olderMetrics.length;

    const improvement = (recentAvgThroughput - olderAvgThroughput) / olderAvgThroughput;

    if (improvement > 0.1) return 'improving';
    if (improvement < -0.1) return 'degrading';
    return 'stable';
  }

  /**
   * 🔍 识别性能瓶颈
   */
  private identifyBottlenecks(): DetailedPerformanceStats['bottlenecks'] {
    const bottlenecks: DetailedPerformanceStats['bottlenecks'] = [];

    if (this.metrics.length < 5) return bottlenecks;

    // 分析文件大小瓶颈
    const avgFileSize = this.metrics.reduce((sum, m) => sum + (m.totalSize / m.fileCount), 0) / this.metrics.length;
    const avgThroughput = this.metrics.reduce((sum, m) => sum + m.throughput, 0) / this.metrics.length;

    if (avgFileSize > 1024 * 1024 && avgThroughput < 10) { // 大文件低吞吐量
      bottlenecks.push({
        type: 'file_size',
        severity: 'high',
        description: '大文件操作导致吞吐量下降',
        recommendation: '考虑增加并发数或使用流式处理'
      });
    }

    // 分析文件数量瓶颈
    const avgFileCount = this.metrics.reduce((sum, m) => sum + m.fileCount, 0) / this.metrics.length;
    if (avgFileCount > 100 && avgThroughput < 50) {
      bottlenecks.push({
        type: 'file_count',
        severity: 'medium',
        description: '大量文件操作导致性能下降',
        recommendation: '优化批处理大小或增加并发控制'
      });
    }

    // 分析IO延迟瓶颈
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    if (avgDuration > 5000) { // 平均操作时间超过5秒
      bottlenecks.push({
        type: 'io_latency',
        severity: 'high',
        description: 'IO操作延迟过高',
        recommendation: '检查磁盘性能或网络连接'
      });
    }

    return bottlenecks;
  }

  /**
   * 📊 获取空统计数据
   */
  private getEmptyStats(): DetailedPerformanceStats {
    return {
      totalOperations: 0,
      totalDuration: 0,
      totalFiles: 0,
      totalSize: 0,
      averageDuration: 0,
      averageThroughput: 0,
      averageFileSize: 0,
      strategyDistribution: {
        [OperationStrategy.SYNC]: { count: 0, totalDuration: 0, averageThroughput: 0, successRate: 0 },
        [OperationStrategy.ASYNC]: { count: 0, totalDuration: 0, averageThroughput: 0, successRate: 0 },
        [OperationStrategy.HYBRID]: { count: 0, totalDuration: 0, averageThroughput: 0, successRate: 0 }
      },
      performanceTrend: 'stable',
      bottlenecks: []
    };
  }

  /**
   * 🔧 更新性能警报阈值
   */
  public updateAlerts(newAlerts: Partial<PerformanceAlerts>): void {
    this.alerts = { ...this.alerts, ...newAlerts };
  }

  /**
   * 📊 生成性能报告
   */
  public generatePerformanceReport(): string {
    const stats = this.getDetailedStats();
    
    let report = `# 文件操作性能报告\n\n`;
    report += `**生成时间**: ${new Date().toLocaleString()}\n\n`;
    
    // 基础统计
    report += `## 📊 基础统计\n\n`;
    report += `- **总操作数**: ${stats.totalOperations}\n`;
    report += `- **总耗时**: ${(stats.totalDuration / 1000).toFixed(2)}秒\n`;
    report += `- **总文件数**: ${stats.totalFiles}\n`;
    report += `- **总数据量**: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB\n`;
    report += `- **平均吞吐量**: ${stats.averageThroughput.toFixed(2)} 文件/秒\n\n`;
    
    // 策略分布
    report += `## 🎯 策略分布\n\n`;
    report += `| 策略 | 使用次数 | 平均吞吐量 | 成功率 |\n`;
    report += `|------|----------|------------|--------|\n`;
    
    for (const [strategy, data] of Object.entries(stats.strategyDistribution)) {
      report += `| ${strategy} | ${data.count} | ${data.averageThroughput.toFixed(2)} | ${(data.successRate * 100).toFixed(1)}% |\n`;
    }
    report += `\n`;
    
    // 性能趋势
    report += `## 📈 性能趋势\n\n`;
    const trendEmoji = stats.performanceTrend === 'improving' ? '📈' : 
                      stats.performanceTrend === 'degrading' ? '📉' : '➡️';
    report += `${trendEmoji} **${stats.performanceTrend}**\n\n`;
    
    // 瓶颈分析
    if (stats.bottlenecks.length > 0) {
      report += `## 🔍 瓶颈分析\n\n`;
      for (const bottleneck of stats.bottlenecks) {
        const severityEmoji = bottleneck.severity === 'high' ? '🔴' : 
                             bottleneck.severity === 'medium' ? '🟡' : '🟢';
        report += `${severityEmoji} **${bottleneck.type}** (${bottleneck.severity})\n`;
        report += `- **问题**: ${bottleneck.description}\n`;
        report += `- **建议**: ${bottleneck.recommendation}\n\n`;
      }
    }
    
    return report;
  }

  /**
   * 🧹 清理性能数据
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  /**
   * 📊 获取实时性能指标
   */
  public getRealTimeMetrics(): {
    activeOperations: number;
    recentThroughput: number;
    memoryUsage: number;
    cpuUsage?: number;
  } {
    const memoryUsage = process.memoryUsage();
    const recentMetrics = this.metrics.slice(-10);
    const recentThroughput = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length 
      : 0;

    return {
      activeOperations: this.activeOperations.size,
      recentThroughput,
      memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
    };
  }
}