Verify and score task completion according to verification criteria. Provides quality assurance and automatically completes tasks that meet standards.

## When to Use
- Task implementation completed and ready for verification
- Need quality assessment against verification criteria
- Want to complete task with proper validation

## Parameters
- `taskId` (required): Unique identifier of task to verify (UUID format)
- `summary` (required): Task completion summary or issue description
- `score` (required): Overall quality score from 0-100
- `project` (optional): Target project context (defaults to current session project)

## Expected Output
Verification results with quality assessment, score breakdown, and task completion status update.

## Error Handling
- Invalid task ID: Provides UUID format requirements
- Task not found: Suggests using query_task to find correct ID
- Score format error: Provides valid range (0-100)

