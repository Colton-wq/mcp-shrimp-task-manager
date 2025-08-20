# NextChat 轻量化定制实施方案

## 方案概述

基于对NextChat源码的深度分析，本方案旨在创建一个轻量化的NextChat定制版本，专门为Shrimp Task Manager项目服务，实现高效的AI聊天功能与任务管理的深度集成。

## 定制目标

### 主要目标
1. **减少包大小**: 从~15MB压缩到~8MB
2. **提升性能**: 首屏加载时间减少40%
3. **简化功能**: 移除非核心功能，专注聊天和任务管理
4. **深度集成**: 与Shrimp Task Manager无缝集成

### 技术目标
- 保留NextChat的聊天核心功能
- 集成Shrimp的任务分析和模板系统
- 统一MCP工具生态
- 优化用户体验和性能

## 详细实施方案

### 阶段一：NextChat轻量化改造

#### 1.1 功能模块移除清单

**立即移除的功能**:
```typescript
// 移除的组件和功能
const REMOVED_FEATURES = {
  // 插件系统 - 完全移除
  plugins: {
    files: [
      'app/components/plugins.tsx',
      'app/store/plugin.ts',
      'app/api/plugins/*'
    ],
    dependencies: ['@vercel/analytics', 'html2canvas'],
    sizeReduction: '~2MB'
  },
  
  // Artifacts系统 - 移除代码执行功能
  artifacts: {
    files: [
      'app/components/artifacts.tsx',
      'app/store/artifact.ts'
    ],
    dependencies: ['katex', 'mermaid'],
    sizeReduction: '~1.5MB'
  },
  
  // 多模型支持 - 只保留OpenAI和Anthropic
  multiModel: {
    files: [
      'app/client/platforms/baidu.ts',
      'app/client/platforms/bytedance.ts',
      'app/client/platforms/alibaba.ts',
      'app/client/platforms/tencent.ts',
      'app/client/platforms/moonshot.ts',
      'app/client/platforms/iflytek.ts',
      'app/client/platforms/deepseek.ts',
      'app/client/platforms/xai.ts',
      'app/client/platforms/chatglm.ts',
      'app/client/platforms/siliconflow.ts',
      'app/client/platforms/ai302.ts'
    ],
    sizeReduction: '~1MB'
  },
  
  // 高级设置选项
  advancedSettings: {
    removedOptions: [
      'enableInjectSystemPrompts',
      'template',
      'historyMessageCount',
      'compressMessageLengthThreshold',
      'sendBotMessages',
      'submitKey',
      'avatar',
      'fontSize',
      'inputTemplate'
    ],
    sizeReduction: '~0.5MB'
  },
  
  // 多语言支持 - 只保留中英文
  multiLanguage: {
    files: [
      'app/locales/ar.ts',
      'app/locales/bn.ts',
      'app/locales/cs.ts',
      'app/locales/de.ts',
      'app/locales/es.ts',
      'app/locales/fr.ts',
      'app/locales/it.ts',
      'app/locales/ja.ts',
      'app/locales/ko.ts',
      'app/locales/no.ts',
      'app/locales/pt.ts',
      'app/locales/ru.ts',
      'app/locales/sk.ts',
      'app/locales/sv.ts',
      'app/locales/tr.ts',
      'app/locales/vi.ts'
    ],
    sizeReduction: '~0.8MB'
  }
};
```

#### 1.2 保留的核心功能

**必须保留的功能**:
```typescript
const CORE_FEATURES = {
  // 聊天核心
  chat: {
    files: [
      'app/components/chat.tsx',
      'app/store/chat.ts',
      'app/components/chat-list.tsx',
      'app/components/message.tsx'
    ],
    features: [
      '多会话管理',
      '消息历史记录',
      '流式响应',
      '消息编辑和重新生成',
      '上下文管理'
    ]
  },
  
  // MCP集成
  mcp: {
    files: [
      'app/mcp/actions.ts',
      'app/mcp/client.ts',
      'app/mcp/types.ts',
      'app/mcp/logger.ts'
    ],
    features: [
      'MCP服务器管理',
      '工具调用',
      '状态监控',
      '配置管理'
    ]
  },
  
  // 基础配置
  config: {
    files: [
      'app/store/config.ts',
      'app/components/settings.tsx'
    ],
    features: [
      'API设置',
      '模型选择',
      '主题切换',
      '基础界面设置'
    ]
  },
  
  // 角色面具
  masks: {
    files: [
      'app/store/mask.ts',
      'app/components/masks.tsx',
      'app/components/mask.tsx'
    ],
    features: [
      '提示词模板',
      '角色管理',
      '导入导出'
    ]
  }
};
```

#### 1.3 轻量化构建配置

**优化的package.json**:
```json
{
  "name": "nextchat-lightweight",
  "version": "1.0.0",
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "typescript": "^5.5.4",
    "zustand": "^4.5.4",
    "sass": "^1.77.8",
    "react-router-dom": "^6.26.0",
    "react-markdown": "^9.0.1",
    "use-debounce": "^10.0.1",
    "emoji-js": "^9.0.0",
    "nanoid": "^5.0.7"
  },
  "removedDependencies": [
    "@vercel/analytics",
    "html2canvas",
    "katex",
    "mermaid",
    "qrcode",
    "spark-md5",
    "@tabler/icons-react",
    "fuse.js"
  ]
}
```

**优化的next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用实验性功能
  experimental: {
    appDir: true,
  },
  
  // 构建优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 包分析
  webpack: (config, { isServer }) => {
    // Tree shaking优化
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;
    
    // 代码分割
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // 移除未使用的功能
  env: {
    DISABLE_PLUGINS: 'true',
    DISABLE_ARTIFACTS: 'true',
    DISABLE_MULTI_MODEL: 'true',
  },
};

module.exports = nextConfig;
```

### 阶段二：Shrimp功能集成

#### 2.1 统一状态管理

**创建统一的Store架构**:
```typescript
// app/store/unified.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatStore } from './chat';
import { ConfigStore } from './config';
import { TaskAnalysisStore } from './task-analysis';
import { TemplateStore } from './template';
import { PerformanceStore } from './performance';

interface UnifiedStore {
  // NextChat原有状态
  chat: ChatStore;
  config: ConfigStore;
  
  // Shrimp集成状态
  taskAnalysis: TaskAnalysisStore;
  templates: TemplateStore;
  performance: PerformanceStore;
  
  // 统一操作
  reset: () => void;
  export: () => string;
  import: (data: string) => void;
}

export const useUnifiedStore = create<UnifiedStore>()(
  persist(
    (set, get) => ({
      // 初始化各个子store
      chat: createChatStore(),
      config: createConfigStore(),
      taskAnalysis: createTaskAnalysisStore(),
      templates: createTemplateStore(),
      performance: createPerformanceStore(),
      
      // 统一操作实现
      reset: () => {
        set((state) => ({
          ...state,
          chat: createChatStore(),
          config: createConfigStore(),
          taskAnalysis: createTaskAnalysisStore(),
          templates: createTemplateStore(),
          performance: createPerformanceStore(),
        }));
      },
      
      export: () => {
        const state = get();
        return JSON.stringify({
          chat: state.chat,
          config: state.config,
          taskAnalysis: state.taskAnalysis,
          templates: state.templates,
        });
      },
      
      import: (data: string) => {
        try {
          const imported = JSON.parse(data);
          set((state) => ({
            ...state,
            ...imported,
          }));
        } catch (error) {
          console.error('Import failed:', error);
        }
      },
    }),
    {
      name: 'unified-store',
      partialize: (state) => ({
        chat: state.chat,
        config: state.config,
        taskAnalysis: state.taskAnalysis,
        templates: state.templates,
      }),
    }
  )
);
```

#### 2.2 任务分析集成

**扩展聊天组件支持任务分析**:
```typescript
// app/components/chat-with-analysis.tsx
import React, { useState, useCallback } from 'react';
import { Chat } from './chat';
import { TaskAnalysisPanel } from './task-analysis-panel';
import { TemplateSelector } from './template-selector';
import { useUnifiedStore } from '../store/unified';
import { TaskAnalysisService } from '../services/task-analysis';
import { PromptTemplateManager } from '../services/template-manager';

export function ChatWithAnalysis() {
  const { chat, taskAnalysis, templates } = useUnifiedStore();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const analysisService = new TaskAnalysisService();
  const templateManager = new PromptTemplateManager();
  
  // 任务分析处理
  const handleTaskAnalysis = useCallback(async (message: string) => {
    if (isTaskDescription(message)) {
      setShowAnalysis(true);
      const result = await analysisService.analyzeTask({
        description: message,
        context: chat.currentSession?.context,
      });
      
      taskAnalysis.setAnalysisResult(result);
      
      // 自动建议相关模板
      const suggestedTemplates = await templateManager.searchTemplates({
        category: result.category,
        complexity: result.complexity.level,
      });
      
      templates.setSuggestedTemplates(suggestedTemplates);
    }
  }, [chat.currentSession, taskAnalysis, templates]);
  
  // 模板应用处理
  const handleTemplateApply = useCallback(async (templateId: string, variables: Record<string, any>) => {
    const template = await templateManager.getTemplate(templateId);
    if (template) {
      const rendered = await templateManager.renderTemplate(templateId, { variables });
      
      // 将渲染结果发送到聊天
      chat.sendMessage(rendered.content, {
        templateId,
        variables,
        metadata: rendered.metadata,
      });
      
      setShowTemplates(false);
    }
  }, [chat, templateManager]);
  
  return (
    <div className="chat-with-analysis">
      <div className="chat-main">
        <Chat 
          onMessageSend={handleTaskAnalysis}
          showAnalysisButton={true}
          showTemplateButton={true}
          onAnalysisToggle={() => setShowAnalysis(!showAnalysis)}
          onTemplateToggle={() => setShowTemplates(!showTemplates)}
        />
      </div>
      
      {showAnalysis && (
        <div className="analysis-panel">
          <TaskAnalysisPanel
            result={taskAnalysis.currentResult}
            onClose={() => setShowAnalysis(false)}
            onApplyTemplate={handleTemplateApply}
          />
        </div>
      )}
      
      {showTemplates && (
        <div className="template-panel">
          <TemplateSelector
            templates={templates.availableTemplates}
            suggested={templates.suggestedTemplates}
            onSelect={handleTemplateApply}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}
    </div>
  );
}

// 判断是否为任务描述的辅助函数
function isTaskDescription(message: string): boolean {
  const taskKeywords = [
    '实现', '开发', '创建', '设计', '优化', '修复', '添加',
    '需要', '要求', '任务', '功能', '模块', '系统', '接口'
  ];
  
  return taskKeywords.some(keyword => message.includes(keyword)) && message.length > 20;
}
```

#### 2.3 MCP系统统一

**创建统一的MCP管理器**:
```typescript
// app/mcp/unified-manager.ts
import { NextChatMCPClient } from './client';
import { ShrimpMCPClient } from '../../../services/mcp-client';
import { MCPTool, MCPCallResult } from './types';

export class UnifiedMCPManager {
  private nextchatMCP: NextChatMCPClient;
  private shrimpMCP: ShrimpMCPClient;
  private toolRegistry: Map<string, 'nextchat' | 'shrimp'> = new Map();
  
  constructor() {
    this.nextchatMCP = new NextChatMCPClient();
    this.shrimpMCP = new ShrimpMCPClient();
    this.initializeToolRegistry();
  }
  
  private initializeToolRegistry() {
    // NextChat工具
    const nextchatTools = [
      'web_search',
      'file_operations',
      'code_execution',
      'image_generation'
    ];
    
    // Shrimp工具
    const shrimpTools = [
      'task_analysis',
      'template_management',
      'performance_monitoring',
      'project_management'
    ];
    
    nextchatTools.forEach(tool => this.toolRegistry.set(tool, 'nextchat'));
    shrimpTools.forEach(tool => this.toolRegistry.set(tool, 'shrimp'));
  }
  
  async getAvailableTools(): Promise<MCPTool[]> {
    const [nextchatTools, shrimpTools] = await Promise.all([
      this.nextchatMCP.listTools(),
      this.shrimpMCP.listTools()
    ]);
    
    return [
      ...nextchatTools.map(tool => ({ ...tool, source: 'nextchat' as const })),
      ...shrimpTools.map(tool => ({ ...tool, source: 'shrimp' as const }))
    ];
  }
  
  async callTool(toolName: string, params: any): Promise<MCPCallResult> {
    const source = this.toolRegistry.get(toolName);
    
    if (!source) {
      throw new Error(`Unknown tool: ${toolName}`);
    }
    
    try {
      if (source === 'nextchat') {
        return await this.nextchatMCP.callTool(toolName, params);
      } else {
        return await this.shrimpMCP.callTool(toolName, params);
      }
    } catch (error) {
      console.error(`Tool call failed: ${toolName}`, error);
      throw error;
    }
  }
  
  async getToolStatus(): Promise<Record<string, 'available' | 'unavailable' | 'error'>> {
    const tools = await this.getAvailableTools();
    const status: Record<string, 'available' | 'unavailable' | 'error'> = {};
    
    for (const tool of tools) {
      try {
        // 简单的健康检查
        await this.callTool(tool.name, {});
        status[tool.name] = 'available';
      } catch (error) {
        status[tool.name] = 'error';
      }
    }
    
    return status;
  }
}

export const unifiedMCPManager = new UnifiedMCPManager();
```

### 阶段三：界面优化和集成

#### 3.1 统一样式系统

**创建统一的样式变量**:
```scss
// app/styles/unified-variables.scss
:root {
  // NextChat原有变量
  --nc-primary: #1976d2;
  --nc-primary-hover: #1565c0;
  --nc-background: #ffffff;
  --nc-surface: #f5f5f5;
  --nc-text: #333333;
  --nc-text-secondary: #666666;
  
  // Shrimp变量
  --shrimp-primary: #3b82f6;
  --shrimp-primary-hover: #2563eb;
  --shrimp-success: #10b981;
  --shrimp-warning: #f59e0b;
  --shrimp-error: #ef4444;
  
  // 统一变量（优先使用Shrimp的设计系统）
  --unified-primary: var(--shrimp-primary);
  --unified-primary-hover: var(--shrimp-primary-hover);
  --unified-success: var(--shrimp-success);
  --unified-warning: var(--shrimp-warning);
  --unified-error: var(--shrimp-error);
  
  // 间距系统
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  // 字体系统
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  // 圆角系统
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  // 阴影系统
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

// 暗色主题
[data-theme="dark"] {
  --nc-background: #1a1a1a;
  --nc-surface: #2d2d2d;
  --nc-text: #ffffff;
  --nc-text-secondary: #cccccc;
  
  --unified-background: var(--nc-background);
  --unified-surface: var(--nc-surface);
  --unified-text: var(--nc-text);
  --unified-text-secondary: var(--nc-text-secondary);
}
```

#### 3.2 响应式布局优化

**创建统一的布局组件**:
```typescript
// app/components/unified-layout.tsx
import React, { useState } from 'react';
import { Sidebar } from './sidebar';
import { ChatWithAnalysis } from './chat-with-analysis';
import { SettingsPanel } from './settings-panel';
import { useMobileScreen } from '../utils';
import styles from './unified-layout.module.scss';

export function UnifiedLayout() {
  const isMobile = useMobileScreen();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className={styles.layout}>
      {/* 侧边栏 */}
      {(showSidebar || !isMobile) && (
        <div className={styles.sidebar}>
          <Sidebar
            onClose={() => setShowSidebar(false)}
            onSettingsOpen={() => setShowSettings(true)}
          />
        </div>
      )}
      
      {/* 主内容区 */}
      <div className={styles.main}>
        <ChatWithAnalysis />
      </div>
      
      {/* 设置面板 */}
      {showSettings && (
        <div className={styles.settingsOverlay}>
          <SettingsPanel
            onClose={() => setShowSettings(false)}
          />
        </div>
      )}
      
      {/* 移动端菜单按钮 */}
      {isMobile && !showSidebar && (
        <button
          className={styles.menuButton}
          onClick={() => setShowSidebar(true)}
        >
          ☰
        </button>
      )}
    </div>
  );
}
```

### 阶段四：性能优化

#### 4.1 代码分割和懒加载

**优化的组件加载**:
```typescript
// app/components/lazy-components.tsx
import { lazy, Suspense } from 'react';
import { Loading } from './loading';

// 懒加载非核心组件
export const LazySettings = lazy(() => import('./settings').then(m => ({ default: m.Settings })));
export const LazyMasks = lazy(() => import('./masks').then(m => ({ default: m.Masks })));
export const LazyTaskAnalysis = lazy(() => import('./task-analysis-panel').then(m => ({ default: m.TaskAnalysisPanel })));
export const LazyTemplateSelector = lazy(() => import('./template-selector').then(m => ({ default: m.TemplateSelector })));

// 带加载状态的懒加载组件
export function LazyComponentWrapper({ 
  Component, 
  fallback = <Loading />,
  ...props 
}: {
  Component: React.ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
```

#### 4.2 虚拟滚动优化

**优化长对话列表**:
```typescript
// app/components/virtual-message-list.tsx
import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Message } from '../store/chat';
import { MessageComponent } from './message';

interface VirtualMessageListProps {
  messages: Message[];
  height: number;
  onMessageUpdate: (index: number, message: Message) => void;
}

export function VirtualMessageList({ 
  messages, 
  height, 
  onMessageUpdate 
}: VirtualMessageListProps) {
  // 计算每条消息的高度
  const itemData = useMemo(() => ({
    messages,
    onMessageUpdate,
  }), [messages, onMessageUpdate]);
  
  const getItemSize = (index: number) => {
    const message = messages[index];
    // 根据消息内容估算高度
    const baseHeight = 60;
    const contentHeight = Math.ceil(message.content.length / 50) * 20;
    return Math.max(baseHeight, Math.min(contentHeight, 300));
  };
  
  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={getItemSize}
      itemData={itemData}
      overscanCount={5}
    >
      {MessageItem}
    </List>
  );
}

function MessageItem({ index, style, data }: any) {
  const { messages, onMessageUpdate } = data;
  const message = messages[index];
  
  return (
    <div style={style}>
      <MessageComponent
        message={message}
        onUpdate={(updated) => onMessageUpdate(index, updated)}
      />
    </div>
  );
}
```

#### 4.3 缓存策略优化

**智能缓存管理**:
```typescript
// app/utils/cache-manager.ts
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100;
  
  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    // 清理过期缓存
    this.cleanup();
    
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const cacheManager = new CacheManager();
```

## 预期效果

### 性能提升
- **包大小**: 从15MB减少到8MB (47%减少)
- **首屏加载**: 从3.5秒减少到2.1秒 (40%提升)
- **内存使用**: 从120MB减少到80MB (33%减少)
- **运行时性能**: 提升25%

### 功能整合
- **任务分析**: 无缝集成到聊天流程
- **模板系统**: 智能推荐和快速应用
- **MCP工具**: 统一的工具生态
- **用户体验**: 更流畅的交互体验

### 开发效率
- **代码复用**: 利用NextChat成熟代码
- **维护成本**: 降低50%
- **功能扩展**: 更容易添加新功能
- **测试覆盖**: 继承现有测试用例

## 实施时间表

### 第1-2周：基础改造
- [ ] 创建NextChat轻量化分支
- [ ] 移除非核心功能模块
- [ ] 优化构建配置
- [ ] 基础功能测试

### 第3-4周：功能集成
- [ ] 统一状态管理系统
- [ ] 集成任务分析功能
- [ ] 集成模板系统
- [ ] MCP系统统一

### 第5-6周：界面优化
- [ ] 统一样式系统
- [ ] 响应式布局优化
- [ ] 用户体验改进
- [ ] 无障碍功能完善

### 第7-8周：性能优化和测试
- [ ] 代码分割和懒加载
- [ ] 虚拟滚动实现
- [ ] 缓存策略优化
- [ ] 全面性能测试
- [ ] 集成测试和部署

## 风险控制

### 技术风险
- **集成复杂度**: 采用渐进式集成策略
- **性能影响**: 持续性能监控
- **兼容性问题**: 全面测试覆盖

### 缓解措施
- **代码隔离**: 保持模块独立性
- **回滚机制**: 保留原有功能作为备选
- **监控告警**: 实时性能和错误监控

---

**方案制定时间**: 2025-01-19  
**预计完成时间**: 2025-03-15  
**负责团队**: AI Assistant + 开发团队