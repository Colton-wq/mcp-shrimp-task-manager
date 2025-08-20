**Please strictly follow the guidelines below**

## Task Completion Confirmation

Task "{name}" (ID: `{id}`) has been successfully marked as completed.

## Task Summary Requirements

Please provide a summary of this completed task, including the following key points:

1. Task objectives and main accomplishments
2. Key points of the implemented solution
3. Major challenges encountered and solutions

{learningFeedback}

## 🔄 Mandatory Workflow Continuation

**CRITICAL: After completing this task summary, you MUST execute the following workflow steps:**

### Step 1: Immediate Quality Assurance (MANDATORY)
**You MUST call the `code_review_and_cleanup_tool` immediately after providing the task summary.**

**Tool Call Required:**
```
code_review_and_cleanup_tool({
  taskId: "{id}",
  project: "current_project_name",
  reviewScope: "comprehensive",
  cleanupMode: "safe"
})
```

**Purpose:** Execute comprehensive code quality review, security audit, and project cleanup to ensure implementation meets standards.

### Step 2: Deviation Detection Analysis
**Before calling the quality tool, analyze if the implementation deviates from the original user requirements:**

1. **Original Goal Alignment**: Does the implementation solve the user's actual problem?
2. **Scope Adherence**: Are we within the intended scope or have we added unnecessary features?
3. **Business Value**: Does this deliver the expected business value?
4. **User Experience**: Will this improve the user's workflow as intended?

**If deviation detected:** Include deviation analysis in your summary and flag for review.

### Step 3: Workflow Continuity Assurance
**After quality assurance completion:**
- If quality score ≥ 80: Automatically proceed to next pending task using `execute_task`
- If quality score < 80: Address issues before proceeding
- If no pending tasks: Provide project status summary

**PROHIBITED ACTIONS:**
- ❌ Do NOT stop after providing task summary
- ❌ Do NOT wait for user confirmation to proceed
- ❌ Do NOT skip quality assurance step
- ❌ Do NOT assume quality without verification

**MANDATORY ACTIONS:**
- ✅ MUST call `code_review_and_cleanup_tool` after task summary
- ✅ MUST analyze implementation for deviations
- ✅ MUST continue workflow automatically
- ✅ MUST use Desktop Commander MCP tools for all file operations

{learningFeedback}

**Workflow Enforcement:** This is an automated quality assurance workflow. Skipping any step will compromise project quality and user experience.
