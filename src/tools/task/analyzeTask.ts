import { z } from "zod";
import { getAnalyzeTaskPrompt } from "../../prompts/index.js";

// 分析問題工具
// Task analysis tool
export const analyzeTaskSchema = z.object({
  summary: z
    .string()
    .min(10, {
      message: "Task summary must be at least 10 characters. Please provide structured summary including: (1) Task objectives, (2) Technical scope, (3) Key challenges, (4) Success criteria. Example: 'Analyze user authentication system requirements, identify security vulnerabilities, assess scalability constraints, and recommend implementation approach.'",
    })
    .describe("Structured task summary for technical analysis. REQUIRED ELEMENTS: task objectives, scope definition, key technical challenges, success criteria. MINIMUM 10 characters. EXAMPLE: 'Evaluate microservices architecture for e-commerce platform, focusing on data consistency, service communication, and deployment strategies.'"),
  initialConcept: z
    .string()
    .min(50, {
      message: "Initial solution concept must be at least 50 characters. Please provide comprehensive technical approach including: (1) Architecture design, (2) Implementation strategy, (3) Technology stack, (4) Risk considerations. Use pseudocode format if code examples needed. Example: 'Implement event-driven architecture using Node.js microservices with Redis message queue, PostgreSQL for data persistence, and Docker containerization for deployment.'",
    })
    .describe("Preliminary solution concept with technical approach, architectural design, and implementation strategy. MINIMUM 50 characters. MUST INCLUDE: technology choices, architectural patterns, implementation approach, risk assessment. IF CODE NEEDED: use pseudocode format with high-level logic flow only, avoid complete code implementation. EXAMPLE: 'Design RESTful API with Express.js, implement JWT authentication middleware, use Prisma ORM for database operations, and Redis for session management.'"),
  previousAnalysis: z
    .string()
    .optional()
    .describe("Previous iteration analysis results for continuous improvement. OPTIONAL - only provide when re-analyzing or iterating on previous work. SHOULD INCLUDE: previous findings, identified issues, lessons learned, areas for improvement. EXAMPLE: 'Previous analysis identified performance bottlenecks in database queries and recommended connection pooling implementation.'"),
});

export async function analyzeTask({
  summary,
  initialConcept,
  previousAnalysis,
}: z.infer<typeof analyzeTaskSchema>) {
  // 使用prompt生成器獲取最終prompt，启用智能模板选择
  // Use prompt generator to get the final prompt with intelligent template selection
  const prompt = await getAnalyzeTaskPrompt({
    summary,
    initialConcept,
    previousAnalysis,
    analysisType: 'auto', // 启用智能检测
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
