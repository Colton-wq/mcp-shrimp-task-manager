import { IntelligentTaskAnalyzer } from './dist/prompts/generators/executeTask.js';
import { DynamicGuidanceGenerator } from './dist/utils/DynamicGuidanceGenerator.js';

console.log('=== 全面技术栈原子步骤测试 ===\n');

// 测试用例集合
const testCases = [
  {
    name: 'React + TypeScript',
    task: {
      id: 'test-react-ts',
      name: 'React组件开发',
      description: '使用React和TypeScript创建可复用的用户界面组件',
      dependencies: []
    }
  },
  {
    name: 'MongoDB数据库',
    task: {
      id: 'test-mongodb',
      name: 'MongoDB集成',
      description: '设计MongoDB数据模型和实现CRUD操作',
      dependencies: []
    }
  },
  {
    name: 'Node.js + JWT',
    task: {
      id: 'test-node-jwt',
      name: 'Node.js认证',
      description: '使用Node.js和JWT实现用户认证API',
      dependencies: []
    }
  },
  {
    name: '纯JWT（无明确后端）',
    task: {
      id: 'test-jwt-only',
      name: '认证令牌',
      description: '实现JWT令牌管理和验证机制',
      dependencies: []
    }
  },
  {
    name: '通用CREATE任务',
    task: {
      id: 'test-generic',
      name: '通用功能',
      description: '创建基础功能模块',
      dependencies: []
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(`--- ${index + 1}. ${testCase.name} ---`);
  console.log(`描述: ${testCase.task.description}`);
  
  const analysis = IntelligentTaskAnalyzer.analyzeForTaskSplitting(testCase.task);
  const debugInfo = DynamicGuidanceGenerator.debugTechStackDetection(analysis);
  
  console.log(`检测到的技术栈: [${debugInfo.detectedTech.join(', ')}]`);
  
  const steps = DynamicGuidanceGenerator.generateContextualStepSequence(
    analysis,
    analysis.operationType
  );
  
  console.log('原子级步骤:');
  steps.forEach((step, stepIndex) => {
    console.log(`  ${stepIndex + 1}. ${step}`);
  });
  
  console.log(''); // 空行分隔
});