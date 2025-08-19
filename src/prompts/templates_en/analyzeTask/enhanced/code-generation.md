# Code Generation Template

Execute systematic code generation with comprehensive input validation, monitoring observability, and testability design. This template ensures generated code meets production quality standards with robust error handling and maintainability.

## Code Generation Framework

### 1. Requirements Analysis and Design

**Functional Requirements Specification:**
- **Core Functionality**: Primary business logic and feature requirements
- **Input/Output Specifications**: Data formats, validation rules, transformation logic
- **Business Rules**: Constraints, calculations, workflow requirements
- **Integration Requirements**: External service interactions, API contracts
- **Performance Requirements**: Response time, throughput, resource constraints

**Non-Functional Requirements:**
- **Security Requirements**: Authentication, authorization, data protection, audit trails
- **Reliability Requirements**: Error handling, fault tolerance, recovery mechanisms
- **Scalability Requirements**: Concurrent users, data volume, growth projections
- **Maintainability Requirements**: Code organization, documentation, testing strategy
- **Observability Requirements**: Logging, monitoring, debugging, troubleshooting

**Design Principles Application:**
```
SOLID PRINCIPLES:
- Single Responsibility: Each class/function has one reason to change
- Open/Closed: Open for extension, closed for modification
- Liskov Substitution: Subtypes must be substitutable for base types
- Interface Segregation: Clients shouldn't depend on unused interfaces
- Dependency Inversion: Depend on abstractions, not concretions

ADDITIONAL PRINCIPLES:
- DRY (Don't Repeat Yourself): Eliminate code duplication
- KISS (Keep It Simple, Stupid): Prefer simple solutions
- YAGNI (You Aren't Gonna Need It): Don't implement unused features
- Fail Fast: Detect and report errors as early as possible
```

### 2. Input Validation and Security Framework

**Comprehensive Input Validation:**
- **Data Type Validation**: Type checking, format validation, range verification
- **Business Rule Validation**: Domain-specific constraints, cross-field validation
- **Security Validation**: Injection prevention, XSS protection, CSRF tokens
- **Sanitization**: Input cleaning, encoding, normalization
- **Rate Limiting**: Request throttling, abuse prevention, resource protection

**Validation Implementation Pattern:**
```typescript
// Example validation framework structure
interface ValidationRule<T> {
  validate(value: T): ValidationResult;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

class InputValidator<T> {
  private rules: ValidationRule<T>[] = [];
  
  addRule(rule: ValidationRule<T>): this;
  validate(input: T): ValidationResult;
  validateAsync(input: T): Promise<ValidationResult>;
}
```

**Security-First Code Generation:**
- **Input Sanitization**: Automatic escaping, encoding, validation
- **Output Encoding**: Context-aware output encoding (HTML, JSON, SQL)
- **Authentication Integration**: Token validation, session management
- **Authorization Checks**: Role-based access control, permission verification
- **Audit Logging**: Security event logging, access tracking

### 3. Error Handling and Resilience Patterns

**Error Handling Strategy:**
- **Error Classification**: System errors, business errors, validation errors, external errors
- **Error Propagation**: Exception handling, error codes, result types
- **Error Recovery**: Retry mechanisms, fallback strategies, circuit breakers
- **Error Reporting**: Structured logging, error aggregation, alerting
- **User Experience**: User-friendly error messages, graceful degradation

**Resilience Pattern Implementation:**
```typescript
// Circuit Breaker Pattern Example
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}

// Retry Pattern with Exponential Backoff
class RetryHandler {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

### 4. Observability and Monitoring Integration

**Comprehensive Logging Framework:**
- **Structured Logging**: JSON format, consistent fields, searchable attributes
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL with appropriate usage
- **Contextual Information**: Request IDs, user context, business context
- **Performance Logging**: Execution times, resource usage, bottleneck identification
- **Security Logging**: Authentication events, authorization failures, suspicious activities

**Monitoring and Metrics Integration:**
```typescript
// Metrics Collection Framework
interface MetricsCollector {
  incrementCounter(name: string, tags?: Record<string, string>): void;
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
  recordTimer(name: string, duration: number, tags?: Record<string, string>): void;
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
}

// Distributed Tracing Integration
interface TracingContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage: Record<string, string>;
}

class TracedOperation {
  constructor(
    private operationName: string,
    private tracer: Tracer,
    private parentContext?: TracingContext
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan(this.operationName, this.parentContext);
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

**Health Check and Readiness Probes:**
- **Liveness Checks**: Application responsiveness, critical component status
- **Readiness Checks**: Dependency availability, initialization completion
- **Health Endpoints**: Standardized health check APIs, detailed status reporting
- **Dependency Monitoring**: External service health, database connectivity
- **Resource Monitoring**: Memory usage, CPU utilization, disk space

### 5. Testability and Quality Assurance

**Test-Driven Development Integration:**
- **Unit Test Generation**: Comprehensive test coverage, edge case testing
- **Integration Test Framework**: API testing, database integration, external service mocking
- **Contract Testing**: API contract validation, schema compliance
- **Property-Based Testing**: Automated test case generation, invariant verification
- **Mutation Testing**: Test quality assessment, coverage gap identification

**Testable Code Design Patterns:**
```typescript
// Dependency Injection for Testability
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

interface NotificationService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

class UserService {
  constructor(
    private userRepository: UserRepository,
    private notificationService: NotificationService,
    private logger: Logger
  ) {}
  
  async updateUserEmail(userId: string, newEmail: string): Promise<void> {
    // Implementation with injected dependencies
    // Easily testable with mocks
  }
}

// Factory Pattern for Complex Object Creation
interface ServiceFactory {
  createUserService(): UserService;
  createOrderService(): OrderService;
  createPaymentService(): PaymentService;
}

// Builder Pattern for Test Data Creation
class UserTestDataBuilder {
  private user: Partial<User> = {};
  
  withId(id: string): this {
    this.user.id = id;
    return this;
  }
  
  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }
  
  build(): User {
    return {
      id: this.user.id || 'default-id',
      email: this.user.email || 'test@example.com',
      // ... other required fields with defaults
    } as User;
  }
}
```

## Code Quality and Standards Framework

### Code Organization and Structure

**Modular Architecture:**
- **Layer Separation**: Presentation, business logic, data access layers
- **Module Boundaries**: Clear interfaces, minimal coupling, high cohesion
- **Package Organization**: Feature-based or layer-based packaging
- **Dependency Management**: Explicit dependencies, circular dependency prevention
- **Configuration Management**: Environment-specific configuration, secret management

**Coding Standards Compliance:**
```
NAMING CONVENTIONS:
- Classes: PascalCase (UserService, OrderProcessor)
- Methods/Functions: camelCase (getUserById, processOrder)
- Constants: UPPER_SNAKE_CASE (MAX_RETRY_ATTEMPTS, DEFAULT_TIMEOUT)
- Variables: camelCase (userId, orderTotal)

CODE FORMATTING:
- Consistent indentation (2 or 4 spaces)
- Line length limits (80-120 characters)
- Consistent bracket placement
- Proper spacing around operators

DOCUMENTATION STANDARDS:
- JSDoc/TSDoc for public APIs
- Inline comments for complex logic
- README files for modules
- Architecture decision records (ADRs)
```

### Performance and Optimization

**Performance-Conscious Code Generation:**
- **Algorithm Efficiency**: Optimal time and space complexity
- **Resource Management**: Memory allocation, connection pooling, resource cleanup
- **Caching Strategy**: Appropriate caching levels, cache invalidation
- **Lazy Loading**: Deferred initialization, on-demand resource loading
- **Batch Processing**: Efficient bulk operations, reduced I/O overhead

**Optimization Patterns:**
```typescript
// Memoization for Expensive Calculations
class MemoizedCalculator {
  private cache = new Map<string, number>();
  
  expensiveCalculation(input: string): number {
    if (this.cache.has(input)) {
      return this.cache.get(input)!;
    }
    
    const result = this.performCalculation(input);
    this.cache.set(input, result);
    return result;
  }
}

// Object Pool for Resource Management
class ConnectionPool {
  private available: Connection[] = [];
  private inUse = new Set<Connection>();
  
  async acquire(): Promise<Connection> {
    if (this.available.length > 0) {
      const connection = this.available.pop()!;
      this.inUse.add(connection);
      return connection;
    }
    
    const connection = await this.createConnection();
    this.inUse.add(connection);
    return connection;
  }
  
  release(connection: Connection): void {
    this.inUse.delete(connection);
    this.available.push(connection);
  }
}
```

## Risk Assessment and Mitigation

### Code Generation Risk Categories

**CRITICAL RISKS (Score: 9-10)**
- Security vulnerabilities in generated code
- Data corruption or loss due to code defects
- Performance issues causing system unavailability
- Incorrect business logic implementation
- Integration failures with critical systems

**HIGH RISKS (Score: 7-8)**
- Maintainability issues affecting development velocity
- Scalability limitations under expected load
- Error handling gaps causing poor user experience
- Testing coverage gaps reducing confidence
- Documentation deficiencies impacting support

**MEDIUM RISKS (Score: 4-6)**
- Code quality issues affecting long-term maintenance
- Performance suboptimization increasing operational costs
- Monitoring gaps reducing operational visibility
- Configuration management complexity
- Dependency management challenges

**LOW RISKS (Score: 1-3)**
- Code style inconsistencies
- Minor performance optimizations
- Documentation formatting issues
- Non-critical feature edge cases
- Future-proofing considerations

### Quality Assurance Framework

**Automated Quality Gates:**
- **Static Code Analysis**: Code quality metrics, security vulnerability scanning
- **Unit Test Coverage**: Minimum coverage thresholds, critical path coverage
- **Integration Testing**: API contract validation, database integration testing
- **Performance Testing**: Load testing, memory leak detection
- **Security Testing**: Vulnerability scanning, penetration testing

**Manual Review Process:**
- **Code Review Checklist**: Security, performance, maintainability, testability
- **Architecture Review**: Design pattern compliance, integration assessment
- **Business Logic Review**: Requirement compliance, edge case handling
- **Documentation Review**: Completeness, accuracy, maintainability
- **Deployment Review**: Configuration, monitoring, rollback procedures

## Deliverables and Documentation

### Code Generation Output Structure
```
1. Generated Code Modules
   - Core business logic implementation
   - Input validation and security layers
   - Error handling and resilience components
   - Monitoring and observability integration
   - Comprehensive test suites

2. Documentation Package
   - API documentation with examples
   - Architecture and design decisions
   - Deployment and configuration guides
   - Troubleshooting and maintenance procedures
   - Performance and scalability considerations

3. Quality Assurance Reports
   - Code quality metrics and analysis
   - Security assessment and recommendations
   - Performance testing results
   - Test coverage analysis
   - Compliance verification reports
```

### Success Criteria and Validation
- All functional requirements implemented and tested
- Security requirements met with vulnerability assessment
- Performance requirements validated through testing
- Code quality standards compliance verified
- Comprehensive documentation and runbooks provided

## Integration with Development Ecosystem

**CI/CD Pipeline Integration:**
- Automated code generation triggers
- Quality gate enforcement
- Automated testing and validation
- Security scanning and compliance checking
- Deployment automation with rollback capabilities

**Tool Integration:**
- Use `codebase-retrieval` for existing pattern analysis
- Leverage code generation frameworks and templates
- Apply static analysis tools for quality assurance
- Integrate with monitoring and observability platforms
- Utilize testing frameworks for comprehensive validation

This template ensures high-quality code generation while maintaining focus on security, observability, and maintainability throughout the development lifecycle.