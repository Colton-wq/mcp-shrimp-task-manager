import { z } from "zod";
import { getReflectTaskPrompt } from "../../prompts/index.js";

// 反思構想工具
// Task reflection tool
export const reflectTaskSchema = z.object({
  summary: z
    .string()
    .min(10, {
      message: "Task summary must be at least 10 characters and maintain consistency with analysis phase. Please provide structured summary that matches previous analysis to ensure continuity. EXAMPLE: 'User authentication system analysis - JWT implementation with role-based access control and security considerations.'",
    })
    .describe("Structured task summary maintaining consistency with analysis phase for continuity. MUST MATCH: previous analysis summary to ensure workflow coherence. MINIMUM 10 characters. PURPOSE: link reflection to specific analysis results. EXAMPLE: 'E-commerce API design analysis - microservices architecture with event-driven communication patterns.'"),
  analysis: z
    .string()
    .min(100, {
      message: "Technical analysis must be at least 100 characters with comprehensive details. Please provide complete analysis including: (1) Technical details and specifications, (2) Dependency components and integrations, (3) Implementation approach and strategy, (4) Risk assessment and mitigation, (5) Performance considerations. Use pseudocode format if code examples needed.",
    })
    .describe("Complete detailed technical analysis results with all technical details, dependencies, and implementation approach. MINIMUM 100 characters. MUST INCLUDE: technical specifications, dependency analysis, implementation strategy, risk assessment, performance considerations. IF CODE NEEDED: use pseudocode format with high-level logic flow only, avoid complete code implementation. EXAMPLE: 'Comprehensive analysis of user authentication system: JWT token implementation with refresh mechanism, bcrypt password hashing, role-based middleware, Redis session storage, rate limiting for security, and OAuth2 integration for social login.'"),
});

export async function reflectTask({
  summary,
  analysis,
}: z.infer<typeof reflectTaskSchema>) {
  // 使用prompt生成器獲取最終prompt
  // Use prompt generator to get the final prompt
  const prompt = await getReflectTaskPrompt({
    summary,
    analysis,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: prompt,
      },
    ],
  };
}
