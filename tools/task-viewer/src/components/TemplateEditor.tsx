import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PromptTemplate,
  TemplateCategory,
  TemplateVariable,
  TemplateValidationResult,
  BUILTIN_TAGS,
  DEFAULT_TEMPLATE_SETTINGS,
} from '../types/template';
import PromptTemplateManager from '../services/PromptTemplateManager';
import styles from './TemplateEditor.module.css';

interface TemplateEditorProps {
  template?: PromptTemplate;
  onSave: (template: PromptTemplate) => void;
  onCancel: () => void;
  templateManager: PromptTemplateManager;
  className?: string;
}

/**
 * 模板编辑器组件
 * 提供模板创建和编辑功能，支持实时预览和验证
 */
export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
  templateManager,
  className,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    category: TemplateCategory.GENERAL,
    tags: [],
    content: '',
    variables: [],
    language: 'zh',
    version: '1.0.0',
    author: '',
    builtin: false,
    public: false,
    settings: { ...DEFAULT_TEMPLATE_SETTINGS },
  });

  const [validation, setValidation] = useState<TemplateValidationResult>({
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({});
  const [previewResult, setPreviewResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (template) {
      setFormData(template);
      // 初始化预览变量
      const initialVariables: Record<string, any> = {};
      template.variables.forEach(variable => {
        initialVariables[variable.name] = variable.defaultValue || '';
      });
      setPreviewVariables(initialVariables);
    }
  }, [template]);

  // 实时验证
  useEffect(() => {
    if (formData.name && formData.content) {
      try {
        const tempTemplate = {
          ...formData,
          id: template?.id || 'temp',
          usage: { count: 0, feedback: [] },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            size: formData.content?.length || 0,
            complexity: 'medium' as const,
          },
        } as PromptTemplate;

        const result = templateManager['validateTemplate'](tempTemplate);
        setValidation(result);
      } catch (error) {
        setValidation({
          valid: false,
          errors: [{ field: 'general', message: error.message, code: 'VALIDATION_ERROR' }],
          warnings: [],
          suggestions: [],
        });
      }
    }
  }, [formData, templateManager, template?.id]);

  // 更新预览
  useEffect(() => {
    if (previewMode && formData.content) {
      updatePreview();
    }
  }, [previewMode, formData.content, previewVariables]);

  // 更新预览内容
  const updatePreview = useCallback(() => {
    if (!formData.content) return;

    try {
      const tempTemplate = {
        ...formData,
        id: 'preview',
        usage: { count: 0, feedback: [] },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          size: formData.content.length,
          complexity: 'medium' as const,
        },
      } as PromptTemplate;

      const result = templateManager.previewTemplate(tempTemplate, {
        variables: previewVariables,
      });

      setPreviewResult(result.content);
    } catch (error) {
      setPreviewResult(`预览错误: ${error.message}`);
    }
  }, [formData, previewVariables, templateManager]);

  // 处理表单字段变化
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // 处理变量变化
  const handleVariableChange = useCallback((index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.map((variable, i) =>
        i === index ? { ...variable, [field]: value } : variable
      ) || [],
    }));
  }, []);

  // 添加变量
  const addVariable = useCallback(() => {
    const newVariable: TemplateVariable = {
      name: '',
      type: 'string',
      description: '',
      required: false,
    };

    setFormData(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable],
    }));
  }, []);

  // 删除变量
  const removeVariable = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || [],
    }));
  }, []);

  // 处理预览变量变化
  const handlePreviewVariableChange = useCallback((name: string, value: any) => {
    setPreviewVariables(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // 保存模板
  const handleSave = useCallback(async () => {
    if (!validation.valid) {
      alert('请修复验证错误后再保存');
      return;
    }

    setIsLoading(true);
    try {
      let savedTemplate: PromptTemplate;

      if (template?.id) {
        // 更新现有模板
        savedTemplate = await templateManager.updateTemplate(template.id, formData);
      } else {
        // 创建新模板
        savedTemplate = await templateManager.createTemplate(formData as any);
      }

      onSave(savedTemplate);
    } catch (error) {
      alert(`保存失败: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [validation.valid, template?.id, formData, templateManager, onSave]);

  // 从内容中提取变量
  const extractVariables = useCallback(() => {
    if (!formData.content) return;

    const variableRegex = /\{\{([^}]+)\}\}/g;
    const extractedVariables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(formData.content)) !== null) {
      extractedVariables.add(match[1].trim());
    }

    const existingVariableNames = new Set(formData.variables?.map(v => v.name) || []);
    const newVariables: TemplateVariable[] = [];

    for (const variableName of extractedVariables) {
      if (!existingVariableNames.has(variableName) && !isSystemVariable(variableName)) {
        newVariables.push({
          name: variableName,
          type: 'string',
          description: `自动提取的变量: ${variableName}`,
          required: false,
        });
      }
    }

    if (newVariables.length > 0) {
      setFormData(prev => ({
        ...prev,
        variables: [...(prev.variables || []), ...newVariables],
      }));
    }
  }, [formData.content, formData.variables]);

  // 检查是否为系统变量
  const isSystemVariable = (name: string): boolean => {
    const systemVariables = ['currentDate', 'currentTime', 'projectId', 'taskId', 'userId'];
    return systemVariables.includes(name);
  };

  // 获取可用标签
  const availableTags = useMemo(() => BUILTIN_TAGS, []);

  // 获取分类选项
  const categoryOptions = useMemo(() => 
    Object.values(TemplateCategory).map(category => ({
      value: category,
      label: t(`template.category.${category}`, category),
    }))
  , [t]);

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {template ? t('template.editTemplate', '编辑模板') : t('template.createTemplate', '创建模板')}
        </h2>
        <div className={styles.headerActions}>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? t('template.editMode', '编辑模式') : t('template.previewMode', '预览模式')}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {!previewMode ? (
          // 编辑模式
          <div className={styles.editMode}>
            {/* 基本信息 */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('template.basicInfo', '基本信息')}</h3>
              
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    {t('template.name', '模板名称')} *
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder={t('template.namePlaceholder', '请输入模板名称')}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    {t('template.category', '分类')} *
                  </label>
                  <select
                    className={styles.select}
                    value={formData.category || TemplateCategory.GENERAL}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    {t('template.language', '语言')}
                  </label>
                  <select
                    className={styles.select}
                    value={formData.language || 'zh'}
                    onChange={(e) => handleFieldChange('language', e.target.value)}
                  >
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    {t('template.author', '作者')}
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.author || ''}
                    onChange={(e) => handleFieldChange('author', e.target.value)}
                    placeholder={t('template.authorPlaceholder', '请输入作者名称')}
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>
                  {t('template.description', '描述')} *
                </label>
                <textarea
                  className={styles.textarea}
                  value={formData.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder={t('template.descriptionPlaceholder', '请输入模板描述')}
                  rows={3}
                />
              </div>

              {/* 标签选择 */}
              <div className={styles.formField}>
                <label className={styles.label}>
                  {t('template.tags', '标签')}
                </label>
                <div className={styles.tagSelector}>
                  {availableTags.map(tag => (
                    <label key={tag.id} className={styles.tagOption}>
                      <input
                        type="checkbox"
                        checked={formData.tags?.some(t => t.id === tag.id) || false}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const currentTags = formData.tags || [];
                          
                          if (isChecked) {
                            handleFieldChange('tags', [...currentTags, tag]);
                          } else {
                            handleFieldChange('tags', currentTags.filter(t => t.id !== tag.id));
                          }
                        }}
                      />
                      <span className={styles.tagName} style={{ color: tag.color }}>
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 设置选项 */}
              <div className={styles.formField}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.public || false}
                    onChange={(e) => handleFieldChange('public', e.target.checked)}
                  />
                  {t('template.public', '公开模板')}
                </label>
              </div>
            </div>

            {/* 模板内容 */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{t('template.content', '模板内容')}</h3>
                <button
                  className={`${styles.button} ${styles.smallButton}`}
                  onClick={extractVariables}
                  type="button"
                >
                  {t('template.extractVariables', '提取变量')}
                </button>
              </div>
              
              <textarea
                className={`${styles.textarea} ${styles.contentEditor}`}
                value={formData.content || ''}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                placeholder={t('template.contentPlaceholder', '请输入模板内容，使用 {{variableName}} 语法定义变量')}
                rows={15}
              />
            </div>

            {/* 变量定义 */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{t('template.variables', '变量定义')}</h3>
                <button
                  className={`${styles.button} ${styles.smallButton}`}
                  onClick={addVariable}
                  type="button"
                >
                  {t('template.addVariable', '添加变量')}
                </button>
              </div>

              {formData.variables && formData.variables.length > 0 ? (
                <div className={styles.variablesList}>
                  {formData.variables.map((variable, index) => (
                    <div key={index} className={styles.variableItem}>
                      <div className={styles.variableFields}>
                        <input
                          type="text"
                          className={styles.input}
                          value={variable.name}
                          onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                          placeholder={t('template.variableName', '变量名')}
                        />
                        
                        <select
                          className={styles.select}
                          value={variable.type}
                          onChange={(e) => handleVariableChange(index, 'type', e.target.value)}
                        >
                          <option value="string">字符串</option>
                          <option value="number">数字</option>
                          <option value="boolean">布尔值</option>
                          <option value="array">数组</option>
                          <option value="object">对象</option>
                        </select>

                        <input
                          type="text"
                          className={styles.input}
                          value={variable.description}
                          onChange={(e) => handleVariableChange(index, 'description', e.target.value)}
                          placeholder={t('template.variableDescription', '变量描述')}
                        />

                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={variable.required}
                            onChange={(e) => handleVariableChange(index, 'required', e.target.checked)}
                          />
                          {t('template.required', '必需')}
                        </label>

                        <button
                          className={`${styles.button} ${styles.dangerButton} ${styles.smallButton}`}
                          onClick={() => removeVariable(index)}
                          type="button"
                        >
                          {t('template.remove', '删除')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  {t('template.noVariables', '暂无变量定义')}
                </div>
              )}
            </div>

            {/* 验证结果 */}
            {(!validation.valid || validation.warnings.length > 0) && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{t('template.validation', '验证结果')}</h3>
                
                {validation.errors.length > 0 && (
                  <div className={styles.validationErrors}>
                    <h4>{t('template.errors', '错误')}</h4>
                    {validation.errors.map((error, index) => (
                      <div key={index} className={styles.validationError}>
                        <strong>{error.field}:</strong> {error.message}
                      </div>
                    ))}
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className={styles.validationWarnings}>
                    <h4>{t('template.warnings', '警告')}</h4>
                    {validation.warnings.map((warning, index) => (
                      <div key={index} className={styles.validationWarning}>
                        <strong>{warning.field}:</strong> {warning.message}
                      </div>
                    ))}
                  </div>
                )}

                {validation.suggestions.length > 0 && (
                  <div className={styles.validationSuggestions}>
                    <h4>{t('template.suggestions', '建议')}</h4>
                    {validation.suggestions.map((suggestion, index) => (
                      <div key={index} className={styles.validationSuggestion}>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // 预览模式
          <div className={styles.previewMode}>
            <div className={styles.previewSidebar}>
              <h3 className={styles.sectionTitle}>{t('template.previewVariables', '预览变量')}</h3>
              
              {formData.variables && formData.variables.length > 0 ? (
                <div className={styles.previewVariablesList}>
                  {formData.variables.map((variable, index) => (
                    <div key={index} className={styles.previewVariableItem}>
                      <label className={styles.label}>
                        {variable.name}
                        {variable.required && <span className={styles.required}>*</span>}
                      </label>
                      <p className={styles.variableDescription}>{variable.description}</p>
                      
                      {variable.type === 'boolean' ? (
                        <select
                          className={styles.select}
                          value={String(previewVariables[variable.name] || false)}
                          onChange={(e) => handlePreviewVariableChange(variable.name, e.target.value === 'true')}
                        >
                          <option value="false">false</option>
                          <option value="true">true</option>
                        </select>
                      ) : variable.type === 'number' ? (
                        <input
                          type="number"
                          className={styles.input}
                          value={previewVariables[variable.name] || ''}
                          onChange={(e) => handlePreviewVariableChange(variable.name, Number(e.target.value))}
                        />
                      ) : (
                        <textarea
                          className={styles.textarea}
                          value={previewVariables[variable.name] || ''}
                          onChange={(e) => handlePreviewVariableChange(variable.name, e.target.value)}
                          rows={variable.type === 'object' || variable.type === 'array' ? 4 : 2}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  {t('template.noVariablesForPreview', '无变量可预览')}
                </div>
              )}
            </div>

            <div className={styles.previewContent}>
              <h3 className={styles.sectionTitle}>{t('template.previewResult', '预览结果')}</h3>
              <div className={styles.previewResult}>
                <pre>{previewResult}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className={styles.footer}>
        <button
          className={`${styles.button} ${styles.secondaryButton}`}
          onClick={onCancel}
          disabled={isLoading}
        >
          {t('template.cancel', '取消')}
        </button>
        
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleSave}
          disabled={!validation.valid || isLoading}
        >
          {isLoading ? t('template.saving', '保存中...') : t('template.save', '保存')}
        </button>
      </div>
    </div>
  );
};

export default TemplateEditor;