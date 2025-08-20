/**
 * 性能基准测试
 * 测试关键功能的性能指标，确保满足性能要求
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { performanceMonitor } from '../../utils/performanceMonitor';
import ChatAgent from '../../components/ChatAgent';
import TemplateManager from '../../components/TemplateManager';
import PromptTemplateManager from '../../services/PromptTemplateManager';

describe('Performance Benchmark Tests', () => {
  let mockTemplateManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTemplateManager = {
      searchTemplates: jest.fn().mockReturnValue([]),
      getTemplate: jest.fn(),
      renderTemplate: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        totalTemplates: 0,
        builtinTemplates: 0,
        customTemplates: 0,
        usageStats: { totalUsage: 0 },
      }),
    };
    
    PromptTemplateManager.mockImplementation(() => mockTemplateManager);
    
    // 模拟性能API
    global.performance.now = jest.fn(() => Date.now());
    global.performance.mark = jest.fn();
    global.performance.measure = jest.fn();
  });

  describe('Component Rendering Performance', () => {
    test('ChatAgent should render within 100ms', async () => {
      const startTime = performance.now();
      
      render(<ChatAgent />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('TemplateManager should render within 150ms', async () => {
      const startTime = performance.now();
      
      render(<TemplateManager templateManager={mockTemplateManager} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(150);
      expect(screen.getByText(/模板管理/i)).toBeInTheDocument();
    });

    test('should handle large message list efficiently', async () => {
      // 生成大量消息
      const messages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i} with some content that might be longer`,
        timestamp: new Date().toISOString(),
      }));

      const startTime = performance.now();
      
      render(<ChatAgent initialMessages={messages} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 即使有1000条消息，渲染时间也应该在合理范围内
      expect(renderTime).toBeLessThan(500);
      
      // 验证虚拟滚动是否工作（不应该渲染所有消息）
      const renderedMessages = screen.getAllByText(/Message \d+/);
      expect(renderedMessages.length).toBeLessThan(messages.length);
    });
  });

  describe('User Interaction Performance', () => {
    test('message input should respond within 50ms', async () => {
      render(<ChatAgent />);
      
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      
      const startTime = performance.now();
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(50);
      expect(messageInput.value).toBe('Test message');
    });

    test('template search should be debounced and fast', async () => {
      jest.useFakeTimers();
      
      render(<TemplateManager templateManager={mockTemplateManager} />);
      
      const searchInput = screen.getByPlaceholderText(/搜索模板/i);
      
      const startTime = performance.now();
      
      // 快速输入多个字符
      fireEvent.change(searchInput, { target: { value: 'a' } });
      fireEvent.change(searchInput, { target: { value: 'ab' } });
      fireEvent.change(searchInput, { target: { value: 'abc' } });
      
      const inputTime = performance.now() - startTime;
      expect(inputTime).toBeLessThan(30);
      
      // 快进防抖时间
      jest.advanceTimersByTime(300);
      
      // 应该只调用一次搜索
      expect(mockTemplateManager.searchTemplates).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    test('button clicks should respond immediately', async () => {
      render(<ChatAgent />);
      
      const sendButton = screen.getByText(/发送/i);
      
      const startTime = performance.now();
      
      fireEvent.click(sendButton);
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(20);
    });
  });

  describe('API Performance', () => {
    test('API calls should complete within 2 seconds', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'API response' }),
        })
      );

      render(<ChatAgent />);
      
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByText(/发送/i);
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      
      const startTime = performance.now();
      
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('API response')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const apiTime = endTime - startTime;
      
      expect(apiTime).toBeLessThan(2000);
    });

    test('should handle API timeout gracefully', async () => {
      global.fetch.mockImplementation(() =>
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Delayed response' }),
          }), 1500)
        )
      );

      render(<ChatAgent />);
      
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByText(/发送/i);
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      // 应该显示加载状态
      expect(screen.getByText(/发送中/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Delayed response')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Memory Performance', () => {
    test('should not cause memory leaks', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // 渲染和卸载组件多次
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<ChatAgent />);
        
        // 模拟一些操作
        const messageInput = screen.getByPlaceholderText(/输入消息/i);
        fireEvent.change(messageInput, { target: { value: `Message ${i}` } });
        
        unmount();
      }
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该在合理范围内（小于10MB）
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should handle large data sets efficiently', async () => {
      const largeTemplateList = Array.from({ length: 500 }, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        description: `Description for template ${i}`,
        category: 'general',
        tags: [],
        content: `Content for template ${i}`,
        variables: [],
      }));

      mockTemplateManager.searchTemplates.mockReturnValue(largeTemplateList);

      const startTime = performance.now();
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      render(<TemplateManager templateManager={mockTemplateManager} />);
      
      const endTime = performance.now();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      
      const renderTime = endTime - startTime;
      const memoryUsed = finalMemory - initialMemory;
      
      // 渲染时间应该合理
      expect(renderTime).toBeLessThan(300);
      
      // 内存使用应该合理（小于20MB）
      expect(memoryUsed).toBeLessThan(20 * 1024 * 1024);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should record performance metrics', async () => {
      const recordMetricSpy = jest.spyOn(performanceMonitor, 'recordMetric');
      
      render(<ChatAgent />);
      
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByText(/发送/i);
      
      fireEvent.change(messageInput, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      // 应该记录性能指标
      expect(recordMetricSpy).toHaveBeenCalled();
      
      recordMetricSpy.mockRestore();
    });

    test('should measure function execution time', async () => {
      const measureFunctionSpy = jest.spyOn(performanceMonitor, 'measureFunction');
      
      // 模拟一个需要测量的函数
      const testFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };
      
      const result = performanceMonitor.measureFunction('test_function', testFunction);
      
      expect(result).toBe(499500); // 0+1+2+...+999
      expect(measureFunctionSpy).toHaveBeenCalledWith('test_function', testFunction);
      
      measureFunctionSpy.mockRestore();
    });

    test('should generate performance report', async () => {
      // 记录一些性能指标
      performanceMonitor.recordMetric('test_render', 50, 'render');
      performanceMonitor.recordMetric('test_api', 800, 'api');
      performanceMonitor.recordMetric('test_user', 30, 'user');
      
      const report = performanceMonitor.getPerformanceReport();
      
      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(report.metrics).toHaveLength(3);
      expect(report.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Responsive Design Performance', () => {
    test('should adapt to mobile viewport quickly', async () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      const startTime = performance.now();
      
      render(<ChatAgent />);
      
      // 触发resize事件
      fireEvent(window, new Event('resize'));
      
      const endTime = performance.now();
      const adaptationTime = endTime - startTime;
      
      expect(adaptationTime).toBeLessThan(100);
      
      // 验证移动端布局
      const container = screen.getByRole('main');
      expect(container).toBeInTheDocument();
    });

    test('should handle orientation change efficiently', async () => {
      render(<ChatAgent />);
      
      const startTime = performance.now();
      
      // 模拟屏幕旋转
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      fireEvent(window, new Event('orientationchange'));
      
      const endTime = performance.now();
      const orientationTime = endTime - startTime;
      
      expect(orientationTime).toBeLessThan(50);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle multiple simultaneous operations', async () => {
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Concurrent response' }),
        })
      );

      render(<ChatAgent />);
      
      const messageInput = screen.getByPlaceholderText(/输入消息/i);
      const sendButton = screen.getByText(/发送/i);
      
      const startTime = performance.now();
      
      // 同时发送多个消息
      const promises = [];
      for (let i = 0; i < 5; i++) {
        fireEvent.change(messageInput, { target: { value: `Message ${i}` } });
        fireEvent.click(sendButton);
        promises.push(
          waitFor(() => screen.getByText('Concurrent response'))
        );
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 并发处理应该比串行处理快
      expect(totalTime).toBeLessThan(3000);
    });
  });
});

// 性能基准常量
export const PERFORMANCE_BENCHMARKS = {
  RENDER_TIME: {
    FAST: 50,
    ACCEPTABLE: 100,
    SLOW: 200,
  },
  API_RESPONSE: {
    FAST: 500,
    ACCEPTABLE: 1500,
    SLOW: 3000,
  },
  USER_INTERACTION: {
    IMMEDIATE: 20,
    FAST: 50,
    ACCEPTABLE: 100,
  },
  MEMORY_USAGE: {
    LOW: 10 * 1024 * 1024,    // 10MB
    MEDIUM: 50 * 1024 * 1024,  // 50MB
    HIGH: 100 * 1024 * 1024,   // 100MB
  },
};