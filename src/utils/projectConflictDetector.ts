/**
 * Intelligent Project Conflict Detector for MCP Shrimp Task Manager
 * 
 * Provides multi-dimensional analysis to detect project context mismatches
 * and offers intelligent recovery suggestions for AI agents.
 * 
 * 智能项目冲突检测器，为MCP Shrimp Task Manager提供多维度分析，
 * 检测项目上下文不匹配情况，并为AI代理提供智能恢复建议。
 */

import { Task, RelatedFile } from "../types/index.js";
import { ProjectSession, getActiveProjectContext } from "./projectSession.js";
import { getDataDir } from "./paths.js";
import path from "path";

/**
 * Project conflict detection result
 * 项目冲突检测结果
 */
export interface ConflictDetectionResult {
  /** Whether conflicts were detected / 是否检测到冲突 */
  hasConflicts: boolean;
  /** Overall confidence score (0-1) / 总体置信度评分 (0-1) */
  confidenceScore: number;
  /** Current project context / 当前项目上下文 */
  currentProject: string | null;
  /** Detected conflicts / 检测到的冲突 */
  conflicts: ProjectConflict[];
  /** Recovery suggestions / 恢复建议 */
  recoverySuggestions: RecoverySuggestion[];
  /** Analysis details / 分析详情 */
  analysisDetails: AnalysisDetails;
}

/**
 * Individual project conflict
 * 单个项目冲突
 */
export interface ProjectConflict {
  /** Conflict type / 冲突类型 */
  type: ConflictType;
  /** Severity level / 严重程度 */
  severity: ConflictSeverity;
  /** Affected tasks / 受影响的任务 */
  affectedTasks: string[];
  /** Conflict description / 冲突描述 */
  description: string;
  /** Evidence supporting this conflict / 支持此冲突的证据 */
  evidence: string[];
}

/**
 * Recovery suggestion
 * 恢复建议
 */
export interface RecoverySuggestion {
  /** Suggestion type / 建议类型 */
  type: SuggestionType;
  /** Priority level / 优先级 */
  priority: SuggestionPriority;
  /** Action description / 操作描述 */
  action: string;
  /** Detailed steps / 详细步骤 */
  steps: string[];
  /** Expected outcome / 预期结果 */
  expectedOutcome: string;
}

/**
 * Analysis details
 * 分析详情
 */
export interface AnalysisDetails {
  /** Total tasks analyzed / 分析的任务总数 */
  totalTasks: number;
  /** Time pattern analysis / 时间模式分析 */
  timePatternAnalysis: TimePatternAnalysis;
  /** File path analysis / 文件路径分析 */
  filePathAnalysis: FilePathAnalysis;
  /** Content analysis / 内容分析 */
  contentAnalysis: ContentAnalysis;
  /** Analysis timestamp / 分析时间戳 */
  analyzedAt: Date;
}

/**
 * Conflict types
 * 冲突类型
 */
export enum ConflictType {
  TIME_ANOMALY = "TIME_ANOMALY",           // 时间异常
  PATH_MISMATCH = "PATH_MISMATCH",         // 路径不匹配
  CONTENT_INCONSISTENCY = "CONTENT_INCONSISTENCY", // 内容不一致
  PROJECT_CONTEXT_ERROR = "PROJECT_CONTEXT_ERROR"  // 项目上下文错误
}

/**
 * Conflict severity levels
 * 冲突严重程度
 */
export enum ConflictSeverity {
  LOW = "LOW",       // 低
  MEDIUM = "MEDIUM", // 中
  HIGH = "HIGH",     // 高
  CRITICAL = "CRITICAL" // 严重
}

/**
 * Suggestion types
 * 建议类型
 */
export enum SuggestionType {
  SWITCH_PROJECT = "SWITCH_PROJECT",     // 切换项目
  MERGE_TASKS = "MERGE_TASKS",           // 合并任务
  BACKUP_AND_RESTORE = "BACKUP_AND_RESTORE", // 备份和恢复
  MANUAL_REVIEW = "MANUAL_REVIEW"        // 手动审查
}

/**
 * Suggestion priority levels
 * 建议优先级
 */
export enum SuggestionPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM", 
  HIGH = "HIGH",
  URGENT = "URGENT"
}

/**
 * Time pattern analysis result
 * 时间模式分析结果
 */
interface TimePatternAnalysis {
  /** Average time gap between tasks / 任务间平均时间间隔 */
  averageTimeGap: number;
  /** Detected time anomalies / 检测到的时间异常 */
  timeAnomalies: TimeAnomaly[];
  /** Time clustering analysis / 时间聚类分析 */
  timeClusters: TimeCluster[];
}

/**
 * Time anomaly
 * 时间异常
 */
interface TimeAnomaly {
  /** Task ID / 任务ID */
  taskId: string;
  /** Task name / 任务名称 */
  taskName: string;
  /** Anomaly type / 异常类型 */
  anomalyType: "SUDDEN_JUMP" | "LONG_GAP" | "FUTURE_DATE";
  /** Time difference in milliseconds / 时间差（毫秒） */
  timeDifference: number;
  /** Description / 描述 */
  description: string;
}

/**
 * Time cluster
 * 时间聚类
 */
interface TimeCluster {
  /** Start time / 开始时间 */
  startTime: Date;
  /** End time / 结束时间 */
  endTime: Date;
  /** Tasks in this cluster / 此聚类中的任务 */
  taskIds: string[];
  /** Cluster confidence / 聚类置信度 */
  confidence: number;
}

/**
 * File path analysis result
 * 文件路径分析结果
 */
interface FilePathAnalysis {
  /** Project root patterns / 项目根路径模式 */
  projectRootPatterns: string[];
  /** Path mismatches / 路径不匹配 */
  pathMismatches: PathMismatch[];
  /** Path confidence score / 路径置信度评分 */
  pathConfidenceScore: number;
}

/**
 * Path mismatch
 * 路径不匹配
 */
interface PathMismatch {
  /** Task ID / 任务ID */
  taskId: string;
  /** File path / 文件路径 */
  filePath: string;
  /** Expected project / 预期项目 */
  expectedProject: string;
  /** Actual project / 实际项目 */
  actualProject: string;
  /** Confidence / 置信度 */
  confidence: number;
}

/**
 * Content analysis result
 * 内容分析结果
 */
interface ContentAnalysis {
  /** Project keywords / 项目关键词 */
  projectKeywords: string[];
  /** Content inconsistencies / 内容不一致 */
  contentInconsistencies: ContentInconsistency[];
  /** Content confidence score / 内容置信度评分 */
  contentConfidenceScore: number;
}

/**
 * Content inconsistency
 * 内容不一致
 */
interface ContentInconsistency {
  /** Task ID / 任务ID */
  taskId: string;
  /** Inconsistency type / 不一致类型 */
  inconsistencyType: "PROJECT_NAME_MISMATCH" | "TECHNOLOGY_MISMATCH" | "CONTEXT_MISMATCH";
  /** Description / 描述 */
  description: string;
  /** Confidence / 置信度 */
  confidence: number;
}

/**
 * Main conflict detection function
 * 主要冲突检测函数
 * 
 * @param tasks Task list to analyze / 要分析的任务列表
 * @param options Detection options / 检测选项
 * @returns Detection result / 检测结果
 */
export async function detectProjectConflicts(
  tasks: Task[],
  options: {
    /** Enable time pattern analysis / 启用时间模式分析 */
    enableTimeAnalysis?: boolean;
    /** Enable file path analysis / 启用文件路径分析 */
    enablePathAnalysis?: boolean;
    /** Enable content analysis / 启用内容分析 */
    enableContentAnalysis?: boolean;
    /** Confidence threshold / 置信度阈值 */
    confidenceThreshold?: number;
  } = {}
): Promise<ConflictDetectionResult> {
  const {
    enableTimeAnalysis = true,
    enablePathAnalysis = true,
    enableContentAnalysis = true,
    confidenceThreshold = 0.7
  } = options;

  // Get current project context
  // 获取当前项目上下文
  const currentProject = ProjectSession.getCurrentProject();
  
  // Initialize result
  // 初始化结果
  const result: ConflictDetectionResult = {
    hasConflicts: false,
    confidenceScore: 1.0,
    currentProject,
    conflicts: [],
    recoverySuggestions: [],
    analysisDetails: {
      totalTasks: tasks.length,
      timePatternAnalysis: {
        averageTimeGap: 0,
        timeAnomalies: [],
        timeClusters: []
      },
      filePathAnalysis: {
        projectRootPatterns: [],
        pathMismatches: [],
        pathConfidenceScore: 1.0
      },
      contentAnalysis: {
        projectKeywords: [],
        contentInconsistencies: [],
        contentConfidenceScore: 1.0
      },
      analyzedAt: new Date()
    }
  };

  if (tasks.length === 0) {
    return result;
  }

  // Perform different types of analysis
  // 执行不同类型的分析
  if (enableTimeAnalysis) {
    await analyzeTimePatterns(tasks, result);
  }

  if (enablePathAnalysis) {
    await analyzeFilePaths(tasks, result, currentProject);
  }

  if (enableContentAnalysis) {
    await analyzeContent(tasks, result, currentProject);
  }

  // Calculate overall confidence and determine conflicts
  // 计算总体置信度并确定冲突
  calculateOverallConfidence(result, confidenceThreshold);

  // Generate recovery suggestions
  // 生成恢复建议
  generateRecoverySuggestions(result);

  return result;
}

/**
 * Analyze time patterns in tasks to detect anomalies
 * 分析任务中的时间模式以检测异常
 */
async function analyzeTimePatterns(tasks: Task[], result: ConflictDetectionResult): Promise<void> {
  const timeAnalysis = result.analysisDetails.timePatternAnalysis;

  if (tasks.length < 2) {
    return;
  }

  // Sort tasks by creation time
  // 按创建时间排序任务
  const sortedTasks = [...tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Calculate time gaps
  // 计算时间间隔
  const timeGaps: number[] = [];
  for (let i = 1; i < sortedTasks.length; i++) {
    const gap = sortedTasks[i].createdAt.getTime() - sortedTasks[i - 1].createdAt.getTime();
    timeGaps.push(gap);
  }

  // Calculate average time gap
  // 计算平均时间间隔
  timeAnalysis.averageTimeGap = timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;

  // Detect time anomalies
  // 检测时间异常
  const threshold = timeAnalysis.averageTimeGap * 3; // 3x average as threshold

  for (let i = 1; i < sortedTasks.length; i++) {
    const gap = timeGaps[i - 1];
    const task = sortedTasks[i];

    if (gap > threshold) {
      timeAnalysis.timeAnomalies.push({
        taskId: task.id,
        taskName: task.name,
        anomalyType: "SUDDEN_JUMP",
        timeDifference: gap,
        description: `Unusual time gap of ${Math.round(gap / (1000 * 60))} minutes between tasks`
      });

      // Add conflict
      // 添加冲突
      result.conflicts.push({
        type: ConflictType.TIME_ANOMALY,
        severity: gap > threshold * 2 ? ConflictSeverity.HIGH : ConflictSeverity.MEDIUM,
        affectedTasks: [task.id],
        description: `Task "${task.name}" has an unusual creation time gap`,
        evidence: [`Time gap: ${Math.round(gap / (1000 * 60))} minutes`, `Average gap: ${Math.round(timeAnalysis.averageTimeGap / (1000 * 60))} minutes`]
      });
    }

    // Check for future dates
    // 检查未来日期
    const now = new Date();
    if (task.createdAt > now) {
      timeAnalysis.timeAnomalies.push({
        taskId: task.id,
        taskName: task.name,
        anomalyType: "FUTURE_DATE",
        timeDifference: task.createdAt.getTime() - now.getTime(),
        description: `Task created in the future`
      });

      result.conflicts.push({
        type: ConflictType.TIME_ANOMALY,
        severity: ConflictSeverity.CRITICAL,
        affectedTasks: [task.id],
        description: `Task "${task.name}" has a future creation date`,
        evidence: [`Created at: ${task.createdAt.toISOString()}`, `Current time: ${now.toISOString()}`]
      });
    }
  }

  // Perform time clustering
  // 执行时间聚类
  performTimeClustering(sortedTasks, timeAnalysis);
}

/**
 * Perform time clustering analysis
 * 执行时间聚类分析
 */
function performTimeClustering(sortedTasks: Task[], timeAnalysis: TimePatternAnalysis): void {
  const clusterThreshold = timeAnalysis.averageTimeGap * 0.5; // 50% of average gap
  let currentCluster: TimeCluster | null = null;

  for (let i = 0; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];

    if (!currentCluster) {
      // Start new cluster
      // 开始新聚类
      currentCluster = {
        startTime: task.createdAt,
        endTime: task.createdAt,
        taskIds: [task.id],
        confidence: 1.0
      };
    } else {
      const timeDiff = task.createdAt.getTime() - currentCluster.endTime.getTime();

      if (timeDiff <= clusterThreshold) {
        // Add to current cluster
        // 添加到当前聚类
        currentCluster.endTime = task.createdAt;
        currentCluster.taskIds.push(task.id);
      } else {
        // Finish current cluster and start new one
        // 完成当前聚类并开始新的
        if (currentCluster.taskIds.length > 1) {
          timeAnalysis.timeClusters.push(currentCluster);
        }

        currentCluster = {
          startTime: task.createdAt,
          endTime: task.createdAt,
          taskIds: [task.id],
          confidence: 1.0
        };
      }
    }
  }

  // Add final cluster
  // 添加最终聚类
  if (currentCluster && currentCluster.taskIds.length > 1) {
    timeAnalysis.timeClusters.push(currentCluster);
  }
}

/**
 * Analyze file paths in tasks to detect project mismatches
 * 分析任务中的文件路径以检测项目不匹配
 */
async function analyzeFilePaths(tasks: Task[], result: ConflictDetectionResult, currentProject: string | null): Promise<void> {
  const pathAnalysis = result.analysisDetails.filePathAnalysis;

  if (!currentProject) {
    return;
  }

  // Extract all file paths from tasks
  // 从任务中提取所有文件路径
  const allPaths: { taskId: string; filePath: string; task: Task }[] = [];

  for (const task of tasks) {
    if (task.relatedFiles) {
      for (const file of task.relatedFiles) {
        allPaths.push({
          taskId: task.id,
          filePath: file.path,
          task
        });
      }
    }
  }

  if (allPaths.length === 0) {
    pathAnalysis.pathConfidenceScore = 1.0;
    return;
  }

  // Get current project data directory using explicit project parameter
  // 使用明确的项目参数获取当前项目数据目录
  let currentProjectPath: string;
  try {
    currentProjectPath = await getDataDir(false, currentProject);
  } catch (error) {
    pathAnalysis.pathConfidenceScore = 0.5;
    return;
  }

  // Analyze path patterns
  // 分析路径模式
  const projectRootPatterns = new Set<string>();
  let matchingPaths = 0;

  for (const { taskId, filePath, task } of allPaths) {
    // Extract potential project root from path
    // 从路径中提取潜在的项目根目录
    const normalizedPath = path.normalize(filePath);
    const pathParts = normalizedPath.split(path.sep);

    // Look for common project indicators
    // 查找常见的项目指示符
    let projectRoot = "";
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (part.includes("project") || part.includes("mcp") || part.includes(currentProject)) {
        projectRoot = pathParts.slice(0, i + 1).join(path.sep);
        break;
      }
    }

    if (projectRoot) {
      projectRootPatterns.add(projectRoot);
    }

    // Check if path matches current project
    // 检查路径是否匹配当前项目
    const isPathMatching = normalizedPath.includes(currentProject) ||
                          normalizedPath.includes(currentProjectPath) ||
                          projectRoot.includes(currentProject);

    if (isPathMatching) {
      matchingPaths++;
    } else {
      // Potential path mismatch
      // 潜在的路径不匹配
      const expectedProject = currentProject;
      const actualProject = projectRoot || "unknown";

      pathAnalysis.pathMismatches.push({
        taskId,
        filePath,
        expectedProject,
        actualProject,
        confidence: 0.8
      });

      // Add conflict
      // 添加冲突
      result.conflicts.push({
        type: ConflictType.PATH_MISMATCH,
        severity: ConflictSeverity.MEDIUM,
        affectedTasks: [taskId],
        description: `Task "${task.name}" references files outside current project`,
        evidence: [
          `File path: ${filePath}`,
          `Expected project: ${expectedProject}`,
          `Detected project: ${actualProject}`
        ]
      });
    }
  }

  // Update path patterns and confidence
  // 更新路径模式和置信度
  pathAnalysis.projectRootPatterns = Array.from(projectRootPatterns);
  pathAnalysis.pathConfidenceScore = allPaths.length > 0 ? matchingPaths / allPaths.length : 1.0;
}

/**
 * Analyze task content to detect project inconsistencies
 * 分析任务内容以检测项目不一致
 */
async function analyzeContent(tasks: Task[], result: ConflictDetectionResult, currentProject: string | null): Promise<void> {
  const contentAnalysis = result.analysisDetails.contentAnalysis;

  if (!currentProject) {
    contentAnalysis.contentConfidenceScore = 0.5;
    return;
  }

  // Extract project keywords from current project
  // 从当前项目中提取项目关键词
  const projectKeywords = [
    currentProject.toLowerCase(),
    "mcp",
    "shrimp",
    "task",
    "manager"
  ];
  contentAnalysis.projectKeywords = projectKeywords;

  let matchingTasks = 0;

  for (const task of tasks) {
    // Analyze task name and description
    // 分析任务名称和描述
    const taskText = `${task.name} ${task.description} ${task.notes || ""}`.toLowerCase();

    // Check for project keyword matches
    // 检查项目关键词匹配
    const keywordMatches = projectKeywords.filter(keyword => taskText.includes(keyword));
    const matchRatio = keywordMatches.length / projectKeywords.length;

    if (matchRatio > 0.3) {
      matchingTasks++;
    } else {
      // Potential content inconsistency
      // 潜在的内容不一致
      let inconsistencyType: ContentInconsistency["inconsistencyType"] = "CONTEXT_MISMATCH";

      // Check for other project names
      // 检查其他项目名称
      if (taskText.includes("basic-memory") || taskText.includes("other-project")) {
        inconsistencyType = "PROJECT_NAME_MISMATCH";
      }

      contentAnalysis.contentInconsistencies.push({
        taskId: task.id,
        inconsistencyType,
        description: `Task content does not match current project context`,
        confidence: 1 - matchRatio
      });

      // Add conflict if confidence is high
      // 如果置信度高则添加冲突
      if (matchRatio < 0.1) {
        result.conflicts.push({
          type: ConflictType.CONTENT_INCONSISTENCY,
          severity: ConflictSeverity.LOW,
          affectedTasks: [task.id],
          description: `Task "${task.name}" content seems unrelated to current project`,
          evidence: [
            `Task content: ${task.name}`,
            `Current project: ${currentProject}`,
            `Keyword match ratio: ${Math.round(matchRatio * 100)}%`
          ]
        });
      }
    }
  }

  // Update content confidence score
  // 更新内容置信度评分
  contentAnalysis.contentConfidenceScore = tasks.length > 0 ? matchingTasks / tasks.length : 1.0;
}

/**
 * Calculate overall confidence and determine if conflicts exist
 * 计算总体置信度并确定是否存在冲突
 */
function calculateOverallConfidence(result: ConflictDetectionResult, threshold: number): void {
  const { timePatternAnalysis, filePathAnalysis, contentAnalysis } = result.analysisDetails;

  // Weight different analysis types
  // 对不同分析类型加权
  const timeWeight = 0.4;
  const pathWeight = 0.4;
  const contentWeight = 0.2;

  // Calculate time confidence (inverse of anomaly ratio)
  // 计算时间置信度（异常比例的反比）
  const timeConfidence = timePatternAnalysis.timeAnomalies.length > 0
    ? Math.max(0, 1 - (timePatternAnalysis.timeAnomalies.length / result.analysisDetails.totalTasks))
    : 1.0;

  // Combine all confidence scores
  // 合并所有置信度评分
  result.confidenceScore =
    timeConfidence * timeWeight +
    filePathAnalysis.pathConfidenceScore * pathWeight +
    contentAnalysis.contentConfidenceScore * contentWeight;

  // Determine if conflicts exist
  // 确定是否存在冲突
  result.hasConflicts = result.conflicts.length > 0 || result.confidenceScore < threshold;
}

/**
 * Generate recovery suggestions based on detected conflicts
 * 基于检测到的冲突生成恢复建议
 */
function generateRecoverySuggestions(result: ConflictDetectionResult): void {
  if (!result.hasConflicts) {
    return;
  }

  // Group conflicts by type
  // 按类型分组冲突
  const conflictsByType = new Map<ConflictType, ProjectConflict[]>();
  for (const conflict of result.conflicts) {
    if (!conflictsByType.has(conflict.type)) {
      conflictsByType.set(conflict.type, []);
    }
    conflictsByType.get(conflict.type)!.push(conflict);
  }

  // Generate suggestions for each conflict type
  // 为每种冲突类型生成建议
  for (const [conflictType, conflicts] of conflictsByType) {
    switch (conflictType) {
      case ConflictType.TIME_ANOMALY:
        result.recoverySuggestions.push({
          type: SuggestionType.MANUAL_REVIEW,
          priority: SuggestionPriority.MEDIUM,
          action: "Review tasks with time anomalies",
          steps: [
            "Check if tasks were created in the correct project context",
            "Verify task creation timestamps",
            "Consider if tasks belong to different projects"
          ],
          expectedOutcome: "Clarify task ownership and project context"
        });
        break;

      case ConflictType.PATH_MISMATCH:
        result.recoverySuggestions.push({
          type: SuggestionType.SWITCH_PROJECT,
          priority: SuggestionPriority.HIGH,
          action: "Switch to the correct project context",
          steps: [
            "Identify the correct project from file paths",
            "Switch to the appropriate project context",
            "Verify all tasks are in the correct project"
          ],
          expectedOutcome: "All tasks will be in the correct project context"
        });
        break;

      case ConflictType.CONTENT_INCONSISTENCY:
        result.recoverySuggestions.push({
          type: SuggestionType.MERGE_TASKS,
          priority: SuggestionPriority.LOW,
          action: "Review and organize task content",
          steps: [
            "Review task descriptions and content",
            "Move unrelated tasks to appropriate projects",
            "Update task descriptions to match project context"
          ],
          expectedOutcome: "Task content will be consistent with project context"
        });
        break;

      case ConflictType.PROJECT_CONTEXT_ERROR:
        result.recoverySuggestions.push({
          type: SuggestionType.BACKUP_AND_RESTORE,
          priority: SuggestionPriority.URGENT,
          action: "Backup current state and restore correct project data",
          steps: [
            "Create backup of current task list",
            "Identify correct project data source",
            "Restore tasks from correct project context",
            "Merge any valid tasks from backup"
          ],
          expectedOutcome: "Project data will be restored to correct state"
        });
        break;
    }
  }

  // Add general suggestion if confidence is low
  // 如果置信度低则添加通用建议
  if (result.confidenceScore < 0.5) {
    result.recoverySuggestions.push({
      type: SuggestionType.MANUAL_REVIEW,
      priority: SuggestionPriority.HIGH,
      action: "Comprehensive project context review",
      steps: [
        "Review all tasks and their project context",
        "Check if you're working in the correct project",
        "Consider backing up and switching projects",
        "Verify file paths and task content"
      ],
      expectedOutcome: "Clear understanding of correct project context"
    });
  }
}
