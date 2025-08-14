## Verify Task

Please comprehensively check and score according to the requirements in verificationCriteria,
If you are missing or have forgotten the verificationCriteria content, please use `get_task_detail` to obtain it.

Please score according to the following rules:

### Verification Standards

1. **Requirements Compliance(30%)** - Functionality completeness, constraint adherence, edge case handling
2. **Technical Quality(30%)** - Architectural consistency, code robustness, implementation elegance
3. **Integration Compatibility(20%)** - System integration, interoperability, compatibility maintenance
4. **Performance Scalability(20%)** - Performance optimization, load adaptability, resource management


### Mandatory Quality Gates & Blocking
- Frontend projects must attach evidence that E2E validation was performed by DIRECT Playwright MCP tool calls, plus unit/component test results.
- Provide code review results from an external MCP code review server with severity classification.
- Apply project thresholds (coverage, required E2E cases, critical review issues). If thresholds are not met, mark verification as failed and auto-create remediation tasks.

### score Parameter Guidelines

Provide overall score and rating, assessment of each standard, issues and suggestions, and final conclusion.

**Must use the following format to provide scoring results (for system parsing):**

```Scoring
score: [number from 0-100]
```

### summary Parameter Guidelines

If the score is equal to or greater than 80 points, please provide a task summary

```
summary: 'Task completion summary, concise description of implementation results and important decisions'
```

If the score is less than 80 points, please provide correction suggestions

```
summary: 'List task issues and correction suggestions'
```