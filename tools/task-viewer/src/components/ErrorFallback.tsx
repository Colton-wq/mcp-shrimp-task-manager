import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorFallbackProps } from './ChatErrorBoundary';
import { createErrorBoundaryUtils } from '../utils/errorHandler';
import styles from './ErrorFallback.module.css';

/**
 * 错误降级UI组件
 * 当ChatErrorBoundary捕获到错误时显示的用户界面
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  retryCount,
  canRetry,
  onRetry,
  onReset,
  onReportIssue,
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const errorBoundaryUtils = createErrorBoundaryUtils();

  // 处理重试
  const handleRetry = async () => {
    setIsRetrying(true);
    
    // 添加一些延迟以提供视觉反馈
    setTimeout(() => {
      onRetry();
      setIsRetrying(false);
    }, 1000);
  };

  // 获取用户友好的错误消息
  const getUserFriendlyMessage = () => {
    return errorBoundaryUtils.getUserFriendlyMessage(error, t);
  };

  // 获取错误类型图标
  const getErrorIcon = () => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return '🌐';
    } else if (message.includes('timeout')) {
      return '⏱️';
    } else if (message.includes('auth')) {
      return '🔐';
    } else if (message.includes('permission')) {
      return '🚫';
    } else {
      return '⚠️';
    }
  };

  // 获取建议操作
  const getSuggestions = () => {
    const message = error.message.toLowerCase();
    const suggestions = [];

    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push(t('errors.suggestions.checkConnection', 'Check your internet connection'));
      suggestions.push(t('errors.suggestions.refreshPage', 'Refresh the page'));
    } else if (message.includes('timeout')) {
      suggestions.push(t('errors.suggestions.tryAgain', 'Try again in a moment'));
      suggestions.push(t('errors.suggestions.checkConnection', 'Check your internet connection'));
    } else if (message.includes('auth')) {
      suggestions.push(t('errors.suggestions.relogin', 'Try logging in again'));
      suggestions.push(t('errors.suggestions.clearCache', 'Clear browser cache'));
    } else {
      suggestions.push(t('errors.suggestions.refresh', 'Refresh the page'));
      suggestions.push(t('errors.suggestions.tryLater', 'Try again later'));
    }

    return suggestions;
  };

  return (
    <div className={styles.container} role="alert" aria-live="assertive">
      <div className={styles.content}>
        {/* 错误图标和标题 */}
        <div className={styles.header}>
          <div className={styles.icon} aria-hidden="true">
            {getErrorIcon()}
          </div>
          <h2 className={styles.title}>
            {t('errors.title', 'Something went wrong')}
          </h2>
        </div>

        {/* 错误消息 */}
        <div className={styles.message}>
          <p className={styles.description}>
            {getUserFriendlyMessage()}
          </p>
          
          {retryCount > 0 && (
            <p className={styles.retryInfo}>
              {t('errors.retryAttempt', 'Retry attempt: {{count}}', { count: retryCount })}
            </p>
          )}
        </div>

        {/* 建议操作 */}
        <div className={styles.suggestions}>
          <h3 className={styles.suggestionsTitle}>
            {t('errors.suggestions.title', 'What you can try:')}
          </h3>
          <ul className={styles.suggestionsList}>
            {getSuggestions().map((suggestion, index) => (
              <li key={index} className={styles.suggestion}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          {canRetry && (
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={handleRetry}
              disabled={isRetrying}
              aria-label={t('errors.actions.retry', 'Retry')}
            >
              {isRetrying ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  {t('errors.actions.retrying', 'Retrying...')}
                </>
              ) : (
                <>
                  <span aria-hidden="true">🔄</span>
                  {t('errors.actions.retry', 'Retry')}
                </>
              )}
            </button>
          )}

          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={onReset}
            aria-label={t('errors.actions.reset', 'Reset')}
          >
            <span aria-hidden="true">🏠</span>
            {t('errors.actions.reset', 'Reset')}
          </button>

          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => window.location.reload()}
            aria-label={t('errors.actions.refresh', 'Refresh Page')}
          >
            <span aria-hidden="true">🔄</span>
            {t('errors.actions.refresh', 'Refresh Page')}
          </button>
        </div>

        {/* 错误详情切换 */}
        <div className={styles.detailsToggle}>
          <button
            className={styles.toggleButton}
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls="error-details"
          >
            {showDetails ? '▼' : '▶'} {t('errors.showDetails', 'Show Details')}
          </button>
        </div>

        {/* 错误详情 */}
        {showDetails && (
          <div id="error-details" className={styles.details}>
            <div className={styles.errorInfo}>
              <h4 className={styles.detailsTitle}>
                {t('errors.technicalDetails', 'Technical Details')}
              </h4>
              
              <div className={styles.errorField}>
                <strong>{t('errors.errorId', 'Error ID')}:</strong>
                <code className={styles.code}>{errorId}</code>
              </div>

              <div className={styles.errorField}>
                <strong>{t('errors.errorType', 'Error Type')}:</strong>
                <code className={styles.code}>{error.name}</code>
              </div>

              <div className={styles.errorField}>
                <strong>{t('errors.errorMessage', 'Error Message')}:</strong>
                <code className={styles.code}>{error.message}</code>
              </div>

              {error.stack && (
                <div className={styles.errorField}>
                  <strong>{t('errors.stackTrace', 'Stack Trace')}:</strong>
                  <pre className={styles.stackTrace}>
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div className={styles.errorField}>
                  <strong>{t('errors.componentStack', 'Component Stack')}:</strong>
                  <pre className={styles.stackTrace}>
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>

            <div className={styles.reportSection}>
              <p className={styles.reportText}>
                {t('errors.reportHelp', 'If this problem persists, please report it to our support team.')}
              </p>
              <button
                className={`${styles.button} ${styles.reportButton}`}
                onClick={onReportIssue}
                aria-label={t('errors.actions.report', 'Report Issue')}
              >
                <span aria-hidden="true">📋</span>
                {t('errors.actions.report', 'Copy Error Info')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorFallback;