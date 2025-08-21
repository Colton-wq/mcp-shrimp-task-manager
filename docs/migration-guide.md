# Migration Guide: MCP Shrimp Task Manager v1.x → v2.0.0

**Migration Version**: 1.x → 2.0.0  
**Last Updated**: August 21, 2025  
**Migration Complexity**: Major (Breaking Changes)

## 📋 Migration Overview

This guide provides comprehensive instructions for migrating from MCP Shrimp Task Manager v1.x to v2.0.0. The v2.0.0 release represents a major architectural overhaul with significant breaking changes, new features, and improved reliability.

## 🚨 Critical Breaking Changes

### 1. Real Code Analysis Replacement

**What Changed**:
- Eliminated all simulated data and hardcoded values
- Replaced mock analysis with real TypeScript Compiler API, ESLint, and Jest integration
- Removed fixed complexity calculations and coverage estimates

**Impact**:
- Analysis results will be different and more accurate
- Performance characteristics have changed
- New dependencies on actual development tools

**Migration Action Required**:
```bash
# Install new analysis dependencies
npm install typescript eslint jest @typescript-eslint/parser
npm install sonarjs-api coverage-parser

# Update project configuration
npm run setup:real-analysis
```

### 2. MCP 2025 Standard Compliance

**What Changed**:
- All tool descriptions updated to action-oriented format
- New structured output schemas with JSON validation
- Standard JSON-RPC error codes implementation
- Removed emoji and friendly language from tool descriptions

**Impact**:
- Tool call responses have new structure
- Error handling follows JSON-RPC 2.0 standard
- Client integration may need updates

**Migration Action Required**:
```typescript
// Old v1.x tool call
const result = await callTool('planTask', {
  description: 'Build API'
});

// New v2.0.0 tool call
const result = await callTool('plan_task', {
  description: 'Build REST API for user management with CRUD operations',
  project: 'my-project' // Now required
});
```

### 3. Project Context Requirement

**What Changed**:
- All tools now require explicit project context
- Project isolation and multi-project support
- Project-based data storage and caching

**Impact**:
- All tool calls must specify project parameter
- Data is now organized by project
- Better isolation between different projects

**Migration Action Required**:
```typescript
// Update all tool calls to include project
const tools = [
  'plan_task',
  'analyze_task', 
  'execute_task',
  'verify_task',
  'list_tasks',
  'code_review_and_cleanup_tool'
];

// Add project parameter to all calls
tools.forEach(tool => {
  // Old: callTool(tool, params)
  // New: callTool(tool, { ...params, project: 'your-project-name' })
});
```

## 🔄 Step-by-Step Migration Process

### Phase 1: Environment Preparation

#### 1.1 Backup Current Data
```bash
# Backup existing task data
cp -r ~/.mcp-shrimp-task-manager/data ./backup-v1-data
cp -r ./projects ./backup-v1-projects

# Export current tasks
npm run export:tasks -- --output ./backup-v1-tasks.json
```

#### 1.2 Update Dependencies
```bash
# Update to v2.0.0
npm install @mcp/shrimp-task-manager@2.0.0

# Install new analysis dependencies
npm install typescript@^5.0.0
npm install eslint@^8.0.0
npm install jest@^29.0.0
npm install @typescript-eslint/parser@^6.0.0
```

#### 1.3 Configuration Migration
```bash
# Run automatic configuration migration
npm run migrate:config -- --from-version 1.x

# Verify configuration
npm run verify:config
```

### Phase 2: Data Migration

#### 2.1 Project Structure Migration
```bash
# Create new project structure
npm run migrate:projects -- --source ./backup-v1-data

# Verify project migration
npm run verify:projects
```

#### 2.2 Task Data Migration
```bash
# Migrate task data to new format
npm run migrate:tasks -- --input ./backup-v1-tasks.json

# Update task schemas
npm run update:task-schemas
```

#### 2.3 Analysis Cache Migration
```bash
# Clear old analysis cache (incompatible format)
npm run clear:analysis-cache

# Initialize new cache structure
npm run init:cache
```

### Phase 3: Tool Integration Updates

#### 3.1 Update Tool Calls

**Before (v1.x)**:
```typescript
// Old tool call format
const planResult = await mcp.callTool('planTask', {
  description: 'Build API',
  complexity: 'medium'
});

const analyzeResult = await mcp.callTool('analyzeCode', {
  path: './src'
});
```

**After (v2.0.0)**:
```typescript
// New tool call format
const planResult = await mcp.callTool('plan_task', {
  description: 'Build REST API for user management with CRUD operations, authentication middleware, and PostgreSQL database integration',
  requirements: 'Must support 1000+ concurrent users, follow GDPR compliance',
  project: 'user-management-api' // Required
});

const analyzeResult = await mcp.callTool('code_review_and_cleanup_tool', {
  taskId: planResult.taskId,
  project: 'user-management-api', // Required
  reviewScope: 'comprehensive'
});
```

#### 3.2 Update Error Handling

**Before (v1.x)**:
```typescript
try {
  const result = await mcp.callTool('planTask', params);
} catch (error) {
  console.error('Tool failed:', error.message);
}
```

**After (v2.0.0)**:
```typescript
try {
  const result = await mcp.callTool('plan_task', params);
} catch (error) {
  // Handle JSON-RPC 2.0 errors
  if (error.code === -32602) {
    console.error('Invalid parameters:', error.data.details);
  } else if (error.code === -32603) {
    console.error('Internal error:', error.data.details);
  } else {
    console.error('Unknown error:', error);
  }
}
```

#### 3.3 Update Response Handling

**Before (v1.x)**:
```typescript
// Simple string responses
const result = await mcp.callTool('planTask', params);
console.log(result); // "Task planned successfully"
```

**After (v2.0.0)**:
```typescript
// Structured responses with schemas
const result = await mcp.callTool('plan_task', params);
console.log('Task ID:', result.taskId);
console.log('Complexity:', result.complexity);
console.log('Estimated Effort:', result.estimatedEffort);
console.log('Recommendations:', result.recommendations);
```

### Phase 4: Quality Verification

#### 4.1 Run Migration Tests
```bash
# Run comprehensive migration verification
npm run test:migration

# Verify data integrity
npm run verify:data-integrity

# Check tool functionality
npm run test:tools
```

#### 4.2 Performance Validation
```bash
# Run performance benchmarks
npm run benchmark:performance

# Compare with v1.x baseline
npm run compare:performance -- --baseline ./v1-benchmark.json
```

#### 4.3 Integration Testing
```bash
# Test with actual projects
npm run test:integration -- --project ./test-projects

# Verify real analysis accuracy
npm run verify:analysis-accuracy
```

## 🔧 Configuration Changes

### New Configuration Options

#### Analysis Configuration
```json
{
  "analysis": {
    "realCodeAnalysis": {
      "enabled": true,
      "tools": {
        "typescript": {
          "enabled": true,
          "configPath": "./tsconfig.json"
        },
        "eslint": {
          "enabled": true,
          "configPath": "./.eslintrc.js"
        },
        "jest": {
          "enabled": true,
          "configPath": "./jest.config.js"
        }
      }
    },
    "intelligentAnalysis": {
      "enabled": true,
      "learningEnabled": true,
      "cacheEnabled": true
    }
  }
}
```

#### Project Configuration
```json
{
  "projects": {
    "defaultProject": "main",
    "autoCreate": false,
    "isolation": true,
    "dataPath": "./projects"
  }
}
```

### Removed Configuration Options

- `simulatedAnalysis.*` - All simulation options removed
- `mockData.*` - Mock data configuration removed
- `fixedTemplates.*` - Fixed template options removed
- `legacyMode.*` - Legacy compatibility options removed

## 📊 Feature Mapping

### Tool Name Changes

| v1.x Tool Name | v2.0.0 Tool Name | Status | Notes |
|----------------|------------------|--------|-------|
| `planTask` | `plan_task` | ✅ Migrated | Added project parameter |
| `analyzeTask` | `analyze_task` | ✅ Migrated | Enhanced analysis |
| `executeTask` | `execute_task` | ✅ Migrated | Improved guidance |
| `verifyTask` | `verify_task` | ✅ Migrated | Auto-completion added |
| `listTasks` | `list_tasks` | ✅ Migrated | Project filtering |
| `analyzeCode` | `code_review_and_cleanup_tool` | 🔄 Replaced | Real analysis |
| `generateSuggestions` | *Integrated* | 🔄 Integrated | Part of analysis tools |
| `mockAnalysis` | *Removed* | ❌ Removed | Replaced with real analysis |

### New Features in v2.0.0

- **Real Code Analysis**: Actual TypeScript, ESLint, Jest integration
- **Intelligent Analysis Engine**: Dynamic suggestion generation
- **Authenticity Verification**: Fake implementation detection
- **MCP 2025 Compliance**: Full standard conformance
- **Performance Optimization**: Caching and concurrent processing
- **Project Management**: Multi-project support with isolation

## 🚨 Common Migration Issues

### Issue 1: Tool Call Failures

**Symptom**: Tool calls return `-32602` (Invalid parameters) errors

**Cause**: Missing required `project` parameter

**Solution**:
```typescript
// Add project parameter to all tool calls
const result = await mcp.callTool('plan_task', {
  description: 'Your task description',
  project: 'your-project-name' // Add this
});
```

### Issue 2: Different Analysis Results

**Symptom**: Analysis scores and findings differ significantly from v1.x

**Cause**: Real analysis replaces simulated data

**Solution**: This is expected behavior. v2.0.0 provides accurate analysis based on actual code inspection.

### Issue 3: Performance Changes

**Symptom**: Analysis takes longer than v1.x

**Cause**: Real tool integration requires actual code processing

**Solution**: 
- Enable caching for repeated analyses
- Use batch processing for multiple files
- Consider upgrading hardware for large projects

### Issue 4: Missing Dependencies

**Symptom**: Analysis tools fail with "command not found" errors

**Cause**: Missing TypeScript, ESLint, or Jest installations

**Solution**:
```bash
# Install missing dependencies
npm install -g typescript eslint jest

# Or install locally
npm install typescript eslint jest --save-dev
```

## 🔍 Validation Checklist

### Pre-Migration Checklist

- [ ] Backup all existing data and configuration
- [ ] Document current tool usage patterns
- [ ] Identify custom integrations that need updates
- [ ] Plan downtime for migration process
- [ ] Prepare rollback strategy

### Post-Migration Checklist

- [ ] All tool calls updated with project parameters
- [ ] Error handling updated for JSON-RPC 2.0
- [ ] Response parsing updated for structured outputs
- [ ] Performance benchmarks meet expectations
- [ ] Integration tests pass
- [ ] Real analysis produces reasonable results
- [ ] Project isolation working correctly
- [ ] Cache performance is optimal

### Verification Commands

```bash
# Verify installation
npm run verify:installation

# Check tool functionality
npm run test:tools -- --comprehensive

# Validate data migration
npm run validate:migration

# Performance check
npm run benchmark:quick

# Integration test
npm run test:integration -- --sample-project
```

## 🆘 Rollback Procedure

If migration issues occur, follow this rollback procedure:

### 1. Stop v2.0.0 Service
```bash
npm run stop
```

### 2. Restore v1.x Installation
```bash
# Restore v1.x version
npm install @mcp/shrimp-task-manager@1.x

# Restore configuration
cp ./backup-v1-config/* ~/.mcp-shrimp-task-manager/
```

### 3. Restore Data
```bash
# Restore task data
cp -r ./backup-v1-data/* ~/.mcp-shrimp-task-manager/data/

# Restore projects
cp -r ./backup-v1-projects/* ./projects/
```

### 4. Restart Service
```bash
npm run start
```

## 📞 Support and Resources

### Migration Support

- **Documentation**: [docs.mcp-shrimp.dev/migration](https://docs.mcp-shrimp.dev/migration)
- **Community Forum**: [forum.mcp-shrimp.dev](https://forum.mcp-shrimp.dev)
- **GitHub Issues**: [github.com/mcp-shrimp/task-manager/issues](https://github.com/mcp-shrimp/task-manager/issues)

### Professional Services

For enterprise migrations or complex custom integrations:
- **Migration Consulting**: Available for large-scale deployments
- **Custom Integration Support**: Assistance with tool integrations
- **Training Services**: Team training on v2.0.0 features

## 📚 Related Documentation

- [API Documentation](./api-documentation.md)
- [Architecture Overview](./architecture-overview.md)
- [Real Analysis Architecture](./real-analysis-architecture.md)
- [MCP 2025 Standards Summary](./mcp-2025-standards-summary.md)
- [Troubleshooting Guide](./troubleshooting-guide.md)

---

**Migration Guide Version**: 2.0.0  
**Target Version**: 2.0.0  
**Last Updated**: August 21, 2025  
**Next Review**: November 21, 2025