Analyze complex programming tasks and generate structured implementation plans. Creates task breakdown with technical requirements analysis and planning guidance.

## When to Use
- Complex multi-step programming projects requiring structured approach
- Feature development spanning multiple components
- Breaking down large requirements into manageable phases

## Parameters
- `description` (required): Complete task description including objectives and expected outcomes
- `requirements` (optional): Technical requirements or quality standards
- `existingTasksReference` (optional): Reference existing tasks for continuity planning (default: false)

## Expected Output
Structured analysis with complexity assessment, technical approach recommendations, and implementation guidance.

## Error Handling
- Invalid description: Provides minimum length requirements
- Missing context: Suggests adding specific requirements
- Scope issues: Recommends breaking into smaller components



## Smart Calling Path Recommendations
🚀 **Fast Path**: Skip this tool for simple, well-defined tasks → Go directly to `execute_task`
📋 **Standard Path**: Use this tool for medium complexity → `plan_task` → `execute_task`
🔬 **Deep Path**: Use for complex tasks → `plan_task` → `analyze_task` → `reflect_task` → `split_tasks` → `execute_task`

**Complexity Indicators:**
- **Simple**: < 500 chars description, 0-1 dependencies, single file changes
- **Medium**: 500-1000 chars, 2-4 dependencies, multiple files
- **Complex**: > 1000 chars, 5+ dependencies, cross-system changes

**Critical Warning**: All forms of `assumptions`, `guesses`, and `imagination` are strictly prohibited. You must use every `available tool` at your disposal to `gather real information`.