import { useState, useCallback, useRef } from 'react';
import { RetryConfig, AppError, DEFAULT_RETRY_CONFIG } from '../types/error';
import { RetryManager } from '../utils/errorHandler';

interface UseRetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  canRetry: boolean;
}

interface UseRetryOptions extends Partial<RetryConfig> {
  onRetry?: (retryCount: number, error: Error) => void;
  onSuccess?: (result: any, retryCount: number) => void;
  onFailure?: (error: Error, retryCount: number) => void;
  onMaxRetriesReached?: (error: Error, retryCount: number) => void;
}

/**
 * 智能重试Hook
 * 提供自动重试功能，支持指数退避策略
 */
export function useRetry<T = any>(options: UseRetryOptions = {}) {
  const [state, setState] = useState<UseRetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    canRetry: true,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...options,
  };

  // 执行带重试的操作
  const executeWithRetry = useCallback(async (
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const finalConfig = { ...config, ...customConfig };
    
    // 取消之前的操作
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: 0,
      lastError: null,
      canRetry: true,
    }));

    try {
      const result = await RetryManager.withRetry(async () => {
        // 检查是否被取消
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        return await operation();
      }, {
        ...finalConfig,
        shouldRetry: (error: Error, retryCount: number) => {
          // 更新状态
          setState(prev => ({
            ...prev,
            retryCount,
            lastError: error,
            canRetry: retryCount < finalConfig.maxRetries && AppError.isRetryable(error),
          }));

          // 调用重试回调
          if (options.onRetry) {
            options.onRetry(retryCount, error);
          }

          // 检查是否应该重试
          const shouldRetry = finalConfig.shouldRetry
            ? finalConfig.shouldRetry(error, retryCount)
            : AppError.isRetryable(error);

          return shouldRetry && retryCount < finalConfig.maxRetries;
        },
      });

      // 成功
      setState(prev => ({
        ...prev,
        isRetrying: false,
        canRetry: true,
      }));

      if (options.onSuccess) {
        options.onSuccess(result, state.retryCount);
      }

      return result;

    } catch (error) {
      const finalError = error as Error;
      
      setState(prev => ({
        ...prev,
        isRetrying: false,
        lastError: finalError,
        canRetry: false,
      }));

      // 检查是否达到最大重试次数
      if (state.retryCount >= finalConfig.maxRetries && options.onMaxRetriesReached) {
        options.onMaxRetriesReached(finalError, state.retryCount);
      }

      if (options.onFailure) {
        options.onFailure(finalError, state.retryCount);
      }

      throw finalError;
    }
  }, [config, options, state.retryCount]);

  // 手动重试
  const retry = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    if (!state.canRetry || state.isRetrying) {
      throw new Error('Cannot retry at this time');
    }

    return executeWithRetry(operation);
  }, [state.canRetry, state.isRetrying, executeWithRetry]);

  // 取消操作
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setState(prev => ({
      ...prev,
      isRetrying: false,
      canRetry: true,
    }));
  }, []);

  // 重置状态
  const reset = useCallback(() => {
    cancel();
    
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: true,
    });
  }, [cancel]);

  // 计算下次重试延迟
  const getNextRetryDelay = useCallback((retryCount: number = state.retryCount): number => {
    return Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, retryCount),
      config.maxDelay
    );
  }, [config, state.retryCount]);

  // 检查错误是否可重试
  const isRetryableError = useCallback((error: Error): boolean => {
    return AppError.isRetryable(error);
  }, []);

  // 获取重试进度
  const getRetryProgress = useCallback(() => {
    return {
      current: state.retryCount,
      max: config.maxRetries,
      percentage: (state.retryCount / config.maxRetries) * 100,
    };
  }, [state.retryCount, config.maxRetries]);

  // 清理函数
  const cleanup = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    // 状态
    ...state,
    
    // 配置
    config,
    
    // 方法
    executeWithRetry,
    retry,
    cancel,
    reset,
    cleanup,
    
    // 工具函数
    getNextRetryDelay,
    isRetryableError,
    getRetryProgress,
  };
}

// 专用于API请求的重试Hook
export function useApiRetry<T = any>(options: UseRetryOptions = {}) {
  const apiConfig: Partial<RetryConfig> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: [
      'network_error',
      'timeout_error',
      'rate_limit_error',
    ] as any,
    ...options,
  };

  return useRetry<T>({
    ...apiConfig,
    shouldRetry: (error: Error, retryCount: number) => {
      // API特定的重试逻辑
      const message = error.message.toLowerCase();
      
      // 不重试的错误类型
      if (
        message.includes('401') ||
        message.includes('403') ||
        message.includes('404') ||
        message.includes('validation') ||
        message.includes('invalid')
      ) {
        return false;
      }

      // 可重试的错误类型
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504') ||
        message.includes('rate limit') ||
        message.includes('429')
      );
    },
    ...options,
  });
}

export default useRetry;