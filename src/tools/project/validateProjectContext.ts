import { z } from "zod";
import { getProjectContextValidation } from "../../models/taskModel.js";
import { ProjectSession } from "../../utils/projectSession.js";

export const validateProjectContextSchema = z.object({
  project: z.string().optional().describe("要验证的项目名称，省略则使用当前项目"),
  autoDetect: z.boolean().optional().default(false).describe("是否自动检测项目上下文"),
});

/**
 * Validate project context and provide intelligent suggestions
 * 验证项目上下文并提供智能建议
 */
export async function validateProjectContext({
  project,
  autoDetect,
}: z.infer<typeof validateProjectContextSchema>) {
  try {
    const currentProject = project || ProjectSession.getCurrentProject();
    
    if (autoDetect) {
      // 自动检测模式：分析任务文件内容
      // Auto-detect mode: analyze task file content
      try {
        const { getTasksFilePath } = await import("../../utils/paths.js");
        const tasksFilePath = await getTasksFilePath();
        const { readFile } = await import("fs/promises");
        const fileContent = await readFile(tasksFilePath, "utf-8");
        
        const detection = ProjectSession.autoDetectProject(fileContent);
        
        if (detection.detectedProject && detection.confidence > 0.5) {
          const suggestion = ProjectSession.generateProjectSwitchSuggestion(
            detection.detectedProject,
            currentProject
          );
          
          return {
            content: [
              {
                type: "text" as const,
                text: `## 项目上下文自动检测结果

**检测到的项目**: ${detection.detectedProject}
**当前项目**: ${currentProject}
**检测置信度**: ${(detection.confidence * 100).toFixed(1)}%

**元数据分析**:
- 包含项目元数据: ${detection.metadata.hasProjectMetadata ? '是' : '否'}
- 元数据标记数量: ${detection.metadata.metadataCount}
- 项目一致性: ${detection.metadata.consistentProject ? '一致' : '不一致'}

${detection.detectedProject !== currentProject ? `
⚠️ **项目上下文不匹配**

${suggestion}
` : `
✅ **项目上下文匹配**

当前项目上下文与检测到的项目一致。
`}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: `## 项目上下文自动检测结果

**当前项目**: ${currentProject}
**检测置信度**: ${(detection.confidence * 100).toFixed(1)}%

**分析结果**:
- 包含项目元数据: ${detection.metadata.hasProjectMetadata ? '是' : '否'}
- 元数据标记数量: ${detection.metadata.metadataCount}
- 项目一致性: ${detection.metadata.consistentProject ? '一致' : '不一致'}

${detection.confidence < 0.5 ? `
ℹ️ **无法确定项目上下文**

检测置信度较低，可能原因：
- 任务文件缺少项目元数据标记
- 项目元数据不一致
- 任务文件为空或损坏

建议手动确认项目上下文是否正确。
` : `
✅ **项目上下文可能正确**

未检测到明显的项目上下文问题。
`}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `## 项目上下文检测失败

无法读取任务文件进行自动检测。可能原因：
- 任务文件不存在
- 文件权限问题
- 文件格式错误

**当前项目**: ${currentProject}

建议手动确认项目上下文是否正确。`,
            },
          ],
        };
      }
    } else {
      // 验证模式：检查指定项目的上下文一致性
      // Validation mode: check context consistency for specified project
      const validation = await getProjectContextValidation(currentProject);
      
      if (validation.isValid) {
        return {
          content: [
            {
              type: "text" as const,
              text: `## 项目上下文验证结果

✅ **验证通过**

**项目**: ${currentProject}
${validation.detectedProject ? `**检测到的项目**: ${validation.detectedProject}` : ''}

项目上下文一致，无需切换。`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text" as const,
              text: `## 项目上下文验证结果

${validation.warning}`,
            },
          ],
        };
      }
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `## 项目上下文验证错误

验证过程中发生错误: ${
            error instanceof Error ? error.message : String(error)
          }

请检查项目配置和文件权限。`,
        },
      ],
      isError: true,
    };
  }
}