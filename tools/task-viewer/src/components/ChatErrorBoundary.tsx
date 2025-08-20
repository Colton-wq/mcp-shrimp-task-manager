import React, { Component, ReactNode } from 'react';
import { ErrorBoundaryState, AppError } from '../types/error';
import { createErrorBoundaryUtils } from '../utils/errorHandler';
import ErrorFallback from './ErrorFallback';

interface ChatErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: AppError, errorId: string) => void;
  onRetry?: (errorId: string, retryCount: number) => void;
  onRecover?: (errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  isolate?: boolean;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  retryCount: number;
  canRetry: boolean;
  onRetry: () => void;
  onReset: () => void;
  onReportIssue: () => void;
}

/**
 * 聊天错误边界组件
 * 捕获React组件树中的JavaScript错误，提供优雅的错误降级UI
 */
export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private errorBoundaryUtils = createErrorBoundaryUtils();

  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastRetryTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, isolate = false } = this.props;
    
    // 处理错误
    const appError = this.errorBoundaryUtils.handleComponentError(error, errorInfo);
    const errorId = this.errorBoundaryUtils.generateErrorId();

    // 更新状态
    this.setState({
      errorInfo,
      errorId,
    });

    // 调用错误回调
    if (onError) {
      onError(appError, errorId);
    }

    // 如果启用了隔离模式，阻止错误冒泡
    if (isolate) {
      error.preventDefault?.();
    }
  }

  componentDidUpdate(prevProps: ChatErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // 如果有错误且启用了props变化重置
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => prevProps.resetKeys?.[index] !== key
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  // 重置错误边界
  resetErrorBoundary = () => {
    const { onRecover } = this.props;
    const { errorId } = this.state;

    if (errorId && onRecover) {
      onRecover(errorId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      lastRetryTime: null,
    });
  };

  // 重试操作
  handleRetry = () => {
    const { onRetry, maxRetries = 3 } = this.props;
    const { errorId, retryCount, error } = this.state;

    if (!error || !errorId) return;

    // 检查是否可以重试
    const canRetry = this.errorBoundaryUtils.canRetry(error, retryCount, maxRetries);
    
    if (!canRetry) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    const newRetryCount = retryCount + 1;

    // 调用重试回调
    if (onRetry) {
      onRetry(errorId, newRetryCount);
    }

    // 更新重试状态
    this.setState({
      retryCount: newRetryCount,
      lastRetryTime: Date.now(),
    });

    // 延迟重置，给用户一些视觉反馈
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, 1000);
  };

  // 上报问题
  handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (!error || !errorInfo || !errorId) return;

    // 创建问题报告数据
    const issueData = {
      errorId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 复制到剪贴板
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(issueData, null, 2))
        .then(() => {
          alert('错误信息已复制到剪贴板，您可以将其发送给技术支持团队。');
        })
        .catch(() => {
          console.error('Failed to copy error info to clipboard');
        });
    } else {
      // 降级方案：显示错误信息
      const errorText = JSON.stringify(issueData, null, 2);
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>错误报告</title></head>
            <body>
              <h1>错误报告</h1>
              <p>请将以下信息发送给技术支持团队：</p>
              <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">
                ${errorText}
              </pre>
            </body>
          </html>
        `);
      }
    }
  };

  render() {
    const { children, fallback: FallbackComponent = ErrorFallback, enableRetry = true, maxRetries = 3 } = this.props;
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;

    if (hasError && error && errorId) {
      const canRetry = enableRetry && this.errorBoundaryUtils.canRetry(error, retryCount, maxRetries);

      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        errorId,
        retryCount,
        canRetry,
        onRetry: this.handleRetry,
        onReset: this.resetErrorBoundary,
        onReportIssue: this.handleReportIssue,
      };

      return <FallbackComponent {...fallbackProps} />;
    }

    return children;
  }
}

export default ChatErrorBoundary;