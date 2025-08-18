Clear all incomplete tasks for a project. Completed tasks are backed up to the project's memory directory before clearing.

- Action-oriented: Clear all tasks for a project
- Description: Dangerous operation; clears the task list in the specified or current project and backs up completed tasks to `memory/`.
- Parameters:
  - confirm: true required to execute
  - project?: string target project (optional)
- Constraints: Irreversible; use `list_tasks` to confirm before running
- Output: Operation result and backup filename
- Errors: JSON-RPC standard errors; lock timeout and path permission errors
