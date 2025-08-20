/**
 * 轻量级工作流管理器
 * Lightweight workflow manager
 */

import {
  WorkflowContext,
  WorkflowStep,
  WorkflowStatus,
  WorkflowContinuation,
  SimpleWorkflowResult,
  ToolStateTransfer,
  WorkflowMonitoring
} from "../types/workflow.js";
import { v4 as uuidv4 } from "uuid";

/**
 * 简化的工作流管理器
 * Simplified workflow manager
 */
export class SimpleWorkflowManager {
  private static workflows = new Map<string, WorkflowContext>();
  private static stateTransfers = new Map<string, ToolStateTransfer[]>();

  /**
   * 创建新的工作流上下文
   * Create new workflow context
   */
  static createWorkflow(taskId: string, project: string, steps: string[]): WorkflowContext {
    const workflowId = uuidv4();
    const now = new Date();
    
    const workflowSteps: WorkflowStep[] = steps.map((stepName, index) => ({
      id: `${workflowId}-step-${index}`,
      name: stepName,
      tool: stepName,
      status: index === 0 ? WorkflowStatus.IN_PROGRESS : WorkflowStatus.PENDING
    }));

    const workflow: WorkflowContext = {
      workflowId,
      taskId,
      project,
      currentStep: 0,
      steps: workflowSteps,
      status: WorkflowStatus.IN_PROGRESS,
      metadata: {},
      createdAt: now,
      updatedAt: now
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }  /**
   * 获取工作流上下文
   * Get workflow context
   */
  static getWorkflow(workflowId: string): WorkflowContext | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * 根据任务ID查找工作流
   * Find workflow by task ID
   */
  static findWorkflowByTaskId(taskId: string): WorkflowContext | undefined {
    for (const workflow of this.workflows.values()) {
      if (workflow.taskId === taskId) {
        return workflow;
      }
    }
    return undefined;
  }

  /**
   * 更新工作流步骤状态
   * Update workflow step status
   */
  static updateStepStatus(
    workflowId: string,
    stepIndex: number,
    status: WorkflowStatus,
    output?: any,
    error?: string
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || stepIndex >= workflow.steps.length) {
      return false;
    }

    const step = workflow.steps[stepIndex];
    const now = new Date();

    // 更新步骤状态
    step.status = status;
    step.output = output;
    step.error = error;

    if (status === WorkflowStatus.IN_PROGRESS && !step.startTime) {
      step.startTime = now;
    }

    if (status === WorkflowStatus.COMPLETED || status === WorkflowStatus.FAILED) {
      step.endTime = now;
      if (step.startTime) {
        step.duration = now.getTime() - step.startTime.getTime();
      }
    }

    // 更新工作流状态
    workflow.updatedAt = now;
    
    if (status === WorkflowStatus.COMPLETED && stepIndex === workflow.steps.length - 1) {
      // 最后一步完成，工作流完成
      workflow.status = WorkflowStatus.COMPLETED;
    } else if (status === WorkflowStatus.FAILED) {
      // 步骤失败，工作流暂停
      workflow.status = WorkflowStatus.PAUSED;
    } else if (status === WorkflowStatus.COMPLETED && stepIndex < workflow.steps.length - 1) {
      // 当前步骤完成，移动到下一步
      workflow.currentStep = stepIndex + 1;
      workflow.steps[stepIndex + 1].status = WorkflowStatus.IN_PROGRESS;
    }

    return true;
  }  /**
   * 记录工具间状态传递
   * Record inter-tool state transfer
   */
  static recordStateTransfer(
    workflowId: string,
    sourceToolId: string,
    targetToolId: string,
    data: Record<string, any>
  ): void {
    const workflow = this.workflows.get(workflowId);
    const transfer: ToolStateTransfer = {
      sourceToolId,
      targetToolId,
      data,
      timestamp: new Date(),
      workflowContext: workflow
    };

    if (!this.stateTransfers.has(workflowId)) {
      this.stateTransfers.set(workflowId, []);
    }
    
    this.stateTransfers.get(workflowId)!.push(transfer);
  }

  /**
   * 获取状态传递历史
   * Get state transfer history
   */
  static getStateTransferHistory(workflowId: string): ToolStateTransfer[] {
    return this.stateTransfers.get(workflowId) || [];
  }

  /**
   * 生成工作流继续指导
   * Generate workflow continuation guidance
   */
  static generateContinuation(workflowId: string): WorkflowContinuation {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        shouldProceed: false,
        reason: "Workflow not found",
        fallbackAction: "Create new workflow"
      };
    }

    const currentStep = workflow.steps[workflow.currentStep];
    if (!currentStep) {
      return {
        shouldProceed: false,
        reason: "No current step found",
        fallbackAction: "Review workflow configuration"
      };
    }

    if (currentStep.status === WorkflowStatus.FAILED) {
      return {
        shouldProceed: false,
        reason: `Step "${currentStep.name}" failed: ${currentStep.error}`,
        fallbackAction: "Fix issues and retry step"
      };
    }

    if (workflow.currentStep >= workflow.steps.length - 1) {
      return {
        shouldProceed: false,
        reason: "Workflow completed",
        fallbackAction: "Start new workflow if needed"
      };
    }

    const nextStep = workflow.steps[workflow.currentStep + 1];
    return {
      shouldProceed: true,
      nextTool: nextStep.tool,
      nextToolParams: {
        taskId: workflow.taskId,
        project: workflow.project,
        workflowId: workflow.workflowId
      },
      reason: `Ready to proceed to step "${nextStep.name}"`,
      conditions: [`Current step "${currentStep.name}" must be completed`]
    };
  }  /**
   * 获取工作流监控数据
   * Get workflow monitoring data
   */
  static getMonitoringData(workflowId: string): WorkflowMonitoring | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return null;
    }

    const completedSteps = workflow.steps.filter(s => s.status === WorkflowStatus.COMPLETED).length;
    const failedSteps = workflow.steps.filter(s => s.status === WorkflowStatus.FAILED).length;
    
    const stepDurations = workflow.steps
      .filter(s => s.duration !== undefined)
      .map(s => s.duration!);
    
    const averageStepDuration = stepDurations.length > 0 
      ? stepDurations.reduce((a, b) => a + b, 0) / stepDurations.length 
      : 0;

    const totalDuration = workflow.updatedAt.getTime() - workflow.createdAt.getTime();
    const errorRate = workflow.steps.length > 0 ? failedSteps / workflow.steps.length : 0;

    return {
      workflowId,
      totalSteps: workflow.steps.length,
      completedSteps,
      failedSteps,
      averageStepDuration,
      totalDuration,
      errorRate,
      lastActivity: workflow.updatedAt
    };
  }

  /**
   * 清理过期的工作流
   * Clean up expired workflows
   */
  static cleanupExpiredWorkflows(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = new Date();
    let cleanedCount = 0;

    for (const [workflowId, workflow] of this.workflows.entries()) {
      const age = now.getTime() - workflow.updatedAt.getTime();
      if (age > maxAgeMs && (workflow.status === WorkflowStatus.COMPLETED || workflow.status === WorkflowStatus.FAILED)) {
        this.workflows.delete(workflowId);
        this.stateTransfers.delete(workflowId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * 获取所有活跃工作流
   * Get all active workflows
   */
  static getActiveWorkflows(): WorkflowContext[] {
    return Array.from(this.workflows.values()).filter(
      w => w.status === WorkflowStatus.IN_PROGRESS || w.status === WorkflowStatus.PAUSED
    );
  }

  /**
   * 创建简化的工作流结果
   * Create simplified workflow result
   */
  static createResult(
    success: boolean,
    message: string,
    data?: any,
    nextAction?: WorkflowContinuation,
    metadata?: Record<string, any>
  ): SimpleWorkflowResult {
    return {
      success,
      message,
      data,
      nextAction,
      metadata
    };
  }
}