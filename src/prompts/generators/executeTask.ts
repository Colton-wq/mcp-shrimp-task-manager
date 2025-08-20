/**
 * executeTask prompt 生成器 - 增强版
 * 負責將模板和參數組合成最終的 prompt，支持智能任务拆分和动态建议
 * executeTask prompt generator - Enhanced version
 * Responsible for combining templates and parameters into the final prompt with intelligent task decomposition and dynamic recommendations
 */

import {
  loadPrompt,
  generatePrompt,
  loadPromptFromTemplate,
} from "../loader.js";
import { Task, TaskStatus } from "../../types/index.js";
import { ContextAnalyzer, BusinessDomain, BusinessIntent } from "../contextAnalyzer.js";

/**
 * 任務複雜度評估的介面
 * Interface for task complexity assessment
 */
interface ComplexityAssessment {
  level: string;
  metrics: {
    descriptionLength: number;
    dependenciesCount: number;
  };
  recommendations?: string[];
}

/**
 * 任务类型分类 - 用于智能分析
 * Task type classification for intelligent analysis
 */
export enum TaskType {
  CODE_UNDERSTANDING = 'code-understanding',
  CODE_SEARCH = 'code-search',
  ARCHITECTURE_ANALYSIS = 'architecture-analysis',
  PROBLEM_DIAGNOSIS = 'problem-diagnosis',
  CODE_GENERATION = 'code-generation',
  INTEGRATION = 'integration',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  REFACTORING = 'refactoring',
  PERFORMANCE_OPTIMIZATION = 'performance-optimization'
}

/**
 * 边界情况识别
 * Edge case identification
 */
export interface EdgeCase {
  type: string;
  description: string;
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  testingStrategy: string;
  preventionMeasures: string[];
}

/**
 * 强制审计检查点
 * Mandatory audit checkpoint
 */
export interface AuditCheckpoint {
  name: string;
  description: string;
  mandatory: boolean;
  timing: 'BEFORE_EXECUTION' | 'DURING_EXECUTION' | 'BEFORE_COMPLETION';
  criteria: string[];
  tools: string[];
}

/**
 * 动态任务拆分建议
 * Dynamic task decomposition recommendation
 */
export interface DecompositionRecommendation {
  shouldDecompose: boolean;
  suggestedSubtasks: {
    name: string;
    description: string;
    estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    dependencies: string[];
  }[];
  decompositionRationale: string;
}

/**
 * executeTask prompt 參數介面 - 增强版
 * executeTask prompt parameter interface - Enhanced version
 */
export interface ExecuteTaskPromptParams {
  task: Task;
  complexityAssessment?: ComplexityAssessment;
  relatedFilesSummary?: string;
  dependencyTasks?: Task[];
  pathRecommendation?: string;
  // 新增的智能分析参数
  enableIntelligentAnalysis?: boolean;
  projectContext?: any;
  relatedTasks?: Task[];
}

/**
 * 獲取複雜度級別的樣式文字
 * Get styled text for complexity level
 * @param level 複雜度級別
 * @param level complexity level
 * @returns 樣式文字
 * @returns styled text
 */
function getComplexityStyle(level: string): string {
  switch (level) {
    case "VERY_HIGH":
      return "⚠️ **警告：此任務複雜度極高** ⚠️";
      // ⚠️ **Warning: This task has extremely high complexity** ⚠️
    case "HIGH":
      return "⚠️ **注意：此任務複雜度較高**";
      // ⚠️ **Notice: This task has relatively high complexity**
    case "MEDIUM":
      return "**提示：此任務具有一定複雜性**";
      // **Tip: This task has some complexity**
    default:
      return "";
  }
}

/**
 * 智能任务分析器
 * Intelligent task analyzer
 */
class IntelligentTaskAnalyzer {
  /**
   * 分析任务类型
   * Analyze task type
   */
  static classifyTaskType(task: Task): TaskType {
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();

    // 基于关键词分类
    if (text.includes('understand') || text.includes('explain') || text.includes('analyze code')) {
      return TaskType.CODE_UNDERSTANDING;
    }
    if (text.includes('find') || text.includes('search') || text.includes('locate')) {
      return TaskType.CODE_SEARCH;
    }
    if (text.includes('architecture') || text.includes('design') || text.includes('structure')) {
      return TaskType.ARCHITECTURE_ANALYSIS;
    }
    if (text.includes('debug') || text.includes('fix') || text.includes('error') || text.includes('bug')) {
      return TaskType.PROBLEM_DIAGNOSIS;
    }
    if (text.includes('create') || text.includes('implement') || text.includes('build') || text.includes('develop')) {
      return TaskType.CODE_GENERATION;
    }
    if (text.includes('integrate') || text.includes('connect') || text.includes('merge')) {
      return TaskType.INTEGRATION;
    }
    if (text.includes('test') || text.includes('verify') || text.includes('validate')) {
      return TaskType.TESTING;
    }
    if (text.includes('document') || text.includes('readme') || text.includes('guide')) {
      return TaskType.DOCUMENTATION;
    }
    if (text.includes('refactor') || text.includes('restructure') || text.includes('clean')) {
      return TaskType.REFACTORING;
    }
    if (text.includes('optimize') || text.includes('performance') || text.includes('speed')) {
      return TaskType.PERFORMANCE_OPTIMIZATION;
    }

    return TaskType.CODE_GENERATION; // 默认类型
  }

  /**
   * 识别边界情况
   * Identify edge cases
   */
  static identifyEdgeCases(task: Task, taskType: TaskType): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    // 基于任务类型的边界情况
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        edgeCases.push({
          type: 'Input Validation',
          description: 'Invalid or unexpected input data formats',
          likelihood: 'HIGH',
          impact: 'MEDIUM',
          testingStrategy: 'Test with boundary values and invalid inputs',
          preventionMeasures: ['Input validation', 'Type checking', 'Error handling']
        });
        break;
      case TaskType.INTEGRATION:
        edgeCases.push({
          type: 'API Compatibility',
          description: 'Version mismatches or API changes',
          likelihood: 'MEDIUM',
          impact: 'HIGH',
          testingStrategy: 'Test with different API versions',
          preventionMeasures: ['Version pinning', 'Compatibility checks', 'Fallback mechanisms']
        });
        break;
      case TaskType.PERFORMANCE_OPTIMIZATION:
        edgeCases.push({
          type: 'Resource Constraints',
          description: 'Memory or CPU limitations under load',
          likelihood: 'MEDIUM',
          impact: 'HIGH',
          testingStrategy: 'Load testing and resource monitoring',
          preventionMeasures: ['Resource monitoring', 'Graceful degradation', 'Caching strategies']
        });
        break;
    }

    // 通用边界情况
    edgeCases.push({
      type: 'Backward Compatibility',
      description: 'Changes may break existing functionality',
      likelihood: 'MEDIUM',
      impact: 'MEDIUM',
      testingStrategy: 'Regression testing and compatibility checks',
      preventionMeasures: ['Version control', 'Feature flags', 'Gradual rollout']
    });

    return edgeCases;
  }

  /**
   * 定义强制审计检查点
   * Define mandatory audit checkpoints
   */
  static defineMandatoryAudits(task: Task, taskType: TaskType): AuditCheckpoint[] {
    const audits: AuditCheckpoint[] = [];

    // 基于任务类型的审计
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        audits.push({
          name: 'Code Quality Review',
          description: 'Ensure code meets quality standards and best practices',
          mandatory: true,
          timing: 'DURING_EXECUTION',
          criteria: ['Code follows standards', 'Complexity is reasonable', 'Test coverage adequate'],
          tools: ['eslint', 'sonarqube', 'code-review']
        });
        break;
      case TaskType.INTEGRATION:
        audits.push({
          name: 'Integration Testing',
          description: 'Verify integration functionality works correctly',
          mandatory: true,
          timing: 'BEFORE_COMPLETION',
          criteria: ['API calls succeed', 'Data flows correctly', 'Error handling works'],
          tools: ['integration-test', 'api-test', 'monitoring']
        });
        break;
    }

    // 通用审计检查点
    audits.push({
      name: 'Security Review',
      description: 'Check for security vulnerabilities and best practices',
      mandatory: true,
      timing: 'BEFORE_COMPLETION',
      criteria: ['No security vulnerabilities', 'Input validation present', 'Access controls proper'],
      tools: ['security-scan', 'vulnerability-check', 'access-review']
    });

    return audits;
  }

  /**
   * 分析是否需要拆分任务
   * Analyze if task decomposition is needed
   */
  static analyzeDecomposition(task: Task, complexityAssessment?: ComplexityAssessment): DecompositionRecommendation {
    const shouldDecompose = this.shouldDecomposeTask(task, complexityAssessment);

    if (!shouldDecompose) {
      return {
        shouldDecompose: false,
        suggestedSubtasks: [],
        decompositionRationale: 'Task complexity is manageable as a single unit'
      };
    }

    const suggestedSubtasks = this.generateSubtaskSuggestions(task);

    return {
      shouldDecompose,
      suggestedSubtasks,
      decompositionRationale: 'Task complexity suggests decomposition would improve success rate and maintainability'
    };
  }

  /**
   * 判断是否需要拆分
   * Determine if decomposition is needed
   */
  private static shouldDecomposeTask(task: Task, complexityAssessment?: ComplexityAssessment): boolean {
    // 基于复杂度评估
    if (complexityAssessment?.level === 'VERY_HIGH') return true;
    if (complexityAssessment?.level === 'HIGH' && task.dependencies.length > 2) return true;

    // 基于描述长度
    if (task.description.length > 800) return true;

    // 基于关键词检测
    const complexityKeywords = ['multiple', 'various', 'several', 'complex', 'comprehensive'];
    const text = `${task.description} ${task.implementationGuide || ''}`.toLowerCase();
    const keywordCount = complexityKeywords.filter(keyword => text.includes(keyword)).length;

    return keywordCount >= 2;
  }

  /**
   * 生成子任务建议
   * Generate subtask suggestions
   */
  private static generateSubtaskSuggestions(task: Task) {
    const suggestions = [];
    const taskType = this.classifyTaskType(task);

    // 基于任务类型生成建议
    switch (taskType) {
      case TaskType.CODE_GENERATION:
        suggestions.push(
          {
            name: 'Design and Planning',
            description: 'Define interfaces, data structures, and implementation approach',
            estimatedComplexity: 'MEDIUM' as const,
            dependencies: []
          },
          {
            name: 'Core Implementation',
            description: 'Implement main functionality and business logic',
            estimatedComplexity: 'HIGH' as const,
            dependencies: ['Design and Planning']
          },
          {
            name: 'Testing and Validation',
            description: 'Create tests and validate functionality',
            estimatedComplexity: 'MEDIUM' as const,
            dependencies: ['Core Implementation']
          }
        );
        break;
      case TaskType.INTEGRATION:
        suggestions.push(
          {
            name: 'Interface Analysis',
            description: 'Analyze existing interfaces and integration points',
            estimatedComplexity: 'MEDIUM' as const,
            dependencies: []
          },
          {
            name: 'Integration Implementation',
            description: 'Implement integration logic and data mapping',
            estimatedComplexity: 'HIGH' as const,
            dependencies: ['Interface Analysis']
          }
        );
        break;
    }

    return suggestions;
  }
}

/**
 * 獲取 executeTask 的完整 prompt - 增强版
 * Get the complete prompt for executeTask - Enhanced version
 * @param params prompt 參數
 * @param params prompt parameters
 * @returns 生成的 prompt
 * @returns generated prompt
 */
export async function getExecuteTaskPrompt(
  params: ExecuteTaskPromptParams
): Promise<string> {
  const {
    task,
    complexityAssessment,
    relatedFilesSummary,
    dependencyTasks,
    pathRecommendation,
    enableIntelligentAnalysis = true,
    projectContext,
    relatedTasks = []
  } = params;

  const notesTemplate = await loadPromptFromTemplate("executeTask/notes.md");
  let notesPrompt = "";
  if (task.notes) {
    notesPrompt = generatePrompt(notesTemplate, {
      notes: task.notes,
    });
  }

  const implementationGuideTemplate = await loadPromptFromTemplate(
    "executeTask/implementationGuide.md"
  );
  let implementationGuidePrompt = "";
  if (task.implementationGuide) {
    implementationGuidePrompt = generatePrompt(implementationGuideTemplate, {
      implementationGuide: task.implementationGuide,
    });
  }

  const verificationCriteriaTemplate = await loadPromptFromTemplate(
    "executeTask/verificationCriteria.md"
  );
  let verificationCriteriaPrompt = "";
  if (task.verificationCriteria) {
    verificationCriteriaPrompt = generatePrompt(verificationCriteriaTemplate, {
      verificationCriteria: task.verificationCriteria,
    });
  }

  const analysisResultTemplate = await loadPromptFromTemplate(
    "executeTask/analysisResult.md"
  );
  let analysisResultPrompt = "";
  if (task.analysisResult) {
    analysisResultPrompt = generatePrompt(analysisResultTemplate, {
      analysisResult: task.analysisResult,
    });
  }

  const dependencyTasksTemplate = await loadPromptFromTemplate(
    "executeTask/dependencyTasks.md"
  );
  let dependencyTasksPrompt = "";
  if (dependencyTasks && dependencyTasks.length > 0) {
    const completedDependencyTasks = dependencyTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.summary
    );

    if (completedDependencyTasks.length > 0) {
      let dependencyTasksContent = "";
      for (const depTask of completedDependencyTasks) {
        dependencyTasksContent += `### ${depTask.name}\n${
          depTask.summary || "*無完成摘要*"
          // "*No completion summary*"
        }\n\n`;
      }
      dependencyTasksPrompt = generatePrompt(dependencyTasksTemplate, {
        dependencyTasks: dependencyTasksContent,
      });
    }
  }

  const relatedFilesSummaryTemplate = await loadPromptFromTemplate(
    "executeTask/relatedFilesSummary.md"
  );
  let relatedFilesSummaryPrompt = "";
  relatedFilesSummaryPrompt = generatePrompt(relatedFilesSummaryTemplate, {
    relatedFilesSummary: relatedFilesSummary || "當前任務沒有關聯的文件。",
    // "The current task has no associated files."
  });

  // 智能分析部分
  // Intelligent analysis section
  let intelligentAnalysisPrompt = "";
  if (enableIntelligentAnalysis) {
    try {
      console.log('🔍 开始智能分析，enableIntelligentAnalysis:', enableIntelligentAnalysis);
      const taskType = IntelligentTaskAnalyzer.classifyTaskType(task);
      console.log('📋 任务类型分类:', taskType);
      const edgeCases = IntelligentTaskAnalyzer.identifyEdgeCases(task, taskType);
      console.log('🔍 边界情况数量:', edgeCases.length);
      const auditCheckpoints = IntelligentTaskAnalyzer.defineMandatoryAudits(task, taskType);
      console.log('🔒 审计检查点数量:', auditCheckpoints.length);
      const decompositionAnalysis = IntelligentTaskAnalyzer.analyzeDecomposition(task, complexityAssessment);
      console.log('⚡ 拆分建议:', decompositionAnalysis.shouldDecompose);

      // 生成智能分析内容
      intelligentAnalysisPrompt = await generateIntelligentAnalysisPrompt({
        taskType,
        edgeCases,
        auditCheckpoints,
        decompositionAnalysis,
        task
      });
      console.log('✅ 智能分析内容长度:', intelligentAnalysisPrompt.length);
    } catch (error) {
      console.error('❌ 智能分析生成失败:', error);
      intelligentAnalysisPrompt = `\n## ⚠️ 智能分析暂时不可用\n\n由于技术问题，智能分析功能暂时不可用。请按照标准流程执行任务。\n\n错误信息: ${error instanceof Error ? error.message : String(error)}\n\n`;
    }
  } else {
    console.log('⚠️ 智能分析未启用，enableIntelligentAnalysis:', enableIntelligentAnalysis);
  }

  const complexityTemplate = await loadPromptFromTemplate(
    "executeTask/complexity.md"
  );
  let complexityPrompt = "";
  if (complexityAssessment) {
    const complexityStyle = getComplexityStyle(complexityAssessment.level);
    let recommendationContent = "";
    if (
      complexityAssessment.recommendations &&
      complexityAssessment.recommendations.length > 0
    ) {
      for (const recommendation of complexityAssessment.recommendations) {
        recommendationContent += `- ${recommendation}\n`;
      }
    }
    complexityPrompt = generatePrompt(complexityTemplate, {
      level: complexityAssessment.level,
      complexityStyle: complexityStyle,
      descriptionLength: complexityAssessment.metrics.descriptionLength,
      dependenciesCount: complexityAssessment.metrics.dependenciesCount,
      recommendation: recommendationContent,
      pathRecommendation: pathRecommendation || "",
    });
  } else {
    // 即使没有复杂度评估，也要显示路径推荐
    complexityPrompt = generatePrompt(complexityTemplate, {
      level: "未知",
      complexityStyle: "",
      descriptionLength: 0,
      dependenciesCount: 0,
      recommendation: "",
      pathRecommendation: pathRecommendation || "",
    });
  }

  const indexTemplate = await loadPromptFromTemplate("executeTask/index.md");
  let prompt = generatePrompt(indexTemplate, {
    name: task.name,
    id: task.id,
    description: task.description,
    notesTemplate: notesPrompt,
    implementationGuideTemplate: implementationGuidePrompt,
    verificationCriteriaTemplate: verificationCriteriaPrompt,
    analysisResultTemplate: analysisResultPrompt,
    dependencyTasksTemplate: dependencyTasksPrompt,
    relatedFilesSummaryTemplate: relatedFilesSummaryPrompt,
    complexityTemplate: complexityPrompt,
    intelligentAnalysisTemplate: intelligentAnalysisPrompt, // 新增智能分析
  });

  // 如果任務有指定的代理，添加 sub-agent 命令
  if (task.agent) {
    // 在 prompt 開頭添加 use sub-agent 命令
    prompt = `use sub-agent ${task.agent}\n\n${prompt}`;
  }

  // 載入可能的自定義 prompt
  // Load possible custom prompt
  return loadPrompt(prompt, "EXECUTE_TASK");
}

/**
 * 生成智能分析提示词内容
 * Generate intelligent analysis prompt content
 */
async function generateIntelligentAnalysisPrompt(params: {
  taskType: TaskType;
  edgeCases: EdgeCase[];
  auditCheckpoints: AuditCheckpoint[];
  decompositionAnalysis: DecompositionRecommendation;
  task: Task;
}): Promise<string> {
  const { taskType, edgeCases, auditCheckpoints, decompositionAnalysis, task } = params;

  let content = `\n## 🧠 Intelligent Task Analysis\n\n`;

  // 任务类型分析
  content += `**Task Type**: ${taskType}\n\n`;

  // 任务拆分建议
  if (decompositionAnalysis.shouldDecompose) {
    content += `### ⚠️ Task Decomposition Recommended\n\n`;
    content += `**Rationale**: ${decompositionAnalysis.decompositionRationale}\n\n`;
    content += `**Suggested Subtasks**:\n`;
    decompositionAnalysis.suggestedSubtasks.forEach((subtask, index) => {
      content += `${index + 1}. **${subtask.name}** (${subtask.estimatedComplexity})\n`;
      content += `   - ${subtask.description}\n`;
      if (subtask.dependencies.length > 0) {
        content += `   - Dependencies: ${subtask.dependencies.join(', ')}\n`;
      }
      content += `\n`;
    });
    content += `**Recommendation**: Consider using \`split_tasks\` to break this down into manageable subtasks.\n\n`;
  }

  // 边界情况识别
  if (edgeCases.length > 0) {
    content += `### 🔍 Edge Cases & Risk Analysis\n\n`;
    edgeCases.forEach((edgeCase, index) => {
      content += `**${index + 1}. ${edgeCase.type}** (${edgeCase.likelihood} likelihood, ${edgeCase.impact} impact)\n`;
      content += `- **Description**: ${edgeCase.description}\n`;
      content += `- **Testing Strategy**: ${edgeCase.testingStrategy}\n`;
      content += `- **Prevention**: ${edgeCase.preventionMeasures.join(', ')}\n\n`;
    });
  }

  // 强制审计检查点
  if (auditCheckpoints.length > 0) {
    content += `### 🔒 Mandatory Quality Gates\n\n`;
    auditCheckpoints.forEach((checkpoint, index) => {
      content += `**${index + 1}. ${checkpoint.name}** (${checkpoint.timing})\n`;
      content += `- **Description**: ${checkpoint.description}\n`;
      content += `- **Criteria**: ${checkpoint.criteria.join(', ')}\n`;
      content += `- **Tools**: ${checkpoint.tools.join(', ')}\n`;
      if (checkpoint.mandatory) {
        content += `- **⚠️ MANDATORY**: This checkpoint must be completed before proceeding\n`;
      }
      content += `\n`;
    });
  }

  // 执行指导
  content += `### 🎯 Execution Guidance\n\n`;
  content += `**Critical Success Factors**:\n`;
  content += `- Use \`codebase-retrieval\` to understand existing patterns before implementing\n`;
  content += `- Apply \`search_code_desktop-commander\` to find similar implementations\n`;
  content += `- Leverage \`Everything MCP\` for quick file discovery\n`;
  content += `- Follow the identified edge cases and implement proper error handling\n`;
  content += `- Complete all mandatory quality gates before calling \`verify_task\`\n\n`;

  return content;
}
