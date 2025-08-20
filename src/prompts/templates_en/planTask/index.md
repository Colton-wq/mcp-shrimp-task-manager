## Business-Focused Task Planning

You must complete the following 3 core checks in sequence, then call `analyze_task` to proceed.

### 🎯 **Step 1: Business Goal Confirmation** (MANDATORY)

**User Request:**
```
Task Description: {description}
Requirements: {requirements}
{tasksTemplate}
```

**Critical Business Questions** (Answer ALL before proceeding):
- What is the user's REAL business goal? (Not just what they asked for)
- What problem does this solve for the end user?
- What's the simplest solution that achieves this goal?
- How will we know this is successful?

**Business Impact Assessment:**
- Who benefits from this solution?
- What happens if we don't implement this?
- Is this the highest priority right now?

### 🔍 **Step 2: Simplest Solution First** (MANDATORY)

**Simplification Check:**
- Can we solve this with existing features/code?
- Is there a simpler alternative approach?
- Can we break this into smaller, independent parts?
- What's the minimum viable implementation?

**Existing Code Analysis** (Use tools to check):
- Use `codebase-retrieval` to find similar existing functionality
- Use `search_code_desktop-commander` to locate relevant code patterns
- Use `Everything MCP` to find related files and configurations
- Check `shrimp-rules.md` for project-specific guidelines

**Reuse vs Build Decision:**
- What existing components can we reuse?
- What patterns should we follow from existing code?
- Where do we need new implementation?

### 🛠️ **Step 3: Smart Tool Usage** (MANDATORY)

**🔧 MCP Tool Usage Decision Matrix:**

**For Code Understanding:**
- **`codebase-retrieval`**: 
  - Query: "existing [feature type] implementations"
  - Query: "project architecture for [domain]"
  - Query: "similar functionality to [description]"
- **`search_code_desktop-commander`**: 
  - Search: specific class/function names
  - Find: error handling patterns, validation logic
  - Locate: API endpoints, database models

**For File Discovery:**
- **`Everything MCP`**: 
  - Find: configuration files (*.json, *.env, *.config)
  - Locate: test files, documentation, similar modules
  - Search: dependency files (package.json, requirements.txt)

**For Research (Unknown Technologies):**
- **Force Search Protocol** (Use `EXA MCP` or `Tavily Remote MCP`):
  - Pattern: "[technology] + [use case] + best practices 2024"
  - Validate: multiple sources, recent updates
  - Check: limitations, alternatives, real-world experiences

**For Documentation:**
- **`read_file_desktop-commander`**: 
  - Read: project rules (shrimp-rules.md)
  - Check: README files, API documentation
  - Review: configuration examples, setup guides

**🚨 Tool Combination Strategies:**

1. **Architecture Analysis**: `codebase-retrieval` → `search_code_desktop-commander` → `read_file_desktop-commander`
2. **Technology Research**: `Force Search Protocol` → `codebase-retrieval` (existing usage)
3. **Implementation Planning**: `Everything MCP` → `codebase-retrieval` → `search_code_desktop-commander`

**Project Context Check:**
- Read project rules: `shrimp-rules.md`
- Check existing patterns in similar modules
- Understand current architecture and conventions
- Identify integration points and dependencies

### 📋 **Solution Design**

Based on the above analysis, create a **practical implementation plan**:

**Business Solution Summary:**
- Clear statement of what this solves for the user
- Expected business value and success metrics

**Technical Approach:**
- Specific components to reuse or modify
- New code that needs to be written
- Integration points with existing systems
- Testing and validation approach

**Implementation Priority:**
- What to build first (MVP)
- What can be added later
- Dependencies and blockers

**Risk Mitigation:**
- What could go wrong?
- How to minimize implementation risk?
- Rollback plan if needed

### ⚡ **Next Step**

Call the analyze_task tool with your findings:
```
analyze_task({ 
  summary: "Brief business-focused summary", 
  initialConcept: "Practical implementation approach based on existing code patterns" 
})
```

**🚨 CRITICAL REMINDERS:**
- Business goal confirmation is MANDATORY before technical analysis
- Always check existing code before designing new solutions
- Prefer simple, proven approaches over complex innovations
- Use MCP tools to gather real information, never guess or assume