/**
 * 分析工具配置管理
 * 
 * 本文件提供了代码分析工具的配置管理功能，包括默认配置、配置验证、
 * 配置合并等功能，确保分析工具能够正确配置和运行。
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { AnalyzerType, CacheStrategy } from '../interfaces/ICodeAnalyzer';

// ============================================================================
// 配置Schema定义
// ============================================================================

/**
 * ESLint配置Schema
 */
const ESLintConfigSchema = z.object({
  configPath: z.string().optional(),
  rules: z.record(z.any()).optional(),
  plugins: z.array(z.string()).optional(),
  extends: z.array(z.string()).optional(),
  parser: z.string().optional(),
  parserOptions: z.object({
    ecmaVersion: z.number().optional(),
    sourceType: z.enum(['module', 'script']).optional(),
    ecmaFeatures: z.object({
      jsx: z.boolean().optional(),
      globalReturn: z.boolean().optional(),
      impliedStrict: z.boolean().optional()
    }).optional()
  }).optional(),
  env: z.record(z.boolean()).optional(),
  globals: z.record(z.boolean()).optional(),
  ignorePatterns: z.array(z.string()).optional()
});

/**
 * TypeScript配置Schema
 */
const TypeScriptConfigSchema = z.object({
  configPath: z.string().optional(),
  compilerOptions: z.object({
    target: z.string().optional(),
    module: z.string().optional(),
    lib: z.array(z.string()).optional(),
    strict: z.boolean().optional(),
    noImplicitAny: z.boolean().optional(),
    strictNullChecks: z.boolean().optional(),
    strictFunctionTypes: z.boolean().optional(),
    noImplicitReturns: z.boolean().optional(),
    noImplicitThis: z.boolean().optional(),
    noUnusedLocals: z.boolean().optional(),
    noUnusedParameters: z.boolean().optional(),
    exactOptionalPropertyTypes: z.boolean().optional()
  }).optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional()
});

/**
 * Jest配置Schema
 */
const JestConfigSchema = z.object({
  configPath: z.string().optional(),
  testMatch: z.array(z.string()).optional(),
  testPathIgnorePatterns: z.array(z.string()).optional(),
  collectCoverage: z.boolean().optional(),
  collectCoverageFrom: z.array(z.string()).optional(),
  coverageDirectory: z.string().optional(),
  coverageReporters: z.array(z.string()).optional(),
  coverageThreshold: z.object({
    global: z.object({
      branches: z.number().min(0).max(100).optional(),
      functions: z.number().min(0).max(100).optional(),
      lines: z.number().min(0).max(100).optional(),
      statements: z.number().min(0).max(100).optional()
    }).optional()
  }).optional(),
  testEnvironment: z.string().optional(),
  setupFilesAfterEnv: z.array(z.string()).optional()
});

/**
 * SonarJS配置Schema
 */
const SonarJSConfigSchema = z.object({
  enabled: z.boolean().default(true),
  rules: z.record(z.any()).optional(),
  ignorePatterns: z.array(z.string()).optional(),
  maxComplexity: z.number().min(1).optional(),
  maxDepth: z.number().min(1).optional(),
  maxLines: z.number().min(1).optional()
});

/**
 * 评分权重Schema
 */
const ScoringWeightsSchema = z.object({
  complexity: z.number().min(0).max(1),
  coverage: z.number().min(0).max(1),
  quality: z.number().min(0).max(1),
  security: z.number().min(0).max(1)
}).refine(
  (weights) => {
    const sum = weights.complexity + weights.coverage + weights.quality + weights.security;
    return Math.abs(sum - 1.0) < 0.001; // 允许浮点数精度误差
  },
  {
    message: "权重总和必须等于1.0"
  }
);

/**
 * 复杂度阈值Schema
 */
const ComplexityThresholdsSchema = z.object({
  low: z.number().min(1),
  medium: z.number().min(1),
  high: z.number().min(1)
}).refine(
  (thresholds) => thresholds.low < thresholds.medium && thresholds.medium < thresholds.high,
  {
    message: "复杂度阈值必须满足: low < medium < high"
  }
);

/**
 * 覆盖率阈值Schema
 */
const CoverageThresholdsSchema = z.object({
  excellent: z.number().min(0).max(100),
  good: z.number().min(0).max(100),
  fair: z.number().min(0).max(100)
}).refine(
  (thresholds) => thresholds.fair < thresholds.good && thresholds.good < thresholds.excellent,
  {
    message: "覆盖率阈值必须满足: fair < good < excellent"
  }
);

/**
 * 评分配置Schema
 */
const ScoringConfigSchema = z.object({
  weights: ScoringWeightsSchema,
  thresholds: z.object({
    complexity: ComplexityThresholdsSchema,
    coverage: CoverageThresholdsSchema
  })
});

/**
 * 性能配置Schema
 */
const PerformanceConfigSchema = z.object({
  maxConcurrency: z.number().min(1).max(16),
  timeoutMs: z.number().min(1000).max(3600000), // 1秒到1小时
  cacheEnabled: z.boolean(),
  incrementalEnabled: z.boolean(),
  memoryLimitMB: z.number().min(128).max(8192).optional()
});

/**
 * 文件过滤配置Schema
 */
const FileFilterConfigSchema = z.object({
  include: z.array(z.string()),
  exclude: z.array(z.string()),
  extensions: z.array(z.string()),
  maxFileSize: z.number().min(1024).optional(), // 最小1KB
  ignoreHidden: z.boolean().default(true)
});

/**
 * 工具配置Schema
 */
const ToolsConfigSchema = z.object({
  eslint: ESLintConfigSchema.optional(),
  typescript: TypeScriptConfigSchema.optional(),
  jest: JestConfigSchema.optional(),
  sonarjs: SonarJSConfigSchema.optional()
});

/**
 * 主配置Schema
 */
const AnalysisConfigSchema = z.object({
  tools: ToolsConfigSchema,
  scoring: ScoringConfigSchema,
  performance: PerformanceConfigSchema,
  files: FileFilterConfigSchema,
  enabledAnalyzers: z.array(z.nativeEnum(AnalyzerType)).optional(),
  cacheStrategy: z.nativeEnum(CacheStrategy).default(CacheStrategy.FILE_BASED),
  outputFormat: z.enum(['json', 'html', 'markdown']).default('json'),
  reportPath: z.string().optional(),
  verbose: z.boolean().default(false)
});

// ============================================================================
// 配置类型定义
// ============================================================================

export type AnalysisConfig = z.infer<typeof AnalysisConfigSchema>;
export type ESLintConfig = z.infer<typeof ESLintConfigSchema>;
export type TypeScriptConfig = z.infer<typeof TypeScriptConfigSchema>;
export type JestConfig = z.infer<typeof JestConfigSchema>;
export type SonarJSConfig = z.infer<typeof SonarJSConfigSchema>;
export type ScoringConfig = z.infer<typeof ScoringConfigSchema>;
export type ScoringWeights = z.infer<typeof ScoringWeightsSchema>;
export type ComplexityThresholds = z.infer<typeof ComplexityThresholdsSchema>;
export type CoverageThresholds = z.infer<typeof CoverageThresholdsSchema>;
export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;
export type FileFilterConfig = z.infer<typeof FileFilterConfigSchema>;
export type ToolsConfig = z.infer<typeof ToolsConfigSchema>;

// ============================================================================
// 默认配置
// ============================================================================

/**
 * 默认分析配置
 */
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  tools: {
    eslint: {
      plugins: ['@typescript-eslint', 'security', 'import', 'node'],
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:security/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      env: {
        node: true,
        es2022: true,
        jest: true
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'warn',
        'security/detect-object-injection': 'error',
        'security/detect-non-literal-regexp': 'error',
        'import/no-unresolved': 'error',
        'import/order': 'warn'
      }
    },
    typescript: {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        lib: ['ES2022'],
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true
      },
      include: ['src/**/*', 'tests/**/*'],
      exclude: ['node_modules', 'dist', 'build', 'coverage']
    },
    jest: {
      testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
      testPathIgnorePatterns: ['node_modules', 'dist', 'build'],
      collectCoverage: true,
      collectCoverageFrom: [
        'src/**/*.(ts|tsx|js)',
        '!src/**/*.d.ts',
        '!src/**/*.test.*',
        '!src/**/*.spec.*'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['json', 'lcov', 'text', 'html'],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      testEnvironment: 'node',
      setupFilesAfterEnv: []
    },
    sonarjs: {
      enabled: true,
      maxComplexity: 15,
      maxDepth: 4,
      maxLines: 1000,
      ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**']
    }
  },
  scoring: {
    weights: {
      complexity: 0.25,
      coverage: 0.30,
      quality: 0.25,
      security: 0.20
    },
    thresholds: {
      complexity: {
        low: 5,
        medium: 10,
        high: 20
      },
      coverage: {
        excellent: 90,
        good: 80,
        fair: 70
      }
    }
  },
  performance: {
    maxConcurrency: 4,
    timeoutMs: 300000, // 5分钟
    cacheEnabled: true,
    incrementalEnabled: true,
    memoryLimitMB: 2048 // 2GB
  },
  files: {
    include: [
      'src/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
      'app/**/*.{ts,tsx,js,jsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.d.ts',
      '**/*.min.js',
      '**/vendor/**',
      '**/third-party/**'
    ],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    maxFileSize: 1024 * 1024, // 1MB
    ignoreHidden: true
  },
  enabledAnalyzers: [
    AnalyzerType.COMPLEXITY,
    AnalyzerType.COVERAGE,
    AnalyzerType.QUALITY,
    AnalyzerType.SECURITY
  ],
  cacheStrategy: CacheStrategy.FILE_BASED,
  outputFormat: 'json',
  verbose: false
};

// ============================================================================
// 配置管理器
// ============================================================================

/**
 * 分析配置管理器
 */
export class AnalysisConfigManager {
  private static readonly CONFIG_FILE_NAMES = [
    'analysis.config.js',
    'analysis.config.json',
    '.analysisrc',
    '.analysisrc.json',
    '.analysisrc.js'
  ];

  /**
   * 加载配置
   * @param configPath 配置文件路径（可选）
   * @param projectRoot 项目根目录（可选）
   * @returns 分析配置
   */
  static loadConfig(configPath?: string, projectRoot?: string): AnalysisConfig {
    let userConfig: Partial<AnalysisConfig> = {};

    // 如果指定了配置文件路径，直接加载
    if (configPath) {
      userConfig = this.loadConfigFile(configPath);
    } else {
      // 自动查找配置文件
      const foundConfigPath = this.findConfigFile(projectRoot || process.cwd());
      if (foundConfigPath) {
        userConfig = this.loadConfigFile(foundConfigPath);
      }
    }

    // 合并配置
    const mergedConfig = this.mergeConfig(DEFAULT_ANALYSIS_CONFIG, userConfig);

    // 验证配置
    const validationResult = this.validateConfig(mergedConfig);
    if (!validationResult.isValid) {
      throw new Error(`配置验证失败: ${validationResult.errors.join(', ')}`);
    }

    return mergedConfig;
  }

  /**
   * 验证配置
   * @param config 配置对象
   * @returns 验证结果
   */
  static validateConfig(config: any): { isValid: boolean; errors: string[]; warnings: string[] } {
    try {
      AnalysisConfigSchema.parse(config);
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return {
          isValid: false,
          errors,
          warnings: []
        };
      }
      return {
        isValid: false,
        errors: [error.message || '未知配置错误'],
        warnings: []
      };
    }
  }

  /**
   * 保存配置到文件
   * @param config 配置对象
   * @param filePath 文件路径
   */
  static saveConfig(config: AnalysisConfig, filePath: string): void {
    const configJson = JSON.stringify(config, null, 2);
    fs.writeFileSync(filePath, configJson, 'utf-8');
  }

  /**
   * 创建默认配置文件
   * @param projectRoot 项目根目录
   * @param fileName 配置文件名（可选）
   */
  static createDefaultConfig(projectRoot: string, fileName = 'analysis.config.json'): void {
    const configPath = path.join(projectRoot, fileName);
    this.saveConfig(DEFAULT_ANALYSIS_CONFIG, configPath);
  }

  /**
   * 获取配置Schema（用于IDE支持）
   * @returns JSON Schema对象
   */
  static getConfigSchema(): any {
    // 这里可以将Zod schema转换为JSON Schema
    // 为了简化，直接返回一个基本的schema描述
    return {
      type: 'object',
      properties: {
        tools: { type: 'object' },
        scoring: { type: 'object' },
        performance: { type: 'object' },
        files: { type: 'object' }
      }
    };
  }

  /**
   * 查找配置文件
   * @param startDir 开始查找的目录
   * @returns 配置文件路径或null
   */
  private static findConfigFile(startDir: string): string | null {
    let currentDir = startDir;

    while (currentDir !== path.dirname(currentDir)) {
      for (const fileName of this.CONFIG_FILE_NAMES) {
        const configPath = path.join(currentDir, fileName);
        if (fs.existsSync(configPath)) {
          return configPath;
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * 加载配置文件
   * @param configPath 配置文件路径
   * @returns 配置对象
   */
  private static loadConfigFile(configPath: string): Partial<AnalysisConfig> {
    if (!fs.existsSync(configPath)) {
      throw new Error(`配置文件不存在: ${configPath}`);
    }

    const ext = path.extname(configPath);
    
    try {
      if (ext === '.json' || configPath.endsWith('.analysisrc')) {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      } else if (ext === '.js') {
        // 清除require缓存
        delete require.cache[require.resolve(configPath)];
        const configModule = require(configPath);
        return configModule.default || configModule;
      } else {
        throw new Error(`不支持的配置文件格式: ${ext}`);
      }
    } catch (error) {
      throw new Error(`加载配置文件失败 ${configPath}: ${error.message}`);
    }
  }

  /**
   * 深度合并配置对象
   * @param defaultConfig 默认配置
   * @param userConfig 用户配置
   * @returns 合并后的配置
   */
  private static mergeConfig(
    defaultConfig: AnalysisConfig, 
    userConfig: Partial<AnalysisConfig>
  ): AnalysisConfig {
    const merged = { ...defaultConfig };

    // 深度合并tools配置
    if (userConfig.tools) {
      merged.tools = {
        eslint: { ...defaultConfig.tools.eslint, ...userConfig.tools.eslint },
        typescript: { ...defaultConfig.tools.typescript, ...userConfig.tools.typescript },
        jest: { ...defaultConfig.tools.jest, ...userConfig.tools.jest },
        sonarjs: { ...defaultConfig.tools.sonarjs, ...userConfig.tools.sonarjs }
      };
    }

    // 深度合并scoring配置
    if (userConfig.scoring) {
      merged.scoring = {
        weights: { ...defaultConfig.scoring.weights, ...userConfig.scoring.weights },
        thresholds: {
          complexity: { ...defaultConfig.scoring.thresholds.complexity, ...userConfig.scoring.thresholds?.complexity },
          coverage: { ...defaultConfig.scoring.thresholds.coverage, ...userConfig.scoring.thresholds?.coverage }
        }
      };
    }

    // 合并其他顶级配置
    Object.keys(userConfig).forEach(key => {
      if (key !== 'tools' && key !== 'scoring' && userConfig[key] !== undefined) {
        merged[key] = { ...defaultConfig[key], ...userConfig[key] };
      }
    });

    return merged;
  }
}

// ============================================================================
// 配置工具函数
// ============================================================================

/**
 * 获取ESLint配置
 * @param config 分析配置
 * @returns ESLint配置对象
 */
export function getESLintConfig(config: AnalysisConfig): ESLintConfig {
  return config.tools.eslint || {};
}

/**
 * 获取TypeScript配置
 * @param config 分析配置
 * @returns TypeScript配置对象
 */
export function getTypeScriptConfig(config: AnalysisConfig): TypeScriptConfig {
  return config.tools.typescript || {};
}

/**
 * 获取Jest配置
 * @param config 分析配置
 * @returns Jest配置对象
 */
export function getJestConfig(config: AnalysisConfig): JestConfig {
  return config.tools.jest || {};
}

/**
 * 获取SonarJS配置
 * @param config 分析配置
 * @returns SonarJS配置对象
 */
export function getSonarJSConfig(config: AnalysisConfig): SonarJSConfig {
  return config.tools.sonarjs || { enabled: false };
}

/**
 * 检查分析器是否启用
 * @param config 分析配置
 * @param analyzerType 分析器类型
 * @returns 是否启用
 */
export function isAnalyzerEnabled(config: AnalysisConfig, analyzerType: AnalyzerType): boolean {
  return config.enabledAnalyzers?.includes(analyzerType) ?? true;
}

/**
 * 获取文件过滤器
 * @param config 分析配置
 * @returns 文件过滤配置
 */
export function getFileFilter(config: AnalysisConfig): FileFilterConfig {
  return config.files;
}

/**
 * 获取性能配置
 * @param config 分析配置
 * @returns 性能配置
 */
export function getPerformanceConfig(config: AnalysisConfig): PerformanceConfig {
  return config.performance;
}

/**
 * 获取评分配置
 * @param config 分析配置
 * @returns 评分配置
 */
export function getScoringConfig(config: AnalysisConfig): ScoringConfig {
  return config.scoring;
}

/**
 * 创建运行时配置
 * @param config 分析配置
 * @param overrides 运行时覆盖配置
 * @returns 运行时配置
 */
export function createRuntimeConfig(
  config: AnalysisConfig, 
  overrides: Partial<AnalysisConfig> = {}
): AnalysisConfig {
  return AnalysisConfigManager['mergeConfig'](config, overrides);
}

// ============================================================================
// 导出
// ============================================================================

export {
  AnalysisConfigSchema,
  ESLintConfigSchema,
  TypeScriptConfigSchema,
  JestConfigSchema,
  SonarJSConfigSchema,
  ScoringConfigSchema,
  PerformanceConfigSchema,
  FileFilterConfigSchema
};