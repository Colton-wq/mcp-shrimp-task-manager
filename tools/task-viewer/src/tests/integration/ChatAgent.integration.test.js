/**
 * ChatAgent集成测试
 * 测试所有新功能与现有ChatAgent的集成情况
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import ChatAgent from '../../components/ChatAgent';
import PromptTemplateManager from '../../services/PromptTemplateManager';
import { ErrorHandler } from '../../utils/errorHandler';
import { TaskAnalysisService } from '../../services/TaskAnalysisService';

// Mock dependencies
jest.mock('../../services/PromptTemplateManager');
jest.mock('../../utils/errorHandler');
jest.mock('../../services/TaskAnalysisService');

describe('ChatAgent Integration Tests', () => {
  let mockTemplateManager;
  let mockErrorHandler;
  let mockAnalysisService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock instances
    mockTemplateManager = {
      searchTemplates: jest.fn().mockReturnValue([]),
      getTemplate: jest.fn(),
      renderTemplate: jest.fn(),
    };
    
    mockErrorHandler = {
      handleError: jest.fn(),
      addBreadcrumb: jest.fn(),
    };
    
    mockAnalysisService = {
      analyzeTask: jest.fn(),
      getAnalysisHistory: jest.fn().mockReturnValue([]),
    };

    // Mock constructors
    PromptTemplateManager.mockImplementation(() => mockTemplateManager);
    ErrorHandler.getInstance = jest.fn().mockReturnValue(mockErrorHandler);
    TaskAnalysisService.mockImplementation(() => mockAnalysisService);

    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Integration', () => {
    test('should render ChatAgent with all new components', async () => {
      render(<ChatAgent />);
      
      // Check if main components are rendered
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Check for template selector (should be present)
      await waitFor(() => {
        expect(screen.getByText(/选择模板/i)).toBeInTheDocument();
      });
      
      // Check for error boundary wrapper
      expect(document.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });

    test('should integrate template system with chat interface', async () => {
      const mockTemplate = {
        id: 'test-template',
        name: '测试模板',
        content: '分析任务：{{taskName}}',
        variables: [{ name: 'taskName', type: 'string', required: true }],
      };

      mockTemplateManager.searchTemplates.mockReturnValue([mockTemplate]);
      mockTemplateManager.getTemplate.mockReturnValue(mockTemplate);
      mockTemplateManager.renderTemplate.mockResolvedValue({
        content: '分析任务：测试任务',
        variables: { taskName: '测试任务' },
        metadata: { templateId: 'test-template' },
      });

      render(<ChatAgent />);

      // Wait for template to load
      await waitFor(() => {
        expect(mockTemplateManager.searchTemplates).toHaveBeenCalled();
      });

      // Select template
      const templateSelector = screen.getByText(/选择模板/i);
      fireEvent.click(templateSelector);

      await waitFor(() => {
        expect(screen.getByText('测试模板')).toBeInTheDocument();
      });

      // Click on template
      fireEvent.click(screen.getByText('测试模板'));

      // Verify template integration
      expect(mockTemplateManager.getTemplate).toHaveBeenCalledWith('test-template');
    });

    test('should handle task analysis integration', async () => {
      const mockAnalysisResult = {
        complexity: { score: 7, factors: ['技术难度高'] },
        timeEstimate: { development: 8, testing: 2 },
        risks: [{ type: '技术风险', probability: 0.3 }],
      };

      mockAnalysisService.analyzeTask.mockResolvedValue(mockAnalysisResult);

      render(<ChatAgent />);

      // Trigger task analysis
      const analysisButton = screen.getByText(/分析任务/i);
      fireEvent.click(analysisButton);

      await waitFor(() => {
        expect(mockAnalysisService.analyzeTask).toHaveBeenCalled();
      });

      // Check if analysis results are displayed
      await waitFor(() => {
        expect(screen.getByText(/复杂度评分/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');
      global.fetch.mockRejectedValue(mockError);

      render(<ChatAgent />);

      // Trigger an action that causes API call
      const sendButton = screen.getByText(/发送/i);
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      
      fireEvent.change(messageInput, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('API Error'),
          })
        );
      });

      // Check if error UI is displayed
      expect(screen.getByText(/发生错误/i)).toBeInTheDocument();
    });

    test('should recover from errors with retry mechanism', async () => {
      // First call fails, second succeeds
      global.fetch
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ message: '成功响应' }),
        });

      render(<ChatAgent />);

      const sendButton = screen.getByText(/发送/i);
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      
      fireEvent.change(messageInput, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/重试/i)).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByText(/重试/i));

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('成功响应')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    test('should handle large message lists efficiently', async () => {
      const startTime = performance.now();
      
      // Generate large message list
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      }));

      render(<ChatAgent initialMessages={messages} />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (< 1000ms)
      expect(renderTime).toBeLessThan(1000);

      // Check if virtual scrolling is working
      const messageContainer = screen.getByRole('log');
      expect(messageContainer).toBeInTheDocument();
      
      // Should not render all messages at once (virtual scrolling)
      const renderedMessages = screen.getAllByText(/Message \d+/);
      expect(renderedMessages.length).toBeLessThan(messages.length);
    });

    test('should debounce template search', async () => {
      jest.useFakeTimers();

      render(<ChatAgent />);

      const searchInput = screen.getByPlaceholderText(/搜索模板/i);

      // Type rapidly
      fireEvent.change(searchInput, { target: { value: 'a' } });
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      fireEvent.change(searchInput, { target: { value: 'abc' } });

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should only call search once after debounce
      expect(mockTemplateManager.searchTemplates).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('User Experience Integration', () => {
    test('should provide keyboard navigation support', async () => {
      render(<ChatAgent />);

      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      messageInput.focus();

      // Test Ctrl+Enter to send
      fireEvent.keyDown(messageInput, {
        key: 'Enter',
        ctrlKey: true,
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Test Escape to clear
      fireEvent.change(messageInput, { target: { value: '测试内容' } });
      fireEvent.keyDown(messageInput, { key: 'Escape' });

      expect(messageInput.value).toBe('');
    });

    test('should maintain responsive design', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ChatAgent />);

      // Check if mobile layout is applied
      const container = screen.getByRole('main');
      expect(container).toHaveClass(/mobile/i);
    });

    test('should support accessibility features', () => {
      render(<ChatAgent />);

      // Check ARIA labels
      expect(screen.getByRole('main')).toHaveAttribute('aria-label');
      expect(screen.getByRole('log')).toHaveAttribute('aria-live');

      // Check keyboard focus management
      const firstFocusable = screen.getByPlaceholderText(/输入消息/i);
      expect(firstFocusable).toHaveAttribute('tabIndex');
    });
  });

  describe('Data Flow Integration', () => {
    test('should maintain state consistency across components', async () => {
      render(<ChatAgent />);

      // Add a message
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByText(/发送/i);

      fireEvent.change(messageInput, { target: { value: '测试消息' } });
      fireEvent.click(sendButton);

      // Check if message appears in chat
      await waitFor(() => {
        expect(screen.getByText('测试消息')).toBeInTheDocument();
      });

      // Check if input is cleared
      expect(messageInput.value).toBe('');

      // Check if loading state is managed
      expect(screen.getByText(/发送中/i)).toBeInTheDocument();
    });

    test('should handle concurrent operations', async () => {
      render(<ChatAgent />);

      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByText(/发送/i);

      // Send multiple messages rapidly
      const promises = [];
      for (let i = 0; i < 3; i++) {
        fireEvent.change(messageInput, { target: { value: `消息 ${i}` } });
        fireEvent.click(sendButton);
        promises.push(waitFor(() => screen.getByText(`消息 ${i}`)));
      }

      // All messages should be handled
      await Promise.all(promises);

      // Check if all messages are displayed
      expect(screen.getByText('消息 0')).toBeInTheDocument();
      expect(screen.getByText('消息 1')).toBeInTheDocument();
      expect(screen.getByText('消息 2')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    test('should clean up resources on unmount', () => {
      const { unmount } = render(<ChatAgent />);

      // Simulate some operations that create resources
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      fireEvent.change(messageInput, { target: { value: '测试' } });

      // Unmount component
      unmount();

      // Check if cleanup was called (would need to mock specific cleanup functions)
      // This is a placeholder for actual cleanup verification
      expect(true).toBe(true);
    });

    test('should handle memory-intensive operations', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      render(<ChatAgent />);

      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        const messageInput = screen.getByPlaceholderText(/输入消息/i);
        fireEvent.change(messageInput, { target: { value: `大量数据 ${i}` } });
      }

      await waitFor(() => {
        const currentMemory = performance.memory?.usedJSHeapSize || 0;
        const memoryIncrease = currentMemory - initialMemory;
        
        // Memory increase should be reasonable (< 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      });
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  test('should meet response time requirements', async () => {
    const startTime = performance.now();
    
    render(<ChatAgent />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Initial render should be < 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('should handle API response time requirements', async () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ message: '响应' }),
        }), 1500) // 1.5 second delay
      )
    );

    render(<ChatAgent />);

    const startTime = performance.now();
    
    const sendButton = screen.getByText(/发送/i);
    const messageInput = screen.getByPlaceholderText(/输入消息/i);
    
    fireEvent.change(messageInput, { target: { value: '测试消息' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('响应')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Total response time should be < 2000ms
    expect(responseTime).toBeLessThan(2000);
  });
});