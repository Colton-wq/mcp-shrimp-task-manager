import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskAnalysisService } from '../../services/TaskAnalysisService';
import { AnalysisResultView } from './AnalysisResultView';
import { Task, AnalysisResult } from '../../types/analysis';

interface AnalysisIntegrationExampleProps {
  task: Task;
  projectContext?: any;
}

/**
 * 示例组件：展示如何在ChatAgent中集成任务分析功能
 * 这个组件演示了完整的分析流程，包括：
 * 1. 分析类型选择
 * 2. 分析执行
 * 3. 结果展示
 * 4. 错误处理
 */
export const AnalysisIntegrationExample: React.FC<AnalysisIntegrationExampleProps> = ({
  task,
  projectContext,
}) => {
  const { t } = useTranslation();
  const [analysisService] = useState(() => new TaskAnalysisService());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'complexity' | 'boundary' | 'risk'>('complexity');

  const handleAnalyze = async () => {
    if (!task) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let result;
      const context = {
        projectId: projectContext?.profileId || 'default',
        relatedTasks: projectContext?.tasks || [],
        projectContext: projectContext || {},
      };

      switch (selectedAnalysisType) {
        case 'complexity':
          const complexityResult = await analysisService.analyzeComplexity(task, context);
          result = {
            id: Date.now().toString(),
            taskId: task.id,
            templateId: 'complexity-default',
            type: 'complexity' as const,
            result: complexityResult,
            metadata: {
              timestamp: new Date().toISOString(),
              processingTime: 1500, // Mock processing time
              cacheHit: false,
              confidence: complexityResult.confidence,
            },
          };
          break;

        case 'boundary':
          const boundaryResult = await analysisService.identifyBoundaries(task, context);
          result = {
            id: Date.now().toString(),
            taskId: task.id,
            templateId: 'boundary-default',
            type: 'boundary' as const,
            result: boundaryResult,
            metadata: {
              timestamp: new Date().toISOString(),
              processingTime: 1200,
              cacheHit: false,
              confidence: 0.85,
            },
          };
          break;

        case 'risk':
          const riskResult = await analysisService.assessRisks(task, context);
          result = {
            id: Date.now().toString(),
            taskId: task.id,
            templateId: 'risk-default',
            type: 'risk' as const,
            result: riskResult,
            metadata: {
              timestamp: new Date().toISOString(),
              processingTime: 1800,
              cacheHit: false,
              confidence: 0.78,
            },
          };
          break;
      }

      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearResult = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const getCacheStats = () => {
    return analysisService.getCacheStats();
  };

  const clearCache = () => {
    analysisService.clearCache();
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '8px', margin: '1rem 0' }}>
      <h3>{t('analysis.taskAnalysis', 'Task Analysis')}</h3>
      
      {/* Task Information */}
      <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
          {t('analysis.analyzingTask', 'Analyzing Task')}: {task.name}
        </h4>
        {task.description && (
          <p style={{ margin: '0', fontSize: '0.875rem', color: '#666' }}>
            {task.description}
          </p>
        )}
        {task.dependencies && task.dependencies.length > 0 && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            <strong>{t('analysis.dependencies', 'Dependencies')}:</strong> {task.dependencies.join(', ')}
          </p>
        )}
      </div>

      {/* Analysis Type Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          {t('analysis.analysisType', 'Analysis Type')}:
        </label>
        <select
          value={selectedAnalysisType}
          onChange={(e) => setSelectedAnalysisType(e.target.value as any)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '0.875rem',
            minWidth: '200px',
          }}
          disabled={isAnalyzing}
        >
          <option value="complexity">{t('analysis.complexityAnalysis')}</option>
          <option value="boundary">{t('analysis.boundaryAnalysis')}</option>
          <option value="risk">{t('analysis.riskAnalysis')}</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !task}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isAnalyzing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {isAnalyzing ? t('analysis.analyzing', 'Analyzing...') : t('analysis.startAnalysis', 'Start Analysis')}
        </button>

        {analysisResult && (
          <button
            onClick={handleClearResult}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {t('analysis.clearResult', 'Clear Result')}
          </button>
        )}

        <button
          onClick={clearCache}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {t('analysis.clearCache', 'Clear Cache')}
        </button>
      </div>

      {/* Cache Statistics */}
      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
        <strong>{t('analysis.cacheStats', 'Cache Statistics')}:</strong>
        {(() => {
          const stats = getCacheStats();
          return ` ${t('analysis.cacheSize', 'Size')}: ${stats.size}, ${t('analysis.hitRate', 'Hit Rate')}: ${(stats.hitRate * 100).toFixed(1)}%`;
        })()}
      </div>

      {/* Loading Indicator */}
      {isAnalyzing && (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
          borderRadius: '4px',
          marginBottom: '1rem',
        }}>
          <div style={{ marginBottom: '0.5rem' }}>🤖 {t('analysis.processingAnalysis', 'Processing analysis...')}</div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {t('analysis.analysisTypeProcessing', 'Running {{type}} analysis', { type: selectedAnalysisType })}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginBottom: '1rem',
        }}>
          <strong>{t('analysis.error', 'Error')}:</strong> {error}
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <div>
          <h4 style={{ margin: '0 0 1rem 0' }}>{t('analysis.analysisResult', 'Analysis Result')}</h4>
          <AnalysisResultView 
            result={analysisResult}
            onClose={handleClearResult}
          />
        </div>
      )}

      {/* Integration Notes */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        fontSize: '0.875rem',
      }}>
        <strong>{t('analysis.integrationNotes', 'Integration Notes')}:</strong>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
          <li>{t('analysis.note1', 'This component demonstrates how to integrate task analysis into ChatAgent')}</li>
          <li>{t('analysis.note2', 'Analysis results are cached automatically for performance')}</li>
          <li>{t('analysis.note3', 'Error handling provides user-friendly feedback')}</li>
          <li>{t('analysis.note4', 'Multiple analysis types are supported with consistent interface')}</li>
        </ul>
      </div>
    </div>
  );
};

export default AnalysisIntegrationExample;