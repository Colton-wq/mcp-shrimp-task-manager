import { z } from "zod";
import { ProjectSession } from "../../utils/projectSession.js";
import { clearPathCache, getDataDir } from "../../utils/paths.js";

export const switchProjectSchema = z.object({
  project: z.string().min(1).describe("要切換的項目名稱"),
  autoCreate: z.boolean().optional().default(false).describe("如果項目不存在是否自動創建"),
  checkConflicts: z.boolean().optional().default(true).describe("是否檢查命名衝突並提供建議")
});

export async function switchProject({
  project,
  autoCreate = false,
  checkConflicts = true
}: z.infer<typeof switchProjectSchema>) {
  const fs = await import("fs/promises");
  const path = await import("path");

  // 清理項目名稱
  const cleanProject = ProjectSession.sanitizeProjectName(project);

  let warnings: string[] = [];
  let suggestions: string[] = [];

  // 檢查衝突
  if (checkConflicts) {
    try {
      const dataDir = await getDataDir(true);
      const parentDir = path.dirname(dataDir);
      const entries = await fs.readdir(parentDir, { withFileTypes: true });
      const existingProjects = entries
        .filter(e => e.isDirectory())
        .map(e => e.name);

      // 檢查精確匹配
      if (existingProjects.includes(cleanProject)) {
        // 項目已存在，直接切換
      } else {
        // 檢查相似名稱
        const similarProjects = existingProjects.filter(existing => {
          const distance = levenshteinDistance(cleanProject, existing);
          return distance > 0 && distance < 3;
        });

        if (similarProjects.length > 0) {
          warnings.push(`發現相似項目名稱: ${similarProjects.join(', ')}`);
          suggestions.push('考慮使用更具體的名稱或添加時間戳');
        }

        if (!autoCreate) {
          suggestions.push(`項目 "${cleanProject}" 不存在，使用 autoCreate: true 自動創建`);
        }
      }
    } catch (error) {
      warnings.push('無法檢查項目衝突');
    }
  }

  // 設置項目
  ProjectSession.setCurrentProject(cleanProject);
  clearPathCache();

  // 如果需要自動創建
  if (autoCreate) {
    try {
      const dataDir = await getDataDir(true);
      await fs.mkdir(dataDir, { recursive: true });

      // 創建基本的任務文件
      const tasksFile = path.join(dataDir, 'tasks.json');
      try {
        await fs.access(tasksFile);
      } catch {
        await fs.writeFile(tasksFile, JSON.stringify({ tasks: [] }, null, 2));
      }
    } catch (error) {
      warnings.push('自動創建項目時發生錯誤');
    }
  }

  // 構建回應
  let responseText = `已切換至項目：${cleanProject}`;

  if (warnings.length > 0) {
    responseText += `\n\n⚠️ 警告：\n${warnings.map(w => `- ${w}`).join('\n')}`;
  }

  if (suggestions.length > 0) {
    responseText += `\n\n💡 建議：\n${suggestions.map(s => `- ${s}`).join('\n')}`;
  }

  return {
    content: [
      { type: "text" as const, text: responseText }
    ]
  };
}

// 計算編輯距離的輔助函數
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

