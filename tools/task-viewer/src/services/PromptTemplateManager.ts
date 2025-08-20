import { nanoid } from 'nanoid';
import {
  PromptTemplate,
  TemplateCollection,
  TemplateContext,
  TemplateRenderResult,
  TemplateFilter,
  TemplateExport,
  TemplateValidationResult,
  TemplateStats,
  TemplateCategory,
  TemplateError,
  TemplateErrorType,
  TemplateVariable,
  PromptTemplateSchema,
  TemplateExportSchema,
  DEFAULT_TEMPLATE_SETTINGS,
} from '../types/template';

/**
 * 提示词模板管理器
 * 提供模板的创建、编辑、管理、渲染等完整功能
 */
export class PromptTemplateManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private collections: Map<string, TemplateCollection> = new Map();
  private readonly STORAGE_KEY = 'promptTemplates';
  private readonly COLLECTIONS_KEY = 'templateCollections';
  private readonly STATS_KEY = 'templateStats';

  constructor() {
    this.loadFromStorage();
    this.initializeBuiltinTemplates();
  }

  // ==================== 模板CRUD操作 ====================

  /**
   * 创建新模板
   */
  async createTemplate(
    templateData: Omit<PromptTemplate, 'id' | 'metadata' | 'usage'>
  ): Promise<PromptTemplate> {
    const template: PromptTemplate = {
      ...templateData,
      id: nanoid(),
      usage: {
        count: 0,
        lastUsed: undefined,
        rating: undefined,
        feedback: [],
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        size: templateData.content.length,
        complexity: this.calculateComplexity(templateData.content, templateData.variables),
      },
      settings: {
        ...DEFAULT_TEMPLATE_SETTINGS,
        ...templateData.settings,
      },
    };

    // 验证模板
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new TemplateError(
        TemplateErrorType.VALIDATION_ERROR,
        `Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        validation.errors
      );
    }

    this.templates.set(template.id, template);
    await this.saveToStorage();

    return template;
  }

  /**
   * 获取模板
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    id: string,
    updates: Partial<Omit<PromptTemplate, 'id' | 'metadata'>>
  ): Promise<PromptTemplate> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new TemplateError(
        TemplateErrorType.TEMPLATE_NOT_FOUND,
        `Template with id ${id} not found`
      );
    }

    const updated: PromptTemplate = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        size: updates.content?.length || existing.metadata.size,
        complexity: updates.content || updates.variables
          ? this.calculateComplexity(
              updates.content || existing.content,
              updates.variables || existing.variables
            )
          : existing.metadata.complexity,
      },
    };

    // 验证更新后的模板
    const validation = this.validateTemplate(updated);
    if (!validation.valid) {
      throw new TemplateError(
        TemplateErrorType.VALIDATION_ERROR,
        `Template validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        validation.errors
      );
    }

    this.templates.set(id, updated);
    await this.saveToStorage();

    return updated;
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    // 不允许删除内置模板
    if (template.builtin) {
      throw new TemplateError(
        TemplateErrorType.VALIDATION_ERROR,
        'Cannot delete builtin template'
      );
    }

    this.templates.delete(id);
    
    // 从集合中移除
    for (const collection of this.collections.values()) {
      const index = collection.templates.indexOf(id);
      if (index > -1) {
        collection.templates.splice(index, 1);
      }
    }

    await this.saveToStorage();
    return true;
  }

  /**
   * 复制模板
   */
  async duplicateTemplate(id: string, name?: string): Promise<PromptTemplate> {
    const original = this.templates.get(id);
    if (!original) {
      throw new TemplateError(
        TemplateErrorType.TEMPLATE_NOT_FOUND,
        `Template with id ${id} not found`
      );
    }

    const duplicated = await this.createTemplate({
      ...original,
      name: name || `${original.name} (Copy)`,
      builtin: false,
      public: false,
      usage: undefined as any,
      metadata: undefined as any,
    });

    return duplicated;
  }

  // ==================== 模板搜索和过滤 ====================

  /**
   * 搜索模板
   */
  searchTemplates(filter: Partial<TemplateFilter> = {}): PromptTemplate[] {
    const {
      category,
      tags,
      language,
      builtin,
      public: isPublic,
      author,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit = 20,
      offset = 0,
    } = filter;

    let results = Array.from(this.templates.values());

    // 应用过滤器
    if (category !== undefined) {
      results = results.filter(t => t.category === category);
    }

    if (tags && tags.length > 0) {
      results = results.filter(t => 
        tags.some(tag => t.tags.some(tTag => tTag.id === tag))
      );
    }

    if (language !== undefined) {
      results = results.filter(t => t.language === language);
    }

    if (builtin !== undefined) {
      results = results.filter(t => t.builtin === builtin);
    }

    if (isPublic !== undefined) {
      results = results.filter(t => t.public === isPublic);
    }

    if (author !== undefined) {
      results = results.filter(t => t.author === author);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.content.toLowerCase().includes(searchLower)
      );
    }

    // 排序
    results.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.metadata.createdAt).getTime();
          bValue = new Date(b.metadata.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.metadata.updatedAt).getTime();
          bValue = new Date(b.metadata.updatedAt).getTime();
          break;
        case 'usage':
          aValue = a.usage.count;
          bValue = b.usage.count;
          break;
        case 'rating':
          aValue = a.usage.rating || 0;
          bValue = b.usage.rating || 0;
          break;
        default:
          aValue = a.metadata.updatedAt;
          bValue = b.metadata.updatedAt;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // 分页
    return results.slice(offset, offset + limit);
  }

  /**
   * 获取所有分类
   */
  getCategories(): { category: TemplateCategory; count: number }[] {
    const counts = new Map<TemplateCategory, number>();
    
    for (const template of this.templates.values()) {
      const current = counts.get(template.category) || 0;
      counts.set(template.category, current + 1);
    }

    return Array.from(counts.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }

  // ==================== 模板渲染 ====================

  /**
   * 渲染模板
   */
  async renderTemplate(
    templateId: string,
    context: TemplateContext
  ): Promise<TemplateRenderResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new TemplateError(
        TemplateErrorType.TEMPLATE_NOT_FOUND,
        `Template with id ${templateId} not found`
      );
    }

    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // 准备变量
      const variables = await this.prepareVariables(template, context);
      
      // 渲染内容
      const content = this.renderContent(template.content, variables, warnings, errors);

      // 更新使用统计
      await this.updateUsageStats(templateId);

      const renderTime = Date.now() - startTime;

      return {
        content,
        variables,
        metadata: {
          templateId,
          renderedAt: new Date().toISOString(),
          renderTime,
          variableCount: Object.keys(variables).length,
          contentLength: content.length,
        },
        warnings,
        errors,
      };

    } catch (error) {
      throw new TemplateError(
        TemplateErrorType.RENDER_ERROR,
        `Failed to render template: ${error.message}`,
        error
      );
    }
  }

  /**
   * 预览模板（不更新使用统计）
   */
  previewTemplate(
    template: PromptTemplate,
    context: TemplateContext
  ): TemplateRenderResult {
    const startTime = Date.now();
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // 准备变量
      const variables = this.prepareVariablesSync(template, context);
      
      // 渲染内容
      const content = this.renderContent(template.content, variables, warnings, errors);

      const renderTime = Date.now() - startTime;

      return {
        content,
        variables,
        metadata: {
          templateId: template.id,
          renderedAt: new Date().toISOString(),
          renderTime,
          variableCount: Object.keys(variables).length,
          contentLength: content.length,
        },
        warnings,
        errors,
      };

    } catch (error) {
      throw new TemplateError(
        TemplateErrorType.RENDER_ERROR,
        `Failed to preview template: ${error.message}`,
        error
      );
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 准备变量（异步版本）
   */
  private async prepareVariables(
    template: PromptTemplate,
    context: TemplateContext
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = { ...context.variables };

    // 添加系统变量
    variables.currentDate = new Date().toISOString();
    variables.currentTime = new Date().toLocaleTimeString();
    variables.projectId = context.projectId;
    variables.taskId = context.taskId;
    variables.userId = context.userId;

    // 验证必需变量
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        if (variable.defaultValue !== undefined) {
          variables[variable.name] = variable.defaultValue;
        } else {
          throw new TemplateError(
            TemplateErrorType.VARIABLE_MISSING,
            `Required variable '${variable.name}' is missing`
          );
        }
      }
    }

    // 验证变量类型和值
    for (const variable of template.variables) {
      if (variable.name in variables) {
        const value = variables[variable.name];
        const validation = this.validateVariable(variable, value);
        if (!validation.valid) {
          throw new TemplateError(
            TemplateErrorType.VARIABLE_INVALID,
            `Variable '${variable.name}' validation failed: ${validation.message}`
          );
        }
      }
    }

    return variables;
  }

  /**
   * 准备变量（同步版本）
   */
  private prepareVariablesSync(
    template: PromptTemplate,
    context: TemplateContext
  ): Record<string, any> {
    const variables: Record<string, any> = { ...context.variables };

    // 添加系统变量
    variables.currentDate = new Date().toISOString();
    variables.currentTime = new Date().toLocaleTimeString();
    variables.projectId = context.projectId;
    variables.taskId = context.taskId;
    variables.userId = context.userId;

    // 处理缺失的必需变量
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        if (variable.defaultValue !== undefined) {
          variables[variable.name] = variable.defaultValue;
        } else {
          variables[variable.name] = `[Missing: ${variable.name}]`;
        }
      }
    }

    return variables;
  }

  /**
   * 渲染内容
   */
  private renderContent(
    content: string,
    variables: Record<string, any>,
    warnings: string[],
    errors: string[]
  ): string {
    let rendered = content;

    // 替换变量 {{variableName}}
    const variableRegex = /\{\{([^}]+)\}\}/g;
    
    rendered = rendered.replace(variableRegex, (match, variableName) => {
      const trimmedName = variableName.trim();
      
      if (trimmedName in variables) {
        const value = variables[trimmedName];
        return this.formatVariableValue(value);
      } else {
        warnings.push(`Variable '${trimmedName}' not found`);
        return match; // 保留原始占位符
      }
    });

    return rendered;
  }

  /**
   * 格式化变量值
   */
  private formatVariableValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.formatVariableValue(item)).join(', ');
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  }

  /**
   * 验证变量
   */
  private validateVariable(variable: TemplateVariable, value: any): { valid: boolean; message?: string } {
    // 类型检查
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== variable.type && value !== null && value !== undefined) {
      return {
        valid: false,
        message: `Expected ${variable.type}, got ${actualType}`,
      };
    }

    // 字符串验证
    if (variable.type === 'string' && typeof value === 'string' && variable.validation) {
      const { minLength, maxLength, pattern, options } = variable.validation;
      
      if (minLength !== undefined && value.length < minLength) {
        return {
          valid: false,
          message: `String too short (min: ${minLength})`,
        };
      }
      
      if (maxLength !== undefined && value.length > maxLength) {
        return {
          valid: false,
          message: `String too long (max: ${maxLength})`,
        };
      }
      
      if (pattern && !new RegExp(pattern).test(value)) {
        return {
          valid: false,
          message: `String does not match pattern: ${pattern}`,
        };
      }
      
      if (options && !options.includes(value)) {
        return {
          valid: false,
          message: `Value must be one of: ${options.join(', ')}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * 计算模板复杂度
   */
  private calculateComplexity(content: string, variables: TemplateVariable[]): 'low' | 'medium' | 'high' {
    let score = 0;

    // 内容长度
    if (content.length > 2000) score += 2;
    else if (content.length > 500) score += 1;

    // 变量数量
    if (variables.length > 10) score += 2;
    else if (variables.length > 5) score += 1;

    // 变量复杂度
    const complexVariables = variables.filter(v => 
      v.type === 'object' || v.type === 'array' || v.validation
    );
    if (complexVariables.length > 3) score += 2;
    else if (complexVariables.length > 0) score += 1;

    // 模板语法复杂度
    const variableMatches = content.match(/\{\{[^}]+\}\}/g) || [];
    if (variableMatches.length > 20) score += 2;
    else if (variableMatches.length > 10) score += 1;

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * 验证模板
   */
  private validateTemplate(template: PromptTemplate): TemplateValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];
    const suggestions: string[] = [];

    try {
      // 使用Zod验证
      PromptTemplateSchema.parse(template);
    } catch (error: any) {
      if (error.errors) {
        for (const err of error.errors) {
          errors.push({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          });
        }
      }
    }

    // 自定义验证
    if (!template.name.trim()) {
      errors.push({
        field: 'name',
        message: 'Template name cannot be empty',
        code: 'EMPTY_NAME',
      });
    }

    if (!template.content.trim()) {
      errors.push({
        field: 'content',
        message: 'Template content cannot be empty',
        code: 'EMPTY_CONTENT',
      });
    }

    // 检查变量引用
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const referencedVariables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(template.content)) !== null) {
      referencedVariables.add(match[1].trim());
    }

    const definedVariables = new Set(template.variables.map(v => v.name));
    
    for (const referenced of referencedVariables) {
      if (!definedVariables.has(referenced) && !this.isSystemVariable(referenced)) {
        warnings.push({
          field: 'variables',
          message: `Referenced variable '${referenced}' is not defined`,
          code: 'UNDEFINED_VARIABLE',
        });
      }
    }

    for (const defined of definedVariables) {
      if (!referencedVariables.has(defined)) {
        warnings.push({
          field: 'variables',
          message: `Defined variable '${defined}' is not used`,
          code: 'UNUSED_VARIABLE',
        });
      }
    }

    // 建议
    if (template.description.length < 20) {
      suggestions.push('Consider adding a more detailed description');
    }

    if (template.variables.length === 0 && referencedVariables.size > 0) {
      suggestions.push('Define variables for better template reusability');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * 检查是否为系统变量
   */
  private isSystemVariable(name: string): boolean {
    const systemVariables = [
      'currentDate',
      'currentTime',
      'projectId',
      'taskId',
      'userId',
    ];
    return systemVariables.includes(name);
  }

  /**
   * 更新使用统计
   */
  private async updateUsageStats(templateId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) return;

    template.usage.count++;
    template.usage.lastUsed = new Date().toISOString();

    this.templates.set(templateId, template);
    await this.saveToStorage();
  }

  /**
   * 初始化内置模板
   */
  private initializeBuiltinTemplates(): void {
    // 如果已有内置模板，跳过初始化
    const hasBuiltinTemplates = Array.from(this.templates.values()).some(t => t.builtin);
    if (hasBuiltinTemplates) return;

    // 这里会在下一步中添加默认模板
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const templatesData = localStorage.getItem(this.STORAGE_KEY);
      if (templatesData) {
        const templates = JSON.parse(templatesData);
        for (const template of templates) {
          this.templates.set(template.id, template);
        }
      }

      const collectionsData = localStorage.getItem(this.COLLECTIONS_KEY);
      if (collectionsData) {
        const collections = JSON.parse(collectionsData);
        for (const collection of collections) {
          this.collections.set(collection.id, collection);
        }
      }
    } catch (error) {
      console.warn('Failed to load templates from storage:', error);
    }
  }

  /**
   * 保存到存储
   */
  private async saveToStorage(): Promise<void> {
    try {
      const templates = Array.from(this.templates.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));

      const collections = Array.from(this.collections.values());
      localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));
    } catch (error) {
      console.warn('Failed to save templates to storage:', error);
    }
  }

  // ==================== 导入导出功能 ====================

  /**
   * 导出模板
   */
  exportTemplates(templateIds?: string[]): TemplateExport {
    const templatesToExport = templateIds
      ? templateIds.map(id => this.templates.get(id)).filter(Boolean) as PromptTemplate[]
      : Array.from(this.templates.values());

    const exportData: TemplateExport = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      templates: templatesToExport,
      collections: Array.from(this.collections.values()),
      metadata: {
        source: 'Shrimp Task Manager',
        description: `Exported ${templatesToExport.length} templates`,
      },
    };

    return exportData;
  }

  /**
   * 导入模板
   */
  async importTemplates(exportData: TemplateExport, options: {
    overwrite?: boolean;
    skipBuiltin?: boolean;
  } = {}): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const { overwrite = false, skipBuiltin = true } = options;
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
      // 验证导入数据
      TemplateExportSchema.parse(exportData);

      for (const template of exportData.templates) {
        try {
          // 跳过内置模板
          if (skipBuiltin && template.builtin) {
            skipped++;
            continue;
          }

          // 检查是否已存在
          const existing = this.templates.get(template.id);
          if (existing && !overwrite) {
            skipped++;
            continue;
          }

          // 验证模板
          const validation = this.validateTemplate(template);
          if (!validation.valid) {
            errors.push(`Template '${template.name}': ${validation.errors.map(e => e.message).join(', ')}`);
            continue;
          }

          // 导入模板
          this.templates.set(template.id, {
            ...template,
            metadata: {
              ...template.metadata,
              updatedAt: new Date().toISOString(),
            },
          });

          imported++;
        } catch (error: any) {
          errors.push(`Template '${template.name}': ${error.message}`);
        }
      }

      // 导入集合
      if (exportData.collections) {
        for (const collection of exportData.collections) {
          this.collections.set(collection.id, collection);
        }
      }

      await this.saveToStorage();

      return { imported, skipped, errors };
    } catch (error: any) {
      throw new TemplateError(
        TemplateErrorType.IMPORT_ERROR,
        `Failed to import templates: ${error.message}`,
        error
      );
    }
  }

  // ==================== 统计功能 ====================

  /**
   * 获取统计信息
   */
  getStats(): TemplateStats {
    const templates = Array.from(this.templates.values());
    
    const categoryCounts: Record<string, number> = {};
    const languageCounts: Record<string, number> = {};
    let totalUsage = 0;
    let totalRating = 0;
    let ratedCount = 0;

    for (const template of templates) {
      // 分类统计
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
      
      // 语言统计
      languageCounts[template.language] = (languageCounts[template.language] || 0) + 1;
      
      // 使用统计
      totalUsage += template.usage.count;
      if (template.usage.rating) {
        totalRating += template.usage.rating;
        ratedCount++;
      }
    }

    // 最常用模板
    const mostUsedTemplates = templates
      .filter(t => t.usage.count > 0)
      .sort((a, b) => b.usage.count - a.usage.count)
      .slice(0, 10)
      .map(t => ({
        templateId: t.id,
        name: t.name,
        usageCount: t.usage.count,
      }));

    // 最近使用模板
    const recentlyUsed = templates
      .filter(t => t.usage.lastUsed)
      .sort((a, b) => new Date(b.usage.lastUsed!).getTime() - new Date(a.usage.lastUsed!).getTime())
      .slice(0, 10)
      .map(t => ({
        templateId: t.id,
        name: t.name,
        lastUsed: t.usage.lastUsed!,
      }));

    return {
      totalTemplates: templates.length,
      builtinTemplates: templates.filter(t => t.builtin).length,
      customTemplates: templates.filter(t => !t.builtin).length,
      publicTemplates: templates.filter(t => t.public).length,
      categoryCounts,
      languageCounts,
      usageStats: {
        totalUsage,
        averageRating: ratedCount > 0 ? totalRating / ratedCount : 0,
        mostUsedTemplates,
        recentlyUsed,
      },
    };
  }

  /**
   * 清理未使用的模板
   */
  async cleanupUnusedTemplates(daysThreshold: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    let cleaned = 0;
    const toDelete: string[] = [];

    for (const [id, template] of this.templates.entries()) {
      // 不删除内置模板
      if (template.builtin) continue;

      // 检查是否未使用或长时间未使用
      if (template.usage.count === 0 || 
          (template.usage.lastUsed && new Date(template.usage.lastUsed) < cutoffDate)) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      await this.deleteTemplate(id);
      cleaned++;
    }

    return cleaned;
  }
}

export default PromptTemplateManager;