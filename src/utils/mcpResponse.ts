/**
 * MCP Response Utilities
 * Standardized response formatting for MCP protocol compliance
 */

// MCP Response Types
export interface MCPTextContent {
  type: "text";
  text: string;
}

export interface MCPResponse {
  content: MCPTextContent[];
}

// Error Types for standardized error handling
export enum MCPErrorType {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND", 
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DEPENDENCY_ERROR = "DEPENDENCY_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
}

export interface MCPError {
  type: MCPErrorType;
  message: string;
  details?: string;
  recoveryAction?: string;
  retryable?: boolean;
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(text: string): MCPResponse {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
  };
}

/**
 * Create standardized error response with recovery guidance
 */
export function createErrorResponse(error: MCPError): MCPResponse {
  const errorMessage = formatErrorMessage(error);
  
  return {
    content: [
      {
        type: "text" as const,
        text: errorMessage,
      },
    ],
  };
}

/**
 * Format error message with structured information
 */
function formatErrorMessage(error: MCPError): string {
  let message = `❌ ${error.type}: ${error.message}`;
  
  if (error.details) {
    message += `\n\n📋 Details: ${error.details}`;
  }
  
  if (error.recoveryAction) {
    message += `\n\n🔧 Recovery Action: ${error.recoveryAction}`;
  }
  
  if (error.retryable) {
    message += `\n\n🔄 This operation can be retried.`;
  }
  
  return message;
}

/**
 * Create validation error response
 */
export function createValidationError(
  field: string,
  value: any,
  requirement: string,
  example?: string
): MCPResponse {
  const error: MCPError = {
    type: MCPErrorType.VALIDATION_ERROR,
    message: `Invalid ${field}: ${requirement}`,
    details: `Received: ${JSON.stringify(value)}`,
    recoveryAction: example ? `Example: ${example}` : `Please provide valid ${field}`,
    retryable: true,
  };
  
  return createErrorResponse(error);
}

/**
 * Create not found error response
 */
export function createNotFoundError(
  resource: string,
  identifier: string,
  suggestion?: string
): MCPResponse {
  const error: MCPError = {
    type: MCPErrorType.NOT_FOUND,
    message: `${resource} not found`,
    details: `Identifier: ${identifier}`,
    recoveryAction: suggestion || `Please verify the ${resource} identifier and try again`,
    retryable: true,
  };
  
  return createErrorResponse(error);
}

/**
 * Create dependency error response
 */
export function createDependencyError(
  taskId: string,
  missingDependencies: string[]
): MCPResponse {
  const error: MCPError = {
    type: MCPErrorType.DEPENDENCY_ERROR,
    message: `Task has unmet dependencies`,
    details: `Task ${taskId} requires: ${missingDependencies.join(", ")}`,
    recoveryAction: `Complete the required dependencies first: ${missingDependencies.join(", ")}`,
    retryable: true,
  };
  
  return createErrorResponse(error);
}

/**
 * Create internal error response
 */
export function createInternalError(
  operation: string,
  originalError: Error
): MCPResponse {
  const error: MCPError = {
    type: MCPErrorType.INTERNAL_ERROR,
    message: `Internal error during ${operation}`,
    details: originalError.message,
    recoveryAction: "Please try again. If the problem persists, check system logs.",
    retryable: true,
  };
  
  return createErrorResponse(error);
}

/**
 * Create response with status tracking
 */
export function createStatusResponse(
  operation: string,
  status: "started" | "in_progress" | "completed" | "failed",
  details?: string,
  progress?: number
): MCPResponse {
  let statusIcon = "";
  switch (status) {
    case "started":
      statusIcon = "🚀";
      break;
    case "in_progress":
      statusIcon = "⏳";
      break;
    case "completed":
      statusIcon = "✅";
      break;
    case "failed":
      statusIcon = "❌";
      break;
  }
  
  let message = `${statusIcon} ${operation}: ${status.toUpperCase()}`;
  
  if (progress !== undefined) {
    message += ` (${Math.round(progress)}%)`;
  }
  
  if (details) {
    message += `\n\n${details}`;
  }
  
  return createSuccessResponse(message);
}

/**
 * Wrap async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: string,
  asyncFn: () => Promise<T>
): Promise<MCPResponse | T> {
  try {
    return await asyncFn();
  } catch (error) {
    return createInternalError(operation, error instanceof Error ? error : new Error(String(error)));
  }
}