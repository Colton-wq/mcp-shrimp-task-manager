# 简化配置系统使用指南

## 概述

简化配置系统将原本复杂的104行配置类型定义简化为4个核心选项，让普通用户能够轻松配置代码质量工具，同时为高级用户保留了完整的配置能力。

## 核心特性

### 🎯 智能项目类型检测
系统能够自动分析项目结构，检测项目类型并推荐最佳配置：

- **小型项目** (< 100 文件): 适合个人项目，使用宽松标准
- **中型项目** (100-1000 文件): 标准团队项目，平衡质量与效率
- **大型项目** (> 1000 文件): 企业级项目，严格质量标准
- **遗留项目**: 老旧代码库，宽松标准避免过多警告
- **严格项目**: 核心库或关键系统，最高质量要求

### ⭐ 质量级别调节 (1-5)
简单的数字级别替代复杂的阈值配置：

- **级别 1**: 宽松 - 适合快速原型
- **级别 2**: 较宽松 - 早期开发阶段
- **级别 3**: 标准 - 推荐的平衡选择
- **级别 4**: 较严格 - 生产环境代码
- **级别 5**: 严格 - 关键系统最高标准

### 🛡️ 安全模式
一键启用保守的清理策略，避免意外删除重要文件：

- 启用时：更保守的文件清理，保护重要目录
- 禁用时：标准清理策略，可能清理更多文件

## 使用方法

### 1. 自动检测项目类型

```typescript
// 使用配置向导工具
const result = await configWizardTool({
  project: "my-web-app",
  operation: "detect_project"
});

console.log(result.data.projectType); // 'medium'
console.log(result.data.recommendation); // 项目类型建议
```

### 2. 获取配置向导问题

```typescript
const questions = await configWizardTool({
  project: "my-web-app", 
  operation: "get_questions"
});

// 返回4个简单问题，每个都有选项和默认值
questions.data.questions.forEach(q => {
  console.log(q.question);
  console.log(q.options);
});
```

### 3. 应用配置

```typescript
const config = {
  projectType: "medium",
  qualityLevel: 3,
  safeMode: true,
  debug: false
};

const result = await configWizardTool({
  project: "my-web-app",
  operation: "apply_config",
  config
});

console.log(result.data.summary); // 配置摘要
```

### 4. 查看配置摘要

```typescript
const summary = await configWizardTool({
  project: "my-web-app",
  operation: "get_summary",
  config: {
    projectType: "large",
    qualityLevel: 4,
    safeMode: true,
    debug: false
  }
});

console.log(summary.data.summary);
// 输出：
// 📋 配置摘要:
// 🎯 项目类型: 大型项目
// ⭐ 质量级别: 4/5
// 🛡️ 安全模式: 启用
// 🔍 调试模式: 禁用
// 
// 📊 质量阈值:
// - 总体评分: ≥82
// - 可维护性: ≥52
// - 复杂度: ≤9
// - 测试覆盖率: ≥83%
```

## 配置映射

简化配置如何映射到完整配置：

### 项目类型预设

| 项目类型 | 文件数限制 | 并发数 | 内存限制 | 质量阈值 |
|---------|-----------|--------|----------|----------|
| 小型项目 | 500 | 5 | 256MB | 宽松 |
| 中型项目 | 1000 | 8 | 512MB | 标准 |
| 大型项目 | 2000 | 12 | 1024MB | 严格 |
| 遗留项目 | 1500 | 6 | 512MB | 很宽松 |
| 严格项目 | 1000 | 6 | 512MB | 很严格 |

### 质量级别调整

质量级别通过调整因子影响所有阈值：

```typescript
// 调整因子计算
const factor = (qualityLevel - 3) * 0.1; // -0.2 到 +0.2

// 阈值调整示例
overallScore = baseScore + (factor * 20);
testCoverage = baseCoverage + (factor * 15);
cyclomaticComplexity = baseComplexity - (factor * 5);
```

### 安全模式影响

启用安全模式时的变化：

- `safeDeleteMode`: 强制设为 `true`
- `tempFilePatterns`: 移除 `.log` 模式
- `systemDirectories`: 添加 `src`, `lib`, `public`, `assets`, `docs`

## 高级用户

高级用户仍可以通过 `QualityConfigManager` 直接访问完整配置：

```typescript
import { QualityConfigManager } from './config/QualityConfig.js';

const manager = QualityConfigManager.getInstance();
await manager.loadConfig();

// 直接修改完整配置
manager.updateConfig({
  thresholds: {
    overallScore: 85,
    maintainabilityIndex: 55,
    cyclomaticComplexity: 8,
    cognitiveComplexity: 12,
    testCoverage: 85
  }
});
```

## 最佳实践

1. **新用户**: 使用配置向导，选择检测到的项目类型和默认设置
2. **快速设置**: 选择项目类型和质量级别3，启用安全模式
3. **生产环境**: 使用质量级别4或5，确保代码质量
4. **遗留项目**: 选择遗留项目类型，使用质量级别1或2
5. **调试问题**: 临时启用调试模式查看详细信息

## 迁移指南

从复杂配置迁移到简化配置：

1. 分析当前配置的质量阈值
2. 根据项目规模选择项目类型
3. 根据当前阈值严格程度选择质量级别
4. 根据清理策略选择安全模式设置

## 故障排除

### 配置不生效
- 确保调用了 `apply_config` 操作
- 检查项目参数是否正确
- 验证配置对象格式

### 质量检查过于严格
- 降低质量级别 (3→2→1)
- 考虑使用遗留项目类型
- 启用安全模式

### 性能问题
- 选择小型项目类型减少并发
- 降低文件扫描限制
- 检查内存使用情况

通过这个简化的配置系统，用户可以在几分钟内完成配置，而不需要理解复杂的技术细节。