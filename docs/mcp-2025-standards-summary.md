# MCP 2025-06-18 标准要求总结

## 执行摘要

基于对官方MCP SDK 2025-06-18规范的深入研究，本文档总结了关键的标准要求，重点关注工具描述规范、错误处理标准、输出格式要求等核心内容，为重构工作提供准确的合规性指导。

## 🎯 关键变更概述

### 1. 重大功能更新
- **结构化工具输出**: 支持JSON Schema验证的结构化响应
- **OAuth 2.0资源服务器**: MCP服务器被正式分类为OAuth 2.0资源服务器
- **Elicitation支持**: 服务器可在会话中请求用户输入
- **资源链接**: 工具可返回资源链接而非内联所有内容
- **移除JSON-RPC批处理**: 不再支持批量请求（破坏性变更）

### 2. 安全增强
- **Resource Indicators (RFC 8707)**: 强制实现以防止令牌误用
- **MCP-Protocol-Version头**: HTTP请求必须包含协议版本头
- **增强的安全最佳实践**: 详细的威胁模型和对策

## 📋 工具描述规范要求

### 1. 动作导向原则
**要求**: 工具描述必须以动作动词开头，避免用户友好的描述性语言

**正确示例**:
```json
{
  "name": "get_weather",
  "description": "Get current weather information for a location",
  "title": "Weather Information Provider"
}
```

**错误示例**:
```json
{
  "name": "weather_tool",
  "description": "This friendly tool helps you get weather! 🌤️ It's super easy to use!",
  "title": "Amazing Weather Helper"
}
```

### 2. 必需字段规范
- **name**: 工具的唯一标识符（必需）
- **description**: 功能的简洁描述（必需）
- **inputSchema**: JSON Schema定义的参数（必需）
- **title**: 可选的人类可读名称（可选）
- **outputSchema**: 可选的输出结构定义（可选）
- **annotations**: 可选的工具行为描述（可选）

### 3. 禁止使用的元素
- ❌ Emoji表情符号
- ❌ 过度友好的语言
- ❌ 营销性质的描述
- ❌ 模糊或主观的表达

## 🔧 JSON-RPC错误处理标准

### 1. 标准错误代码
MCP 2025-06-18使用JSON-RPC 2.0标准错误代码：

```json
{
  "-32700": "Parse error",
  "-32600": "Invalid request", 
  "-32601": "Method not found",
  "-32602": "Invalid params",
  "-32603": "Internal error"
}
```

### 2. 协议错误vs工具执行错误

**协议错误示例**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32602,
    "message": "Unknown tool: invalid_tool_name"
  }
}
```

**工具执行错误示例**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Failed to fetch weather data: API rate limit exceeded"
      }
    ],
    "isError": true
  }
}
```

### 3. 错误处理最佳实践
- 使用标准JSON-RPC错误格式
- 提供清晰、可操作的错误消息
- 区分协议错误和业务逻辑错误
- 包含足够的上下文信息用于调试

## 📊 结构化输出格式要求

### 1. 结构化内容支持
工具可以返回结构化JSON对象：

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"temperature\": 22.5, \"conditions\": \"Partly cloudy\", \"humidity\": 65}"
      }
    ],
    "structuredContent": {
      "temperature": 22.5,
      "conditions": "Partly cloudy",
      "humidity": 65
    }
  }
}
```

### 2. 输出Schema验证
- 服务器**必须**提供符合声明schema的结构化结果
- 客户端**应该**根据schema验证结构化结果
- 向后兼容性：结构化内容也应在TextContent块中序列化

### 3. 内容类型支持
- **文本内容**: `type: "text"`
- **图像内容**: `type: "image"` (base64编码)
- **音频内容**: `type: "audio"` (base64编码)
- **资源链接**: `type: "resource_link"`
- **嵌入资源**: `type: "resource"`

## 🔐 安全要求

### 1. 强制性安全措施
**服务器必须**:
- 验证所有工具输入
- 实现适当的访问控制
- 对工具调用进行速率限制
- 清理工具输出

**客户端应该**:
- 对敏感操作提示用户确认
- 在调用服务器前向用户显示工具输入
- 验证工具结果后再传递给LLM
- 实现工具调用超时
- 记录工具使用情况用于审计

### 2. OAuth 2.0集成
- MCP服务器被分类为OAuth 2.0资源服务器
- 必须实现Resource Indicators (RFC 8707)
- 支持完整的OAuth 2.0 schema定义
- 增强的令牌安全性

### 3. 协议版本要求
- HTTP请求必须包含`MCP-Protocol-Version`头
- 缺少版本头时，服务器应默认为`2025-03-26`以保持向后兼容

## 📝 合规性检查清单

### 工具描述合规性 (7项)
1. ✅ 工具名称使用snake_case格式
2. ✅ 描述以动作动词开头
3. ✅ 避免使用emoji和过度友好语言
4. ✅ 包含必需的inputSchema
5. ✅ 提供清晰的参数约束
6. ✅ 使用适当的JSON Schema Draft 2020-12
7. ✅ 包含有意义的title字段（如果提供）

### 错误处理合规性 (4项)
8. ✅ 使用标准JSON-RPC错误代码
9. ✅ 区分协议错误和工具执行错误
10. ✅ 提供清晰的错误消息
11. ✅ 包含适当的错误上下文

### 输出格式合规性 (4项)
12. ✅ 支持结构化内容输出
13. ✅ 实现输出schema验证
14. ✅ 提供向后兼容的文本内容
15. ✅ 正确使用内容类型标识符

### 安全合规性 (6项)
16. ✅ 实现输入验证
17. ✅ 包含访问控制机制
18. ✅ 实现速率限制
19. ✅ 清理输出内容
20. ✅ 支持用户确认流程
21. ✅ 包含MCP-Protocol-Version头

## 🚨 当前实现的主要违规问题

### 1. 工具描述违规
- 使用emoji (🔍, ✅, ❌)
- 过度友好的语言表达
- 缺乏动作导向的描述
- 不符合官方规范的格式

### 2. 错误处理违规
- 未使用标准JSON-RPC错误格式
- 缺乏结构化的错误分类
- 错误消息不够具体和可操作

### 3. 输出格式违规
- 缺乏结构化内容支持
- 未实现输出schema验证
- 输出格式不便于AI模型处理

### 4. 安全违规
- 缺乏适当的输入验证
- 未实现用户确认机制
- 缺少协议版本头支持

## 📈 重构优先级建议

### 高优先级 (立即修复)
1. 移除所有emoji和过度友好语言
2. 重写工具描述为动作导向格式
3. 实现标准JSON-RPC错误处理
4. 添加MCP-Protocol-Version头支持

### 中优先级 (短期内修复)
5. 实现结构化内容输出
6. 添加输出schema验证
7. 增强输入验证机制
8. 实现用户确认流程

### 低优先级 (长期改进)
9. 完整的OAuth 2.0集成
10. Resource Indicators实现
11. 高级安全功能
12. 性能优化和监控

## 🔗 参考资源

- [MCP 2025-06-18官方规范](https://modelcontextprotocol.io/specification/2025-06-18)
- [工具规范详细文档](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- [安全最佳实践](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)
- [JSON-RPC 2.0规范](https://www.jsonrpc.org/specification)
- [RFC 8707 Resource Indicators](https://www.rfc-editor.org/rfc/rfc8707.html)

---
**文档版本**: 1.0
**最后更新**: 2025-08-21
**基于规范**: MCP 2025-06-18
**合规性检查项**: 21项具体要求