import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: HTMLElement | null;
}

/**
 * 键盘快捷键Hook
 * 提供统一的快捷键管理和处理
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
  target,
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef<KeyboardShortcut[]>([]);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  // Create key combination string
  const createKeyCombo = useCallback((event: KeyboardEvent): string => {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }, []);

  // Check if shortcut matches event
  const matchesShortcut = useCallback((shortcut: KeyboardShortcut, event: KeyboardEvent): boolean => {
    if (shortcut.disabled) return false;
    
    const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
    const ctrlMatches = (shortcut.ctrlKey || false) === event.ctrlKey;
    const shiftMatches = (shortcut.shiftKey || false) === event.shiftKey;
    const altMatches = (shortcut.altKey || false) === event.altKey;
    const metaMatches = (shortcut.metaKey || false) === event.metaKey;
    
    return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
  }, []);

  // Handle keydown event
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current) return;

    // Don't trigger shortcuts when typing in input fields
    const activeElement = document.activeElement;
    const isInputField = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    );

    // Allow certain shortcuts even in input fields
    const allowInInputFields = ['escape', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'];
    const isAllowedInInput = allowInInputFields.includes(event.key.toLowerCase());

    if (isInputField && !isAllowedInInput) {
      // Only allow Ctrl+Enter and Ctrl+Shift+Enter in input fields
      if (!(event.ctrlKey && (event.key === 'Enter'))) {
        return;
      }
    }

    // Find matching shortcut
    const matchingShortcut = shortcutsRef.current.find(shortcut => 
      matchesShortcut(shortcut, event)
    );

    if (matchingShortcut) {
      if (matchingShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      
      if (matchingShortcut.stopPropagation !== false) {
        event.stopPropagation();
      }

      try {
        matchingShortcut.action();
      } catch (error) {
        console.error('Error executing keyboard shortcut:', error);
      }
    }
  }, [matchesShortcut]);

  // Set up event listeners
  useEffect(() => {
    const targetElement = target || document;
    
    targetElement.addEventListener('keydown', handleKeyDown);
    
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);

  // Get formatted shortcut display
  const getShortcutDisplay = useCallback((shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.shiftKey) parts.push('Shift');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.metaKey) parts.push('Cmd');
    
    // Format key name
    let keyName = shortcut.key;
    switch (keyName.toLowerCase()) {
      case 'enter':
        keyName = '↵';
        break;
      case 'escape':
        keyName = 'Esc';
        break;
      case 'arrowup':
        keyName = '↑';
        break;
      case 'arrowdown':
        keyName = '↓';
        break;
      case 'arrowleft':
        keyName = '←';
        break;
      case 'arrowright':
        keyName = '→';
        break;
      case ' ':
        keyName = 'Space';
        break;
      default:
        keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    }
    
    parts.push(keyName);
    
    return parts.join(' + ');
  }, []);

  // Get all shortcuts with their display strings
  const getShortcutList = useCallback(() => {
    return shortcutsRef.current.map(shortcut => ({
      ...shortcut,
      display: getShortcutDisplay(shortcut),
    }));
  }, [getShortcutDisplay]);

  return {
    getShortcutDisplay,
    getShortcutList,
  };
}

// Common chat shortcuts
export const createChatShortcuts = (actions: {
  sendMessage: () => void;
  clearMessages: () => void;
  toggleChat: () => void;
  focusInput: () => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  cancelRequest?: () => void;
}): KeyboardShortcut[] => [
  {
    key: 'Enter',
    ctrlKey: true,
    action: actions.sendMessage,
    description: 'Send message',
  },
  {
    key: 'Enter',
    ctrlKey: true,
    shiftKey: true,
    action: actions.sendMessage,
    description: 'Send message (alternative)',
  },
  {
    key: 'Escape',
    action: actions.toggleChat,
    description: 'Toggle chat window',
  },
  {
    key: 'k',
    ctrlKey: true,
    action: actions.clearMessages,
    description: 'Clear chat messages',
  },
  {
    key: 'i',
    ctrlKey: true,
    action: actions.focusInput,
    description: 'Focus input field',
  },
  {
    key: 'Home',
    ctrlKey: true,
    action: actions.scrollToTop,
    description: 'Scroll to top',
  },
  {
    key: 'End',
    ctrlKey: true,
    action: actions.scrollToBottom,
    description: 'Scroll to bottom',
  },
  ...(actions.cancelRequest ? [{
    key: 'Escape',
    ctrlKey: true,
    action: actions.cancelRequest,
    description: 'Cancel current request',
  }] : []),
];

export default useKeyboardShortcuts;