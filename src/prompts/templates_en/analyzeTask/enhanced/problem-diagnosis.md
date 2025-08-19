# Problem Diagnosis Template

Execute systematic problem diagnosis using root cause analysis, impact assessment, and recovery planning. This template provides structured approach to identify, analyze, and resolve complex technical issues.

## Diagnostic Framework

### 1. Problem Definition and Scope

**Problem Statement Structure:**
- **Symptom Description**: Observable behaviors, error messages, and performance indicators
- **Impact Assessment**: Affected users, systems, and business processes
- **Timeline Analysis**: When problem started, frequency, and progression patterns
- **Environment Context**: Production, staging, development environments affected
- **Reproduction Criteria**: Steps to reproduce, consistency, and environmental dependencies

**Scope Boundaries:**
```
IN SCOPE: Direct symptoms, immediate causes, affected components
OUT OF SCOPE: Unrelated issues, future enhancements, non-critical optimizations
RELATED: Potentially connected issues requiring investigation
UNKNOWN: Areas requiring further investigation to determine relevance
```

### 2. Root Cause Analysis Framework

**5 Whys Analysis:**
```
1. Why did the problem occur? (Immediate cause)
2. Why did that cause happen? (Contributing factor)
3. Why did that factor exist? (System weakness)
4. Why wasn't it prevented? (Process gap)
5. Why wasn't it detected earlier? (Monitoring gap)
```

**Fishbone Diagram Categories:**
- **People**: Human error, training gaps, communication failures, process adherence
- **Process**: Workflow issues, procedure gaps, approval bottlenecks, change management
- **Technology**: Software bugs, hardware failures, configuration errors, capacity limits
- **Environment**: Infrastructure issues, network problems, external dependencies, security
- **Materials**: Data quality, input validation, resource availability, documentation

**Root Cause Classification:**
```
PRIMARY: Direct cause that if eliminated would prevent the problem
CONTRIBUTING: Factors that increased likelihood or severity
ENABLING: Conditions that allowed the problem to occur
TRIGGERING: Events that initiated the problem manifestation
```

### 3. Impact Assessment Matrix

**Business Impact Dimensions:**
- **Financial Impact**: Revenue loss, cost increase, penalty exposure, opportunity cost
- **Operational Impact**: Service availability, performance degradation, manual workarounds
- **Customer Impact**: User experience, satisfaction, retention, acquisition
- **Compliance Impact**: Regulatory violations, audit findings, legal exposure
- **Reputation Impact**: Brand damage, market confidence, stakeholder trust

**Technical Impact Assessment:**
```
SYSTEM AVAILABILITY:
- Complete outage: 0% availability
- Severe degradation: 1-50% normal performance
- Moderate degradation: 51-80% normal performance
- Minor impact: 81-95% normal performance
- Minimal impact: 96-99% normal performance

DATA INTEGRITY:
- Data loss: Permanent data corruption or deletion
- Data corruption: Incorrect data requiring correction
- Data inconsistency: Temporary synchronization issues
- Data quality: Minor accuracy or completeness issues
```

### 4. Evidence Collection and Analysis

**Log Analysis Framework:**
- **Application Logs**: Error messages, stack traces, performance metrics, user actions
- **System Logs**: Operating system events, resource utilization, security events
- **Infrastructure Logs**: Network traffic, database queries, cache operations, external calls
- **Monitoring Data**: Metrics, alerts, dashboards, trend analysis
- **User Reports**: Support tickets, feedback, reproduction steps, workarounds

**Evidence Correlation Techniques:**
```
1. Timeline correlation: Align events across different log sources
2. Pattern recognition: Identify recurring patterns or anomalies
3. Dependency mapping: Trace interactions between components
4. Performance correlation: Link performance metrics to error events
5. External factor analysis: Consider external events and changes
```

### 5. Recovery and Mitigation Planning

**Immediate Response Actions:**
- **Containment**: Isolate affected systems, prevent spread, protect data integrity
- **Workarounds**: Temporary solutions, manual processes, alternative workflows
- **Communication**: Stakeholder notification, status updates, escalation procedures
- **Monitoring**: Enhanced monitoring, alerting, health checks
- **Documentation**: Incident tracking, decision rationale, action log

**Recovery Strategy Framework:**
```
ROLLBACK: Revert to previous known good state
HOTFIX: Apply targeted fix to address immediate issue
FAILOVER: Switch to backup systems or redundant components
MANUAL INTERVENTION: Human-driven processes to restore service
GRACEFUL DEGRADATION: Reduce functionality to maintain core services
```

## Diagnostic Execution Process

### Phase 1: Initial Assessment (0-30 minutes)
```
1. Gather initial problem reports and symptoms
2. Assess immediate impact and urgency
3. Implement containment measures if necessary
4. Establish communication channels and escalation
5. Begin evidence collection from obvious sources
```

### Phase 2: Deep Investigation (30 minutes - 4 hours)
```
1. Conduct systematic log analysis and correlation
2. Perform root cause analysis using structured methods
3. Test hypotheses through controlled experiments
4. Map dependencies and trace interaction flows
5. Identify contributing factors and enabling conditions
```

### Phase 3: Solution Development (1-8 hours)
```
1. Develop multiple solution options with trade-offs
2. Assess solution risks and implementation complexity
3. Plan rollback procedures and contingency measures
4. Prepare testing and validation procedures
5. Create implementation timeline with checkpoints
```

### Phase 4: Implementation and Validation (Variable)
```
1. Execute solution in controlled manner
2. Monitor system behavior and performance metrics
3. Validate problem resolution and side effects
4. Conduct post-implementation testing
5. Document lessons learned and process improvements
```

## Risk Assessment and Contingency Planning

### Solution Risk Analysis

**Implementation Risks:**
- **Technical Risk**: Solution complexity, testing coverage, rollback feasibility
- **Operational Risk**: Service disruption, data loss, performance impact
- **Timeline Risk**: Implementation duration, resource availability, dependencies
- **Communication Risk**: Stakeholder alignment, change management, user impact
- **Validation Risk**: Testing completeness, monitoring coverage, success criteria

**Contingency Planning:**
```
PLAN A: Primary solution with highest confidence
PLAN B: Alternative approach with different trade-offs
PLAN C: Minimal viable fix with reduced functionality
PLAN D: Emergency rollback with manual workarounds
```

### Worst-Case Scenario Planning

**Escalation Scenarios:**
- **Solution Failure**: Primary fix doesn't work or causes additional problems
- **Extended Outage**: Problem persists beyond acceptable timeframes
- **Data Loss**: Critical data corruption or deletion occurs
- **Cascading Failures**: Problem spreads to additional systems
- **Resource Exhaustion**: Team capacity or technical resources depleted

**Emergency Procedures:**
```
1. Escalation matrix with clear decision points
2. Emergency contact procedures for critical stakeholders
3. Disaster recovery activation criteria and procedures
4. External vendor engagement for specialized support
5. Business continuity measures for extended outages
```

## Documentation and Knowledge Management

### Incident Documentation Structure
```
1. Problem Summary
   - Concise problem description
   - Impact assessment and affected systems
   - Timeline of key events
   - Resolution summary

2. Root Cause Analysis
   - Detailed investigation findings
   - Contributing factors and enabling conditions
   - Evidence and supporting data
   - Lessons learned and insights

3. Solution Documentation
   - Implemented solution description
   - Alternative options considered
   - Implementation steps and validation
   - Rollback procedures and contingencies

4. Prevention Measures
   - Process improvements identified
   - Monitoring enhancements required
   - Training needs and knowledge gaps
   - System improvements recommended
```

### Knowledge Base Integration
- **Searchable Problem Database**: Categorized by symptoms, causes, and solutions
- **Runbook Updates**: Incorporate new procedures and troubleshooting steps
- **Training Materials**: Update documentation and training based on lessons learned
- **Monitoring Improvements**: Enhance alerting and detection based on blind spots
- **Process Refinements**: Update incident response procedures and escalation paths

## Quality Gates and Success Criteria

**Diagnostic Quality Measures:**
- Root cause identified with supporting evidence
- Impact assessment completed with quantified metrics
- Solution options evaluated with risk-benefit analysis
- Recovery procedures tested and validated
- Prevention measures identified and prioritized

**Resolution Validation:**
- Problem symptoms eliminated or significantly reduced
- System performance restored to acceptable levels
- No new issues introduced by solution implementation
- Monitoring confirms stable system behavior
- Stakeholders confirm acceptable resolution

## Integration with Existing Tools

**MCP Tool Utilization:**
- Use `codebase-retrieval` for comprehensive code analysis during investigation
- Leverage `search_code_desktop-commander` for pattern identification
- Apply `force_search_protocol` for external knowledge validation
- Utilize monitoring and logging tools for evidence collection
- Integrate with incident management systems for tracking and communication

This template ensures systematic problem diagnosis while maintaining focus on rapid resolution and prevention of recurrence.