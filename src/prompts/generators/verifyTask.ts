/**
 * verifyTask prompt 生成器
 * verifyTask prompt generator
 * 負責將模板和參數組合成最終的 prompt
 * Responsible for combining templates and parameters into the final prompt
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task } from "../../types/index.js";

/**
 * 项目验证模式
 * Project verification patterns
 */
export interface ProjectPatterns {
  commonIssues: string[];
  successPatterns: string[];
  averageScore: number;
  recommendations: string[];
}

/**
 * verifyTask prompt 參數介面 - 增强版
 * verifyTask prompt parameters interface - Enhanced version
 */
export interface VerifyTaskPromptParams {
  task: Task;
  score: number;
  summary: string;
  projectPatterns?: ProjectPatterns;
  improvementSuggestions?: [string, string[]][];
  deviationAnalysis?: DeviationAnalysis;
}

/**
 * 偏离检测分析
 * Deviation detection analysis
 */
export interface DeviationAnalysis {
  hasDeviation: boolean;
  deviationLevel: 'none' | 'minor' | 'moderate' | 'major';
  deviationAreas: string[];
  originalGoalAlignment: number; // 0-100
  scopeAdherence: number; // 0-100
  businessValueDelivery: number; // 0-100
  recommendations: string[];
}

/**
 * 提取摘要內容
 * Extract summary content
 * @param content 原始內容
 * @param content Original content
 * @param maxLength 最大長度
 * @param maxLength Maximum length
 * @returns 提取的摘要
 * @returns Extracted summary
 */
function extractSummary(
  content: string | undefined,
  maxLength: number
): string {
  if (!content) return "";

  if (content.length <= maxLength) {
    return content;
  }

  // 簡單的摘要提取：截取前 maxLength 個字符並添加省略號
  // Simple summary extraction: truncate to first maxLength characters and add ellipsis
  return content.substring(0, maxLength) + "...";
}

/**
 * 分析任务实现偏离情况
 * Analyze task implementation deviation
 */
export function analyzeTaskDeviation(task: Task, summary: string): DeviationAnalysis {
  const originalDescription = task.description.toLowerCase();
  const summaryLower = summary.toLowerCase();
  
  // 简单的偏离检测逻辑
  const deviationAreas: string[] = [];
  let originalGoalAlignment = 100;
  let scopeAdherence = 100;
  let businessValueDelivery = 100;
  
  // 检查是否添加了原始需求之外的功能
  const extraFeatureKeywords = ['additional', 'extra', 'bonus', 'also implemented', 'furthermore'];
  if (extraFeatureKeywords.some(keyword => summaryLower.includes(keyword))) {
    deviationAreas.push('Scope expansion beyond original requirements');
    scopeAdherence -= 20;
  }
  
  // 检查是否遗漏了关键功能
  const originalKeywords = originalDescription.split(' ').filter(word => word.length > 4);
  const missingKeywords = originalKeywords.filter(keyword => 
    !summaryLower.includes(keyword.toLowerCase())
  );
  if (missingKeywords.length > originalKeywords.length * 0.3) {
    deviationAreas.push('Missing key functionality from original requirements');
    originalGoalAlignment -= 30;
  }
  
  // 检查是否过度复杂化
  if (summaryLower.includes('complex') || summaryLower.includes('advanced') || 
      summaryLower.includes('sophisticated')) {
    deviationAreas.push('Potential over-engineering detected');
    businessValueDelivery -= 15;
  }
  
  const hasDeviation = deviationAreas.length > 0;
  let deviationLevel: 'none' | 'minor' | 'moderate' | 'major' = 'none';
  
  if (hasDeviation) {
    const avgScore = (originalGoalAlignment + scopeAdherence + businessValueDelivery) / 3;
    if (avgScore >= 80) deviationLevel = 'minor';
    else if (avgScore >= 60) deviationLevel = 'moderate';
    else deviationLevel = 'major';
  }
  
  const recommendations: string[] = [];
  if (deviationAreas.length > 0) {
    recommendations.push('Review implementation against original requirements');
    recommendations.push('Consider simplifying if over-engineered');
    recommendations.push('Ensure all core functionality is implemented');
  }
  
  return {
    hasDeviation,
    deviationLevel,
    deviationAreas,
    originalGoalAlignment,
    scopeAdherence,
    businessValueDelivery,
    recommendations
  };
}

/**
 * 獲取 verifyTask 的完整 prompt
 * Get the complete prompt for verifyTask
 * @param params prompt 參數
 * @param params prompt parameters
 * @returns 生成的 prompt
 * @returns Generated prompt
 */
export async function getVerifyTaskPrompt(
  params: VerifyTaskPromptParams
): Promise<string> {
  const { task, score, summary, projectPatterns, improvementSuggestions, deviationAnalysis } = params;

  // 生成学习反馈内容
  // Generate learning feedback content
  let learningFeedbackContent = "";
  if (projectPatterns && (projectPatterns.commonIssues.length > 0 || projectPatterns.successPatterns.length > 0)) {
    learningFeedbackContent = generateLearningFeedbackContent(projectPatterns, improvementSuggestions, deviationAnalysis);
  }

  if (score < 80) {
    const noPassTemplate = await loadPromptFromTemplate("verifyTask/noPass.md");
    const prompt = generatePrompt(noPassTemplate, {
      name: task.name,
      id: task.id,
      summary,
      learningFeedback: learningFeedbackContent,
    });
    return prompt;
  }
  const indexTemplate = await loadPromptFromTemplate("verifyTask/index.md");
  const prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    description: task.description,
    notes: task.notes || "no notes",
    verificationCriteria:
      task.verificationCriteria || "no verification criteria",
    implementationGuideSummary:
      extractSummary(task.implementationGuide, 200) ||
      "no implementation guide",
    analysisResult:
      extractSummary(task.analysisResult, 300) || "no analysis result",
    learningFeedback: learningFeedbackContent,
  });

  // 載入可能的自定義 prompt
  // Load possible custom prompt
  return loadPrompt(prompt, "VERIFY_TASK");
}

/**
 * 生成学习反馈内容
 * Generate learning feedback content
 */
function generateLearningFeedbackContent(
  patterns: ProjectPatterns,
  suggestions?: [string, string[]][],
  deviationAnalysis?: DeviationAnalysis
): string {
  let content = "\n## 📊 Project Learning Insights\n\n";

  // 项目验证模式分析
  content += `**Project Verification Patterns** (Average Score: ${patterns.averageScore}/100):\n\n`;

  if (patterns.commonIssues.length > 0) {
    content += `**Common Issues to Watch**:\n`;
    patterns.commonIssues.forEach((issue, index) => {
      content += `${index + 1}. ${issue}\n`;
    });
    content += `\n`;
  }

  if (patterns.successPatterns.length > 0) {
    content += `**Successful Patterns**:\n`;
    patterns.successPatterns.forEach((pattern, index) => {
      content += `${index + 1}. ${pattern}\n`;
    });
    content += `\n`;
  }

  if (patterns.recommendations.length > 0) {
    content += `**Recommendations for Future Tasks**:\n`;
    patterns.recommendations.forEach((rec, index) => {
      content += `${index + 1}. ${rec}\n`;
    });
    content += `\n`;
  }

  // 后续任务改进建议
  if (suggestions && suggestions.length > 0) {
    content += `**Upcoming Task Improvement Suggestions**:\n`;
    suggestions.forEach(([taskId, taskSuggestions]) => {
      content += `- **Task ${taskId.substring(0, 8)}...**: ${taskSuggestions.join(', ')}\n`;
    });
    content += `\n`;
  }

  // 偏离检测分析
  if (deviationAnalysis && deviationAnalysis.hasDeviation) {
    content += `## 🚨 Deviation Detection Analysis\n\n`;
    content += `**Deviation Level**: ${deviationAnalysis.deviationLevel.toUpperCase()}\n\n`;
    
    content += `**Alignment Scores**:\n`;
    content += `- Original Goal Alignment: ${deviationAnalysis.originalGoalAlignment}/100\n`;
    content += `- Scope Adherence: ${deviationAnalysis.scopeAdherence}/100\n`;
    content += `- Business Value Delivery: ${deviationAnalysis.businessValueDelivery}/100\n\n`;
    
    if (deviationAnalysis.deviationAreas.length > 0) {
      content += `**Deviation Areas**:\n`;
      deviationAnalysis.deviationAreas.forEach((area, index) => {
        content += `${index + 1}. ${area}\n`;
      });
      content += `\n`;
    }
    
    if (deviationAnalysis.recommendations.length > 0) {
      content += `**Deviation Correction Recommendations**:\n`;
      deviationAnalysis.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
      content += `\n`;
    }
  }

  return content;
}
