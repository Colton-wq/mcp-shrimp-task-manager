# AI Calling Best Practices Guide

## Overview

This guide provides comprehensive best practices for AI agents using MCP Shrimp Task Manager tools. Following these guidelines will significantly improve calling accuracy, efficiency, and error recovery.

## Quick Start

### 1. Enable Smart Features
```bash
# Set environment variables for optimal AI experience
MCP_ENABLE_SMART_ROUTING=true
MCP_AI_FRIENDLY_ERRORS=true
MCP_ENABLE_STATUS_TRACKING=true
```

### 2. Choose the Right Path
- **🚀 Fast Path**: Simple, well-defined tasks → Direct `execute_task`
- **📋 Standard Path**: Medium complexity → `plan_task` → `execute_task`  
- **🔬 Deep Path**: Complex tasks → Full analysis cycle

## Tool-Specific Guidelines

### planTask
**Purpose**: Initial planning and scope definition for complex projects

**When to Call**:
✅ Starting new complex projects
✅ Breaking down large features
✅ Need structured approach
✅ Multiple technical challenges

**When NOT to Call**:
❌ Simple single-step tasks
❌ Already have detailed plan
❌ Just need execution guidance

**Best Practices**:
- Provide detailed description (>50 characters)
- Include technical requirements and constraints
- Set `existingTasksReference=true` for related work

### analyzeTask
**Purpose**: Deep technical analysis and feasibility assessment

**When to Call**:
✅ After initial planning
✅ Need technical validation
✅ Complex architectural decisions
✅ Risk assessment required

**Parameter Tips**:
- `summary`: Keep consistent with planning phase
- `initialConcept`: Minimum 50 characters with technical details
- `previousAnalysis`: Only for iterative improvements

### executeTask
**Purpose**: Get detailed implementation guidance

**When to Call**:
✅ Have specific task ID
✅ Ready for implementation
✅ Need step-by-step guidance

**Critical Requirements**:
- `taskId`: Must be valid UUID v4 format
- Use `list_tasks` or `query_task` to find valid IDs
- Format: `a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789`

### verifyTask
**Purpose**: Quality assessment and task completion

**Scoring Guidelines**:
- **80-100**: Task complete, provide implementation summary
- **60-79**: Good progress, minor issues to address
- **40-59**: Significant issues, major corrections needed
- **0-39**: Incomplete, requires substantial rework

## Error Handling Best Practices

### Common Error Types and Solutions

#### VALIDATION_ERROR
**Cause**: Invalid parameter format or value
**Solution**: Check parameter requirements and examples
**Example**: Invalid UUID format → Use correct 8-4-4-4-12 pattern

#### NOT_FOUND
**Cause**: Resource doesn't exist
**Solution**: Verify identifiers using list/query tools
**Example**: Task not found → Use `list_tasks` to see available tasks

#### DEPENDENCY_ERROR
**Cause**: Unmet task dependencies
**Solution**: Complete prerequisite tasks first
**Example**: Task blocked → Complete dependencies listed in error

#### INTERNAL_ERROR
**Cause**: System or processing error
**Solution**: Retry operation, check system status
**Example**: Database timeout → Wait and retry

### Error Recovery Strategies

1. **Read Error Messages Carefully**
   - Look for specific recovery actions
   - Check provided examples
   - Note if operation is retryable

2. **Use Suggested Tools**
   - `list_tasks` for task discovery
   - `query_task` for searching
   - `get_task_detail` for verification criteria

3. **Validate Parameters**
   - Check format requirements
   - Ensure required fields are provided
   - Use examples as templates

## Performance Optimization

### Path Selection Optimization

#### Simple Tasks (< 500 chars, 0-1 dependencies)
```
Direct: execute_task
Time Saved: ~60%
Use Cases: Bug fixes, documentation, simple configs
```

#### Medium Tasks (500-1000 chars, 2-4 dependencies)
```
Optimal: plan_task → execute_task
Time Saved: ~30%
Use Cases: New features, refactoring, API endpoints
```

#### Complex Tasks (> 1000 chars, 5+ dependencies)
```
Recommended: plan_task → analyze_task → reflect_task → split_tasks → execute_task
Quality Gain: +40%
Use Cases: Architecture changes, integrations, optimizations
```

### Efficiency Tips

1. **Batch Related Operations**
   - Plan multiple related tasks together
   - Use `split_tasks` for comprehensive breakdown

2. **Leverage Smart Routing**
   - Enable `MCP_ENABLE_SMART_ROUTING`
   - Follow path recommendations

3. **Optimize Parameter Usage**
   - Provide detailed descriptions
   - Include all relevant context
   - Use examples as guides

## Quality Assurance

### Pre-Call Checklist

- [ ] Tool purpose matches your need
- [ ] All required parameters provided
- [ ] Parameter formats validated
- [ ] Dependencies checked
- [ ] Path selection appropriate

### Post-Call Validation

- [ ] Response format is valid
- [ ] Error messages are actionable
- [ ] Next steps are clear
- [ ] Quality meets requirements

## Advanced Features

### Smart Routing
When enabled, tools provide intelligent path recommendations based on complexity analysis.

### Status Tracking
Real-time progress indicators for long-running operations.

### AI-Friendly Errors
Structured error messages with specific recovery guidance.

## Troubleshooting

### Common Issues

**Issue**: "Invalid task ID format"
**Solution**: Use UUID v4 format (8-4-4-4-12 hexadecimal)
**Tool**: `list_tasks` to find valid IDs

**Issue**: "Task has unmet dependencies"
**Solution**: Complete prerequisite tasks first
**Tool**: Check dependencies in task details

**Issue**: "Task not found"
**Solution**: Verify task exists and ID is correct
**Tool**: `query_task` to search by name

### Debug Mode
Set `DEBUG=true` for detailed operation logs and enhanced error information.

## Metrics and Monitoring

### Success Metrics
- Parameter accuracy: Target 90%+
- Error recovery rate: Target 70%+
- Path efficiency: Target 85%+

### Performance Tracking
- Simple task time: Target <1000ms
- Medium task time: Target <3000ms
- Complex task time: Target <6000ms

## Support and Resources

### Documentation
- Tool descriptions: Built-in help in each tool
- Schema validation: Automatic parameter checking
- Error guidance: Contextual recovery suggestions

### Environment Variables
```bash
# Core features
MCP_ENABLE_SMART_ROUTING=true
MCP_AI_FRIENDLY_ERRORS=true
MCP_ENABLE_STATUS_TRACKING=true

# Debug and development
DEBUG=true
TEMPLATES_USE=en
```

### Best Practice Summary

1. **Choose the right path** based on complexity
2. **Read tool descriptions** carefully before calling
3. **Validate parameters** using provided examples
4. **Handle errors** using recovery guidance
5. **Monitor performance** and adjust approach
6. **Enable smart features** for optimal experience

---

*This guide is continuously updated based on AI calling patterns and feedback. For the latest version, check the project documentation.*