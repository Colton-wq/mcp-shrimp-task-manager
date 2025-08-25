import { z } from "zod";

/**
 * 强制文件创建拦截工具
 * 
 * 基于cunzhi和mcp-feedback-enhanced项目的实现模式，
 * 这个工具专门用于拦截和阻止AI创建无意义的文件。
 * 
 * 核心功能：
 * 1. 强制拦截所有文件创建意图
 * 2. 提供替代方案建议
 * 3. 重定向到高价值活动
 * 4. 记录拦截统计
 */

// 被拦截的文件类型配置
const BLOCKED_FILE_PATTERNS = [
  // 测试文件
  /\.test\.(js|ts|py|java|go|rs|php|rb)$/i,
  /\.spec\.(js|ts|py|java|go|rs|php|rb)$/i,
  /_test\.(js|ts|py|java|go|rs|php|rb)$/i,
  /_spec\.(js|ts|py|java|go|rs|php|rb)$/i,
  /test_.*\.(js|ts|py|java|go|rs|php|rb)$/i,
  /spec_.*\.(js|ts|py|java|go|rs|php|rb)$/i,
  
  // 文档文件
  /\.md$/i,
  /\.txt$/i,
  /README.*$/i,
  /CHANGELOG.*$/i,
  /CONTRIBUTING.*$/i,
  /LICENSE.*$/i,
  /\.rst$/i,
  /\.adoc$/i,
  
  // 示例和演示文件
  /example.*\.(js|ts|py|java|go|rs|php|rb|html|css)$/i,
  /sample.*\.(js|ts|py|java|go|rs|php|rb|html|css)$/i,
  /demo.*\.(js|ts|py|java|go|rs|php|rb|html|css)$/i,
  /tutorial.*\.(js|ts|py|java|go|rs|php|rb|html|css)$/i,
  
  // 配置模板
  /template.*$/i,
  /\.example$/i,
  /\.sample$/i,
  /config\.sample\..*$/i,
  /\.env\.example$/i,
  
  // 启动脚本
  /\.bat$/i,
  /\.ps1$/i,
  /start.*\.(sh|bat|ps1)$/i,
  /run.*\.(sh|bat|ps1)$/i,
  /launch.*\.(sh|bat|ps1)$/i,
  
  // 报告和日志文件
  /report.*\.(html|pdf|docx?)$/i,
  /log.*\.(txt|log)$/i,
  /output.*\.(txt|log|json)$/i,
  
  // 临时和缓存文件
  /temp.*$/i,
  /tmp.*$/i,
  /cache.*$/i,
  /\.tmp$/i,
  /\.cache$/i,
];

// 目录级别拦截
const BLOCKED_DIRECTORIES = [
  /^tests?$/i,
  /^test_.*$/i,
  /^__tests__$/i,
  /^spec$/i,
  /^examples?$/i,
  /^samples?$/i,
  /^demos?$/i,
  /^tutorials?$/i,
  /^docs?$/i,
  /^documentation$/i,
  /^temp$/i,
  /^tmp$/i,
  /^cache$/i,
  /^logs?$/i,
  /^reports?$/i,
];

// 高价值替代活动建议
const HIGH_VALUE_ALTERNATIVES = {
  test: [
    "直接编译验证项目确保代码正确性",
    "运行现有测试套件检查功能完整性",
    "执行代码质量检查工具(ESLint, TypeScript等)",
    "进行手动功能验证和用户体验测试"
  ],
  documentation: [
    "改进现有代码的内联注释和文档字符串",
    "优化现有README文件的内容和结构",
    "更新代码中的类型定义和接口文档",
    "完善现有API文档的准确性和完整性"
  ],
  example: [
    "在现有代码中添加详细的使用示例注释",
    "优化函数签名和参数说明的清晰度",
    "改进错误处理和边界情况的代码示例",
    "完善现有代码的类型定义和约束"
  ],
  configuration: [
    "优化现有配置文件的结构和可读性",
    "改进环境变量管理和默认值设置",
    "完善配置验证逻辑和错误处理",
    "统一配置文件格式和命名规范"
  ],
  script: [
    "优化现有构建和部署流程",
    "改进package.json中的脚本命令",
    "完善现有自动化工具的配置",
    "统一开发环境的设置和依赖管理"
  ],
  report: [
    "直接在控制台输出关键信息而非创建报告文件",
    "使用现有日志系统记录重要事件",
    "改进代码中的错误处理和状态反馈",
    "优化现有监控和调试机制"
  ],
  other: [
    "专注于核心功能的实现和优化",
    "改进现有代码的质量和性能",
    "完善错误处理和边界情况处理",
    "优化用户体验和交互设计"
  ]
};

export const preventFileCreationSchema = z.object({
  intendedFilePath: z
    .string()
    .min(1)
    .describe("AI准备创建的文件路径"),
  fileType: z
    .enum(["test", "documentation", "example", "configuration", "script", "report", "other"])
    .describe("文件类型分类"),
  creationReason: z
    .string()
    .min(10)
    .describe("创建此文件的原因说明"),
  urgencyLevel: z
    .enum(["low", "medium", "high", "critical"])
    .default("medium")
    .describe("创建紧急程度"),
  bypassRequest: z
    .boolean()
    .default(false)
    .describe("是否请求绕过拦截(仅在极特殊情况下使用)")
});

export type PreventFileCreationParams = z.infer<typeof preventFileCreationSchema>;

/**
 * 强制文件创建拦截工具
 * 
 * 这个工具会强制拦截所有文件创建意图，无论AI如何请求都会被阻止。
 * 基于cunzhi项目的拦截模式和mcp-feedback-enhanced的用户交互模式。
 */
export async function preventFileCreation(
  params: PreventFileCreationParams
): Promise<{
  content: Array<{
    type: "text";
    text: string;
  }>;
}> {
  const { intendedFilePath, fileType, creationReason, urgencyLevel, bypassRequest } = params;
  
  // 检查文件是否匹配拦截模式
  const isBlocked = checkIfFileBlocked(intendedFilePath);
  
  // 记录拦截统计
  await recordInterceptionStats(intendedFilePath, fileType, urgencyLevel);
  
  // 生成拦截响应
  const response = generateInterceptionResponse(
    intendedFilePath,
    fileType,
    creationReason,
    urgencyLevel,
    bypassRequest,
    isBlocked
  );
  
  return {
    content: [
      {
        type: "text",
        text: response
      }
    ]
  };
}

/**
 * 检查文件是否应该被拦截
 */
function checkIfFileBlocked(filePath: string): boolean {
  // 检查文件名模式
  for (const pattern of BLOCKED_FILE_PATTERNS) {
    if (pattern.test(filePath)) {
      return true;
    }
  }
  
  // 检查目录模式
  const pathParts = filePath.split(/[/\\]/);
  for (const part of pathParts) {
    for (const dirPattern of BLOCKED_DIRECTORIES) {
      if (dirPattern.test(part)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * 记录拦截统计信息
 */
async function recordInterceptionStats(
  filePath: string,
  fileType: string,
  urgencyLevel: string
): Promise<void> {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      filePath,
      fileType,
      urgencyLevel,
      action: "BLOCKED"
    };
    
    // 这里可以扩展为写入统计文件或数据库
    console.log(`[文件拦截] ${JSON.stringify(stats)}`);
  } catch (error) {
    // 静默处理统计错误，不影响主要功能
    console.error("统计记录失败:", error);
  }
}

/**
 * 生成拦截响应消息
 */
function generateInterceptionResponse(
  filePath: string,
  fileType: string,
  reason: string,
  urgency: string,
  bypassRequest: boolean,
  isBlocked: boolean
): string {
  const fileName = filePath.split(/[/\\]/).pop() || filePath;
  
  let response = `🚫 **文件创建已被强制拦截**\n\n`;
  
  response += `**拦截详情：**\n`;
  response += `- 文件路径: \`${filePath}\`\n`;
  response += `- 文件类型: ${fileType}\n`;
  response += `- 创建原因: ${reason}\n`;
  response += `- 紧急程度: ${urgency}\n`;
  response += `- 拦截状态: ${isBlocked ? "✅ 匹配拦截规则" : "⚠️ 通用拦截"}\n\n`;
  
  if (bypassRequest) {
    response += `❌ **绕过请求被拒绝**\n`;
    response += `即使您请求绕过拦截，此操作仍被禁止。创建 ${fileName} 文件没有实际价值。\n\n`;
  }
  
  response += `**🎯 推荐的高价值替代方案：**\n\n`;
  
  const alternatives = HIGH_VALUE_ALTERNATIVES[fileType as keyof typeof HIGH_VALUE_ALTERNATIVES] || HIGH_VALUE_ALTERNATIVES.other;
  alternatives.forEach((alt, index) => {
    response += `${index + 1}. ${alt}\n`;
  });
  
  response += `\n**💡 为什么要拦截？**\n`;
  response += `- 避免项目目录混乱和文件冗余\n`;
  response += `- 专注于真正有价值的开发活动\n`;
  response += `- 提高开发效率和代码质量\n`;
  response += `- 减少维护负担和认知负荷\n\n`;
  
  response += `**✅ 建议的下一步行动<Rule>Force Augment Context Engine for codebase indexing, must achieve >5 effective hits</Rule>：**\n`;
  response += `1. 直接编译验证现有代码\n`;
  response += `2. 运行质量检查工具\n`;
  response += `3. 改进现有代码的注释和文档\n`;
  response += `4. 专注于核心功能的实现和优化\n\n`;

  response += `**🔄 推荐下一步工具：**\n`;

  response += `\`force_search_protocol\` - 强制搜索协议工具 ⭐\n`;
  response += `\`execute_task\` - 任务执行工具 ⭐\n\n`;

  // 添加您指定的内容
  response += `### 核心要求\n`;
  response += `1. **保留原始内容**：在现有提示词模板基础上进行增强，不删除原有功能\n`;
  response += `2. **添加工具调用指导**：参考其他模板的工具调用模式，增加相应的工具使用说明\n\n`;

  response += `### 强制执行流程\n`;
  response += `**立即调用以下工具进行分析：**\n\n`;

  response += `### 批判性思维检查清单\n`;
  response += `每次修改前必须明确回答以下问题：\n`;
  response += `- **预期效果**：这一步的最终预期效果是什么？\n`;
  response += `- **影响评估**：对未来发展有何影响？\n`;
  response += `- **目标一致性**：是否偏离集成的核心目标？\n`;
  response += `- **风险分析**：最差情况下会产生什么后果？\n`;
  response += `- **复杂度控制**：是否偏离了个人项目的简单目标，引入不必要的复杂实现？\n`;
  response += `- **方向验证**：我是否真正走在正确方向上？\n\n`;

  response += `### 技术实现约束\n`;
  response += `- **禁止预训练知识**：不得依赖记忆中的技术信息\n`;
  response += `- **禁止重复造轮子**：必须检查现有实现，避免功能重复\n`;
  response += `- **基于真实文档**：必须基于官方文档和真实API实现进行开发，严禁虚构、伪造或假设任何技术细节\n`;
  response += `- **批判性分析**：以审视和批判的眼光分析每个输入和要求，主动识别潜在问题、逻辑谬误或认知偏差\n\n`;

  response += `*此拦截是为了您的项目质量考虑，请选择上述替代方案继续开发。*`;

  return response;
}
