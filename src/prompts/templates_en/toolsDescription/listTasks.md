List and filter project tasks with structured information display. Provides task overview and project context for decision-making.

## When to Use
- Need task overview before starting work
- Check project status and progress
- Find specific tasks by status filter

## Parameters
- `status` (required): Task status filter (all/pending/in_progress/completed)
- `project` (optional): Target project name (defaults to current session project)

## Expected Output
Structured task information with status indicators, project metadata, and dependency relationships.

## Error Handling
- Invalid project: Lists available projects
- Invalid status: Shows valid options
- Empty results: Suggests alternative filters