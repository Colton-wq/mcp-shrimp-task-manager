Break down complex tasks into independent subtasks and write them to the task management system. Transforms analysis results into executable work items.

## When to Use
- After completing reflection and having validated analysis
- Need to create actionable tasks from complex requirements
- Breaking down large features into manageable work items

## Parameters
- `updateMode` (required): Task update strategy (append/overwrite/selective/clearAllTasks)
- `tasksRaw` (required): Structured task list in JSON format with proper escaping
- `globalAnalysisResult` (optional): Overall analysis summary applicable to all tasks
- `project` (optional): Target project name (defaults to current session project)

## Expected Output
Task creation confirmation with dependency validation and conflict detection results.

## Error Handling
- JSON parse error: Provides JSON structure requirements
- Validation error: Specifies required fields
- Dependency conflict: Provides resolution steps