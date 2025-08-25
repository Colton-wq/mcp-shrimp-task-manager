# MCP连接错误-32000修复脚本
# 基于2025年最新解决方案：Windows cmd包装和进程清理

Write-Host "🔧 MCP连接错误-32000修复脚本" -ForegroundColor Cyan
Write-Host "基于网络搜索的2025年最新解决方案" -ForegroundColor Gray

# 1. 检查当前npm配置
Write-Host "`n📋 检查npm配置..." -ForegroundColor Yellow
npm config list | Select-String "proxy", "registry"

# 2. 验证npm代理设置
Write-Host "`n🌐 验证npm代理设置..." -ForegroundColor Yellow
$proxyConfig = npm config get proxy
$httpsProxyConfig = npm config get https-proxy

if ($proxyConfig -eq "http://127.0.0.1:7897" -and $httpsProxyConfig -eq "http://127.0.0.1:7897") {
    Write-Host "✅ npm代理配置正确" -ForegroundColor Green
} else {
    Write-Host "⚠️ 修复npm代理配置..." -ForegroundColor Yellow
    npm config set proxy http://127.0.0.1:7897
    npm config set https-proxy http://127.0.0.1:7897
    npm config set strict-ssl false
    Write-Host "✅ npm代理配置已修复" -ForegroundColor Green
}

# 3. 清理过多的node进程（谨慎操作）
Write-Host "`n🧹 检查node进程数量..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
$processCount = $nodeProcesses.Count

Write-Host "发现 $processCount 个node进程" -ForegroundColor Gray

if ($processCount -gt 10) {
    Write-Host "⚠️ 检测到过多node进程，可能影响MCP连接" -ForegroundColor Yellow
    Write-Host "建议手动检查并关闭不必要的node进程" -ForegroundColor Yellow
    
    # 显示进程详情
    $nodeProcesses | Select-Object Id, ProcessName, StartTime | Format-Table
    
    $response = Read-Host "是否要查看MCPHub进程详情? (y/n)"
    if ($response -eq "y") {
        # 查找MCPHub进程（端口3799）
        $mcpHubProcess = netstat -ano | findstr :3799
        if ($mcpHubProcess) {
            Write-Host "MCPHub进程信息:" -ForegroundColor Cyan
            Write-Host $mcpHubProcess -ForegroundColor Gray
        }
    }
}

# 4. 创建Windows兼容的MCP配置示例
Write-Host "`n📝 创建Windows兼容的MCP配置示例..." -ForegroundColor Yellow

$mcpConfigExample = @"
{
  "mcpServers": {
    "shrimp-task-manager": {
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "E:\\MCP\\mcp-shrimp-task-manager\\dist\\index.js"
      ]
    },
    "context7-example": {
      "command": "cmd", 
      "args": [
        "/c",
        "npx",
        "-y",
        "@upstash/context7-mcp@latest"
      ]
    }
  }
}
"@

$mcpConfigExample | Out-File -FilePath "mcp-config-windows-example.json" -Encoding UTF8
Write-Host "✅ 已创建 mcp-config-windows-example.json" -ForegroundColor Green

# 5. 测试MCP服务器独立运行
Write-Host "`n🧪 测试MCP服务器独立运行..." -ForegroundColor Yellow
$testResult = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "E:\MCP\mcp-shrimp-task-manager" -PassThru -WindowStyle Hidden

Start-Sleep -Seconds 3

if ($testResult.HasExited -eq $false) {
    Write-Host "✅ MCP服务器可以独立运行" -ForegroundColor Green
    Stop-Process -Id $testResult.Id -Force
} else {
    Write-Host "❌ MCP服务器无法独立运行，请检查代码" -ForegroundColor Red
}

# 6. 提供解决方案总结
Write-Host "`n📋 解决方案总结:" -ForegroundColor Cyan
Write-Host "1. ✅ npm代理配置已验证/修复" -ForegroundColor Green
Write-Host "2. ✅ 已创建Windows兼容的MCP配置示例" -ForegroundColor Green
Write-Host "3. ⚠️ 建议在MCP配置中使用 cmd /c 包装" -ForegroundColor Yellow
Write-Host "4. ⚠️ 如有过多node进程，建议重启系统" -ForegroundColor Yellow

Write-Host "`n🔧 关键修复点:" -ForegroundColor Cyan
Write-Host "- 使用 'cmd' 作为command，'/c' 作为第一个参数" -ForegroundColor Gray
Write-Host "- 避免直接使用 'npx' 作为command" -ForegroundColor Gray
Write-Host "- 确保npm代理配置正确" -ForegroundColor Gray

Write-Host "`nFix completed! Please restart MCPHub service to apply changes." -ForegroundColor Green
