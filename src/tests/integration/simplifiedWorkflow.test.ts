/**
 * 简化工作流集成测试
 * Simplified workflow integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";

describe("Simplified Workflow Integration", () => {
  const testTaskId = "test-task-123";
  const testProject = "test-project";
  
  beforeEach(() => {
    // 清理测试数据
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  afterEach(() => {
    // 清理测试数据
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  it("should create workflow with standard steps", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    expect(workflow.taskId).toBe(testTaskId);
    expect(workflow.project).toBe(testProject);
    expect(workflow.steps).toHaveLength(3);
    expect(workflow.steps[0].status).toBe(WorkflowStatus.IN_PROGRESS);
    expect(workflow.steps[1].status).toBe(WorkflowStatus.PENDING);
    expect(workflow.steps[2].status).toBe(WorkflowStatus.PENDING);
  });

  it("should find workflow by task ID", () => {
    const originalWorkflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    const foundWorkflow = SimpleWorkflowManager.findWorkflowByTaskId(testTaskId);
    expect(foundWorkflow).toBeDefined();
    expect(foundWorkflow?.workflowId).toBe(originalWorkflow.workflowId);
  });

  it("should update step status and progress workflow", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    // 完成第一步
    const success = SimpleWorkflowManager.updateStepStatus(
      workflow.workflowId,
      0,
      WorkflowStatus.COMPLETED,
      { score: 85 }
    );

    expect(success).toBe(true);
    
    const updatedWorkflow = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
    expect(updatedWorkflow?.steps[0].status).toBe(WorkflowStatus.COMPLETED);
    expect(updatedWorkflow?.steps[1].status).toBe(WorkflowStatus.IN_PROGRESS);
    expect(updatedWorkflow?.currentStep).toBe(1);
  });  it("should generate correct continuation guidance", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    // 完成第一步
    SimpleWorkflowManager.updateStepStatus(
      workflow.workflowId,
      0,
      WorkflowStatus.COMPLETED
    );

    const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
    
    expect(continuation.shouldProceed).toBe(true);
    expect(continuation.nextTool).toBe("code_review_and_cleanup_tool");
    expect(continuation.nextToolParams?.taskId).toBe(testTaskId);
    expect(continuation.nextToolParams?.project).toBe(testProject);
  });

  it("should handle workflow completion", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    // 完成所有步骤
    SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
    SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.COMPLETED);
    SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 2, WorkflowStatus.COMPLETED);

    const updatedWorkflow = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
    expect(updatedWorkflow?.status).toBe(WorkflowStatus.COMPLETED);

    const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
    expect(continuation.shouldProceed).toBe(false);
    expect(continuation.reason).toContain("completed");
  });

  it("should handle step failure", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    // 第二步失败
    SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
    SimpleWorkflowManager.updateStepStatus(
      workflow.workflowId, 
      1, 
      WorkflowStatus.FAILED, 
      undefined, 
      "Quality check failed"
    );

    const updatedWorkflow = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
    expect(updatedWorkflow?.status).toBe(WorkflowStatus.PAUSED);

    const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
    expect(continuation.shouldProceed).toBe(false);
    expect(continuation.reason).toContain("failed");
  });

  it("should record and retrieve state transfers", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    const transferData = { score: 85, summary: "Task completed successfully" };
    
    SimpleWorkflowManager.recordStateTransfer(
      workflow.workflowId,
      "verify_task",
      "code_review_and_cleanup_tool",
      transferData
    );

    const history = SimpleWorkflowManager.getStateTransferHistory(workflow.workflowId);
    expect(history).toHaveLength(1);
    expect(history[0].sourceToolId).toBe("verify_task");
    expect(history[0].targetToolId).toBe("code_review_and_cleanup_tool");
    expect(history[0].data).toEqual(transferData);
  });

  it("should provide monitoring data", () => {
    const workflow = SimpleWorkflowManager.createWorkflow(
      testTaskId,
      testProject,
      ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
    );

    // 完成一些步骤
    SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
    SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.FAILED);

    const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
    
    expect(monitoring).toBeDefined();
    expect(monitoring?.totalSteps).toBe(3);
    expect(monitoring?.completedSteps).toBe(1);
    expect(monitoring?.failedSteps).toBe(1);
    expect(monitoring?.errorRate).toBeCloseTo(0.33, 2);
  });
});