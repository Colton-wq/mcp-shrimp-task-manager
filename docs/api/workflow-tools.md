# 工作流工具 API 文档

## 概述

本文档描述了 Shrimp Task Manager 简化工作流自动化系统的核心 API 和工具接口。

## 核心工具

### 1. code_review_and_cleanup_tool

执行综合代码质量审查和项目清理操作。

#### 参数

```typescript
interface CodeReviewAndCleanupParams {
  taskId: string;        // 任务ID (UUID格式)
  project: string;       // 项目名称
  reviewScope?: ReviewScope;  // 审查范围
  cleanupMode?: CleanupMode;  // 清理模式
  targetFiles?: string[];     // 目标文件列表
}
```

#### 审查范围 (ReviewScope)

- `comprehensive`: 全面审查（默认）
- `diagnostic`: 诊断模式
- `security_only`: 仅安全检查
- `quality_only`: 仅质量检查

#### 清理模式 (CleanupMode)

- `safe`: 安全清理（默认）
- `aggressive`: 积极清理
- `analysis_only`: 仅分析

#### 返回值

```typescript
interface CodeReviewAndCleanupResult {
  taskId: string;
  overallScore: number;           // 总体评分 (0-100)
  qualityChecks: QualityCheckResult[];
  cleanupResults: CleanupResult;
  auditCheckpoints: AuditCheckpoint[];
  nextSteps: string[];
  workflowContinuation: WorkflowContinuation;
}
```

#### 使用示例

```typescript
const result = await codeReviewAndCleanupTool({
  taskId: "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789",
  project: "my-project",
  reviewScope: "comprehensive",
  cleanupMode: "safe"
});
```

### 2. verify_task (增强版)

验证任务完成情况，集成工作流自动化。

#### 参数

```typescript
interface VerifyTaskParams {
  taskId: string;    // 任务ID
  project: string;   // 项目名称
  summary: string;   // 任务总结
  score: number;     // 质量评分 (0-100)
}
```

#### 增强功能

- 自动偏离检测分析
- 工作流状态管理
- 强制性后续工具调用指导

#### 使用示例

```typescript
const result = await verifyTask({
  taskId: "task-123",
  project: "my-project", 
  summary: "功能实现完成，包含所有要求的特性",
  score: 85
});
```

## 工作流管理 API

### SimpleWorkflowManager

轻量级工作流管理器，提供工作流生命周期管理。

#### 核心方法

##### createWorkflow

```typescript
static createWorkflow(
  taskId: string, 
  project: string, 
  steps: string[]
): WorkflowContext
```

创建新的工作流实例。

##### updateStepStatus

```typescript
static updateStepStatus(
  workflowId: string,
  stepIndex: number,
  status: WorkflowStatus,
  output?: any,
  error?: string
): boolean
```

更新工作流步骤状态。

##### generateContinuation

```typescript
static generateContinuation(
  workflowId: string
): WorkflowContinuation
```

生成工作流继续指导。

##### getMonitoringData

```typescript
static getMonitoringData(
  workflowId: string
): WorkflowMonitoring | null
```

获取工作流监控数据。

#### 使用示例

```typescript
// 创建工作流
const workflow = SimpleWorkflowManager.createWorkflow(
  "task-123",
  "my-project",
  ["verify_task", "code_review_and_cleanup_tool", "execute_task"]
);

// 更新步骤状态
SimpleWorkflowManager.updateStepStatus(
  workflow.workflowId,
  0,
  WorkflowStatus.COMPLETED,
  { score: 85 }
);

// 获取继续指导
const continuation = SimpleWorkflowManager.generateContinuation(
  workflow.workflowId
);
```

## 数据类型

### WorkflowStatus

```typescript
enum WorkflowStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed", 
  FAILED = "failed",
  PAUSED = "paused"
}
```

### WorkflowContext

```typescript
interface WorkflowContext {
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
```

### QualityCheckResult

```typescript
interface QualityCheckResult {
  category: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: string[];
  suggestions?: string[];
}
```

### CleanupResult

```typescript
interface CleanupResult {
  filesAnalyzed: number;
  filesRemoved: number;
  directoriesOptimized: number;
  removedFiles: string[];
  warnings: string[];
  suggestions: string[];
}
```

## MCP 响应格式

### createWorkflowResponse

创建工作流感知的 MCP 响应。

```typescript
function createWorkflowResponse(
  message: string,
  workflowContinuation?: WorkflowContinuation
): MCPResponse
```

#### 响应结构

```typescript
interface MCPResponse {
  content: [{
    type: "text";
    text: string;  // 包含工作流继续指导的格式化文本
  }];
}
```

## 错误处理

### 标准错误类型

- `VALIDATION_ERROR`: 参数验证失败
- `NOT_FOUND`: 任务或工作流未找到
- `INTERNAL_ERROR`: 内部处理错误
- `DEPENDENCY_ERROR`: 依赖检查失败

### 错误响应格式

```typescript
interface MCPError {
  type: MCPErrorType;
  message: string;
  details?: string;
  recoveryAction?: string;
  retryable?: boolean;
}
```

## 性能考虑

### 并发限制

- 建议同时运行的工作流数量不超过 10 个
- 大批量操作应使用批处理模式

### 内存管理

- 定期调用 `cleanupExpiredWorkflows()` 清理过期数据
- 监控工作流数量和内存使用情况

### 超时设置

- 工作流步骤默认超时：30 秒
- 文件操作默认超时：10 秒
- 可通过配置调整超时值

## 最佳实践

### 1. 工具调用顺序

严格按照工作流定义的顺序调用工具：
1. verify_task
2. code_review_and_cleanup_tool  
3. execute_task

### 2. 错误处理

```typescript
try {
  const result = await codeReviewAndCleanupTool(params);
  // 处理成功结果
} catch (error) {
  // 检查错误类型
  if (error.type === 'VALIDATION_ERROR') {
    // 处理验证错误
  } else if (error.retryable) {
    // 重试操作
  }
}
```

### 3. 监控和日志

```typescript
// 定期检查工作流状态
const activeWorkflows = SimpleWorkflowManager.getActiveWorkflows();
activeWorkflows.forEach(workflow => {
  const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);
  console.log(`工作流 ${workflow.workflowId}: ${monitoring.completedSteps}/${monitoring.totalSteps} 完成`);
});
```

## 版本兼容性

- API 版本：1.0
- MCP 协议版本：兼容最新版本
- Node.js 要求：≥ 20.0.0
- TypeScript 要求：≥ 5.0.0