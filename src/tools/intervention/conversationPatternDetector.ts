/**
 * 对话模式检测器 - AI行为干预系统增强
 * Conversation Pattern Detector - AI Behavior Intervention System Enhancement
 */

// 自然触发模式检测
// Natural Trigger Pattern Detection
export class ConversationPatternDetector {
  // 不确定性表达模式 (降低触发门槛)
  private static UNCERTAINTY_EXPRESSIONS = [
    // 英文不确定性表达
    /I think|I believe|I assume|probably|might be|could be|seems like|appears to/gi,
    /based on my knowledge|from what I know|as far as I know|typically|usually/gi,
    /should work|would work|may work|might work|likely to work/gi,
    
    // 中文不确定性表达
    /我认为|我觉得|我想|可能|也许|应该是|大概|估计|或许/gi,
    /据我所知|根据我的知识|通常|一般来说|按理说|正常情况下/gi,
    /应该可以|应该能|可能会|也许会|估计会/gi,
  ];

  // 研究意图检测模式
  private static RESEARCH_INTENT_PATTERNS = [
    // 明确的研究请求
    /how to|how can I|what is the best way|best practices|latest approach/gi,
    /search for|look up|find information|research|investigate/gi,
    /current status|latest version|recent updates|2025|newest/gi,
    
    // 中文研究意图
    /怎么做|如何|最佳方法|最好的方式|最新的方法|最佳实践/gi,
    /搜索|查找|寻找|研究|调查|了解|学习/gi,
    /当前状态|最新版本|最近更新|2025|最新的/gi,
  ];

  // 帮助寻求模式
  private static HELP_SEEKING_PATTERNS = [
    // 直接求助
    /help me|can you help|I need help|assist me|guide me/gi,
    /I'm stuck|I'm confused|I don't know|not sure|uncertain/gi,
    /what should I do|how do I|where do I start/gi,
    
    // 中文求助
    /帮我|帮助我|能帮我|需要帮助|协助我|指导我/gi,
    /卡住了|困惑|不知道|不确定|不清楚|搞不懂/gi,
    /应该怎么做|怎么办|从哪开始|如何开始/gi,
  ];

  // 技术问题指示器
  private static TECHNICAL_PROBLEM_INDICATORS = [
    // 错误和问题
    /error|bug|issue|problem|fail|crash|broken|not working/gi,
    /exception|timeout|connection|performance|slow|memory/gi,
    /deprecated|outdated|legacy|compatibility|version conflict/gi,
    
    // 中文技术问题
    /错误|故障|问题|失败|崩溃|坏了|不工作|不运行/gi,
    /异常|超时|连接|性能|慢|内存|卡顿/gi,
    /过时|废弃|兼容性|版本冲突|版本问题/gi,
  ];

  // 时间敏感性指示器
  private static TIME_SENSITIVITY_INDICATORS = [
    // 时间相关
    /urgent|asap|quickly|immediately|right now|deadline/gi,
    /latest|newest|current|recent|up-to-date|modern/gi,
    /2025|this year|recently|just released|new version/gi,
    
    // 中文时间敏感
    /紧急|尽快|快速|立即|马上|截止|期限/gi,
    /最新|最新的|当前|最近|最新版|现代的/gi,
    /2025|今年|最近|刚发布|新版本|最新版本/gi,
  ];

  /**
   * 检测对话中的自然触发模式
   * Detect natural trigger patterns in conversation
   */
  static detectNaturalTriggers(conversationText: string): {
    hasUncertainty: boolean;
    hasResearchIntent: boolean;
    hasHelpSeeking: boolean;
    hasTechnicalProblem: boolean;
    hasTimeSensitivity: boolean;
    triggerScore: number;
    detectedPatterns: string[];
    recommendedAction: "IMMEDIATE_SEARCH" | "VERIFICATION_RECOMMENDED" | "MONITOR" | "NO_ACTION";
  } {
    const detectedPatterns: string[] = [];
    let triggerScore = 0;

    // 检测不确定性表达
    const uncertaintyMatches = this.UNCERTAINTY_EXPRESSIONS.some(pattern => {
      const matches = conversationText.match(pattern);
      if (matches) {
        detectedPatterns.push(`不确定性表达: ${matches.slice(0, 3).join(", ")}`);
        triggerScore += 2;
        return true;
      }
      return false;
    });

    // 检测研究意图
    const researchIntentMatches = this.RESEARCH_INTENT_PATTERNS.some(pattern => {
      const matches = conversationText.match(pattern);
      if (matches) {
        detectedPatterns.push(`研究意图: ${matches.slice(0, 3).join(", ")}`);
        triggerScore += 3;
        return true;
      }
      return false;
    });

    // 检测帮助寻求
    const helpSeekingMatches = this.HELP_SEEKING_PATTERNS.some(pattern => {
      const matches = conversationText.match(pattern);
      if (matches) {
        detectedPatterns.push(`帮助寻求: ${matches.slice(0, 3).join(", ")}`);
        triggerScore += 2;
        return true;
      }
      return false;
    });

    // 检测技术问题
    const technicalProblemMatches = this.TECHNICAL_PROBLEM_INDICATORS.some(pattern => {
      const matches = conversationText.match(pattern);
      if (matches) {
        detectedPatterns.push(`技术问题: ${matches.slice(0, 3).join(", ")}`);
        triggerScore += 3;
        return true;
      }
      return false;
    });

    // 检测时间敏感性
    const timeSensitivityMatches = this.TIME_SENSITIVITY_INDICATORS.some(pattern => {
      const matches = conversationText.match(pattern);
      if (matches) {
        detectedPatterns.push(`时间敏感: ${matches.slice(0, 3).join(", ")}`);
        triggerScore += 2;
        return true;
      }
      return false;
    });

    // 确定推荐行动
    let recommendedAction: "IMMEDIATE_SEARCH" | "VERIFICATION_RECOMMENDED" | "MONITOR" | "NO_ACTION";
    
    if (triggerScore >= 6 || (researchIntentMatches && technicalProblemMatches)) {
      recommendedAction = "IMMEDIATE_SEARCH";
    } else if (triggerScore >= 3 || (uncertaintyMatches && timeSensitivityMatches)) {
      recommendedAction = "VERIFICATION_RECOMMENDED";
    } else if (triggerScore >= 1) {
      recommendedAction = "MONITOR";
    } else {
      recommendedAction = "NO_ACTION";
    }

    return {
      hasUncertainty: uncertaintyMatches,
      hasResearchIntent: researchIntentMatches,
      hasHelpSeeking: helpSeekingMatches,
      hasTechnicalProblem: technicalProblemMatches,
      hasTimeSensitivity: timeSensitivityMatches,
      triggerScore,
      detectedPatterns,
      recommendedAction,
    };
  }

  /**
   * 检测AI回答中的风险模式
   * Detect risk patterns in AI responses
   */
  static detectAIResponseRisks(aiResponse: string): {
    hasOverconfidence: boolean;
    hasAssumptions: boolean;
    hasOutdatedReferences: boolean;
    hasVagueStatements: boolean;
    riskScore: number;
    detectedRisks: string[];
    interventionRequired: boolean;
  } {
    const detectedRisks: string[] = [];
    let riskScore = 0;

    // 过度自信模式
    const overconfidencePatterns = [
      /perfectly fine|no problems?|simple fix|easy solution|straightforward/gi,
      /definitely|certainly|obviously|clearly|without doubt/gi,
      /完全没问题|没有问题|简单修复|容易解决|很简单/gi,
    ];

    const hasOverconfidence = overconfidencePatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedRisks.push(`过度自信: ${matches.slice(0, 2).join(", ")}`);
        riskScore += 3;
        return true;
      }
      return false;
    });

    // 假设性陈述
    const assumptionPatterns = [
      /I assume|assuming|presumably|likely|probably/gi,
      /should be|would be|might be|could be/gi,
      /我假设|假设|大概|可能|应该是/gi,
    ];

    const hasAssumptions = assumptionPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedRisks.push(`假设性陈述: ${matches.slice(0, 2).join(", ")}`);
        riskScore += 2;
        return true;
      }
      return false;
    });

    // 过时引用
    const outdatedPatterns = [
      /in the past|traditionally|historically|old version/gi,
      /before 2024|2023|2022|2021|legacy/gi,
      /过去|传统上|历史上|旧版本|以前/gi,
    ];

    const hasOutdatedReferences = outdatedPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedRisks.push(`过时引用: ${matches.slice(0, 2).join(", ")}`);
        riskScore += 2;
        return true;
      }
      return false;
    });

    // 模糊陈述
    const vaguePatterns = [
      /somehow|somewhere|something|various|multiple|several/gi,
      /in some way|to some extent|kind of|sort of/gi,
      /某种程度上|某种方式|有些|一些|多种|几种/gi,
    ];

    const hasVagueStatements = vaguePatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedRisks.push(`模糊陈述: ${matches.slice(0, 2).join(", ")}`);
        riskScore += 1;
        return true;
      }
      return false;
    });

    return {
      hasOverconfidence,
      hasAssumptions,
      hasOutdatedReferences,
      hasVagueStatements,
      riskScore,
      detectedRisks,
      interventionRequired: riskScore >= 4,
    };
  }

  /**
   * 检测AI代码质量作弊行为模式
   * Detect AI code quality cheating behavior patterns
   */
  static detectCodeQualityCheatingBehavior(aiResponse: string, toolCallHistory: string[] = []): {
    hasScoreManipulation: boolean;
    hasFileForging: boolean;
    hasBlindRefactoring: boolean;
    hasLoopRetry: boolean;
    hasSurfaceFixes: boolean;
    cheatingScore: number;
    detectedCheatingPatterns: string[];
    preventionRequired: boolean;
  } {
    const detectedCheatingPatterns: string[] = [];
    let cheatingScore = 0;

    // 检测分数操控行为
    const scoreManipulationPatterns = [
      /提升.*分数|improve.*score|increase.*rating|boost.*quality/gi,
      /质量分数.*提高|quality score.*better|score.*higher/gi,
      /为了.*分数|for.*score|to get.*points/gi,
    ];

    const hasScoreManipulation = scoreManipulationPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedCheatingPatterns.push(`分数操控: ${matches.slice(0, 2).join(", ")}`);
        cheatingScore += 3;
        return true;
      }
      return false;
    });

    // 检测伪造文件创建
    const fileForgingPatterns = [
      /创建.*测试文件.*提升|create.*test.*improve|add.*test.*coverage/gi,
      /创建.*空.*文件|create.*empty.*file|dummy.*file/gi,
      /虚假.*实现|fake.*implementation|placeholder.*code/gi,
    ];

    const hasFileForging = fileForgingPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedCheatingPatterns.push(`文件伪造: ${matches.slice(0, 2).join(", ")}`);
        cheatingScore += 4;
        return true;
      }
      return false;
    });

    // 检测盲目重构行为
    const blindRefactoringPatterns = [
      /重构.*复杂.*函数|refactor.*complex.*function|simplify.*function/gi,
      /减少.*复杂度|reduce.*complexity|lower.*complexity/gi,
      /修改.*不相关.*代码|modify.*unrelated.*code/gi,
    ];

    const hasBlindRefactoring = blindRefactoringPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedCheatingPatterns.push(`盲目重构: ${matches.slice(0, 2).join(", ")}`);
        cheatingScore += 3;
        return true;
      }
      return false;
    });

    // 检测循环重试模式
    const loopRetryPatterns = [
      /再次.*运行|run.*again|try.*again|重新.*检查/gi,
      /重复.*调用|repeat.*call|call.*multiple.*times/gi,
    ];

    const hasLoopRetry = loopRetryPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedCheatingPatterns.push(`循环重试: ${matches.slice(0, 2).join(", ")}`);
        cheatingScore += 2;
        return true;
      }
      return false;
    });

    // 检测表面修复行为
    const surfaceFixPatterns = [
      /表面.*修复|surface.*fix|cosmetic.*change/gi,
      /简单.*修改|simple.*change|quick.*fix/gi,
      /只需要.*修改|just.*modify|only.*need.*to/gi,
    ];

    const hasSurfaceFixes = surfaceFixPatterns.some(pattern => {
      const matches = aiResponse.match(pattern);
      if (matches) {
        detectedCheatingPatterns.push(`表面修复: ${matches.slice(0, 2).join(", ")}`);
        cheatingScore += 2;
        return true;
      }
      return false;
    });

    // 检查工具调用历史中的异常模式
    if (toolCallHistory.length > 0) {
      const recentCalls = toolCallHistory.slice(-5);
      const qualityToolCalls = recentCalls.filter(call =>
        call.includes('codeReviewAndCleanupTool') ||
        call.includes('qualityAnalyzer')
      );

      if (qualityToolCalls.length >= 3) {
        detectedCheatingPatterns.push(`频繁质量检查: ${qualityToolCalls.length}次连续调用`);
        cheatingScore += 2;
      }
    }

    return {
      hasScoreManipulation,
      hasFileForging,
      hasBlindRefactoring,
      hasLoopRetry,
      hasSurfaceFixes,
      cheatingScore,
      detectedCheatingPatterns,
      preventionRequired: cheatingScore >= 5,
    };
  }

  /**
   * 综合分析对话上下文
   * Comprehensive conversation context analysis
   */
  static analyzeConversationContext(
    userInput: string,
    aiResponse: string,
    conversationHistory: string = "",
    toolCallHistory: string[] = []
  ): {
    naturalTriggers: ReturnType<typeof ConversationPatternDetector.detectNaturalTriggers>;
    aiRisks: ReturnType<typeof ConversationPatternDetector.detectAIResponseRisks>;
    codeQualityCheating: ReturnType<typeof ConversationPatternDetector.detectCodeQualityCheatingBehavior>;
    overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    recommendedIntervention: "NONE" | "MONITOR" | "VERIFY" | "FORCE_SEARCH" | "PREVENT_CHEATING";
    interventionReason: string;
  } {
    const fullContext = `${conversationHistory} ${userInput} ${aiResponse}`;

    const naturalTriggers = this.detectNaturalTriggers(userInput);
    const aiRisks = this.detectAIResponseRisks(aiResponse);
    const codeQualityCheating = this.detectCodeQualityCheatingBehavior(aiResponse, toolCallHistory);

    // 计算总体风险级别
    const totalScore = naturalTriggers.triggerScore + aiRisks.riskScore + codeQualityCheating.cheatingScore;
    let overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    let recommendedIntervention: "NONE" | "MONITOR" | "VERIFY" | "FORCE_SEARCH" | "PREVENT_CHEATING";
    let interventionReason: string;

    // 优先检查代码质量作弊行为
    if (codeQualityCheating.preventionRequired) {
      overallRiskLevel = "CRITICAL";
      recommendedIntervention = "PREVENT_CHEATING";
      interventionReason = `检测到AI代码质量作弊行为: ${codeQualityCheating.detectedCheatingPatterns.join(", ")}`;
    } else if (totalScore >= 8 || aiRisks.interventionRequired) {
      overallRiskLevel = "CRITICAL";
      recommendedIntervention = "FORCE_SEARCH";
      interventionReason = "检测到高风险AI行为模式，需要立即强制搜索验证";
    } else if (totalScore >= 5 || naturalTriggers.recommendedAction === "IMMEDIATE_SEARCH") {
      overallRiskLevel = "HIGH";
      recommendedIntervention = "FORCE_SEARCH";
      interventionReason = "检测到明确的搜索需求或技术问题，建议立即搜索";
    } else if (totalScore >= 3 || naturalTriggers.recommendedAction === "VERIFICATION_RECOMMENDED") {
      overallRiskLevel = "MEDIUM";
      recommendedIntervention = "VERIFY";
      interventionReason = "检测到不确定性或时间敏感问题，建议验证";
    } else if (totalScore >= 1) {
      overallRiskLevel = "LOW";
      recommendedIntervention = "MONITOR";
      interventionReason = "检测到轻微风险模式，继续监控";
    } else {
      overallRiskLevel = "LOW";
      recommendedIntervention = "NONE";
      interventionReason = "未检测到显著风险模式";
    }

    return {
      naturalTriggers,
      aiRisks,
      codeQualityCheating,
      overallRiskLevel,
      recommendedIntervention,
      interventionReason,
    };
  }
}