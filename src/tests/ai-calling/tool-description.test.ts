/**
 * Tool Description Quality Test Suite
 * Validates improvements in tool descriptions for AI understanding
 */

import { describe, it, expect } from 'vitest';
import { loadPromptFromTemplate } from '../../prompts/loader.js';

describe('Tool Description Quality', () => {
  describe('Structure and Completeness', () => {
    const toolNames = [
      'planTask',
      'analyzeTask', 
      'executeTask',
      'reflectTask',
      'splitTasks',
      'verifyTask'
    ];

    toolNames.forEach(toolName => {
      it(`should have comprehensive description for ${toolName}`, async () => {
        const description = await loadPromptFromTemplate(`toolsDescription/${toolName}.md`);
        
        // Should have all required sections
        expect(description).toMatch(/## Purpose/);
        expect(description).toMatch(/## When to Use/);
        expect(description).toMatch(/## Parameters/);
        expect(description).toMatch(/## Expected Output/);
        expect(description).toMatch(/## Error Handling/);
        expect(description).toMatch(/## AI Calling Guidelines/);
        
        // Should have specific guidance
        expect(description).toMatch(/✅.*Call this tool when/);
        expect(description).toMatch(/❌.*Don't call when/);
        
        // Should have examples or specific guidance
        expect(description).toMatch(/EXAMPLE|example|示例|指导|guidance/i);
        
        // Should be substantial (not just placeholder text)
        expect(description.length).toBeGreaterThan(500);
      });
    });

    it('should include smart path recommendations', async () => {
      const planTaskDesc = await loadPromptFromTemplate('toolsDescription/planTask.md');
      const executeTaskDesc = await loadPromptFromTemplate('toolsDescription/executeTask.md');
      
      // Should have path recommendations
      expect(planTaskDesc).toMatch(/Smart Calling Path Recommendations/);
      expect(planTaskDesc).toMatch(/🚀.*Fast Path/);
      expect(planTaskDesc).toMatch(/📋.*Standard Path/);
      expect(planTaskDesc).toMatch(/🔬.*Deep Path/);
      
      expect(executeTaskDesc).toMatch(/Smart Calling Path Recommendations/);
      expect(executeTaskDesc).toMatch(/Fast Path.*Recommended for Simple Tasks/);
    });
  });

  describe('AI-Friendly Language', () => {
    it('should use clear, actionable language', async () => {
      const descriptions = await Promise.all([
        loadPromptFromTemplate('toolsDescription/planTask.md'),
        loadPromptFromTemplate('toolsDescription/executeTask.md'),
        loadPromptFromTemplate('toolsDescription/verifyTask.md')
      ]);

      descriptions.forEach(desc => {
        // Should use clear, actionable language
        expect(desc).toMatch(/MUST|SHOULD|REQUIRED|EXAMPLE|required|when|Call this tool|Don't call/i);
        
        // Should avoid vague terms
        expect(desc).not.toMatch(/maybe|perhaps|might|could be/i);
        
        // Should provide specific guidance
        expect(desc).toMatch(/WHEN:|USE WHEN:|CALL WHEN:/i);
        
        // Should have concrete examples
        expect(desc).toMatch(/EXAMPLE:|Example:/);
      });
    });

    it('should provide complexity indicators', async () => {
      const planTaskDesc = await loadPromptFromTemplate('toolsDescription/planTask.md');
      
      expect(planTaskDesc).toMatch(/Complexity Indicators/);
      expect(planTaskDesc).toMatch(/Simple.*< 500 chars/);
      expect(planTaskDesc).toMatch(/Medium.*500-1000 chars/);
      expect(planTaskDesc).toMatch(/Complex.*> 1000 chars/);
    });
  });

  describe('Parameter Guidance Quality', () => {
    it('should provide detailed parameter descriptions', async () => {
      const executeTaskDesc = await loadPromptFromTemplate('toolsDescription/executeTask.md');
      
      // Should explain taskId requirements clearly
      expect(executeTaskDesc).toMatch(/taskId.*UUID|unique identifier/i);
      expect(executeTaskDesc).toMatch(/format|identifier/i);
      expect(executeTaskDesc).toMatch(/list_tasks|query_task/i);
      
      // Should explain optional parameters
      expect(executeTaskDesc).toMatch(/project.*OPTIONAL/);
      expect(executeTaskDesc).toMatch(/defaults to current session/);
    });

    it('should include error recovery guidance', async () => {
      const verifyTaskDesc = await loadPromptFromTemplate('toolsDescription/verifyTask.md');
      
      expect(verifyTaskDesc).toMatch(/Error Handling/);
      expect(verifyTaskDesc).toMatch(/Invalid.*task.*ID|UUID.*format/i);
      expect(verifyTaskDesc).toMatch(/Task.*Not.*Found|query_task/i);
      expect(verifyTaskDesc).toMatch(/Missing.*Criteria|get_task_detail/i);
    });
  });

  describe('Consistency Across Languages', () => {
    it('should maintain consistency between English and Chinese descriptions', async () => {
      const englishPlanTask = await loadPromptFromTemplate('toolsDescription/planTask.md');
      
      // Switch to Chinese templates temporarily
      process.env.TEMPLATES_USE = 'zh';
      const chinesePlanTask = await loadPromptFromTemplate('toolsDescription/planTask.md');
      process.env.TEMPLATES_USE = 'en'; // Reset
      
      // Both should have similar structure
      const englishSections = englishPlanTask.match(/##\s+\w+/g) || [];
      const chineseSections = chinesePlanTask.match(/##\s+[\u4e00-\u9fff\w\s]+/g) || [];
      
      // Should have similar number of sections
      expect(Math.abs(englishSections.length - chineseSections.length)).toBeLessThanOrEqual(1);
      
      // Both should have path recommendations
      expect(englishPlanTask).toMatch(/Smart Calling Path/);
      expect(chinesePlanTask).toMatch(/智能调用路径/);
    });
  });

  describe('Readability Metrics', () => {
    it('should meet readability standards for AI consumption', async () => {
      const descriptions = await Promise.all([
        loadPromptFromTemplate('toolsDescription/planTask.md'),
        loadPromptFromTemplate('toolsDescription/analyzeTask.md'),
        loadPromptFromTemplate('toolsDescription/executeTask.md')
      ]);

      descriptions.forEach((desc, index) => {
        const toolNames = ['planTask', 'analyzeTask', 'executeTask'];
        
        // Should have reasonable length (not too short or too long)
        expect(desc.length).toBeGreaterThan(800);
        expect(desc.length).toBeLessThan(3000);
        
        // Should have good structure (multiple sections)
        const sections = desc.match(/##\s+/g) || [];
        expect(sections.length).toBeGreaterThanOrEqual(6);
        
        // Should have examples or guidance
        const examples = desc.match(/EXAMPLE|example|示例|指导|guidance|when|Call this tool/gi) || [];
        expect(examples.length).toBeGreaterThanOrEqual(2);
        
        console.log(`✅ ${toolNames[index]} description meets readability standards`);
      });
    });
  });
});