/**
 * 调试优先级分配问题
 */

import { forceSearchProtocol } from './dist/tools/search/forceSearchProtocol.js';

const result = await forceSearchProtocol({
  conversationContext: "Technical problem with some uncertainty",
  problemDescription: "TypeScript configuration optimization",
  currentApproach: "Standard approach",
  uncertaintyLevel: "medium",
  errorCount: 1
});

const response = JSON.parse(result.content[0].text);

console.log('调试信息：');
console.log('- 问题描述：', "TypeScript configuration optimization");
console.log('- 不确定性级别：', "medium");
console.log('- 错误次数：', 1);
console.log('- 检测到的模式：', response.analysisResult.detectedPatterns);
console.log('- 风险级别：', response.analysisResult.riskLevel);
console.log('- 搜索优先级：', response.searchStrategy.searchPriority);

// 检查是否包含技术复杂性关键词
const problemDesc = "TypeScript configuration optimization";
const isTechnicalComplex = /error|fail|bug|issue|problem|troubleshoot|debug|configuration|optimization|performance|integration|deployment|setup/i.test(problemDesc);
const isProjectRelated = /mcp|shrimp|task|manager|github|repository/i.test(problemDesc);

console.log('- 技术复杂性检测：', isTechnicalComplex);
console.log('- 项目相关性检测：', isProjectRelated);
console.log('- 匹配的关键词：', problemDesc.match(/error|fail|bug|issue|problem|troubleshoot|debug|configuration|optimization|performance|integration|deployment|setup/i));