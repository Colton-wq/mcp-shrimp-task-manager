import { nanoid } from 'nanoid';
import {
  Task,
  AnalysisTemplate,
  AnalysisRequest,
  AnalysisResult,
  ComplexityAnalysis,
  BoundaryAnalysis,
  RiskAnalysis,
  CacheEntry,
  AnalysisError,
  AnalysisErrorType,
  TaskSchema,
  AnalysisRequestSchema,
  ComplexityAnalysisSchema,
  BoundaryAnalysisSchema,
  RiskAnalysisSchema,
} from '../types/analysis';

/**
 * 任务智能分析服务
 * 提供任务复杂度评估、边界识别、风险分析等核心功能
 */
export class TaskAnalysisService {
  private cache: Map<string, CacheEntry> = new Map();
  private templates: Map<string, AnalysisTemplate> = new Map();
  private readonly CACHE_EXPIRY_HOURS = 24;
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.initializeBuiltinTemplates();
    this.loadCacheFromStorage();
  }

  /**
   * 分析任务复杂度
   */
  async analyzeComplexity(task: Task, context?: any): Promise<ComplexityAnalysis> {
    const template = this.templates.get('complexity-default');
    if (!template) {
      throw new AnalysisError(
        AnalysisErrorType.TEMPLATE_NOT_FOUND,
        'Default complexity template not found'
      );
    }

    const request: AnalysisRequest = {
      task,
      templateId: template.id,
      context: {
        projectId: context?.projectId || 'default',
        relatedTasks: context?.relatedTasks || [],
        projectContext: context?.projectContext || {},
      },
    };

    const result = await this.performAnalysis(request);
    return result.result as ComplexityAnalysis;
  }

  /**
   * 识别任务边界
   */
  async identifyBoundaries(task: Task, context?: any): Promise<BoundaryAnalysis> {
    const template = this.templates.get('boundary-default');
    if (!template) {
      throw new AnalysisError(
        AnalysisErrorType.TEMPLATE_NOT_FOUND,
        'Default boundary template not found'
      );
    }

    const request: AnalysisRequest = {
      task,
      templateId: template.id,
      context: {
        projectId: context?.projectId || 'default',
        relatedTasks: context?.relatedTasks || [],
        projectContext: context?.projectContext || {},
      },
    };

    const result = await this.performAnalysis(request);
    return result.result as BoundaryAnalysis;
  }

  /**
   * 评估任务风险
   */
  async assessRisks(task: Task, context?: any): Promise<RiskAnalysis> {
    const template = this.templates.get('risk-default');
    if (!template) {
      throw new AnalysisError(
        AnalysisErrorType.TEMPLATE_NOT_FOUND,
        'Default risk template not found'
      );
    }

    const request: AnalysisRequest = {
      task,
      templateId: template.id,
      context: {
        projectId: context?.projectId || 'default',
        relatedTasks: context?.relatedTasks || [],
        projectContext: context?.projectContext || {},
      },
    };

    const result = await this.performAnalysis(request);
    return result.result as RiskAnalysis;
  }

  /**
   * 执行分析
   */
  private async performAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
    // 验证请求
    const validatedRequest = AnalysisRequestSchema.parse(request);
    
    // 检查缓存
    const cacheKey = this.generateCacheKey(validatedRequest);
    const cachedResult = this.getFromCache(cacheKey);
    
    if (cachedResult && !validatedRequest.options?.forceRefresh) {
      return cachedResult.result;
    }

    // 获取模板
    const template = this.templates.get(validatedRequest.templateId);
    if (!template) {
      throw new AnalysisError(
        AnalysisErrorType.TEMPLATE_NOT_FOUND,
        `Template ${validatedRequest.templateId} not found`
      );
    }

    // 执行AI分析
    const startTime = Date.now();
    const analysisResult = await this.callAIAnalysis(validatedRequest, template);
    const processingTime = Date.now() - startTime;

    // 创建结果对象
    const result: AnalysisResult = {
      id: nanoid(),
      taskId: validatedRequest.task.id,
      templateId: validatedRequest.templateId,
      type: template.category,
      result: analysisResult,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime,
        cacheHit: false,
        confidence: this.calculateConfidence(analysisResult),
      },
    };

    // 缓存结果
    this.saveToCache(cacheKey, result);

    return result;
  }

  /**
   * 调用AI分析API
   */
  private async callAIAnalysis(
    request: AnalysisRequest,
    template: AnalysisTemplate
  ): Promise<ComplexityAnalysis | BoundaryAnalysis | RiskAnalysis> {
    try {
      // 构建提示词
      const prompt = this.buildPrompt(request, template);
      
      // 调用API
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          template: template.category,
          parameters: template.parameters,
          task: request.task,
          context: request.context,
        }),
      });

      if (!response.ok) {
        throw new AnalysisError(
          AnalysisErrorType.API_ERROR,
          `API request failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      
      // 验证响应数据
      return this.validateAnalysisResult(data.result, template.category);
    } catch (error) {
      if (error instanceof AnalysisError) {
        throw error;
      }
      throw new AnalysisError(
        AnalysisErrorType.PROCESSING_ERROR,
        `Analysis processing failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * 构建AI提示词
   */
  private buildPrompt(request: AnalysisRequest, template: AnalysisTemplate): string {
    let prompt = template.systemPrompt;

    // 替换变量
    const variables = {
      taskName: request.task.name,
      taskDescription: request.task.description || '',
      taskDependencies: request.task.dependencies?.join(', ') || 'None',
      relatedTasksCount: request.context.relatedTasks?.length || 0,
      projectContext: JSON.stringify(request.context.projectContext || {}),
    };

    template.variables.forEach(variable => {
      const value = variables[variable as keyof typeof variables] || '';
      prompt = prompt.replace(new RegExp(`{{${variable}}}`, 'g'), String(value));
    });

    return prompt;
  }

  /**
   * 验证分析结果
   */
  private validateAnalysisResult(
    result: any,
    category: string
  ): ComplexityAnalysis | BoundaryAnalysis | RiskAnalysis {
    try {
      switch (category) {
        case 'complexity':
          return ComplexityAnalysisSchema.parse(result);
        case 'boundary':
          return BoundaryAnalysisSchema.parse(result);
        case 'risk':
          return RiskAnalysisSchema.parse(result);
        default:
          throw new Error(`Unknown analysis category: ${category}`);
      }
    } catch (error) {
      throw new AnalysisError(
        AnalysisErrorType.VALIDATION_ERROR,
        `Analysis result validation failed: ${error.message}`,
        error
      );
    }
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(result: any): number {
    // 基于结果的完整性和一致性计算置信度
    let confidence = 0.5; // 基础置信度

    if (result.reasoning && result.reasoning.length > 50) {
      confidence += 0.2;
    }

    if (result.recommendations && result.recommendations.length > 0) {
      confidence += 0.1;
    }

    if (result.factors && result.factors.length >= 3) {
      confidence += 0.1;
    }

    if (result.score && result.score >= 1 && result.score <= 10) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: AnalysisRequest): string {
    const keyData = {
      taskId: request.task.id,
      templateId: request.templateId,
      taskHash: this.hashTask(request.task),
    };
    return btoa(JSON.stringify(keyData));
  }

  /**
   * 计算任务哈希
   */
  private hashTask(task: Task): string {
    const taskString = JSON.stringify({
      name: task.name,
      description: task.description,
      dependencies: task.dependencies,
    });
    return btoa(taskString);
  }

  /**
   * 从缓存获取
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (new Date(entry.expiresAt) < new Date()) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问计数
    entry.accessCount++;
    return entry;
  }

  /**
   * 保存到缓存
   */
  private saveToCache(key: string, result: AnalysisResult): void {
    // 清理过期缓存
    this.cleanExpiredCache();

    // 如果缓存已满，删除最少使用的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.CACHE_EXPIRY_HOURS);

    const entry: CacheEntry = {
      key,
      result,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      accessCount: 1,
    };

    this.cache.set(key, entry);
    this.saveCacheToStorage();
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (new Date(entry.expiresAt) < now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 驱逐最少使用的缓存条目
   */
  private evictLeastUsed(): void {
    let leastUsedKey = '';
    let minAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  /**
   * 从localStorage加载缓存
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheData = localStorage.getItem('taskAnalysisCache');
      if (cacheData) {
        const entries = JSON.parse(cacheData);
        for (const entry of entries) {
          this.cache.set(entry.key, entry);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * 保存缓存到localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const entries = Array.from(this.cache.values());
      localStorage.setItem('taskAnalysisCache', JSON.stringify(entries));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * 初始化内置模板
   */
  private initializeBuiltinTemplates(): void {
    const templates: AnalysisTemplate[] = [
      {
        id: 'complexity-default',
        name: '任务复杂度分析',
        category: 'complexity',
        systemPrompt: `你是一个专业的任务分析专家。请分析以下任务的复杂度：

任务名称：{{taskName}}
任务描述：{{taskDescription}}
依赖关系：{{taskDependencies}}

请从以下维度进行分析：
1. 技术难度 (1-10分)
2. 时间估算 (小时)
3. 依赖复杂度 (1-10分)
4. 风险评估 (1-10分)

请提供详细的分析理由和改进建议。`,
        parameters: {
          temperature: 0.3,
          maxTokens: 1000,
          topP: 0.9,
        },
        variables: ['taskName', 'taskDescription', 'taskDependencies'],
        builtin: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'boundary-default',
        name: '任务边界识别',
        category: 'boundary',
        systemPrompt: `你是一个专业的系统分析师。请分析以下任务的边界：

任务名称：{{taskName}}
任务描述：{{taskDescription}}
相关任务数量：{{relatedTasksCount}}

请识别以下边界：
1. 核心功能范围
2. 接口边界
3. 数据边界
4. 责任边界
5. 最小可交付单元

请提供任务分解建议。`,
        parameters: {
          temperature: 0.2,
          maxTokens: 800,
          topP: 0.8,
        },
        variables: ['taskName', 'taskDescription', 'relatedTasksCount'],
        builtin: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'risk-default',
        name: '任务风险评估',
        category: 'risk',
        systemPrompt: `你是一个专业的风险管理专家。请评估以下任务的风险：

任务名称：{{taskName}}
任务描述：{{taskDescription}}
项目上下文：{{projectContext}}

请从以下维度评估风险：
1. 技术风险
2. 资源风险
3. 时间风险
4. 质量风险

请提供风险缓解计划。`,
        parameters: {
          temperature: 0.4,
          maxTokens: 1200,
          topP: 0.9,
        },
        variables: ['taskName', 'taskDescription', 'projectContext'],
        builtin: true,
        createdAt: new Date().toISOString(),
      },
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * 获取所有模板
   */
  getTemplates(): AnalysisTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 获取特定模板
   */
  getTemplate(id: string): AnalysisTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('taskAnalysisCache');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hitRate: number } {
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      size: this.cache.size,
      hitRate: totalAccess > 0 ? this.cache.size / totalAccess : 0,
    };
  }
}