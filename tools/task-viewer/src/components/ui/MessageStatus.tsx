import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './MessageStatus.module.css';

export type MessageStatusType = 'sending' | 'sent' | 'error' | 'delivered' | 'read';

interface MessageStatusProps {
  status: MessageStatusType;
  timestamp?: string;
  error?: string;
  className?: string;
  showTimestamp?: boolean;
}

/**
 * 消息状态指示器组件
 * 显示消息的发送状态和时间戳
 */
export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  timestamp,
  error,
  className,
  showTimestamp = true,
}) => {
  const { t } = useTranslation();

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className={styles.sendingIcon}>
            <div className={styles.spinner}></div>
          </div>
        );
      case 'sent':
        return <span className={styles.sentIcon}>✓</span>;
      case 'delivered':
        return <span className={styles.deliveredIcon}>✓✓</span>;
      case 'read':
        return <span className={styles.readIcon}>✓✓</span>;
      case 'error':
        return <span className={styles.errorIcon}>⚠</span>;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return t('chat.status.sending', 'Sending...');
      case 'sent':
        return t('chat.status.sent', 'Sent');
      case 'delivered':
        return t('chat.status.delivered', 'Delivered');
      case 'read':
        return t('chat.status.read', 'Read');
      case 'error':
        return error || t('chat.status.error', 'Failed to send');
      default:
        return '';
    }
  };

  const getStatusClass = () => {
    return styles[status] || '';
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return t('chat.timestamp.now', 'now');
      } else if (diffMins < 60) {
        return t('chat.timestamp.minutes', '{{count}}m ago', { count: diffMins });
      } else if (diffHours < 24) {
        return t('chat.timestamp.hours', '{{count}}h ago', { count: diffHours });
      } else if (diffDays < 7) {
        return t('chat.timestamp.days', '{{count}}d ago', { count: diffDays });
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return timestamp;
    }
  };

  return (
    <div 
      className={`${styles.container} ${getStatusClass()} ${className || ''}`}
      role="status"
      aria-label={getStatusText()}
    >
      <div className={styles.statusIcon}>
        {getStatusIcon()}
      </div>
      
      {showTimestamp && timestamp && (
        <div className={styles.timestamp}>
          {formatTimestamp(timestamp)}
        </div>
      )}
      
      {status === 'error' && error && (
        <div className={styles.errorMessage} title={error}>
          {error.length > 30 ? `${error.substring(0, 30)}...` : error}
        </div>
      )}
    </div>
  );
};

export default MessageStatus;