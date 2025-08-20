/**
 * 工作流自动化完整集成测试
 * Complete workflow automation integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";
import { createWorkflowResponse } from "../../utils/mcpResponse.js";

describe("Workflow Automation Integration", () => {
  const testTaskId = "integration-test-task";
  const testProject = "integration-test-project";
  
  beforeEach(() => {
    // 清理测试数据
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  afterEach(() => {
    // 清理测试数据
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  describe("Complete Workflow Execution", () => {
    it("should execute full verify_task → code_review_and_cleanup_tool → execute_task workflow", async () => {
      // 创建工作流
      const workflow = SimpleWorkflowManager.createWorkflow(
        testTaskId,
        testProject,
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      expect(workflow.steps).toHaveLength(3);
      expect(workflow.currentStep).toBe(0);
      expect(workflow.status).toBe(WorkflowStatus.IN_PROGRESS);

      // 模拟 verify_task 完成
      const verifySuccess = SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        0,
        WorkflowStatus.COMPLETED,
        { score: 85, summary: "Task verified successfully" }
      );

      expect(verifySuccess).toBe(true);
      
      const afterVerify = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(afterVerify?.currentStep).toBe(1);
      expect(afterVerify?.steps[1].status).toBe(WorkflowStatus.IN_PROGRESS);

      // 模拟 code_review_and_cleanup_tool 完成
      const reviewSuccess = SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        1,
        WorkflowStatus.COMPLETED,
        { 
          overallScore: 88,
          qualityChecks: [
            { category: "Code Standards", status: "PASS", message: "All checks passed" }
          ],
          cleanupResults: { filesRemoved: 3, filesAnalyzed: 10 }
        }
      );

      expect(reviewSuccess).toBe(true);
      
      const afterReview = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(afterReview?.currentStep).toBe(2);
      expect(afterReview?.steps[2].status).toBe(WorkflowStatus.IN_PROGRESS);

      // 模拟 execute_task 完成
      const executeSuccess = SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        2,
        WorkflowStatus.COMPLETED,
        { nextTaskId: "next-task-123" }
      );

      expect(executeSuccess).toBe(true);
      
      const finalWorkflow = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(finalWorkflow?.status).toBe(WorkflowStatus.COMPLETED);
    });    it("should handle workflow failure and recovery", async () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        testTaskId,
        testProject,
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 第一步成功
      SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        0,
        WorkflowStatus.COMPLETED,
        { score: 85 }
      );

      // 第二步失败
      SimpleWorkflowManager.updateStepStatus(
        workflow.workflowId,
        1,
        WorkflowStatus.FAILED,
        undefined,
        "Quality check failed: code standards not met"
      );

      const failedWorkflow = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(failedWorkflow?.status).toBe(WorkflowStatus.PAUSED);

      const continuation = SimpleWorkflowManager.generateContinuation(workflow.workflowId);
      expect(continuation.shouldProceed).toBe(false);
      expect(continuation.reason).toContain("failed");
      expect(continuation.fallbackAction).toBeDefined();
    });

    it("should track state transfers between tools", async () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        testTaskId,
        testProject,
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 记录状态传递
      const verifyData = { score: 85, summary: "Task completed", deviationAnalysis: null };
      SimpleWorkflowManager.recordStateTransfer(
        workflow.workflowId,
        "verify_task",
        "code_review_and_cleanup_tool",
        verifyData
      );

      const reviewData = { overallScore: 88, qualityChecks: [], cleanupResults: {} };
      SimpleWorkflowManager.recordStateTransfer(
        workflow.workflowId,
        "code_review_and_cleanup_tool",
        "execute_task",
        reviewData
      );

      const history = SimpleWorkflowManager.getStateTransferHistory(workflow.workflowId);
      expect(history).toHaveLength(2);
      expect(history[0].sourceToolId).toBe("verify_task");
      expect(history[1].sourceToolId).toBe("code_review_and_cleanup_tool");
    });
  });

  describe("Performance and Concurrency", () => {
    it("should handle multiple concurrent workflows", async () => {
      const workflows = [];
      const numWorkflows = 5;

      // 创建多个并发工作流
      for (let i = 0; i < numWorkflows; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `task-${i}`,
          testProject,
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        workflows.push(workflow);
      }

      expect(workflows).toHaveLength(numWorkflows);

      // 并发更新状态
      const updatePromises = workflows.map((workflow, index) => {
        return Promise.resolve(
          SimpleWorkflowManager.updateStepStatus(
            workflow.workflowId,
            0,
            WorkflowStatus.COMPLETED,
            { taskIndex: index }
          )
        );
      });

      const results = await Promise.all(updatePromises);
      expect(results.every(r => r === true)).toBe(true);

      // 验证所有工作流状态正确
      workflows.forEach((workflow, index) => {
        const updated = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
        expect(updated?.currentStep).toBe(1);
        expect(updated?.steps[0].output?.taskIndex).toBe(index);
      });
    });    it("should cleanup expired workflows efficiently", async () => {
      const startTime = Date.now();
      
      // 创建一些工作流
      const workflows = [];
      for (let i = 0; i < 10; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `cleanup-test-${i}`,
          testProject,
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        workflows.push(workflow);
      }

      // 完成一些工作流
      workflows.slice(0, 5).forEach(workflow => {
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.COMPLETED);
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 2, WorkflowStatus.COMPLETED);
      });

      // 清理过期工作流（0ms = 立即过期）
      const cleanedCount = SimpleWorkflowManager.cleanupExpiredWorkflows(0);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(cleanedCount).toBe(5); // 只清理已完成的工作流
      expect(duration).toBeLessThan(100); // 清理操作应该很快
      
      const activeWorkflows = SimpleWorkflowManager.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(5); // 剩余的活跃工作流
    });

    it("should provide accurate monitoring data", async () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        testTaskId,
        testProject,
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );

      // 模拟一些步骤执行
      SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
      
      // 等待一小段时间以确保时间戳差异
      await new Promise(resolve => setTimeout(resolve, 10));
      
      SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.FAILED);

      const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
      
      expect(monitoring).toBeDefined();
      expect(monitoring?.totalSteps).toBe(3);
      expect(monitoring?.completedSteps).toBe(1);
      expect(monitoring?.failedSteps).toBe(1);
      expect(monitoring?.errorRate).toBeCloseTo(0.33, 2);
      expect(monitoring?.totalDuration).toBeGreaterThan(0);
      expect(monitoring?.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe("MCP Response Integration", () => {
    it("should create workflow-aware responses", () => {
      const message = "Task verification completed successfully";
      const workflowContinuation = {
        shouldProceed: true,
        nextTool: "code_review_and_cleanup_tool",
        nextToolParams: {
          taskId: testTaskId,
          project: testProject
        },
        reason: "Quality check required"
      };

      const response = createWorkflowResponse(message, workflowContinuation);
      
      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe("text");
      
      const responseText = response.content[0].text;
      expect(responseText).toContain(message);
      expect(responseText).toContain("Workflow Continuation");
      expect(responseText).toContain("MANDATORY NEXT ACTION");
      expect(responseText).toContain("code_review_and_cleanup_tool");
      expect(responseText).toContain("PROHIBITED ACTIONS");
      expect(responseText).toContain("MANDATORY ACTIONS");
    });

    it("should handle paused workflow responses", () => {
      const message = "Quality check failed";
      const workflowContinuation = {
        shouldProceed: false,
        reason: "Code standards not met"
      };

      const response = createWorkflowResponse(message, workflowContinuation);
      const responseText = response.content[0].text;
      
      expect(responseText).toContain("Workflow paused");
      expect(responseText).toContain("Code standards not met");
      expect(responseText).toContain("Required Actions");
    });
  });
});