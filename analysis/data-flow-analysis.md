# MCP Shrimp Task Manager 数据流转机制分析

## 1. 数据流转概览

MCP Shrimp Task Manager 的数据流转涉及多个层面：
- **MCP 协议层**：AI 客户端与 MCP 服务器的通信
- **工具调用层**：工具间的参数传递和结果返回
- **持久化层**：任务数据的存储和检索
- **会话管理层**：项目上下文的维护

## 2. MCP 协议层数据流

### 2.1 工具调用请求流程
```
AI 客户端 → MCP 服务器
{
  "method": "tools/call",
  "params": {
    "name": "plan_task",
    "arguments": {
      "description": "用户任务描述",
      "requirements": "技术要求",
      "existingTasksReference": false
    }
  }
}
```

### 2.2 参数验证和处理
```typescript
// src/index.ts 中的处理逻辑
parsedArgs = await planTaskSchema.safeParseAsync(request.params.arguments);
if (!parsedArgs.success) {
  throw new Error(`Invalid arguments: ${parsedArgs.error.message}`);
}
return await planTask(parsedArgs.data);
```

### 2.3 响应数据格式
```
MCP 服务器 → AI 客户端
{
  "content": [
    {
      "type": "text",
      "text": "生成的提示词内容"
    }
  ]
}
```

## 3. 工具间数据传递机制

### 3.1 深度调用路径的数据流

#### Step 1: plan_task → analyze_task
```
plan_task 输出:
- 结构化的任务规划提示词
- 包含任务描述、需求分析、实施建议

analyze_task 输入:
- summary: 任务摘要 (从 plan_task 结果提取)
- initialConcept: 初步解决方案概念
- previousAnalysis: 可选的前期分析结果
```

#### Step 2: analyze_task → reflect_task
```
analyze_task 输出:
- 技术分析提示词
- 包含架构设计、实施策略、风险评估

reflect_task 输入:
- summary: 任务摘要 (保持一致性)
- analysis: 完整的技术分析结果
```

#### Step 3: reflect_task → split_tasks
```
reflect_task 输出:
- 反思和优化建议
- 解决方案完整性评估

split_tasks 输入:
- tasksRaw: JSON 格式的任务列表
- globalAnalysisResult: 全局分析结果
- updateMode: 任务更新模式
```

#### Step 4: split_tasks → 任务数据库
```
split_tasks 处理:
1. 解析 JSON 任务数据
2. 验证任务结构和依赖关系
3. 生成 UUID 标识符
4. 存储到 tasks.json 文件

数据结构:
{
  "id": "uuid-v4",
  "name": "任务名称",
  "description": "详细描述",
  "status": "PENDING",
  "dependencies": ["依赖任务ID"],
  "relatedFiles": [...],
  "createdAt": "ISO时间戳"
}
```

#### Step 5: 任务数据库 → execute_task
```
execute_task 输入:
- taskId: 要执行的任务UUID

execute_task 处理:
1. 从数据库加载任务详情
2. 检查依赖关系是否满足
3. 生成执行指导提示词
4. 返回结构化的执行指南
```

### 3.2 数据传递的关键特征

#### 优势
- ✅ **类型安全**：Zod Schema 确保数据结构正确
- ✅ **持久化**：任务数据存储在文件系统中
- ✅ **可追溯**：每个任务都有唯一标识符和时间戳
- ✅ **依赖管理**：支持任务间的依赖关系

#### 局限性
- ❌ **状态不连续**：工具调用间缺乏持续的上下文状态
- ❌ **信息丢失**：AI 分析结果无法在工具间直接传递
- ❌ **重复分析**：每次调用都需要重新构建上下文

## 4. 持久化层数据管理

### 4.1 任务数据存储结构
```
shrimpdata/
├── [project-name]/
│   ├── tasks.json          # 任务数据
│   ├── project-session.json # 项目会话信息
│   └── memory/             # 记忆文件
│       ├── completed-tasks-backup-[timestamp].json
│       └── analysis-results/
```

### 4.2 数据操作接口

#### 任务 CRUD 操作
```typescript
// src/models/taskModel.ts
export async function getAllTasks(): Promise<Task[]>
export async function getTaskById(id: string): Promise<Task | null>
export async function createTask(task: Omit<Task, 'id' | 'createdAt'>): Promise<Task>
export async function updateTask(id: string, updates: Partial<Task>): Promise<Task>
export async function deleteTask(id: string): Promise<void>
```

#### 文件锁机制
```typescript
// src/utils/fileLock.ts
export async function withFileLock<T>(
  filePath: string,
  operation: () => Promise<T>
): Promise<T>
```

### 4.3 数据一致性保障

#### 并发控制
- 使用文件锁防止并发写入冲突
- 原子性操作确保数据完整性

#### 备份机制
- 自动备份已完成任务
- 支持数据恢复和回滚

## 5. 会话管理层

### 5.1 项目上下文管理
```typescript
// src/utils/projectSession.ts
export interface ProjectSession {
  projectName: string;
  lastActiveTime: Date;
  taskCount: number;
  completedTaskCount: number;
  sessionMetadata: Record<string, any>;
}
```

### 5.2 上下文传递机制

#### 项目级别上下文
- 项目名称和基本信息
- 任务统计和进度信息
- 会话元数据

#### 任务级别上下文
- 任务依赖关系
- 相关文件信息
- 执行历史记录

## 6. 数据流优化建议

### 6.1 当前问题分析

#### 问题 1：工具间状态断裂
**现状：**
- 每个工具调用都是独立的
- AI 需要重新构建上下文
- 分析结果无法直接传递

**影响：**
- 降低 AI 调用效率
- 可能导致不一致的分析结果

#### 问题 2：数据传递依赖 AI 理解
**现状：**
- 通过提示词传递复杂信息
- 依赖 AI 正确解析和提取数据
- 容易出现信息丢失或误解

**影响：**
- 数据传递不可靠
- 增加 AI 处理负担

### 6.2 优化方案建议

#### 方案 1：实现工具调用上下文管理器
```typescript
interface ToolCallContext {
  sessionId: string;
  callChain: string[];
  sharedState: Record<string, any>;
  analysisResults: Record<string, any>;
}

class ToolCallContextManager {
  async saveContext(context: ToolCallContext): Promise<void>
  async loadContext(sessionId: string): Promise<ToolCallContext>
  async updateSharedState(sessionId: string, updates: Record<string, any>): Promise<void>
}
```

#### 方案 2：结构化数据传递
```typescript
interface StructuredAnalysisResult {
  taskId: string;
  analysisType: 'plan' | 'analyze' | 'reflect';
  results: {
    complexity: number;
    risks: string[];
    recommendations: string[];
    technicalDetails: Record<string, any>;
  };
  metadata: {
    timestamp: Date;
    toolVersion: string;
  };
}
```

#### 方案 3：智能状态恢复
```typescript
class StateRecoveryManager {
  async recoverFromPreviousCall(
    currentTool: string,
    previousResults: any[]
  ): Promise<ToolCallContext>
  
  async predictNextToolNeeds(
    currentTool: string,
    currentResults: any
  ): Promise<Record<string, any>>
}
```

## 7. 实施优先级建议

### 高优先级
1. **工具调用上下文管理器**：解决状态断裂问题
2. **结构化数据传递**：提高数据传递可靠性

### 中优先级
3. **智能状态恢复**：提升用户体验
4. **性能监控**：优化数据流效率

### 低优先级
5. **高级缓存机制**：减少重复计算
6. **分布式状态管理**：支持多实例部署

这些优化将显著提升 MCP Shrimp Task Manager 的数据流转效率和 AI 调用体验。