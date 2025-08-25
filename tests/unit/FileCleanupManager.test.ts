/**
 * FileCleanupManager 单元测试
 * FileCleanupManager Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileCleanupManager, CleanupMode } from '../../src/tools/workflow/modules/FileCleanupManager.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock 依赖
vi.mock('../../src/utils/asyncFileOperations.js', () => ({
  AsyncFileOperations: {
    scanDirectory: vi.fn(),
    findFiles: vi.fn(),
    checkFilesExist: vi.fn(),
    readMultipleFiles: vi.fn()
  }
}));

vi.mock('../../src/utils/fileLock.js', () => ({
  withFileLock: vi.fn((filePath, callback) => callback())
}));

vi.mock('../../src/tools/workflow/config/index.js', () => ({
  getCleanupConfig: vi.fn(() => Promise.resolve({
    tempFilePatterns: [/\.tmp$/, /\.temp$/, /~$/, /\.bak$/, /\.swp$/, /\.log$/],
    testTempPatterns: [/test.*\.tmp$/, /spec.*\.tmp$/, /\.test\.log$/, /coverage.*\.tmp$/],
    systemDirectories: ['node_modules', '.git', 'dist', 'build'],
    safeDeleteMode: true
  })),
  getFileScanConfig: vi.fn(() => Promise.resolve({
    maxFiles: 1000,
    batchSize: 50,
    timeoutMs: 30000,
    includedExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    excludePatterns: ['node_modules', '.git', 'dist']
  })),
  getPerformanceConfig: vi.fn(() => Promise.resolve({
    maxConcurrency: 10,
    memoryLimitMB: 512,
    operationTimeoutMs: 8000,
    cacheTTL: 300000
  }))
}));

// Mock fs 模块
vi.mock('fs', () => ({
  promises: {
    unlink: vi.fn()
  },
  existsSync: vi.fn()
}));

describe('FileCleanupManager', () => {
  const mockProjectPath = '/test/project';
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 重置 mock 函数
    (fs.promises.unlink as any).mockResolvedValue(undefined);
    (fs.existsSync as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeCleanup', () => {
    it('should execute cleanup in analysis mode', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 文件扫描结果
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
        { path: '/test/project/file1.tmp', isFile: true },
        { path: '/test/project/file2.js', isFile: true },
        { path: '/test/project/file3.bak', isFile: true }
      ]);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      expect(result.filesAnalyzed).toBe(3);
      expect(result.filesRemoved).toBe(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });

    it('should execute cleanup in safe mode', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 文件扫描结果
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
        { path: '/test/project/file1.tmp', isFile: true },
        { path: '/test/project/file2.js', isFile: true },
        { path: '/test/project/file3.bak', isFile: true }
      ]);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      expect(result.filesAnalyzed).toBe(3);
      expect(result.filesRemoved).toBe(2); // .tmp 和 .bak 文件
      expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle file deletion errors gracefully', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 文件扫描结果
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
        { path: '/test/project/file1.tmp', isFile: true }
      ]);

      // Mock 删除失败
      vi.spyOn(fs.promises, 'unlink').mockRejectedValue(new Error('Permission denied'));

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Permission denied');
    });

    it('should handle aggressive cleanup mode', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 文件扫描结果，包含更多类型的文件
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
        { path: '/test/project/file1.tmp', isFile: true },
        { path: '/test/project/node_modules/package.json', isFile: true },
        { path: '/test/project/dist/bundle.js', isFile: true }
      ]);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.AGGRESSIVE
      );

      // 在 aggressive 模式下应该删除更多文件
      expect(result.filesRemoved).toBeGreaterThan(0);
    });
  });

  describe('analyzeProjectStructure', () => {
    it('should analyze project structure correctly', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 大量文件
      const mockFiles = Array.from({ length: 100 }, (_, i) => ({
        path: `/test/project/file${i}.js`,
        isFile: true
      }));
      
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue(mockFiles);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      expect(result.filesAnalyzed).toBe(100);
    });

    it('should handle scan directory errors', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 扫描失败
      (AsyncFileOperations.scanDirectory as any).mockRejectedValue(new Error('Access denied'));

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Access denied');
    });
  });

  describe('cleanupTemporaryFiles', () => {
    it('should identify and clean temporary files', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      const tempFiles = [
        { path: '/test/project/file1.tmp', isFile: true },
        { path: '/test/project/file2.temp', isFile: true },
        { path: '/test/project/file3~', isFile: true },
        { path: '/test/project/file4.bak', isFile: true },
        { path: '/test/project/file5.swp', isFile: true },
        { path: '/test/project/file6.log', isFile: true },
        { path: '/test/project/normal.js', isFile: true }
      ];
      
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue(tempFiles);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      // 应该删除 6 个临时文件，保留 normal.js
      expect(result.filesRemoved).toBe(6);
      expect(result.removedFiles).toHaveLength(6);
    });

    it('should handle batch processing correctly', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // 创建大量临时文件来测试批处理
      const tempFiles = Array.from({ length: 25 }, (_, i) => ({
        path: `/test/project/file${i}.tmp`,
        isFile: true
      }));
      
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue(tempFiles);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      expect(result.filesRemoved).toBe(25);
      // 验证批处理：应该分批调用 unlink
      expect(fs.promises.unlink).toHaveBeenCalledTimes(25);
    });
  });

  describe('cleanupTestFiles', () => {
    it('should clean test temporary files', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      const testTempFiles = [
        { path: '/test/project/test-results.tmp', isFile: true },
        { path: '/test/project/spec-output.tmp', isFile: true },
        { path: '/test/project/unit.test.log', isFile: true },
        { path: '/test/project/coverage-report.tmp', isFile: true }
      ];
      
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue(testTempFiles);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      expect(result.filesRemoved).toBe(4);
    });
  });

  describe('validateFileManagementCompliance', () => {
    it('should detect duplicate script files', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 重复的脚本文件
      (AsyncFileOperations.findFiles as any).mockResolvedValue([
        '/test/project/script1.js',
        '/test/project/script1.ts', // 同名但不同扩展名
        '/test/project/utils.js',
        '/test/project/backup/utils.js' // 重复的文件名
      ]);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      // 应该检测到重复的 utils 文件
      const duplicateWarning = result.suggestions.find(s => 
        s.includes('duplicate') && s.includes('utils')
      );
      expect(duplicateWarning).toBeDefined();
    });

    it('should detect non-isolated test files', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 非隔离的测试文件
      (AsyncFileOperations.findFiles as any).mockResolvedValue([
        '/test/project/component.test.js', // 非隔离的测试文件
        '/test/project/utils.spec.js',     // 非隔离的测试文件
        '/test/project/tests/proper.test.js', // 正确隔离的测试文件
        '/test/project/src/main.js'
      ]);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      // 应该检测到非隔离的测试文件
      const isolationWarning = result.suggestions.find(s => 
        s.includes('Test files should be in dedicated test directories')
      );
      expect(isolationWarning).toBeDefined();
    });
  });

  describe('validateTestFileCompliance', () => {
    it('should suggest creating test directory when none exists', async () => {
      // Mock 不存在测试目录
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      const testDirSuggestion = result.suggestions.find(s => 
        s.includes('Consider creating a dedicated test directory')
      );
      expect(testDirSuggestion).toBeDefined();
    });

    it('should not suggest test directory when it exists', async () => {
      // Mock 存在测试目录
      vi.spyOn(fs, 'existsSync').mockImplementation((path) => {
        return path.toString().includes('tests') || path.toString().includes('test');
      });

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      const testDirSuggestion = result.suggestions.find(s => 
        s.includes('Consider creating a dedicated test directory')
      );
      expect(testDirSuggestion).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle general cleanup errors gracefully', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      // Mock 扫描失败
      (AsyncFileOperations.scanDirectory as any).mockRejectedValue(new Error('General error'));

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('General error');
    });

    it('should continue processing after individual file errors', async () => {
      const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
      
      (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
        { path: '/test/project/file1.tmp', isFile: true },
        { path: '/test/project/file2.tmp', isFile: true }
      ]);

      // Mock 第一个文件删除失败，第二个成功
      vi.spyOn(fs.promises, 'unlink')
        .mockRejectedValueOnce(new Error('File locked'))
        .mockResolvedValueOnce(undefined);

      const result = await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.SAFE
      );

      expect(result.filesRemoved).toBe(1); // 只有一个成功删除
      expect(result.warnings.length).toBe(1); // 一个错误警告
    });
  });

  describe('Configuration Integration', () => {
    it('should use configuration from config manager', async () => {
      const { getCleanupConfig } = await import('../../src/tools/workflow/config/index.js');
      
      await FileCleanupManager.executeCleanup(
        mockProjectPath,
        CleanupMode.ANALYSIS_ONLY
      );

      // 验证配置被调用
      expect(getCleanupConfig).toHaveBeenCalled();
    });
  });

  describe('🔒 Security Tests - Critical Safety Fixes', () => {
    describe('validateCleanupSafety', () => {
      it('should reject invalid project paths', async () => {
        const result = await FileCleanupManager.executeCleanup(
          '', // 空路径
          CleanupMode.SAFE
        );

        expect(result.warnings).toContain('🚨 SECURITY: Invalid project path - cleanup aborted');
        expect(result.filesRemoved).toBe(0);
      });

      it('should reject system critical directories', async () => {
        const dangerousPaths = ['/', 'C:\\', 'C:\\Windows', '/usr', '/bin', '/etc'];
        
        for (const dangerousPath of dangerousPaths) {
          const result = await FileCleanupManager.executeCleanup(
            dangerousPath,
            CleanupMode.AGGRESSIVE
          );

          expect(result.warnings.some(w => w.includes('🚨 SECURITY: Cannot cleanup in system directory'))).toBe(true);
          expect(result.filesRemoved).toBe(0);
        }
      });

      it('should add security warnings for aggressive mode', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        expect(result.warnings).toContain('🔒 SECURITY: Aggressive mode safety check passed - only safe temporary files will be cleaned');
      });
    });

    describe('Aggressive Mode Safety - No More Dangerous Deletions', () => {
      it('should NOT delete node_modules in aggressive mode', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        
        // Mock 包含 node_modules 文件的扫描结果
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
          { path: '/test/project/node_modules/package.json', isFile: true },
          { path: '/test/project/node_modules/lib/index.js', isFile: true },
          { path: '/test/project/file.tmp', isFile: true } // 这个应该被删除
        ]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        // 验证 node_modules 文件没有被删除
        expect(result.removedFiles.every(file => !file.includes('node_modules'))).toBe(true);
        // 但是 .tmp 文件应该被删除
        expect(result.removedFiles.some(file => file.includes('.tmp'))).toBe(true);
      });

      it('should NOT delete dist directory in aggressive mode', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
          { path: '/test/project/dist/bundle.js', isFile: true },
          { path: '/test/project/dist/styles.css', isFile: true },
          { path: '/test/project/file.tmp', isFile: true }
        ]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        // 验证 dist 文件没有被删除
        expect(result.removedFiles.every(file => !file.includes('dist/'))).toBe(true);
        // 但是 .tmp 文件应该被删除
        expect(result.removedFiles.some(file => file.includes('.tmp'))).toBe(true);
      });

      it('should NOT delete build directory in aggressive mode', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
          { path: '/test/project/build/app.js', isFile: true },
          { path: '/test/project/build/assets/logo.png', isFile: true },
          { path: '/test/project/file.tmp', isFile: true }
        ]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        // 验证 build 文件没有被删除
        expect(result.removedFiles.every(file => !file.includes('build/'))).toBe(true);
        // 但是 .tmp 文件应该被删除
        expect(result.removedFiles.some(file => file.includes('.tmp'))).toBe(true);
      });

      it('should only clean safe files in aggressive mode', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([
          // 危险文件 - 不应该被删除
          { path: '/test/project/node_modules/package.json', isFile: true },
          { path: '/test/project/dist/bundle.js', isFile: true },
          { path: '/test/project/build/app.js', isFile: true },
          
          // 安全的临时文件 - 应该被删除
          { path: '/test/project/file.tmp', isFile: true },
          { path: '/test/project/temp.bak', isFile: true },
          { path: '/test/project/.DS_Store', isFile: true },
          { path: '/test/project/Thumbs.db', isFile: true },
          { path: '/test/project/desktop.ini', isFile: true },
          { path: '/test/project/cache.cache', isFile: true }
        ]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        // 验证只有安全文件被删除
        const safeFilesDeleted = result.removedFiles.filter(file => 
          file.includes('.tmp') || 
          file.includes('.bak') || 
          file.includes('.DS_Store') || 
          file.includes('Thumbs.db') || 
          file.includes('desktop.ini') ||
          file.includes('.cache')
        );
        
        expect(safeFilesDeleted.length).toBe(6); // 6个安全文件
        expect(result.removedFiles.length).toBe(6); // 总共只删除6个文件
        
        // 验证危险文件没有被删除
        expect(result.removedFiles.every(file => 
          !file.includes('node_modules') && 
          !file.includes('dist/') && 
          !file.includes('build/')
        )).toBe(true);
      });
    });

    describe('Security Warnings and Logging', () => {
      it('should log security warnings for aggressive mode', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        expect(result.warnings).toContain('🔒 SECURITY: Aggressive mode enabled - only cleaning safe temporary files');
      });

      it('should provide clear security messaging', async () => {
        const { AsyncFileOperations } = await import('../../src/utils/asyncFileOperations.js');
        (AsyncFileOperations.scanDirectory as any).mockResolvedValue([]);

        const result = await FileCleanupManager.executeCleanup(
          mockProjectPath,
          CleanupMode.AGGRESSIVE
        );

        // 检查是否有适当的安全消息
        const securityMessages = result.warnings.filter(w => w.includes('🔒 SECURITY'));
        expect(securityMessages.length).toBeGreaterThan(0);
      });
    });
  });
});