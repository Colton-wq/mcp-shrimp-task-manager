import { IntelligentTaskAnalyzer } from './dist/prompts/generators/executeTask.js';
import { DynamicGuidanceGenerator } from './dist/utils/DynamicGuidanceGenerator.js';

console.log('=== 原子化拆解测试 ===\n');

// 测试案例：用户认证系统
const authTask = {
  id: 'test-auth',
  name: '用户认证系统',
  description: '实现完整的JWT用户认证系统，包括注册、登录、密码重置、用户权限管理',
  dependencies: []
};

console.log('任务描述:', authTask.description);
console.log('字符数:', authTask.description.length);

const analysis = IntelligentTaskAnalyzer.analyzeForTaskSplitting(authTask);

console.log('\n--- 拆分建议 ---');
console.log('应该拆分:', analysis.splitRecommendation.shouldSplit ? '是' : '否');
console.log('建议子任务数:', analysis.splitRecommendation.suggestedSubtasks);
console.log('拆分原因:', analysis.splitRecommendation.reason);

console.log('\n--- 动态步骤生成 ---');
// 添加调试信息
const debugInfo = DynamicGuidanceGenerator.debugTechStackDetection(analysis);
console.log('检测到的技术栈:', debugInfo.detectedTech);
console.log('JWT模式匹配:', debugInfo.patternMatches.jwt);

const steps = DynamicGuidanceGenerator.generateContextualStepSequence(
  analysis,
  analysis.operationType
);

steps.forEach((step, index) => {
  console.log(`${index + 1}. ${step}`);
});

console.log('\n--- 技术栈感知指导 ---');
const guidance = DynamicGuidanceGenerator.generateTechStackAwareGuidance(
  analysis,
  analysis.operationType
);

guidance.forEach(item => {
  console.log('• ' + item);
});