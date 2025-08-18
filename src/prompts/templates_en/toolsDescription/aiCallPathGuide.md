# AI Calling Path Guide

## Overview
Choose the optimal tool calling sequence based on task complexity and requirements. This guide helps AI agents select the most efficient path for different scenarios.

## Path Selection Criteria

### 🚀 Fast Path (Simple Tasks)
**When to Use:**
- Single, well-defined tasks
- Clear requirements with no ambiguity
- No complex dependencies
- Implementation is straightforward

**Recommended Sequence:**
1. `execute_task` → Complete the task directly

**Examples:**
- Fix a specific bug with known solution
- Update documentation
- Simple configuration changes
- Add basic validation

### 📋 Standard Path (Medium Tasks)
**When to Use:**
- Multi-step tasks requiring planning
- Some technical complexity
- Moderate dependencies
- Need structured approach

**Recommended Sequence:**
1. `plan_task` → Establish clear plan
2. `execute_task` → Implement the solution

**Examples:**
- Implement new feature with multiple components
- Refactor existing code
- Add new API endpoints
- Database schema changes

### 🔬 Deep Path (Complex Tasks)
**When to Use:**
- High complexity or uncertainty
- Multiple technical challenges
- Significant architectural impact
- Need thorough analysis

**Recommended Sequence:**
1. `plan_task` → Initial planning and scope definition
2. `analyze_task` → Deep technical analysis
3. `reflect_task` → Quality review and optimization
4. `split_tasks` → Break into manageable subtasks
5. `execute_task` → Implement individual tasks

**Examples:**
- Major architectural changes
- New system integrations
- Performance optimization projects
- Security implementations

## Complexity Indicators

### Low Complexity Signals
- Description < 500 characters
- 0-1 dependencies
- Single file modifications
- Well-known patterns

### Medium Complexity Signals
- Description 500-1000 characters
- 2-4 dependencies
- Multiple file modifications
- Some research required

### High Complexity Signals
- Description > 1000 characters
- 5+ dependencies
- Cross-system changes
- Significant research needed

## Environment Variable Control
Set `MCP_ENABLE_SMART_ROUTING=true` to enable intelligent path suggestions in tool responses.

## Best Practices
1. **Start Simple**: When in doubt, try the fast path first
2. **Escalate Gradually**: Move to more complex paths if needed
3. **Consider Context**: Factor in project complexity and team experience
4. **Monitor Results**: Track success rates for different paths