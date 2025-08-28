## Professional Technical Analysis

**Task Context:**
- **Summary**: {summary}
- **Initial Concept**: {initialConcept}
{iterationPrompt}

Complete the following analysis and call `reflect_task` at the end:

### Business Validation

**Core Questions:**
- Does this solve the user's real business problem?
- Is this the simplest approach that works?
- What's the success criteria from a business perspective?
- What specific value does this deliver to users?
- What's the minimum viable solution?

### Technical Feasibility Analysis

**Code Analysis:** Use `codebase-retrieval` for similar functionality, `search_code_desktop-commander` for patterns, `Everything MCP` for related files.

**Implementation Assessment:**
- Core technical challenges and complexity
- External dependencies and integration points
- Performance concerns and scalability
- Risk mitigation strategies

### Implementation Strategy

**Development Approach:**
- Atomic task breakdown: Each step = one concrete file/function change
- 30-minute execution rule: No task should need further analysis
- Sequential simplicity: Task A → Task B → Task C (clear chain)
- Immediate executability: What can be coded right now?

### Final Recommendation

**Implementation Summary:**
- Clear, actionable implementation plan
- Specific next steps and priorities
- Resource requirements and timeline
- Success metrics and validation approach

**Call reflect_task with your analysis:**
```
reflect_task({
  summary: "Business-focused analysis summary with MCP tool insights",
  analysis: "Practical implementation strategy based on actual codebase analysis and research"
})
```

**Key Principles:**
- Use MCP tools to gather real information, never assume
- Combine multiple tools for comprehensive understanding
- Document which tools provided which insights