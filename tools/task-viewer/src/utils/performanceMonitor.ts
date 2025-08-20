/**
 * 性能监控工具
 * 提供实时性能监控、指标收集和性能分析功能
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'api' | 'memory' | 'user' | 'error';
  metadata?: Record<string, any>;
}

interface PerformanceThreshold {
  name: string;
  warning: number;
  critical: number;
  unit: string;
}

interface PerformanceReport {
  summary: {
    totalMetrics: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    renderPerformance: number;
  };
  metrics: PerformanceMetric[];
  violations: Array<{
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }>;
  recommendations: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private thresholds: PerformanceThreshold[] = [
    { name: 'api_response_time', warning: 1500, critical: 2000, unit: 'ms' },
    { name: 'render_time', warning: 100, critical: 200, unit: 'ms' },
    { name: 'memory_usage', warning: 50, critical: 100, unit: 'MB' },
    { name: 'error_rate', warning: 0.05, critical: 0.1, unit: '%' },
    { name: 'user_interaction_delay', warning: 100, critical: 300, unit: 'ms' },
  ];

  private constructor() {
    this.initializeObservers();
    this.startMemoryMonitoring();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 初始化性能观察器
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // 观察导航性能
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.navigationStart, 'render', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.navigationStart,
              firstPaint: navEntry.responseEnd - navEntry.navigationStart,
            });
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // 观察资源加载性能
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('resource_load_time', entry.duration, 'render', {
              name: entry.name,
              size: resourceEntry.transferSize,
              type: this.getResourceType(entry.name),
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // 观察用户交互性能
      const measureObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric(entry.name, entry.duration, 'user', {
              startTime: entry.startTime,
            });
          }
        }
      });
      measureObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(measureObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  /**
   * 开始内存监控
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        this.recordMetric('memory_usage', memory.usedJSHeapSize / 1024 / 1024, 'memory', {
          totalHeapSize: memory.totalJSHeapSize / 1024 / 1024,
          heapSizeLimit: memory.jsHeapSizeLimit / 1024 / 1024,
        });
      }
    }, 5000); // 每5秒检查一次内存使用
  }

  /**
   * 记录性能指标
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      category,
      metadata,
    };

    this.metrics.push(metric);

    // 保持最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // 检查阈值
    this.checkThresholds(metric);
  }

  /**
   * 测量函数执行时间
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    this.recordMetric(name, endTime - startTime, 'render');
    return result;
  }

  /**
   * 测量异步函数执行时间
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      this.recordMetric(name, endTime - startTime, 'api');
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(name, endTime - startTime, 'error', { error: error.message });
      throw error;
    }
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * 结束性能测量
   */
  endMeasure(name: string, category: PerformanceMetric['category'] = 'user'): void {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      // 获取测量结果
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        const measure = measures[measures.length - 1];
        this.recordMetric(name, measure.duration, category);
      }
    }
  }

  /**
   * 记录API调用性能
   */
  recordApiCall(url: string, method: string, duration: number, success: boolean): void {
    this.recordMetric('api_response_time', duration, 'api', {
      url,
      method,
      success,
    });

    if (!success) {
      this.recordMetric('api_error', 1, 'error', { url, method });
    }
  }

  /**
   * 记录用户交互性能
   */
  recordUserInteraction(action: string, duration: number, metadata?: Record<string, any>): void {
    this.recordMetric('user_interaction_delay', duration, 'user', {
      action,
      ...metadata,
    });
  }

  /**
   * 记录渲染性能
   */
  recordRenderPerformance(component: string, duration: number, metadata?: Record<string, any>): void {
    this.recordMetric('render_time', duration, 'render', {
      component,
      ...metadata,
    });
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(timeRange?: { start: number; end: number }): PerformanceReport {
    let filteredMetrics = this.metrics;
    
    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
      );
    }

    const summary = this.calculateSummary(filteredMetrics);
    const violations = this.findThresholdViolations(filteredMetrics);
    const recommendations = this.generateRecommendations(summary, violations);

    return {
      summary,
      metrics: filteredMetrics,
      violations,
      recommendations,
    };
  }

  /**
   * 计算性能摘要
   */
  private calculateSummary(metrics: PerformanceMetric[]): PerformanceReport['summary'] {
    const apiMetrics = metrics.filter(m => m.category === 'api');
    const renderMetrics = metrics.filter(m => m.category === 'render');
    const errorMetrics = metrics.filter(m => m.category === 'error');
    const memoryMetrics = metrics.filter(m => m.name === 'memory_usage');

    const averageResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const errorRate = metrics.length > 0
      ? errorMetrics.length / metrics.length
      : 0;

    const memoryUsage = memoryMetrics.length > 0
      ? memoryMetrics[memoryMetrics.length - 1].value
      : 0;

    const renderPerformance = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    return {
      totalMetrics: metrics.length,
      averageResponseTime,
      errorRate,
      memoryUsage,
      renderPerformance,
    };
  }

  /**
   * 查找阈值违规
   */
  private findThresholdViolations(metrics: PerformanceMetric[]): PerformanceReport['violations'] {
    const violations: PerformanceReport['violations'] = [];

    for (const threshold of this.thresholds) {
      const relevantMetrics = metrics.filter(m => 
        m.name === threshold.name || 
        (threshold.name === 'api_response_time' && m.category === 'api') ||
        (threshold.name === 'render_time' && m.category === 'render')
      );

      for (const metric of relevantMetrics) {
        if (metric.value > threshold.critical) {
          violations.push({
            metric: metric.name,
            value: metric.value,
            threshold: threshold.critical,
            severity: 'critical',
          });
        } else if (metric.value > threshold.warning) {
          violations.push({
            metric: metric.name,
            value: metric.value,
            threshold: threshold.warning,
            severity: 'warning',
          });
        }
      }
    }

    return violations;
  }

  /**
   * 生成性能建议
   */
  private generateRecommendations(
    summary: PerformanceReport['summary'],
    violations: PerformanceReport['violations']
  ): string[] {
    const recommendations: string[] = [];

    if (summary.averageResponseTime > 1500) {
      recommendations.push('API响应时间过长，建议优化后端性能或添加缓存');
    }

    if (summary.errorRate > 0.05) {
      recommendations.push('错误率较高，建议检查错误处理逻辑和API稳定性');
    }

    if (summary.memoryUsage > 50) {
      recommendations.push('内存使用量较高，建议检查内存泄漏和优化数据结构');
    }

    if (summary.renderPerformance > 100) {
      recommendations.push('渲染性能较差，建议使用虚拟滚动或组件懒加载');
    }

    const criticalViolations = violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      recommendations.push(`发现${criticalViolations.length}个严重性能问题，需要立即处理`);
    }

    if (recommendations.length === 0) {
      recommendations.push('性能表现良好，继续保持');
    }

    return recommendations;
  }

  /**
   * 检查阈值
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.thresholds.find(t => 
      t.name === metric.name ||
      (t.name === 'api_response_time' && metric.category === 'api') ||
      (t.name === 'render_time' && metric.category === 'render')
    );

    if (threshold) {
      if (metric.value > threshold.critical) {
        console.error(`Critical performance issue: ${metric.name} = ${metric.value}${threshold.unit} (threshold: ${threshold.critical}${threshold.unit})`);
      } else if (metric.value > threshold.warning) {
        console.warn(`Performance warning: ${metric.name} = ${metric.value}${threshold.unit} (threshold: ${threshold.warning}${threshold.unit})`);
      }
    }
  }

  /**
   * 获取资源类型
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }

  /**
   * 导出性能数据
   */
  exportData(): string {
    const report = this.getPerformanceReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * 获取实时性能指标
   */
  getRealTimeMetrics(): {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    renderTime: number;
  } {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // 最近1分钟

    const apiMetrics = recentMetrics.filter(m => m.category === 'api');
    const errorMetrics = recentMetrics.filter(m => m.category === 'error');
    const renderMetrics = recentMetrics.filter(m => m.category === 'render');
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_usage');

    return {
      responseTime: apiMetrics.length > 0 
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
        : 0,
      errorRate: recentMetrics.length > 0 
        ? errorMetrics.length / recentMetrics.length 
        : 0,
      memoryUsage: memoryMetrics.length > 0 
        ? memoryMetrics[memoryMetrics.length - 1].value 
        : 0,
      renderTime: renderMetrics.length > 0 
        ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
        : 0,
    };
  }
}

// 导出单例实例
export const performanceMonitor = PerformanceMonitor.getInstance();

// 导出装饰器用于自动性能监控
export function measurePerformance(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measureName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureFunction(measureName, () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

export default PerformanceMonitor;