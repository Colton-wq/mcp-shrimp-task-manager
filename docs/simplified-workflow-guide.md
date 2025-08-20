# 简化工作流自动化使用指南

## 概述

Shrimp Task Manager 的简化工作流自动化系统提供了一个高效、可靠的任务验证和质量保证流程。通过自动化的工具链协作，确保每个任务都经过严格的质量检查和文件清理。

## 工作流程

### 标准工作流

```
verify_task → code_review_and_cleanup_tool → execute_task
```

1. **verify_task**: 验证任务完成情况，评估质量分数
2. **code_review_and_cleanup_tool**: 执行代码审查和文件清理
3. **execute_task**: 执行下一个待处理任务

### 自动化特性

- **强制性质量检查**: 每个任务完成后自动触发质量审查
- **智能工作流继续**: 基于质量评分自动决定后续步骤
- **偏离检测**: 分析实现是否偏离原始需求
- **文件清理**: 自动清理临时文件和优化项目结构

## 使用方法

### 1. 任务验证

```typescript
// 验证任务完成
await verifyTask({
  taskId: "your-task-id",
  project: "your-project",
  summary: "任务完成总结",
  score: 85
});
```

**重要**: verify_task 完成后，系统会自动调用 code_review_and_cleanup_tool，无需手动干预。

### 2. 质量检查和清理

系统会自动执行以下检查：

#### 代码质量检查
- 代码标准合规性
- 复杂度分析
- 测试覆盖率
- 安全漏洞扫描
- 输入验证检查
- 错误处理验证
- 性能问题检测

#### 文件清理
- 临时文件清理（.tmp, .temp, .bak, .log）
- 测试文件清理
- 空目录移除
- 项目结构优化

### 3. 工作流状态监控

```typescript
// 获取工作流状态
const workflow = SimpleWorkflowManager.findWorkflowByTaskId(taskId);
const monitoring = SimpleWorkflowManager.getMonitoringData(workflow.workflowId);

console.log(`完成步骤: ${monitoring.completedSteps}/${monitoring.totalSteps}`);
console.log(`错误率: ${(monitoring.errorRate * 100).toFixed(1)}%`);
```

## 配置选项

### 代码审查范围

- **comprehensive**: 全面检查（默认）
- **diagnostic**: 诊断模式，专注问题识别
- **security_only**: 仅安全检查
- **quality_only**: 仅质量检查

### 文件清理模式

- **safe**: 安全清理，仅删除明显的临时文件（默认）
- **aggressive**: 积极清理，包括构建产物
- **analysis_only**: 仅分析，不执行删除

## 最佳实践

### 1. 任务验证

- **提供详细总结**: 包含实现要点、关键决策和成果
- **准确评分**: 基于实际完成质量给出80-100分的评分
- **及时验证**: 任务完成后立即进行验证

### 2. 质量标准

- **代码标准**: 遵循项目编码规范
- **测试覆盖**: 为新功能编写测试
- **文档更新**: 更新相关文档
- **安全考虑**: 注意输入验证和安全最佳实践

### 3. 工作流管理

- **监控进度**: 定期检查工作流状态
- **处理失败**: 及时处理质量检查失败的情况
- **清理维护**: 定期清理过期的工作流数据

## 故障排除

### 常见问题

#### 1. 质量检查失败
**症状**: code_review_and_cleanup_tool 返回低于80分的评分
**解决方案**:
- 检查代码标准问题
- 添加缺失的测试
- 修复安全漏洞
- 改进错误处理

#### 2. 工作流中断
**症状**: 工作流在某个步骤停止
**解决方案**:
- 检查工作流状态
- 查看错误日志
- 手动重试失败的步骤

#### 3. 文件清理问题
**症状**: 重要文件被误删
**解决方案**:
- 使用 safe 清理模式
- 检查文件类型识别逻辑
- 从备份恢复文件

### 调试工具

```typescript
// 查看工作流历史
const history = SimpleWorkflowManager.getStateTransferHistory(workflowId);

// 获取活跃工作流
const activeWorkflows = SimpleWorkflowManager.getActiveWorkflows();

// 清理过期工作流
const cleanedCount = SimpleWorkflowManager.cleanupExpiredWorkflows();
```

## 性能优化

### 1. 并发控制
- 限制同时运行的工作流数量
- 使用批处理优化大量任务处理

### 2. 资源管理
- 定期清理过期工作流
- 监控内存使用情况
- 优化文件操作性能

### 3. 监控指标
- 工作流完成率
- 平均处理时间
- 错误率统计
- 资源使用情况

## 扩展和定制

### 1. 自定义质量检查
可以扩展 CodeQualityChecker 类添加项目特定的检查规则。

### 2. 自定义清理规则
可以修改 FileCleanupManager 类添加特定的文件清理逻辑。

### 3. 工作流步骤
可以通过修改工作流创建逻辑来添加或移除步骤。

## 支持和反馈

如果遇到问题或有改进建议，请：
1. 查看错误日志和监控数据
2. 参考故障排除指南
3. 提交问题报告或功能请求