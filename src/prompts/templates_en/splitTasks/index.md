## Dynamic Task Splitting - {updateMode} Mode

## Core Principles

**EXECUTABLE GUIDANCE ONLY:**
- Generate specific, actionable directives for AI execution
- NO generic examples or theoretical discussions
- NO "we completed X" retrospective language
- Focus on immediate next steps

**SMART SPLITTING TRIGGERS:**
- Tasks >200 characters: automatic decomposition
- Multiple technology keywords detected: technical separation
- Complex operations identified: logical breakdown

**CONTEXT-AWARE GENERATION:**
- Generate guidance based on detected tech stack
- Provide multiple strategic approaches per task
- Adjust detail level by actual complexity indicators

## Task Analysis

{tasksContent}

## Atomic Task Splitting Directives

**ATOMIC TASK PRINCIPLE:**
- Each subtask = ONE concrete file operation or code change
- 30-minute rule: Each task completable in 30 minutes max
- Single responsibility: One task, one specific outcome
- Immediate executability: No further planning needed

**SPLITTING STRATEGY:**

**Level 1 - File Operations:**
- "Create file X.js with basic structure"
- "Add function Y to existing file Z.js" 
- "Update CSS styles in file A.css"

**Level 2 - Code Units:**
- "Write validation function for email input"
- "Add click handler to submit button"
- "Create database connection in config.js"

**Level 3 - Integration Steps:**
- "Connect form to validation function"
- "Link button to API endpoint"
- "Test database connection"

**QUALITY CHECKS:**
- Can this be done in one sitting?
- Is the deliverable clearly defined?
- Does it require no additional analysis?

**If splitting needed:** call "split_tasks" with atomic task breakdown
**If ready to proceed:** execute immediate atomic tasks

**Parameter Limit:** Max 5000 characters per split_tasks call - use multiple calls if needed
