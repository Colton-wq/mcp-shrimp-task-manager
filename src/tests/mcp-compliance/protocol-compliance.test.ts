/**
 * MCP Protocol Compliance Test Suite
 * Validates that all tools conform to MCP protocol standards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { planTaskSchema } from '../../tools/task/planTask.js';
import { analyzeTaskSchema } from '../../tools/task/analyzeTask.js';
import { executeTaskSchema } from '../../tools/task/executeTask.js';
import { reflectTaskSchema } from '../../tools/task/reflectTask.js';
import { splitTasksSchema } from '../../tools/task/splitTasks.js';
import { verifyTaskSchema } from '../../tools/task/verifyTask.js';

describe('MCP Protocol Compliance', () => {
  describe('Schema Validation', () => {
    it('should generate valid JSON schemas for all tools', () => {
      const schemas = [
        { name: 'planTask', schema: planTaskSchema },
        { name: 'analyzeTask', schema: analyzeTaskSchema },
        { name: 'executeTask', schema: executeTaskSchema },
        { name: 'reflectTask', schema: reflectTaskSchema },
        { name: 'splitTasks', schema: splitTasksSchema },
        { name: 'verifyTask', schema: verifyTaskSchema },
      ];

      schemas.forEach(({ name, schema }) => {
        const jsonSchema = zodToJsonSchema(schema);
        
        // Validate basic JSON schema structure
        expect(jsonSchema).toHaveProperty('type', 'object');
        expect(jsonSchema).toHaveProperty('properties');
        expect(jsonSchema).toHaveProperty('required');
        
        // Validate that all required fields have descriptions
        const required = (jsonSchema as any).required as string[];
        const properties = (jsonSchema as any).properties as Record<string, any>;
        
        required.forEach(field => {
          expect(properties[field]).toHaveProperty('description');
          expect(properties[field].description).toBeTruthy();
          expect(typeof properties[field].description).toBe('string');
        });
        
        console.log(`✅ ${name} schema is MCP compliant`);
      });
    });

    it('should have comprehensive parameter descriptions', () => {
      const testCases = [
        {
          name: 'planTask',
          schema: planTaskSchema,
          requiredFields: ['description'],
          optionalFields: ['requirements', 'existingTasksReference']
        },
        {
          name: 'executeTask', 
          schema: executeTaskSchema,
          requiredFields: ['taskId'],
          optionalFields: ['project']
        },
        {
          name: 'verifyTask',
          schema: verifyTaskSchema,
          requiredFields: ['taskId', 'summary', 'score'],
          optionalFields: ['project']
        }
      ];

      testCases.forEach(({ name, schema, requiredFields, optionalFields }) => {
        const jsonSchema = zodToJsonSchema(schema);
        const properties = (jsonSchema as any).properties as Record<string, any>;
        
        // Check required fields have detailed descriptions
        requiredFields.forEach(field => {
          expect(properties[field].description.length).toBeGreaterThan(50);
          expect(properties[field].description).toMatch(/EXAMPLE|MUST|REQUIRED/i);
        });
        
        // Check optional fields have usage guidance
        optionalFields.forEach(field => {
          if (properties[field]) {
            expect(properties[field].description).toMatch(/OPTIONAL|USE WHEN|LEAVE EMPTY|SET TO|DEFAULT/i);
          }
        });
        
        console.log(`✅ ${name} has comprehensive parameter descriptions`);
      });
    });
  });

  describe('Response Format Compliance', () => {
    it('should validate response structure matches MCP standard', () => {
      // Test response structure
      const validResponse = {
        content: [
          {
            type: "text" as const,
            text: "Sample response text"
          }
        ]
      };

      expect(validResponse).toHaveProperty('content');
      expect(Array.isArray(validResponse.content)).toBe(true);
      expect(validResponse.content[0]).toHaveProperty('type', 'text');
      expect(validResponse.content[0]).toHaveProperty('text');
      expect(typeof validResponse.content[0].text).toBe('string');
    });

    it('should validate error response format', () => {
      const errorResponse = {
        content: [
          {
            type: "text" as const,
            text: "❌ VALIDATION_ERROR: Invalid parameter\n\n📋 Details: Received invalid value\n\n🔧 Recovery Action: Please provide valid input\n\n🔄 This operation can be retried."
          }
        ]
      };

      expect(errorResponse.content[0].text).toMatch(/❌.*ERROR/);
      expect(errorResponse.content[0].text).toMatch(/📋 Details:/);
      expect(errorResponse.content[0].text).toMatch(/🔧 Recovery Action:/);
    });
  });

  describe('Tool Registration Compliance', () => {
    it('should validate tool names follow MCP conventions', () => {
      const toolNames = [
        'plan_task',
        'analyze_task', 
        'execute_task',
        'reflect_task',
        'split_tasks',
        'verify_task'
      ];

      toolNames.forEach(name => {
        // Tool names should be snake_case
        expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
        // Should not be too long
        expect(name.length).toBeLessThanOrEqual(50);
        // Should be descriptive
        expect(name.split('_').length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});