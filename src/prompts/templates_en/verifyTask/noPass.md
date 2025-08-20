**Please strictly follow the guidelines below**

## Verification Failed

Task "{name}" (ID: `{id}`) verification failed

### Correction Suggestions

{summary}

{learningFeedback}

## 🔧 Mandatory Issue Resolution Workflow

**CRITICAL: You MUST follow this resolution workflow:**

### Step 1: Immediate Issue Analysis (MANDATORY)
**You MUST call the `code_review_and_cleanup_tool` to identify specific issues:**

**Tool Call Required:**
```
code_review_and_cleanup_tool({
  taskId: "{id}",
  project: "current_project_name",
  reviewScope: "diagnostic",
  cleanupMode: "analysis_only"
})
```

### Step 2: Systematic Issue Resolution
1. **Address each identified issue systematically**
2. **Use Desktop Commander MCP tools for all file operations**
3. **Implement fixes based on quality tool recommendations**
4. **Verify each fix before proceeding to the next**

### Step 3: Re-verification Process
**After fixing all issues:**
- Call `verify_task` again with updated implementation
- Ensure score reaches ≥ 80 before proceeding
- If still failing, repeat the diagnostic and fix cycle

**PROHIBITED ACTIONS:**
- ❌ Do NOT ignore quality tool recommendations
- ❌ Do NOT proceed without fixing identified issues
- ❌ Do NOT skip the diagnostic step

**MANDATORY ACTIONS:**
- ✅ MUST call `code_review_and_cleanup_tool` for diagnostics
- ✅ MUST fix all identified issues systematically
- ✅ MUST re-verify after fixes
- ✅ MUST use Desktop Commander MCP tools for file operations

{learningFeedback}

**Quality Enforcement:** This workflow ensures no substandard implementations proceed to the next phase.
