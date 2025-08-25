Break down complex tasks into independent subtasks and write them to the task management system. **Built-in Intelligent Document Management**: Automatically checks file existence and prioritizes updating existing documents over creating duplicates.

## When to Use
- After completing reflection and having validated analysis
- Need to create actionable tasks from complex requirements
- Breaking down large features into manageable work items
- **Smart Document Management**: Automatically prevents duplicate file creation

## Parameters
- `updateMode` (required): Task update strategy (append/overwrite/selective/clearAllTasks)
- `tasksRaw` (required): Structured task list in JSON format with proper escaping
- `globalAnalysisResult` (optional): Overall analysis summary applicable to all tasks
- `project` (optional): Target project name (defaults to current session project)

## Expected Output
Task creation confirmation with dependency validation and conflict detection results. **Smart Conversion Logs**: Shows automatic file type conversion records.

## 🎯 Intelligent Document Management Features
- **Automatic Existence Check**: Batch checks if files in relatedFiles already exist
- **Smart Type Conversion**: Existing files automatically convert from CREATE to TO_MODIFY
- **Prevent Duplicate Creation**: Ensures "one function, one file" principle
- **Transparent Operations**: Clear logging of conversion processes

## Error Handling
- JSON parse error: Provides JSON structure requirements
- Validation error: Specifies required fields
- Dependency conflict: Provides resolution steps