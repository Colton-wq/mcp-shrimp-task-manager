/**
 * 模板质量控制和测试机制
 * Template Quality Control and Testing Mechanism
 * 
 * 提供模板效果评估、A/B测试、版本控制等功能
 * Provides template effectiveness evaluation, A/B testing, version control, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 模板质量评估指标
 * Template quality assessment metrics
 */
export interface TemplateQualityMetrics {
  businessFocusScore: number;        // 业务导向评分 (0-100)
  simplicityScore: number;           // 简洁性评分 (0-100)
  toolIntegrationScore: number;      // 工具集成评分 (0-100)
  actionabilityScore: number;        // 可操作性评分 (0-100)
  overallScore: number;              // 总体评分 (0-100)
  feedback: string[];                // 具体反馈建议
}

/**
 * 模板测试用例
 * Template test case
 */
export interface TemplateTestCase {
  id: string;
  name: string;
  description: string;
  requirements?: string;
  expectedBusinessFocus: string[];   // 期望的业务关注点
  expectedTools: string[];           // 期望推荐的工具
  expectedSimplification: string[];  // 期望的简化建议
  category: 'problem-solving' | 'feature-development' | 'performance-optimization' | 'general';
}

/**
 * A/B测试结果
 * A/B test result
 */
export interface ABTestResult {
  templateA: string;
  templateB: string;
  testCase: TemplateTestCase;
  metricsA: TemplateQualityMetrics;
  metricsB: TemplateQualityMetrics;
  winner: 'A' | 'B' | 'tie';
  confidence: number;
  timestamp: string;
}

/**
 * 模板版本信息
 * Template version information
 */
export interface TemplateVersion {
  version: string;
  templatePath: string;
  description: string;
  createdAt: string;
  metrics?: TemplateQualityMetrics;
  testResults?: ABTestResult[];
}

/**
 * 模板质量控制器
 * Template Quality Controller
 */
export class TemplateQualityController {
  private testCases: TemplateTestCase[] = [];
  private versionHistory: Map<string, TemplateVersion[]> = new Map();
  private testResults: ABTestResult[] = [];

  constructor() {
    this.initializeTestCases();
    this.loadVersionHistory();
  }

  /**
   * 初始化测试用例
   * Initialize test cases
   */
  private initializeTestCases(): void {
    this.testCases = [
      {
        id: 'problem-solving-1',
        name: '用户登录问题修复',
        description: '修复用户登录时出现的验证错误问题',
        requirements: '需要确保用户体验不受影响，快速定位问题根因',
        expectedBusinessFocus: ['用户体验', '问题影响', '业务目标'],
        expectedTools: ['codebase-retrieval', 'search_code_desktop-commander'],
        expectedSimplification: ['最简修复方案', '避免过度重构'],
        category: 'problem-solving'
      },
      {
        id: 'feature-development-1',
        name: '用户管理界面开发',
        description: '创建一个新的用户管理界面，支持增删改查功能',
        requirements: '需要与现有系统集成，保持界面风格一致',
        expectedBusinessFocus: ['用户需求', '业务价值', '功能优先级'],
        expectedTools: ['codebase-retrieval', 'Everything MCP'],
        expectedSimplification: ['MVP功能', '渐进式开发'],
        category: 'feature-development'
      },
      {
        id: 'performance-optimization-1',
        name: '数据库查询优化',
        description: '优化用户查询的数据库性能，提升响应速度',
        requirements: '当前查询时间超过2秒，需要优化到500ms以内',
        expectedBusinessFocus: ['性能影响', '用户体验', '业务指标'],
        expectedTools: ['codebase-retrieval', 'search_code_desktop-commander'],
        expectedSimplification: ['针对性优化', '避免过度优化'],
        category: 'performance-optimization'
      },
      {
        id: 'general-1',
        name: '项目架构分析',
        description: '分析现有项目架构，提出改进建议',
        requirements: '需要考虑可维护性和扩展性',
        expectedBusinessFocus: ['架构目标', '业务需求', '技术债务'],
        expectedTools: ['codebase-retrieval', 'read_file_desktop-commander'],
        expectedSimplification: ['渐进式改进', '风险控制'],
        category: 'general'
      }
    ];
  }

  /**
   * 评估模板质量
   * Evaluate template quality
   */
  async evaluateTemplateQuality(
    templateContent: string,
    testCase: TemplateTestCase
  ): Promise<TemplateQualityMetrics> {
    const metrics: TemplateQualityMetrics = {
      businessFocusScore: this.evaluateBusinessFocus(templateContent, testCase),
      simplicityScore: this.evaluateSimplicity(templateContent),
      toolIntegrationScore: this.evaluateToolIntegration(templateContent, testCase),
      actionabilityScore: this.evaluateActionability(templateContent),
      overallScore: 0,
      feedback: []
    };

    // 计算总体评分
    metrics.overallScore = Math.round(
      (metrics.businessFocusScore + metrics.simplicityScore + 
       metrics.toolIntegrationScore + metrics.actionabilityScore) / 4
    );

    // 生成反馈建议
    metrics.feedback = this.generateFeedback(metrics, testCase);

    return metrics;
  }

  /**
   * 评估业务导向性
   * Evaluate business focus
   */
  private evaluateBusinessFocus(templateContent: string, testCase: TemplateTestCase): number {
    let score = 0;
    const content = templateContent.toLowerCase();

    // 检查业务目标确认机制
    if (content.includes('business goal') || content.includes('业务目标')) {
      score += 30;
    }

    // 检查用户需求理解
    if (content.includes('user need') || content.includes('用户需求') || 
        content.includes('real business') || content.includes('真实业务')) {
      score += 25;
    }

    // 检查业务价值评估
    if (content.includes('business value') || content.includes('业务价值') ||
        content.includes('business impact') || content.includes('业务影响')) {
      score += 25;
    }

    // 检查是否强制业务确认
    if (content.includes('mandatory') || content.includes('强制') ||
        content.includes('must') || content.includes('必须')) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * 评估简洁性
   * Evaluate simplicity
   */
  private evaluateSimplicity(templateContent: string): number {
    let score = 100;
    const lines = templateContent.split('\n').length;

    // 基于行数评分
    if (lines > 120) {
      score -= 40; // 过长
    } else if (lines > 100) {
      score -= 30;
    } else if (lines > 80) {
      score -= 20;
    } else if (lines < 30) {
      score -= 20; // 过短，可能缺乏指导
    }

    const content = templateContent.toLowerCase();

    // 检查简化原则
    if (content.includes('simplest') || content.includes('最简') ||
        content.includes('simple') || content.includes('简单')) {
      score += 20;
    }

    // 检查是否避免过度复杂
    if (content.includes('avoid') || content.includes('避免') ||
        content.includes('minimize') || content.includes('最小化')) {
      score += 15;
    }

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * 评估工具集成度
   * Evaluate tool integration
   */
  private evaluateToolIntegration(templateContent: string, testCase: TemplateTestCase): number {
    let score = 0;
    const content = templateContent.toLowerCase();

    // 检查具体工具提及
    const toolMentions = [
      'codebase-retrieval', 'search_code_desktop-commander', 'everything mcp',
      'read_file_desktop-commander', 'force search protocol', 'exa mcp', 'tavily'
    ];

    const mentionedTools = toolMentions.filter(tool => content.includes(tool.toLowerCase()));
    score += Math.min(mentionedTools.length * 15, 60);

    // 检查工具使用场景指导
    if (content.includes('use tools') || content.includes('使用工具') ||
        content.includes('tool usage') || content.includes('工具使用')) {
      score += 20;
    }

    // 检查是否有具体的工具推荐逻辑
    if (content.includes('if uncertain') || content.includes('如果不确定') ||
        content.includes('when to use') || content.includes('何时使用')) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  /**
   * 评估可操作性
   * Evaluate actionability
   */
  private evaluateActionability(templateContent: string): number {
    let score = 0;
    const content = templateContent.toLowerCase();

    // 检查具体步骤
    if (content.includes('step') || content.includes('步骤') ||
        content.includes('phase') || content.includes('阶段')) {
      score += 25;
    }

    // 检查检查清单
    if (content.includes('checklist') || content.includes('检查清单') ||
        content.includes('check') || content.includes('检查')) {
      score += 25;
    }

    // 检查具体行动指导
    if (content.includes('call tool') || content.includes('调用工具') ||
        content.includes('next step') || content.includes('下一步')) {
      score += 25;
    }

    // 检查明确的输出要求
    if (content.includes('output') || content.includes('输出') ||
        content.includes('result') || content.includes('结果')) {
      score += 25;
    }

    return Math.min(score, 100);
  }

  /**
   * 生成反馈建议
   * Generate feedback suggestions
   */
  private generateFeedback(metrics: TemplateQualityMetrics, testCase: TemplateTestCase): string[] {
    const feedback: string[] = [];

    if (metrics.businessFocusScore < 70) {
      feedback.push('建议加强业务目标确认机制，确保AI助手优先理解用户真实需求');
    }

    if (metrics.simplicityScore < 70) {
      feedback.push('建议简化模板内容，控制在50-80行，突出核心指导原则');
    }

    if (metrics.toolIntegrationScore < 70) {
      feedback.push('建议添加更具体的MCP工具使用指导，明确工具使用场景');
    }

    if (metrics.actionabilityScore < 70) {
      feedback.push('建议增加更明确的行动步骤和检查清单，提升可操作性');
    }

    if (metrics.overallScore >= 90) {
      feedback.push('模板质量优秀，建议保持当前设计并持续监控效果');
    } else if (metrics.overallScore >= 80) {
      feedback.push('模板质量良好，可考虑针对性优化低分项');
    } else {
      feedback.push('模板需要重大改进，建议重新设计核心结构');
    }

    return feedback;
  }

  /**
   * 执行A/B测试
   * Execute A/B test
   */
  async executeABTest(
    templatePathA: string,
    templatePathB: string,
    testCase: TemplateTestCase
  ): Promise<ABTestResult> {
    // 读取模板内容
    const templateA = await this.readTemplate(templatePathA);
    const templateB = await this.readTemplate(templatePathB);

    // 评估两个模板
    const metricsA = await this.evaluateTemplateQuality(templateA, testCase);
    const metricsB = await this.evaluateTemplateQuality(templateB, testCase);

    // 确定获胜者
    let winner: 'A' | 'B' | 'tie';
    const scoreDiff = metricsA.overallScore - metricsB.overallScore;
    
    if (Math.abs(scoreDiff) < 5) {
      winner = 'tie';
    } else {
      winner = scoreDiff > 0 ? 'A' : 'B';
    }

    // 计算置信度
    const confidence = Math.min(Math.abs(scoreDiff) / 100 * 100, 95);

    const result: ABTestResult = {
      templateA: templatePathA,
      templateB: templatePathB,
      testCase,
      metricsA,
      metricsB,
      winner,
      confidence,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);
    return result;
  }

  /**
   * 读取模板文件
   * Read template file
   */
  private async readTemplate(templatePath: string): Promise<string> {
    const fullPath = path.resolve(__dirname, templatePath);
    return fs.readFileSync(fullPath, 'utf-8');
  }

  /**
   * 批量测试所有模板
   * Batch test all templates
   */
  async runBatchTests(): Promise<TemplateQualityMetrics[]> {
    const results: TemplateQualityMetrics[] = [];

    const templatePaths = [
      'templates_en/planTask/index.md',
      'templates_zh/planTask/index.md',
      'templates_en/analyzeTask/index.md',
      'templates_zh/analyzeTask/index.md'
    ];

    for (const templatePath of templatePaths) {
      console.log(`\n🧪 测试模板: ${templatePath}`);
      
      for (const testCase of this.testCases) {
        try {
          const templateContent = await this.readTemplate(templatePath);
          const metrics = await this.evaluateTemplateQuality(templateContent, testCase);
          
          console.log(`   测试用例: ${testCase.name}`);
          console.log(`   总体评分: ${metrics.overallScore}/100`);
          console.log(`   业务导向: ${metrics.businessFocusScore}/100`);
          console.log(`   简洁性: ${metrics.simplicityScore}/100`);
          console.log(`   工具集成: ${metrics.toolIntegrationScore}/100`);
          console.log(`   可操作性: ${metrics.actionabilityScore}/100`);
          
          if (metrics.feedback.length > 0) {
            console.log(`   建议: ${metrics.feedback[0]}`);
          }
          
          results.push(metrics);
        } catch (error) {
          console.error(`   测试失败: ${error}`);
        }
      }
    }

    return results;
  }

  /**
   * 加载版本历史
   * Load version history
   */
  private loadVersionHistory(): void {
    // 这里可以从文件系统或数据库加载版本历史
    // 暂时使用内存存储
  }

  /**
   * 保存测试结果
   * Save test results
   */
  async saveTestResults(filePath?: string): Promise<void> {
    const data = {
      testResults: this.testResults,
      versionHistory: Array.from(this.versionHistory.entries()),
      timestamp: new Date().toISOString()
    };

    const outputPath = filePath || path.join(__dirname, 'test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`测试结果已保存到: ${outputPath}`);
  }

  /**
   * 获取测试统计
   * Get test statistics
   */
  getTestStatistics(): any {
    const totalTests = this.testResults.length;
    const avgScoreA = this.testResults.reduce((sum, r) => sum + r.metricsA.overallScore, 0) / totalTests;
    const avgScoreB = this.testResults.reduce((sum, r) => sum + r.metricsB.overallScore, 0) / totalTests;
    
    return {
      totalTests,
      avgScoreA: Math.round(avgScoreA),
      avgScoreB: Math.round(avgScoreB),
      winnerA: this.testResults.filter(r => r.winner === 'A').length,
      winnerB: this.testResults.filter(r => r.winner === 'B').length,
      ties: this.testResults.filter(r => r.winner === 'tie').length
    };
  }
}