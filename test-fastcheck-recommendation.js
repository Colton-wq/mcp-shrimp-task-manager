import { IntelligentTaskAnalyzer } from './dist/prompts/generators/executeTask.js';
import { DynamicGuidanceGenerator } from './dist/utils/DynamicGuidanceGenerator.js';

console.log('=== Fast-check框架推荐测试 ===\n');

// 测试用例：适合属性测试的场景
const testCases = [
  {
    name: '算法验证任务',
    task: {
      id: 'test-algorithm',
      name: '排序算法测试',
      description: '验证快速排序算法的正确性和不变量属性',
      dependencies: []
    }
  },
  {
    name: '数据处理函数',
    task: {
      id: 'test-data-processing',
      name: '数据转换测试',
      description: '测试JSON数据处理函数的边界条件和异常处理',
      dependencies: []
    }
  },
  {
    name: '数学函数验证',
    task: {
      id: 'test-math',
      name: '计算函数测试',
      description: '验证数学计算函数的不变量和数学性质',
      dependencies: []
    }
  },
  {
    name: '普通UI测试',
    task: {
      id: 'test-ui',
      name: 'React组件测试',
      description: '测试用户界面组件的渲染和交互',
      dependencies: []
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(`--- ${index + 1}. ${testCase.name} ---`);
  console.log(`描述: ${testCase.task.description}`);
  
  const analysis = IntelligentTaskAnalyzer.analyzeForTaskSplitting(testCase.task);
  const debugInfo = DynamicGuidanceGenerator.debugTechStackDetection(analysis, testCase.task.description);
  
  console.log(`提取的分析文本: "${debugInfo.extractedText}"`);
  console.log(`组合文本内容: "${debugInfo.combinedText}"`);
  console.log(`检测到的技术栈: [${debugInfo.detectedTech.join(', ')}]`);
  console.log(`Fast-check匹配: ${debugInfo.patternMatches.fastcheck ? '✅' : '❌'}`);
  
  // 手动测试正则表达式
  const fastcheckRegex = /fast.*check|属性测试|property.*test|算法验证|验证.*算法|数据处理|不变量|invariant|数学.*性质|边界条件|异常.*处理|正确性.*验证/i;
  const manualMatch = fastcheckRegex.test(testCase.task.description);
  console.log(`手动正则匹配: ${manualMatch ? '✅' : '❌'}`);
  
  if (analysis.operationType === 'TEST') {
    const steps = DynamicGuidanceGenerator.generateContextualStepSequence(
      analysis,
      analysis.operationType,
      testCase.task.description
    );
    
    console.log('生成的测试步骤:');
    steps.forEach((step, stepIndex) => {
      console.log(`  ${stepIndex + 1}. ${step}`);
    });
    
    // 检查技术栈感知指导
    const guidance = DynamicGuidanceGenerator.generateTechStackAwareGuidance(
      analysis,
      analysis.operationType
    );
    
    if (guidance.length > 0) {
      console.log('技术栈指导:');
      guidance.forEach(item => {
        console.log(`  • ${item}`);
      });
    }
  } else {
    console.log(`操作类型: ${analysis.operationType} (非测试任务)`);
  }
  
  console.log(''); // 空行分隔
});