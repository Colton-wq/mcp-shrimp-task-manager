import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PromptTemplate,
  TemplateCategory,
  TemplateFilter,
  TemplateStats,
  BUILTIN_TAGS,
} from '../types/template';
import PromptTemplateManager from '../services/PromptTemplateManager';
import TemplateEditor from './TemplateEditor';
import styles from './TemplateManager.module.css';

interface TemplateManagerProps {
  templateManager: PromptTemplateManager;
  onSelectTemplate?: (template: PromptTemplate) => void;
  className?: string;
}

/**
 * 模板管理界面组件
 * 提供模板列表、搜索、编辑、删除等完整管理功能
 */
export const TemplateManager: React.FC<TemplateManagerProps> = ({
  templateManager,
  onSelectTemplate,
  className,
}) => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PromptTemplate[]>([]);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [filter, setFilter] = useState<Partial<TemplateFilter>>({
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    limit: 50,
    offset: 0,
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 加载模板列表
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTemplates = templateManager.searchTemplates(filter);
      setTemplates(allTemplates);
      setFilteredTemplates(allTemplates);
      
      const templateStats = templateManager.getStats();
      setStats(templateStats);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [templateManager, filter]);

  // 初始加载
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 应用过滤器
  useEffect(() => {
    const filtered = templateManager.searchTemplates(filter);
    setFilteredTemplates(filtered);
  }, [templateManager, filter]);

  // 处理搜索
  const handleSearch = useCallback((searchTerm: string) => {
    setFilter(prev => ({
      ...prev,
      search: searchTerm || undefined,
      offset: 0,
    }));
  }, []);

  // 处理分类过滤
  const handleCategoryFilter = useCallback((category: TemplateCategory | 'all') => {
    setFilter(prev => ({
      ...prev,
      category: category === 'all' ? undefined : category,
      offset: 0,
    }));
  }, []);

  // 处理标签过滤
  const handleTagFilter = useCallback((tagId: string) => {
    setFilter(prev => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
      
      return {
        ...prev,
        tags: newTags.length > 0 ? newTags : undefined,
        offset: 0,
      };
    });
  }, []);

  // 处理排序
  const handleSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilter(prev => ({
      ...prev,
      sortBy: sortBy as any,
      sortOrder,
      offset: 0,
    }));
  }, []);

  // 创建新模板
  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null);
    setShowEditor(true);
  }, []);

  // 编辑模板
  const handleEditTemplate = useCallback((template: PromptTemplate) => {
    if (template.builtin) {
      // 内置模板不能编辑，创建副本
      const confirmed = window.confirm(
        t('template.confirmDuplicateBuiltin', '内置模板不能编辑，是否创建副本进行编辑？')
      );
      if (confirmed) {
        templateManager.duplicateTemplate(template.id, `${template.name} (副本)`)
          .then(duplicated => {
            setEditingTemplate(duplicated);
            setShowEditor(true);
          })
          .catch(error => {
            alert(`创建副本失败: ${error.message}`);
          });
      }
    } else {
      setEditingTemplate(template);
      setShowEditor(true);
    }
  }, [templateManager, t]);

  // 删除模板
  const handleDeleteTemplate = useCallback(async (template: PromptTemplate) => {
    if (template.builtin) {
      alert(t('template.cannotDeleteBuiltin', '不能删除内置模板'));
      return;
    }

    const confirmed = window.confirm(
      t('template.confirmDelete', '确定要删除模板 "{{name}}" 吗？', { name: template.name })
    );

    if (confirmed) {
      try {
        await templateManager.deleteTemplate(template.id);
        await loadTemplates();
        
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      } catch (error) {
        alert(`删除失败: ${error.message}`);
      }
    }
  }, [templateManager, selectedTemplate, loadTemplates, t]);

  // 复制模板
  const handleDuplicateTemplate = useCallback(async (template: PromptTemplate) => {
    try {
      const duplicated = await templateManager.duplicateTemplate(template.id);
      await loadTemplates();
      setSelectedTemplate(duplicated);
    } catch (error) {
      alert(`复制失败: ${error.message}`);
    }
  }, [templateManager, loadTemplates]);

  // 保存模板
  const handleSaveTemplate = useCallback(async (template: PromptTemplate) => {
    setShowEditor(false);
    setEditingTemplate(null);
    await loadTemplates();
    setSelectedTemplate(template);
  }, [loadTemplates]);

  // 选择模板
  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  }, [onSelectTemplate]);

  // 导出模板
  const handleExportTemplates = useCallback(() => {
    try {
      const exportData = templateManager.exportTemplates();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `templates-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(`导出失败: ${error.message}`);
    }
  }, [templateManager]);

  // 导入模板
  const handleImportTemplates = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        const result = await templateManager.importTemplates(importData, {
          overwrite: false,
          skipBuiltin: true,
        });

        alert(
          t('template.importResult', 
            '导入完成：成功 {{imported}} 个，跳过 {{skipped}} 个{{errors}}',
            {
              imported: result.imported,
              skipped: result.skipped,
              errors: result.errors.length > 0 ? `，错误 ${result.errors.length} 个` : '',
            }
          )
        );

        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }

        await loadTemplates();
      } catch (error) {
        alert(`导入失败: ${error.message}`);
      }
    };
    reader.readAsText(file);
    
    // 清除文件选择
    event.target.value = '';
  }, [templateManager, loadTemplates, t]);

  // 获取分类选项
  const categoryOptions = useMemo(() => [
    { value: 'all', label: t('template.allCategories', '全部分类'), count: templates.length },
    ...Object.values(TemplateCategory).map(category => ({
      value: category,
      label: t(`template.category.${category}`, category),
      count: templates.filter(t => t.category === category).length,
    })),
  ], [templates, t]);

  // 格式化日期
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  if (showEditor) {
    return (
      <TemplateEditor
        template={editingTemplate || undefined}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setShowEditor(false);
          setEditingTemplate(null);
        }}
        templateManager={templateManager}
        className={className}
      />
    );
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* 头部工具栏 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>{t('template.templateManager', '模板管理')}</h2>
          {stats && (
            <div className={styles.statsInfo}>
              {t('template.totalTemplates', '共 {{count}} 个模板', { count: stats.totalTemplates })}
            </div>
          )}
        </div>
        
        <div className={styles.headerActions}>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => setShowStats(!showStats)}
          >
            {t('template.statistics', '统计')}
          </button>
          
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={handleExportTemplates}
          >
            {t('template.export', '导出')}
          </button>
          
          <label className={`${styles.button} ${styles.secondaryButton}`}>
            {t('template.import', '导入')}
            <input
              type="file"
              accept=".json"
              onChange={handleImportTemplates}
              style={{ display: 'none' }}
            />
          </label>
          
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={handleCreateTemplate}
          >
            {t('template.createNew', '新建模板')}
          </button>
        </div>
      </div>

      {/* 统计面板 */}
      {showStats && stats && (
        <div className={styles.statsPanel}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.totalTemplates}</div>
              <div className={styles.statLabel}>{t('template.totalTemplates', '总模板数')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.builtinTemplates}</div>
              <div className={styles.statLabel}>{t('template.builtinTemplates', '内置模板')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.customTemplates}</div>
              <div className={styles.statLabel}>{t('template.customTemplates', '自定义模板')}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.usageStats.totalUsage}</div>
              <div className={styles.statLabel}>{t('template.totalUsage', '总使用次数')}</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {/* 侧边栏过滤器 */}
        <div className={styles.sidebar}>
          {/* 搜索框 */}
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t('template.searchPlaceholder', '搜索模板...')}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* 分类过滤 */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>{t('template.categories', '分类')}</h3>
            <div className={styles.filterList}>
              {categoryOptions.map(option => (
                <button
                  key={option.value}
                  className={`${styles.filterItem} ${
                    (filter.category === option.value || 
                     (option.value === 'all' && !filter.category)) ? styles.active : ''
                  }`}
                  onClick={() => handleCategoryFilter(option.value as any)}
                >
                  <span>{option.label}</span>
                  <span className={styles.filterCount}>{option.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 标签过滤 */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>{t('template.tags', '标签')}</h3>
            <div className={styles.tagFilters}>
              {BUILTIN_TAGS.map(tag => (
                <button
                  key={tag.id}
                  className={`${styles.tagFilter} ${
                    filter.tags?.includes(tag.id) ? styles.active : ''
                  }`}
                  onClick={() => handleTagFilter(tag.id)}
                  style={{ borderColor: tag.color }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 排序选项 */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>{t('template.sortBy', '排序')}</h3>
            <select
              className={styles.sortSelect}
              value={`${filter.sortBy}-${filter.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleSort(sortBy, sortOrder as 'asc' | 'desc');
              }}
            >
              <option value="updatedAt-desc">{t('template.sort.updatedDesc', '最近更新')}</option>
              <option value="updatedAt-asc">{t('template.sort.updatedAsc', '最早更新')}</option>
              <option value="name-asc">{t('template.sort.nameAsc', '名称 A-Z')}</option>
              <option value="name-desc">{t('template.sort.nameDesc', '名称 Z-A')}</option>
              <option value="usage-desc">{t('template.sort.usageDesc', '使用最多')}</option>
              <option value="rating-desc">{t('template.sort.ratingDesc', '评分最高')}</option>
            </select>
          </div>
        </div>

        {/* 主内容区 */}
        <div className={styles.mainContent}>
          {/* 模板列表 */}
          <div className={styles.templateList}>
            {isLoading ? (
              <div className={styles.loading}>
                {t('template.loading', '加载中...')}
              </div>
            ) : filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className={`${styles.templateCard} ${
                    selectedTemplate?.id === template.id ? styles.selected : ''
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className={styles.templateHeader}>
                    <div className={styles.templateTitle}>
                      <h4>{template.name}</h4>
                      {template.builtin && (
                        <span className={styles.builtinBadge}>
                          {t('template.builtin', '内置')}
                        </span>
                      )}
                      {template.public && (
                        <span className={styles.publicBadge}>
                          {t('template.public', '公开')}
                        </span>
                      )}
                    </div>
                    
                    <div className={styles.templateActions}>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTemplate(template);
                        }}
                        title={t('template.edit', '编辑')}
                      >
                        ✏️
                      </button>
                      
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateTemplate(template);
                        }}
                        title={t('template.duplicate', '复制')}
                      >
                        📋
                      </button>
                      
                      {!template.builtin && (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template);
                          }}
                          title={t('template.delete', '删除')}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={styles.templateDescription}>
                    {template.description}
                  </div>

                  <div className={styles.templateMeta}>
                    <div className={styles.templateTags}>
                      {template.tags.map(tag => (
                        <span
                          key={tag.id}
                          className={styles.templateTag}
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    
                    <div className={styles.templateStats}>
                      <span>{t('template.usageCount', '使用 {{count}} 次', { count: template.usage.count })}</span>
                      <span>{formatDate(template.metadata.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📝</div>
                <div className={styles.emptyTitle}>
                  {t('template.noTemplatesFound', '未找到模板')}
                </div>
                <div className={styles.emptyDescription}>
                  {filter.search || filter.category || filter.tags?.length
                    ? t('template.tryDifferentFilter', '尝试调整筛选条件')
                    : t('template.createFirstTemplate', '创建您的第一个模板')
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;