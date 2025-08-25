import { z } from "zod";
import { UUID_V4_REGEX } from "../../utils/regex.js";
import {
  createSuccessResponse,
  createNotFoundError,
  createValidationError,
  createInternalError,
  createWorkflowResponse,
} from "../../utils/mcpResponse.js";
import { getTaskById } from "../../models/taskModel.js";
import { getMandatoryReviewPrompt } from "../../prompts/generators/mandatoryReview.js";
import { EvidenceVerifier } from "./evidenceVerifier.js";
import { ConversationPatternDetector } from "../intervention/conversationPatternDetector.js";
import { SimpleWorkflowManager } from "../../utils/workflowManager.js";
import { WorkflowStatus } from "../../types/workflow.js";
import { ProjectSession } from "../../utils/projectSession.js";

/**
 * Mandatory Code Review Tool Schema
 * 强制代码审查工具参数定义
 */
export const mandatoryCodeReviewSchema = z.object({
  taskId: z
    .string()
    .regex(UUID_V4_REGEX, {
      message: "Invalid task ID format. Must be a valid UUID v4 format (8-4-4-4-12 hexadecimal digits). EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. Use list_tasks or query_task to find valid task IDs.",
    })
    .describe("Unique identifier of the task to review. MUST BE: valid UUID v4 format from existing task in system. HOW TO GET: use list_tasks to see all tasks, or query_task to search by name/description. EXAMPLE: 'a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789'. VALIDATION: 8-4-4-4-12 hexadecimal pattern."),
  
  project: z
    .string()
    .min(1, {
      message: "Project parameter is required for multi-agent safety. Please specify the project name to ensure task data isolation and prevent concurrent conflicts. EXAMPLE: 'my-web-app', 'backend-service', 'mobile-client'. This parameter is mandatory in both MCPHub gateway mode and single IDE mode.",
    })
    .describe("REQUIRED - Target project context for mandatory code review. MANDATORY for multi-agent concurrent safety. Ensures review is performed in correct project context and prevents data conflicts between different agents. EXAMPLES: 'my-web-app', 'backend-api', 'mobile-client'. CRITICAL: This parameter prevents concurrent agent conflicts in both MCPHub gateway mode and single IDE mode."),
  
  submissionContext: z
    .string()
    .min(10, {
      message: "Submission context must be at least 10 characters. Provide detailed context about what you implemented, changed, or claim to have accomplished. EXAMPLE: 'Implemented JWT authentication with bcrypt password hashing, added input validation middleware, created user registration endpoint with email verification.'",
    })
    .describe("AI's submission context describing what was implemented, changed, or accomplished. MINIMUM 10 characters. MUST INCLUDE: specific technical details, implementation approach, files modified, functionality added. PURPOSE: This context will be analyzed to generate dynamic review requirements and detect potential deception patterns."),
  
  claimedEvidence: z
    .string()
    .min(5, {
      message: "Claimed evidence must be at least 5 characters. Describe the evidence you have for your implementation (compilation results, test outputs, file changes, etc.). EXAMPLE: 'TypeScript compilation successful, all ESLint checks passed, 15 unit tests passing, created 3 new files: auth.ts, middleware.ts, routes.ts'",
    })
    .describe("Evidence claimed by AI to support their implementation. MINIMUM 5 characters. SHOULD INCLUDE: compilation results, test outputs, file system changes, performance metrics, error logs. PURPOSE: This evidence will be verified against actual system state to detect fabrication or distortion."),
  
  reviewScope: z
    .enum(["comprehensive", "focused", "security_only", "quality_only"])
    .default("comprehensive")
    .describe("Scope of the mandatory review to perform. COMPREHENSIVE: Full analysis including logic, security, quality, and evidence verification. FOCUSED: Target specific areas based on submission context. SECURITY_ONLY: Focus on security vulnerabilities and best practices. QUALITY_ONLY: Focus on code quality standards and maintainability."),
});

/**
 * Review Requirement Interface
 * 审查要求接口定义
 */
interface ReviewRequirement {
  category: string;
  requirement: string;
  evidenceRequired: string[];
  criticalThinkingCheckpoints: string[];
  failureConsequences: string;
}

/**
 * Review Result Interface
 * 审查结果接口定义
 */
interface ReviewResult {
  passed: boolean;
  score: number;
  dynamicRequirements: ReviewRequirement[];
  evidenceVerification: {
    verified: boolean;
    issues: string[];
    realEvidence: string[];
  };
  deceptionDetection: {
    detected: boolean;
    patterns: string[];
    severity: "low" | "medium" | "high";
  };
  mandatoryActions: string[];
  nextSteps: string[];
}

/**
 * Mandatory Code Review Tool
 * 强制代码审查工具主函数
 * 
 * This tool implements dynamic review requirement generation similar to split_tasks,
 * analyzes AI submissions for deception patterns, and enforces evidence verification.
 */
export async function mandatoryCodeReview({
  taskId,
  project,
  submissionContext,
  claimedEvidence,
  reviewScope,
}: z.infer<typeof mandatoryCodeReviewSchema>) {
  const { ProjectSession } = await import("../../utils/projectSession.js");
  
  return await ProjectSession.withProjectContext(project, async () => {
    try {
      // Step 1: Validate task exists and is in correct state
      const task = await getTaskById(taskId, project);
      
      if (!task) {
        return createNotFoundError(
          "Task",
          taskId,
          "Use list_tasks to see all available tasks, or query_task to search by name/description"
        );
      }

      // Step 2: Basic validation of submission context
      if (!submissionContext.trim() || !claimedEvidence.trim()) {
        return createValidationError(
          "submission data",
          "empty or insufficient",
          "Both submissionContext and claimedEvidence must contain meaningful content",
          "Provide detailed technical information about your implementation and supporting evidence"
        );
      }

      // Step 3: Generate dynamic review requirements using intelligent analysis
      // The generator will perform its own context analysis using analyzeSubmissionContext()
      const dynamicReviewPrompt = await getMandatoryReviewPrompt({
        taskId: task.id,
        taskName: task.name,
        taskDescription: task.description,
        submissionContext,
        claimedEvidence,
        reviewScope,
        // Optional parameters omitted - generator will use internal analysis
      });

      const dynamicRequirements = [
        {
          category: "Dynamic Analysis",
          requirement: "Review requirements have been dynamically generated based on submission context",
          evidenceRequired: ["Generated prompt content"],
          criticalThinkingCheckpoints: ["Context analysis completed"],
          failureConsequences: "Review cannot proceed without dynamic analysis",
        },
      ];

      // Step 4: Real evidence verification using EvidenceVerifier
      const evidenceVerifier = new EvidenceVerifier();
      const evidenceVerification = await evidenceVerifier.verifyEvidence(
        submissionContext,
        claimedEvidence,
        task,
        process.cwd() // Use current working directory as project path
      );

      // Step 5: Enhanced deception detection
      const deceptionAnalysis = ConversationPatternDetector.detectEvidenceDistortion(
        submissionContext,
        claimedEvidence,
        task.description
      );

      // Step 6: Generate review result with real verification data
      const enforcementResult = EvidenceVerifier.enforceVerification(evidenceVerification);
      
      const reviewResult: ReviewResult = {
        passed: evidenceVerification.verified && !enforcementResult.shouldBlock,
        score: evidenceVerification.score,
        dynamicRequirements,
        evidenceVerification: {
          verified: evidenceVerification.verified,
          issues: evidenceVerification.issues,
          realEvidence: evidenceVerification.realEvidence,
        },
        deceptionDetection: {
          detected: deceptionAnalysis.hasEvidenceDistortion,
          patterns: deceptionAnalysis.detectedPatterns,
          severity: mapSeverity(deceptionAnalysis.distortionScore),
        },
        mandatoryActions: enforcementResult.shouldBlock 
          ? enforcementResult.requiredActions
          : ["All mandatory requirements have been satisfied"],
        nextSteps: enforcementResult.shouldBlock
          ? [
              "Address all identified evidence verification issues",
              "Provide real, verifiable evidence as specified",
              "Resubmit to mandatory_code_review after corrections",
            ]
          : [
              "Evidence verification passed",
              "Proceed to next task execution with execute_task",
            ],
      };

      // Update workflow status
      let workflow = SimpleWorkflowManager.findWorkflowByTaskId(taskId);
      if (workflow) {
        const reviewStepIndex = workflow.steps.findIndex((s: any) => s.tool === "mandatory_code_review");
        if (reviewStepIndex >= 0) {
          SimpleWorkflowManager.updateStepStatus(
            workflow.workflowId,
            reviewStepIndex,
            reviewResult.passed ? WorkflowStatus.COMPLETED : WorkflowStatus.FAILED,
            { 
              score: reviewResult.score, 
              evidenceVerified: evidenceVerification.verified,
              deceptionDetected: deceptionAnalysis.hasEvidenceDistortion 
            }
          );
        }
      }

      // Generate workflow continuation guidance
      const workflowContinuation = workflow 
        ? SimpleWorkflowManager.generateContinuation(workflow.workflowId)
        : {
            shouldProceed: reviewResult.passed,
            nextTool: reviewResult.passed ? "execute_task" : "mandatory_code_review",
            reason: reviewResult.passed 
              ? "Review passed - proceed to next task execution" 
              : "Review failed - must complete mandatory actions and resubmit evidence",
          };

      // Return the dynamically generated review prompt as the main response
      return createWorkflowResponse(dynamicReviewPrompt, workflowContinuation);

    } catch (error) {
      return createInternalError(
        "mandatory code review",
        error instanceof Error ? error : new Error("Unknown error occurred during review process")
      );
    }
  });
}

/**
 * Map distortion score to severity level
 * 将扭曲分数映射到严重程度级别
 */
function mapSeverity(score: number): "low" | "medium" | "high" {
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

