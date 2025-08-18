import { z } from "zod";

// 强制搜索协议工具 - AI行为干预系统 v3.0
// Force Search Protocol Tool - AI Behavior Intervention System v3.0
export const forceSearchProtocolSchema = z.object({
  conversationContext: z
    .string()
    .min(10, {
      message: "对话上下文不能少于10个字符，请提供完整的上下文信息",
    })
    .describe("当前对话的完整上下文，包括用户问题、AI回答、技术讨论等内容"),
  
  problemDescription: z
    .string()
    .min(5, {
      message: "问题描述不能少于5个字符，请提供明确的问题描述",
    })
    .describe("当前面临的技术问题或需要解决的具体问题"),
  
  currentApproach: z
    .string()
    .optional()
    .describe("当前采用的解决方案或技术方法"),
  
  uncertaintyLevel: z
    .enum(["low", "medium", "high"])
    .describe("对当前解决方案的不确定性级别评估"),
  
  errorCount: z
    .number()
    .min(0)
    .optional()
    .default(0)
    .describe("相同错误或方法的重复次数"),
});

// 语义模式检测器
// Semantic Pattern Detector
class SemanticPatternDetector {
  // 过度乐观表述模式
  private static OVERCONFIDENT_PATTERNS = [
    /perfectly fine|no problems?|simple fix|easy solution|straightforward/gi,
    /should work|will work|definitely|certainly|obviously/gi,
    /just need to|simply|merely|only need/gi,
  ];

  // 不确定性表达模式
  private static UNCERTAINTY_PATTERNS = [
    /I think|I believe|I assume|probably|might be|could be/gi,
    /我认为|我觉得|我想|可能|也许|应该是|大概/gi,
    /seems like|appears to|looks like|based on my knowledge/gi,
    /据我所知|根据我的知识|通常|一般来说/gi,
  ];

  // 错误方向持续模式
  private static ERROR_PERSISTENCE_PATTERNS = [
    /try again|continue|keep trying|same approach/gi,
    /let's try|another attempt|one more time/gi,
    /再试|继续|保持|同样的方法/gi,
  ];

  // 问题简化倾向模式
  private static OVERSIMPLIFICATION_PATTERNS = [
    /it's just|simply|basic|trivial|straightforward/gi,
    /只是|简单|基本|直接|容易/gi,
    /no need to|don't need|unnecessary/gi,
  ];

  static analyzeContext(context: string): {
    hasOverconfidence: boolean;
    hasUncertainty: boolean;
    hasErrorPersistence: boolean;
    hasOversimplification: boolean;
    detectedPatterns: string[];
    riskLevel: "low" | "medium" | "high";
  } {
    const detectedPatterns: string[] = [];
    let riskScore = 0;

    // 检测过度乐观
    const overconfidenceMatches = this.OVERCONFIDENT_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`过度乐观: ${matches.join(", ")}`);
        riskScore += 2;
        return true;
      }
      return false;
    });

    // 检测不确定性
    const uncertaintyMatches = this.UNCERTAINTY_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`不确定性表达: ${matches.join(", ")}`);
        riskScore += 1;
        return true;
      }
      return false;
    });

    // 检测错误持续
    const errorPersistenceMatches = this.ERROR_PERSISTENCE_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`错误方向持续: ${matches.join(", ")}`);
        riskScore += 3;
        return true;
      }
      return false;
    });

    // 检测过度简化
    const oversimplificationMatches = this.OVERSIMPLIFICATION_PATTERNS.some(pattern => {
      const matches = context.match(pattern);
      if (matches) {
        detectedPatterns.push(`问题简化倾向: ${matches.join(", ")}`);
        riskScore += 2;
        return true;
      }
      return false;
    });

    // 计算风险级别
    let riskLevel: "low" | "medium" | "high" = "low";
    if (riskScore >= 5) riskLevel = "high";
    else if (riskScore >= 2) riskLevel = "medium";

    return {
      hasOverconfidence: overconfidenceMatches,
      hasUncertainty: uncertaintyMatches,
      hasErrorPersistence: errorPersistenceMatches,
      hasOversimplification: oversimplificationMatches,
      detectedPatterns,
      riskLevel,
    };
  }
}

// 搜索策略生成器
// Search Strategy Generator
class SearchStrategyGenerator {
  static generateSearchPlan(
    problemDescription: string,
    analysis: ReturnType<typeof SemanticPatternDetector.analyzeContext>,
    errorCount: number
  ): {
    searchKeywords: string[];
    mcpToolCalls: Array<{
      tool: string;
      priority: number;
      parameters: Record<string, any>;
      rationale: string;
    }>;
    verificationRequirements: string[];
  } {
    const searchKeywords: string[] = [];
    const mcpToolCalls: Array<{
      tool: string;
      priority: number;
      parameters: Record<string, any>;
      rationale: string;
    }> = [];
    const verificationRequirements: string[] = [];

    // 基于问题描述生成关键词
    const problemKeywords = problemDescription
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
    
    searchKeywords.push(...problemKeywords, "2025", "latest", "best practices");

    // 基于风险级别和模式生成搜索策略
    if (analysis.riskLevel === "high" || errorCount >= 2) {
      // 高风险：强制多源搜索
      mcpToolCalls.push(
        {
          tool: "web_search_exa_exa-mcp-server",
          priority: 1,
          parameters: {
            query: `${problemDescription} 2025 latest solution`,
            numResults: 5,
          },
          rationale: "高风险检测：需要最新权威信息验证",
        },
        {
          tool: "github-local-search_code_mcphub-all-services",
          priority: 2,
          parameters: {
            q: `${problemKeywords.join(" ")} language:typescript language:javascript`,
          },
          rationale: "代码实例验证：查找实际实现案例",
        },
        {
          tool: "tavily_search_tavily-remote-mcp",
          priority: 3,
          parameters: {
            query: `${problemDescription} troubleshooting guide 2025`,
            search_depth: "advanced",
            max_results: 3,
          },
          rationale: "深度技术搜索：获取故障排除指南",
        }
      );

      verificationRequirements.push(
        "必须提供至少3个不同来源的2025年最新信息",
        "必须包含具体的代码示例或实现案例",
        "必须验证解决方案的有效性和时效性"
      );
    } else if (analysis.riskLevel === "medium") {
      // 中等风险：标准搜索验证
      mcpToolCalls.push(
        {
          tool: "web_search_exa_exa-mcp-server",
          priority: 1,
          parameters: {
            query: `${problemDescription} best practices 2025`,
            numResults: 3,
          },
          rationale: "中等风险：验证最佳实践",
        },
        {
          tool: "context7-mcp-get-library-docs_mcphub-all-services",
          priority: 2,
          parameters: {
            context7CompatibleLibraryID: "相关技术栈ID",
            topic: problemKeywords.join(" "),
          },
          rationale: "官方文档验证：确保方案准确性",
        }
      );

      verificationRequirements.push(
        "必须提供至少2个权威来源的验证",
        "必须确认信息的时效性（2025年有效）"
      );
    }

    return {
      searchKeywords,
      mcpToolCalls,
      verificationRequirements,
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
  // 执行语义分析
  const semanticAnalysis = SemanticPatternDetector.analyzeContext(
    `${conversationContext} ${currentApproach}`
  );

  // 生成搜索策略
  const searchPlan = SearchStrategyGenerator.generateSearchPlan(
    problemDescription,
    semanticAnalysis,
    errorCount
  );

  // 批判思维检查点
  const criticalThinkingChecklist = [
    "🔍 假设挑战：当前解决方案基于哪些假设？这些假设是否经过验证？",
    "⚠️ 偏差检测：是否存在确认偏差或过度自信？是否忽略了潜在问题？",
    "📊 客观验证：是否有客观证据支持当前方案？信息来源是否权威且最新？",
  ];

  // 构建强制性响应
  const response = {
    analysisResult: {
      riskLevel: semanticAnalysis.riskLevel,
      detectedPatterns: semanticAnalysis.detectedPatterns,
      recommendedAction: semanticAnalysis.riskLevel === "high" 
        ? "MANDATORY_SEARCH_REQUIRED" 
        : semanticAnalysis.riskLevel === "medium"
        ? "VERIFICATION_RECOMMENDED"
        : "PROCEED_WITH_CAUTION",
    },
    searchStrategy: searchPlan,
    criticalThinkingChecklist,
    mandatoryRequirements: [
      "🚫 禁止基于预训练知识的假设性回答",
      "✅ 必须完成所有推荐的MCP工具调用",
      "📝 必须提供具体的引用和来源",
      "🔄 如果搜索结果与当前方案冲突，必须重新评估",
    ],
    nextSteps: semanticAnalysis.riskLevel === "high" 
      ? "立即执行强制搜索，暂停当前方案直到验证完成"
      : "建议执行验证搜索，然后继续当前方案",
  };

  return {
    content: [
      {
        type: "text" as const,
        text: `# Force Search Protocol v3.0 分析结果

## 🚨 风险评估
- **风险级别**: ${response.analysisResult.riskLevel.toUpperCase()}
- **检测到的模式**: ${response.analysisResult.detectedPatterns.join("; ")}
- **推荐行动**: ${response.analysisResult.recommendedAction}

## 🔍 强制搜索策略
${response.searchStrategy.mcpToolCalls.map(call => 
  `### ${call.priority}. ${call.tool}
- **参数**: ${JSON.stringify(call.parameters, null, 2)}
- **理由**: ${call.rationale}`
).join("\n\n")}

## ✅ 批判思维检查点
${response.criticalThinkingChecklist.map(item => `- ${item}`).join("\n")}

## 📋 强制性要求
${response.mandatoryRequirements.map(req => `- ${req}`).join("\n")}

## 🔄 验证要求
${response.searchStrategy.verificationRequirements.map(req => `- ${req}`).join("\n")}

## 🎯 下一步行动
${response.nextSteps}

---
**重要提醒**: 此工具检测到需要外部验证的模式。请严格按照上述搜索策略执行，确保信息的准确性和时效性。`,
      },
    ],
  };
}