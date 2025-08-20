import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatErrorBoundary from './ChatErrorBoundary';
import { useRetry, useApiRetry } from '../hooks/useRetry';
import { errorHandler } from '../utils/errorHandler';
import { AppError, ErrorType, ErrorSeverity } from '../types/error';
import styles from './ErrorHandlingExample.module.css';

/**
 * 错误处理集成示例组件
 * 演示如何在ChatAgent中集成完整的错误处理功能
 */
export const ErrorHandlingExample: React.FC = () => {
  const { t } = useTranslation();
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 通用重试Hook
  const {
    executeWithRetry,
    isRetrying,
    retryCount,
    lastError,
    canRetry,
    reset: resetRetry,
  } = useRetry({
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (count, error) => {
      console.log(`Retrying (${count}/3):`, error.message);
      errorHandler.addBreadcrumb('retry', `Retry attempt ${count}`, 'info', { error: error.message });
    },
    onSuccess: (result, count) => {
      if (count > 0) {
        console.log(`Operation succeeded after ${count} retries`);
      }
    },
    onMaxRetriesReached: (error, count) => {
      console.error(`Max retries (${count}) reached:`, error.message);
    },
  });

  // API专用重试Hook
  const apiRetry = useApiRetry({
    onRetry: (count, error) => {
      setTestResult(prev => prev + `\n🔄 API重试 ${count}/3: ${error.message}`);
    },
  });

  // 模拟网络错误
  const simulateNetworkError = async () => {
    throw new AppError(
      ErrorType.NETWORK_ERROR,
      'Failed to fetch data from server',
      {
        severity: ErrorSeverity.MEDIUM,
        code: 'NETWORK_001',
        details: { url: '/api/test', method: 'GET' },
      }
    );
  };

  // 模拟API错误
  const simulateApiError = async () => {
    const random = Math.random();
    if (random < 0.3) {
      throw new AppError(ErrorType.API_ERROR, 'Server returned 500 Internal Server Error', {
        severity: ErrorSeverity.HIGH,
        code: 'API_500',
      });
    } else if (random < 0.6) {
      throw new AppError(ErrorType.TIMEOUT_ERROR, 'Request timeout after 30 seconds', {
        severity: ErrorSeverity.MEDIUM,
        code: 'TIMEOUT_001',
      });
    } else {
      return { data: 'Success!', timestamp: new Date().toISOString() };
    }
  };

  // 模拟组件错误
  const simulateComponentError = () => {
    throw new Error('Simulated React component error');
  };

  // 测试网络重试
  const testNetworkRetry = async () => {
    setIsLoading(true);
    setTestResult('🌐 测试网络错误重试...\n');

    try {
      await executeWithRetry(simulateNetworkError);
      setTestResult(prev => prev + '✅ 意外成功（这不应该发生）');
    } catch (error) {
      setTestResult(prev => prev + `❌ 最终失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试API重试
  const testApiRetry = async () => {
    setIsLoading(true);
    setTestResult('🔌 测试API错误重试...\n');

    try {
      const result = await apiRetry.executeWithRetry(simulateApiError);
      setTestResult(prev => prev + `✅ 成功: ${JSON.stringify(result)}`);
    } catch (error) {
      setTestResult(prev => prev + `❌ 最终失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试错误上报
  const testErrorReporting = async () => {
    setIsLoading(true);
    setTestResult('📊 测试错误上报...\n');

    try {
      const testError = new AppError(
        ErrorType.SYSTEM_ERROR,
        'Test error for reporting',
        {
          severity: ErrorSeverity.LOW,
          code: 'TEST_001',
          context: { component: 'ErrorHandlingExample', action: 'testErrorReporting' },
        }
      );

      await errorHandler.handleError(testError);
      setTestResult(prev => prev + '✅ 错误已上报到服务器');
    } catch (error) {
      setTestResult(prev => prev + `❌ 错误上报失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试面包屑记录
  const testBreadcrumbs = () => {
    setTestResult('🍞 测试面包屑记录...\n');

    // 添加一些面包屑
    errorHandler.addBreadcrumb('user', '用户点击了测试按钮', 'info');
    errorHandler.addBreadcrumb('navigation', '导航到错误处理示例页面', 'info');
    errorHandler.addBreadcrumb('api', '准备发送API请求', 'debug');
    errorHandler.addBreadcrumb('error', '模拟错误发生', 'error', { errorType: 'test' });

    const breadcrumbs = errorHandler.getBreadcrumbs();
    setTestResult(prev => prev + `✅ 已记录 ${breadcrumbs.length} 个面包屑:\n`);
    
    breadcrumbs.slice(-4).forEach((crumb, index) => {
      setTestResult(prev => prev + `${index + 1}. [${crumb.level}] ${crumb.category}: ${crumb.message}\n`);
    });
  };

  // 清除测试结果
  const clearResults = () => {
    setTestResult('');
    resetRetry();
    apiRetry.reset();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>错误处理系统演示</h2>
      
      <div className={styles.description}>
        <p>这个组件演示了完整的错误处理功能，包括：</p>
        <ul>
          <li>智能重试机制（指数退避策略）</li>
          <li>错误分类和上报</li>
          <li>面包屑记录</li>
          <li>React错误边界</li>
          <li>用户友好的错误提示</li>
        </ul>
      </div>

      {/* 测试按钮 */}
      <div className={styles.controls}>
        <button
          className={styles.button}
          onClick={testNetworkRetry}
          disabled={isLoading}
        >
          🌐 测试网络重试
        </button>

        <button
          className={styles.button}
          onClick={testApiRetry}
          disabled={isLoading}
        >
          🔌 测试API重试
        </button>

        <button
          className={styles.button}
          onClick={testErrorReporting}
          disabled={isLoading}
        >
          📊 测试错误上报
        </button>

        <button
          className={styles.button}
          onClick={testBreadcrumbs}
          disabled={isLoading}
        >
          🍞 测试面包屑
        </button>

        <ChatErrorBoundary
          enableRetry={true}
          maxRetries={2}
          onError={(error, errorId) => {
            setTestResult(prev => prev + `\n🚨 错误边界捕获: ${error.message} (ID: ${errorId})`);
          }}
        >
          <button
            className={`${styles.button} ${styles.dangerButton}`}
            onClick={simulateComponentError}
            disabled={isLoading}
          >
            💥 测试组件错误
          </button>
        </ChatErrorBoundary>

        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          onClick={clearResults}
          disabled={isLoading}
        >
          🗑️ 清除结果
        </button>
      </div>

      {/* 重试状态显示 */}
      {(isRetrying || apiRetry.isRetrying) && (
        <div className={styles.retryStatus}>
          <div className={styles.spinner}></div>
          <span>
            正在重试... ({Math.max(retryCount, apiRetry.retryCount)}/3)
          </span>
        </div>
      )}

      {/* 测试结果显示 */}
      {testResult && (
        <div className={styles.results}>
          <h3 className={styles.resultsTitle}>测试结果:</h3>
          <pre className={styles.resultsContent}>{testResult}</pre>
        </div>
      )}

      {/* 错误信息显示 */}
      {(lastError || apiRetry.lastError) && (
        <div className={styles.errorInfo}>
          <h3 className={styles.errorTitle}>最后的错误:</h3>
          <div className={styles.errorDetails}>
            <strong>消息:</strong> {(lastError || apiRetry.lastError)?.message}
          </div>
          <div className={styles.errorDetails}>
            <strong>重试次数:</strong> {Math.max(retryCount, apiRetry.retryCount)}
          </div>
          <div className={styles.errorDetails}>
            <strong>可以重试:</strong> {(canRetry || apiRetry.canRetry) ? '是' : '否'}
          </div>
        </div>
      )}

      {/* 集成说明 */}
      <div className={styles.integration}>
        <h3 className={styles.integrationTitle}>集成到ChatAgent的建议:</h3>
        <ol className={styles.integrationList}>
          <li>在ChatAgent根组件外包装ChatErrorBoundary</li>
          <li>在API调用中使用useApiRetry Hook</li>
          <li>在关键操作前后添加面包屑记录</li>
          <li>为不同类型的错误提供特定的用户提示</li>
          <li>在生产环境中启用错误上报功能</li>
        </ol>
      </div>
    </div>
  );
};

export default ErrorHandlingExample;