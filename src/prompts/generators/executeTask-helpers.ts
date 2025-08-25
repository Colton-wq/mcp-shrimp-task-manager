/**
 * 辅助函数：生成基于技术栈的具体实施建议
 * Helper functions for enhanced execution guidance generation
 */

import { Task } from "../../types/index.js";
import { TaskContext } from "../../types/executeTask.js";
import { TaskType } from "./executeTask.js";
import { SemanticAnalysis } from "../../types/semanticAnalysis.js";

/**
 * 生成基于技术栈的具体实施建议
 * Generate tech stack specific implementation guidance
 */
export async function generateTechStackGuidance(techStack: string[], taskType: TaskType, task: Task): Promise<string> {
  // 🔥 优化：只为检测到的技术栈提供简洁指导，移除冗长代码示例
  // Optimized: Only provide concise guidance for detected tech stack, remove verbose code examples
  if (techStack.length === 0) {
    return '';
  }

  let content = `### Technology Stack Guidance\n\n`;

  // 简化的技术栈指导
  if (techStack.includes('react')) {
    content += `**React**: Use functional components, proper hooks, TypeScript interfaces\n`;
  }

  if (techStack.includes('typescript')) {
    content += `**TypeScript**: Use strict interfaces, union types, proper error handling\n`;
  }

  if (techStack.includes('javascript') || techStack.includes('nodejs')) {
    content += `**Node.js**: Use async/await, proper error handling, environment variables\n`;
  }

  if (techStack.includes('python')) {
    content += `**Python**: Use type hints, follow PEP 8, proper exception handling\n`;
  }

  return content;
}

/**
 * 生成基于上下文的执行指导
 * Generate context-aware execution guidance
 */
export async function generateContextAwareGuidance(taskContext: TaskContext, taskType: TaskType, task: Task): Promise<string> {
  // 🔥 优化：简化上下文指导，只提供关键信息
  // Optimized: Simplified context guidance, only provide key information
  const { complexity } = taskContext;
  
  let content = `### Context-Aware Execution Guidance\n\n`;

  // 简化的复杂度指导
  content += `**Complexity-Based Approach** (${complexity}):\n`;
  if (complexity === 'HIGH') {
    content += `- Break down into smaller units, comprehensive testing\n`;
  } else if (complexity === 'MEDIUM') {
    content += `- Focus on clean code structure, basic error handling\n`;
  } else {
    content += `- Keep implementation simple and straightforward\n`;
  }
  content += `\n`;

  // 简化的关键成功因素
  content += `**Critical Success Factors**:\n`;
  content += `- Use \`codebase-retrieval\` to understand existing patterns before implementing\n`;
  content += `- Apply \`search_code_desktop-commander\` to find similar implementations\n`;
  content += `- Leverage \`Everything MCP\` for quick file discovery\n`;
  content += `- Follow the identified edge cases and implement proper error handling\n`;
  content += `- Complete all mandatory quality gates before calling \`verify_task\`\n\n`;

  return content;
}

/**
 * 生成基于项目类型的最佳实践建议
 * Generate project type specific best practices guidance
 */
export async function generateBestPracticesGuidance(projectType: string, techStack: string[], complexity: string): Promise<string> {
  // 🔥 优化：大幅简化最佳实践指导
  // Optimized: Greatly simplified best practices guidance
  let content = `### Best Practices & Recommendations\n\n`;

  // 简化的技术栈最佳实践
  content += `**Technology Best Practices**:\n`;
  content += `- **Version Control**: Make atomic commits with clear messages\n`;
  content += `- **Testing**: Write tests before implementation (TDD approach)\n`;
  content += `- **Documentation**: Update README and inline comments\n`;
  content += `- **Security**: Follow OWASP guidelines for secure coding\n\n`;

  // 简化的实施策略
  content += `**Implementation Strategy** (${complexity} complexity):\n`;
  if (complexity === 'HIGH') {
    content += `1. **Phase 1**: Core architecture and interfaces\n`;
    content += `2. **Phase 2**: Main functionality implementation\n`;
    content += `3. **Phase 3**: Integration and optimization\n`;
    content += `4. **Phase 4**: Testing and documentation\n`;
  } else if (complexity === 'MEDIUM') {
    content += `1. **Phase 1**: Design and setup\n`;
    content += `2. **Phase 2**: Implementation and testing\n`;
    content += `3. **Phase 3**: Integration and validation\n`;
  } else {
    content += `1. **Phase 1**: Direct implementation\n`;
    content += `2. **Phase 2**: Testing and validation\n`;
  }
  content += `\n`;

  return content;
}

/**
 * 生成语义分析结果部分
 * Generate semantic analysis section
 */
export async function generateSemanticAnalysisSection(semanticAnalysis: SemanticAnalysis): Promise<string> {
  const { 
    operationType, 
    technicalRequirements, 
    complexityIndicators, 
    keyElements, 
    keywords,
    entities,
    sentiment,
    urgency
  } = semanticAnalysis;

  // 🔥 优化：只显示有价值的分析结果
  // Optimized: Only show valuable analysis results
  let content = `### Semantic Analysis Results\n\n`;

  // 简化操作分析，只显示关键信息
  content += `**Operation Analysis**:\n`;
  content += `- **Primary Operation**: ${operationType}\n`;
  
  // 只在有意义时显示情感和紧急度
  if (sentiment !== 'NEUTRAL') {
    content += `- **Sentiment**: ${sentiment}\n`;
  }
  if (urgency !== 'LOW') {
    content += `- **Urgency Level**: ${urgency}\n`;
  }
  
  // 只显示识别到的实体
  if (entities.length > 0) {
    content += `- **Key Entities**: ${entities.slice(0, 3).join(', ')}\n`;
  }
  content += `\n`;

  // 🔥 优化：简化技术要求分析，只显示检测到的内容
  // Optimized: Simplified technical requirements, only show detected content
  const hasAnyTechRequirements = technicalRequirements.techStack.length > 0 || 
    (technicalRequirements.performance?.length || 0) > 0 || 
    (technicalRequirements.security?.length || 0) > 0 ||
    (technicalRequirements.compatibility?.length || 0) > 0 ||
    (technicalRequirements.scalability?.length || 0) > 0;

  if (hasAnyTechRequirements) {
    content += `**Technical Requirements**:\n`;
    
    // 只显示有内容的技术要求
    if (technicalRequirements.techStack.length > 0) {
      content += `- **Tech Stack**: ${technicalRequirements.techStack.slice(0, 5).join(', ')}\n`;
    }
    
    if (technicalRequirements.performance?.length) {
      content += `- **Performance**: ${technicalRequirements.performance.slice(0, 2).join(', ')}\n`;
    }
    
    if (technicalRequirements.security?.length) {
      content += `- **Security**: ${technicalRequirements.security.slice(0, 2).join(', ')}\n`;
    }
    
    if (technicalRequirements.compatibility?.length) {
      content += `- **Compatibility**: ${technicalRequirements.compatibility.slice(0, 2).join(', ')}\n`;
    }
    
    if (technicalRequirements.scalability?.length) {
      content += `- **Scalability**: ${technicalRequirements.scalability.slice(0, 2).join(', ')}\n`;
    }
    
    content += `\n`;
  }

  // 🔥 优化：简化复杂度分析，只显示关键指标
  // Optimized: Simplified complexity analysis, only show key metrics
  const highComplexityAreas = [];
  if (complexityIndicators.technicalComplexity === 'HIGH') highComplexityAreas.push('Technical');
  if (complexityIndicators.businessComplexity === 'HIGH') highComplexityAreas.push('Business');
  if (complexityIndicators.integrationComplexity === 'HIGH') highComplexityAreas.push('Integration');
  
  content += `**Complexity Analysis**:\n`;
  if (highComplexityAreas.length > 0) {
    content += `- **High Complexity Areas**: ${highComplexityAreas.join(', ')}\n`;
  }
  content += `- **Overall Score**: ${complexityIndicators.complexityScore}/100\n\n`;

  // 🔥 优化：简化关键要素，只显示最重要的信息
  // Optimized: Simplified key elements, only show most important info
  const hasKeyElements = keyElements.coreFunctions.length > 0 || 
    keyElements.constraints.length > 0;

  if (hasKeyElements) {
    content += `**Key Terms**: ${keywords.slice(0, 5).join(', ')}\n\n`;
  }

  // 🔥 优化：移除预期结果部分，简化输出
  // Optimized: Remove expected outcomes section, simplify output

  // 关键词云
  if (keywords.length > 0) {
    content += `**Key Terms**: ${keywords.slice(0, 10).join(', ')}\n\n`;
  }

  return content;
}