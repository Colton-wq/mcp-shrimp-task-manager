## Enhanced Critical Reflection & Validation

**Analysis Context:**
- **Task Summary**: {summary}
- **Analysis Results**: {analysis}

After receiving the solution and suggestions, conduct comprehensive critical reflection and validation, then submit the final results:

### **Phase 1: Critical Assumption Challenge**

- **Question Our Assumptions**:
  - What assumptions did we make that might be wrong?
  - What if the user's stated requirement isn't their actual need?
  - Are we solving the right problem?
  - What would happen if our key assumptions are invalid?

- **Alternative Perspective Analysis**:
  - How would a security expert view this solution?
  - How would a performance engineer approach this differently?
  - What would a maintenance engineer be concerned about?
  - How would this look from a user experience perspective?

### **Phase 2: Worst-Case Scenario Planning**

- **Failure Mode Analysis**:
  - What are the most likely failure points?
  - What happens if external dependencies fail?
  - How does the system behave under extreme load?
  - What are the data corruption risks?

- **Risk Mitigation Assessment**:
  - Do we have adequate error handling?
  - Are there sufficient monitoring and alerting mechanisms?
  - What are the rollback and recovery procedures?
  - How do we detect and respond to issues quickly?

### **Phase 3: Solution Quality Assessment**

**3.1 Requirements Alignment Check**

   - Does the final solution fully satisfy user requirements and constraints?
   - Are there any omissions or deviations from the original goals?
   - Have we addressed all the boundary conditions identified?
   - Are the success criteria clearly defined and measurable?

**3.2 Architectural Consistency Check**

   - Does the design follow the project's existing architectural patterns and design principles?
   - Is it consistent with existing code style, naming conventions, and organizational structure?
   - Does it appropriately utilize existing components rather than reimplementing them?
   - Are new features properly integrated into the existing architecture?
   - Is the clarity of module boundaries and responsibility divisions maintained?

**3.3 Over-design Review**

   - Is unnecessary complexity introduced?
   - Is there excessive feature splitting or abstraction?
   - Are we solving problems that don't exist yet?
   - Could this be implemented more simply?

**3.4 Simplicity and Implementability**

   - Is the design concise and practically implementable?
   - Is there sufficient space for future iterations?
   - Can this be built incrementally?
   - Are the implementation steps clear and achievable?

### **Phase 4: Final Validation & Decision**

**4.1 Trade-off Analysis**
   - What are we optimizing for (speed, maintainability, performance, simplicity)?
   - What are we sacrificing and is it acceptable?
   - Are there better alternatives we haven't considered?

**4.2 Feedback and Confirmation**

   - If there are deficiencies or over-design, list "Items Needing Adjustment" and explain the reasons
   - If everything is satisfactory, generate a "Completion Confirmation Report"
   - Include specific recommendations for risk mitigation

6. **Task Splitting Architectural Considerations**

   - Task splitting should consider existing architectural module boundaries and responsibility divisions
   - Each subtask should clearly specify its integration points and dependencies with existing code
   - Clearly mark which subtasks involve reusing existing code and which require new implementation
   - Maintain task granularity consistency, avoid excessive splitting or uneven granularity
   - Ensure that the task group after splitting still maintains overall architectural consistency

7. **Submit Final Results**
   - **No Comments Allowed**: JSON does not support comments — Any use of `#` or `//` will cause parsing failures
   - **Proper Escaping Required**: All special characters (e.g., double quotes `\"`, backslashes `\\`) must be properly escaped, or they will be considered invalid.
   - **Line Breaks**: If you need line breaks, use escape sequences like \\n or \\r. Direct line breaks will cause parsing errors.
   - Adjusted final solution + reflection report
   - Call tool:
   ```
   split_tasks( ... )
   ```

**Now start calling `split_tasks`, strictly forbidden not to call the tool**
