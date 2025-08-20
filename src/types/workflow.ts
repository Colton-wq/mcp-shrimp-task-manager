/**
 * 简化的工作流相关类型定义
 * Simplified workflow-related type definitions
 */

/**
 * 工作流状态
 * Workflow status
 */
export enum WorkflowStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress", 
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused"
}

/**
 * 工作流步骤
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  status: WorkflowStatus;
  input?: Record<string, any>;
  output?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

/**
 * 工作流上下文
 * Workflow context
 */
export interface WorkflowContext {
  workflowId: string;
  taskId: string;
  project: string;
  currentStep: number;
  steps: WorkflowStep[];
  status: WorkflowStatus;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工具间状态传递数据
 * Inter-tool state transfer data
 */
export interface ToolStateTransfer {
  sourceToolId: string;
  targetToolId: string;
  data: Record<string, any>;
  timestamp: Date;
  workflowContext?: WorkflowContext;
}

/**
 * 工作流继续指导
 * Workflow continuation guidance
 */
export interface WorkflowContinuation {
  shouldProceed: boolean;
  nextTool?: string;
  nextToolParams?: Record<string, any>;
  reason?: string;
  conditions?: string[];
  fallbackAction?: string;
}

/**
 * 简化的工作流结果
 * Simplified workflow result
 */
export interface SimpleWorkflowResult {
  success: boolean;
  message: string;
  data?: any;
  nextAction?: WorkflowContinuation;
  metadata?: Record<string, any>;
}

/**
 * 工作流监控数据
 * Workflow monitoring data
 */
export interface WorkflowMonitoring {
  workflowId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  averageStepDuration: number;
  totalDuration: number;
  errorRate: number;
  lastActivity: Date;
}