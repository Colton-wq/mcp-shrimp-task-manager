/**
 * Jest集成测试配置
 * 专门用于集成测试的Jest配置文件
 */

module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/tests/integration/**/*.integration.{js,jsx,ts,tsx}',
  ],
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/integration/setup.js',
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // 转换配置
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-transform-runtime',
      ],
    }],
  },
  
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 测试超时
  testTimeout: 30000,
  
  // 全局变量
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // 忽略的路径
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
  
  // 模块路径忽略
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/dist/',
  ],
  
  // 清理模拟
  clearMocks: true,
  restoreMocks: true,
  
  // 详细输出
  verbose: true,
  
  // 错误时停止
  bail: false,
  
  // 最大工作进程
  maxWorkers: '50%',
  
  // 缓存目录
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // 报告器
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: '<rootDir>/coverage/integration/html-report',
      filename: 'integration-test-report.html',
      expand: true,
    }],
    ['jest-junit', {
      outputDirectory: '<rootDir>/coverage/integration',
      outputName: 'integration-test-results.xml',
    }],
  ],
  
  // 自定义匹配器
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/integration/setup.js',
    '@testing-library/jest-dom',
  ],
};