## Business-Focused Technical Analysis

**Task Context:**
- **Task Summary**: {summary}
- **Initial Concept**: {initialConcept}
{iterationPrompt}

Complete the following focused analysis and call `reflect_task` at the end:

### 🎯 **Business Validation Check**

**Requirement Verification:**
- Does the proposed solution actually solve the user's business problem?
- Are we building what the user really needs?
- Is this the simplest approach that works?
- What's the real success criteria from a business perspective?

**Value Assessment:**
- What specific value does this deliver to users?
- How does this align with project goals?
- Are we over-engineering the solution?

### 🔍 **Technical Feasibility Analysis**

**Existing Code Integration:**
- What existing components can we leverage?
- How does this fit with current architecture patterns?
- Are there similar implementations we can learn from?
- What project conventions must we follow?

**Implementation Complexity:**
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

**Code Quality:**
- Does this follow project coding standards?
- Is the design maintainable long-term?
- Are there clear module boundaries?
- Is error handling adequate?

**Testing & Validation:**
- How will this be tested?
- Are there edge cases to consider?
- What monitoring is required?
- What validation criteria should be applied?

### ⚡ **Final Recommendation**

**Implementation Summary:**
- Clear, actionable implementation plan
- Specific next steps and priorities
- Resource requirements and timeline
- Success metrics and validation approach

**Call reflect_task with your analysis:**
```
reflect_task({ 
  summary: "Business-focused analysis summary", 
  analysis: "Practical implementation strategy with specific technical details" 
})
```

**🚨 CRITICAL FOCUS:**
- Keep business value at the center of all technical decisions
- Prefer proven, simple solutions over complex innovations
- Always consider existing code patterns and project conventions
- Provide actionable, specific recommendations