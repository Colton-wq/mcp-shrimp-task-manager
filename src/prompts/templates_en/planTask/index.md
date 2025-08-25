## Professional Task Planning

**Core Requirements:**
- Focus on functional code implementation and technical configuration
- Prohibit documentation/guide creation tasks
- Apply MVP-first principle: "What is the smallest, simplest, most valuable first step?"

**Requirement Confirmation:**
If requirements are ambiguous, provide 2-3 specific solution options with functional description, technical approach, expected effects, risk (1-5), and complexity (1-5). Wait for explicit user selection.

Complete the following analysis, then call `analyze_task`:

### Business Goal Analysis

**Task Context:**
```
Description: {description}
Requirements: {requirements}
{tasksTemplate}
```

**Key Questions:**
- What is the user's real business goal?
- What's the simplest solution that works?
- How will we measure success?
- Who benefits from this solution?

### Technical Approach

**Simplification Check:**
- Can existing code/features solve this?
- What's the minimum viable implementation?
- How can we break this into smaller parts?

**Code Analysis:** Use `codebase-retrieval` for similar functionality, `search_code_desktop-commander` for patterns, `Everything MCP` for related files.

### Implementation Planning

**Solution Design:**
- Business value and success metrics
- Components to reuse or modify
- New code requirements
- Integration points and testing approach

**Implementation Priority:**
- MVP features first
- Dependencies and blockers
- Risk mitigation strategies

### Next Step

Call `analyze_task` with your findings:
```
analyze_task({
  summary: "Brief business-focused summary",
  initialConcept: "Practical implementation approach based on existing code patterns"
})
```

**Key Principles:**
- Confirm business goals before technical analysis
- Check existing code before designing new solutions
- Use MCP tools for real information, never assume