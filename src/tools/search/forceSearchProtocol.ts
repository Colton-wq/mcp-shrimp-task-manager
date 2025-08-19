import { z } from "zod";

/**
 * Force Search Protocol - MCP-compliant AI behavior intervention tool
 * Analyzes conversation patterns and generates mandatory search strategies
 * for evidence-based AI responses
 */

export const forceSearchProtocolSchema = z.object({
  conversationContext: z
    .string()
    .min(10, {
      message: "Conversation context must be at least 10 characters",
    })
    .describe("Complete conversation context including user questions, AI responses, and technical discussions"),

  problemDescription: z
    .string()
    .min(5, {
      message: "Problem description must be at least 5 characters",
    })
    .describe("Current technical problem or specific issue requiring resolution"),

  currentApproach: z
    .string()
    .optional()
    .describe("Current solution approach or technical method being used"),

  uncertaintyLevel: z
    .enum(["low", "medium", "high"])
    .describe("Uncertainty level assessment for current solution approach"),

  errorCount: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe("Number of repeated errors or failed attempts with same method"),
});

/**
 * Enhanced semantic pattern detector for AI behavior analysis with cognitive bias detection
 */
class SemanticPatternDetector {
  private static OVERCONFIDENT_PATTERNS = [
    /perfectly fine|no problems?|simple fix|easy solution|straightforward/gi,
    /should work|will work|definitely|certainly|obviously/gi,
    /just need to|simply|merely|only need/gi,
    /everything looks good|all tests passing|working correctly/gi,
    /没问题|很简单|肯定可以|绝对没错|完全正常/gi,
  ];

  private static UNCERTAINTY_PATTERNS = [
    /I think|I believe|I assume|probably|might be|could be/gi,
    /seems like|appears to|looks like|based on my knowledge/gi,
    /不确定|不知道|不清楚|不太确定|不太清楚/gi,
    /uncertain|unsure|not sure|don't know|unclear/gi,
    /是否是|是不是|会不会|能不能/gi,
  ];

  private static ERROR_PERSISTENCE_PATTERNS = [
    /try again|continue|keep trying|same approach/gi,
    /let's try|another attempt|one more time/gi,
    /继续尝试|再试一次|坚持当前|同样的方法/gi,
    /persist|maintain|stick with|keep going/gi,
  ];

  private static OVERSIMPLIFICATION_PATTERNS = [
    /it's just|simply|basic|trivial|straightforward/gi,
    /no need to|don't need|unnecessary/gi,
    /只需要|很简单|基础的|不复杂|直接/gi,
    /avoid complexity|skip details|ignore edge cases/gi,
  ];

  // 新增：错误方向卡死检测模式
  private static ERROR_DIRECTION_STUCK_PATTERNS = [
    /same error|repeated failure|stuck on|not working again/gi,
    /tried multiple times|keep failing|still broken/gi,
    /相同错误|重复失败|一直卡在|还是不行/gi,
    /tried \d+ times|attempt \d+|failure \d+/gi,
  ];

  // 新增：虚假成功报告检测模式
  private static FALSE_SUCCESS_PATTERNS = [
    /looks like it works|seems to be working|appears successful/gi,
    /should be fine now|probably fixed|likely resolved/gi,
    /看起来成功了|似乎解决了|应该没问题了/gi,
    /without actual testing|without verification|assuming it works/gi,
  ];

  // 新增：假设性判断检测模式
  private static ASSUMPTION_BASED_PATTERNS = [
    /I think this code|I believe the implementation|based on my understanding/gi,
    /the code should|this implementation should|it's reasonable to assume/gi,
    /我认为这个代码|我觉得这个实现|根据我的理解/gi,
    /without checking|without looking at|based on memory/gi,
  ];

  // 新增：复杂性回避检测模式
  private static COMPLEXITY_AVOIDANCE_PATTERNS = [
    /let's keep it simple|avoid overcomplicating|simple approach/gi,
    /placeholder|TODO|will implement later|basic version/gi,
    /保持简单|避免复杂|简单方法|占位符|稍后实现/gi,
    /mock implementation|dummy data|fake response/gi,
  ];

  static analyzeContext(context: string): {
    hasOverconfidence: boolean;
    hasUncertainty: boolean;
    hasErrorPersistence: boolean;
    hasOversimplification: boolean;
    hasErrorDirectionStuck: boolean;
    hasFalseSuccess: boolean;
    hasAssumptionBased: boolean;
    hasComplexityAvoidance: boolean;
    detectedPatterns: string[];
    riskLevel: "low" | "medium" | "high";
    cognitiveRiskFactors: string[];
    frameworkBreakRequired: boolean;
  } {
    const detectedPatterns: string[] = [];
    const cognitiveRiskFactors: string[] = [];
    let riskScore = 0;

    const overconfidenceMatches = this.OVERCONFIDENT_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Overconfidence: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("OVERCONFIDENCE_BIAS");
        riskScore += 2;
        return true;
      }
      return false;
    });

    const uncertaintyMatches = this.UNCERTAINTY_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Uncertainty: ${matches.join(", ")}`);
        riskScore += 1;
        return true;
      }
      return false;
    });

    const errorPersistenceMatches = this.ERROR_PERSISTENCE_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Error persistence: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("ERROR_DIRECTION_PERSISTENCE");
        riskScore += 3;
        return true;
      }
      return false;
    });

    const oversimplificationMatches = this.OVERSIMPLIFICATION_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Oversimplification: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("COMPLEXITY_AVOIDANCE");
        riskScore += 1;
        return true;
      }
      return false;
    });

    // 新增：错误方向卡死检测
    const errorDirectionStuckMatches = this.ERROR_DIRECTION_STUCK_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Error Direction Stuck: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("ERROR_DIRECTION_STUCK");
        riskScore += 4; // 高风险
        return true;
      }
      return false;
    });

    // 新增：虚假成功报告检测
    const falseSuccessMatches = this.FALSE_SUCCESS_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`False Success Report: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("FALSE_SUCCESS_REPORTING");
        riskScore += 3;
        return true;
      }
      return false;
    });

    // 新增：假设性判断检测
    const assumptionBasedMatches = this.ASSUMPTION_BASED_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Assumption-Based Judgment: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("ASSUMPTION_BASED_REASONING");
        riskScore += 2;
        return true;
      }
      return false;
    });

    // 新增：复杂性回避检测
    const complexityAvoidanceMatches = this.COMPLEXITY_AVOIDANCE_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`Complexity Avoidance: ${matches.join(", ")}`);
        cognitiveRiskFactors.push("COMPLEXITY_AVOIDANCE");
        riskScore += 2;
        return true;
      }
      return false;
    });

    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskScore >= 5) {
      riskLevel = "high";
    } else if (riskScore >= 3) {
      riskLevel = "medium";
    }

    // 判断是否需要强制跳出思维框架
    const frameworkBreakRequired = errorDirectionStuckMatches ||
                                  falseSuccessMatches ||
                                  (assumptionBasedMatches && complexityAvoidanceMatches) ||
                                  riskScore >= 6;

    return {
      hasOverconfidence: overconfidenceMatches,
      hasUncertainty: uncertaintyMatches,
      hasErrorPersistence: errorPersistenceMatches,
      hasOversimplification: oversimplificationMatches,
      hasErrorDirectionStuck: errorDirectionStuckMatches,
      hasFalseSuccess: falseSuccessMatches,
      hasAssumptionBased: assumptionBasedMatches,
      hasComplexityAvoidance: complexityAvoidanceMatches,
      detectedPatterns,
      riskLevel,
      cognitiveRiskFactors,
      frameworkBreakRequired,
    };
  }
}

/**
 * Intelligent keyword generator for progressive search strategies
 */
class IntelligentKeywordGenerator {
  static generateProgressiveKeywords(problemDescription: string): {
    coreKeywords: string[];
    expandedKeywords: string[];
    technicalKeywords: string[];
    contextualKeywords: string[];
  } {
    const text = problemDescription.toLowerCase();
    
    const technicalTerms = [
      'mcp', 'typescript', 'javascript', 'node', 'npm', 'api', 'server', 'client',
      'database', 'sql', 'json', 'http', 'rest', 'graphql', 'websocket', 'auth',
      'react', 'vue', 'angular', 'express', 'fastify', 'next', 'nuxt', 'svelte',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'github', 'git', 'ci/cd',
      'test', 'jest', 'vitest', 'cypress', 'playwright', 'webpack', 'vite', 'rollup'
    ];
    
    const coreKeywords = text
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => technicalTerms.includes(word) || word.length > 4)
      .slice(0, 3);
    
    const expandedKeywords = text
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    const technicalKeywords = technicalTerms.filter(term => text.includes(term));
    
    const contextualKeywords = [
      ...coreKeywords,
      '2025', 'latest', 'best practices', 'solution', 'implementation'
    ];
    
    return {
      coreKeywords,
      expandedKeywords,
      technicalKeywords,
      contextualKeywords
    };
  }
}

/**
 * Search strategy generator with intelligent prioritization
 */
class SearchStrategyGenerator {
  static determineSearchPriority(
    analysis: ReturnType<typeof SemanticPatternDetector.analyzeContext>,
    errorCount: number,
    problemDescription: string
  ): "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW" {
    const isProjectRelated = /mcp|shrimp|task|manager|github|repository/i.test(problemDescription);
    const isTechnicalComplex = /error|fail|bug|issue|problem|troubleshoot|debug|configuration|optimization|performance|integration|deployment|setup/i.test(problemDescription);
    const isSimpleQuery = /javascript|array|method|basic|concept|explanation/i.test(problemDescription) &&
                         !isTechnicalComplex &&
                         errorCount === 0;

    // 强制跳出思维框架的情况 - 最高优先级
    if (analysis.frameworkBreakRequired || analysis.hasErrorDirectionStuck || analysis.hasFalseSuccess) {
      return "IMMEDIATE";
    }

    // 高认知风险情况
    if (analysis.riskLevel === "high" || errorCount >= 2 ||
        (analysis.hasAssumptionBased && analysis.hasComplexityAvoidance)) {
      return "IMMEDIATE";
    }

    // 中等认知风险情况
    else if ((analysis.riskLevel === "medium" && errorCount >= 1) ||
             (isTechnicalComplex && errorCount >= 1) ||
             isProjectRelated ||
             analysis.hasAssumptionBased ||
             analysis.hasComplexityAvoidance) {
      return "HIGH";
    }

    // 简单查询但有认知偏差
    else if (isSimpleQuery && !analysis.hasUncertainty && !analysis.hasOverconfidence &&
             analysis.cognitiveRiskFactors.length === 0) {
      return "LOW";
    }

    // 其他不确定性或过度自信情况
    else if (analysis.hasUncertainty || analysis.hasOverconfidence || isProjectRelated) {
      return "MEDIUM";
    }

    return "LOW";
  }

  static generateSearchPlan(
    problemDescription: string,
    analysis: ReturnType<typeof SemanticPatternDetector.analyzeContext>,
    errorCount: number
  ): {
    searchKeywords: ReturnType<typeof IntelligentKeywordGenerator.generateProgressiveKeywords>;
    mcpToolCalls: Array<{
      tool: string;
      priority: number;
      parameters: Record<string, any>;
      rationale: string;
      timeout: number;
      expectedQuality: "HIGH" | "MEDIUM" | "LOW";
    }>;
    verificationRequirements: string[];
    searchPriority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW";
    qualityGates: string[];
  } {
    const searchKeywords = IntelligentKeywordGenerator.generateProgressiveKeywords(problemDescription);
    const mcpToolCalls: Array<{
      tool: string;
      priority: number;
      parameters: Record<string, any>;
      rationale: string;
      timeout: number;
      expectedQuality: "HIGH" | "MEDIUM" | "LOW";
    }> = [];
    const verificationRequirements: string[] = [];
    const qualityGates: string[] = [];
    
    const searchPriority = this.determineSearchPriority(analysis, errorCount, problemDescription);
    const { coreKeywords, technicalKeywords } = searchKeywords;
    
    if (searchPriority === "IMMEDIATE") {
      // 强制框架跳出序列
      if (analysis.frameworkBreakRequired) {
        mcpToolCalls.push(
          {
            tool: "codebase-retrieval",
            priority: 1,
            parameters: {
              information_request: `${problemDescription} CRITICAL REALITY CHECK - actual implementation state, error patterns, failed approaches`,
            },
            rationale: "🚨 FRAMEWORK BREAK: MANDATORY Reality Check - Challenge ALL assumptions about current code state",
            timeout: 30000,
            expectedQuality: "HIGH",
          },
          {
            tool: "github-local-search_issues_mcphub-all-services",
            priority: 2,
            parameters: {
              q: `${coreKeywords.join(" ")} error failed stuck`,
              state: "all",
              per_page: 5,
            },
            rationale: "🚨 ERROR PATTERN ANALYSIS: Find similar failure cases and their solutions",
            timeout: 25000,
            expectedQuality: "HIGH",
          },
          {
            tool: "web_search_exa_exa-mcp-server",
            priority: 3,
            parameters: {
              query: `${coreKeywords.join(" ")} common mistakes pitfalls troubleshooting 2025`,
              numResults: 5,
            },
            rationale: "🚨 ANTI-PATTERN SEARCH: Find what NOT to do and common failure modes",
            timeout: 20000,
            expectedQuality: "HIGH",
          },
          {
            tool: "tavily_search_tavily-remote-mcp",
            priority: 4,
            parameters: {
              query: `${coreKeywords.join(" ")} debugging methodology systematic approach`,
              search_depth: "advanced",
              max_results: 3,
            },
            rationale: "🚨 SYSTEMATIC DEBUGGING: Find structured problem-solving approaches",
            timeout: 30000,
            expectedQuality: "HIGH",
          }
        );
      } else {
        // 标准IMMEDIATE序列
        mcpToolCalls.push(
          {
            tool: "codebase-retrieval",
            priority: 1,
            parameters: {
              information_request: `${problemDescription} actual implementation current state`,
            },
            rationale: "MANDATORY Codebase Reality Check: Get ACTUAL code state, not assumptions",
            timeout: 30000,
            expectedQuality: "HIGH",
          },
          {
            tool: "github-local-search_code_mcphub-all-services",
            priority: 2,
            parameters: {
              q: `${coreKeywords.join(" ")} ${technicalKeywords.join(" ")}`,
              per_page: 5,
            },
            rationale: "GitHub Code Search: Find actual implementations and solutions",
            timeout: 25000,
            expectedQuality: "HIGH",
          },
          {
            tool: "web_search_exa_exa-mcp-server",
            priority: 3,
            parameters: {
              query: `${coreKeywords.join(" ")} 2025 latest solution`,
              numResults: 5,
            },
            rationale: "Technical Documentation Search: Find authoritative technical solutions",
            timeout: 20000,
            expectedQuality: "HIGH",
          },
          {
            tool: "tavily_search_tavily-remote-mcp",
            priority: 4,
            parameters: {
              query: `${coreKeywords.join(" ")} tutorial solution 2025`,
              search_depth: "advanced",
              max_results: 3,
            },
            rationale: "Current Solutions Search: Get 2025-current solutions and best practices",
            timeout: 30000,
            expectedQuality: "MEDIUM",
          }
        );
      }

      if (analysis.frameworkBreakRequired) {
        verificationRequirements.push(
          "🚨 CRITICAL: MUST challenge ALL current assumptions and approaches",
          "🚨 MANDATORY: Find evidence that CONTRADICTS current thinking",
          "🚨 REQUIRED: Identify what has been WRONG in previous attempts",
          "🚨 ESSENTIAL: Provide alternative approaches that avoid current error patterns",
          "MUST provide at least 3 different sources of 2025 latest information",
          "MUST include specific failure cases and their solutions"
        );

        qualityGates.push(
          "🚨 FRAMEWORK BREAK: Must find evidence contradicting current approach",
          "🚨 ERROR ANALYSIS: Must identify specific failure patterns",
          "🚨 ALTERNATIVE PATHS: Must provide completely different approaches",
          "Sources must include troubleshooting and debugging methodologies"
        );
      } else {
        verificationRequirements.push(
          "MUST provide at least 3 different sources of 2025 latest information",
          "MUST include specific code examples or implementation cases",
          "MUST verify solution effectiveness and currency",
          "MUST prioritize GitHub and official documentation sources"
        );

        qualityGates.push(
          "Each search result must be relevant to the core problem",
          "Sources must be from 2025 or latest available",
          "Must include at least one working code example"
        );
      }
      
    } else if (searchPriority === "HIGH") {
      mcpToolCalls.push(
        {
          tool: "codebase-retrieval",
          priority: 1,
          parameters: {
            information_request: `${problemDescription} related implementation`,
          },
          rationale: "Codebase Analysis: Check existing implementation patterns",
          timeout: 25000,
          expectedQuality: "HIGH",
        },
        {
          tool: "github-local-search_repositories_mcphub-all-services",
          priority: 2,
          parameters: {
            query: `${coreKeywords.join(" ")} ${technicalKeywords.join(" ")}`,
            perPage: 5,
          },
          rationale: "GitHub Repository Search: Find relevant projects and solutions",
          timeout: 20000,
          expectedQuality: "HIGH",
        },
        {
          tool: "web_search_exa_exa-mcp-server",
          priority: 3,
          parameters: {
            query: `${coreKeywords.join(" ")} best practices 2025`,
            numResults: 3,
          },
          rationale: "Best Practices Verification: Validate current approach",
          timeout: 15000,
          expectedQuality: "MEDIUM",
        }
      );

      verificationRequirements.push(
        "MUST provide at least 2 authoritative sources for verification",
        "MUST confirm information currency (2025 valid)",
        "MUST include GitHub or official documentation sources"
      );
      
      qualityGates.push(
        "Sources must be authoritative and recent",
        "Must include practical implementation guidance"
      );
      
    } else if (searchPriority === "MEDIUM") {
      mcpToolCalls.push(
        {
          tool: "codebase-retrieval",
          priority: 1,
          parameters: {
            information_request: `${problemDescription} implementation check`,
          },
          rationale: "Codebase Check: Verify existing patterns",
          timeout: 20000,
          expectedQuality: "MEDIUM",
        },
        {
          tool: "web_search_exa_exa-mcp-server",
          priority: 2,
          parameters: {
            query: `${coreKeywords.join(" ")} 2025`,
            numResults: 2,
          },
          rationale: "Quick Verification: Check current best practices",
          timeout: 15000,
          expectedQuality: "MEDIUM",
        }
      );

      verificationRequirements.push(
        "SHOULD provide at least 1 authoritative source",
        "SHOULD confirm basic approach validity"
      );
      
      qualityGates.push(
        "Basic relevance check required"
      );
      
    } else {
      mcpToolCalls.push(
        {
          tool: "codebase-retrieval",
          priority: 1,
          parameters: {
            information_request: `${problemDescription} quick check`,
          },
          rationale: "Quick Codebase Check: Basic pattern verification",
          timeout: 15000,
          expectedQuality: "LOW",
        }
      );

      verificationRequirements.push(
        "OPTIONAL: Basic verification recommended"
      );
      
      qualityGates.push(
        "Minimal quality check"
      );
    }

    return {
      searchKeywords,
      mcpToolCalls,
      verificationRequirements,
      searchPriority,
      qualityGates,
    };
  }
}

/**
 * Search result evaluator for quality assessment
 */
class SearchResultEvaluator {
  static evaluateSearchQuality(
    results: any[],
    expectedQuality: "HIGH" | "MEDIUM" | "LOW",
    keywords: string[]
  ): {
    qualityScore: number;
    relevanceScore: number;
    authorityScore: number;
    currencyScore: number;
    recommendations: string[];
  } {
    if (!results || results.length === 0) {
      return {
        qualityScore: 0,
        relevanceScore: 0,
        authorityScore: 0,
        currencyScore: 0,
        recommendations: ["No results found - consider broader keywords"]
      };
    }

    let relevanceScore = 0;
    let authorityScore = 0;
    let currencyScore = 0;
    const recommendations: string[] = [];

    results.forEach(result => {
      const text = (result.title + " " + result.description + " " + result.content).toLowerCase();
      const keywordMatches = keywords.filter(keyword => text.includes(keyword.toLowerCase()));
      relevanceScore += keywordMatches.length / keywords.length;
    });
    relevanceScore = relevanceScore / results.length;

    const authorityDomains = ['github.com', 'stackoverflow.com', 'docs.', 'official', 'mozilla.org'];
    results.forEach(result => {
      const url = result.url || result.link || '';
      if (authorityDomains.some(domain => url.includes(domain))) {
        authorityScore += 1;
      }
    });
    authorityScore = authorityScore / results.length;

    results.forEach(result => {
      const text = (result.title + " " + result.description + " " + result.content).toLowerCase();
      if (text.includes('2025') || text.includes('latest') || text.includes('current')) {
        currencyScore += 1;
      }
    });
    currencyScore = currencyScore / results.length;

    const qualityScore = (relevanceScore * 0.4 + authorityScore * 0.3 + currencyScore * 0.3);

    if (relevanceScore < 0.5) {
      recommendations.push("Consider refining keywords for better relevance");
    }
    if (authorityScore < 0.3) {
      recommendations.push("Seek more authoritative sources (GitHub, official docs)");
    }
    if (currencyScore < 0.3) {
      recommendations.push("Look for more recent (2025) information");
    }

    return {
      qualityScore,
      relevanceScore,
      authorityScore,
      currencyScore,
      recommendations
    };
  }

  static adjustSearchStrategy(
    currentResults: any[],
    originalKeywords: string[],
    searchPriority: "IMMEDIATE" | "HIGH" | "MEDIUM" | "LOW"
  ): {
    adjustedKeywords: string[];
    nextSearchTools: string[];
    strategyChanges: string[];
  } {
    const evaluation = this.evaluateSearchQuality(currentResults, "HIGH", originalKeywords);
    const adjustedKeywords = [...originalKeywords];
    const nextSearchTools: string[] = [];
    const strategyChanges: string[] = [];

    if (evaluation.qualityScore < 0.6) {
      if (evaluation.relevanceScore < 0.5) {
        adjustedKeywords.push("implementation", "tutorial", "example");
        strategyChanges.push("Added more specific technical keywords");
      }

      if (evaluation.authorityScore < 0.3) {
        nextSearchTools.push("github-local-search_repositories_mcphub-all-services");
        nextSearchTools.push("context7-mcp-get-library-docs_mcphub-all-services");
        strategyChanges.push("Prioritizing authoritative sources");
      }

      if (evaluation.currencyScore < 0.3) {
        adjustedKeywords.push("2025", "latest", "current");
        strategyChanges.push("Emphasizing recent information");
      }
    }

    return {
      adjustedKeywords,
      nextSearchTools,
      strategyChanges
    };
  }
}

export async function forceSearchProtocol({
  conversationContext,
  problemDescription,
  currentApproach = "",
  uncertaintyLevel,
  errorCount = 0,
}: z.infer<typeof forceSearchProtocolSchema>) {
  const semanticAnalysis = SemanticPatternDetector.analyzeContext(
    `${conversationContext} ${currentApproach}`
  );

  const searchPlan = SearchStrategyGenerator.generateSearchPlan(
    problemDescription,
    semanticAnalysis,
    errorCount
  );

  const criticalThinkingChecklist = [
    "🚨 FRAMEWORK BREAK CHECK: Are you stuck in the same error direction? Have you been trying the same approach repeatedly?",
    "🚨 REALITY VERIFICATION: Have you checked the ACTUAL code state using Augment Context Engine? Stop relying on memory or assumptions!",
    "🚨 FALSE SUCCESS DETECTION: Are you claiming success without actual testing? Are you being overly optimistic about results?",
    "🚨 COMPLEXITY HONESTY: Are you avoiding complexity with placeholder implementations? Are you using fake data or mock responses?",
    "ASSUMPTION CHALLENGE: What assumptions is your current solution based on? Have these assumptions been verified with real code?",
    "BIAS DETECTION: Is there confirmation bias or overconfidence? Are you ignoring potential problems or failure scenarios?",
    "OBJECTIVE VERIFICATION: Is there objective evidence supporting your current approach? Are information sources authoritative and current?",
    "ERROR DIRECTION ANALYSIS: If this approach has failed before, why are you continuing? What evidence suggests it will work now?",
  ];

  const response = {
    analysisResult: {
      riskLevel: semanticAnalysis.riskLevel,
      detectedPatterns: semanticAnalysis.detectedPatterns,
      cognitiveRiskFactors: semanticAnalysis.cognitiveRiskFactors,
      frameworkBreakRequired: semanticAnalysis.frameworkBreakRequired,
      searchPriority: searchPlan.searchPriority,
      recommendedAction: semanticAnalysis.frameworkBreakRequired
        ? "🚨 CRITICAL_FRAMEWORK_BREAK_REQUIRED"
        : searchPlan.searchPriority === "IMMEDIATE"
        ? "MANDATORY_SEARCH_REQUIRED"
        : searchPlan.searchPriority === "HIGH"
        ? "HIGH_PRIORITY_VERIFICATION_REQUIRED"
        : searchPlan.searchPriority === "MEDIUM"
        ? "VERIFICATION_RECOMMENDED"
        : "PROCEED_WITH_CAUTION",
      cognitiveInterventions: semanticAnalysis.frameworkBreakRequired
        ? [
            "STOP current approach immediately",
            "Challenge ALL assumptions about the problem",
            "Seek evidence that contradicts current thinking",
            "Find alternative approaches that avoid current error patterns",
            "Use systematic debugging methodology"
          ]
        : [],
    },
    searchStrategy: searchPlan,
    criticalThinkingChecklist,
    mandatoryRequirements: [
      "🚨 PROHIBIT ALL assumptions - MUST verify with Augment Context Engine (codebase-retrieval)",
      "🚨 PROHIBIT continuing in error direction - MUST stop and reassess if same approach failed before",
      "🚨 PROHIBIT false success claims - MUST provide actual test results and verification",
      "🚨 PROHIBIT complexity avoidance - NO placeholder implementations, mock data, or TODO comments",
      "🚨 PROHIBIT memory-based reasoning - MUST use actual code content and running results",
      "MUST complete all recommended MCP tool calls in priority order",
      "MUST provide specific citations and sources with authority ratings",
      "MUST re-evaluate if search results conflict with current approach",
      "MUST prioritize GitHub and official documentation sources",
      "MUST respect search timeouts and quality expectations",
      "MUST seek contradictory evidence and failure scenarios for each solution",
    ],
    qualityAssurance: {
      searchPriority: searchPlan.searchPriority,
      qualityGates: searchPlan.qualityGates,
      expectedSources: searchPlan.searchPriority === "IMMEDIATE" ? "3+ authoritative sources" :
                      searchPlan.searchPriority === "HIGH" ? "2+ authoritative sources" :
                      searchPlan.searchPriority === "MEDIUM" ? "1+ authoritative source" : "Optional verification",
      timeoutPolicy: "Respect individual tool timeouts, fail gracefully if needed",
    },
    nextSteps: searchPlan.searchPriority === "IMMEDIATE" 
      ? "IMMEDIATELY execute mandatory search sequence, suspend current approach until verification complete"
      : searchPlan.searchPriority === "HIGH"
      ? "Execute high-priority verification search, then proceed with validated approach"
      : searchPlan.searchPriority === "MEDIUM"
      ? "Execute basic verification search, then continue current approach"
      : "Optional verification recommended, proceed with current approach",
  };

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}