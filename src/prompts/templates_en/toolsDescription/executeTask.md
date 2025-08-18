Retrieve instructional guidance for specific task execution. Provides step-by-step guidance to complete programming tasks properly.

## When to Use
- Ready to execute a specific task from the task list
- Need detailed guidance for task implementation
- Have identified the task to work on next

## Parameters
- `taskId` (required): Unique identifier of the task to execute (UUID v4 format)
- `project` (optional): Target project context (defaults to current session project)

## Expected Output
Detailed execution guidance with step-by-step implementation instructions, code examples, and validation requirements.

## Error Handling
- Invalid task ID: Provides UUID format requirements
- Task not found: Suggests using query_task to find correct ID
- Execution blocked: Lists required prerequisites

