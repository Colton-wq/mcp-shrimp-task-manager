# MCPHub 集成启动脚本
# MCPHub Integration Startup Script
# 
# 此脚本确保 shrimp-task-manager 在 MCPHub 聚合环境下正确运行
# This script ensures shrimp-task-manager runs correctly in MCPHub aggregation environment

Write-Host "🚀 Starting Shrimp Task Manager for MCPHub..." -ForegroundColor Green

# 设置工作目录到项目根目录
# Set working directory to project root
$ProjectRoot = "E:\MCP\mcp-shrimp-task-manager"
Set-Location $ProjectRoot
Write-Host "📁 Working directory set to: $ProjectRoot" -ForegroundColor Cyan

# 验证项目根目录
# Verify project root directory
if (-not (Test-Path "$ProjectRoot\package.json")) {
    Write-Error "❌ package.json not found in $ProjectRoot"
    exit 1
}

if (-not (Test-Path "$ProjectRoot\dist\index.js")) {
    Write-Error "❌ dist\index.js not found. Please run 'npm run build' first."
    exit 1
}

# 设置环境变量
# Set environment variables
$env:MCP_PROJECT_ROOT = $ProjectRoot
$env:DATA_DIR = "$ProjectRoot\shrimpdata"
$env:TEMPLATES_USE = "en"
$env:ENABLE_GUI = "true"
$env:NODE_ENV = "production"
$env:MCP_LOG_LEVEL = "info"

Write-Host "🔧 Environment variables configured:" -ForegroundColor Yellow
Write-Host "   MCP_PROJECT_ROOT: $env:MCP_PROJECT_ROOT" -ForegroundColor Gray
Write-Host "   DATA_DIR: $env:DATA_DIR" -ForegroundColor Gray
Write-Host "   TEMPLATES_USE: $env:TEMPLATES_USE" -ForegroundColor Gray
Write-Host "   ENABLE_GUI: $env:ENABLE_GUI" -ForegroundColor Gray
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Gray

# 验证 Node.js 可用性
# Verify Node.js availability
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Node.js not found. Please install Node.js."
    exit 1
}

# 启动服务
# Start the service
Write-Host "🎯 Starting MCP server..." -ForegroundColor Green
try {
    node dist\index.js
} catch {
    Write-Error "❌ Failed to start MCP server: $_"
    exit 1
}