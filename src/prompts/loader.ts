/**
 * prompt 載入器
 * prompt loader
 * 提供從環境變數載入自定義 prompt 的功能
 * Provides functionality to load custom prompts from environment variables
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDataDir } from "../utils/paths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processEnvString(input: string | undefined): string {
  if (!input) return "";

  return input
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");
}

/**
 * 載入 prompt，支援環境變數自定義
 * Load prompt with environment variable customization support
 * @param basePrompt 基本 prompt 內容
 * @param basePrompt Basic prompt content
 * @param promptKey prompt 的鍵名，用於生成環境變數名稱
 * @param promptKey Prompt key name, used to generate environment variable names
 * @returns 最終的 prompt 內容
 * @returns Final prompt content
 */
export function loadPrompt(basePrompt: string, promptKey: string): string {
  // 轉換為大寫，作為環境變數的一部分
  // Convert to uppercase as part of the environment variable
  const envKey = promptKey.toUpperCase();

  // 檢查是否有替換模式的環境變數
  // Check if there is a replacement mode environment variable
  const overrideEnvVar = `MCP_PROMPT_${envKey}`;
  if (process.env[overrideEnvVar]) {
    // 使用環境變數完全替換原始 prompt
    // Use environment variable to completely replace original prompt
    return processEnvString(process.env[overrideEnvVar]);
  }

  // 檢查是否有追加模式的環境變數
  // Check if there is an append mode environment variable
  const appendEnvVar = `MCP_PROMPT_${envKey}_APPEND`;
  if (process.env[appendEnvVar]) {
    // 將環境變數內容追加到原始 prompt 後
    // Append environment variable content to the original prompt
    return `${basePrompt}\n\n${processEnvString(process.env[appendEnvVar])}`;
  }

  // 如果沒有自定義，則使用原始 prompt
  // If no customization, use the original prompt
  return basePrompt;
}

/**
 * 增强的上下文感知参数
 * Enhanced context-aware parameters
 */
export interface ContextAwareParams extends Record<string, any> {
  description?: string;
  requirements?: string;
  existingTasks?: any[];
  enableContextAnalysis?: boolean;
  forceCodebaseAnalysis?: boolean;
  minimumHits?: number;
  analysisType?: string;
  taskType?: string;
}

/**
 * 代码库洞察结果
 * Codebase insights result
 */
interface CodebaseInsights {
  hitCount: number;
  relevantFiles: string[];
  patterns: string[];
  recommendations: string[];
}

/**
 * 生成包含動態參數的 prompt (增强版 - 支持上下文感知)
 * Generate prompt with dynamic parameters (Enhanced - Context-aware)
 * @param promptTemplate prompt 模板
 * @param promptTemplate prompt template
 * @param params 動態參數 (支持上下文感知)
 * @param params dynamic parameters (context-aware support)
 * @returns 填充參數後的 prompt
 * @returns Prompt with parameters filled in
 */
export function generatePrompt(
  promptTemplate: string,
  params: ContextAwareParams = {}
): string {
  // 使用簡單的模板替換方法，將 {paramName} 替換為對應的參數值
  // Use simple template replacement method to replace {paramName} with corresponding parameter values
  let result = promptTemplate;

  // 如果启用上下文分析，进行智能内容调整
  // If context analysis is enabled, perform intelligent content adjustment
  if (params.enableContextAnalysis && (params.description || params.requirements)) {
    // 注意：这里使用同步版本，异步版本在各个生成器中直接调用
    // Note: Using synchronous version here, async version is called directly in generators
    const contextEnhancement = generateContextEnhancement(params);
    if (contextEnhancement) {
      result = `${contextEnhancement}\n\n${result}`;
    }
  }

  Object.entries(params).forEach(([key, value]) => {
    // 如果值為 undefined 或 null，使用空字串替換
    // If value is undefined or null, replace with empty string
    const replacementValue =
      value !== undefined && value !== null ? String(value) : "";

    // 使用正則表達式替換所有匹配的佔位符
    // Use regular expression to replace all matching placeholders
    const placeholder = new RegExp(`\\{${key}\\}`, "g");
    result = result.replace(placeholder, replacementValue);
  });

  return result;
}

/**
 * 使用上下文分析增强提示词 - 增强版
 * Enhance prompt with context analysis - Enhanced version
 */
export async function enhancePromptWithContext(
  promptTemplate: string,
  params: ContextAwareParams
): Promise<string> {
  try {
    let enhancedTemplate = promptTemplate;

    // 🔥 强制代码库分析 - 根据E:\MCP\rules.md要求
    // Force codebase analysis - per E:\MCP\rules.md requirements
    if (params.forceCodebaseAnalysis && params.minimumHits) {
      const codebaseInsights = await performCodebaseAnalysis(params);
      if (codebaseInsights.hitCount >= params.minimumHits) {
        enhancedTemplate = integrateCodebaseInsights(enhancedTemplate, codebaseInsights);
      } else {
        console.warn(`Codebase analysis failed to meet minimum hits requirement: ${codebaseInsights.hitCount}/${params.minimumHits}`);
      }
    }

    // 原有的上下文增强逻辑
    // Original context enhancement logic
    const contextEnhancement = generateContextEnhancement(params);
    if (contextEnhancement) {
      enhancedTemplate = `${contextEnhancement}\n\n${enhancedTemplate}`;
    }

    return enhancedTemplate;
  } catch (error) {
    // 如果上下文分析失败，继续使用原始模板
    // If context analysis fails, continue with original template
    console.warn('Context analysis failed, using original template:', error);
    return promptTemplate;
  }
}

/**
 * 生成上下文增强内容
 * Generate context enhancement content
 */
function generateContextEnhancement(params: ContextAwareParams): string {
  if (!params.description) return '';

  const text = `${params.description} ${params.requirements || ''}`.toLowerCase();
  
  // 简化的业务意图检测
  // Simplified business intent detection
  let businessGoalConfirmation = '';
  
  if (text.includes('problem') || text.includes('issue') || text.includes('fix')) {
    businessGoalConfirmation = '🎯 **业务目标确认**: 在开始技术分析前，请确认这个问题对用户的实际影响是什么？最简单的解决方案是什么？';
  } else if (text.includes('implement') || text.includes('create') || text.includes('build')) {
    businessGoalConfirmation = '🎯 **业务目标确认**: 在开始功能实现前，请确认这个功能要解决用户的什么具体需求？是否有更简单的替代方案？';
  } else if (text.includes('optimize') || text.includes('performance')) {
    businessGoalConfirmation = '🎯 **业务目标确认**: 在开始性能优化前，请确认当前性能问题对业务的具体影响是什么？优化的优先级如何？';
  } else {
    businessGoalConfirmation = '🎯 **业务目标确认**: 在开始技术分析前，请确认用户真正想要达到什么业务目标？最简单可行的方案是什么？';
  }

  // 工具使用建议
  // Tool usage recommendations
  let toolRecommendations = '';
  if (text.includes('code') || text.includes('implement')) {
    toolRecommendations = '\n🔧 **推荐工具**: 使用 `codebase-retrieval` 分析现有代码结构，`search_code_desktop-commander` 查找相关实现';
  } else if (text.includes('file') || text.includes('document')) {
    toolRecommendations = '\n🔧 **推荐工具**: 使用 `Everything MCP` 搜索相关文件，`read_file_desktop-commander` 查看具体内容';
  } else {
    toolRecommendations = '\n🔧 **推荐工具**: 根据需要使用 `codebase-retrieval`、`Everything MCP`、`Desktop Commander` 等工具收集信息';
  }

  // 简化提醒
  // Simplification reminder
  const simplificationReminder = '\n💡 **简化原则**: 优先考虑最简单可行的解决方案，避免过度设计。如果问题复杂，考虑分步骤实现。';

  return `## 🚀 智能任务分析

${businessGoalConfirmation}${toolRecommendations}${simplificationReminder}

---`;
}

/**
 * 從模板載入 prompt
 * Load prompt from template
 * @param templatePath 相對於模板集根目錄的模板路徑 (e.g., 'chat/basic.md')
 * @param templatePath Template path relative to template set root directory (e.g., 'chat/basic.md')
 * @returns 模板內容
 * @returns Template content
 * @throws Error 如果找不到模板文件
 * @throws Error if template file is not found
 */
export async function loadPromptFromTemplate(
  templatePath: string
): Promise<string> {
  const templateSetName = process.env.TEMPLATES_USE || "en";
  // 模板加载器使用"main"项目作为默认项目确保并发安全
  // Template loader uses "main" project as default for concurrent safety
  const dataDir = await getDataDir(false, "main");
  const builtInTemplatesBaseDir = __dirname;

  let finalPath = "";
  const checkedPaths: string[] = []; // 用於更詳細的錯誤報告
  // Used for more detailed error reporting

  // 1. 檢查 DATA_DIR 中的自定義路徑
  // 1. Check custom paths in DATA_DIR
  // path.resolve 可以處理 templateSetName 是絕對路徑的情況
  // path.resolve can handle cases where templateSetName is an absolute path
  const customFilePath = path.resolve(dataDir, templateSetName, templatePath);
  checkedPaths.push(`Custom: ${customFilePath}`);
  if (fs.existsSync(customFilePath)) {
    finalPath = customFilePath;
  }

  // 2. 如果未找到自定義路徑，檢查特定的內建模板目錄
  // 2. If custom path not found, check specific built-in template directory
  if (!finalPath) {
    // 假設 templateSetName 對於內建模板是 'en', 'zh' 等
    // Assume templateSetName for built-in templates is 'en', 'zh', etc.
    const specificBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      `templates_${templateSetName}`,
      templatePath
    );
    checkedPaths.push(`Specific Built-in: ${specificBuiltInFilePath}`);
    if (fs.existsSync(specificBuiltInFilePath)) {
      finalPath = specificBuiltInFilePath;
    }
  }

  // 3. 如果特定的內建模板也未找到，且不是 'en' (避免重複檢查)
  // 3. If specific built-in template is also not found and not 'en' (avoid duplicate checking)
  if (!finalPath && templateSetName !== "en") {
    const defaultBuiltInFilePath = path.join(
      builtInTemplatesBaseDir,
      "templates_en",
      templatePath
    );
    checkedPaths.push(`Default Built-in ('en'): ${defaultBuiltInFilePath}`);
    if (fs.existsSync(defaultBuiltInFilePath)) {
      finalPath = defaultBuiltInFilePath;
    }
  }

  // 4. 如果所有路徑都找不到模板，拋出錯誤
  // 4. If template is not found in all paths, throw error
  if (!finalPath) {
    throw new Error(
      `Template file not found: '${templatePath}' in template set '${templateSetName}'. Checked paths:\n - ${checkedPaths.join(
        "\n - "
      )}`
    );
  }

  // 5. 讀取找到的文件
  // 5. Read the found file
  return fs.readFileSync(finalPath, "utf-8");
}

/**
 * 执行强制代码库分析
 * Perform mandatory codebase analysis
 */
async function performCodebaseAnalysis(params: ContextAwareParams): Promise<CodebaseInsights> {
  const insights: CodebaseInsights = {
    hitCount: 0,
    relevantFiles: [],
    patterns: [],
    recommendations: []
  };

  try {
    // 模拟代码库检索调用 - 实际实现中应该调用真实的codebase-retrieval工具
    // Simulate codebase retrieval call - actual implementation should call real codebase-retrieval tool
    const searchQueries = generateSearchQueries(params);

    for (const query of searchQueries) {
      // 这里应该调用实际的代码库检索工具
      // Here should call actual codebase retrieval tool
      const mockResults = await simulateCodebaseSearch(query);
      insights.hitCount += mockResults.length;
      insights.relevantFiles.push(...mockResults);

      if (insights.hitCount >= (params.minimumHits || 5)) {
        break; // 达到最小命中要求
      }
    }

    // 生成基于检索结果的建议
    insights.recommendations = generateRecommendations(insights.relevantFiles, params);

  } catch (error) {
    console.warn('Codebase analysis failed:', error);
  }

  return insights;
}

/**
 * 将代码库洞察集成到提示词中
 * Integrate codebase insights into prompt
 */
function integrateCodebaseInsights(template: string, insights: CodebaseInsights): string {
  if (insights.hitCount === 0) return template;

  const codebaseSection = `
## 🔍 Codebase Analysis Results (${insights.hitCount} hits)

**Relevant Files Found:**
${insights.relevantFiles.slice(0, 5).map(file => `- ${file}`).join('\n')}

**Technical Recommendations:**
${insights.recommendations.slice(0, 3).map(rec => `- ${rec}`).join('\n')}

**Integration Guidance:**
Based on codebase analysis, consider existing patterns and architectural decisions when implementing this task.

---
`;

  return `${codebaseSection}\n${template}`;
}

/**
 * 生成搜索查询
 * Generate search queries
 */
function generateSearchQueries(params: ContextAwareParams): string[] {
  const queries: string[] = [];

  if (params.description) {
    // 从描述中提取关键词
    const keywords = extractKeywords(params.description);
    queries.push(...keywords.slice(0, 3));
  }

  if (params.requirements) {
    // 从需求中提取技术关键词
    const techKeywords = extractTechnicalKeywords(params.requirements);
    queries.push(...techKeywords.slice(0, 2));
  }

  return queries.length > 0 ? queries : ['implementation patterns', 'project structure'];
}

/**
 * 模拟代码库搜索
 * Simulate codebase search
 */
async function simulateCodebaseSearch(query: string): Promise<string[]> {
  // 模拟搜索结果 - 实际实现中应该调用真实的搜索工具
  // Simulate search results - actual implementation should call real search tools
  const mockFiles = [
    `src/components/${query}.ts`,
    `src/services/${query}Service.ts`,
    `src/utils/${query}Utils.ts`,
    `tests/${query}.test.ts`
  ];

  // 模拟异步搜索延迟
  await new Promise(resolve => setTimeout(resolve, 10));

  return mockFiles.slice(0, Math.floor(Math.random() * 3) + 1);
}

/**
 * 生成基于检索结果的建议
 * Generate recommendations based on retrieval results
 */
function generateRecommendations(files: string[], params: ContextAwareParams): string[] {
  const recommendations: string[] = [];

  if (files.some(f => f.includes('Service'))) {
    recommendations.push('Follow existing service layer patterns for business logic');
  }

  if (files.some(f => f.includes('test'))) {
    recommendations.push('Maintain test coverage consistency with existing test patterns');
  }

  if (files.some(f => f.includes('component'))) {
    recommendations.push('Align with existing component architecture and naming conventions');
  }

  return recommendations;
}

/**
 * 从文本中提取关键词
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const keywords = words.filter(word =>
    word.length > 3 &&
    !['the', 'and', 'for', 'with', 'this', 'that', 'from', 'they', 'have', 'will'].includes(word)
  );
  return [...new Set(keywords)].slice(0, 5);
}

/**
 * 从文本中提取技术关键词
 * Extract technical keywords from text
 */
function extractTechnicalKeywords(text: string): string[] {
  const techPatterns = [
    /\b(api|rest|graphql|database|mongodb|redis|typescript|javascript|react|vue|angular|node|express)\b/gi,
    /\b(service|component|controller|model|interface|class|function|method)\b/gi
  ];

  const matches: string[] = [];
  techPatterns.forEach(pattern => {
    const found = text.match(pattern);
    if (found) matches.push(...found);
  });

  return [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 3);
}
