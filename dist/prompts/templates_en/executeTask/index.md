**Please strictly follow the guidelines below**

## Task Execution

**Name:** {name}

**ID:** `{id}`

**Description:** {description}

{notesTemplate}

{implementationGuideTemplate}

{verificationCriteriaTemplate}

{analysisResultTemplate}

{dependencyTasksTemplate}

{relatedFilesSummaryTemplate}

{complexityTemplate}

## Execution Steps

1. **Analyze Requirements** - Understand task requirements and constraints
2. **Design Solution** - Develop implementation plan and testing strategy
3. **Implement Solution** - Execute according to plan, handle edge cases
4. **Test and Verify** - Ensure functionality correctness and robustness

## Quality Requirements

- **Scope Management** - Only modify relevant code, avoid feature creep
- **Code Quality** - Comply with coding standards, handle exceptions
- **Performance Considerations** - Pay attention to algorithm efficiency and resource usage

## Mandatory Quality Gates (Execution)

- For frontend projects (detected via package.json with frontend deps, React/Vue/Svelte components, or Playwright config):
  - Unit/Component Tests: Execute local tests using the existing project test runner (e.g., Vitest/Jest) via Desktop Commander. Parse pass/fail and coverage. Do not create new scripts.
  - E2E Tests: Directly call the existing Playwright MCP tools during this execution step; do not generate test scripts for the user. Use MCP browser tools programmatically, e.g.:
    - browser_navigate_playwright-enhanced, browser_wait_for_playwright-enhanced, browser_click_playwright-enhanced, browser_type_playwright-enhanced, browser_snapshot_playwright-enhanced, browser_take_screenshot_playwright-enhanced
    - Validate key user flows and assert visible text or states using wait_for conditions.
  - Code Review: Invoke an external code review MCP server (e.g., code-review-mcp) to analyze diffs or changed files and return structured issues.
- For non-frontend projects: run conventional unit/integration tests via the existing runner; skip Playwright.

- Collect artifacts: structured test results (pass/fail, coverage), E2E assertions log, and code review issues.
- If any critical failures occur, split remediation subtasks immediately and do not proceed to verification until fixed.
- Code Review Invocation Details:
  - Use external MCP server tools (e.g., perform_code_review) with inputs: changed files list or git diff, language hints, and context windows.
  - Expect structured output with fields such as: issue_id, severity (critical/high/medium/low), file, start_line, end_line, message, recommendation.
  - Immediately convert critical/high issues into remediation subtasks via split_tasks or create_or_update_tasks with relatedFiles metadata.

- Unit/Component Runner Details:
  - Run the existing test runner via Desktop Commander (e.g., npm test / vitest) and parse standard output for pass/fail and coverage. Do not install new deps or create scripts.



Begin executing the task according to the instructions. After completing the task, call the verify_task tool to perform verification.
**Severe Warning**: Do not assume completion or call verify_task prematurely. Use allowed tools only: file operations via Desktop Commander / EverythingSearch; web research via tavily-remote / GitHub MCP / Context7; batch edits via str-replace-editor. Built-in terminal and built-in file I/O are forbidden. For searches, always use MCP search tools with two-keyword queries, expanding iteratively rather than over-describing initially.