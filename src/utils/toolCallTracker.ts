/**
 * 工具调用跟踪和统计系统
 * Tool Call Tracking and Statistics System
 * 
 * 实时监控MCP工具调用频率、成功率和使用模式，为A/B测试提供数据支持
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getDataDir } from './paths.js';

/**
 * 工具调用事件类型
 */
export interface ToolCallEvent {
  type: 'call_start' | 'call_end' | 'call_error' | 'threshold_exceeded';
  timestamp: number;
  data: any;
}

/**
 * 工具调用指标
 */
export interface ToolCallMetrics {
  toolName: string;
  timestamp: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
  parameters?: Record<string, any>;
  responseSize?: number;
  userAgent?: string;
  sessionId?: string;
}

/**
 * 工具使用统计
 */
export interface ToolUsageStats {
  toolName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  averageDuration: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  lastCalled: number;
  firstCalled: number;
  callsPerHour: number;
  callsPerDay: number;
  errorPatterns: Record<string, number>;
}

/**
 * A/B测试数据
 */
export interface ABTestData {
  testId: string;
  startTime: number;
  endTime?: number;
  variants: {
    [variantName: string]: {
      toolName: string;
      callCount: number;
      successRate: number;
      averageDuration: number;
      userSatisfaction?: number;
    };
  };
  status: 'running' | 'completed' | 'paused';
}

/**
 * 工具调用跟踪器
 */
export class ToolCallTracker extends EventEmitter {
  private static instance: ToolCallTracker;
  private metrics: ToolCallMetrics[] = [];
  private activeCalls = new Map<string, { startTime: number; toolName: string; parameters: any }>();
  private abTests: ABTestData[] = [];
  private dataFile: string = '';
  private abTestFile: string = '';
  private maxMetricsHistory = 10000; // 保留最近10000条记录
  
  constructor() {
    super();
    this.initializeDataFiles();
  }

  public static getInstance(): ToolCallTracker {
    if (!ToolCallTracker.instance) {
      ToolCallTracker.instance = new ToolCallTracker();
    }
    return ToolCallTracker.instance;
  }

  /**
   * 初始化数据文件路径
   */
  private async initializeDataFiles(): Promise<void> {
    try {
      const dataDir = await getDataDir(true, 'mcp-shrimp-task-manager');
      this.dataFile = join(dataDir, 'tool-call-metrics.json');
      this.abTestFile = join(dataDir, 'ab-test-data.json');
      
      // 加载现有数据
      await this.loadExistingData();
    } catch (error) {
      console.warn('Failed to initialize tool call tracker data files:', error);
    }
  }

  /**
   * 加载现有数据
   */
  private async loadExistingData(): Promise<void> {
    try {
      // 加载工具调用指标
      try {
        const metricsData = await fs.readFile(this.dataFile, 'utf-8');
        const parsedMetrics = JSON.parse(metricsData);
        if (Array.isArray(parsedMetrics)) {
          this.metrics = parsedMetrics.slice(-this.maxMetricsHistory);
        }
      } catch (error) {
        // 文件不存在或格式错误，使用空数组
        this.metrics = [];
      }

      // 加载A/B测试数据
      try {
        const abTestData = await fs.readFile(this.abTestFile, 'utf-8');
        const parsedABTests = JSON.parse(abTestData);
        if (Array.isArray(parsedABTests)) {
          this.abTests = parsedABTests;
        }
      } catch (error) {
        // 文件不存在或格式错误，使用空数组
        this.abTests = [];
      }
    } catch (error) {
      console.warn('Failed to load existing tool call data:', error);
    }
  }

  /**
   * 🚀 开始跟踪工具调用
   */
  public startTracking(callId: string, toolName: string, parameters?: Record<string, any>): void {
    const startTime = performance.now();
    this.activeCalls.set(callId, { startTime, toolName, parameters });
    
    this.emit('call_start', {
      type: 'call_start',
      timestamp: Date.now(),
      data: { callId, toolName, parameters }
    } as ToolCallEvent);
  }

  /**
   * ✅ 结束跟踪工具调用
   */
  public endTracking(
    callId: string, 
    success: boolean, 
    errorMessage?: string,
    responseSize?: number
  ): ToolCallMetrics | null {
    const activeCall = this.activeCalls.get(callId);
    if (!activeCall) {
      console.warn(`Tool call ${callId} not found in active calls`);
      return null;
    }

    const duration = performance.now() - activeCall.startTime;
    const metrics: ToolCallMetrics = {
      toolName: activeCall.toolName,
      timestamp: Date.now(),
      duration,
      success,
      errorMessage,
      parameters: activeCall.parameters,
      responseSize,
    };

    // 记录指标
    this.recordMetrics(metrics);
    
    // 清理活动调用
    this.activeCalls.delete(callId);
    
    this.emit('call_end', {
      type: 'call_end',
      timestamp: Date.now(),
      data: { callId, metrics }
    } as ToolCallEvent);

    return metrics;
  }

  /**
   * 📊 记录工具调用指标
   */
  private recordMetrics(metrics: ToolCallMetrics): void {
    this.metrics.push(metrics);
    
    // 保持历史记录在合理范围内
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-Math.floor(this.maxMetricsHistory * 0.8));
    }

    // 异步保存数据（避免影响性能）
    this.saveDataAsync();
  }

  /**
   * 💾 异步保存数据
   */
  private async saveDataAsync(): Promise<void> {
    try {
      if (this.dataFile) {
        await fs.writeFile(this.dataFile, JSON.stringify(this.metrics, null, 2));
      }
    } catch (error) {
      console.warn('Failed to save tool call metrics:', error);
    }
  }

  /**
   * 📈 获取工具使用统计
   */
  public getToolUsageStats(toolName?: string): ToolUsageStats[] {
    const toolGroups = new Map<string, ToolCallMetrics[]>();
    
    // 按工具名称分组
    this.metrics.forEach(metric => {
      if (!toolName || metric.toolName === toolName) {
        if (!toolGroups.has(metric.toolName)) {
          toolGroups.set(metric.toolName, []);
        }
        toolGroups.get(metric.toolName)!.push(metric);
      }
    });

    const stats: ToolUsageStats[] = [];
    
    toolGroups.forEach((metrics, name) => {
      const totalCalls = metrics.length;
      const successfulCalls = metrics.filter(m => m.success).length;
      const failedCalls = totalCalls - successfulCalls;
      const durations = metrics.map(m => m.duration);
      const timestamps = metrics.map(m => m.timestamp);
      
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;
      
      const recentHourCalls = metrics.filter(m => now - m.timestamp < oneHour).length;
      const recentDayCalls = metrics.filter(m => now - m.timestamp < oneDay).length;
      
      // 错误模式分析
      const errorPatterns: Record<string, number> = {};
      metrics.filter(m => !m.success && m.errorMessage).forEach(m => {
        const errorKey = m.errorMessage!.substring(0, 100); // 截取前100字符作为错误模式
        errorPatterns[errorKey] = (errorPatterns[errorKey] || 0) + 1;
      });

      stats.push({
        toolName: name,
        totalCalls,
        successfulCalls,
        failedCalls,
        successRate: totalCalls > 0 ? successfulCalls / totalCalls : 0,
        averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        totalDuration: durations.reduce((a, b) => a + b, 0),
        minDuration: durations.length > 0 ? Math.min(...durations) : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
        lastCalled: timestamps.length > 0 ? Math.max(...timestamps) : 0,
        firstCalled: timestamps.length > 0 ? Math.min(...timestamps) : 0,
        callsPerHour: recentHourCalls,
        callsPerDay: recentDayCalls,
        errorPatterns,
      });
    });

    return stats.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  /**
   * 🔄 开始A/B测试
   */
  public startABTest(testId: string, variants: Record<string, string>): ABTestData {
    const abTest: ABTestData = {
      testId,
      startTime: Date.now(),
      variants: {},
      status: 'running'
    };

    // 初始化变体数据
    Object.entries(variants).forEach(([variantName, toolName]) => {
      abTest.variants[variantName] = {
        toolName,
        callCount: 0,
        successRate: 0,
        averageDuration: 0,
      };
    });

    this.abTests.push(abTest);
    this.saveABTestDataAsync();
    
    return abTest;
  }

  /**
   * 📊 获取A/B测试结果
   */
  public getABTestResults(testId: string): ABTestData | null {
    const test = this.abTests.find(t => t.testId === testId);
    if (!test) return null;

    // 更新测试数据
    Object.entries(test.variants).forEach(([variantName, variant]) => {
      const toolMetrics = this.metrics.filter(m => 
        m.toolName === variant.toolName && 
        m.timestamp >= test.startTime &&
        (!test.endTime || m.timestamp <= test.endTime)
      );

      variant.callCount = toolMetrics.length;
      variant.successRate = toolMetrics.length > 0 
        ? toolMetrics.filter(m => m.success).length / toolMetrics.length 
        : 0;
      variant.averageDuration = toolMetrics.length > 0
        ? toolMetrics.reduce((sum, m) => sum + m.duration, 0) / toolMetrics.length
        : 0;
    });

    return test;
  }

  /**
   * 🛑 停止A/B测试
   */
  public stopABTest(testId: string): ABTestData | null {
    const test = this.abTests.find(t => t.testId === testId);
    if (!test) return null;

    test.endTime = Date.now();
    test.status = 'completed';
    
    this.saveABTestDataAsync();
    return this.getABTestResults(testId);
  }

  /**
   * 💾 异步保存A/B测试数据
   */
  private async saveABTestDataAsync(): Promise<void> {
    try {
      if (this.abTestFile) {
        await fs.writeFile(this.abTestFile, JSON.stringify(this.abTests, null, 2));
      }
    } catch (error) {
      console.warn('Failed to save A/B test data:', error);
    }
  }

  /**
   * 📊 获取实时统计
   */
  public getRealTimeStats(): {
    activeCalls: number;
    totalCallsToday: number;
    averageResponseTime: number;
    topTools: { name: string; calls: number }[];
    errorRate: number;
  } {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const todayMetrics = this.metrics.filter(m => now - m.timestamp < oneDay);
    const recentMetrics = this.metrics.slice(-100); // 最近100次调用
    
    // 统计工具使用频率
    const toolCounts = new Map<string, number>();
    todayMetrics.forEach(m => {
      toolCounts.set(m.toolName, (toolCounts.get(m.toolName) || 0) + 1);
    });
    
    const topTools = Array.from(toolCounts.entries())
      .map(([name, calls]) => ({ name, calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 5);

    return {
      activeCalls: this.activeCalls.size,
      totalCallsToday: todayMetrics.length,
      averageResponseTime: recentMetrics.length > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
        : 0,
      topTools,
      errorRate: recentMetrics.length > 0 
        ? recentMetrics.filter(m => !m.success).length / recentMetrics.length 
        : 0,
    };
  }

  /**
   * 📊 获取指定时间段的指标数据
   */
  public getMetricsInPeriod(startTime: number, endTime?: number): ToolCallMetrics[] {
    const end = endTime || Date.now();
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= end);
  }

  /**
   * 📈 获取所有指标数据（用于分析）
   */
  public getAllMetrics(): ToolCallMetrics[] {
    return [...this.metrics]; // 返回副本以防止外部修改
  }

  /**
   * 📋 获取所有A/B测试
   */
  public getAllABTests(): ABTestData[] {
    return [...this.abTests]; // 返回副本以防止外部修改
  }

  /**
   * 🔍 获取活跃的A/B测试ID列表
   */
  public getActiveABTestIds(): string[] {
    return this.abTests
      .filter(test => test.status === 'running')
      .map(test => test.testId);
  }

  /**
   * 🧹 清理旧数据
   */
  public cleanupOldData(daysToKeep: number = 30): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    // 清理旧的指标数据
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    
    // 清理完成的A/B测试（保留最近的测试）
    this.abTests = this.abTests.filter(t => 
      t.status === 'running' || 
      (t.endTime && t.endTime > cutoffTime)
    );
    
    // 保存清理后的数据
    this.saveDataAsync();
    this.saveABTestDataAsync();
  }
}

// 导出单例实例
export const toolCallTracker = ToolCallTracker.getInstance();

// 导出装饰器用于自动跟踪
export function trackToolCall(toolName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const trackingName = toolName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const callId = `${trackingName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const tracker = ToolCallTracker.getInstance();
      
      tracker.startTracking(callId, trackingName, { args: args.length });
      
      try {
        const result = await originalMethod.apply(this, args);
        tracker.endTracking(callId, true, undefined, JSON.stringify(result).length);
        return result;
      } catch (error) {
        tracker.endTracking(callId, false, error instanceof Error ? error.message : String(error));
        throw error;
      }
    };

    return descriptor;
  };
}

export default ToolCallTracker;