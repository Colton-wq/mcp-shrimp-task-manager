## Enhanced Task Splitting - {updateMode} Mode

## 🚫 ABSOLUTE PROHIBITIONS

**DOCUMENT CREATION FORBIDDEN:**
- **NEVER** create tasks for documentation, README files, guides, or manuals
- **NEVER** suggest tasks for writing documentation or creating .md/.txt files
- **NEVER** include "documentation", "guide", "manual", or "README" in task descriptions
- Focus ONLY on functional code implementation, testing, and technical configuration

**MVP-FIRST PRINCIPLE:**
- Prioritize minimum viable functionality over comprehensive features
- Break down to smallest testable units that deliver user value
- Defer optimization and enhancement tasks to later iterations

## Comprehensive Splitting Strategy

### **1. Multi-Dimensional Decomposition**

**Functional Decomposition:**
- Independent testable sub-functions with clear inputs and outputs
- Each task should have a single, well-defined responsibility
- Consider user-facing vs. internal functionality

**Technical Layer Decomposition:**
- Separate tasks along architectural layers, ensuring clear interfaces
- Database layer, business logic layer, API layer, UI layer
- Consider cross-cutting concerns (logging, security, monitoring)

**Development Stage Decomposition:**
- Core functionality first, optimization features later
- MVP features vs. enhancement features
- Critical path vs. nice-to-have features

**Risk-based Decomposition:**
- Isolate high-risk parts, reduce overall risk
- Separate experimental/uncertain tasks from stable ones
- Consider external dependencies and integration points

### **2. Boundary Conditions & Edge Cases Planning**

**Resource Constraints:**
- Consider time limitations for each task
- Identify tasks requiring specific skills or expertise
- Plan for potential resource conflicts

**Failure Scenarios:**
- What happens if a critical task fails?
- Which tasks can be delayed without blocking others?
- What are the rollback procedures for each task?

**Integration Boundaries:**
- How do tasks interact with existing systems?
- What are the data flow dependencies between tasks?
- Which tasks require coordination with external teams?

### **3. Enhanced Task Quality Framework**

**Task Atomicity:**
- Each task is small and specific enough to be completed independently
- Task should be completable by one person in a reasonable timeframe
- Clear definition of "done" for each task

**Dependency Management:**
- Task dependencies form a directed acyclic graph, avoiding circular dependencies
- Consider both technical and resource dependencies
- Plan for parallel execution opportunities

**Description Completeness:**
- Each task description is clear and accurate, including necessary context
- Include acceptance criteria and verification methods
- Specify required skills and estimated effort

**Risk Assessment per Task:**
- Identify high-risk tasks that might fail or take longer
- Plan mitigation strategies for critical path tasks
- Consider external dependencies and their reliability

**Boundary Condition Handling:**
- How does each task handle edge cases and error conditions?
- What are the input validation requirements?
- How are failures detected and reported?

## Task List

{tasksContent}

## Dependency Management

- Dependencies can be set using task names or task IDs
- Minimize the number of dependencies, only set direct prerequisite tasks
- Avoid circular dependencies, ensure the task graph is directed and acyclic
- Balance the critical path, optimize possibilities for parallel execution

## Decision Points

- If task splitting is found unreasonable: call "split_tasks" again to adjust
- If task splitting is confirmed to be sound: generate execution plan, determine priorities

**Severe Warning** Each time you call split_tasks, the parameters you pass cannot exceed 5000 characters. If it exceeds 5000 characters, please call the tool multiple times to complete

**If there are remaining tasks, please continue to call "split_tasks"**
