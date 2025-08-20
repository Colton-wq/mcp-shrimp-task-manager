import { z } from 'zod';

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  SYSTEM_ERROR = 'system_error',
  TIMEOUT_ERROR = 'timeout_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  PERMISSION_ERROR = 'permission_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  UNKNOWN_ERROR = 'unknown_error',
}

// 错误严重级别
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 错误信息Schema
export const ErrorInfoSchema = z.object({
  type: z.nativeEnum(ErrorType),
  severity: z.nativeEnum(ErrorSeverity),
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  stack: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type ErrorInfo = z.infer<typeof ErrorInfoSchema>;

// 错误边界状态
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  lastRetryTime: number | null;
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: ErrorType[];
  shouldRetry?: (error: Error, retryCount: number) => boolean;
}

// 默认重试配置
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.RATE_LIMIT_ERROR,
  ],
};

// 错误上报数据
export const ErrorReportSchema = z.object({
  errorInfo: ErrorInfoSchema,
  environment: z.object({
    userAgent: z.string(),
    url: z.string(),
    timestamp: z.string().datetime(),
    viewport: z.object({
      width: z.number(),
      height: z.number(),
    }),
    screen: z.object({
      width: z.number(),
      height: z.number(),
    }),
    language: z.string(),
    timezone: z.string(),
  }),
  performance: z.object({
    memory: z.number().optional(),
    timing: z.record(z.number()).optional(),
  }).optional(),
  breadcrumbs: z.array(z.object({
    timestamp: z.string().datetime(),
    category: z.string(),
    message: z.string(),
    level: z.enum(['debug', 'info', 'warning', 'error']),
    data: z.record(z.unknown()).optional(),
  })).optional(),
});

export type ErrorReport = z.infer<typeof ErrorReportSchema>;

// 错误恢复策略
export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'reload' | 'ignore';
  config?: {
    retryConfig?: Partial<RetryConfig>;
    fallbackComponent?: React.ComponentType;
    redirectUrl?: string;
    reloadDelay?: number;
  };
}

// 错误处理选项
export interface ErrorHandlerOptions {
  enableReporting: boolean;
  enableRetry: boolean;
  retryConfig: RetryConfig;
  recoveryStrategy: ErrorRecoveryStrategy;
  onError?: (error: ErrorInfo) => void;
  onRetry?: (error: ErrorInfo, retryCount: number) => void;
  onRecover?: (error: ErrorInfo) => void;
}

// 默认错误处理选项
export const DEFAULT_ERROR_HANDLER_OPTIONS: ErrorHandlerOptions = {
  enableReporting: true,
  enableRetry: true,
  retryConfig: DEFAULT_RETRY_CONFIG,
  recoveryStrategy: {
    type: 'retry',
  },
};

// 自定义错误类
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      code?: string;
      details?: unknown;
      context?: Record<string, unknown>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.code = options.code;
    this.details = options.details;
    this.timestamp = new Date().toISOString();
    this.context = options.context;

    if (options.cause) {
      this.cause = options.cause;
      this.stack = options.cause.stack;
    }
  }

  toErrorInfo(): ErrorInfo {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      context: this.context,
    };
  }

  static fromError(error: Error, type: ErrorType = ErrorType.UNKNOWN_ERROR): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(type, error.message, {
      details: error,
      cause: error,
    });
  }

  static isRetryable(error: Error | AppError): boolean {
    if (error instanceof AppError) {
      return DEFAULT_RETRY_CONFIG.retryableErrors.includes(error.type);
    }

    // Check common retryable error patterns
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('rate limit') ||
      message.includes('503') ||
      message.includes('502') ||
      message.includes('504')
    );
  }
}

// 错误分类器
export class ErrorClassifier {
  static classify(error: Error): { type: ErrorType; severity: ErrorSeverity } {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('cors')
    ) {
      return { type: ErrorType.NETWORK_ERROR, severity: ErrorSeverity.MEDIUM };
    }

    // API errors
    if (
      message.includes('api') ||
      message.includes('http') ||
      message.includes('status') ||
      /\d{3}/.test(message) // HTTP status codes
    ) {
      const severity = message.includes('5') ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
      return { type: ErrorType.API_ERROR, severity };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return { type: ErrorType.TIMEOUT_ERROR, severity: ErrorSeverity.MEDIUM };
    }

    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      stack.includes('zod')
    ) {
      return { type: ErrorType.VALIDATION_ERROR, severity: ErrorSeverity.LOW };
    }

    // Authentication errors
    if (
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('401')
    ) {
      return { type: ErrorType.AUTHENTICATION_ERROR, severity: ErrorSeverity.HIGH };
    }

    // Permission errors
    if (
      message.includes('permission') ||
      message.includes('forbidden') ||
      message.includes('403')
    ) {
      return { type: ErrorType.PERMISSION_ERROR, severity: ErrorSeverity.HIGH };
    }

    // Rate limit errors
    if (
      message.includes('rate limit') ||
      message.includes('too many') ||
      message.includes('429')
    ) {
      return { type: ErrorType.RATE_LIMIT_ERROR, severity: ErrorSeverity.MEDIUM };
    }

    // System errors
    if (
      message.includes('system') ||
      message.includes('internal') ||
      message.includes('500') ||
      stack.includes('react') ||
      stack.includes('component')
    ) {
      return { type: ErrorType.SYSTEM_ERROR, severity: ErrorSeverity.HIGH };
    }

    // Default to unknown error
    return { type: ErrorType.UNKNOWN_ERROR, severity: ErrorSeverity.MEDIUM };
  }
}

export default {
  ErrorType,
  ErrorSeverity,
  AppError,
  ErrorClassifier,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_ERROR_HANDLER_OPTIONS,
};