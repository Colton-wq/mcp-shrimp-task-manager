import { z } from 'zod';

// 基础任务类型
export const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  dependencies: z.array(z.string()).optional(),
  assignedAgent: z.string().optional(),
  relatedFiles: z.array(z.object({
    path: z.string(),
    type: z.string(),
    description: z.string().optional(),
  })).optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// 复杂度分析类型
export const ComplexityFactorSchema = z.object({
  name: z.string(),
  score: z.number().min(1).max(10),
  description: z.string(),
  weight: z.number().min(0).max(1),
});

export const ComplexityAnalysisSchema = z.object({
  score: z.number().min(1).max(10),
  factors: z.array(ComplexityFactorSchema),
  estimatedHours: z.number().min(0),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  recommendations: z.array(z.string()),
});

export type ComplexityFactor = z.infer<typeof ComplexityFactorSchema>;
export type ComplexityAnalysis = z.infer<typeof ComplexityAnalysisSchema>;

// 边界分析类型
export const BoundaryAnalysisSchema = z.object({
  functionalBoundaries: z.array(z.string()),
  interfaceBoundaries: z.array(z.string()),
  dataBoundaries: z.array(z.string()),
  responsibilityBoundaries: z.array(z.string()),
  minimalDeliverable: z.string(),
  splitSuggestions: z.array(z.object({
    name: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
});

export type BoundaryAnalysis = z.infer<typeof BoundaryAnalysisSchema>;

// 风险分析类型
export const RiskFactorSchema = z.object({
  type: z.enum(['technical', 'resource', 'timeline', 'quality']),
  description: z.string(),
  probability: z.number().min(0).max(1),
  impact: z.number().min(1).max(10),
  mitigation: z.string(),
});

export const RiskAnalysisSchema = z.object({
  overallRiskScore: z.number().min(1).max(10),
  riskFactors: z.array(RiskFactorSchema),
  criticalRisks: z.array(z.string()),
  mitigationPlan: z.array(z.string()),
});

export type RiskFactor = z.infer<typeof RiskFactorSchema>;
export type RiskAnalysis = z.infer<typeof RiskAnalysisSchema>;

// 分析模板类型
export const AnalysisTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['complexity', 'boundary', 'risk']),
  systemPrompt: z.string(),
  parameters: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(100).max(4000).optional(),
    topP: z.number().min(0).max(1).optional(),
  }),
  variables: z.array(z.string()),
  builtin: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

export type AnalysisTemplate = z.infer<typeof AnalysisTemplateSchema>;

// 分析请求类型
export const AnalysisRequestSchema = z.object({
  task: TaskSchema,
  templateId: z.string(),
  context: z.object({
    projectId: z.string(),
    relatedTasks: z.array(TaskSchema).optional(),
    projectContext: z.record(z.unknown()).optional(),
  }),
  options: z.object({
    useCache: z.boolean().default(true),
    forceRefresh: z.boolean().default(false),
  }).optional(),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

// 分析结果类型
export const AnalysisResultSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  templateId: z.string(),
  type: z.enum(['complexity', 'boundary', 'risk']),
  result: z.union([
    ComplexityAnalysisSchema,
    BoundaryAnalysisSchema,
    RiskAnalysisSchema,
  ]),
  metadata: z.object({
    timestamp: z.string().datetime(),
    processingTime: z.number(),
    cacheHit: z.boolean(),
    confidence: z.number().min(0).max(1),
  }),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// 缓存条目类型
export const CacheEntrySchema = z.object({
  key: z.string(),
  result: AnalysisResultSchema,
  timestamp: z.string().datetime(),
  expiresAt: z.string().datetime(),
  accessCount: z.number().default(0),
});

export type CacheEntry = z.infer<typeof CacheEntrySchema>;

// API响应类型
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }).optional(),
  metadata: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string(),
    processingTime: z.number(),
  }),
});

export type ApiResponse<T = unknown> = Omit<z.infer<typeof ApiResponseSchema>, 'data'> & {
  data?: T;
};

// 错误类型
export enum AnalysisErrorType {
  VALIDATION_ERROR = 'validation_error',
  TEMPLATE_NOT_FOUND = 'template_not_found',
  API_ERROR = 'api_error',
  CACHE_ERROR = 'cache_error',
  PROCESSING_ERROR = 'processing_error',
}

export class AnalysisError extends Error {
  constructor(
    public type: AnalysisErrorType,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}