#!/usr/bin/env node

/**
 * 调试阻塞操作的最小化复现
 */

import { performance } from 'perf_hooks';

// 模拟复杂的语义分析（同步阻塞）
function simulateSemanticAnalysis(context) {
    const start = performance.now();
    
    // 模拟复杂的字符串处理
    let result = {};
    for (let i = 0; i < 1000; i++) {
        result[`pattern_${i}`] = context.split(' ').map(word => 
            word.toLowerCase().replace(/[^a-z]/g, '')
        ).filter(word => word.length > 2);
    }
    
    const duration = performance.now() - start;
    console.log(`🔍 语义分析耗时: ${duration.toFixed(2)}ms`);
    return { duration, result };
}

// 模拟搜索策略生成（同步阻塞）
function simulateSearchPlanGeneration(problemDesc, analysis) {
    const start = performance.now();
    
    // 模拟复杂的策略计算
    let mcpToolCalls = [];
    for (let i = 0; i < 100; i++) {
        mcpToolCalls.push({
            tool: `tool_${i}`,
            priority: Math.floor(Math.random() * 10),
            parameters: {
                query: problemDesc.split(' ').slice(0, 3).join(' '),
                timeout: 30000 + i * 100
            },
            rationale: `Generated rationale for tool ${i}`,
            expectedQuality: i % 3 === 0 ? 'HIGH' : 'MEDIUM'
        });
    }
    
    const duration = performance.now() - start;
    console.log(`🔍 策略生成耗时: ${duration.toFixed(2)}ms`);
    return { duration, mcpToolCalls };
}

// 模拟智能输出格式化（同步阻塞）
function simulateIntelligentFormatting(searchPlan, problemDesc) {
    const start = performance.now();
    
    // 模拟复杂的模板生成
    let formattedOutput = `# AI Development Standards v4.0\n\n`;
    
    // 大量字符串拼接操作
    for (let i = 0; i < 500; i++) {
        formattedOutput += `## Section ${i}\n`;
        formattedOutput += `**Problem**: ${problemDesc}\n`;
        formattedOutput += `**Tools**: ${searchPlan.mcpToolCalls.slice(0, 5).map(t => t.tool).join(', ')}\n`;
        formattedOutput += `**Priority**: ${i % 10}\n\n`;
        
        // 模拟复杂的条件逻辑
        if (i % 10 === 0) {
            formattedOutput += `### 🚨 CRITICAL CHECKPOINT ${i}\n`;
            formattedOutput += `- Verification required\n`;
            formattedOutput += `- Quality gates active\n`;
            formattedOutput += `- Framework break needed\n\n`;
        }
    }
    
    const duration = performance.now() - start;
    console.log(`🔍 格式化耗时: ${duration.toFixed(2)}ms`);
    console.log(`🔍 输出大小: ${formattedOutput.length} 字符`);
    return { duration, output: formattedOutput };
}

// 完整的阻塞测试
function runBlockingTest() {
    console.log('🚨 MCP 阻塞操作分析');
    console.log('='.repeat(50));
    
    const testContext = "用户询问一个复杂的技术问题，需要深度分析和搜索验证，涉及多个技术栈和框架";
    const testProblem = "测试 MCP 超时配置性能问题，分析复杂模板导致的阻塞";
    
    const totalStart = performance.now();
    
    // 步骤1：语义分析
    const semanticResult = simulateSemanticAnalysis(testContext);
    
    // 步骤2：策略生成
    const planResult = simulateSearchPlanGeneration(testProblem, semanticResult.result);
    
    // 步骤3：格式化输出
    const formatResult = simulateIntelligentFormatting(planResult, testProblem);
    
    const totalDuration = performance.now() - totalStart;
    
    console.log('\n📊 总体性能分析:');
    console.log(`- 语义分析: ${semanticResult.duration.toFixed(2)}ms`);
    console.log(`- 策略生成: ${planResult.duration.toFixed(2)}ms`);
    console.log(`- 格式化: ${formatResult.duration.toFixed(2)}ms`);
    console.log(`- 总耗时: ${totalDuration.toFixed(2)}ms`);
    
    // 风险评估
    console.log('\n⚠️ 阻塞风险评估:');
    if (totalDuration > 5000) {
        console.log('🔴 严重阻塞: 总耗时超过5秒，必然触发MCP超时');
    } else if (totalDuration > 1000) {
        console.log('🟡 中度阻塞: 总耗时超过1秒，可能触发超时');
    } else if (totalDuration > 100) {
        console.log('🟡 轻度阻塞: 总耗时超过100ms，需要优化');
    } else {
        console.log('🟢 性能正常: 耗时在合理范围内');
    }
    
    // 内存使用分析
    const memUsage = process.memoryUsage();
    console.log('\n💾 内存使用:');
    console.log(`- 堆使用: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- 外部内存: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
    
    // 模拟多次调用的累积效应
    console.log('\n🔄 累积效应测试:');
    const multiCallStart = performance.now();
    for (let i = 0; i < 5; i++) {
        simulateSemanticAnalysis(testContext);
        simulateSearchPlanGeneration(testProblem, {});
        simulateIntelligentFormatting({ mcpToolCalls: [] }, testProblem);
    }
    const multiCallDuration = performance.now() - multiCallStart;
    console.log(`- 5次连续调用总耗时: ${multiCallDuration.toFixed(2)}ms`);
    console.log(`- 平均单次耗时: ${(multiCallDuration / 5).toFixed(2)}ms`);
    
    if (multiCallDuration > 10000) {
        console.log('🔴 累积阻塞严重: 多次调用会导致系统不可用');
    } else if (multiCallDuration > 5000) {
        console.log('🟡 累积阻塞中等: 需要优化处理逻辑');
    } else {
        console.log('🟢 累积效应可控');
    }
}

// 运行测试
runBlockingTest();