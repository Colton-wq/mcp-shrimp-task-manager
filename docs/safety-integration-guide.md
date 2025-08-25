# 🔗 安全提示集成指南

## 概述

本指南说明如何在 MCP Shrimp Task Manager 的工具界面中集成上下文相关的安全提示，确保用户在操作过程中始终了解安全风险和最佳实践。

## 🎯 集成目标

### 用户体验目标
- 在关键操作点提供及时的安全提示
- 根据操作风险级别显示相应的警告
- 提供快速访问安全文档的链接
- 确保安全信息不干扰正常工作流程

### 技术目标
- 集成到现有MCP工具响应中
- 提供结构化的安全信息
- 支持动态风险评估
- 保持向后兼容性

## 🛠️ 实现方案

### 1. 工具响应增强

#### 在工具响应中添加安全信息
```typescript
interface SafetyEnhancedResponse {
  // 原有响应内容
  success: boolean;
  message: string;
  data?: any;
  
  // 新增安全信息
  safety?: {
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
    recommendations: string[];
    quickActions: SafetyAction[];
    documentationLinks: DocumentationLink[];
  };
}

interface SafetyAction {
  action: string;
  description: string;
  command?: string;
  urgent?: boolean;
}

interface DocumentationLink {
  title: string;
  url: string;
  type: 'guide' | 'checklist' | 'troubleshooting' | 'reference';
}
```

#### 示例实现
```typescript
// 在代码审查和清理工具中集成安全提示
export async function codeReviewAndCleanupTool(params) {
  const result = await executeOperation(params);
  
  // 添加安全信息
  result.safety = generateSafetyInfo(params, result);
  
  return result;
}

function generateSafetyInfo(params, result): SafetyInfo {
  const riskLevel = assessRiskLevel(params);
  
  return {
    riskLevel,
    warnings: generateWarnings(params, riskLevel),
    recommendations: generateRecommendations(params, riskLevel),
    quickActions: generateQuickActions(params, riskLevel),
    documentationLinks: getRelevantDocumentation(params.operation)
  };
}
```

### 2. 风险评估系统

#### 动态风险评估
```typescript
function assessRiskLevel(params): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // 操作类型风险
  if (params.cleanupMode === 'aggressive') riskScore += 3;
  else if (params.cleanupMode === 'safe') riskScore += 1;
  
  // 范围风险
  if (!params.targetFiles) riskScore += 2; // 全项目操作
  
  // 安全模式状态
  if (!params.safeMode) riskScore += 2;
  
  // 备份状态
  if (!hasRecentBackup(params.project)) riskScore += 2;
  
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}
```

#### 上下文相关警告
```typescript
function generateWarnings(params, riskLevel): string[] {
  const warnings: string[] = [];
  
  if (riskLevel === 'high') {
    warnings.push('🚨 高风险操作：此操作可能影响大量文件');
    warnings.push('🛡️ 强烈建议：先创建备份并使用分析模式预览');
  }
  
  if (params.cleanupMode === 'aggressive') {
    warnings.push('⚠️ 激进模式：将删除更多类型的文件');
    warnings.push('🔍 建议：先查看将要删除的文件列表');
  }
  
  if (!params.safeMode) {
    warnings.push('🔒 安全模式已禁用：保护机制减少');
  }
  
  return warnings;
}
```

### 3. 智能推荐系统

#### 操作建议生成
```typescript
function generateRecommendations(params, riskLevel): string[] {
  const recommendations: string[] = [];
  
  // 基于风险级别的建议
  switch (riskLevel) {
    case 'high':
      recommendations.push('创建Git备份后再继续操作');
      recommendations.push('使用分析模式预览操作结果');
      recommendations.push('考虑分批处理以降低风险');
      break;
      
    case 'medium':
      recommendations.push('确认已有最新的Git提交');
      recommendations.push('检查操作范围是否符合预期');
      break;
      
    case 'low':
      recommendations.push('操作风险较低，可以安全执行');
      break;
  }
  
  // 基于操作类型的建议
  if (params.cleanupMode !== 'analysis_only') {
    recommendations.push('首次使用建议先运行分析模式');
  }
  
  return recommendations;
}
```

#### 快速操作建议
```typescript
function generateQuickActions(params, riskLevel): SafetyAction[] {
  const actions: SafetyAction[] = [];
  
  if (riskLevel === 'high') {
    actions.push({
      action: 'create_backup',
      description: '创建安全备份',
      command: `git_backup_tool({"operation": "create_backup"})`,
      urgent: true
    });
    
    actions.push({
      action: 'preview_operation',
      description: '预览操作结果',
      command: `mandatory_code_review({"cleanupMode": "analysis_only"})`,
      urgent: true
    });
  }
  
  if (!hasRecentBackup(params.project)) {
    actions.push({
      action: 'check_git_status',
      description: '检查Git状态',
      command: `git_backup_tool({"operation": "list_history"})`
    });
  }
  
  return actions;
}
```

### 4. 文档链接系统

#### 相关文档推荐
```typescript
function getRelevantDocumentation(operation: string): DocumentationLink[] {
  const baseLinks: DocumentationLink[] = [
    {
      title: '安全指南',
      url: 'docs/SAFETY_GUIDE.md',
      type: 'guide'
    },
    {
      title: '安全检查清单',
      url: 'docs/safety-checklist.md', 
      type: 'checklist'
    }
  ];
  
  // 操作特定文档
  const operationLinks: Record<string, DocumentationLink[]> = {
    'cleanup': [
      {
        title: '文件清理最佳实践',
        url: 'docs/BEST_PRACTICES.md#文件清理',
        type: 'guide'
      }
    ],
    'config': [
      {
        title: '配置安全指南',
        url: 'docs/simplified-config-guide.md#安全配置',
        type: 'guide'
      }
    ],
    'backup': [
      {
        title: 'Git备份和恢复',
        url: 'docs/BEST_PRACTICES.md#备份策略',
        type: 'guide'
      }
    ]
  };
  
  return [...baseLinks, ...(operationLinks[operation] || [])];
}
```

## 📱 用户界面集成

### 1. 命令行界面增强

#### 彩色安全提示
```typescript
function formatSafetyMessage(safety: SafetyInfo): string {
  let message = '';
  
  // 风险级别指示器
  const riskIndicator = {
    'low': '🟢',
    'medium': '🟡', 
    'high': '🔴'
  };
  
  message += `\n${riskIndicator[safety.riskLevel]} 风险级别: ${safety.riskLevel.toUpperCase()}\n`;
  
  // 警告信息
  if (safety.warnings.length > 0) {
    message += '\n⚠️ 安全警告:\n';
    safety.warnings.forEach(warning => {
      message += `  ${warning}\n`;
    });
  }
  
  // 推荐操作
  if (safety.recommendations.length > 0) {
    message += '\n💡 建议:\n';
    safety.recommendations.forEach(rec => {
      message += `  ${rec}\n`;
    });
  }
  
  // 快速操作
  if (safety.quickActions.length > 0) {
    message += '\n🚀 快速操作:\n';
    safety.quickActions.forEach(action => {
      const urgentFlag = action.urgent ? ' (紧急)' : '';
      message += `  ${action.description}${urgentFlag}\n`;
      if (action.command) {
        message += `    命令: ${action.command}\n`;
      }
    });
  }
  
  return message;
}
```

### 2. Web界面集成

#### 安全信息组件
```typescript
interface SafetyPanelProps {
  safety: SafetyInfo;
  onQuickAction: (action: SafetyAction) => void;
}

function SafetyPanel({ safety, onQuickAction }: SafetyPanelProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };
  
  return (
    <div className="safety-panel">
      <div className={`risk-indicator ${safety.riskLevel}`}>
        风险级别: {safety.riskLevel.toUpperCase()}
      </div>
      
      {safety.warnings.length > 0 && (
        <div className="warnings">
          <h4>⚠️ 安全警告</h4>
          <ul>
            {safety.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {safety.quickActions.length > 0 && (
        <div className="quick-actions">
          <h4>🚀 推荐操作</h4>
          {safety.quickActions.map((action, index) => (
            <button
              key={index}
              className={action.urgent ? 'urgent' : 'normal'}
              onClick={() => onQuickAction(action)}
            >
              {action.description}
            </button>
          ))}
        </div>
      )}
      
      <div className="documentation-links">
        <h4>📚 相关文档</h4>
        {safety.documentationLinks.map((link, index) => (
          <a key={index} href={link.url} target="_blank">
            {link.title}
          </a>
        ))}
      </div>
    </div>
  );
}
```

## 🔄 实施步骤

### 阶段1: 核心集成
1. **修改工具响应结构**
   - 在所有工具中添加safety字段
   - 实现基础风险评估
   - 添加标准安全警告

2. **实现风险评估系统**
   - 创建风险评估算法
   - 定义风险级别标准
   - 实现动态评估逻辑

### 阶段2: 智能推荐
1. **开发推荐引擎**
   - 实现上下文相关建议
   - 创建快速操作系统
   - 集成文档链接

2. **用户界面增强**
   - 更新命令行输出格式
   - 创建Web界面组件
   - 实现交互式安全面板

### 阶段3: 高级功能
1. **个性化安全设置**
   - 用户自定义风险阈值
   - 个性化警告偏好
   - 自定义快速操作

2. **学习和适应**
   - 基于用户行为调整建议
   - 记录和分析安全事件
   - 持续改进推荐算法

## 📊 效果测量

### 安全指标
- 用户安全操作采用率
- 数据丢失事件减少率
- 备份创建频率
- 分析模式使用率

### 用户体验指标
- 安全提示有用性评分
- 文档访问频率
- 快速操作使用率
- 用户满意度调查

## 🔧 配置选项

### 安全提示配置
```typescript
interface SafetyConfig {
  enabled: boolean;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  showQuickActions: boolean;
  showDocumentationLinks: boolean;
  urgentActionsOnly: boolean;
}
```

### 用户偏好设置
```typescript
interface UserSafetyPreferences {
  verboseWarnings: boolean;
  autoBackupReminders: boolean;
  riskLevelDisplay: 'icon' | 'text' | 'both';
  preferredDocumentationFormat: 'inline' | 'links' | 'popup';
}
```

## 📚 相关文档

- [安全指南](./SAFETY_GUIDE.md) - 完整的安全使用指南
- [最佳实践](./BEST_PRACTICES.md) - 推荐的工作流程
- [故障排除](./troubleshooting-guide.md) - 问题解决方案
- [安全检查清单](./safety-checklist.md) - 操作前检查项目

---

通过这个集成方案，用户将在使用工具的每个关键步骤都能获得及时、相关的安全指导，大大降低数据丢失和操作错误的风险。