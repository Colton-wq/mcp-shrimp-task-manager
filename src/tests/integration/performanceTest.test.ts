/**
 * 性能测试和并发安全测试
 * Performance and concurrency safety tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";

describe("Performance and Concurrency Tests", () => {
  beforeEach(() => {
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  afterEach(() => {
    SimpleWorkflowManager.cleanupExpiredWorkflows(0);
  });

  describe("Performance Tests", () => {
    it("should create workflows efficiently", () => {
      const startTime = performance.now();
      const workflows = [];
      
      // 创建100个工作流
      for (let i = 0; i < 100; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `perf-test-${i}`,
          "performance-test",
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        workflows.push(workflow);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(workflows).toHaveLength(100);
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      
      console.log(`创建100个工作流耗时: ${duration.toFixed(2)}ms`);
    });

    it("should update workflow status efficiently", () => {
      const workflows = [];
      
      // 创建50个工作流
      for (let i = 0; i < 50; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `update-test-${i}`,
          "performance-test",
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        workflows.push(workflow);
      }
      
      const startTime = performance.now();
      
      // 批量更新状态
      workflows.forEach((workflow, index) => {
        SimpleWorkflowManager.updateStepStatus(
          workflow.workflowId,
          0,
          WorkflowStatus.COMPLETED,
          { index }
        );
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(50); // 应该在50ms内完成
      
      console.log(`更新50个工作流状态耗时: ${duration.toFixed(2)}ms`);
    });

    it("should cleanup expired workflows efficiently", () => {
      // 创建大量已完成的工作流
      const workflows = [];
      for (let i = 0; i < 200; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `cleanup-test-${i}`,
          "performance-test",
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        
        // 完成工作流
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.COMPLETED);
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 2, WorkflowStatus.COMPLETED);
        
        workflows.push(workflow);
      }
      
      const startTime = performance.now();
      const cleanedCount = SimpleWorkflowManager.cleanupExpiredWorkflows(0);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(cleanedCount).toBe(200);
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      
      console.log(`清理200个工作流耗时: ${duration.toFixed(2)}ms`);
    });    it("should handle memory usage efficiently", () => {
      const initialMemory = process.memoryUsage();
      const workflows = [];
      
      // 创建大量工作流和状态传递
      for (let i = 0; i < 500; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `memory-test-${i}`,
          "performance-test",
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        
        // 添加状态传递数据
        SimpleWorkflowManager.recordStateTransfer(
          workflow.workflowId,
          "verify_task",
          "code_review_and_cleanup_tool",
          { data: `test-data-${i}`, timestamp: new Date() }
        );
        
        workflows.push(workflow);
      }
      
      const peakMemory = process.memoryUsage();
      
      // 清理数据
      SimpleWorkflowManager.cleanupExpiredWorkflows(0);
      
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;
      const memoryPerWorkflow = memoryIncrease / 500;
      
      expect(memoryPerWorkflow).toBeLessThan(10000); // 每个工作流应该少于10KB
      
      console.log(`每个工作流内存使用: ${(memoryPerWorkflow / 1024).toFixed(2)}KB`);
    });
  });

  describe("Concurrency Safety Tests", () => {
    it("should handle concurrent workflow creation safely", async () => {
      const concurrentTasks = [];
      const numConcurrent = 20;
      
      // 并发创建工作流
      for (let i = 0; i < numConcurrent; i++) {
        const task = Promise.resolve().then(() => {
          return SimpleWorkflowManager.createWorkflow(
            `concurrent-create-${i}`,
            "concurrency-test",
            ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
          );
        });
        concurrentTasks.push(task);
      }
      
      const results = await Promise.all(concurrentTasks);
      
      expect(results).toHaveLength(numConcurrent);
      
      // 验证所有工作流都有唯一ID
      const workflowIds = results.map(w => w.workflowId);
      const uniqueIds = new Set(workflowIds);
      expect(uniqueIds.size).toBe(numConcurrent);
    });

    it("should handle concurrent status updates safely", async () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "concurrent-update-test",
        "concurrency-test",
        ["step1", "step2", "step3", "step4", "step5"]
      );
      
      const updateTasks = [];
      
      // 并发更新不同步骤
      for (let i = 0; i < 5; i++) {
        const task = Promise.resolve().then(() => {
          return SimpleWorkflowManager.updateStepStatus(
            workflow.workflowId,
            i,
            WorkflowStatus.COMPLETED,
            { stepIndex: i, timestamp: Date.now() }
          );
        });
        updateTasks.push(task);
      }
      
      const results = await Promise.all(updateTasks);
      
      // 所有更新都应该成功
      expect(results.every(r => r === true)).toBe(true);
      
      const updatedWorkflow = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
      expect(updatedWorkflow?.steps.every(s => s.status === WorkflowStatus.COMPLETED)).toBe(true);
    });    it("should handle concurrent state transfers safely", async () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "concurrent-transfer-test",
        "concurrency-test",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );
      
      const transferTasks = [];
      const numTransfers = 50;
      
      // 并发记录状态传递
      for (let i = 0; i < numTransfers; i++) {
        const task = Promise.resolve().then(() => {
          SimpleWorkflowManager.recordStateTransfer(
            workflow.workflowId,
            `source-${i}`,
            `target-${i}`,
            { 
              transferId: i,
              data: `concurrent-data-${i}`,
              timestamp: Date.now()
            }
          );
          return i;
        });
        transferTasks.push(task);
      }
      
      const results = await Promise.all(transferTasks);
      
      expect(results).toHaveLength(numTransfers);
      
      const history = SimpleWorkflowManager.getStateTransferHistory(workflow.workflowId);
      expect(history).toHaveLength(numTransfers);
      
      // 验证所有传递都被正确记录
      const transferIds = history.map(h => h.data.transferId).sort((a, b) => a - b);
      const expectedIds = Array.from({ length: numTransfers }, (_, i) => i);
      expect(transferIds).toEqual(expectedIds);
    });

    it("should handle concurrent monitoring data access safely", async () => {
      const workflows = [];
      
      // 创建多个工作流
      for (let i = 0; i < 10; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `monitoring-test-${i}`,
          "concurrency-test",
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        workflows.push(workflow);
      }
      
      const monitoringTasks: Promise<any>[] = [];
      
      // 并发访问监控数据
      workflows.forEach(workflow => {
        const task = Promise.resolve().then(() => {
          // 更新一些状态
          SimpleWorkflowManager.updateStepStatus(
            workflow.workflowId,
            0,
            WorkflowStatus.COMPLETED
          );
          
          // 获取监控数据
          return SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
        });
        monitoringTasks.push(task);
      });
      
      const monitoringResults = await Promise.all(monitoringTasks);
      
      expect(monitoringResults).toHaveLength(10);
      expect(monitoringResults.every(r => r !== null)).toBe(true);
      expect(monitoringResults.every(r => r!.completedSteps === 1)).toBe(true);
    });

    it("should handle concurrent cleanup operations safely", async () => {
      // 创建一些已完成的工作流
      const workflows = [];
      for (let i = 0; i < 30; i++) {
        const workflow = SimpleWorkflowManager.createWorkflow(
          `cleanup-concurrent-${i}`,
          "concurrency-test",
          ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
        );
        
        // 完成工作流
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 0, WorkflowStatus.COMPLETED);
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 1, WorkflowStatus.COMPLETED);
        SimpleWorkflowManager.updateStepStatus(workflow.workflowId, 2, WorkflowStatus.COMPLETED);
        
        workflows.push(workflow);
      }
      
      // 并发执行清理操作
      const cleanupTasks = [];
      for (let i = 0; i < 5; i++) {
        const task = Promise.resolve().then(() => {
          return SimpleWorkflowManager.cleanupExpiredWorkflows(0);
        });
        cleanupTasks.push(task);
      }
      
      const cleanupResults = await Promise.all(cleanupTasks);
      
      // 第一个清理操作应该清理所有工作流，后续的应该返回0
      const totalCleaned = cleanupResults.reduce((sum, count) => sum + count, 0);
      expect(totalCleaned).toBe(30);
      
      // 验证清理后没有活跃工作流
      const activeWorkflows = SimpleWorkflowManager.getActiveWorkflows();
      expect(activeWorkflows).toHaveLength(0);
    });
  });

  describe("Stress Tests", () => {
    it("should handle high-frequency operations", async () => {
      const workflow = SimpleWorkflowManager.createWorkflow(
        "stress-test",
        "stress-test",
        ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
      );
      
      const startTime = performance.now();
      const operations = [];
      
      // 高频操作：1000次状态查询和更新
      for (let i = 0; i < 1000; i++) {
        const operation = Promise.resolve().then(() => {
          // 查询状态
          const current = SimpleWorkflowManager.getWorkflow(workflow.workflowId);
          
          // 记录状态传递
          SimpleWorkflowManager.recordStateTransfer(
            workflow.workflowId,
            `stress-source-${i}`,
            `stress-target-${i}`,
            { iteration: i }
          );
          
          return current !== null;
        });
        operations.push(operation);
      }
      
      const results = await Promise.all(operations);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results.every(r => r === true)).toBe(true);
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
      
      console.log(`1000次高频操作耗时: ${duration.toFixed(2)}ms`);
      
      // 验证状态传递历史
      const history = SimpleWorkflowManager.getStateTransferHistory(workflow.workflowId);
      expect(history).toHaveLength(1000);
    });
  });
});