# Enhanced Analysis Template Selector

Select the appropriate analysis template based on task characteristics and requirements. This selector guides AI to choose the most suitable analysis approach for comprehensive and targeted evaluation.

## Template Selection Framework

### Analysis Type Classification

**Deep Code Analysis Template**
- **Use When**: Security vulnerabilities, code quality issues, performance bottlenecks in code
- **Indicators**: "security", "vulnerability", "code review", "performance", "optimization", "bugs"
- **Focus Areas**: Security assessment, performance analysis, code quality evaluation
- **Deliverables**: Security report, performance analysis, code quality metrics

**Architecture Understanding Template**
- **Use When**: System design evaluation, architectural decisions, integration analysis
- **Indicators**: "architecture", "design", "integration", "scalability", "system", "structure"
- **Focus Areas**: Component analysis, dependency mapping, scalability assessment
- **Deliverables**: Architecture assessment, dependency analysis, scalability report

**Problem Diagnosis Template**
- **Use When**: Issue investigation, root cause analysis, incident response
- **Indicators**: "problem", "issue", "bug", "error", "failure", "incident", "troubleshoot"
- **Focus Areas**: Root cause analysis, impact assessment, recovery planning
- **Deliverables**: Diagnostic report, root cause analysis, recovery procedures

**Performance Analysis Template**
- **Use When**: Performance optimization, capacity planning, load testing
- **Indicators**: "performance", "load", "capacity", "scaling", "optimization", "bottleneck"
- **Focus Areas**: Resource analysis, scalability testing, performance optimization
- **Deliverables**: Performance report, capacity plan, optimization recommendations

**Code Generation Template**
- **Use When**: New feature development, code creation, implementation planning
- **Indicators**: "implement", "create", "develop", "build", "generate", "feature"
- **Focus Areas**: Design patterns, testability, observability, security integration
- **Deliverables**: Implementation plan, code structure, quality framework

## Selection Decision Matrix

### Primary Selection Criteria

**Task Intent Analysis:**
```
INVESTIGATION: Problem diagnosis, root cause analysis → Problem Diagnosis Template
ASSESSMENT: Code review, quality evaluation → Deep Code Analysis Template
DESIGN: Architecture planning, system design → Architecture Understanding Template
OPTIMIZATION: Performance tuning, scaling → Performance Analysis Template
IMPLEMENTATION: Feature development, coding → Code Generation Template
```

**Keyword Mapping:**
```
SECURITY KEYWORDS: vulnerability, security, auth, encryption, injection
→ Deep Code Analysis Template

ARCHITECTURE KEYWORDS: design, structure, component, integration, pattern
→ Architecture Understanding Template

PROBLEM KEYWORDS: issue, bug, error, failure, incident, troubleshoot
→ Problem Diagnosis Template

PERFORMANCE KEYWORDS: performance, load, capacity, scaling, optimization
→ Performance Analysis Template

DEVELOPMENT KEYWORDS: implement, create, develop, build, feature, code
→ Code Generation Template
```

### Secondary Selection Factors

**Complexity Assessment:**
- **High Complexity**: Use multiple templates in sequence
- **Medium Complexity**: Use primary template with secondary considerations
- **Low Complexity**: Use single focused template

**Risk Level Consideration:**
- **Critical Systems**: Emphasize security and reliability aspects
- **Performance-Critical**: Focus on performance and scalability
- **User-Facing**: Prioritize user experience and error handling
- **Integration-Heavy**: Emphasize architecture and dependency analysis

## Multi-Template Analysis Strategy

### Sequential Template Application

**For Complex Analysis Requirements:**
```
1. Start with Architecture Understanding Template
   - Establish system context and component relationships
   - Identify key integration points and dependencies

2. Apply Deep Code Analysis Template
   - Examine security vulnerabilities and code quality
   - Assess performance implications at code level

3. Use Problem Diagnosis Template (if issues identified)
   - Investigate specific problems discovered
   - Develop remediation strategies

4. Apply Performance Analysis Template (if performance concerns)
   - Conduct detailed performance assessment
   - Plan optimization strategies

5. Use Code Generation Template (for improvements)
   - Design implementation approach for fixes
   - Plan new feature development
```

### Parallel Template Considerations

**Cross-Cutting Concerns:**
- **Security**: Apply security focus across all templates
- **Performance**: Consider performance implications in all analyses
- **Maintainability**: Evaluate maintainability in all assessments
- **Testability**: Ensure testability considerations in all templates

## Template Customization Guidelines

### Context-Specific Adaptations

**Project Type Adaptations:**
```
MICROSERVICES: Emphasize service boundaries, communication patterns
MONOLITHIC: Focus on module separation, dependency management
LEGACY SYSTEMS: Prioritize risk assessment, migration planning
GREENFIELD: Emphasize best practices, future-proofing
```

**Technology Stack Considerations:**
```
WEB APPLICATIONS: Focus on security, performance, user experience
APIs: Emphasize contract design, versioning, documentation
DATABASES: Focus on performance, data integrity, scalability
MOBILE: Prioritize performance, offline capabilities, user experience
```

### Risk-Based Template Enhancement

**High-Risk Scenarios:**
- Add additional security assessment steps
- Include comprehensive disaster recovery planning
- Emphasize compliance and audit requirements
- Increase testing and validation requirements

**Performance-Critical Scenarios:**
- Add detailed performance profiling steps
- Include load testing and capacity planning
- Emphasize monitoring and alerting setup
- Focus on optimization and tuning strategies

## Template Integration Workflow

### Analysis Execution Process

**Phase 1: Template Selection (5-10 minutes)**
```
1. Analyze task description and requirements
2. Identify primary analysis intent and keywords
3. Assess complexity and risk factors
4. Select primary template and secondary considerations
5. Plan multi-template approach if needed
```

**Phase 2: Template Execution (Variable)**
```
1. Execute primary template analysis
2. Apply secondary template considerations
3. Integrate findings across templates
4. Identify gaps and additional analysis needs
5. Synthesize comprehensive assessment
```

**Phase 3: Results Integration (15-30 minutes)**
```
1. Consolidate findings from multiple templates
2. Prioritize recommendations by impact and effort
3. Create integrated action plan
4. Validate completeness against requirements
5. Document analysis methodology and rationale
```

## Quality Assurance Framework

### Template Selection Validation

**Selection Criteria Checklist:**
- [ ] Primary analysis intent correctly identified
- [ ] Keyword mapping accurately applied
- [ ] Complexity level appropriately assessed
- [ ] Risk factors properly considered
- [ ] Multi-template strategy planned if needed

**Execution Quality Gates:**
- [ ] All template sections completed thoroughly
- [ ] Risk assessment framework properly applied
- [ ] Deliverables meet template requirements
- [ ] Integration across templates achieved
- [ ] Action plan prioritized and actionable

### Continuous Improvement

**Template Effectiveness Tracking:**
- Monitor template selection accuracy
- Track analysis completeness and quality
- Collect feedback on template usefulness
- Identify gaps and improvement opportunities
- Update templates based on lessons learned

**Selection Algorithm Refinement:**
- Improve keyword mapping accuracy
- Enhance complexity assessment criteria
- Refine risk factor weighting
- Optimize multi-template coordination
- Streamline selection decision process

## Usage Examples

### Example 1: Security Vulnerability Assessment
```
Task: "Analyze authentication system for security vulnerabilities"
Keywords: security, vulnerability, authentication
Selection: Deep Code Analysis Template
Focus: Security vulnerability assessment, authentication review
Secondary: Architecture Understanding (for integration points)
```

### Example 2: Performance Optimization
```
Task: "Investigate slow API response times and optimize performance"
Keywords: performance, optimization, API
Selection: Performance Analysis Template
Focus: Performance bottleneck identification, optimization planning
Secondary: Problem Diagnosis (for root cause analysis)
```

### Example 3: System Architecture Review
```
Task: "Evaluate microservices architecture for scalability"
Keywords: architecture, microservices, scalability
Selection: Architecture Understanding Template
Focus: Component analysis, scalability assessment
Secondary: Performance Analysis (for scaling implications)
```

This template selector ensures appropriate analysis approach selection while maintaining comprehensive coverage of all critical aspects through strategic template combination.