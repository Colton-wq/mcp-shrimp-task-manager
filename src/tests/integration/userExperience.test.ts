/**
 * 用户体验测试
 * User experience tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createWorkflowResponse } from "../../utils/mcpResponse.js";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";

describe("User Experience Tests", () => {
  beforeEach(() => {
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  afterEach(() => {
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  describe("Response Quality", () => {
    it("should provide clear and actionable workflow guidance", () => {
      const message = "Task verification completed successfully with score 85/100";
      const workflowContinuation = {
        shouldProceed: true,
        nextTool: "code_review_and_cleanup_tool",
        nextToolParams: {
          taskId: "test-task-123",
          project: "test-project",
          reviewScope: "comprehensive",
          cleanupMode: "safe"
        },
        reason: "Quality standards met, proceeding to code review and cleanup"
      };

      const response = createWorkflowResponse(message, workflowContinuation);
      const responseText = response.content[0].text;

      // 验证响应包含关键信息
      expect(responseText).toContain("Task verification completed");
      expect(responseText).toContain("Workflow Continuation");
      expect(responseText).toContain("MANDATORY NEXT ACTION");
      expect(responseText).toContain("code_review_and_cleanup_tool");
      
      // 验证参数格式正确
      expect(responseText).toContain('taskId: "test-task-123"');
      expect(responseText).toContain('project: "test-project"');
      expect(responseText).toContain('reviewScope: "comprehensive"');
      expect(responseText).toContain('cleanupMode: "safe"');
      
      // 验证包含明确的指导
      expect(responseText).toContain("PROHIBITED ACTIONS");
      expect(responseText).toContain("MANDATORY ACTIONS");
      expect(responseText).toContain("Do NOT stop after this step");
      expect(responseText).toContain("MUST call the next tool immediately");
    });

    it("should provide helpful guidance for failed workflows", () => {
      const message = "Code review failed: multiple quality issues detected";
      const workflowContinuation = {
        shouldProceed: false,
        reason: "Quality score below threshold (65/100). Issues: code standards violations, missing tests, security vulnerabilities"
      };

      const response = createWorkflowResponse(message, workflowContinuation);
      const responseText = response.content[0].text;

      // 验证失败响应的质量
      expect(responseText).toContain("Code review failed");
      expect(responseText).toContain("Workflow paused");
      expect(responseText).toContain("Quality score below threshold");
      expect(responseText).toContain("Required Actions");
      expect(responseText).toContain("Address issues before proceeding");
    });

    it("should provide informative monitoring summaries", () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "ux-test-task",
        "ux-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 模拟工作流执行
      SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
      SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.IN_PROGRESS);

      const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
      
      expect(monitoring).toBeDefined();
      expect(monitoring!.totalSteps).toBe(3);
      expect(monitoring!.completedSteps).toBe(1);
      expect(monitoring!.failedSteps).toBe(0);
      
      // 验证监控数据的可读性
      const progressPercentage = (monitoring!.completedSteps / monitoring!.totalSteps) * 100;
      expect(progressPercentage).toBeCloseTo(33.33, 2);
    });
  });  describe("Error Handling and Recovery", () => {
    it("should provide clear error messages for invalid operations", () => {
      // 测试无效的工作流ID
      const invalidWorkflowId = "invalid-workflow-id";
      const monitoring = SimpleWorkflowManager.getMonitoringData(invalidWorkflowId);
      
      expect(monitoring).toBeNull();
      
      // 测试无效的步骤更新
      const workflow = SimpleWorkflowManager.createWorkflow(
        "error-test-task",
        "error-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );
      
      const invalidUpdate = SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        10, // 无效的步骤索引
        WorkflowStatus.COMPLETED
      );
      
      expect(invalidUpdate).toBe(false);
    });

    it("should handle workflow recovery scenarios gracefully", () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "recovery-test-task",
        "recovery-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 模拟步骤失败
      SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        0,
        WorkflowStatus.COMPLETED
      );
      
      SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        1,
        WorkflowStatus.FAILED,
        undefined,
        "Quality check failed: code standards not met"
      );

      const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
      
      // 验证恢复指导的质量
      expect(continuation.shouldProceed).toBe(false);
      expect(continuation.reason).toContain("failed");
      expect(continuation.fallbackAction).toBeDefined();
      expect(continuation.fallbackAction).toContain("Fix issues and retry");
      
      // 模拟问题修复后的恢复
      SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        1,
        WorkflowStatus.COMPLETED,
        { fixedIssues: ["code standards", "missing tests"] }
      );

      const recoveredContinuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
      expect(recoveredContinuation.shouldProceed).toBe(true);
      expect(recoveredContinuation.nextTool).toBe("execute_task");
    });

    it("should provide helpful debugging information", () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "debug-test-task",
        "debug-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 添加一些状态传递数据
      SimpleWorkflowManager.recordStateTransfer(
        workflow.workflowId,
        "verify_task",
        "code_review_and_cleanup_tool",
        {
          score: 85,
          summary: "Task completed successfully",
          issues: [],
          timestamp: new Date().toISOString()
        }
      );

      const history = SimpleWorkflowManager.getStateTransferHistory(workflow.workflowId);
      
      expect(history).toHaveLength(1);
      expect(history[0].data.score).toBe(85);
      expect(history[0].data.summary).toBe("Task completed successfully");
      expect(history[0].timestamp).toBeInstanceOf(Date);
      
      // 验证调试信息的完整性
      const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
      expect(monitoring).toBeDefined();
      expect(monitoring!.workflowId).toBe(workflow.workflowId);
      expect(monitoring!.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe("Workflow Usability", () => {
    it("should provide intuitive workflow progression", () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "usability-test-task",
        "usability-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 验证初始状态的直观性
      expect(workflow.currentStep).toBe(0);
      expect(workflow.steps[0].status).toBe(WorkflowStatus.IN_PROGRESS);
      expect(workflow.steps[1].status).toBe(WorkflowStatus.PENDING);
      expect(workflow.steps[2].status).toBe(WorkflowStatus.PENDING);

      // 验证步骤进展的逻辑性
      SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
      
      const afterFirstStep = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(afterFirstStep!.currentStep).toBe(1);
      expect(afterFirstStep!.steps[1].status).toBe(WorkflowStatus.IN_PROGRESS);
      
      // 验证继续指导的清晰性
      const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
      expect(continuation.shouldProceed).toBe(true);
      expect(continuation.nextTool).toBe("code_review_and_cleanup_tool");
      expect(continuation.nextToolParams).toBeDefined();
      expect(continuation.reason).toContain("Ready to proceed");
    });

    it("should handle edge cases gracefully", () => {
      // 测试空步骤列表
      const emptyWorkflow = SimpleWorkflowManager.createWorkflow(
        "empty-test-task",
        "empty-test-project",
        []
      );
      
      expect(emptyWorkflow.steps).toHaveLength(0);
      expect(emptyWorkflow.currentStep).toBe(0);
      
      const continuation = SimpleWorkflowManager.generateContinuation(emptyWorkflow.workflowId);
      expect(continuation.shouldProceed).toBe(false);
      expect(continuation.reason).toContain("No current step found");

      // 测试单步工作流
      const singleStepWorkflow = SimpleWorkflowManager.createWorkflow(
        "single-test-task",
        "single-test-project",
        ["verify_task"]
      );
      
      SimpleWorkflowManager.updateStepStatus(
        singleStepWorkflow.workflowId,
        0,
        WorkflowStatus.COMPLETED
      );
      
      const singleStepContinuation = SimpleWorkflowManager.generateContinuation(
        singleStepWorkflow.workflowId
      );
      expect(singleStepContinuation.shouldProceed).toBe(false);
      expect(singleStepContinuation.reason).toContain("completed");
    });

    it("should provide consistent state management", () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "consistency-test-task",
        "consistency-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      const initialState = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(initialState).toBeDefined();
      expect(initialState!.status).toBe(WorkflowStatus.IN_PROGRESS);

      // 验证状态更新的一致性
      const updateSuccess = SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        0,
        WorkflowStatus.COMPLETED,
        { testData: "consistency check" }
      );
      
      expect(updateSuccess).toBe(true);
      
      const updatedState = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(updatedState!.steps[0].status).toBe(WorkflowStatus.COMPLETED);
      expect(updatedState!.steps[0].output.testData).toBe("consistency check");
      expect(updatedState!.updatedAt.getTime()).toBeGreaterThan(initialState!.createdAt.getTime());
    });
  });

  describe("Performance Perception", () => {
    it("should provide responsive feedback for user actions", () => {
      const startTime = performance.now();
      
      // 模拟用户操作序列
      const workflow = SimpleWorkflowManager.createWorkflow(
        "responsive-test-task",
        "responsive-test-project",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );
      
      const creationTime = performance.now();
      
      SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
      const updateTime = performance.now();
      
      const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
      const monitoringTime = performance.now();
      
      // 验证响应时间
      expect(creationTime - startTime).toBeLessThan(10); // 创建应该很快
      expect(updateTime - creationTime).toBeLessThan(5); // 更新应该很快
      expect(monitoringTime - updateTime).toBeLessThan(5); // 查询应该很快
      
      expect(monitoring).toBeDefined();
      expect(monitoring!.completedSteps).toBe(1);
    });
  });
});