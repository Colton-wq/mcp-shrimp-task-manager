# Enhanced Analysis Templates Overview

This directory contains five specialized analysis templates designed to provide comprehensive, risk-aware analysis for different types of technical challenges. Each template includes risk assessment frameworks, boundary condition handling, and worst-case scenario planning.

## Available Templates

### 1. Deep Code Analysis Template (`deep-code-analysis.md`)
**Purpose**: Comprehensive code analysis with security, performance, and maintainability focus
**Use Cases**: Security vulnerability assessment, code quality evaluation, performance bottleneck detection
**Key Features**:
- Security vulnerability assessment with CVSS scoring
- Performance bottleneck detection and optimization
- Code quality and maintainability evaluation
- Risk categorization (Critical/High/Medium/Low)
- Automated and manual analysis integration

### 2. Architecture Understanding Template (`architecture-understanding.md`)
**Purpose**: Systematic analysis of system architecture and structural patterns
**Use Cases**: Architecture review, scalability assessment, integration analysis
**Key Features**:
- Component and dependency mapping
- Architectural pattern recognition and compliance
- Failure point and SPOF analysis
- Scalability constraint evaluation
- Integration dependency risk assessment

### 3. Problem Diagnosis Template (`problem-diagnosis.md`)
**Purpose**: Structured problem diagnosis with root cause analysis
**Use Cases**: Issue investigation, incident response, troubleshooting
**Key Features**:
- 5 Whys and Fishbone diagram analysis
- Impact assessment matrix
- Evidence collection and correlation
- Recovery and mitigation planning
- Escalation and contingency procedures

### 4. Performance Analysis Template (`performance-analysis.md`)
**Purpose**: Comprehensive performance analysis and optimization
**Use Cases**: Performance optimization, capacity planning, load testing
**Key Features**:
- Performance baseline establishment
- Resource consumption analysis
- Scalability testing framework
- Performance degradation pattern analysis
- Capacity planning and forecasting

### 5. Code Generation Template (`code-generation.md`)
**Purpose**: Systematic code generation with quality and observability focus
**Use Cases**: Feature development, implementation planning, code creation
**Key Features**:
- Input validation and security framework
- Error handling and resilience patterns
- Observability and monitoring integration
- Testability and quality assurance
- Performance-conscious code generation

## Template Selection Guide

### Automatic Selection Keywords

**Deep Code Analysis**: security, vulnerability, code review, performance, optimization, bugs
**Architecture Understanding**: architecture, design, integration, scalability, system, structure
**Problem Diagnosis**: problem, issue, bug, error, failure, incident, troubleshoot
**Performance Analysis**: performance, load, capacity, scaling, optimization, bottleneck
**Code Generation**: implement, create, develop, build, generate, feature

### Multi-Template Analysis Strategy

For complex requirements, templates can be used in combination:

1. **Start with Architecture Understanding** for system context
2. **Apply Deep Code Analysis** for security and quality assessment
3. **Use Problem Diagnosis** for specific issue investigation
4. **Apply Performance Analysis** for optimization planning
5. **Use Code Generation** for implementation guidance

## Risk Assessment Framework

All templates include standardized risk assessment:

**CRITICAL (Score: 9-10)**: Immediate system threats, data loss, security breaches
**HIGH (Score: 7-8)**: Significant impact on operations, user experience, or security
**MEDIUM (Score: 4-6)**: Moderate impact requiring planned remediation
**LOW (Score: 1-3)**: Best practice improvements with minimal immediate impact

## Quality Gates

Each template ensures:
- Comprehensive risk identification and assessment
- Actionable recommendations with priority ranking
- Implementation guidance with effort estimation
- Monitoring and validation procedures
- Documentation and knowledge transfer

## Integration with MCP Tools

Templates are designed to work with:
- `codebase-retrieval` for comprehensive code examination
- `search_code_desktop-commander` for pattern analysis
- `force_search_protocol` for external validation
- Desktop Commander tools for file operations
- Existing analysis and planning workflows

## Usage Instructions

1. **Automatic Selection**: Let the system choose based on task description
2. **Manual Selection**: Specify analysis type in task parameters
3. **Sequential Analysis**: Use multiple templates for comprehensive assessment
4. **Custom Focus**: Combine template sections for specific requirements

These templates ensure thorough analysis while maintaining focus on practical, actionable insights and risk-based prioritization.