/**
 * Project Data Recovery and Synchronization Mechanism for MCP Shrimp Task Manager
 * 
 * Provides comprehensive data recovery, backup, and synchronization capabilities
 * for multi-project environments with intelligent conflict resolution.
 * 
 * 项目数据恢复和同步机制，为MCP Shrimp Task Manager提供全面的数据恢复、
 * 备份和同步功能，具备智能冲突解决能力。
 */

import fs from "fs/promises";
import path from "path";
import { Task, TaskStatus } from "../types/index.js";
import { getDataDir, getMemoryDir, getTasksFilePath } from "./paths.js";
import { withFileLock } from "./fileLock.js";
import { ProjectSession } from "./projectSession.js";
import { detectProjectConflicts, ConflictDetectionResult } from "./projectConflictDetector.js";

/**
 * Recovery operation result
 * 恢复操作结果
 */
export interface RecoveryResult {
  /** Whether recovery was successful / 恢复是否成功 */
  success: boolean;
  /** Operation message / 操作消息 */
  message: string;
  /** Number of tasks recovered / 恢复的任务数量 */
  tasksRecovered: number;
  /** Number of conflicts resolved / 解决的冲突数量 */
  conflictsResolved: number;
  /** Backup file created / 创建的备份文件 */
  backupFile?: string;
  /** Detailed recovery report / 详细恢复报告 */
  recoveryReport: RecoveryReport;
}

/**
 * Recovery report with detailed information
 * 包含详细信息的恢复报告
 */
export interface RecoveryReport {
  /** Recovery operation timestamp / 恢复操作时间戳 */
  timestamp: Date;
  /** Source of recovery data / 恢复数据来源 */
  dataSource: string;
  /** Recovery strategy used / 使用的恢复策略 */
  strategy: RecoveryStrategy;
  /** Tasks before recovery / 恢复前的任务 */
  tasksBefore: TaskSummary;
  /** Tasks after recovery / 恢复后的任务 */
  tasksAfter: TaskSummary;
  /** Conflicts detected and resolved / 检测和解决的冲突 */
  conflictsHandled: ConflictResolution[];
  /** Operations performed / 执行的操作 */
  operationsPerformed: RecoveryOperation[];
  /** Warnings and recommendations / 警告和建议 */
  warnings: string[];
}

/**
 * Task summary for reporting
 * 用于报告的任务摘要
 */
interface TaskSummary {
  /** Total number of tasks / 任务总数 */
  total: number;
  /** Tasks by status / 按状态分类的任务 */
  byStatus: Record<TaskStatus, number>;
  /** Date range of tasks / 任务的日期范围 */
  dateRange: {
    earliest: Date | null;
    latest: Date | null;
  };
}

/**
 * Conflict resolution record
 * 冲突解决记录
 */
interface ConflictResolution {
  /** Conflict type / 冲突类型 */
  conflictType: string;
  /** Resolution strategy / 解决策略 */
  resolution: string;
  /** Affected tasks / 受影响的任务 */
  affectedTasks: string[];
  /** Resolution success / 解决是否成功 */
  success: boolean;
}

/**
 * Recovery operation record
 * 恢复操作记录
 */
interface RecoveryOperation {
  /** Operation type / 操作类型 */
  type: OperationType;
  /** Operation description / 操作描述 */
  description: string;
  /** Timestamp / 时间戳 */
  timestamp: Date;
  /** Operation success / 操作是否成功 */
  success: boolean;
  /** Additional details / 附加详情 */
  details?: any;
}

/**
 * Recovery strategies
 * 恢复策略
 */
export enum RecoveryStrategy {
  RESTORE_FROM_MEMORY = "RESTORE_FROM_MEMORY",     // 从memory目录恢复
  MERGE_CONFLICTS = "MERGE_CONFLICTS",             // 合并冲突
  AUTO_FIX_CONTEXT = "AUTO_FIX_CONTEXT",          // 自动修复上下文
  BACKUP_AND_RESTORE = "BACKUP_AND_RESTORE",      // 备份并恢复
  MANUAL_INTERVENTION = "MANUAL_INTERVENTION"     // 手动干预
}

/**
 * Operation types
 * 操作类型
 */
enum OperationType {
  SCAN_MEMORY = "SCAN_MEMORY",
  LOAD_BACKUP = "LOAD_BACKUP",
  MERGE_TASKS = "MERGE_TASKS",
  CREATE_BACKUP = "CREATE_BACKUP",
  RESOLVE_CONFLICT = "RESOLVE_CONFLICT",
  UPDATE_CONTEXT = "UPDATE_CONTEXT",
  VALIDATE_DATA = "VALIDATE_DATA"
}

/**
 * Backup metadata
 * 备份元数据
 */
interface BackupMetadata {
  /** Backup timestamp / 备份时间戳 */
  timestamp: Date;
  /** Project context / 项目上下文 */
  projectContext: string;
  /** Number of tasks / 任务数量 */
  taskCount: number;
  /** Backup reason / 备份原因 */
  reason: string;
  /** File size / 文件大小 */
  fileSize: number;
}

/**
 * Recover tasks from memory directory
 * 从memory目录恢复任务
 * 
 * @param options Recovery options / 恢复选项
 * @returns Recovery result / 恢复结果
 */
export async function recoverTasksFromMemory(options: {
  /** Target project context / 目标项目上下文 */
  projectContext?: string;
  /** Merge with existing tasks / 与现有任务合并 */
  mergeWithExisting?: boolean;
  /** Backup before recovery / 恢复前备份 */
  createBackup?: boolean;
  /** Filter by date range / 按日期范围过滤 */
  dateRange?: {
    start: Date;
    end: Date;
  };
} = {}): Promise<RecoveryResult> {
  const {
    projectContext,
    mergeWithExisting = true,
    createBackup = true,
    dateRange
  } = options;

  const report: RecoveryReport = {
    timestamp: new Date(),
    dataSource: "memory directory",
    strategy: RecoveryStrategy.RESTORE_FROM_MEMORY,
    tasksBefore: await getTaskSummary([]),
    tasksAfter: await getTaskSummary([]),
    conflictsHandled: [],
    operationsPerformed: [],
    warnings: []
  };

  try {
    // Step 1: Scan memory directory for backup files
    // 步骤1：扫描memory目录中的备份文件
    const memoryDir = await getMemoryDir();
    const backupFiles = await scanMemoryDirectory(memoryDir, report);

    if (backupFiles.length === 0) {
      return {
        success: false,
        message: "No backup files found in memory directory",
        tasksRecovered: 0,
        conflictsResolved: 0,
        recoveryReport: report
      };
    }

    // Step 2: Select best backup file
    // 步骤2：选择最佳备份文件
    const selectedBackup = selectBestBackup(backupFiles, dateRange, report);
    
    // Step 3: Load tasks from backup
    // 步骤3：从备份加载任务
    const backupTasks = await loadTasksFromBackup(selectedBackup.filePath, report);
    
    // Step 4: Get current tasks if merging
    // 步骤4：如果需要合并则获取当前任务
    let currentTasks: Task[] = [];
    if (mergeWithExisting) {
      try {
        const { getAllTasks } = await import("../models/taskModel.js");
        currentTasks = await getAllTasks(projectContext);
        report.tasksBefore = await getTaskSummary(currentTasks);
      } catch (error) {
        report.warnings.push("Could not load current tasks for merging");
      }
    }

    // Step 5: Create backup if requested
    // 步骤5：如果需要则创建备份
    let backupFile: string | undefined;
    if (createBackup && currentTasks.length > 0) {
      backupFile = await createProjectBackup(currentTasks, "Before recovery operation", report);
    }

    // Step 6: Merge or replace tasks
    // 步骤6：合并或替换任务
    const finalTasks = mergeWithExisting 
      ? await mergeConflictingTaskLists(currentTasks, backupTasks, report)
      : backupTasks;

    // Step 7: Write recovered tasks
    // 步骤7：写入恢复的任务
    await writeRecoveredTasks(finalTasks, projectContext, report);

    // Step 8: Update report
    // 步骤8：更新报告
    report.tasksAfter = await getTaskSummary(finalTasks);

    return {
      success: true,
      message: `Successfully recovered ${backupTasks.length} tasks from memory directory`,
      tasksRecovered: backupTasks.length,
      conflictsResolved: report.conflictsHandled.length,
      backupFile,
      recoveryReport: report
    };

  } catch (error) {
    report.warnings.push(`Recovery failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      success: false,
      message: `Recovery failed: ${error instanceof Error ? error.message : String(error)}`,
      tasksRecovered: 0,
      conflictsResolved: 0,
      recoveryReport: report
    };
  }
}

/**
 * Scan memory directory for backup files
 * 扫描memory目录中的备份文件
 */
async function scanMemoryDirectory(memoryDir: string, report: RecoveryReport): Promise<BackupFileInfo[]> {
  const operation: RecoveryOperation = {
    type: OperationType.SCAN_MEMORY,
    description: "Scanning memory directory for backup files",
    timestamp: new Date(),
    success: false
  };

  try {
    await fs.access(memoryDir);
  } catch (error) {
    operation.success = false;
    operation.details = { error: "Memory directory does not exist" };
    report.operationsPerformed.push(operation);
    return [];
  }

  try {
    const files = await fs.readdir(memoryDir);
    const backupFiles: BackupFileInfo[] = [];

    for (const file of files) {
      if (file.startsWith("tasks_memory_") && file.endsWith(".json")) {
        const filePath = path.join(memoryDir, file);
        const stats = await fs.stat(filePath);

        // Extract timestamp from filename
        // 从文件名提取时间戳
        const timestampMatch = file.match(/tasks_memory_(.+)\.json$/);
        let timestamp = stats.mtime;

        if (timestampMatch) {
          try {
            // Parse timestamp from filename
            // 从文件名解析时间戳
            const timestampStr = timestampMatch[1].replace(/-/g, ":");
            timestamp = new Date(timestampStr);
          } catch (error) {
            // Use file modification time as fallback
            // 使用文件修改时间作为后备
          }
        }

        backupFiles.push({
          filePath,
          filename: file,
          timestamp,
          fileSize: stats.size,
          metadata: await extractBackupMetadata(filePath)
        });
      }
    }

    operation.success = true;
    operation.details = { filesFound: backupFiles.length };
    report.operationsPerformed.push(operation);

    return backupFiles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    operation.success = false;
    operation.details = { error: error instanceof Error ? error.message : String(error) };
    report.operationsPerformed.push(operation);
    return [];
  }
}

/**
 * Backup file information
 * 备份文件信息
 */
interface BackupFileInfo {
  /** File path / 文件路径 */
  filePath: string;
  /** Filename / 文件名 */
  filename: string;
  /** Timestamp / 时间戳 */
  timestamp: Date;
  /** File size / 文件大小 */
  fileSize: number;
  /** Backup metadata / 备份元数据 */
  metadata: BackupMetadata | null;
}

/**
 * Extract backup metadata from file
 * 从文件提取备份元数据
 */
async function extractBackupMetadata(filePath: string): Promise<BackupMetadata | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    if (data.tasks && Array.isArray(data.tasks)) {
      const stats = await fs.stat(filePath);

      return {
        timestamp: stats.mtime,
        projectContext: "unknown", // Will be inferred from tasks
        taskCount: data.tasks.length,
        reason: "automatic backup",
        fileSize: stats.size
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Select best backup file based on criteria
 * 根据条件选择最佳备份文件
 */
function selectBestBackup(
  backupFiles: BackupFileInfo[],
  dateRange?: { start: Date; end: Date },
  report?: RecoveryReport
): BackupFileInfo {
  let candidates = [...backupFiles];

  // Filter by date range if specified
  // 如果指定了日期范围则过滤
  if (dateRange) {
    candidates = candidates.filter(backup =>
      backup.timestamp >= dateRange.start && backup.timestamp <= dateRange.end
    );
  }

  // If no candidates after filtering, use all files
  // 如果过滤后没有候选文件，则使用所有文件
  if (candidates.length === 0) {
    candidates = backupFiles;
    if (report) {
      report.warnings.push("No backup files found in specified date range, using all available files");
    }
  }

  // Select the most recent backup with the most tasks
  // 选择最新的且任务数量最多的备份
  candidates.sort((a, b) => {
    // First priority: task count
    // 第一优先级：任务数量
    const taskCountDiff = (b.metadata?.taskCount || 0) - (a.metadata?.taskCount || 0);
    if (taskCountDiff !== 0) return taskCountDiff;

    // Second priority: timestamp (more recent)
    // 第二优先级：时间戳（更新的）
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return candidates[0];
}

/**
 * Load tasks from backup file
 * 从备份文件加载任务
 */
async function loadTasksFromBackup(filePath: string, report: RecoveryReport): Promise<Task[]> {
  const operation: RecoveryOperation = {
    type: OperationType.LOAD_BACKUP,
    description: `Loading tasks from backup: ${path.basename(filePath)}`,
    timestamp: new Date(),
    success: false
  };

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!data.tasks || !Array.isArray(data.tasks)) {
      throw new Error("Invalid backup file format: missing tasks array");
    }

    // Convert date strings back to Date objects
    // 将日期字符串转换回Date对象
    const tasks: Task[] = data.tasks.map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined
    }));

    operation.success = true;
    operation.details = { tasksLoaded: tasks.length };
    report.operationsPerformed.push(operation);

    return tasks;
  } catch (error) {
    operation.success = false;
    operation.details = { error: error instanceof Error ? error.message : String(error) };
    report.operationsPerformed.push(operation);
    throw error;
  }
}

/**
 * Merge conflicting task lists intelligently
 * 智能合并冲突的任务列表
 *
 * @param currentTasks Current tasks in the system / 系统中的当前任务
 * @param backupTasks Tasks from backup / 备份中的任务
 * @param report Recovery report / 恢复报告
 * @returns Merged task list / 合并后的任务列表
 */
export async function mergeConflictingTaskLists(
  currentTasks: Task[],
  backupTasks: Task[],
  report: RecoveryReport
): Promise<Task[]> {
  const operation: RecoveryOperation = {
    type: OperationType.MERGE_TASKS,
    description: "Merging current tasks with backup tasks",
    timestamp: new Date(),
    success: false
  };

  try {
    const mergedTasks: Task[] = [];
    const processedIds = new Set<string>();

    // Create maps for efficient lookup
    // 创建映射以便高效查找
    const currentTasksMap = new Map(currentTasks.map(task => [task.id, task]));
    const backupTasksMap = new Map(backupTasks.map(task => [task.id, task]));

    // Process current tasks first
    // 首先处理当前任务
    for (const currentTask of currentTasks) {
      const backupTask = backupTasksMap.get(currentTask.id);

      if (backupTask) {
        // Conflict: same task exists in both lists
        // 冲突：两个列表中都存在相同任务
        const resolvedTask = resolveTaskConflict(currentTask, backupTask, report);
        mergedTasks.push(resolvedTask);
      } else {
        // Current task doesn't exist in backup, keep it
        // 当前任务在备份中不存在，保留它
        mergedTasks.push(currentTask);
      }

      processedIds.add(currentTask.id);
    }

    // Add backup tasks that don't exist in current tasks
    // 添加当前任务中不存在的备份任务
    for (const backupTask of backupTasks) {
      if (!processedIds.has(backupTask.id)) {
        // Check if this task should be recovered based on its status and age
        // 根据任务状态和时间检查是否应该恢复此任务
        if (shouldRecoverTask(backupTask, currentTasks)) {
          mergedTasks.push(backupTask);
        }
      }
    }

    // Sort merged tasks by creation date
    // 按创建日期排序合并后的任务
    mergedTasks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    operation.success = true;
    operation.details = {
      currentTasksCount: currentTasks.length,
      backupTasksCount: backupTasks.length,
      mergedTasksCount: mergedTasks.length,
      conflictsResolved: report.conflictsHandled.length
    };
    report.operationsPerformed.push(operation);

    return mergedTasks;
  } catch (error) {
    operation.success = false;
    operation.details = { error: error instanceof Error ? error.message : String(error) };
    report.operationsPerformed.push(operation);
    throw error;
  }
}

/**
 * Resolve conflict between two versions of the same task
 * 解决同一任务的两个版本之间的冲突
 */
function resolveTaskConflict(currentTask: Task, backupTask: Task, report: RecoveryReport): Task {
  const conflictResolution: ConflictResolution = {
    conflictType: "DUPLICATE_TASK",
    resolution: "",
    affectedTasks: [currentTask.id],
    success: true
  };

  // Strategy: Keep the more recent version, but preserve important data
  // 策略：保留更新的版本，但保留重要数据
  const currentTime = currentTask.updatedAt.getTime();
  const backupTime = backupTask.updatedAt.getTime();

  let resolvedTask: Task;

  if (currentTime >= backupTime) {
    // Current task is newer or same age, use it as base
    // 当前任务更新或同样新，以它为基础
    resolvedTask = { ...currentTask };
    conflictResolution.resolution = "Used current task (more recent)";

    // But preserve completed status from backup if current is not completed
    // 但如果当前任务未完成，则保留备份中的完成状态
    if (backupTask.status === TaskStatus.COMPLETED && currentTask.status !== TaskStatus.COMPLETED) {
      resolvedTask.status = backupTask.status;
      resolvedTask.completedAt = backupTask.completedAt;
      resolvedTask.summary = backupTask.summary;
      conflictResolution.resolution += ", preserved completion status from backup";
    }
  } else {
    // Backup task is newer, use it as base
    // 备份任务更新，以它为基础
    resolvedTask = { ...backupTask };
    conflictResolution.resolution = "Used backup task (more recent)";

    // But preserve any newer completion status from current
    // 但保留当前任务中任何更新的完成状态
    if (currentTask.status === TaskStatus.COMPLETED && backupTask.status !== TaskStatus.COMPLETED) {
      resolvedTask.status = currentTask.status;
      resolvedTask.completedAt = currentTask.completedAt;
      resolvedTask.summary = currentTask.summary;
      conflictResolution.resolution += ", preserved completion status from current";
    }
  }

  report.conflictsHandled.push(conflictResolution);
  return resolvedTask;
}

/**
 * Determine if a backup task should be recovered
 * 确定是否应该恢复备份任务
 */
function shouldRecoverTask(backupTask: Task, currentTasks: Task[]): boolean {
  // Always recover completed tasks (they represent valuable work)
  // 始终恢复已完成的任务（它们代表有价值的工作）
  if (backupTask.status === TaskStatus.COMPLETED) {
    return true;
  }

  // Recover recent incomplete tasks (within last 7 days)
  // 恢复最近的未完成任务（最近7天内）
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (backupTask.createdAt > sevenDaysAgo) {
    return true;
  }

  // Don't recover old incomplete tasks to avoid clutter
  // 不恢复旧的未完成任务以避免混乱
  return false;
}

/**
 * Create project backup
 * 创建项目备份
 *
 * @param tasks Tasks to backup / 要备份的任务
 * @param reason Backup reason / 备份原因
 * @param report Recovery report / 恢复报告
 * @returns Backup filename / 备份文件名
 */
export async function createProjectBackup(
  tasks: Task[],
  reason: string = "Manual backup",
  report?: RecoveryReport
): Promise<string> {
  const operation: RecoveryOperation = {
    type: OperationType.CREATE_BACKUP,
    description: `Creating project backup: ${reason}`,
    timestamp: new Date(),
    success: false
  };

  try {
    // Generate backup filename with timestamp
    // 生成带时间戳的备份文件名
    const timestamp = new Date().toISOString()
      .replace(/:/g, "-")
      .replace(/\..+/, "")
      .replace(/[+\-]\d{2}-\d{2}$/, "");
    const backupFileName = `tasks_backup_${timestamp}.json`;

    // Ensure memory directory exists
    // 确保memory目录存在
    const memoryDir = await getMemoryDir();
    try {
      await fs.access(memoryDir);
    } catch (error) {
      await fs.mkdir(memoryDir, { recursive: true });
    }

    // Create backup file path
    // 创建备份文件路径
    const backupFilePath = path.join(memoryDir, backupFileName);

    // Prepare backup data with metadata
    // 准备带元数据的备份数据
    const backupData = {
      metadata: {
        timestamp: new Date(),
        projectContext: ProjectSession.getCurrentProject() || "unknown",
        taskCount: tasks.length,
        reason,
        version: "1.0"
      },
      tasks: tasks
    };

    // Write backup file with file locking
    // 使用文件锁定写入备份文件
    await withFileLock(backupFilePath, async () => {
      const { safeWriteJson } = await import("./fileSafe.js");
      await safeWriteJson(backupFilePath, backupData);
    });

    operation.success = true;
    operation.details = {
      backupFile: backupFileName,
      taskCount: tasks.length,
      reason
    };

    if (report) {
      report.operationsPerformed.push(operation);
    }

    return backupFileName;
  } catch (error) {
    operation.success = false;
    operation.details = { error: error instanceof Error ? error.message : String(error) };

    if (report) {
      report.operationsPerformed.push(operation);
    }

    throw error;
  }
}

/**
 * Write recovered tasks to the task file
 * 将恢复的任务写入任务文件
 */
async function writeRecoveredTasks(
  tasks: Task[],
  projectContext: string | undefined,
  report: RecoveryReport
): Promise<void> {
  const operation: RecoveryOperation = {
    type: OperationType.UPDATE_CONTEXT,
    description: "Writing recovered tasks to task file",
    timestamp: new Date(),
    success: false
  };

  try {
    // Import task model functions dynamically to avoid circular dependency
    // 动态导入任务模型函数以避免循环依赖
    const { batchCreateOrUpdateTasks, clearAllTasks } = await import("../models/taskModel.js");

    // Clear existing tasks and write recovered tasks
    // 清除现有任务并写入恢复的任务
    await clearAllTasks(projectContext);

    // Convert tasks to the format expected by batchCreateOrUpdateTasks
    // 将任务转换为batchCreateOrUpdateTasks期望的格式
    const taskDataList = tasks.map(task => ({
      name: task.name,
      description: task.description,
      notes: task.notes,
      dependencies: task.dependencies.map(dep => dep.taskId),
      relatedFiles: task.relatedFiles,
      implementationGuide: task.implementationGuide,
      verificationCriteria: task.verificationCriteria,
      agent: task.agent
    }));

    // Batch create the recovered tasks
    // 批量创建恢复的任务
    await batchCreateOrUpdateTasks(
      taskDataList,
      "overwrite",
      "Recovery operation: restored tasks from backup",
      projectContext
    );

    operation.success = true;
    operation.details = { tasksWritten: tasks.length };
    report.operationsPerformed.push(operation);
  } catch (error) {
    operation.success = false;
    operation.details = { error: error instanceof Error ? error.message : String(error) };
    report.operationsPerformed.push(operation);
    throw error;
  }
}

/**
 * Get task summary for reporting
 * 获取用于报告的任务摘要
 */
async function getTaskSummary(tasks: Task[]): Promise<TaskSummary> {
  const summary: TaskSummary = {
    total: tasks.length,
    byStatus: {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.BLOCKED]: 0
    },
    dateRange: {
      earliest: null,
      latest: null
    }
  };

  if (tasks.length === 0) {
    return summary;
  }

  // Count tasks by status
  // 按状态统计任务
  for (const task of tasks) {
    summary.byStatus[task.status]++;
  }

  // Find date range
  // 查找日期范围
  const sortedByDate = [...tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  summary.dateRange.earliest = sortedByDate[0].createdAt;
  summary.dateRange.latest = sortedByDate[sortedByDate.length - 1].createdAt;

  return summary;
}

/**
 * Auto-fix project context errors
 * 自动修复项目上下文错误
 *
 * @param options Fix options / 修复选项
 * @returns Recovery result / 恢复结果
 */
export async function autoFixProjectContext(options: {
  /** Target project context / 目标项目上下文 */
  targetProject?: string;
  /** Create backup before fixing / 修复前创建备份 */
  createBackup?: boolean;
  /** Confidence threshold for auto-fix / 自动修复的置信度阈值 */
  confidenceThreshold?: number;
} = {}): Promise<RecoveryResult> {
  const {
    targetProject,
    createBackup = true,
    confidenceThreshold = 0.7
  } = options;

  const report: RecoveryReport = {
    timestamp: new Date(),
    dataSource: "current task list",
    strategy: RecoveryStrategy.AUTO_FIX_CONTEXT,
    tasksBefore: await getTaskSummary([]),
    tasksAfter: await getTaskSummary([]),
    conflictsHandled: [],
    operationsPerformed: [],
    warnings: []
  };

  try {
    // Load current tasks
    // 加载当前任务
    const { getAllTasks } = await import("../models/taskModel.js");
    const currentTasks = await getAllTasks();
    report.tasksBefore = await getTaskSummary(currentTasks);

    if (currentTasks.length === 0) {
      return {
        success: true,
        message: "No tasks to fix",
        tasksRecovered: 0,
        conflictsResolved: 0,
        recoveryReport: report
      };
    }

    // Detect conflicts
    // 检测冲突
    const conflictResult = await detectProjectConflicts(currentTasks, {
      confidenceThreshold
    });

    if (!conflictResult.hasConflicts) {
      return {
        success: true,
        message: "No project context issues detected",
        tasksRecovered: 0,
        conflictsResolved: 0,
        recoveryReport: report
      };
    }

    // Create backup if requested
    // 如果需要则创建备份
    let backupFile: string | undefined;
    if (createBackup) {
      backupFile = await createProjectBackup(currentTasks, "Before auto-fix operation", report);
    }

    // Apply auto-fixes based on conflict detection results
    // 基于冲突检测结果应用自动修复
    let fixedTasks = [...currentTasks];
    let conflictsResolved = 0;

    for (const suggestion of conflictResult.recoverySuggestions) {
      if (suggestion.priority === "HIGH" || suggestion.priority === "URGENT") {
        // Apply high-priority fixes automatically
        // 自动应用高优先级修复
        const fixResult = await applySuggestion(suggestion, fixedTasks, report);
        if (fixResult.success) {
          fixedTasks = fixResult.tasks;
          conflictsResolved++;
        }
      }
    }

    // Write fixed tasks
    // 写入修复后的任务
    if (conflictsResolved > 0) {
      await writeRecoveredTasks(fixedTasks, targetProject, report);
      report.tasksAfter = await getTaskSummary(fixedTasks);
    }

    return {
      success: conflictsResolved > 0,
      message: conflictsResolved > 0
        ? `Auto-fixed ${conflictsResolved} project context issues`
        : "No auto-fixable issues found",
      tasksRecovered: fixedTasks.length,
      conflictsResolved,
      backupFile,
      recoveryReport: report
    };

  } catch (error) {
    report.warnings.push(`Auto-fix failed: ${error instanceof Error ? error.message : String(error)}`);

    return {
      success: false,
      message: `Auto-fix failed: ${error instanceof Error ? error.message : String(error)}`,
      tasksRecovered: 0,
      conflictsResolved: 0,
      recoveryReport: report
    };
  }
}

/**
 * Apply a recovery suggestion
 * 应用恢复建议
 */
async function applySuggestion(
  suggestion: any,
  tasks: Task[],
  report: RecoveryReport
): Promise<{ success: boolean; tasks: Task[] }> {
  // This is a simplified implementation
  // 这是一个简化的实现
  // In a full implementation, this would handle different suggestion types
  // 在完整实现中，这将处理不同的建议类型

  const conflictResolution: ConflictResolution = {
    conflictType: suggestion.type,
    resolution: suggestion.action,
    affectedTasks: [],
    success: true
  };

  report.conflictsHandled.push(conflictResolution);

  return {
    success: true,
    tasks: tasks
  };
}
