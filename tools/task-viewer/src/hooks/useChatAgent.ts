import { useReducer, useCallback, useEffect, useRef } from 'react';
import { MessageStatusType } from '../components/ui/MessageStatus';

// Message interface
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: MessageStatusType;
  error?: string;
  agentName?: string;
  metadata?: {
    analysisType?: string;
    processingTime?: number;
    tokens?: number;
  };
}

// Chat state interface
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  isMinimized: boolean;
  chatMode: 'normal' | 'expanded' | 'floating';
  floatingPosition: { x: number; y: number };
  isDragging: boolean;
  selectedAgents: Record<string, boolean>;
  availableAgents: any[];
  agentsExpanded: boolean;
  inputMessage: string;
  error: string | null;
  lastActivity: string | null;
}

// Action types
type ChatAction =
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_MINIMIZED'; payload: boolean }
  | { type: 'SET_CHAT_MODE'; payload: ChatState['chatMode'] }
  | { type: 'SET_FLOATING_POSITION'; payload: { x: number; y: number } }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'SET_SELECTED_AGENTS'; payload: Record<string, boolean> }
  | { type: 'SET_AVAILABLE_AGENTS'; payload: any[] }
  | { type: 'SET_AGENTS_EXPANDED'; payload: boolean }
  | { type: 'SET_INPUT_MESSAGE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_LAST_ACTIVITY' };

// Initial state
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  isOpen: false,
  isMinimized: false,
  chatMode: 'normal',
  floatingPosition: { x: 100, y: 100 },
  isDragging: false,
  selectedAgents: { openai: true },
  availableAgents: [],
  agentsExpanded: true,
  inputMessage: '',
  error: null,
  lastActivity: null,
};

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload, lastActivity: new Date().toISOString() };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        lastActivity: new Date().toISOString()
      };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
        ),
        lastActivity: new Date().toISOString()
      };
    
    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
        lastActivity: new Date().toISOString()
      };
    
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [], lastActivity: new Date().toISOString() };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload };
    
    case 'SET_MINIMIZED':
      return { ...state, isMinimized: action.payload };
    
    case 'SET_CHAT_MODE':
      return { ...state, chatMode: action.payload };
    
    case 'SET_FLOATING_POSITION':
      return { ...state, floatingPosition: action.payload };
    
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    
    case 'SET_SELECTED_AGENTS':
      return { ...state, selectedAgents: action.payload };
    
    case 'SET_AVAILABLE_AGENTS':
      return { ...state, availableAgents: action.payload };
    
    case 'SET_AGENTS_EXPANDED':
      return { ...state, agentsExpanded: action.payload };
    
    case 'SET_INPUT_MESSAGE':
      return { ...state, inputMessage: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'UPDATE_LAST_ACTIVITY':
      return { ...state, lastActivity: new Date().toISOString() };
    
    default:
      return state;
  }
}

// Custom hook
export function useChatAgent(profileId?: string) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved state from localStorage
  useEffect(() => {
    if (!profileId) return;

    try {
      // Load agent selections
      const savedSelections = localStorage.getItem(`chatAgentSelections_${profileId}`);
      if (savedSelections) {
        const selections = JSON.parse(savedSelections);
        dispatch({ type: 'SET_SELECTED_AGENTS', payload: selections });
      }

      // Load agents expanded state
      const savedExpanded = localStorage.getItem('chatAgentsExpanded');
      if (savedExpanded !== null) {
        dispatch({ type: 'SET_AGENTS_EXPANDED', payload: JSON.parse(savedExpanded) });
      }

      // Load chat mode
      const savedMode = localStorage.getItem(`chatMode_${profileId}`);
      if (savedMode) {
        dispatch({ type: 'SET_CHAT_MODE', payload: savedMode as ChatState['chatMode'] });
      }

      // Load floating position
      const savedPosition = localStorage.getItem(`chatFloatingPosition_${profileId}`);
      if (savedPosition) {
        dispatch({ type: 'SET_FLOATING_POSITION', payload: JSON.parse(savedPosition) });
      }
    } catch (error) {
      console.warn('Failed to load chat state from localStorage:', error);
    }
  }, [profileId]);

  // Save state to localStorage
  const saveToStorage = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, []);

  // Action creators
  const actions = {
    setMessages: useCallback((messages: ChatMessage[]) => {
      dispatch({ type: 'SET_MESSAGES', payload: messages });
    }, []),

    addMessage: useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: newMessage });
      return newMessage.id;
    }, []),

    updateMessage: useCallback((id: string, updates: Partial<ChatMessage>) => {
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
    }, []),

    deleteMessage: useCallback((id: string) => {
      dispatch({ type: 'DELETE_MESSAGE', payload: id });
    }, []),

    clearMessages: useCallback(() => {
      dispatch({ type: 'CLEAR_MESSAGES' });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setOpen: useCallback((open: boolean) => {
      dispatch({ type: 'SET_OPEN', payload: open });
    }, []),

    setMinimized: useCallback((minimized: boolean) => {
      dispatch({ type: 'SET_MINIMIZED', payload: minimized });
    }, []),

    setChatMode: useCallback((mode: ChatState['chatMode']) => {
      dispatch({ type: 'SET_CHAT_MODE', payload: mode });
      if (profileId) {
        saveToStorage(`chatMode_${profileId}`, mode);
      }
    }, [profileId, saveToStorage]),

    setFloatingPosition: useCallback((position: { x: number; y: number }) => {
      dispatch({ type: 'SET_FLOATING_POSITION', payload: position });
      if (profileId) {
        saveToStorage(`chatFloatingPosition_${profileId}`, position);
      }
    }, [profileId, saveToStorage]),

    setDragging: useCallback((dragging: boolean) => {
      dispatch({ type: 'SET_DRAGGING', payload: dragging });
    }, []),

    setSelectedAgents: useCallback((agents: Record<string, boolean>) => {
      dispatch({ type: 'SET_SELECTED_AGENTS', payload: agents });
      if (profileId) {
        saveToStorage(`chatAgentSelections_${profileId}`, agents);
      }
    }, [profileId, saveToStorage]),

    setAvailableAgents: useCallback((agents: any[]) => {
      dispatch({ type: 'SET_AVAILABLE_AGENTS', payload: agents });
    }, []),

    setAgentsExpanded: useCallback((expanded: boolean) => {
      dispatch({ type: 'SET_AGENTS_EXPANDED', payload: expanded });
      saveToStorage('chatAgentsExpanded', expanded);
    }, [saveToStorage]),

    setInputMessage: useCallback((message: string) => {
      dispatch({ type: 'SET_INPUT_MESSAGE', payload: message });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    updateLastActivity: useCallback(() => {
      dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
    }, []),
  };

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Send message function
  const sendMessage = useCallback(async (
    message: string,
    context?: any,
    options?: {
      analysisType?: string;
      templateId?: string;
    }
  ) => {
    if (!message.trim() || state.isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Add user message
    const userMessageId = actions.addMessage({
      role: 'user',
      content: message,
      status: 'sent',
    });

    // Add assistant message placeholder
    const assistantMessageId = actions.addMessage({
      role: 'assistant',
      content: '',
      status: 'sending',
      agentName: 'AI Assistant',
    });

    actions.setLoading(true);
    actions.setError(null);

    try {
      const selectedAgentsList = Object.entries(state.selectedAgents)
        .filter(([_, selected]) => selected)
        .map(([agentId, _]) => agentId);

      if (selectedAgentsList.length === 0) {
        throw new Error('Please select at least one agent');
      }

      const requestBody = {
        message,
        agents: selectedAgentsList,
        context,
        profileId,
        availableAgents: state.availableAgents,
        ...options,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Update assistant message with response
      actions.updateMessage(assistantMessageId, {
        content: data.message || data.response || 'No response received',
        status: 'delivered',
        metadata: {
          processingTime: data.processingTime,
          tokens: data.tokens,
          analysisType: options?.analysisType,
        },
      });

      // Clear input
      actions.setInputMessage('');

      // Scroll to bottom
      setTimeout(scrollToBottom, 100);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        actions.deleteMessage(assistantMessageId);
      } else {
        // Update assistant message with error
        actions.updateMessage(assistantMessageId, {
          content: 'Sorry, I encountered an error while processing your request.',
          status: 'error',
          error: error.message,
        });
        actions.setError(error.message);
      }
    } finally {
      actions.setLoading(false);
      abortControllerRef.current = null;
    }
  }, [state.isLoading, state.selectedAgents, state.availableAgents, profileId, actions, scrollToBottom]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      actions.setLoading(false);
    }
  }, [actions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    actions,
    sendMessage,
    cancelRequest,
    scrollToBottom,
    messagesEndRef,
  };
}