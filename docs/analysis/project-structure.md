# 项目结构和编码标准

## 目录结构

```
mcp-shrimp-task-manager/
├── docs/                           # 项目文档
│   ├── analysis/                   # 分析报告
│   │   ├── nextchat-analysis.md    # NextChat分析报告
│   │   ├── chatagent-architecture.md # ChatAgent架构分析
│   │   ├── technical-specifications.md # 技术规范
│   │   └── project-structure.md    # 项目结构文档
│   └── api/                        # API文档
├── tools/task-viewer/              # Task Viewer应用
│   ├── src/                        # 源代码
│   │   ├── components/             # React组件
│   │   │   ├── ui/                 # 通用UI组件
│   │   │   ├── chat/               # 聊天相关组件
│   │   │   └── analysis/           # 分析相关组件
│   │   ├── services/               # 业务逻辑服务
│   │   ├── hooks/                  # 自定义Hooks
│   │   ├── types/                  # TypeScript类型定义
│   │   ├── utils/                  # 工具函数
│   │   ├── styles/                 # 样式文件
│   │   ├── i18n/                   # 国际化文件
│   │   └── tests/                  # 测试文件
│   ├── dist/                       # 构建输出
│   ├── package.json                # 项目配置
│   ├── vite.config.js              # Vite配置
│   ├── vitest.config.js            # 测试配置
│   ├── tsconfig.json               # TypeScript配置
│   ├── .eslintrc.json              # ESLint配置
│   └── server.js                   # 服务器文件
└── src/                            # 主项目源码
    ├── models/                     # 数据模型
    ├── tools/                      # MCP工具
    ├── types/                      # 类型定义
    └── utils/                      # 工具函数
```

## 编码标准

### 1. 命名规范

#### 1.1 文件命名
- **组件文件**: PascalCase + .jsx/.tsx
  ```
  ChatAgent.jsx
  TaskAnalysisService.tsx
  TypingIndicator.tsx
  ```

- **工具文件**: camelCase + .js/.ts
  ```
  errorHandler.js
  apiClient.ts
  formatUtils.js
  ```

- **样式文件**: kebab-case + .module.css
  ```
  chat-agent.module.css
  typing-indicator.module.css
  ```

#### 1.2 变量和函数命名
```typescript
// 变量: camelCase
const userMessage = 'Hello';
const isLoading = false;
const selectedAgents = [];

// 函数: camelCase
function handleSendMessage() {}
const analyzeTaskComplexity = () => {};

// 常量: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';

// 类: PascalCase
class TaskAnalysisService {}
interface ChatMessage {}
type AnalysisResult = {};
```

### 2. 代码组织

#### 2.1 组件结构
```typescript
// 标准组件结构
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ChatAgent.module.css';

interface ChatAgentProps {
  currentTask: Task | null;
  onTaskUpdate: (task: Task) => void;
}

export const ChatAgent: React.FC<ChatAgentProps> = ({
  currentTask,
  onTaskUpdate
}) => {
  // 1. Hooks
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // 3. Event handlers
  const handleSendMessage = () => {
    // Handler logic
  };

  // 4. Render
  return (
    <div className={styles.container}>
      {/* JSX content */}
    </div>
  );
};

export default ChatAgent;
```

#### 2.2 服务类结构
```typescript
// 标准服务类结构
import { z } from 'zod';

// 1. Types and schemas
const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

type Task = z.infer<typeof TaskSchema>;

// 2. Service class
export class TaskAnalysisService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  // Public methods
  public async analyzeComplexity(task: Task): Promise<ComplexityResult> {
    // Validate input
    const validatedTask = TaskSchema.parse(task);
    
    // Business logic
    return this.performAnalysis(validatedTask);
  }

  // Private methods
  private async performAnalysis(task: Task): Promise<ComplexityResult> {
    // Implementation
  }
}
```

### 3. TypeScript规范

#### 3.1 类型定义
```typescript
// 基础类型
interface User {
  id: string;
  name: string;
  email?: string;
}

// 联合类型
type Status = 'pending' | 'in_progress' | 'completed';

// 泛型类型
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// 函数类型
type EventHandler<T> = (event: T) => void;
```

#### 3.2 严格模式配置
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 4. 测试规范

#### 4.1 测试文件命名
```
src/
├── components/
│   ├── ChatAgent.tsx
│   └── ChatAgent.test.tsx
├── services/
│   ├── TaskAnalysisService.ts
│   └── TaskAnalysisService.test.ts
└── utils/
    ├── errorHandler.ts
    └── errorHandler.test.ts
```

#### 4.2 测试结构
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatAgent } from './ChatAgent';

describe('ChatAgent', () => {
  // Setup
  const mockProps = {
    currentTask: null,
    onTaskUpdate: vi.fn(),
  };

  // Test cases
  it('should render without crashing', () => {
    render(<ChatAgent {...mockProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle message sending', async () => {
    // Test implementation
  });
});
```

### 5. 样式规范

#### 5.1 CSS Modules
```css
/* ChatAgent.module.css */
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messageList {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.inputArea {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    height: 100vh;
  }
}
```

#### 5.2 CSS变量
```css
:root {
  /* 颜色 */
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  
  /* 间距 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  
  /* 字体 */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}
```

### 6. 错误处理规范

#### 6.1 错误类型定义
```typescript
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error',
  SYSTEM_ERROR = 'system_error'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}
```

#### 6.2 错误处理模式
```typescript
// Service层错误处理
export class TaskAnalysisService {
  async analyzeTask(task: Task): Promise<AnalysisResult> {
    try {
      const result = await this.apiClient.post('/analyze', task);
      return result.data;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw new AppError({
          type: ErrorType.NETWORK_ERROR,
          message: 'Network connection failed',
          details: error,
          timestamp: new Date().toISOString()
        });
      }
      throw error;
    }
  }
}

// 组件层错误处理
export const ChatAgent: React.FC<Props> = () => {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = (error: AppError) => {
    setError(error);
    // 错误上报
    errorReporter.report(error);
  };

  return (
    <ErrorBoundary onError={handleError}>
      {/* Component content */}
    </ErrorBoundary>
  );
};
```

### 7. 性能优化规范

#### 7.1 组件优化
```typescript
// 使用React.memo优化渲染
export const MessageItem = React.memo<MessageItemProps>(({ message }) => {
  return <div>{message.content}</div>;
});

// 使用useMemo优化计算
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 使用useCallback优化函数
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

#### 7.2 代码分割
```typescript
// 路由级别的代码分割
const ChatAgent = lazy(() => import('./components/ChatAgent'));
const TaskAnalysis = lazy(() => import('./components/TaskAnalysis'));

// 组件级别的懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 8. 国际化规范

#### 8.1 翻译键命名
```json
{
  "chat": {
    "title": "AI Chat Assistant",
    "placeholder": "Type your message...",
    "send": "Send",
    "error": {
      "networkError": "Network connection failed",
      "apiError": "API request failed"
    }
  },
  "analysis": {
    "complexity": {
      "title": "Complexity Analysis",
      "score": "Complexity Score: {{score}}"
    }
  }
}
```

#### 8.2 使用模式
```typescript
// 在组件中使用翻译
const { t } = useTranslation();

return (
  <div>
    <h1>{t('chat.title')}</h1>
    <p>{t('analysis.complexity.score', { score: 8 })}</p>
  </div>
);
```

## 质量保证

### 1. 代码检查
```bash
# 运行所有质量检查
npm run quality

# 单独运行检查
npm run lint          # ESLint检查
npm run type-check    # TypeScript类型检查
npm run test:coverage # 测试覆盖率
```

### 2. 提交前检查
- 代码格式化 (Prettier)
- ESLint检查通过
- TypeScript编译通过
- 单元测试通过
- 测试覆盖率 >80%

### 3. 性能指标
- 首屏加载时间 <2秒
- 交互响应时间 <100ms
- 包大小 <5MB
- 内存使用 <100MB

## 结论

本文档定义了AI Chat Agent优化项目的完整编码标准和项目结构。严格遵循这些规范将确保代码质量、可维护性和团队协作效率。所有开发者都应该熟悉并遵循这些标准。