List tasks of a project with optional status filtering. Returns structured information and appends project metadata.

- Action-oriented: List tasks of a project
- Description: Read and output task list with `status` filter; when `project` is provided, read tasks from that project, otherwise use current session project.
- Parameters:
  - status: "all" | "pending" | "in_progress" | "completed"
  - project?: string target project (optional)
- Constraints: Read-only; if project/path invalid, return standard error
- Output: Structured text with `<!-- Project: name -->` metadata, enabling AI to keep correct context
- Errors: JSON-RPC standard errors
