# MCPHub 集成配置指南
# MCPHub Integration Configuration Guide

## 问题描述 Problem Description

当 shrimp-task-manager 通过 MCPHub 聚合服务器运行时，会出现项目根目录检测错误的问题：
- MCPHub 工作目录：`E:\MCP\mcphub`
- 期望的项目目录：`E:\MCP\mcp-shrimp-task-manager`
- 导致文件路径解析失败，代码质量分析工具无法找到目标文件

## 解决方案 Solution

### 方案1：更新 MCPHub 配置（推荐）

修改 `E:\MCP\mcphub\mcp_settings.json` 中的 shrimp-task-manager 配置：

```json
{
  "mcpServers": {
    "shrimp-task-manager": {
      "type": "stdio",
      "command": "node",
      "args": [
        "E:\\MCP\\mcp-shrimp-task-manager\\dist\\index.js"
      ],
      "env": {
        "DATA_DIR": "E:\\MCP\\mcp-shrimp-task-manager\\shrimpdata",
        "TEMPLATES_USE": "en",
        "ENABLE_GUI": "true",
        "NODE_ENV": "production",
        "MCP_LOG_LEVEL": "info",
        "MCP_PROJECT_ROOT": "E:\\MCP\\mcp-shrimp-task-manager"
      },
      "cwd": "E:\\MCP\\mcp-shrimp-task-manager",
      "owner": "admin",
      "enabled": true
    }
  }
}
```

**关键变更**：
1. 添加 `"MCP_PROJECT_ROOT"` 环境变量
2. 添加 `"cwd"` 工作目录设置（如果 MCPHub 支持）

### 方案2：使用启动脚本（备选）

创建启动脚本 `E:\MCP\mcp-shrimp-task-manager\start-for-mcphub.bat`：

```batch
@echo off
cd /d "E:\MCP\mcp-shrimp-task-manager"
set MCP_PROJECT_ROOT=E:\MCP\mcp-shrimp-task-manager
set DATA_DIR=E:\MCP\mcp-shrimp-task-manager\shrimpdata
set TEMPLATES_USE=en
set ENABLE_GUI=true
set NODE_ENV=production
set MCP_LOG_LEVEL=info
node dist\index.js
```

然后在 MCPHub 配置中使用：

```json
{
  "shrimp-task-manager": {
    "type": "stdio",
    "command": "E:\\MCP\\mcp-shrimp-task-manager\\start-for-mcphub.bat",
    "args": [],
    "owner": "admin",
    "enabled": true
  }
}
```

### 方案3：PowerShell 启动脚本（Windows 推荐）

创建 `E:\MCP\mcp-shrimp-task-manager\start-for-mcphub.ps1`：

```powershell
# 设置工作目录
Set-Location "E:\MCP\mcp-shrimp-task-manager"

# 设置环境变量
$env:MCP_PROJECT_ROOT = "E:\MCP\mcp-shrimp-task-manager"
$env:DATA_DIR = "E:\MCP\mcp-shrimp-task-manager\shrimpdata"
$env:TEMPLATES_USE = "en"
$env:ENABLE_GUI = "true"
$env:NODE_ENV = "production"
$env:MCP_LOG_LEVEL = "info"

# 启动服务
node dist\index.js
```

MCPHub 配置：

```json
{
  "shrimp-task-manager": {
    "type": "stdio",
    "command": "powershell",
    "args": [
      "-ExecutionPolicy", "Bypass",
      "-File", "E:\\MCP\\mcp-shrimp-task-manager\\start-for-mcphub.ps1"
    ],
    "owner": "admin",
    "enabled": true
  }
}
```

## 验证步骤 Verification Steps

1. **更新配置后重启 MCPHub**
2. **测试项目根目录检测**：
   ```javascript
   // 在 shrimp-task-manager 中应该返回正确路径
   console.log('Project Root:', findProjectRoot({ debug: true }));
   // 期望输出：E:\MCP\mcp-shrimp-task-manager
   ```

3. **测试代码质量分析**：
   ```javascript
   // 应该能够找到并分析文件
   code_review_and_cleanup_tool({
     project: "code-quality-test",
     taskId: "test-task-id",
     targetFiles: ["src/test-real-quality.ts"]
   });
   ```

## 技术原理 Technical Principles

### 项目根目录检测策略优先级：

1. **环境变量 `MCP_PROJECT_ROOT`**（最高优先级）
2. **命令行参数路径推断**
3. **常见位置搜索**
4. **标准向上查找算法**

### 兼容性保证：

- ✅ **单实例运行**：不影响直接运行的情况
- ✅ **MCPHub 聚合**：通过环境变量和工作目录适配
- ✅ **向后兼容**：现有配置继续工作
- ✅ **多平台支持**：Windows/Linux/macOS

## 故障排除 Troubleshooting

### 问题1：仍然显示 "No files to check"

**解决方案**：
1. 检查环境变量是否正确设置
2. 验证工作目录是否正确
3. 查看调试输出中的项目根目录路径

### 问题2：权限问题

**解决方案**：
1. 确保 MCPHub 有权限访问项目目录
2. 检查 PowerShell 执行策略设置
3. 验证文件路径权限

### 问题3：路径分隔符问题

**解决方案**：
- Windows 使用双反斜杠 `\\` 或正斜杠 `/`
- 确保 JSON 配置中的路径正确转义

## 最佳实践 Best Practices

1. **使用绝对路径**：避免相对路径导致的问题
2. **设置明确的环境变量**：`MCP_PROJECT_ROOT` 提供明确指示
3. **定期验证配置**：确保路径和环境变量正确
4. **监控日志输出**：观察项目根目录检测的调试信息

## 未来改进 Future Improvements

1. **自动配置检测**：自动检测 MCPHub 环境并适配
2. **配置验证工具**：提供配置验证和诊断工具
3. **更智能的路径推断**：基于更多上下文信息推断项目路径