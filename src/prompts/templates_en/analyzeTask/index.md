## Business-Focused Technical Analysis with MCP Tool Integration

**Task Context:**
- **Task Summary**: {summary}
- **Initial Concept**: {initialConcept}
{iterationPrompt}

Complete the following focused analysis and call `reflect_task` at the end:

### 🎯 **Business Validation Check** (MANDATORY)

**🚨 CRITICAL: Business Goal Confirmation Required**

**Requirement Verification:**
- Does the proposed solution actually solve the user's REAL business problem?
- Are we building what the user really needs vs. what they asked for?
- Is this the simplest approach that works?
- What's the real success criteria from a business perspective?
- How will we measure business value and user satisfaction?

**Business Impact Assessment:**
- What specific business value does this deliver to users?
- How does this align with project goals and business objectives?
- Are we over-engineering the solution beyond business needs?
- What's the business cost of NOT implementing this?
- Who are the actual users and what do they really need?

**User Need Validation:**
- Have we confirmed the real user need behind this request?
- Is this solving a genuine business problem or just a technical preference?
- What's the minimum viable solution that delivers business value?
- How does this improve the user experience or business metrics?

### 🔍 **Technical Feasibility Analysis with MCP Tools**

**🔧 MANDATORY: Use MCP Tools for Code Analysis**

**Existing Code Integration** (Use these tools):
- **`codebase-retrieval`**: Search for similar functionality, architectural patterns, and existing components
  - Query: "similar functionality to [task description]"
  - Query: "existing [component type] implementations"
  - Query: "project architecture patterns for [domain]"
- **`search_code_desktop-commander`**: Find specific code patterns and implementations
  - Search for: relevant class names, function signatures, API endpoints
  - Look for: error handling patterns, validation logic, data models
- **`Everything MCP`**: Quickly locate configuration files and related resources
  - Find: config files, environment settings, dependency definitions
  - Locate: test files, documentation, similar modules

**Implementation Complexity Analysis:**
- What are the core technical challenges?
- Which parts are straightforward vs. complex?
- What external dependencies are needed?
- How can we minimize implementation risk?

**Performance & Scalability:**
- Are there obvious performance concerns?
- How will this scale with usage?
- What are the resource requirements?
- Any potential bottlenecks to address?

### 🛠️ **Practical Implementation Strategy**

**🔧 MANDATORY: Information Gathering Phase**

**If uncertain about ANY technical details, use these tools:**

1. **For Architecture Understanding:**
   - `read_file_desktop-commander`: Read project configuration files (package.json, tsconfig.json, etc.)
   - `codebase-retrieval`: Understand overall project structure and patterns
   - `search_code_desktop-commander`: Find architectural documentation or similar implementations

2. **For Technology Research (if unfamiliar concepts):**
   - **Force Search Protocol**: Use `EXA MCP` or `Tavily Remote MCP` for technology research
   - Search pattern: "[technology] + [specific use case] + best practices"
   - Validate with multiple sources, check for recent updates (2024-2025)
   - Look for limitations, alternatives, and real-world experiences

3. **For Integration Analysis:**
   - `search_code_desktop-commander`: Find existing API integrations, database connections
   - `Everything MCP`: Locate environment files, configuration templates
   - `codebase-retrieval`: Understand data flow and service boundaries

**Development Approach:**
- What's the minimum viable implementation?
- How can we build this incrementally?
- What can be tested independently?
- Where should we start first?

**Integration Points:**
- How does this connect with existing systems?
- What APIs or interfaces are needed?
- Are there data migration considerations?
- What testing strategy is required?

**Risk Mitigation:**
- What could go wrong during implementation?
- How can we detect problems early?
- What's the rollback strategy?
- How do we ensure quality?

### 📊 **Quality & Maintainability Assessment**

**🔧 Code Quality Verification (Use MCP Tools):**
- **`codebase-retrieval`**: Check existing code style, naming conventions, and patterns
  - Query: "code style examples", "naming conventions", "error handling patterns"
- **`search_code_desktop-commander`**: Find testing patterns and quality standards
  - Search for: test files, linting configurations, code review guidelines

**Code Quality:**
- Does this follow project coding standards?
- Is the design maintainable long-term?
- Are there clear module boundaries?
- Is error handling adequate?

**Documentation & Testing:**
- What documentation is needed?
- How will this be tested?
- Are there edge cases to consider?
- What monitoring is required?

### 🚨 **MCP Tool Usage Decision Tree**

**When to use each tool:**

```
📋 INFORMATION GATHERING:
├── Need to understand existing code?
│   └── Use: codebase-retrieval + search_code_desktop-commander
├── Need to find specific files?
│   └── Use: Everything MCP
├── Need to research unfamiliar technology?
│   └── Use: Force Search Protocol (EXA/Tavily MCP)
└── Need to read configuration/documentation?
    └── Use: read_file_desktop-commander

🔍 ANALYSIS PHASE:
├── Understanding architecture?
│   └── Use: codebase-retrieval ("architecture patterns", "project structure")
├── Finding similar implementations?
│   └── Use: search_code_desktop-commander (specific function/class names)
├── Checking dependencies?
│   └── Use: Everything MCP (package.json, requirements.txt, etc.)
└── Researching best practices?
    └── Use: Force Search Protocol ("best practices for [technology]")

⚡ IMPLEMENTATION PLANNING:
├── Need existing code examples?
│   └── Use: codebase-retrieval + search_code_desktop-commander
├── Need to understand testing patterns?
│   └── Use: search_code_desktop-commander ("test", "spec", "mock")
└── Need to check project conventions?
    └── Use: read_file_desktop-commander (style guides, contributing.md)
```

### ⚡ **Final Recommendation**

**Implementation Summary:**
- Clear, actionable implementation plan
- Specific next steps and priorities
- Resource requirements and timeline
- Success metrics and validation approach

**MCP Tools Used Summary:**
- List which tools were used and what information was gathered
- Highlight any gaps where additional research is needed
- Note any assumptions that should be validated

**Call reflect_task with your analysis:**
```
reflect_task({ 
  summary: "Business-focused analysis summary with MCP tool insights", 
  analysis: "Practical implementation strategy based on actual codebase analysis and research" 
})
```

**🚨 CRITICAL REMINDERS:**
- NEVER guess or assume technical details - always use MCP tools to gather real information
- Use Force Search Protocol for any unfamiliar technologies or concepts
- Combine multiple tools for comprehensive understanding
- Document which tools provided which insights for transparency