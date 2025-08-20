Execute comprehensive code quality review and project cleanup operations. Integrates code analysis, security audit, and file management in a single automated workflow.

## When to Use
- After task implementation completion for quality assurance
- When comprehensive code review and cleanup is required
- For automated quality gates in development workflow
- To ensure code standards and project hygiene

## Parameters
- `taskId` (required): Unique identifier of task to review (UUID format)
- `project` (required): Target project context for multi-agent safety
- `reviewScope` (optional): Scope of review - comprehensive, diagnostic, security_only, quality_only (default: comprehensive)
- `cleanupMode` (optional): File cleanup mode - safe, aggressive, analysis_only (default: safe)
- `targetFiles` (optional): Array of specific files to review (default: all task-related files)

## Expected Output
Structured quality assessment with code review results, cleanup summary, audit checkpoints, and automated workflow continuation guidance.

## Error Handling
Standard JSON-RPC error format with specific guidance for resolution and retry procedures.

## Quality Gates
- Code standards compliance verification
- Security vulnerability assessment
- Test coverage analysis
- Performance issue detection
- File cleanup and project organization

## Workflow Integration
Automatically determines next workflow steps based on quality score and provides mandatory tool call guidance for seamless automation.