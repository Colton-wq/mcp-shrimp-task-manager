/**
 * A/B测试报告生成工具
 * A/B Test Report Generation Tool
 * 
 * 提供A/B测试数据分析和报告生成功能
 */

import { z } from "zod";
import { toolCallTracker } from "../../utils/toolCallTracker.js";

/**
 * A/B测试报告生成参数
 */
export const abTestReportSchema = z.object({
  action: z
    .enum(["start", "stop", "analyze", "list", "summary"])
    .describe("操作类型：开始测试、停止测试、分析结果、列出测试、生成摘要"),

  testId: z
    .string()
    .optional()
    .describe("测试ID（分析、停止、摘要操作时必需）"),

  testName: z
    .string()
    .optional()
    .describe("测试名称（开始测试时可选）"),

  variantA: z
    .object({
      name: z.string().describe("变体A名称"),
      toolName: z.string().describe("变体A对应的工具名称"),
    })
    .optional()
    .describe("变体A配置（开始测试时必需）"),

  variantB: z
    .object({
      name: z.string().describe("变体B名称"),
      toolName: z.string().describe("变体B对应的工具名称"),
    })
    .optional()
    .describe("变体B配置（开始测试时必需）"),

  duration: z
    .number()
    .optional()
    .describe("测试持续时间（毫秒，可选，不指定则手动停止）"),

  includeTimeSeriesData: z
    .boolean()
    .optional()
    .default(false)
    .describe("是否包含时间序列数据"),

  reportFormat: z
    .enum(["markdown", "json", "summary"])
    .optional()
    .default("markdown")
    .describe("报告格式"),
});

/**
 * A/B测试报告生成工具
 */
export async function abTestReport({
  action,
  testId,
  testName = "A/B Test",
  variantA,
  variantB,
  duration,
  includeTimeSeriesData = false,
  reportFormat = "markdown",
}: z.infer<typeof abTestReportSchema>) {
  const tracker = toolCallTracker;

  try {
    switch (action) {
      case "start": {
        if (!variantA || !variantB) {
          throw new Error("开始测试需要提供variantA和variantB配置");
        }

        const variants: Record<string, string> = {};
        variants[variantA.name] = variantA.toolName;
        variants[variantB.name] = variantB.toolName;
        const newTestId = tracker.startABTest(testName, variants);
        
        const response = {
          success: true,
          action: "start",
          testId: newTestId,
          message: `A/B测试已开始`,
          details: {
            testName,
            variantA,
            variantB,
            duration: duration ? `${duration}ms` : "手动停止",
            startTime: new Date().toISOString(),
          },
        };

        return {
          content: [
            {
              type: "text" as const,
              text: reportFormat === "json" 
                ? JSON.stringify(response, null, 2)
                : `# A/B测试已开始 ✅

**测试ID**: ${newTestId}
**测试名称**: ${testName}
**变体A**: ${variantA.name} (${variantA.toolName})
**变体B**: ${variantB.name} (${variantB.toolName})
**持续时间**: ${duration ? `${Math.round(duration / (24 * 60 * 60 * 1000))}天` : "手动停止"}
**开始时间**: ${new Date().toLocaleString()}

测试现在正在收集数据。使用以下命令查看进度：
\`\`\`
abTestReport({ action: "analyze", testId: "${newTestId}" })
\`\`\``,
            },
          ],
        };
      }

      case "stop": {
        if (!testId) {
          throw new Error("停止测试需要提供testId");
        }

        const result = tracker.stopABTest(testId);
        if (!result) {
          throw new Error(`Test ${testId} not found or already stopped`);
        }

        const response = {
          success: true,
          action: "stop",
          testId,
          message: "A/B测试已停止",
          analysis: result,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: reportFormat === "json" 
                ? JSON.stringify(response, null, 2)
                : `# A/B Test Stopped

Test ID: ${testId}
Stop Time: ${new Date().toLocaleString()}
Status: Test completed successfully`,
            },
          ],
        };
      }

      case "analyze": {
        if (!testId) {
          throw new Error("分析测试需要提供testId");
        }

        const analysis = tracker.getABTestResults(testId);
        if (!analysis) {
          throw new Error(`Test ${testId} not found`);
        }

        if (reportFormat === "json") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  action: "analyze",
                  testId,
                  analysis,
                }, null, 2),
              },
            ],
          };
        }

        const variantNames = Object.keys(analysis.variants);
        let report = `# A/B Test Analysis Report\n\n`;
        report += `Test ID: ${analysis.testId}\n`;
        report += `Status: ${analysis.status}\n`;
        report += `Start Time: ${new Date(analysis.startTime).toLocaleString()}\n\n`;

        variantNames.forEach(variantName => {
          const variant = analysis.variants[variantName];
          report += `## ${variantName}\n`;
          report += `Tool: ${variant.toolName}\n`;
          report += `Calls: ${variant.callCount}\n`;
          report += `Success Rate: ${(variant.successRate * 100).toFixed(1)}%\n`;
          report += `Average Duration: ${variant.averageDuration.toFixed(0)}ms\n\n`;
        });

        return {
          content: [
            {
              type: "text" as const,
              text: report,
            },
          ],
        };
      }

      case "list": {
        const activeTests = tracker.getActiveABTestIds();
        const realTimeStats = tracker.getRealTimeStats();

        const response = {
          success: true,
          action: "list",
          activeTests,
          totalActiveTests: activeTests.length,
          systemStats: realTimeStats,
        };

        if (reportFormat === "json") {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }

        let report = `# A/B测试列表 📋\n\n`;
        
        if (activeTests.length === 0) {
          report += `当前没有活跃的A/B测试。\n\n`;
        } else {
          report += `## 活跃测试 (${activeTests.length}个)\n\n`;
          activeTests.forEach((id, index) => {
            report += `${index + 1}. **${id}**\n`;
          });
          report += `\n`;
        }

        report += `## 系统统计\n\n`;
        report += `- **活跃调用**: ${realTimeStats.activeCalls}\n`;
        report += `- **今日总调用**: ${realTimeStats.totalCallsToday}\n`;
        report += `- **平均响应时间**: ${realTimeStats.averageResponseTime.toFixed(0)}ms\n`;
        report += `- **错误率**: ${(realTimeStats.errorRate * 100).toFixed(1)}%\n\n`;

        if (realTimeStats.topTools.length > 0) {
          report += `## 热门工具\n\n`;
          realTimeStats.topTools.forEach((tool, index) => {
            report += `${index + 1}. **${tool.name}**: ${tool.calls} 次调用\n`;
          });
        }

        return {
          content: [
            {
              type: "text" as const,
              text: report,
            },
          ],
        };
      }

      case "summary": {
        if (!testId) {
          throw new Error("Test ID required for summary generation");
        }

        const testData = tracker.getABTestResults(testId);
        if (!testData) {
          throw new Error(`Test ${testId} not found`);
        }

        const summary = `Test ${testId} Summary:\nStatus: ${testData.status}\nVariants: ${Object.keys(testData.variants).length}`;

        return {
          content: [
            {
              type: "text" as const,
              text: summary,
            },
          ],
        };
      }

      default:
        throw new Error(`不支持的操作: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const errorResponse = {
      success: false,
      action,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: reportFormat === "json" 
            ? JSON.stringify(errorResponse, null, 2)
            : `# ❌ 操作失败\n\n**操作**: ${action}\n**错误**: ${errorMessage}\n**时间**: ${new Date().toLocaleString()}`,
        },
      ],
    };
  }
}

export default abTestReport;