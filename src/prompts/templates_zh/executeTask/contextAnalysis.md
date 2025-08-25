# 上下文分析模板
# Context Analysis Template

## 项目上下文信息
## Project Context Information

**技术栈**: {{techStack}}
**项目类型**: {{projectType}}
**复杂度级别**: {{complexity}}
**相关文件数量**: {{relatedFilesCount}}

## 技术栈特定指导
## Tech Stack Specific Guidance

{{#if react}}
### React 开发指导
- 使用函数组件和 Hooks 进行状态管理
- 实现适当的组件生命周期和 useEffect 清理
- 考虑使用 React.memo 进行性能优化
- 使用 TypeScript 接口定义 props
{{/if}}

{{#if typescript}}
### TypeScript 最佳实践
- 为所有数据结构定义严格的接口
- 使用联合类型控制值的范围
- 实现带类型异常的错误处理
- 利用泛型类型创建可复用组件
{{/if}}

{{#if nodejs}}
### Node.js 开发指导
- 使用 async/await 处理异步操作
- 实现适当的错误处理和日志记录
- 使用环境变量进行配置
- 应用速率限制和输入验证
{{/if}}

{{#if python}}
### Python 开发指导
- 使用类型提示改善代码文档
- 实现适当的异常处理
- 遵循 PEP 8 风格指南
- 使用虚拟环境管理依赖
{{/if}}

## 项目类型特定考虑
## Project Type Specific Considerations

{{#if frontend}}
### 前端项目注意事项
- 确保响应式设计和可访问性
- 优化性能（包大小、加载时间）
- 跨浏览器和设备测试
- 实现适当的状态管理
{{/if}}

{{#if backend}}
### 后端项目注意事项
- 实现强大的输入验证和清理
- 添加适当的认证和授权
- 设计可扩展和高可用性
- 实现全面的日志记录和监控
{{/if}}

{{#if mobile}}
### 移动端项目注意事项
- 优化电池寿命和性能
- 优雅处理网络连接问题
- 在适当的地方实现离线功能
- 遵循平台特定的设计指南
{{/if}}

## 复杂度相关建议
## Complexity-Based Recommendations

{{#if highComplexity}}
### 高复杂度项目策略
- 将实现分解为更小的、可测试的单元
- 实现全面的日志记录和监控
- 使用设计模式创建可维护的架构
- 规划可扩展性和性能优化
{{/if}}

{{#if mediumComplexity}}
### 中等复杂度项目策略
- 专注于清洁、可读的代码结构
- 实现基本的错误处理和验证
- 为核心功能添加单元测试
- 记录关键决策和权衡
{{/if}}

{{#if lowComplexity}}
### 低复杂度项目策略
- 保持实现简单直接
- 专注于正确性而非优化
- 添加基本的错误处理
- 确保代码自文档化
{{/if}}

## 最佳实践建议
## Best Practices Recommendations

### 通用最佳实践
- **版本控制**: 进行原子提交并使用清晰的消息
- **测试**: 在实现前编写测试（TDD 方法）
- **文档**: 更新 README 和内联注释
- **安全**: 遵循 OWASP 安全编码指南

### 实施策略
{{#if highComplexity}}
1. **阶段 1**: 核心架构和接口
2. **阶段 2**: 主要功能实现
3. **阶段 3**: 集成和优化
4. **阶段 4**: 测试和文档
{{else if mediumComplexity}}
1. **阶段 1**: 设计和设置
2. **阶段 2**: 实现和测试
3. **阶段 3**: 集成和验证
{{else}}
1. **阶段 1**: 直接实现
2. **阶段 2**: 测试和验证
{{/if}}

## 关键成功因素
## Critical Success Factors

- 使用 `codebase-retrieval` 在实现前了解现有模式
- 应用 `search_code_desktop-commander` 查找类似实现
- 利用 `Everything MCP` 快速发现文件
- 遵循识别的边界情况并实现适当的错误处理
- 在调用 `verify_task` 前完成所有强制质量门控