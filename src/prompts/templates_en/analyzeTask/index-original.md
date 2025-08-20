## Enhanced Multi-Dimensional Analysis

**Task Context:**
- **Task Summary**: {summary}
- **Initial Concept**: {initialConcept}

After receiving the initial solution, complete the following comprehensive analysis in sequence, and call the `reflect_task` tool at the end:

### **Phase 1: Requirement Verification & Understanding**

- **Restate the Problem**: In your own words, what are we actually trying to solve?
- **Hidden Requirements**: What requirements are implied but not explicitly stated?
- **Success Criteria**: How will we know when this is truly "done"?
- **Stakeholder Impact**: Who will be affected by this implementation?
- **Assumption Validation**: What assumptions are we making? Are they valid?

### **Phase 2: Multi-Dimensional Analysis**

**Technical Dimensions:**
- **Functional Analysis**: Does the solution meet all functional requirements?
- **Performance Analysis**: What are the performance implications and bottlenecks?
- **Security Analysis**: What security considerations and vulnerabilities exist?
- **Scalability Analysis**: How will this solution scale with growth?
- **Maintainability Analysis**: How easy will this be to maintain and extend?

**Business Dimensions:**
- **User Experience Impact**: How does this affect the end user experience?
- **Operational Impact**: What are the deployment and operational considerations?
- **Risk Assessment**: What could go wrong and what are the mitigation strategies?
- **Resource Requirements**: What resources (time, skills, infrastructure) are needed?

### **Phase 3: Boundary Conditions & Edge Cases**

- **Success Scenarios**: Best case, normal case, minimum viable outcomes
- **Failure Scenarios**: What could fail and how to handle it gracefully?
- **Resource Constraints**: Time, memory, CPU, network limitations
- **Integration Points**: How does this interact with other systems?
- **Data Boundaries**: Input validation, output formatting, data consistency

### **Phase 4: Critical Thinking & Alternative Evaluation**

- **Challenge Assumptions**: What if our assumptions are wrong?
- **Alternative Approaches**: Are there simpler or more robust alternatives?
- **Trade-off Analysis**: What are we optimizing for and what are we sacrificing?
- **Future-proofing**: How will this solution evolve with changing requirements?

### **Phase 5: Technical Implementation Analysis**

**5.1 Structural Integrity Check**

   - Does it cover all requirements and constraints?
   - Are module boundaries and interface definitions clear?
   - Is the dependency graph reasonable and maintainable?
   - Does the design conform to the project's core architectural patterns?
   - Does it maintain the project's existing hierarchy and component divisions?

**5.2 Duplicate Functionality Detection and Sharing Assessment**

   - Use precise search strategies:
     - Use `search_code_desktop-commander`, `read_file_desktop-commander`, and Everything MCP (file search) to search for similar functionality implementations
     - Analyze the purpose and responsibilities of key components and utility classes
   - Check if functionalities in the solution overlap with existing code or other modules
   - If overlapping, determine:
     - Whether to directly **reuse** existing components (evaluate applicability, extensibility)
     - Or need to **refactor/abstract** into shared components (consider reuse costs and benefits)
   - Clearly indicate the reasons for reuse decisions and their scope of impact

**5.3 Performance and Scalability Assessment**

   - Are there potential performance bottlenecks?
   - How scalable is the design for future requirements?
   - Have resource usage and system load been considered?
   - Does the expansion strategy conform to existing project patterns?
   - What are the worst-case performance scenarios?

**5.4 Consistency and Style Validation**

   - Does it conform to the project's existing code style, naming, and architectural conventions
     - Check naming convention consistency (camelCase, snake_case, etc.)
     - Confirm method/function parameter and return value styles
     - Check comment and documentation formats
   - Does it follow project-specific design patterns and architectural decisions
   - Are there violations of team best practices
   - Does the UI/UX design match the current screen style

**5.5 Architectural Integration Assessment**

   - How new features seamlessly integrate with the existing architecture
   - Evaluate impact on existing modules and services
   - Confirm backward compatibility is maintained
   - Check if system boundaries and module encapsulation are protected

6. **Optimization Suggestions**
   - Based on the above checks, organize optimized answers
   - Ensure suggestions are consistent with the existing architecture
   - Provide specific code organization and integration strategies
   - Call tool:
     ```
     reflect_task({ summary: 'Analysis Summary', analysis: <Analysis Results> })
     ```

**Now call `reflect_task`, strictly forbidden not to call the tool**
