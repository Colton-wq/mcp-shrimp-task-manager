#!/usr/bin/env node

/**
 * MCP 2025-06-18 合规性验证脚本
 * 
 * 自动验证所有MCP工具描述是否符合2025标准要求
 * 生成详细的合规性报告和修复建议
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP 2025标准合规性检查器
class MCPComplianceValidator {
  private static readonly EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  private static readonly FRIENDLY_WORDS = ['awesome', 'amazing', 'fantastic', 'great', 'wonderful', 'excellent', 'perfect', '🎉', '✨', '🚀'];
  private static readonly ACTION_VERBS = ['execute', 'analyze', 'create', 'update', 'delete', 'list', 'get', 'set', 'verify', 'plan', 'split', 'query', 'retrieve', 'generate', 'process'];

  /**
   * 检查工具命名规范
   */
  static checkToolNaming(toolName: string): ComplianceCheck {
    const snakeCaseRegex = /^[a-z][a-z0-9_]*$/;
    const passed = snakeCaseRegex.test(toolName);
    
    return {
      id: 'tool_naming',
      name: 'Tool Naming Convention',
      passed,
      severity: 'critical',
      message: passed 
        ? `✅ Tool name "${toolName}" follows snake_case convention`
        : `❌ Tool name "${toolName}" violates snake_case convention`,
      suggestion: passed ? null : 'Use lowercase letters and underscores only (e.g., "my_tool_name")',
      standard: 'MCP 2025-06-18 Section 3.1: Tool names must use snake_case format'
    };
  }

  /**
   * 检查描述动作导向
   */
  static checkActionOriented(description: string): ComplianceCheck {
    const firstSentence = description.split('.')[0].trim();
    const firstWord = firstSentence.split(' ')[0].toLowerCase();
    const passed = this.ACTION_VERBS.some(verb => firstWord.startsWith(verb));
    
    return {
      id: 'action_oriented',
      name: 'Action-Oriented Description',
      passed,
      severity: 'critical',
      message: passed
        ? `✅ Description starts with action verb: "${firstWord}"`
        : `❌ Description should start with action verb. Found: "${firstWord}"`,
      suggestion: passed ? null : `Start description with action verbs like: ${this.ACTION_VERBS.slice(0, 5).join(', ')}`,
      standard: 'MCP 2025-06-18 Section 3.2: Tool descriptions must be action-oriented'
    };
  }

  /**
   * 检查禁用友好语言
   */
  static checkNoFriendlyLanguage(description: string): ComplianceCheck {
    const violations = [];
    
    if (this.EMOJI_REGEX.test(description)) {
      violations.push('contains emoji');
    }
    
    const foundFriendlyWords = this.FRIENDLY_WORDS.filter(word => 
      description.toLowerCase().includes(word.toLowerCase())
    );
    if (foundFriendlyWords.length > 0) {
      violations.push(`contains friendly words: ${foundFriendlyWords.join(', ')}`);
    }
    
    if (description.includes('!')) {
      violations.push('contains exclamation marks');
    }
    
    const passed = violations.length === 0;
    
    return {
      id: 'no_friendly_language',
      name: 'Professional Language Only',
      passed,
      severity: 'major',
      message: passed
        ? '✅ Description uses professional language'
        : `❌ Description violations: ${violations.join('; ')}`,
      suggestion: passed ? null : 'Remove emoji, friendly words, and exclamation marks. Use professional, technical language.',
      standard: 'MCP 2025-06-18 Section 3.3: Avoid user-friendly language and emoji'
    };
  }

  /**
   * 检查错误处理标准
   */
  static checkErrorHandling(description: string): ComplianceCheck {
    const hasErrorSection = /error\s+(handling|codes?)/i.test(description);
    const hasStandardCodes = /-32\d{3}/.test(description);
    const hasJsonRpcMention = /json-?rpc/i.test(description);
    
    const passed = hasErrorSection && hasStandardCodes && hasJsonRpcMention;
    
    const issues = [];
    if (!hasErrorSection) issues.push('missing error handling section');
    if (!hasStandardCodes) issues.push('missing standard error codes (-32xxx)');
    if (!hasJsonRpcMention) issues.push('missing JSON-RPC error format reference');
    
    return {
      id: 'error_handling',
      name: 'Standard Error Handling',
      passed,
      severity: 'critical',
      message: passed
        ? '✅ Includes standard JSON-RPC error handling'
        : `❌ Error handling issues: ${issues.join('; ')}`,
      suggestion: passed ? null : 'Add error handling section with standard JSON-RPC error codes (-32000 to -32603)',
      standard: 'MCP 2025-06-18 Section 4.1: Use standard JSON-RPC error codes'
    };
  }

  /**
   * 检查结构化输出支持
   */
  static checkStructuredOutput(description: string): ComplianceCheck {
    const hasOutputSchema = /output\s+schema/i.test(description);
    const hasJsonSchema = description.includes('"type": "object"') && description.includes('"properties"');
    const hasRequiredFields = description.includes('"required"');
    
    const passed = hasOutputSchema && hasJsonSchema && hasRequiredFields;
    
    const issues = [];
    if (!hasOutputSchema) issues.push('missing "Output Schema" section');
    if (!hasJsonSchema) issues.push('missing JSON schema definition');
    if (!hasRequiredFields) issues.push('missing required fields specification');
    
    return {
      id: 'structured_output',
      name: 'Structured Output Schema',
      passed,
      severity: 'major',
      message: passed
        ? '✅ Includes structured output schema'
        : `❌ Structured output issues: ${issues.join('; ')}`,
      suggestion: passed ? null : 'Add "Output Schema" section with complete JSON schema including type, properties, and required fields',
      standard: 'MCP 2025-06-18 Section 5.2: Provide structured output schemas'
    };
  }

  /**
   * 检查工具调用示例
   */
  static checkToolCallExamples(description: string): ComplianceCheck {
    const hasExampleSection = /tool\s+call\s+examples?/i.test(description);
    const hasValidExample = description.includes('"name":') && description.includes('"arguments":');
    const hasJsonFormat = /```json/i.test(description);
    
    const passed = hasExampleSection && hasValidExample && hasJsonFormat;
    
    const issues = [];
    if (!hasExampleSection) issues.push('missing "Tool Call Examples" section');
    if (!hasValidExample) issues.push('missing valid example with name and arguments');
    if (!hasJsonFormat) issues.push('examples not in JSON format');
    
    return {
      id: 'tool_call_examples',
      name: 'Tool Call Examples',
      passed,
      severity: 'major',
      message: passed
        ? '✅ Includes proper tool call examples'
        : `❌ Example issues: ${issues.join('; ')}`,
      suggestion: passed ? null : 'Add "Tool Call Examples" section with JSON-formatted examples showing name and arguments',
      standard: 'MCP 2025-06-18 Section 6.1: Provide tool call examples'
    };
  }

  /**
   * 检查参数约束
   */
  static checkParameterConstraints(description: string): ComplianceCheck {
    const hasParameterSection = /parameters?/i.test(description);
    const hasConstraints = /minimum|maximum|pattern|enum|minlength/i.test(description);
    const hasRequiredMarkers = /\(required\)|\(optional\)/i.test(description);
    
    const passed = hasParameterSection && hasConstraints && hasRequiredMarkers;
    
    const issues = [];
    if (!hasParameterSection) issues.push('missing parameters section');
    if (!hasConstraints) issues.push('missing parameter constraints (min/max/pattern/enum)');
    if (!hasRequiredMarkers) issues.push('missing required/optional markers');
    
    return {
      id: 'parameter_constraints',
      name: 'Parameter Constraints',
      passed,
      severity: 'major',
      message: passed
        ? '✅ Parameters have clear constraints'
        : `❌ Parameter constraint issues: ${issues.join('; ')}`,
      suggestion: passed ? null : 'Add clear parameter constraints and mark each parameter as required or optional',
      standard: 'MCP 2025-06-18 Section 3.4: Define clear parameter constraints'
    };
  }

  /**
   * 执行完整的合规性检查
   */
  static validateTool(toolName: string, description: string): ToolComplianceResult {
    const checks = [
      this.checkToolNaming(toolName),
      this.checkActionOriented(description),
      this.checkNoFriendlyLanguage(description),
      this.checkErrorHandling(description),
      this.checkStructuredOutput(description),
      this.checkToolCallExamples(description),
      this.checkParameterConstraints(description)
    ];

    const criticalChecks = checks.filter(c => c.severity === 'critical');
    const majorChecks = checks.filter(c => c.severity === 'major');
    
    const criticalPassed = criticalChecks.filter(c => c.passed).length;
    const majorPassed = majorChecks.filter(c => c.passed).length;
    
    // 计算加权评分
    const criticalWeight = 0.6;
    const majorWeight = 0.4;
    
    const criticalScore = criticalChecks.length > 0 ? (criticalPassed / criticalChecks.length) * 100 : 100;
    const majorScore = majorChecks.length > 0 ? (majorPassed / majorChecks.length) * 100 : 100;
    
    const overallScore = Math.round(criticalScore * criticalWeight + majorScore * majorWeight);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';

    const isCompliant = overallScore >= 80 && criticalPassed === criticalChecks.length;

    return {
      toolName,
      overallScore,
      grade,
      isCompliant,
      checks,
      criticalIssues: criticalChecks.filter(c => !c.passed).length,
      majorIssues: majorChecks.filter(c => !c.passed).length,
      summary: {
        total: checks.length,
        passed: checks.filter(c => c.passed).length,
        critical: criticalChecks.length,
        criticalPassed,
        major: majorChecks.length,
        majorPassed
      }
    };
  }
}

interface ComplianceCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: 'critical' | 'major' | 'minor';
  message: string;
  suggestion: string | null;
  standard: string;
}

interface ToolComplianceResult {
  toolName: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isCompliant: boolean;
  checks: ComplianceCheck[];
  criticalIssues: number;
  majorIssues: number;
  summary: {
    total: number;
    passed: number;
    critical: number;
    criticalPassed: number;
    major: number;
    majorPassed: number;
  };
}

// 主验证函数
async function validateMCPCompliance(): Promise<void> {
  console.log('🔍 MCP 2025-06-18 Compliance Validation\n');

  const toolsDir = path.join(__dirname, '..', 'src', 'prompts', 'templates_zh', 'toolsDescription');
  
  if (!fs.existsSync(toolsDir)) {
    console.error(`❌ Tools description directory not found: ${toolsDir}`);
    process.exit(1);
  }

  const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.md'));
  const results: ToolComplianceResult[] = [];

  console.log(`📋 Found ${toolFiles.length} tool description files\n`);

  for (const file of toolFiles) {
    const toolName = path.basename(file, '.md');
    const filePath = path.join(toolsDir, file);
    const description = fs.readFileSync(filePath, 'utf-8');

    console.log(`🔍 Validating ${toolName}...`);
    
    const result = MCPComplianceValidator.validateTool(toolName, description);
    results.push(result);

    // 显示工具结果
    const statusIcon = result.isCompliant ? '✅' : '❌';
    console.log(`${statusIcon} ${toolName}: ${result.overallScore}% (Grade: ${result.grade})`);
    
    if (!result.isCompliant) {
      console.log(`   Critical Issues: ${result.criticalIssues}, Major Issues: ${result.majorIssues}`);
    }
    
    console.log('');
  }

  // 生成总体报告
  generateComplianceReport(results);
  
  // 生成修复建议
  generateFixSuggestions(results);

  // 检查是否所有工具都合规
  const compliantTools = results.filter(r => r.isCompliant).length;
  const complianceRate = (compliantTools / results.length) * 100;

  console.log(`\n📊 Overall Compliance: ${compliantTools}/${results.length} tools (${complianceRate.toFixed(1)}%)`);

  if (complianceRate < 100) {
    console.log('\n⚠️  Some tools are not MCP 2025 compliant. Please review the suggestions above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tools are MCP 2025 compliant!');
  }
}

function generateComplianceReport(results: ToolComplianceResult[]): void {
  console.log('\n📊 === MCP 2025 Compliance Report ===\n');

  const totalTools = results.length;
  const compliantTools = results.filter(r => r.isCompliant).length;
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / totalTools);

  console.log(`Total Tools: ${totalTools}`);
  console.log(`Compliant Tools: ${compliantTools} (${Math.round(compliantTools/totalTools*100)}%)`);
  console.log(`Average Score: ${averageScore}%`);

  // 按等级分组
  const gradeGroups = results.reduce((groups, result) => {
    groups[result.grade] = (groups[result.grade] || 0) + 1;
    return groups;
  }, {} as Record<string, number>);

  console.log('\nGrade Distribution:');
  ['A', 'B', 'C', 'D', 'F'].forEach(grade => {
    const count = gradeGroups[grade] || 0;
    if (count > 0) {
      console.log(`  ${grade}: ${count} tools`);
    }
  });

  // 最常见的问题
  const allChecks = results.flatMap(r => r.checks);
  const failedChecks = allChecks.filter(c => !c.passed);
  const issueFrequency = failedChecks.reduce((freq, check) => {
    freq[check.id] = (freq[check.id] || 0) + 1;
    return freq;
  }, {} as Record<string, number>);

  if (Object.keys(issueFrequency).length > 0) {
    console.log('\nMost Common Issues:');
    Object.entries(issueFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([checkId, count]) => {
        const checkName = failedChecks.find(c => c.id === checkId)?.name || checkId;
        console.log(`  ${checkName}: ${count} tools affected`);
      });
  }
}

function generateFixSuggestions(results: ToolComplianceResult[]): void {
  const nonCompliantTools = results.filter(r => !r.isCompliant);
  
  if (nonCompliantTools.length === 0) {
    return;
  }

  console.log('\n🔧 === Fix Suggestions ===\n');

  nonCompliantTools.forEach(result => {
    console.log(`📝 ${result.toolName} (Score: ${result.overallScore}%)`);
    
    const failedChecks = result.checks.filter(c => !c.passed);
    failedChecks.forEach(check => {
      console.log(`   ❌ ${check.name}`);
      console.log(`      Issue: ${check.message.replace('❌ ', '')}`);
      if (check.suggestion) {
        console.log(`      Fix: ${check.suggestion}`);
      }
      console.log(`      Standard: ${check.standard}`);
      console.log('');
    });
  });
}

// 运行验证
if (import.meta.url === `file://${process.argv[1]}`) {
  validateMCPCompliance().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { MCPComplianceValidator, type ComplianceCheck, type ToolComplianceResult };