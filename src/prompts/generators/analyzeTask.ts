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
 * 智能分析类型检测
 * Intelligent analysis type detection
 */
function detectAnalysisType(summary: string, initialConcept: string): string {
  const text = `${summary} ${initialConcept}`.toLowerCase();

  // Performance and optimization keywords (check first to avoid conflicts)
  if (/performance|load|capacity|optimization|bottleneck|resource consumption|scaling/.test(text)) {
    return 'performance-analysis';
  }

  // Security and code quality keywords
  if (/security|vulnerability|auth|encryption|injection|code review|quality|bugs/.test(text)) {
    return 'deep-code-analysis';
  }

  // Architecture and design keywords
  if (/architecture|design|integration|scalability|system|structure|component/.test(text)) {
    return 'architecture-understanding';
  }

  // Problem and troubleshooting keywords (more specific patterns)
  if (/problem|issue|bug|error|failure|incident|troubleshoot|diagnos|debug/.test(text)) {
    return 'problem-diagnosis';
  }

  // Implementation and development keywords
  if (/implement|create|develop|build|generate|feature|coding/.test(text)) {
    return 'code-generation';
  }

  // Default to general analysis
  return 'index';
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
  });

  // 載入可能的自定義 prompt
  // Load possible custom prompt
  return loadPrompt(prompt, "ANALYZE_TASK");
}
