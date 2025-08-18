/**
 * forceSearchProtocol prompt 生成器 v3.0
 * forceSearchProtocol prompt generator v3.0
 */

import { loadPromptFromTemplate, generatePrompt } from "../loader.js";

/**
 * forceSearchProtocol prompt 参数接口
 * forceSearchProtocol prompt parameter interface
 */
export interface ForceSearchProtocolPromptParams {
  conversationContext: string;
  problemDescription: string;
  currentApproach?: string;
  uncertaintyLevel: "low" | "medium" | "high";
  errorCount?: number;
}

/**
 * 生成 forceSearchProtocol prompt
 * Generate forceSearchProtocol prompt
 */
export async function getForceSearchProtocolPrompt(
  params: ForceSearchProtocolPromptParams
): Promise<string> {
  const { 
    conversationContext, 
    problemDescription, 
    currentApproach = "", 
    uncertaintyLevel,
    errorCount = 0 
  } = params;

  // 加载主模板
  // Load main template
  const mainTemplate = await loadPromptFromTemplate("forceSearchProtocol/index.md");

  // 生成最终 prompt
  // Generate final prompt
  const prompt = generatePrompt(mainTemplate, {
    conversationContext,
    problemDescription,
    currentApproach,
    uncertaintyLevel,
    errorCount,
  });

  return prompt;
}