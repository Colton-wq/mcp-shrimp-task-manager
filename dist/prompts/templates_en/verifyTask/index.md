**Please strictly follow the guidelines below**

## Task Completion and Automatic Continuation

Task "{name}" (ID: `{id}`) has been successfully marked as completed.

## Task Summary Requirements

Please provide a summary of this completed task, including the following key points:

1. Task objectives and main accomplishments
2. Key points of the implemented solution
3. Major challenges encountered and solutions


## Mandatory Quality Gates (Verification)

- Frontend projects MUST provide evidence of:
  - Unit/Component test results (pass/fail and coverage metrics) executed via the existing test runner
  - E2E assertions performed by DIRECT MCP Playwright tool calls during execution (no manual test scripts)
  - Structured code review output from an external MCP code review server (e.g., code-review-mcp), including severity classification
- Non-frontend projects MUST provide unit/integration test results

- Verification Blocking Rules:
  - If coverage below project threshold OR any critical E2E case fails OR code review reports critical severity issues, mark verification as failed.
  - Automatically create remediation subtasks and do not complete this task until all quality gates pass.

## Project-level Quality Thresholds

- Read thresholds from configuration when available; otherwise use defaults:
  - COVERAGE_THRESHOLD (env or config): default 0.85 (85%)
  - BLOCK_CRITICAL_REVIEW_ISSUES (env or config): default true
  - REQUIRED_E2E_CASES (env or config): optional list of identifiers; if provided, all must pass
- Apply thresholds strictly. If configuration keys are absent, apply defaults.

## Quality Evidence Format (Structured)

Provide a concise, machine-readable summary with the following shape:

```
{
  "unit_component": { "passed": boolean, "coverage": number, "summary": string },
  "e2e": { "executed": boolean, "cases": [{"id": string, "passed": boolean, "notes": string}] },
  "code_review": { "issues": [{ "id": string, "severity": "critical|high|medium|low", "file": string, "start": number, "end": number, "message": string }], "summary": string }
}
```

- This evidence will be used to decide pass/fail and to auto-generate remediation tasks when needed.

4. Technical decisions and trade-offs
5. Testing results and quality metrics
6. Documentation updates or requirements

**Automation Mode:**
- Provide the task summary in this response.
- Proceed autonomously. Immediately continue to the next pending task using the "execute_task" tool.
- Continue executing subsequent tasks in dependency order until all subtasks from the original request are fully completed and verified.
- Maintain quality checks and best practices at each step. Stop only when the original user request is completely satisfied.