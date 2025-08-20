import { z } from 'zod';

// 模板变量类型
export const TemplateVariableSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string(),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
});

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

// 模板分类
export enum TemplateCategory {
  TASK_ANALYSIS = 'task_analysis',
  PROJECT_MANAGEMENT = 'project_management',
  CODE_REVIEW = 'code_review',
  DOCUMENTATION = 'documentation',
  GENERAL = 'general',
  CUSTOM = 'custom',
}

// 模板标签
export const TemplateTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export type TemplateTag = z.infer<typeof TemplateTagSchema>;

// 提示词模板
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.nativeEnum(TemplateCategory),
  tags: z.array(TemplateTagSchema).default([]),
  content: z.string(),
  variables: z.array(TemplateVariableSchema).default([]),
  language: z.string().default('zh'),
  version: z.string().default('1.0.0'),
  author: z.string().optional(),
  builtin: z.boolean().default(false),
  public: z.boolean().default(false),
  usage: z.object({
    count: z.number().default(0),
    lastUsed: z.string().datetime().optional(),
    rating: z.number().min(0).max(5).optional(),
    feedback: z.array(z.string()).default([]),
  }).default({}),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string().optional(),
    updatedBy: z.string().optional(),
    size: z.number().optional(),
    complexity: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  settings: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(4000).default(1000),
    topP: z.number().min(0).max(1).default(0.9),
    frequencyPenalty: z.number().min(-2).max(2).default(0),
    presencePenalty: z.number().min(-2).max(2).default(0),
  }).default({}),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

// 模板集合
export const TemplateCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  templates: z.array(z.string()), // Template IDs
  author: z.string().optional(),
  public: z.boolean().default(false),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.string().default('1.0.0'),
  }),
});

export type TemplateCollection = z.infer<typeof TemplateCollectionSchema>;

// 模板使用上下文
export const TemplateContextSchema = z.object({
  taskId: z.string().optional(),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  variables: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
});

export type TemplateContext = z.infer<typeof TemplateContextSchema>;

// 模板渲染结果
export const TemplateRenderResultSchema = z.object({
  content: z.string(),
  variables: z.record(z.unknown()),
  metadata: z.object({
    templateId: z.string(),
    renderedAt: z.string().datetime(),
    renderTime: z.number(),
    variableCount: z.number(),
    contentLength: z.number(),
  }),
  warnings: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});

export type TemplateRenderResult = z.infer<typeof TemplateRenderResultSchema>;

// 模板搜索过滤器
export const TemplateFilterSchema = z.object({
  category: z.nativeEnum(TemplateCategory).optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  builtin: z.boolean().optional(),
  public: z.boolean().optional(),
  author: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'usage', 'rating']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type TemplateFilter = z.infer<typeof TemplateFilterSchema>;

// 模板导入/导出格式
export const TemplateExportSchema = z.object({
  version: z.string(),
  exportedAt: z.string().datetime(),
  templates: z.array(PromptTemplateSchema),
  collections: z.array(TemplateCollectionSchema).optional(),
  metadata: z.object({
    source: z.string(),
    description: z.string().optional(),
    author: z.string().optional(),
  }),
});

export type TemplateExport = z.infer<typeof TemplateExportSchema>;

// 模板验证结果
export const TemplateValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
  })).default([]),
  warnings: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string(),
  })).default([]),
  suggestions: z.array(z.string()).default([]),
});

export type TemplateValidationResult = z.infer<typeof TemplateValidationResultSchema>;

// 模板统计信息
export const TemplateStatsSchema = z.object({
  totalTemplates: z.number(),
  builtinTemplates: z.number(),
  customTemplates: z.number(),
  publicTemplates: z.number(),
  categoryCounts: z.record(z.number()),
  languageCounts: z.record(z.number()),
  usageStats: z.object({
    totalUsage: z.number(),
    averageRating: z.number(),
    mostUsedTemplates: z.array(z.object({
      templateId: z.string(),
      name: z.string(),
      usageCount: z.number(),
    })),
    recentlyUsed: z.array(z.object({
      templateId: z.string(),
      name: z.string(),
      lastUsed: z.string().datetime(),
    })),
  }),
});

export type TemplateStats = z.infer<typeof TemplateStatsSchema>;

// 错误类型
export enum TemplateErrorType {
  TEMPLATE_NOT_FOUND = 'template_not_found',
  INVALID_TEMPLATE = 'invalid_template',
  VARIABLE_MISSING = 'variable_missing',
  VARIABLE_INVALID = 'variable_invalid',
  RENDER_ERROR = 'render_error',
  VALIDATION_ERROR = 'validation_error',
  IMPORT_ERROR = 'import_error',
  EXPORT_ERROR = 'export_error',
}

// 自定义模板错误类
export class TemplateError extends Error {
  constructor(
    public type: TemplateErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TemplateError';
  }
}

// 默认模板设置
export const DEFAULT_TEMPLATE_SETTINGS = {
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// 内置模板标签
export const BUILTIN_TAGS: TemplateTag[] = [
  { id: 'analysis', name: '分析', color: '#3b82f6', description: '用于任务和项目分析' },
  { id: 'planning', name: '规划', color: '#10b981', description: '用于项目规划和管理' },
  { id: 'review', name: '评审', color: '#f59e0b', description: '用于代码和文档评审' },
  { id: 'documentation', name: '文档', color: '#8b5cf6', description: '用于文档生成和编写' },
  { id: 'debugging', name: '调试', color: '#ef4444', description: '用于问题诊断和调试' },
  { id: 'optimization', name: '优化', color: '#06b6d4', description: '用于性能和代码优化' },
];

export default {
  TemplateCategory,
  TemplateErrorType,
  TemplateError,
  DEFAULT_TEMPLATE_SETTINGS,
  BUILTIN_TAGS,
};