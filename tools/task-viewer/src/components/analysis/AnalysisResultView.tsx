import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ComplexityAnalysis,
  BoundaryAnalysis,
  RiskAnalysis,
  AnalysisResult,
} from '../../types/analysis';
import styles from './AnalysisResultView.module.css';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  onClose?: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onClose,
}) => {
  const { t } = useTranslation();

  const renderComplexityAnalysis = (analysis: ComplexityAnalysis) => (
    <div className={styles.complexityAnalysis}>
      <div className={styles.scoreSection}>
        <div className={styles.scoreCircle}>
          <span className={styles.scoreValue}>{analysis.score}</span>
          <span className={styles.scoreLabel}>/10</span>
        </div>
        <div className={styles.scoreDetails}>
          <p className={styles.estimatedHours}>
            {t('analysis.estimatedHours', { hours: analysis.estimatedHours })}
          </p>
          <p className={styles.confidence}>
            {t('analysis.confidence', { 
              confidence: Math.round(analysis.confidence * 100) 
            })}
          </p>
        </div>
      </div>

      <div className={styles.factorsSection}>
        <h4>{t('analysis.complexityFactors')}</h4>
        <div className={styles.factorsList}>
          {analysis.factors.map((factor, index) => (
            <div key={index} className={styles.factor}>
              <div className={styles.factorHeader}>
                <span className={styles.factorName}>{factor.name}</span>
                <span className={styles.factorScore}>{factor.score}/10</span>
              </div>
              <div className={styles.factorBar}>
                <div 
                  className={styles.factorProgress}
                  style={{ width: `${(factor.score / 10) * 100}%` }}
                />
              </div>
              <p className={styles.factorDescription}>{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.reasoningSection}>
        <h4>{t('analysis.reasoning')}</h4>
        <p className={styles.reasoning}>{analysis.reasoning}</p>
      </div>

      <div className={styles.recommendationsSection}>
        <h4>{t('analysis.recommendations')}</h4>
        <ul className={styles.recommendationsList}>
          {analysis.recommendations.map((recommendation, index) => (
            <li key={index} className={styles.recommendation}>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderBoundaryAnalysis = (analysis: BoundaryAnalysis) => (
    <div className={styles.boundaryAnalysis}>
      <div className={styles.boundariesGrid}>
        <div className={styles.boundarySection}>
          <h4>{t('analysis.functionalBoundaries')}</h4>
          <ul className={styles.boundaryList}>
            {analysis.functionalBoundaries.map((boundary, index) => (
              <li key={index}>{boundary}</li>
            ))}
          </ul>
        </div>

        <div className={styles.boundarySection}>
          <h4>{t('analysis.interfaceBoundaries')}</h4>
          <ul className={styles.boundaryList}>
            {analysis.interfaceBoundaries.map((boundary, index) => (
              <li key={index}>{boundary}</li>
            ))}
          </ul>
        </div>

        <div className={styles.boundarySection}>
          <h4>{t('analysis.dataBoundaries')}</h4>
          <ul className={styles.boundaryList}>
            {analysis.dataBoundaries.map((boundary, index) => (
              <li key={index}>{boundary}</li>
            ))}
          </ul>
        </div>

        <div className={styles.boundarySection}>
          <h4>{t('analysis.responsibilityBoundaries')}</h4>
          <ul className={styles.boundaryList}>
            {analysis.responsibilityBoundaries.map((boundary, index) => (
              <li key={index}>{boundary}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.deliverableSection}>
        <h4>{t('analysis.minimalDeliverable')}</h4>
        <p className={styles.deliverable}>{analysis.minimalDeliverable}</p>
      </div>

      <div className={styles.splitSuggestionsSection}>
        <h4>{t('analysis.splitSuggestions')}</h4>
        <div className={styles.suggestionsList}>
          {analysis.splitSuggestions.map((suggestion, index) => (
            <div key={index} className={styles.suggestion}>
              <div className={styles.suggestionHeader}>
                <span className={styles.suggestionName}>{suggestion.name}</span>
                <span className={`${styles.priority} ${styles[suggestion.priority]}`}>
                  {t(`analysis.priority.${suggestion.priority}`)}
                </span>
              </div>
              <p className={styles.suggestionDescription}>
                {suggestion.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRiskAnalysis = (analysis: RiskAnalysis) => (
    <div className={styles.riskAnalysis}>
      <div className={styles.riskOverview}>
        <div className={styles.riskScore}>
          <span className={styles.scoreValue}>{analysis.overallRiskScore}</span>
          <span className={styles.scoreLabel}>/10</span>
          <p className={styles.riskLevel}>
            {t(`analysis.riskLevel.${getRiskLevel(analysis.overallRiskScore)}`)}
          </p>
        </div>
      </div>

      <div className={styles.riskFactorsSection}>
        <h4>{t('analysis.riskFactors')}</h4>
        <div className={styles.riskFactorsList}>
          {analysis.riskFactors.map((factor, index) => (
            <div key={index} className={styles.riskFactor}>
              <div className={styles.riskFactorHeader}>
                <span className={styles.riskType}>
                  {t(`analysis.riskType.${factor.type}`)}
                </span>
                <span className={styles.riskImpact}>
                  {t('analysis.impact')}: {factor.impact}/10
                </span>
                <span className={styles.riskProbability}>
                  {t('analysis.probability')}: {Math.round(factor.probability * 100)}%
                </span>
              </div>
              <p className={styles.riskDescription}>{factor.description}</p>
              <div className={styles.mitigation}>
                <strong>{t('analysis.mitigation')}:</strong> {factor.mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.criticalRisksSection}>
        <h4>{t('analysis.criticalRisks')}</h4>
        <ul className={styles.criticalRisksList}>
          {analysis.criticalRisks.map((risk, index) => (
            <li key={index} className={styles.criticalRisk}>{risk}</li>
          ))}
        </ul>
      </div>

      <div className={styles.mitigationPlanSection}>
        <h4>{t('analysis.mitigationPlan')}</h4>
        <ol className={styles.mitigationPlanList}>
          {analysis.mitigationPlan.map((step, index) => (
            <li key={index} className={styles.mitigationStep}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  );

  const getRiskLevel = (score: number): string => {
    if (score <= 3) return 'low';
    if (score <= 6) return 'medium';
    if (score <= 8) return 'high';
    return 'critical';
  };

  const getAnalysisTypeTitle = (type: string): string => {
    switch (type) {
      case 'complexity':
        return t('analysis.complexityAnalysis');
      case 'boundary':
        return t('analysis.boundaryAnalysis');
      case 'risk':
        return t('analysis.riskAnalysis');
      default:
        return t('analysis.analysis');
    }
  };

  const renderAnalysisContent = () => {
    switch (result.type) {
      case 'complexity':
        return renderComplexityAnalysis(result.result as ComplexityAnalysis);
      case 'boundary':
        return renderBoundaryAnalysis(result.result as BoundaryAnalysis);
      case 'risk':
        return renderRiskAnalysis(result.result as RiskAnalysis);
      default:
        return <div>{t('analysis.unsupportedType')}</div>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          {getAnalysisTypeTitle(result.type)}
        </h3>
        <div className={styles.metadata}>
          <span className={styles.timestamp}>
            {new Date(result.metadata.timestamp).toLocaleString()}
          </span>
          <span className={styles.processingTime}>
            {t('analysis.processingTime', { 
              time: result.metadata.processingTime 
            })}
          </span>
          {result.metadata.cacheHit && (
            <span className={styles.cacheHit}>
              {t('analysis.cached')}
            </span>
          )}
        </div>
        {onClose && (
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ×
          </button>
        )}
      </div>

      <div className={styles.content}>
        {renderAnalysisContent()}
      </div>
    </div>
  );
};

export default AnalysisResultView;