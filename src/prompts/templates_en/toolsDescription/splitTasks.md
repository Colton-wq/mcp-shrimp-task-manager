Break down complex tasks into independent subtasks and write them to the specified or current project.

- Action-oriented: Split tasks into structured subtasks
- Description: Parse `tasksRaw` and write tasks according to `updateMode` into the specified or current project; supports agent matching and dependency resolution.
- Parameters:
  - updateMode: 'append' | 'overwrite' | 'selective' | 'clearAllTasks'
  - tasksRaw: string JSON
  - globalAnalysisResult?: string
  - project?: string target project (optional)
- Constraints: Writes are file-locked; large payloads should be split; duplicate names trigger selective update behavior
- Output: Structured result and optional conflict detection suggestions
- Errors: JSON-RPC standard errors; JSON parse errors; validation errors; lock timeouts

## 1. Granularity Control (Required Reading)
- Minimum unit: 1–2 days/task; Max 10 items/batch; Depth ≤3
- Length: ≤ 5,000 chars per call; split otherwise

## 2. Dependencies & Priority
- Use `dependencies` to build the graph and compute the critical path

## 3. Strict JSON Rules
- No comments; proper escaping required
