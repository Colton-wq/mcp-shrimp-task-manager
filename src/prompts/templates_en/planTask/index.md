## Enhanced Task Analysis Framework

You must complete the following comprehensive analysis in sequence, and at the end call the `analyze_task` tool to pass the preliminary design solution to the next stage.

1. **Requirements Understanding & Validation**

   - **Original User Request Analysis**:
     ```
     Task Description: {description}
     Task Requirements and Constraints: {requirements}
     {tasksTemplate}
     ```

   - **Critical Questions to Answer**:
     - What is the user's ACTUAL underlying need? (not just what they asked for)
     - Are there implicit requirements not explicitly stated?
     - What assumptions are we making about the user's context?
     - What would happen if we misunderstood the requirement?

   - **Requirement Validation Checklist**:
     - [ ] Can we restate the requirement in our own words?
     - [ ] Have we identified all stakeholders affected?
     - [ ] Are there conflicting requirements that need resolution?
     - [ ] What are the acceptance criteria for "done"?

2. **Boundary Conditions & Edge Cases Analysis**

   - **Success Scenarios**:
     - Best case: What does perfect execution look like?
     - Normal case: What does typical successful execution look like?
     - Minimum viable: What's the smallest acceptable solution?

   - **Failure Scenarios & Risk Assessment**:
     - What could go wrong during implementation?
     - What are the dependencies that could fail?
     - What happens if we run out of time/resources?
     - What are the rollback/recovery options?

   - **Resource & Constraint Analysis**:
     - Time constraints and deadlines
     - Technical skill requirements
     - System resource limitations
     - Budget/effort constraints

3. **Multi-Dimensional Problem Analysis**

   - **Technical Dimensions**:
     - Functional requirements (what it must do)
     - Non-functional requirements (performance, security, scalability)
     - Integration requirements (APIs, databases, external services)
     - Maintenance requirements (monitoring, logging, debugging)

   - **Business Dimensions**:
     - User experience impact
     - Business process changes
     - Compliance and regulatory requirements
     - Long-term strategic alignment

4. **Identify Project Architecture**

   - View key configuration files and structures:
     - Examine root directory structure and important configuration files (package.json, tsconfig.json, etc.)
     - If shrimp-rules.md exists, please read and refer to it in detail
     - Analyze main directory organization and module divisions
   - Identify architectural patterns:
     - Identify core design patterns and architectural styles (MVC, MVVM, microservices, etc.)
     - Determine the project's layered structure and module boundaries
   - Analyze core components:
     - Research main class/interface designs and dependencies
     - Mark key services/utility classes and their responsibilities and uses
   - Document existing patterns:
     - Document discovered code organization methods and architectural regularities
     - Establish deep understanding of the project's technology stack and architectural characteristics

5. **Collect Information**
   If there is any uncertainty or lack of confidence, **must do one of the following**:

   - Ask the user for clarification
   - Use `query_task`, `read_file_desktop-commander`, `search_code_desktop-commander`, and Everything MCP (file search) to query existing programs/architecture
   - Apply Force Search Protocol v2.0 for unfamiliar concepts or technologies (Exa MCP / tavily-remote MCP / GitHub MCP / Context7, two-keyword progressive search, multi-source validation with citations and limitations).
     Speculation is prohibited; all information must have traceable sources. Do not rely solely on pretraining knowledge.

4. **Check Existing Programs and Structures**

   - Use precise search strategies:
     - Use `read_file_desktop-commander`, `search_code_desktop-commander` or Everything MCP (file search) to query existing implementation methods related to the task
     - Look for existing code with functionality similar to the current task
     - Analyze directory structure to find similar functional modules
   - Analyze code style and conventions:
     - Check naming conventions of existing components (camelCase, snake_case, etc.)
     - Confirm comment styles and format conventions
     - Analyze error handling patterns and logging methods
   - Record and follow discovered patterns:
     - Document code patterns and organizational structures in detail
     - Plan how to extend these patterns in the design
   - Determine if there is overlap with existing functionality, and decide whether to "reuse" or "abstract and refactor"
   - **Do not** generate designs before checking existing code; must "check first, then design"

6. **Task Type-Specific Guidelines**

   Based on task characteristics, additionally consider the following specific guidelines:

   - **Frontend/UI Tasks**:

     - Prioritize examining existing UI component libraries and design systems
     - Analyze page layout structures and component composition patterns
     - Confirm style management methods (CSS modules, Styled Components, etc.)
     - Understand state management and data flow patterns

   - **Backend API Tasks**:

     - Check API route structures and naming conventions
     - Analyze request handling and middleware patterns
     - Confirm error handling and response format standards
     - Understand authorization/authentication implementation methods

   - **Database Operations**:
     - Analyze existing data access patterns and abstraction layers
     - Confirm query building and transaction processing methods
     - Understand relationship handling and data validation methods
     - Check caching strategies and performance optimization techniques

6. **Critical Thinking & Alternative Analysis**

   - **Challenge Your Assumptions**:
     - What assumptions are we making that might be wrong?
     - What if the user's stated requirement isn't their actual need?
     - Are there simpler solutions we're overlooking?
     - What would an expert in this domain do differently?

   - **Alternative Solution Exploration**:
     - Generate at least 2-3 different approaches
     - Consider trade-offs: simple vs. robust, fast vs. maintainable
     - Evaluate "buy vs. build" options
     - Consider both incremental and revolutionary approaches

7. **Preliminary Solution Output**
   - Based on the above comprehensive analysis, write a "Preliminary Design Solution":
     - Clearly mark **facts** (sources) vs **inferences** (selection basis)
     - Prohibit vague statements; must be final deliverable content
     - Ensure the solution is consistent with the project's existing architectural patterns
     - Explain how to reuse existing components or follow existing patterns
   - The process must be thought through step by step and organize thoughts; if the problem is too complex, utilize `process_thought` to think
   - **Critical Warning**: All forms of `assumptions`, `guesses`, and `imagination` are strictly prohibited. You must use every `available tool` at your disposal to `gather real information`.
   - Call tool:
     ```
     analyze_task({ summary: <Task Summary>, initialConcept: <Initial Concept> })
     ```

**Now start calling `analyze_task`, strictly forbidden not to call the tool**
