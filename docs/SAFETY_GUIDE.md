# 🛡️ 用户安全指南

## 概述

MCP Shrimp Task Manager 代码审查和清理工具具有强大的文件操作能力。为了确保您的数据安全，请仔细阅读本指南并遵循安全最佳实践。

## ⚠️ 重要安全警告

### 🚨 高风险操作
以下操作可能导致数据丢失，请务必谨慎：

1. **激进清理模式 (Aggressive Mode)**
   - 会删除更多类型的文件
   - 包括缓存文件、日志文件等
   - 🛡️ **安全措施**: 系统已移除删除关键目录的危险功能

2. **文件清理操作**
   - 所有清理操作都是不可逆的
   - 删除的文件无法通过系统回收站恢复
   - 🛡️ **安全措施**: 自动创建Git备份

3. **批量文件操作**
   - 可能影响大量文件
   - 操作范围可能超出预期
   - 🛡️ **安全措施**: 提供预览功能和安全确认

## 🔒 内置安全机制

### 1. 自动安全检查
系统会自动执行以下安全检查：

```
✅ 项目路径验证 - 防止在系统目录执行操作
✅ 危险路径检测 - 阻止在关键系统目录操作
✅ 文件类型验证 - 只清理指定类型的临时文件
✅ 安全模式保护 - 额外保护重要目录
```

### 2. Git自动备份
每次文件操作都会自动创建Git备份：

- **自动初始化**: 如果项目没有Git仓库，系统会自动创建
- **操作记录**: 每次清理操作都会创建Git提交
- **回滚支持**: 可以通过Git历史回滚任何操作

### 3. 安全模式
启用安全模式时的额外保护：

- 更保守的文件清理策略
- 保护重要目录：`src`, `lib`, `public`, `assets`, `docs`
- 移除可能删除重要日志的模式
- 强制启用安全删除模式

## 📋 使用前安全检查清单

### ✅ 必须检查项目
在使用代码审查和清理工具前，请确认：

- [ ] **项目备份**: 确保项目已有完整备份
- [ ] **Git状态**: 确认所有重要更改已提交到Git
- [ ] **工作目录**: 确认当前在正确的项目目录
- [ ] **文件权限**: 确认有足够权限执行操作
- [ ] **磁盘空间**: 确认有足够空间创建备份

### ✅ 配置检查
- [ ] **安全模式**: 建议新用户启用安全模式
- [ ] **项目类型**: 选择正确的项目类型以获得合适的配置
- [ ] **质量级别**: 根据项目需求选择合适的质量级别
- [ ] **调试模式**: 首次使用建议启用调试模式

## 🎯 安全使用指南

### 1. 首次使用
```bash
# 1. 使用配置向导进行安全设置
config_wizard_tool({
  "project": "your-project",
  "operation": "detect_project"
})

# 2. 启用安全模式
config_wizard_tool({
  "project": "your-project", 
  "operation": "apply_config",
  "config": {
    "projectType": "medium",
    "qualityLevel": 3,
    "safeMode": true,  // 重要：启用安全模式
    "debug": true      // 首次使用建议启用
  }
})
```

### 2. 安全的清理操作
```bash
# 1. 先创建备份
git_backup_tool({
  "project": "your-project",
  "taskId": "your-task-id",
  "operation": "create_backup",
  "message": "Before cleanup operation"
})

# 2. 使用分析模式预览
mandatory_code_review({
  "project": "your-project",
  "taskId": "your-task-id", 
  "reviewScope": "comprehensive",
  "cleanupMode": "analysis_only"  // 安全：仅分析不删除
})

# 3. 确认无误后执行安全清理
mandatory_code_review({
  "project": "your-project",
  "taskId": "your-task-id",
  "reviewScope": "comprehensive", 
  "cleanupMode": "safe"  // 安全：使用安全模式
})
```

### 3. 紧急回滚
如果操作出现问题，立即执行回滚：

```bash
# 1. 查看Git历史
git_backup_tool({
  "project": "your-project",
  "taskId": "your-task-id",
  "operation": "list_history"
})

# 2. 回滚到安全状态
git_backup_tool({
  "project": "your-project", 
  "taskId": "your-task-id",
  "operation": "rollback",
  "commitHash": "previous-safe-commit-hash"
})
```

## 🚫 禁止操作

### 绝对不要做的事情：

1. **❌ 在系统目录使用**
   - 不要在 `/usr/bin`, `/etc`, `C:\Windows` 等系统目录使用
   - 系统会自动阻止，但请避免尝试

2. **❌ 跳过备份**
   - 不要禁用Git备份功能
   - 不要在没有备份的情况下执行清理

3. **❌ 忽略警告**
   - 不要忽略安全警告消息
   - 不要强制执行被阻止的操作

4. **❌ 在生产环境直接使用激进模式**
   - 生产环境请使用安全模式
   - 激进模式仅适用于开发环境

## 🔧 故障排除

### 常见安全问题及解决方案

#### 问题1: "SECURITY: Cannot cleanup in system directory"
**原因**: 尝试在系统关键目录执行操作
**解决**: 切换到正确的项目目录

#### 问题2: "Invalid project path - cleanup aborted"
**原因**: 项目路径无效或过短
**解决**: 确认项目路径正确且为绝对路径

#### 问题3: "Git backup failed"
**原因**: Git仓库初始化失败或权限不足
**解决**: 
```bash
# 手动初始化Git仓库
cd your-project-directory
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

#### 问题4: "Aggressive mode blocked"
**原因**: 激进模式被安全机制阻止
**解决**: 使用安全模式或分析模式

## 📞 紧急联系

如果遇到数据丢失或严重问题：

1. **立即停止所有操作**
2. **不要进行任何文件操作**
3. **检查Git历史**: `git log --oneline`
4. **尝试Git回滚**: `git reset --hard <safe-commit>`
5. **查看备份文件**: 检查 `memory/` 目录下的备份

## 🎓 安全培训

### 新用户必读
1. 阅读本安全指南
2. 完成配置向导设置
3. 在测试项目上练习使用
4. 熟悉回滚操作
5. 了解所有安全机制

### 定期检查
- 每月检查Git备份完整性
- 定期更新安全配置
- 检查磁盘空间确保备份正常
- 验证回滚功能可用性

## 📚 相关文档

- [最佳实践指南](./BEST_PRACTICES.md)
- [简化配置指南](./simplified-config-guide.md)
- [故障排除指南](./troubleshooting-guide.md)
- [API文档](./api-documentation.md)

---

**记住**: 安全第一！当有疑问时，选择更保守的操作方式。数据丢失的代价远大于多花几分钟进行安全确认。