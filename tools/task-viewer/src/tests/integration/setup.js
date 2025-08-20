/**
 * 集成测试设置文件
 * 配置测试环境和全局模拟
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { jest } from '@jest/globals';

// 配置Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// 全局模拟
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 模拟Performance API
global.performance = {
  ...global.performance,
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn().mockReturnValue([]),
  getEntriesByType: jest.fn().mockReturnValue([]),
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
};

// 模拟PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn().mockReturnValue([]),
}));

// 模拟localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// 模拟sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// 模拟window.matchMedia
global.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// 模拟window.getComputedStyle
global.getComputedStyle = jest.fn().mockImplementation(() => ({
  getPropertyValue: jest.fn().mockReturnValue(''),
}));

// 模拟fetch
global.fetch = jest.fn();

// 模拟URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// 模拟navigator
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
  writable: true,
});

Object.defineProperty(global.navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  writable: true,
});

// 模拟console方法（避免测试输出污染）
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// 测试前清理
beforeEach(() => {
  // 清理所有模拟
  jest.clearAllMocks();
  
  // 重置localStorage
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // 重置sessionStorage
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  
  // 重置fetch
  global.fetch.mockClear();
  
  // 重置console
  global.console.log.mockClear();
  global.console.warn.mockClear();
  global.console.error.mockClear();
  global.console.info.mockClear();
  global.console.debug.mockClear();
});

// 测试后清理
afterEach(() => {
  // 清理DOM
  document.body.innerHTML = '';
  
  // 清理定时器
  jest.clearAllTimers();
});

// 全局测试后清理
afterAll(() => {
  // 恢复原始console
  global.console = originalConsole;
});

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 自定义匹配器
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toHaveBeenCalledWithError(received, errorMessage) {
    const pass = received.mock.calls.some(call => 
      call.some(arg => 
        arg instanceof Error && arg.message.includes(errorMessage)
      )
    );
    
    if (pass) {
      return {
        message: () =>
          `expected function not to have been called with error containing "${errorMessage}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected function to have been called with error containing "${errorMessage}"`,
        pass: false,
      };
    }
  },
});

// 测试工具函数
global.testUtils = {
  // 等待异步操作完成
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 模拟用户输入
  mockUserInput: (element, value) => {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  },
  
  // 模拟键盘事件
  mockKeyboardEvent: (element, key, options = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
    element.dispatchEvent(event);
  },
  
  // 模拟鼠标事件
  mockMouseEvent: (element, type, options = {}) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  },
  
  // 创建模拟的API响应
  createMockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  }),
  
  // 创建模拟的错误响应
  createMockErrorResponse: (message, status = 500) => ({
    ok: false,
    status,
    json: jest.fn().mockRejectedValue(new Error(message)),
    text: jest.fn().mockRejectedValue(new Error(message)),
  }),
};