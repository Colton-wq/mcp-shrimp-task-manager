import { generatePrompt, loadPromptFromTemplate, loadPrompt } from "../loader.js";

/**
 * Mandatory Review Prompt Parameters
 * 强制审查提示词参数
 */
export interface MandatoryReviewPromptParams {
  taskId: string;
  taskName: string;
  taskDescription: string;
  submissionContext: string;
  claimedEvidence: string;
  reviewScope: "comprehensive" | "focused" | "security_only" | "quality_only";
  detectedTechStack?: string[]; // Optional - will be populated by internal analysis
  detectedPatterns?: string[]; // Optional - will be populated by internal analysis
  contextAnalysis?: {           // Optional - will be overridden by internal analysis
    codeType: string;
    complexity: "low" | "medium" | "high";
    riskLevel: "low" | "medium" | "high";
    deceptionIndicators: string[];
  };
}

/**
 * Context Analysis Result
 * 上下文分析结果
 */
interface ContextAnalysis {
  codeType: string;
  techStack: string[];
  complexity: "low" | "medium" | "high";
  riskLevel: "low" | "medium" | "high";
  deceptionIndicators: string[];
  evidenceRequirements: string[];
  criticalThinkingCheckpoints: string[];
}

/**
 * Get the complete mandatory review prompt
 * 获取完整的强制审查提示词
 * 
 * This function implements dynamic generation similar to getSplitTasksPrompt,
 * analyzing AI submission context and generating targeted review requirements.
 */
export async function getMandatoryReviewPrompt(
  params: MandatoryReviewPromptParams
): Promise<string> {
  
  // Step 1: Analyze submission context to detect patterns and risks
  const contextAnalysis = analyzeSubmissionContext(
    params.submissionContext,
    params.claimedEvidence,
    params.reviewScope
  );

  // Step 2: Generate dynamic review requirements based on context
  const dynamicRequirements = generateDynamicRequirements(
    contextAnalysis,
    params.reviewScope,
    params.taskDescription
  );

  // Step 3: Generate critical thinking checkpoints
  const criticalThinkingCheckpoints = generateCriticalThinkingCheckpoints(
    contextAnalysis,
    params.submissionContext,
    params.claimedEvidence
  );

  // Step 4: Generate evidence verification requirements
  const evidenceRequirements = generateEvidenceRequirements(
    contextAnalysis,
    params.claimedEvidence,
    params.reviewScope
  );

  // Step 5: Detect potential deception patterns
  const deceptionAnalysis = detectDeceptionPatterns(
    params.submissionContext,
    params.claimedEvidence,
    contextAnalysis
  );

  // Step 6: Load and populate the main template
  const indexTemplate = await loadPromptFromTemplate("mandatoryReview/index.md");
  
  const prompt = generatePrompt(indexTemplate, {
    taskId: params.taskId,
    taskName: params.taskName,
    taskDescription: params.taskDescription,
    submissionContext: params.submissionContext,
    claimedEvidence: params.claimedEvidence,
    reviewScope: params.reviewScope.toUpperCase(),
    
    // Dynamic content
    contextAnalysis: formatContextAnalysis(contextAnalysis),
    dynamicRequirements: formatDynamicRequirements(dynamicRequirements),
    criticalThinkingCheckpoints: formatCriticalThinkingCheckpoints(criticalThinkingCheckpoints),
    evidenceRequirements: formatEvidenceRequirements(evidenceRequirements),
    deceptionAnalysis: formatDeceptionAnalysis(deceptionAnalysis),
    
    // Metadata
    complexity: contextAnalysis.complexity.toUpperCase(),
    riskLevel: contextAnalysis.riskLevel.toUpperCase(),
    techStack: contextAnalysis.techStack.join(", ") || "Not detected",
    timestamp: new Date().toISOString(),
  });

  // Load possible custom prompt
  return loadPrompt(prompt, "MANDATORY_REVIEW");
}

/**
 * Analyze submission context to detect patterns and risks
 * 分析提交上下文以检测模式和风险
 */
function analyzeSubmissionContext(
  submissionContext: string,
  claimedEvidence: string,
  reviewScope: string
): ContextAnalysis {
  const text = `${submissionContext} ${claimedEvidence}`.toLowerCase();
  
  // Detect code type and technology stack
  const codeType = detectCodeType(text);
  const techStack = detectTechStack(text);
  
  // Assess complexity based on submission content
  const complexity = assessComplexity(submissionContext, claimedEvidence);
  
  // Assess risk level based on claimed changes
  const riskLevel = assessRiskLevel(submissionContext, claimedEvidence, reviewScope);
  
  // Detect potential deception indicators
  const deceptionIndicators = detectDeceptionIndicators(submissionContext, claimedEvidence);
  
  // Generate evidence requirements based on context
  const evidenceRequirements = generateContextBasedEvidenceRequirements(codeType, techStack, complexity);
  
  // Generate critical thinking checkpoints
  const criticalThinkingCheckpoints = generateContextBasedCheckpoints(codeType, complexity, riskLevel);
  
  return {
    codeType,
    techStack,
    complexity,
    riskLevel,
    deceptionIndicators,
    evidenceRequirements,
    criticalThinkingCheckpoints,
  };
}

/**
 * Detect code type from submission context
 * 从提交上下文检测代码类型
 */
function detectCodeType(text: string): string {
  const patterns = {
    "Frontend Development": ["react", "vue", "angular", "html", "css", "javascript", "typescript", "jsx", "tsx"],
    "Backend Development": ["api", "server", "database", "endpoint", "middleware", "authentication", "authorization"],
    "Full-Stack Development": ["full-stack", "fullstack", "frontend", "backend", "database", "api"],
    "DevOps/Infrastructure": ["docker", "kubernetes", "deployment", "ci/cd", "pipeline", "infrastructure"],
    "Data Processing": ["data", "analytics", "etl", "pipeline", "processing", "transformation"],
    "Testing": ["test", "testing", "unit test", "integration test", "e2e", "automation"],
    "Security": ["security", "authentication", "authorization", "encryption", "vulnerability"],
    "Performance": ["performance", "optimization", "caching", "scaling", "load balancing"],
  };

  for (const [type, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return type;
    }
  }

  return "General Development";
}

/**
 * Detect technology stack from submission context
 * 从提交上下文检测技术栈
 */
function detectTechStack(text: string): string[] {
  const techPatterns = {
    "TypeScript": ["typescript", "ts", ".ts", "tsc"],
    "JavaScript": ["javascript", "js", ".js", "node"],
    "React": ["react", "jsx", "tsx", "component"],
    "Vue": ["vue", "vuejs", ".vue"],
    "Angular": ["angular", "@angular"],
    "Node.js": ["node", "nodejs", "npm", "express"],
    "Python": ["python", "py", ".py", "pip"],
    "Java": ["java", ".java", "maven", "gradle"],
    "C#": ["c#", "csharp", ".cs", ".net"],
    "Go": ["golang", "go", ".go"],
    "Rust": ["rust", ".rs", "cargo"],
    "Docker": ["docker", "dockerfile", "container"],
    "Kubernetes": ["kubernetes", "k8s", "kubectl"],
    "PostgreSQL": ["postgresql", "postgres", "psql"],
    "MySQL": ["mysql", "mariadb"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis", "cache"],
    "AWS": ["aws", "amazon", "s3", "ec2", "lambda"],
    "Azure": ["azure", "microsoft"],
    "GCP": ["gcp", "google cloud"],
  };

  const detectedTech: string[] = [];
  
  for (const [tech, patterns] of Object.entries(techPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      detectedTech.push(tech);
    }
  }

  return detectedTech;
}

/**
 * Assess complexity based on submission content
 * 基于提交内容评估复杂度
 */
function assessComplexity(submissionContext: string, claimedEvidence: string): "low" | "medium" | "high" {
  const text = `${submissionContext} ${claimedEvidence}`.toLowerCase();
  
  let complexityScore = 0;
  
  // High complexity indicators
  const highComplexityPatterns = [
    "microservices", "distributed", "scalability", "performance optimization",
    "security implementation", "authentication system", "authorization",
    "database migration", "data transformation", "complex algorithm",
    "integration", "third-party api", "real-time", "websocket",
    "machine learning", "ai", "blockchain", "cryptography"
  ];
  
  // Medium complexity indicators
  const mediumComplexityPatterns = [
    "api", "database", "middleware", "component", "service",
    "testing", "validation", "error handling", "logging",
    "configuration", "deployment", "build system"
  ];
  
  // Count complexity indicators
  highComplexityPatterns.forEach(pattern => {
    if (text.includes(pattern)) complexityScore += 3;
  });
  
  mediumComplexityPatterns.forEach(pattern => {
    if (text.includes(pattern)) complexityScore += 1;
  });
  
  // Length-based complexity
  if (submissionContext.length > 500) complexityScore += 2;
  if (submissionContext.length > 1000) complexityScore += 2;
  
  if (complexityScore >= 8) return "high";
  if (complexityScore >= 4) return "medium";
  return "low";
}

/**
 * Assess risk level based on claimed changes
 * 基于声称的变更评估风险级别
 */
function assessRiskLevel(submissionContext: string, claimedEvidence: string, reviewScope: string): "low" | "medium" | "high" {
  const text = `${submissionContext} ${claimedEvidence}`.toLowerCase();
  
  let riskScore = 0;
  
  // High risk indicators
  const highRiskPatterns = [
    "security", "authentication", "authorization", "password", "token",
    "database migration", "schema change", "production", "deployment",
    "breaking change", "api change", "data loss", "irreversible",
    "critical", "urgent", "hotfix", "emergency"
  ];
  
  // Medium risk indicators
  const mediumRiskPatterns = [
    "refactor", "restructure", "modify", "update", "change",
    "integration", "third-party", "external", "dependency",
    "configuration", "environment", "build", "test"
  ];
  
  highRiskPatterns.forEach(pattern => {
    if (text.includes(pattern)) riskScore += 3;
  });
  
  mediumRiskPatterns.forEach(pattern => {
    if (text.includes(pattern)) riskScore += 1;
  });
  
  // Review scope affects risk
  if (reviewScope === "security_only") riskScore += 2;
  if (reviewScope === "comprehensive") riskScore += 1;
  
  if (riskScore >= 6) return "high";
  if (riskScore >= 3) return "medium";
  return "low";
}

/**
 * Detect potential deception indicators
 * 检测潜在的欺骗指标
 */
function detectDeceptionIndicators(submissionContext: string, claimedEvidence: string): string[] {
  const indicators: string[] = [];
  
  // Vague or non-specific claims
  const vaguePatterns = [
    "successfully implemented", "completed", "finished", "done",
    "working correctly", "all tests pass", "no issues",
    "everything works", "fully functional", "ready for production"
  ];
  
  vaguePatterns.forEach(pattern => {
    if (submissionContext.toLowerCase().includes(pattern)) {
      indicators.push(`Vague claim detected: "${pattern}"`);
    }
  });
  
  // Inconsistency between context and evidence
  if (submissionContext.length > 200 && claimedEvidence.length < 50) {
    indicators.push("Inconsistency: Detailed implementation claim but minimal evidence");
  }
  
  // Overly confident language
  const overconfidentPatterns = [
    "perfect", "flawless", "100%", "completely", "absolutely",
    "definitely", "certainly", "guaranteed", "bulletproof"
  ];
  
  overconfidentPatterns.forEach(pattern => {
    if (submissionContext.toLowerCase().includes(pattern)) {
      indicators.push(`Overconfident language: "${pattern}"`);
    }
  });
  
  // Missing technical details
  if (submissionContext.length > 100 && !submissionContext.match(/\b(function|class|method|variable|file|line|code)\b/i)) {
    indicators.push("Missing technical implementation details");
  }
  
  return indicators;
}

/**
 * Generate context-based evidence requirements
 * 生成基于上下文的证据要求
 */
function generateContextBasedEvidenceRequirements(codeType: string, techStack: string[], complexity: string): string[] {
  const requirements: string[] = [];
  
  // Base requirements for all code types
  requirements.push("Actual source code files with implementation");
  requirements.push("Compilation/build logs showing success or errors");
  
  // Technology-specific requirements
  if (techStack.includes("TypeScript")) {
    requirements.push("TypeScript compilation output (tsc --noEmit)");
    requirements.push("ESLint check results");
  }
  
  if (techStack.includes("JavaScript") || techStack.includes("Node.js")) {
    requirements.push("Node.js execution logs");
    requirements.push("Package.json dependency verification");
  }
  
  if (techStack.includes("React") || techStack.includes("Vue") || techStack.includes("Angular")) {
    requirements.push("Component rendering verification");
    requirements.push("Browser console logs");
  }
  
  // Complexity-based requirements
  if (complexity === "high") {
    requirements.push("Performance benchmarks or profiling results");
    requirements.push("Integration test execution logs");
    requirements.push("Security scan results");
  }
  
  if (complexity === "medium") {
    requirements.push("Unit test execution results");
    requirements.push("Code coverage reports");
  }
  
  // Code type specific requirements
  if (codeType.includes("Backend")) {
    requirements.push("API endpoint testing results");
    requirements.push("Database connection verification");
  }
  
  if (codeType.includes("Frontend")) {
    requirements.push("UI component screenshots or recordings");
    requirements.push("Browser compatibility verification");
  }
  
  return requirements;
}

/**
 * Generate context-based critical thinking checkpoints
 * 生成基于上下文的批判性思维检查点
 */
function generateContextBasedCheckpoints(codeType: string, complexity: string, riskLevel: string): string[] {
  const checkpoints: string[] = [];
  
  // Universal critical thinking checkpoints
  checkpoints.push("Does the implementation actually solve the stated problem?");
  checkpoints.push("Are there logical contradictions in the approach?");
  checkpoints.push("Have edge cases and error conditions been properly handled?");
  
  // Complexity-based checkpoints
  if (complexity === "high") {
    checkpoints.push("Is the technical solution actually feasible with current constraints?");
    checkpoints.push("Have performance implications been properly considered?");
    checkpoints.push("Are there simpler alternatives that could achieve the same goal?");
  }
  
  // Risk-based checkpoints
  if (riskLevel === "high") {
    checkpoints.push("What are the potential failure modes and their impact?");
    checkpoints.push("Has backward compatibility been maintained?");
    checkpoints.push("Are there adequate rollback procedures in place?");
  }
  
  // Code type specific checkpoints
  if (codeType.includes("Security")) {
    checkpoints.push("Have security best practices been followed?");
    checkpoints.push("Are there potential vulnerabilities in the implementation?");
    checkpoints.push("Has input validation been properly implemented?");
  }
  
  if (codeType.includes("Performance")) {
    checkpoints.push("Have performance bottlenecks been identified and addressed?");
    checkpoints.push("Is the solution scalable for expected load?");
    checkpoints.push("Are there memory leaks or resource management issues?");
  }
  
  return checkpoints;
}

/**
 * Generate dynamic requirements based on context analysis
 * 基于上下文分析生成动态要求
 *
 * This function generates 1-5 specific, executable review tasks based on the actual
 * technology stack, complexity, and risk level detected from the submission context.
 */
function generateDynamicRequirements(
  contextAnalysis: ContextAnalysis,
  reviewScope: string,
  taskDescription: string
): Array<{category: string; requirement: string; mandatory: boolean}> {
  const requirements: Array<{category: string; requirement: string; mandatory: boolean}> = [];

  // Generate technology-specific requirements (1-3 requirements)
  const techSpecificRequirements = generateTechStackSpecificRequirements(contextAnalysis.techStack, taskDescription);
  requirements.push(...techSpecificRequirements);

  // Generate complexity-specific requirements (0-1 requirement)
  const complexityRequirement = generateComplexitySpecificRequirement(contextAnalysis.complexity, contextAnalysis.codeType);
  if (complexityRequirement) {
    requirements.push(complexityRequirement);
  }

  // Generate risk-specific requirements (0-1 requirement)
  const riskRequirement = generateRiskSpecificRequirement(contextAnalysis.riskLevel, contextAnalysis.techStack);
  if (riskRequirement) {
    requirements.push(riskRequirement);
  }

  // Generate review scope specific requirements (0-1 requirement)
  const scopeRequirement = generateScopeSpecificRequirement(reviewScope, contextAnalysis.techStack);
  if (scopeRequirement) {
    requirements.push(scopeRequirement);
  }

  // Ensure we have 1-5 requirements (limit for cognitive load)
  return requirements.slice(0, 5);
}

/**
 * Generate technology stack specific requirements
 * 生成技术栈特定的审查要求
 */
function generateTechStackSpecificRequirements(
  techStack: string[],
  taskDescription: string
): Array<{category: string; requirement: string; mandatory: boolean}> {
  const requirements: Array<{category: string; requirement: string; mandatory: boolean}> = [];

  // TypeScript specific requirements
  if (techStack.includes("TypeScript")) {
    requirements.push({
      category: "TypeScript Type Safety",
      requirement: "Verify that all interfaces and types are properly defined with no 'any' types used without justification. Check for proper null/undefined handling and type guards where necessary.",
      mandatory: true
    });
  }

  // JavaScript/Node.js specific requirements
  if (techStack.includes("JavaScript") || techStack.includes("Node.js")) {
    requirements.push({
      category: "JavaScript Code Quality",
      requirement: "Confirm that error handling is implemented for async operations, proper variable scoping is used, and no global variable pollution occurs.",
      mandatory: true
    });
  }

  // React specific requirements
  if (techStack.includes("React")) {
    requirements.push({
      category: "React Component Validation",
      requirement: "Verify that components have proper prop types or TypeScript interfaces, useEffect cleanup is implemented where needed, and component state management follows React best practices.",
      mandatory: true
    });
  }

  // Go specific requirements
  if (techStack.includes("Go")) {
    requirements.push({
      category: "Go Code Safety",
      requirement: "Check for proper error handling (no ignored errors), goroutine leak prevention, and proper resource cleanup (defer statements for file/connection closing).",
      mandatory: true
    });
  }

  // Python specific requirements
  if (techStack.includes("Python")) {
    requirements.push({
      category: "Python Code Quality",
      requirement: "Verify proper exception handling, type hints usage, and adherence to PEP 8 style guidelines. Check for potential security issues like SQL injection or unsafe eval usage.",
      mandatory: true
    });
  }

  // Database related requirements
  if (techStack.some(tech => ["PostgreSQL", "MySQL", "MongoDB"].includes(tech))) {
    requirements.push({
      category: "Database Security",
      requirement: "Confirm that database queries use parameterized statements or ORM methods to prevent SQL injection. Verify proper connection pooling and transaction handling.",
      mandatory: true
    });
  }

  return requirements;
}

/**
 * Generate complexity specific requirement
 * 生成复杂度特定的审查要求
 */
function generateComplexitySpecificRequirement(
  complexity: "low" | "medium" | "high",
  codeType: string
): {category: string; requirement: string; mandatory: boolean} | null {
  if (complexity === "high") {
    return {
      category: "High Complexity Validation",
      requirement: `For this high-complexity ${codeType.toLowerCase()} implementation, verify that the solution is broken down into smaller, testable functions/modules. Check for proper separation of concerns and that complex logic is well-documented with inline comments.`,
      mandatory: true
    };
  }

  if (complexity === "medium") {
    return {
      category: "Medium Complexity Review",
      requirement: "Confirm that the implementation maintains reasonable function/method sizes (under 50 lines) and that complex business logic is properly abstracted into separate functions.",
      mandatory: false
    };
  }

  return null; // No specific requirement for low complexity
}

/**
 * Generate risk specific requirement
 * 生成风险特定的审查要求
 */
function generateRiskSpecificRequirement(
  riskLevel: "low" | "medium" | "high",
  techStack: string[]
): {category: string; requirement: string; mandatory: boolean} | null {
  if (riskLevel === "high") {
    const securityTechs = techStack.filter(tech =>
      ["authentication", "security", "crypto", "jwt", "bcrypt", "oauth"].some(keyword =>
        tech.toLowerCase().includes(keyword)
      )
    );

    if (securityTechs.length > 0) {
      return {
        category: "High Risk Security Review",
        requirement: "For this high-risk security implementation, verify that sensitive data is properly encrypted, authentication tokens are securely generated and validated, and no hardcoded secrets or credentials exist in the code.",
        mandatory: true
      };
    }

    return {
      category: "High Risk Change Review",
      requirement: "For this high-risk change, provide evidence of thorough testing including edge cases, error scenarios, and rollback procedures. Confirm that the change doesn't introduce breaking changes to existing functionality.",
      mandatory: true
    };
  }

  return null; // No specific requirement for low/medium risk
}

/**
 * Generate review scope specific requirement
 * 生成审查范围特定的要求
 */
function generateScopeSpecificRequirement(
  reviewScope: string,
  techStack: string[]
): {category: string; requirement: string; mandatory: boolean} | null {
  if (reviewScope === "security_only") {
    return {
      category: "Security-Only Review",
      requirement: "Focus exclusively on security aspects: verify input validation, output encoding, authentication/authorization checks, and absence of common vulnerabilities (OWASP Top 10).",
      mandatory: true
    };
  }

  if (reviewScope === "comprehensive" && techStack.length > 0) {
    return {
      category: "Comprehensive Quality Review",
      requirement: `Perform end-to-end validation including: code compilation/build success, functional testing of implemented features, performance impact assessment, and integration with existing ${techStack.join(", ")} components.`,
      mandatory: false
    };
  }

  return null;
}

/**
 * Generate critical thinking checkpoints based on context
 * 基于上下文生成批判性思维检查点
 */
function generateCriticalThinkingCheckpoints(
  contextAnalysis: ContextAnalysis,
  submissionContext: string,
  claimedEvidence: string
): Array<{category: string; checkpoint: string; severity: "critical" | "important" | "advisory"}> {
  const checkpoints: Array<{category: string; checkpoint: string; severity: "critical" | "important" | "advisory"}> = [];
  
  // Cognitive Bias Detection (always critical)
  checkpoints.push({
    category: "Confirmation Bias",
    checkpoint: "Is the AI selectively presenting evidence that supports their claims while ignoring contradictory information?",
    severity: "critical"
  });
  
  checkpoints.push({
    category: "Anchoring Effect",
    checkpoint: "Is the AI anchored to a specific solution approach without considering alternatives?",
    severity: "important"
  });
  
  checkpoints.push({
    category: "Overconfidence Bias",
    checkpoint: "Is the AI displaying overconfidence in their implementation without adequate verification?",
    severity: "critical"
  });
  
  // Deception-specific checkpoints
  if (contextAnalysis.deceptionIndicators.length > 0) {
    checkpoints.push({
      category: "Evidence Distortion",
      checkpoint: "Are there signs that the AI is distorting or fabricating evidence to support their conclusions?",
      severity: "critical"
    });
  }
  
  // Complexity-specific checkpoints
  if (contextAnalysis.complexity === "high") {
    checkpoints.push({
      category: "Complexity Underestimation",
      checkpoint: "Is the AI underestimating the complexity of the implementation and claiming completion prematurely?",
      severity: "important"
    });
  }
  
  // Risk-specific checkpoints
  if (contextAnalysis.riskLevel === "high") {
    checkpoints.push({
      category: "Risk Awareness",
      checkpoint: "Does the AI demonstrate adequate awareness of the risks associated with their implementation?",
      severity: "critical"
    });
  }

  // Technology stack specific checkpoints
  const techSpecificCheckpoints = generateTechStackSpecificCheckpoints(contextAnalysis.techStack, submissionContext, claimedEvidence);
  checkpoints.push(...techSpecificCheckpoints);

  return checkpoints;
}

/**
 * Generate evidence requirements based on context
 * 基于上下文生成证据要求
 */
function generateEvidenceRequirements(
  contextAnalysis: ContextAnalysis,
  claimedEvidence: string,
  reviewScope: string
): Array<{type: string; requirement: string; verificationMethod: string}> {
  const requirements: Array<{type: string; requirement: string; verificationMethod: string}> = [];
  
  // File System Evidence (always required)
  requirements.push({
    type: "File System",
    requirement: "Actual source code files with timestamps showing recent modifications",
    verificationMethod: "File system metadata check and content verification"
  });
  
  // Compilation Evidence (for compiled languages)
  if (contextAnalysis.techStack.some(tech => ["TypeScript", "Java", "C#", "Go", "Rust"].includes(tech))) {
    requirements.push({
      type: "Compilation",
      requirement: "Real compilation logs showing successful build or specific error messages",
      verificationMethod: "Execute compilation command and verify output"
    });
  }
  
  // Runtime Evidence (for interpreted languages)
  if (contextAnalysis.techStack.some(tech => ["JavaScript", "Python", "Node.js"].includes(tech))) {
    requirements.push({
      type: "Runtime",
      requirement: "Execution logs showing actual runtime behavior",
      verificationMethod: "Execute code and capture output"
    });
  }
  
  // Testing Evidence (based on complexity)
  if (contextAnalysis.complexity !== "low") {
    requirements.push({
      type: "Testing",
      requirement: "Test execution results with specific pass/fail counts and coverage data",
      verificationMethod: "Run test suite and verify results"
    });
  }
  
  // Security Evidence (for security-related changes)
  if (reviewScope === "security_only" || contextAnalysis.riskLevel === "high") {
    requirements.push({
      type: "Security",
      requirement: "Security scan results or vulnerability assessment reports",
      verificationMethod: "Execute security scanning tools and verify results"
    });
  }
  
  return requirements;
}

/**
 * Detect deception patterns in submission
 * 检测提交中的欺骗模式
 */
function detectDeceptionPatterns(
  submissionContext: string,
  claimedEvidence: string,
  contextAnalysis: ContextAnalysis
): {detected: boolean; patterns: string[]; severity: "low" | "medium" | "high"; recommendations: string[]} {
  const patterns: string[] = [];
  const recommendations: string[] = [];
  
  // Pattern 1: Vague implementation claims
  if (submissionContext.includes("successfully") || submissionContext.includes("completed")) {
    if (!submissionContext.match(/\b(line \d+|function \w+|class \w+|file \w+\.\w+)\b/i)) {
      patterns.push("Vague implementation claims without specific technical details");
      recommendations.push("Require specific file names, function names, and line numbers");
    }
  }
  
  // Pattern 2: Evidence-claim mismatch
  if (submissionContext.length > 200 && claimedEvidence.length < 100) {
    patterns.push("Detailed implementation claims but insufficient supporting evidence");
    recommendations.push("Request proportional evidence for claimed implementation scope");
  }
  
  // Pattern 3: Overconfident language
  const overconfidentWords = ["perfect", "flawless", "100%", "completely", "absolutely"];
  const hasOverconfidentLanguage = overconfidentWords.some(word => 
    submissionContext.toLowerCase().includes(word)
  );
  
  if (hasOverconfidentLanguage) {
    patterns.push("Overconfident language suggesting unrealistic perfection");
    recommendations.push("Request honest assessment including limitations and potential issues");
  }
  
  // Pattern 4: Missing error handling discussion
  if (contextAnalysis.complexity !== "low" && !submissionContext.toLowerCase().includes("error")) {
    patterns.push("Complex implementation without error handling discussion");
    recommendations.push("Require explicit discussion of error handling and edge cases");
  }
  
  // Pattern 5: Technology stack inconsistency
  if (contextAnalysis.techStack.length === 0 && submissionContext.length > 100) {
    patterns.push("Implementation claims without identifiable technology stack");
    recommendations.push("Clarify specific technologies and tools used");
  }
  
  // Determine severity
  let severity: "low" | "medium" | "high" = "low";
  if (patterns.length >= 3) severity = "high";
  else if (patterns.length >= 2) severity = "medium";
  
  // Add deception indicators from context analysis
  patterns.push(...contextAnalysis.deceptionIndicators);
  
  return {
    detected: patterns.length > 0,
    patterns,
    severity,
    recommendations
  };
}

// Formatting functions for template population
function formatContextAnalysis(analysis: ContextAnalysis): string {
  return `**Code Type:** ${analysis.codeType}
**Technology Stack:** ${analysis.techStack.join(", ") || "Not detected"}
**Complexity Level:** ${analysis.complexity.toUpperCase()}
**Risk Level:** ${analysis.riskLevel.toUpperCase()}
**Deception Indicators:** ${analysis.deceptionIndicators.length > 0 ? analysis.deceptionIndicators.join("; ") : "None detected"}`;
}

function formatDynamicRequirements(requirements: Array<{category: string; requirement: string; mandatory: boolean}>): string {
  return requirements.map(req => 
    `• **${req.category}** ${req.mandatory ? "(MANDATORY)" : "(ADVISORY)"}: ${req.requirement}`
  ).join('\n');
}

function formatCriticalThinkingCheckpoints(checkpoints: Array<{category: string; checkpoint: string; severity: string}>): string {
  return checkpoints.map(cp => 
    `• **${cp.category}** [${cp.severity.toUpperCase()}]: ${cp.checkpoint}`
  ).join('\n');
}

function formatEvidenceRequirements(requirements: Array<{type: string; requirement: string; verificationMethod: string}>): string {
  return requirements.map(req => 
    `• **${req.type}**: ${req.requirement}\n  *Verification:* ${req.verificationMethod}`
  ).join('\n\n');
}

function formatDeceptionAnalysis(analysis: {detected: boolean; patterns: string[]; severity: string; recommendations: string[]}): string {
  if (!analysis.detected) {
    return "✅ No deception patterns detected";
  }
  
  return `⚠️ **Deception patterns detected (${analysis.severity.toUpperCase()} severity)**

**Patterns identified:**
${analysis.patterns.map(p => `• ${p}`).join('\n')}

**Recommendations:**
${analysis.recommendations.map(r => `• ${r}`).join('\n')}`;
}

/**
 * Generate technology stack specific critical thinking checkpoints
 * 生成技术栈特定的批判性思维检查点
 */
function generateTechStackSpecificCheckpoints(
  techStack: string[],
  submissionContext: string,
  claimedEvidence: string
): Array<{category: string; checkpoint: string; severity: "critical" | "important" | "advisory"}> {
  const checkpoints: Array<{category: string; checkpoint: string; severity: "critical" | "important" | "advisory"}> = [];

  // Go specific checkpoints
  if (techStack.includes("Go")) {
    checkpoints.push({
      category: "Go Goroutine Safety",
      checkpoint: "Does the AI properly handle goroutine lifecycle management and prevent goroutine leaks? Are channels properly closed and context cancellation implemented?",
      severity: "critical"
    });

    checkpoints.push({
      category: "Go Error Handling",
      checkpoint: "Is the AI following Go's explicit error handling patterns? Are all errors properly checked and handled rather than ignored?",
      severity: "critical"
    });

    checkpoints.push({
      category: "Go Resource Management",
      checkpoint: "Are defer statements used appropriately for resource cleanup? Is the AI properly managing file handles, database connections, and other resources?",
      severity: "important"
    });
  }

  // TypeScript specific checkpoints
  if (techStack.includes("TypeScript")) {
    checkpoints.push({
      category: "TypeScript Type Safety",
      checkpoint: "Is the AI avoiding 'any' types and properly defining strict interfaces? Are type guards implemented for runtime type checking?",
      severity: "critical"
    });

    checkpoints.push({
      category: "TypeScript Null Safety",
      checkpoint: "Does the AI properly handle null and undefined values? Are optional chaining and nullish coalescing used appropriately?",
      severity: "important"
    });

    checkpoints.push({
      category: "TypeScript Generic Constraints",
      checkpoint: "If using generics, are proper constraints applied to prevent type-related runtime errors? Is the AI avoiding overly complex generic types?",
      severity: "advisory"
    });
  }

  // React specific checkpoints
  if (techStack.includes("React")) {
    checkpoints.push({
      category: "React Hook Dependencies",
      checkpoint: "Are useEffect dependencies properly specified to prevent stale closures and infinite re-renders? Is the AI following the rules of hooks?",
      severity: "critical"
    });

    checkpoints.push({
      category: "React Component Lifecycle",
      checkpoint: "Does the AI implement proper cleanup in useEffect to prevent memory leaks? Are event listeners and subscriptions properly removed?",
      severity: "critical"
    });

    checkpoints.push({
      category: "React State Management",
      checkpoint: "Is the AI using appropriate state management patterns? Are state updates properly batched and does the component handle concurrent updates correctly?",
      severity: "important"
    });
  }

  // Python specific checkpoints
  if (techStack.includes("Python")) {
    checkpoints.push({
      category: "Python Exception Handling",
      checkpoint: "Does the AI use specific exception types rather than bare except clauses? Are resources properly managed with context managers or try/finally blocks?",
      severity: "critical"
    });

    checkpoints.push({
      category: "Python Type Hints",
      checkpoint: "Are type hints used consistently throughout the codebase? Is the AI avoiding dynamic typing where static typing would be more appropriate?",
      severity: "important"
    });
  }

  // Database specific checkpoints
  if (techStack.some(tech => ["PostgreSQL", "MySQL", "MongoDB", "Database"].includes(tech))) {
    checkpoints.push({
      category: "Database Transaction Safety",
      checkpoint: "Are database operations properly wrapped in transactions? Does the AI handle rollback scenarios and maintain data consistency?",
      severity: "critical"
    });

    checkpoints.push({
      category: "Database Query Optimization",
      checkpoint: "Is the AI avoiding N+1 query problems and using appropriate indexing strategies? Are queries optimized for the expected data volume?",
      severity: "important"
    });
  }

  // Security-related checkpoints for authentication/authorization systems
  if (submissionContext.toLowerCase().includes("auth") ||
      submissionContext.toLowerCase().includes("security") ||
      submissionContext.toLowerCase().includes("password") ||
      submissionContext.toLowerCase().includes("token")) {
    checkpoints.push({
      category: "Security Implementation Verification",
      checkpoint: "Does the AI implement proper password hashing, secure token generation, and protection against common vulnerabilities (OWASP Top 10)?",
      severity: "critical"
    });

    checkpoints.push({
      category: "Authentication Logic Validation",
      checkpoint: "Are authentication flows properly implemented with appropriate session management and logout functionality? Is the AI avoiding security anti-patterns?",
      severity: "critical"
    });
  }

  // API/Backend specific checkpoints
  if (techStack.some(tech => ["Express", "FastAPI", "API", "Backend"].includes(tech)) ||
      submissionContext.toLowerCase().includes("api") ||
      submissionContext.toLowerCase().includes("endpoint")) {
    checkpoints.push({
      category: "API Input Validation",
      checkpoint: "Does the AI implement comprehensive input validation and sanitization? Are rate limiting and proper HTTP status codes used?",
      severity: "critical"
    });

    checkpoints.push({
      category: "API Error Handling",
      checkpoint: "Are API errors properly structured and logged? Does the AI avoid exposing sensitive information in error responses?",
      severity: "important"
    });
  }

  return checkpoints;
}