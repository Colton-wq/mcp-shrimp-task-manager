# API 文档

## 概述

本文档描述了 Shrimp Task Manager ChatAgent 优化版本的 API 接口和使用方法。

## 核心组件 API

### ChatAgent 组件

#### Props

```typescript
interface ChatAgentProps {
  initialMessages?: Message[];
  onMessageSend?: (message: string) => void;
  onTemplateSelect?: (template: PromptTemplate) => void;
  className?: string;
  disabled?: boolean;
}
```

#### 方法

```typescript
// 发送消息
sendMessage(content: string, options?: SendMessageOptions): Promise<void>

// 清空对话历史
clearHistory(): void

// 重试最后一条消息
retryLastMessage(): Promise<void>

// 设置加载状态
setLoading(loading: boolean): void
```

#### 事件

```typescript
// 消息发送事件
onMessageSend: (message: Message) => void

// 错误事件
onError: (error: Error) => void

// 模板选择事件
onTemplateSelect: (template: PromptTemplate) => void
```

### PromptTemplateManager 服务

#### 创建模板

```typescript
async createTemplate(
  templateData: Omit<PromptTemplate, 'id' | 'metadata' | 'usage'>
): Promise<PromptTemplate>
```

**参数:**
- `templateData`: 模板数据对象

**返回值:**
- `Promise<PromptTemplate>`: 创建的模板对象

**示例:**
```typescript
const template = await templateManager.createTemplate({
  name: '任务分析模板',
  description: '用于分析任务复杂度',
  category: TemplateCategory.TASK_ANALYSIS,
  content: '分析任务：{{taskName}}',
  variables: [
    {
      name: 'taskName',
      type: 'string',
      description: '任务名称',
      required: true,
    }
  ],
});
```

#### 搜索模板

```typescript
searchTemplates(filter?: Partial<TemplateFilter>): PromptTemplate[]
```

**参数:**
- `filter`: 搜索过滤条件

**返回值:**
- `PromptTemplate[]`: 匹配的模板列表

**示例:**
```typescript
const templates = templateManager.searchTemplates({
  category: TemplateCategory.TASK_ANALYSIS,
  search: '任务',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
});
```

#### 渲染模板

```typescript
async renderTemplate(
  templateId: string,
  context: TemplateContext
): Promise<TemplateRenderResult>
```

**参数:**
- `templateId`: 模板ID
- `context`: 渲染上下文

**返回值:**
- `Promise<TemplateRenderResult>`: 渲染结果

**示例:**
```typescript
const result = await templateManager.renderTemplate('template-id', {
  variables: {
    taskName: '实现用户登录功能',
    projectId: 'project-123',
  },
});
```

### TaskAnalysisService 服务

#### 分析任务

```typescript
async analyzeTask(taskData: TaskData): Promise<TaskAnalysisResult>
```

**参数:**
- `taskData`: 任务数据

**返回值:**
- `Promise<TaskAnalysisResult>`: 分析结果

**示例:**
```typescript
const analysis = await analysisService.analyzeTask({
  name: '实现用户登录功能',
  description: '创建用户登录页面和认证逻辑',
  dependencies: ['用户注册功能'],
});
```

### ErrorHandler 工具

#### 处理错误

```typescript
handleError(error: Error, context?: ErrorContext): void
```

**参数:**
- `error`: 错误对象
- `context`: 错误上下文

**示例:**
```typescript
try {
  await apiCall();
} catch (error) {
  errorHandler.handleError(error, {
    component: 'ChatAgent',
    action: 'sendMessage',
    userId: 'user-123',
  });
}
```

#### 添加面包屑

```typescript
addBreadcrumb(breadcrumb: Breadcrumb): void
```

**参数:**
- `breadcrumb`: 面包屑数据

**示例:**
```typescript
errorHandler.addBreadcrumb({
  message: '用户点击发送按钮',
  category: 'user',
  level: 'info',
  timestamp: Date.now(),
});
```

### PerformanceMonitor 工具

#### 记录性能指标

```typescript
recordMetric(
  name: string,
  value: number,
  category: 'render' | 'api' | 'memory' | 'user' | 'error',
  metadata?: Record<string, any>
): void
```

**参数:**
- `name`: 指标名称
- `value`: 指标值
- `category`: 指标分类
- `metadata`: 元数据

**示例:**
```typescript
performanceMonitor.recordMetric('api_response_time', 850, 'api', {
  url: '/api/chat',
  method: 'POST',
  success: true,
});
```

#### 测量函数执行时间

```typescript
measureFunction<T>(name: string, fn: () => T): T
```

**参数:**
- `name`: 测量名称
- `fn`: 要测量的函数

**返回值:**
- `T`: 函数返回值

**示例:**
```typescript
const result = performanceMonitor.measureFunction('complex_calculation', () => {
  return performComplexCalculation();
});
```

## 数据类型定义

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    templateId?: string;
    analysisResult?: TaskAnalysisResult;
    error?: boolean;
  };
}
```

### PromptTemplate

```typescript
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: TemplateTag[];
  content: string;
  variables: TemplateVariable[];
  language: string;
  version: string;
  author?: string;
  builtin: boolean;
  public: boolean;
  usage: {
    count: number;
    lastUsed?: string;
    rating?: number;
    feedback: string[];
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
    size?: number;
    complexity: 'low' | 'medium' | 'high';
  };
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
  };
}
```

### TaskAnalysisResult

```typescript
interface TaskAnalysisResult {
  complexity: {
    score: number;
    factors: string[];
    level: 'low' | 'medium' | 'high';
  };
  timeEstimate: {
    development: number;
    testing: number;
    total: number;
    confidence: number;
  };
  risks: Array<{
    type: string;
    description: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;
  dependencies: Array<{
    name: string;
    type: 'internal' | 'external';
    critical: boolean;
  }>;
  recommendations: string[];
}
```

## 错误处理

### 错误类型

```typescript
enum ErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  TEMPLATE_ERROR = 'template_error',
  ANALYSIS_ERROR = 'analysis_error',
  PERMISSION_ERROR = 'permission_error',
  UNKNOWN_ERROR = 'unknown_error',
}
```

### 错误响应格式

```typescript
interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}
```

## 性能指标

### 关键性能指标 (KPI)

- **响应时间**: API 调用响应时间应 < 2秒
- **渲染时间**: 组件渲染时间应 < 100ms
- **内存使用**: 内存使用应 < 100MB
- **错误率**: 错误率应 < 5%

### 性能监控

系统自动监控以下指标：

- 页面加载时间
- API 响应时间
- 组件渲染时间
- 内存使用情况
- 用户交互延迟
- 错误发生率

## 配置选项

### 环境变量

```bash
# API 配置
REACT_APP_API_BASE_URL=http://localhost:3001
REACT_APP_API_TIMEOUT=30000

# 性能监控
REACT_APP_PERFORMANCE_MONITORING=true
REACT_APP_ERROR_REPORTING=true

# 模板配置
REACT_APP_DEFAULT_TEMPLATE_LANGUAGE=zh
REACT_APP_MAX_TEMPLATE_SIZE=10000
```

### 运行时配置

```typescript
interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  performance: {
    monitoring: boolean;
    thresholds: {
      apiResponseTime: number;
      renderTime: number;
      memoryUsage: number;
    };
  };
  templates: {
    defaultLanguage: string;
    maxSize: number;
    cacheSize: number;
  };
}
```

## 最佳实践

### 1. 错误处理

```typescript
// 推荐的错误处理方式
try {
  const result = await apiCall();
  return result;
} catch (error) {
  errorHandler.handleError(error, {
    component: 'ComponentName',
    action: 'actionName',
  });
  
  // 提供用户友好的错误信息
  showUserError('操作失败，请稍后重试');
  
  // 返回默认值或重试
  return defaultValue;
}
```

### 2. 性能优化

```typescript
// 使用性能监控装饰器
@measurePerformance('expensiveOperation')
async function expensiveOperation() {
  // 复杂操作
}

// 手动记录性能指标
const startTime = performance.now();
await operation();
const endTime = performance.now();
performanceMonitor.recordMetric('operation_time', endTime - startTime, 'user');
```

### 3. 模板使用

```typescript
// 推荐的模板使用方式
const template = await templateManager.getTemplate('template-id');
if (template) {
  const result = await templateManager.renderTemplate(template.id, {
    variables: {
      // 确保提供所有必需变量
      ...requiredVariables,
    },
  });
  
  if (result.errors.length === 0) {
    // 使用渲染结果
    useRenderedContent(result.content);
  } else {
    // 处理渲染错误
    handleRenderErrors(result.errors);
  }
}
```

## 版本历史

### v1.0.0 (当前版本)
- 初始版本发布
- 基础 ChatAgent 功能
- 模板系统
- 任务分析功能
- 错误处理和性能监控

### 计划中的功能
- 多语言支持增强
- 高级模板功能
- 实时协作
- 插件系统

## 支持和反馈

如有问题或建议，请通过以下方式联系：

- 项目仓库: [GitHub Repository]
- 问题报告: [Issue Tracker]
- 文档反馈: [Documentation Feedback]