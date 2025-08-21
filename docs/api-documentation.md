# MCP Shrimp Task Manager - API Documentation

**Version**: 2.0.0  
**Last Updated**: August 21, 2025  
**MCP Protocol**: 2025-06-18 Standard Compliant

## 📋 Overview

This document provides comprehensive API documentation for the MCP Shrimp Task Manager, reflecting the latest system architecture after the major refactoring to implement real code analysis, intelligent analysis systems, and MCP 2025 standard compliance.

## 🎯 Key Changes in v2.0.0

### Major Architectural Updates
1. **Real Code Analysis System**: Replaced simulated data with actual TypeScript Compiler API, ESLint, and Jest integration
2. **Intelligent Analysis Engine**: Implemented dynamic analysis replacing fixed template responses
3. **MCP 2025 Compliance**: All tools now conform to the latest MCP standard requirements
4. **Enhanced Quality Verification**: Added comprehensive authenticity verification framework
5. **Performance Optimization**: Implemented caching, batch processing, and concurrent analysis

### Breaking Changes
- Removed all hardcoded analysis values
- Updated tool descriptions to action-oriented format
- Enhanced error handling with standard JSON-RPC codes
- Restructured output schemas for better validation

## 🛠️ Core Tools API

### Task Management Tools

#### `plan_task`
**Description**: Analyze complex programming tasks and generate structured implementation plans.

**Parameters**:
```typescript
{
  description: string;        // Required: Complete task description (min 10 chars)
  requirements?: string;      // Optional: Technical requirements
  existingTasksReference?: boolean; // Optional: Reference existing tasks (default: false)
  project: string;           // Required: Target project name
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "taskId": { "type": "string", "format": "uuid" },
    "complexity": { "type": "string", "enum": ["simple", "medium", "complex"] },
    "estimatedEffort": { "type": "string" },
    "technicalApproach": { "type": "string" },
    "riskAssessment": {
      "type": "object",
      "properties": {
        "level": { "type": "string", "enum": ["low", "medium", "high"] },
        "factors": { "type": "array", "items": { "type": "string" } }
      }
    },
    "dependencies": { "type": "array", "items": { "type": "string" } },
    "recommendations": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["taskId", "complexity", "estimatedEffort", "technicalApproach"]
}
```

**Error Codes**:
- `-32602`: Invalid parameters (description too short, missing project)
- `-32603`: Internal analysis error
- `-32000`: Project not found or inaccessible

**Tool Call Example**:
```json
{
  "name": "plan_task",
  "arguments": {
    "description": "Build REST API for user management with CRUD operations, authentication middleware, and PostgreSQL database integration",
    "requirements": "Must support 1000+ concurrent users, follow GDPR compliance",
    "project": "user-management-api"
  }
}
```

#### `analyze_task`
**Description**: Perform deep technical analysis of task requirements and assess technical feasibility.

**Parameters**:
```typescript
{
  summary: string;           // Required: Task summary (min 10 chars)
  initialConcept: string;    // Required: Preliminary solution concept (min 50 chars)
  previousAnalysis?: string; // Optional: Previous analysis results
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "analysisId": { "type": "string", "format": "uuid" },
    "technicalFeasibility": {
      "type": "object",
      "properties": {
        "score": { "type": "number", "minimum": 0, "maximum": 100 },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "blockers": { "type": "array", "items": { "type": "string" } }
      }
    },
    "architecturalRecommendations": { "type": "array", "items": { "type": "string" } },
    "performanceConsiderations": { "type": "array", "items": { "type": "string" } },
    "securityImplications": { "type": "array", "items": { "type": "string" } },
    "implementationStrategy": { "type": "string" }
  },
  "required": ["analysisId", "technicalFeasibility", "implementationStrategy"]
}
```

#### `execute_task`
**Description**: Retrieve instructional guidance for specific task execution with step-by-step implementation instructions.

**Parameters**:
```typescript
{
  taskId: string;    // Required: UUID v4 format task identifier
  project: string;   // Required: Target project context
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "executionPlan": {
      "type": "object",
      "properties": {
        "steps": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "order": { "type": "number" },
              "description": { "type": "string" },
              "estimatedTime": { "type": "string" },
              "requiredSkills": { "type": "array", "items": { "type": "string" } },
              "verification": { "type": "string" }
            }
          }
        },
        "codeExamples": { "type": "array", "items": { "type": "string" } },
        "testingStrategy": { "type": "string" },
        "qualityChecks": { "type": "array", "items": { "type": "string" } }
      }
    },
    "resources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["documentation", "tutorial", "tool", "library"] },
          "title": { "type": "string" },
          "url": { "type": "string", "format": "uri" },
          "relevance": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    }
  },
  "required": ["executionPlan"]
}
```

#### `verify_task`
**Description**: Verify and score task completion according to verification criteria with automatic completion for high scores.

**Parameters**:
```typescript
{
  taskId: string;     // Required: UUID v4 format task identifier
  summary: string;    // Required: Completion summary (min 30 chars)
  score: number;      // Required: Quality score 0-100
  project: string;    // Required: Target project context
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "verificationResult": {
      "type": "object",
      "properties": {
        "passed": { "type": "boolean" },
        "score": { "type": "number", "minimum": 0, "maximum": 100 },
        "autoCompleted": { "type": "boolean" },
        "qualityGates": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "passed": { "type": "boolean" },
              "score": { "type": "number" },
              "details": { "type": "string" }
            }
          }
        },
        "recommendations": { "type": "array", "items": { "type": "string" } }
      }
    },
    "nextSteps": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["verificationResult"]
}
```

### Intelligence and Analysis Tools

#### `code_review_and_cleanup_tool`
**Description**: Execute comprehensive code quality review and project cleanup operations with integrated analysis workflow.

**Parameters**:
```typescript
{
  taskId: string;              // Required: UUID v4 format task identifier
  project: string;             // Required: Target project context
  reviewScope?: string;        // Optional: "comprehensive" | "diagnostic" | "security_only" | "quality_only"
  cleanupMode?: string;        // Optional: "safe" | "aggressive" | "analysis_only"
  targetFiles?: string[];      // Optional: Specific files to review
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "qualityAssessment": {
      "type": "object",
      "properties": {
        "overallScore": { "type": "number", "minimum": 0, "maximum": 100 },
        "codeQuality": { "type": "number", "minimum": 0, "maximum": 100 },
        "testCoverage": { "type": "number", "minimum": 0, "maximum": 100 },
        "securityScore": { "type": "number", "minimum": 0, "maximum": 100 },
        "maintainabilityIndex": { "type": "number", "minimum": 0, "maximum": 100 }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["error", "warning", "info", "suggestion"] },
          "severity": { "type": "string", "enum": ["critical", "high", "medium", "low"] },
          "category": { "type": "string" },
          "description": { "type": "string" },
          "file": { "type": "string" },
          "line": { "type": "number" },
          "rule": { "type": "string" }
        }
      }
    },
    "cleanupSummary": {
      "type": "object",
      "properties": {
        "filesAnalyzed": { "type": "number" },
        "filesModified": { "type": "number" },
        "issuesFixed": { "type": "number" },
        "temporaryFilesRemoved": { "type": "number" }
      }
    },
    "recommendations": { "type": "array", "items": { "type": "string" } },
    "nextWorkflowStep": { "type": "string" }
  },
  "required": ["qualityAssessment", "findings", "cleanupSummary"]
}
```

### Cognitive and Research Tools

#### `process_thought`
**Description**: Conduct flexible and evolvable thinking processes with progressive understanding and solution generation.

**Parameters**:
```typescript
{
  thought: string;                    // Required: Current thinking step (min 1 char)
  thought_number: number;             // Required: Current thought number (min 1)
  total_thoughts: number;             // Required: Estimated total thoughts needed (min 1)
  next_thought_needed: boolean;       // Required: Whether another thought step is needed
  stage: string;                      // Required: Thinking stage
  tags?: string[];                    // Optional: Thought tags
  assumptions_challenged?: string[];   // Optional: Challenged assumptions
  axioms_used?: string[];             // Optional: Used axioms
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "thoughtProcessing": {
      "type": "object",
      "properties": {
        "processed": { "type": "boolean" },
        "stage": { "type": "string" },
        "progress": { "type": "number", "minimum": 0, "maximum": 1 },
        "insights": { "type": "array", "items": { "type": "string" } },
        "connections": { "type": "array", "items": { "type": "string" } }
      }
    },
    "nextThoughtGuidance": {
      "type": "object",
      "properties": {
        "suggestedDirection": { "type": "string" },
        "questionsToExplore": { "type": "array", "items": { "type": "string" } },
        "potentialBranches": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "required": ["thoughtProcessing"]
}
```

## 🔧 Project Management Tools

### Project Context Management

#### `switch_project`
**Description**: Switch active project context with intelligent naming and conflict detection.

**Parameters**:
```typescript
{
  project: string;           // Required: Project name to switch to (min 1 char)
  autoCreate?: boolean;      // Optional: Auto-create if project doesn't exist (default: false)
  checkConflicts?: boolean;  // Optional: Check naming conflicts (default: true)
}
```

#### `list_projects`
**Description**: List available projects by scanning data directory parents.

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "path": { "type": "string" },
          "lastModified": { "type": "string", "format": "date-time" },
          "taskCount": { "type": "number" },
          "status": { "type": "string", "enum": ["active", "inactive", "archived"] }
        }
      }
    },
    "currentProject": { "type": "string" }
  },
  "required": ["projects"]
}
```

## 🚀 Integration and Deployment

### Real Code Analysis Integration

The system now integrates with actual code analysis tools:

- **TypeScript Compiler API**: For syntax analysis and type checking
- **ESLint**: For code quality and style analysis  
- **Jest**: For test coverage analysis
- **SonarJS**: For security vulnerability detection

### Performance Characteristics

- **Analysis Speed**: 1-5 seconds for small projects (<100 files)
- **Memory Usage**: <100MB for typical analysis operations
- **Concurrent Operations**: Supports up to 10 parallel analyses
- **Cache Efficiency**: 2-5x speedup for repeated analyses

### Error Handling Standards

All tools follow JSON-RPC 2.0 error handling:

```json
{
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": {
      "details": "Specific error description",
      "timestamp": "2025-08-21T10:30:00Z",
      "requestId": "uuid-v4-string"
    }
  }
}
```

## 📊 Quality Metrics and Monitoring

### Authenticity Verification

The system includes built-in authenticity verification:

- **Input Sensitivity Testing**: Verifies outputs change with input variations
- **Real Project Validation**: Uses actual projects for accuracy verification  
- **Logic Consistency Checks**: Ensures scoring aligns with findings
- **Template Detection**: Identifies fixed template responses

### Performance Monitoring

Key performance indicators tracked:

- **Analysis Accuracy**: Comparison with known project characteristics
- **Response Time**: Tool execution duration monitoring
- **Memory Efficiency**: Resource usage tracking
- **Error Rates**: Failure rate analysis and trending

## 🔐 Security and Compliance

### MCP 2025 Standard Compliance

All tools implement:

- **Action-Oriented Descriptions**: Tool descriptions start with action verbs
- **Structured Output Schemas**: JSON Schema validation for all responses
- **Standard Error Codes**: JSON-RPC compliant error handling
- **Resource Indicators**: Proper resource identification and linking

### Security Features

- **Input Validation**: Zod schema validation for all inputs
- **Path Sanitization**: Secure file path handling
- **Rate Limiting**: Protection against excessive requests
- **Access Control**: Project-based permission management

## 📚 Migration Guide

### Upgrading from v1.x

1. **Update Tool Calls**: New parameter requirements for project context
2. **Handle New Output Formats**: Structured schemas replace simple strings
3. **Error Handling**: Update to handle new JSON-RPC error codes
4. **Performance Expectations**: Improved but different timing characteristics

### Backward Compatibility

- **Deprecated Features**: Legacy tool signatures supported until v3.0
- **Migration Warnings**: System provides upgrade guidance
- **Gradual Migration**: Tools can be upgraded incrementally

## 🔗 Related Documentation

- [Architecture Overview](./architecture-overview.md)
- [Migration Guide](./migration-guide.md)
- [MCP 2025 Standards Summary](./mcp-2025-standards-summary.md)
- [Real Analysis Architecture](./real-analysis-architecture.md)

---

**Document Version**: 2.0.0  
**API Version**: 2.0.0  
**MCP Protocol**: 2025-06-18  
**Last Updated**: August 21, 2025