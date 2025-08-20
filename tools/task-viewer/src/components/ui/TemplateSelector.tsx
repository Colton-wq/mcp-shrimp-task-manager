import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnalysisTemplate } from '../../types/analysis';
import styles from './TemplateSelector.module.css';

interface TemplateSelectorProps {
  templates: AnalysisTemplate[];
  selectedTemplate: string | null;
  onSelect: (templateId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showDescription?: boolean;
}

/**
 * 分析模板选择器组件
 * 提供下拉菜单选择分析模板
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onSelect,
  placeholder,
  disabled = false,
  className,
  showDescription = true,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const defaultPlaceholder = placeholder || t('chat.selectTemplate', 'Select analysis template...');

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.category && template.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get selected template object
  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredTemplates[focusedIndex]) {
          handleSelect(filteredTemplates[focusedIndex].id);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredTemplates.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredTemplates.length - 1
          );
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
        }
        break;
    }
  };

  const handleSelect = (templateId: string) => {
    onSelect(templateId);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleToggle = () => {
    if (disabled) return;
    
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setFocusedIndex(-1);
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'complexity':
        return '🧮';
      case 'boundary':
        return '🎯';
      case 'risk':
        return '⚠️';
      default:
        return '📋';
    }
  };

  const getCategoryLabel = (category: string) => {
    return t(`analysis.${category}Analysis`, category);
  };

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${disabled ? styles.disabled : ''} ${className || ''}`}
      onKeyDown={handleKeyDown}
    >
      {/* Selected value display */}
      <div 
        className={`${styles.selector} ${isOpen ? styles.open : ''}`}
        onClick={handleToggle}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={defaultPlaceholder}
        tabIndex={disabled ? -1 : 0}
      >
        <div className={styles.selectedValue}>
          {selectedTemplateObj ? (
            <div className={styles.selectedTemplate}>
              <span className={styles.templateIcon}>
                {getCategoryIcon(selectedTemplateObj.category)}
              </span>
              <div className={styles.templateInfo}>
                <span className={styles.templateName}>{selectedTemplateObj.name}</span>
                {showDescription && (
                  <span className={styles.templateCategory}>
                    {getCategoryLabel(selectedTemplateObj.category)}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className={styles.placeholder}>{defaultPlaceholder}</span>
          )}
        </div>
        
        <div className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>
          ▼
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {/* Search input */}
          <div className={styles.searchContainer}>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('chat.searchTemplates', 'Search templates...')}
              className={styles.searchInput}
              aria-label={t('chat.searchTemplates', 'Search templates...')}
            />
          </div>

          {/* Template list */}
          <div className={styles.templateList}>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className={`${styles.templateOption} ${
                    index === focusedIndex ? styles.focused : ''
                  } ${template.id === selectedTemplate ? styles.selected : ''}`}
                  onClick={() => handleSelect(template.id)}
                  role="option"
                  aria-selected={template.id === selectedTemplate}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className={styles.templateIcon}>
                    {getCategoryIcon(template.category)}
                  </span>
                  
                  <div className={styles.templateDetails}>
                    <div className={styles.templateName}>{template.name}</div>
                    <div className={styles.templateMeta}>
                      <span className={styles.templateCategory}>
                        {getCategoryLabel(template.category)}
                      </span>
                      {template.builtin && (
                        <span className={styles.builtinBadge}>
                          {t('chat.builtin', 'Built-in')}
                        </span>
                      )}
                    </div>
                    {showDescription && template.systemPrompt && (
                      <div className={styles.templateDescription}>
                        {template.systemPrompt.substring(0, 100)}
                        {template.systemPrompt.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                {t('chat.noTemplatesFound', 'No templates found')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;