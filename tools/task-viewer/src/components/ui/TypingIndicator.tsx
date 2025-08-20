import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TypingIndicator.module.css';

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
  agentName?: string;
  className?: string;
}

/**
 * AI思考状态指示器组件
 * 显示AI正在处理请求的动画效果
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  message,
  agentName,
  className,
}) => {
  const { t } = useTranslation();

  if (!isVisible) return null;

  const defaultMessage = message || t('chat.aiThinking', 'AI is thinking...');
  const displayMessage = agentName 
    ? t('chat.agentThinking', '{{agent}} is thinking...', { agent: agentName })
    : defaultMessage;

  return (
    <div 
      className={`${styles.container} ${className || ''}`}
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      <div className={styles.messageWrapper}>
        <div className={styles.avatar}>
          <div className={styles.avatarIcon}>🤖</div>
        </div>
        
        <div className={styles.messageContent}>
          <div className={styles.messageText}>
            {displayMessage}
          </div>
          
          <div className={styles.dotsContainer}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;