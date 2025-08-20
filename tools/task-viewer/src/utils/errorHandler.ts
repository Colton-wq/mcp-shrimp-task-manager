import {
  ErrorType,
  ErrorSeverity,
  ErrorInfo,
  ErrorReport,
  RetryConfig,
  AppError,
  ErrorClassifier,
  DEFAULT_RETRY_CONFIG,
} from '../types/error';

// 面包屑记录
interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

// 错误处理器类
export class ErrorHandler {
  private static instance: ErrorHandler;
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private reportingEnabled = true;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 生成会话ID
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 设置全局错误处理器
  private setupGlobalErrorHandlers(): void {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new AppError(
          ErrorType.SYSTEM_ERROR,
          `Unhandled Promise Rejection: ${event.reason}`,
          {
            severity: ErrorSeverity.HIGH,
            details: event.reason,
            context: { type: 'unhandledrejection' },
          }
        )
      );
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError(
        new AppError(
          ErrorType.SYSTEM_ERROR,
          event.message,
          {
            severity: ErrorSeverity.HIGH,
            details: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              error: event.error,
            },
            context: { type: 'javascript_error' },
          }
        )
      );
    });
  }

  // 添加面包屑
  addBreadcrumb(
    category: string,
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, unknown>
  ): void {
    const breadcrumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // 保持面包屑数量在限制内
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  // 处理错误
  async handleError(error: Error | AppError, context?: Record<string, unknown>): Promise<void> {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      const classification = ErrorClassifier.classify(error);
      appError = new AppError(
        classification.type,
        error.message,
        {
          severity: classification.severity,
          details: error,
          context,
          cause: error,
        }
      );
    }

    // 添加错误面包屑
    this.addBreadcrumb(
      'error',
      appError.message,
      'error',
      {
        type: appError.type,
        severity: appError.severity,
        code: appError.code,
      }
    );

    // 上报错误
    if (this.reportingEnabled) {
      try {
        await this.reportError(appError);
      } catch (reportError) {
        console.error('Failed to report error:', reportError);
      }
    }

    // 控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', appError);
    }
  }

  // 上报错误
  private async reportError(error: AppError): Promise<void> {
    try {
      const errorReport: ErrorReport = {
        errorInfo: error.toErrorInfo(),
        environment: this.getEnvironmentInfo(),
        performance: this.getPerformanceInfo(),
        breadcrumbs: this.breadcrumbs.slice(-10), // 只发送最近10个面包屑
      };

      const response = await fetch('/api/error-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.statusText}`);
      }
    } catch (reportError) {
      // 静默失败，避免错误上报本身引起更多错误
      console.warn('Error reporting failed:', reportError);
    }
  }

  // 获取环境信息
  private getEnvironmentInfo() {
    return {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // 获取性能信息
  private getPerformanceInfo() {
    const performance = window.performance;
    const memory = (performance as any).memory;

    return {
      memory: memory ? memory.usedJSHeapSize : undefined,
      timing: performance.timing ? {
        navigationStart: performance.timing.navigationStart,
        loadEventEnd: performance.timing.loadEventEnd,
        domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
      } : undefined,
    };
  }

  // 启用/禁用错误上报
  setReportingEnabled(enabled: boolean): void {
    this.reportingEnabled = enabled;
  }

  // 清除面包屑
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  // 获取面包屑
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}

// 重试工具函数
export class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;
    let retryCount = 0;

    while (retryCount <= finalConfig.maxRetries) {
      try {
        const result = await operation();
        
        // 如果成功且之前有重试，记录恢复
        if (retryCount > 0) {
          ErrorHandler.getInstance().addBreadcrumb(
            'retry',
            `Operation succeeded after ${retryCount} retries`,
            'info',
            { retryCount, operation: operation.name }
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        
        // 检查是否应该重试
        const shouldRetry = finalConfig.shouldRetry
          ? finalConfig.shouldRetry(lastError, retryCount)
          : AppError.isRetryable(lastError);

        if (!shouldRetry || retryCount >= finalConfig.maxRetries) {
          break;
        }

        retryCount++;
        
        // 计算延迟时间（指数退避）
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, retryCount - 1),
          finalConfig.maxDelay
        );

        // 记录重试
        ErrorHandler.getInstance().addBreadcrumb(
          'retry',
          `Retrying operation (attempt ${retryCount}/${finalConfig.maxRetries})`,
          'warning',
          {
            error: lastError.message,
            delay,
            retryCount,
          }
        );

        // 等待延迟
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // 所有重试都失败了
    const finalError = new AppError(
      ErrorType.SYSTEM_ERROR,
      `Operation failed after ${retryCount} retries: ${lastError.message}`,
      {
        severity: ErrorSeverity.HIGH,
        details: lastError,
        context: { retryCount, maxRetries: finalConfig.maxRetries },
        cause: lastError,
      }
    );

    throw finalError;
  }
}

// 错误边界工具函数
export const createErrorBoundaryUtils = () => {
  const errorHandler = ErrorHandler.getInstance();

  return {
    // 处理组件错误
    handleComponentError: (error: Error, errorInfo: React.ErrorInfo) => {
      const appError = new AppError(
        ErrorType.SYSTEM_ERROR,
        `React Component Error: ${error.message}`,
        {
          severity: ErrorSeverity.HIGH,
          details: {
            error,
            errorInfo,
            componentStack: errorInfo.componentStack,
          },
          context: { type: 'react_error_boundary' },
          cause: error,
        }
      );

      errorHandler.handleError(appError);
      return appError;
    },

    // 生成错误ID
    generateErrorId: () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // 检查是否可以重试
    canRetry: (error: Error, retryCount: number, maxRetries: number = 3) => {
      return retryCount < maxRetries && AppError.isRetryable(error);
    },

    // 获取用户友好的错误消息
    getUserFriendlyMessage: (error: Error | AppError, t: (key: string, options?: any) => string) => {
      if (error instanceof AppError) {
        switch (error.type) {
          case ErrorType.NETWORK_ERROR:
            return t('errors.network', 'Network connection failed. Please check your internet connection.');
          case ErrorType.API_ERROR:
            return t('errors.api', 'Server error occurred. Please try again later.');
          case ErrorType.TIMEOUT_ERROR:
            return t('errors.timeout', 'Request timed out. Please try again.');
          case ErrorType.AUTHENTICATION_ERROR:
            return t('errors.auth', 'Authentication failed. Please log in again.');
          case ErrorType.PERMISSION_ERROR:
            return t('errors.permission', 'You do not have permission to perform this action.');
          case ErrorType.RATE_LIMIT_ERROR:
            return t('errors.rateLimit', 'Too many requests. Please wait a moment and try again.');
          case ErrorType.VALIDATION_ERROR:
            return t('errors.validation', 'Invalid input. Please check your data and try again.');
          default:
            return t('errors.unknown', 'An unexpected error occurred. Please try again.');
        }
      }

      return t('errors.unknown', 'An unexpected error occurred. Please try again.');
    },
  };
};

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance();

export default {
  ErrorHandler,
  RetryManager,
  createErrorBoundaryUtils,
  errorHandler,
};