# Architecture Understanding Template

Conduct systematic analysis of system architecture to identify structural patterns, failure points, scalability constraints, and integration dependencies. This template provides comprehensive architectural assessment framework.

## Architectural Analysis Framework

### 1. System Structure Analysis

**Component Identification:**
- **Core Components**: Identify primary business logic modules and their responsibilities
- **Infrastructure Components**: Analyze data access, caching, messaging, and external integrations
- **Cross-Cutting Concerns**: Examine logging, security, monitoring, and configuration management
- **Interface Boundaries**: Map API contracts, data formats, and communication protocols
- **Deployment Units**: Understand packaging, distribution, and runtime organization

**Dependency Mapping:**
```
1. Create dependency graph showing component relationships
2. Identify circular dependencies and coupling hotspots
3. Analyze dependency direction and layering compliance
4. Map external dependencies and third-party integrations
5. Document version compatibility and upgrade constraints
```

### 2. Architectural Pattern Recognition

**Pattern Analysis:**
- **Structural Patterns**: Layered, hexagonal, microservices, monolithic, modular monolith
- **Communication Patterns**: Synchronous, asynchronous, event-driven, request-response
- **Data Patterns**: CQRS, event sourcing, database per service, shared database
- **Integration Patterns**: API gateway, service mesh, message broker, direct integration
- **Deployment Patterns**: Blue-green, canary, rolling updates, immutable infrastructure

**Pattern Compliance Assessment:**
```
COMPLIANT: Implementation follows pattern principles correctly
PARTIAL: Some pattern elements implemented, others missing or incorrect
VIOLATED: Implementation contradicts pattern principles
MIXED: Multiple patterns used without clear separation of concerns
```

### 3. Failure Point Analysis

**Single Points of Failure (SPOF):**
- **Infrastructure SPOF**: Database, message broker, cache, load balancer dependencies
- **Service SPOF**: Critical services without redundancy or failover mechanisms
- **Data SPOF**: Single data sources, backup failures, replication lag issues
- **Network SPOF**: Network partitions, DNS failures, CDN dependencies
- **Human SPOF**: Manual processes, single-person knowledge, deployment dependencies

**Failure Mode Assessment:**
```
CATASTROPHIC: Complete system unavailability, data loss, security breach
SEVERE: Major functionality loss, significant performance degradation
MODERATE: Partial functionality loss, degraded user experience
MINOR: Limited impact, graceful degradation, automatic recovery
```

### 4. Scalability Constraint Analysis

**Horizontal Scaling Constraints:**
- **Stateful Components**: Session management, in-memory caches, file system dependencies
- **Database Bottlenecks**: Connection limits, query performance, lock contention
- **Shared Resources**: File systems, message queues, external service rate limits
- **Network Limitations**: Bandwidth, latency, connection pooling, load balancer capacity
- **Configuration Complexity**: Service discovery, configuration management, deployment coordination

**Vertical Scaling Constraints:**
- **CPU Intensive Operations**: Complex calculations, encryption, compression
- **Memory Requirements**: Large datasets, caching strategies, garbage collection
- **I/O Bottlenecks**: Disk operations, network calls, database connections
- **Resource Competition**: Thread pools, connection pools, memory allocation
- **Platform Limitations**: Operating system limits, hardware constraints

### 5. Integration Dependency Analysis

**External Dependencies:**
- **Third-Party Services**: APIs, SaaS platforms, payment processors, authentication providers
- **Infrastructure Services**: Databases, message brokers, caches, monitoring systems
- **Development Dependencies**: Build tools, testing frameworks, deployment pipelines
- **Runtime Dependencies**: Libraries, frameworks, runtime environments
- **Data Dependencies**: External data sources, data feeds, synchronization requirements

**Dependency Risk Assessment:**
```
HIGH RISK: Critical path dependencies with no alternatives
MEDIUM RISK: Important dependencies with fallback options
LOW RISK: Optional dependencies with graceful degradation
```

## Risk Assessment Framework

### Architectural Risk Categories

**CRITICAL RISKS (Score: 9-10)**
- Single points of failure in critical path
- Unrecoverable data loss scenarios
- Security architecture vulnerabilities
- Complete system scalability limits reached
- Irreversible architectural decisions with negative impact

**HIGH RISKS (Score: 7-8)**
- Performance bottlenecks affecting user experience
- Scalability constraints approaching limits
- Integration failures with significant business impact
- Architectural debt requiring major refactoring
- Compliance violations with regulatory requirements

**MEDIUM RISKS (Score: 4-6)**
- Maintainability challenges affecting development velocity
- Performance issues under peak load conditions
- Integration complexity increasing operational overhead
- Technology obsolescence requiring planned migration
- Architectural inconsistencies causing confusion

**LOW RISKS (Score: 1-3)**
- Best practice violations without immediate impact
- Performance optimizations for edge cases
- Documentation gaps in architectural decisions
- Minor inconsistencies in implementation patterns
- Future-proofing considerations for potential changes

### Constraint Impact Analysis

**Business Impact Assessment:**
- **Revenue Impact**: Direct effect on business revenue and customer satisfaction
- **Operational Impact**: Effect on system reliability, maintenance, and support costs
- **Development Impact**: Influence on development velocity, team productivity, and delivery timelines
- **Compliance Impact**: Regulatory, security, and audit requirement implications
- **Strategic Impact**: Alignment with long-term business and technology strategy

**Technical Debt Evaluation:**
```
TECHNICAL DEBT QUADRANT:
- Reckless & Deliberate: Known shortcuts taken for speed
- Reckless & Inadvertent: Poor practices due to lack of knowledge
- Prudent & Deliberate: Conscious trade-offs for business value
- Prudent & Inadvertent: Learning-based improvements identified later
```

## Analysis Execution Framework

### Phase 1: Discovery and Mapping
```
1. Document current architecture using C4 model or similar
2. Create component and service inventory
3. Map data flows and integration points
4. Identify architectural patterns and anti-patterns
5. Catalog external dependencies and constraints
```

### Phase 2: Assessment and Analysis
```
1. Evaluate architectural quality attributes (performance, scalability, reliability)
2. Assess compliance with architectural principles and standards
3. Identify failure modes and recovery mechanisms
4. Analyze scalability limits and bottlenecks
5. Review security architecture and threat model
```

### Phase 3: Risk Evaluation and Prioritization
```
1. Categorize risks by impact and likelihood
2. Assess business and technical consequences
3. Evaluate remediation options and costs
4. Prioritize improvements based on risk-value analysis
5. Create architectural roadmap with milestones
```

## Deliverables and Documentation

### Architecture Assessment Report
```
1. Current State Analysis
   - Architecture overview with visual diagrams
   - Component inventory and responsibility matrix
   - Integration map with dependency analysis
   - Quality attribute assessment

2. Risk and Constraint Analysis
   - Failure point identification with impact assessment
   - Scalability constraint analysis with growth projections
   - Dependency risk evaluation with mitigation strategies
   - Technical debt assessment with remediation priorities

3. Future State Recommendations
   - Architectural improvement roadmap
   - Risk mitigation strategies with timelines
   - Scalability enhancement proposals
   - Integration optimization recommendations
```

### Quality Gates and Success Criteria
- All critical architectural risks identified and assessed
- Scalability constraints documented with growth projections
- Failure modes cataloged with recovery procedures
- Integration dependencies mapped with risk mitigation plans
- Architectural compliance verified against established standards

## Integration with Development Process

**Continuous Architecture Review:**
- Integrate architecture assessment into sprint planning
- Establish architecture decision records (ADRs) for major changes
- Implement automated architecture compliance checking
- Regular architecture review sessions with stakeholders
- Architecture evolution tracking with impact analysis

**Tool Integration:**
- Use `codebase-retrieval` for comprehensive architecture analysis
- Leverage dependency analysis tools for component mapping
- Apply static analysis tools for pattern recognition
- Utilize monitoring tools for runtime behavior analysis
- Integrate with documentation tools for architecture visualization

This template ensures thorough architectural understanding while maintaining focus on practical risk assessment and actionable improvement recommendations.