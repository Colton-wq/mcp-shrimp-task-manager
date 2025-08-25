// 直接测试 analyzeTask 工具函数
import { analyzeTask } from './dist/tools/task/analyzeTask.js';

async function testDirectCall() {
  try {
    console.log('Testing direct analyzeTask call...');
    
    // Test security analysis
    const securityResult = await analyzeTask({
      summary: '分析用户认证系统的安全漏洞和潜在风险点',
      initialConcept: '检查 JWT 令牌实现、密码哈希机制、会话管理和权限验证逻辑，识别可能的注入攻击、认证绕过和数据泄露风险'
    });
    
    console.log('\n=== Security Analysis Result ===');
    console.log('Type:', typeof securityResult);
    console.log('Has content:', !!securityResult.content);
    
    if (securityResult.content && securityResult.content[0]) {
      const text = securityResult.content[0].text;
      console.log('Text length:', text.length);
      console.log('Contains "Security Vulnerability Assessment":', text.includes('Security Vulnerability Assessment'));
      console.log('Contains "Deep Code Analysis":', text.includes('Deep Code Analysis'));
      console.log('Contains "Codebase Analysis" (default):', text.includes('Codebase Analysis'));
      
      // Show first few lines
      const lines = text.split('\n').slice(0, 5);
      console.log('\nFirst 5 lines:');
      lines.forEach((line, i) => console.log(`${i+1}: ${line}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirectCall();