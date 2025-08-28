import { IntelligentTaskAnalyzer } from './dist/prompts/generators/executeTask.js';
import { DynamicGuidanceGenerator } from './dist/utils/DynamicGuidanceGenerator.js';

console.log('=== JWT技术栈特定原子步骤测试 ===\n');

// 强化JWT关键词的测试案例
const jwtTask = {
  id: 'test-jwt',
  name: 'JWT认证',
  description: '使用JWT技术实现Node.js用户认证，包含token生成、验证、刷新机制',
  dependencies: []
};

console.log('任务描述:', jwtTask.description);

const analysis = IntelligentTaskAnalyzer.analyzeForTaskSplitting(jwtTask);
console.log('检测到的操作类型:', analysis.operationType);
console.log('检测到的技术栈:', analysis.technicalRequirements?.techStack || []);
console.log('语义分析结果:', JSON.stringify(analysis, null, 2));

console.log('\n--- JWT特定原子级步骤 ---');
// 添加调试：使用新的调试方法
const debugInfo = DynamicGuidanceGenerator.debugTechStackDetection(analysis);
console.log('调试信息:', debugInfo);

const steps = DynamicGuidanceGenerator.generateContextualStepSequence(
  analysis,
  analysis.operationType
);

steps.forEach((step, index) => {
  console.log(`${index + 1}. ${step}`);
});

console.log('\n--- 对比：普通CREATE任务 ---');
const simpleTask = {
  id: 'test-simple',
  name: '简单功能',
  description: '创建一个简单的用户列表页面',
  dependencies: []
};

const simpleAnalysis = IntelligentTaskAnalyzer.analyzeForTaskSplitting(simpleTask);
const simpleSteps = DynamicGuidanceGenerator.generateContextualStepSequence(
  simpleAnalysis,
  simpleAnalysis.operationType
);

simpleSteps.forEach((step, index) => {
  console.log(`${index + 1}. ${step}`);
});