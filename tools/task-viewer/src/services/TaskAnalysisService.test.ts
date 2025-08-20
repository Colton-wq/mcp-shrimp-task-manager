import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskAnalysisService } from './TaskAnalysisService';
import { Task, AnalysisErrorType } from '../types/analysis';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('TaskAnalysisService', () => {
  let service: TaskAnalysisService;
  let mockTask: Task;

  beforeEach(() => {
    service = new TaskAnalysisService();
    mockTask = {
      id: 'test-task-1',
      name: 'Test Task',
      description: 'A test task for analysis',
      status: 'pending',
      dependencies: ['task-2', 'task-3'],
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeComplexity', () => {
    it('should analyze task complexity successfully', async () => {
      // Mock successful API response
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            score: 7,
            factors: [
              {
                name: 'Technical Difficulty',
                score: 8,
                description: 'High technical complexity',
                weight: 0.4,
              },
              {
                name: 'Dependencies',
                score: 6,
                description: 'Multiple dependencies',
                weight: 0.3,
              },
            ],
            estimatedHours: 16,
            confidence: 0.8,
            reasoning: 'Task involves complex technical implementation',
            recommendations: [
              'Break down into smaller subtasks',
              'Consider pair programming',
            ],
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await service.analyzeComplexity(mockTask);

      expect(result.score).toBe(7);
      expect(result.factors).toHaveLength(2);
      expect(result.estimatedHours).toBe(16);
      expect(result.confidence).toBe(0.8);
      expect(result.recommendations).toHaveLength(2);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error',
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(service.analyzeComplexity(mockTask))
        .rejects
        .toThrow('API request failed: Internal Server Error');
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.analyzeComplexity(mockTask))
        .rejects
        .toThrow('Analysis processing failed: Network error');
    });

    it('should use cache when available', async () => {
      // First call - should make API request
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            score: 5,
            factors: [],
            estimatedHours: 8,
            confidence: 0.7,
            reasoning: 'Cached result',
            recommendations: [],
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result1 = await service.analyzeComplexity(mockTask);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.analyzeComplexity(mockTask);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional API call
      expect(result2.score).toBe(result1.score);
    });
  });

  describe('identifyBoundaries', () => {
    it('should identify task boundaries successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            functionalBoundaries: ['User authentication', 'Data validation'],
            interfaceBoundaries: ['REST API', 'Database interface'],
            dataBoundaries: ['User data', 'System configuration'],
            responsibilityBoundaries: ['Frontend logic', 'Backend processing'],
            minimalDeliverable: 'Basic user login functionality',
            splitSuggestions: [
              {
                name: 'Authentication Module',
                description: 'Handle user login and session management',
                priority: 'high',
              },
            ],
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await service.identifyBoundaries(mockTask);

      expect(result.functionalBoundaries).toHaveLength(2);
      expect(result.interfaceBoundaries).toHaveLength(2);
      expect(result.splitSuggestions).toHaveLength(1);
      expect(result.splitSuggestions[0].priority).toBe('high');
    });
  });

  describe('assessRisks', () => {
    it('should assess task risks successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            overallRiskScore: 6,
            riskFactors: [
              {
                type: 'technical',
                description: 'Complex integration requirements',
                probability: 0.7,
                impact: 8,
                mitigation: 'Conduct proof of concept',
              },
            ],
            criticalRisks: ['Integration complexity'],
            mitigationPlan: [
              'Create detailed technical specification',
              'Implement incremental integration',
            ],
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await service.assessRisks(mockTask);

      expect(result.overallRiskScore).toBe(6);
      expect(result.riskFactors).toHaveLength(1);
      expect(result.riskFactors[0].type).toBe('technical');
      expect(result.criticalRisks).toHaveLength(1);
      expect(result.mitigationPlan).toHaveLength(2);
    });
  });

  describe('template management', () => {
    it('should return all built-in templates', () => {
      const templates = service.getTemplates();
      
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.category)).toEqual(
        expect.arrayContaining(['complexity', 'boundary', 'risk'])
      );
    });

    it('should get specific template by id', () => {
      const template = service.getTemplate('complexity-default');
      
      expect(template).toBeDefined();
      expect(template?.category).toBe('complexity');
      expect(template?.builtin).toBe(true);
    });

    it('should return undefined for non-existent template', () => {
      const template = service.getTemplate('non-existent');
      
      expect(template).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('should clear cache successfully', () => {
      service.clearCache();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('taskAnalysisCache');
    });

    it('should return cache statistics', () => {
      const stats = service.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should throw error for missing template', async () => {
      // Create service instance without built-in templates
      const emptyService = new TaskAnalysisService();
      emptyService['templates'].clear();

      await expect(emptyService.analyzeComplexity(mockTask))
        .rejects
        .toThrow('Default complexity template not found');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: 'invalid json structure',
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(service.analyzeComplexity(mockTask))
        .rejects
        .toThrow('Analysis result validation failed');
    });

    it('should handle malformed AI response', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            // Missing required fields
            score: 'invalid',
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(service.analyzeComplexity(mockTask))
        .rejects
        .toThrow('Analysis result validation failed');
    });
  });

  describe('prompt building', () => {
    it('should replace template variables correctly', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            score: 5,
            factors: [],
            estimatedHours: 8,
            confidence: 0.7,
            reasoning: 'Test reasoning',
            recommendations: [],
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      await service.analyzeComplexity(mockTask, {
        projectId: 'test-project',
        relatedTasks: [],
      });

      // Verify that fetch was called with correct prompt
      expect(global.fetch).toHaveBeenCalledWith('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining(mockTask.name),
      });
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on result completeness', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          result: {
            score: 7,
            factors: [
              { name: 'Factor 1', score: 5, description: 'Test', weight: 0.5 },
              { name: 'Factor 2', score: 8, description: 'Test', weight: 0.5 },
              { name: 'Factor 3', score: 6, description: 'Test', weight: 0.5 },
            ],
            estimatedHours: 16,
            confidence: 0.8,
            reasoning: 'This is a detailed reasoning with more than 50 characters to test confidence calculation',
            recommendations: ['Recommendation 1', 'Recommendation 2'],
          },
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await service.analyzeComplexity(mockTask);

      // Should have high confidence due to complete result
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});