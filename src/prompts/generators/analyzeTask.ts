/**
 * analyzeTask prompt 生成器
 * 負責將模板和參數組合成最終的 prompt
 */
/**
 * analyzeTask prompt generator
 * Responsible for combining templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
  enhancePromptWithContext,
} from "../loader.js";

/**
 * analyzeTask prompt 參數介面
 */
/**
 * analyzeTask prompt parameter interface
 */
export interface AnalyzeTaskPromptParams {
  summary: string;
  initialConcept: string;
  previousAnalysis?: string;
  analysisType?: 'deep-code' | 'architecture' | 'problem-diagnosis' | 'performance' | 'code-generation' | 'auto';
}

/**
 * 獲取 analyzeTask 的完整 prompt
 * @param params prompt 參數
 * @returns 生成的 prompt
 */
/**
 * Get complete prompt for analyzeTask
 * @param params prompt parameters
 * @returns generated prompt
 */
/**
 * 智能分析类型检测 - 增强版
 * Intelligent analysis type detection - Enhanced version
 */
function detectAnalysisType(summary: string, initialConcept: string): string {
  const text = `${summary} ${initialConcept}`.toLowerCase();

  // 权重计算系统 - Weight calculation system
  const typeScores: Record<string, number> = {
    'performance-analysis': 0,
    'deep-code-analysis': 0,
    'architecture-understanding': 0,
    'problem-diagnosis': 0,
    'code-generation': 0,
    'index': 1 // 默认基础分数
  };

  // 性能和优化关键词 (高权重)
  const performanceKeywords = ['performance', 'optimization', 'bottleneck', 'scaling', 'load', 'capacity', 'resource consumption', 'memory', 'cpu'];
  performanceKeywords.forEach(keyword => {
    if (text.includes(keyword)) typeScores['performance-analysis'] += 2;
  });

  // 安全和代码质量关键词 (高权重)
  const securityKeywords = ['security', 'vulnerability', 'auth', 'encryption', 'injection', 'code review', 'quality', 'bugs', 'audit'];
  securityKeywords.forEach(keyword => {
    if (text.includes(keyword)) typeScores['deep-code-analysis'] += 2;
  });

  // 架构和设计关键词 (中权重)
  const architectureKeywords = ['architecture', 'design', 'integration', 'system', 'structure', 'component', 'pattern', 'framework'];
  architectureKeywords.forEach(keyword => {
    if (text.includes(keyword)) typeScores['architecture-understanding'] += 1.5;
  });

  // 问题诊断关键词 (中权重)
  const problemKeywords = ['problem', 'issue', 'bug', 'error', 'failure', 'incident', 'troubleshoot', 'diagnos', 'debug', 'fix'];
  problemKeywords.forEach(keyword => {
    if (text.includes(keyword)) typeScores['problem-diagnosis'] += 1.5;
  });

  // 实现和开发关键词 (低权重)
  const implementationKeywords = ['implement', 'create', 'develop', 'build', 'generate', 'feature', 'coding', 'add', 'new'];
  implementationKeywords.forEach(keyword => {
    if (text.includes(keyword)) typeScores['code-generation'] += 1;
  });

  // 返回得分最高的类型
  const maxScore = Math.max(...Object.values(typeScores));
  const bestType = Object.keys(typeScores).find(type => typeScores[type] === maxScore);

  return bestType || 'index';
}

export async function getAnalyzeTaskPrompt(
  params: AnalyzeTaskPromptParams
): Promise<string> {
  // Determine analysis type
  const analysisType = params.analysisType === 'auto' || !params.analysisType
    ? detectAnalysisType(params.summary, params.initialConcept)
    : params.analysisType === 'deep-code' ? 'deep-code-analysis'
    : params.analysisType === 'architecture' ? 'architecture-understanding'
    : params.analysisType === 'problem-diagnosis' ? 'problem-diagnosis'
    : params.analysisType === 'performance' ? 'performance-analysis'
    : params.analysisType === 'code-generation' ? 'code-generation'
    : 'index';

  // Load appropriate template
  const templatePath = analysisType === 'index'
    ? "analyzeTask/index.md"
    : `analyzeTask/enhanced/${analysisType}.md`;

  const indexTemplate = await loadPromptFromTemplate(templatePath);

  const iterationTemplate = await loadPromptFromTemplate(
    "analyzeTask/iteration.md"
  );

  let iterationPrompt = "";
  if (params.previousAnalysis) {
    iterationPrompt = generatePrompt(iterationTemplate, {
      previousAnalysis: params.previousAnalysis,
    });
  }

  let prompt = generatePrompt(indexTemplate, {
    summary: params.summary,
    initialConcept: params.initialConcept,
    iterationPrompt: iterationPrompt,
    // 启用上下文感知分析
    // Enable context-aware analysis
    enableContextAnalysis: true,
    description: params.summary,
    requirements: params.initialConcept
  });

  // 强制集成代码库分析 - 根据E:\MCP\rules.md要求
  // Force codebase analysis integration - per E:\MCP\rules.md requirements
  try {
    prompt = await enhancePromptWithContext(prompt, {
      description: params.summary,
      requirements: params.initialConcept,
      forceCodebaseAnalysis: true,
      minimumHits: 5,
      analysisType: analysisType
    });
  } catch (error) {
    console.warn("Codebase analysis failed in analyzeTask, proceeding with basic prompt:", error);
  }

  // 載入可能的自定義 prompt
  // Load possible custom prompt
  return loadPrompt(prompt, "ANALYZE_TASK");
}
